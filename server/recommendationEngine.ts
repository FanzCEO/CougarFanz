import { eq, desc, and, sql, inArray, not } from "drizzle-orm";
import { db } from "./db";
import {
  userInteractions,
  contentEngagementScores,
  userPreferenceProfiles,
  creatorSimilarity,
  content,
  users,
  profiles,
  subscriptions,
  type UserInteraction,
  type ContentEngagementScore,
  type UserPreferenceProfile,
} from "@shared/schema";

// =============================================================================
// AI-POWERED RECOMMENDATION ENGINE
// =============================================================================

export class RecommendationEngine {
  // Track user interaction for learning
  async trackInteraction(params: {
    userId: string;
    contentId: string;
    interactionType: 'view' | 'like' | 'share' | 'save' | 'skip' | 'report';
    durationSeconds?: number;
    metadata?: Record<string, any>;
  }) {
    await db.insert(userInteractions).values(params);
    
    // Update engagement scores asynchronously
    this.updateEngagementScores(params.contentId).catch(console.error);
    
    // Update user preferences asynchronously
    this.updateUserPreferences(params.userId).catch(console.error);
  }

  // Update content engagement scores
  private async updateEngagementScores(contentId: string) {
    const interactions = await db
      .select()
      .from(userInteractions)
      .where(eq(userInteractions.contentId, contentId));

    const viewCount = interactions.filter(i => i.interactionType === 'view').length;
    const likeCount = interactions.filter(i => i.interactionType === 'like').length;
    const shareCount = interactions.filter(i => i.interactionType === 'share').length;
    const saveCount = interactions.filter(i => i.interactionType === 'save').length;

    // Calculate average view duration
    const viewDurations = interactions
      .filter(i => i.interactionType === 'view' && i.durationSeconds)
      .map(i => i.durationSeconds || 0);
    const avgViewDuration = viewDurations.length > 0 
      ? viewDurations.reduce((a, b) => a + b, 0) / viewDurations.length 
      : 0;

    // Calculate engagement score (weighted formula)
    const engagementScore = (
      viewCount * 1 +
      likeCount * 3 +
      shareCount * 5 +
      saveCount * 4
    ) / Math.max(viewCount, 1);

    // Calculate trending score (time-weighted)
    const recentInteractions = interactions.filter(i => {
      const hoursSince = (Date.now() - new Date(i.createdAt).getTime()) / (1000 * 60 * 60);
      return hoursSince < 24; // Last 24 hours
    });
    const trendingScore = recentInteractions.length * engagementScore * 1.5;

    // Upsert engagement scores
    await db
      .insert(contentEngagementScores)
      .values({
        contentId,
        viewCount,
        likeCount,
        shareCount,
        saveCount,
        avgViewDuration: avgViewDuration.toString(),
        engagementScore: engagementScore.toString(),
        trendingScore: trendingScore.toString(),
        lastUpdated: new Date(),
      })
      .onConflictDoUpdate({
        target: contentEngagementScores.contentId,
        set: {
          viewCount,
          likeCount,
          shareCount,
          saveCount,
          avgViewDuration: avgViewDuration.toString(),
          engagementScore: engagementScore.toString(),
          trendingScore: trendingScore.toString(),
          lastUpdated: new Date(),
        },
      });
  }

