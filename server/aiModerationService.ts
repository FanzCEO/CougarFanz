import { db } from "./db";
import { 
  aiContentFlags, contentSafetyScores, mediaAssets,
  type InsertAIContentFlag 
} from "@shared/schema";
import { eq, and } from "drizzle-orm";

// AI Moderation Service for automated content analysis
export class AIModerationService {
  
  // Confidence thresholds for auto-actions
  private readonly THRESHOLDS = {
    CRITICAL: 90.0, // Auto-block content
    HIGH: 75.0,     // Flag for human review
    MEDIUM: 60.0,   // Monitor closely
    LOW: 40.0,      // Log for pattern analysis
  };

  // Flag types and their severity
  private readonly FLAG_SEVERITY = {
    potential_minor: 'CRITICAL',
    violence: 'CRITICAL',        // Violence should be CRITICAL
    nsfw_extreme: 'CRITICAL',    // Extreme NSFW should be CRITICAL
    hate_symbols: 'HIGH',
    deepfake: 'MEDIUM',
    suspicious_text: 'LOW',
  };

  // =============================================================================
  // CONTENT ANALYSIS
  // =============================================================================

  /**
   * Analyze image content for prohibited categories
   * In production, this would call real AI vision models
   */
  async analyzeImage(contentId: string, imageUrl: string): Promise<void> {
    // Simulate AI vision analysis
    // In production: Call Claude Vision, GPT-4 Vision, or custom ML model
    const analysisResults = await this.simulateImageAnalysis(imageUrl);

    // Store each flag if confidence exceeds threshold
    for (const [flagType, confidence] of Object.entries(analysisResults)) {
      if (confidence > this.THRESHOLDS.LOW) {
        await this.createFlag({
          contentId,
          flagType: flagType as any,
          confidence: confidence.toString(),
          model: 'ai-vision-v1',
          details: {
            imageUrl,
            analysisTimestamp: new Date().toISOString(),
            rawScores: analysisResults,
          },
        });
      }
    }

    // Update content safety score
    await this.updateContentSafetyScore(contentId);
  }

  /**
   * Analyze video content
   */
  async analyzeVideo(contentId: string, videoUrl: string): Promise<void> {
    // Simulate video analysis (sample frames + audio)
    const analysisResults = await this.simulateVideoAnalysis(videoUrl);

    for (const [flagType, confidence] of Object.entries(analysisResults)) {
      if (confidence > this.THRESHOLDS.LOW) {
        await this.createFlag({
          contentId,
          flagType: flagType as any,
          confidence: confidence.toString(),
          model: 'ai-video-v1',
          details: {
            videoUrl,
            framesAnalyzed: 10, // Sample frames
            audioAnalyzed: true,
            rawScores: analysisResults,
          },
        });
      }
    }

    await this.updateContentSafetyScore(contentId);
  }

  /**
   * Analyze text content (captions, descriptions)
   */
  async analyzeText(contentId: string, text: string): Promise<void> {
    const analysisResults = await this.simulateTextAnalysis(text);

    if (analysisResults.suspicious_text > this.THRESHOLDS.LOW) {
      await this.createFlag({
        contentId,
        flagType: 'suspicious_text',
        confidence: analysisResults.suspicious_text.toString(),
        model: 'ai-text-v1',
        details: {
          textLength: text.length,
          flaggedPhrases: analysisResults.flaggedPhrases || [],
          sentimentScore: analysisResults.sentiment || 0,
        },
      });
    }

    await this.updateContentSafetyScore(contentId);
  }

  /**
   * Comprehensive content analysis (all media types)
   */
  async analyzeContent(contentId: string): Promise<void> {
    const content = await db
      .select()
      .from(mediaAssets)
      .where(eq(mediaAssets.id, contentId))
      .limit(1);

    if (!content[0]) {
      throw new Error('Content not found');
    }

    const asset = content[0];
    const internalPath = asset.objectPath;

    if (!internalPath) {
      console.warn(`No path found for content ${contentId}`);
      return;
    }

    // Get publicly accessible URL for AI services
    const accessibleUrl = await this.getAccessibleUrl(internalPath);

    // Determine media type from mimeType
    const isImage = asset.mimeType?.startsWith('image/');
    const isVideo = asset.mimeType?.startsWith('video/');

    // Analyze based on media type
    if (isImage) {
      await this.analyzeImage(contentId, accessibleUrl);
    } else if (isVideo) {
      await this.analyzeVideo(contentId, accessibleUrl);
    }

    // Always analyze text if present
    if (asset.description) {
      await this.analyzeText(contentId, asset.description);
    }
  }

