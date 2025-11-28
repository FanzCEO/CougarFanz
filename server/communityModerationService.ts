import { db } from "./db";
import { 
  safetyReports, communityVotes, moderatorStats,
  type InsertSafetyReport, type InsertCommunityVote
} from "@shared/schema";
import { eq, and, sql, desc } from "drizzle-orm";

// Community Moderation Service for user reporting and peer review
export class CommunityModerationService {

  // Create a safety report
  async createSafetyReport(reportData: InsertSafetyReport) {
    const [report] = await db.insert(safetyReports)
      .values({
        ...reportData,
        status: 'pending',
        createdAt: new Date(),
      })
      .returning();

    return report;
  }

  // Submit a community vote on a report
  async submitCommunityVote(voteData: InsertCommunityVote) {
    // Get voter's current reputation
    const voterReputation = await this.getVoterReputation(voteData.voterId);

    // Check if user already voted on this report
    const existingVote = await db.query.communityVotes.findFirst({
      where: and(
        eq(communityVotes.reportId, voteData.reportId),
        eq(communityVotes.voterId, voteData.voterId)
      ),
    });

    if (existingVote) {
      // Update existing vote
      const [updatedVote] = await db.update(communityVotes)
        .set({
          vote: voteData.vote,
          reason: voteData.reason,
          voterReputation,
        })
        .where(eq(communityVotes.id, existingVote.id))
        .returning();

      // Recalculate consensus after vote update
      await this.updateReportBasedOnVotes(voteData.reportId);

      return updatedVote;
    }

    // Create new vote
    const [vote] = await db.insert(communityVotes)
      .values({
        ...voteData,
        voterReputation,
        createdAt: new Date(),
      })
      .returning();

    // Update report status based on vote consensus
    await this.updateReportBasedOnVotes(voteData.reportId);

    return vote;
  }

  // Get voter's reputation score
  async getVoterReputation(voterId: string): Promise<number> {
    // Get historical voting accuracy
    const votes = await db.query.communityVotes.findMany({
      where: eq(communityVotes.voterId, voterId),
    });

    if (votes.length === 0) {
      return 100; // Default reputation for new voters
    }

    // Calculate accuracy based on votes that matched final moderator decisions
    let accurateVotes = 0;
    let totalResolvedVotes = 0;

    for (const vote of votes) {
      // Get the associated report
      const report = await db.query.safetyReports.findFirst({
        where: eq(safetyReports.id, vote.reportId),
      });

      if (report && report.status === 'resolved') {
        totalResolvedVotes++;
        
        // Vote was accurate if:
        // - They voted 'valid' and report was resolved (not dismissed)
        // - They voted 'invalid' and report was dismissed
        const wasAccurate = 
          (vote.vote === 'valid' && report.resolution !== 'dismissed') ||
          (vote.vote === 'invalid' && report.resolution === 'dismissed');
        
        if (wasAccurate) {
          accurateVotes++;
        }
      }
    }

    if (totalResolvedVotes === 0) {
      return 100; // No resolved votes yet, keep default
    }

    // Reputation = base 100 + (accuracy - 50%) * 200
    // This gives: 0% accuracy = 0 rep, 50% = 100 rep, 100% = 200 rep
    const accuracy = accurateVotes / totalResolvedVotes;
    const reputation = Math.round(100 + (accuracy - 0.5) * 200);
    
    // Clamp between 0 and 200
    return Math.max(0, Math.min(200, reputation));
  }

  // Update report status based on vote consensus
  async updateReportBasedOnVotes(reportId: string) {
    const votes = await db.query.communityVotes.findMany({
      where: eq(communityVotes.reportId, reportId),
    });

    if (votes.length < 3) {
      return; // Need at least 3 votes for consensus
    }

    // Calculate weighted vote scores (higher reputation = more weight)
    let validScore = 0;
    let invalidScore = 0;
    let totalWeight = 0;

    for (const vote of votes) {
      const weight = vote.voterReputation || 100;
      totalWeight += weight;

      if (vote.vote === 'valid') {
        validScore += weight;
      } else if (vote.vote === 'invalid') {
        invalidScore += weight;
      }
    }

    // Calculate percentages
    const validPercent = totalWeight > 0 ? (validScore / totalWeight) * 100 : 0;
    const invalidPercent = totalWeight > 0 ? (invalidScore / totalWeight) * 100 : 0;

    // Strong consensus threshold: 70%
    if (validPercent >= 70) {
      // Auto-escalate for moderator review (don't set resolution yet - that's for final decision)
      await db.update(safetyReports)
        .set({ 
          status: 'escalated',
          severity: 'high', // Community agrees this is a valid concern
        })
        .where(eq(safetyReports.id, reportId));
    } else if (invalidPercent >= 70) {
      // Auto-dismiss with community consensus
      await db.update(safetyReports)
        .set({ 
          status: 'dismissed',
          resolution: 'Community consensus: invalid report (70%+ invalid votes)',
        })
        .where(eq(safetyReports.id, reportId));
    }
  }

