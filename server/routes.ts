import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { z } from "zod";
import { storage } from "./storage";
import { db } from "./db";
import { users, coStarVerifications, kycVerifications, content } from "@shared/schema";
import { eq, and, or, desc } from "drizzle-orm";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { ObjectPermission } from "./objectAcl";
import { recommendationEngine } from "./recommendationEngine";
import { creatorAnalytics } from "./creatorAnalytics";
import { gamificationService } from "./gamificationService";
import { notificationService, wsManager } from "./notificationService";
import { aiModerationService } from "./aiModerationService";
import { communityModerationService } from "./communityModerationService";
import { aiContentProcessingService } from "./aiContentProcessingService";
import { distributionService } from "./distributionService";
import { liveStreamService } from "./liveStreamService";
import { marketingAutomationService } from "./marketingAutomationService";
import { blockchainService } from "./blockchainService";
import { voiceCloningService } from "./voiceCloningService";
import { holographicStreamingService } from "./holographicStreamingService";
import { dynamicPricingService } from "./dynamicPricingService";
import { microlendingService } from "./microlendingService";
import { deepfakeDetectionService } from "./deepfakeDetectionService";
import { emotionalAIService } from "./emotionalAIService";
import { 
  insertUserSchema, 
  insertProfileSchema, 
  insertMediaAssetSchema, 
  insertTipSchema, 
  insertMessageSchema, 
  insertConsentRecordSchema, 
  insertSafetyReportSchema,
  insertCommunityVoteSchema,
  insertContentSchema,
  insertContentTenantMapSchema,
  insertSubscriptionPlanSchema,
  insertSocialMediaAccountSchema,
  insertDistributionJobSchema,
  insertQrCodeSchema,
  insertSmartLinkSchema,
  insertNftCollectionSchema,
  insertNftSchema,
  insertPackSchema,
  insertPackMemberSchema,
} from "@shared/schema";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "temp-dev-secret-key-64-chars-minimum-replace-in-production-env";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', async (req: any, res) => {
    try {
      // Check if user is authenticated
      if (!req.user || !req.user.claims || !req.user.claims.sub) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const profile = await storage.getProfile(userId);
      res.json({ ...user, profile });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Local authentication routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      // Check if email already exists
      const existingEmailUser = await storage.getUserByEmail(validatedData.email!);
      if (existingEmailUser) {
        return res.status(409).json({ 
          message: "Email already registered", 
          field: "email" 
        });
      }

      // Check if username already exists (if provided)
      if (validatedData.username) {
        const existingUsernameUser = await storage.getUserByUsername(validatedData.username);
        if (existingUsernameUser) {
          return res.status(409).json({ 
            message: "Username already taken", 
            field: "username" 
          });
        }
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(validatedData.password!, 10);
      
      // Create user
      const user = await storage.createUser({
        ...validatedData,
        password: hashedPassword,
        authProvider: 'local',
        status: 'pending', // Requires age verification
      });

      // Generate JWT
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
      
      res.json({ user: { ...user, password: undefined }, token });
    } catch (error) {
      console.error("Registration error:", error);
      
      // Handle database constraint errors specifically
      if (error && typeof error === 'object' && 'code' in error) {
        const dbError = error as any; // PostgreSQL error object
        if (dbError.code === '23505') { // Unique constraint violation
          if (dbError.detail?.includes('username')) {
            return res.status(409).json({ 
              message: "Username already taken", 
              field: "username" 
            });
          }
          if (dbError.detail?.includes('email')) {
            return res.status(409).json({ 
              message: "Email already registered", 
              field: "email" 
            });
          }
        }
      }
      
      // Handle Zod validation errors
      if (error && typeof error === 'object' && 'issues' in error) {
        return res.status(400).json({ 
          message: "Invalid registration data", 
          errors: error.issues 
        });
      }
      
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const user = await storage.getUserByEmail(email);
      if (!user || !user.password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
      
      res.json({ user: { ...user, password: undefined }, token });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Profile routes
  app.get('/api/profile/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const user = await storage.getUser(userId);
      const profile = await storage.getProfile(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Match the frontend expected structure
      res.json({ 
        ...user, 
        password: undefined, 
        profile: profile || null 
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.put('/api/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profileData = insertProfileSchema.parse({ ...req.body, userId });
      
      const existingProfile = await storage.getProfile(userId);
      let profile;
      
      if (existingProfile) {
        profile = await storage.updateProfile(userId, profileData);
      } else {
        profile = await storage.createProfile(profileData);
      }
      
      // Return updated user with profile for frontend consistency
      const user = await storage.getUser(userId);
      res.json({ 
        ...user, 
        password: undefined, 
        profile 
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // PACK ROUTES
  app.get('/api/packs', async (req, res) => {
    try {
      const packs = await storage.getAllPacks();
      res.json(packs);
    } catch (error) {
      console.error("Error fetching packs:", error);
      res.status(500).json({ message: "Failed to fetch packs" });
    }
  });

  app.get('/api/packs/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const pack = await storage.getPack(id);
      if (!pack) {
        return res.status(404).json({ message: "Pack not found" });
      }
      res.json(pack);
    } catch (error) {
      console.error("Error fetching pack:", error);
      res.status(500).json({ message: "Failed to fetch pack" });
    }
  });

  app.post('/api/packs', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const packData = insertPackSchema.parse({ ...req.body, creatorId: userId });
      
      const pack = await storage.createPack(packData);
      res.json(pack);
    } catch (error) {
      console.error("Error creating pack:", error);
      res.status(500).json({ message: "Failed to create pack" });
    }
  });

  app.post('/api/packs/:id/join', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id: packId } = req.params;
      
      // Check if already a member
      const isMember = await storage.isPackMember(packId, userId);
      if (isMember) {
        return res.status(400).json({ message: "Already a member of this pack" });
      }
      
      const membership = await storage.joinPack(packId, userId);
      res.json(membership);
    } catch (error) {
      console.error("Error joining pack:", error);
      res.status(500).json({ message: "Failed to join pack" });
    }
  });

  app.post('/api/packs/:id/leave', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id: packId } = req.params;
      
      await storage.leavePack(packId, userId);
      res.json({ message: "Successfully left pack" });
    } catch (error) {
      console.error("Error leaving pack:", error);
      res.status(500).json({ message: "Failed to leave pack" });
    }
  });

  app.get('/api/packs/:id/members', async (req, res) => {
    try {
      const { id: packId } = req.params;
      const members = await storage.getPackMembers(packId);
      res.json(members);
    } catch (error) {
      console.error("Error fetching pack members:", error);
      res.status(500).json({ message: "Failed to fetch pack members" });
    }
  });

  app.get('/api/users/:userId/packs', async (req, res) => {
    try {
      const { userId } = req.params;
      const packs = await storage.getUserPacks(userId);
      res.json(packs);
    } catch (error) {
      console.error("Error fetching user packs:", error);
      res.status(500).json({ message: "Failed to fetch user packs" });
    }
  });

  // ONBOARDING ROUTES
  app.post('/api/onboarding/select-role', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Validate role selection
      const roleSchema = z.object({
        role: z.enum(['creator', 'fan']),
      });
      
      const { role } = roleSchema.parse(req.body);

      await db.update(users).set({ 
        role,
        onboardingStep: 1
        // Don't set status='active' yet - wait for verification
      }).where(eq(users.id, userId));

      res.json({ role, message: "Role selected successfully" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid role. Must be 'creator' or 'fan'",
          errors: error.errors 
        });
      }
      console.error("Error selecting role:", error);
      res.status(500).json({ message: "Failed to select role" });
    }
  });

  app.post('/api/onboarding/update', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Validate onboarding update payload
      const onboardingUpdateSchema = z.object({
        step: z.number().int().min(1).max(10),
        data: z.object({
          displayName: z.string().optional(),
          stageName: z.string().optional(),
          pronouns: z.string().optional(),
          bio: z.string().optional(),
          interests: z.array(z.string()).optional(),
          niche: z.array(z.string()).optional(),
          paymentMethod: z.string().optional(),
        }),
      });
      
      const { step, data } = onboardingUpdateSchema.parse(req.body);

      const updateData: any = { 
        onboardingStep: step 
      };

      // Save step-specific data
      if (data.displayName || data.stageName || data.pronouns) {
        if (data.displayName) updateData.firstName = data.displayName;
        if (data.stageName) updateData.stageName = data.stageName;
        if (data.pronouns) updateData.pronouns = data.pronouns;
      }

      if (data.interests) {
        updateData.preferredInterests = data.interests; // Store as array directly (jsonb column)
      }

      await db.update(users).set(updateData).where(eq(users.id, userId));

      // Also update profile if bio is provided
      if (data.bio) {
        const existingProfile = await storage.getProfile(userId);
        if (existingProfile) {
          await storage.updateProfile(userId, { bio: data.bio });
        } else {
          await storage.createProfile({ userId, bio: data.bio });
        }
      }

      // Store niche/paymentMethod in profile (will add to schema next)
      if (data.niche || data.paymentMethod) {
        const existingProfile = await storage.getProfile(userId);
        const profileUpdate: any = {};
        
        if (data.niche) profileUpdate.niche = data.niche;
        if (data.paymentMethod) profileUpdate.paymentMethod = data.paymentMethod;
        
        if (existingProfile) {
          await storage.updateProfile(userId, profileUpdate);
        } else {
          await storage.createProfile({ userId, ...profileUpdate });
        }
      }

      res.json({ message: "Onboarding progress saved" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid onboarding data",
          errors: error.errors 
        });
      }
      console.error("Error updating onboarding:", error);
      res.status(500).json({ message: "Failed to update onboarding" });
    }
  });

  app.post('/api/onboarding/complete', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;

      await db.update(users).set({ 
        onboardingCompleted: true,
        status: 'active'
      }).where(eq(users.id, userId));

      res.json({ message: "Onboarding completed successfully" });
    } catch (error) {
      console.error("Error completing onboarding:", error);
      res.status(500).json({ message: "Failed to complete onboarding" });
    }
  });

  // Discovery routes
  app.get('/api/discover/creators', async (req, res) => {
    try {
      const { q = '', packType, aftercareFriendly } = req.query;
      
      let creators;
      if (q) {
        creators = await storage.searchCreators(q as string);
      } else {
        creators = await storage.getFeaturedCreators();
      }

      // Apply filters
      if (packType && packType !== 'all') {
        creators = creators.filter(c => c.profile?.packType === packType);
      }
      
      if (aftercareFriendly === 'true') {
        creators = creators.filter(c => c.profile?.isAftercareFriendly);
      }

      res.json(creators);
    } catch (error) {
      console.error("Error fetching creators:", error);
      res.status(500).json({ message: "Failed to fetch creators" });
    }
  });

  // Media/Content routes
  app.get('/api/content/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const content = await storage.getMediaAssetsByOwner(userId);
      res.json(content);
    } catch (error) {
      console.error("Error fetching content:", error);
      res.status(500).json({ message: "Failed to fetch content" });
    }
  });

  app.post('/api/content', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const contentData = insertMediaAssetSchema.parse({ ...req.body, ownerId: userId });
      
      const content = await storage.createMediaAsset(contentData);
      res.json(content);
    } catch (error) {
      console.error("Error creating content:", error);
      res.status(500).json({ message: "Failed to create content" });
    }
  });

  // Object storage routes for media uploads
  app.get("/objects/:objectPath(*)", isAuthenticated, async (req: any, res) => {
    const userId = req.user?.claims?.sub;
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      const canAccess = await objectStorageService.canAccessObjectEntity({
        objectFile,
        userId: userId,
        requestedPermission: ObjectPermission.READ,
      });
      if (!canAccess) {
        return res.sendStatus(401);
      }
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error checking object access:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  app.post("/api/objects/upload", isAuthenticated, async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    const uploadURL = await objectStorageService.getObjectEntityUploadURL();
    res.json({ uploadURL });
  });

  app.put("/api/media-upload", isAuthenticated, async (req: any, res) => {
    if (!req.body.mediaUrl) {
      return res.status(400).json({ error: "mediaUrl is required" });
    }

    const userId = req.user?.claims?.sub;
    const fileInfo = req.body.fileInfo || {};

    try {
      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        req.body.mediaUrl,
        {
          owner: userId,
          visibility: "private", // Content should be private by default
        },
      );

      // Return enhanced file information for client use
      res.status(200).json({ 
        objectPath,
        fileInfo: {
          name: fileInfo.name || 'uploaded-file',
          size: fileInfo.size || 0,
          type: fileInfo.type || 'application/octet-stream'
        }
      });
    } catch (error) {
      console.error("Error setting media ACL:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Media management routes
  app.get("/api/media", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const mediaAssets = await storage.getUserMediaAssets(userId);
      res.json(mediaAssets);
    } catch (error) {
      console.error("Error fetching media assets:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/media/:mediaId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { mediaId } = req.params;
      
      // Verify ownership before deletion
      const media = await storage.getMediaAsset(mediaId);
      if (!media || media.ownerId !== userId) {
        return res.status(404).json({ error: "Media not found or unauthorized" });
      }

      // Delete from storage
      const objectStorageService = new ObjectStorageService();
      try {
        await objectStorageService.deleteObject(media.objectPath);
      } catch (error) {
        console.warn("Failed to delete object from storage:", error);
        // Continue with database deletion even if storage deletion fails
      }

      // Delete from database
      await storage.deleteMediaAsset(mediaId);
      res.json({ success: true, message: "Media deleted successfully" });
    } catch (error) {
      console.error("Error deleting media:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/media/:mediaId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const { mediaId } = req.params;
      
      const media = await storage.getMediaAsset(mediaId);
      if (!media) {
        return res.status(404).json({ error: "Media not found" });
      }

      // Check if user has access to this media
      if (media.ownerId !== userId && media.accessLevel !== 'pack') {
        // Check if user has subscription or has paid for PPV content
        const hasAccess = await storage.checkMediaAccess(userId, mediaId);
        if (!hasAccess) {
          return res.status(403).json({ error: "Access denied" });
        }
      }

      res.json(media);
    } catch (error) {
      console.error("Error fetching media:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Legacy subscription routes (keep for backward compatibility)
  app.post('/api/subscriptions', isAuthenticated, async (req: any, res) => {
    try {
      const fanId = req.user.claims.sub;
      const { creatorId, tier = 'basic', price } = req.body;
      
      const subscription = await storage.createSubscription({
        fanId,
        creatorId,
        tier,
        price,
      });
      
      res.json(subscription);
    } catch (error) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ message: "Failed to create subscription" });
    }
  });

  app.get('/api/subscriptions/mine', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const subscriptions = await storage.getSubscriptionsByFan(userId);
      res.json(subscriptions);
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
      res.status(500).json({ message: "Failed to fetch subscriptions" });
    }
  });

  // Tips routes
  app.post('/api/tips', isAuthenticated, async (req: any, res) => {
    try {
      const fromUserId = req.user.claims.sub;
      const tipData = insertTipSchema.parse({ ...req.body, fromUserId });
      
      const tip = await storage.createTip(tipData);
      res.json(tip);
    } catch (error) {
      console.error("Error creating tip:", error);
      res.status(500).json({ message: "Failed to create tip" });
    }
  });

  // Analytics routes
  app.get('/api/analytics/earnings/:period', isAuthenticated, async (req: any, res) => {
    try {
      const creatorId = req.user.claims.sub;
      const { period } = req.params;
      
      const earnings = await storage.getCreatorEarnings(creatorId, period);
      res.json(earnings);
    } catch (error) {
      console.error("Error fetching earnings:", error);
      res.status(500).json({ message: "Failed to fetch earnings" });
    }
  });

  app.get('/api/analytics/stats', isAuthenticated, async (req: any, res) => {
    try {
      const creatorId = req.user.claims.sub;
      const stats = await storage.getCreatorStats(creatorId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Messaging routes
  app.get('/api/messages/conversations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const conversations = await storage.getConversations(userId);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  app.get('/api/messages/:otherUserId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { otherUserId } = req.params;
      
      const messages = await storage.getMessagesBetweenUsers(userId, otherUserId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post('/api/messages', isAuthenticated, async (req: any, res) => {
    try {
      const fromUserId = req.user.claims.sub;
      const messageData = insertMessageSchema.parse({ ...req.body, fromUserId });
      
      const message = await storage.createMessage(messageData);
      
      // Broadcast to WebSocket clients
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'new_message',
            message
          }));
        }
      });
      
      res.json(message);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // =============================================================================
  // MULTI-TENANT ROUTES
  // =============================================================================

  // Tenant discovery and management
  app.get('/api/tenants', async (req, res) => {
    try {
      const tenants = await storage.getTenants();
      res.json(tenants);
    } catch (error) {
      console.error('Error fetching tenants:', error);
      res.status(500).json({ message: 'Failed to fetch tenants' });
    }
  });

  app.get('/api/tenants/:slug', async (req, res) => {
    try {
      const { slug } = req.params;
      const tenant = await storage.getTenantBySlug(slug);
      if (!tenant) {
        return res.status(404).json({ message: 'Tenant not found' });
      }
      res.json(tenant);
    } catch (error) {
      console.error('Error fetching tenant:', error);
      res.status(500).json({ message: 'Failed to fetch tenant' });
    }
  });

  // Enhanced content routes with cross-posting
  app.post('/api/content', isAuthenticated, async (req: any, res) => {
    try {
      const creatorUserId = req.user.claims.sub;
      const contentData = insertContentSchema.parse({ ...req.body, creatorUserId });
      
      const contentItem = await storage.createContent(contentData);
      
      // Automatically publish to canonical tenant
      await storage.publishContentToTenant(contentItem.id, contentData.canonicalTenant);
      
      res.json(contentItem);
    } catch (error) {
      console.error('Error creating content:', error);
      res.status(500).json({ message: 'Failed to create content' });
    }
  });

  app.get('/api/content/:contentId', async (req, res) => {
    try {
      const { contentId } = req.params;
      const contentItem = await storage.getContent(contentId);
      if (!contentItem) {
        return res.status(404).json({ message: 'Content not found' });
      }
      res.json(contentItem);
    } catch (error) {
      console.error('Error fetching content:', error);
      res.status(500).json({ message: 'Failed to fetch content' });
    }
  });

  app.get('/api/content/creator/:creatorId', async (req, res) => {
    try {
      const { creatorId } = req.params;
      const { tenantId } = req.query;
      const content = await storage.getContentByCreator(creatorId, tenantId as string);
      res.json(content);
    } catch (error) {
      console.error('Error fetching creator content:', error);
      res.status(500).json({ message: 'Failed to fetch creator content' });
    }
  });

  app.get('/api/content/tenant/:tenantId', async (req, res) => {
    try {
      const { tenantId } = req.params;
      const content = await storage.getContentByTenant(tenantId);
      res.json(content);
    } catch (error) {
      console.error('Error fetching tenant content:', error);
      res.status(500).json({ message: 'Failed to fetch tenant content' });
    }
  });

  app.put('/api/content/:contentId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { contentId } = req.params;
      
      // Verify ownership
      const existingContent = await storage.getContent(contentId);
      if (!existingContent || existingContent.creatorUserId !== userId) {
        return res.status(404).json({ message: 'Content not found or unauthorized' });
      }
      
      const updates = insertContentSchema.partial().parse(req.body);
      const contentItem = await storage.updateContent(contentId, updates);
      
      res.json(contentItem);
    } catch (error) {
      console.error('Error updating content:', error);
      res.status(500).json({ message: 'Failed to update content' });
    }
  });

  app.delete('/api/content/:contentId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { contentId } = req.params;
      
      // Verify ownership
      const existingContent = await storage.getContent(contentId);
      if (!existingContent || existingContent.creatorUserId !== userId) {
        return res.status(404).json({ message: 'Content not found or unauthorized' });
      }
      
      await storage.deleteContent(contentId);
      res.json({ success: true, message: 'Content deleted successfully' });
    } catch (error) {
      console.error('Error deleting content:', error);
      res.status(500).json({ message: 'Failed to delete content' });
    }
  });

  // Cross-posting management
  app.post('/api/content/:contentId/publish/:tenantId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { contentId, tenantId } = req.params;
      
      // Verify ownership
      const existingContent = await storage.getContent(contentId);
      if (!existingContent || existingContent.creatorUserId !== userId) {
        return res.status(404).json({ message: 'Content not found or unauthorized' });
      }
      
      const mapping = await storage.publishContentToTenant(contentId, tenantId);
      res.json(mapping);
    } catch (error) {
      console.error('Error publishing content to tenant:', error);
      res.status(500).json({ message: 'Failed to publish content to tenant' });
    }
  });

  app.delete('/api/content/:contentId/publish/:tenantId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { contentId, tenantId } = req.params;
      
      // Verify ownership
      const existingContent = await storage.getContent(contentId);
      if (!existingContent || existingContent.creatorUserId !== userId) {
        return res.status(404).json({ message: 'Content not found or unauthorized' });
      }
      
      await storage.unpublishContentFromTenant(contentId, tenantId);
      res.json({ success: true, message: 'Content unpublished from tenant' });
    } catch (error) {
      console.error('Error unpublishing content from tenant:', error);
      res.status(500).json({ message: 'Failed to unpublish content from tenant' });
    }
  });

  app.get('/api/content/:contentId/tenants', async (req, res) => {
    try {
      const { contentId } = req.params;
      const tenants = await storage.getContentTenants(contentId);
      res.json(tenants);
    } catch (error) {
      console.error('Error fetching content tenants:', error);
      res.status(500).json({ message: 'Failed to fetch content tenants' });
    }
  });

  // Enhanced subscription plans with tenant support
  app.post('/api/subscription-plans', isAuthenticated, async (req: any, res) => {
    try {
      const creatorUserId = req.user.claims.sub;
      const planData = insertSubscriptionPlanSchema.parse({ ...req.body, creatorUserId });
      
      const plan = await storage.createSubscriptionPlan(planData);
      res.json(plan);
    } catch (error) {
      console.error('Error creating subscription plan:', error);
      res.status(500).json({ message: 'Failed to create subscription plan' });
    }
  });

  app.get('/api/subscription-plans/creator/:creatorId', async (req, res) => {
    try {
      const { creatorId } = req.params;
      const { tenantId } = req.query;
      const plans = await storage.getSubscriptionPlans(creatorId, tenantId as string);
      res.json(plans);
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
      res.status(500).json({ message: 'Failed to fetch subscription plans' });
    }
  });

  app.get('/api/subscription-plans/:planId', async (req, res) => {
    try {
      const { planId } = req.params;
      const plan = await storage.getSubscriptionPlan(planId);
      if (!plan) {
        return res.status(404).json({ message: 'Subscription plan not found' });
      }
      res.json(plan);
    } catch (error) {
      console.error('Error fetching subscription plan:', error);
      res.status(500).json({ message: 'Failed to fetch subscription plan' });
    }
  });

  app.put('/api/subscription-plans/:planId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { planId } = req.params;
      
      // Verify ownership
      const existingPlan = await storage.getSubscriptionPlan(planId);
      if (!existingPlan || existingPlan.creatorUserId !== userId) {
        return res.status(404).json({ message: 'Subscription plan not found or unauthorized' });
      }
      
      const updates = insertSubscriptionPlanSchema.partial().parse(req.body);
      const plan = await storage.updateSubscriptionPlan(planId, updates);
      
      res.json(plan);
    } catch (error) {
      console.error('Error updating subscription plan:', error);
      res.status(500).json({ message: 'Failed to update subscription plan' });
    }
  });

  app.delete('/api/subscription-plans/:planId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { planId } = req.params;
      
      // Verify ownership
      const existingPlan = await storage.getSubscriptionPlan(planId);
      if (!existingPlan || existingPlan.creatorUserId !== userId) {
        return res.status(404).json({ message: 'Subscription plan not found or unauthorized' });
      }
      
      await storage.deleteSubscriptionPlan(planId);
      res.json({ success: true, message: 'Subscription plan deleted successfully' });
    } catch (error) {
      console.error('Error deleting subscription plan:', error);
      res.status(500).json({ message: 'Failed to delete subscription plan' });
    }
  });

  // Discovery routes enhanced for multi-tenant
  app.get('/api/discover/:tenantSlug/creators', async (req, res) => {
    try {
      const { tenantSlug } = req.params;
      const { q = '', packType, aftercareFriendly } = req.query;
      
      // Verify tenant exists
      const tenant = await storage.getTenantBySlug(tenantSlug);
      if (!tenant) {
        return res.status(404).json({ message: 'Tenant not found' });
      }
      
      let creators;
      if (q) {
        creators = await storage.searchCreators(q as string);
      } else {
        creators = await storage.getFeaturedCreators();
      }

      // Apply filters
      if (packType && packType !== 'all') {
        creators = creators.filter(c => c.profile?.packType === packType);
      }
      
      if (aftercareFriendly === 'true') {
        creators = creators.filter(c => c.profile?.isAftercareFriendly);
      }

      res.json(creators);
    } catch (error) {
      console.error('Error fetching tenant creators:', error);
      res.status(500).json({ message: 'Failed to fetch tenant creators' });
    }
  });

  // =============================================================================
  // EXISTING SAFETY ROUTES (ENHANCED)
  // =============================================================================

  // Safety routes
  app.post('/api/consent', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const consentData = insertConsentRecordSchema.parse({ 
        ...req.body, 
        userId,
        ipAddress: req.ip 
      });
      
      const consent = await storage.createConsentRecord(consentData);
      res.json(consent);
    } catch (error) {
      console.error("Error recording consent:", error);
      res.status(500).json({ message: "Failed to record consent" });
    }
  });

  app.get('/api/consent', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const consents = await storage.getConsentRecords(userId);
      res.json(consents);
    } catch (error) {
      console.error("Error fetching consents:", error);
      res.status(500).json({ message: "Failed to fetch consents" });
    }
  });

  app.post('/api/safety/report', isAuthenticated, async (req: any, res) => {
    try {
      const reporterId = req.user.claims.sub;
      const reportData = insertSafetyReportSchema.parse({ ...req.body, reporterId });
      
      const report = await storage.createSafetyReport(reportData);
      res.json(report);
    } catch (error) {
      console.error("Error creating safety report:", error);
      res.status(500).json({ message: "Failed to create safety report" });
    }
  });

  // =============================================================================
  // AI RECOMMENDATION ENGINE
  // =============================================================================

  // Track user interaction
  app.post('/api/interactions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { contentId, interactionType, durationSeconds, metadata } = req.body;

      await recommendationEngine.trackInteraction({
        userId,
        contentId,
        interactionType,
        durationSeconds,
        metadata,
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error tracking interaction:", error);
      res.status(500).json({ message: "Failed to track interaction" });
    }
  });

  // Get personalized recommendations
  app.get('/api/recommendations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = parseInt(req.query.limit as string) || 20;
      const excludeContentIds = req.query.exclude ? (req.query.exclude as string).split(',') : [];

      const recommendations = await recommendationEngine.getRecommendations({
        userId,
        limit,
        excludeContentIds,
      });

      res.json(recommendations);
    } catch (error) {
      console.error("Error getting recommendations:", error);
      res.status(500).json({ message: "Failed to get recommendations" });
    }
  });

  // =============================================================================
  // CREATOR ANALYTICS DASHBOARD
  // =============================================================================

  // Get analytics summary for creator
  app.get('/api/analytics/summary', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const summary = await creatorAnalytics.getAnalyticsSummary(userId);
      res.json(summary);
    } catch (error) {
      console.error("Error getting analytics summary:", error);
      res.status(500).json({ message: "Failed to get analytics summary" });
    }
  });

  // Get daily metrics for date range
  app.get('/api/analytics/daily', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const startDate = new Date(req.query.startDate as string);
      const endDate = new Date(req.query.endDate as string);
      
      const metrics = await creatorAnalytics.getDailyMetrics(userId, startDate, endDate);
      res.json(metrics);
    } catch (error) {
      console.error("Error getting daily metrics:", error);
      res.status(500).json({ message: "Failed to get daily metrics" });
    }
  });

  // Get audience insights
  app.get('/api/analytics/audience', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const insights = await creatorAnalytics.getAudienceInsights(userId);
      res.json(insights || {});
    } catch (error) {
      console.error("Error getting audience insights:", error);
      res.status(500).json({ message: "Failed to get audience insights" });
    }
  });

  // Generate revenue forecast
  app.post('/api/analytics/forecast', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const monthsAhead = parseInt(req.body.monthsAhead) || 3;
      
      const forecast = await creatorAnalytics.generateRevenueForecast(userId, monthsAhead);
      res.json(forecast);
    } catch (error) {
      console.error("Error generating forecast:", error);
      res.status(500).json({ message: "Failed to generate forecast" });
    }
  });

  // Compute daily metrics manually (for testing/admin)
  app.post('/api/analytics/compute-daily', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const date = req.body.date ? new Date(req.body.date) : new Date();
      
      const metrics = await creatorAnalytics.computeDailyMetrics(userId, date);
      res.json(metrics);
    } catch (error) {
      console.error("Error computing daily metrics:", error);
      res.status(500).json({ message: "Failed to compute daily metrics" });
    }
  });

  // Compute audience insights manually
  app.post('/api/analytics/compute-audience', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const insights = await creatorAnalytics.computeAudienceInsights(userId);
      res.json(insights);
    } catch (error) {
      console.error("Error computing audience insights:", error);
      res.status(500).json({ message: "Failed to compute audience insights" });
    }
  });

  // Get content performance
  app.get('/api/analytics/content', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const performance = await creatorAnalytics.getContentPerformance(userId);
      res.json(performance);
    } catch (error) {
      console.error("Error getting content performance:", error);
      res.status(500).json({ message: "Failed to get content performance" });
    }
  });

  // =============================================================================
  // INFINITY SCROLL FEED
  // =============================================================================

  app.get('/api/feed', async (req: any, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 12;
      const userId = req.user?.claims?.sub;

      const feedPosts = await storage.getFeedPosts(userId, page, limit);
      res.json(feedPosts);
    } catch (error) {
      console.error("Error fetching feed:", error);
      res.status(500).json({ message: "Failed to fetch feed" });
    }
  });

  // =============================================================================
  // NOTIFICATION SYSTEM
  // =============================================================================

  // Get user notifications
  app.get('/api/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const notifications = await notificationService.getUserNotifications(userId, limit, offset);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  // Get unread notification count
  app.get('/api/notifications/unread-count', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const count = await notificationService.getUnreadCount(userId);
      res.json({ count });
    } catch (error) {
      console.error("Error fetching unread count:", error);
      res.status(500).json({ message: "Failed to fetch unread count" });
    }
  });

  // Mark notification as read
  app.patch('/api/notifications/:id/read', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const notificationId = req.params.id;
      await notificationService.markAsRead(notificationId, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  // Mark all notifications as read
  app.post('/api/notifications/read-all', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await notificationService.markAllAsRead(userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });

  // Delete notification
  app.delete('/api/notifications/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const notificationId = req.params.id;
      await notificationService.deleteNotification(notificationId, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting notification:", error);
      res.status(500).json({ message: "Failed to delete notification" });
    }
  });

  // Get notification preferences
  app.get('/api/notifications/preferences', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      let prefs = await notificationService.getUserPreferences(userId);
      if (!prefs) {
        prefs = await notificationService.initializePreferences(userId);
      }
      res.json(prefs);
    } catch (error) {
      console.error("Error fetching notification preferences:", error);
      res.status(500).json({ message: "Failed to fetch notification preferences" });
    }
  });

  // Update notification preferences
  app.patch('/api/notifications/preferences', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const prefs = await notificationService.updatePreferences(userId, req.body);
      res.json(prefs);
    } catch (error) {
      console.error("Error updating notification preferences:", error);
      res.status(500).json({ message: "Failed to update notification preferences" });
    }
  });

  // =============================================================================
  // AI MODERATION SYSTEM
  // =============================================================================

  // Analyze content (trigger AI analysis)
  app.post('/api/moderation/analyze/:contentId', isAuthenticated, async (req: any, res) => {
    try {
      const contentId = req.params.contentId;
      await aiModerationService.analyzeContent(contentId);
      const safetyScore = await aiModerationService.getSafetyScore(contentId);
      res.json({ 
        success: true, 
        message: 'Content analyzed successfully',
        safetyScore 
      });
    } catch (error) {
      console.error("Error analyzing content:", error);
      res.status(500).json({ message: "Failed to analyze content" });
    }
  });

  // Batch analyze content
  app.post('/api/moderation/batch-analyze', isAuthenticated, async (req: any, res) => {
    try {
      const { contentIds } = req.body;
      if (!Array.isArray(contentIds)) {
        return res.status(400).json({ message: "contentIds must be an array" });
      }
      
      const results = await aiModerationService.batchAnalyze(contentIds);
      res.json({ results });
    } catch (error) {
      console.error("Error batch analyzing content:", error);
      res.status(500).json({ message: "Failed to batch analyze content" });
    }
  });

  // Get content AI flags
  app.get('/api/moderation/flags/:contentId', isAuthenticated, async (req: any, res) => {
    try {
      const contentId = req.params.contentId;
      const flags = await aiModerationService.getContentFlags(contentId);
      res.json(flags);
    } catch (error) {
      console.error("Error fetching content flags:", error);
      res.status(500).json({ message: "Failed to fetch content flags" });
    }
  });

  // Review a flag (moderator action)
  app.patch('/api/moderation/flags/:flagId/review', isAuthenticated, async (req: any, res) => {
    try {
      const flagId = req.params.flagId;
      const { override } = req.body;
      await aiModerationService.reviewFlag(flagId, override === true);
      res.json({ success: true });
    } catch (error) {
      console.error("Error reviewing flag:", error);
      res.status(500).json({ message: "Failed to review flag" });
    }
  });

  // Get content safety score
  app.get('/api/moderation/safety-score/:contentId', isAuthenticated, async (req: any, res) => {
    try {
      const contentId = req.params.contentId;
      const score = await aiModerationService.getSafetyScore(contentId);
      res.json(score || { message: "No safety score found" });
    } catch (error) {
      console.error("Error fetching safety score:", error);
      res.status(500).json({ message: "Failed to fetch safety score" });
    }
  });

  // Get auto-action status for content
  app.get('/api/moderation/auto-action-status/:contentId', isAuthenticated, async (req: any, res) => {
    try {
      const contentId = req.params.contentId;
      const status = await aiModerationService.getAutoActionStatus(contentId);
      res.json(status);
    } catch (error) {
      console.error("Error fetching auto-action status:", error);
      res.status(500).json({ message: "Failed to fetch auto-action status" });
    }
  });

  // Resolve auto-action (approve or reject auto-hidden content)
  app.post('/api/moderation/resolve-auto-action/:contentId', isAuthenticated, async (req: any, res) => {
    try {
      const contentId = req.params.contentId;
      
      // Validate action parameter
      const actionSchema = z.object({
        action: z.enum(['approve', 'reject']),
      });
      
      const { action } = actionSchema.parse(req.body);
      
      const result = await aiModerationService.resolveAutoAction(contentId, action);
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid action. Must be 'approve' or 'reject'",
          errors: error.errors 
        });
      }
      console.error("Error resolving auto-action:", error);
      res.status(500).json({ message: "Failed to resolve auto-action" });
    }
  });

  // Re-analyze all unreviewed flagged content (admin only)
  app.post('/api/moderation/reanalyze-unreviewed', isAuthenticated, async (req: any, res) => {
    try {
      // In production: Add admin role check
      const results = await aiModerationService.reanalyzeUnreviewed();
      res.json({ 
        success: true,
        analyzed: results.length,
        results 
      });
    } catch (error) {
      console.error("Error reanalyzing content:", error);
      res.status(500).json({ message: "Failed to reanalyze content" });
    }
  });

  // =============================================================================
  // COMMUNITY MODERATION SYSTEM
  // =============================================================================

  // Create a safety report
  app.post('/api/moderation/reports', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const reportData = insertSafetyReportSchema.parse({
        ...req.body,
        reporterId: userId,
      });
      
      const report = await communityModerationService.createSafetyReport(reportData);
      res.status(201).json(report);
    } catch (error) {
      console.error("Error creating safety report:", error);
      res.status(500).json({ message: "Failed to create safety report" });
    }
  });

  // Get pending reports for community review
  app.get('/api/moderation/reports/pending', isAuthenticated, async (req: any, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const reports = await communityModerationService.getPendingReportsForReview(limit);
      res.json(reports);
    } catch (error) {
      console.error("Error fetching pending reports:", error);
      res.status(500).json({ message: "Failed to fetch pending reports" });
    }
  });

  // Get reports about a specific user
  app.get('/api/moderation/reports/user/:userId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.params.userId;
      const status = req.query.status as string | undefined;
      const reports = await communityModerationService.getReportsByUser(userId, status);
      res.json(reports);
    } catch (error) {
      console.error("Error fetching user reports:", error);
      res.status(500).json({ message: "Failed to fetch user reports" });
    }
  });

  // Get reports submitted by current user
  app.get('/api/moderation/reports/my-submissions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const reports = await communityModerationService.getReportsSubmittedBy(userId, limit);
      res.json(reports);
    } catch (error) {
      console.error("Error fetching submitted reports:", error);
      res.status(500).json({ message: "Failed to fetch submitted reports" });
    }
  });

  // Submit a community vote on a report
  app.post('/api/moderation/reports/:reportId/vote', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const reportId = req.params.reportId;
      const voteData = insertCommunityVoteSchema.parse({
        ...req.body,
        reportId,
        voterId: userId,
      });
      
      const vote = await communityModerationService.submitCommunityVote(voteData);
      res.json(vote);
    } catch (error) {
      console.error("Error submitting vote:", error);
      res.status(500).json({ message: "Failed to submit vote" });
    }
  });

  // Get voting stats for a report
  app.get('/api/moderation/reports/:reportId/stats', isAuthenticated, async (req: any, res) => {
    try {
      const reportId = req.params.reportId;
      const stats = await communityModerationService.getReportVotingStats(reportId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching voting stats:", error);
      res.status(500).json({ message: "Failed to fetch voting stats" });
    }
  });

  // Get user's voting history
  app.get('/api/moderation/votes/my-history', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const votes = await communityModerationService.getUserVotingHistory(userId, limit);
      res.json(votes);
    } catch (error) {
      console.error("Error fetching voting history:", error);
      res.status(500).json({ message: "Failed to fetch voting history" });
    }
  });

  // Get user's reputation score
  app.get('/api/moderation/reputation/:userId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.params.userId || req.user.claims.sub;
      const reputation = await communityModerationService.getVoterReputation(userId);
      res.json({ userId, reputation });
    } catch (error) {
      console.error("Error fetching reputation:", error);
      res.status(500).json({ message: "Failed to fetch reputation" });
    }
  });

  // Moderator: Resolve a report
  app.patch('/api/moderation/reports/:reportId/resolve', isAuthenticated, async (req: any, res) => {
    try {
      const moderatorId = req.user.claims.sub;
      const reportId = req.params.reportId;
      const { resolution, action } = req.body;
      
      if (!['resolved', 'dismissed', 'escalated'].includes(action)) {
        return res.status(400).json({ message: "Invalid action. Must be 'resolved', 'dismissed', or 'escalated'" });
      }
      
      const report = await communityModerationService.resolveReport(
        reportId,
        moderatorId,
        resolution,
        action
      );
      res.json(report);
    } catch (error) {
      console.error("Error resolving report:", error);
      res.status(500).json({ message: "Failed to resolve report" });
    }
  });

  // Get moderator leaderboard
  app.get('/api/moderation/moderators/leaderboard', isAuthenticated, async (req: any, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const leaderboard = await communityModerationService.getModeratorLeaderboard(limit);
      res.json(leaderboard);
    } catch (error) {
      console.error("Error fetching moderator leaderboard:", error);
      res.status(500).json({ message: "Failed to fetch moderator leaderboard" });
    }
  });

  // =============================================================================
  // GAMIFICATION SYSTEM
  // =============================================================================

  // Get user achievements
  app.get('/api/gamification/achievements', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const achievements = await gamificationService.getUserAchievements(userId);
      res.json(achievements);
    } catch (error) {
      console.error("Error fetching achievements:", error);
      res.status(500).json({ message: "Failed to fetch achievements" });
    }
  });

  // Check and unlock achievements
  app.post('/api/gamification/achievements/check', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const newAchievements = await gamificationService.checkAndUnlockAchievements(userId);
      res.json({ newAchievements });
    } catch (error) {
      console.error("Error checking achievements:", error);
      res.status(500).json({ message: "Failed to check achievements" });
    }
  });

  // Get creator tier info
  app.get('/api/gamification/creator-tier', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const tierInfo = await gamificationService.initializeCreatorTier(userId);
      res.json(tierInfo);
    } catch (error) {
      console.error("Error fetching creator tier:", error);
      res.status(500).json({ message: "Failed to fetch creator tier" });
    }
  });

  // Get fan engagement rewards
  app.get('/api/gamification/fan-rewards', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const rewards = await gamificationService.initializeFanRewards(userId);
      res.json(rewards);
    } catch (error) {
      console.error("Error fetching fan rewards:", error);
      res.status(500).json({ message: "Failed to fetch fan rewards" });
    }
  });

  // Daily check-in
  app.post('/api/gamification/checkin', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const result = await gamificationService.updateDailyCheckIn(userId);
      res.json(result);
    } catch (error) {
      console.error("Error updating daily check-in:", error);
      res.status(500).json({ message: "Failed to update daily check-in" });
    }
  });

  // Get leaderboard
  app.get('/api/gamification/leaderboard', async (req: any, res) => {
    try {
      const category = req.query.category as string || 'top_creators';
      const period = req.query.period as string || 'monthly';
      const limit = parseInt(req.query.limit as string) || 100;

      const leaderboard = await gamificationService.getLeaderboard(category, period, limit);
      res.json(leaderboard);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  });

  // Get user rank in leaderboard
  app.get('/api/gamification/my-rank', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const category = req.query.category as string || 'top_creators';
      const period = req.query.period as string || 'monthly';

      const rank = await gamificationService.getUserRank(userId, category, period);
      res.json(rank || { rank: null, message: "Not ranked yet" });
    } catch (error) {
      console.error("Error fetching user rank:", error);
      res.status(500).json({ message: "Failed to fetch user rank" });
    }
  });

  const httpServer = createServer(app);

  // WebSocket server for real-time notifications and messaging
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws: any) => {
    console.log('WebSocket client connected');
    let userId: string | null = null;

    ws.on('message', (data: any) => {
      try {
        const message = JSON.parse(data.toString());
        
        // Handle authentication
        if (message.type === 'auth' && message.userId) {
          userId = message.userId as string;
          wsManager.addConnection(userId, ws);
          console.log(`WebSocket authenticated for user: ${userId}`);
          
          // Send confirmation
          ws.send(JSON.stringify({ 
            type: 'auth_success',
            message: 'Connected to notification system' 
          }));
          return;
        }

        // Handle different message types
        switch (message.type) {
          case 'message':
            // Broadcast to specific user or all
            if (message.to) {
              wsManager.sendToUser(message.to, message);
            } else {
              wsManager.broadcast(message);
            }
            break;

          case 'ping':
            ws.send(JSON.stringify({ type: 'pong' }));
            break;

          default:
            console.log('Unknown message type:', message.type);
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      if (userId) {
        wsManager.removeConnection(userId, ws);
        console.log(`WebSocket disconnected for user: ${userId}`);
      } else {
        console.log('WebSocket client disconnected');
      }
    });

    ws.on('error', (error: any) => {
      console.error('WebSocket error:', error);
    });
  });

  // =============================================================================
  // CO-STAR VERIFICATION SYSTEM
  // =============================================================================

  // Invite a co-star/collaborator
  app.post('/api/costar/invite', isAuthenticated, async (req: any, res) => {
    try {
      const creatorId = req.user.claims.sub;
      
      const inviteSchema = z.object({
        coStarEmail: z.string().email(),
        verificationType: z.enum(['live_stream', 'video_collab', 'photo_shoot', 'general']),
        contentId: z.string().optional(),
        notes: z.string().optional(),
        metadata: z.record(z.any()).optional(),
      });

      const inviteData = inviteSchema.parse(req.body);
      
      // Generate invitation token
      const { nanoid } = await import('nanoid');
      const invitationToken = nanoid(32);
      
      // Set expiration to 7 days from now
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      // Check if co-star is already a user
      const [existingUser] = await db.select().from(users).where(eq(users.email, inviteData.coStarEmail));

      const [invitation] = await db.insert(coStarVerifications).values({
        creatorId,
        coStarUserId: existingUser?.id || null,
        coStarEmail: inviteData.coStarEmail,
        status: existingUser ? 'invited' : 'pending_invite',
        verificationType: inviteData.verificationType,
        contentId: inviteData.contentId || null,
        invitationToken,
        expiresAt,
        invitedAt: new Date(),
        notes: inviteData.notes || null,
        metadata: inviteData.metadata || {},
      }).returning();

      res.json({ 
        invitation,
        invitationUrl: `${process.env.REPL_SLUG ? 'https://' + process.env.REPL_SLUG + '.repl.co' : 'http://localhost:5000'}/costar-invite/${invitationToken}`
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Error creating co-star invitation:", error);
      res.status(500).json({ message: "Failed to create invitation" });
    }
  });

  // Get all co-star invitations (sent or received)
  app.get('/api/costar/invitations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Get user's email
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get invitations sent by user (as creator)
      let sent = await db.select().from(coStarVerifications)
        .where(eq(coStarVerifications.creatorId, userId))
        .orderBy(desc(coStarVerifications.createdAt));

      // Get invitations received by user (as co-star)
      let received = await db.select().from(coStarVerifications)
        .where(
          or(
            eq(coStarVerifications.coStarUserId, userId),
            eq(coStarVerifications.coStarEmail, user.email || '')
          )
        )
        .orderBy(desc(coStarVerifications.createdAt));

      // Mark expired invitations
      const now = new Date();
      const toExpire = [...sent, ...received].filter(inv => 
        inv.expiresAt && 
        new Date(inv.expiresAt) < now && 
        inv.status !== 'expired' &&
        inv.status !== 'verified' &&
        inv.status !== 'rejected'
      );

      if (toExpire.length > 0) {
        await Promise.all(
          toExpire.map(inv =>
            db.update(coStarVerifications)
              .set({ status: 'expired', updatedAt: new Date() })
              .where(eq(coStarVerifications.id, inv.id))
          )
        );
        // Refetch to get updated status
        sent = await db.select().from(coStarVerifications)
          .where(eq(coStarVerifications.creatorId, userId))
          .orderBy(desc(coStarVerifications.createdAt));
        received = await db.select().from(coStarVerifications)
          .where(
            or(
              eq(coStarVerifications.coStarUserId, userId),
              eq(coStarVerifications.coStarEmail, user.email || '')
            )
          )
          .orderBy(desc(coStarVerifications.createdAt));
      }

      res.json({ sent, received });
    } catch (error) {
      console.error("Error fetching co-star invitations:", error);
      res.status(500).json({ message: "Failed to fetch invitations" });
    }
  });

  // Get specific invitation by token
  app.get('/api/costar/invitation/:token', async (req, res) => {
    try {
      const { token } = req.params;
      
      const [invitation] = await db.select()
        .from(coStarVerifications)
        .where(eq(coStarVerifications.invitationToken, token));

      if (!invitation) {
        return res.status(404).json({ message: "Invitation not found" });
      }

      // Check if expired
      if (invitation.expiresAt && new Date(invitation.expiresAt) < new Date()) {
        await db.update(coStarVerifications)
          .set({ status: 'expired' })
          .where(eq(coStarVerifications.id, invitation.id));
        return res.status(410).json({ message: "Invitation expired" });
      }

      // Get creator info
      const [creator] = await db.select().from(users).where(eq(users.id, invitation.creatorId));

      res.json({ 
        invitation,
        creator: {
          id: creator.id,
          username: creator.username,
          stageName: creator.stageName,
          profileImageUrl: creator.profileImageUrl
        }
      });
    } catch (error) {
      console.error("Error fetching invitation:", error);
      res.status(500).json({ message: "Failed to fetch invitation" });
    }
  });

  // Accept invitation (co-star accepts and starts KYC)
  app.post('/api/costar/:invitationId/accept', isAuthenticated, async (req: any, res) => {
    try {
      const { invitationId } = req.params;
      const userId = req.user.claims.sub;

      const [invitation] = await db.select()
        .from(coStarVerifications)
        .where(eq(coStarVerifications.id, invitationId));

      if (!invitation) {
        return res.status(404).json({ message: "Invitation not found" });
      }

      // Check if token already consumed
      if (invitation.tokenConsumed) {
        return res.status(410).json({ message: "Invitation already used" });
      }

      // Check if expired
      if (invitation.expiresAt && new Date(invitation.expiresAt) < new Date()) {
        // Mark as expired
        await db.update(coStarVerifications)
          .set({ status: 'expired', updatedAt: new Date() })
          .where(eq(coStarVerifications.id, invitationId));
        return res.status(410).json({ message: "Invitation expired" });
      }

      // Get user's email to verify invitation
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Verify this user is the invited co-star
      if (invitation.coStarEmail !== user.email && invitation.coStarUserId !== userId) {
        return res.status(403).json({ message: "Not authorized for this invitation" });
      }

      // Update invitation with user ID, status, and consume token
      await db.update(coStarVerifications)
        .set({ 
          coStarUserId: userId,
          status: 'pending_kyc',
          tokenConsumed: true,
          updatedAt: new Date()
        })
        .where(eq(coStarVerifications.id, invitationId));

      res.json({ 
        success: true,
        message: "Invitation accepted. Please complete KYC verification.",
        redirectTo: "/verification"
      });
    } catch (error) {
      console.error("Error accepting invitation:", error);
      res.status(500).json({ message: "Failed to accept invitation" });
    }
  });

  // Link KYC verification to co-star invitation
  app.post('/api/costar/:invitationId/complete-kyc', isAuthenticated, async (req: any, res) => {
    try {
      const { invitationId } = req.params;
      const userId = req.user.claims.sub;

      const kycSchema = z.object({
        kycVerificationId: z.string(),
      });

      const { kycVerificationId } = kycSchema.parse(req.body);

      // Verify KYC belongs to user
      const [kyc] = await db.select().from(kycVerifications)
        .where(and(
          eq(kycVerifications.id, kycVerificationId),
          eq(kycVerifications.userId, userId),
          eq(kycVerifications.status, 'verified')
        ));

      if (!kyc) {
        return res.status(404).json({ message: "Valid KYC verification not found" });
      }

      // Update invitation
      const [updated] = await db.update(coStarVerifications)
        .set({ 
          kycVerificationId,
          status: 'verified',
          verifiedAt: new Date(),
          updatedAt: new Date()
        })
        .where(and(
          eq(coStarVerifications.id, invitationId),
          eq(coStarVerifications.coStarUserId, userId)
        ))
        .returning();

      if (!updated) {
        return res.status(403).json({ message: "Not authorized or invitation not found" });
      }

      res.json({ success: true, invitation: updated });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Error completing KYC for co-star:", error);
      res.status(500).json({ message: "Failed to complete KYC verification" });
    }
  });

  // Cancel/reject invitation
  app.delete('/api/costar/:invitationId', isAuthenticated, async (req: any, res) => {
    try {
      const { invitationId } = req.params;
      const userId = req.user.claims.sub;

      const [invitation] = await db.select()
        .from(coStarVerifications)
        .where(eq(coStarVerifications.id, invitationId));

      if (!invitation) {
        return res.status(404).json({ message: "Invitation not found" });
      }

      // Only creator or co-star can cancel
      if (invitation.creatorId !== userId && invitation.coStarUserId !== userId) {
        return res.status(403).json({ message: "Not authorized to cancel this invitation" });
      }

      await db.update(coStarVerifications)
        .set({ status: 'rejected', updatedAt: new Date() })
        .where(eq(coStarVerifications.id, invitationId));

      res.json({ success: true });
    } catch (error) {
      console.error("Error canceling invitation:", error);
      res.status(500).json({ message: "Failed to cancel invitation" });
    }
  });

  // Check if co-star is verified for specific content/stream
  app.get('/api/costar/verify/:contentId', isAuthenticated, async (req: any, res) => {
    try {
      const { contentId } = req.params;
      const userId = req.user.claims.sub;

      const verifications = await db.select()
        .from(coStarVerifications)
        .where(and(
          eq(coStarVerifications.contentId, contentId),
          or(
            eq(coStarVerifications.creatorId, userId),
            eq(coStarVerifications.coStarUserId, userId)
          ),
          eq(coStarVerifications.status, 'verified')
        ));

      res.json({ 
        isVerified: verifications.length > 0,
        verifications 
      });
    } catch (error) {
      console.error("Error checking co-star verification:", error);
      res.status(500).json({ message: "Failed to check verification" });
    }
  });

  // =============================================================================
  // AI CONTENT PROCESSING SYSTEM
  // =============================================================================

  // Queue content processing job
  app.post('/api/content/process', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const processSchema = z.object({
        contentId: z.string(),
        sourceVideoPath: z.string(),
        options: z.object({
          autoEdit: z.boolean().optional(),
          aspectRatios: z.array(z.enum(['9:16', '16:9', '1:1'])).optional(),
          generateGif: z.boolean().optional(),
          generateTrailer: z.boolean().optional(),
          trailerDuration: z.number().min(10).max(60).optional(),
          generateHighlights: z.boolean().optional(),
          addBranding: z.boolean().optional(),
          customBranding: z.object({
            introPath: z.string().optional(),
            outroPath: z.string().optional(),
            logoPath: z.string().optional(),
          }).optional(),
        }),
      });

      const { contentId, sourceVideoPath, options } = processSchema.parse(req.body);
      
      // Verify user owns this content
      const [contentItem] = await db.select().from(content)
        .where(and(
          eq(content.id, contentId),
          eq(content.creatorUserId, userId)
        ));

      if (!contentItem) {
        return res.status(403).json({ message: "Content not found or access denied" });
      }

      const job = await aiContentProcessingService.queueProcessing(
        contentId,
        sourceVideoPath,
        options
      );

      res.json({ 
        success: true,
        job
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Error queuing content processing:", error);
      res.status(500).json({ message: "Failed to queue processing job" });
    }
  });

  // Get processing job status
  app.get('/api/content/process/:jobId', isAuthenticated, async (req: any, res) => {
    try {
      const { jobId } = req.params;
      const userId = req.user.claims.sub;
      
      const job = await aiContentProcessingService.getJobStatus(jobId);
      
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      // Verify user owns the content associated with this job
      const [contentItem] = await db.select().from(content)
        .where(and(
          eq(content.id, job.contentId),
          eq(content.creatorUserId, userId)
        ));

      if (!contentItem) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(job);
    } catch (error) {
      console.error("Error fetching job status:", error);
      res.status(500).json({ message: "Failed to fetch job status" });
    }
  });

  // Get all processing jobs for content
  app.get('/api/content/:contentId/processing', isAuthenticated, async (req: any, res) => {
    try {
      const { contentId } = req.params;
      const userId = req.user.claims.sub;

      // Verify user owns this content
      const [contentItem] = await db.select().from(content)
        .where(and(
          eq(content.id, contentId),
          eq(content.creatorUserId, userId)
        ));

      if (!contentItem) {
        return res.status(403).json({ message: "Content not found or access denied" });
      }

      const jobs = await aiContentProcessingService.getContentJobs(contentId);
      res.json({ jobs });
    } catch (error) {
      console.error("Error fetching content jobs:", error);
      res.status(500).json({ message: "Failed to fetch content jobs" });
    }
  });

  // Cancel processing job
  app.delete('/api/content/process/:jobId', isAuthenticated, async (req: any, res) => {
    try {
      const { jobId } = req.params;
      const userId = req.user.claims.sub;
      
      const job = await aiContentProcessingService.getJobStatus(jobId);
      
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      // Verify user owns the content associated with this job
      const [contentItem] = await db.select().from(content)
        .where(and(
          eq(content.id, job.contentId),
          eq(content.creatorUserId, userId)
        ));

      if (!contentItem) {
        return res.status(403).json({ message: "Access denied" });
      }

      const cancelled = await aiContentProcessingService.cancelJob(jobId);
      
      if (!cancelled) {
        return res.status(400).json({ message: "Job cannot be cancelled" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error cancelling job:", error);
      res.status(500).json({ message: "Failed to cancel job" });
    }
  });

  // =============================================================================
  // MULTI-PLATFORM DISTRIBUTION ROUTES
  // =============================================================================

  // Connect social media account
  app.post('/api/distribution/accounts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Validate platform and credentials
      const connectSchema = z.object({
        platform: z.enum(['twitter', 'instagram', 'tiktok', 'onlyfans', 'fansly', 'reddit', 'tumblr', 'manyvids']),
        credentials: z.object({
          platformUserId: z.string().optional(),
          platformUsername: z.string().optional(),
          accessToken: z.string(),
          refreshToken: z.string().optional(),
          tokenExpiresAt: z.string().optional(),
        }),
      });

      const validatedData = connectSchema.parse(req.body);

      const account = await distributionService.connectAccount(
        userId,
        validatedData.platform,
        {
          ...validatedData.credentials,
          tokenExpiresAt: validatedData.credentials.tokenExpiresAt 
            ? new Date(validatedData.credentials.tokenExpiresAt)
            : undefined,
        }
      );
      res.json(account);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      console.error("Error connecting account:", error);
      res.status(500).json({ message: "Failed to connect account" });
    }
  });

  // Get connected accounts
  app.get('/api/distribution/accounts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const accounts = await distributionService.getConnectedAccounts(userId);
      res.json(accounts);
    } catch (error) {
      console.error("Error fetching accounts:", error);
      res.status(500).json({ message: "Failed to fetch accounts" });
    }
  });

  // Disconnect account
  app.delete('/api/distribution/accounts/:accountId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { accountId } = req.params;
      
      const success = await distributionService.disconnectAccount(accountId, userId);
      if (!success) {
        return res.status(404).json({ message: "Account not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error disconnecting account:", error);
      res.status(500).json({ message: "Failed to disconnect account" });
    }
  });

  // Distribute content to platforms
  app.post('/api/distribution/content/:contentId/distribute', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { contentId } = req.params;
      const { caption, scheduledFor, platforms, mediaUrls } = req.body;

      const jobs = await distributionService.distributeContent(contentId, userId, {
        caption,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
        platforms,
        mediaUrls,
      });

      res.json(jobs);
    } catch (error) {
      console.error("Error distributing content:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to distribute content" 
      });
    }
  });

  // Get distribution jobs for content
  app.get('/api/distribution/content/:contentId/jobs', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { contentId } = req.params;

      const jobs = await distributionService.getContentDistributionJobs(contentId, userId);
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching distribution jobs:", error);
      res.status(500).json({ message: "Failed to fetch distribution jobs" });
    }
  });

  // Cancel distribution job
  app.delete('/api/distribution/jobs/:jobId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { jobId } = req.params;

      const success = await distributionService.cancelDistributionJob(jobId, userId);
      if (!success) {
        return res.status(404).json({ message: "Job not found or cannot be cancelled" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error cancelling job:", error);
      res.status(500).json({ message: "Failed to cancel job" });
    }
  });

  // Generate QR code
  app.post('/api/distribution/qr-codes', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { targetType, targetUrl, contentId, options } = req.body;

      if (!targetType || !targetUrl) {
        return res.status(400).json({ message: "Target type and URL required" });
      }

      const qrCode = await distributionService.generateQRCode(
        userId,
        targetType,
        targetUrl,
        contentId,
        options
      );

      res.json(qrCode);
    } catch (error) {
      console.error("Error generating QR code:", error);
      res.status(500).json({ message: "Failed to generate QR code" });
    }
  });

  // Get QR codes
  app.get('/api/distribution/qr-codes', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const qrCodes = await distributionService.getCreatorQRCodes(userId);
      res.json(qrCodes);
    } catch (error) {
      console.error("Error fetching QR codes:", error);
      res.status(500).json({ message: "Failed to fetch QR codes" });
    }
  });

  // Track QR code scan
  app.post('/api/distribution/qr-codes/:qrCodeId/scan', async (req: any, res) => {
    try {
      const { qrCodeId } = req.params;
      await distributionService.trackQRCodeScan(qrCodeId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error tracking QR scan:", error);
      res.status(500).json({ message: "Failed to track scan" });
    }
  });

  // Create smart link
  app.post('/api/distribution/smart-links', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { targetUrl, contentId, title, description, expiresAt, metadata } = req.body;

      if (!targetUrl) {
        return res.status(400).json({ message: "Target URL required" });
      }

      const link = await distributionService.createSmartLink(userId, targetUrl, contentId, {
        title,
        description,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        metadata,
      });

      res.json(link);
    } catch (error) {
      console.error("Error creating smart link:", error);
      res.status(500).json({ message: "Failed to create smart link" });
    }
  });

  // Get smart links
  app.get('/api/distribution/smart-links', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const links = await distributionService.getCreatorSmartLinks(userId);
      res.json(links);
    } catch (error) {
      console.error("Error fetching smart links:", error);
      res.status(500).json({ message: "Failed to fetch smart links" });
    }
  });

  // Redirect smart link (public)
  app.get('/l/:shortCode', async (req: any, res) => {
    try {
      const { shortCode } = req.params;
      const link = await distributionService.trackLinkClick(shortCode, true);

      if (!link || link.status !== 'active') {
        return res.status(404).send('Link not found or expired');
      }

      res.redirect(link.targetUrl);
    } catch (error) {
      console.error("Error redirecting link:", error);
      res.status(500).send('Error redirecting');
    }
  });

  // Get smart link analytics
  app.get('/api/distribution/smart-links/:linkId/analytics', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { linkId } = req.params;

      const analytics = await distributionService.getSmartLinkAnalytics(linkId, userId);
      if (!analytics) {
        return res.status(404).json({ message: "Link not found" });
      }

      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // =============================================================================
  // LIVE STREAM INFRASTRUCTURE ROUTES
  // =============================================================================

  // Create live stream
  app.post('/api/streams', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { title, description, scheduledStartTime, requiresCoStarVerification, recordingEnabled, autoHighlightsEnabled, visibility } = req.body;

      if (!title) {
        return res.status(400).json({ message: "Title is required" });
      }

      const stream = await liveStreamService.createStream(userId, {
        title,
        description,
        scheduledStartTime: scheduledStartTime ? new Date(scheduledStartTime) : undefined,
        requiresCoStarVerification,
        recordingEnabled,
        autoHighlightsEnabled,
        visibility,
      });

      res.json(stream);
    } catch (error) {
      console.error("Error creating stream:", error);
      res.status(500).json({ message: "Failed to create stream" });
    }
  });

  // Start live stream
  app.post('/api/streams/:streamId/start', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { streamId } = req.params;

      const stream = await liveStreamService.startStream(streamId, userId);
      res.json(stream);
    } catch (error) {
      console.error("Error starting stream:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to start stream" 
      });
    }
  });

  // End live stream
  app.post('/api/streams/:streamId/end', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { streamId } = req.params;

      const stream = await liveStreamService.endStream(streamId, userId);
      res.json(stream);
    } catch (error) {
      console.error("Error ending stream:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to end stream" 
      });
    }
  });

  // Join stream
  app.post('/api/streams/:streamId/join', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { streamId } = req.params;
      const { role, coStarVerificationId } = req.body;

      const participant = await liveStreamService.joinStream(streamId, userId, {
        role: role || 'viewer',
        coStarVerificationId,
      });

      res.json(participant);
    } catch (error) {
      console.error("Error joining stream:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to join stream" 
      });
    }
  });

  // Leave stream
  app.post('/api/streams/:streamId/leave', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { streamId } = req.params;

      await liveStreamService.leaveStream(streamId, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error leaving stream:", error);
      res.status(500).json({ message: "Failed to leave stream" });
    }
  });

  // Send tip during stream
  app.post('/api/streams/:streamId/tip', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { streamId } = req.params;
      const { toUserId, amount, message } = req.body;

      if (!toUserId || !amount) {
        return res.status(400).json({ message: "Recipient and amount required" });
      }

      const tip = await liveStreamService.sendStreamTip(streamId, userId, toUserId, amount, message);
      res.json(tip);
    } catch (error) {
      console.error("Error sending stream tip:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to send tip" 
      });
    }
  });

  // Get stream details
  app.get('/api/streams/:streamId', async (req: any, res) => {
    try {
      const { streamId } = req.params;
      const stream = await liveStreamService.getStream(streamId);

      if (!stream) {
        return res.status(404).json({ message: "Stream not found" });
      }

      res.json(stream);
    } catch (error) {
      console.error("Error fetching stream:", error);
      res.status(500).json({ message: "Failed to fetch stream" });
    }
  });

  // Get creator streams
  app.get('/api/streams/creator/:creatorId', async (req: any, res) => {
    try {
      const { creatorId } = req.params;
      const streams = await liveStreamService.getCreatorStreams(creatorId);
      res.json(streams);
    } catch (error) {
      console.error("Error fetching creator streams:", error);
      res.status(500).json({ message: "Failed to fetch creator streams" });
    }
  });

  // Get live streams
  app.get('/api/streams/live', async (req: any, res) => {
    try {
      const streams = await liveStreamService.getLiveStreams();
      res.json(streams);
    } catch (error) {
      console.error("Error fetching live streams:", error);
      res.status(500).json({ message: "Failed to fetch live streams" });
    }
  });

  // Get stream participants
  app.get('/api/streams/:streamId/participants', async (req: any, res) => {
    try {
      const { streamId } = req.params;
      const participants = await liveStreamService.getStreamParticipants(streamId);
      res.json(participants);
    } catch (error) {
      console.error("Error fetching participants:", error);
      res.status(500).json({ message: "Failed to fetch participants" });
    }
  });

  // Get stream recordings
  app.get('/api/streams/:streamId/recordings', async (req: any, res) => {
    try {
      const { streamId } = req.params;
      const recordings = await liveStreamService.getStreamRecordings(streamId);
      res.json(recordings);
    } catch (error) {
      console.error("Error fetching recordings:", error);
      res.status(500).json({ message: "Failed to fetch recordings" });
    }
  });

  // =============================================================================
  // AI MARKETING AUTOMATION ROUTES
  // =============================================================================

  // Create marketing campaign
  app.post('/api/campaigns', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { 
        name, type, trigger, triggerConditions, targetSegmentId, targetAllFans, 
        messageTemplate, subject, mediaPath, ctaText, ctaUrl, scheduledFor, 
        startDate, endDate, maxExecutions 
      } = req.body;

      if (!name || !type || !trigger || !messageTemplate) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const campaign = await marketingAutomationService.createCampaign(userId, {
        name,
        type,
        trigger,
        triggerConditions,
        targetSegmentId,
        targetAllFans,
        messageTemplate,
        subject,
        mediaPath,
        ctaText,
        ctaUrl,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        maxExecutions,
      });

      res.json(campaign);
    } catch (error) {
      console.error("Error creating campaign:", error);
      res.status(500).json({ message: "Failed to create campaign" });
    }
  });

  // Activate campaign
  app.post('/api/campaigns/:campaignId/activate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { campaignId } = req.params;

      const result = await marketingAutomationService.activateCampaign(campaignId, userId);
      res.json(result);
    } catch (error) {
      console.error("Error activating campaign:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to activate campaign" 
      });
    }
  });

  // Pause campaign
  app.post('/api/campaigns/:campaignId/pause', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { campaignId } = req.params;

      const result = await marketingAutomationService.pauseCampaign(campaignId, userId);
      res.json(result);
    } catch (error) {
      console.error("Error pausing campaign:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to pause campaign" 
      });
    }
  });

  // Get campaign analytics
  app.get('/api/campaigns/:campaignId/analytics', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { campaignId } = req.params;

      const analytics = await marketingAutomationService.getCampaignAnalytics(campaignId, userId);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching campaign analytics:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch analytics" 
      });
    }
  });

  // Create fan segment
  app.post('/api/segments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { name, description, segmentType, rules } = req.body;

      if (!name || !segmentType) {
        return res.status(400).json({ message: "Name and segment type are required" });
      }

      const segment = await marketingAutomationService.createSegment(userId, {
        name,
        description,
        segmentType,
        rules,
      });

      res.json(segment);
    } catch (error) {
      console.error("Error creating segment:", error);
      res.status(500).json({ message: "Failed to create segment" });
    }
  });

  // Add fan to segment
  app.post('/api/segments/:segmentId/fans/:fanId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { segmentId, fanId } = req.params;

      const result = await marketingAutomationService.addFanToSegment(segmentId, fanId, userId);
      res.json(result);
    } catch (error) {
      console.error("Error adding fan to segment:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to add fan" 
      });
    }
  });

  // Remove fan from segment
  app.delete('/api/segments/:segmentId/fans/:fanId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { segmentId, fanId } = req.params;

      const result = await marketingAutomationService.removeFanFromSegment(segmentId, fanId, userId);
      res.json(result);
    } catch (error) {
      console.error("Error removing fan from segment:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to remove fan" 
      });
    }
  });

  // Recalculate segment
  app.post('/api/segments/:segmentId/recalculate', isAuthenticated, async (req: any, res) => {
    try {
      const { segmentId } = req.params;

      await marketingAutomationService.recalculateSegment(segmentId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error recalculating segment:", error);
      res.status(500).json({ message: "Failed to recalculate segment" });
    }
  });

  // Get creator segments
  app.get('/api/segments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const segments = await marketingAutomationService.getCreatorSegments(userId);
      res.json(segments);
    } catch (error) {
      console.error("Error fetching segments:", error);
      res.status(500).json({ message: "Failed to fetch segments" });
    }
  });

  // Get segment members
  app.get('/api/segments/:segmentId/members', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { segmentId } = req.params;

      const members = await marketingAutomationService.getSegmentMembers(segmentId, userId);
      res.json(members);
    } catch (error) {
      console.error("Error fetching segment members:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch members" 
      });
    }
  });

  // Schedule social post
  app.post('/api/social-posts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { platforms, postContent, mediaPath, scheduledFor, campaignId } = req.body;

      if (!platforms || !postContent || !scheduledFor) {
        return res.status(400).json({ message: "Platforms, content, and schedule time are required" });
      }

      const post = await marketingAutomationService.scheduleSocialPost(userId, {
        platforms,
        postContent,
        mediaPath,
        scheduledFor: new Date(scheduledFor),
        campaignId,
      });

      res.json(post);
    } catch (error) {
      console.error("Error scheduling social post:", error);
      res.status(500).json({ message: "Failed to schedule post" });
    }
  });

  // Cancel social post
  app.post('/api/social-posts/:postId/cancel', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { postId } = req.params;

      const result = await marketingAutomationService.cancelSocialPost(postId, userId);
      res.json(result);
    } catch (error) {
      console.error("Error cancelling social post:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to cancel post" 
      });
    }
  });

  // Get scheduled posts
  app.get('/api/social-posts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const posts = await marketingAutomationService.getScheduledPosts(userId);
      res.json(posts);
    } catch (error) {
      console.error("Error fetching scheduled posts:", error);
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  // =============================================================================
  // CREATOR CONTROL DASHBOARD - QUICK PUBLISH
  // =============================================================================

  // =============================================================================
  // BLOCKCHAIN & NFT ENDPOINTS - Content Ownership System
  // =============================================================================

  // Create NFT collection
  app.post('/api/nft/collections', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertNftCollectionSchema.omit({ creatorId: true }).parse(req.body);
      const collection = await blockchainService.createCollection(userId, validatedData);
      res.json(collection);
    } catch (error) {
      console.error("Error creating NFT collection:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid collection data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create collection" });
    }
  });

  // Get creator's collections
  app.get('/api/nft/collections', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const collections = await blockchainService.getCreatorCollections(userId);
      res.json(collections);
    } catch (error) {
      console.error("Error fetching collections:", error);
      res.status(500).json({ message: "Failed to fetch collections" });
    }
  });

  // Get collection details
  app.get('/api/nft/collections/:id', async (req: any, res) => {
    try {
      const collection = await blockchainService.getCollection(req.params.id);
      if (!collection) {
        return res.status(404).json({ message: "Collection not found" });
      }
      res.json(collection);
    } catch (error) {
      console.error("Error fetching collection:", error);
      res.status(500).json({ message: "Failed to fetch collection" });
    }
  });

  // Mint NFT
  app.post('/api/nft/mint', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const validatedData = insertNftSchema
        .omit({ tokenId: true, mintedBy: true, currentOwner: true })
        .parse(req.body);

      const collection = await blockchainService.getCollection(validatedData.collectionId);
      if (!collection) {
        return res.status(404).json({ message: "Collection not found" });
      }

      if (collection.creatorId !== userId) {
        return res.status(403).json({ message: "Unauthorized: Not the collection creator" });
      }

      const nft = await blockchainService.mintNFT({
        ...validatedData,
        mintedBy: userId,
        currentOwner: userId,
      }, req.body.blockchain);
      res.json(nft);
    } catch (error) {
      console.error("Error minting NFT:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid NFT data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to mint NFT" });
    }
  });

  // Get NFT details
  app.get('/api/nft/:id', async (req: any, res) => {
    try {
      const nft = await blockchainService.getNFT(req.params.id);
      if (!nft) {
        return res.status(404).json({ message: "NFT not found" });
      }
      res.json(nft);
    } catch (error) {
      console.error("Error fetching NFT:", error);
      res.status(500).json({ message: "Failed to fetch NFT" });
    }
  });

  // Get user's NFTs
  app.get('/api/nft/user/:userId', async (req: any, res) => {
    try {
      const nfts = await blockchainService.getUserNFTs(req.params.userId);
      res.json(nfts);
    } catch (error) {
      console.error("Error fetching user NFTs:", error);
      res.status(500).json({ message: "Failed to fetch NFTs" });
    }
  });

  // Get collection NFTs
  app.get('/api/nft/collection/:collectionId/nfts', async (req: any, res) => {
    try {
      const nfts = await blockchainService.getCollectionNFTs(req.params.collectionId);
      res.json(nfts);
    } catch (error) {
      console.error("Error fetching collection NFTs:", error);
      res.status(500).json({ message: "Failed to fetch NFTs" });
    }
  });

  // Transfer/Sell NFT
  app.post('/api/nft/:id/transfer', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { toUserId, transactionType, price, transactionHash, blockchain } = req.body;

      await blockchainService.transferNFT(
        req.params.id,
        userId,
        toUserId,
        transactionType,
        price,
        transactionHash,
        blockchain
      );

      res.json({ message: "NFT transferred successfully" });
    } catch (error) {
      console.error("Error transferring NFT:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to transfer NFT" 
      });
    }
  });

  // List NFT for sale
  app.post('/api/nft/:id/list', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { listPrice } = req.body;

      await blockchainService.listNFT(req.params.id, userId, listPrice);
      res.json({ message: "NFT listed successfully" });
    } catch (error) {
      console.error("Error listing NFT:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to list NFT" 
      });
    }
  });

  // Delist NFT
  app.post('/api/nft/:id/delist', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await blockchainService.delistNFT(req.params.id, userId);
      res.json({ message: "NFT delisted successfully" });
    } catch (error) {
      console.error("Error delisting NFT:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to delist NFT" 
      });
    }
  });

  // Get marketplace listings
  app.get('/api/nft/marketplace', async (req: any, res) => {
    try {
      const listings = await blockchainService.getMarketplaceListings();
      res.json(listings);
    } catch (error) {
      console.error("Error fetching marketplace:", error);
      res.status(500).json({ message: "Failed to fetch marketplace" });
    }
  });

  // Get creator royalties
  app.get('/api/nft/royalties', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const royalties = await blockchainService.getRoyaltiesForCreator(userId);
      res.json(royalties);
    } catch (error) {
      console.error("Error fetching royalties:", error);
      res.status(500).json({ message: "Failed to fetch royalties" });
    }
  });

  // Update royalty payment status
  app.patch('/api/nft/royalties/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { status, transactionHash } = req.body;
      await blockchainService.updateRoyaltyStatus(req.params.id, status, transactionHash);
      res.json({ message: "Royalty status updated" });
    } catch (error) {
      console.error("Error updating royalty:", error);
      res.status(500).json({ message: "Failed to update royalty" });
    }
  });

  // Get NFT ownership history
  app.get('/api/nft/:id/history', async (req: any, res) => {
    try {
      const history = await blockchainService.getOwnershipHistory(req.params.id);
      res.json(history);
    } catch (error) {
      console.error("Error fetching ownership history:", error);
      res.status(500).json({ message: "Failed to fetch history" });
    }
  });

  // Get NFT metadata (for blockchain integration)
  app.get('/api/nft/:id/metadata', async (req: any, res) => {
    try {
      const nft = await blockchainService.getNFT(req.params.id);
      if (!nft) {
        return res.status(404).json({ message: "NFT not found" });
      }
      
      const metadata = await blockchainService.generateMetadata(nft);
      res.json(metadata);
    } catch (error) {
      console.error("Error generating metadata:", error);
      res.status(500).json({ message: "Failed to generate metadata" });
    }
  });

  // =============================================================================
  // AI VOICE CLONING ENDPOINTS - Personalized Voice Messages
  // =============================================================================

  // Create voice model
  app.post('/api/voice/models', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const model = await voiceCloningService.createVoiceModel(userId, req.body);
      res.json(model);
    } catch (error) {
      console.error("Error creating voice model:", error);
      res.status(500).json({ message: "Failed to create voice model" });
    }
  });

  // Get creator's voice models
  app.get('/api/voice/models', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const models = await voiceCloningService.getCreatorVoiceModels(userId);
      res.json(models);
    } catch (error) {
      console.error("Error fetching voice models:", error);
      res.status(500).json({ message: "Failed to fetch voice models" });
    }
  });

  // Get voice model details
  app.get('/api/voice/models/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const model = await voiceCloningService.getVoiceModel(req.params.id);
      if (!model) {
        return res.status(404).json({ message: "Voice model not found" });
      }
      
      if (model.creatorId !== userId) {
        return res.status(403).json({ message: "Unauthorized: Not the model owner" });
      }
      
      res.json(model);
    } catch (error) {
      console.error("Error fetching voice model:", error);
      res.status(500).json({ message: "Failed to fetch voice model" });
    }
  });

  // Update voice model
  app.patch('/api/voice/models/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const model = await voiceCloningService.getVoiceModel(req.params.id);
      if (!model) {
        return res.status(404).json({ message: "Voice model not found" });
      }
      
      if (model.creatorId !== userId) {
        return res.status(403).json({ message: "Unauthorized: Not the model owner" });
      }

      const allowedUpdates = {
        name: req.body.name,
        description: req.body.description,
        modelSettings: req.body.modelSettings,
        isActive: req.body.isActive,
      };

      await voiceCloningService.updateVoiceModel(req.params.id, allowedUpdates);
      res.json({ message: "Voice model updated successfully" });
    } catch (error) {
      console.error("Error updating voice model:", error);
      res.status(500).json({ message: "Failed to update voice model" });
    }
  });

  // Delete voice model
  app.delete('/api/voice/models/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const model = await voiceCloningService.getVoiceModel(req.params.id);
      if (!model) {
        return res.status(404).json({ message: "Voice model not found" });
      }
      
      if (model.creatorId !== userId) {
        return res.status(403).json({ message: "Unauthorized: Not the model owner" });
      }
      
      await voiceCloningService.deleteVoiceModel(req.params.id);
      res.json({ message: "Voice model deleted successfully" });
    } catch (error) {
      console.error("Error deleting voice model:", error);
      res.status(500).json({ message: "Failed to delete voice model" });
    }
  });

  // Create voice message
  app.post('/api/voice/messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const model = await voiceCloningService.getVoiceModel(req.body.voiceModelId);
      if (!model) {
        return res.status(404).json({ message: "Voice model not found" });
      }
      
      if (model.creatorId !== userId) {
        return res.status(403).json({ message: "Unauthorized: Not the model owner" });
      }
      
      const message = await voiceCloningService.createVoiceMessage({
        ...req.body,
        creatorId: userId,
      });
      res.json(message);
    } catch (error) {
      console.error("Error creating voice message:", error);
      res.status(500).json({ message: "Failed to create voice message" });
    }
  });

  // Get voice message
  app.get('/api/voice/messages/:id', isAuthenticated, async (req: any, res) => {
    try {
      const message = await voiceCloningService.getVoiceMessage(req.params.id);
      if (!message) {
        return res.status(404).json({ message: "Voice message not found" });
      }
      res.json(message);
    } catch (error) {
      console.error("Error fetching voice message:", error);
      res.status(500).json({ message: "Failed to fetch voice message" });
    }
  });

  // Get creator's voice messages
  app.get('/api/voice/messages/creator/:creatorId', isAuthenticated, async (req: any, res) => {
    try {
      const messages = await voiceCloningService.getCreatorVoiceMessages(req.params.creatorId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching creator messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Get recipient's voice messages
  app.get('/api/voice/messages/recipient/:recipientId', isAuthenticated, async (req: any, res) => {
    try {
      const messages = await voiceCloningService.getRecipientVoiceMessages(req.params.recipientId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching recipient messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Bulk create voice messages
  app.post('/api/voice/messages/bulk', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { voiceModelId, recipients, scriptTemplate } = req.body;

      if (!recipients || !Array.isArray(recipients)) {
        return res.status(400).json({ message: "Recipients array is required" });
      }

      const model = await voiceCloningService.getVoiceModel(voiceModelId);
      if (!model) {
        return res.status(404).json({ message: "Voice model not found" });
      }
      
      if (model.creatorId !== userId) {
        return res.status(403).json({ message: "Unauthorized: Not the model owner" });
      }

      const messages = await voiceCloningService.bulkCreateMessages(
        userId,
        voiceModelId,
        recipients,
        scriptTemplate
      );

      res.json({ 
        message: `${messages.length} voice messages created successfully`,
        messages 
      });
    } catch (error) {
      console.error("Error creating bulk messages:", error);
      res.status(500).json({ message: "Failed to create bulk messages" });
    }
  });

  // Create automation
  app.post('/api/voice/automation', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const automation = await voiceCloningService.createAutomation({
        ...req.body,
        creatorId: userId,
      });
      res.json(automation);
    } catch (error) {
      console.error("Error creating automation:", error);
      res.status(500).json({ message: "Failed to create automation" });
    }
  });

  // Get creator's automations
  app.get('/api/voice/automation', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const automations = await voiceCloningService.getCreatorAutomations(userId);
      res.json(automations);
    } catch (error) {
      console.error("Error fetching automations:", error);
      res.status(500).json({ message: "Failed to fetch automations" });
    }
  });

  // Toggle automation
  app.patch('/api/voice/automation/:id/toggle', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { isActive } = req.body;
      
      const automation = await voiceCloningService.getAutomation(req.params.id);
      if (!automation) {
        return res.status(404).json({ message: "Automation not found" });
      }
      
      if (automation.creatorId !== userId) {
        return res.status(403).json({ message: "Unauthorized: Not the automation owner" });
      }
      
      await voiceCloningService.toggleAutomation(req.params.id, isActive);
      res.json({ message: "Automation toggled successfully" });
    } catch (error) {
      console.error("Error toggling automation:", error);
      res.status(500).json({ message: "Failed to toggle automation" });
    }
  });

  // Get queue status
  app.get('/api/voice/queue/status', isAuthenticated, async (req: any, res) => {
    try {
      const status = await voiceCloningService.getQueueStatus();
      res.json(status);
    } catch (error) {
      console.error("Error fetching queue status:", error);
      res.status(500).json({ message: "Failed to fetch queue status" });
    }
  });

  // ============================================================================
  // HOLOGRAPHIC STREAMING ROUTES
  // ============================================================================

  // Create avatar model
  app.post('/api/holographic/avatars', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const avatar = await holographicStreamingService.createAvatarModel({
        ...req.body,
        creatorId: userId,
      });
      res.json(avatar);
    } catch (error) {
      console.error("Error creating avatar model:", error);
      res.status(500).json({ message: "Failed to create avatar model" });
    }
  });

  // Get creator's avatars
  app.get('/api/holographic/avatars', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const avatars = await holographicStreamingService.getCreatorAvatars(userId);
      res.json(avatars);
    } catch (error) {
      console.error("Error fetching avatars:", error);
      res.status(500).json({ message: "Failed to fetch avatars" });
    }
  });

  // Get avatar details
  app.get('/api/holographic/avatars/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const avatar = await holographicStreamingService.getAvatarModel(req.params.id);
      if (!avatar) {
        return res.status(404).json({ message: "Avatar not found" });
      }
      
      if (avatar.creatorId !== userId) {
        return res.status(403).json({ message: "Unauthorized: Not the avatar owner" });
      }
      
      res.json(avatar);
    } catch (error) {
      console.error("Error fetching avatar:", error);
      res.status(500).json({ message: "Failed to fetch avatar" });
    }
  });

  // Update avatar
  app.patch('/api/holographic/avatars/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const avatar = await holographicStreamingService.getAvatarModel(req.params.id);
      if (!avatar) {
        return res.status(404).json({ message: "Avatar not found" });
      }
      
      if (avatar.creatorId !== userId) {
        return res.status(403).json({ message: "Unauthorized: Not the avatar owner" });
      }

      const allowedUpdates = {
        name: req.body.name,
        description: req.body.description,
        textureUrls: req.body.textureUrls,
        animationData: req.body.animationData,
        isActive: req.body.isActive,
      };

      await holographicStreamingService.updateAvatarModel(req.params.id, allowedUpdates);
      res.json({ message: "Avatar updated successfully" });
    } catch (error) {
      console.error("Error updating avatar:", error);
      res.status(500).json({ message: "Failed to update avatar" });
    }
  });

  // Delete avatar
  app.delete('/api/holographic/avatars/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const avatar = await holographicStreamingService.getAvatarModel(req.params.id);
      if (!avatar) {
        return res.status(404).json({ message: "Avatar not found" });
      }
      
      if (avatar.creatorId !== userId) {
        return res.status(403).json({ message: "Unauthorized: Not the avatar owner" });
      }
      
      await holographicStreamingService.deleteAvatarModel(req.params.id);
      res.json({ message: "Avatar deleted successfully" });
    } catch (error) {
      console.error("Error deleting avatar:", error);
      res.status(500).json({ message: "Failed to delete avatar" });
    }
  });

  // Create holographic stream
  app.post('/api/holographic/streams', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      if (req.body.avatarModelId) {
        const avatar = await holographicStreamingService.getAvatarModel(req.body.avatarModelId);
        if (!avatar) {
          return res.status(404).json({ message: "Avatar model not found" });
        }
        
        if (avatar.creatorId !== userId) {
          return res.status(403).json({ message: "Unauthorized: Not the avatar owner" });
        }
      }
      
      const stream = await holographicStreamingService.createStream({
        ...req.body,
        creatorId: userId,
      });
      res.json(stream);
    } catch (error) {
      console.error("Error creating holographic stream:", error);
      res.status(500).json({ message: "Failed to create holographic stream" });
    }
  });

  // Get live streams
  app.get('/api/holographic/streams/live', async (req: any, res) => {
    try {
      const streams = await holographicStreamingService.getLiveStreams();
      res.json(streams);
    } catch (error) {
      console.error("Error fetching live streams:", error);
      res.status(500).json({ message: "Failed to fetch live streams" });
    }
  });

  // Get stream details
  app.get('/api/holographic/streams/:id', async (req: any, res) => {
    try {
      const stream = await holographicStreamingService.getStream(req.params.id);
      if (!stream) {
        return res.status(404).json({ message: "Stream not found" });
      }
      res.json(stream);
    } catch (error) {
      console.error("Error fetching stream:", error);
      res.status(500).json({ message: "Failed to fetch stream" });
    }
  });

  // Update stream
  app.patch('/api/holographic/streams/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stream = await holographicStreamingService.getStream(req.params.id);
      if (!stream) {
        return res.status(404).json({ message: "Stream not found" });
      }
      
      if (stream.creatorId !== userId) {
        return res.status(403).json({ message: "Unauthorized: Not the stream owner" });
      }

      const allowedUpdates = {
        title: req.body.title,
        description: req.body.description,
        qualitySettings: req.body.qualitySettings,
        environmentSettings: req.body.environmentSettings,
        interactionSettings: req.body.interactionSettings,
      };

      await holographicStreamingService.updateStream(req.params.id, allowedUpdates);
      res.json({ message: "Stream updated successfully" });
    } catch (error) {
      console.error("Error updating stream:", error);
      res.status(500).json({ message: "Failed to update stream" });
    }
  });

  // Start stream
  app.post('/api/holographic/streams/:id/start', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stream = await holographicStreamingService.getStream(req.params.id);
      if (!stream) {
        return res.status(404).json({ message: "Stream not found" });
      }
      
      if (stream.creatorId !== userId) {
        return res.status(403).json({ message: "Unauthorized: Not the stream owner" });
      }

      if (stream.avatarModelId) {
        await holographicStreamingService.incrementAvatarUsage(stream.avatarModelId);
      }
      
      await holographicStreamingService.startStream(req.params.id);
      res.json({ message: "Stream started successfully" });
    } catch (error) {
      console.error("Error starting stream:", error);
      res.status(500).json({ message: "Failed to start stream" });
    }
  });

  // End stream
  app.post('/api/holographic/streams/:id/end', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stream = await holographicStreamingService.getStream(req.params.id);
      if (!stream) {
        return res.status(404).json({ message: "Stream not found" });
      }
      
      if (stream.creatorId !== userId) {
        return res.status(403).json({ message: "Unauthorized: Not the stream owner" });
      }
      
      await holographicStreamingService.endStream(req.params.id);
      
      const highlightsUrl = await holographicStreamingService.generateHighlights(req.params.id);
      
      res.json({ 
        message: "Stream ended successfully",
        highlightsUrl 
      });
    } catch (error) {
      console.error("Error ending stream:", error);
      res.status(500).json({ message: "Failed to end stream" });
    }
  });

  // Join stream as viewer
  app.post('/api/holographic/viewers/join', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const viewer = await holographicStreamingService.viewerJoin({
        ...req.body,
        userId,
      });
      res.json(viewer);
    } catch (error) {
      console.error("Error joining stream:", error);
      res.status(500).json({ message: "Failed to join stream" });
    }
  });

  // Leave stream
  app.post('/api/holographic/viewers/:id/leave', isAuthenticated, async (req: any, res) => {
    try {
      await holographicStreamingService.viewerLeave(req.params.id);
      res.json({ message: "Left stream successfully" });
    } catch (error) {
      console.error("Error leaving stream:", error);
      res.status(500).json({ message: "Failed to leave stream" });
    }
  });

  // Update viewer position/orientation
  app.patch('/api/holographic/viewers/:id/position', isAuthenticated, async (req: any, res) => {
    try {
      const { position, orientation } = req.body;
      await holographicStreamingService.updateViewerPosition(req.params.id, position, orientation);
      res.json({ message: "Position updated successfully" });
    } catch (error) {
      console.error("Error updating viewer position:", error);
      res.status(500).json({ message: "Failed to update viewer position" });
    }
  });

  // Record viewer gesture
  app.post('/api/holographic/viewers/:id/gesture', isAuthenticated, async (req: any, res) => {
    try {
      const { gesture } = req.body;
      await holographicStreamingService.recordViewerGesture(req.params.id, gesture);
      res.json({ message: "Gesture recorded successfully" });
    } catch (error) {
      console.error("Error recording gesture:", error);
      res.status(500).json({ message: "Failed to record gesture" });
    }
  });

  // Record viewer tip
  app.post('/api/holographic/viewers/:id/tip', isAuthenticated, async (req: any, res) => {
    try {
      const { amount } = req.body;
      await holographicStreamingService.recordViewerTip(req.params.id, amount);
      res.json({ message: "Tip recorded successfully" });
    } catch (error) {
      console.error("Error recording tip:", error);
      res.status(500).json({ message: "Failed to record tip" });
    }
  });

  // Add spatial audio track
  app.post('/api/holographic/audio', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stream = await holographicStreamingService.getStream(req.body.streamId);
      if (!stream) {
        return res.status(404).json({ message: "Stream not found" });
      }
      
      if (stream.creatorId !== userId) {
        return res.status(403).json({ message: "Unauthorized: Not the stream owner" });
      }
      
      const track = await holographicStreamingService.addSpatialAudio(req.body);
      res.json(track);
    } catch (error) {
      console.error("Error adding spatial audio:", error);
      res.status(500).json({ message: "Failed to add spatial audio" });
    }
  });

  // Update spatial audio
  app.patch('/api/holographic/audio/:id', isAuthenticated, async (req: any, res) => {
    try {
      const allowedUpdates = {
        position: req.body.position,
        volume: req.body.volume,
        isActive: req.body.isActive,
      };
      
      await holographicStreamingService.updateSpatialAudio(req.params.id, allowedUpdates);
      res.json({ message: "Spatial audio updated successfully" });
    } catch (error) {
      console.error("Error updating spatial audio:", error);
      res.status(500).json({ message: "Failed to update spatial audio" });
    }
  });

  // Remove spatial audio
  app.delete('/api/holographic/audio/:id', isAuthenticated, async (req: any, res) => {
    try {
      await holographicStreamingService.removeSpatialAudio(req.params.id);
      res.json({ message: "Spatial audio removed successfully" });
    } catch (error) {
      console.error("Error removing spatial audio:", error);
      res.status(500).json({ message: "Failed to remove spatial audio" });
    }
  });

  // Get stream analytics
  app.get('/api/holographic/streams/:id/analytics', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stream = await holographicStreamingService.getStream(req.params.id);
      if (!stream) {
        return res.status(404).json({ message: "Stream not found" });
      }
      
      if (stream.creatorId !== userId) {
        return res.status(403).json({ message: "Unauthorized: Not the stream owner" });
      }
      
      const analytics = await holographicStreamingService.getStreamAnalytics(req.params.id);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching stream analytics:", error);
      res.status(500).json({ message: "Failed to fetch stream analytics" });
    }
  });

  // ============================================================================
  // DYNAMIC PRICING AI ROUTES
  // ============================================================================

  // Create pricing strategy
  app.post('/api/pricing/strategies', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      if (req.body.contentId) {
        const content = await db.query.mediaAssets.findFirst({
          where: eq(mediaAssets.id, req.body.contentId)
        });
        
        if (!content) {
          return res.status(404).json({ message: "Content not found" });
        }
        
        if (content.ownerId !== userId) {
          return res.status(403).json({ message: "Unauthorized: Not the content owner" });
        }
      }
      
      const strategy = await dynamicPricingService.createStrategy({
        ...req.body,
        creatorId: userId,
      });
      res.json(strategy);
    } catch (error) {
      console.error("Error creating pricing strategy:", error);
      res.status(500).json({ message: "Failed to create pricing strategy" });
    }
  });

  // Get creator's pricing strategies
  app.get('/api/pricing/strategies', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const strategies = await dynamicPricingService.getCreatorStrategies(userId);
      res.json(strategies);
    } catch (error) {
      console.error("Error fetching pricing strategies:", error);
      res.status(500).json({ message: "Failed to fetch pricing strategies" });
    }
  });

  // Get strategy details
  app.get('/api/pricing/strategies/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const strategy = await dynamicPricingService.getStrategy(req.params.id);
      if (!strategy) {
        return res.status(404).json({ message: "Strategy not found" });
      }
      
      if (strategy.creatorId !== userId) {
        return res.status(403).json({ message: "Unauthorized: Not the strategy owner" });
      }
      
      res.json(strategy);
    } catch (error) {
      console.error("Error fetching strategy:", error);
      res.status(500).json({ message: "Failed to fetch strategy" });
    }
  });

  // Update pricing strategy
  app.patch('/api/pricing/strategies/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const strategy = await dynamicPricingService.getStrategy(req.params.id);
      if (!strategy) {
        return res.status(404).json({ message: "Strategy not found" });
      }
      
      if (strategy.creatorId !== userId) {
        return res.status(403).json({ message: "Unauthorized: Not the strategy owner" });
      }

      const allowedUpdates = {
        basePrice: req.body.basePrice,
        minPrice: req.body.minPrice,
        maxPrice: req.body.maxPrice,
        demandMultiplier: req.body.demandMultiplier,
        engagementWeights: req.body.engagementWeights,
        timeDecayRate: req.body.timeDecayRate,
        surgeThreshold: req.body.surgeThreshold,
        isActive: req.body.isActive,
      };

      await dynamicPricingService.updateStrategy(req.params.id, allowedUpdates);
      res.json({ message: "Strategy updated successfully" });
    } catch (error) {
      console.error("Error updating strategy:", error);
      res.status(500).json({ message: "Failed to update strategy" });
    }
  });

  // Delete pricing strategy
  app.delete('/api/pricing/strategies/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const strategy = await dynamicPricingService.getStrategy(req.params.id);
      if (!strategy) {
        return res.status(404).json({ message: "Strategy not found" });
      }
      
      if (strategy.creatorId !== userId) {
        return res.status(403).json({ message: "Unauthorized: Not the strategy owner" });
      }
      
      await dynamicPricingService.deleteStrategy(req.params.id);
      res.json({ message: "Strategy deleted successfully" });
    } catch (error) {
      console.error("Error deleting strategy:", error);
      res.status(500).json({ message: "Failed to delete strategy" });
    }
  });

  // Update demand metrics
  app.post('/api/pricing/demand', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { contentId, ...metrics } = req.body;
      
      const content = await db.query.mediaAssets.findFirst({
        where: eq(mediaAssets.id, contentId)
      });
      
      if (!content) {
        return res.status(404).json({ message: "Content not found" });
      }
      
      if (content.ownerId !== userId) {
        return res.status(403).json({ message: "Unauthorized: Not the content owner" });
      }
      
      const updated = await dynamicPricingService.updateDemandMetrics(contentId, {
        ...metrics,
        creatorId: userId,
        contentId,
      });
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating demand metrics:", error);
      res.status(500).json({ message: "Failed to update demand metrics" });
    }
  });

  // Get demand metrics
  app.get('/api/pricing/demand/:contentId', isAuthenticated, async (req: any, res) => {
    try {
      const [metrics] = await db
        .select()
        .from(demandMetrics)
        .where(eq(demandMetrics.contentId, req.params.contentId));
      
      if (!metrics) {
        return res.status(404).json({ message: "Demand metrics not found" });
      }
      
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching demand metrics:", error);
      res.status(500).json({ message: "Failed to fetch demand metrics" });
    }
  });

  // Calculate optimal price
  app.post('/api/pricing/calculate/:strategyId/:contentId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { strategyId, contentId } = req.params;
      
      const strategy = await dynamicPricingService.getStrategy(strategyId);
      if (!strategy) {
        return res.status(404).json({ message: "Strategy not found" });
      }
      
      if (strategy.creatorId !== userId) {
        return res.status(403).json({ message: "Unauthorized: Not the strategy owner" });
      }
      
      const optimalPrice = await dynamicPricingService.calculateOptimalPrice(strategyId, contentId);
      res.json({ optimalPrice });
    } catch (error) {
      console.error("Error calculating optimal price:", error);
      res.status(500).json({ message: "Failed to calculate optimal price" });
    }
  });

  // Create optimization
  app.post('/api/pricing/optimize/:strategyId/:contentId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { strategyId, contentId } = req.params;
      
      const strategy = await dynamicPricingService.getStrategy(strategyId);
      if (!strategy) {
        return res.status(404).json({ message: "Strategy not found" });
      }
      
      if (strategy.creatorId !== userId) {
        return res.status(403).json({ message: "Unauthorized: Not the strategy owner" });
      }
      
      const optimization = await dynamicPricingService.createOptimization(strategyId, contentId);
      res.json(optimization);
    } catch (error) {
      console.error("Error creating optimization:", error);
      res.status(500).json({ message: "Failed to create optimization" });
    }
  });

  // Get optimizations
  app.get('/api/pricing/optimizations/:strategyId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const strategy = await dynamicPricingService.getStrategy(req.params.strategyId);
      if (!strategy) {
        return res.status(404).json({ message: "Strategy not found" });
      }
      
      if (strategy.creatorId !== userId) {
        return res.status(403).json({ message: "Unauthorized: Not the strategy owner" });
      }
      
      const optimizations = await dynamicPricingService.getOptimizations(req.params.strategyId);
      res.json(optimizations);
    } catch (error) {
      console.error("Error fetching optimizations:", error);
      res.status(500).json({ message: "Failed to fetch optimizations" });
    }
  });

  // Apply optimization
  app.post('/api/pricing/apply/:optimizationId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const [optimization] = await db
        .select()
        .from(priceOptimization)
        .where(eq(priceOptimization.id, req.params.optimizationId));
      
      if (!optimization) {
        return res.status(404).json({ message: "Optimization not found" });
      }
      
      const strategy = await dynamicPricingService.getStrategy(optimization.strategyId);
      if (!strategy) {
        return res.status(404).json({ message: "Strategy not found" });
      }
      
      if (strategy.creatorId !== userId) {
        return res.status(403).json({ message: "Unauthorized: Not the strategy owner" });
      }
      
      await dynamicPricingService.applyOptimization(req.params.optimizationId);
      res.json({ message: "Optimization applied successfully" });
    } catch (error) {
      console.error("Error applying optimization:", error);
      res.status(500).json({ message: "Failed to apply optimization" });
    }
  });

  // Get price history
  app.get('/api/pricing/history/:contentId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const content = await db.query.mediaAssets.findFirst({
        where: eq(mediaAssets.id, req.params.contentId)
      });
      
      if (!content) {
        return res.status(404).json({ message: "Content not found" });
      }
      
      if (content.ownerId !== userId) {
        return res.status(403).json({ message: "Unauthorized: Not the content owner" });
      }
      
      const history = await dynamicPricingService.getPriceHistory(req.params.contentId);
      res.json(history);
    } catch (error) {
      console.error("Error fetching price history:", error);
      res.status(500).json({ message: "Failed to fetch price history" });
    }
  });

  // Record manual price change
  app.post('/api/pricing/record-change', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { contentId, strategyId, previousPrice, newPrice } = req.body;
      
      const content = await db.query.mediaAssets.findFirst({
        where: eq(mediaAssets.id, contentId)
      });
      
      if (!content) {
        return res.status(404).json({ message: "Content not found" });
      }
      
      if (content.ownerId !== userId) {
        return res.status(403).json({ message: "Unauthorized: Not the content owner" });
      }
      
      const history = await dynamicPricingService.recordPriceChange(
        contentId,
        strategyId,
        previousPrice,
        newPrice,
        'manual_override'
      );
      
      res.json(history);
    } catch (error) {
      console.error("Error recording price change:", error);
      res.status(500).json({ message: "Failed to record price change" });
    }
  });

  // ============================================================================
  // DEEPFAKE DETECTION SYSTEM ROUTES
  // ============================================================================

  // Scan content for deepfakes
  app.post('/api/deepfake/scan', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { contentId, scanType } = req.body;
      
      const content = await db.query.mediaAssets.findFirst({
        where: eq(mediaAssets.id, contentId)
      });
      
      if (!content) {
        return res.status(404).json({ message: "Content not found" });
      }
      
      if (content.ownerId !== userId) {
        return res.status(403).json({ message: "Unauthorized: Not the content owner" });
      }
      
      const scan = await deepfakeDetectionService.scanContent(contentId, userId, scanType);
      res.json(scan);
    } catch (error) {
      console.error("Error scanning content:", error);
      res.status(500).json({ message: "Failed to scan content" });
    }
  });

  // Get scan results
  app.get('/api/deepfake/scans/:scanId', isAuthenticated, async (req: any, res) => {
    try {
      const scan = await deepfakeDetectionService.getScan(req.params.scanId);
      if (!scan) {
        return res.status(404).json({ message: "Scan not found" });
      }
      res.json(scan);
    } catch (error) {
      console.error("Error fetching scan:", error);
      res.status(500).json({ message: "Failed to fetch scan" });
    }
  });

  // Get content scans
  app.get('/api/deepfake/content/:contentId/scans', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const content = await db.query.mediaAssets.findFirst({
        where: eq(mediaAssets.id, req.params.contentId)
      });
      
      if (!content) {
        return res.status(404).json({ message: "Content not found" });
      }
      
      if (content.ownerId !== userId) {
        return res.status(403).json({ message: "Unauthorized: Not the content owner" });
      }
      
      const scans = await deepfakeDetectionService.getContentScans(req.params.contentId);
      res.json(scans);
    } catch (error) {
      console.error("Error fetching content scans:", error);
      res.status(500).json({ message: "Failed to fetch content scans" });
    }
  });

  // Get creator scans
  app.get('/api/deepfake/creator/:creatorId/scans', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      if (req.params.creatorId !== userId) {
        return res.status(403).json({ message: "Unauthorized: Not the creator" });
      }
      
      const scans = await deepfakeDetectionService.getCreatorScans(req.params.creatorId);
      res.json(scans);
    } catch (error) {
      console.error("Error fetching creator scans:", error);
      res.status(500).json({ message: "Failed to fetch creator scans" });
    }
  });

  // Generate authenticity signature
  app.post('/api/deepfake/signature', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { contentId, signatureType } = req.body;
      
      const content = await db.query.mediaAssets.findFirst({
        where: eq(mediaAssets.id, contentId)
      });
      
      if (!content) {
        return res.status(404).json({ message: "Content not found" });
      }
      
      if (content.ownerId !== userId) {
        return res.status(403).json({ message: "Unauthorized: Not the content owner" });
      }
      
      const signature = await deepfakeDetectionService.generateAuthenticitySignature(
        contentId, 
        userId, 
        signatureType
      );
      res.json(signature);
    } catch (error) {
      console.error("Error generating signature:", error);
      res.status(500).json({ message: "Failed to generate signature" });
    }
  });

  // Verify content authenticity
  app.post('/api/deepfake/verify', isAuthenticated, async (req: any, res) => {
    try {
      const { contentId, verificationCode } = req.body;
      
      const result = await deepfakeDetectionService.verifyContentAuthenticity(
        contentId, 
        verificationCode
      );
      res.json(result);
    } catch (error) {
      console.error("Error verifying content:", error);
      res.status(500).json({ message: "Failed to verify content" });
    }
  });

  // Get content signature
  app.get('/api/deepfake/signature/:contentId', isAuthenticated, async (req: any, res) => {
    try {
      const signature = await deepfakeDetectionService.getContentSignature(req.params.contentId);
      if (!signature) {
        return res.status(404).json({ message: "No signature found for this content" });
      }
      res.json(signature);
    } catch (error) {
      console.error("Error fetching signature:", error);
      res.status(500).json({ message: "Failed to fetch signature" });
    }
  });

  // Revoke signature
  app.post('/api/deepfake/signature/:signatureId/revoke', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const signature = await deepfakeDetectionService.getSignature(req.params.signatureId);
      
      if (!signature) {
        return res.status(404).json({ message: "Signature not found" });
      }
      
      if (signature.creatorId !== userId) {
        return res.status(403).json({ message: "Unauthorized: Not the signature owner" });
      }
      
      await deepfakeDetectionService.revokeSignature(req.params.signatureId, req.body.reason);
      res.json({ message: "Signature revoked successfully" });
    } catch (error) {
      console.error("Error revoking signature:", error);
      res.status(500).json({ message: "Failed to revoke signature" });
    }
  });

  // Create deepfake report
  app.post('/api/deepfake/report', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const report = await deepfakeDetectionService.createReport({
        ...req.body,
        reporterId: userId,
      });
      res.json(report);
    } catch (error) {
      console.error("Error creating report:", error);
      res.status(500).json({ message: "Failed to create report" });
    }
  });

  // Get report
  app.get('/api/deepfake/reports/:reportId', isAuthenticated, async (req: any, res) => {
    try {
      const report = await deepfakeDetectionService.getReport(req.params.reportId);
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }
      res.json(report);
    } catch (error) {
      console.error("Error fetching report:", error);
      res.status(500).json({ message: "Failed to fetch report" });
    }
  });

  // Get creator reports
  app.get('/api/deepfake/creator/:creatorId/reports', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      if (req.params.creatorId !== userId) {
        return res.status(403).json({ message: "Unauthorized: Not the creator" });
      }
      
      const reports = await deepfakeDetectionService.getCreatorReports(req.params.creatorId);
      res.json(reports);
    } catch (error) {
      console.error("Error fetching creator reports:", error);
      res.status(500).json({ message: "Failed to fetch creator reports" });
    }
  });

  // Get user reports
  app.get('/api/deepfake/user/:userId/reports', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      if (req.params.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const reports = await deepfakeDetectionService.getUserReports(req.params.userId);
      res.json(reports);
    } catch (error) {
      console.error("Error fetching user reports:", error);
      res.status(500).json({ message: "Failed to fetch user reports" });
    }
  });

  // Get pending reports (moderators)
  app.get('/api/deepfake/reports/pending', isAuthenticated, async (req: any, res) => {
    try {
      const reports = await deepfakeDetectionService.getPendingReports();
      res.json(reports);
    } catch (error) {
      console.error("Error fetching pending reports:", error);
      res.status(500).json({ message: "Failed to fetch pending reports" });
    }
  });

  // Update report
  app.patch('/api/deepfake/reports/:reportId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const report = await deepfakeDetectionService.getReport(req.params.reportId);
      
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }
      
      if (report.reporterId !== userId && report.moderatorId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const allowedUpdates = {
        status: req.body.status,
        priority: req.body.priority,
        moderatorNotes: req.body.moderatorNotes,
        aiVerificationScore: req.body.aiVerificationScore,
      };
      
      await deepfakeDetectionService.updateReport(req.params.reportId, allowedUpdates);
      res.json({ message: "Report updated successfully" });
    } catch (error) {
      console.error("Error updating report:", error);
      res.status(500).json({ message: "Failed to update report" });
    }
  });

  // Resolve report
  app.post('/api/deepfake/reports/:reportId/resolve', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { resolution, actionTaken } = req.body;
      
      await deepfakeDetectionService.resolveReport(
        req.params.reportId, 
        resolution, 
        actionTaken, 
        userId
      );
      res.json({ message: "Report resolved successfully" });
    } catch (error) {
      console.error("Error resolving report:", error);
      res.status(500).json({ message: "Failed to resolve report" });
    }
  });

  // ============================================================================
  // FAN-TO-CREATOR MICROLENDING ROUTES
  // ============================================================================

  // Create loan listing
  app.post('/api/loans/listings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const listing = await microlendingService.createLoanListing({
        ...req.body,
        creatorId: userId,
      });
      res.json(listing);
    } catch (error) {
      console.error("Error creating loan listing:", error);
      res.status(500).json({ message: "Failed to create loan listing" });
    }
  });

  // Get creator's loan listings
  app.get('/api/loans/listings/creator/:creatorId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      if (req.params.creatorId !== userId) {
        return res.status(403).json({ message: "Unauthorized: Not the creator" });
      }
      
      const listings = await microlendingService.getCreatorListings(req.params.creatorId);
      res.json(listings);
    } catch (error) {
      console.error("Error fetching creator listings:", error);
      res.status(500).json({ message: "Failed to fetch creator listings" });
    }
  });

  // Get all active loan listings
  app.get('/api/loans/listings/active', isAuthenticated, async (req: any, res) => {
    try {
      const listings = await microlendingService.getActiveListings();
      res.json(listings);
    } catch (error) {
      console.error("Error fetching active listings:", error);
      res.status(500).json({ message: "Failed to fetch active listings" });
    }
  });

  // Get loan listing details
  app.get('/api/loans/listings/:id', isAuthenticated, async (req: any, res) => {
    try {
      const listing = await microlendingService.getListing(req.params.id);
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }
      res.json(listing);
    } catch (error) {
      console.error("Error fetching listing:", error);
      res.status(500).json({ message: "Failed to fetch listing" });
    }
  });

  // Update loan listing
  app.patch('/api/loans/listings/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const listing = await microlendingService.getListing(req.params.id);
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }
      
      if (listing.creatorId !== userId) {
        return res.status(403).json({ message: "Unauthorized: Not the listing owner" });
      }

      const allowedUpdates = {
        title: req.body.title,
        description: req.body.description,
        requestedAmount: req.body.requestedAmount,
        interestRate: req.body.interestRate,
        termMonths: req.body.termMonths,
        collateralDescription: req.body.collateralDescription,
        collateralValue: req.body.collateralValue,
        status: req.body.status,
      };

      await microlendingService.updateListing(req.params.id, allowedUpdates);
      res.json({ message: "Listing updated successfully" });
    } catch (error) {
      console.error("Error updating listing:", error);
      res.status(500).json({ message: "Failed to update listing" });
    }
  });

  // Delete loan listing
  app.delete('/api/loans/listings/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const listing = await microlendingService.getListing(req.params.id);
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }
      
      if (listing.creatorId !== userId) {
        return res.status(403).json({ message: "Unauthorized: Not the listing owner" });
      }
      
      await microlendingService.deleteListing(req.params.id);
      res.json({ message: "Listing deleted successfully" });
    } catch (error) {
      console.error("Error deleting listing:", error);
      res.status(500).json({ message: "Failed to delete listing" });
    }
  });

  // Create loan offer
  app.post('/api/loans/offers', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const offer = await microlendingService.createOffer({
        ...req.body,
        lenderId: userId,
      });
      res.json(offer);
    } catch (error) {
      console.error("Error creating loan offer:", error);
      res.status(500).json({ message: "Failed to create loan offer" });
    }
  });

  // Get offers for a listing
  app.get('/api/loans/listings/:listingId/offers', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const listing = await microlendingService.getListing(req.params.listingId);
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }
      
      if (listing.creatorId !== userId) {
        return res.status(403).json({ message: "Unauthorized: Not the listing owner" });
      }
      
      const offers = await microlendingService.getListingOffers(req.params.listingId);
      res.json(offers);
    } catch (error) {
      console.error("Error fetching listing offers:", error);
      res.status(500).json({ message: "Failed to fetch listing offers" });
    }
  });

  // Get lender's offers
  app.get('/api/loans/offers/lender/:lenderId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      if (req.params.lenderId !== userId) {
        return res.status(403).json({ message: "Unauthorized: Not the lender" });
      }
      
      const offers = await microlendingService.getLenderOffers(req.params.lenderId);
      res.json(offers);
    } catch (error) {
      console.error("Error fetching lender offers:", error);
      res.status(500).json({ message: "Failed to fetch lender offers" });
    }
  });

  // Accept loan offer
  app.post('/api/loans/offers/:offerId/accept', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const offer = await microlendingService.getOffer(req.params.offerId);
      if (!offer) {
        return res.status(404).json({ message: "Offer not found" });
      }
      
      const listing = await microlendingService.getListing(offer.listingId);
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }
      
      if (listing.creatorId !== userId) {
        return res.status(403).json({ message: "Unauthorized: Not the listing owner" });
      }
      
      const loan = await microlendingService.acceptOffer(req.params.offerId);
      res.json(loan);
    } catch (error) {
      console.error("Error accepting offer:", error);
      res.status(500).json({ message: "Failed to accept offer" });
    }
  });

  // Reject loan offer
  app.post('/api/loans/offers/:offerId/reject', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const offer = await microlendingService.getOffer(req.params.offerId);
      if (!offer) {
        return res.status(404).json({ message: "Offer not found" });
      }
      
      const listing = await microlendingService.getListing(offer.listingId);
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }
      
      if (listing.creatorId !== userId) {
        return res.status(403).json({ message: "Unauthorized: Not the listing owner" });
      }
      
      await microlendingService.updateOffer(req.params.offerId, 'rejected');
      res.json({ message: "Offer rejected successfully" });
    } catch (error) {
      console.error("Error rejecting offer:", error);
      res.status(500).json({ message: "Failed to reject offer" });
    }
  });

  // Get creator's loans
  app.get('/api/loans/creator/:creatorId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      if (req.params.creatorId !== userId) {
        return res.status(403).json({ message: "Unauthorized: Not the creator" });
      }
      
      const loans = await microlendingService.getCreatorLoans(req.params.creatorId);
      res.json(loans);
    } catch (error) {
      console.error("Error fetching creator loans:", error);
      res.status(500).json({ message: "Failed to fetch creator loans" });
    }
  });

  // Get lender's loans
  app.get('/api/loans/lender/:lenderId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      if (req.params.lenderId !== userId) {
        return res.status(403).json({ message: "Unauthorized: Not the lender" });
      }
      
      const loans = await microlendingService.getLenderLoans(req.params.lenderId);
      res.json(loans);
    } catch (error) {
      console.error("Error fetching lender loans:", error);
      res.status(500).json({ message: "Failed to fetch lender loans" });
    }
  });

  // Get loan details
  app.get('/api/loans/:loanId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const loan = await microlendingService.getLoan(req.params.loanId);
      if (!loan) {
        return res.status(404).json({ message: "Loan not found" });
      }
      
      if (loan.creatorId !== userId && loan.lenderId !== userId) {
        return res.status(403).json({ message: "Unauthorized: Not involved in this loan" });
      }
      
      res.json(loan);
    } catch (error) {
      console.error("Error fetching loan:", error);
      res.status(500).json({ message: "Failed to fetch loan" });
    }
  });

  // Make loan payment
  app.post('/api/loans/:loanId/payment', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const loan = await microlendingService.getLoan(req.params.loanId);
      if (!loan) {
        return res.status(404).json({ message: "Loan not found" });
      }
      
      if (loan.creatorId !== userId) {
        return res.status(403).json({ message: "Unauthorized: Not the borrower" });
      }
      
      const payment = await microlendingService.makePayment(req.params.loanId, req.body.amount);
      res.json(payment);
    } catch (error) {
      console.error("Error making payment:", error);
      res.status(500).json({ message: "Failed to make payment" });
    }
  });

  // Get loan payments
  app.get('/api/loans/:loanId/payments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const loan = await microlendingService.getLoan(req.params.loanId);
      if (!loan) {
        return res.status(404).json({ message: "Loan not found" });
      }
      
      if (loan.creatorId !== userId && loan.lenderId !== userId) {
        return res.status(403).json({ message: "Unauthorized: Not involved in this loan" });
      }
      
      const payments = await microlendingService.getLoanPayments(req.params.loanId);
      res.json(payments);
    } catch (error) {
      console.error("Error fetching loan payments:", error);
      res.status(500).json({ message: "Failed to fetch loan payments" });
    }
  });

  // Mark loan as defaulted
  app.post('/api/loans/:loanId/default', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const loan = await microlendingService.getLoan(req.params.loanId);
      if (!loan) {
        return res.status(404).json({ message: "Loan not found" });
      }
      
      if (loan.lenderId !== userId) {
        return res.status(403).json({ message: "Unauthorized: Only lender can mark as defaulted" });
      }
      
      await microlendingService.markLoanAsDefaulted(req.params.loanId, req.body.reason);
      res.json({ message: "Loan marked as defaulted" });
    } catch (error) {
      console.error("Error marking loan as defaulted:", error);
      res.status(500).json({ message: "Failed to mark loan as defaulted" });
    }
  });

  // Get loan collateral
  app.get('/api/loans/:loanId/collateral', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const loan = await microlendingService.getLoan(req.params.loanId);
      if (!loan) {
        return res.status(404).json({ message: "Loan not found" });
      }
      
      if (loan.creatorId !== userId && loan.lenderId !== userId) {
        return res.status(403).json({ message: "Unauthorized: Not involved in this loan" });
      }
      
      const collateral = await microlendingService.getLoanCollateral(req.params.loanId);
      res.json(collateral);
    } catch (error) {
      console.error("Error fetching loan collateral:", error);
      res.status(500).json({ message: "Failed to fetch loan collateral" });
    }
  });

  // Get loan analytics
  app.get('/api/loans/analytics/:userId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      if (req.params.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const userType = req.query.type as 'creator' | 'lender';
      if (!userType || !['creator', 'lender'].includes(userType)) {
        return res.status(400).json({ message: "Invalid user type. Must be 'creator' or 'lender'" });
      }
      
      const analytics = await microlendingService.getLoanAnalytics(req.params.userId, userType);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching loan analytics:", error);
      res.status(500).json({ message: "Failed to fetch loan analytics" });
    }
  });

  // Quick publish endpoint - orchestrates content processing and distribution
  app.post('/api/dashboard/quick-publish', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { 
        contentId, 
        platforms, 
        customCaption, 
        autoEdit, 
        aspectRatios, 
        generateGif, 
        scheduledFor 
      } = req.body;

      if (!contentId) {
        return res.status(400).json({ message: "Content ID is required" });
      }

      const results: any = {
        contentId,
        processingJob: null,
        distributionJobs: [],
        success: true,
        errors: [],
      };

      // Step 1: Auto-process content if enabled
      if (autoEdit || (aspectRatios && aspectRatios.length > 0) || generateGif) {
        try {
          const processingJob = await aiContentProcessingService.queueProcessing(
            contentId,
            `/content/${contentId}/original.mp4`,
            {
              autoEdit: autoEdit || false,
              aspectRatios: aspectRatios || [],
              generateGif: generateGif || false,
              generateTrailer: false,
              generateHighlights: false,
              addBranding: false,
            }
          );

          results.processingJob = processingJob;
        } catch (error) {
          console.error("Error creating processing job:", error);
          results.errors.push(`Processing: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Step 2: Distribute content to platforms
      try {
        const distributionOptions: any = {
          platforms: platforms && platforms.length > 0 ? platforms : undefined,
          caption: customCaption || undefined,
          scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
        };

        const distributionJobs = await distributionService.distributeContent(
          contentId,
          userId,
          distributionOptions
        );

        results.distributionJobs = distributionJobs;
      } catch (error) {
        console.error("Error creating distribution jobs:", error);
        results.errors.push(`Distribution: ${error instanceof Error ? error.message : 'Unknown error'}`);
        results.success = false;
      }

      // Return comprehensive results
      if (results.success && results.errors.length === 0) {
        res.json({
          ...results,
          message: "Content published successfully!",
        });
      } else {
        res.status(207).json({
          ...results,
          message: "Content published with some errors",
        });
      }
    } catch (error) {
      console.error("Error in quick publish:", error);
      res.status(500).json({ 
        message: "Failed to publish content",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // ============================================================================
  // EMOTIONAL AI ENGINE ROUTES
  // ============================================================================

  // Analyze interaction (sentiment analysis)
  app.post('/api/emotional-ai/analyze', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { interactionType, messageContent, interactionId, creatorId } = req.body;
      
      const analysis = await emotionalAIService.analyzeInteraction(
        userId,
        interactionType,
        messageContent,
        interactionId,
        creatorId
      );
      res.json(analysis);
    } catch (error) {
      console.error("Error analyzing interaction:", error);
      res.status(500).json({ message: "Failed to analyze interaction" });
    }
  });

  // Get analysis by ID
  app.get('/api/emotional-ai/analysis/:analysisId', isAuthenticated, async (req: any, res) => {
    try {
      const analysis = await emotionalAIService.getAnalysis(req.params.analysisId);
      if (!analysis) {
        return res.status(404).json({ message: "Analysis not found" });
      }
      res.json(analysis);
    } catch (error) {
      console.error("Error fetching analysis:", error);
      res.status(500).json({ message: "Failed to fetch analysis" });
    }
  });

  // Get user analyses
  app.get('/api/emotional-ai/user/:userId/analyses', isAuthenticated, async (req: any, res) => {
    try {
      const loggedInUserId = req.user.claims.sub;
      if (req.params.userId !== loggedInUserId) {
        return res.status(403).json({ message: "Unauthorized: Not the user" });
      }
      
      const limit = parseInt(req.query.limit as string) || 50;
      const analyses = await emotionalAIService.getUserAnalyses(req.params.userId, limit);
      res.json(analyses);
    } catch (error) {
      console.error("Error fetching user analyses:", error);
      res.status(500).json({ message: "Failed to fetch user analyses" });
    }
  });

  // Get creator analyses
  app.get('/api/emotional-ai/creator/:creatorId/analyses', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      if (req.params.creatorId !== userId) {
        return res.status(403).json({ message: "Unauthorized: Not the creator" });
      }
      
      const limit = parseInt(req.query.limit as string) || 100;
      const analyses = await emotionalAIService.getCreatorAnalyses(req.params.creatorId, limit);
      res.json(analyses);
    } catch (error) {
      console.error("Error fetching creator analyses:", error);
      res.status(500).json({ message: "Failed to fetch creator analyses" });
    }
  });

  // Get mood profile
  app.get('/api/emotional-ai/mood/:userId', isAuthenticated, async (req: any, res) => {
    try {
      const loggedInUserId = req.user.claims.sub;
      if (req.params.userId !== loggedInUserId) {
        return res.status(403).json({ message: "Unauthorized: Not the user" });
      }
      
      const profile = await emotionalAIService.getMoodProfile(req.params.userId);
      if (!profile) {
        return res.status(404).json({ message: "Mood profile not found" });
      }
      res.json(profile);
    } catch (error) {
      console.error("Error fetching mood profile:", error);
      res.status(500).json({ message: "Failed to fetch mood profile" });
    }
  });

  // Get creator mood profiles
  app.get('/api/emotional-ai/creator/:creatorId/moods', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      if (req.params.creatorId !== userId) {
        return res.status(403).json({ message: "Unauthorized: Not the creator" });
      }
      
      const limit = parseInt(req.query.limit as string) || 100;
      const profiles = await emotionalAIService.getCreatorMoodProfiles(req.params.creatorId, limit);
      res.json(profiles);
    } catch (error) {
      console.error("Error fetching creator mood profiles:", error);
      res.status(500).json({ message: "Failed to fetch creator mood profiles" });
    }
  });

  // Get recommendation by ID
  app.get('/api/emotional-ai/recommendation/:recommendationId', isAuthenticated, async (req: any, res) => {
    try {
      const recommendation = await emotionalAIService.getRecommendation(req.params.recommendationId);
      if (!recommendation) {
        return res.status(404).json({ message: "Recommendation not found" });
      }
      res.json(recommendation);
    } catch (error) {
      console.error("Error fetching recommendation:", error);
      res.status(500).json({ message: "Failed to fetch recommendation" });
    }
  });

  // Get creator recommendations
  app.get('/api/emotional-ai/creator/:creatorId/recommendations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      if (req.params.creatorId !== userId) {
        return res.status(403).json({ message: "Unauthorized: Not the creator" });
      }
      
      const onlyUnused = req.query.onlyUnused === 'true';
      const limit = parseInt(req.query.limit as string) || 50;
      const recommendations = await emotionalAIService.getCreatorRecommendations(
        req.params.creatorId, 
        onlyUnused, 
        limit
      );
      res.json(recommendations);
    } catch (error) {
      console.error("Error fetching creator recommendations:", error);
      res.status(500).json({ message: "Failed to fetch creator recommendations" });
    }
  });

  // Mark recommendation as used
  app.post('/api/emotional-ai/recommendation/:recommendationId/use', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const recommendation = await emotionalAIService.getRecommendation(req.params.recommendationId);
      
      if (!recommendation) {
        return res.status(404).json({ message: "Recommendation not found" });
      }
      
      if (recommendation.creatorId !== userId) {
        return res.status(403).json({ message: "Unauthorized: Not the recommendation owner" });
      }
      
      const { effectiveness, feedback } = req.body;
      await emotionalAIService.markRecommendationUsed(
        req.params.recommendationId, 
        effectiveness, 
        feedback
      );
      res.json({ message: "Recommendation marked as used" });
    } catch (error) {
      console.error("Error marking recommendation as used:", error);
      res.status(500).json({ message: "Failed to mark recommendation as used" });
    }
  });

  // Get high priority recommendations
  app.get('/api/emotional-ai/creator/:creatorId/priority-recommendations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      if (req.params.creatorId !== userId) {
        return res.status(403).json({ message: "Unauthorized: Not the creator" });
      }
      
      const recommendations = await emotionalAIService.getHighPriorityRecommendations(req.params.creatorId);
      res.json(recommendations);
    } catch (error) {
      console.error("Error fetching priority recommendations:", error);
      res.status(500).json({ message: "Failed to fetch priority recommendations" });
    }
  });

  return httpServer;
}
