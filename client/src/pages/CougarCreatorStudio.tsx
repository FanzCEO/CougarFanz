import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Crown,
  Sparkles,
  Diamond,
  Users,
  TrendingUp,
  DollarSign,
  MessageCircle,
  Upload,
  Video,
  BarChart3,
  Settings,
  Lightbulb,
  Palette,
  Calendar,
  Eye,
  Heart,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Zap,
  Gift,
} from "lucide-react";
import Header from "@/components/layout/Header";

// Mock data
const mockStats = {
  monthlyEarnings: 4247,
  earningsChange: 12.4,
  activeAdmirers: 1247,
  admirersChange: 8.2,
  totalPosts: 847,
  postsThisMonth: 23,
  engagementRate: 18.7,
  engagementChange: 3.1,
  topSupporters: [
    { name: "DiamondFan_99", tier: "Inner Circle", amount: "$450" },
    { name: "LuxuryLover", tier: "VIP", amount: "$280" },
    { name: "GoldAdmirer", tier: "Inner Circle", amount: "$175" },
  ],
  recentActivity: [
    { type: "subscription", message: "New Inner Circle subscriber", time: "2 min ago", amount: "$29.99" },
    { type: "tip", message: "Tip from DiamondFan_99", time: "15 min ago", amount: "$50" },
    { type: "message", message: "5 new messages", time: "1 hour ago" },
    { type: "like", message: "Your post received 124 likes", time: "2 hours ago" },
  ],
  aiTips: [
    {
      icon: Sparkles,
      title: "Your Siren content performs best",
      description: "Posts with 'mysterious' vibe get 23% more engagement on Fridays",
    },
    {
      icon: Clock,
      title: "Optimal posting time",
      description: "Your admirers are most active between 8-10 PM EST",
    },
    {
      icon: TrendingUp,
      title: "Trending archetype",
      description: "The 'Boss' aesthetic is gaining traction this week",
    },
  ],
  weeklyEarnings: [320, 410, 380, 520, 490, 610, 580],
  contentPerformance: [
    { type: "Photo", count: 45, engagement: 892 },
    { type: "Video", count: 12, engagement: 2340 },
    { type: "Live", count: 3, engagement: 1560 },
    { type: "Story", count: 28, engagement: 456 },
  ],
};

const archetype = {
  name: "Alpha",
  color: "text-cfz-gold",
  bgColor: "bg-cfz-gold/15",
};

