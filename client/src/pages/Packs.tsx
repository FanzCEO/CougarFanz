import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Users, 
  Star, 
  Lock,
  TrendingUp,
  MessageCircle,
  Heart
} from "lucide-react";

const featuredPacks = [
  {
    id: "1",
    name: "Alpha Pack",
    description: "Elite creators sharing exclusive content and experiences",
    members: 1234,
    isPrivate: false,
    category: "Premium",
    trending: true
  },
  {
    id: "2",
    name: "Wild Side",
    description: "Adventurous creators pushing boundaries",
    members: 892,
    isPrivate: false,
    category: "Adventure",
    trending: true
  },
  {
    id: "3",
    name: "VIP Lounge",
    description: "Exclusive access to top-tier creator collaborations",
    members: 456,
    isPrivate: true,
    category: "VIP",
    trending: false
  },
  {
    id: "4",
    name: "Creative Collective",
    description: "Artists and performers collaborating on unique content",
    members: 678,
    isPrivate: false,
    category: "Creative",
    trending: false
  }
];

export default function Packs() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPacks = featuredPacks.filter(pack =>
    pack.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pack.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pack.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Pack Communities</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Join exclusive creator communities and connect with your pack
        </p>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search packs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-packs"
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 mb-12">
        {filteredPacks.map((pack) => (
          <Card key={pack.id} className="hover:shadow-lg transition-shadow" data-testid={`card-pack-${pack.id}`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2">
                    {pack.name}
                    {pack.isPrivate && <Lock className="h-4 w-4 text-muted-foreground" />}
                    {pack.trending && <TrendingUp className="h-4 w-4 text-primary" />}
                  </CardTitle>
                  <CardDescription className="mt-2">{pack.description}</CardDescription>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <Badge variant="outline">{pack.category}</Badge>
                {pack.trending && <Badge variant="default">Trending</Badge>}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{pack.members.toLocaleString()} members</span>
                  </div>
                </div>
                <Button variant={pack.isPrivate ? "outline" : "default"} data-testid={`button-join-${pack.id}`}>
                  {pack.isPrivate ? "Request Access" : "Join Pack"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>What are Pack Communities?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <Heart className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <div className="font-medium">Exclusive Content</div>
              <div className="text-sm text-muted-foreground">
                Access unique collaborations and special content only available to pack members
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MessageCircle className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <div className="font-medium">Direct Interaction</div>
              <div className="text-sm text-muted-foreground">
                Chat with creators and other pack members in private communities
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Star className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <div className="font-medium">Special Perks</div>
              <div className="text-sm text-muted-foreground">
                Enjoy member-only perks, early access, and exclusive events
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
