import { sql } from 'drizzle-orm';
import {
  index,
  uniqueIndex,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  decimal,
  bigserial,
  inet,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// =============================================================================
// PACK COMMUNITY SYSTEM
// =============================================================================

// Packs - Community groups that users can create and join
export const packs = pgTable("packs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).unique().notNull(),
  description: text("description"),
  creatorId: varchar("creator_id").references(() => users.id).notNull(),
  avatarUrl: varchar("avatar_url"),
  bannerUrl: varchar("banner_url"),
  packType: varchar("pack_type", { enum: ['alpha', 'playful', 'supportive', 'training'] }).default('alpha'),
  isPublic: boolean("is_public").default(true),
  memberCount: integer("member_count").default(0),
  maxMembers: integer("max_members").default(1000),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_pack_creator").on(table.creatorId),
  index("idx_pack_slug").on(table.slug),
  index("idx_pack_type").on(table.packType),
]);

// Pack Members - Track membership in packs
export const packMembers = pgTable("pack_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  packId: varchar("pack_id").references(() => packs.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  role: varchar("role", { enum: ['owner', 'moderator', 'member'] }).default('member'),
  joinedAt: timestamp("joined_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_pack_member_pack").on(table.packId),
  index("idx_pack_member_user").on(table.userId),
  uniqueIndex("idx_pack_member_unique").on(table.packId, table.userId),
]);

// =============================================================================
// EXISTING TABLES (UNCHANGED)
// =============================================================================

// Keep existing users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: varchar("username").unique(),
  email: varchar("email").unique(),
  password: text("password"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role", { enum: ['fan', 'creator', 'admin'] }).default('fan'),
  authProvider: varchar("auth_provider", { enum: ['local', 'replit'] }).default('local'),
  status: varchar("status", { enum: ['active', 'suspended', 'pending'] }).default('pending'),
  // Onboarding tracking fields
  onboardingCompleted: boolean("onboarding_completed").default(false),
  onboardingStep: integer("onboarding_step").default(0),
  preferredInterests: jsonb("preferred_interests").default([]), // For Fanz personalization
  pronouns: varchar("pronouns"), // For Creator profile
  stageName: varchar("stage_name"), // For Creator profile
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Keep existing profiles table
export const profiles = pgTable("profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  displayName: varchar("display_name"),
  bio: text("bio"),
  avatarUrl: varchar("avatar_url"),
  bannerUrl: varchar("banner_url"),
  kycStatus: varchar("kyc_status", { enum: ['pending', 'verified', 'rejected'] }).default('pending'),
  ageVerified: boolean("age_verified").default(false),
  allowsFreeAccess: boolean("allows_free_access").default(false),
  packType: varchar("pack_type", { enum: ['alpha', 'playful', 'supportive', 'training'] }).default('alpha'),
  isAftercareFriendly: boolean("is_aftercare_friendly").default(false),
  safetyBadges: jsonb("safety_badges").default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Keep existing media_assets table
export const mediaAssets = pgTable("media_assets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerId: varchar("owner_id").references(() => users.id).notNull(),
  title: varchar("title").notNull(),
  description: text("description"),
  objectPath: varchar("object_path").notNull(),
  mimeType: varchar("mime_type").notNull(),
  fileSize: integer("file_size"),
  status: varchar("status", { enum: ['pending', 'approved', 'rejected', 'flagged'] }).default('pending'),
  forensicSignature: varchar("forensic_signature"),
  accessLevel: varchar("access_level", { enum: ['pack', 'premium', 'ppv'] }).default('pack'),
  price: decimal("price", { precision: 10, scale: 2 }),
  tags: jsonb("tags").default([]),
  viewCount: integer("view_count").default(0),
  likeCount: integer("like_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Keep existing tables
export const kycVerifications = pgTable("kyc_verifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  provider: varchar("provider").notNull().default('verifymy'),
  verificationId: varchar("verification_id").notNull(),
  status: varchar("status", { enum: ['pending', 'verified', 'rejected'] }).default('pending'),
  dataJson: jsonb("data_json"),
  documentPath: varchar("document_path"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const records2257 = pgTable("records_2257", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  docType: varchar("doc_type", { enum: ['drivers_license', 'passport', 'state_id'] }).notNull(),
  documentPath: varchar("document_path").notNull(),
  checksum: varchar("checksum").notNull(),
  expirationDate: timestamp("expiration_date"),
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Co-Star/Collaborator Verification System
export const coStarVerifications = pgTable("co_star_verifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id").references(() => users.id).notNull(),
  coStarUserId: varchar("co_star_user_id").references(() => users.id), // null if not yet registered
  coStarEmail: varchar("co_star_email"), // For invitations before registration
  status: varchar("status", { 
    enum: ['pending_invite', 'invited', 'pending_kyc', 'verified', 'rejected', 'expired'] 
  }).default('pending_invite'),
  verificationType: varchar("verification_type", { 
    enum: ['live_stream', 'video_collab', 'photo_shoot', 'general'] 
  }).notNull(),
  contentId: varchar("content_id").references(() => content.id), // Optional: specific content
  invitationToken: varchar("invitation_token").unique().notNull(), // Secure token for invitation link (required, unique)
  kycVerificationId: varchar("kyc_verification_id").references(() => kycVerifications.id), // Link to co-star's KYC
  tokenConsumed: boolean("token_consumed").default(false), // Single-use token enforcement
  expiresAt: timestamp("expires_at"), // Invitation expiration
  verifiedAt: timestamp("verified_at"),
  invitedAt: timestamp("invited_at"),
  notes: text("notes"), // Creator notes about collaboration
  metadata: jsonb("metadata").default({}), // Additional details (shoot date, location, etc.)
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_costar_creator").on(table.creatorId, table.status),
  index("idx_costar_user").on(table.coStarUserId),
  index("idx_costar_token").on(table.invitationToken),
  index("idx_costar_email").on(table.coStarEmail),
  // Ensure at least one of coStarUserId or coStarEmail is present
  sql`CONSTRAINT costar_identifier_check CHECK (
    co_star_user_id IS NOT NULL OR co_star_email IS NOT NULL
  )`,
]);

// =============================================================================
// MULTI-PLATFORM DISTRIBUTION SYSTEM
// =============================================================================

// Social Media Accounts - Store connected platform accounts for creators
export const socialMediaAccounts = pgTable("social_media_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorUserId: varchar("creator_user_id").references(() => users.id).notNull(),
  platform: varchar("platform", { 
    enum: ['twitter', 'instagram', 'tiktok', 'onlyfans', 'fansly', 'reddit', 'tumblr', 'manyvids'] 
  }).notNull(),
  platformUserId: varchar("platform_user_id"), // Platform-specific user ID
  platformUsername: varchar("platform_username"), // Display username
  accessToken: text("access_token"), // Encrypted access token
  refreshToken: text("refresh_token"), // Encrypted refresh token
  tokenExpiresAt: timestamp("token_expires_at"),
  status: varchar("status", { enum: ['connected', 'expired', 'error', 'revoked'] }).default('connected'),
  lastSyncAt: timestamp("last_sync_at"),
  metadata: jsonb("metadata").default({}), // Platform-specific settings
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_social_creator").on(table.creatorUserId, table.platform),
  index("idx_social_platform").on(table.platform, table.status),
  // Prevent duplicate platform connections for the same user
  uniqueIndex("idx_social_unique").on(table.creatorUserId, table.platform, table.platformUserId),
]);

// Distribution Jobs - Track content distribution to external platforms
export const distributionJobs = pgTable("distribution_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contentId: varchar("content_id").references(() => content.id).notNull(),
  creatorUserId: varchar("creator_user_id").references(() => users.id).notNull(),
  socialMediaAccountId: varchar("social_media_account_id").references(() => socialMediaAccounts.id).notNull(),
  platform: varchar("platform").notNull(), // Duplicated for easy querying
  status: varchar("status", { 
    enum: ['queued', 'processing', 'published', 'failed', 'cancelled', 'scheduled'] 
  }).default('queued'),
  scheduledFor: timestamp("scheduled_for"), // For scheduled posts
  publishedAt: timestamp("published_at"),
  platformPostId: varchar("platform_post_id"), // ID from the platform
  platformUrl: varchar("platform_url"), // Direct link to the post
  errorMessage: text("error_message"),
  retryCount: integer("retry_count").default(0),
  metadata: jsonb("metadata").default({}), // Platform-specific data
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_dist_content").on(table.contentId),
  index("idx_dist_creator").on(table.creatorUserId, table.status),
  index("idx_dist_scheduled").on(table.scheduledFor),
  index("idx_dist_platform").on(table.platform, table.status),
]);

// QR Codes - Generate and track QR codes for content sharing
export const qrCodes = pgTable("qr_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contentId: varchar("content_id").references(() => content.id), // Optional: can be for profile too
  creatorUserId: varchar("creator_user_id").references(() => users.id).notNull(),
  targetType: varchar("target_type", { enum: ['content', 'profile', 'subscription', 'custom'] }).notNull(),
  targetUrl: varchar("target_url").notNull(), // URL the QR code points to
  qrCodeImagePath: varchar("qr_code_image_path").notNull(), // Path to generated QR image
  scanCount: integer("scan_count").default(0),
  lastScannedAt: timestamp("last_scanned_at"),
  metadata: jsonb("metadata").default({}), // Custom styling, branding options
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_qr_creator").on(table.creatorUserId),
  index("idx_qr_content").on(table.contentId),
  index("idx_qr_target").on(table.targetType),
]);

// Smart Links - Track smart links with analytics
export const smartLinks = pgTable("smart_links", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  shortCode: varchar("short_code").unique().notNull(), // e.g., "abc123"
  contentId: varchar("content_id").references(() => content.id), // Optional
  creatorUserId: varchar("creator_user_id").references(() => users.id).notNull(),
  targetUrl: varchar("target_url").notNull(), // Original URL
  title: varchar("title"), // Link title for display
  description: text("description"), // Link description
  clickCount: integer("click_count").default(0),
  uniqueClickCount: integer("unique_click_count").default(0),
  lastClickedAt: timestamp("last_clicked_at"),
  expiresAt: timestamp("expires_at"), // Optional expiration
  status: varchar("status", { enum: ['active', 'expired', 'disabled'] }).default('active'),
  metadata: jsonb("metadata").default({}), // UTM params, custom tracking data
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_link_short").on(table.shortCode),
  index("idx_link_creator").on(table.creatorUserId),
  index("idx_link_content").on(table.contentId),
  index("idx_link_status").on(table.status, table.expiresAt),
]);

// =============================================================================
// LIVE STREAM INFRASTRUCTURE
// =============================================================================

// Live Streams - Real-time streaming sessions
export const liveStreams = pgTable("live_streams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorUserId: varchar("creator_user_id").references(() => users.id).notNull(),
  title: varchar("title").notNull(),
  description: text("description"),
  status: varchar("status", { 
    enum: ['scheduled', 'live', 'ended', 'cancelled'] 
  }).default('scheduled'),
  requiresCoStarVerification: boolean("requires_co_star_verification").default(false),
  scheduledStartTime: timestamp("scheduled_start_time"),
  actualStartTime: timestamp("actual_start_time"),
  endedAt: timestamp("ended_at"),
  viewerCount: integer("viewer_count").default(0),
  peakViewerCount: integer("peak_viewer_count").default(0),
  totalTipsAmount: decimal("total_tips_amount", { precision: 10, scale: 2 }).default('0'),
  streamKey: varchar("stream_key"), // For RTMP/WebRTC authentication
  streamUrl: varchar("stream_url"), // Public viewing URL
  recordingEnabled: boolean("recording_enabled").default(true),
  autoHighlightsEnabled: boolean("auto_highlights_enabled").default(true),
  chatEnabled: boolean("chat_enabled").default(true),
  tipsEnabled: boolean("tips_enabled").default(true),
  visibility: varchar("visibility", { enum: ['public', 'subscribers', 'private'] }).default('public'),
  metadata: jsonb("metadata").default({}), // Platform-specific settings
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_stream_creator").on(table.creatorUserId, table.status),
  index("idx_stream_status").on(table.status, table.scheduledStartTime),
  index("idx_stream_scheduled").on(table.scheduledStartTime),
]);

// Stream Participants - Track viewers and co-stars in streams
export const streamParticipants = pgTable("stream_participants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  streamId: varchar("stream_id").references(() => liveStreams.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  role: varchar("role", { enum: ['host', 'co_star', 'viewer', 'moderator'] }).notNull(),
  coStarVerificationId: varchar("co_star_verification_id").references(() => coStarVerifications.id), // Required for co_star role
  joinedAt: timestamp("joined_at").defaultNow(),
  leftAt: timestamp("left_at"),
  watchTimeSeconds: integer("watch_time_seconds").default(0),
  tipsSentAmount: decimal("tips_sent_amount", { precision: 10, scale: 2 }).default('0'),
  messagesSent: integer("messages_sent").default(0),
  metadata: jsonb("metadata").default({}),
}, (table) => [
  index("idx_participant_stream").on(table.streamId, table.role),
  index("idx_participant_user").on(table.userId, table.streamId),
  uniqueIndex("idx_participant_unique").on(table.streamId, table.userId),
]);

