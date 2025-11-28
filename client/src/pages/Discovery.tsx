import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CreatorCard from "@/components/discovery/CreatorCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Filter, Users, Star, Heart, Gamepad2, Dumbbell, Sparkles } from "lucide-react";

export default function Discovery() {
  const [searchQuery, setSearchQuery] = useState("");
  const [packType, setPackType] = useState("all");
  const [safetyFilter, setSafetyFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const { data: creators, isLoading } = useQuery({
    queryKey: ['/api/discover/creators', { q: searchQuery, packType, safetyFilter, sortBy }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      if (packType !== 'all') params.append('packType', packType);
      if (safetyFilter === 'aftercare') params.append('aftercareFriendly', 'true');
      
      const response = await fetch(`/api/discover/creators?${params.toString()}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch creators');
      return response.json();
    }
  });

  const quickFilters = [
    { id: 'active', label: '🐕 Active Today', icon: Sparkles },
    { id: 'fitness', label: '💪 Fitness Focus', icon: Dumbbell },
    { id: 'gaming', label: '🎮 Gaming Pups', icon: Gamepad2 },
    { id: 'aftercare', label: '❤️ Aftercare-Friendly', icon: Heart },
  ];

  const handleQuickFilter = (filterId: string) => {
    if (filterId === 'aftercare') {
      setSafetyFilter(safetyFilter === 'aftercare' ? 'all' : 'aftercare');
    }
    // Add more quick filter logic as needed
  };

  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="pt-40 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="neon-heading text-4xl mb-4">
              Discover Your
              <span className="neon-text-accent ml-2">Pack</span>
            </h1>
            <p className="text-xl text-muted max-w-2xl mx-auto">
              Find creators and communities that match your energy and interests with our pack-based discovery system
            </p>
          </div>

          {/* Discovery Filters */}
          <Card className="pack-card mb-8">
            <CardContent className="p-6">
              <div className="grid md:grid-cols-4 gap-6">
                {/* Search */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-2">Search Packs</label>
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Search creators, interests, or content..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="form-input pl-10"
                      data-testid="input-search"
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted" />
                  </div>
                </div>

                {/* Pack Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Pack Type</label>
                  <Select value={packType} onValueChange={setPackType}>
                    <SelectTrigger className="form-select" data-testid="select-pack-type">
                      <SelectValue placeholder="All Packs" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Packs</SelectItem>
                      <SelectItem value="alpha">Alpha Leaders</SelectItem>
                      <SelectItem value="playful">Playful Pups</SelectItem>
                      <SelectItem value="supportive">Supportive Pack</SelectItem>
                      <SelectItem value="training">Training Focus</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Safety Filter */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Safety Features</label>
                  <Select value={safetyFilter} onValueChange={setSafetyFilter}>
                    <SelectTrigger className="form-select" data-testid="select-safety">
                      <SelectValue placeholder="All Creators" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Creators</SelectItem>
                      <SelectItem value="verified">Verified Only</SelectItem>
                      <SelectItem value="aftercare">Aftercare-Friendly</SelectItem>
                      <SelectItem value="consent">Consent-Clear</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Advanced Filters */}
              <div className="mt-6 pt-6 border-t border-border">
                <div className="flex flex-wrap gap-3">
                  <span className="text-sm font-medium text-muted mb-2">Quick Filters:</span>
                  {quickFilters.map((filter) => (
                    <Button
                      key={filter.id}
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickFilter(filter.id)}
                      className={`
                        ${filter.id === 'active' ? 'border-primary/50 text-primary hover:bg-primary/10' : ''}
                        ${filter.id === 'fitness' ? 'border-secondary/50 text-secondary hover:bg-secondary/10' : ''}
                        ${filter.id === 'gaming' ? 'border-accent/50 text-accent hover:bg-accent/10' : ''}
                        ${filter.id === 'aftercare' && safetyFilter === 'aftercare' ? 'bg-success/20 border-success text-success' : filter.id === 'aftercare' ? 'border-success/50 text-success hover:bg-success/10' : ''}
                      `}
                      data-testid={`button-filter-${filter.id}`}
                    >
                      <filter.icon className="h-4 w-4 mr-2" />
                      {filter.label}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <div className="mb-6 flex items-center justify-between">
            <p className="text-muted" data-testid="text-results-count">
              {isLoading ? 'Loading...' : `${creators?.length || 0} creators found`}
            </p>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48" data-testid="select-sort">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="active">Recently Active</SelectItem>
                <SelectItem value="subscribers">Most Subscribers</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Creator Grid */}
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 9 }).map((_, i) => (
                <Skeleton key={i} className="h-80" />
              ))}
            </div>
          ) : creators?.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {creators.map((creator: any) => (
                <CreatorCard key={creator.id} creator={creator} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Users className="h-16 w-16 text-muted mx-auto mb-4" />
              <h3 className="font-semibold text-xl mb-2">No Creators Found</h3>
              <p className="text-muted mb-6">
                {searchQuery 
                  ? `No creators match your search for "${searchQuery}"`
                  : "No creators match your current filters"
                }
              </p>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchQuery("");
                  setPackType("all");
                  setSafetyFilter("all");
                }}
                data-testid="button-clear-filters"
              >
                Clear Filters
              </Button>
            </div>
          )}

          {/* Featured Pack Types */}
          <Card className="pack-card mt-12">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Star className="mr-2 h-5 w-5" />
                Explore Pack Types
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button
                  variant="outline"
                  className="h-20 flex-col space-y-2 hover:bg-primary/10 hover:border-primary/50"
                  onClick={() => setPackType("alpha")}
                  data-testid="button-pack-alpha"
                >
                  <Users className="h-6 w-6 text-primary" />
                  <span className="font-medium">Alpha Leaders</span>
                </Button>
                
                <Button
                  variant="outline"
                  className="h-20 flex-col space-y-2 hover:bg-secondary/10 hover:border-secondary/50"
                  onClick={() => setPackType("playful")}
                  data-testid="button-pack-playful"
                >
                  <Sparkles className="h-6 w-6 text-secondary" />
                  <span className="font-medium">Playful Pups</span>
                </Button>
                
                <Button
                  variant="outline"
                  className="h-20 flex-col space-y-2 hover:bg-accent/10 hover:border-accent/50"
                  onClick={() => setPackType("supportive")}
                  data-testid="button-pack-supportive"
                >
                  <Heart className="h-6 w-6 text-accent" />
                  <span className="font-medium">Supportive Pack</span>
                </Button>
                
                <Button
                  variant="outline"
                  className="h-20 flex-col space-y-2 hover:bg-success/10 hover:border-success/50"
                  onClick={() => setPackType("training")}
                  data-testid="button-pack-training"
                >
                  <Dumbbell className="h-6 w-6 text-success" />
                  <span className="font-medium">Training Focus</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
