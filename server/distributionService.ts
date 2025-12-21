import { nanoid } from 'nanoid';
import { db } from './db';
import {
  socialMediaAccounts,
  distributionJobs,
  qrCodes,
  smartLinks,
  content,
  type SocialMediaAccount,
  type DistributionJob,
  type QrCode,
  type SmartLink,
} from '@shared/schema';
import { eq, and, desc, lte, or } from 'drizzle-orm';

/**
 * Multi-Platform Distribution Service
 * 
 * Handles:
 * - Social media account management
 * - Content distribution to external platforms
 * - QR code generation for content sharing
 * - Smart link creation and analytics
 * 
 * Integration Points:
 * - Platform OAuth: Implement OAuth flows for each platform
 * - Platform APIs: Integrate with Twitter, Instagram, TikTok, etc.
 * - QR Generation: Integrate QR code generation library (e.g., qrcode)
 * - Link Shortening: Implement short code generation and redirect logic
 */

export interface DistributionOptions {
  caption?: string;
  scheduledFor?: Date;
  platforms?: string[];
  mediaUrls?: string[];
}

export interface QRCodeOptions {
  size?: number;
  foregroundColor?: string;
  backgroundColor?: string;
  logo?: string;
}

export interface SmartLinkOptions {
  title?: string;
  description?: string;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

class DistributionService {
  private schedulerInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Start scheduler for scheduled distribution jobs
    this.startScheduler();
  }

  /**
   * Start the scheduler to process scheduled distribution jobs
   */
  private startScheduler(): void {
    // Check for scheduled jobs every minute
    this.schedulerInterval = setInterval(async () => {
      try {
        await this.processScheduledJobs();
      } catch (error) {
        console.error('Error processing scheduled jobs:', error);
      }
    }, 60000); // Every 60 seconds

    console.log('[Distribution Service] Scheduler started');
  }

  /**
   * Process scheduled distribution jobs that are due
   */
  private async processScheduledJobs(): Promise<void> {
    const now = new Date();
    
    // Find scheduled jobs that are due
    const dueJobs = await db.select()
      .from(distributionJobs)
      .where(and(
        eq(distributionJobs.status, 'scheduled'),
        lte(distributionJobs.scheduledFor, now)
      ));

    console.log(`[Distribution Service] Found ${dueJobs.length} scheduled jobs due for processing`);

    // Process each due job
    for (const job of dueJobs) {
      // Update to queued first to prevent duplicate processing
      await db.update(distributionJobs)
        .set({ status: 'queued', updatedAt: new Date() })
        .where(eq(distributionJobs.id, job.id));

      // Process the job in background
      this.processDistributionJob(job.id).catch(err => {
        console.error(`Failed to process scheduled job ${job.id}:`, err);
      });
    }
  }