export default function CougarCreatorStudio() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="min-h-screen bg-cfz-satin-black">
      <Header onAuthClick={() => {}} />

      {/* Studio Header */}
      <section className="pt-28 pb-6 bg-cfz-charcoal border-b border-cfz-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cfz-gold/20 to-cfz-wine/20 border-2 border-cfz-gold flex items-center justify-center shadow-gold-glow">
                <Crown className="h-8 w-8 text-cfz-gold" />
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold text-cfz-champagne flex items-center gap-2">
                  Queen Victoria's Studio
                  <Badge className={`${archetype.bgColor} ${archetype.color} text-xs`}>
                    {archetype.name}
                  </Badge>
                </h1>
                <p className="text-cfz-muted">@queenvictoria • 40+ Fierce</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                className="border-cfz-gold text-cfz-gold hover:bg-cfz-gold/10"
              >
                <Video className="mr-2 h-4 w-4" />
                Go Live
              </Button>
              <Button className="bg-luxe text-cfz-satin-black hover:bg-champagne shadow-gold-glow">
                <Upload className="mr-2 h-4 w-4" />
                Upload Content
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1">
              <Card className="bg-cfz-espresso border-cfz-border sticky top-28">
                <CardContent className="p-4">
                  <nav className="space-y-1">
                    {[
                      { id: "overview", label: "Overview", icon: BarChart3 },
                      { id: "content", label: "Content", icon: Upload },
                      { id: "messages", label: "Messages", icon: MessageCircle },
                      { id: "analytics", label: "Analytics", icon: TrendingUp },
                      { id: "earnings", label: "Earnings", icon: DollarSign },
                      { id: "ai-coach", label: "AI Coach", icon: Lightbulb },
                      { id: "branding", label: "Branding", icon: Palette },
                      { id: "settings", label: "Settings", icon: Settings },
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${
                          activeTab === item.id
                            ? "bg-cfz-gold/15 text-cfz-gold"
                            : "text-cfz-muted hover:text-cfz-champagne hover:bg-cfz-espresso-light"
                        }`}
                      >
                        <item.icon className="h-5 w-5" />
                        <span className="font-medium">{item.label}</span>
                      </button>
                    ))}
                  </nav>
                </CardContent>
              </Card>
            </div>

            {/* Main Dashboard Area */}
            <div className="lg:col-span-3 space-y-6">
              {/* Stats Cards */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-cfz-espresso border-cfz-border">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-cfz-muted text-sm">Monthly Elegance</span>
                      <DollarSign className="h-5 w-5 text-cfz-gold" />
                    </div>
                    <div className="text-2xl font-display font-bold text-cfz-champagne">
                      ${mockStats.monthlyEarnings.toLocaleString()}
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-emerald-400 text-sm">
                      <ArrowUpRight className="h-4 w-4" />
                      <span>+{mockStats.earningsChange}%</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-cfz-espresso border-cfz-border">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-cfz-muted text-sm">Active Admirers</span>
                      <Users className="h-5 w-5 text-cfz-rose-gold" />
                    </div>
                    <div className="text-2xl font-display font-bold text-cfz-champagne">
                      {mockStats.activeAdmirers.toLocaleString()}
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-emerald-400 text-sm">
                      <ArrowUpRight className="h-4 w-4" />
                      <span>+{mockStats.admirersChange}%</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-cfz-espresso border-cfz-border">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-cfz-muted text-sm">Total Posts</span>
                      <Upload className="h-5 w-5 text-purple-400" />
                    </div>
                    <div className="text-2xl font-display font-bold text-cfz-champagne">
                      {mockStats.totalPosts}
                    </div>
                    <div className="text-cfz-muted text-sm mt-1">
                      +{mockStats.postsThisMonth} this month
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-cfz-espresso border-cfz-border">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-cfz-muted text-sm">Engagement Rate</span>
                      <TrendingUp className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div className="text-2xl font-display font-bold text-cfz-champagne">
                      {mockStats.engagementRate}%
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-emerald-400 text-sm">
                      <ArrowUpRight className="h-4 w-4" />
                      <span>+{mockStats.engagementChange}%</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Main Content Area */}
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Glam Impact Chart */}
                <Card className="lg:col-span-2 bg-cfz-espresso border-cfz-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="font-display text-lg text-cfz-champagne flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-cfz-gold" />
                      Your Glam Impact
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Simple bar chart representation */}
                    <div className="flex items-end justify-between h-40 gap-2 mt-4">
                      {mockStats.weeklyEarnings.map((value, index) => {
                        const height = (value / Math.max(...mockStats.weeklyEarnings)) * 100;
                        return (
                          <div key={index} className="flex-1 flex flex-col items-center gap-2">
                            <div
                              className="w-full bg-luxe rounded-t transition-all duration-500 hover:shadow-gold-glow"
                              style={{ height: `${height}%` }}
                            />
                            <span className="text-xs text-cfz-muted">
                              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][index]}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-cfz-border">
                      <span className="text-sm text-cfz-muted">Weekly earnings trend</span>
                      <span className="text-sm text-cfz-gold font-semibold">
                        Total: ${mockStats.weeklyEarnings.reduce((a, b) => a + b, 0)}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Top Supporters */}
                <Card className="bg-cfz-espresso border-cfz-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="font-display text-lg text-cfz-champagne flex items-center gap-2">
                      <Diamond className="h-5 w-5 text-cfz-gold" />
                      Top Supporters
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {mockStats.topSupporters.map((supporter, index) => (
                        <div
                          key={supporter.name}
                          className="flex items-center justify-between p-3 rounded-lg bg-cfz-satin-black"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-cfz-gold/20 flex items-center justify-center text-cfz-gold font-bold">
                              {index + 1}
                            </div>
                            <div>
                              <div className="font-medium text-cfz-champagne text-sm">
                                {supporter.name}
                              </div>
                              <Badge className="bg-cfz-wine/20 text-cfz-rose-gold text-xs mt-0.5">
                                {supporter.tier}
                              </Badge>
                            </div>
                          </div>
                          <span className="text-cfz-gold font-semibold">
                            {supporter.amount}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* AI Coaching Tips */}
              <Card className="bg-cfz-espresso border-cfz-border">
                <CardHeader className="pb-2">
                  <CardTitle className="font-display text-lg text-cfz-champagne flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-cfz-gold" />
                    AI Coaching Tips
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4">
                    {mockStats.aiTips.map((tip, index) => (
                      <div
                        key={index}
                        className="p-4 rounded-lg bg-cfz-satin-black border border-cfz-border hover:border-cfz-gold/30 transition-all"
                      >
                        <div className="w-10 h-10 rounded-lg bg-cfz-gold/15 flex items-center justify-center mb-3">
                          <tip.icon className="h-5 w-5 text-cfz-gold" />
                        </div>
                        <h4 className="font-medium text-cfz-champagne text-sm mb-1">
                          {tip.title}
                        </h4>
                        <p className="text-xs text-cfz-muted">{tip.description}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity & Content Performance */}
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Recent Activity */}
                <Card className="bg-cfz-espresso border-cfz-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="font-display text-lg text-cfz-champagne flex items-center gap-2">
                      <Zap className="h-5 w-5 text-cfz-gold" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {mockStats.recentActivity.map((activity, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 rounded-lg bg-cfz-satin-black"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              activity.type === "subscription"
                                ? "bg-emerald-500/20 text-emerald-400"
                                : activity.type === "tip"
                                ? "bg-cfz-gold/20 text-cfz-gold"
                                : activity.type === "message"
                                ? "bg-purple-500/20 text-purple-400"
                                : "bg-pink-500/20 text-pink-400"
                            }`}>
                              {activity.type === "subscription" && <Users className="h-4 w-4" />}
                              {activity.type === "tip" && <Gift className="h-4 w-4" />}
                              {activity.type === "message" && <MessageCircle className="h-4 w-4" />}
                              {activity.type === "like" && <Heart className="h-4 w-4" />}
                            </div>
                            <div>
                              <div className="text-sm text-cfz-champagne">
                                {activity.message}
                              </div>
                              <div className="text-xs text-cfz-muted">{activity.time}</div>
                            </div>
                          </div>
                          {activity.amount && (
                            <span className="text-cfz-gold font-semibold text-sm">
                              {activity.amount}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Content Performance */}
                <Card className="bg-cfz-espresso border-cfz-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="font-display text-lg text-cfz-champagne flex items-center gap-2">
                      <Eye className="h-5 w-5 text-cfz-gold" />
                      Content Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {mockStats.contentPerformance.map((content) => (
                        <div key={content.type}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-cfz-champagne">{content.type}</span>
                            <span className="text-sm text-cfz-muted">
                              {content.count} posts • {content.engagement} engagements
                            </span>
                          </div>
                          <div className="w-full h-2 bg-cfz-border rounded-full overflow-hidden">
                            <div
                              className="h-full bg-luxe rounded-full"
                              style={{
                                width: `${(content.engagement / 2500) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <Card className="bg-cfz-espresso border-cfz-border">
                <CardHeader className="pb-2">
                  <CardTitle className="font-display text-lg text-cfz-champagne">
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <Button
                      variant="outline"
                      className="h-auto py-4 flex-col gap-2 border-cfz-border hover:border-cfz-gold/50 hover:bg-cfz-gold/5"
                    >
                      <Upload className="h-6 w-6 text-cfz-gold" />
                      <span className="text-cfz-champagne">Upload Photo</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-auto py-4 flex-col gap-2 border-cfz-border hover:border-cfz-gold/50 hover:bg-cfz-gold/5"
                    >
                      <Video className="h-6 w-6 text-cfz-gold" />
                      <span className="text-cfz-champagne">Upload Video</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-auto py-4 flex-col gap-2 border-cfz-border hover:border-cfz-gold/50 hover:bg-cfz-gold/5"
                    >
                      <Calendar className="h-6 w-6 text-cfz-gold" />
                      <span className="text-cfz-champagne">Schedule Post</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-auto py-4 flex-col gap-2 border-cfz-border hover:border-cfz-gold/50 hover:bg-cfz-gold/5"
                    >
                      <Sparkles className="h-6 w-6 text-cfz-gold" />
                      <span className="text-cfz-champagne">AI Caption</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