  // Get voting statistics for a report
  async getReportVotingStats(reportId: string) {
    const votes = await db.query.communityVotes.findMany({
      where: eq(communityVotes.reportId, reportId),
    });

    const stats = {
      totalVotes: votes.length,
      validVotes: 0,
      invalidVotes: 0,
      unsureVotes: 0,
      avgVoterReputation: 0,
      weightedValidPercent: 0,
      weightedInvalidPercent: 0,
    };

    let totalReputation = 0;
    let validWeight = 0;
    let invalidWeight = 0;
    let totalWeight = 0;

    for (const vote of votes) {
      const weight = vote.voterReputation || 100;
      totalReputation += weight;
      totalWeight += weight;

      if (vote.vote === 'valid') {
        stats.validVotes++;
        validWeight += weight;
      } else if (vote.vote === 'invalid') {
        stats.invalidVotes++;
        invalidWeight += weight;
      } else {
        stats.unsureVotes++;
      }
    }

    stats.avgVoterReputation = votes.length > 0 ? Math.round(totalReputation / votes.length) : 0;
    stats.weightedValidPercent = totalWeight > 0 ? Math.round((validWeight / totalWeight) * 100) : 0;
    stats.weightedInvalidPercent = totalWeight > 0 ? Math.round((invalidWeight / totalWeight) * 100) : 0;

    return stats;
  }

  // Get pending/escalated reports for community review (with vote stats)
  async getPendingReportsForReview(limit: number = 20) {
    // Include both 'pending' (new reports) and 'escalated' (auto-escalated by community)
    const reports = await db.query.safetyReports.findMany({
      where: sql`${safetyReports.status} IN ('pending', 'escalated')`,
      orderBy: [desc(safetyReports.createdAt)],
      limit,
      with: {
        reporter: {
          columns: { id: true, username: true },
        },
        reportedUser: {
          columns: { id: true, username: true },
        },
        reportedContent: {
          columns: { id: true, title: true, mimeType: true },
        },
      },
    });

    // Add voting stats to each report
    const reportsWithStats = await Promise.all(
      reports.map(async (report) => {
        const votingStats = await this.getReportVotingStats(report.id);
        return {
          ...report,
          votingStats,
        };
      })
    );

    return reportsWithStats;
  }

  // Get reports by user (for checking if someone has been reported)
  async getReportsByUser(userId: string, status?: string) {
    const conditions = [eq(safetyReports.userId, userId)];
    
    if (status) {
      conditions.push(eq(safetyReports.status, status as any));
    }

    const reports = await db.query.safetyReports.findMany({
      where: and(...conditions),
      orderBy: [desc(safetyReports.createdAt)],
      with: {
        reporter: {
          columns: { id: true, username: true },
        },
      },
    });

    return reports;
  }

  // Get reports submitted by user
  async getReportsSubmittedBy(userId: string, limit: number = 50) {
    const reports = await db.query.safetyReports.findMany({
      where: eq(safetyReports.reporterId, userId),
      orderBy: [desc(safetyReports.createdAt)],
      limit,
      with: {
        reportedUser: {
          columns: { id: true, username: true },
        },
        reportedContent: {
          columns: { id: true, title: true },
        },
      },
    });

    return reports;
  }

  // Get user's voting history
  async getUserVotingHistory(userId: string, limit: number = 50) {
    const votes = await db.query.communityVotes.findMany({
      where: eq(communityVotes.voterId, userId),
      orderBy: [desc(communityVotes.createdAt)],
      limit,
      with: {
        report: {
          with: {
            reportedUser: {
              columns: { id: true, username: true },
            },
            reportedContent: {
              columns: { id: true, title: true },
            },
          },
        },
      },
    });

    return votes;
  }

  // Moderator: Review and resolve a report
  async resolveReport(
    reportId: string, 
    moderatorId: string, 
    resolution: string,
    action: 'resolved' | 'dismissed' | 'escalated'
  ) {
    const [report] = await db.update(safetyReports)
      .set({
        status: action,
        resolution,
        reviewedBy: moderatorId,
        reviewedAt: new Date(),
      })
      .where(eq(safetyReports.id, reportId))
      .returning();

    // Update moderator stats
    await this.updateModeratorStats(moderatorId);

    return report;
  }

  // Update moderator statistics
  async updateModeratorStats(moderatorId: string) {
    // Get all reviews by this moderator
    const reviews = await db.query.safetyReports.findMany({
      where: and(
        eq(safetyReports.reviewedBy, moderatorId),
      ),
    });

    const totalReviews = reviews.length;

    // Upsert moderator stats
    await db.insert(moderatorStats)
      .values({
        userId: moderatorId,
        totalReviews,
        lastActiveAt: new Date(),
      })
      .onConflictDoUpdate({
        target: moderatorStats.userId,
        set: {
          totalReviews,
          lastActiveAt: new Date(),
        },
      });
  }

  // Get moderator leaderboard
  async getModeratorLeaderboard(limit: number = 10) {
    const leaderboard = await db.query.moderatorStats.findMany({
      orderBy: [desc(moderatorStats.totalReviews)],
      limit,
      with: {
        user: {
          columns: { id: true, username: true, displayName: true },
        },
      },
    });

    return leaderboard;
  }
}

// Export singleton instance
export const communityModerationService = new CommunityModerationService();
