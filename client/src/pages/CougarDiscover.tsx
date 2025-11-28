import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import {
  Crown,
  Sparkles,
  Flame,
  Diamond,
  Star,
  Heart,
  Users,
  Search,
  Filter,
  SlidersHorizontal,
  Grid3X3,
  LayoutGrid,
  MessageCircle,
  TrendingUp,
  Zap,
} from "lucide-react";

// Type definitions
type ArchetypeKey = "alpha" | "maneater" | "siren" | "vixen" | "matriarch" | "seductress" | "boss" | "enchantress" | "wildcard";
type EraKey = "30_plus" | "40_plus" | "50_plus" | "60_plus";
type VibeKey = "elegant" | "bold" | "playful" | "glam" | "wild" | "mysterious";

// Archetype definitions
const ARCHETYPES: Record<ArchetypeKey, { name: string; color: string; bgColor: string; icon: typeof Crown; description: string }> = {
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
    icon: Zap,
    description: "Unpredictable, fun",
  },
};

const ERA_BADGES: Record<EraKey, { label: string; emoji: string }> = {
  "30_plus": { label: "30+ Crew", emoji: "💃" },
  "40_plus": { label: "40+ Fierce", emoji: "🔥" },
  "50_plus": { label: "50+ Fine", emoji: "👑" },
  "60_plus": { label: "60+ Timeless", emoji: "✨" },
};

const VIBES: Record<VibeKey, { label: string; color: string }> = {
  elegant: { label: "Elegant", color: "bg-cfz-champagne/15 text-cfz-champagne border-cfz-champagne/30" },
  bold: { label: "Bold", color: "bg-red-500/15 text-red-400 border-red-500/30" },
  playful: { label: "Playful", color: "bg-pink-500/15 text-pink-400 border-pink-500/30" },
  glam: { label: "Glam", color: "bg-cfz-gold/15 text-cfz-gold border-cfz-gold/30" },
  wild: { label: "Wild", color: "bg-orange-500/15 text-orange-400 border-orange-500/30" },
  mysterious: { label: "Mysterious", color: "bg-purple-500/15 text-purple-400 border-purple-500/30" },
};

// Mock creators data
const mockCreators = [
  {
    id: "1",
    name: "Queen Victoria",
    handle: "@queenvictoria",
    archetype: "alpha" as ArchetypeKey,
    era: "40_plus" as EraKey,
    vibes: ["elegant", "glam"] as VibeKey[],
    followers: "12.4K",
    posts: 847,
    rating: 4.9,
    tagline: "Where confidence meets charisma",
    confidenceScore: 92,
  },
  {
    id: "2",
    name: "Velvet Siren",
    handle: "@velvetsiren",
    archetype: "siren" as ArchetypeKey,
    era: "30_plus" as EraKey,
    vibes: ["mysterious", "elegant"] as VibeKey[],
    followers: "8.7K",
    posts: 523,
    rating: 4.8,
    tagline: "Lost in the melody of desire",
    confidenceScore: 87,
  },
  {
    id: "3",
    name: "Scarlet Vixen",
    handle: "@scarletvixen",
    archetype: "vixen" as ArchetypeKey,
    era: "50_plus" as EraKey,
    vibes: ["playful", "bold"] as VibeKey[],
    followers: "15.2K",
    posts: 1124,
    rating: 4.95,
    tagline: "Life's too short for boring",
    confidenceScore: 95,
  },
  {
    id: "4",
    name: "Diamond Boss",
    handle: "@diamondboss",
    archetype: "boss" as ArchetypeKey,
    era: "40_plus" as EraKey,
    vibes: ["bold", "glam"] as VibeKey[],
    followers: "9.3K",
    posts: 612,
    rating: 4.7,
    tagline: "Running the show, setting the tone",
    confidenceScore: 88,
  },
  {
    id: "5",
    name: "Midnight Enchantress",
    handle: "@midnightenchant",
    archetype: "enchantress" as ArchetypeKey,
    era: "50_plus" as EraKey,
    vibes: ["mysterious", "elegant"] as VibeKey[],
    followers: "11.1K",
    posts: 734,
    rating: 4.85,
    tagline: "Magic happens after midnight",
    confidenceScore: 91,
  },
  {
    id: "6",
    name: "Fierce Matriarch",
    handle: "@fiercematriarch",
    archetype: "matriarch" as ArchetypeKey,
    era: "60_plus" as EraKey,
    vibes: ["elegant", "bold"] as VibeKey[],
    followers: "7.8K",
    posts: 445,
    rating: 4.9,
    tagline: "Experience is the ultimate luxury",
    confidenceScore: 94,
  },
  {
    id: "7",
    name: "Ruby Maneater",
    handle: "@rubymaneater",
    archetype: "maneater" as ArchetypeKey,
    era: "40_plus" as EraKey,
    vibes: ["wild", "bold"] as VibeKey[],
    followers: "13.5K",
    posts: 892,
    rating: 4.75,
    tagline: "Catch me if you can",
    confidenceScore: 89,
  },
  {
    id: "8",
    name: "Champagne Dreams",
    handle: "@champagnedreams",
    archetype: "seductress" as ArchetypeKey,
    era: "30_plus" as EraKey,
    vibes: ["glam", "playful"] as VibeKey[],
    followers: "10.2K",
    posts: 678,
    rating: 4.8,
    tagline: "Life is better with bubbles",
    confidenceScore: 86,
  },
];

