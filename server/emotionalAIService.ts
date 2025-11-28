import { db } from './db';
import { emotionalAnalyses, moodProfiles, responseRecommendations } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

export const emotionalAIService = {
  async analyzeInteraction(
    userId: string,
    interactionType: string,
    messageContent: string,
    interactionId?: string,
    creatorId?: string
  ) {
    const sentimentResult = this.analyzeSentiment(messageContent);
    const emotionResult = this.detectEmotion(messageContent);
    const toxicity = this.calculateToxicity(messageContent);
    const keywords = this.extractKeywords(messageContent);
    const urgency = this.determineUrgency(emotionResult, sentimentResult.score, toxicity);
    const engagementPotential = this.calculateEngagementPotential(
      emotionResult,
      sentimentResult.score,
      interactionType
    );

    const [analysis] = await db.insert(emotionalAnalyses).values({
      userId,
      interactionType: interactionType as any,
      interactionId,
      messageContent,
      sentimentScore: sentimentResult.score.toFixed(2),
      dominantEmotion: emotionResult.dominantEmotion as any,
      emotionScores: emotionResult.scores,
      urgency: urgency as any,
      responseRecommended: urgency === 'high' || urgency === 'critical',
      engagementPotential: engagementPotential.toFixed(2),
      toxicityScore: toxicity.toFixed(2),
      keywords,
      context: { interactionType, timestamp: new Date().toISOString() },
      creatorId,
    } as any).returning();

    await this.updateMoodProfile(userId, emotionResult.dominantEmotion, sentimentResult.score, creatorId);

    if (analysis.responseRecommended) {
      await this.generateResponseRecommendation(analysis.id, userId, creatorId || '', analysis);
    }

    return analysis;
  },

  analyzeSentiment(text: string): { score: number; label: string } {
    const positiveWords = ['love', 'amazing', 'great', 'awesome', 'fantastic', 'wonderful', 'excited', 'happy', 'perfect', 'excellent', 'best', 'beautiful', 'enjoy'];
    const negativeWords = ['hate', 'terrible', 'awful', 'bad', 'worst', 'horrible', 'sad', 'angry', 'disappointed', 'frustrating', 'annoying', 'poor', 'upset'];
    
    const lowerText = text.toLowerCase();
    let score = 50;
    
    positiveWords.forEach(word => {
      if (lowerText.includes(word)) {
        score += 10;
      }
    });
    
    negativeWords.forEach(word => {
      if (lowerText.includes(word)) {
        score -= 10;
      }
    });

    if (lowerText.includes('!')) score += 5;
    if (lowerText.includes('?') && score > 50) score += 3;
    
    score = Math.max(0, Math.min(100, score));
    
    const label = score >= 60 ? 'positive' : score <= 40 ? 'negative' : 'neutral';
    
    return { score, label };
  },

  detectEmotion(text: string): { dominantEmotion: string; scores: any } {
    const emotionKeywords = {
      joy: ['happy', 'excited', 'amazing', 'love', 'wonderful', 'great', 'yay', 'awesome'],
      sadness: ['sad', 'depressed', 'unhappy', 'miss', 'lonely', 'crying', 'hurt'],
      anger: ['angry', 'mad', 'furious', 'hate', 'annoyed', 'pissed'],
      fear: ['scared', 'afraid', 'worried', 'anxious', 'nervous', 'terrified'],
      surprise: ['wow', 'omg', 'shocking', 'unexpected', 'amazing', 'incredible'],
      love: ['love', 'adore', 'cherish', 'romantic', 'hearts', 'kiss'],
      excitement: ['excited', 'pumped', 'hyped', 'thrilled', 'eager', 'can\'t wait'],
      frustration: ['frustrated', 'annoying', 'irritating', 'ugh', 'seriously'],
      neutral: ['okay', 'fine', 'sure', 'alright', 'whatever']
    };

    const scores: any = {};
    const lowerText = text.toLowerCase();
    
    Object.entries(emotionKeywords).forEach(([emotion, keywords]) => {
      let score = 0;
      keywords.forEach(keyword => {
        if (lowerText.includes(keyword)) {
          score += 15;
        }
      });
      scores[emotion] = Math.min(100, score);
    });

    const dominantEmotion = Object.entries(scores).reduce((a, b) => 
      scores[a[0]] > scores[b[0]] ? a : b
    )[0];

    return { dominantEmotion, scores };
  },

  calculateToxicity(text: string): number {
    const toxicWords = ['stupid', 'idiot', 'dumb', 'loser', 'ugly', 'fat', 'worthless', 'trash', 'disgusting'];
    const lowerText = text.toLowerCase();
    
    let toxicity = 0;
    toxicWords.forEach(word => {
      if (lowerText.includes(word)) {
        toxicity += 20;
      }
    });

    if (lowerText.includes('!!')) toxicity += 5;
    if (lowerText.match(/[A-Z]{3,}/)) toxicity += 10;
    
    return Math.min(100, toxicity);
  },

  extractKeywords(text: string): string[] {
    const stopWords = ['the', 'is', 'at', 'which', 'on', 'a', 'an', 'as', 'are', 'was', 'were', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'must', 'can'];
    const words = text.toLowerCase().split(/\W+/).filter(word => 
      word.length > 3 && !stopWords.includes(word)
    );
    
    const frequency: { [key: string]: number } = {};
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });
    
    return Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
  },

  determineUrgency(
    emotionResult: any, 
    sentimentScore: number, 
    toxicity: number
  ): string {
    if (toxicity > 50 || emotionResult.dominantEmotion === 'anger') return 'critical';
    if (emotionResult.dominantEmotion === 'sadness' || sentimentScore < 30) return 'high';
    if (emotionResult.dominantEmotion === 'frustration' || sentimentScore < 40) return 'medium';
    return 'low';
  },

  calculateEngagementPotential(
    emotionResult: any, 
    sentimentScore: number, 
    interactionType: string
  ): number {
    let potential = 50;
    
    const highEngagementEmotions = ['love', 'excitement', 'joy'];
    if (highEngagementEmotions.includes(emotionResult.dominantEmotion)) {
      potential += 30;
    }
    
    if (sentimentScore > 70) potential += 20;
    if (sentimentScore < 30) potential -= 20;
    
    if (interactionType === 'tip') potential += 25;
    if (interactionType === 'subscription') potential += 20;
    if (interactionType === 'message') potential += 10;
    
    return Math.max(0, Math.min(100, potential));
  },

  async updateMoodProfile(
    userId: string, 
    emotion: string, 
    sentimentScore: number,
    creatorId?: string
  ) {
    const existingProfile = await db.query.moodProfiles.findFirst({
      where: creatorId 
        ? and(eq(moodProfiles.userId, userId), eq(moodProfiles.creatorId, creatorId))
        : eq(moodProfiles.userId, userId)
    });

    if (existingProfile) {
      const currentFreq = existingProfile.interactionFrequency || 0;
      const currentPositive = existingProfile.positiveInteractions || 0;
      const currentNegative = existingProfile.negativeInteractions || 0;
      
      const newInteractionCount = currentFreq + 1;
      const newPositive = sentimentScore > 60 ? currentPositive + 1 : currentPositive;
      const newNegative = sentimentScore < 40 ? currentNegative + 1 : currentNegative;
      const newAvgSentiment = ((parseFloat(existingProfile.averageSentiment || '50') * currentFreq) + sentimentScore) / newInteractionCount;

      const emotionalJourney = Array.isArray(existingProfile.emotionalJourney) 
        ? existingProfile.emotionalJourney 
        : [];
      emotionalJourney.push({
        timestamp: new Date().toISOString(),
        emotion,
        sentimentScore,
      });

      const currentMood = this.determineMood(emotion, sentimentScore);
      const moodScore = this.calculateMoodScore(emotion, sentimentScore);
      const moodTrend = this.calculateMoodTrend(emotionalJourney);
      const engagementLevel = this.determineEngagementLevel(newInteractionCount, newAvgSentiment);
      const churnRisk = this.calculateChurnRisk(moodTrend, newAvgSentiment, newInteractionCount);

      await db.update(moodProfiles)
        .set({
          currentMood: currentMood as any,
          moodScore: moodScore.toFixed(2),
          moodTrend: moodTrend as any,
          emotionalJourney: emotionalJourney.slice(-50),
          interactionFrequency: newInteractionCount,
          positiveInteractions: newPositive,
          negativeInteractions: newNegative,
          averageSentiment: newAvgSentiment.toFixed(2),
          lastInteractionEmotion: emotion,
          engagementLevel: engagementLevel as any,
          churnRisk: churnRisk.toFixed(2),
          recommendedActions: this.generateRecommendedActions(moodTrend, churnRisk, engagementLevel),
          lastUpdated: new Date(),
        } as any)
        .where(eq(moodProfiles.id, existingProfile.id));
    } else {
      const currentMood = this.determineMood(emotion, sentimentScore);
      const moodScore = this.calculateMoodScore(emotion, sentimentScore);

      await db.insert(moodProfiles).values({
        userId,
        currentMood: currentMood as any,
        moodScore: moodScore.toFixed(2),
        moodTrend: 'stable',
        emotionalJourney: [{
          timestamp: new Date().toISOString(),
          emotion,
          sentimentScore,
        }],
        interactionFrequency: 1,
        positiveInteractions: sentimentScore > 60 ? 1 : 0,
        negativeInteractions: sentimentScore < 40 ? 1 : 0,
        averageSentiment: sentimentScore.toFixed(2),
        lastInteractionEmotion: emotion,
        engagementLevel: 'casual',
        churnRisk: '0',
        recommendedActions: [],
        creatorId,
      } as any);
    }
  },

  determineMood(emotion: string, sentimentScore: number): string {
    if (['excitement', 'joy', 'love'].includes(emotion)) return 'excited';
    if (sentimentScore > 70) return 'positive';
    if (sentimentScore < 30) return 'negative';
    if (['anger', 'frustration'].includes(emotion)) return 'stressed';
    if (sentimentScore >= 45 && sentimentScore <= 55) return 'calm';
    return 'neutral';
  },

  calculateMoodScore(emotion: string, sentimentScore: number): number {
    const emotionBonus: { [key: string]: number } = {
      joy: 20,
      love: 25,
      excitement: 20,
      neutral: 0,
      sadness: -20,
      anger: -25,
      fear: -15,
      frustration: -15,
    };

    let score = sentimentScore + (emotionBonus[emotion] || 0);
    return Math.max(0, Math.min(100, score));
  },

  calculateMoodTrend(emotionalJourney: any[]): string {
    if (emotionalJourney.length < 5) return 'stable';
    
    const recent = emotionalJourney.slice(-5);
    const avgRecent = recent.reduce((sum, entry) => sum + entry.sentimentScore, 0) / recent.length;
    
    const older = emotionalJourney.slice(-10, -5);
    if (older.length === 0) return 'stable';
    
    const avgOlder = older.reduce((sum, entry) => sum + entry.sentimentScore, 0) / older.length;
    
    if (avgRecent > avgOlder + 10) return 'improving';
    if (avgRecent < avgOlder - 10) return 'declining';
    return 'stable';
  },

  determineEngagementLevel(interactionCount: number, avgSentiment: number): string {
    if (interactionCount > 100 && avgSentiment > 70) return 'super_fan';
    if (interactionCount > 50 && avgSentiment > 60) return 'highly_engaged';
    if (interactionCount > 20) return 'regular';
    if (interactionCount > 5) return 'casual';
    return 'disengaged';
  },

  calculateChurnRisk(moodTrend: string, avgSentiment: number, interactionCount: number): number {
    let risk = 0;
    
    if (moodTrend === 'declining') risk += 40;
    if (avgSentiment < 40) risk += 30;
    if (interactionCount < 10) risk += 20;
    if (avgSentiment < 30) risk += 10;
    
    return Math.min(100, risk);
  },

  generateRecommendedActions(moodTrend: string, churnRisk: number, engagementLevel: string): string[] {
    const actions = [];
    
    if (moodTrend === 'declining') {
      actions.push('Send personalized check-in message');
      actions.push('Offer exclusive content as appreciation');
    }
    
    if (churnRisk > 50) {
      actions.push('Priority response to next message');
      actions.push('Consider special discount or offer');
    }
    
    if (engagementLevel === 'super_fan') {
      actions.push('Invite to exclusive community');
      actions.push('Offer personalized content opportunity');
    }
    
    if (engagementLevel === 'disengaged') {
      actions.push('Re-engagement campaign');
      actions.push('Survey to understand preferences');
    }
    
    return actions;
  },

  async generateResponseRecommendation(
    analysisId: string,
    userId: string,
    creatorId: string,
    analysis: any
  ) {
    const recommendationType = this.determineRecommendationType(analysis);
    const priority = this.determinePriority(analysis.urgency, analysis.toxicityScore);
    const suggestedResponse = this.generateSuggestedResponse(analysis);
    const responseVariants = this.generateResponseVariants(analysis);
    const actionItems = this.generateActionItems(analysis);
    const expectedOutcome = this.generateExpectedOutcome(recommendationType);
    const confidenceScore = this.calculateConfidence(analysis);

    await db.insert(responseRecommendations).values({
      analysisId,
      userId,
      creatorId,
      recommendationType: recommendationType as any,
      priority: priority as any,
      suggestedResponse,
      responseVariants,
      actionItems,
      expectedOutcome,
      confidenceScore: confidenceScore.toFixed(2),
      emotionalContext: {
        emotion: analysis.dominantEmotion,
        sentiment: analysis.sentimentScore,
        urgency: analysis.urgency,
      },
      personalizationTags: this.generatePersonalizationTags(analysis),
    } as any);
  },

  determineRecommendationType(analysis: any): string {
    if (parseFloat(analysis.toxicityScore) > 50) return 'emergency_response';
    if (analysis.dominantEmotion === 'sadness') return 'empathetic_response';
    if (parseFloat(analysis.engagementPotential) > 70) return 'engagement_boost';
    if (analysis.interactionType === 'tip' || analysis.interactionType === 'purchase') return 'upsell_opportunity';
    if (parseFloat(analysis.sentimentScore) < 40) return 'retention_action';
    return 'empathetic_response';
  },

  determinePriority(urgency: string, toxicityScore: string): string {
    if (urgency === 'critical' || parseFloat(toxicityScore) > 60) return 'urgent';
    if (urgency === 'high') return 'high';
    if (urgency === 'medium') return 'medium';
    return 'low';
  },

  generateSuggestedResponse(analysis: any): string {
    const responses: { [key: string]: string[] } = {
      joy: [
        "I'm so glad you're enjoying this! Your happiness means everything to me! 💙",
        "Your energy is contagious! Thank you for being such an amazing supporter!",
      ],
      love: [
        "Your love and support mean the world to me! Thank you for being here! ❤️",
        "I appreciate you so much! Your messages always make my day!",
      ],
      sadness: [
        "I'm here for you. Thank you for sharing what you're feeling with me. 💙",
        "Sending you so much love and support. You're not alone in this.",
      ],
      anger: [
        "I hear you, and I'm sorry you're frustrated. Let's work through this together.",
        "Your feelings are valid. How can I make this better for you?",
      ],
      excitement: [
        "Your excitement is everything! Let's keep this energy going! 🔥",
        "I love your enthusiasm! Can't wait to share more with you!",
      ],
      frustration: [
        "I understand your frustration, and I'm here to help. What can I do to improve?",
        "Thank you for your patience. Let me make this right for you.",
      ],
      neutral: [
        "Thanks for reaching out! How can I make your experience even better?",
        "I appreciate you being here! What would you like to see more of?",
      ],
    };

    const emotion = analysis.dominantEmotion;
    const options = responses[emotion] || responses.neutral;
    return options[Math.floor(Math.random() * options.length)];
  },

  generateResponseVariants(analysis: any): string[] {
    const variants = [];
    const emotion = analysis.dominantEmotion;
    
    if (['joy', 'love', 'excitement'].includes(emotion)) {
      variants.push("Your support lights up my day! Thank you!");
      variants.push("I'm grateful to have you here with me!");
      variants.push("You're amazing! Thanks for being you!");
    } else if (['sadness', 'frustration'].includes(emotion)) {
      variants.push("I'm sending you love and understanding. You matter to me.");
      variants.push("Your feelings are important. I'm here to listen.");
      variants.push("Thank you for trusting me with how you feel.");
    } else {
      variants.push("I appreciate you reaching out!");
      variants.push("Thanks for being part of this journey!");
      variants.push("Your thoughts mean a lot to me!");
    }
    
    return variants;
  },

  generateActionItems(analysis: any): string[] {
    const actions = [];
    
    if (parseFloat(analysis.toxicityScore) > 40) {
      actions.push('Flag for moderation review');
      actions.push('Set boundaries if needed');
    }
    
    if (parseFloat(analysis.engagementPotential) > 70) {
      actions.push('Follow up with exclusive content');
      actions.push('Invite to special event or community');
    }
    
    if (analysis.dominantEmotion === 'sadness') {
      actions.push('Send supportive follow-up message');
      actions.push('Offer personalized attention');
    }
    
    if (analysis.interactionType === 'tip') {
      actions.push('Send personalized thank you');
      actions.push('Consider offering tipper exclusive benefit');
    }
    
    return actions;
  },

  generateExpectedOutcome(recommendationType: string): string {
    const outcomes: { [key: string]: string } = {
      empathetic_response: 'Strengthen emotional connection and build trust',
      engagement_boost: 'Increase interaction frequency and content engagement',
      upsell_opportunity: 'Drive additional purchases and increase revenue',
      retention_action: 'Reduce churn risk and improve satisfaction',
      emergency_response: 'De-escalate situation and maintain safety',
    };
    
    return outcomes[recommendationType] || 'Improve overall relationship quality';
  },

  calculateConfidence(analysis: any): number {
    let confidence = 70;
    
    if (analysis.keywords && analysis.keywords.length > 5) confidence += 10;
    if (parseFloat(analysis.sentimentScore) > 70 || parseFloat(analysis.sentimentScore) < 30) confidence += 10;
    if (analysis.dominantEmotion !== 'neutral') confidence += 10;
    
    return Math.min(100, confidence);
  },

  generatePersonalizationTags(analysis: any): string[] {
    const tags = [];
    
    tags.push(analysis.dominantEmotion);
    tags.push(analysis.interactionType);
    
    if (parseFloat(analysis.sentimentScore) > 70) tags.push('positive_sentiment');
    if (parseFloat(analysis.sentimentScore) < 40) tags.push('negative_sentiment');
    if (parseFloat(analysis.engagementPotential) > 70) tags.push('high_engagement');
    if (parseFloat(analysis.toxicityScore) > 40) tags.push('needs_moderation');
    
    return tags;
  },

  async getAnalysis(analysisId: string) {
    return await db.query.emotionalAnalyses.findFirst({
      where: eq(emotionalAnalyses.id, analysisId)
    });
  },

  async getUserAnalyses(userId: string, limit: number = 50) {
    return await db.query.emotionalAnalyses.findMany({
      where: eq(emotionalAnalyses.userId, userId),
      orderBy: [desc(emotionalAnalyses.analyzedAt)],
      limit
    });
  },

  async getCreatorAnalyses(creatorId: string, limit: number = 100) {
    return await db.query.emotionalAnalyses.findMany({
      where: eq(emotionalAnalyses.creatorId, creatorId),
      orderBy: [desc(emotionalAnalyses.analyzedAt)],
      limit
    });
  },

  async getMoodProfile(userId: string, creatorId?: string) {
    return await db.query.moodProfiles.findFirst({
      where: creatorId 
        ? and(eq(moodProfiles.userId, userId), eq(moodProfiles.creatorId, creatorId))
        : eq(moodProfiles.userId, userId)
    });
  },

  async getCreatorMoodProfiles(creatorId: string, limit: number = 100) {
    return await db.query.moodProfiles.findMany({
      where: eq(moodProfiles.creatorId, creatorId),
      orderBy: [desc(moodProfiles.lastUpdated)],
      limit
    });
  },

  async getRecommendation(recommendationId: string) {
    return await db.query.responseRecommendations.findFirst({
      where: eq(responseRecommendations.id, recommendationId)
    });
  },

  async getCreatorRecommendations(creatorId: string, onlyUnused: boolean = false, limit: number = 50) {
    return await db.query.responseRecommendations.findMany({
      where: onlyUnused 
        ? and(eq(responseRecommendations.creatorId, creatorId), eq(responseRecommendations.used, false))
        : eq(responseRecommendations.creatorId, creatorId),
      orderBy: [desc(responseRecommendations.createdAt)],
      limit
    });
  },

  async markRecommendationUsed(recommendationId: string, effectiveness?: number, feedback?: string) {
    await db.update(responseRecommendations)
      .set({
        used: true,
        usedAt: new Date(),
        effectiveness: effectiveness?.toFixed(2),
        userFeedback: feedback,
      } as any)
      .where(eq(responseRecommendations.id, recommendationId));
  },

  async getHighPriorityRecommendations(creatorId: string) {
    return await db.query.responseRecommendations.findMany({
      where: and(
        eq(responseRecommendations.creatorId, creatorId),
        eq(responseRecommendations.used, false)
      ),
      orderBy: [desc(responseRecommendations.createdAt)],
      limit: 20
    });
  },
};
