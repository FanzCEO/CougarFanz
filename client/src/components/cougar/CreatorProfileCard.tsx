import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Crown,
  Sparkles,
  Flame,
  Diamond,
  Star,
  Heart,
  Users,
  MessageCircle,
  Check,
  Shield,
} from "lucide-react";

// Types
export type ArchetypeKey = "alpha" | "maneater" | "siren" | "vixen" | "matriarch" | "seductress" | "boss" | "enchantress" | "wildcard";
export type EraKey = "30_plus" | "40_plus" | "50_plus" | "60_plus";
export type VibeKey = "elegant" | "bold" | "playful" | "glam" | "wild" | "mysterious";
export type FrameStyle = "gold_classic" | "rose_gold" | "champagne" | "bronze" | "platinum";

export interface CreatorProfile {
  id: string;
  name: string;
  handle: string;
  archetype: ArchetypeKey;
  era: EraKey;
  vibes: VibeKey[];
  followers: string;
  posts: number;
  rating: number;
  tagline: string;
  confidenceScore: number;
  isVerified?: boolean;
  frameStyle?: FrameStyle;
  subscriptionPrice?: string;
}

// Archetype styling
export const ARCHETYPES: Record<ArchetypeKey, {
  name: string;
  color: string;
  bgColor: string;
  icon: typeof Crown;
  description: string
}> = {
  alpha: {
    name: "Alpha",
    color: "text-cfz-gold",
    bgColor: "bg-cfz-gold/15 border-cfz-gold/30",
    icon: Crown,
    description: "Dominant, powerful presence",
  },
  maneater: {
    name: "Maneater",
    color: "text-red-400",
    bgColor: "bg-red-500/15 border-red-500/30",
    icon: Flame,
    description: "Confident, captivating",
  },
  siren: {
    name: "Siren",
    color: "text-purple-400",
    bgColor: "bg-purple-500/15 border-purple-500/30",
    icon: Sparkles,
    description: "Alluring, mysterious",
  },
  vixen: {
    name: "Vixen",
    color: "text-pink-400",
    bgColor: "bg-pink-500/15 border-pink-500/30",
    icon: Heart,
    description: "Playful, flirty",
  },
  matriarch: {
    name: "Matriarch",
    color: "text-slate-300",
    bgColor: "bg-slate-500/15 border-slate-500/30",
    icon: Users,
    description: "Nurturing authority",
  },
  seductress: {
    name: "Seductress",
    color: "text-cfz-rose-gold",
    bgColor: "bg-cfz-wine/20 border-cfz-wine/30",
    icon: Sparkles,
    description: "Personality-based charm",
  },
  boss: {
    name: "Boss",
    color: "text-slate-300",
    bgColor: "bg-slate-600/15 border-slate-600/30",
    icon: Diamond,
    description: "Corporate power energy",
  },
  enchantress: {
    name: "Enchantress",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/15 border-emerald-500/30",
    icon: Star,
    description: "Magical, captivating",
  },
  wildcard: {
    name: "Wildcard",
    color: "text-orange-400",
    bgColor: "bg-orange-500/15 border-orange-500/30",
    icon: Flame,
    description: "Unpredictable, fun",
  },
};

export const ERA_BADGES: Record<EraKey, { label: string; emoji: string }> = {
  "30_plus": { label: "30+ Crew", emoji: "💃" },
  "40_plus": { label: "40+ Fierce", emoji: "🔥" },
  "50_plus": { label: "50+ Fine", emoji: "👑" },
  "60_plus": { label: "60+ Timeless", emoji: "✨" },
};

export const VIBES: Record<VibeKey, { label: string; color: string }> = {
  elegant: { label: "Elegant", color: "bg-cfz-champagne/15 text-cfz-champagne border-cfz-champagne/30" },
  bold: { label: "Bold", color: "bg-red-500/15 text-red-400 border-red-500/30" },
  playful: { label: "Playful", color: "bg-pink-500/15 text-pink-400 border-pink-500/30" },
  glam: { label: "Glam", color: "bg-cfz-gold/15 text-cfz-gold border-cfz-gold/30" },
  wild: { label: "Wild", color: "bg-orange-500/15 text-orange-400 border-orange-500/30" },
  mysterious: { label: "Mysterious", color: "bg-purple-500/15 text-purple-400 border-purple-500/30" },
};