  // Update user preference profile based on interactions
  private async updateUserPreferences(userId: string) {
    const interactions = await db
      .select({
        interaction: userInteractions,
        content: content,
        creator: users,
        profile: profiles,
      })
      .from(userInteractions)
      .leftJoin(content, eq(userInteractions.contentId, content.id))
      .leftJoin(users, eq(content.creatorUserId, users.id))
      .leftJoin(profiles, eq(users.id, profiles.userId))
      .where(eq(userInteractions.userId, userId))
      .limit(200); // Last 200 interactions

    // Calculate creator preferences
    const creatorScores: Record<string, number> = {};
    const tagScores: Record<string, number> = {};
    const packTypeScores: Record<string, number> = {};

    for (const item of interactions) {
      if (!item.content) continue;

      const weight = this.getInteractionWeight(item.interaction.interactionType);
      const creatorId = item.content.creatorUserId;

      // Update creator scores
      creatorScores[creatorId] = (creatorScores[creatorId] || 0) + weight;

      // Update tag scores
      const tags = (item.content.tags as string[]) || [];
      for (const tag of tags) {
        tagScores[tag] = (tagScores[tag] || 0) + weight;
      }

      // Update pack type scores
      if (item.profile?.packType) {
        const packType = item.profile.packType;
        packTypeScores[packType] = (packTypeScores[packType] || 0) + weight;
      }
    }

    // Convert to sorted arrays
    const preferredCreators = Object.entries(creatorScores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([id, score]) => ({ id, score }));

    const preferredTags = Object.entries(tagScores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30)
      .map(([tag, score]) => ({ tag, score }));

    const preferredPackTypes = Object.entries(packTypeScores)
      .sort((a, b) => b[1] - a[1])
      .map(([type, score]) => ({ type, score }));

    // Upsert user preference profile
    await db
      .insert(userPreferenceProfiles)
      .values({
        userId,
        preferredCreators,
        preferredTags,
        preferredPackTypes,
        interactionVector: {}, // Can be expanded for ML features
        lastUpdated: new Date(),
      })
      .onConflictDoUpdate({
        target: userPreferenceProfiles.userId,
        set: {
          preferredCreators,
          preferredTags,
          preferredPackTypes,
          lastUpdated: new Date(),
        },
      });
  }

  // Get interaction weight for scoring
  private getInteractionWeight(type: string): number {
    const weights: Record<string, number> = {
      view: 1,
      like: 3,
      share: 5,
      save: 4,
      skip: -1,
      report: -10,
    };
    return weights[type] || 0;
  }

  // Generate personalized recommendations
  async getRecommendations(params: {
    userId: string;
    limit?: number;
    excludeContentIds?: string[];
  }): Promise<Array<{ contentId: string; score: number; reason: string }>> {
    const { userId, limit = 20, excludeContentIds = [] } = params;

    // Get user preferences
    const [userPrefs] = await db
      .select()
      .from(userPreferenceProfiles)
      .where(eq(userPreferenceProfiles.userId, userId))
      .limit(1);

    // Get user subscriptions
    const userSubs = await db
      .select({ creatorId: subscriptions.creatorId })
      .from(subscriptions)
      .where(eq(subscriptions.fanId, userId));

    const subscribedCreatorIds = userSubs.map(s => s.creatorId);

    // Get already viewed content
    const viewedContent = await db
      .select({ contentId: userInteractions.contentId })
      .from(userInteractions)
      .where(
        and(
          eq(userInteractions.userId, userId),
          eq(userInteractions.interactionType, 'view')
        )
      )
      .limit(500);

    const viewedContentIds = viewedContent.map(v => v.contentId);
    const allExcludedIds = [...excludeContentIds, ...viewedContentIds];

    // Build recommendation candidates with scoring
    const recommendations: Array<{ contentId: string; score: number; reason: string }> = [];

    // Strategy 1: Content from preferred creators (highest weight)
    if (userPrefs?.preferredCreators) {
      const preferredCreatorIds = (userPrefs.preferredCreators as any[])
        .slice(0, 10)
        .map(c => c.id)
        .filter(id => id); // Filter out any null/undefined values

      if (preferredCreatorIds.length > 0) {
        const creatorContent = await db
          .select({
            id: content.id,
            creatorUserId: content.creatorUserId,
            engagementScore: contentEngagementScores.engagementScore,
          })
          .from(content)
          .leftJoin(contentEngagementScores, eq(content.id, contentEngagementScores.contentId))
          .where(
            and(
              inArray(content.creatorUserId, preferredCreatorIds),
              allExcludedIds.length > 0 ? not(inArray(content.id, allExcludedIds)) : undefined
            )
          )
          .limit(30);

        for (const item of creatorContent) {
          const baseScore = 10; // High base score for preferred creators
          const engagementBoost = parseFloat(item.engagementScore || '0') * 0.5;
          recommendations.push({
            contentId: item.id,
            score: baseScore + engagementBoost,
            reason: 'From creator you love',
          });
        }
      }
    }

    // Strategy 2: Trending content with high engagement
    const trendingContent = await db
      .select({
        id: content.id,
        trendingScore: contentEngagementScores.trendingScore,
        engagementScore: contentEngagementScores.engagementScore,
      })
      .from(content)
      .leftJoin(contentEngagementScores, eq(content.id, contentEngagementScores.contentId))
      .where(
        allExcludedIds.length > 0 ? not(inArray(content.id, allExcludedIds)) : undefined
      )
      .orderBy(desc(contentEngagementScores.trendingScore))
      .limit(20);

    for (const item of trendingContent) {
      const trendingBoost = parseFloat(item.trendingScore || '0') * 0.3;
      const engagementBoost = parseFloat(item.engagementScore || '0') * 0.2;
      recommendations.push({
        contentId: item.id,
        score: 5 + trendingBoost + engagementBoost,
        reason: 'Trending now',
      });
    }

    // Strategy 3: Content matching preferred tags
    if (userPrefs?.preferredTags) {
      const preferredTags = (userPrefs.preferredTags as any[])
        .slice(0, 5)
        .map(t => t.tag);

      if (preferredTags.length > 0) {
        const taggedContent = await db
          .select({
            id: content.id,
            tags: content.tags,
            engagementScore: contentEngagementScores.engagementScore,
          })
          .from(content)
          .leftJoin(contentEngagementScores, eq(content.id, contentEngagementScores.contentId))
          .where(
            allExcludedIds.length > 0 ? not(inArray(content.id, allExcludedIds)) : undefined
          )
          .limit(50);

        for (const item of taggedContent) {
          const itemTags = (item.tags as string[]) || [];
          const matchingTags = itemTags.filter(tag => preferredTags.includes(tag));
          
          if (matchingTags.length > 0) {
            const tagMatchScore = matchingTags.length * 2;
            const engagementBoost = parseFloat(item.engagementScore || '0') * 0.3;
            recommendations.push({
              contentId: item.id,
              score: 7 + tagMatchScore + engagementBoost,
              reason: `Matches your interests: ${matchingTags.join(', ')}`,
            });
          }
        }
      }
    }

    // Strategy 4: Content from subscribed creators
    if (subscribedCreatorIds.length > 0) {
      const subscribedContent = await db
        .select({
          id: content.id,
          engagementScore: contentEngagementScores.engagementScore,
        })
        .from(content)
        .leftJoin(contentEngagementScores, eq(content.id, contentEngagementScores.contentId))
        .where(
          and(
            inArray(content.creatorUserId, subscribedCreatorIds),
            allExcludedIds.length > 0 ? not(inArray(content.id, allExcludedIds)) : undefined
          )
        )
        .limit(15);

      for (const item of subscribedContent) {
        const baseScore = 8;
        const engagementBoost = parseFloat(item.engagementScore || '0') * 0.4;
        recommendations.push({
          contentId: item.id,
          score: baseScore + engagementBoost,
          reason: 'From creator you subscribe to',
        });
      }
    }

    // Deduplicate and sort by score
    const uniqueRecs = Array.from(
      new Map(recommendations.map(r => [r.contentId, r])).values()
    );
    
    uniqueRecs.sort((a, b) => b.score - a.score);
    
    return uniqueRecs.slice(0, limit);
  }

