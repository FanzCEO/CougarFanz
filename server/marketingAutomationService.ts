import { db } from "./db";
import { eq, and, or, gte, lte, inArray, isNull, sql, desc } from "drizzle-orm";
import {
  marketingCampaigns,
  fanSegments,
  fanSegmentMembers,
  campaignExecutions,
  socialPostQueue,
  subscriptions,
  userInteractions,
  tips as tipsTable,
  users,
  distributionJobs,
  socialMediaAccounts,
} from "@shared/schema";
import { notificationService } from "./notificationService";
import { distributionService } from "./distributionService";

/**
 * AI Marketing Automation Service
 * 
 * Provides fan retargeting, automated campaigns, push notifications, and scheduled social posts.
 * Integrates with notification service and distribution service for multi-channel marketing.
 */
class MarketingAutomationService {
  private schedulerInterval: NodeJS.Timeout | null = null;

  /**
   * Initialize the service and start the campaign scheduler
   */
  constructor() {
    this.startScheduler();
  }

  /**
   * Start the campaign scheduler (checks every 60 seconds for due campaigns)
   */
  private startScheduler(): void {
    if (this.schedulerInterval) {
      return; // Already running
    }

    console.log("[Marketing Automation] Scheduler started");
    
    // Run immediately on start
    this.processDueCampaigns().catch(error => {
      console.error("[Marketing Automation] Error in initial campaign processing:", error);
    });

    // Then run every 60 seconds
    this.schedulerInterval = setInterval(() => {
      this.processDueCampaigns().catch(error => {
        console.error("[Marketing Automation] Error processing campaigns:", error);
      });
    }, 60000); // 60 seconds
  }

  /**
   * Process due campaigns and social posts
   */
  private async processDueCampaigns(): Promise<void> {
    const now = new Date();

    // Find active scheduled campaigns that are due and haven't been executed yet
    const dueCampaigns = await db.select()
      .from(marketingCampaigns)
      .where(and(
        eq(marketingCampaigns.status, 'active'),
        eq(marketingCampaigns.trigger, 'scheduled'),
        lte(marketingCampaigns.scheduledFor, now),
        or(
          isNull(marketingCampaigns.lastExecutedAt),
          sql`${marketingCampaigns.lastExecutedAt} < ${marketingCampaigns.scheduledFor}`
        )
      ));

    for (const campaign of dueCampaigns) {
      try {
        // Check execution limits
        if (campaign.maxExecutions && (campaign.executionCount || 0) >= campaign.maxExecutions) {
          await db.update(marketingCampaigns)
            .set({ status: 'completed' })
            .where(eq(marketingCampaigns.id, campaign.id));
          continue;
        }

        // Check end date
        if (campaign.endDate && campaign.endDate < now) {
          await db.update(marketingCampaigns)
            .set({ status: 'completed' })
            .where(eq(marketingCampaigns.id, campaign.id));
          continue;
        }

        await this.executeCampaign(campaign.id);
        
        console.log(`[Marketing Automation] Executed campaign: ${campaign.name}`);
      } catch (error) {
        console.error(`[Marketing Automation] Error executing campaign ${campaign.id}:`, error);
      }
    }

    // Process due social posts
    await this.processDueSocialPosts();
  }

