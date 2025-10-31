import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Shield, AlertTriangle, CheckCircle, XCircle, 
  ThumbsUp, ThumbsDown, HelpCircle, Award, TrendingUp 
} from "lucide-react";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";

interface Report {
  id: string;
  reportType: string;
  severity: string;
  status: string;
  description: string;
  createdAt: string;
  reporter: { id: string; username: string };
  reportedUser?: { id: string; username: string };
  reportedContent?: { id: string; title: string; mimeType: string };
  contentId?: string;
  votingStats: {
    totalVotes: number;
    validVotes: number;
    invalidVotes: number;
    unsureVotes: number;
    avgVoterReputation: number;
    weightedValidPercent: number;
    weightedInvalidPercent: number;
  };
}

interface SafetyScore {
  contentId: string;
  overallScore: number;
  reportCount: number;
  aiFlags: number;
  communityTrust: number;
  humanReviewStatus: string;
  riskLevel: string;
}

interface AIFlag {
  id: string;
  flagType: string;
  confidence: number;
  details: any;
  reviewed: boolean;
  override: boolean;
}

export default function Moderation() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [voteDialogOpen, setVoteDialogOpen] = useState(false);
  const [voteType, setVoteType] = useState<'valid' | 'invalid' | 'unsure'>('valid');
  const [voteReason, setVoteReason] = useState('');
  const [resolveAction, setResolveAction] = useState<'resolved' | 'dismissed' | 'escalated'>('resolved');
  const [resolution, setResolution] = useState('');
  const [createReportOpen, setCreateReportOpen] = useState(false);
  const [reportType, setReportType] = useState('underage');
  const [reportDescription, setReportDescription] = useState('');
  const [reportTargetType, setReportTargetType] = useState<'content' | 'user' | 'message'>('content');
  const [reportTargetId, setReportTargetId] = useState('');

  // Fetch pending reports
  const { data: reports = [], isLoading: reportsLoading } = useQuery<Report[]>({
    queryKey: ['/api/moderation/reports/pending'],
  });

  // Fetch user reputation
  const { data: reputationData } = useQuery<{ userId: string; reputation: number }>({
    queryKey: ['/api/moderation/reputation', (user as any)?.id],
    enabled: !!(user as any)?.id,
  });

  // Fetch moderator leaderboard
  const { data: leaderboard = [] } = useQuery<any[]>({
    queryKey: ['/api/moderation/moderators/leaderboard'],
  });

  // Fetch user's voting history
  const { data: votingHistory = [] } = useQuery<any[]>({
    queryKey: ['/api/moderation/votes/my-history'],
  });

  // Submit vote mutation
  const voteMutation = useMutation({
    mutationFn: async (data: { reportId: string; vote: string; reason?: string }) => {
      return await apiRequest('POST', `/api/moderation/reports/${data.reportId}/vote`, {
        vote: data.vote,
        reason: data.reason,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/moderation/reports/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/moderation/reputation', (user as any)?.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/moderation/votes/my-history'] });
      toast({
        title: "Vote submitted",
        description: "Your vote has been recorded successfully",
      });
      setVoteDialogOpen(false);
      setVoteReason('');
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit vote",
        variant: "destructive",
      });
    },
  });

  // Resolve report mutation
  const resolveMutation = useMutation({
    mutationFn: async (data: { reportId: string; action: string; resolution: string }) => {
      return await apiRequest('PATCH', `/api/moderation/reports/${data.reportId}/resolve`, {
        action: data.action,
        resolution: data.resolution,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/moderation/reports/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/moderation/moderators/leaderboard'] });
      toast({
        title: "Report resolved",
        description: "The report has been resolved successfully",
      });
      setResolveDialogOpen(false);
      setResolution('');
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to resolve report",
        variant: "destructive",
      });
    },
  });

  // Create report mutation
  const createReportMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('POST', '/api/moderation/reports', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/moderation/reports/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/moderation/reports/my-submissions'] });
      toast({
        title: "Report created",
        description: "Your safety report has been submitted",
      });
      setCreateReportOpen(false);
      setReportDescription('');
      setReportTargetId('');
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create report",
        variant: "destructive",
      });
    },
  });

  const handleVote = () => {
    if (!selectedReport) return;
    voteMutation.mutate({
      reportId: selectedReport.id,
      vote: voteType,
      reason: voteReason,
    });
  };

  const handleResolve = () => {
    if (!selectedReport) return;
    resolveMutation.mutate({
      reportId: selectedReport.id,
      action: resolveAction,
      resolution,
    });
  };

  const handleCreateReport = () => {
    const reportData: any = {
      reportType,
      description: reportDescription,
      severity: 'medium',
    };

    // Add appropriate target based on type
    if (reportTargetType === 'content') {
      reportData.contentId = reportTargetId;
    } else if (reportTargetType === 'user') {
      reportData.userId = reportTargetId;
    } else if (reportTargetType === 'message') {
      reportData.messageId = reportTargetId;
    }

    createReportMutation.mutate(reportData);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <HelpCircle className="h-4 w-4" />;
      case 'escalated': return <AlertTriangle className="h-4 w-4" />;
      case 'resolved': return <CheckCircle className="h-4 w-4" />;
      case 'dismissed': return <XCircle className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2" data-testid="heading-moderation">
            <Shield className="h-8 w-8 text-primary" />
            Community Moderation
          </h1>
          <p className="text-muted-foreground mt-1">
            Help keep PupFanz safe by reviewing reports and voting on community concerns
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button onClick={() => setCreateReportOpen(true)} data-testid="button-create-report">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Report Safety Issue
          </Button>
          {reputationData && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Your Reputation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                <span className="text-2xl font-bold" data-testid="text-reputation-score">
                  {reputationData.reputation}
                </span>
                <span className="text-sm text-muted-foreground">/200</span>
              </div>
            </CardContent>
          </Card>
        )}
        </div>
      </div>

      <Tabs defaultValue="reports" className="w-full">
        <TabsList>
          <TabsTrigger value="reports" data-testid="tab-reports">
            Reports Queue ({reports.length})
          </TabsTrigger>
          <TabsTrigger value="history" data-testid="tab-history">
            My Votes
          </TabsTrigger>
          <TabsTrigger value="leaderboard" data-testid="tab-leaderboard">
            Moderators
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="space-y-4">
          {reportsLoading ? (
            <div className="text-center py-12">Loading reports...</div>
          ) : reports.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No reports pending review</p>
              </CardContent>
            </Card>
          ) : (
            reports.map((report) => (
              <Card key={report.id} data-testid={`card-report-${report.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        {getStatusIcon(report.status)}
                        <span className="capitalize">{report.reportType.replace('_', ' ')}</span>
                        <Badge variant={getSeverityColor(report.severity)}>
                          {report.severity}
                        </Badge>
                        {report.status === 'escalated' && (
                          <Badge variant="outline">Auto-Escalated</Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        Reported by @{report.reporter.username} •{' '}
                        {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm mb-2"><strong>Description:</strong></p>
                    <p className="text-sm text-muted-foreground">{report.description}</p>
                  </div>

                  {report.reportedUser && (
                    <div>
                      <p className="text-sm">
                        <strong>Reported User:</strong> @{report.reportedUser.username}
                      </p>
                    </div>
                  )}

                  {report.reportedContent && (
                    <div>
                      <p className="text-sm">
                        <strong>Reported Content:</strong> {report.reportedContent.title}
                      </p>
                    </div>
                  )}

                  <div className="border-t pt-4">
                    <p className="text-sm font-medium mb-2">Community Voting</p>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                          <ThumbsUp className="h-4 w-4" />
                          Valid: {report.votingStats.validVotes}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {report.votingStats.weightedValidPercent}% weighted
                        </p>
                      </div>
                      <div>
                        <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                          <ThumbsDown className="h-4 w-4" />
                          Invalid: {report.votingStats.invalidVotes}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {report.votingStats.weightedInvalidPercent}% weighted
                        </p>
                      </div>
                      <div>
                        <div className="flex items-center gap-1">
                          <HelpCircle className="h-4 w-4" />
                          Unsure: {report.votingStats.unsureVotes}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Avg rep: {report.votingStats.avgVoterReputation}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedReport(report);
                        setVoteDialogOpen(true);
                      }}
                      data-testid={`button-vote-${report.id}`}
                    >
                      <ThumbsUp className="h-4 w-4 mr-2" />
                      Vote
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedReport(report);
                        setResolveDialogOpen(true);
                      }}
                      data-testid={`button-resolve-${report.id}`}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Resolve
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {votingHistory.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <ThumbsUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No voting history yet</p>
              </CardContent>
            </Card>
          ) : (
            votingHistory.map((vote: any) => (
              <Card key={vote.id} data-testid={`card-vote-${vote.id}`}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        Voted: <Badge variant={vote.vote === 'valid' ? 'default' : vote.vote === 'invalid' ? 'destructive' : 'secondary'}>
                          {vote.vote}
                        </Badge>
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(vote.createdAt), { addSuffix: true })}
                      </p>
                      {vote.reason && (
                        <p className="text-sm text-muted-foreground mt-2">
                          Reason: {vote.reason}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Reputation at vote</p>
                      <p className="text-xl font-bold">{vote.voterReputation}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="leaderboard" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Top Moderators
              </CardTitle>
              <CardDescription>
                Community members who help keep PupFanz safe
              </CardDescription>
            </CardHeader>
            <CardContent>
              {leaderboard.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No moderators yet</p>
              ) : (
                <div className="space-y-3">
                  {leaderboard.map((mod: any, index: number) => (
                    <div
                      key={mod.userId}
                      className="flex items-center justify-between p-3 border rounded-lg"
                      data-testid={`moderator-${mod.userId}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-2xl font-bold text-muted-foreground">
                          #{index + 1}
                        </div>
                        <div>
                          <p className="font-medium">@{mod.user.username}</p>
                          <p className="text-sm text-muted-foreground">
                            {mod.totalReviews} reviews
                          </p>
                        </div>
                      </div>
                      {mod.isSeniorModerator && (
                        <Badge variant="default">
                          <Award className="h-3 w-3 mr-1" />
                          Senior
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Vote Dialog */}
      <Dialog open={voteDialogOpen} onOpenChange={setVoteDialogOpen}>
        <DialogContent data-testid="dialog-vote">
          <DialogHeader>
            <DialogTitle>Submit Your Vote</DialogTitle>
            <DialogDescription>
              Your reputation score affects the weight of your vote
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Vote</Label>
              <Select value={voteType} onValueChange={(v: any) => setVoteType(v)}>
                <SelectTrigger data-testid="select-vote-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="valid" data-testid="option-valid">Valid - This report has merit</SelectItem>
                  <SelectItem value="invalid" data-testid="option-invalid">Invalid - This is not a real concern</SelectItem>
                  <SelectItem value="unsure" data-testid="option-unsure">Unsure - Need more information</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Reason (optional)</Label>
              <Textarea
                value={voteReason}
                onChange={(e) => setVoteReason(e.target.value)}
                placeholder="Explain your vote..."
                data-testid="textarea-vote-reason"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVoteDialogOpen(false)} data-testid="button-cancel-vote">
              Cancel
            </Button>
            <Button onClick={handleVote} disabled={voteMutation.isPending} data-testid="button-submit-vote">
              {voteMutation.isPending ? 'Submitting...' : 'Submit Vote'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resolve Dialog */}
      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <DialogContent data-testid="dialog-resolve">
          <DialogHeader>
            <DialogTitle>Resolve Report</DialogTitle>
            <DialogDescription>
              Make a final decision on this report
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Action</Label>
              <Select value={resolveAction} onValueChange={(v: any) => setResolveAction(v)}>
                <SelectTrigger data-testid="select-resolve-action">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="resolved" data-testid="option-resolved">Resolved - Action taken</SelectItem>
                  <SelectItem value="dismissed" data-testid="option-dismissed">Dismissed - No action needed</SelectItem>
                  <SelectItem value="escalated" data-testid="option-escalated">Escalate - Needs senior review</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Resolution Notes</Label>
              <Textarea
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                placeholder="Explain the resolution..."
                required
                data-testid="textarea-resolution"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveDialogOpen(false)} data-testid="button-cancel-resolve">
              Cancel
            </Button>
            <Button 
              onClick={handleResolve} 
              disabled={resolveMutation.isPending || !resolution.trim()}
              data-testid="button-submit-resolve"
            >
              {resolveMutation.isPending ? 'Resolving...' : 'Resolve Report'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Report Dialog */}
      <Dialog open={createReportOpen} onOpenChange={setCreateReportOpen}>
        <DialogContent data-testid="dialog-create-report">
          <DialogHeader>
            <DialogTitle>Report Safety Issue</DialogTitle>
            <DialogDescription>
              Help keep the community safe by reporting violations
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Report Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger data-testid="select-report-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="underage">Underage Content</SelectItem>
                  <SelectItem value="non_consensual">Non-Consensual Content</SelectItem>
                  <SelectItem value="violence">Violence</SelectItem>
                  <SelectItem value="hate_speech">Hate Speech</SelectItem>
                  <SelectItem value="spam">Spam</SelectItem>
                  <SelectItem value="copyright">Copyright Violation</SelectItem>
                  <SelectItem value="impersonation">Impersonation</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Target Type</Label>
              <Select value={reportTargetType} onValueChange={(v: any) => setReportTargetType(v)}>
                <SelectTrigger data-testid="select-target-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="content">Content</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="message">Message</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Target ID</Label>
              <input
                type="text"
                value={reportTargetId}
                onChange={(e) => setReportTargetId(e.target.value)}
                placeholder={`Enter ${reportTargetType} ID`}
                className="w-full px-3 py-2 border rounded-md"
                data-testid="input-target-id"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                placeholder="Describe the safety concern..."
                required
                data-testid="textarea-report-description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateReportOpen(false)} data-testid="button-cancel-create">
              Cancel
            </Button>
            <Button 
              onClick={handleCreateReport} 
              disabled={createReportMutation.isPending || !reportDescription.trim() || !reportTargetId.trim()}
              data-testid="button-submit-create"
            >
              {createReportMutation.isPending ? 'Submitting...' : 'Submit Report'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
