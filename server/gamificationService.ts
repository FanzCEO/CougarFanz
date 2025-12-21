import { db } from "./db";
import { 
  achievements, userAchievements, creatorTiers, fanEngagementRewards, 
  leaderboards, users, subscriptions, tips, content, userInteractions,
  type Achievement, type UserAchievement, type CreatorTier, type FanEngagementReward
} from "@shared/schema";
import { eq, and, gte, lte, desc, sql, count } from "drizzle-orm";

export class GamificationService {
  
  // ============================================================================
  // ACHIEVEMENT SYSTEM
  // ============================================================================

  // Check and unlock achievements for a user
  async checkAndUnlockAchievements(userId: string) {
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user.length) return [];

    const userRole = user[0].role;
    // Get all achievements - we'll filter by applicability in the loop
    const allAchievements = await db
      .select()
      .from(achievements);

    const unlockedAchievements = await db
      .select()
      .from(userAchievements)
      .where(eq(userAchievements.userId, userId));

    const unlockedIds = new Set(unlockedAchievements.map(ua => ua.achievementId));
    const newlyUnlocked: Achievement[] = [];

    for (const achievement of allAchievements) {
      if (!achievement.id || unlockedIds.has(achievement.id)) continue;

      const requirement = achievement.requirement as any;
      const meetsRequirement = await this.checkAchievementRequirement(userId, requirement, userRole);

      if (meetsRequirement && achievement.id) {
        // Unlock the achievement
        await db.insert(userAchievements).values({
          userId,
          achievementId: achievement.id,
          progress: 100,
          metadata: { unlockedValue: meetsRequirement.value }
        });

        // Update tier points for creators
        if (userRole === 'creator') {
          await this.addCreatorTierPoints(userId, achievement.points || 100);
        } else {
          // Update loyalty points for fans
          await this.addFanLoyaltyPoints(userId, achievement.points || 100);
        }

        newlyUnlocked.push(achievement);
      }
    }