  /**
   * Process due social posts
   */
  private async processDueSocialPosts(): Promise<void> {
    const now = new Date();

    const duePosts = await db.select()
      .from(socialPostQueue)
      .where(and(
        eq(socialPostQueue.status, 'scheduled'),
        lte(socialPostQueue.scheduledFor, now)
      ));

    for (const post of duePosts) {
      try {
        // Mark as posting
        await db.update(socialPostQueue)
          .set({ status: 'posting' })
          .where(eq(socialPostQueue.id, post.id));

        // Get creator's social media accounts
        const platforms = post.platforms as string[];
        let allSuccessful = true;
        let errorMessage = '';

        for (const platform of platforms) {
          try {
            // Find the creator's connected account for this platform
            const [account] = await db.select()
              .from(socialMediaAccounts)
              .where(and(
                eq(socialMediaAccounts.creatorUserId, post.creatorId),
                sql`${socialMediaAccounts.platform} = ${platform}`,
                eq(socialMediaAccounts.status, 'connected')
              ));

            if (!account) {
              console.log(`[Marketing Automation] No connected ${platform} account for creator ${post.creatorId}`);
              allSuccessful = false;
              errorMessage += `No connected ${platform} account. `;
              continue;
            }

            // Create distribution job via distribution service
            const contentId = post.mediaPath ? `marketing_${post.id}` : post.id;
            
            await distributionService.distributeContent(
              contentId,
              post.creatorId,
              {
                platforms: [platform as any],
                caption: post.postContent,
                scheduledFor: undefined,
              }
            );

            console.log(`[Marketing Automation] Created distribution job for ${platform}: ${post.postContent.substring(0, 50)}...`);
          } catch (platformError) {
            console.error(`[Marketing Automation] Error posting to ${platform}:`, platformError);
            allSuccessful = false;
            errorMessage += `${platform} error: ${platformError instanceof Error ? platformError.message : 'Unknown'}. `;
          }
        }

        // Update final status
        if (allSuccessful) {
          await db.update(socialPostQueue)
            .set({ 
              status: 'posted',
              postedAt: new Date()
            })
            .where(eq(socialPostQueue.id, post.id));
          console.log(`[Marketing Automation] Successfully posted to all platforms: ${post.id}`);
        } else {
          await db.update(socialPostQueue)
            .set({ 
              status: 'failed',
              errorMessage: errorMessage.trim()
            })
            .where(eq(socialPostQueue.id, post.id));
          console.log(`[Marketing Automation] Partial failure posting: ${post.id} - ${errorMessage}`);
        }
      } catch (error) {
        console.error(`[Marketing Automation] Error processing social post ${post.id}:`, error);
        await db.update(socialPostQueue)
          .set({ 
            status: 'failed',
            errorMessage: error instanceof Error ? error.message : 'Unknown error'
          })
          .where(eq(socialPostQueue.id, post.id));
      }
    }
  }

  // ==========================================================================
  // CAMPAIGN MANAGEMENT
  // ==========================================================================

  /**
   * Create a new marketing campaign
   */
  async createCampaign(
    creatorId: string,
    data: {
      name: string;
      type: 'push_notification' | 'email' | 'social_post' | 'retargeting' | 'automated';
      trigger: string;
      triggerConditions?: any;
      targetSegmentId?: string;
      targetAllFans?: boolean;
      messageTemplate: string;
      subject?: string;
      mediaPath?: string;
      ctaText?: string;
      ctaUrl?: string;
      scheduledFor?: Date;
      startDate?: Date;
      endDate?: Date;
      maxExecutions?: number;
    }
  ) {
    const [campaign] = await db.insert(marketingCampaigns)
      .values({
        creatorId,
        name: data.name,
        type: data.type,
        trigger: data.trigger,
        triggerConditions: data.triggerConditions,
        targetSegmentId: data.targetSegmentId,
        targetAllFans: data.targetAllFans,
        messageTemplate: data.messageTemplate,
        subject: data.subject,
        mediaPath: data.mediaPath,
        ctaText: data.ctaText,
        ctaUrl: data.ctaUrl,
        scheduledFor: data.scheduledFor,
        startDate: data.startDate,
        endDate: data.endDate,
        maxExecutions: data.maxExecutions,
      })
      .returning();

    return campaign;
  }

  /**
   * Activate a campaign
   */
  async activateCampaign(campaignId: string, creatorId: string) {
    const [campaign] = await db.select()
      .from(marketingCampaigns)
      .where(eq(marketingCampaigns.id, campaignId));

    if (!campaign) {
      throw new Error("Campaign not found");
    }

    if (campaign.creatorId !== creatorId) {
      throw new Error("Unauthorized");
    }

    await db.update(marketingCampaigns)
      .set({ status: 'active' })
      .where(eq(marketingCampaigns.id, campaignId));

    // Execute immediately if manual trigger
    if (campaign.trigger === 'manual') {
      await this.executeCampaign(campaignId);
    }

    return { success: true };
  }

  /**
   * Pause a campaign
   */
  async pauseCampaign(campaignId: string, creatorId: string) {
    const [campaign] = await db.select()
      .from(marketingCampaigns)
      .where(eq(marketingCampaigns.id, campaignId));

    if (!campaign) {
      throw new Error("Campaign not found");
    }

    if (campaign.creatorId !== creatorId) {
      throw new Error("Unauthorized");
    }

    await db.update(marketingCampaigns)
      .set({ status: 'paused' })
      .where(eq(marketingCampaigns.id, campaignId));

    return { success: true };
  }

