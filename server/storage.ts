import {
  users,
  profiles,
  mediaAssets,
  subscriptions,
  tips,
  messages,
  consentRecords,
  safetyReports,
  kycVerifications,
  moderationQueue,
  tenants,
  content,
  contentTenantMap,
  subscriptionPlans,
  packs,
  packMembers,
  type User,
  type InsertUser,
  type Profile,
  type InsertProfile,
  type MediaAsset,
  type InsertMediaAsset,
  type Subscription,
  type InsertSubscription,
  type Tip,
  type InsertTip,
  type Message,
  type InsertMessage,
  type ConsentRecord,
  type InsertConsentRecord,
  type SafetyReport,
  type InsertSafetyReport,
  type Tenant,
  type InsertTenant,
  type Content,
  type InsertContent,
  type ContentTenantMap,
  type InsertContentTenantMap,
  type SubscriptionPlan,
  type InsertSubscriptionPlan,
  type Pack,
  type InsertPack,
  type PackMember,
  type InsertPackMember,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, like, count, isNull } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: InsertUser): Promise<User>;
  createUser(user: InsertUser): Promise<User>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  
  // Profile operations
  getProfile(userId: string): Promise<Profile | undefined>;
  createProfile(profile: InsertProfile): Promise<Profile>;
  updateProfile(userId: string, updates: Partial<InsertProfile>): Promise<Profile>;
  
  // Media operations
  createMediaAsset(asset: InsertMediaAsset): Promise<MediaAsset>;
  getMediaAsset(id: string): Promise<MediaAsset | undefined>;
  getMediaAssetsByOwner(ownerId: string): Promise<MediaAsset[]>;
  getUserMediaAssets(userId: string): Promise<MediaAsset[]>;
  updateMediaAsset(id: string, updates: Partial<InsertMediaAsset>): Promise<MediaAsset>;
  deleteMediaAsset(id: string): Promise<void>;
  checkMediaAccess(userId: string, mediaId: string): Promise<boolean>;
  
  // Discovery operations
  searchCreators(query: string, filters?: any): Promise<(User & { profile: Profile | null })[]>;
  getFeaturedCreators(): Promise<(User & { profile: Profile | null })[]>;
  
  // Subscription operations
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  getSubscriptionsByFan(fanId: string): Promise<Subscription[]>;
  getSubscriptionsByCreator(creatorId: string): Promise<Subscription[]>;
  
  // Tip operations
  createTip(tip: InsertTip): Promise<Tip>;
  getTipsByCreator(creatorId: string): Promise<Tip[]>;
  
  // Messaging operations
  createMessage(message: InsertMessage): Promise<Message>;
  getMessagesBetweenUsers(user1Id: string, user2Id: string): Promise<Message[]>;
  getConversations(userId: string): Promise<any[]>;
  
  // Safety operations
  createConsentRecord(consent: InsertConsentRecord): Promise<ConsentRecord>;
  getConsentRecords(userId: string): Promise<ConsentRecord[]>;
  createSafetyReport(report: InsertSafetyReport): Promise<SafetyReport>;
  
  // Analytics operations
  getCreatorEarnings(creatorId: string, period: 'day' | 'week' | 'month'): Promise<any>;
  getCreatorStats(creatorId: string): Promise<any>;
  
  // Multi-tenant operations
  getTenants(): Promise<Tenant[]>;
  getTenant(id: string): Promise<Tenant | undefined>;
  getTenantBySlug(slug: string): Promise<Tenant | undefined>;
  
  // Enhanced content operations
  createContent(content: InsertContent): Promise<Content>;
  getContent(id: string): Promise<Content | undefined>;
  getContentByCreator(creatorId: string, tenantId?: string): Promise<Content[]>;
  getContentByTenant(tenantId: string): Promise<Content[]>;
  updateContent(id: string, updates: Partial<InsertContent>): Promise<Content>;
  deleteContent(id: string): Promise<void>;
  
  // Cross-posting operations
  publishContentToTenant(contentId: string, tenantId: string): Promise<ContentTenantMap>;
  unpublishContentFromTenant(contentId: string, tenantId: string): Promise<void>;
  getContentTenants(contentId: string): Promise<ContentTenantMap[]>;
  
  // Enhanced subscription plans
  createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan>;
  getSubscriptionPlans(creatorId: string, tenantId?: string): Promise<SubscriptionPlan[]>;
  getSubscriptionPlan(id: string): Promise<SubscriptionPlan | undefined>;
  updateSubscriptionPlan(id: string, updates: Partial<InsertSubscriptionPlan>): Promise<SubscriptionPlan>;
  deleteSubscriptionPlan(id: string): Promise<void>;
  
  // Feed operations
  getFeedPosts(userId: string | undefined, page: number, limit: number): Promise<any[]>;
  
  // Pack operations
  createPack(pack: InsertPack): Promise<Pack>;
  getPack(id: string): Promise<Pack | undefined>;
  getPackBySlug(slug: string): Promise<Pack | undefined>;
  getPacksByCreator(creatorId: string): Promise<Pack[]>;
  getAllPacks(): Promise<Pack[]>;
  joinPack(packId: string, userId: string): Promise<PackMember>;
  leavePack(packId: string, userId: string): Promise<void>;
  getUserPacks(userId: string): Promise<(Pack & { membership: PackMember })[]>;
  getPackMembers(packId: string): Promise<(PackMember & { user: User })[]>;
  isPackMember(packId: string, userId: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getProfile(userId: string): Promise<Profile | undefined> {
    const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId));
    return profile;
  }

  async createProfile(profileData: InsertProfile): Promise<Profile> {
    const [profile] = await db.insert(profiles).values(profileData).returning();
    return profile;
  }

  async updateProfile(userId: string, updates: Partial<InsertProfile>): Promise<Profile> {
    const [profile] = await db
      .update(profiles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(profiles.userId, userId))
      .returning();
    return profile;
  }

  async createMediaAsset(assetData: InsertMediaAsset): Promise<MediaAsset> {
    const [asset] = await db.insert(mediaAssets).values(assetData).returning();
    return asset;
  }

  async getMediaAsset(id: string): Promise<MediaAsset | undefined> {
    const [asset] = await db.select().from(mediaAssets).where(eq(mediaAssets.id, id));
    return asset;
  }

  async getMediaAssetsByOwner(ownerId: string): Promise<MediaAsset[]> {
    return await db
      .select()
      .from(mediaAssets)
      .where(eq(mediaAssets.ownerId, ownerId))
      .orderBy(desc(mediaAssets.createdAt));
  }

  async updateMediaAsset(id: string, updates: Partial<InsertMediaAsset>): Promise<MediaAsset> {
    const [asset] = await db
      .update(mediaAssets)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(mediaAssets.id, id))
      .returning();
    return asset;
  }

  async getUserMediaAssets(userId: string): Promise<MediaAsset[]> {
    return this.getMediaAssetsByOwner(userId);
  }

  async deleteMediaAsset(id: string): Promise<void> {
    await db.delete(mediaAssets).where(eq(mediaAssets.id, id));
  }

  async checkMediaAccess(userId: string, mediaId: string): Promise<boolean> {
    const media = await this.getMediaAsset(mediaId);
    if (!media) return false;

    // Owner always has access
    if (media.ownerId === userId) return true;

    // Public content is accessible to all
    if (media.accessLevel === 'pack') return true;

    // For premium/ppv content, check subscriptions
    if (media.accessLevel === 'premium') {
      const subscriptions = await this.getSubscriptionsByFan(userId);
      return subscriptions.some(sub => 
        sub.creatorId === media.ownerId && 
        sub.status === 'active'
      );
    }

    // For PPV content, would need to check payment records
    // For now, return false (would implement payment check here)
    return false;
  }

  async searchCreators(query: string, filters?: any): Promise<(User & { profile: Profile | null })[]> {
    const results = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        role: users.role,
        authProvider: users.authProvider,
        status: users.status,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        password: users.password,
        profile: {
          id: profiles.id,
          userId: profiles.userId,
          displayName: profiles.displayName,
          bio: profiles.bio,
          avatarUrl: profiles.avatarUrl,
          bannerUrl: profiles.bannerUrl,
          kycStatus: profiles.kycStatus,
          ageVerified: profiles.ageVerified,
          packType: profiles.packType,
          isAftercareFriendly: profiles.isAftercareFriendly,
          safetyBadges: profiles.safetyBadges,
          createdAt: profiles.createdAt,
          updatedAt: profiles.updatedAt,
        }
      })
      .from(users)
      .leftJoin(profiles, eq(users.id, profiles.userId))
      .where(
        and(
          eq(users.role, 'creator'),
          eq(users.status, 'active'),
          or(
            like(users.username, `%${query}%`),
            like(profiles.displayName, `%${query}%`),
            like(profiles.bio, `%${query}%`)
          )
        )
      )
      .limit(20);

    return results.map(row => ({
      ...row,
      profile: row.profile?.id ? row.profile : null
    }));
  }

  async getFeaturedCreators(): Promise<(User & { profile: Profile | null })[]> {
    const results = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        role: users.role,
        authProvider: users.authProvider,
        status: users.status,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        password: users.password,
        profile: {
          id: profiles.id,
          userId: profiles.userId,
          displayName: profiles.displayName,
          bio: profiles.bio,
          avatarUrl: profiles.avatarUrl,
          bannerUrl: profiles.bannerUrl,
          kycStatus: profiles.kycStatus,
          ageVerified: profiles.ageVerified,
          packType: profiles.packType,
          isAftercareFriendly: profiles.isAftercareFriendly,
          safetyBadges: profiles.safetyBadges,
          createdAt: profiles.createdAt,
          updatedAt: profiles.updatedAt,
        }
      })
      .from(users)
      .leftJoin(profiles, eq(users.id, profiles.userId))
      .where(
        and(
          eq(users.role, 'creator'),
          eq(users.status, 'active'),
          eq(profiles.ageVerified, true)
        )
      )
      .orderBy(desc(users.createdAt))
      .limit(12);

    return results.map(row => ({
      ...row,
      profile: row.profile?.id ? row.profile : null
    }));
  }

  async createSubscription(subscriptionData: InsertSubscription): Promise<Subscription> {
    const [subscription] = await db.insert(subscriptions).values(subscriptionData).returning();
    return subscription;
  }

  async getSubscriptionsByFan(fanId: string): Promise<Subscription[]> {
    return await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.fanId, fanId))
      .orderBy(desc(subscriptions.createdAt));
  }

  async getSubscriptionsByCreator(creatorId: string): Promise<Subscription[]> {
    return await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.creatorId, creatorId))
      .orderBy(desc(subscriptions.createdAt));
  }

  async createTip(tipData: InsertTip): Promise<Tip> {
    const [tip] = await db.insert(tips).values(tipData).returning();
    return tip;
  }

  async getTipsByCreator(creatorId: string): Promise<Tip[]> {
    return await db
      .select()
      .from(tips)
      .where(eq(tips.toUserId, creatorId))
      .orderBy(desc(tips.createdAt));
  }

  async createMessage(messageData: InsertMessage): Promise<Message> {
    const [message] = await db.insert(messages).values(messageData).returning();
    return message;
  }

  async getMessagesBetweenUsers(user1Id: string, user2Id: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(
        or(
          and(eq(messages.fromUserId, user1Id), eq(messages.toUserId, user2Id)),
          and(eq(messages.fromUserId, user2Id), eq(messages.toUserId, user1Id))
        )
      )
      .orderBy(messages.createdAt);
  }

  async getConversations(userId: string): Promise<any[]> {
    // Get recent conversations for a user
    const conversations = await db
      .select({
        otherUserId: messages.fromUserId,
        lastMessage: messages.content,
        lastMessageTime: messages.createdAt,
        unreadCount: count(),
      })
      .from(messages)
      .where(
        and(
          eq(messages.toUserId, userId),
          isNull(messages.readAt)
        )
      )
      .groupBy(messages.fromUserId, messages.content, messages.createdAt)
      .orderBy(desc(messages.createdAt))
      .limit(10);

    return conversations;
  }

  async createConsentRecord(consentData: InsertConsentRecord): Promise<ConsentRecord> {
    const [consent] = await db.insert(consentRecords).values(consentData).returning();
    return consent;
  }

  async getConsentRecords(userId: string): Promise<ConsentRecord[]> {
    return await db
      .select()
      .from(consentRecords)
      .where(eq(consentRecords.userId, userId))
      .orderBy(desc(consentRecords.createdAt));
  }

  async createSafetyReport(reportData: InsertSafetyReport): Promise<SafetyReport> {
    const [report] = await db.insert(safetyReports).values(reportData).returning();
    return report;
  }

  async getCreatorEarnings(creatorId: string, period: 'day' | 'week' | 'month'): Promise<any> {
    // Calculate earnings from tips and subscriptions
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'day':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }

    const tipEarnings = await db
      .select()
      .from(tips)
      .where(
        and(
          eq(tips.toUserId, creatorId),
          eq(tips.status, 'completed')
        )
      );

    const subscriptionEarnings = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.creatorId, creatorId),
          eq(subscriptions.status, 'active')
        )
      );

    const totalTips = tipEarnings.reduce((sum, tip) => sum + parseFloat(tip.amount), 0);
    const totalSubscriptions = subscriptionEarnings.reduce((sum, sub) => sum + parseFloat(sub.price), 0);

    return {
      totalEarnings: totalTips + totalSubscriptions,
      tipEarnings: totalTips,
      subscriptionEarnings: totalSubscriptions,
      period,
    };
  }

  async getCreatorStats(creatorId: string): Promise<any> {
    const [subscriberCount] = await db
      .select({ count: count() })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.creatorId, creatorId),
          eq(subscriptions.status, 'active')
        )
      );

    const [contentCount] = await db
      .select({ count: count() })
      .from(mediaAssets)
      .where(eq(mediaAssets.ownerId, creatorId));

    const viewsSum = await db
      .select()
      .from(mediaAssets)
      .where(eq(mediaAssets.ownerId, creatorId));

    const totalViews = viewsSum.reduce((sum, asset) => sum + (asset.viewCount || 0), 0);

    return {
      subscribers: subscriberCount.count,
      contentCount: contentCount.count,
      totalViews,
    };
  }

  // Multi-tenant operations
  async getTenants(): Promise<Tenant[]> {
    return await db.select().from(tenants).orderBy(tenants.name);
  }

  async getTenant(id: string): Promise<Tenant | undefined> {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, id));
    return tenant;
  }

  async getTenantBySlug(slug: string): Promise<Tenant | undefined> {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.slug, slug));
    return tenant;
  }

  // Enhanced content operations
  async createContent(contentData: InsertContent): Promise<Content> {
    const [contentItem] = await db.insert(content).values(contentData).returning();
    return contentItem;
  }

  async getContent(id: string): Promise<Content | undefined> {
    const [contentItem] = await db.select().from(content).where(eq(content.id, id));
    return contentItem;
  }

  async getContentByCreator(creatorId: string, tenantId?: string): Promise<Content[]> {
    if (tenantId) {
      const results = await db
        .select({
          id: content.id,
          creatorUserId: content.creatorUserId,
          title: content.title,
          caption: content.caption,
          priceCents: content.priceCents,
          visibility: content.visibility,
          canonicalTenant: content.canonicalTenant,
          tags: content.tags,
          mediaAssetIds: content.mediaAssetIds,
          createdAt: content.createdAt,
          updatedAt: content.updatedAt,
        })
        .from(content)
        .innerJoin(contentTenantMap, eq(content.id, contentTenantMap.contentId))
        .where(
          and(
            eq(content.creatorUserId, creatorId),
            eq(contentTenantMap.tenantId, tenantId),
            eq(contentTenantMap.status, 'published')
          )
        )
        .orderBy(desc(content.createdAt));
      return results;
    }

    return await db
      .select()
      .from(content)
      .where(eq(content.creatorUserId, creatorId))
      .orderBy(desc(content.createdAt));
  }

  async getContentByTenant(tenantId: string): Promise<Content[]> {
    return await db
      .select({
        id: content.id,
        creatorUserId: content.creatorUserId,
        title: content.title,
        caption: content.caption,
        priceCents: content.priceCents,
        visibility: content.visibility,
        canonicalTenant: content.canonicalTenant,
        tags: content.tags,
        mediaAssetIds: content.mediaAssetIds,
        createdAt: content.createdAt,
        updatedAt: content.updatedAt,
      })
      .from(content)
      .innerJoin(contentTenantMap, eq(content.id, contentTenantMap.contentId))
      .where(
        and(
          eq(contentTenantMap.tenantId, tenantId),
          eq(contentTenantMap.status, 'published')
        )
      )
      .orderBy(desc(content.createdAt));
  }

  async updateContent(id: string, updates: Partial<InsertContent>): Promise<Content> {
    const [contentItem] = await db
      .update(content)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(content.id, id))
      .returning();
    return contentItem;
  }

  async deleteContent(id: string): Promise<void> {
    // Delete content-tenant mappings first
    await db.delete(contentTenantMap).where(eq(contentTenantMap.contentId, id));
    // Delete the content
    await db.delete(content).where(eq(content.id, id));
  }

  // Cross-posting operations
  async publishContentToTenant(contentId: string, tenantId: string): Promise<ContentTenantMap> {
    const [mapping] = await db
      .insert(contentTenantMap)
      .values({
        contentId,
        tenantId,
        status: 'published',
        publishedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [contentTenantMap.contentId, contentTenantMap.tenantId],
        set: {
          status: 'published',
          publishedAt: new Date(),
        },
      })
      .returning();
    return mapping;
  }

  async unpublishContentFromTenant(contentId: string, tenantId: string): Promise<void> {
    await db
      .update(contentTenantMap)
      .set({ status: 'hidden' })
      .where(
        and(
          eq(contentTenantMap.contentId, contentId),
          eq(contentTenantMap.tenantId, tenantId)
        )
      );
  }

  async getContentTenants(contentId: string): Promise<ContentTenantMap[]> {
    return await db
      .select()
      .from(contentTenantMap)
      .where(eq(contentTenantMap.contentId, contentId));
  }

  // Enhanced subscription plans
  async createSubscriptionPlan(planData: InsertSubscriptionPlan): Promise<SubscriptionPlan> {
    const [plan] = await db.insert(subscriptionPlans).values(planData).returning();
    return plan;
  }

  async getSubscriptionPlans(creatorId: string, tenantId?: string): Promise<SubscriptionPlan[]> {
    if (tenantId) {
      return await db
        .select()
        .from(subscriptionPlans)
        .where(
          and(
            eq(subscriptionPlans.creatorUserId, creatorId),
            eq(subscriptionPlans.active, true),
            eq(subscriptionPlans.tenantId, tenantId)
          )
        )
        .orderBy(subscriptionPlans.priceCents);
    }

    return await db
      .select()
      .from(subscriptionPlans)
      .where(
        and(
          eq(subscriptionPlans.creatorUserId, creatorId),
          eq(subscriptionPlans.active, true)
        )
      )
      .orderBy(subscriptionPlans.priceCents);
  }

  async getSubscriptionPlan(id: string): Promise<SubscriptionPlan | undefined> {
    const [plan] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, id));
    return plan;
  }

  async updateSubscriptionPlan(id: string, updates: Partial<InsertSubscriptionPlan>): Promise<SubscriptionPlan> {
    const [plan] = await db
      .update(subscriptionPlans)
      .set(updates)
      .where(eq(subscriptionPlans.id, id))
      .returning();
    return plan;
  }

  async deleteSubscriptionPlan(id: string): Promise<void> {
    await db
      .update(subscriptionPlans)
      .set({ active: false })
      .where(eq(subscriptionPlans.id, id));
  }

  // Feed operations
  async getFeedPosts(userId: string | undefined, page: number, limit: number): Promise<any[]> {
    const offset = (page - 1) * limit;
    
    // Get content with creator information and pack info
    const contentList = await db
      .select({
        content: content,
        creator: users,
        profile: profiles,
        packMembership: packMembers,
        pack: packs,
      })
      .from(content)
      .leftJoin(users, eq(content.creatorUserId, users.id))
      .leftJoin(profiles, eq(users.id, profiles.userId))
      .leftJoin(packMembers, eq(users.id, packMembers.userId))
      .leftJoin(packs, eq(packMembers.packId, packs.id))
      .where(eq(content.visibility, 'public'))
      .orderBy(desc(content.createdAt))
      .limit(limit)
      .offset(offset);

    // Get user subscriptions if logged in
    let userSubscriptions: Set<string> = new Set();
    if (userId) {
      const subs = await db
        .select()
        .from(subscriptions)
        .where(
          and(
            eq(subscriptions.fanId, userId),
            eq(subscriptions.status, 'active')
          )
        );
      userSubscriptions = new Set(subs.map(s => s.creatorId));
    }

    // Transform to feed format
    return contentList.map(item => ({
      id: item.content.id,
      creatorUserId: item.content.creatorUserId,
      creatorName: item.creator?.username || item.profile?.displayName || 'Unknown',
      creatorAvatar: item.profile?.avatarUrl || '',
      creatorIsAgeVerified: item.profile?.ageVerified || false,
      creatorAllowsFree: item.profile?.allowsFreeAccess || false,
      packName: item.pack?.name || null,
      title: item.content.title,
      caption: item.content.caption,
      visibility: item.content.visibility,
      priceCents: item.content.priceCents || 0,
      mediaUrl: item.content.mediaAssetIds && (item.content.mediaAssetIds as any[])[0] 
        ? `/api/media/${(item.content.mediaAssetIds as any[])[0]}/download` 
        : undefined,
      mediaType: 'image/jpeg', // TODO: Get actual media type from mediaAssets table
      isSubscribed: userId ? userSubscriptions.has(item.content.creatorUserId) : false,
      isFree: item.content.visibility === 'public' && item.content.priceCents === 0,
      tags: (item.content.tags as string[]) || [],
      likeCount: 0, // TODO: Implement likes system
      commentCount: 0, // TODO: Implement comments system
      createdAt: item.content.createdAt,
    }));
  }

  // Pack operations
  async createPack(pack: InsertPack): Promise<Pack> {
    const [newPack] = await db.insert(packs).values(pack).returning();
    
    // Automatically add creator as pack owner
    await db.insert(packMembers).values({
      packId: newPack.id,
      userId: pack.creatorId,
      role: 'owner',
    });
    
    return newPack;
  }

  async getPack(id: string): Promise<Pack | undefined> {
    const [pack] = await db.select().from(packs).where(eq(packs.id, id));
    return pack;
  }

  async getPackBySlug(slug: string): Promise<Pack | undefined> {
    const [pack] = await db.select().from(packs).where(eq(packs.slug, slug));
    return pack;
  }

  async getPacksByCreator(creatorId: string): Promise<Pack[]> {
    return db.select().from(packs).where(eq(packs.creatorId, creatorId));
  }

  async getAllPacks(): Promise<Pack[]> {
    return db.select().from(packs).where(eq(packs.isPublic, true)).orderBy(desc(packs.createdAt));
  }

  async joinPack(packId: string, userId: string): Promise<PackMember> {
    const [member] = await db.insert(packMembers).values({
      packId,
      userId,
      role: 'member',
    }).returning();
    
    // Update member count
    await db.update(packs)
      .set({ memberCount: db.raw('member_count + 1') as any })
      .where(eq(packs.id, packId));
    
    return member;
  }

  async leavePack(packId: string, userId: string): Promise<void> {
    await db.delete(packMembers)
      .where(and(
        eq(packMembers.packId, packId),
        eq(packMembers.userId, userId)
      ));
    
    // Update member count
    await db.update(packs)
      .set({ memberCount: db.raw('member_count - 1') as any })
      .where(eq(packs.id, packId));
  }

  async getUserPacks(userId: string): Promise<(Pack & { membership: PackMember })[]> {
    const userPackMemberships = await db
      .select({
        pack: packs,
        membership: packMembers,
      })
      .from(packMembers)
      .innerJoin(packs, eq(packMembers.packId, packs.id))
      .where(eq(packMembers.userId, userId));
    
    return userPackMemberships.map(item => ({
      ...item.pack,
      membership: item.membership,
    }));
  }

  async getPackMembers(packId: string): Promise<(PackMember & { user: User })[]> {
    const members = await db
      .select({
        member: packMembers,
        user: users,
      })
      .from(packMembers)
      .innerJoin(users, eq(packMembers.userId, users.id))
      .where(eq(packMembers.packId, packId));
    
    return members.map(item => ({
      ...item.member,
      user: item.user,
    }));
  }

  async isPackMember(packId: string, userId: string): Promise<boolean> {
    const [member] = await db
      .select()
      .from(packMembers)
      .where(and(
        eq(packMembers.packId, packId),
        eq(packMembers.userId, userId)
      ));
    
    return !!member;
  }
}

export const storage = new DatabaseStorage();
