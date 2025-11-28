import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  DollarSign, 
  Star, 
  Shield, 
  Zap,
  CheckCircle,
  ArrowRight
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";

const creatorBenefits = [
  {
    icon: DollarSign,
    title: "Earn More",
    description: "Keep 80% of your earnings with transparent, creator-friendly pricing"
  },
  {
    icon: Users,
    title: "Build Your Pack",
    description: "Connect with your most loyal fans in exclusive pack communities"
  },
  {
    icon: Star,
    title: "Premium Tools",
    description: "Access advanced analytics, AI editing, and content management tools"
  },
  {
    icon: Shield,
    title: "Safe & Secure",
    description: "Industry-leading safety features and content protection"
  },
  {
    icon: Zap,
    title: "Multi-Platform",
    description: "Distribute to social media with one-click automation"
  }
];

const requirements = [
  "Must be 18 years or older",
  "Valid government-issued ID for verification",
  "Banking information for payouts",
  "Agree to community guidelines and terms"
];

export default function CreatorSignup() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      setLocation("/dashboard");
    } else {
      setLocation("/");
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold mb-4">Become a Creator</h1>
        <p className="text-muted-foreground text-xl max-w-2xl mx-auto">
          Join thousands of creators earning on their own terms. Build your brand, engage your fans, and maximize your income.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-12">
        {creatorBenefits.map((benefit) => {
          const IconComponent = benefit.icon;
          return (
            <Card key={benefit.title} data-testid={`benefit-${benefit.title.toLowerCase().replace(/\s+/g, '-')}`}>
              <CardHeader>
                <IconComponent className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">{benefit.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{benefit.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-8 lg:grid-cols-2 mb-12">
        <Card>
          <CardHeader>
            <CardTitle>Requirements</CardTitle>
            <CardDescription>What you need to get started</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {requirements.map((req, index) => (
                <li key={index} className="flex items-start gap-3" data-testid={`requirement-${index}`}>
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
            <CardDescription>Simple steps to start earning</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-4">
              <li className="flex gap-3">
                <Badge className="h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0">1</Badge>
                <div>
                  <div className="font-medium">Sign Up & Verify</div>
                  <div className="text-sm text-muted-foreground">Complete your profile and verify your identity</div>
                </div>
              </li>
              <li className="flex gap-3">
                <Badge className="h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0">2</Badge>
                <div>
                  <div className="font-medium">Set Up Your Page</div>
                  <div className="text-sm text-muted-foreground">Customize your profile and subscription tiers</div>
                </div>
              </li>
              <li className="flex gap-3">
                <Badge className="h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0">3</Badge>
                <div>
                  <div className="font-medium">Create & Earn</div>
                  <div className="text-sm text-muted-foreground">Upload content and start building your fanbase</div>
                </div>
              </li>
            </ol>
          </CardContent>
        </Card>
      </div>

      <div className="text-center">
        <Card className="inline-block">
          <CardContent className="pt-6">
            <h2 className="text-2xl font-bold mb-4">Ready to Start Your Creator Journey?</h2>
            <p className="text-muted-foreground mb-6 max-w-md">
              Join our community of creators and start monetizing your content today
            </p>
            <Button 
              size="lg" 
              className="gap-2"
              onClick={handleGetStarted}
              data-testid="button-get-started"
            >
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
