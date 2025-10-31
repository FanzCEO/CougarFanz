import { nanoid } from 'nanoid';
import { db } from './db';
import {
  liveStreams,
  streamParticipants,
  streamRecordings,
  coStarVerifications,
  tips,
  type LiveStream,
  type StreamParticipant,
  type StreamRecording,
} from '@shared/schema';
import { eq, and, desc, inArray, isNull } from 'drizzle-orm';

/**
 * Live Stream Infrastructure Service
 * 
 * Handles:
 * - Stream lifecycle (create, start, stop, end)
 * - Participant management with co-star verification gates
 * - Real-time viewer tracking
 * - Tip integration during streams
 * - Auto-recording and highlight generation
 * - WebSocket integration for real-time updates
 * 
 * Integration Points:
 * - WebRTC/RTMP streaming infrastructure
 * - Recording/encoding services (FFmpeg, cloud transcoding)
 * - AI highlight detection (integrate with AI Content Processing Service)
 * - WebSocket notification system (existing wsManager)
 */

export interface CreateStreamOptions {
  title: string;
  description?: string;
  scheduledStartTime?: Date;
  requiresCoStarVerification?: boolean;
  recordingEnabled?: boolean;
  autoHighlightsEnabled?: boolean;
  visibility?: 'public' | 'subscribers' | 'private';
}

export interface JoinStreamOptions {
  role: 'viewer' | 'co_star' | 'moderator';
  coStarVerificationId?: string;
}

class LiveStreamService {
  /**
   * Create a new live stream
   */
  async createStream(creatorUserId: string, options: CreateStreamOptions): Promise<LiveStream> {
    const streamKey = `sk_${nanoid(32)}`; // Secure stream key for RTMP/WebRTC
    const streamUrl = `/streams/${nanoid(12)}`; // Public viewing URL

    const [stream] = await db.insert(liveStreams)
      .values({
        creatorUserId,
        title: options.title,
        description: options.description,
        status: options.scheduledStartTime ? 'scheduled' : 'live',
        requiresCoStarVerification: options.requiresCoStarVerification || false,
        scheduledStartTime: options.scheduledStartTime,
        streamKey,
        streamUrl,
        recordingEnabled: options.recordingEnabled ?? true,
        autoHighlightsEnabled: options.autoHighlightsEnabled ?? true,
        visibility: options.visibility || 'public',
      })
      .returning();

    // Add creator as host
    await this.addParticipant(stream.id, creatorUserId, { role: 'viewer' });
    await db.update(streamParticipants)
      .set({ role: 'host' })
      .where(and(
        eq(streamParticipants.streamId, stream.id),
        eq(streamParticipants.userId, creatorUserId)
      ));

    return stream;
  }