// Stream Recordings - Recorded streams and auto-generated highlights
export const streamRecordings = pgTable("stream_recordings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  streamId: varchar("stream_id").references(() => liveStreams.id).notNull(),
  type: varchar("type", { enum: ['full_recording', 'highlight', 'clip'] }).notNull(),
  title: varchar("title").notNull(),
  description: text("description"),
  objectPath: varchar("object_path").notNull(), // Object storage path
  duration: integer("duration"), // Duration in seconds
  fileSize: integer("file_size"),
  thumbnailPath: varchar("thumbnail_path"),
  viewCount: integer("view_count").default(0),
  status: varchar("status", { enum: ['processing', 'ready', 'failed'] }).default('processing'),
  startTime: integer("start_time"), // Offset from stream start (for highlights)
  endTime: integer("end_time"), // Offset from stream start (for highlights)
  aiGenerated: boolean("ai_generated").default(false), // Auto-generated by AI
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_recording_stream").on(table.streamId, table.type),
  index("idx_recording_status").on(table.status),
  index("idx_recording_created").on(table.createdAt),
]);

// =============================================================================
// AI MARKETING AUTOMATION
// =============================================================================

// Marketing Campaigns - Automated marketing campaigns
export const marketingCampaigns = pgTable("marketing_campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id").references(() => users.id).notNull(),
  name: varchar("name").notNull(),
  type: varchar("type", { 
    enum: ['push_notification', 'email', 'social_post', 'retargeting', 'automated'] 
  }).notNull(),
  status: varchar("status", { 
    enum: ['draft', 'active', 'paused', 'completed', 'archived'] 
  }).default('draft'),
  trigger: varchar("trigger", { 
    enum: ['manual', 'subscription_created', 'subscription_cancelled', 'content_liked', 'content_viewed', 
           'tip_received', 'milestone_reached', 'inactivity', 'scheduled'] 
  }).notNull(),
  triggerConditions: jsonb("trigger_conditions").default({}), // Trigger configuration
  targetSegmentId: varchar("target_segment_id").references(() => fanSegments.id),
  targetAllFans: boolean("target_all_fans").default(false),
  messageTemplate: text("message_template").notNull(),
  subject: varchar("subject"), // For email campaigns
  mediaPath: varchar("media_path"), // Attached media for notifications/posts
  ctaText: varchar("cta_text"), // Call-to-action text
  ctaUrl: varchar("cta_url"), // Call-to-action URL
  scheduledFor: timestamp("scheduled_for"), // For scheduled campaigns
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  maxExecutions: integer("max_executions"), // Max times to run automated campaigns
  executionCount: integer("execution_count").default(0),
  lastExecutedAt: timestamp("last_executed_at"),
  // Analytics
  totalSent: integer("total_sent").default(0),
  totalOpened: integer("total_opened").default(0),
  totalClicked: integer("total_clicked").default(0),
  totalConverted: integer("total_converted").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_campaign_creator").on(table.creatorId, table.status),
  index("idx_campaign_status").on(table.status, table.scheduledFor),
  index("idx_campaign_trigger").on(table.trigger, table.status),
]);

// Fan Segments - Targeted audience groups for campaigns
export const fanSegments = pgTable("fan_segments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id").references(() => users.id).notNull(),
  name: varchar("name").notNull(),
  description: text("description"),
  segmentType: varchar("segment_type", { 
    enum: ['manual', 'auto_rule', 'behavioral', 'demographic'] 
  }).notNull(),
  rules: jsonb("rules").default({}), // Segment rules for auto segments
  // Rule examples:
  // { subscription_tier: ['premium', 'vip'] }
  // { inactivity_days: { gte: 30 } }
  // { total_spent: { gte: 100 } }
  // { last_visit: { lte: '2025-01-01' } }
  isActive: boolean("is_active").default(true),
  fanCount: integer("fan_count").default(0),
  lastRecalculatedAt: timestamp("last_recalculated_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_segment_creator").on(table.creatorId, table.isActive),
  index("idx_segment_type").on(table.segmentType),
]);

// Fan Segment Members - Many-to-many relationship
export const fanSegmentMembers = pgTable("fan_segment_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  segmentId: varchar("segment_id").references(() => fanSegments.id).notNull(),
  fanId: varchar("fan_id").references(() => users.id).notNull(),
  addedAt: timestamp("added_at").defaultNow(),
  metadata: jsonb("metadata").default({}), // Qualification scores, etc.
}, (table) => [
  uniqueIndex("idx_segment_member_unique").on(table.segmentId, table.fanId),
  index("idx_segment_member_segment").on(table.segmentId),
  index("idx_segment_member_fan").on(table.fanId),
]);

// Campaign Executions - Track individual campaign runs
export const campaignExecutions = pgTable("campaign_executions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").references(() => marketingCampaigns.id).notNull(),
  recipientId: varchar("recipient_id").references(() => users.id).notNull(),
  status: varchar("status", { 
    enum: ['queued', 'sent', 'delivered', 'opened', 'clicked', 'converted', 'failed', 'bounced'] 
  }).default('queued'),
  deliveredAt: timestamp("delivered_at"),
  openedAt: timestamp("opened_at"),
  clickedAt: timestamp("clicked_at"),
  convertedAt: timestamp("converted_at"),
  errorMessage: text("error_message"),
  metadata: jsonb("metadata").default({}), // Tracking IDs, device info, etc.
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_execution_campaign").on(table.campaignId, table.status),
  index("idx_execution_recipient").on(table.recipientId, table.campaignId),
  index("idx_execution_status").on(table.status, table.createdAt),
]);

// Social Post Queue - Track scheduled social media posts (integrates with distribution system)
export const socialPostQueue = pgTable("social_post_queue", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").references(() => marketingCampaigns.id),
  creatorId: varchar("creator_id").references(() => users.id).notNull(),
  platforms: jsonb("platforms").notNull(), // ['twitter', 'instagram', etc.]
  postContent: text("post_content").notNull(),
  mediaPath: varchar("media_path"),
  scheduledFor: timestamp("scheduled_for").notNull(),
  status: varchar("status", { 
    enum: ['scheduled', 'queued', 'posting', 'posted', 'failed', 'cancelled'] 
  }).default('scheduled'),
  distributionJobId: varchar("distribution_job_id").references(() => distributionJobs.id), // Link to distribution system
  postedAt: timestamp("posted_at"),
  errorMessage: text("error_message"),
  analytics: jsonb("analytics").default({}), // Engagement stats from platforms
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_social_post_scheduled").on(table.status, table.scheduledFor),
  index("idx_social_post_creator").on(table.creatorId, table.status),
  index("idx_social_post_campaign").on(table.campaignId),
]);