  /**
   * Execute a campaign (send to recipients)
   */
  async executeCampaign(campaignId: string): Promise<void> {
    const [campaign] = await db.select()
      .from(marketingCampaigns)
      .where(eq(marketingCampaigns.id, campaignId));

    if (!campaign) {
      throw new Error("Campaign not found");
    }

    // Get target recipients
    const recipients = await this.getCampaignRecipients(campaign);

    let sentCount = 0;

    // Send to each recipient
    for (const recipient of recipients) {
      try {
        // Queue execution
        const [execution] = await db.insert(campaignExecutions)
          .values({
            campaignId,
            recipientId: recipient.id,
            status: 'queued',
          })
          .returning();

        // Send based on campaign type
        switch (campaign.type) {
          case 'push_notification':
            await this.sendPushNotification(campaign, recipient, execution.id);
            break;
          case 'email':
            // TODO: Integrate with email service
            console.log(`[Marketing Automation] Would send email to ${recipient.email}`);
            break;
          case 'social_post':
            // Already handled by social post queue
            break;
        }

        sentCount++;

        // Update execution status
        await db.update(campaignExecutions)
          .set({ 
            status: 'sent',
            deliveredAt: new Date()
          })
          .where(eq(campaignExecutions.id, execution.id));

      } catch (error) {
        console.error(`[Marketing Automation] Error sending to recipient ${recipient.id}:`, error);
      }
    }

    // Update campaign stats
    await db.update(marketingCampaigns)
      .set({
        executionCount: sql`${marketingCampaigns.executionCount} + 1`,
        lastExecutedAt: new Date(),
        totalSent: sql`${marketingCampaigns.totalSent} + ${sentCount}`,
      })
      .where(eq(marketingCampaigns.id, campaignId));
  }

  /**
   * Get campaign recipients based on targeting
   */
  private async getCampaignRecipients(campaign: any): Promise<any[]> {
    if (campaign.targetAllFans) {
      // Get all fans of this creator (subscribers)
      const subs = await db.select({ fanId: subscriptions.fanId })
        .from(subscriptions)
        .where(and(
          eq(subscriptions.creatorId, campaign.creatorId),
          eq(subscriptions.status, 'active')
        ));

      const fanIds = subs.map(s => s.fanId);
      
      if (fanIds.length === 0) return [];

      return await db.select()
        .from(users)
        .where(inArray(users.id, fanIds));
    } else if (campaign.targetSegmentId) {
      // Get fans in the segment
      const members = await db.select()
        .from(fanSegmentMembers)
        .innerJoin(users, eq(fanSegmentMembers.fanId, users.id))
        .where(eq(fanSegmentMembers.segmentId, campaign.targetSegmentId));

      return members.map(m => m.users);
    }

    return [];
  }

  /**
   * Send push notification via notification service
   */
  private async sendPushNotification(campaign: any, recipient: any, executionId: string): Promise<void> {
    await notificationService.createNotification({
      userId: recipient.id,
      type: 'system',
      title: campaign.subject || 'New Message',
      message: campaign.messageTemplate,
      actionUrl: campaign.ctaUrl,
      metadata: {
        campaignId: campaign.id,
        executionId,
      },
    });
  }

  /**
   * Get campaign analytics
   */
  async getCampaignAnalytics(campaignId: string, creatorId: string) {
    const [campaign] = await db.select()
      .from(marketingCampaigns)
      .where(eq(marketingCampaigns.id, campaignId));

    if (!campaign) {
      throw new Error("Campaign not found");
    }

    if (campaign.creatorId !== creatorId) {
      throw new Error("Unauthorized");
    }

    // Get execution stats
    const executions = await db.select()
      .from(campaignExecutions)
      .where(eq(campaignExecutions.campaignId, campaignId));

    const stats = {
      totalSent: executions.length,
      delivered: executions.filter(e => e.status === 'delivered' || e.status === 'opened' || e.status === 'clicked' || e.status === 'converted').length,
      opened: executions.filter(e => e.status === 'opened' || e.status === 'clicked' || e.status === 'converted').length,
      clicked: executions.filter(e => e.status === 'clicked' || e.status === 'converted').length,
      converted: executions.filter(e => e.status === 'converted').length,
      failed: executions.filter(e => e.status === 'failed').length,
      bounced: executions.filter(e => e.status === 'bounced').length,
      deliveryRate: executions.length > 0 ? (executions.filter(e => e.status !== 'failed' && e.status !== 'bounced').length / executions.length * 100).toFixed(2) : '0.00',
      openRate: executions.length > 0 ? (executions.filter(e => e.status === 'opened' || e.status === 'clicked' || e.status === 'converted').length / executions.length * 100).toFixed(2) : '0.00',
      clickRate: executions.length > 0 ? (executions.filter(e => e.status === 'clicked' || e.status === 'converted').length / executions.length * 100).toFixed(2) : '0.00',
      conversionRate: executions.length > 0 ? (executions.filter(e => e.status === 'converted').length / executions.length * 100).toFixed(2) : '0.00',
    };

    return {
      campaign,
      stats,
      executions: executions.slice(0, 100), // Recent 100
    };
  }

