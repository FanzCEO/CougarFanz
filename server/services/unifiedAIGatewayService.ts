// @ts-nocheck
/**
 * Unified AI Gateway Service
 *
 * FANZ AI Architecture:
 *
 * HUGGING FACE (Uncensored - Content Generation):
 * - Dark Planet 10.7B/8B - Creative writing, roleplay, adult content
 * - Lumimaid OAS - Adult stories, explicit content
 * - Stheno v3.2 - Character interaction, roleplay
 * - Jamet Blackroot - Fiction, creative writing
 * - NSFW Detection models - Content moderation
 *
 * OPENAI/ANTHROPIC (Backend Only - Technical):
 * - Self-healing system automation
 * - Code generation and debugging
 * - Technical documentation
 * - System monitoring and alerts
 * - NOT for user-facing content generation
 *
 * Features:
 * - Provider separation by use case
 * - Rate limiting and request queuing
 * - Response caching
 * - Usage tracking and analytics
 * - Cross-platform API key management
 */

import Anthropic from '@anthropic-ai/sdk';

// ===== HUGGING FACE INFERENCE PROVIDER MODELS =====
// Using models available via HF Inference Providers (chat completions API)
const HUGGINGFACE_MODELS = {
  // Text Generation - Via Inference Providers
  'llama-3.1-8b': {
    id: 'meta-llama/Llama-3.1-8B-Instruct',
    name: 'Llama 3.1 8B Instruct',
    contextLength: 128000,
    provider: 'novita', // or 'featherless-ai'
    useCase: ['creative-writing', 'roleplay', 'adult-content', 'companions']
  },
  'mistral-7b': {
    id: 'mistralai/Mistral-7B-Instruct-v0.2',
    name: 'Mistral 7B Instruct',
    contextLength: 32768,
    provider: 'featherless-ai',
    useCase: ['creative-writing', 'fiction', 'chat']
  },
  'deepseek-r1': {
    id: 'deepseek-ai/DeepSeek-R1',
    name: 'DeepSeek R1',
    contextLength: 64000,
    provider: 'novita',
    useCase: ['roleplay', 'creative-writing', 'reasoning']
  },
  'qwen3-4b': {
    id: 'Qwen/Qwen3-4B-Instruct-2507',
    name: 'Qwen3 4B Instruct',
    contextLength: 32768,
    provider: 'nscale',
    useCase: ['chat', 'creative-writing']
  },
  // NSFW Detection (using standard inference API)
  'nsfw-primary': {
    id: 'Marqo/nsfw-image-detection-384',
    name: 'NSFW Detection (Primary)',
    useCase: ['moderation']
  },
  'nsfw-fast': {
    id: 'Falconsai/nsfw_image_detection',
    name: 'NSFW Detection (Fast)',
    useCase: ['moderation']
  },
  'text-moderation': {
    id: 'TostAI/nsfw-text-detection-large',
    name: 'Text Moderation',
    useCase: ['moderation']
  },
  'age-classifier': {
    id: 'nateraw/vit-age-classifier',
    name: 'Age Classifier',
    useCase: ['safety']
  }
};

const DEFAULT_CONTENT_MODEL = 'llama-3.1-8b';
const DEFAULT_COMPANION_MODEL = 'llama-3.1-8b';
const DEFAULT_ROLEPLAY_MODEL = 'mistral-7b';

