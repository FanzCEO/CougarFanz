// @ts-nocheck
/**
 * AI Gateway API Routes
 *
 * Unified API endpoints for all AI-powered features:
 * - Chat completions (Claude, GPT)
 * - Content moderation
 * - Chatbot interactions
 * - Caption generation
 * - Content suggestions
 * - Image generation
 */

import { Router, Request, Response } from 'express';
import { isAuthenticated } from '../replitAuth';
import { unifiedAIGateway } from '../services/unifiedAIGatewayService';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiting for AI endpoints
const aiRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  message: { error: 'Too many AI requests, please try again later' }
});

const chatbotRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 60, // More generous for chatbot
  message: { error: 'Chatbot rate limit exceeded' }
});

// ===== CHAT COMPLETIONS =====

/**
 * POST /api/ai/chat
 * General chat completion endpoint
 */
router.post('/chat', isAuthenticated, aiRateLimit, async (req: Request, res: Response) => {
  try {
    const { messages, model, provider, temperature, maxTokens, systemPrompt } = req.body;
    const userId = (req as any).user?.id;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const response = await unifiedAIGateway.chatCompletion({
      messages,
      model,
      provider: provider || 'auto',
      temperature,
      maxTokens,
      systemPrompt,
      context: {
        userId,
        platform: 'boyfanz',
        feature: 'chat'
      }
    });

    res.json({
      success: true,
      response: {
        content: response.content,
        model: response.model,
        provider: response.provider,
        usage: response.usage,
        cached: response.cached,
        processingTime: response.processingTime
      }
    });

  } catch (error: any) {
    console.error('AI chat error:', error.message);
    res.status(500).json({ error: 'AI chat request failed' });
  }
});

// ===== CHATBOT =====

/**
 * POST /api/ai/chatbot
 * AI chatbot for fan/creator interactions
 */
router.post('/chatbot', isAuthenticated, chatbotRateLimit, async (req: Request, res: Response) => {
  try {
    const { message, conversationHistory, personality } = req.body;
    const user = (req as any).user;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const response = await unifiedAIGateway.chatbotResponse({
      message,
      conversationHistory: conversationHistory || [],
      userContext: {
        userId: user?.id || 'anonymous',
        isCreator: user?.isCreator || false,
        platform: 'boyfanz'
      },
      botPersonality: personality || 'helpful'
    });

    res.json({
      success: true,
      response: response.response,
      suggestedActions: response.suggestedActions,
      sentiment: response.sentiment
    });

  } catch (error: any) {
    console.error('Chatbot error:', error.message);
    res.status(500).json({ error: 'Chatbot request failed' });
  }
});

/**
 * POST /api/ai/chatbot/spicy
 * Flirty AI companion (premium feature)
 */
router.post('/chatbot/spicy', isAuthenticated, chatbotRateLimit, async (req: Request, res: Response) => {
  try {
    const { message, conversationHistory } = req.body;
    const user = (req as any).user;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const response = await unifiedAIGateway.chatbotResponse({
      message,
      conversationHistory: conversationHistory || [],
      userContext: {
        userId: user?.id || 'anonymous',
        isCreator: user?.isCreator || false,
        platform: 'boyfanz'
      },
      botPersonality: 'flirty'
    });

    res.json({
      success: true,
      response: response.response,
      suggestedActions: response.suggestedActions,
      sentiment: response.sentiment
    });

  } catch (error: any) {
    console.error('Spicy chatbot error:', error.message);
    res.status(500).json({ error: 'Spicy chatbot request failed' });
  }
});

// ===== CONTENT MODERATION =====

/**
 * POST /api/ai/moderate
 * AI-powered content moderation
 */
router.post('/moderate', isAuthenticated, aiRateLimit, async (req: Request, res: Response) => {
  try {
    const { content, contentType } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    if (!contentType || !['text', 'image'].includes(contentType)) {
      return res.status(400).json({ error: 'Valid contentType (text, image) is required' });
    }

    const result = await unifiedAIGateway.moderateContent({
      content,
      contentType
    });

    res.json({
      success: true,
      moderation: {
        flagged: result.flagged,
        categories: result.categories,
        recommendation: result.recommendation,
        provider: result.provider,
        processingTime: result.processingTime
      }
    });

  } catch (error: any) {
    console.error('Moderation error:', error.message);
    res.status(500).json({ error: 'Moderation request failed' });
  }
});

// ===== CREATOR TOOLS =====

/**
 * POST /api/ai/caption
 * Generate captions for content
 */
router.post('/caption', isAuthenticated, aiRateLimit, async (req: Request, res: Response) => {
  try {
    const { contentType, contentDescription, tone, includeEmojis, maxLength } = req.body;

    if (!contentDescription) {
      return res.status(400).json({ error: 'Content description is required' });
    }

    const result = await unifiedAIGateway.generateCaption({
      contentType: contentType || 'photo',
      contentDescription,
      tone: tone || 'flirty',
      includeEmojis: includeEmojis !== false,
      maxLength: maxLength || 280
    });

    res.json({
      success: true,
      caption: result.caption,
      hashtags: result.hashtags,
      alternatives: result.alternativeCaptions
    });

  } catch (error: any) {
    console.error('Caption generation error:', error.message);
    res.status(500).json({ error: 'Caption generation failed' });
  }
});

/**
 * POST /api/ai/content-suggestions
 * Get AI-powered content suggestions for creators
 */