    return newlyUnlocked;
  }

  // Check if a user meets an achievement requirement
  async checkAchievementRequirement(userId: string, requirement: any, userRole: string) {
    const { type, threshold } = requirement;

    switch (type) {
      case 'subscriber_count': {
        if (userRole !== 'creator') return null;
        const subs = await db
          .select({ count: count() })
          .from(subscriptions)
          .where(and(
            eq(subscriptions.creatorId, userId),
            eq(subscriptions.status, 'active')
          ));
        const value = subs[0]?.count || 0;
        return value >= threshold ? { value } : null;
      }

      case 'total_earnings': {
        if (userRole !== 'creator') return null;
        const tierData = await db
          .select()
          .from(creatorTiers)
          .where(eq(creatorTiers.userId, userId))
          .limit(1);
        const value = parseFloat(tierData[0]?.lifetimeEarnings || '0');
        return value >= threshold ? { value } : null;
      }

      case 'content_count': {
        if (userRole !== 'creator') return null;
        const contentCount = await db
          .select({ count: count() })
          .from(content)
          .where(eq(content.creatorUserId, userId));
        const value = contentCount[0]?.count || 0;
        return value >= threshold ? { value } : null;
      }

      case 'total_tips': {
        if (userRole !== 'fan') return null;
        const fanRewards = await db
          .select()
          .from(fanEngagementRewards)
          .where(eq(fanEngagementRewards.userId, userId))
          .limit(1);
        const value = parseFloat(fanRewards[0]?.totalTipped || '0');
        return value >= threshold ? { value } : null;
      }

      case 'streak_days': {
        if (userRole !== 'fan') return null;
        const fanRewards = await db
          .select()
          .from(fanEngagementRewards)
          .where(eq(fanEngagementRewards.userId, userId))
          .limit(1);
        const value = fanRewards[0]?.streakDays || 0;
        return value >= threshold ? { value } : null;
      }

      default:
        return null;
    }
  }

  // Get user achievements with progress
  async getUserAchievements(userId: string) {
    const unlocked = await db
      .select({
        achievement: achievements,
        userAchievement: userAchievements,
      })
      .from(userAchievements)
      .innerJoin(achievements, eq(userAchievements.achievementId, achievements.id))
      .where(eq(userAchievements.userId, userId))
      .orderBy(desc(userAchievements.unlockedAt));

    return unlocked;
  }

  // ============================================================================
  // CREATOR TIER SYSTEM
  // ============================================================================

  // Initialize creator tier for a new creator
  async initializeCreatorTier(userId: string) {
    const existing = await db
      .select()
      .from(creatorTiers)
      .where(eq(creatorTiers.userId, userId))
      .limit(1);

    if (existing.length > 0) return existing[0];

    const newTier = await db.insert(creatorTiers).values({
      userId,
      currentTier: 'starter',
      tierPoints: 0,
      nextTierThreshold: 1000,
    }).returning();

    return newTier[0];
  }

  // Update creator tier based on points
  async addCreatorTierPoints(userId: string, points: number) {
    const current = await db
      .select()
      .from(creatorTiers)
      .where(eq(creatorTiers.userId, userId))
      .limit(1);

    if (!current.length) {
      await this.initializeCreatorTier(userId);
      return;
    }

    const tierData = current[0];
    const newPoints = (tierData.tierPoints || 0) + points;
    const { newTier, newThreshold } = this.calculateTierLevel(newPoints);

    await db
      .update(creatorTiers)
      .set({
        tierPoints: newPoints,
        currentTier: newTier as any,
        nextTierThreshold: newThreshold,
        lastTierUpdate: new Date(),
      })
      .where(eq(creatorTiers.userId, userId));

    return { tier: newTier, points: newPoints };
  }

  // Calculate tier level based on points
  calculateTierLevel(points: number): { newTier: string; newThreshold: number } {
    if (points >= 50000) return { newTier: 'legend', newThreshold: 999999 };
    if (points >= 25000) return { newTier: 'diamond', newThreshold: 50000 };
    if (points >= 10000) return { newTier: 'platinum', newThreshold: 25000 };
    if (points >= 5000) return { newTier: 'gold', newThreshold: 10000 };
    if (points >= 2000) return { newTier: 'silver', newThreshold: 5000 };
    if (points >= 1000) return { newTier: 'bronze', newThreshold: 2000 };
    return { newTier: 'starter', newThreshold: 1000 };
  }

  // Update creator stats (call this when creator earns money, gets subscribers, or posts content)
  async updateCreatorStats(userId: string, updates: Partial<CreatorTier>) {
    await db
      .update(creatorTiers)
      .set(updates)
      .where(eq(creatorTiers.userId, userId));
  }

  // ============================================================================
  // FAN ENGAGEMENT & REWARDS
  // ============================================================================

  // Initialize fan engagement tracking
  async initializeFanRewards(userId: string) {
    const existing = await db
      .select()
      .from(fanEngagementRewards)
      .where(eq(fanEngagementRewards.userId, userId))
      .limit(1);

    if (existing.length > 0) return existing[0];

    const newReward = await db.insert(fanEngagementRewards).values({
      userId,
      loyaltyPoints: 0,
      streakDays: 0,
      rewardTier: 'bronze',
    }).returning();

    return newReward[0];
  }

  // Add loyalty points to fan
  async addFanLoyaltyPoints(userId: string, points: number) {
    const current = await db
      .select()
      .from(fanEngagementRewards)
      .where(eq(fanEngagementRewards.userId, userId))
      .limit(1);

    if (!current.length) {
      await this.initializeFanRewards(userId);
      return;
    }

    const fanData = current[0];
    const newPoints = (fanData.loyaltyPoints || 0) + points;
    const newTier = this.calculateFanRewardTier(newPoints);

    await db
      .update(fanEngagementRewards)
      .set({
        loyaltyPoints: newPoints,
        rewardTier: newTier as any,
      })
      .where(eq(fanEngagementRewards.userId, userId));

    return { tier: newTier, points: newPoints };
  }

  // Calculate fan reward tier based on loyalty points
  calculateFanRewardTier(points: number): 'bronze' | 'silver' | 'gold' | 'vip' {
    if (points >= 10000) return 'vip';
    if (points >= 5000) return 'gold';
    if (points >= 2000) return 'silver';
    return 'bronze';
  }

  // Update fan daily check-in streak
  async updateDailyCheckIn(userId: string) {
    const current = await db
      .select()
      .from(fanEngagementRewards)
      .where(eq(fanEngagementRewards.userId, userId))
      .limit(1);

    if (!current.length) {
      await this.initializeFanRewards(userId);
      return;
    }

    const fanData = current[0];
    const now = new Date();
    const lastCheckIn = fanData.lastCheckIn ? new Date(fanData.lastCheckIn) : null;

    let newStreak = 1;
    if (lastCheckIn) {
      const diffDays = Math.floor((now.getTime() - lastCheckIn.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        // Consecutive day
        newStreak = (fanData.streakDays || 0) + 1;
      } else if (diffDays > 1) {
        // Streak broken
        newStreak = 1;
      } else {
        // Same day, no update
        return fanData;
      }
    }

    // Award bonus points for streaks
    const bonusPoints = newStreak >= 7 ? 500 : newStreak >= 3 ? 100 : 10;

    await db
      .update(fanEngagementRewards)
      .set({
        streakDays: newStreak,
        lastCheckIn: now,
        loyaltyPoints: (fanData.loyaltyPoints || 0) + bonusPoints,
      })
      .where(eq(fanEngagementRewards.userId, userId));

    return { streak: newStreak, bonusPoints };
  }

  // ============================================================================
  // LEADERBOARDS
  // ============================================================================

  // Compute and update leaderboards
  async computeLeaderboards(period: 'daily' | 'weekly' | 'monthly' | 'alltime') {
    const now = new Date();
    let periodStart: Date;
    let periodEnd: Date;

    switch (period) {
      case 'daily':
        periodStart = new Date(now.setHours(0, 0, 0, 0));
        periodEnd = new Date(now.setHours(23, 59, 59, 999));
        break;
      case 'weekly':
        periodStart = new Date(now.setDate(now.getDate() - now.getDay()));
        periodEnd = new Date(now.setDate(now.getDate() + 6));
        break;
      case 'monthly':
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      default:
        periodStart = new Date('2000-01-01');
        periodEnd = new Date();
    }

    // Top Creators by subscriber count
    const topCreators = await db
      .select({
        userId: subscriptions.creatorId,
        score: count(),
      })
      .from(subscriptions)
      .where(and(
        eq(subscriptions.status, 'active'),
        gte(subscriptions.createdAt, periodStart),
        lte(subscriptions.createdAt, periodEnd)
      ))
      .groupBy(subscriptions.creatorId)
      .orderBy(desc(count()))
      .limit(100);

    // Insert leaderboard entries
    for (let i = 0; i < topCreators.length; i++) {
      await db.insert(leaderboards).values({
        period,
        category: 'top_creators',
        userId: topCreators[i].userId,
        rank: i + 1,
        score: String(topCreators[i].score),
        periodStart,
        periodEnd,
      });
    }

    // Top Earners (creators)
    const topEarners = await db
      .select({
        userId: creatorTiers.userId,
        score: creatorTiers.lifetimeEarnings,
      })
      .from(creatorTiers)
      .orderBy(desc(creatorTiers.lifetimeEarnings))
      .limit(100);

    for (let i = 0; i < topEarners.length; i++) {
      await db.insert(leaderboards).values({
        period,
        category: 'top_earners',
        userId: topEarners[i].userId,
        rank: i + 1,
        score: topEarners[i].score || '0',
        periodStart,
        periodEnd,
      });
    }

    return { computed: true, period };
  }

  // Get leaderboard by category and period
  async getLeaderboard(category: string, period: string, limit = 100) {
    const leaderboardData = await db
      .select({
        leaderboard: leaderboards,
        user: users,
      })
      .from(leaderboards)
      .innerJoin(users, eq(leaderboards.userId, users.id))
      .where(and(
        sql`${leaderboards.category} = ${category}`,
        sql`${leaderboards.period} = ${period}`
      ))
      .orderBy(leaderboards.rank)
      .limit(limit);

    return leaderboardData;
  }

  // Get user rank in a specific leaderboard
  async getUserRank(userId: string, category: string, period: string) {
    const userRank = await db
      .select()
      .from(leaderboards)
      .where(and(
        eq(leaderboards.userId, userId),
        sql`${leaderboards.category} = ${category}`,
        sql`${leaderboards.period} = ${period}`
      ))
      .limit(1);

    return userRank[0] || null;
  }
}

export const gamificationService = new GamificationService();
