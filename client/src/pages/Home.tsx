import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import FanzInfinityScrollFeed from "@/components/feed/FanzInfinityScrollFeed";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Shield, Heart, Users } from "lucide-react";

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="pt-20 md:pt-32">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          {/* Welcome Banner */}
          <section className="py-4 md:py-8 mb-4 md:mb-8">
            <div className="flex flex-col gap-3 md:gap-4">
              <div>
                <h1 className="neon-heading text-2xl sm:text-3xl md:text-4xl mb-2">
                  Welcome to Your
                  <span className="neon-text-accent ml-2">Pack Feed</span>
                </h1>
                <p className="text-sm md:text-base text-muted">
                  {(user as any)?.role === 'creator' 
                    ? "Share your content and connect with your pack"
                    : "Discover amazing content from creators you love"
                  }
                </p>
              </div>
              
              {/* Safety Indicators - Scrollable on mobile */}
              <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                <Badge className="safety-badge safety-badge-verified whitespace-nowrap" data-testid="badge-age-verified">
                  <Shield className="mr-1 h-3 w-3" />
                  <span className="hidden sm:inline">18+ Verified</span>
                  <span className="sm:hidden">18+</span>
                </Badge>
                <Badge className="safety-badge safety-badge-consent whitespace-nowrap" data-testid="badge-consent-clear">
                  <Heart className="mr-1 h-3 w-3" />
                  <span className="hidden sm:inline">Consent-Clear</span>
                  <span className="sm:hidden">Consent</span>
                </Badge>
                <Badge className="safety-badge safety-badge-aftercare whitespace-nowrap" data-testid="badge-pack-safe">
                  <Users className="mr-1 h-3 w-3" />
                  <span className="hidden sm:inline">Pack-Safe</span>
                  <span className="sm:hidden">Safe</span>
                </Badge>
              </div>
            </div>
          </section>

          {/* Main Feed Container */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6">
            {/* Main Feed - Takes up most space */}
            <div className="lg:col-span-3 order-2 lg:order-1">
              <FanzInfinityScrollFeed />
            </div>

            {/* Sidebar - Stats & Info - Stacks on mobile */}
            <div className="space-y-4 md:space-y-6 order-1 lg:order-2">
              {/* Pack Stats */}
              {(user as any)?.role === 'creator' && (
                <Card className="pack-card">
                  <CardHeader>
                    <CardTitle className="flex items-center text-lg">
                      <TrendingUp className="mr-2 h-4 w-4" />
                      Your Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-2xl font-bold text-primary" data-testid="text-pack-members">0</p>
                      <p className="text-xs text-muted">Pack Members</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-secondary" data-testid="text-total-posts">0</p>
                      <p className="text-xs text-muted">Total Posts</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-accent" data-testid="text-total-engagement">0</p>
                      <p className="text-xs text-muted">Engagement</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Safety Reminder */}
              <Card className="pack-card bg-gradient-to-br from-volt/10 to-cobalt/10">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Shield className="mr-2 h-4 w-4" />
                    Pack Safety
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    All content is age-verified via VerifyMy
                  </p>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>Age Verified</span>
                      <Badge variant="outline" className="text-xs">✓</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Consent Clear</span>
                      <Badge variant="outline" className="text-xs">✓</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Feed Info */}
              <Card className="pack-card">
                <CardHeader>
                  <CardTitle className="text-lg">Feed Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>🔄 Infinite scroll enabled</p>
                  <p>📢 Sponsored content every 4 posts</p>
                  <p>🔒 Locked content requires subscription</p>
                  <p>🆓 Free posts available for all</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
