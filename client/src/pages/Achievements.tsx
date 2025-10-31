import { useQuery } from "@tanstack/react-query";
import { Award, Trophy, Lock, Star, Crown, Shield } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Achievements() {
  const { data: achievements = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/gamification/achievements'],
  });

  const categorizedAchievements = achievements.reduce((acc: any, item: any) => {
    const category = item.achievement.category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {});

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'bronze': return 'bg-orange-700 dark:bg-orange-800';
      case 'silver': return 'bg-gray-400 dark:bg-gray-500';
      case 'gold': return 'bg-yellow-500 dark:bg-yellow-600';
      case 'platinum': return 'bg-cyan-500 dark:bg-cyan-600';
      case 'diamond': return 'bg-blue-500 dark:bg-blue-600';
      default: return 'bg-gray-600 dark:bg-gray-700';
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'bronze': return <Award className="w-6 h-6" />;
      case 'silver': return <Shield className="w-6 h-6" />;
      case 'gold': return <Trophy className="w-6 h-6" />;
      case 'platinum': return <Star className="w-6 h-6" />;
      case 'diamond': return <Crown className="w-6 h-6" />;
      default: return <Award className="w-6 h-6" />;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8" data-testid="page-achievements">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-40 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8" data-testid="page-achievements">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-foreground dark:text-white" data-testid="heading-achievements">
          Your Achievements
        </h1>
        <p className="text-muted-foreground dark:text-gray-400">
          Unlock badges and rewards as you progress on the platform
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card dark:bg-gray-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground dark:text-gray-400">Total Achievements</p>
                <p className="text-3xl font-bold text-foreground dark:text-white" data-testid="stat-total-achievements">
                  {achievements.length}
                </p>
              </div>
              <Trophy className="w-12 h-12 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card dark:bg-gray-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground dark:text-gray-400">Total Points</p>
                <p className="text-3xl font-bold text-foreground dark:text-white" data-testid="stat-total-points">
                  {achievements.reduce((sum: number, item: any) => sum + (item.achievement.points || 0), 0)}
                </p>
              </div>
              <Star className="w-12 h-12 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card dark:bg-gray-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground dark:text-gray-400">Rarity Breakdown</p>
                <div className="flex gap-2 mt-2">
                  {['bronze', 'silver', 'gold', 'platinum', 'diamond'].map(tier => {
                    const count = achievements.filter((a: any) => a.achievement.tier === tier).length;
                    if (count === 0) return null;
                    return (
                      <Badge key={tier} className={`${getTierColor(tier)} text-white`} data-testid={`badge-tier-${tier}`}>
                        {count}
                      </Badge>
                    );
                  })}
                </div>
              </div>
              <Crown className="w-12 h-12 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-6 bg-muted dark:bg-gray-800">
          <TabsTrigger value="all" data-testid="tab-all">All</TabsTrigger>
          <TabsTrigger value="creator" data-testid="tab-creator">Creator</TabsTrigger>
          <TabsTrigger value="fan" data-testid="tab-fan">Fan</TabsTrigger>
          <TabsTrigger value="engagement" data-testid="tab-engagement">Engagement</TabsTrigger>
          <TabsTrigger value="milestone" data-testid="tab-milestone">Milestone</TabsTrigger>
          <TabsTrigger value="special" data-testid="tab-special">Special</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <AchievementGrid achievements={achievements} getTierColor={getTierColor} getTierIcon={getTierIcon} />
        </TabsContent>

        {Object.keys(categorizedAchievements).map(category => (
          <TabsContent key={category} value={category} className="mt-6">
            <AchievementGrid 
              achievements={categorizedAchievements[category]} 
              getTierColor={getTierColor} 
              getTierIcon={getTierIcon} 
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function AchievementGrid({ achievements, getTierColor, getTierIcon }: any) {
  if (achievements.length === 0) {
    return (
      <div className="text-center py-12">
        <Lock className="w-16 h-16 mx-auto text-muted-foreground dark:text-gray-600 mb-4" />
        <p className="text-muted-foreground dark:text-gray-400">No achievements unlocked in this category yet</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {achievements.map((item: any) => {
        const achievement = item.achievement;
        const userAchievement = item.userAchievement;

        return (
          <Card 
            key={achievement.id} 
            className="bg-card dark:bg-gray-800 hover:shadow-lg transition-shadow"
            data-testid={`achievement-card-${achievement.id}`}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className={`p-3 rounded-lg ${getTierColor(achievement.tier)} text-white`}>
                  {getTierIcon(achievement.tier)}
                </div>
                <Badge className={`${getTierColor(achievement.tier)} text-white`} data-testid={`badge-tier-${achievement.tier}`}>
                  {achievement.tier}
                </Badge>
              </div>
              <CardTitle className="text-foreground dark:text-white" data-testid={`achievement-title-${achievement.id}`}>
                {achievement.name}
              </CardTitle>
              <CardDescription className="dark:text-gray-400">
                {achievement.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground dark:text-gray-400">Progress</span>
                <span className="text-sm font-semibold text-foreground dark:text-white" data-testid={`achievement-progress-${achievement.id}`}>
                  {userAchievement.progress}%
                </span>
              </div>
              <Progress value={userAchievement.progress} className="h-2" />
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-1 text-yellow-500">
                  <Star className="w-4 h-4" />
                  <span className="text-sm font-semibold" data-testid={`achievement-points-${achievement.id}`}>
                    {achievement.points} pts
                  </span>
                </div>
                <span className="text-xs text-muted-foreground dark:text-gray-500" data-testid={`achievement-unlocked-date-${achievement.id}`}>
                  Unlocked {new Date(userAchievement.unlockedAt).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
