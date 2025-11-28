import { eq, desc, and, gte, lte, sql, count } from "drizzle-orm";
import { db } from "./db";
import {
  creatorDailyMetrics,
  creatorAudienceInsights,
  creatorRevenueForecasts,
  contentPerformanceMetrics,
  subscriptions,
  tips,
  content,
  users,
  profiles,
  userInteractions,
  type CreatorDailyMetrics,
  type CreatorAudienceInsights,
  type ContentPerformanceMetrics,
} from "@shared/schema";

export class CreatorAnalyticsService {
  // Calculate and store daily metrics for a creator
  async computeDailyMetrics(creatorId: string, date: Date = new Date()) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Get subscription revenue for the day
    const subsToday = await db
      .select({
        count: count(),
        revenue: sql<string>`SUM(CAST(${subscriptions.price} AS DECIMAL))`,
      })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.creatorId, creatorId),
          gte(subscriptions.createdAt, startOfDay),
          lte(subscriptions.createdAt, endOfDay)
        )
      );

    // Get tip revenue for the day
    const tipsToday = await db
      .select({
        count: count(),
        revenue: sql<string>`SUM(CAST(${tips.amount} AS DECIMAL))`,
      })
      .from(tips)
      .where(
        and(
          eq(tips.toUserId, creatorId),
          gte(tips.createdAt, startOfDay),
          lte(tips.createdAt, endOfDay)
        )
      );

    // Get total active subscribers
    const totalSubs = await db
      .select({ count: count() })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.creatorId, creatorId),
          eq(subscriptions.status, 'active')
        )
      );

    // Get new subscribers today
    const newSubs = await db
      .select({ count: count() })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.creatorId, creatorId),
          gte(subscriptions.createdAt, startOfDay),
          lte(subscriptions.createdAt, endOfDay)
        )
      );

    // Get cancelled subscriptions today (note: using createdAt as updatedAt doesn't exist)
    const lostSubs = await db
      .select({ count: count() })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.creatorId, creatorId),
          eq(subscriptions.status, 'cancelled')
        )
      );

    // Get content interactions today
    const creatorContent = await db
      .select({ id: content.id })
      .from(content)
      .where(eq(content.creatorUserId, creatorId));

    const contentIds = creatorContent.map(c => c.id);

    let contentViews = 0;
    let contentLikes = 0;
    let contentShares = 0;

    if (contentIds.length > 0) {
      const interactions = await db
        .select({
          type: userInteractions.interactionType,
          count: count(),
        })
        .from(userInteractions)
        .where(
          and(
            sql`${userInteractions.contentId} IN ${contentIds}`,
            gte(userInteractions.createdAt, startOfDay),
            lte(userInteractions.createdAt, endOfDay)
          )
        )
        .groupBy(userInteractions.interactionType);

      for (const int of interactions) {
        if (int.type === 'view') contentViews = int.count;
        if (int.type === 'like') contentLikes = int.count;
        if (int.type === 'share') contentShares = int.count;
      }
    }

    const subscriptionRevenue = parseFloat(subsToday[0]?.revenue || '0');
    const tipRevenue = parseFloat(tipsToday[0]?.revenue || '0');
    const totalRevenue = subscriptionRevenue + tipRevenue;

    const totalSubscribers = totalSubs[0]?.count || 0;
    const engagementRate = totalSubscribers > 0 
      ? ((contentViews + contentLikes + contentShares) / totalSubscribers) * 100 
      : 0;

    // Upsert daily metrics
    await db
      .insert(creatorDailyMetrics)
      .values({
        creatorId,
        date: startOfDay,
        subscriptionRevenue: subscriptionRevenue.toString(),
        tipRevenue: tipRevenue.toString(),
        ppvRevenue: '0', // TODO: Add PPV tracking
        totalRevenue: totalRevenue.toString(),
        newSubscribers: newSubs[0]?.count || 0,
        lostSubscribers: lostSubs[0]?.count || 0,
        totalSubscribers,
        contentViews,
        contentLikes,
        contentShares,
        messagesReceived: 0, // TODO: Add message tracking
        engagementRate: engagementRate.toFixed(2),
      })
      .onConflictDoNothing();

    return {
      subscriptionRevenue,
      tipRevenue,
      totalRevenue,
      newSubscribers: newSubs[0]?.count || 0,
      totalSubscribers,
      contentViews,
      contentLikes,
      contentShares,
      engagementRate: parseFloat(engagementRate.toFixed(2)),
    };
  }

  // Get daily metrics for a date range
  async getDailyMetrics(creatorId: string, startDate: Date, endDate: Date): Promise<CreatorDailyMetrics[]> {
    return await db
      .select()
      .from(creatorDailyMetrics)
      .where(
        and(
          eq(creatorDailyMetrics.creatorId, creatorId),
          gte(creatorDailyMetrics.date, startDate),
          lte(creatorDailyMetrics.date, endDate)
        )
      )
      .orderBy(desc(creatorDailyMetrics.date));
  }

  // Compute audience insights
  async computeAudienceInsights(creatorId: string) {
    // Get all active subscribers with their profiles
    const subscribers = await db
      .select({
        fanId: subscriptions.fanId,
        price: subscriptions.price,
        createdAt: subscriptions.createdAt,
        profile: profiles,
      })
      .from(subscriptions)
      .leftJoin(profiles, eq(subscriptions.fanId, profiles.userId))
      .where(
        and(
          eq(subscriptions.creatorId, creatorId),
          eq(subscriptions.status, 'active')
        )
      );

    // Get all tips to identify top fans
    const fanTips = await db
      .select({
        fanId: tips.fromUserId,
        totalAmount: sql<string>`SUM(CAST(${tips.amount} AS DECIMAL))`,
      })
      .from(tips)
      .where(eq(tips.toUserId, creatorId))
      .groupBy(tips.fromUserId);

    // Calculate top fans by spending (subscriptions + tips)
    const fanSpending: Record<string, number> = {};

    for (const sub of subscribers) {
      const subPrice = parseFloat(sub.price || '0');
      fanSpending[sub.fanId] = (fanSpending[sub.fanId] || 0) + subPrice;
    }

    for (const tip of fanTips) {
      fanSpending[tip.fanId] = (fanSpending[tip.fanId] || 0) + parseFloat(tip.totalAmount);
    }

    const topFans = Object.entries(fanSpending)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([id, amount]) => ({ id, amount }));

    // Calculate pack type distribution
    const packTypeDist: Record<string, number> = {};
    for (const sub of subscribers) {
      const packType = sub.profile?.packType || 'unknown';
      packTypeDist[packType] = (packTypeDist[packType] || 0) + 1;
    }

    // Calculate average subscription length
    const now = Date.now();
    const subscriptionLengths = subscribers.map(sub => {
      const daysSince = (now - new Date(sub.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      return daysSince;
    });
    const avgSubLength = subscriptionLengths.length > 0
      ? subscriptionLengths.reduce((a, b) => a + b, 0) / subscriptionLengths.length
      : 0;

    // Calculate average tip amount
    const allTips = await db
      .select({ amount: tips.amount })
      .from(tips)
      .where(eq(tips.toUserId, creatorId));

    const avgTipAmount = allTips.length > 0
      ? allTips.reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0) / allTips.length
      : 0;

    // Calculate retention rate (30-day window)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const subsThirtyDaysAgo = await db
      .select({ count: count() })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.creatorId, creatorId),
          lte(subscriptions.createdAt, thirtyDaysAgo)
        )
      );

    const stillActive = await db
      .select({ count: count() })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.creatorId, creatorId),
          lte(subscriptions.createdAt, thirtyDaysAgo),
          eq(subscriptions.status, 'active')
        )
      );

    const retentionRate = (subsThirtyDaysAgo[0]?.count || 0) > 0
      ? ((stillActive[0]?.count || 0) / (subsThirtyDaysAgo[0]?.count || 1)) * 100
      : 0;

    const churnRate = 100 - retentionRate;

    // Upsert audience insights
    await db
      .insert(creatorAudienceInsights)
      .values({
        creatorId,
        topFanIds: topFans,
        packTypeDistribution: packTypeDist,
        geographicDistribution: {}, // TODO: Add geo tracking
        averageSubscriptionLength: avgSubLength.toFixed(2),
        averageTipAmount: avgTipAmount.toFixed(2),
        retentionRate: retentionRate.toFixed(2),
        churnRate: churnRate.toFixed(2),
        lastUpdated: new Date(),
      })
      .onConflictDoUpdate({
        target: creatorAudienceInsights.creatorId,
        set: {
          topFanIds: topFans,
          packTypeDistribution: packTypeDist,
          averageSubscriptionLength: avgSubLength.toFixed(2),
          averageTipAmount: avgTipAmount.toFixed(2),
          retentionRate: retentionRate.toFixed(2),
          churnRate: churnRate.toFixed(2),
          lastUpdated: new Date(),
        },
      });

    return {
      topFans,
      packTypeDistribution: packTypeDist,
      averageSubscriptionLength: avgSubLength,
      averageTipAmount: avgTipAmount,
      retentionRate,
      churnRate,
    };
  }

  // Get audience insights
  async getAudienceInsights(creatorId: string): Promise<CreatorAudienceInsights | undefined> {
    const [insights] = await db
      .select()
      .from(creatorAudienceInsights)
      .where(eq(creatorAudienceInsights.creatorId, creatorId))
      .limit(1);

    return insights;
  }

  // Generate revenue forecast using simple linear regression
  async generateRevenueForecast(creatorId: string, monthsAhead: number = 3) {
    // Get historical revenue data (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const historicalData = await db
      .select()
      .from(creatorDailyMetrics)
      .where(
        and(
          eq(creatorDailyMetrics.creatorId, creatorId),
          gte(creatorDailyMetrics.date, sixMonthsAgo)
        )
      )
      .orderBy(creatorDailyMetrics.date);

    if (historicalData.length < 30) {
      // Not enough data for forecasting
      return [];
    }

    // Group by month and sum revenue
    const monthlyRevenue: Record<string, number> = {};
    for (const day of historicalData) {
      const monthKey = `${day.date.getFullYear()}-${day.date.getMonth() + 1}`;
      monthlyRevenue[monthKey] = (monthlyRevenue[monthKey] || 0) + parseFloat(day.totalRevenue || '0');
    }

    const revenueValues = Object.values(monthlyRevenue);
    
    // Simple linear regression
    const n = revenueValues.length;
    const sumX = (n * (n + 1)) / 2; // Sum of 1, 2, 3, ...
    const sumY = revenueValues.reduce((a, b) => a + b, 0);
    const sumXY = revenueValues.reduce((sum, y, i) => sum + (i + 1) * y, 0);
    const sumX2 = (n * (n + 1) * (2 * n + 1)) / 6;

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate R-squared for confidence
    const mean = sumY / n;
    const ss_tot = revenueValues.reduce((sum, y) => sum + Math.pow(y - mean, 2), 0);
    const ss_res = revenueValues.reduce((sum, y, i) => {
      const predicted = slope * (i + 1) + intercept;
      return sum + Math.pow(y - predicted, 2);
    }, 0);
    const rSquared = 1 - (ss_res / ss_tot);
    const confidenceLevel = Math.max(0, Math.min(100, rSquared * 100));

    // Generate forecasts
    const forecasts = [];
    const now = new Date();
    
    for (let i = 1; i <= monthsAhead; i++) {
      const forecastMonth = new Date(now);
      forecastMonth.setMonth(forecastMonth.getMonth() + i);
      forecastMonth.setDate(1);
      forecastMonth.setHours(0, 0, 0, 0);

      const predicted = slope * (n + i) + intercept;
      const growthRate = n > 0 ? ((predicted - revenueValues[n - 1]) / revenueValues[n - 1]) * 100 : 0;

      await db
        .insert(creatorRevenueForecasts)
        .values({
          creatorId,
          forecastMonth,
          predictedRevenue: Math.max(0, predicted).toFixed(2),
          confidenceLevel: confidenceLevel.toFixed(2),
          growthRate: growthRate.toFixed(2),
          modelVersion: 'linear-v1',
        })
        .onConflictDoNothing();

      forecasts.push({
        month: forecastMonth,
        predictedRevenue: Math.max(0, predicted),
        confidenceLevel,
        growthRate,
      });
    }

    return forecasts;
  }

  // Update content performance metrics
  async updateContentPerformance(contentId: string) {
    const interactions = await db
      .select({
        type: userInteractions.interactionType,
        count: count(),
        avgDuration: sql<string>`AVG(${userInteractions.durationSeconds})`,
      })
      .from(userInteractions)
      .where(eq(userInteractions.contentId, contentId))
      .groupBy(userInteractions.interactionType);

    let totalViews = 0;
    let likeCount = 0;
    let shareCount = 0;
    let saveCount = 0;
    let avgViewDuration = 0;

    for (const int of interactions) {
      if (int.type === 'view') {
        totalViews = int.count;
        avgViewDuration = parseFloat(int.avgDuration || '0');
      }
      if (int.type === 'like') likeCount = int.count;
      if (int.type === 'share') shareCount = int.count;
      if (int.type === 'save') saveCount = int.count;
    }

    // Get unique viewers
    const uniqueViewers = await db
      .select({ count: sql<number>`COUNT(DISTINCT ${userInteractions.userId})` })
      .from(userInteractions)
      .where(
        and(
          eq(userInteractions.contentId, contentId),
          eq(userInteractions.interactionType, 'view')
        )
      );

    // Get tips for this content
    const contentTips = await db
      .select({
        count: count(),
        revenue: sql<string>`SUM(CAST(${tips.amount} AS DECIMAL))`,
      })
      .from(tips)
      .where(eq(tips.mediaId, contentId));

    const tipCount = contentTips[0]?.count || 0;
    const tipRevenue = parseFloat(contentTips[0]?.revenue || '0');

    // Upsert performance metrics
    await db
      .insert(contentPerformanceMetrics)
      .values({
        contentId,
        totalViews,
        uniqueViewers: uniqueViewers[0]?.count || 0,
        averageViewDuration: avgViewDuration.toString(),
        completionRate: '0', // TODO: Calculate based on video length
        likeCount,
        shareCount,
        saveCount,
        commentCount: 0, // TODO: Add comments tracking
        tipCount,
        totalTipRevenue: tipRevenue.toString(),
        conversionRate: '0', // TODO: Calculate free to paid conversion
        lastUpdated: new Date(),
      })
      .onConflictDoUpdate({
        target: contentPerformanceMetrics.contentId,
        set: {
          totalViews,
          uniqueViewers: uniqueViewers[0]?.count || 0,
          averageViewDuration: avgViewDuration.toString(),
          likeCount,
          shareCount,
          saveCount,
          tipCount,
          totalTipRevenue: tipRevenue.toString(),
          lastUpdated: new Date(),
        },
      });
  }

  // Get content performance for all creator's content
  async getContentPerformance(creatorId: string): Promise<ContentPerformanceMetrics[]> {
    const creatorContent = await db
      .select({ id: content.id })
      .from(content)
      .where(eq(content.creatorUserId, creatorId));

    const contentIds = creatorContent.map(c => c.id);

    if (contentIds.length === 0) {
      return [];
    }

    return await db
      .select()
      .from(contentPerformanceMetrics)
      .where(sql`${contentPerformanceMetrics.contentId} IN ${contentIds}`)
      .orderBy(desc(contentPerformanceMetrics.totalViews));
  }

  // Get analytics summary for a creator
  async getAnalyticsSummary(creatorId: string) {
    // Get last 30 days metrics
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentMetrics = await this.getDailyMetrics(creatorId, thirtyDaysAgo, new Date());
    
    const totalRevenue = recentMetrics.reduce((sum, m) => sum + parseFloat(m.totalRevenue || '0'), 0);
    const totalViews = recentMetrics.reduce((sum, m) => sum + (m.contentViews || 0), 0);
    const totalNewSubs = recentMetrics.reduce((sum, m) => sum + (m.newSubscribers || 0), 0);

    const audienceInsights = await this.getAudienceInsights(creatorId);
    const contentPerformance = await this.getContentPerformance(creatorId);

    // Get recent forecast
    const [forecast] = await db
      .select()
      .from(creatorRevenueForecasts)
      .where(eq(creatorRevenueForecasts.creatorId, creatorId))
      .orderBy(desc(creatorRevenueForecasts.computedAt))
      .limit(1);

    return {
      last30Days: {
        totalRevenue,
        totalViews,
        totalNewSubscribers: totalNewSubs,
        dailyMetrics: recentMetrics,
      },
      audience: audienceInsights,
      topContent: contentPerformance.slice(0, 10),
      nextMonthForecast: forecast ? {
        predictedRevenue: parseFloat(forecast.predictedRevenue),
        confidenceLevel: parseFloat(forecast.confidenceLevel || '0'),
        growthRate: parseFloat(forecast.growthRate || '0'),
      } : null,
    };
  }
}

export const creatorAnalytics = new CreatorAnalyticsService();
