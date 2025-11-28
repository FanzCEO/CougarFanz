import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Play, 
  BookOpen, 
  CheckCircle, 
  Clock, 
  Users, 
  Star,
  Video,
  FileText,
  Zap
} from "lucide-react";

const tutorialCategories = [
  {
    id: "getting-started",
    title: "Getting Started",
    description: "Essential tutorials for new users",
    color: "bg-blue-500",
  },
  {
    id: "creators",
    title: "Creator Tutorials",
    description: "Guides for content creators",
    color: "bg-purple-500",
  },
  {
    id: "fans",
    title: "Fan Tutorials", 
    description: "How to support your favorite creators",
    color: "bg-pink-500",
  },
  {
    id: "advanced",
    title: "Advanced Features",
    description: "Master advanced platform features",
    color: "bg-green-500",
  },
];

const tutorials = [
  // Getting Started
  {
    id: "welcome",
    category: "getting-started",
    title: "Welcome to FUN Empire",
    description: "Learn about GirlFanz, PupFanz, and DaddyFanz platforms",
    duration: "5 min",
    type: "video",
    difficulty: "beginner",
    completed: false,
    rating: 4.8,
    views: 15420,
  },
  {
    id: "profile-setup",
    category: "getting-started", 
    title: "Setting Up Your Profile",
    description: "Create an attractive profile that stands out",
    duration: "8 min",
    type: "interactive",
    difficulty: "beginner",
    completed: true,
    rating: 4.9,
    views: 12800,
  },
  {
    id: "age-verification",
    category: "getting-started",
    title: "Age Verification Process",
    description: "Complete KYC and age verification safely",
    duration: "6 min", 
    type: "guide",
    difficulty: "beginner",
    completed: false,
    rating: 4.7,
    views: 9200,
  },

  // Creator Tutorials
  {
    id: "content-creation",
    category: "creators",
    title: "Creating Your First Content",
    description: "Upload and manage content across all tenants",
    duration: "12 min",
    type: "video",
    difficulty: "intermediate",
    completed: false,
    rating: 4.8,
    views: 8500,
  },
  {
    id: "monetization",
    category: "creators",
    title: "Monetization Strategies",
    description: "Maximize earnings with subscriptions and tips",
    duration: "15 min",
    type: "guide",
    difficulty: "intermediate",
    completed: false,
    rating: 4.9,
    views: 11200,
  },
  {
    id: "cross-posting",
    category: "creators",
    title: "Cross-posting Content",
    description: "Share content across GirlFanz, PupFanz, and DaddyFanz",
    duration: "10 min",
    type: "interactive",
    difficulty: "intermediate",
    completed: false,
    rating: 4.6,
    views: 6800,
  },

  // Fan Tutorials
  {
    id: "discovering-creators",
    category: "fans",
    title: "Discovering Amazing Creators",
    description: "Find creators that match your interests",
    duration: "7 min",
    type: "video",
    difficulty: "beginner",
    completed: false,
    rating: 4.7,
    views: 10500,
  },
  {
    id: "subscriptions",
    category: "fans",
    title: "Managing Subscriptions",
    description: "Subscribe to creators and manage your preferences",
    duration: "9 min",
    type: "guide",
    difficulty: "beginner",
    completed: false,
    rating: 4.8,
    views: 7200,
  },

  // Advanced
  {
    id: "analytics",
    category: "advanced",
    title: "Understanding Analytics",
    description: "Use data to grow your audience and earnings",
    duration: "18 min",
    type: "video",
    difficulty: "advanced",
    completed: false,
    rating: 4.9,
    views: 4500,
  },
  {
    id: "api-integration",
    category: "advanced",
    title: "API Integration",
    description: "Integrate with third-party tools and services",
    duration: "25 min",
    type: "guide",
    difficulty: "advanced",
    completed: false,
    rating: 4.6,
    views: 2100,
  },
];

export default function Tutorials() {
  const [selectedCategory, setSelectedCategory] = useState<string>("getting-started");
  const [selectedTutorial, setSelectedTutorial] = useState<string | null>(null);

  const filteredTutorials = tutorials.filter(t => t.category === selectedCategory);
  const completedCount = tutorials.filter(t => t.completed).length;
  const progressPercentage = (completedCount / tutorials.length) * 100;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner": return "bg-green-500";
      case "intermediate": return "bg-yellow-500";
      case "advanced": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "video": return Video;
      case "interactive": return Zap;
      case "guide": return FileText;
      default: return BookOpen;
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Tutorials & Learning</h1>
        </div>
        <p className="text-muted-foreground text-lg mb-4">
          Master the FUN Empire platform with step-by-step tutorials
        </p>
        
        {/* Progress */}
        <div className="bg-card p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Your Progress</span>
            <span className="text-sm text-muted-foreground">
              {completedCount}/{tutorials.length} completed
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-4">
        {/* Categories */}
        <div className="lg:col-span-1">
          <h2 className="text-xl font-semibold mb-4">Categories</h2>
          <div className="space-y-2">
            {tutorialCategories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setSelectedCategory(category.id)}
                data-testid={`tutorial-category-${category.id}`}
              >
                <div className={`w-3 h-3 rounded-full ${category.color} mr-2`} />
                <div className="text-left">
                  <div className="font-medium">{category.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {category.description}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </div>

        {/* Tutorials */}
        <div className="lg:col-span-3">
          <div className="grid gap-4 md:grid-cols-2">
            {filteredTutorials.map((tutorial) => {
              const TypeIcon = getTypeIcon(tutorial.type);
              return (
                <Card key={tutorial.id} 
                      className="hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => setSelectedTutorial(tutorial.id)}
                      data-testid={`tutorial-${tutorial.id}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <TypeIcon className="h-5 w-5 text-primary" />
                        <Badge variant="outline" className="text-xs">
                          {tutorial.type}
                        </Badge>
                      </div>
                      {tutorial.completed && (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      )}
                    </div>
                    <CardTitle className="text-lg leading-tight">
                      {tutorial.title}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {tutorial.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {tutorial.duration}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {tutorial.views.toLocaleString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          {tutorial.rating}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-3">
                      <Badge variant="outline" className={`text-xs ${getDifficultyColor(tutorial.difficulty)} text-white`}>
                        {tutorial.difficulty}
                      </Badge>
                      <Button size="sm" data-testid={`start-tutorial-${tutorial.id}`}>
                        <Play className="h-4 w-4 mr-1" />
                        {tutorial.completed ? "Review" : "Start"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}