export const moderationQueue = pgTable("moderation_queue", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  mediaId: varchar("media_id").references(() => mediaAssets.id).notNull(),
  status: varchar("status", { enum: ['pending', 'approved', 'rejected'] }).default('pending'),
  reviewerId: varchar("reviewer_id").references(() => users.id),
  aiConfidence: decimal("ai_confidence", { precision: 5, scale: 2 }),
  notes: text("notes"),
  priority: varchar("priority", { enum: ['low', 'medium', 'high', 'urgent'] }).default('medium'),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  actorId: varchar("actor_id").references(() => users.id),
  action: varchar("action").notNull(),
  targetType: varchar("target_type").notNull(),
  targetId: varchar("target_id").notNull(),
  metadata: jsonb("metadata"),
  ipAddress: varchar("ip_address"),
  userAgent: varchar("user_agent"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const subscriptions = pgTable("subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fanId: varchar("fan_id").references(() => users.id).notNull(),
  creatorId: varchar("creator_id").references(() => users.id).notNull(),
  tier: varchar("tier", { enum: ['basic', 'premium', 'vip'] }).default('basic'),
  status: varchar("status", { enum: ['active', 'cancelled', 'expired'] }).default('active'),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  startDate: timestamp("start_date").defaultNow(),
  endDate: timestamp("end_date"),
  autoRenew: boolean("auto_renew").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tips = pgTable("tips", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fromUserId: varchar("from_user_id").references(() => users.id).notNull(),
  toUserId: varchar("to_user_id").references(() => users.id).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency").default('USD'),
  message: text("message"),
  mediaId: varchar("media_id").references(() => mediaAssets.id),
  streamId: varchar("stream_id").references(() => liveStreams.id), // For tips during streams
  processorRef: varchar("processor_ref"),
  status: varchar("status", { enum: ['pending', 'completed', 'failed', 'refunded'] }).default('pending'),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_tip_stream").on(table.streamId, table.createdAt),
]);

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fromUserId: varchar("from_user_id").references(() => users.id).notNull(),
  toUserId: varchar("to_user_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  messageType: varchar("message_type", { enum: ['text', 'image', 'tip', 'system'] }).default('text'),
  mediaPath: varchar("media_path"),
  tipId: varchar("tip_id").references(() => tips.id),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const consentRecords = pgTable("consent_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  consentType: varchar("consent_type").notNull(),
  granted: boolean("granted").notNull(),
  details: jsonb("details"),
  ipAddress: varchar("ip_address"),
  revokedAt: timestamp("revoked_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// =============================================================================
// NEW MULTI-TENANT TABLES
// =============================================================================

// Core tenants table - GirlFanz, PupFanz, DaddyFanz
export const tenants = pgTable("tenants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  slug: varchar("slug").unique().notNull(),
  name: varchar("name").notNull(),
  settings: jsonb("settings").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Enhanced content system for cross-posting
export const content = pgTable("content", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorUserId: varchar("creator_user_id").references(() => users.id).notNull(),
  title: varchar("title").notNull(),
  caption: text("caption"),
  priceCents: integer("price_cents").default(0),
  visibility: varchar("visibility", { enum: ['public', 'subscribers', 'ppv'] }).default('public'),
  canonicalTenant: varchar("canonical_tenant").references(() => tenants.id).notNull(),
  tags: jsonb("tags").default([]),
  mediaAssetIds: jsonb("media_asset_ids").default([]), // Array of existing media_assets.id
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Cross-tenant content mapping
export const contentTenantMap = pgTable("content_tenant_map", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contentId: varchar("content_id").references(() => content.id).notNull(),
  tenantId: varchar("tenant_id").references(() => tenants.id).notNull(),
  status: varchar("status", { enum: ['published', 'scheduled', 'hidden'] }).default('published'),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_content_tenant_unique").on(table.contentId, table.tenantId),
]);

// Enhanced subscription plans with tenant support
export const subscriptionPlans = pgTable("subscription_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorUserId: varchar("creator_user_id").references(() => users.id).notNull(),
  tenantId: varchar("tenant_id").references(() => tenants.id).notNull(),
  priceCents: integer("price_cents").notNull(),
  interval: varchar("interval", { enum: ['monthly', 'yearly'] }).notNull(),
  perks: jsonb("perks").default({}),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Enhanced audit logs with tenant support
export const tenantAuditLogs = pgTable("tenant_audit_logs", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  actorUserId: varchar("actor_user_id").references(() => users.id),
  tenantId: varchar("tenant_id").references(() => tenants.id),
  action: varchar("action").notNull(),
  subjectTable: varchar("subject_table").notNull(),
  subjectId: varchar("subject_id").notNull(),
  ip: inet("ip"),
  userAgent: varchar("user_agent"),
  at: timestamp("at").defaultNow(),
  data: jsonb("data").default({}),
});

// =============================================================================
// AI-POWERED RECOMMENDATION ENGINE
// =============================================================================

// User interaction tracking for AI recommendations
export const userInteractions = pgTable("user_interactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  contentId: varchar("content_id").references(() => content.id).notNull(),
  interactionType: varchar("interaction_type", { enum: ['view', 'like', 'share', 'save', 'skip', 'report'] }).notNull(),
  durationSeconds: integer("duration_seconds"), // For views
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_user_interactions_user").on(table.userId),
  index("idx_user_interactions_content").on(table.contentId),
  index("idx_user_interactions_type").on(table.interactionType),
]);

// Pre-computed content engagement scores for faster recommendations
export const contentEngagementScores = pgTable("content_engagement_scores", {
  contentId: varchar("content_id").references(() => content.id).primaryKey(),
  viewCount: integer("view_count").default(0),
  likeCount: integer("like_count").default(0),
  shareCount: integer("share_count").default(0),
  saveCount: integer("save_count").default(0),
  avgViewDuration: decimal("avg_view_duration", { precision: 10, scale: 2 }),
  engagementScore: decimal("engagement_score", { precision: 10, scale: 4 }), // Computed score
  trendingScore: decimal("trending_score", { precision: 10, scale: 4 }), // Time-weighted score
  lastUpdated: timestamp("last_updated").defaultNow(),
});

// User preference profiles learned from interactions
export const userPreferenceProfiles = pgTable("user_preference_profiles", {
  userId: varchar("user_id").references(() => users.id).primaryKey(),
  preferredCreators: jsonb("preferred_creators").default([]), // Array of creator IDs with scores
  preferredTags: jsonb("preferred_tags").default([]), // Array of tags with scores
  preferredPackTypes: jsonb("preferred_pack_types").default([]), // Pack type preferences
  interactionVector: jsonb("interaction_vector").default({}), // ML feature vector
  lastUpdated: timestamp("last_updated").defaultNow(),
});

// Creator similarity matrix for collaborative filtering
export const creatorSimilarity = pgTable("creator_similarity", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorId1: varchar("creator_id_1").references(() => users.id).notNull(),
  creatorId2: varchar("creator_id_2").references(() => users.id).notNull(),
  similarityScore: decimal("similarity_score", { precision: 10, scale: 4 }).notNull(),
  computedAt: timestamp("computed_at").defaultNow(),
}, (table) => [
  index("idx_creator_similarity").on(table.creatorId1, table.creatorId2),
]);

// =============================================================================
// CREATOR ANALYTICS DASHBOARD
// =============================================================================

// Daily revenue and metrics snapshots
export const creatorDailyMetrics = pgTable("creator_daily_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id").references(() => users.id).notNull(),
  date: timestamp("date").notNull(),
  subscriptionRevenue: decimal("subscription_revenue", { precision: 12, scale: 2 }).default('0'),
  tipRevenue: decimal("tip_revenue", { precision: 12, scale: 2 }).default('0'),
  ppvRevenue: decimal("ppv_revenue", { precision: 12, scale: 2 }).default('0'),
  totalRevenue: decimal("total_revenue", { precision: 12, scale: 2 }).default('0'),
  newSubscribers: integer("new_subscribers").default(0),
  lostSubscribers: integer("lost_subscribers").default(0),
  totalSubscribers: integer("total_subscribers").default(0),
  contentViews: integer("content_views").default(0),
  contentLikes: integer("content_likes").default(0),
  contentShares: integer("content_shares").default(0),
  messagesReceived: integer("messages_received").default(0),
  engagementRate: decimal("engagement_rate", { precision: 5, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_creator_daily_metrics").on(table.creatorId, table.date),
]);

// Audience demographics and insights
export const creatorAudienceInsights = pgTable("creator_audience_insights", {
  creatorId: varchar("creator_id").references(() => users.id).primaryKey(),
  topFanIds: jsonb("top_fan_ids").default([]), // Top 10 fans by spending
  packTypeDistribution: jsonb("pack_type_distribution").default({}), // {alpha: 30, playful: 45, ...}
  geographicDistribution: jsonb("geographic_distribution").default({}), // Countries/regions
  averageSubscriptionLength: decimal("avg_subscription_length", { precision: 10, scale: 2 }), // Days
  averageTipAmount: decimal("avg_tip_amount", { precision: 10, scale: 2 }),
  retentionRate: decimal("retention_rate", { precision: 5, scale: 2 }), // Percentage
  churnRate: decimal("churn_rate", { precision: 5, scale: 2 }), // Percentage
  lastUpdated: timestamp("last_updated").defaultNow(),
});

// Revenue forecasting data
export const creatorRevenueForecasts = pgTable("creator_revenue_forecasts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id").references(() => users.id).notNull(),
  forecastMonth: timestamp("forecast_month").notNull(),
  predictedRevenue: decimal("predicted_revenue", { precision: 12, scale: 2 }).notNull(),
  confidenceLevel: decimal("confidence_level", { precision: 5, scale: 2 }), // 0-100%
  growthRate: decimal("growth_rate", { precision: 5, scale: 2 }), // Percentage
  modelVersion: varchar("model_version"),
  computedAt: timestamp("computed_at").defaultNow(),
}, (table) => [
  index("idx_revenue_forecasts").on(table.creatorId, table.forecastMonth),
]);

// Content performance analytics
export const contentPerformanceMetrics = pgTable("content_performance_metrics", {
  contentId: varchar("content_id").references(() => content.id).primaryKey(),
  totalViews: integer("total_views").default(0),
  uniqueViewers: integer("unique_viewers").default(0),
  averageViewDuration: decimal("avg_view_duration", { precision: 10, scale: 2 }),
  completionRate: decimal("completion_rate", { precision: 5, scale: 2 }), // Percentage
  likeCount: integer("like_count").default(0),
  shareCount: integer("share_count").default(0),
  saveCount: integer("save_count").default(0),
  commentCount: integer("comment_count").default(0),
  tipCount: integer("tip_count").default(0),
  totalTipRevenue: decimal("total_tip_revenue", { precision: 12, scale: 2 }).default('0'),
  conversionRate: decimal("conversion_rate", { precision: 5, scale: 2 }), // Free to paid
  lastUpdated: timestamp("last_updated").defaultNow(),
});

// =============================================================================
// GAMIFICATION SYSTEM
// =============================================================================

// Achievement definitions
export const achievements = pgTable("achievements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  category: varchar("category", { enum: ['creator', 'fan', 'engagement', 'milestone', 'special'] }).notNull(),
  name: varchar("name").notNull(),
  description: text("description"),
  iconUrl: varchar("icon_url"),
  badgeColor: varchar("badge_color"),
  requirement: jsonb("requirement").notNull(), // {type: 'subscriber_count', threshold: 1000}
  points: integer("points").default(100),
  tier: varchar("tier", { enum: ['bronze', 'silver', 'gold', 'platinum', 'diamond'] }).default('bronze'),
  isSecret: boolean("is_secret").default(false), // Hidden until unlocked
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_achievements_category").on(table.category, table.tier),
]);

// User achievements (tracking unlocked achievements)
export const userAchievements = pgTable("user_achievements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  achievementId: varchar("achievement_id").references(() => achievements.id).notNull(),
  unlockedAt: timestamp("unlocked_at").defaultNow(),
  progress: integer("progress").default(100), // Percentage 0-100
  metadata: jsonb("metadata"), // Additional context like exact value when unlocked
}, (table) => [
  index("idx_user_achievements").on(table.userId, table.achievementId),
]);

// Creator tier progression
export const creatorTiers = pgTable("creator_tiers", {
  userId: varchar("user_id").references(() => users.id).primaryKey(),
  currentTier: varchar("current_tier", { 
    enum: ['starter', 'bronze', 'silver', 'gold', 'platinum', 'diamond', 'legend'] 
  }).default('starter'),
  tierPoints: integer("tier_points").default(0),
  nextTierThreshold: integer("next_tier_threshold").default(1000),
  lifetimeEarnings: decimal("lifetime_earnings", { precision: 12, scale: 2 }).default('0'),
  totalSubscribers: integer("total_subscribers").default(0),
  totalContent: integer("total_content").default(0),
  engagementScore: decimal("engagement_score", { precision: 10, scale: 2 }).default('0'),
  tierBenefits: jsonb("tier_benefits").default([]), // Custom perks per tier
  lastTierUpdate: timestamp("last_tier_update").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_creator_tiers").on(table.currentTier, table.tierPoints),
]);

// Fan engagement rewards and points
export const fanEngagementRewards = pgTable("fan_engagement_rewards", {
  userId: varchar("user_id").references(() => users.id).primaryKey(),
  loyaltyPoints: integer("loyalty_points").default(0),
  streakDays: integer("streak_days").default(0), // Daily login streak
  lastCheckIn: timestamp("last_check_in"),
  totalTipped: decimal("total_tipped", { precision: 12, scale: 2 }).default('0'),
  totalSubscribed: integer("total_subscribed").default(0),
  favoriteCreatorIds: jsonb("favorite_creator_ids").default([]),
  rewardTier: varchar("reward_tier", { enum: ['bronze', 'silver', 'gold', 'vip'] }).default('bronze'),
  availableRewards: jsonb("available_rewards").default([]), // Unlocked perks
  lastRewardClaimed: timestamp("last_reward_claimed"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_fan_rewards").on(table.rewardTier, table.loyaltyPoints),
]);

// Leaderboards (daily/weekly/monthly rankings)
export const leaderboards = pgTable("leaderboards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  period: varchar("period", { enum: ['daily', 'weekly', 'monthly', 'alltime'] }).notNull(),
  category: varchar("category", { 
    enum: ['top_creators', 'top_earners', 'top_fans', 'trending', 'rising_stars'] 
  }).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  rank: integer("rank").notNull(),
  score: decimal("score", { precision: 12, scale: 2 }).notNull(),
  metadata: jsonb("metadata"), // Additional stats
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  computedAt: timestamp("computed_at").defaultNow(),
}, (table) => [
  index("idx_leaderboards").on(table.period, table.category, table.rank),
  index("idx_leaderboards_user").on(table.userId, table.period),
]);

// =============================================================================
// REAL-TIME NOTIFICATION SYSTEM
// =============================================================================

// Notifications table
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  type: varchar("type", { 
    enum: ['tip', 'subscription', 'message', 'like', 'comment', 'achievement', 'system', 'milestone'] 
  }).notNull(),
  title: varchar("title").notNull(),
  message: text("message"),
  actionUrl: varchar("action_url"), // Link to related content
  metadata: jsonb("metadata"), // Additional context (tip amount, achievement details, etc.)
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_notifications_user").on(table.userId, table.isRead, table.createdAt),
]);

// User notification preferences
export const notificationPreferences = pgTable("notification_preferences", {
  userId: varchar("user_id").references(() => users.id).primaryKey(),
  emailNotifications: boolean("email_notifications").default(true),
  pushNotifications: boolean("push_notifications").default(true),
  tipsEnabled: boolean("tips_enabled").default(true),
  subscriptionsEnabled: boolean("subscriptions_enabled").default(true),
  messagesEnabled: boolean("messages_enabled").default(true),
  likesEnabled: boolean("likes_enabled").default(true),
  commentsEnabled: boolean("comments_enabled").default(false),
  achievementsEnabled: boolean("achievements_enabled").default(true),
  systemEnabled: boolean("system_enabled").default(true),
  quietHoursStart: varchar("quiet_hours_start"), // e.g., "22:00"
  quietHoursEnd: varchar("quiet_hours_end"), // e.g., "08:00"
  updatedAt: timestamp("updated_at").defaultNow(),
});

// =============================================================================
// CONTENT MODERATION & SAFETY SYSTEM
// =============================================================================

// Safety reports (user-generated reports)
export const safetyReports = pgTable("safety_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reporterId: varchar("reporter_id").references(() => users.id).notNull(),
  contentId: varchar("content_id").references(() => mediaAssets.id),
  userId: varchar("user_id").references(() => users.id), // Reported user
  messageId: varchar("message_id").references(() => messages.id), // Reported message
  reportType: varchar("report_type", { 
    enum: ['underage', 'non_consensual', 'violence', 'hate_speech', 'spam', 'copyright', 'impersonation', 'other'] 
  }).notNull(),
  severity: varchar("severity", { enum: ['low', 'medium', 'high', 'critical'] }).default('medium'),
  description: text("description"),
  evidence: jsonb("evidence"), // Screenshots, URLs, etc.
  status: varchar("status", { 
    enum: ['pending', 'under_review', 'resolved', 'dismissed', 'escalated'] 
  }).default('pending'),
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  resolution: text("resolution"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_safety_reports_status").on(table.status, table.createdAt),
  index("idx_safety_reports_content").on(table.contentId),
  // Ensure at least one target is specified
  sql`CONSTRAINT safety_reports_target_check CHECK (
    content_id IS NOT NULL OR user_id IS NOT NULL OR message_id IS NOT NULL
  )`,
]);

// AI content flags (automated moderation)
export const aiContentFlags = pgTable("ai_content_flags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contentId: varchar("content_id").references(() => mediaAssets.id).notNull(),
  flagType: varchar("flag_type", { 
    enum: ['nsfw_extreme', 'potential_minor', 'violence', 'hate_symbols', 'suspicious_text', 'deepfake'] 
  }).notNull(),
  confidence: decimal("confidence", { precision: 5, scale: 2 }).notNull(), // 0.00 to 100.00
  model: varchar("model"), // AI model used (e.g., "claude-3", "custom-v1")
  details: jsonb("details"), // Raw AI analysis results
  isReviewed: boolean("is_reviewed").default(false),
  reviewerOverride: boolean("reviewer_override"), // Human override decision
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_ai_flags_content").on(table.contentId, table.isReviewed),
  index("idx_ai_flags_type").on(table.flagType, table.confidence),
]);

