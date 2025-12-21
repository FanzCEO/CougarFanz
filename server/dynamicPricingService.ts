import { db } from "./db";
import { 
  pricingStrategies, 
  priceHistory,
  demandMetrics,
  priceOptimization,
  mediaAssets,
  type InsertPricingStrategy,
  type InsertPriceHistory,
  type InsertDemandMetric,
  type InsertPriceOptimization,
  type PricingStrategy,
  type PriceHistory,
  type DemandMetric,
  type PriceOptimization,
} from "@shared/schema";
import { eq, and, sql, desc } from "drizzle-orm";

export class DynamicPricingService {
  async createStrategy(data: InsertPricingStrategy): Promise<PricingStrategy> {
    const [strategy] = await db
      .insert(pricingStrategies)
      .values(data)
      .returning();
    return strategy;
  }

  async getStrategy(id: string): Promise<PricingStrategy | undefined> {
    const [strategy] = await db
      .select()
      .from(pricingStrategies)
      .where(eq(pricingStrategies.id, id));
    return strategy;
  }

  async getCreatorStrategies(creatorId: string): Promise<PricingStrategy[]> {
    return db
      .select()
      .from(pricingStrategies)
      .where(and(
        eq(pricingStrategies.creatorId, creatorId),
        eq(pricingStrategies.isActive, true)
      ))
      .orderBy(desc(pricingStrategies.createdAt));
  }