  /**
   * Stop the scheduler (for cleanup)
   */
  stopScheduler(): void {
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
      this.schedulerInterval = null;
      console.log('[Distribution Service] Scheduler stopped');
    }
  }

  /**
   * Connect a social media account for a creator
   * TODO: Implement OAuth flow for each platform
   * 
   * SECURITY WARNING: Token encryption must be implemented before production!
   * Current implementation stores tokens in plaintext which is a critical security risk.
   * Required steps:
   * 1. Use libsodium/AES-GCM or similar for at-rest encryption
   * 2. Source encryption keys from environment variables or KMS
   * 3. Implement secure token rotation and refresh logic
   * 4. Add token revocation via platform APIs on disconnect
   */
  async connectAccount(
    creatorUserId: string,
    platform: string,
    credentials: {
      platformUserId?: string;
      platformUsername?: string;
      accessToken: string;
      refreshToken?: string;
      tokenExpiresAt?: Date;
    }
  ): Promise<SocialMediaAccount> {
    // TODO: Validate credentials with platform API
    // TODO: CRITICAL - Encrypt access and refresh tokens before storage
    
    const [account] = await db.insert(socialMediaAccounts)
      .values({
        creatorUserId,
        platform,
        platformUserId: credentials.platformUserId,
        platformUsername: credentials.platformUsername,
        accessToken: credentials.accessToken, // TODO: Encrypt
        refreshToken: credentials.refreshToken, // TODO: Encrypt
        tokenExpiresAt: credentials.tokenExpiresAt,
        status: 'connected',
        lastSyncAt: new Date(),
        metadata: {},
      })
      .returning();

    return account;
  }

  /**
   * Disconnect a social media account
   */
  async disconnectAccount(accountId: string, creatorUserId: string): Promise<boolean> {
    // TODO: Revoke tokens with platform API
    
    const result = await db.update(socialMediaAccounts)
      .set({ 
        status: 'revoked',
        updatedAt: new Date(),
      })
      .where(and(
        eq(socialMediaAccounts.id, accountId),
        eq(socialMediaAccounts.creatorUserId, creatorUserId)
      ))
      .returning();

    return result.length > 0;
  }

  /**
   * Get all connected accounts for a creator
   */
  async getConnectedAccounts(creatorUserId: string): Promise<SocialMediaAccount[]> {
    return db.select()
      .from(socialMediaAccounts)
      .where(eq(socialMediaAccounts.creatorUserId, creatorUserId))
      .orderBy(desc(socialMediaAccounts.createdAt));
  }

  /**
   * Distribute content to selected platforms
   */
  async distributeContent(
    contentId: string,
    creatorUserId: string,
    options: DistributionOptions
  ): Promise<DistributionJob[]> {
    // Get content details
    const [contentItem] = await db.select()
      .from(content)
      .where(and(
        eq(content.id, contentId),
        eq(content.creatorUserId, creatorUserId)
      ));

    if (!contentItem) {
      throw new Error('Content not found or access denied');
    }

    // Get connected accounts
    const accounts = await this.getConnectedAccounts(creatorUserId);
    const activeAccounts = accounts.filter(acc => acc.status === 'connected');

    if (activeAccounts.length === 0) {
      throw new Error('No connected social media accounts found');
    }

    // Filter by requested platforms if specified
    const targetAccounts = options.platforms
      ? activeAccounts.filter(acc => options.platforms!.includes(acc.platform))
      : activeAccounts;

    if (targetAccounts.length === 0) {
      throw new Error('No matching platforms found');
    }

    // Create distribution jobs for each platform
    const jobs: DistributionJob[] = [];
    for (const account of targetAccounts) {
      const [job] = await db.insert(distributionJobs)
        .values({
          contentId,
          creatorUserId,
          socialMediaAccountId: account.id,
          platform: account.platform,
          status: options.scheduledFor ? 'scheduled' : 'queued',
          scheduledFor: options.scheduledFor,
          metadata: {
            caption: options.caption || contentItem.caption,
            mediaUrls: options.mediaUrls || [],
          },
        })
        .returning();

      jobs.push(job);

      // If not scheduled, process immediately
      if (!options.scheduledFor) {
        // Don't await - process in background
        this.processDistributionJob(job.id).catch(err => {
          console.error(`Failed to process distribution job ${job.id}:`, err);
        });
      }
    }

    return jobs;
  }

  /**
   * Process a distribution job
   * TODO: Implement actual platform posting logic
   */
  private async processDistributionJob(jobId: string): Promise<void> {
    // Update status to processing
    await db.update(distributionJobs)
      .set({ status: 'processing', updatedAt: new Date() })
      .where(eq(distributionJobs.id, jobId));

    try {
      const [job] = await db.select()
        .from(distributionJobs)
        .where(eq(distributionJobs.id, jobId));

      if (!job) {
        throw new Error('Job not found');
      }

      const [account] = await db.select()
        .from(socialMediaAccounts)
        .where(eq(socialMediaAccounts.id, job.socialMediaAccountId));

      if (!account) {
        throw new Error('Account not found');
      }

      // TODO: Implement platform-specific posting logic
      const platformPostId = await this.postToPlatform(account, job);

      // Update job as published
      await db.update(distributionJobs)
        .set({
          status: 'published',
          publishedAt: new Date(),
          platformPostId,
          platformUrl: this.getPlatformUrl(account.platform, platformPostId),
          updatedAt: new Date(),
        })
        .where(eq(distributionJobs.id, jobId));
    } catch (error) {
      // Update job as failed
      // Get current retry count
      const [currentJob] = await db.select()
        .from(distributionJobs)
        .where(eq(distributionJobs.id, jobId));

      await db.update(distributionJobs)
        .set({
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          retryCount: (currentJob?.retryCount || 0) + 1,
          updatedAt: new Date(),
        })
        .where(eq(distributionJobs.id, jobId));

      throw error;
    }
  }

  /**
   * Post content to a specific platform
   * TODO: Implement actual API calls for each platform
   */
  private async postToPlatform(
    account: SocialMediaAccount,
    job: DistributionJob
  ): Promise<string> {
    const metadata = job.metadata as any;
    const caption = metadata?.caption || '';
    const mediaUrls = metadata?.mediaUrls || [];

    // TODO: Implement platform-specific logic
    switch (account.platform) {
      case 'twitter':
        // TODO: Use Twitter API v2 to post tweet
        return `mock_tweet_${nanoid(8)}`;
      
      case 'instagram':
        // TODO: Use Instagram Graph API to post
        return `mock_insta_${nanoid(8)}`;
      
      case 'tiktok':
        // TODO: Use TikTok API to post
        return `mock_tiktok_${nanoid(8)}`;
      
      case 'onlyfans':
        // TODO: Use OnlyFans API to post
        return `mock_of_${nanoid(8)}`;
      
      case 'fansly':
        // TODO: Use Fansly API to post
        return `mock_fansly_${nanoid(8)}`;
      
      case 'reddit':
        // TODO: Use Reddit API to post
        return `mock_reddit_${nanoid(8)}`;
      
      default:
        throw new Error(`Unsupported platform: ${account.platform}`);
    }
  }

  /**
   * Get platform-specific URL for a post
   */
  private getPlatformUrl(platform: string, postId: string): string {
    // TODO: Generate actual platform URLs
    const urlMap: Record<string, string> = {
      twitter: `https://twitter.com/i/status/${postId}`,
      instagram: `https://instagram.com/p/${postId}`,
      tiktok: `https://tiktok.com/@user/video/${postId}`,
      onlyfans: `https://onlyfans.com/post/${postId}`,
      fansly: `https://fansly.com/post/${postId}`,
      reddit: `https://reddit.com/comments/${postId}`,
    };

    return urlMap[platform] || `https://${platform}.com/${postId}`;
  }

  /**
   * Get distribution jobs for content
   */
  async getContentDistributionJobs(
    contentId: string,
    creatorUserId: string
  ): Promise<DistributionJob[]> {
    return db.select()
      .from(distributionJobs)
      .where(and(
        eq(distributionJobs.contentId, contentId),
        eq(distributionJobs.creatorUserId, creatorUserId)
      ))
      .orderBy(desc(distributionJobs.createdAt));
  }

  /**
   * Cancel a distribution job
   */
  async cancelDistributionJob(jobId: string, creatorUserId: string): Promise<boolean> {
    const result = await db.update(distributionJobs)
      .set({
        status: 'cancelled',
        updatedAt: new Date(),
      })
      .where(and(
        eq(distributionJobs.id, jobId),
        eq(distributionJobs.creatorUserId, creatorUserId),
        or(
          eq(distributionJobs.status, 'queued'),
          eq(distributionJobs.status, 'scheduled')
        )
      ))
      .returning();

    return result.length > 0;
  }

  /**
   * Generate QR code for content
   * TODO: Implement actual QR code generation
   */
  async generateQRCode(
    creatorUserId: string,
    targetType: 'content' | 'profile' | 'subscription' | 'custom',
    targetUrl: string,
    contentId?: string,
    options: QRCodeOptions = {}
  ): Promise<QrCode> {
    // TODO: Generate QR code image using qrcode library
    // TODO: Upload to object storage
    // TODO: Apply branding/styling from options
    
    const qrCodeImagePath = `/qr-codes/${nanoid()}.png`; // Mock path

    const [qrCode] = await db.insert(qrCodes)
      .values({
        creatorUserId,
        contentId,
        targetType,
        targetUrl,
        qrCodeImagePath,
        metadata: options,
      })
      .returning();

    return qrCode;
  }

  /**
   * Track QR code scan
   */
  async trackQRCodeScan(qrCodeId: string): Promise<void> {
    // Get current count
    const [currentQR] = await db.select()
      .from(qrCodes)
      .where(eq(qrCodes.id, qrCodeId));

    if (currentQR) {
      await db.update(qrCodes)
        .set({
          scanCount: (currentQR.scanCount || 0) + 1,
          lastScannedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(qrCodes.id, qrCodeId));
    }
  }

  /**
   * Get QR codes for creator
   */
  async getCreatorQRCodes(creatorUserId: string): Promise<QrCode[]> {
    return db.select()
      .from(qrCodes)
      .where(eq(qrCodes.creatorUserId, creatorUserId))
      .orderBy(desc(qrCodes.createdAt));
  }

  /**
   * Create smart link
   */
  async createSmartLink(
    creatorUserId: string,
    targetUrl: string,
    contentId?: string,
    options: SmartLinkOptions = {}
  ): Promise<SmartLink> {
    const shortCode = nanoid(8);

    const [link] = await db.insert(smartLinks)
      .values({
        creatorUserId,
        contentId,
        shortCode,
        targetUrl,
        title: options.title,
        description: options.description,
        expiresAt: options.expiresAt,
        metadata: options.metadata || {},
      })
      .returning();

    return link;
  }

  /**
   * Track smart link click
   */
  async trackLinkClick(shortCode: string, uniqueVisitor: boolean = false): Promise<SmartLink | null> {
    const [link] = await db.select()
      .from(smartLinks)
      .where(eq(smartLinks.shortCode, shortCode));

    if (!link) {
      return null;
    }

    // Check if expired
    if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
      await db.update(smartLinks)
        .set({ status: 'expired', updatedAt: new Date() })
        .where(eq(smartLinks.id, link.id));
      return null;
    }

    // Update click counts
    await db.update(smartLinks)
      .set({
        clickCount: (link.clickCount || 0) + 1,
        uniqueClickCount: uniqueVisitor ? (link.uniqueClickCount || 0) + 1 : link.uniqueClickCount,
        lastClickedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(smartLinks.id, link.id));

    return link;
  }

  /**
   * Get smart links for creator
   */
  async getCreatorSmartLinks(creatorUserId: string): Promise<SmartLink[]> {
    return db.select()
      .from(smartLinks)
      .where(eq(smartLinks.creatorUserId, creatorUserId))
      .orderBy(desc(smartLinks.createdAt));
  }

  /**
   * Get smart link analytics
   */
  async getSmartLinkAnalytics(linkId: string, creatorUserId: string): Promise<SmartLink | null> {
    const [link] = await db.select()
      .from(smartLinks)
      .where(and(
        eq(smartLinks.id, linkId),
        eq(smartLinks.creatorUserId, creatorUserId)
      ));

    return link || null;
  }
}

export const distributionService = new DistributionService();
