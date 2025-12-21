import { useEffect, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { LoaderCircle, Heart, MessageCircle, Share2, Lock, Eye, DollarSign } from "lucide-react";
import { Link } from "wouter";

const POSTS_PER_PAGE = 12;
const AD_FREQUENCY = 4;

interface FeedPost {
  id: string;
  creatorUserId: string;
  creatorName: string;
  creatorAvatar: string;
  creatorIsAgeVerified: boolean;
  creatorAllowsFree: boolean;
  title: string;
  caption: string;
  visibility: 'public' | 'subscribers' | 'ppv';
  priceCents: number;
  mediaUrl?: string;
  mediaType?: string;
  isSubscribed: boolean;
  isFree: boolean;
  tags: string[];
  likeCount: number;
  commentCount: number;
  createdAt: string;
}

export default function FanzInfinityScrollFeed() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [allPosts, setAllPosts] = useState<FeedPost[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const loader = useRef<HTMLDivElement>(null);

  // Reset feed when user changes
  useEffect(() => {
    setPage(1);
    setAllPosts([]);
    setHasMore(true);
  }, [(user as any)?.id]);

  const { data, isLoading, isFetching } = useQuery<FeedPost[]>({
    queryKey: ['/api/feed', page],
    queryFn: async () => {
      const response = await fetch(`/api/feed?page=${page}&limit=${POSTS_PER_PAGE}`);
      if (!response.ok) throw new Error('Failed to fetch feed');
      return response.json();
    },
    enabled: page > 0 && hasMore,
  });

  useEffect(() => {
    if (data) {
      // Check if this is the last page
      if (data.length < POSTS_PER_PAGE) {
        setHasMore(false);
      }
      
      // Deduplicate posts by ID
      setAllPosts(prev => {
        if (page === 1) return data;
        const existingIds = new Set(prev.map(p => p.id));
        const newPosts = data.filter(p => !existingIds.has(p.id));
        return [...prev, ...newPosts];
      });
    }
  }, [data, page]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetching && hasMore && data && data.length > 0) {
          setPage(prev => prev + 1);
        }
      },
      { threshold: 1.0 }
    );
    
    if (loader.current) {
      observer.observe(loader.current);
    }
    
    return () => {
      if (loader.current) {
        observer.unobserve(loader.current);
      }
    };
  }, [isFetching, hasMore, data]);

  const renderPost = (post: FeedPost, index: number) => {
    const canView = post.isFree || post.isSubscribed || post.visibility === 'public';
    const isBlurred = !canView || (post.creatorAllowsFree && !post.creatorIsAgeVerified);

    return (
      <>
        <Card key={post.id} className="pack-card overflow-hidden hover:shadow-xl transition-shadow duration-300" data-testid={`feed-post-${post.id}`}>
          <CardContent className="p-0">
            {/* Creator Header */}
            <div className="p-4 flex items-center gap-3">
              <Link href={`/profile/${post.creatorUserId}`}>
                <Avatar className="h-10 w-10 cursor-pointer">
                  <AvatarImage src={post.creatorAvatar} alt={post.creatorName} />
                  <AvatarFallback>{post.creatorName[0]}</AvatarFallback>
                </Avatar>
              </Link>
              <div className="flex-1">
                <Link href={`/profile/${post.creatorUserId}`}>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold hover:text-primary cursor-pointer" data-testid={`creator-name-${post.id}`}>
                      {post.creatorName}
                    </h3>
                    {(post as any).packName && (
                      <Badge variant="outline" className="text-xs" data-testid={`pack-badge-${post.id}`}>
                        {(post as any).packName}
                      </Badge>
                    )}
                  </div>
                </Link>
                <p className="text-xs text-muted-foreground">
                  {new Date(post.createdAt).toLocaleDateString()}
                </p>
              </div>
              {post.visibility === 'ppv' && (
                <Badge className="safety-badge safety-badge-aftercare" data-testid={`badge-ppv-${post.id}`}>
                  <DollarSign className="h-3 w-3 mr-1" />
                  ${(post.priceCents / 100).toFixed(2)}
                </Badge>
              )}
            </div>

            {/* Title and Caption */}
            {post.title && (
              <div className="px-4 pb-2">
                <h4 className="font-medium text-lg" data-testid={`post-title-${post.id}`}>{post.title}</h4>
              </div>
            )}
            {post.caption && (
              <div className="px-4 pb-3">
                <p className="text-sm text-foreground/80" data-testid={`post-caption-${post.id}`}>{post.caption}</p>
              </div>
            )}

            {/* Media Content */}
            {post.mediaUrl && (
              <div className="relative">
                {canView && !isBlurred ? (
                  post.mediaType?.startsWith('video') ? (
                    <video 
                      controls 
                      className="w-full max-h-[500px] object-cover bg-black"
                      data-testid={`post-video-${post.id}`}
                    >
                      <source src={post.mediaUrl} type={post.mediaType} />
                    </video>
                  ) : (
                    <img 
                      src={post.mediaUrl} 
                      alt={post.title} 
                      className="w-full max-h-[500px] object-cover"
                      data-testid={`post-image-${post.id}`}
                    />
                  )
                ) : (
                  <div className="w-full h-64 bg-moonyard flex flex-col items-center justify-center text-muted-foreground border-y border-border/50">
                    <Lock className="h-12 w-12 mb-3 opacity-50" />
                    <p className="text-sm font-medium" data-testid={`post-locked-${post.id}`}>
                      {!post.creatorIsAgeVerified && post.creatorAllowsFree
                        ? "Pending Age Verification via VerifyMy"
                        : post.visibility === 'ppv'
                        ? `Unlock for $${(post.priceCents / 100).toFixed(2)}`
                        : "Subscribe to View"}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="px-4 py-2 flex gap-2 flex-wrap">
                {post.tags.map((tag, i) => (
                  <Badge key={i} variant="outline" className="text-xs" data-testid={`tag-${tag}-${post.id}`}>
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="px-4 py-3 flex items-center gap-4 border-t border-border/50">
              <Button variant="ghost" size="sm" className="gap-2" data-testid={`button-like-${post.id}`}>
                <Heart className="h-4 w-4" />
                <span className="text-sm">{post.likeCount || 0}</span>
              </Button>
              <Button variant="ghost" size="sm" className="gap-2" data-testid={`button-comment-${post.id}`}>
                <MessageCircle className="h-4 w-4" />
                <span className="text-sm">{post.commentCount || 0}</span>
              </Button>
              <Button variant="ghost" size="sm" className="gap-2" data-testid={`button-share-${post.id}`}>
                <Share2 className="h-4 w-4" />
              </Button>
              {!canView && (
                <Button 
                  size="sm" 
                  className="ml-auto btn-primary"
                  data-testid={`button-unlock-${post.id}`}
                >
                  {post.visibility === 'ppv' ? 'Unlock' : 'Subscribe'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Ad Insertion every 4th post */}
        {(index + 1) % AD_FREQUENCY === 0 && (
          <Card className="pack-card overflow-hidden bg-gradient-to-br from-volt/20 to-cobalt/20" data-testid={`ad-slot-${index}`}>
            <CardContent className="p-6 text-center">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Sponsored</p>
              <div className="min-h-[200px] flex items-center justify-center">
                <div className="text-center space-y-2">
                  <Eye className="h-8 w-8 mx-auto opacity-50" />
                  <p className="text-sm font-medium">Ad Placement</p>
                  <p className="text-xs text-muted-foreground">
                    Creative promotional content
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </>
    );
  };

  if (isLoading && page === 1) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoaderCircle className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {allPosts.map((post, idx) => renderPost(post, idx))}
      </div>
      
      <div ref={loader} className="flex justify-center py-8">
        {isFetching && <LoaderCircle className="animate-spin h-6 w-6 text-primary" />}
      </div>

      {!isFetching && allPosts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No posts to display. Follow some creators to see their content!</p>
        </div>
      )}
    </div>
  );
}