// Moderation actions
export const moderationActions = pgTable("moderation_actions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reportId: varchar("report_id").references(() => safetyReports.id),
  moderatorId: varchar("moderator_id").references(() => users.id).notNull(),
  targetUserId: varchar("target_user_id").references(() => users.id),
  targetContentId: varchar("target_content_id").references(() => mediaAssets.id),
  actionType: varchar("action_type", { 
    enum: ['warning', 'content_removal', 'account_suspension', 'account_ban', 'age_reverification', 'monetization_disable'] 
  }).notNull(),
  duration: integer("duration"), // In days for temporary actions
  reason: text("reason").notNull(),
  publicReason: text("public_reason"), // Sanitized reason shown to user
  internalNotes: text("internal_notes"),
  reversedBy: varchar("reversed_by").references(() => users.id),
  reversedAt: timestamp("reversed_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_moderation_actions_user").on(table.targetUserId, table.createdAt),
  index("idx_moderation_actions_type").on(table.actionType),
]);

// Community votes on reports (democratic moderation)
export const communityVotes = pgTable("community_votes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reportId: varchar("report_id").references(() => safetyReports.id).notNull(),
  voterId: varchar("voter_id").references(() => users.id).notNull(),
  vote: varchar("vote", { enum: ['valid', 'invalid', 'unsure'] }).notNull(),
  voterReputation: integer("voter_reputation").default(100), // Trust score
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_community_votes_report").on(table.reportId, table.vote),
  index("idx_community_votes_voter").on(table.voterId),
]);

// Content safety scores (aggregate safety rating)
export const contentSafetyScores = pgTable("content_safety_scores", {
  contentId: varchar("content_id").references(() => mediaAssets.id).primaryKey(),
  overallScore: decimal("overall_score", { precision: 5, scale: 2 }).default('100.00'), // 0-100, higher is safer
  reportCount: integer("report_count").default(0),
  aiFlags: integer("ai_flags").default(0),
  communityTrust: decimal("community_trust", { precision: 5, scale: 2 }).default('100.00'),
  humanReviewStatus: varchar("human_review_status", { 
    enum: ['not_reviewed', 'approved', 'flagged', 'removed'] 
  }).default('not_reviewed'),
  lastReviewedBy: varchar("last_reviewed_by").references(() => users.id),
  lastReviewedAt: timestamp("last_reviewed_at"),
  autoActionTaken: boolean("auto_action_taken").default(false),
  riskLevel: varchar("risk_level", { enum: ['safe', 'low', 'medium', 'high', 'critical'] }).default('safe'),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_safety_scores_risk").on(table.riskLevel, table.overallScore),
]);

// Moderator reputation and performance
export const moderatorStats = pgTable("moderator_stats", {
  userId: varchar("user_id").references(() => users.id).primaryKey(),
  totalReviews: integer("total_reviews").default(0),
  accuracyRate: decimal("accuracy_rate", { precision: 5, scale: 2 }).default('0'), // Percentage
  averageResponseTime: integer("avg_response_time"), // In minutes
  overturned: integer("overturned").default(0), // Actions reversed by higher authority
  commendations: integer("commendations").default(0),
  isSeniorModerator: boolean("is_senior_moderator").default(false),
  canEscalate: boolean("can_escalate").default(true),
  lastActiveAt: timestamp("last_active_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_moderator_stats").on(table.accuracyRate, table.totalReviews),
]);

// =============================================================================
// INSERT SCHEMAS
// =============================================================================

// Pack schemas
export const insertPackSchema = createInsertSchema(packs).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPackMemberSchema = createInsertSchema(packMembers).omit({ id: true, createdAt: true, joinedAt: true });

// Existing schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertProfileSchema = createInsertSchema(profiles).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMediaAssetSchema = createInsertSchema(mediaAssets).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({ id: true, createdAt: true });
export const insertTipSchema = createInsertSchema(tips).omit({ id: true, createdAt: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true });
export const insertConsentRecordSchema = createInsertSchema(consentRecords).omit({ id: true, createdAt: true });
export const insertCoStarVerificationSchema = createInsertSchema(coStarVerifications).omit({ id: true, createdAt: true, updatedAt: true });

// Multi-platform distribution schemas
export const insertSocialMediaAccountSchema = createInsertSchema(socialMediaAccounts).omit({ id: true, createdAt: true, updatedAt: true });
export const insertDistributionJobSchema = createInsertSchema(distributionJobs).omit({ id: true, createdAt: true, updatedAt: true });
export const insertQrCodeSchema = createInsertSchema(qrCodes).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSmartLinkSchema = createInsertSchema(smartLinks).omit({ id: true, createdAt: true, updatedAt: true });

// Live stream infrastructure schemas
export const insertLiveStreamSchema = createInsertSchema(liveStreams).omit({ id: true, createdAt: true, updatedAt: true });
export const insertStreamParticipantSchema = createInsertSchema(streamParticipants).omit({ id: true, joinedAt: true });
export const insertStreamRecordingSchema = createInsertSchema(streamRecordings).omit({ id: true, createdAt: true, updatedAt: true });

// AI Marketing Automation schemas
export const insertMarketingCampaignSchema = createInsertSchema(marketingCampaigns).omit({ id: true, createdAt: true, updatedAt: true });
export const insertFanSegmentSchema = createInsertSchema(fanSegments).omit({ id: true, createdAt: true, updatedAt: true });
export const insertFanSegmentMemberSchema = createInsertSchema(fanSegmentMembers).omit({ id: true, addedAt: true });
export const insertCampaignExecutionSchema = createInsertSchema(campaignExecutions).omit({ id: true, createdAt: true });
export const insertSocialPostQueueSchema = createInsertSchema(socialPostQueue).omit({ id: true, createdAt: true, updatedAt: true });

// New multi-tenant schemas
export const insertTenantSchema = createInsertSchema(tenants).omit({ id: true, createdAt: true, updatedAt: true });
export const insertContentSchema = createInsertSchema(content).omit({ id: true, createdAt: true, updatedAt: true });
export const insertContentTenantMapSchema = createInsertSchema(contentTenantMap).omit({ id: true, createdAt: true });
export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).omit({ id: true, createdAt: true });

// AI recommendation engine schemas
export const insertUserInteractionSchema = createInsertSchema(userInteractions).omit({ id: true, createdAt: true });
export const insertContentEngagementScoreSchema = createInsertSchema(contentEngagementScores).omit({ lastUpdated: true });
export const insertUserPreferenceProfileSchema = createInsertSchema(userPreferenceProfiles).omit({ lastUpdated: true });
export const insertCreatorSimilaritySchema = createInsertSchema(creatorSimilarity).omit({ id: true, computedAt: true });

// Creator analytics schemas
export const insertCreatorDailyMetricsSchema = createInsertSchema(creatorDailyMetrics).omit({ id: true, createdAt: true });
export const insertCreatorAudienceInsightsSchema = createInsertSchema(creatorAudienceInsights).omit({ lastUpdated: true });
export const insertCreatorRevenueForecastSchema = createInsertSchema(creatorRevenueForecasts).omit({ id: true, computedAt: true });
export const insertContentPerformanceMetricsSchema = createInsertSchema(contentPerformanceMetrics).omit({ lastUpdated: true });

// Gamification schemas
export const insertAchievementSchema = createInsertSchema(achievements).omit({ id: true, createdAt: true });
export const insertUserAchievementSchema = createInsertSchema(userAchievements).omit({ id: true, unlockedAt: true });
export const insertCreatorTierSchema = createInsertSchema(creatorTiers).omit({ lastTierUpdate: true, createdAt: true });
export const insertFanEngagementRewardSchema = createInsertSchema(fanEngagementRewards).omit({ createdAt: true });
export const insertLeaderboardSchema = createInsertSchema(leaderboards).omit({ id: true, computedAt: true });

// Notification schemas
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true });
export const insertNotificationPreferencesSchema = createInsertSchema(notificationPreferences).omit({ updatedAt: true });

// Content moderation schemas
export const insertSafetyReportSchema = createInsertSchema(safetyReports).omit({ id: true, createdAt: true });
export const insertAIContentFlagSchema = createInsertSchema(aiContentFlags).omit({ id: true, createdAt: true });
export const insertModerationActionSchema = createInsertSchema(moderationActions).omit({ id: true, createdAt: true });
export const insertCommunityVoteSchema = createInsertSchema(communityVotes).omit({ id: true, createdAt: true });
export const insertContentSafetyScoreSchema = createInsertSchema(contentSafetyScores).omit({ updatedAt: true });
export const insertModeratorStatsSchema = createInsertSchema(moderatorStats).omit({ lastActiveAt: true, createdAt: true });

// =============================================================================
// TYPES
// =============================================================================

// Pack types
export type Pack = typeof packs.$inferSelect;
export type InsertPack = z.infer<typeof insertPackSchema>;
export type PackMember = typeof packMembers.$inferSelect;
export type InsertPackMember = z.infer<typeof insertPackMemberSchema>;

// Existing types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type MediaAsset = typeof mediaAssets.$inferSelect;
export type InsertMediaAsset = z.infer<typeof insertMediaAssetSchema>;
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Tip = typeof tips.$inferSelect;
export type InsertTip = z.infer<typeof insertTipSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type ConsentRecord = typeof consentRecords.$inferSelect;
export type InsertConsentRecord = z.infer<typeof insertConsentRecordSchema>;
export type CoStarVerification = typeof coStarVerifications.$inferSelect;
export type InsertCoStarVerification = z.infer<typeof insertCoStarVerificationSchema>;

// Multi-platform distribution types
export type SocialMediaAccount = typeof socialMediaAccounts.$inferSelect;
export type InsertSocialMediaAccount = z.infer<typeof insertSocialMediaAccountSchema>;
export type DistributionJob = typeof distributionJobs.$inferSelect;
export type InsertDistributionJob = z.infer<typeof insertDistributionJobSchema>;
export type QrCode = typeof qrCodes.$inferSelect;
export type InsertQrCode = z.infer<typeof insertQrCodeSchema>;
export type SmartLink = typeof smartLinks.$inferSelect;
export type InsertSmartLink = z.infer<typeof insertSmartLinkSchema>;

// Live stream infrastructure types
export type LiveStream = typeof liveStreams.$inferSelect;
export type InsertLiveStream = z.infer<typeof insertLiveStreamSchema>;
export type StreamParticipant = typeof streamParticipants.$inferSelect;
export type InsertStreamParticipant = z.infer<typeof insertStreamParticipantSchema>;
export type StreamRecording = typeof streamRecordings.$inferSelect;
export type InsertStreamRecording = z.infer<typeof insertStreamRecordingSchema>;

// New multi-tenant types
export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = z.infer<typeof insertTenantSchema>;
export type Content = typeof content.$inferSelect;
export type InsertContent = z.infer<typeof insertContentSchema>;
export type ContentTenantMap = typeof contentTenantMap.$inferSelect;
export type InsertContentTenantMap = z.infer<typeof insertContentTenantMapSchema>;
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;
export type TenantAuditLog = typeof tenantAuditLogs.$inferSelect;

// AI recommendation engine types
export type UserInteraction = typeof userInteractions.$inferSelect;
export type InsertUserInteraction = z.infer<typeof insertUserInteractionSchema>;
export type ContentEngagementScore = typeof contentEngagementScores.$inferSelect;
export type InsertContentEngagementScore = z.infer<typeof insertContentEngagementScoreSchema>;
export type UserPreferenceProfile = typeof userPreferenceProfiles.$inferSelect;
export type InsertUserPreferenceProfile = z.infer<typeof insertUserPreferenceProfileSchema>;
export type CreatorSimilarity = typeof creatorSimilarity.$inferSelect;
export type InsertCreatorSimilarity = z.infer<typeof insertCreatorSimilaritySchema>;

// Creator analytics types
export type CreatorDailyMetrics = typeof creatorDailyMetrics.$inferSelect;
export type InsertCreatorDailyMetrics = z.infer<typeof insertCreatorDailyMetricsSchema>;
export type CreatorAudienceInsights = typeof creatorAudienceInsights.$inferSelect;
export type InsertCreatorAudienceInsights = z.infer<typeof insertCreatorAudienceInsightsSchema>;
export type CreatorRevenueForecast = typeof creatorRevenueForecasts.$inferSelect;
export type InsertCreatorRevenueForecast = z.infer<typeof insertCreatorRevenueForecastSchema>;
export type ContentPerformanceMetrics = typeof contentPerformanceMetrics.$inferSelect;
export type InsertContentPerformanceMetrics = z.infer<typeof insertContentPerformanceMetricsSchema>;