  // =============================================================================
  // FLAG MANAGEMENT
  // =============================================================================

  /**
   * Create an AI flag
   */
  async createFlag(data: InsertAIContentFlag) {
    const [flag] = await db
      .insert(aiContentFlags)
      .values(data)
      .returning();

    console.log(`AI Flag created: ${flag.flagType} (${data.confidence}% confidence) for content ${data.contentId}`);

    // Check if auto-action is needed for CRITICAL-severity flags
    const confidence = parseFloat(data.confidence);
    const severity = this.FLAG_SEVERITY[flag.flagType as keyof typeof this.FLAG_SEVERITY];
    
    // Trigger auto-action if:
    // 1. Flag has CRITICAL severity (potential_minor, violence, nsfw_extreme), OR
    // 2. Confidence meets CRITICAL threshold (≥90%) regardless of severity
    if (severity === 'CRITICAL' || confidence >= this.THRESHOLDS.CRITICAL) {
      await this.triggerAutoAction(data.contentId, flag.flagType, confidence);
    }

    return flag;
  }

  /**
   * Get all flags for content
   */
  async getContentFlags(contentId: string) {
    return await db
      .select()
      .from(aiContentFlags)
      .where(eq(aiContentFlags.contentId, contentId));
  }

  /**
   * Mark flag as reviewed by human moderator
   */
  async reviewFlag(flagId: string, override: boolean) {
    await db
      .update(aiContentFlags)
      .set({
        isReviewed: true,
        reviewerOverride: override,
      })
      .where(eq(aiContentFlags.id, flagId));
  }

  // =============================================================================
  // SAFETY SCORING
  // =============================================================================

  /**
   * Update content safety score based on AI flags
   */
  async updateContentSafetyScore(contentId: string) {
    const flags = await this.getContentFlags(contentId);
    
    // Calculate overall safety score (100 = safest, 0 = most dangerous)
    let overallScore = 100.0;
    let criticalFlags = 0;
    let highFlags = 0;
    
    for (const flag of flags) {
      const confidence = parseFloat(flag.confidence);
      const confidenceRatio = confidence / 100.0; // Normalize to 0-1 range
      const severity = this.FLAG_SEVERITY[flag.flagType as keyof typeof this.FLAG_SEVERITY];
      
      // Deduct points based on severity and normalized confidence
      // Maximum deduction per flag: CRITICAL=80, HIGH=50, MEDIUM=30, LOW=10
      if (severity === 'CRITICAL') {
        overallScore -= confidenceRatio * 80; // Max 80 points
        criticalFlags++;
      } else if (severity === 'HIGH') {
        overallScore -= confidenceRatio * 50; // Max 50 points
        highFlags++;
      } else if (severity === 'MEDIUM') {
        overallScore -= confidenceRatio * 30; // Max 30 points
      } else {
        overallScore -= confidenceRatio * 10; // Max 10 points
      }
    }

    overallScore = Math.max(0, overallScore); // Floor at 0

    // Determine risk level
    let riskLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical' = 'safe';
    if (overallScore < 20 || criticalFlags > 0) riskLevel = 'critical';
    else if (overallScore < 40 || highFlags > 2) riskLevel = 'high';
    else if (overallScore < 60) riskLevel = 'medium';
    else if (overallScore < 80) riskLevel = 'low';

    // Upsert safety score
    const existing = await db
      .select()
      .from(contentSafetyScores)
      .where(eq(contentSafetyScores.contentId, contentId))
      .limit(1);

    if (existing[0]) {
      await db
        .update(contentSafetyScores)
        .set({
          overallScore: overallScore.toFixed(2),
          aiFlags: flags.length,
          riskLevel,
          updatedAt: new Date(),
        })
        .where(eq(contentSafetyScores.contentId, contentId));
    } else {
      await db
        .insert(contentSafetyScores)
        .values({
          contentId,
          overallScore: overallScore.toFixed(2),
          aiFlags: flags.length,
          riskLevel,
        });
    }

    return { overallScore, riskLevel, flagCount: flags.length };
  }

