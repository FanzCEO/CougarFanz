import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AuthModal from "@/components/auth/AuthModal";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import {
  Crown,
  Sparkles,
  Shield,
  Heart,
  Users,
  Diamond,
  Star,
  Flame,
  Wine,
  ArrowRight,
  CheckCircle,
  TrendingUp,
  MessageCircle,
} from "lucide-react";

// Archetype definitions for featured creators
const ARCHETYPES = {
  alpha: { name: "Alpha", color: "bg-cfz-gold text-cfz-satin-black", icon: Crown },
  siren: { name: "Siren", color: "bg-purple-600 text-white", icon: Sparkles },
  vixen: { name: "Vixen", color: "bg-pink-500 text-white", icon: Flame },
  boss: { name: "Boss", color: "bg-slate-500 text-white", icon: Diamond },
  enchantress: { name: "Enchantress", color: "bg-emerald-600 text-white", icon: Star },
};

const ERA_BADGES = {
  "30_plus": { label: "30+ Crew", emoji: "💃" },
  "40_plus": { label: "40+ Fierce", emoji: "🔥" },
  "50_plus": { label: "50+ Fine", emoji: "👑" },
  "60_plus": { label: "60+ Timeless", emoji: "✨" },
};

// Mock featured creators data
const featuredCreators = [
  {
    name: "Queen Victoria",
    handle: "@queenvictoria",
    archetype: "alpha" as const,
    era: "40_plus" as const,
    followers: "12.4K",
    earnings: "$8.2K",
  },
  {
    name: "Velvet Siren",
    handle: "@velvetsiren",
    archetype: "siren" as const,
    era: "30_plus" as const,
    followers: "8.7K",
    earnings: "$5.4K",
  },
  {
    name: "Scarlet Vixen",
    handle: "@scarletvixen",
    archetype: "vixen" as const,
    era: "50_plus" as const,
    followers: "15.2K",
    earnings: "$11.8K",
  },
  {
    name: "Diamond Boss",
    handle: "@diamondboss",
    archetype: "boss" as const,
    era: "40_plus" as const,
    followers: "9.3K",
    earnings: "$7.1K",
  },
];