export default function CougarDiscover() {
  const [selectedArchetype, setSelectedArchetype] = useState<ArchetypeKey | "all">("all");
  const [selectedEra, setSelectedEra] = useState<EraKey | "all">("all");
  const [selectedVibes, setSelectedVibes] = useState<VibeKey[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("trending");
  const [viewMode, setViewMode] = useState<"grid" | "compact">("grid");

  // Filter creators
  const filteredCreators = mockCreators.filter((creator) => {
    if (selectedArchetype !== "all" && creator.archetype !== selectedArchetype) return false;
    if (selectedEra !== "all" && creator.era !== selectedEra) return false;
    if (selectedVibes.length > 0 && !selectedVibes.some((v) => creator.vibes.includes(v))) return false;
    if (searchQuery && !creator.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !creator.handle.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const toggleVibe = (vibe: VibeKey) => {
    setSelectedVibes((prev) =>
      prev.includes(vibe) ? prev.filter((v) => v !== vibe) : [...prev, vibe]
    );
  };

  return (
    <div className="min-h-screen bg-cfz-satin-black">
      <Header onAuthClick={() => {}} />

      {/* Page Header */}
      <section className="pt-32 pb-8 bg-cfz-satin-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="font-display text-4xl md:text-5xl font-bold text-cfz-champagne mb-4">
              Discover <span className="text-cfz-gold">Queens</span>
            </h1>
            <p className="text-xl text-cfz-muted max-w-2xl mx-auto">
              Find creators by archetype, vibe, and era. Your perfect match awaits.
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-cfz-muted" />
              <Input
                placeholder="Search creators..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 py-6 bg-cfz-espresso border-cfz-border text-cfz-champagne placeholder:text-cfz-muted focus:border-cfz-gold focus:ring-cfz-gold/20 text-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Filters Section */}
      <section className="py-6 bg-cfz-charcoal border-y border-cfz-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Archetype Filter */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Crown className="h-4 w-4 text-cfz-gold" />
              <span className="text-sm font-medium text-cfz-champagne">Archetypes</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedArchetype("all")}
                className={`${
                  selectedArchetype === "all"
                    ? "bg-cfz-gold/15 border-cfz-gold text-cfz-gold"
                    : "bg-transparent border-cfz-border text-cfz-muted hover:border-cfz-gold/50 hover:text-cfz-champagne"
                }`}
              >
                All
              </Button>
              {(Object.entries(ARCHETYPES) as [ArchetypeKey, typeof ARCHETYPES[ArchetypeKey]][]).map(([key, archetype]) => {
                const Icon = archetype.icon;
                return (
                  <Button
                    key={key}
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedArchetype(key)}
                    className={`${
                      selectedArchetype === key
                        ? `${archetype.bgColor} ${archetype.color} border`
                        : "bg-transparent border-cfz-border text-cfz-muted hover:border-cfz-gold/50 hover:text-cfz-champagne"
                    }`}
                  >
                    <Icon className="mr-1 h-3 w-3" />
                    {archetype.name}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Vibes Filter */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-cfz-gold" />
              <span className="text-sm font-medium text-cfz-champagne">Vibes</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {(Object.entries(VIBES) as [VibeKey, typeof VIBES[VibeKey]][]).map(([key, vibe]) => (
                <Button
                  key={key}
                  variant="outline"
                  size="sm"
                  onClick={() => toggleVibe(key)}
                  className={`${
                    selectedVibes.includes(key)
                      ? vibe.color + " border"
                      : "bg-transparent border-cfz-border text-cfz-muted hover:border-cfz-gold/50 hover:text-cfz-champagne"
                  }`}
                >
                  {vibe.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Era & Sort Row */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Era Filter */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-cfz-muted">Era:</span>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedEra("all")}
                    className={`${
                      selectedEra === "all"
                        ? "bg-cfz-gold/15 border-cfz-gold text-cfz-gold"
                        : "bg-transparent border-cfz-border text-cfz-muted"
                    }`}
                  >
                    All
                  </Button>
                  {(Object.entries(ERA_BADGES) as [EraKey, typeof ERA_BADGES[EraKey]][]).map(([key, era]) => (
                    <Button
                      key={key}
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedEra(key)}
                      className={`${
                        selectedEra === key
                          ? "bg-cfz-gold/15 border-cfz-gold text-cfz-gold"
                          : "bg-transparent border-cfz-border text-cfz-muted"
                      }`}
                    >
                      {era.emoji} {era.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Sort */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40 bg-cfz-espresso border-cfz-border text-cfz-champagne">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="bg-cfz-espresso border-cfz-border">
                  <SelectItem value="trending" className="text-cfz-champagne">
                    <span className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" /> Trending
                    </span>
                  </SelectItem>
                  <SelectItem value="newest" className="text-cfz-champagne">Newest</SelectItem>
                  <SelectItem value="popular" className="text-cfz-champagne">Most Popular</SelectItem>
                  <SelectItem value="rating" className="text-cfz-champagne">Top Rated</SelectItem>
                </SelectContent>
              </Select>

              {/* View Toggle */}
              <div className="flex rounded-lg overflow-hidden border border-cfz-border">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className={viewMode === "grid" ? "bg-cfz-gold/15 text-cfz-gold" : "text-cfz-muted"}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode("compact")}
                  className={viewMode === "compact" ? "bg-cfz-gold/15 text-cfz-gold" : "text-cfz-muted"}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="py-10 bg-cfz-satin-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Results Count */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-cfz-muted">
              Showing <span className="text-cfz-champagne font-medium">{filteredCreators.length}</span> creators
            </p>
          </div>

          {/* Creator Grid */}
          <div className={`grid gap-6 ${viewMode === "grid" ? "md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"}`}>
            {filteredCreators.map((creator) => {
              const archetype = ARCHETYPES[creator.archetype];
              const era = ERA_BADGES[creator.era];
              const ArchetypeIcon = archetype.icon;

              return (
                <Card
                  key={creator.id}
                  className="bg-cfz-espresso border border-cfz-border hover:border-cfz-gold/30 transition-all duration-300 hover:shadow-gold-glow group cursor-pointer overflow-hidden"
                >
                  <CardContent className={viewMode === "grid" ? "p-6" : "p-4"}>
                    {/* Avatar & Frame */}
                    <div className="relative mb-4">
                      <div className={`${viewMode === "grid" ? "w-24 h-24" : "w-16 h-16"} mx-auto rounded-full bg-gradient-to-br from-cfz-gold/20 to-cfz-wine/20 border-3 border-cfz-gold flex items-center justify-center shadow-gold-glow group-hover:shadow-gold-medium transition-shadow`}>
                        <Crown className={`${viewMode === "grid" ? "h-10 w-10" : "h-6 w-6"} text-cfz-gold`} />
                      </div>
                      {/* Era badge */}
                      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-lg">
                        {era.emoji}
                      </span>
                    </div>

                    {/* Creator Info */}
                    <div className="text-center mb-3">
                      <h3 className={`font-display ${viewMode === "grid" ? "text-lg" : "text-base"} font-semibold text-cfz-champagne truncate`}>
                        {creator.name}
                      </h3>
                      <p className="text-sm text-cfz-muted truncate">{creator.handle}</p>
                    </div>

                    {/* Tagline (grid only) */}
                    {viewMode === "grid" && (
                      <p className="text-sm text-cfz-muted text-center mb-4 line-clamp-2 italic">
                        "{creator.tagline}"
                      </p>
                    )}

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

                    {/* Vibes (grid only) */}
                    {viewMode === "grid" && (
                      <div className="flex flex-wrap gap-1 justify-center mb-4">
                        {creator.vibes.map((vibeKey) => {
                          const vibe = VIBES[vibeKey];
                          return (
                            <span key={vibeKey} className={`text-xs px-2 py-0.5 rounded-full ${vibe.color} border`}>
                              {vibe.label}
                            </span>
                          );
                        })}
                      </div>
                    )}

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

                    {/* CTA (grid only) */}
                    {viewMode === "grid" && (
                      <Button
                        className="w-full mt-4 bg-luxe text-cfz-satin-black hover:bg-champagne transition-all"
                        size="sm"
                      >
                        View Profile
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Empty State */}
          {filteredCreators.length === 0 && (
            <div className="text-center py-20">
              <Crown className="h-16 w-16 text-cfz-muted mx-auto mb-4" />
              <h3 className="text-xl font-display text-cfz-champagne mb-2">No creators found</h3>
              <p className="text-cfz-muted">Try adjusting your filters to discover more queens</p>
            </div>
          )}

          {/* Load More */}
          {filteredCreators.length > 0 && (
            <div className="text-center mt-10">
              <Button
                variant="outline"
                className="px-8 py-3 border-cfz-gold text-cfz-gold hover:bg-cfz-gold/10"
              >
                Load More Creators
              </Button>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
