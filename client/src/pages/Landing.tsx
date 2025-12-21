import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AuthModal from "@/components/auth/AuthModal";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { PawPrint, Bolt, Shield, Heart, Users, Upload, Eye, Star } from "lucide-react";

export default function Landing() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');

  const handleAuthClick = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  return (
    <div className="min-h-screen">
      <Header onAuthClick={handleAuthClick} />
      
      {/* Hero Section */}
      <section className="relative pt-40 pb-16 bg-moonyard overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <h1 className="neon-heading text-5xl sm:text-6xl lg:text-7xl leading-tight mb-6">
                Find Your
                <span className="neon-text-accent animate-pack-howl ml-4">Pack</span>
              </h1>
              <p className="text-xl neon-text-secondary mb-8 max-w-2xl">
                The wild, high-energy creator platform where pups connect, share content, and build supportive communities. Safety-first, pack-centric, and built for authentic connections.
              </p>
              
              {/* Dual Auth Options */}
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Button 
                  className="btn-primary px-8 py-4 text-lg"
                  onClick={() => window.location.href = '/api/login'}
                  data-testid="button-replit-auth"
                >
                  <Bolt className="mr-2 h-5 w-5" />
                  Quick Start with Replit
                </Button>
                <Button 
                  variant="outline" 
                  className="px-8 py-4 text-lg border-2 border-secondary text-secondary hover:bg-secondary/10"
                  onClick={() => handleAuthClick('register')}
                  data-testid="button-register"
                >
                  Create New Account
                </Button>
              </div>

              {/* Safety Features */}
              <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                <Badge className="safety-badge safety-badge-verified" data-testid="badge-verified">
                  <Shield className="mr-2 h-3 w-3" />
                  18+ Verified
                </Badge>
                <Badge className="safety-badge safety-badge-consent" data-testid="badge-consent">
                  <Heart className="mr-2 h-3 w-3" />
                  Consent-Clear
                </Badge>
                <Badge className="safety-badge safety-badge-aftercare" data-testid="badge-pack-safe">
                  <Users className="mr-2 h-3 w-3" />
                  Pack-Safe
                </Badge>
              </div>
            </div>

            {/* Auth Preview */}
            <div className="lg:max-w-md mx-auto w-full">
              <Card className="pack-card shadow-2xl">
                <CardContent className="p-6">
                  <div className="flex space-x-1 mb-6 bg-background rounded-lg p-1">
                    <Button 
                      className="flex-1 py-2 px-4 text-sm font-medium bg-primary text-primary-foreground rounded-md"
                      onClick={() => handleAuthClick('register')}
                      data-testid="button-join-pack"
                    >
                      Join Pack
                    </Button>
                    <Button 
                      variant="ghost"
                      className="flex-1 py-2 px-4 text-sm font-medium text-muted rounded-md hover:bg-background/50"
                      onClick={() => handleAuthClick('login')}
                      data-testid="button-sign-in"
                    >
                      Sign In
                    </Button>
                  </div>

                  {/* Registration Form Preview */}
                  <div className="space-y-4">
                    <div>
                      <Label className="block text-sm font-medium text-foreground mb-2">Pack Name</Label>
                      <Input 
                        placeholder="YourPackName" 
                        className="form-input"
                        data-testid="input-pack-name"
                      />
                    </div>
                    <div>
                      <Label className="block text-sm font-medium text-foreground mb-2">Email</Label>
                      <Input 
                        type="email" 
                        placeholder="pup@example.com" 
                        className="form-input"
                        data-testid="input-email"
                      />
                    </div>
                    <div>
                      <Label className="block text-sm font-medium text-foreground mb-2">Password</Label>
                      <Input 
                        type="password" 
                        placeholder="••••••••" 
                        className="form-input"
                        data-testid="input-password"
                      />
                    </div>

                    {/* Age Verification Notice */}
                    <div className="flex items-center space-x-3 p-4 bg-warning/10 border border-warning/20 rounded-lg">
                      <Shield className="h-5 w-5 text-warning" />
                      <div className="text-sm">
                        <span className="font-medium">18+ Verification Required</span>
                        <p className="text-muted">Upload valid ID for age verification</p>
                      </div>
                    </div>

                    <Button 
                      className="w-full btn-primary py-3"
                      onClick={() => handleAuthClick('register')}
                      data-testid="button-join-pack-submit"
                    >
                      Join the Pack
                    </Button>
                  </div>

                  {/* Replit OAuth Alternative */}
                  <div className="mt-6 pt-6 border-t border-border">
                    <Button 
                      className="w-full btn-secondary py-3"
                      onClick={() => window.location.href = '/api/login'}
                      data-testid="button-replit-oauth"
                    >
                      <PawPrint className="mr-3 h-5 w-5" />
                      Continue with Replit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Preview */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="neon-heading text-4xl mb-4">Built for Pack Energy</h2>
            <p className="text-xl text-muted max-w-2xl mx-auto">Everything you need to create, connect, and earn in a safe, supportive environment</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="pack-card p-6 text-center">
              <div className="w-16 h-16 bg-primary/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              <h3 className="neon-text-primary text-xl mb-2">Content Creation</h3>
              <p className="text-muted">Upload and monetize your content with our creator-friendly tools and fair revenue sharing</p>
            </Card>

            <Card className="pack-card p-6 text-center">
              <div className="w-16 h-16 bg-secondary/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-secondary" />
              </div>
              <h3 className="neon-text-secondary text-xl mb-2">Pack Discovery</h3>
              <p className="text-muted">Find creators and communities that match your energy with our pack-based filtering system</p>
            </Card>

            <Card className="pack-card p-6 text-center">
              <div className="w-16 h-16 bg-accent/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-accent" />
              </div>
              <h3 className="neon-text-accent text-xl mb-2">Safety First</h3>
              <p className="text-muted">Comprehensive safety features including age verification, consent management, and 24/7 moderation</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Creator Success Stories */}
      <section className="py-16 bg-card/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="neon-heading text-4xl mb-4">Success in the Pack</h2>
            <p className="text-xl text-muted max-w-2xl mx-auto">Real creators achieving their goals on CougarFanz</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="pack-card p-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-xl flex items-center justify-center">
                  <PawPrint className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">AlphaWolf_Prime</h4>
                  <div className="flex items-center space-x-2">
                    <Badge className="safety-badge safety-badge-verified">Verified</Badge>
                    <Badge className="safety-badge safety-badge-aftercare">Aftercare</Badge>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="aspect-square bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg flex items-center justify-center">
                  <Eye className="h-4 w-4 text-primary" />
                </div>
                <div className="aspect-square bg-gradient-to-br from-accent/20 to-primary/20 rounded-lg flex items-center justify-center">
                  <Star className="h-4 w-4 text-accent" />
                </div>
                <div className="aspect-square bg-gradient-to-br from-secondary/20 to-accent/20 rounded-lg flex items-center justify-center">
                  <Heart className="h-4 w-4 text-secondary" />
                </div>
              </div>
              <div className="flex items-center justify-between text-sm text-muted">
                <span data-testid="text-subscribers">2.3K pack</span>
                <span data-testid="text-earnings">$4.2K earned</span>
              </div>
            </Card>

            <Card className="pack-card p-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-accent/20 to-secondary/20 rounded-xl flex items-center justify-center">
                  <PawPrint className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">PlayfulPup_99</h4>
                  <div className="flex items-center space-x-2">
                    <Badge className="safety-badge safety-badge-verified">Verified</Badge>
                    <Badge className="safety-badge safety-badge-consent">Safe</Badge>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="aspect-square bg-gradient-to-br from-accent/20 to-secondary/20 rounded-lg flex items-center justify-center">
                  <Eye className="h-4 w-4 text-accent" />
                </div>
                <div className="aspect-square bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg flex items-center justify-center">
                  <Star className="h-4 w-4 text-primary" />
                </div>
                <div className="aspect-square bg-gradient-to-br from-secondary/20 to-primary/20 rounded-lg flex items-center justify-center">
                  <Heart className="h-4 w-4 text-secondary" />
                </div>
              </div>
              <div className="flex items-center justify-between text-sm text-muted">
                <span data-testid="text-subscribers">1.8K pack</span>
                <span data-testid="text-earnings">$3.1K earned</span>
              </div>
            </Card>

            <Card className="pack-card p-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-secondary/20 to-primary/20 rounded-xl flex items-center justify-center">
                  <PawPrint className="h-6 w-6 text-secondary" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">GamerPup_Elite</h4>
                  <div className="flex items-center space-x-2">
                    <Badge className="safety-badge safety-badge-verified">Verified</Badge>
                    <Badge className="safety-badge-consent">Gaming</Badge>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="aspect-square bg-gradient-to-br from-secondary/20 to-primary/20 rounded-lg flex items-center justify-center">
                  <Eye className="h-4 w-4 text-secondary" />
                </div>
                <div className="aspect-square bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg flex items-center justify-center">
                  <Star className="h-4 w-4 text-primary" />
                </div>
                <div className="aspect-square bg-gradient-to-br from-accent/20 to-primary/20 rounded-lg flex items-center justify-center">
                  <Heart className="h-4 w-4 text-accent" />
                </div>
              </div>
              <div className="flex items-center justify-between text-sm text-muted">
                <span data-testid="text-subscribers">945 pack</span>
                <span data-testid="text-earnings">$1.9K earned</span>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* The Wittle Bear Foundation Section */}
      <section className="py-20 bg-gradient-to-br from-pink-900/20 via-background to-amber-900/20 relative overflow-hidden" aria-label="The Wittle Bear Foundation" role="region">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center gap-3 mb-6">
              <PawPrint className="h-10 w-10 text-pink-400" />
              <Heart className="h-8 w-8 text-pink-500 fill-pink-500 animate-pulse" />
              <PawPrint className="h-10 w-10 text-pink-400 transform scale-x-[-1]" />
            </div>
            <h2 className="neon-heading text-4xl md:text-5xl mb-4">
              <span className="bg-gradient-to-r from-pink-400 via-pink-500 to-amber-400 bg-clip-text text-transparent">
                The Wittle Bear Foundation
              </span>
            </h2>
            <p className="text-xl text-pink-200/80 italic mb-2">In loving memory of Wittle Bear</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <Card className="pack-card bg-pink-500/10 border-pink-500/30 backdrop-blur-sm">
              <CardContent className="pt-6 text-center">
                <div className="h-14 w-14 bg-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Heart className="h-7 w-7 text-pink-400" />
                </div>
                <h3 className="text-pink-300 text-xl font-semibold mb-3">Supporting LGBTQ+ Youth</h3>
                <p className="text-gray-300/90">
                  Founded by someone who was homeless at 14 in Alabama for being gay,
                  this foundation provides shelter, resources, and hope to homeless LGBTQ+ youth.
                </p>
              </CardContent>
            </Card>

            <Card className="pack-card bg-amber-500/10 border-amber-500/30 backdrop-blur-sm">
              <CardContent className="pt-6 text-center">
                <div className="h-14 w-14 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <PawPrint className="h-7 w-7 text-amber-400" />
                </div>
                <h3 className="text-amber-300 text-xl font-semibold mb-3">Rescuing Shelter Animals</h3>
                <p className="text-gray-300/90">
                  Named after a beloved yorkie who brought unconditional love,
                  the foundation helps animals in shelters find loving forever homes.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-amber-500/10 rounded-2xl p-8 border border-pink-500/20">
            <p className="text-lg text-gray-200 mb-4">
              <span className="font-semibold text-pink-300">30% of all ad revenue</span> from CougarFanz
              is automatically donated to The Wittle Bear Foundation.
            </p>
            <p className="text-gray-400 mb-6">
              Creators can also choose to donate a portion of their ad earnings to further support these causes.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-pink-300/80">
              <Heart className="h-4 w-4 text-pink-500 fill-pink-500" />
              <span>Because no one should ever feel alone or unwanted</span>
              <Heart className="h-4 w-4 text-pink-500 fill-pink-500" />
            </div>
          </div>
        </div>
      </section>

      <Footer />

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        mode={authMode}
        onModeChange={setAuthMode}
      />
    </div>
  );
}
