import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Shield, 
  Lock, 
  AlertTriangle,
  Eye,
  UserCheck,
  FileText,
  HelpCircle
} from "lucide-react";
import { useLocation } from "wouter";

const safetyFeatures = [
  {
    icon: UserCheck,
    title: "Age Verification",
    description: "All users must verify they are 18+ through our secure KYC process using government-issued ID"
  },
  {
    icon: Lock,
    title: "Content Protection",
    description: "Advanced watermarking and DMCA takedown tools to protect your original content"
  },
  {
    icon: Eye,
    title: "AI Moderation",
    description: "Automated content screening with human review to maintain community standards"
  },
  {
    icon: Shield,
    title: "Privacy Controls",
    description: "Granular privacy settings and consent management for all content and interactions"
  }
];

const safetyResources = [
  {
    title: "Report Abuse",
    description: "Report content or behavior that violates our guidelines",
    link: "/report",
    icon: AlertTriangle
  },
  {
    title: "Community Guidelines",
    description: "Review our community standards and policies",
    link: "/guidelines",
    icon: FileText
  },
  {
    title: "Contact Support",
    description: "Get help with safety or security concerns",
    link: "/support",
    icon: HelpCircle
  }
];

export default function Safety() {
  const [, setLocation] = useLocation();

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-12 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Shield className="h-10 w-10 text-primary" />
          <h1 className="text-4xl font-bold">Safety Center</h1>
        </div>
        <p className="text-muted-foreground text-xl max-w-3xl mx-auto">
          Your safety and security are our top priorities. Learn about our comprehensive safety features and resources.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-12">
        {safetyFeatures.map((feature) => {
          const IconComponent = feature.icon;
          return (
            <Card key={feature.title} data-testid={`feature-${feature.title.toLowerCase().replace(/\s+/g, '-')}`}>
              <CardHeader>
                <IconComponent className="h-8 w-8 text-primary mb-2" />
                <CardTitle>{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Safety Resources</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {safetyResources.map((resource) => {
            const IconComponent = resource.icon;
            return (
              <Card key={resource.title} className="hover:shadow-lg transition-shadow" data-testid={`resource-${resource.title.toLowerCase().replace(/\s+/g, '-')}`}>
                <CardHeader>
                  <IconComponent className="h-6 w-6 text-primary mb-2" />
                  <CardTitle className="text-lg">{resource.title}</CardTitle>
                  <CardDescription>{resource.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setLocation(resource.link)}
                    data-testid={`button-${resource.title.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    Learn More
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Our Commitment to Safety</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            We are committed to providing a safe, secure, and respectful environment for all users. Our safety measures include:
          </p>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-medium">Proactive Monitoring:</span> 24/7 AI-powered content moderation with human oversight
              </div>
            </li>
            <li className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-medium">Zero Tolerance:</span> Strict enforcement against illegal content, harassment, and violations
              </div>
            </li>
            <li className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-medium">User Empowerment:</span> Comprehensive tools for blocking, reporting, and privacy control
              </div>
            </li>
            <li className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-medium">Transparency:</span> Clear policies and regular updates about safety improvements
              </div>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