  /**
   * Start a live stream
   */
  async startStream(streamId: string, creatorUserId: string): Promise<LiveStream> {
    // Verify creator owns the stream
    const [stream] = await db.select()
      .from(liveStreams)
      .where(and(
        eq(liveStreams.id, streamId),
        eq(liveStreams.creatorUserId, creatorUserId)
      ));

    if (!stream) {
      throw new Error('Stream not found or access denied');
    }

    if (stream.status === 'live') {
      return stream; // Already live
    }

    if (stream.status !== 'scheduled') {
      throw new Error('Cannot start stream in current status');
    }

    // Update stream status
    const [updatedStream] = await db.update(liveStreams)
      .set({
        status: 'live',
        actualStartTime: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(liveStreams.id, streamId))
      .returning();

    // TODO: Start recording if enabled
    if (stream.recordingEnabled) {
      await this.startRecording(streamId);
    }

    // TODO: Send WebSocket notification to subscribers/followers
    // wsManager.sendToUsers(subscriberIds, { type: 'stream_started', stream: updatedStream });

    return updatedStream;
  }

  /**
   * End a live stream
   */
  async endStream(streamId: string, creatorUserId: string): Promise<LiveStream> {
    // Verify creator owns the stream
    const [stream] = await db.select()
      .from(liveStreams)
      .where(and(
        eq(liveStreams.id, streamId),
        eq(liveStreams.creatorUserId, creatorUserId)
      ));

    if (!stream) {
      throw new Error('Stream not found or access denied');
    }

    if (stream.status !== 'live') {
      throw new Error('Stream is not currently live');
    }

    // Update stream status
    const [updatedStream] = await db.update(liveStreams)
      .set({
        status: 'ended',
        endedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(liveStreams.id, streamId))
      .returning();

    // Mark all active participants as left
    await db.update(streamParticipants)
      .set({ leftAt: new Date() })
      .where(and(
        eq(streamParticipants.streamId, streamId),
        isNull(streamParticipants.leftAt)
      ));

    // TODO: Stop recording
    await this.stopRecording(streamId);

    // TODO: Generate highlights if enabled
    if (stream.autoHighlightsEnabled) {
      await this.generateHighlights(streamId);
    }

    return updatedStream;
  }

  /**
   * Join a stream as a participant
   */
  async joinStream(
    streamId: string,
    userId: string,
    options: JoinStreamOptions
  ): Promise<StreamParticipant> {
    const [stream] = await db.select()
      .from(liveStreams)
      .where(eq(liveStreams.id, streamId));

    if (!stream) {
      throw new Error('Stream not found');
    }

    if (stream.status !== 'live') {
      throw new Error('Stream is not currently live');
    }

    // Check co-star verification requirement
    if (options.role === 'co_star') {
      if (stream.requiresCoStarVerification) {
        if (!options.coStarVerificationId) {
          throw new Error('Co-star verification required');
        }

        // Verify co-star verification status
        const [verification] = await db.select()
          .from(coStarVerifications)
          .where(and(
            eq(coStarVerifications.id, options.coStarVerificationId),
            eq(coStarVerifications.coStarUserId, userId),
            eq(coStarVerifications.status, 'verified')
          ));

        if (!verification) {
          throw new Error('Valid co-star verification not found');
        }
      }
    }

    // Check if already in stream
    const [existingParticipant] = await db.select()
      .from(streamParticipants)
      .where(and(
        eq(streamParticipants.streamId, streamId),
        eq(streamParticipants.userId, userId),
        isNull(streamParticipants.leftAt)
      ));

    if (existingParticipant) {
      return existingParticipant; // Already joined
    }

    // Add participant
    const [participant] = await db.insert(streamParticipants)
      .values({
        streamId,
        userId,
        role: options.role,
        coStarVerificationId: options.coStarVerificationId,
      })
      .returning();

    // Update viewer count
    await this.updateViewerCount(streamId);

    return participant;
  }

  /**
   * Leave a stream
   */
  async leaveStream(streamId: string, userId: string): Promise<void> {
    await db.update(streamParticipants)
      .set({ leftAt: new Date() })
      .where(and(
        eq(streamParticipants.streamId, streamId),
        eq(streamParticipants.userId, userId),
        isNull(streamParticipants.leftAt)
      ));

    // Update viewer count
    await this.updateViewerCount(streamId);
  }

  /**
   * Update viewer count for a stream
   */
  private async updateViewerCount(streamId: string): Promise<void> {
    const activeParticipants = await db.select()
      .from(streamParticipants)
      .where(and(
        eq(streamParticipants.streamId, streamId),
        isNull(streamParticipants.leftAt)
      ));

    const viewerCount = activeParticipants.length;

    const [stream] = await db.select()
      .from(liveStreams)
      .where(eq(liveStreams.id, streamId));

    const peakViewerCount = Math.max(stream?.peakViewerCount || 0, viewerCount);

    await db.update(liveStreams)
      .set({
        viewerCount,
        peakViewerCount,
        updatedAt: new Date(),
      })
      .where(eq(liveStreams.id, streamId));
  }

  /**
   * Add a participant to a stream (internal helper)
   */
  private async addParticipant(
    streamId: string,
    userId: string,
    options: JoinStreamOptions
  ): Promise<StreamParticipant> {
    const [participant] = await db.insert(streamParticipants)
      .values({
        streamId,
        userId,
        role: options.role,
        coStarVerificationId: options.coStarVerificationId,
      })
      .returning();

    return participant;
  }

  /**
   * Send a tip during a live stream
   */
  async sendStreamTip(
    streamId: string,
    fromUserId: string,
    toUserId: string,
    amount: number,
    message?: string
  ): Promise<any> {
    const [stream] = await db.select()
      .from(liveStreams)
      .where(eq(liveStreams.id, streamId));

    if (!stream) {
      throw new Error('Stream not found');
    }

    if (stream.status !== 'live') {
      throw new Error('Stream is not currently live');
    }

    if (!stream.tipsEnabled) {
      throw new Error('Tips are disabled for this stream');
    }

    // Create tip with stream reference
    const [tip] = await db.insert(tips)
      .values({
        fromUserId,
        toUserId,
        amount: amount.toString(),
        message,
        streamId,
        status: 'completed', // TODO: Integrate with payment processor
      })
      .returning();

    // Update stream total tips amount
    const currentTotal = parseFloat(stream.totalTipsAmount || '0');
    await db.update(liveStreams)
      .set({
        totalTipsAmount: (currentTotal + amount).toString(),
        updatedAt: new Date(),
      })
      .where(eq(liveStreams.id, streamId));

    // Update participant stats
    const [participant] = await db.select()
      .from(streamParticipants)
      .where(and(
        eq(streamParticipants.streamId, streamId),
        eq(streamParticipants.userId, fromUserId)
      ));

    if (participant) {
      const currentTips = parseFloat(participant.tipsSentAmount || '0');
      await db.update(streamParticipants)
        .set({
          tipsSentAmount: (currentTips + amount).toString(),
        })
        .where(and(
          eq(streamParticipants.streamId, streamId),
          eq(streamParticipants.userId, fromUserId)
        ));
    }

    // TODO: Send WebSocket notification
    // wsManager.sendToUsers([toUserId], { type: 'stream_tip', tip });

    return tip;
  }

  /**
   * Get stream details
   */
  async getStream(streamId: string): Promise<LiveStream | null> {
    const [stream] = await db.select()
      .from(liveStreams)
      .where(eq(liveStreams.id, streamId));

    return stream || null;
  }

  /**
   * Get streams for a creator
   */
  async getCreatorStreams(creatorUserId: string): Promise<LiveStream[]> {
    return db.select()
      .from(liveStreams)
      .where(eq(liveStreams.creatorUserId, creatorUserId))
      .orderBy(desc(liveStreams.createdAt));
  }

  /**
   * Get active (live) streams
   */
  async getLiveStreams(): Promise<LiveStream[]> {
    return db.select()
      .from(liveStreams)
      .where(eq(liveStreams.status, 'live'))
      .orderBy(desc(liveStreams.viewerCount));
  }

  /**
   * Get stream participants
   */
  async getStreamParticipants(streamId: string): Promise<StreamParticipant[]> {
    return db.select()
      .from(streamParticipants)
      .where(eq(streamParticipants.streamId, streamId))
      .orderBy(desc(streamParticipants.joinedAt));
  }

  /**
   * Get stream recordings
   */
  async getStreamRecordings(streamId: string): Promise<StreamRecording[]> {
    return db.select()
      .from(streamRecordings)
      .where(eq(streamRecordings.streamId, streamId))
      .orderBy(desc(streamRecordings.createdAt));
  }

  /**
   * Start recording a stream
   * TODO: Integrate with recording/encoding service
   */
  private async startRecording(streamId: string): Promise<void> {
    // TODO: Start RTMP/HLS recording
    // TODO: Upload to object storage
    
    console.log(`[LiveStream] Starting recording for stream ${streamId}`);
    
    // Create recording entry
    await db.insert(streamRecordings)
      .values({
        streamId,
        type: 'full_recording',
        title: 'Full Stream Recording',
        objectPath: `/recordings/${streamId}/full.mp4`, // TODO: Actual path
        status: 'processing',
      });
  }

  /**
   * Stop recording a stream
   * TODO: Integrate with recording/encoding service
   */
  private async stopRecording(streamId: string): Promise<void> {
    console.log(`[LiveStream] Stopping recording for stream ${streamId}`);
    
    // Update recording status
    await db.update(streamRecordings)
      .set({
        status: 'ready',
        updatedAt: new Date(),
      })
      .where(and(
        eq(streamRecordings.streamId, streamId),
        eq(streamRecordings.type, 'full_recording')
      ));
  }

  /**
   * Generate highlights from stream recording
   * TODO: Integrate with AI Content Processing Service for highlight detection
   */
  private async generateHighlights(streamId: string): Promise<void> {
    console.log(`[LiveStream] Generating highlights for stream ${streamId}`);
    
    // TODO: Use AI to detect interesting moments
    // TODO: Create highlight clips
    // TODO: Upload to object storage
    
    // Mock: Create a few highlight entries
    const highlightMoments = [
      { start: 120, end: 180, title: 'Highlight 1' },
      { start: 600, end: 660, title: 'Highlight 2' },
    ];

    for (const moment of highlightMoments) {
      await db.insert(streamRecordings)
        .values({
          streamId,
          type: 'highlight',
          title: moment.title,
          objectPath: `/recordings/${streamId}/highlight_${moment.start}.mp4`,
          startTime: moment.start,
          endTime: moment.end,
          aiGenerated: true,
          status: 'processing',
        });
    }
  }
}

export const liveStreamService = new LiveStreamService();