export default function CougarLanding() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("register");

  const handleAuthClick = (mode: "login" | "register") => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  return (
    <div className="min-h-screen bg-cfz-satin-black">
      <Header onAuthClick={handleAuthClick} />

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 overflow-hidden">
        {/* Background gradient effect */}
        <div className="absolute inset-0 bg-cougar-hero" />
        <div className="absolute inset-0 bg-cougar-spotlight opacity-50" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Hero Text */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cfz-espresso border border-cfz-gold/30 mb-6">
                <Crown className="h-4 w-4 text-cfz-gold" />
                <span className="text-cfz-gold text-sm font-medium">
                  Premium Mature Creator Platform
                </span>
              </div>

              <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-cfz-champagne leading-tight mb-6">
                Where Experience
                <span className="block text-cfz-gold mt-2" style={{ textShadow: "0 0 30px rgba(212, 175, 55, 0.4)" }}>
                  Reigns Supreme
                </span>
              </h1>

              <p className="text-xl text-cfz-champagne/80 mb-8 max-w-xl font-light leading-relaxed">
                The glamorous, confident, mature-energy platform for empowered
                creators and the admirers who appreciate authenticity,
                experience, and charisma.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <Button
                  className="px-8 py-6 text-lg font-semibold bg-luxe text-cfz-satin-black hover:bg-champagne shadow-gold-strong transition-all duration-300 hover:-translate-y-1"
                  onClick={() => handleAuthClick("register")}
                >
                  <Crown className="mr-2 h-5 w-5" />
                  Become a Queen
                </Button>
                <Button
                  variant="outline"
                  className="px-8 py-6 text-lg font-semibold border-2 border-cfz-gold text-cfz-gold hover:bg-cfz-gold/10 transition-all duration-300"
                  onClick={() => handleAuthClick("login")}
                >
                  Enter the Den
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>

              {/* Trust Badges */}
              <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                <Badge className="px-4 py-2 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <Shield className="mr-2 h-4 w-4" />
                  18+ Verified
                </Badge>
                <Badge className="px-4 py-2 bg-cfz-gold/15 text-cfz-gold border border-cfz-gold/30">
                  <Heart className="mr-2 h-4 w-4" />
                  Safe Space
                </Badge>
                <Badge className="px-4 py-2 bg-cfz-wine/20 text-cfz-rose-gold border border-cfz-wine/30">
                  <Diamond className="mr-2 h-4 w-4" />
                  VIP Energy
                </Badge>
              </div>
            </div>

            {/* Auth Card */}
            <div className="lg:max-w-md mx-auto w-full">
              <Card className="bg-cfz-espresso border border-cfz-border shadow-gold-glow">
                <CardContent className="p-8">
                  <div className="flex space-x-1 mb-8 bg-cfz-satin-black rounded-lg p-1">
                    <Button
                      className="flex-1 py-3 px-4 text-sm font-semibold bg-luxe text-cfz-satin-black rounded-md"
                      onClick={() => handleAuthClick("register")}
                    >
                      Join CougarFanz
                    </Button>
                    <Button
                      variant="ghost"
                      className="flex-1 py-3 px-4 text-sm font-medium text-cfz-muted rounded-md hover:bg-cfz-espresso-light hover:text-cfz-champagne"
                      onClick={() => handleAuthClick("login")}
                    >
                      Sign In
                    </Button>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <Label className="block text-sm font-medium text-cfz-champagne mb-2">
                        Display Name
                      </Label>
                      <Input
                        placeholder="Your glamorous name"
                        className="bg-cfz-satin-black border-cfz-border text-cfz-champagne placeholder:text-cfz-muted focus:border-cfz-gold focus:ring-cfz-gold/20"
                      />
                    </div>
                    <div>
                      <Label className="block text-sm font-medium text-cfz-champagne mb-2">
                        Email
                      </Label>
                      <Input
                        type="email"
                        placeholder="queen@example.com"
                        className="bg-cfz-satin-black border-cfz-border text-cfz-champagne placeholder:text-cfz-muted focus:border-cfz-gold focus:ring-cfz-gold/20"
                      />
                    </div>
                    <div>
                      <Label className="block text-sm font-medium text-cfz-champagne mb-2">
                        Password
                      </Label>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        className="bg-cfz-satin-black border-cfz-border text-cfz-champagne placeholder:text-cfz-muted focus:border-cfz-gold focus:ring-cfz-gold/20"
                      />
                    </div>

                    {/* Age Verification Notice */}
                    <div className="flex items-center gap-3 p-4 bg-cfz-gold/10 border border-cfz-gold/20 rounded-lg">
                      <Shield className="h-5 w-5 text-cfz-gold flex-shrink-0" />
                      <div className="text-sm">
                        <span className="font-semibold text-cfz-gold">
                          Age Verification Required
                        </span>
                        <p className="text-cfz-muted">
                          Valid ID required for 18+ verification
                        </p>
                      </div>
                    </div>

                    <Button
                      className="w-full py-4 font-semibold bg-luxe text-cfz-satin-black hover:bg-champagne shadow-gold-glow transition-all duration-300"
                      onClick={() => handleAuthClick("register")}
                    >
                      <Crown className="mr-2 h-5 w-5" />
                      Start Your Reign
                    </Button>
                  </div>

                  <div className="mt-6 pt-6 border-t border-cfz-border">
                    <Button
                      variant="outline"
                      className="w-full py-3 border-cfz-wine text-cfz-rose-gold hover:bg-cfz-wine/10"
                      onClick={() => (window.location.href = "/api/login")}
                    >
                      <Wine className="mr-3 h-5 w-5" />
                      Continue with OAuth
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Cougars */}
      <section className="py-20 bg-cfz-charcoal">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="font-display text-4xl font-bold text-cfz-champagne mb-4">
              Featured <span className="text-cfz-gold">Queens</span>
            </h2>
            <p className="text-xl text-cfz-muted max-w-2xl mx-auto">
              Discover confident creators celebrating experience and elegance
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredCreators.map((creator) => {
              const archetype = ARCHETYPES[creator.archetype];
              const era = ERA_BADGES[creator.era];
              const ArchetypeIcon = archetype.icon;

              return (
                <Card
                  key={creator.handle}
                  className="bg-cfz-espresso border border-cfz-border hover:border-cfz-gold/30 transition-all duration-300 hover:shadow-gold-glow group cursor-pointer"
                >
                  <CardContent className="p-6">
                    {/* Avatar placeholder */}
                    <div className="relative mb-4">
                      <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-cfz-gold/20 to-cfz-wine/20 border-3 border-cfz-gold flex items-center justify-center shadow-gold-glow group-hover:shadow-gold-medium transition-shadow">
                        <Crown className="h-8 w-8 text-cfz-gold" />
                      </div>
                      {/* Era badge */}
                      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-lg">
                        {era.emoji}
                      </span>
                    </div>

                    {/* Creator info */}
                    <div className="text-center mb-4">
                      <h3 className="font-display text-lg font-semibold text-cfz-champagne">
                        {creator.name}
                      </h3>
                      <p className="text-sm text-cfz-muted">{creator.handle}</p>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-2 justify-center mb-4">
                      <Badge
                        className={`${archetype.color} text-xs px-2 py-1`}
                      >
                        <ArchetypeIcon className="mr-1 h-3 w-3" />
                        {archetype.name}
                      </Badge>
                      <Badge className="bg-cfz-gold/15 text-cfz-gold text-xs px-2 py-1 border border-cfz-gold/30">
                        {era.label}
                      </Badge>
                    </div>

                    {/* Stats */}
                    <div className="flex justify-between text-sm text-cfz-muted pt-4 border-t border-cfz-border">
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {creator.followers}
                      </span>
                      <span className="flex items-center gap-1 text-cfz-gold">
                        <Diamond className="h-4 w-4" />
                        {creator.earnings}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Value Propositions */}
      <section className="py-20 bg-cfz-satin-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="font-display text-4xl font-bold text-cfz-champagne mb-4">
              Built for <span className="text-cfz-gold">Confidence</span>
            </h2>
            <p className="text-xl text-cfz-muted max-w-2xl mx-auto">
              Everything you need to create, connect, and earn with elegance
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <Card className="bg-cfz-espresso border border-cfz-border p-8 text-center hover:border-cfz-gold/30 transition-all duration-300">
              <div className="w-16 h-16 bg-cfz-gold/15 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Sparkles className="h-8 w-8 text-cfz-gold" />
              </div>
              <h3 className="font-display text-xl font-semibold text-cfz-gold mb-3">
                Glam Content Studio
              </h3>
              <p className="text-cfz-muted leading-relaxed">
                Premium tools designed for mature creators. AI-powered captions,
                luxury branding templates, and elegant presentation.
              </p>
            </Card>

            {/* Feature 2 */}
            <Card className="bg-cfz-espresso border border-cfz-border p-8 text-center hover:border-cfz-gold/30 transition-all duration-300">
              <div className="w-16 h-16 bg-cfz-wine/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Users className="h-8 w-8 text-cfz-rose-gold" />
              </div>
              <h3 className="font-display text-xl font-semibold text-cfz-rose-gold mb-3">
                Archetype Discovery
              </h3>
              <p className="text-cfz-muted leading-relaxed">
                Find creators by personality—Alpha, Siren, Vixen, Boss. Our
                unique archetype system celebrates individual brands.
              </p>
            </Card>

            {/* Feature 3 */}
            <Card className="bg-cfz-espresso border border-cfz-border p-8 text-center hover:border-cfz-gold/30 transition-all duration-300">
              <div className="w-16 h-16 bg-emerald-500/15 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Shield className="h-8 w-8 text-emerald-400" />
              </div>
              <h3 className="font-display text-xl font-semibold text-emerald-400 mb-3">
                Age-Positive Safety
              </h3>
              <p className="text-cfz-muted leading-relaxed">
                Enhanced protections against age-based harassment. Verified
                badges, boundary settings, and respectful community.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Archetypes Section */}
      <section className="py-20 bg-cfz-charcoal">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="font-display text-4xl font-bold text-cfz-champagne mb-4">
              Find Your <span className="text-cfz-gold">Archetype</span>
            </h2>
            <p className="text-xl text-cfz-muted max-w-2xl mx-auto">
              Every queen has her unique energy. Discover yours.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {Object.entries(ARCHETYPES).map(([key, archetype]) => {
              const Icon = archetype.icon;
              return (
                <div
                  key={key}
                  className="p-6 rounded-xl bg-cfz-espresso border border-cfz-border hover:border-cfz-gold/30 transition-all duration-300 text-center cursor-pointer hover:shadow-gold-glow"
                >
                  <div className={`w-12 h-12 rounded-full ${archetype.color} flex items-center justify-center mx-auto mb-3`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h4 className="font-display font-semibold text-cfz-champagne">
                    The {archetype.name}
                  </h4>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-cfz-satin-black border-y border-cfz-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-display font-bold text-cfz-gold mb-2">
                50K+
              </div>
              <div className="text-cfz-muted">Active Creators</div>
            </div>
            <div>
              <div className="text-4xl font-display font-bold text-cfz-gold mb-2">
                $2M+
              </div>
              <div className="text-cfz-muted">Creator Earnings</div>
            </div>
            <div>
              <div className="text-4xl font-display font-bold text-cfz-gold mb-2">
                80%
              </div>
              <div className="text-cfz-muted">Revenue Share</div>
            </div>
            <div>
              <div className="text-4xl font-display font-bold text-cfz-gold mb-2">
                24/7
              </div>
              <div className="text-cfz-muted">Safety Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-cfz-espresso">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Crown className="h-16 w-16 text-cfz-gold mx-auto mb-6" />
          <h2 className="font-display text-4xl font-bold text-cfz-champagne mb-4">
            Ready to Reign?
          </h2>
          <p className="text-xl text-cfz-muted mb-8 max-w-2xl mx-auto">
            Join thousands of confident creators who've found their throne on
            CougarFanz. Your experience is your power.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              className="px-10 py-6 text-lg font-semibold bg-luxe text-cfz-satin-black hover:bg-champagne shadow-gold-strong transition-all duration-300 hover:-translate-y-1"
              onClick={() => handleAuthClick("register")}
            >
              <Crown className="mr-2 h-5 w-5" />
              Start Creating Today
            </Button>
            <Button
              variant="outline"
              className="px-10 py-6 text-lg font-semibold border-2 border-cfz-gold text-cfz-gold hover:bg-cfz-gold/10"
            >
              Learn More
            </Button>
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