router.post('/content-suggestions', isAuthenticated, aiRateLimit, async (req: Request, res: Response) => {
  try {
    const { niche, audienceType, contentStyle, topPerformingContent, audienceInterests } = req.body;

    const result = await unifiedAIGateway.generateContentSuggestions({
      creatorProfile: {
        niche: niche || 'general',
        audienceType: audienceType || 'mixed',
        contentStyle: contentStyle || 'casual'
      },
      recentPerformance: topPerformingContent ? {
        topPerformingContent: topPerformingContent || [],
        audienceInterests: audienceInterests || []
      } : undefined
    });

    res.json({
      success: true,
      suggestions: result.suggestions,
      trendingTopics: result.trendingTopics,
      optimalPostingTimes: result.optimalPostingTimes
    });

  } catch (error: any) {
    console.error('Content suggestions error:', error.message);
    res.status(500).json({ error: 'Content suggestions failed' });
  }
});

/**
 * POST /api/ai/embeddings
 * Generate text embeddings for semantic search
 */
router.post('/embeddings', isAuthenticated, aiRateLimit, async (req: Request, res: Response) => {
  try {
    const { text, model } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const result = await unifiedAIGateway.generateEmbeddings({
      text,
      model
    });

    res.json({
      success: true,
      embeddings: result.embeddings,
      model: result.model,
      dimensions: result.dimensions,
      processingTime: result.processingTime
    });

  } catch (error: any) {
    console.error('Embeddings error:', error.message);
    res.status(500).json({ error: 'Embeddings generation failed' });
  }
});

// ===== IMAGE GENERATION =====

/**
 * POST /api/ai/generate-image
 * Generate images using DALL-E
 */
router.post('/generate-image', isAuthenticated, aiRateLimit, async (req: Request, res: Response) => {
  try {
    const { prompt, size, style, quality, n } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Content filter for prompt
    const moderation = await unifiedAIGateway.moderateContent({
      content: prompt,
      contentType: 'text'
    });

    if (moderation.flagged && moderation.recommendation === 'block') {
      return res.status(400).json({
        error: 'Prompt contains inappropriate content',
        flagged: true
      });
    }

    const result = await unifiedAIGateway.generateImage({
      prompt,
      size: size || '1024x1024',
      style: style || 'vivid',
      quality: quality || 'standard',
      n: Math.min(n || 1, 4)
    });

    res.json({
      success: true,
      images: result.images,
      model: result.model,
      processingTime: result.processingTime
    });

  } catch (error: any) {
    console.error('Image generation error:', error.message);
    res.status(500).json({ error: 'Image generation failed' });
  }
});

// ===== ADMIN ENDPOINTS =====

/**
 * GET /api/ai/health
 * Check AI gateway health status
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const health = await unifiedAIGateway.healthCheck();

    res.json({
      success: true,
      healthy: health.healthy,
      providers: health.providers
    });

  } catch (error: any) {
    console.error('Health check error:', error.message);
    res.status(500).json({ error: 'Health check failed', healthy: false });
  }
});

/**
 * GET /api/ai/stats
 * Get AI gateway usage statistics (admin only)
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = unifiedAIGateway.getStats();

    res.json({
      success: true,
      stats
    });

  } catch (error: any) {
    console.error('Stats error:', error.message);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

/**
 * POST /api/ai/stats/reset
 * Reset AI gateway statistics (admin only)
 */
router.post('/stats/reset', async (req: Request, res: Response) => {
  try {
    unifiedAIGateway.resetStats();

    res.json({
      success: true,
      message: 'Statistics reset successfully'
    });

  } catch (error: any) {
    console.error('Stats reset error:', error.message);
    res.status(500).json({ error: 'Failed to reset stats' });
  }
});

// ===== CROSS-PLATFORM API =====

/**
 * POST /api/ai/cross-platform/request
 * Handle AI requests from other FANZ platforms
 */
router.post('/cross-platform/request', async (req: Request, res: Response) => {
  try {
    const { apiKey, platform, requestType, payload } = req.body;

    // Validate cross-platform API key
    const validApiKey = process.env.FANZ_CROSS_PLATFORM_API_KEY;
    if (!apiKey || apiKey !== validApiKey) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    // Validate platform
    const validPlatforms = ['girlfanz', 'gayfanz', 'transfanz', 'milffanz', 'cougarfanz', 'bearfanz', 'daddyfanz', 'pupfanz', 'taboofanz', 'fanzuncut', 'fanzdash'];
    if (!validPlatforms.includes(platform)) {
      return res.status(400).json({ error: 'Invalid platform' });
    }

    let result;

    switch (requestType) {
      case 'chat':
        result = await unifiedAIGateway.chatCompletion({
          ...payload,
          context: { ...payload.context, platform }
        });
        break;

      case 'moderate':
        result = await unifiedAIGateway.moderateContent(payload);
        break;

      case 'chatbot':
        result = await unifiedAIGateway.chatbotResponse({
          ...payload,
          userContext: { ...payload.userContext, platform }
        });
        break;

      case 'embeddings':
        result = await unifiedAIGateway.generateEmbeddings(payload);
        break;

      default:
        return res.status(400).json({ error: 'Invalid request type' });
    }

    res.json({
      success: true,
      platform,
      requestType,
      result
    });

  } catch (error: any) {
    console.error('Cross-platform AI request error:', error.message);
    res.status(500).json({ error: 'Cross-platform request failed' });
  }
});

export default router;
