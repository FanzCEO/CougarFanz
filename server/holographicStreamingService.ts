import { db } from "./db";
import { 
  avatarModels, 
  holographicStreams, 
  holographicViewers, 
  spatialAudioTracks,
  type InsertAvatarModel,
  type InsertHolographicStream,
  type InsertHolographicViewer,
  type InsertSpatialAudioTrack,
  type AvatarModel,
  type HolographicStream,
  type HolographicViewer,
  type SpatialAudioTrack,
} from "@shared/schema";
import { eq, and, sql, desc } from "drizzle-orm";

export class HolographicStreamingService {
  async createAvatarModel(data: InsertAvatarModel): Promise<AvatarModel> {
    const [avatar] = await db
      .insert(avatarModels)
      .values(data)
      .returning();
    return avatar;
  }

  async getAvatarModel(id: string): Promise<AvatarModel | undefined> {
    const [avatar] = await db
      .select()
      .from(avatarModels)
      .where(eq(avatarModels.id, id));
    return avatar;
  }

  async getCreatorAvatars(creatorId: string): Promise<AvatarModel[]> {
    return db
      .select()
      .from(avatarModels)
      .where(and(
        eq(avatarModels.creatorId, creatorId),
        eq(avatarModels.isActive, true)
      ))
      .orderBy(desc(avatarModels.createdAt));
  }

