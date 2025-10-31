import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import EarningsCard from "@/components/creator/EarningsCard";
import ContentUpload from "@/components/creator/ContentUpload";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Users, Eye, Heart, Upload, MessageCircle, Settings, MoreHorizontal } from "lucide-react";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, toast]);

  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['/api/analytics/stats'],
    enabled: isAuthenticated,
  });

  const { data: earnings, isLoading: earningsLoading, error: earningsError } = useQuery({
    queryKey: ['/api/analytics/earnings/month'],
    enabled: isAuthenticated,
  });

  const { data: content, isLoading: contentLoading, error: contentError } = useQuery({
    queryKey: ['/api/content', user?.id],
    enabled: isAuthenticated && !!user?.id,
  });

  // Handle errors
  useEffect(() => {
    const errors = [statsError, earningsError, contentError].filter(Boolean);
    errors.forEach(error => {
      if (error && isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
      }
    });
  }, [statsError, earningsError, contentError, toast]);

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="pt-20 md:pt-32">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          {/* Dashboard Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 md:mb-8">
            <div className="flex items-center space-x-3 md:space-x-4 mb-4 lg:mb-0">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-xl flex items-center justify-center border-2 border-primary/30">
                {user?.profileImageUrl ? (
                  <img 
                    src={user.profileImageUrl} 
                    alt="Profile" 
                    className="w-full h-full rounded-xl object-cover"
                  />
                ) : (
                  <Users className="h-6 w-6 md:h-8 md:w-8 text-primary" />
                )}
              </div>
              <div>
                <h1 className="font-display font-bold text-xl md:text-2xl text-foreground" data-testid="text-username">
                  {user?.username || 'Creator'}
                </h1>
                <div className="flex items-center space-x-1 md:space-x-2 mt-1">
                  <Badge className="safety-badge safety-badge-verified text-xs">
                    <span className="hidden sm:inline">Verified</span>
                    <span className="sm:hidden">✓</span>
                  </Badge>
                  <Badge className="safety-badge safety-badge-consent text-xs">
                    <span className="hidden sm:inline">Consent-Clear</span>
                    <span className="sm:hidden">Safe</span>
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-4">
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90 text-sm sm:text-base" data-testid="button-upload-content">
                <Upload className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Upload Content</span>
                <span className="sm:hidden">Upload</span>
              </Button>
              <Button variant="outline" size="icon" data-testid="button-settings">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 md:mb-8">
            <Card className="pack-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted">Pack Members</p>
                    {statsLoading ? (
                      <Skeleton className="h-8 w-16" />
                    ) : (
                      <p className="text-2xl font-bold text-secondary" data-testid="text-subscribers">
                        {stats?.subscribers || 0}
                      </p>
                    )}
                  </div>
                  <div className="w-12 h-12 bg-secondary/20 rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-secondary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="pack-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted">Content Posts</p>
                    {statsLoading ? (
                      <Skeleton className="h-8 w-16" />
                    ) : (
                      <p className="text-2xl font-bold text-accent" data-testid="text-content-count">
                        {stats?.contentCount || 0}
                      </p>
                    )}
                  </div>
                  <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center">
                    <Upload className="h-6 w-6 text-accent" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="pack-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted">Total Views</p>
                    {statsLoading ? (
                      <Skeleton className="h-8 w-16" />
                    ) : (
                      <p className="text-2xl font-bold text-primary" data-testid="text-total-views">
                        {stats?.totalViews || 0}
                      </p>
                    )}
                  </div>
                  <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                    <Eye className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="pack-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted">This Month</p>
                    {earningsLoading ? (
                      <Skeleton className="h-8 w-20" />
                    ) : (
                      <p className="text-2xl font-bold text-success" data-testid="text-monthly-earnings">
                        ${earnings?.totalEarnings?.toFixed(2) || '0.00'}
                      </p>
                    )}
                  </div>
                  <div className="w-12 h-12 bg-success/20 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-success" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Earnings Overview */}
              <EarningsCard />

              {/* Recent Content */}
              <Card className="pack-card">
                <CardHeader>
                  <CardTitle>Recent Content</CardTitle>
                </CardHeader>
                <CardContent>
                  {contentLoading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-20" />
                      <Skeleton className="h-20" />
                      <Skeleton className="h-20" />
                    </div>
                  ) : content?.length > 0 ? (
                    <div className="space-y-4">
                      {content.slice(0, 5).map((item: any) => (
                        <div key={item.id} className="flex items-center space-x-4 p-4 bg-background rounded-lg border border-border hover:border-primary/30 transition-colors">
                          <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg flex items-center justify-center">
                            {item.mimeType?.startsWith('image/') ? (
                              <Eye className="h-6 w-6 text-primary" />
                            ) : (
                              <Upload className="h-6 w-6 text-accent" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="font-medium text-foreground truncate" data-testid="text-content-title">
                              {item.title || 'Untitled'}
                            </h5>
                            <p className="text-sm text-muted" data-testid="text-content-stats">
                              {item.viewCount || 0} views • {item.likeCount || 0} likes • 
                              {new Date(item.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-primary" data-testid="text-content-earnings">
                              ${item.price || '0.00'}
                            </span>
                            <Button variant="ghost" size="sm" data-testid="button-content-options">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Upload className="h-12 w-12 text-muted mx-auto mb-4" />
                      <p className="text-muted mb-4">No content uploaded yet</p>
                      <Button className="btn-primary" data-testid="button-upload-first-content">
                        Upload Your First Content
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Pack Activity */}
              <Card className="pack-card">
                <CardHeader>
                  <CardTitle>Pack Activity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-background rounded-lg border border-border">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                        <Users className="text-primary text-xs" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">New Pack Member</p>
                        <p className="text-xs text-muted">PupLover99 joined</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-background rounded-lg border border-border">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center">
                        <Heart className="text-accent text-xs" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Tip Received</p>
                        <p className="text-xs text-muted">$25 from GoodBoi47</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-background rounded-lg border border-border">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-8 h-8 bg-secondary/20 rounded-full flex items-center justify-center">
                        <MessageCircle className="text-secondary text-xs" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">New Comment</p>
                        <p className="text-xs text-muted">Amazing content! 🐾</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Content Upload Widget */}
              <ContentUpload />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