export const FRAME_STYLES: Record<FrameStyle, string> = {
  gold_classic: "border-cfz-gold shadow-gold-glow",
  rose_gold: "border-cfz-rose-gold shadow-[0_0_20px_rgba(232,180,184,0.3)]",
  champagne: "border-cfz-champagne shadow-[0_0_20px_rgba(247,231,206,0.3)]",
  bronze: "border-cfz-bronze shadow-[0_0_20px_rgba(169,113,66,0.3)]",
  platinum: "border-cfz-platinum shadow-[0_0_20px_rgba(217,217,217,0.3)]",
};

interface CreatorProfileCardProps {
  creator: CreatorProfile;
  variant?: "default" | "compact" | "featured";
  onSubscribe?: () => void;
  onMessage?: () => void;
  onTip?: () => void;
}

export function CreatorProfileCard({
  creator,
  variant = "default",
  onSubscribe,
  onMessage,
  onTip,
}: CreatorProfileCardProps) {
  const archetype = ARCHETYPES[creator.archetype];
  const era = ERA_BADGES[creator.era];
  const ArchetypeIcon = archetype.icon;
  const frameStyle = FRAME_STYLES[creator.frameStyle || "gold_classic"];

  if (variant === "compact") {
    return (
      <Card className="bg-cfz-espresso border border-cfz-border hover:border-cfz-gold/30 transition-all duration-300 hover:shadow-gold-glow group cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className={`w-14 h-14 rounded-full bg-gradient-to-br from-cfz-gold/20 to-cfz-wine/20 border-2 ${frameStyle} flex items-center justify-center flex-shrink-0`}>
              <Crown className="h-6 w-6 text-cfz-gold" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-display font-semibold text-cfz-champagne truncate">
                  {creator.name}
                </h3>
                {creator.isVerified && (
                  <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                )}
              </div>
              <p className="text-sm text-cfz-muted truncate">{creator.handle}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={`${archetype.bgColor} ${archetype.color} text-xs px-1.5 py-0 border`}>
                  {archetype.name}
                </Badge>
                <span className="text-xs text-cfz-muted">{era.emoji} {era.label}</span>
              </div>
            </div>

            {/* CTA */}
            <Button
              size="sm"
              className="bg-luxe text-cfz-satin-black hover:bg-champagne flex-shrink-0"
              onClick={onSubscribe}
            >
              Follow
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (variant === "featured") {
    return (
      <Card className="bg-cfz-espresso border border-cfz-gold/30 shadow-gold-glow overflow-hidden">
        {/* Banner */}
        <div className="h-32 bg-gradient-to-br from-cfz-gold/20 via-cfz-wine/20 to-cfz-espresso relative">
          <div className="absolute inset-0 bg-cougar-spotlight opacity-50" />
        </div>

        <CardContent className="p-6 -mt-12 relative">
          {/* Avatar */}
          <div className="relative mb-4">
            <div className={`w-24 h-24 mx-auto rounded-full bg-cfz-espresso border-4 ${frameStyle} flex items-center justify-center`}>
              <Crown className="h-10 w-10 text-cfz-gold" />
            </div>
            {creator.isVerified && (
              <div className="absolute bottom-0 right-1/2 translate-x-8 bg-emerald-500 rounded-full p-1">
                <Check className="h-3 w-3 text-white" />
              </div>
            )}
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-xl">
              {era.emoji}
            </span>
          </div>

          {/* Info */}
          <div className="text-center mb-4">
            <h3 className="font-display text-xl font-bold text-cfz-champagne mb-1">
              {creator.name}
            </h3>
            <p className="text-cfz-muted">{creator.handle}</p>
            <p className="text-sm text-cfz-champagne/70 italic mt-2">
              "{creator.tagline}"
            </p>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2 justify-center mb-4">
            <Badge className={`${archetype.bgColor} ${archetype.color} px-3 py-1 border`}>
              <ArchetypeIcon className="mr-1 h-4 w-4" />
              {archetype.name}
            </Badge>
            <Badge className="bg-cfz-gold/15 text-cfz-gold px-3 py-1 border border-cfz-gold/30">
              {era.label}
            </Badge>
          </div>

          {/* Vibes */}
          <div className="flex flex-wrap gap-1.5 justify-center mb-5">
            {creator.vibes.map((vibeKey) => {
              const vibe = VIBES[vibeKey];
              return (
                <span key={vibeKey} className={`text-xs px-2.5 py-1 rounded-full ${vibe.color} border`}>
                  {vibe.label}
                </span>
              );
            })}
          </div>

          {/* Confidence Meter */}
          <div className="mb-5">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-cfz-muted font-medium">Confidence Score</span>
              <span className="text-cfz-gold font-bold">{creator.confidenceScore}%</span>
            </div>
            <div className="w-full h-2 bg-cfz-border rounded-full overflow-hidden">
              <div
                className="h-full bg-luxe rounded-full transition-all duration-700"
                style={{ width: `${creator.confidenceScore}%` }}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 py-4 border-y border-cfz-border mb-5">
            <div className="text-center">
              <div className="text-lg font-bold text-cfz-champagne">{creator.followers}</div>
              <div className="text-xs text-cfz-muted">Admirers</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-cfz-champagne">{creator.posts}</div>
              <div className="text-xs text-cfz-muted">Posts</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-cfz-gold flex items-center justify-center gap-1">
                <Star className="h-4 w-4" />
                {creator.rating}
              </div>
              <div className="text-xs text-cfz-muted">Rating</div>
            </div>
          </div>

          {/* CTAs */}
          <div className="space-y-3">
            <Button
              className="w-full bg-luxe text-cfz-satin-black hover:bg-champagne shadow-gold-glow font-semibold py-5"
              onClick={onSubscribe}
            >
              <Crown className="mr-2 h-5 w-5" />
              Subscribe {creator.subscriptionPrice && `• ${creator.subscriptionPrice}/mo`}
            </Button>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="border-cfz-gold text-cfz-gold hover:bg-cfz-gold/10"
                onClick={onTip}
              >
                <Diamond className="mr-2 h-4 w-4" />
                Tip
              </Button>
              <Button
                variant="outline"
                className="border-cfz-wine text-cfz-rose-gold hover:bg-cfz-wine/10"
                onClick={onMessage}
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Message
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default variant
  return (
    <Card className="bg-cfz-espresso border border-cfz-border hover:border-cfz-gold/30 transition-all duration-300 hover:shadow-gold-glow group cursor-pointer">
      <CardContent className="p-6">
        {/* Avatar */}
        <div className="relative mb-4">
          <div className={`w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-cfz-gold/20 to-cfz-wine/20 border-3 ${frameStyle} flex items-center justify-center group-hover:shadow-gold-medium transition-shadow`}>
            <Crown className="h-8 w-8 text-cfz-gold" />
          </div>
          {creator.isVerified && (
            <div className="absolute bottom-0 right-1/2 translate-x-6 bg-emerald-500 rounded-full p-0.5">
              <Check className="h-3 w-3 text-white" />
            </div>
          )}
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-lg">
            {era.emoji}
          </span>
        </div>

        {/* Info */}
        <div className="text-center mb-3">
          <h3 className="font-display text-lg font-semibold text-cfz-champagne">
            {creator.name}
          </h3>
          <p className="text-sm text-cfz-muted">{creator.handle}</p>
        </div>

        {/* Tagline */}
        <p className="text-sm text-cfz-muted text-center mb-4 line-clamp-2 italic">
          "{creator.tagline}"
        </p>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5 justify-center mb-4">
          <Badge className={`${archetype.bgColor} ${archetype.color} text-xs px-2 py-0.5 border`}>
            <ArchetypeIcon className="mr-1 h-3 w-3" />
            {archetype.name}
          </Badge>
          <Badge className="bg-cfz-gold/15 text-cfz-gold text-xs px-2 py-0.5 border border-cfz-gold/30">
            {era.label}
          </Badge>
        </div>

        {/* Vibes */}
        <div className="flex flex-wrap gap-1 justify-center mb-4">
          {creator.vibes.slice(0, 3).map((vibeKey) => {
            const vibe = VIBES[vibeKey];
            return (
              <span key={vibeKey} className={`text-xs px-2 py-0.5 rounded-full ${vibe.color} border`}>
                {vibe.label}
              </span>
            );
          })}
        </div>

        {/* Confidence Meter */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-cfz-muted">Confidence</span>
            <span className="text-cfz-gold font-semibold">{creator.confidenceScore}%</span>
          </div>
          <div className="w-full h-1.5 bg-cfz-border rounded-full overflow-hidden">
            <div
              className="h-full bg-luxe rounded-full transition-all duration-500"
              style={{ width: `${creator.confidenceScore}%` }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="flex justify-between text-xs text-cfz-muted pt-3 border-t border-cfz-border">
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {creator.followers}
          </span>
          <span className="flex items-center gap-1">
            <Star className="h-3 w-3 text-cfz-gold" />
            {creator.rating}
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle className="h-3 w-3" />
            {creator.posts}
          </span>
        </div>

        {/* CTA */}
        <Button
          className="w-full mt-4 bg-luxe text-cfz-satin-black hover:bg-champagne transition-all"
          size="sm"
          onClick={onSubscribe}
        >
          View Profile
        </Button>
      </CardContent>
    </Card>
  );
}

export default CreatorProfileCard;
