import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Brain, BookOpen, Users, Shield, Heart, Zap } from "lucide-react";

const wikiCategories = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: BookOpen,
    description: "Learn the basics of the FUN Empire platform",
    articles: [
      { title: "Welcome to FUN Empire", slug: "welcome", tags: ["basics", "intro"] },
      { title: "Setting up your Profile", slug: "profile-setup", tags: ["profile", "basics"] },
      { title: "Understanding Tenants", slug: "tenants", tags: ["girlfanz", "pupfanz", "daddyfanz"] },
      { title: "Content Creation Guide", slug: "content-creation", tags: ["content", "creators"] },
    ]
  },
  {
    id: "safety",
    title: "Safety & Compliance",
    icon: Shield,
    description: "Important safety guidelines and compliance information",
    articles: [
      { title: "Community Guidelines", slug: "guidelines", tags: ["safety", "rules"] },
      { title: "Age Verification Process", slug: "age-verification", tags: ["kyc", "compliance"] },
      { title: "Content Moderation", slug: "moderation", tags: ["safety", "content"] },
      { title: "Reporting Issues", slug: "reporting", tags: ["safety", "support"] },
    ]
  },
  {
    id: "creators",
    title: "For Creators",
    icon: Users,
    description: "Guides for content creators and performers",
    articles: [
      { title: "Creator Dashboard", slug: "dashboard", tags: ["creators", "analytics"] },
      { title: "Monetization Strategies", slug: "monetization", tags: ["creators", "revenue"] },
      { title: "Cross-posting Content", slug: "cross-posting", tags: ["content", "tenants"] },
      { title: "Building Your Audience", slug: "audience", tags: ["creators", "growth"] },
    ]
  },
  {
    id: "fans",
    title: "For Fans",
    icon: Heart,
    description: "How to enjoy and support your favorite creators",
    articles: [
      { title: "Discovering Creators", slug: "discovery", tags: ["fans", "discovery"] },
      { title: "Subscription Plans", slug: "subscriptions", tags: ["fans", "payments"] },
      { title: "Messaging & Tips", slug: "messaging", tags: ["fans", "interaction"] },
      { title: "Privacy & Security", slug: "privacy", tags: ["fans", "security"] },
    ]
  },
  {
    id: "technical",
    title: "Technical",
    icon: Zap,
    description: "Technical features and troubleshooting",
    articles: [
      { title: "Media Upload Guidelines", slug: "uploads", tags: ["technical", "media"] },
      { title: "Browser Compatibility", slug: "browsers", tags: ["technical", "support"] },
      { title: "Mobile App Features", slug: "mobile", tags: ["technical", "mobile"] },
      { title: "API Documentation", slug: "api", tags: ["technical", "developers"] },
    ]
  }
];

export default function Wiki() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredCategories = wikiCategories.filter(category => {
    if (!searchQuery) return true;
    return category.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
           category.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
           category.articles.some(article => 
             article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
             article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
           );
  });

  const selectedCategoryData = selectedCategory 
    ? wikiCategories.find(c => c.id === selectedCategory)
    : null;

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">AI-Powered Knowledge Base</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Everything you need to know about the FUN Empire platform
        </p>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search knowledge base..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="wiki-search"
          />
        </div>
      </div>

      {!selectedCategory ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredCategories.map((category) => {
            const IconComponent = category.icon;
            return (
              <Card key={category.id} className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => setSelectedCategory(category.id)}
                    data-testid={`wiki-category-${category.id}`}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IconComponent className="h-5 w-5 text-primary" />
                    {category.title}
                  </CardTitle>
                  <CardDescription>{category.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {category.articles.slice(0, 3).map((article) => (
                      <div key={article.slug} className="text-sm">
                        <div className="font-medium">{article.title}</div>
                        <div className="flex gap-1 mt-1">
                          {article.tags.slice(0, 2).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                    {category.articles.length > 3 && (
                      <div className="text-xs text-muted-foreground">
                        +{category.articles.length - 3} more articles
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div>
          <Button 
            variant="ghost" 
            onClick={() => setSelectedCategory(null)}
            className="mb-4"
            data-testid="wiki-back-button"
          >
            ← Back to Categories
          </Button>
          
          {selectedCategoryData && (
            <div>
              <div className="flex items-center gap-2 mb-6">
                <selectedCategoryData.icon className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold">{selectedCategoryData.title}</h2>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                {selectedCategoryData.articles.map((article) => (
                  <Card key={article.slug} className="hover:shadow-lg transition-shadow cursor-pointer"
                        data-testid={`wiki-article-${article.slug}`}>
                    <CardHeader>
                      <CardTitle className="text-lg">{article.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-1">
                        {article.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}