import { db } from './db';
import {
  voiceModels,
  voiceMessages,
  voiceAutomation,
  voiceMessageQueue,
  type InsertVoiceModel,
  type InsertVoiceMessage,
  type InsertVoiceAutomation,
  type VoiceModel,
  type VoiceMessage,
  type VoiceAutomation,
} from '@shared/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export class VoiceCloningService {
  async createVoiceModel(creatorId: string, data: Omit<InsertVoiceModel, 'creatorId'>): Promise<VoiceModel> {
    const [model] = await db.insert(voiceModels).values({
      ...data,
      creatorId,
      status: 'training',
    }).returning();

    this.simulateTraining(model.id).catch(err => {
      console.error(`Voice model training failed for ${model.id}:`, err);
    });

    return model;
  }

  private async simulateTraining(modelId: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 3000));

    await db
      .update(voiceModels)
      .set({ 
        status: 'ready',
        modelId: `vm_${nanoid(16)}`,
        updatedAt: new Date(),
      })
      .where(eq(voiceModels.id, modelId));
  }

  async getVoiceModel(modelId: string): Promise<VoiceModel | undefined> {
    const [model] = await db
      .select()
      .from(voiceModels)
      .where(eq(voiceModels.id, modelId));
    
    return model;
  }

  async getCreatorVoiceModels(creatorId: string): Promise<VoiceModel[]> {
    return await db
      .select()
      .from(voiceModels)
      .where(eq(voiceModels.creatorId, creatorId))
      .orderBy(desc(voiceModels.createdAt));
  }

  async updateVoiceModel(modelId: string, updates: Partial<VoiceModel>): Promise<void> {
    await db
      .update(voiceModels)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(voiceModels.id, modelId));
  }

  async deleteVoiceModel(modelId: string): Promise<void> {
    await db
      .update(voiceModels)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(voiceModels.id, modelId));
  }

  async createVoiceMessage(data: InsertVoiceMessage): Promise<VoiceMessage> {
    const [message] = await db.insert(voiceMessages).values({
      ...data,
      status: 'pending',
    }).returning();

    await db.insert(voiceMessageQueue).values({
      voiceMessageId: message.id,
      priority: data.messageType === 'dm' ? 8 : 5,
      status: 'queued',
    });

    this.processMessageQueue().catch(err => {
      console.error('Voice message queue processing error:', err);
    });

    return message;
  }

  async generateVoiceMessage(messageId: string): Promise<void> {
    const [message] = await db
      .select()
      .from(voiceMessages)
      .where(eq(voiceMessages.id, messageId));

    if (!message) {
      throw new Error('Voice message not found');
    }

    await db
      .update(voiceMessages)
      .set({ status: 'generating' })
      .where(eq(voiceMessages.id, messageId));

    try {
      const audioUrl = await this.simulateVoiceGeneration(
        message.voiceModelId,
        message.scriptText,
        message.metadata
      );

      const duration = Math.floor(message.scriptText.length / 15);

      await db
        .update(voiceMessages)
        .set({
          status: 'ready',
          audioUrl,
          duration,
        })
        .where(eq(voiceMessages.id, messageId));

      await db
        .update(voiceModels)
        .set({
          usageCount: sql`${voiceModels.usageCount} + 1`,
          totalDuration: sql`${voiceModels.totalDuration} + ${duration}`,
        })
        .where(eq(voiceModels.id, message.voiceModelId));

    } catch (error) {
      await db
        .update(voiceMessages)
        .set({
          status: 'failed',
          error: error instanceof Error ? error.message : 'Generation failed',
        })
        .where(eq(voiceMessages.id, messageId));
      throw error;
    }
  }

  private async simulateVoiceGeneration(
    modelId: string,
    scriptText: string,
    metadata: any
  ): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, 2000));

    let personalizedText = scriptText;
    if (metadata && typeof metadata === 'object') {
      Object.keys(metadata).forEach(key => {
        personalizedText = personalizedText.replace(
          new RegExp(`{${key}}`, 'g'),
          metadata[key]
        );
      });
    }

    return `/voice-messages/${modelId}/${nanoid(16)}.mp3`;
  }

  async getVoiceMessage(messageId: string): Promise<VoiceMessage | undefined> {
    const [message] = await db
      .select()
      .from(voiceMessages)
      .where(eq(voiceMessages.id, messageId));
    
    return message;
  }

  async getCreatorVoiceMessages(creatorId: string): Promise<VoiceMessage[]> {
    return await db
      .select()
      .from(voiceMessages)
      .where(eq(voiceMessages.creatorId, creatorId))
      .orderBy(desc(voiceMessages.createdAt));
  }

  async getRecipientVoiceMessages(recipientId: string): Promise<VoiceMessage[]> {
    return await db
      .select()
      .from(voiceMessages)
      .where(eq(voiceMessages.recipientId, recipientId))
      .orderBy(desc(voiceMessages.createdAt));
  }

  async createAutomation(data: InsertVoiceAutomation): Promise<VoiceAutomation> {
    const [automation] = await db.insert(voiceAutomation).values(data).returning();
    return automation;
  }

  async getAutomation(automationId: string): Promise<VoiceAutomation | undefined> {
    const [automation] = await db
      .select()
      .from(voiceAutomation)
      .where(eq(voiceAutomation.id, automationId));
    
    return automation;
  }

  async getCreatorAutomations(creatorId: string): Promise<VoiceAutomation[]> {
    return await db
      .select()
      .from(voiceAutomation)
      .where(eq(voiceAutomation.creatorId, creatorId))
      .orderBy(desc(voiceAutomation.createdAt));
  }

  async toggleAutomation(automationId: string, isActive: boolean): Promise<void> {
    await db
      .update(voiceAutomation)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(voiceAutomation.id, automationId));
  }

  async triggerAutomation(
    triggerType: string,
    creatorId: string,
    recipientId: string,
    context: Record<string, any>
  ): Promise<void> {
    const automations = await db
      .select()
      .from(voiceAutomation)
      .where(
        and(
          eq(voiceAutomation.creatorId, creatorId),
          eq(voiceAutomation.triggerType, triggerType as any),
          eq(voiceAutomation.isActive, true)
        )
      );

    for (const automation of automations) {
      if (triggerType === 'tip_received' && automation.minTipAmount) {
        const tipAmount = parseFloat(context.amount || '0');
        const minAmount = parseFloat(automation.minTipAmount);
        if (tipAmount < minAmount) {
          continue;
        }
      }

      let scriptText = automation.scriptTemplate;
      Object.keys(context).forEach(key => {
        scriptText = scriptText.replace(new RegExp(`{${key}}`, 'g'), context[key]);
      });

      await this.createVoiceMessage({
        voiceModelId: automation.voiceModelId,
        creatorId,
        recipientId,
        messageType: 'dm',
        scriptText,
        metadata: context,
      });

      await db
        .update(voiceAutomation)
        .set({ usageCount: sql`${voiceAutomation.usageCount} + 1` })
        .where(eq(voiceAutomation.id, automation.id));
    }
  }

  private async processMessageQueue(): Promise<void> {
    const queuedMessages = await db
      .select()
      .from(voiceMessageQueue)
      .where(eq(voiceMessageQueue.status, 'queued'))
      .orderBy(desc(voiceMessageQueue.priority), voiceMessageQueue.scheduledFor)
      .limit(10);

    for (const queueItem of queuedMessages) {
      try {
        await db
          .update(voiceMessageQueue)
          .set({ status: 'processing' })
          .where(eq(voiceMessageQueue.id, queueItem.id));

        await this.generateVoiceMessage(queueItem.voiceMessageId);

        await db
          .update(voiceMessageQueue)
          .set({ status: 'completed' })
          .where(eq(voiceMessageQueue.id, queueItem.id));

      } catch (error) {
        console.error(`Queue processing error for ${queueItem.id}:`, error);
        
        await db
          .update(voiceMessageQueue)
          .set({
            status: 'failed',
            attempts: sql`${voiceMessageQueue.attempts} + 1`,
            lastAttempt: new Date(),
          })
          .where(eq(voiceMessageQueue.id, queueItem.id));
      }
    }
  }

  async bulkCreateMessages(
    creatorId: string,
    voiceModelId: string,
    recipients: { id: string; name: string }[],
    scriptTemplate: string
  ): Promise<VoiceMessage[]> {
    const messages: VoiceMessage[] = [];

    for (const recipient of recipients) {
      const scriptText = scriptTemplate.replace(/{fanName}/g, recipient.name);

      const message = await this.createVoiceMessage({
        voiceModelId,
        creatorId,
        recipientId: recipient.id,
        messageType: 'bulk',
        scriptText,
        metadata: { fanName: recipient.name },
      });

      messages.push(message);
    }

    return messages;
  }

  async getQueueStatus() {
    const stats = await db
      .select({
        status: voiceMessageQueue.status,
        count: sql<number>`count(*)`,
      })
      .from(voiceMessageQueue)
      .groupBy(voiceMessageQueue.status);

    return stats.reduce((acc, stat) => {
      if (stat.status) {
        acc[stat.status] = Number(stat.count);
      }
      return acc;
    }, {} as Record<string, number>);
  }
}

export const voiceCloningService = new VoiceCloningService();