  // ==========================================================================
  // FAN SEGMENT MANAGEMENT
  // ==========================================================================

  /**
   * Create a fan segment
   */
  async createSegment(
    creatorId: string,
    data: {
      name: string;
      description?: string;
      segmentType: 'manual' | 'auto_rule' | 'behavioral' | 'demographic';
      rules?: any;
    }
  ) {
    const [segment] = await db.insert(fanSegments)
      .values({
        creatorId,
        ...data,
      })
      .returning();

    // Calculate membership for auto segments
    if (data.segmentType !== 'manual') {
      await this.recalculateSegment(segment.id);
    }

    return segment;
  }

  /**
   * Add fan to segment manually
   */
  async addFanToSegment(segmentId: string, fanId: string, creatorId: string) {
    // Verify segment ownership
    const [segment] = await db.select()
      .from(fanSegments)
      .where(eq(fanSegments.id, segmentId));

    if (!segment) {
      throw new Error("Segment not found");
    }

    if (segment.creatorId !== creatorId) {
      throw new Error("Unauthorized");
    }

    // Add to segment
    await db.insert(fanSegmentMembers)
      .values({
        segmentId,
        fanId,
      })
      .onConflictDoNothing();

    // Update count
    await this.updateSegmentCount(segmentId);

    return { success: true };
  }

  /**
   * Remove fan from segment
   */
  async removeFanFromSegment(segmentId: string, fanId: string, creatorId: string) {
    // Verify segment ownership
    const [segment] = await db.select()
      .from(fanSegments)
      .where(eq(fanSegments.id, segmentId));

    if (!segment) {
      throw new Error("Segment not found");
    }

    if (segment.creatorId !== creatorId) {
      throw new Error("Unauthorized");
    }

    await db.delete(fanSegmentMembers)
      .where(and(
        eq(fanSegmentMembers.segmentId, segmentId),
        eq(fanSegmentMembers.fanId, fanId)
      ));

    // Update count
    await this.updateSegmentCount(segmentId);

    return { success: true };
  }

