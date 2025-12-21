import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Shield, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Heart,
  Users
} from "lucide-react";

const guidelines = [
  {
    title: "Respect and Consent",
    icon: Heart,
    rules: [
      "Always obtain and respect consent for all content and interactions",
      "No harassment, bullying, or threatening behavior",
      "Respect boundaries and privacy of all community members",
      "Zero tolerance for non-consensual content sharing"
    ]
  },
  {
    title: "Age and Identity Verification",
    icon: Shield,
    rules: [
      "All users must be 18 years or older",
      "Complete age verification through our KYC process",
      "No misrepresentation of age or identity",
      "Verify co-stars and collaborators before content creation"
    ]
  },
  {
    title: "Prohibited Content",
    icon: XCircle,
    rules: [
      "No content involving minors under any circumstances",
      "No non-consensual or illegal activities",
      "No violence, hate speech, or discriminatory content",
      "No copyright infringement or stolen content"
    ]
  },
  {
    title: "Community Standards",
    icon: Users,
    rules: [
      "Treat all members with respect and dignity",
      "Use appropriate content warnings and tags",
      "Report violations promptly through proper channels",
      "Maintain authentic and honest interactions"
    ]
  }
];

const consequences = [
  "First violation: Warning and content removal",
  "Second violation: Temporary account suspension (7-30 days)",
  "Third violation: Permanent account termination",
  "Severe violations: Immediate permanent ban and legal action if applicable"
];

export default function Guidelines() {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Community Guidelines</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Our community guidelines ensure a safe, respectful, and consensual environment for all users
        </p>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-semibold mb-2">Important Notice</div>
                <p className="text-sm text-muted-foreground">
                  Violations of these guidelines may result in content removal, account suspension, or permanent termination. 
                  Severe violations may be reported to law enforcement.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6 mb-8">
        {guidelines.map((section) => {
          const IconComponent = section.icon;
          return (
            <Card key={section.title} data-testid={`section-${section.title.toLowerCase().replace(/\s+/g, '-')}`}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <IconComponent className="h-6 w-6 text-primary" />
                  <CardTitle>{section.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {section.rules.map((rule, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Enforcement and Consequences</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            We take violations of our community guidelines seriously. Our enforcement policy follows a progressive approach:
          </p>
          <ul className="space-y-2">
            {consequences.map((consequence, index) => (
              <li key={index} className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                <span>{consequence}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
