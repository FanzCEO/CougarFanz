import { db } from "./db";
import { 
  notifications, notificationPreferences, users,
  type InsertNotification, type Notification
} from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";

// WebSocket connection manager
export class WebSocketManager {
  private connections: Map<string, Set<any>> = new Map();

  addConnection(userId: string, ws: any) {
    if (!this.connections.has(userId)) {
      this.connections.set(userId, new Set());
    }
    this.connections.get(userId)!.add(ws);
  }

  removeConnection(userId: string, ws: any) {
    const userConnections = this.connections.get(userId);
    if (userConnections) {
      userConnections.delete(ws);
      if (userConnections.size === 0) {
        this.connections.delete(userId);
      }
    }
  }

  sendToUser(userId: string, data: any) {
    const userConnections = this.connections.get(userId);
    if (userConnections) {
      const message = JSON.stringify(data);
      userConnections.forEach(ws => {
        if (ws.readyState === 1) { // OPEN
          ws.send(message);
        }
      });
    }
  }

  broadcast(data: any) {
    const message = JSON.stringify(data);
    this.connections.forEach(userConnections => {
      userConnections.forEach(ws => {
        if (ws.readyState === 1) {
          ws.send(message);
        }
      });
    });
  }
}

export const wsManager = new WebSocketManager();

export class NotificationService {
  
  // Create a new notification
  async createNotification(data: InsertNotification): Promise<Notification> {
    // Check user preferences
    const prefs = await this.getUserPreferences(data.userId);
    if (!this.shouldSendNotification(data.type, prefs)) {
      // User has disabled this notification type - still create but don't push
      const [notification] = await db.insert(notifications).values(data).returning();
      return notification;
    }

    // Create notification in database
    const [notification] = await db.insert(notifications).values(data).returning();

    // Send real-time WebSocket notification
    wsManager.sendToUser(data.userId, {
      type: 'notification',
      notification,
    });

    return notification;
  }

  // Check if notification should be sent based on preferences
  shouldSendNotification(type: string, prefs: any): boolean {
    if (!prefs) return true;

    // Check if currently in quiet hours
    if (prefs.quietHoursStart && prefs.quietHoursEnd) {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      
      // Convert time strings to minutes since midnight
      const [startHour, startMin] = prefs.quietHoursStart.split(':').map(Number);
      const [endHour, endMin] = prefs.quietHoursEnd.split(':').map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      
      // Handle overnight windows (e.g., 22:00 to 08:00)
      const isInQuietHours = startMinutes <= endMinutes
        ? currentMinutes >= startMinutes && currentMinutes <= endMinutes
        : currentMinutes >= startMinutes || currentMinutes <= endMinutes;
      
      if (isInQuietHours) {
        return false; // Don't send during quiet hours
      }
    }

    // Check type-specific preferences
    switch (type) {
      case 'tip': return prefs.tipsEnabled !== false;
      case 'subscription': return prefs.subscriptionsEnabled !== false;
      case 'message': return prefs.messagesEnabled !== false;
      case 'like': return prefs.likesEnabled !== false;
      case 'comment': return prefs.commentsEnabled !== false;
      case 'achievement': return prefs.achievementsEnabled !== false;
      case 'system': return prefs.systemEnabled !== false;
      default: return true;
    }
  }

  // Get user notification preferences
  async getUserPreferences(userId: string) {
    const prefs = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, userId))
      .limit(1);

    return prefs[0] || null;
  }

  // Initialize default preferences for a new user
  async initializePreferences(userId: string) {
    const existing = await this.getUserPreferences(userId);
    if (existing) return existing;

    const [prefs] = await db
      .insert(notificationPreferences)
      .values({ userId })
      .returning();

    return prefs;
  }

  // Update user preferences
  async updatePreferences(userId: string, updates: Partial<any>) {
    await db
      .update(notificationPreferences)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(notificationPreferences.userId, userId));

    return this.getUserPreferences(userId);
  }

  // Get notifications for a user
  async getUserNotifications(userId: string, limit = 50, offset = 0) {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);
  }

  // Get unread notification count
  async getUnreadCount(userId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      ));

    return Number(result[0]?.count || 0);
  }

  // Mark notification as read
  async markAsRead(notificationId: string, userId: string) {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, userId)
      ));
  }

  // Mark all notifications as read
  async markAllAsRead(userId: string) {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      ));
  }

  // Delete a notification
  async deleteNotification(notificationId: string, userId: string) {
    await db
      .delete(notifications)
      .where(and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, userId)
      ));
  }

  // Delete all notifications for a user
  async deleteAllNotifications(userId: string) {
    await db
      .delete(notifications)
      .where(eq(notifications.userId, userId));
  }

  // =============================================================================
  // NOTIFICATION CREATORS (Helper methods)
  // =============================================================================

  async sendTipNotification(recipientId: string, tipperName: string, amount: string, contentId?: string) {
    return this.createNotification({
      userId: recipientId,
      type: 'tip',
      title: `${tipperName} tipped you!`,
      message: `You received a $${amount} tip from ${tipperName}`,
      actionUrl: contentId ? `/content/${contentId}` : undefined,
      metadata: { tipperName, amount, contentId },
    });
  }

  async sendSubscriptionNotification(creatorId: string, fanName: string, fanId: string) {
    return this.createNotification({
      userId: creatorId,
      type: 'subscription',
      title: 'New Subscriber!',
      message: `${fanName} just subscribed to your content`,
      actionUrl: `/profile/${fanId}`,
      metadata: { fanName, fanId },
    });
  }

  async sendMessageNotification(userId: string, senderName: string, senderId: string, preview: string) {
    return this.createNotification({
      userId,
      type: 'message',
      title: `Message from ${senderName}`,
      message: preview,
      actionUrl: `/messages?user=${senderId}`,
      metadata: { senderName, senderId },
    });
  }

  async sendLikeNotification(userId: string, likerName: string, contentId: string) {
    return this.createNotification({
      userId,
      type: 'like',
      title: `${likerName} liked your content`,
      message: `${likerName} liked your post`,
      actionUrl: `/content/${contentId}`,
      metadata: { likerName, contentId },
    });
  }

  async sendAchievementNotification(userId: string, achievementName: string, achievementId: string) {
    return this.createNotification({
      userId,
      type: 'achievement',
      title: 'Achievement Unlocked!',
      message: `You unlocked: ${achievementName}`,
      actionUrl: '/achievements',
      metadata: { achievementName, achievementId },
    });
  }

  async sendMilestoneNotification(userId: string, milestone: string, value: number) {
    return this.createNotification({
      userId,
      type: 'milestone',
      title: `Milestone Reached!`,
      message: `You've reached ${value} ${milestone}!`,
      actionUrl: '/dashboard',
      metadata: { milestone, value },
    });
  }
}

export const notificationService = new NotificationService();