  async updateAvatarModel(id: string, updates: Partial<AvatarModel>): Promise<void> {
    await db
      .update(avatarModels)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(avatarModels.id, id));
  }

  async deleteAvatarModel(id: string): Promise<void> {
    await db
      .update(avatarModels)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(avatarModels.id, id));
  }

  async createStream(data: InsertHolographicStream): Promise<HolographicStream> {
    const [stream] = await db
      .insert(holographicStreams)
      .values(data)
      .returning();
    return stream;
  }

  async getStream(id: string): Promise<HolographicStream | undefined> {
    const [stream] = await db
      .select()
      .from(holographicStreams)
      .where(eq(holographicStreams.id, id));
    return stream;
  }

  async getCreatorStreams(creatorId: string): Promise<HolographicStream[]> {
    return db
      .select()
      .from(holographicStreams)
      .where(eq(holographicStreams.creatorId, creatorId))
      .orderBy(desc(holographicStreams.createdAt));
  }

  async getLiveStreams(): Promise<HolographicStream[]> {
    return db
      .select()
      .from(holographicStreams)
      .where(eq(holographicStreams.status, 'live'))
      .orderBy(desc(holographicStreams.viewerCount));
  }

  async updateStream(id: string, updates: Partial<HolographicStream>): Promise<void> {
    await db
      .update(holographicStreams)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(holographicStreams.id, id));
  }

  async startStream(id: string): Promise<void> {
    await db
      .update(holographicStreams)
      .set({ 
        status: 'live', 
        startedAt: new Date(),
        updatedAt: new Date() 
      })
      .where(eq(holographicStreams.id, id));
  }

  async endStream(id: string): Promise<void> {
    const stream = await this.getStream(id);
    if (!stream) return;

    const viewers = await this.getStreamViewers(id);
    
    for (const viewer of viewers) {
      if (!viewer.leftAt) {
        await this.viewerLeave(viewer.id);
      }
    }

    await db
      .update(holographicStreams)
      .set({ 
        status: 'ended', 
        endedAt: new Date(),
        updatedAt: new Date() 
      })
      .where(eq(holographicStreams.id, id));
  }

  async viewerJoin(data: InsertHolographicViewer): Promise<HolographicViewer> {
    const stream = await this.getStream(data.streamId);
    if (!stream) {
      throw new Error("Stream not found");
    }

    if (stream.status !== 'live') {
      throw new Error("Cannot join: Stream is not live");
    }

    const currentViewers = stream.viewerCount || 0;
    const maxViewers = stream.maxViewers || 100;

    if (currentViewers >= maxViewers) {
      throw new Error("Cannot join: Stream is at maximum capacity");
    }

    const [viewer] = await db
      .insert(holographicViewers)
      .values(data)
      .returning();

    const newViewerCount = currentViewers + 1;

    await db
      .update(holographicStreams)
      .set({ 
        viewerCount: newViewerCount,
        peakViewerCount: sql`GREATEST(${holographicStreams.peakViewerCount}, ${newViewerCount})`
      })
      .where(eq(holographicStreams.id, data.streamId));

    return viewer;
  }

  async viewerLeave(viewerId: string): Promise<void> {
    const [viewer] = await db
      .select()
      .from(holographicViewers)
      .where(eq(holographicViewers.id, viewerId));

    if (!viewer || viewer.leftAt || !viewer.joinedAt) return;

    const watchTime = Math.floor((Date.now() - viewer.joinedAt.getTime()) / 1000);

    await db
      .update(holographicViewers)
      .set({ 
        leftAt: new Date(),
        watchTime 
      })
      .where(eq(holographicViewers.id, viewerId));

    await db
      .update(holographicStreams)
      .set({ 
        viewerCount: sql`${holographicStreams.viewerCount} - 1` 
      })
      .where(eq(holographicStreams.id, viewer.streamId));
  }

  async updateViewerPosition(
    viewerId: string, 
    position: { x: number, y: number, z: number },
    orientation: { pitch: number, yaw: number, roll: number }
  ): Promise<void> {
    await db
      .update(holographicViewers)
      .set({ 
        viewerPosition: position,
        viewerOrientation: orientation 
      })
      .where(eq(holographicViewers.id, viewerId));
  }

  async recordViewerGesture(viewerId: string, gesture: string): Promise<void> {
    const [viewer] = await db
      .select()
      .from(holographicViewers)
      .where(eq(holographicViewers.id, viewerId));

    if (!viewer) return;

    const gestures = Array.isArray(viewer.gesturesUsed) ? viewer.gesturesUsed : [];
    gestures.push({
      gesture,
      timestamp: new Date().toISOString()
    });

    await db
      .update(holographicViewers)
      .set({ gesturesUsed: gestures })
      .where(eq(holographicViewers.id, viewerId));
  }

  async recordViewerTip(viewerId: string, amount: number): Promise<void> {
    await db
      .update(holographicViewers)
      .set({ 
        tipsGiven: sql`${holographicViewers.tipsGiven} + ${amount}` 
      })
      .where(eq(holographicViewers.id, viewerId));
  }

  async getStreamViewers(streamId: string): Promise<HolographicViewer[]> {
    return db
      .select()
      .from(holographicViewers)
      .where(eq(holographicViewers.streamId, streamId))
      .orderBy(desc(holographicViewers.joinedAt));
  }

  async getActiveViewers(streamId: string): Promise<HolographicViewer[]> {
    return db
      .select()
      .from(holographicViewers)
      .where(and(
        eq(holographicViewers.streamId, streamId),
        sql`${holographicViewers.leftAt} IS NULL`
      ))
      .orderBy(desc(holographicViewers.joinedAt));
  }

  async addSpatialAudio(data: InsertSpatialAudioTrack): Promise<SpatialAudioTrack> {
    const [track] = await db
      .insert(spatialAudioTracks)
      .values(data)
      .returning();
    return track;
  }

  async updateSpatialAudio(id: string, updates: Partial<SpatialAudioTrack>): Promise<void> {
    await db
      .update(spatialAudioTracks)
      .set(updates)
      .where(eq(spatialAudioTracks.id, id));
  }

  async updateAudioPosition(
    id: string, 
    position: { x: number, y: number, z: number }
  ): Promise<void> {
    await db
      .update(spatialAudioTracks)
      .set({ position })
      .where(eq(spatialAudioTracks.id, id));
  }

  async removeSpatialAudio(id: string): Promise<void> {
    await db
      .delete(spatialAudioTracks)
      .where(eq(spatialAudioTracks.id, id));
  }

  async getStreamAudio(streamId: string): Promise<SpatialAudioTrack[]> {
    return db
      .select()
      .from(spatialAudioTracks)
      .where(and(
        eq(spatialAudioTracks.streamId, streamId),
        eq(spatialAudioTracks.isActive, true)
      ));
  }

  async getStreamAnalytics(streamId: string) {
    const viewers = await this.getStreamViewers(streamId);
    
    const totalViewers = viewers.length;
    const uniqueDevices = new Set(viewers.map(v => v.deviceType)).size;
    const totalWatchTime = viewers.reduce((sum, v) => sum + (v.watchTime || 0), 0);
    const totalTips = viewers.reduce((sum, v) => {
      const tips = parseFloat(v.tipsGiven?.toString() || '0');
      return sum + tips;
    }, 0);

    const avgWatchTime = totalViewers > 0 ? totalWatchTime / totalViewers : 0;

    const deviceBreakdown = viewers.reduce((acc, v) => {
      const device = v.deviceType || 'unknown';
      acc[device] = (acc[device] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const interactionBreakdown = viewers.reduce((acc, v) => {
      const mode = v.interactionMode || 'spectator';
      acc[mode] = (acc[mode] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const allGestures = viewers.flatMap(v => 
      Array.isArray(v.gesturesUsed) ? v.gesturesUsed : []
    );

    return {
      totalViewers,
      uniqueDevices,
      totalWatchTime,
      avgWatchTime,
      totalTips,
      deviceBreakdown,
      interactionBreakdown,
      topGestures: allGestures.slice(0, 10),
      peakViewers: await this.getPeakViewers(streamId)
    };
  }

  private async getPeakViewers(streamId: string): Promise<number> {
    const stream = await this.getStream(streamId);
    return stream?.peakViewerCount || 0;
  }

  async generateHighlights(streamId: string): Promise<string> {
    const viewers = await this.getStreamViewers(streamId);
    
    const highEngagementMoments = viewers.filter(v => {
      const gestures = Array.isArray(v.gesturesUsed) ? v.gesturesUsed : [];
      return gestures.length > 5;
    });

    const highlightUrl = `https://storage.googleapis.com/highlights/${streamId}_highlights.mp4`;
    
    await db
      .update(holographicStreams)
      .set({ highlightsUrl: highlightUrl, updatedAt: new Date() })
      .where(eq(holographicStreams.id, streamId));

    return highlightUrl;
  }

  async incrementAvatarUsage(avatarId: string): Promise<void> {
    await db
      .update(avatarModels)
      .set({ 
        usageCount: sql`${avatarModels.usageCount} + 1`,
        updatedAt: new Date() 
      })
      .where(eq(avatarModels.id, avatarId));
  }
}

export const holographicStreamingService = new HolographicStreamingService();