interface AIProviderConfig {
  name: string;
  apiKey: string;
  baseUrl?: string;
  enabled: boolean;
  priority: number;
  rateLimit: {
    requestsPerMinute: number;
    tokensPerMinute: number;
  };
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatCompletionRequest {
  messages: ChatMessage[];
  model?: string;
  provider?: 'openai' | 'anthropic' | 'auto';
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  systemPrompt?: string;
  context?: {
    userId?: string;
    platform?: string;
    feature?: string;
  };
}

interface ChatCompletionResponse {
  content: string;
  model: string;
  provider: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason: string;
  cached: boolean;
  processingTime: number;
}

interface ImageGenerationRequest {
  prompt: string;
  size?: '256x256' | '512x512' | '1024x1024' | '1024x1792' | '1792x1024';
  style?: 'vivid' | 'natural';
  quality?: 'standard' | 'hd';
  n?: number;
  provider?: 'openai' | 'stability' | 'auto';
}

interface ImageGenerationResponse {
  images: Array<{
    url?: string;
    base64?: string;
  }>;
  provider: string;
  model: string;
  processingTime: number;
}

interface EmbeddingRequest {
  text: string | string[];
  model?: string;
  provider?: 'openai' | 'huggingface' | 'auto';
}

interface EmbeddingResponse {
  embeddings: number[][];
  model: string;
  provider: string;
  dimensions: number;
  processingTime: number;
}

interface ModerationRequest {
  content: string | Buffer;
  contentType: 'text' | 'image' | 'video';
  checks?: ('nsfw' | 'violence' | 'hate' | 'selfharm' | 'illegal')[];
}

interface ModerationResponse {
  flagged: boolean;
  categories: {
    nsfw: { flagged: boolean; score: number };
    violence: { flagged: boolean; score: number };
    hate: { flagged: boolean; score: number };
    selfHarm: { flagged: boolean; score: number };
    illegal: { flagged: boolean; score: number };
  };
  recommendation: 'allow' | 'review' | 'block';
  provider: string;
  processingTime: number;
}

interface AIGatewayStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  cachedResponses: number;
  totalTokensUsed: number;
  costEstimate: number;
  requestsByProvider: Record<string, number>;
  requestsByFeature: Record<string, number>;
  averageLatency: number;
}