  // Calculate creator similarity for collaborative filtering
  async computeCreatorSimilarity() {
    const creators = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.role, 'creator'));

    // For each pair of creators, calculate similarity based on shared audience
    for (let i = 0; i < creators.length; i++) {
      for (let j = i + 1; j < creators.length; j++) {
        const creator1Id = creators[i].id;
        const creator2Id = creators[j].id;

        // Get subscribers for each creator
        const subs1 = await db
          .select({ fanId: subscriptions.fanId })
          .from(subscriptions)
          .where(eq(subscriptions.creatorId, creator1Id));

        const subs2 = await db
          .select({ fanId: subscriptions.fanId })
          .from(subscriptions)
          .where(eq(subscriptions.creatorId, creator2Id));

        const fans1 = new Set(subs1.map(s => s.fanId));
        const fans2 = new Set(subs2.map(s => s.fanId));

        // Calculate Jaccard similarity
        const intersection = new Set([...fans1].filter(x => fans2.has(x)));
        const union = new Set([...fans1, ...fans2]);
        const similarity = union.size > 0 ? intersection.size / union.size : 0;

        if (similarity > 0.1) { // Only store meaningful similarities
          await db
            .insert(creatorSimilarity)
            .values({
              creatorId1: creator1Id,
              creatorId2: creator2Id,
              similarityScore: similarity.toString(),
              computedAt: new Date(),
            })
            .onConflictDoNothing();
        }
      }
    }
  }
}

export const recommendationEngine = new RecommendationEngine();