// Gamification types
export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type UserAchievement = typeof userAchievements.$inferSelect;
export type InsertUserAchievement = z.infer<typeof insertUserAchievementSchema>;
export type CreatorTier = typeof creatorTiers.$inferSelect;
export type InsertCreatorTier = z.infer<typeof insertCreatorTierSchema>;
export type FanEngagementReward = typeof fanEngagementRewards.$inferSelect;
export type InsertFanEngagementReward = z.infer<typeof insertFanEngagementRewardSchema>;
export type Leaderboard = typeof leaderboards.$inferSelect;
export type InsertLeaderboard = z.infer<typeof insertLeaderboardSchema>;

// Notification types
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type NotificationPreferences = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreferences = z.infer<typeof insertNotificationPreferencesSchema>;

// Content moderation types
export type SafetyReport = typeof safetyReports.$inferSelect;
export type InsertSafetyReport = z.infer<typeof insertSafetyReportSchema>;
export type AIContentFlag = typeof aiContentFlags.$inferSelect;
export type InsertAIContentFlag = z.infer<typeof insertAIContentFlagSchema>;
export type ModerationAction = typeof moderationActions.$inferSelect;
export type InsertModerationAction = z.infer<typeof insertModerationActionSchema>;
export type CommunityVote = typeof communityVotes.$inferSelect;
export type InsertCommunityVote = z.infer<typeof insertCommunityVoteSchema>;
export type ContentSafetyScore = typeof contentSafetyScores.$inferSelect;
export type InsertContentSafetyScore = z.infer<typeof insertContentSafetyScoreSchema>;
export type ModeratorStats = typeof moderatorStats.$inferSelect;
export type InsertModeratorStats = z.infer<typeof insertModeratorStatsSchema>;

// =============================================================================
// RELATIONS
// =============================================================================

// Existing relations
export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [users.id],
    references: [profiles.userId],
  }),
  ownedMedia: many(mediaAssets),
  subscriptionsAsFan: many(subscriptions, { relationName: "fanSubscriptions" }),
  subscriptionsAsCreator: many(subscriptions, { relationName: "creatorSubscriptions" }),
  sentTips: many(tips, { relationName: "sentTips" }),
  receivedTips: many(tips, { relationName: "receivedTips" }),
  sentMessages: many(messages, { relationName: "sentMessages" }),
  receivedMessages: many(messages, { relationName: "receivedMessages" }),
  kycVerifications: many(kycVerifications),
  records2257: many(records2257),
  consentRecords: many(consentRecords),
  reportsMade: many(safetyReports, { relationName: "reportsBy" }),
  reportsAgainst: many(safetyReports, { relationName: "reportsAbout" }),
  auditLogs: many(auditLogs),
  // New multi-tenant relations
  createdContent: many(content),
  subscriptionPlans: many(subscriptionPlans),
  tenantAuditLogs: many(tenantAuditLogs),
}));

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, {
    fields: [profiles.userId],
    references: [users.id],
  }),
}));

export const mediaAssetsRelations = relations(mediaAssets, ({ one, many }) => ({
  owner: one(users, {
    fields: [mediaAssets.ownerId],
    references: [users.id],
  }),
  moderationItems: many(moderationQueue),
  tipsForContent: many(tips),
  reportsAbout: many(safetyReports),
}));

// New multi-tenant relations
export const tenantsRelations = relations(tenants, ({ many }) => ({
  contentTenantMaps: many(contentTenantMap),
  canonicalContent: many(content),
  subscriptionPlans: many(subscriptionPlans),
  auditLogs: many(tenantAuditLogs),
}));

export const contentRelations = relations(content, ({ one, many }) => ({
  creator: one(users, {
    fields: [content.creatorUserId],
    references: [users.id],
  }),
  canonicalTenantRef: one(tenants, {
    fields: [content.canonicalTenant],
    references: [tenants.id],
  }),
  tenantMaps: many(contentTenantMap),
}));

export const subscriptionPlansRelations = relations(subscriptionPlans, ({ one }) => ({
  creator: one(users, {
    fields: [subscriptionPlans.creatorUserId],
    references: [users.id],
  }),
  tenant: one(tenants, {
    fields: [subscriptionPlans.tenantId],
    references: [tenants.id],
  }),
}));

// Keep existing relations
export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  fan: one(users, {
    fields: [subscriptions.fanId],
    references: [users.id],
    relationName: "fanSubscriptions",
  }),
  creator: one(users, {
    fields: [subscriptions.creatorId],
    references: [users.id],
    relationName: "creatorSubscriptions",
  }),
}));