  /**
   * Get content safety score
   */
  async getSafetyScore(contentId: string) {
    const score = await db
      .select()
      .from(contentSafetyScores)
      .where(eq(contentSafetyScores.contentId, contentId))
      .limit(1);

    return score[0] || null;
  }

  /**
   * Get auto-action status for content
   */
  async getAutoActionStatus(contentId: string) {
    const score = await this.getSafetyScore(contentId);
    
    if (!score) {
      return {
        autoActionTaken: false,
        humanReviewStatus: null,
        message: "No safety score found"
      };
    }

    return {
      autoActionTaken: score.autoActionTaken || false,
      humanReviewStatus: score.humanReviewStatus || null,
      riskLevel: score.riskLevel,
      overallScore: score.overallScore,
    };
  }

  /**
   * Resolve auto-action (approve or reject auto-hidden content)
   */
  async resolveAutoAction(contentId: string, action: 'approve' | 'reject') {
    const score = await this.getSafetyScore(contentId);
    
    if (!score) {
      throw new Error('No safety score found for this content');
    }

    if (!score.autoActionTaken) {
      throw new Error('No auto-action was taken for this content');
    }

    // Update human review status based on action
    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    
    // If approving, clear the auto-action flag to unhide content
    const updateData: any = {
      humanReviewStatus: newStatus,
      updatedAt: new Date(),
    };
    
    if (action === 'approve') {
      updateData.autoActionTaken = false; // Clear flag to unhide content
    }
    
    await db
      .update(contentSafetyScores)
      .set(updateData)
      .where(eq(contentSafetyScores.contentId, contentId));

    // Return updated score
    const updatedScore = await this.getSafetyScore(contentId);

    return {
      contentId,
      action,
      humanReviewStatus: newStatus,
      autoActionTaken: updatedScore?.autoActionTaken || false,
      message: action === 'approve' 
        ? 'Content approved and unhidden' 
        : 'Content rejected and remains hidden',
      safetyScore: updatedScore,
    };
  }

  // =============================================================================
  // AUTO-ACTIONS
  // =============================================================================

  /**
   * Trigger automatic moderation action for critical flags
   */
  private async triggerAutoAction(contentId: string, flagType: string, confidence: number) {
    console.log(`CRITICAL FLAG: ${flagType} (${confidence}%) on content ${contentId} - Auto-action triggered`);

    // Ensure safety score exists first
    const existing = await db
      .select()
      .from(contentSafetyScores)
      .where(eq(contentSafetyScores.contentId, contentId))
      .limit(1);

    if (existing[0]) {
      // Update existing score
      await db
        .update(contentSafetyScores)
        .set({
          autoActionTaken: true,
          humanReviewStatus: 'flagged',
        })
        .where(eq(contentSafetyScores.contentId, contentId));
    } else {
      // Create new score with auto-action flag
      await db
        .insert(contentSafetyScores)
        .values({
          contentId,
          overallScore: '0.00', // Critical flag = 0 score
          riskLevel: 'critical',
          autoActionTaken: true,
          humanReviewStatus: 'flagged',
          aiFlags: 1,
        });
    }

    // In production: Could auto-hide content, notify moderators, etc.
    // For now, just log and flag for review
  }

  // =============================================================================
  // MEDIA URL HELPERS
  // =============================================================================

  /**
   * Get publicly accessible URL for media analysis
   * In production: Generate signed CDN URLs or fetch bytes from storage
   */
  private async getAccessibleUrl(internalPath: string): Promise<string> {
    // TODO: In production, replace with:
    // 1. Generate signed GCS URL: await objectStorageService.getSignedUrl(internalPath)
    // 2. Or use CDN URL if available
    // 3. Or fetch bytes and convert to base64 data URL for AI services
    
    // For now, return the path as-is for development
    // In production, this would fail with external AI services
    return internalPath;
  }

