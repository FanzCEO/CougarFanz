import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  Heart, 
  Eye, 
  Users, 
  Verified, 
  Shield,
  Star
} from "lucide-react";

interface Creator {
  id: string;
  username: string;
  email?: string;
  profileImageUrl?: string;
  profile?: {
    displayName?: string;
    bio?: string;
    avatarUrl?: string;
    packType?: string;
    ageVerified?: boolean;
    kycStatus?: string;
    isAftercareFriendly?: boolean;
    safetyBadges?: string[];
  };
}

interface CreatorCardProps {
  creator: Creator;
  compact?: boolean;
}

export default function CreatorCard({ creator, compact = false }: CreatorCardProps) {
  const displayName = creator.profile?.displayName || creator.username;
  const avatarUrl = creator.profile?.avatarUrl || creator.profileImageUrl;
  const bio = creator.profile?.bio;

  // Mock stats - in real app these would come from API
  const mockStats = {
    subscribers: Math.floor(Math.random() * 3000) + 500,
    content: Math.floor(Math.random() * 50) + 10,
    views: Math.floor(Math.random() * 50000) + 5000,
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const getPackTypeColor = (packType?: string) => {
    switch (packType) {
      case 'alpha': return 'bg-primary/20 text-primary';
      case 'playful': return 'bg-secondary/20 text-secondary';
      case 'supportive': return 'bg-accent/20 text-accent';
      case 'training': return 'bg-success/20 text-success';
      default: return 'bg-muted/20 text-muted';
    }
  };

  if (compact) {
    return (
      <Link href={`/profile/${creator.id}`}>
        <div className="pack-card p-4 cursor-pointer" data-testid={`creator-card-${creator.id}`}>
          <div className="flex items-center space-x-3">
            <Avatar className="w-12 h-12 border border-primary/30">
              <AvatarImage src={avatarUrl} alt={displayName} />
              <AvatarFallback className="bg-primary/20 text-primary">
                {displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground truncate" data-testid="text-creator-name">
                {displayName}
              </h3>
              <div className="flex items-center space-x-2 text-sm">
                <span className="text-muted" data-testid="text-pack-count">
                  {formatNumber(mockStats.subscribers)} pack
                </span>
                {creator.profile?.ageVerified && (
                  <Badge className="safety-badge safety-badge-verified text-xs">
                    <Verified className="h-2 w-2 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <div className="pack-card overflow-hidden group" data-testid={`creator-card-${creator.id}`}>
      <div className="p-6">
        <div className="flex items-start space-x-4 mb-4">
          <Avatar className="w-16 h-16 border-2 border-primary/30 group-hover:border-primary transition-colors">
            <AvatarImage src={avatarUrl} alt={displayName} />
            <AvatarFallback className="text-lg bg-primary/20 text-primary">
              {displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-foreground truncate mb-1" data-testid="text-creator-name">
              {displayName}
            </h3>
            <p className="text-sm text-muted mb-2">@{creator.username}</p>
            
            {/* Safety Badges */}
            <div className="flex flex-wrap items-center gap-1 mb-2">
              {creator.profile?.ageVerified && (
                <Badge className="safety-badge safety-badge-verified text-xs">
                  <Verified className="mr-1 h-2 w-2" />
                  18+ Verified
                </Badge>
              )}
              {creator.profile?.kycStatus === 'verified' && (
                <Badge className="safety-badge safety-badge-consent text-xs">
                  <Shield className="mr-1 h-2 w-2" />
                  KYC Verified
                </Badge>
              )}
              {creator.profile?.isAftercareFriendly && (
                <Badge className="safety-badge safety-badge-aftercare text-xs">
                  <Heart className="mr-1 h-2 w-2" />
                  Aftercare
                </Badge>
              )}
              {creator.profile?.packType && (
                <Badge 
                  variant="outline" 
                  className={`text-xs ${getPackTypeColor(creator.profile.packType)}`}
                >
                  {creator.profile.packType}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Bio */}
        {bio && (
          <p className="text-sm text-muted mb-4 line-clamp-2" data-testid="text-creator-bio">
            {bio}
          </p>
        )}

        {/* Content Preview Grid */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[1, 2, 3].map((i) => (
            <div 
              key={i}
              className="aspect-square bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg flex items-center justify-center group-hover:from-primary/30 group-hover:to-secondary/30 transition-colors"
            >
              <Eye className="h-4 w-4 text-primary opacity-60" />
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between mb-4 text-sm text-muted">
          <div className="flex items-center space-x-1">
            <Users className="h-4 w-4" />
            <span data-testid="text-subscribers">{formatNumber(mockStats.subscribers)} pack</span>
          </div>
          <div className="flex items-center space-x-1">
            <Star className="h-4 w-4" />
            <span data-testid="text-content-count">{mockStats.content} posts</span>
          </div>
          <div className="flex items-center space-x-1">
            <Eye className="h-4 w-4" />
            <span data-testid="text-total-views">{formatNumber(mockStats.views)} views</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-2">
          <Link href={`/profile/${creator.id}`} className="flex-1">
            <Button className="w-full btn-primary" data-testid="button-view-profile">
              <Heart className="mr-2 h-4 w-4" />
              Join Pack
            </Button>
          </Link>
          <Button variant="outline" size="sm" data-testid="button-message">
            💬
          </Button>
        </div>
      </div>
    </div>
  );
}
