import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Heart, 
  MessageCircle, 
  Share, 
  Shield, 
  Users, 
  Eye, 
  Star,
  DollarSign,
  Calendar,
  MapPin,
  Verified,
  Flag
} from "lucide-react";
import { useEffect } from "react";

export default function CreatorProfile() {
  const params = useParams();
  const userId = params.userId;
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: profile, isLoading: profileLoading, error: profileError } = useQuery({
    queryKey: ['/api/profile', userId],
    enabled: !!userId,
  });

  const { data: content, isLoading: contentLoading } = useQuery({
    queryKey: ['/api/content', userId],
    enabled: !!userId,
  });

  const { data: subscriptions } = useQuery({
    queryKey: ['/api/subscriptions/mine'],
    enabled: isAuthenticated,
  });

  const subscribeMutation = useMutation({
    mutationFn: async (data: { creatorId: string; tier: string; price: number }) => {
      await apiRequest('POST', '/api/subscriptions', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/subscriptions/mine'] });
      toast({
        title: "Success!",
        description: "Successfully joined the pack!",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
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
      toast({
        title: "Error",
        description: "Failed to join pack. Please try again.",
        variant: "destructive",
      });
    },
  });

  const tipMutation = useMutation({
    mutationFn: async (data: { toUserId: string; amount: number; message?: string }) => {
      await apiRequest('POST', '/api/tips', data);
    },
    onSuccess: () => {
      toast({
        title: "Tip Sent!",
        description: "Your tip has been sent successfully!",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
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
      toast({
        title: "Error",
        description: "Failed to send tip. Please try again.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (profileError && isUnauthorizedError(profileError as Error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [profileError, toast]);

  const isSubscribed = subscriptions?.some((sub: any) => sub.creatorId === userId && sub.status === 'active');
  const isOwnProfile = user?.id === userId;

  const handleSubscribe = () => {
    subscribeMutation.mutate({
      creatorId: userId!,
      tier: 'basic',
      price: 9.99
    });
  };

  const handleTip = (amount: number) => {
    tipMutation.mutate({
      toUserId: userId!,
      amount,
      message: `Tip from ${user?.username || 'Anonymous'}`
    });
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-40 pb-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="space-y-6">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-40 pb-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="py-12">
              <Users className="h-16 w-16 text-muted mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Profile Not Found</h1>
              <p className="text-muted">This creator profile doesn't exist or has been removed.</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Profile Header */}
          <Card className="pack-card mb-8">
            <CardContent className="p-0">
              {/* Banner */}
              <div className="h-48 bg-moonyard rounded-t-xl relative overflow-hidden">
                {profile.profile?.bannerUrl && (
                  <img 
                    src={profile.profile.bannerUrl} 
                    alt="Profile banner"
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              </div>

              {/* Profile Info */}
              <div className="relative px-6 pb-6">
                <div className="flex flex-col sm:flex-row sm:items-end sm:space-x-6 -mt-16 relative z-10">
                  <Avatar className="w-32 h-32 border-4 border-background shadow-volt-glow">
                    <AvatarImage 
                      src={profile.profile?.avatarUrl || profile.profileImageUrl} 
                      alt={profile.profile?.displayName || profile.username}
                    />
                    <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                      {(profile.profile?.displayName || profile.username)?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 mt-4 sm:mt-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h1 className="font-display font-bold text-3xl text-foreground" data-testid="text-creator-name">
                          {profile.profile?.displayName || profile.username}
                        </h1>
                        <p className="text-muted">@{profile.username}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          {profile.profile?.ageVerified && (
                            <Badge className="safety-badge safety-badge-verified">
                              <Verified className="mr-1 h-3 w-3" />
                              18+ Verified
                            </Badge>
                          )}
                          {profile.profile?.kycStatus === 'verified' && (
                            <Badge className="safety-badge safety-badge-consent">
                              <Shield className="mr-1 h-3 w-3" />
                              KYC Verified
                            </Badge>
                          )}
                          {profile.profile?.isAftercareFriendly && (
                            <Badge className="safety-badge safety-badge-aftercare">
                              <Heart className="mr-1 h-3 w-3" />
                              Aftercare-Friendly
                            </Badge>
                          )}
                          {profile.profile?.packType && (
                            <Badge variant="outline">
                              {profile.profile.packType}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {!isOwnProfile && isAuthenticated && (
                        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
                          {!isSubscribed ? (
                            <Button 
                              className="btn-primary"
                              onClick={handleSubscribe}
                              disabled={subscribeMutation.isPending}
                              data-testid="button-subscribe"
                            >
                              <Heart className="mr-2 h-4 w-4" />
                              Join Pack - $9.99/mo
                            </Button>
                          ) : (
                            <Button variant="outline" disabled data-testid="button-subscribed">
                              <Heart className="mr-2 h-4 w-4 fill-current" />
                              Pack Member
                            </Button>
                          )}
                          <Button variant="outline" data-testid="button-message">
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" data-testid="button-share">
                            <Share className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {profile.profile?.bio && (
                      <p className="mt-4 text-foreground max-w-2xl" data-testid="text-creator-bio">
                        {profile.profile.bio}
                      </p>
                    )}

                    {/* Stats */}
                    <div className="flex items-center space-x-6 mt-4 text-sm text-muted">
                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4" />
                        <span data-testid="text-pack-members">1.2K pack members</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Eye className="h-4 w-4" />
                        <span data-testid="text-total-views">45.2K views</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>Joined {new Date(profile.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content Tabs */}
          <Tabs defaultValue="content" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 bg-card border border-border">
              <TabsTrigger value="content" data-testid="tab-content">Content</TabsTrigger>
              <TabsTrigger value="about" data-testid="tab-about">About</TabsTrigger>
              <TabsTrigger value="pack" data-testid="tab-pack">Pack</TabsTrigger>
              <TabsTrigger value="tips" data-testid="tab-tips">Tips</TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="space-y-6">
              {contentLoading ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Skeleton className="aspect-square" />
                  <Skeleton className="aspect-square" />
                  <Skeleton className="aspect-square" />
                </div>
              ) : content?.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {content.map((item: any) => (
                    <Card key={item.id} className="pack-card overflow-hidden group cursor-pointer">
                      <div className="aspect-square bg-gradient-to-br from-primary/20 to-secondary/20 relative">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Eye className="h-8 w-8 text-primary" />
                        </div>
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="text-center text-white">
                            <Eye className="h-6 w-6 mx-auto mb-2" />
                            <p className="text-sm">{item.viewCount || 0} views</p>
                          </div>
                        </div>
                        {item.accessLevel === 'ppv' && (
                          <div className="absolute top-2 right-2">
                            <Badge className="bg-accent text-accent-foreground">
                              ${item.price}
                            </Badge>
                          </div>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-medium truncate" data-testid="text-content-title">
                          {item.title}
                        </h3>
                        <div className="flex items-center justify-between mt-2 text-sm text-muted">
                          <span>{item.likeCount || 0} likes</span>
                          <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Eye className="h-12 w-12 text-muted mx-auto mb-4" />
                  <h3 className="font-semibold text-lg mb-2">No Content Yet</h3>
                  <p className="text-muted">This creator hasn't posted any content yet.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="about" className="space-y-6">
              <Card className="pack-card">
                <CardHeader>
                  <CardTitle>About {profile.profile?.displayName || profile.username}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {profile.profile?.bio && (
                    <div>
                      <h4 className="font-medium mb-2">Bio</h4>
                      <p className="text-muted">{profile.profile.bio}</p>
                    </div>
                  )}
                  
                  <div>
                    <h4 className="font-medium mb-2">Pack Details</h4>
                    <div className="space-y-2">
                      {profile.profile?.packType && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted">Pack Type</span>
                          <Badge variant="outline">{profile.profile.packType}</Badge>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-muted">Member Since</span>
                        <span>{new Date(profile.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted">Age Verified</span>
                        <Badge className={profile.profile?.ageVerified ? "safety-badge-verified" : "bg-muted"}>
                          {profile.profile?.ageVerified ? "Verified" : "Pending"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="pack" className="space-y-6">
              <Card className="pack-card">
                <CardHeader>
                  <CardTitle>Pack Community</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-muted mx-auto mb-4" />
                    <p className="text-muted">Pack member features coming soon!</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tips" className="space-y-6">
              {!isOwnProfile && isAuthenticated && (
                <Card className="pack-card">
                  <CardHeader>
                    <CardTitle>Send a Tip</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[5, 10, 25, 50].map((amount) => (
                        <Button
                          key={amount}
                          variant="outline"
                          onClick={() => handleTip(amount)}
                          disabled={tipMutation.isPending}
                          className="h-16"
                          data-testid={`button-tip-${amount}`}
                        >
                          <div className="text-center">
                            <DollarSign className="h-5 w-5 mx-auto mb-1" />
                            <span className="text-lg font-bold">${amount}</span>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card className="pack-card">
                <CardHeader>
                  <CardTitle>Recent Tips</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Heart className="h-12 w-12 text-muted mx-auto mb-4" />
                    <p className="text-muted">No tips to display</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Report Button */}
          {!isOwnProfile && (
            <div className="mt-8 text-center">
              <Button variant="ghost" size="sm" className="text-muted hover:text-destructive" data-testid="button-report">
                <Flag className="h-4 w-4 mr-2" />
                Report Profile
              </Button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