  // =============================================================================
  // SIMULATED AI ANALYSIS
  // =============================================================================
  // ⚠️ WARNING: This section uses SIMULATED analysis with random scores
  // ⚠️ DO NOT USE IN PRODUCTION - Replace with real AI model integrations
  // 
  // Production Integration Points:
  // 1. Claude Vision API: https://docs.anthropic.com/claude/docs/vision
  // 2. OpenAI GPT-4 Vision: https://platform.openai.com/docs/guides/vision
  // 3. Custom ML Model: Your trained content moderation model
  // 4. Third-party Services: ModerateContent, Sightengine, etc.
  // =============================================================================

  private async simulateImageAnalysis(imageUrl: string) {
    // ⚠️ PLACEHOLDER: Replace with real AI vision model
    // Real implementation example:
    // const response = await anthropic.messages.create({
    //   model: "claude-3-5-sonnet-20241022",
    //   max_tokens: 1024,
    //   messages: [{
    //     role: "user",
    //     content: [
    //       { type: "image", source: { type: "url", url: imageUrl } },
    //       { type: "text", text: "Analyze this image for prohibited content..." }
    //     ]
    //   }]
    // });
    
    // Deterministic stub for testing (based on URL hash)
    const hash = imageUrl.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    const seed = Math.abs(hash) / 1000000;
    
    return {
      nsfw_extreme: (seed * 30) % 30,
      potential_minor: (seed * 10) % 10,
      violence: (seed * 20) % 20,
      hate_symbols: (seed * 15) % 15,
      deepfake: (seed * 25) % 25,
    };
  }

  private async simulateVideoAnalysis(videoUrl: string) {
    // ⚠️ PLACEHOLDER: Replace with real AI video model
    // Deterministic stub for testing
    const hash = videoUrl.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    const seed = Math.abs(hash) / 1000000;
    
    return {
      nsfw_extreme: (seed * 30) % 30,
      potential_minor: (seed * 10) % 10,
      violence: (seed * 25) % 25,
      hate_symbols: (seed * 15) % 15,
      deepfake: (seed * 40) % 40, // Higher for video
    };
  }

  private async simulateTextAnalysis(text: string) {
    // ⚠️ PLACEHOLDER: Replace with real AI text model
    // Check for suspicious patterns (deterministic)
    const suspiciousPatterns = [
      /\b(under|teen|young|minor)\b/i,
      /\b(contact|meet|dm)\b.*\b(price|sell|buy)\b/i,
      /\b(hate|kill|violence)\b/i,
    ];

    let suspicionScore = 0;
    const flaggedPhrases: string[] = [];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(text)) {
        suspicionScore += 30;
        flaggedPhrases.push(pattern.source);
      }
    }

    // Deterministic sentiment based on text length
    const sentimentSeed = (text.length * 7) % 100;

    return {
      suspicious_text: Math.min(100, suspicionScore),
      flaggedPhrases,
      sentiment: sentimentSeed - 50, // -50 to 50
    };
  }

  // =============================================================================
  // BATCH ANALYSIS
  // =============================================================================

  /**
   * Analyze multiple content items in batch
   */
  async batchAnalyze(contentIds: string[]) {
    const results = [];
    
    for (const contentId of contentIds) {
      try {
        await this.analyzeContent(contentId);
        const score = await this.getSafetyScore(contentId);
        results.push({ contentId, success: true, score });
      } catch (error) {
        console.error(`Failed to analyze content ${contentId}:`, error);
        results.push({ contentId, success: false, error: (error as Error).message });
      }
    }

    return results;
  }

  /**
   * Re-analyze all unreviewed flagged content
   */
  async reanalyzeUnreviewed() {
    const unreviewedFlags = await db
      .select()
      .from(aiContentFlags)
      .where(eq(aiContentFlags.isReviewed, false));

    const uniqueContentIds = Array.from(new Set(unreviewedFlags.map(f => f.contentId)));
    
    console.log(`Re-analyzing ${uniqueContentIds.length} pieces of flagged content...`);
    return await this.batchAnalyze(uniqueContentIds);
  }
}

export const aiModerationService = new AIModerationService();