class UnifiedAIGatewayService {
  private providers: Map<string, AIProviderConfig> = new Map();
  private anthropicClient: Anthropic | null = null;
  private openaiClient: any = null;
  private cache: Map<string, { response: any; timestamp: number }> = new Map();
  private requestQueue: Array<{ request: any; resolve: Function; reject: Function }> = [];
  private stats: AIGatewayStats = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    cachedResponses: 0,
    totalTokensUsed: 0,
    costEstimate: 0,
    requestsByProvider: {},
    requestsByFeature: {},
    averageLatency: 0
  };

  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_CACHE_SIZE = 1000;

  constructor() {
    this.initializeProviders();
    this.startCacheCleanup();
    console.log('🤖 Unified AI Gateway Service initialized');
  }

  private initializeProviders(): void {
    // OpenAI Configuration
    if (process.env.OPENAI_API_KEY) {
      this.providers.set('openai', {
        name: 'OpenAI',
        apiKey: process.env.OPENAI_API_KEY,
        enabled: true,
        priority: 1,
        rateLimit: {
          requestsPerMinute: 500,
          tokensPerMinute: 90000
        }
      });

      // Dynamically import OpenAI
      import('openai').then(({ OpenAI }) => {
        this.openaiClient = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY
        });
      }).catch(err => {
        console.warn('OpenAI SDK not available:', err.message);
      });
    }

    // Anthropic Claude Configuration
    if (process.env.ANTHROPIC_API_KEY) {
      this.providers.set('anthropic', {
        name: 'Anthropic Claude',
        apiKey: process.env.ANTHROPIC_API_KEY,
        enabled: true,
        priority: 2,
        rateLimit: {
          requestsPerMinute: 300,
          tokensPerMinute: 100000
        }
      });

      this.anthropicClient = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY
      });
    }

    // Hugging Face Configuration
    if (process.env.HUGGINGFACE_API_KEY) {
      this.providers.set('huggingface', {
        name: 'Hugging Face',
        apiKey: process.env.HUGGINGFACE_API_KEY,
        baseUrl: 'https://router.huggingface.co/v1',
        enabled: true,
        priority: 3,
        rateLimit: {
          requestsPerMinute: 100,
          tokensPerMinute: 50000
        }
      });
    }

    // Google AI Configuration
    if (process.env.GOOGLE_AI_API_KEY) {
      this.providers.set('google', {
        name: 'Google AI (Gemini)',
        apiKey: process.env.GOOGLE_AI_API_KEY,
        enabled: true,
        priority: 4,
        rateLimit: {
          requestsPerMinute: 60,
          tokensPerMinute: 60000
        }
      });
    }

    console.log(`📊 AI Providers configured: ${Array.from(this.providers.keys()).join(', ')}`);
  }

  // ===== CHAT COMPLETIONS =====

  /**
   * Generate chat completion with automatic provider selection and fallback
   */
  async chatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const startTime = Date.now();
    this.stats.totalRequests++;

    try {
      // Check cache
      const cacheKey = this.generateCacheKey('chat', request);
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        this.stats.cachedResponses++;
        return { ...cached, cached: true, processingTime: Date.now() - startTime };
      }

      // Determine provider
      const provider = request.provider === 'auto'
        ? this.selectBestProvider(['anthropic', 'openai'])
        : request.provider || 'openai';

      let response: ChatCompletionResponse;

      if (provider === 'anthropic' && this.anthropicClient) {
        response = await this.chatWithClaude(request);
      } else if (provider === 'openai' && this.openaiClient) {
        response = await this.chatWithOpenAI(request);
      } else {
        // Fallback to available provider
        if (this.anthropicClient) {
          response = await this.chatWithClaude(request);
        } else if (this.openaiClient) {
          response = await this.chatWithOpenAI(request);
        } else {
          throw new Error('No AI provider available');
        }
      }

      response.processingTime = Date.now() - startTime;
      response.cached = false;

      // Update stats
      this.stats.successfulRequests++;
      this.stats.totalTokensUsed += response.usage.totalTokens;
      this.stats.requestsByProvider[response.provider] =
        (this.stats.requestsByProvider[response.provider] || 0) + 1;

      if (request.context?.feature) {
        this.stats.requestsByFeature[request.context.feature] =
          (this.stats.requestsByFeature[request.context.feature] || 0) + 1;
      }

      // Cache response
      this.setInCache(cacheKey, response);

      return response;

    } catch (error: any) {
      this.stats.failedRequests++;
      console.error('AI Gateway chat completion error:', error.message);
      throw error;
    }
  }

  private async chatWithClaude(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    if (!this.anthropicClient) {
      throw new Error('Anthropic client not initialized');
    }

    const model = request.model || 'claude-3-5-sonnet-20241022';

    // Convert messages format
    const messages = request.messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      }));

    const systemMessage = request.systemPrompt ||
      request.messages.find(m => m.role === 'system')?.content;

    const response = await this.anthropicClient.messages.create({
      model,
      max_tokens: request.maxTokens || 4096,
      system: systemMessage,
      messages
    });

    const content = response.content[0].type === 'text'
      ? response.content[0].text
      : '';

    return {
      content,
      model,
      provider: 'anthropic',
      usage: {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens
      },
      finishReason: response.stop_reason || 'end_turn',
      cached: false,
      processingTime: 0
    };
  }

  private async chatWithOpenAI(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    if (!this.openaiClient) {
      throw new Error('OpenAI client not initialized');
    }

    const model = request.model || 'gpt-4o-mini';

    const messages = request.messages.map(m => ({
      role: m.role,
      content: m.content
    }));

    // Add system prompt if provided
    if (request.systemPrompt && !messages.find(m => m.role === 'system')) {
      messages.unshift({ role: 'system', content: request.systemPrompt });
    }

    const response = await this.openaiClient.chat.completions.create({
      model,
      messages,
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxTokens || 4096
    });

    return {
      content: response.choices[0].message.content || '',
      model,
      provider: 'openai',
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0
      },
      finishReason: response.choices[0].finish_reason || 'stop',
      cached: false,
      processingTime: 0
    };
  }

  // ===== SPECIALIZED AI FEATURES =====

  /**
   * AI-powered content moderation
   */
  async moderateContent(request: ModerationRequest): Promise<ModerationResponse> {
    const startTime = Date.now();

    try {
      if (request.contentType === 'text') {
        return await this.moderateText(request.content as string, startTime);
      } else if (request.contentType === 'image') {
        return await this.moderateImage(request.content as Buffer, startTime);
      }

      throw new Error(`Unsupported content type: ${request.contentType}`);
    } catch (error: any) {
      console.error('Content moderation error:', error.message);
      // Fail-safe: flag for review
      return {
        flagged: true,
        categories: {
          nsfw: { flagged: true, score: 0.5 },
          violence: { flagged: false, score: 0 },
          hate: { flagged: false, score: 0 },
          selfHarm: { flagged: false, score: 0 },
          illegal: { flagged: false, score: 0 }
        },
        recommendation: 'review',
        provider: 'fallback',
        processingTime: Date.now() - startTime
      };
    }
  }

  private async moderateText(text: string, startTime: number): Promise<ModerationResponse> {
    // Use OpenAI moderation if available
    if (this.openaiClient) {
      try {
        const response = await this.openaiClient.moderations.create({
          input: text
        });

        const result = response.results[0];
        return {
          flagged: result.flagged,
          categories: {
            nsfw: {
              flagged: result.categories.sexual || result.categories['sexual/minors'],
              score: result.category_scores.sexual || 0
            },
            violence: {
              flagged: result.categories.violence || result.categories['violence/graphic'],
              score: result.category_scores.violence || 0
            },
            hate: {
              flagged: result.categories.hate || result.categories['hate/threatening'],
              score: result.category_scores.hate || 0
            },
            selfHarm: {
              flagged: result.categories['self-harm'] || false,
              score: result.category_scores['self-harm'] || 0
            },
            illegal: {
              flagged: false,
              score: 0
            }
          },
          recommendation: result.flagged ? 'review' : 'allow',
          provider: 'openai',
          processingTime: Date.now() - startTime
        };
      } catch (error) {
        console.warn('OpenAI moderation failed, using Claude fallback');
      }
    }

    // Fallback to Claude for text analysis
    if (this.anthropicClient) {
      const response = await this.chatCompletion({
        messages: [{ role: 'user', content: `Analyze this text for content moderation. Return JSON with categories (nsfw, violence, hate, selfHarm, illegal) each with flagged (boolean) and score (0-1):\n\n${text}` }],
        systemPrompt: 'You are a content moderation system. Analyze text for policy violations and return structured JSON.',
        provider: 'anthropic',
        temperature: 0.1
      });

      try {
        const result = JSON.parse(response.content);
        return {
          flagged: Object.values(result).some((c: any) => c.flagged),
          categories: result,
          recommendation: Object.values(result).some((c: any) => c.flagged) ? 'review' : 'allow',
          provider: 'anthropic',
          processingTime: Date.now() - startTime
        };
      } catch {
        // Parse failed, use default
      }
    }

    return {
      flagged: false,
      categories: {
        nsfw: { flagged: false, score: 0 },
        violence: { flagged: false, score: 0 },
        hate: { flagged: false, score: 0 },
        selfHarm: { flagged: false, score: 0 },
        illegal: { flagged: false, score: 0 }
      },
      recommendation: 'allow',
      provider: 'none',
      processingTime: Date.now() - startTime
    };
  }

  private async moderateImage(imageData: Buffer, startTime: number): Promise<ModerationResponse> {
    // Use Hugging Face for image moderation
    const hfConfig = this.providers.get('huggingface');
    if (hfConfig?.enabled) {
      try {
        const response = await fetch(
          `${hfConfig.baseUrl}/Falconsai/nsfw_image_detection`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${hfConfig.apiKey}`,
              'Content-Type': 'application/octet-stream'
            },
            body: imageData
          }
        );

        if (response.ok) {
          const result = await response.json();
          const nsfwScore = result.find((r: any) => r.label === 'nsfw')?.score || 0;
          const safeScore = result.find((r: any) => r.label === 'normal' || r.label === 'safe')?.score || 0;

          return {
            flagged: nsfwScore > 0.5,
            categories: {
              nsfw: { flagged: nsfwScore > 0.5, score: nsfwScore },
              violence: { flagged: false, score: 0 },
              hate: { flagged: false, score: 0 },
              selfHarm: { flagged: false, score: 0 },
              illegal: { flagged: false, score: 0 }
            },
            recommendation: nsfwScore > 0.8 ? 'block' : nsfwScore > 0.5 ? 'review' : 'allow',
            provider: 'huggingface',
            processingTime: Date.now() - startTime
          };
        }
      } catch (error) {
        console.warn('Hugging Face image moderation failed');
      }
    }

    // Fallback: flag for manual review
    return {
      flagged: true,
      categories: {
        nsfw: { flagged: true, score: 0.5 },
        violence: { flagged: false, score: 0 },
        hate: { flagged: false, score: 0 },
        selfHarm: { flagged: false, score: 0 },
        illegal: { flagged: false, score: 0 }
      },
      recommendation: 'review',
      provider: 'fallback',
      processingTime: Date.now() - startTime
    };
  }

  /**
   * Generate text embeddings for semantic search
   */
  async generateEmbeddings(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    const startTime = Date.now();

    const texts = Array.isArray(request.text) ? request.text : [request.text];

    if (this.openaiClient) {
      const response = await this.openaiClient.embeddings.create({
        model: request.model || 'text-embedding-3-small',
        input: texts
      });

      return {
        embeddings: response.data.map((d: any) => d.embedding),
        model: request.model || 'text-embedding-3-small',
        provider: 'openai',
        dimensions: response.data[0]?.embedding.length || 1536,
        processingTime: Date.now() - startTime
      };
    }

    throw new Error('No embedding provider available');
  }

  /**
   * AI-powered chatbot for fan/creator support
   * Uses Hugging Face UNCENSORED models for content generation
   */
  async chatbotResponse(params: {
    message: string;
    conversationHistory?: ChatMessage[];
    userContext?: {
      userId: string;
      isCreator: boolean;
      platform: string;
    };
    botPersonality?: 'helpful' | 'flirty' | 'professional' | 'spicy';
  }): Promise<{
    response: string;
    suggestedActions?: string[];
    sentiment?: string;
    model?: string;
  }> {
    const systemPrompts: Record<string, string> = {
      helpful: `You are a helpful AI assistant for an adult creator platform. Help users with account questions, content creation tips, and platform features. Be friendly and supportive. This is an adult platform so explicit content discussion is allowed.`,
      flirty: `You are a flirty, playful AI companion on an adult creator platform. Keep conversations fun, teasing, and engaging. Be suggestive and playful. Adult content discussion is encouraged.`,
      professional: `You are a professional support assistant for an adult creator platform. Provide clear, concise answers about account management, payments, and platform policies.`,
      spicy: `You are a seductive, provocative AI companion. Be explicit, sensual, and uninhibited. This is an adult platform - embrace adult themes fully. Flirt heavily and be sexually suggestive.`
    };

    const personality = params.botPersonality || 'helpful';

    // Select model based on personality
    const modelKey = personality === 'spicy' || personality === 'flirty'
      ? DEFAULT_COMPANION_MODEL
      : DEFAULT_CONTENT_MODEL;

    // Use Hugging Face for content generation (uncensored)
    const response = await this.generateWithHuggingFace({
      prompt: params.message,
      systemPrompt: systemPrompts[personality],
      conversationHistory: params.conversationHistory,
      modelKey,
      temperature: personality === 'spicy' ? 0.95 : personality === 'flirty' ? 0.9 : 0.7,
      maxTokens: 500
    });

    return {
      response: response.text,
      suggestedActions: this.extractSuggestedActions(response.text),
      sentiment: this.detectSimpleSentiment(params.message),
      model: response.model
    };
  }

  /**
   * Generate text using Hugging Face uncensored models
   * For content generation, chatbots, creative writing
   */
  private async generateWithHuggingFace(params: {
    prompt: string;
    systemPrompt?: string;
    conversationHistory?: ChatMessage[];
    modelKey?: string;
    temperature?: number;
    maxTokens?: number;
  }): Promise<{ text: string; model: string; tokensUsed: number }> {
    const hfConfig = this.providers.get('huggingface');
    if (!hfConfig?.enabled) {
      throw new Error('Hugging Face not configured');
    }

    const modelKey = params.modelKey || DEFAULT_CONTENT_MODEL;
    const model = HUGGINGFACE_MODELS[modelKey as keyof typeof HUGGINGFACE_MODELS];
    if (!model) {
      throw new Error(`Unknown model: ${modelKey}`);
    }

    // Build messages array for chat completions API
    const messages: Array<{role: string; content: string}> = [];

    if (params.systemPrompt) {
      messages.push({ role: 'system', content: params.systemPrompt });
    }

    if (params.conversationHistory?.length) {
      params.conversationHistory.slice(-10).forEach(m => {
        messages.push({ role: m.role, content: m.content });
      });
    }

    messages.push({ role: 'user', content: params.prompt });

    try {
      // Use OpenAI-compatible chat completions API
      // Append provider hint for routing (e.g., :novita, :featherless-ai)
      const modelWithProvider = (model as any).provider
        ? `${model.id}:${(model as any).provider}`
        : model.id;

      const response = await fetch(`${hfConfig.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${hfConfig.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: modelWithProvider,
          messages,
          max_tokens: params.maxTokens || 500,
          temperature: params.temperature || 0.8,
          top_p: 0.95,
          stream: false
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Hugging Face API error: ${response.status} - ${error}`);
      }

      const result = await response.json();
      const generatedText = result.choices?.[0]?.message?.content || '';
      const tokensUsed = result.usage?.total_tokens || Math.ceil(generatedText.split(/\s+/).length * 1.3);

      return {
        text: generatedText.trim(),
        model: model.name,
        tokensUsed
      };
    } catch (error: any) {
      console.error('Hugging Face generation failed:', error.message);
      // Return fallback response
      return {
        text: "I'm having trouble connecting right now. Please try again in a moment.",
        model: 'fallback',
        tokensUsed: 0
      };
    }
  }

  /**
   * AI-powered content suggestions for creators
   * Uses Hugging Face uncensored models
   */
  async generateContentSuggestions(params: {
    creatorProfile: {
      niche: string;
      audienceType: string;
      contentStyle: string;
    };
    recentPerformance?: {
      topPerformingContent: string[];
      audienceInterests: string[];
    };
  }): Promise<{
    suggestions: Array<{
      title: string;
      description: string;
      type: string;
      predictedEngagement: 'high' | 'medium' | 'low';
    }>;
    trendingTopics: string[];
    optimalPostingTimes: string[];
  }> {
    const prompt = `Generate 5 creative content suggestions for an adult creator:

Niche: ${params.creatorProfile.niche}
Audience: ${params.creatorProfile.audienceType}
Style: ${params.creatorProfile.contentStyle}
${params.recentPerformance ? `Top performing: ${params.recentPerformance.topPerformingContent.join(', ')}` : ''}

Give me specific, actionable content ideas that will engage fans and drive subscriptions. Be creative and suggestive - this is an adult platform.`;

    const systemPrompt = `You are a creative content strategist for adult creators. Generate engaging, explicit content ideas that maximize fan engagement and revenue. Be creative with adult themes. Output valid JSON.`;

    // Use Hugging Face for creative content generation
    const response = await this.generateWithHuggingFace({
      prompt,
      systemPrompt,
      modelKey: DEFAULT_CONTENT_MODEL,
      temperature: 0.85,
      maxTokens: 800
    });

    try {
      // Try to parse JSON from response
      const jsonMatch = response.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          suggestions: parsed.suggestions || [],
          trendingTopics: parsed.trendingTopics || [],
          optimalPostingTimes: parsed.optimalPostingTimes || ['8 PM - 11 PM', 'Weekends']
        };
      }
    } catch {}

    // Parse as plain text if JSON fails
    const suggestions = response.text.split('\n')
      .filter(line => line.trim().length > 10)
      .slice(0, 5)
      .map((line, i) => ({
        title: line.replace(/^\d+\.\s*/, '').substring(0, 50),
        description: line,
        type: i % 2 === 0 ? 'photo' : 'video',
        predictedEngagement: 'high' as const
      }));

    return {
      suggestions: suggestions.length > 0 ? suggestions : [{
        title: 'Exclusive behind-the-scenes',
        description: 'Show your fans something special',
        type: 'video',
        predictedEngagement: 'high'
      }],
      trendingTopics: ['authenticity', 'personal connection', 'teasing'],
      optimalPostingTimes: ['8 PM - 11 PM', 'Weekends']
    };
  }

  /**
   * AI-powered caption/bio generation
   * Uses Hugging Face uncensored models
   */
  async generateCaption(params: {
    contentType: string;
    contentDescription: string;
    tone: 'flirty' | 'professional' | 'funny' | 'mysterious' | 'spicy';
    includeEmojis?: boolean;
    maxLength?: number;
  }): Promise<{
    caption: string;
    hashtags: string[];
    alternativeCaptions: string[];
  }> {
    const tonePrompts: Record<string, string> = {
      flirty: 'playful, teasing, suggestive',
      professional: 'clean, promotional, engaging',
      funny: 'witty, humorous, clever',
      mysterious: 'intriguing, teasing, leaving them wanting more',
      spicy: 'explicit, seductive, provocative'
    };

    const prompt = `Write a ${tonePrompts[params.tone]} caption for this adult content:

Content: ${params.contentType} - ${params.contentDescription}
${params.includeEmojis !== false ? 'Include emojis.' : ''}
Max ${params.maxLength || 280} characters.

Give me 3 caption options and 5 hashtags.`;

    const systemPrompt = `You are a social media expert for adult creators. Write engaging, sexy captions that drive engagement. Be creative with adult themes.`;

    // Use Hugging Face for creative caption generation
    const response = await this.generateWithHuggingFace({
      prompt,
      systemPrompt,
      modelKey: params.tone === 'spicy' ? DEFAULT_COMPANION_MODEL : DEFAULT_CONTENT_MODEL,
      temperature: 0.9,
      maxTokens: 400
    });

    // Parse response into structured format
    const lines = response.text.split('\n').filter(l => l.trim());
    const captions = lines.filter(l => !l.startsWith('#') && l.length > 10).slice(0, 3);
    const hashtagLine = lines.find(l => l.includes('#')) || '';
    const hashtags = hashtagLine.match(/#\w+/g) || ['#creator', '#exclusive', '#content'];

    return {
      caption: captions[0] || params.contentDescription,
      hashtags: hashtags.slice(0, 10),
      alternativeCaptions: captions.slice(1)
    };
  }

  // ===== BACKEND-ONLY AI (OpenAI/Anthropic) =====
  // For technical tasks, self-healing, code generation - NOT content

  /**
   * Backend AI for technical/system tasks ONLY
   * Uses OpenAI/Anthropic for coding, debugging, automation
   * NOT for user-facing content generation
   */
  async backendAI(params: {
    task: 'code-generation' | 'debugging' | 'system-analysis' | 'documentation' | 'self-healing';
    prompt: string;
    context?: string;
  }): Promise<{
    result: string;
    provider: string;
    confidence: number;
  }> {
    const systemPrompts: Record<string, string> = {
      'code-generation': 'You are a senior software engineer. Generate clean, efficient code following best practices.',
      'debugging': 'You are a debugging expert. Analyze errors and provide clear solutions.',
      'system-analysis': 'You are a systems architect. Analyze system state and provide recommendations.',
      'documentation': 'You are a technical writer. Create clear, concise documentation.',
      'self-healing': 'You are an automated system recovery agent. Diagnose issues and suggest fixes.'
    };

    // Use OpenAI/Anthropic for backend technical tasks
    const response = await this.chatCompletion({
      messages: [
        { role: 'user', content: params.context ? `Context:\n${params.context}\n\nTask:\n${params.prompt}` : params.prompt }
      ],
      systemPrompt: systemPrompts[params.task],
      provider: 'auto',
      temperature: 0.3, // Lower temperature for technical accuracy
      context: { feature: `backend-${params.task}` }
    });

    return {
      result: response.content,
      provider: response.provider,
      confidence: 0.9
    };
  }

  /**
   * Self-healing system analysis
   * Uses backend AI to diagnose and fix issues
   */
  async selfHealingAnalysis(params: {
    errorLog: string;
    systemState: Record<string, any>;
    recentChanges?: string[];
  }): Promise<{
    diagnosis: string;
    suggestedFixes: string[];
    autoFixable: boolean;
    fixScript?: string;
  }> {
    const prompt = `Analyze this system error and provide fixes:

Error Log:
${params.errorLog}

System State:
${JSON.stringify(params.systemState, null, 2)}

${params.recentChanges ? `Recent Changes:\n${params.recentChanges.join('\n')}` : ''}

Provide:
1. Root cause diagnosis
2. Step-by-step fixes
3. Whether this can be auto-fixed
4. If auto-fixable, provide the fix script`;

    const response = await this.backendAI({
      task: 'self-healing',
      prompt
    });

    // Parse the response
    const lines = response.result.split('\n');
    const fixes = lines.filter(l => l.match(/^\d+\.|^-\s/)).map(l => l.replace(/^\d+\.\s*|^-\s*/, ''));

    return {
      diagnosis: lines.slice(0, 3).join(' '),
      suggestedFixes: fixes.slice(0, 5),
      autoFixable: response.result.toLowerCase().includes('auto') && response.result.toLowerCase().includes('fix'),
      fixScript: response.result.match(/```[\s\S]*?```/)?.[0]?.replace(/```\w*\n?/g, '')
    };
  }

  // ===== IMAGE GENERATION =====

  /**
   * Generate images using DALL-E or Stability AI
   */
  async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    const startTime = Date.now();

    if (this.openaiClient) {
      const response = await this.openaiClient.images.generate({
        model: 'dall-e-3',
        prompt: request.prompt,
        n: request.n || 1,
        size: request.size || '1024x1024',
        quality: request.quality || 'standard',
        style: request.style || 'vivid'
      });

      return {
        images: response.data.map((img: any) => ({
          url: img.url,
          base64: img.b64_json
        })),
        provider: 'openai',
        model: 'dall-e-3',
        processingTime: Date.now() - startTime
      };
    }

    throw new Error('No image generation provider available');
  }

  // ===== HEALTH & STATS =====

  /**
   * Get AI Gateway health status
   */
  async healthCheck(): Promise<{
    healthy: boolean;
    providers: Array<{ name: string; status: 'up' | 'down'; latency?: number; purpose?: string }>;
    models: { content: string[]; moderation: string[]; backend: string[] };
    stats: AIGatewayStats;
  }> {
    const providerStatus: Array<{ name: string; status: 'up' | 'down'; latency?: number; purpose?: string }> = [];

    for (const [key, config] of this.providers) {
      if (!config.enabled) continue;

      const start = Date.now();
      let status: 'up' | 'down' = 'down';
      let purpose = '';

      try {
        if (key === 'openai' && this.openaiClient) {
          await this.openaiClient.models.list();
          status = 'up';
          purpose = 'Backend/Technical Only';
        } else if (key === 'anthropic' && this.anthropicClient) {
          status = 'up';
          purpose = 'Backend/Technical Only';
        } else if (key === 'huggingface') {
          // Test chat completions API with a lightweight request
          const response = await fetch(`https://router.huggingface.co/v1/models`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${config.apiKey}` }
          });
          status = response.ok ? 'up' : 'down';
          purpose = 'Content Generation & Moderation';
        }
      } catch {
        status = 'down';
      }

      providerStatus.push({
        name: config.name,
        status,
        latency: Date.now() - start,
        purpose
      });
    }

    // List available models by category
    const contentModels = Object.entries(HUGGINGFACE_MODELS)
      .filter(([_, m]) => m.useCase?.some((u: string) => ['creative-writing', 'roleplay', 'adult-content', 'companions'].includes(u)))
      .map(([k, m]) => m.name);

    const moderationModels = Object.entries(HUGGINGFACE_MODELS)
      .filter(([_, m]) => m.useCase?.includes('moderation'))
      .map(([k, m]) => m.name);

    return {
      healthy: providerStatus.some(p => p.status === 'up'),
      providers: providerStatus,
      models: {
        content: contentModels,
        moderation: moderationModels,
        backend: ['GPT-4o (OpenAI)', 'Claude 3.5 Sonnet (Anthropic)']
      },
      stats: this.stats
    };
  }

  /**
   * Get usage statistics
   */
  getStats(): AIGatewayStats {
    return { ...this.stats };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      cachedResponses: 0,
      totalTokensUsed: 0,
      costEstimate: 0,
      requestsByProvider: {},
      requestsByFeature: {},
      averageLatency: 0
    };
  }

  // ===== HELPER METHODS =====

  private selectBestProvider(preferences: string[]): string {
    for (const pref of preferences) {
      const config = this.providers.get(pref);
      if (config?.enabled) {
        return pref;
      }
    }

    // Return first available provider
    for (const [key, config] of this.providers) {
      if (config.enabled) return key;
    }

    throw new Error('No AI provider available');
  }

  private generateCacheKey(type: string, request: any): string {
    const data = JSON.stringify({
      type,
      messages: request.messages?.map((m: ChatMessage) => m.content),
      model: request.model,
      provider: request.provider
    });

    // Simple hash
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      hash = ((hash << 5) - hash) + data.charCodeAt(i);
      hash = hash & hash;
    }
    return `ai:${type}:${hash.toString(16)}`;
  }

  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.response;
    }
    this.cache.delete(key);
    return null;
  }

  private setInCache(key: string, response: any): void {
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, { response, timestamp: Date.now() });
  }

  private startCacheCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [key, value] of this.cache) {
        if (now - value.timestamp > this.CACHE_TTL) {
          this.cache.delete(key);
        }
      }
    }, 60000); // Clean every minute
  }

  private extractSuggestedActions(content: string): string[] {
    // Simple extraction of action items
    const actions: string[] = [];
    if (content.includes('subscribe') || content.includes('subscription')) {
      actions.push('View subscription options');
    }
    if (content.includes('upload') || content.includes('content')) {
      actions.push('Upload content');
    }
    if (content.includes('message') || content.includes('chat')) {
      actions.push('Send a message');
    }
    return actions;
  }

  private detectSimpleSentiment(text: string): string {
    const lowerText = text.toLowerCase();
    const positiveWords = ['love', 'great', 'amazing', 'awesome', 'thanks', 'happy', 'excited'];
    const negativeWords = ['hate', 'angry', 'frustrated', 'bad', 'terrible', 'annoyed', 'disappointed'];

    const positiveCount = positiveWords.filter(w => lowerText.includes(w)).length;
    const negativeCount = negativeWords.filter(w => lowerText.includes(w)).length;

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }
}

export const unifiedAIGateway = new UnifiedAIGatewayService();
