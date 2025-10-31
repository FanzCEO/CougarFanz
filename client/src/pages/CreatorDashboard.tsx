import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Upload, Zap, Settings, TrendingUp, Send, Calendar, Users, Video,
  Sparkles, Target, BarChart3, Plus, Play, Edit3, CheckCircle2, XCircle
} from 'lucide-react';

interface Content {
  id: string;
  title: string;
  description: string;
  creatorUserId: string;
  accessLevel: string;
  price: string;
  status: string;
  createdAt: string;
}

interface SocialMediaAccount {
  id: string;
  platform: string;
  platformUsername: string;
  status: string;
}

export default function CreatorDashboard() {
  const { toast } = useToast();
  const [selectedContent, setSelectedContent] = useState<string | null>(null);
  const [customCaption, setCustomCaption] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [autoEdit, setAutoEdit] = useState(true);
  const [aspectRatios, setAspectRatios] = useState(['9:16', '16:9', '1:1']);
  const [generateGif, setGenerateGif] = useState(true);
  const [scheduleFor, setScheduleFor] = useState('');

  // Fetch creator's content
  const { data: content = [] } = useQuery<Content[]>({
    queryKey: ['/api/content'],
  });

  // Fetch connected social accounts
  const { data: accounts = [] } = useQuery<SocialMediaAccount[]>({
    queryKey: ['/api/distribution/accounts'],
  });

  // One-tap publish mutation
  const publishMutation = useMutation({
    mutationFn: async (data: {
      contentId: string;
      platforms?: string[];
      customCaption?: string;
      autoEdit?: boolean;
      aspectRatios?: string[];
      generateGif?: boolean;
      scheduledFor?: string;
    }) => {
      return await apiRequest('/api/dashboard/quick-publish', 'POST', data);
    },
    onSuccess: () => {
      toast({
        title: "Content Published!",
        description: "Your content is being distributed to selected platforms.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/distribution/jobs'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Publishing Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Content processing mutation
  const processMutation = useMutation({
    mutationFn: async (data: {
      contentId: string;
      operations: string[];
      aspectRatios?: string[];
      gifDuration?: number;
      trailerDuration?: number;
    }) => {
      return await apiRequest('/api/content-processing/jobs', 'POST', data);
    },
    onSuccess: () => {
      toast({
        title: "Processing Started",
        description: "Your content is being processed. You'll be notified when complete.",
      });
    },
  });

  const handleQuickPublish = () => {
    if (!selectedContent) {
      toast({
        title: "No Content Selected",
        description: "Please select content to publish.",
        variant: "destructive",
      });
      return;
    }

    publishMutation.mutate({
      contentId: selectedContent,
      platforms: selectedPlatforms.length > 0 ? selectedPlatforms : undefined,
      customCaption: customCaption || undefined,
      autoEdit,
      aspectRatios,
      generateGif,
      scheduledFor: scheduleFor || undefined,
    });
  };

  const connectedPlatforms = accounts.filter(a => a.status === 'connected');
  const isPending = publishMutation.isPending || processMutation.isPending;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Creator Control Center</h1>
            <p className="text-muted-foreground mt-2">
              One-tap publishing, content processing, and campaign management
            </p>
          </div>
          <Button size="lg" className="gap-2" data-testid="button-new-content">
            <Plus className="h-4 w-4" />
            Upload Content
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card data-testid="card-connected-platforms">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Connected Platforms</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{connectedPlatforms.length}</div>
              <p className="text-xs text-muted-foreground">
                {connectedPlatforms.map(a => a.platform).join(', ')}
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-content-items">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Content Library</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{content.length}</div>
              <p className="text-xs text-muted-foreground">Ready to publish</p>
            </CardContent>
          </Card>

          <Card data-testid="card-processing-queue">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Processing Queue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Jobs in progress</p>
            </CardContent>
          </Card>

          <Card data-testid="card-reach">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Potential Reach</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">∞</div>
              <p className="text-xs text-muted-foreground">Across all platforms</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Control Panel */}
        <Tabs defaultValue="publish" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto">
            <TabsTrigger value="publish" className="gap-2" data-testid="tab-publish">
              <Zap className="h-4 w-4" />
              Publish
            </TabsTrigger>
            <TabsTrigger value="process" className="gap-2" data-testid="tab-process">
              <Sparkles className="h-4 w-4" />
              Process
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="gap-2" data-testid="tab-campaigns">
              <Target className="h-4 w-4" />
              Campaigns
            </TabsTrigger>
            <TabsTrigger value="streaming" className="gap-2" data-testid="tab-streaming">
              <Video className="h-4 w-4" />
              Live
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2" data-testid="tab-analytics">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* One-Tap Publishing Tab */}
          <TabsContent value="publish" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Content Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Select Content
                  </CardTitle>
                  <CardDescription>
                    Choose content to publish across platforms
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {content.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Upload className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No content available</p>
                      <Button variant="link" className="mt-2" data-testid="button-upload-first">
                        Upload your first content
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {content.map((item) => (
                        <div
                          key={item.id}
                          className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                            selectedContent === item.id
                              ? 'border-primary bg-primary/5'
                              : 'hover:border-primary/50'
                          }`}
                          onClick={() => setSelectedContent(item.id)}
                          data-testid={`content-item-${item.id}`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium">{item.title}</h4>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {item.description}
                              </p>
                            </div>
                            {selectedContent === item.id && (
                              <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 ml-2" />
                            )}
                          </div>
                          <div className="mt-2 flex gap-2">
                            <Badge variant="outline">{item.accessLevel}</Badge>
                            <Badge variant="outline">{item.status}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Publishing Options */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Publishing Options
                  </CardTitle>
                  <CardDescription>
                    Customize caption, platforms, and schedule
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Custom Caption */}
                  <div className="space-y-2">
                    <Label htmlFor="caption">Custom Caption (Optional)</Label>
                    <Textarea
                      id="caption"
                      placeholder="Add a custom caption for this post..."
                      value={customCaption}
                      onChange={(e) => setCustomCaption(e.target.value)}
                      rows={3}
                      data-testid="input-caption"
                    />
                  </div>

                  {/* Platform Selection */}
                  <div className="space-y-2">
                    <Label>Platforms</Label>
                    <div className="text-sm text-muted-foreground mb-2">
                      {connectedPlatforms.length === 0 ? (
                        <span>No platforms connected. <Button variant="link" className="h-auto p-0" data-testid="link-connect-platforms">Connect platforms</Button></span>
                      ) : (
                        'Select platforms or leave empty for all connected'
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {connectedPlatforms.map((account) => (
                        <Button
                          key={account.id}
                          variant={selectedPlatforms.includes(account.platform) ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            setSelectedPlatforms(prev =>
                              prev.includes(account.platform)
                                ? prev.filter(p => p !== account.platform)
                                : [...prev, account.platform]
                            );
                          }}
                          data-testid={`button-platform-${account.platform}`}
                        >
                          {account.platform}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Schedule */}
                  <div className="space-y-2">
                    <Label htmlFor="schedule">Schedule (Optional)</Label>
                    <Input
                      id="schedule"
                      type="datetime-local"
                      value={scheduleFor}
                      onChange={(e) => setScheduleFor(e.target.value)}
                      data-testid="input-schedule"
                    />
                    <p className="text-xs text-muted-foreground">
                      Leave empty to publish immediately
                    </p>
                  </div>

                  <Separator />

                  {/* Auto-Processing Options */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="auto-edit">Auto-Edit Content</Label>
                        <p className="text-xs text-muted-foreground">
                          AI-powered post-production
                        </p>
                      </div>
                      <Switch
                        id="auto-edit"
                        checked={autoEdit}
                        onCheckedChange={setAutoEdit}
                        data-testid="switch-auto-edit"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Aspect Ratio Conversion</Label>
                      <p className="text-xs text-muted-foreground mb-2">
                        Select formats to generate for platform optimization
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { value: '9:16', label: 'Vertical (9:16)', desc: 'Stories, Reels' },
                          { value: '16:9', label: 'Horizontal (16:9)', desc: 'YouTube, Desktop' },
                          { value: '1:1', label: 'Square (1:1)', desc: 'Instagram Feed' },
                        ].map((ratio) => (
                          <Button
                            key={ratio.value}
                            variant={aspectRatios.includes(ratio.value) ? 'default' : 'outline'}
                            size="sm"
                            className="flex flex-col h-auto py-2"
                            onClick={() => {
                              setAspectRatios(prev =>
                                prev.includes(ratio.value)
                                  ? prev.filter(r => r !== ratio.value)
                                  : [...prev, ratio.value]
                              );
                            }}
                            data-testid={`button-aspect-${ratio.value}`}
                          >
                            <span className="font-medium text-sm">{ratio.label}</span>
                            <span className="text-xs opacity-70">{ratio.desc}</span>
                          </Button>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {aspectRatios.length === 0 
                          ? 'No conversions selected - original format only' 
                          : `${aspectRatios.length} format(s) selected`}
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="generate-gif">Generate GIF</Label>
                        <p className="text-xs text-muted-foreground">
                          Auto-create GIF preview
                        </p>
                      </div>
                      <Switch
                        id="generate-gif"
                        checked={generateGif}
                        onCheckedChange={setGenerateGif}
                        data-testid="switch-generate-gif"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Publish Button */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">Ready to Publish?</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedContent
                        ? `Publishing to ${selectedPlatforms.length > 0 ? selectedPlatforms.length : connectedPlatforms.length} platform(s)`
                        : 'Select content to get started'}
                    </p>
                  </div>
                  <Button
                    size="lg"
                    onClick={handleQuickPublish}
                    disabled={!selectedContent || isPending}
                    className="gap-2"
                    data-testid="button-quick-publish"
                  >
                    {isPending ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Publishing...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        {scheduleFor ? 'Schedule' : 'Publish'} Now
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Content Processing Tab */}
          <TabsContent value="process" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>AI Content Processing</CardTitle>
                <CardDescription>
                  Auto-edit, convert, and generate assets for your content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Content processing controls coming soon</p>
                  <p className="text-sm mt-2">Auto-edit, aspect ratio conversion, GIF generation, and more</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Marketing Campaigns Tab */}
          <TabsContent value="campaigns" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Marketing Campaigns</CardTitle>
                <CardDescription>
                  Automated retargeting and fan engagement campaigns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Campaign management interface coming soon</p>
                  <p className="text-sm mt-2">Create automated campaigns, segment fans, and track analytics</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Live Streaming Tab */}
          <TabsContent value="streaming" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Live Streaming</CardTitle>
                <CardDescription>
                  Start and manage live streams with co-star verification
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <Video className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Live streaming controls coming soon</p>
                  <p className="text-sm mt-2">Go live, manage co-stars, and track viewer engagement</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Analytics</CardTitle>
                <CardDescription>
                  Track reach, engagement, and revenue across all platforms
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Analytics dashboard coming soon</p>
                  <p className="text-sm mt-2">Real-time insights into your content performance</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