  async updateStrategy(id: string, updates: Partial<PricingStrategy>): Promise<void> {
    await db
      .update(pricingStrategies)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(pricingStrategies.id, id));
  }

  async deleteStrategy(id: string): Promise<void> {
    await db
      .update(pricingStrategies)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(pricingStrategies.id, id));
  }

  async updateDemandMetrics(contentId: string, metrics: Partial<InsertDemandMetric>): Promise<DemandMetric> {
    const [existing] = await db
      .select()
      .from(demandMetrics)
      .where(eq(demandMetrics.contentId, contentId));

    if (existing) {
      const demandScore = this.calculateDemandScore({
        viewCount: metrics.viewCount ?? existing.viewCount ?? undefined,
        likeCount: metrics.likeCount ?? existing.likeCount ?? undefined,
        commentCount: metrics.commentCount ?? existing.commentCount ?? undefined,
        shareCount: metrics.shareCount ?? existing.shareCount ?? undefined,
        purchaseCount: metrics.purchaseCount ?? existing.purchaseCount ?? undefined,
      });

      const trendingScore = this.calculateTrendingScore(existing, metrics);

      const [updated] = await db
        .update(demandMetrics)
        .set({
          ...metrics,
          demandScore: demandScore.toString(),
          trendingScore: trendingScore.toString(),
          lastUpdated: new Date(),
        })
        .where(eq(demandMetrics.id, existing.id))
        .returning();
      
      return updated;
    } else {
      const demandScore = this.calculateDemandScore(metrics as any);
      
      const [created] = await db
        .insert(demandMetrics)
        .values({
          ...metrics,
          demandScore: demandScore.toString(),
          trendingScore: '0',
        } as InsertDemandMetric)
        .returning();
      
      return created;
    }
  }

  private calculateDemandScore(metrics: {
    viewCount?: number;
    likeCount?: number;
    commentCount?: number;
    shareCount?: number;
    purchaseCount?: number;
  }): number {
    const views = metrics.viewCount || 0;
    const likes = metrics.likeCount || 0;
    const comments = metrics.commentCount || 0;
    const shares = metrics.shareCount || 0;
    const purchases = metrics.purchaseCount || 0;

    const engagementRate = views > 0 ? (likes + comments * 2 + shares * 3) / views : 0;
    const conversionRate = views > 0 ? purchases / views : 0;
    
    const score = Math.min(100, (
      (views / 100) * 20 +
      (engagementRate * 100) * 30 +
      (conversionRate * 100) * 50
    ));

    return Math.round(score * 100) / 100;
  }

  private calculateTrendingScore(
    existing: DemandMetric, 
    updates: Partial<InsertDemandMetric>
  ): number {
    const now = new Date().getTime();
    const lastUpdate = existing.lastUpdated ? new Date(existing.lastUpdated).getTime() : now;
    const hoursSinceUpdate = (now - lastUpdate) / (1000 * 60 * 60);

    if (hoursSinceUpdate === 0) return 0;

    const existingViews = existing.viewCount ?? 0;
    const existingLikes = existing.likeCount ?? 0;
    const viewVelocity = ((updates.viewCount ?? existingViews) - existingViews) / hoursSinceUpdate;
    const likeVelocity = ((updates.likeCount ?? existingLikes) - existingLikes) / hoursSinceUpdate;
    
    const trendingScore = Math.min(100, (viewVelocity * 2 + likeVelocity * 5));
    
    return Math.max(0, Math.round(trendingScore * 100) / 100);
  }

  async calculateOptimalPrice(strategyId: string, contentId: string): Promise<number> {
    const strategy = await this.getStrategy(strategyId);
    if (!strategy) throw new Error("Strategy not found");

    const [metrics] = await db
      .select()
      .from(demandMetrics)
      .where(eq(demandMetrics.contentId, contentId));

    const [content] = await db
      .select()
      .from(mediaAssets)
      .where(eq(mediaAssets.id, contentId));

    if (!content) throw new Error("Content not found");

    let price = parseFloat(strategy.basePrice.toString());
    
    switch (strategy.strategyType) {
      case 'surge':
        price = this.applySurgePricing(strategy, metrics);
        break;
      case 'demand_curve':
        price = this.applyDemandCurve(strategy, metrics);
        break;
      case 'time_decay':
        price = this.applyTimeDecay(strategy, content.createdAt);
        break;
      case 'engagement_based':
        price = this.applyEngagementPricing(strategy, metrics);
        break;
      case 'auction':
        price = this.applyAuctionPricing(strategy, metrics);
        break;
      case 'personalized':
        price = this.applyPersonalizedPricing(strategy, metrics);
        break;
      default:
        price = parseFloat(strategy.basePrice.toString());
    }

    const minPrice = parseFloat(strategy.minPrice.toString());
    const maxPrice = parseFloat(strategy.maxPrice.toString());
    
    return Math.max(minPrice, Math.min(maxPrice, price));
  }

  private applySurgePricing(strategy: PricingStrategy, metrics?: DemandMetric): number {
    const basePrice = parseFloat(strategy.basePrice.toString());
    const viewCount = metrics?.viewCount || 0;
    const threshold = strategy.surgeThreshold || 100;

    if (viewCount > threshold) {
      const surgeMultiplier = 1 + ((viewCount - threshold) / threshold) * 0.5;
      return basePrice * Math.min(surgeMultiplier, 3);
    }

    return basePrice;
  }

  private applyDemandCurve(strategy: PricingStrategy, metrics?: DemandMetric): number {
    const basePrice = parseFloat(strategy.basePrice.toString());
    const demandScore = parseFloat(metrics?.demandScore?.toString() || '50');
    
    const demandMultiplier = parseFloat(strategy.demandMultiplier?.toString() || '1');
    const normalizedDemand = demandScore / 50;
    
    return basePrice * (1 + (normalizedDemand - 1) * (demandMultiplier - 1));
  }

  private applyTimeDecay(strategy: PricingStrategy, createdAt: Date | null): number {
    const basePrice = parseFloat(strategy.basePrice.toString());
    const creationDate = createdAt ? new Date(createdAt) : new Date();
    const daysSinceCreation = (Date.now() - creationDate.getTime()) / (1000 * 60 * 60 * 24);
    
    const decayRate = parseFloat(strategy.timeDecayRate?.toString() || '0.05');
    const decayFactor = Math.pow(1 - decayRate, daysSinceCreation);
    
    return basePrice * Math.max(0.3, decayFactor);
  }

  private applyEngagementPricing(strategy: PricingStrategy, metrics?: DemandMetric): number {
    const basePrice = parseFloat(strategy.basePrice.toString());
    
    if (!metrics) return basePrice;

    const weights = strategy.engagementWeights as any || {
      views: 0.3,
      likes: 0.4,
      comments: 0.2,
      shares: 0.1
    };

    const normalizedViews = Math.min(1, (metrics.viewCount || 0) / 1000);
    const normalizedLikes = Math.min(1, (metrics.likeCount || 0) / 100);
    const normalizedComments = Math.min(1, (metrics.commentCount || 0) / 50);
    const normalizedShares = Math.min(1, (metrics.shareCount || 0) / 20);

    const engagementMultiplier = 1 + (
      normalizedViews * weights.views +
      normalizedLikes * weights.likes +
      normalizedComments * weights.comments +
      normalizedShares * weights.shares
    );

    return basePrice * engagementMultiplier;
  }

  private applyAuctionPricing(strategy: PricingStrategy, metrics?: DemandMetric): number {
    const auctionSettings = strategy.auctionSettings as any || {
      startingBid: 10,
      bidIncrement: 1,
      duration: 3600
    };

    const startingBid = parseFloat(auctionSettings.startingBid?.toString() || '10');
    const bidIncrement = parseFloat(auctionSettings.bidIncrement?.toString() || '1');
    
    const demandScore = parseFloat(metrics?.demandScore?.toString() || '50');
    const viewCount = metrics?.viewCount || 0;

    const bidMultiplier = Math.floor(demandScore / 10);
    const viewerBidBoost = Math.floor(viewCount / 100);
    
    const currentBid = startingBid + (bidIncrement * (bidMultiplier + viewerBidBoost));

    return currentBid;
  }

  private applyPersonalizedPricing(strategy: PricingStrategy, metrics?: DemandMetric): number {
    const basePrice = parseFloat(strategy.basePrice.toString());
    const demandScore = parseFloat(metrics?.demandScore?.toString() || '50');
    const trendingScore = parseFloat(metrics?.trendingScore?.toString() || '0');

    const demandFactor = demandScore / 50;
    const trendingFactor = Math.min(1, trendingScore / 50);

    const personalizedMultiplier = 1 + (demandFactor * 0.5 + trendingFactor * 0.3);

    return basePrice * personalizedMultiplier;
  }

  async createOptimization(
    strategyId: string, 
    contentId: string
  ): Promise<PriceOptimization> {
    const optimalPrice = await this.calculateOptimalPrice(strategyId, contentId);
    
    const strategy = await this.getStrategy(strategyId);
    if (!strategy) throw new Error("Strategy not found");

    const [metrics] = await db
      .select()
      .from(demandMetrics)
      .where(eq(demandMetrics.contentId, contentId));

    const currentPrice = parseFloat(strategy.basePrice.toString());
    const priceElasticity = this.calculatePriceElasticity(metrics);
    const expectedRevenue = this.calculateExpectedRevenue(
      optimalPrice, 
      metrics?.uniqueViewers || 0, 
      priceElasticity
    );

    const confidenceScore = this.calculateConfidenceScore(metrics);

    const [optimization] = await db
      .insert(priceOptimization)
      .values({
        strategyId,
        contentId,
        currentPrice: currentPrice.toString(),
        recommendedPrice: optimalPrice.toString(),
        expectedRevenue: expectedRevenue.toString(),
        confidenceScore: confidenceScore.toString(),
        priceElasticity: priceElasticity.toString(),
      } as InsertPriceOptimization)
      .returning();

    return optimization;
  }

  private calculatePriceElasticity(metrics?: DemandMetric): number {
    if (!metrics) return -1.5;

    const viewCount = metrics.viewCount ?? 0;
    const purchaseCount = metrics.purchaseCount ?? 0;
    const purchaseRate = viewCount > 0 
      ? purchaseCount / viewCount 
      : 0;

    if (purchaseRate > 0.1) return -0.8;
    if (purchaseRate > 0.05) return -1.2;
    if (purchaseRate > 0.02) return -1.5;
    return -2.0;
  }

  private calculateExpectedRevenue(
    price: number, 
    expectedPurchases: number, 
    elasticity: number
  ): number {
    const priceChangeFactor = 1 + (price / 100);
    const demandChange = Math.pow(priceChangeFactor, elasticity);
    const adjustedPurchases = expectedPurchases * demandChange;
    
    return price * adjustedPurchases;
  }

  private calculateConfidenceScore(metrics?: DemandMetric): number {
    if (!metrics) return 0.3;

    const dataPoints = [
      metrics.viewCount,
      metrics.likeCount,
      metrics.purchaseCount,
    ].filter(v => v && v > 0).length;

    const sampleSize = metrics.viewCount || 0;

    if (sampleSize > 1000 && dataPoints >= 3) return 0.95;
    if (sampleSize > 500 && dataPoints >= 2) return 0.85;
    if (sampleSize > 100) return 0.70;
    return 0.50;
  }

  async applyOptimization(optimizationId: string): Promise<void> {
    const [optimization] = await db
      .select()
      .from(priceOptimization)
      .where(eq(priceOptimization.id, optimizationId));

    if (!optimization) throw new Error("Optimization not found");

    const strategy = await this.getStrategy(optimization.strategyId);
    if (!strategy) throw new Error("Strategy not found");

    const previousPrice = parseFloat(strategy.basePrice.toString());
    const newPrice = parseFloat(optimization.recommendedPrice.toString());

    await this.recordPriceChange(
      optimization.contentId,
      optimization.strategyId,
      previousPrice,
      newPrice,
      'ai_optimization'
    );

    await db
      .update(mediaAssets)
      .set({ price: newPrice.toString() })
      .where(eq(mediaAssets.id, optimization.contentId));

    await db
      .update(priceOptimization)
      .set({ 
        status: 'applied',
        appliedAt: new Date() 
      })
      .where(eq(priceOptimization.id, optimizationId));
  }

  async recordPriceChange(
    contentId: string,
    strategyId: string,
    previousPrice: number,
    newPrice: number,
    reason: string
  ): Promise<PriceHistory> {
    const [metrics] = await db
      .select()
      .from(demandMetrics)
      .where(eq(demandMetrics.contentId, contentId));

    const [history] = await db
      .insert(priceHistory)
      .values({
        contentId,
        strategyId,
        previousPrice: previousPrice.toString(),
        newPrice: newPrice.toString(),
        priceChangeReason: reason as any,
        demandScore: metrics?.demandScore?.toString(),
        engagementScore: this.calculateEngagementScore(metrics).toString(),
        viewersActive: metrics?.viewCount ?? undefined,
        purchaseRate: (metrics?.viewCount ?? 0) > 0
          ? (((metrics.purchaseCount ?? 0) / (metrics.viewCount ?? 1)) * 100).toString()
          : '0',
      } as InsertPriceHistory)
      .returning();

    return history;
  }

  private calculateEngagementScore(metrics?: DemandMetric): number {
    if (!metrics) return 0;

    const totalEngagement = 
      (metrics.likeCount || 0) +
      (metrics.commentCount || 0) * 2 +
      (metrics.shareCount || 0) * 3;

    const views = metrics.viewCount || 1;
    const engagementRate = (totalEngagement / views) * 100;

    return Math.min(100, engagementRate);
  }

  async getPriceHistory(contentId: string): Promise<PriceHistory[]> {
    return db
      .select()
      .from(priceHistory)
      .where(eq(priceHistory.contentId, contentId))
      .orderBy(desc(priceHistory.timestamp));
  }

  async getOptimizations(strategyId: string): Promise<PriceOptimization[]> {
    return db
      .select()
      .from(priceOptimization)
      .where(eq(priceOptimization.strategyId, strategyId))
      .orderBy(desc(priceOptimization.createdAt));
  }
}

export const dynamicPricingService = new DynamicPricingService();