  /**
   * Recalculate segment membership based on rules
   */
  async recalculateSegment(segmentId: string): Promise<void> {
    const [segment] = await db.select()
      .from(fanSegments)
      .where(eq(fanSegments.id, segmentId));

    if (!segment || segment.segmentType === 'manual') {
      return;
    }

    // Clear existing members for auto segments
    await db.delete(fanSegmentMembers)
      .where(eq(fanSegmentMembers.segmentId, segmentId));

    const rules = segment.rules as any || {};

    // Get all subscribers of this creator
    const subs = await db.select()
      .from(subscriptions)
      .where(and(
        eq(subscriptions.creatorId, segment.creatorId),
        eq(subscriptions.status, 'active')
      ));

    const qualifiedFans: string[] = [];

    for (const sub of subs) {
      let qualifies = true;

      // Check subscription tier rule
      if (rules.subscription_tier && Array.isArray(rules.subscription_tier)) {
        if (!rules.subscription_tier.includes(sub.tier)) {
          qualifies = false;
        }
      }

      // Check total spent rule
      if (rules.total_spent && qualifies) {
        const tipsData = await db.select()
          .from(tipsTable)
          .where(and(
            eq(tipsTable.fromUserId, sub.fanId),
            eq(tipsTable.toUserId, segment.creatorId),
            eq(tipsTable.status, 'completed')
          ));

        const totalSpent = tipsData.reduce((sum: number, tip: any) => sum + parseFloat(tip.amount.toString()), 0);

        if (rules.total_spent.gte && totalSpent < rules.total_spent.gte) {
          qualifies = false;
        }
        if (rules.total_spent.lte && totalSpent > rules.total_spent.lte) {
          qualifies = false;
        }
      }

      // Check inactivity rule (days since last interaction)
      if (rules.inactivity_days && qualifies) {
        const recentInteractions = await db.select()
          .from(userInteractions)
          .where(eq(userInteractions.userId, sub.fanId))
          .orderBy(desc(userInteractions.createdAt))
          .limit(1);

        if (recentInteractions.length > 0 && recentInteractions[0]) {
          const daysSinceLastInteraction = Math.floor(
            (Date.now() - recentInteractions[0].createdAt.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (rules.inactivity_days.gte && daysSinceLastInteraction < rules.inactivity_days.gte) {
            qualifies = false;
          }
        }
      }

      if (qualifies) {
        qualifiedFans.push(sub.fanId);
      }
    }

    // Add qualified fans to segment
    if (qualifiedFans.length > 0) {
      await db.insert(fanSegmentMembers)
        .values(qualifiedFans.map(fanId => ({
          segmentId,
          fanId,
        })))
        .onConflictDoNothing();
    }

    // Update segment stats
    await db.update(fanSegments)
      .set({
        fanCount: qualifiedFans.length,
        lastRecalculatedAt: new Date(),
      })
      .where(eq(fanSegments.id, segmentId));
  }

  /**
   * Update segment fan count
   */
  private async updateSegmentCount(segmentId: string): Promise<void> {
    const members = await db.select()
      .from(fanSegmentMembers)
      .where(eq(fanSegmentMembers.segmentId, segmentId));

    await db.update(fanSegments)
      .set({ fanCount: members.length })
      .where(eq(fanSegments.id, segmentId));
  }

  /**
   * Get creator segments
   */
  async getCreatorSegments(creatorId: string) {
    return await db.select()
      .from(fanSegments)
      .where(and(
        eq(fanSegments.creatorId, creatorId),
        eq(fanSegments.isActive, true)
      ));
  }

  /**
   * Get segment members
   */
  async getSegmentMembers(segmentId: string, creatorId: string) {
    // Verify ownership
    const [segment] = await db.select()
      .from(fanSegments)
      .where(eq(fanSegments.id, segmentId));

    if (!segment) {
      throw new Error("Segment not found");
    }

    if (segment.creatorId !== creatorId) {
      throw new Error("Unauthorized");
    }

    const members = await db.select()
      .from(fanSegmentMembers)
      .innerJoin(users, eq(fanSegmentMembers.fanId, users.id))
      .where(eq(fanSegmentMembers.segmentId, segmentId));

    return members.map(m => m.users);
  }

  // ==========================================================================
  // SOCIAL POST QUEUE
  // ==========================================================================

  /**
   * Schedule a social media post
   */
  async scheduleSocialPost(
    creatorId: string,
    data: {
      platforms: string[];
      postContent: string;
      mediaPath?: string;
      scheduledFor: Date;
      campaignId?: string;
    }
  ) {
    const [post] = await db.insert(socialPostQueue)
      .values({
        creatorId,
        ...data,
        platforms: data.platforms,
      })
      .returning();

    return post;
  }

  /**
   * Cancel scheduled social post
   */
  async cancelSocialPost(postId: string, creatorId: string) {
    const [post] = await db.select()
      .from(socialPostQueue)
      .where(eq(socialPostQueue.id, postId));

    if (!post) {
      throw new Error("Post not found");
    }

    if (post.creatorId !== creatorId) {
      throw new Error("Unauthorized");
    }

    if (post.status !== 'scheduled' && post.status !== 'queued') {
      throw new Error("Cannot cancel post in current status");
    }

    await db.update(socialPostQueue)
      .set({ status: 'cancelled' })
      .where(eq(socialPostQueue.id, postId));

    return { success: true };
  }

  /**
   * Get creator's scheduled posts
   */
  async getScheduledPosts(creatorId: string) {
    return await db.select()
      .from(socialPostQueue)
      .where(and(
        eq(socialPostQueue.creatorId, creatorId),
        inArray(socialPostQueue.status, ['scheduled', 'queued'])
      ))
      .orderBy(socialPostQueue.scheduledFor);
  }
}

export const marketingAutomationService = new MarketingAutomationService();