export const tipsRelations = relations(tips, ({ one }) => ({
  fromUser: one(users, {
    fields: [tips.fromUserId],
    references: [users.id],
    relationName: "sentTips",
  }),
  toUser: one(users, {
    fields: [tips.toUserId],
    references: [users.id],
    relationName: "receivedTips",
  }),
  media: one(mediaAssets, {
    fields: [tips.mediaId],
    references: [mediaAssets.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  fromUser: one(users, {
    fields: [messages.fromUserId],
    references: [users.id],
    relationName: "sentMessages",
  }),
  toUser: one(users, {
    fields: [messages.toUserId],
    references: [users.id],
    relationName: "receivedMessages",
  }),
  tip: one(tips, {
    fields: [messages.tipId],
    references: [tips.id],
  }),
}));

export const kycVerificationsRelations = relations(kycVerifications, ({ one }) => ({
  user: one(users, {
    fields: [kycVerifications.userId],
    references: [users.id],
  }),
}));

export const records2257Relations = relations(records2257, ({ one }) => ({
  user: one(users, {
    fields: [records2257.userId],
    references: [users.id],
  }),
}));

export const coStarVerificationsRelations = relations(coStarVerifications, ({ one }) => ({
  creator: one(users, {
    fields: [coStarVerifications.creatorId],
    references: [users.id],
    relationName: "creatorCoStars",
  }),
  coStar: one(users, {
    fields: [coStarVerifications.coStarUserId],
    references: [users.id],
    relationName: "coStarInvitations",
  }),
  content: one(content, {
    fields: [coStarVerifications.contentId],
    references: [content.id],
  }),
  kycVerification: one(kycVerifications, {
    fields: [coStarVerifications.kycVerificationId],
    references: [kycVerifications.id],
  }),
}));

export const moderationQueueRelations = relations(moderationQueue, ({ one }) => ({
  media: one(mediaAssets, {
    fields: [moderationQueue.mediaId],
    references: [mediaAssets.id],
  }),
  reviewer: one(users, {
    fields: [moderationQueue.reviewerId],
    references: [users.id],
  }),
}));

export const consentRecordsRelations = relations(consentRecords, ({ one }) => ({
  user: one(users, {
    fields: [consentRecords.userId],
    references: [users.id],
  }),
}));

export const safetyReportsRelations = relations(safetyReports, ({ one }) => ({
  reporter: one(users, {
    fields: [safetyReports.reporterId],
    references: [users.id],
    relationName: "reportsBy",
  }),
  reportedUser: one(users, {
    fields: [safetyReports.userId],
    references: [users.id],
    relationName: "reportsAbout",
  }),
  reportedContent: one(mediaAssets, {
    fields: [safetyReports.contentId],
    references: [mediaAssets.id],
  }),
  reportedMessage: one(messages, {
    fields: [safetyReports.messageId],
    references: [messages.id],
  }),
  reviewer: one(users, {
    fields: [safetyReports.reviewedBy],
    references: [users.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  actor: one(users, {
    fields: [auditLogs.actorId],
    references: [users.id],
  }),
}));

// =============================================================================
// BLOCKCHAIN & NFT TABLES - Content Ownership System
// =============================================================================

export const nftCollections = pgTable("nft_collections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id").references(() => users.id).notNull(),
  name: varchar("name").notNull(),
  symbol: varchar("symbol").notNull(), // e.g., "PUPFANZ"
  description: text("description"),
  contractAddress: varchar("contract_address"), // Blockchain contract address
  blockchain: varchar("blockchain", { enum: ['ethereum', 'polygon', 'solana', 'base'] }).default('polygon'),
  royaltyPercentage: decimal("royalty_percentage", { precision: 5, scale: 2 }).default('10.00'), // Creator royalties
  totalSupply: integer("total_supply").default(0),
  floorPrice: decimal("floor_price", { precision: 18, scale: 8 }),
  totalVolume: decimal("total_volume", { precision: 18, scale: 8 }).default('0'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const nfts = pgTable("nfts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  collectionId: varchar("collection_id").references(() => nftCollections.id).notNull(),
  contentId: varchar("content_id").references(() => content.id), // Links to actual content
  tokenId: varchar("token_id").notNull(), // On-chain token ID
  tokenUri: text("token_uri"), // IPFS or metadata URL
  name: varchar("name").notNull(),
  description: text("description"),
  mintedBy: varchar("minted_by").references(() => users.id).notNull(),
  currentOwner: varchar("current_owner").references(() => users.id).notNull(),
  mintPrice: decimal("mint_price", { precision: 18, scale: 8 }),
  lastSalePrice: decimal("last_sale_price", { precision: 18, scale: 8 }),
  isListed: boolean("is_listed").default(false),
  listPrice: decimal("list_price", { precision: 18, scale: 8 }),
  rarity: varchar("rarity", { enum: ['common', 'rare', 'epic', 'legendary'] }).default('common'),
  metadata: jsonb("metadata").default({}), // Additional attributes
  transactionHash: varchar("transaction_hash"), // Minting transaction
  mintedAt: timestamp("minted_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const nftOwnershipHistory = pgTable("nft_ownership_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nftId: varchar("nft_id").references(() => nfts.id).notNull(),
  fromOwner: varchar("from_owner").references(() => users.id), // null for minting
  toOwner: varchar("to_owner").references(() => users.id).notNull(),
  transactionType: varchar("transaction_type", { enum: ['mint', 'sale', 'transfer', 'gift'] }).notNull(),
  price: decimal("price", { precision: 18, scale: 8 }), // Sale price if applicable
  transactionHash: varchar("transaction_hash"),
  blockchain: varchar("blockchain").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const nftRoyalties = pgTable("nft_royalties", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nftId: varchar("nft_id").references(() => nfts.id).notNull(),
  collectionId: varchar("collection_id").references(() => nftCollections.id).notNull(),
  creatorId: varchar("creator_id").references(() => users.id).notNull(),
  saleId: varchar("sale_id").references(() => nftOwnershipHistory.id).notNull(),
  salePrice: decimal("sale_price", { precision: 18, scale: 8 }).notNull(),
  royaltyAmount: decimal("royalty_amount", { precision: 18, scale: 8 }).notNull(),
  royaltyPercentage: decimal("royalty_percentage", { precision: 5, scale: 2 }).notNull(),
  status: varchar("status", { enum: ['pending', 'paid', 'failed'] }).default('pending'),
  transactionHash: varchar("transaction_hash"), // Payment transaction
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas for NFT tables
export const insertNftCollectionSchema = createInsertSchema(nftCollections).omit({ id: true, createdAt: true, updatedAt: true });
export const insertNftSchema = createInsertSchema(nfts).omit({ id: true, mintedAt: true, updatedAt: true });
export const insertNftOwnershipHistorySchema = createInsertSchema(nftOwnershipHistory).omit({ id: true, createdAt: true });
export const insertNftRoyaltySchema = createInsertSchema(nftRoyalties).omit({ id: true, createdAt: true });

// Types
export type NftCollection = typeof nftCollections.$inferSelect;
export type InsertNftCollection = z.infer<typeof insertNftCollectionSchema>;
export type Nft = typeof nfts.$inferSelect;
export type InsertNft = z.infer<typeof insertNftSchema>;
export type NftOwnershipHistory = typeof nftOwnershipHistory.$inferSelect;
export type InsertNftOwnershipHistory = z.infer<typeof insertNftOwnershipHistorySchema>;
export type NftRoyalty = typeof nftRoyalties.$inferSelect;
export type InsertNftRoyalty = z.infer<typeof insertNftRoyaltySchema>;

// Relations
export const nftCollectionsRelations = relations(nftCollections, ({ one, many }) => ({
  creator: one(users, {
    fields: [nftCollections.creatorId],
    references: [users.id],
  }),
  nfts: many(nfts),
  royalties: many(nftRoyalties),
}));

export const nftsRelations = relations(nfts, ({ one, many }) => ({
  collection: one(nftCollections, {
    fields: [nfts.collectionId],
    references: [nftCollections.id],
  }),
  content: one(content, {
    fields: [nfts.contentId],
    references: [content.id],
  }),
  minter: one(users, {
    fields: [nfts.mintedBy],
    references: [users.id],
    relationName: "mintedNfts",
  }),
  owner: one(users, {
    fields: [nfts.currentOwner],
    references: [users.id],
    relationName: "ownedNfts",
  }),
  ownershipHistory: many(nftOwnershipHistory),
  royalties: many(nftRoyalties),
}));

export const nftOwnershipHistoryRelations = relations(nftOwnershipHistory, ({ one }) => ({
  nft: one(nfts, {
    fields: [nftOwnershipHistory.nftId],
    references: [nfts.id],
  }),
  from: one(users, {
    fields: [nftOwnershipHistory.fromOwner],
    references: [users.id],
    relationName: "nftsSold",
  }),
  to: one(users, {
    fields: [nftOwnershipHistory.toOwner],
    references: [users.id],
    relationName: "nftsPurchased",
  }),
}));

export const nftRoyaltiesRelations = relations(nftRoyalties, ({ one }) => ({
  nft: one(nfts, {
    fields: [nftRoyalties.nftId],
    references: [nfts.id],
  }),
  collection: one(nftCollections, {
    fields: [nftRoyalties.collectionId],
    references: [nftCollections.id],
  }),
  creator: one(users, {
    fields: [nftRoyalties.creatorId],
    references: [users.id],
  }),
  sale: one(nftOwnershipHistory, {
    fields: [nftRoyalties.saleId],
    references: [nftOwnershipHistory.id],
  }),
}));

// =============================================================================
// AI VOICE CLONING TABLES - Personalized Voice Messages
// =============================================================================

export const voiceModels = pgTable("voice_models", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id").references(() => users.id).notNull(),
  name: varchar("name").notNull(),
  description: text("description"),
  status: varchar("status", { enum: ['training', 'ready', 'failed'] }).default('training'),
  modelProvider: varchar("model_provider", { enum: ['elevenlabs', 'playht', 'murf', 'resemble'] }).default('elevenlabs'),
  modelId: varchar("model_id"), // External provider model ID
  voiceSamples: jsonb("voice_samples").default([]), // URLs to training audio
  modelSettings: jsonb("model_settings").default({}), // Pitch, speed, etc.
  usageCount: integer("usage_count").default(0),
  totalDuration: integer("total_duration").default(0), // Total seconds generated
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const voiceMessages = pgTable("voice_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  voiceModelId: varchar("voice_model_id").references(() => voiceModels.id).notNull(),
  creatorId: varchar("creator_id").references(() => users.id).notNull(),
  recipientId: varchar("recipient_id").references(() => users.id), // null for templates
  messageType: varchar("message_type", { 
    enum: ['dm', 'welcome', 'milestone', 'birthday', 'custom', 'bulk'] 
  }).notNull(),
  scriptText: text("script_text").notNull(),
  audioUrl: varchar("audio_url"), // Generated audio file URL
  duration: integer("duration"), // Duration in seconds
  status: varchar("status", { enum: ['pending', 'generating', 'ready', 'sent', 'failed'] }).default('pending'),
  metadata: jsonb("metadata").default({}), // Fan name placeholders, etc.
  sentAt: timestamp("sent_at"),
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const voiceAutomation = pgTable("voice_automation", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id").references(() => users.id).notNull(),
  voiceModelId: varchar("voice_model_id").references(() => voiceModels.id).notNull(),
  triggerType: varchar("trigger_type", { 
    enum: ['new_subscriber', 'tip_received', 'milestone', 'birthday', 'anniversary'] 
  }).notNull(),
  scriptTemplate: text("script_template").notNull(), // With {fanName}, {amount}, etc.
  isActive: boolean("is_active").default(true),
  minTipAmount: decimal("min_tip_amount", { precision: 10, scale: 2 }), // For tip triggers
  settings: jsonb("settings").default({}), // Additional trigger conditions
  usageCount: integer("usage_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const voiceMessageQueue = pgTable("voice_message_queue", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  voiceMessageId: varchar("voice_message_id").references(() => voiceMessages.id).notNull(),
  priority: integer("priority").default(5), // 1-10, higher = more urgent
  attempts: integer("attempts").default(0),
  lastAttempt: timestamp("last_attempt"),
  scheduledFor: timestamp("scheduled_for").defaultNow(),
  status: varchar("status", { enum: ['queued', 'processing', 'completed', 'failed'] }).default('queued'),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertVoiceModelSchema = createInsertSchema(voiceModels).omit({ id: true, createdAt: true, updatedAt: true });
export const insertVoiceMessageSchema = createInsertSchema(voiceMessages).omit({ id: true, createdAt: true });
export const insertVoiceAutomationSchema = createInsertSchema(voiceAutomation).omit({ id: true, createdAt: true, updatedAt: true });
export const insertVoiceMessageQueueSchema = createInsertSchema(voiceMessageQueue).omit({ id: true, createdAt: true });

// Types
export type VoiceModel = typeof voiceModels.$inferSelect;
export type InsertVoiceModel = z.infer<typeof insertVoiceModelSchema>;
export type VoiceMessage = typeof voiceMessages.$inferSelect;
export type InsertVoiceMessage = z.infer<typeof insertVoiceMessageSchema>;
export type VoiceAutomation = typeof voiceAutomation.$inferSelect;
export type InsertVoiceAutomation = z.infer<typeof insertVoiceAutomationSchema>;
export type VoiceMessageQueue = typeof voiceMessageQueue.$inferSelect;
export type InsertVoiceMessageQueue = z.infer<typeof insertVoiceMessageQueueSchema>;

// Relations
export const voiceModelsRelations = relations(voiceModels, ({ one, many }) => ({
  creator: one(users, {
    fields: [voiceModels.creatorId],
    references: [users.id],
  }),
  messages: many(voiceMessages),
  automations: many(voiceAutomation),
}));

export const voiceMessagesRelations = relations(voiceMessages, ({ one }) => ({
  voiceModel: one(voiceModels, {
    fields: [voiceMessages.voiceModelId],
    references: [voiceModels.id],
  }),
  creator: one(users, {
    fields: [voiceMessages.creatorId],
    references: [users.id],
    relationName: "creatorVoiceMessages",
  }),
  recipient: one(users, {
    fields: [voiceMessages.recipientId],
    references: [users.id],
    relationName: "receivedVoiceMessages",
  }),
  queue: one(voiceMessageQueue, {
    fields: [voiceMessages.id],
    references: [voiceMessageQueue.voiceMessageId],
  }),
}));

export const voiceAutomationRelations = relations(voiceAutomation, ({ one }) => ({
  creator: one(users, {
    fields: [voiceAutomation.creatorId],
    references: [users.id],
  }),
  voiceModel: one(voiceModels, {
    fields: [voiceAutomation.voiceModelId],
    references: [voiceModels.id],
  }),
}));

export const voiceMessageQueueRelations = relations(voiceMessageQueue, ({ one }) => ({
  voiceMessage: one(voiceMessages, {
    fields: [voiceMessageQueue.voiceMessageId],
    references: [voiceMessages.id],
  }),
}));

// =============================================================================
// HOLOGRAPHIC STREAMING INFRASTRUCTURE
// =============================================================================

export const avatarModels = pgTable("avatar_models", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id").references(() => users.id).notNull(),
  name: varchar("name").notNull(),
  description: text("description"),
  modelFormat: varchar("model_format", { 
    enum: ['glb', 'fbx', 'usdz', 'vrm'] 
  }).default('glb'),
  modelUrl: varchar("model_url").notNull(),
  textureUrls: jsonb("texture_urls").default([]),
  animationData: jsonb("animation_data").default({}), // Gesture/pose animations
  riggingData: jsonb("rigging_data").default({}), // Skeleton/bone structure
  thumbnailUrl: varchar("thumbnail_url"),
  polyCount: integer("poly_count"), // Model complexity
  fileSize: integer("file_size"), // Bytes
  isActive: boolean("is_active").default(true),
  usageCount: integer("usage_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const holographicStreams = pgTable("holographic_streams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id").references(() => users.id).notNull(),
  avatarModelId: varchar("avatar_model_id").references(() => avatarModels.id),
  title: varchar("title").notNull(),
  description: text("description"),
  streamType: varchar("stream_type", { 
    enum: ['vr', 'ar', 'mixed_reality', 'hologram'] 
  }).notNull(),
  status: varchar("status", { 
    enum: ['scheduled', 'live', 'ended', 'processing'] 
  }).default('scheduled'),
  spatialAudioEnabled: boolean("spatial_audio_enabled").default(true),
  viewerCount: integer("viewer_count").default(0),
  peakViewerCount: integer("peak_viewer_count").default(0),
  maxViewers: integer("max_viewers").default(100),
  qualitySettings: jsonb("quality_settings").default({
    resolution: '4k',
    frameRate: 60,
    bitrate: 'auto'
  }),
  environmentSettings: jsonb("environment_settings").default({
    skybox: 'default',
    lighting: 'natural',
    atmosphere: 'clear'
  }),
  interactionSettings: jsonb("interaction_settings").default({
    allowGestures: true,
    allowVoiceChat: true,
    allowTipping: true
  }),
  recordingUrl: varchar("recording_url"), // Post-stream recording
  highlightsUrl: varchar("highlights_url"), // AI-generated highlights
  scheduledFor: timestamp("scheduled_for"),
  startedAt: timestamp("started_at"),
  endedAt: timestamp("ended_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const holographicViewers = pgTable("holographic_viewers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  streamId: varchar("stream_id").references(() => holographicStreams.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  deviceType: varchar("device_type", { 
    enum: ['oculus_quest', 'oculus_rift', 'hololens', 'apple_vision_pro', 'psvr', 'vive', 'index', 'mobile_ar', 'web_vr'] 
  }).notNull(),
  viewerPosition: jsonb("viewer_position").default({ x: 0, y: 0, z: 0 }), // 3D coordinates
  viewerOrientation: jsonb("viewer_orientation").default({ pitch: 0, yaw: 0, roll: 0 }), // Euler angles
  viewQuality: varchar("view_quality", { 
    enum: ['low', 'medium', 'high', 'ultra'] 
  }).default('high'),
  interactionMode: varchar("interaction_mode", { 
    enum: ['spectator', 'interactive', 'vip'] 
  }).default('spectator'),
  joinedAt: timestamp("joined_at").defaultNow(),
  leftAt: timestamp("left_at"),
  watchTime: integer("watch_time").default(0), // Seconds
  tipsGiven: decimal("tips_given", { precision: 10, scale: 2 }).default('0'),
  gesturesUsed: jsonb("gestures_used").default([]), // Wave, heart, applause, etc.
});

export const spatialAudioTracks = pgTable("spatial_audio_tracks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  streamId: varchar("stream_id").references(() => holographicStreams.id).notNull(),
  trackType: varchar("track_type", { 
    enum: ['voice', 'music', 'ambient', 'effects'] 
  }).notNull(),
  trackName: varchar("track_name").notNull(),
  audioUrl: varchar("audio_url").notNull(),
  position: jsonb("position").default({ x: 0, y: 1.6, z: 0 }), // 3D position (y=1.6 is head height)
  volume: decimal("volume", { precision: 3, scale: 2 }).default('1.00'), // 0.00-1.00
  spatialRange: decimal("spatial_range", { precision: 5, scale: 2 }).default('10.00'), // Meters
  attenuationModel: varchar("attenuation_model", { 
    enum: ['linear', 'inverse', 'exponential'] 
  }).default('inverse'),
  directionalCone: jsonb("directional_cone").default({
    innerAngle: 360,
    outerAngle: 360,
    outerGain: 0.3
  }),
  isActive: boolean("is_active").default(true),
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertAvatarModelSchema = createInsertSchema(avatarModels).omit({ id: true, createdAt: true, updatedAt: true });
export const insertHolographicStreamSchema = createInsertSchema(holographicStreams).omit({ id: true, createdAt: true, updatedAt: true });
export const insertHolographicViewerSchema = createInsertSchema(holographicViewers).omit({ id: true });
export const insertSpatialAudioTrackSchema = createInsertSchema(spatialAudioTracks).omit({ id: true, createdAt: true });

// Types
export type AvatarModel = typeof avatarModels.$inferSelect;
export type InsertAvatarModel = z.infer<typeof insertAvatarModelSchema>;
export type HolographicStream = typeof holographicStreams.$inferSelect;
export type InsertHolographicStream = z.infer<typeof insertHolographicStreamSchema>;
export type HolographicViewer = typeof holographicViewers.$inferSelect;
export type InsertHolographicViewer = z.infer<typeof insertHolographicViewerSchema>;
export type SpatialAudioTrack = typeof spatialAudioTracks.$inferSelect;
export type InsertSpatialAudioTrack = z.infer<typeof insertSpatialAudioTrackSchema>;

// Relations
export const avatarModelsRelations = relations(avatarModels, ({ one, many }) => ({
  creator: one(users, {
    fields: [avatarModels.creatorId],
    references: [users.id],
  }),
  streams: many(holographicStreams),
}));

export const holographicStreamsRelations = relations(holographicStreams, ({ one, many }) => ({
  creator: one(users, {
    fields: [holographicStreams.creatorId],
    references: [users.id],
  }),
  avatarModel: one(avatarModels, {
    fields: [holographicStreams.avatarModelId],
    references: [avatarModels.id],
  }),
  viewers: many(holographicViewers),
  audioTracks: many(spatialAudioTracks),
}));

export const holographicViewersRelations = relations(holographicViewers, ({ one }) => ({
  stream: one(holographicStreams, {
    fields: [holographicViewers.streamId],
    references: [holographicStreams.id],
  }),
  user: one(users, {
    fields: [holographicViewers.userId],
    references: [users.id],
  }),
}));

export const spatialAudioTracksRelations = relations(spatialAudioTracks, ({ one }) => ({
  stream: one(holographicStreams, {
    fields: [spatialAudioTracks.streamId],
    references: [holographicStreams.id],
  }),
}));

// =============================================================================
// DYNAMIC PRICING AI
// =============================================================================

export const pricingStrategies = pgTable("pricing_strategies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id").references(() => users.id).notNull(),
  contentId: varchar("content_id").references(() => mediaAssets.id), // null = global strategy
  strategyType: varchar("strategy_type", { 
    enum: ['surge', 'demand_curve', 'time_decay', 'engagement_based', 'auction', 'personalized'] 
  }).notNull(),
  basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(),
  minPrice: decimal("min_price", { precision: 10, scale: 2 }).notNull(),
  maxPrice: decimal("max_price", { precision: 10, scale: 2 }).notNull(),
  demandMultiplier: decimal("demand_multiplier", { precision: 5, scale: 2 }).default('1.00'), // 1.0 = normal, 2.0 = 2x price
  engagementWeights: jsonb("engagement_weights").default({
    views: 0.3,
    likes: 0.4,
    comments: 0.2,
    shares: 0.1
  }),
  timeDecayRate: decimal("time_decay_rate", { precision: 5, scale: 4 }).default('0.0500'), // 5% decrease per day
  surgeThreshold: integer("surge_threshold").default(100), // Viewers needed for surge
  auctionSettings: jsonb("auction_settings").default({
    startingBid: 10,
    bidIncrement: 1,
    duration: 3600
  }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const priceHistory = pgTable("price_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contentId: varchar("content_id").references(() => mediaAssets.id).notNull(),
  strategyId: varchar("strategy_id").references(() => pricingStrategies.id),
  previousPrice: decimal("previous_price", { precision: 10, scale: 2 }).notNull(),
  newPrice: decimal("new_price", { precision: 10, scale: 2 }).notNull(),
  priceChangeReason: varchar("price_change_reason", { 
    enum: ['demand_surge', 'low_demand', 'engagement_boost', 'time_decay', 'manual_override', 'auction_result', 'ai_optimization'] 
  }).notNull(),
  demandScore: decimal("demand_score", { precision: 5, scale: 2 }), // 0-100
  engagementScore: decimal("engagement_score", { precision: 5, scale: 2 }), // 0-100
  viewersActive: integer("viewers_active"), // Concurrent viewers at time of change
  purchaseRate: decimal("purchase_rate", { precision: 5, scale: 2 }), // % of viewers who purchased
  revenueImpact: decimal("revenue_impact", { precision: 10, scale: 2 }), // Expected revenue change
  timestamp: timestamp("timestamp").defaultNow(),
});

export const demandMetrics = pgTable("demand_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contentId: varchar("content_id").references(() => mediaAssets.id).notNull(),
  creatorId: varchar("creator_id").references(() => users.id).notNull(),
  viewCount: integer("view_count").default(0),
  uniqueViewers: integer("unique_viewers").default(0),
  avgWatchTime: integer("avg_watch_time").default(0), // Seconds
  likeCount: integer("like_count").default(0),
  commentCount: integer("comment_count").default(0),
  shareCount: integer("share_count").default(0),
  purchaseCount: integer("purchase_count").default(0),
  revenue: decimal("revenue", { precision: 10, scale: 2 }).default('0'),
  demandScore: decimal("demand_score", { precision: 5, scale: 2 }).default('0'), // AI-calculated 0-100
  trendingScore: decimal("trending_score", { precision: 5, scale: 2 }).default('0'), // Velocity of engagement
  competitorPriceAvg: decimal("competitor_price_avg", { precision: 10, scale: 2 }), // Similar content avg price
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const priceOptimization = pgTable("price_optimization", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  strategyId: varchar("strategy_id").references(() => pricingStrategies.id).notNull(),
  contentId: varchar("content_id").references(() => mediaAssets.id).notNull(),
  currentPrice: decimal("current_price", { precision: 10, scale: 2 }).notNull(),
  recommendedPrice: decimal("recommended_price", { precision: 10, scale: 2 }).notNull(),
  expectedRevenue: decimal("expected_revenue", { precision: 10, scale: 2 }), // Projected revenue at recommended price
  confidenceScore: decimal("confidence_score", { precision: 3, scale: 2 }), // 0.00-1.00
  optimizationFactors: jsonb("optimization_factors").default({
    demandWeight: 0.4,
    engagementWeight: 0.3,
    competitionWeight: 0.2,
    timeWeight: 0.1
  }),
  priceElasticity: decimal("price_elasticity", { precision: 5, scale: 3 }), // Demand sensitivity to price changes
  optimalPriceRange: jsonb("optimal_price_range").default({
    low: 10,
    high: 50,
    sweet_spot: 25
  }),
  status: varchar("status", { 
    enum: ['pending', 'applied', 'rejected', 'testing'] 
  }).default('pending'),
  appliedAt: timestamp("applied_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertPricingStrategySchema = createInsertSchema(pricingStrategies).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPriceHistorySchema = createInsertSchema(priceHistory).omit({ id: true, timestamp: true });
export const insertDemandMetricSchema = createInsertSchema(demandMetrics).omit({ id: true, lastUpdated: true });
export const insertPriceOptimizationSchema = createInsertSchema(priceOptimization).omit({ id: true, createdAt: true });

// Types
export type PricingStrategy = typeof pricingStrategies.$inferSelect;
export type InsertPricingStrategy = z.infer<typeof insertPricingStrategySchema>;
export type PriceHistory = typeof priceHistory.$inferSelect;
export type InsertPriceHistory = z.infer<typeof insertPriceHistorySchema>;
export type DemandMetric = typeof demandMetrics.$inferSelect;
export type InsertDemandMetric = z.infer<typeof insertDemandMetricSchema>;
export type PriceOptimization = typeof priceOptimization.$inferSelect;
export type InsertPriceOptimization = z.infer<typeof insertPriceOptimizationSchema>;

// Relations
export const pricingStrategiesRelations = relations(pricingStrategies, ({ one, many }) => ({
  creator: one(users, {
    fields: [pricingStrategies.creatorId],
    references: [users.id],
  }),
  content: one(mediaAssets, {
    fields: [pricingStrategies.contentId],
    references: [mediaAssets.id],
  }),
  optimizations: many(priceOptimization),
  priceHistory: many(priceHistory),
}));

export const priceHistoryRelations = relations(priceHistory, ({ one }) => ({
  content: one(mediaAssets, {
    fields: [priceHistory.contentId],
    references: [mediaAssets.id],
  }),
  strategy: one(pricingStrategies, {
    fields: [priceHistory.strategyId],
    references: [pricingStrategies.id],
  }),
}));

export const demandMetricsRelations = relations(demandMetrics, ({ one }) => ({
  content: one(mediaAssets, {
    fields: [demandMetrics.contentId],
    references: [mediaAssets.id],
  }),
  creator: one(users, {
    fields: [demandMetrics.creatorId],
    references: [users.id],
  }),
}));

export const priceOptimizationRelations = relations(priceOptimization, ({ one }) => ({
  strategy: one(pricingStrategies, {
    fields: [priceOptimization.strategyId],
    references: [pricingStrategies.id],
  }),
  content: one(mediaAssets, {
    fields: [priceOptimization.contentId],
    references: [mediaAssets.id],
  }),
}));

// =============================================================================
// FAN-TO-CREATOR MICROLENDING SYSTEM
// =============================================================================

export const loanListings = pgTable("loan_listings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id").references(() => users.id).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  requestedAmount: decimal("requested_amount", { precision: 10, scale: 2 }).notNull(),
  purpose: varchar("purpose", { 
    enum: ['equipment', 'production', 'marketing', 'studio_rental', 'costumes', 'props', 'software', 'other'] 
  }).notNull(),
  interestRate: decimal("interest_rate", { precision: 5, scale: 2 }).notNull(),
  termMonths: integer("term_months").notNull(),
  collateralType: varchar("collateral_type", {
    enum: ['future_earnings', 'content_rights', 'revenue_share', 'equipment', 'none']
  }).notNull(),
  collateralDescription: text("collateral_description"),
  collateralValue: decimal("collateral_value", { precision: 10, scale: 2 }),
  minLoanAmount: decimal("min_loan_amount", { precision: 10, scale: 2 }).notNull(),
  maxLoanAmount: decimal("max_loan_amount", { precision: 10, scale: 2 }).notNull(),
  creditScore: integer("credit_score").default(0),
  riskLevel: varchar("risk_level", { enum: ['low', 'medium', 'high', 'very_high'] }).default('medium'),
  status: varchar("status", { 
    enum: ['draft', 'active', 'funded', 'cancelled', 'expired'] 
  }).default('draft'),
  fundingDeadline: timestamp("funding_deadline"),
  totalOffered: decimal("total_offered", { precision: 10, scale: 2 }).default('0'),
  offerCount: integer("offer_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const loanOffers = pgTable("loan_offers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  listingId: varchar("listing_id").references(() => loanListings.id).notNull(),
  lenderId: varchar("lender_id").references(() => users.id).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  proposedInterestRate: decimal("proposed_interest_rate", { precision: 5, scale: 2 }),
  proposedTermMonths: integer("proposed_term_months"),
  message: text("message"),
  status: varchar("status", {
    enum: ['pending', 'accepted', 'rejected', 'withdrawn', 'expired']
  }).default('pending'),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const activeLoans = pgTable("active_loans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  listingId: varchar("listing_id").references(() => loanListings.id).notNull(),
  offerId: varchar("offer_id").references(() => loanOffers.id),
  creatorId: varchar("creator_id").references(() => users.id).notNull(),
  lenderId: varchar("lender_id").references(() => users.id).notNull(),
  principalAmount: decimal("principal_amount", { precision: 10, scale: 2 }).notNull(),
  interestRate: decimal("interest_rate", { precision: 5, scale: 2 }).notNull(),
  termMonths: integer("term_months").notNull(),
  monthlyPayment: decimal("monthly_payment", { precision: 10, scale: 2 }).notNull(),
  totalRepayment: decimal("total_repayment", { precision: 10, scale: 2 }).notNull(),
  amountPaid: decimal("amount_paid", { precision: 10, scale: 2 }).default('0'),
  remainingBalance: decimal("remaining_balance", { precision: 10, scale: 2 }).notNull(),
  nextPaymentDue: timestamp("next_payment_due"),
  paymentsRemaining: integer("payments_remaining").notNull(),
  status: varchar("status", {
    enum: ['active', 'paid_off', 'defaulted', 'restructured', 'forgiven']
  }).default('active'),
  collateralType: varchar("collateral_type", {
    enum: ['future_earnings', 'content_rights', 'revenue_share', 'equipment', 'none']
  }).notNull(),
  collateralDetails: jsonb("collateral_details"),
  defaultedAt: timestamp("defaulted_at"),
  defaultReason: text("default_reason"),
  latePaymentCount: integer("late_payment_count").default(0),
  gracePeriodDays: integer("grace_period_days").default(7),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const loanPayments = pgTable("loan_payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  loanId: varchar("loan_id").references(() => activeLoans.id).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  principalAmount: decimal("principal_amount", { precision: 10, scale: 2 }).notNull(),
  interestAmount: decimal("interest_amount", { precision: 10, scale: 2 }).notNull(),
  paymentType: varchar("payment_type", {
    enum: ['scheduled', 'early', 'late', 'partial', 'final']
  }).notNull(),
  status: varchar("status", {
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded']
  }).default('pending'),
  paymentMethod: varchar("payment_method", { length: 100 }),
  transactionId: varchar("transaction_id", { length: 255 }),
  dueDate: timestamp("due_date").notNull(),
  paidAt: timestamp("paid_at"),
  lateFee: decimal("late_fee", { precision: 10, scale: 2 }).default('0'),
  daysLate: integer("days_late").default(0),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const loanCollateral = pgTable("loan_collateral", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  loanId: varchar("loan_id").references(() => activeLoans.id).notNull(),
  collateralType: varchar("collateral_type", {
    enum: ['future_earnings', 'content_rights', 'revenue_share', 'equipment', 'none']
  }).notNull(),
  assetId: varchar("asset_id"),
  assetType: varchar("asset_type", { length: 100 }),
  valuationAmount: decimal("valuation_amount", { precision: 10, scale: 2 }).notNull(),
  valuationDate: timestamp("valuation_date").defaultNow(),
  earningsPercentage: decimal("earnings_percentage", { precision: 5, scale: 2 }),
  earningsMonths: integer("earnings_months"),
  contentRightsDetails: jsonb("content_rights_details"),
  equipmentDetails: jsonb("equipment_details"),
  status: varchar("status", {
    enum: ['active', 'released', 'seized', 'sold', 'transferred']
  }).default('active'),
  seizureDate: timestamp("seizure_date"),
  releaseDate: timestamp("release_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const loanListingsRelations = relations(loanListings, ({ one, many }) => ({
  creator: one(users, {
    fields: [loanListings.creatorId],
    references: [users.id],
  }),
  offers: many(loanOffers),
  loans: many(activeLoans),
}));

export const loanOffersRelations = relations(loanOffers, ({ one }) => ({
  listing: one(loanListings, {
    fields: [loanOffers.listingId],
    references: [loanListings.id],
  }),
  lender: one(users, {
    fields: [loanOffers.lenderId],
    references: [users.id],
  }),
  loan: one(activeLoans, {
    fields: [loanOffers.id],
    references: [activeLoans.offerId],
  }),
}));

export const activeLoansRelations = relations(activeLoans, ({ one, many }) => ({
  listing: one(loanListings, {
    fields: [activeLoans.listingId],
    references: [loanListings.id],
  }),
  offer: one(loanOffers, {
    fields: [activeLoans.offerId],
    references: [loanOffers.id],
  }),
  creator: one(users, {
    fields: [activeLoans.creatorId],
    references: [users.id],
  }),
  lender: one(users, {
    fields: [activeLoans.lenderId],
    references: [users.id],
  }),
  payments: many(loanPayments),
  collateral: many(loanCollateral),
}));

export const loanPaymentsRelations = relations(loanPayments, ({ one }) => ({
  loan: one(activeLoans, {
    fields: [loanPayments.loanId],
    references: [activeLoans.id],
  }),
}));

export const loanCollateralRelations = relations(loanCollateral, ({ one }) => ({
  loan: one(activeLoans, {
    fields: [loanCollateral.loanId],
    references: [activeLoans.id],
  }),
}));

// =============================================================================
// DEEPFAKE DETECTION SYSTEM
// =============================================================================

export const deepfakeScans = pgTable("deepfake_scans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contentId: varchar("content_id").references(() => mediaAssets.id).notNull(),
  creatorId: varchar("creator_id").references(() => users.id).notNull(),
  scanType: varchar("scan_type", {
    enum: ['facial_analysis', 'voice_analysis', 'metadata_check', 'blockchain_verify', 'ai_detection', 'full_scan']
  }).notNull(),
  deepfakeScore: decimal("deepfake_score", { precision: 5, scale: 2 }).notNull(),
  authenticityScore: decimal("authenticity_score", { precision: 5, scale: 2 }).notNull(),
  confidence: decimal("confidence", { precision: 5, scale: 2 }).notNull(),
  detectionMethod: varchar("detection_method", {
    enum: ['facial_landmarks', 'audio_spectrogram', 'gan_detection', 'temporal_consistency', 'metadata_analysis', 'hybrid']
  }).notNull(),
  anomaliesDetected: jsonb("anomalies_detected").default([]),
  facialInconsistencies: jsonb("facial_inconsistencies").default([]),
  audioAnomalies: jsonb("audio_anomalies").default([]),
  metadataFlags: jsonb("metadata_flags").default([]),
  verdict: varchar("verdict", {
    enum: ['authentic', 'likely_authentic', 'suspicious', 'likely_deepfake', 'confirmed_deepfake']
  }).notNull(),
  riskLevel: varchar("risk_level", {
    enum: ['none', 'low', 'medium', 'high', 'critical']
  }).default('none'),
  processingTime: integer("processing_time_ms"),
  modelVersion: varchar("model_version", { length: 50 }),
  scanCompleted: boolean("scan_completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const authenticitySignatures = pgTable("authenticity_signatures", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contentId: varchar("content_id").references(() => mediaAssets.id).notNull(),
  creatorId: varchar("creator_id").references(() => users.id).notNull(),
  signatureHash: text("signature_hash").notNull(),
  signatureType: varchar("signature_type", {
    enum: ['blockchain', 'cryptographic', 'biometric', 'watermark', 'multi_factor']
  }).notNull(),
  blockchainTxId: varchar("blockchain_tx_id", { length: 255 }),
  blockchainNetwork: varchar("blockchain_network", { length: 100 }),
  verificationCode: varchar("verification_code", { length: 100 }).notNull(),
  biometricData: jsonb("biometric_data"),
  watermarkData: jsonb("watermark_data"),
  cryptoKeyFingerprint: text("crypto_key_fingerprint"),
  issuedAt: timestamp("issued_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
  verified: boolean("verified").default(true),
  verificationCount: integer("verification_count").default(0),
  lastVerifiedAt: timestamp("last_verified_at"),
  revokedAt: timestamp("revoked_at"),
  revocationReason: text("revocation_reason"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const deepfakeReports = pgTable("deepfake_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contentId: varchar("content_id").references(() => mediaAssets.id).notNull(),
  reportedContentUrl: text("reported_content_url").notNull(),
  reporterId: varchar("reporter_id").references(() => users.id).notNull(),
  targetCreatorId: varchar("target_creator_id").references(() => users.id),
  reportType: varchar("report_type", {
    enum: ['unauthorized_deepfake', 'identity_theft', 'manipulated_content', 'impersonation', 'fake_voice', 'other']
  }).notNull(),
  description: text("description").notNull(),
  evidence: jsonb("evidence").default([]),
  suspectedSource: text("suspected_source"),
  priority: varchar("priority", {
    enum: ['low', 'medium', 'high', 'urgent']
  }).default('medium'),
  status: varchar("status", {
    enum: ['pending', 'under_review', 'investigating', 'confirmed', 'dismissed', 'resolved']
  }).default('pending'),
  aiVerificationScore: decimal("ai_verification_score", { precision: 5, scale: 2 }),
  moderatorNotes: text("moderator_notes"),
  moderatorId: varchar("moderator_id").references(() => users.id),
  actionTaken: varchar("action_taken", {
    enum: ['none', 'content_removed', 'account_suspended', 'legal_action', 'dmca_filed', 'warning_issued']
  }),
  resolution: text("resolution"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const deepfakeScansRelations = relations(deepfakeScans, ({ one }) => ({
  content: one(mediaAssets, {
    fields: [deepfakeScans.contentId],
    references: [mediaAssets.id],
  }),
  creator: one(users, {
    fields: [deepfakeScans.creatorId],
    references: [users.id],
  }),
}));

export const authenticitySignaturesRelations = relations(authenticitySignatures, ({ one }) => ({
  content: one(mediaAssets, {
    fields: [authenticitySignatures.contentId],
    references: [mediaAssets.id],
  }),
  creator: one(users, {
    fields: [authenticitySignatures.creatorId],
    references: [users.id],
  }),
}));

export const deepfakeReportsRelations = relations(deepfakeReports, ({ one }) => ({
  content: one(mediaAssets, {
    fields: [deepfakeReports.contentId],
    references: [mediaAssets.id],
  }),
  reporter: one(users, {
    fields: [deepfakeReports.reporterId],
    references: [users.id],
  }),
  targetCreator: one(users, {
    fields: [deepfakeReports.targetCreatorId],
    references: [users.id],
  }),
  moderator: one(users, {
    fields: [deepfakeReports.moderatorId],
    references: [users.id],
  }),
}));

// =============================================================================
// EMOTIONAL AI ENGINE TABLES
// =============================================================================

export const emotionalAnalyses = pgTable("emotional_analyses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  interactionType: varchar("interaction_type", { 
    enum: ['message', 'comment', 'tip', 'purchase', 'subscription', 'content_view'] 
  }).notNull(),
  interactionId: varchar("interaction_id"),
  messageContent: text("message_content"),
  sentimentScore: decimal("sentiment_score", { precision: 5, scale: 2 }).notNull(),
  dominantEmotion: varchar("dominant_emotion", { 
    enum: ['joy', 'sadness', 'anger', 'fear', 'surprise', 'love', 'excitement', 'frustration', 'neutral'] 
  }).notNull(),
  emotionScores: jsonb("emotion_scores").notNull(),
  urgency: varchar("urgency", { enum: ['low', 'medium', 'high', 'critical'] }).default('medium'),
  responseRecommended: boolean("response_recommended").default(false),
  engagementPotential: decimal("engagement_potential", { precision: 5, scale: 2 }).notNull(),
  toxicityScore: decimal("toxicity_score", { precision: 5, scale: 2 }).default('0'),
  keywords: jsonb("keywords").default([]),
  context: jsonb("context").default({}),
  creatorId: varchar("creator_id").references(() => users.id),
  analyzedAt: timestamp("analyzed_at").defaultNow(),
});

export const moodProfiles = pgTable("mood_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  currentMood: varchar("current_mood", { 
    enum: ['positive', 'neutral', 'negative', 'excited', 'calm', 'stressed'] 
  }).notNull(),
  moodScore: decimal("mood_score", { precision: 5, scale: 2 }).notNull(),
  moodTrend: varchar("mood_trend", { enum: ['improving', 'stable', 'declining'] }).default('stable'),
  emotionalJourney: jsonb("emotional_journey").default([]),
  interactionFrequency: integer("interaction_frequency").default(0),
  positiveInteractions: integer("positive_interactions").default(0),
  negativeInteractions: integer("negative_interactions").default(0),
  averageSentiment: decimal("average_sentiment", { precision: 5, scale: 2 }).default('0'),
  lastInteractionEmotion: varchar("last_interaction_emotion"),
  engagementLevel: varchar("engagement_level", { 
    enum: ['disengaged', 'casual', 'regular', 'highly_engaged', 'super_fan'] 
  }).default('casual'),
  churnRisk: decimal("churn_risk", { precision: 5, scale: 2 }).default('0'),
  recommendedActions: jsonb("recommended_actions").default([]),
  creatorId: varchar("creator_id").references(() => users.id),
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const responseRecommendations = pgTable("response_recommendations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  analysisId: varchar("analysis_id").references(() => emotionalAnalyses.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  creatorId: varchar("creator_id").references(() => users.id).notNull(),
  recommendationType: varchar("recommendation_type", { 
    enum: ['empathetic_response', 'engagement_boost', 'upsell_opportunity', 'retention_action', 'emergency_response'] 
  }).notNull(),
  priority: varchar("priority", { enum: ['low', 'medium', 'high', 'urgent'] }).default('medium'),
  suggestedResponse: text("suggested_response"),
  responseVariants: jsonb("response_variants").default([]),
  actionItems: jsonb("action_items").default([]),
  expectedOutcome: text("expected_outcome"),
  confidenceScore: decimal("confidence_score", { precision: 5, scale: 2 }).notNull(),
  emotionalContext: jsonb("emotional_context").notNull(),
  personalizationTags: jsonb("personalization_tags").default([]),
  used: boolean("used").default(false),
  effectiveness: decimal("effectiveness", { precision: 5, scale: 2 }),
  userFeedback: text("user_feedback"),
  createdAt: timestamp("created_at").defaultNow(),
  usedAt: timestamp("used_at"),
});

export const emotionalAnalysesRelations = relations(emotionalAnalyses, ({ one }) => ({
  user: one(users, {
    fields: [emotionalAnalyses.userId],
    references: [users.id],
  }),
  creator: one(users, {
    fields: [emotionalAnalyses.creatorId],
    references: [users.id],
  }),
}));

export const moodProfilesRelations = relations(moodProfiles, ({ one }) => ({
  user: one(users, {
    fields: [moodProfiles.userId],
    references: [users.id],
  }),
  creator: one(users, {
    fields: [moodProfiles.creatorId],
    references: [users.id],
  }),
}));

export const responseRecommendationsRelations = relations(responseRecommendations, ({ one }) => ({
  analysis: one(emotionalAnalyses, {
    fields: [responseRecommendations.analysisId],
    references: [emotionalAnalyses.id],
  }),
  user: one(users, {
    fields: [responseRecommendations.userId],
    references: [users.id],
  }),
  creator: one(users, {
    fields: [responseRecommendations.creatorId],
    references: [users.id],
  }),
}));