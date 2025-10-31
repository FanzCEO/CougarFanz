import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  HelpCircle, 
  MessageCircle, 
  Bug, 
  Lightbulb, 
  Shield, 
  CreditCard,
  User,
  Settings,
  Send
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const supportCategories = [
  { id: "technical", label: "Technical Issue", icon: Bug, description: "Bugs, errors, or technical problems" },
  { id: "account", label: "Account & Profile", icon: User, description: "Login, profile, or account settings" },
  { id: "billing", label: "Billing & Payments", icon: CreditCard, description: "Subscriptions, payments, or refunds" },
  { id: "safety", label: "Safety & Moderation", icon: Shield, description: "Report inappropriate content or behavior" },
  { id: "feature", label: "Feature Request", icon: Lightbulb, description: "Suggest new features or improvements" },
  { id: "general", label: "General Support", icon: HelpCircle, description: "Other questions or concerns" },
];

const priorityLevels = [
  { value: "low", label: "Low - General question" },
  { value: "medium", label: "Medium - Issue affecting experience" },
  { value: "high", label: "High - Blocking issue" },
  { value: "urgent", label: "Urgent - Security or safety concern" },
];

export default function Support() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [priority, setPriority] = useState<string>("medium");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory || !subject || !description) {
      toast({
        title: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Simulate API call - replace with actual endpoint
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Support ticket submitted",
        description: "We'll get back to you within 24 hours.",
      });
      
      // Reset form
      setSelectedCategory("");
      setSubject("");
      setDescription("");
      setPriority("medium");
    } catch (error) {
      toast({
        title: "Failed to submit ticket",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <MessageCircle className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Help & Support</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Get help with technical issues, feature requests, or general questions
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Quick Help Categories */}
        <div className="lg:col-span-1">
          <h2 className="text-xl font-semibold mb-4">Quick Help</h2>
          <div className="space-y-3">
            {supportCategories.map((category) => {
              const IconComponent = category.icon;
              return (
                <Card key={category.id} 
                      className={`hover:shadow-md transition-shadow cursor-pointer ${
                        selectedCategory === category.id ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => setSelectedCategory(category.id)}
                      data-testid={`support-category-${category.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <IconComponent className="h-5 w-5 text-primary mt-1" />
                      <div>
                        <div className="font-medium text-sm">{category.label}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {category.description}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Support Ticket Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Submit a Support Ticket</CardTitle>
              <CardDescription>
                Provide details about your issue and we'll help you resolve it
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="text-sm font-medium mb-2 block">Category</label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger data-testid="support-category-select">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {supportCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Priority</label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger data-testid="support-priority-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {priorityLevels.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Subject</label>
                  <Input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Brief description of your issue"
                    data-testid="support-subject"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Description</label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide detailed information about your issue, including any error messages or steps to reproduce..."
                    rows={6}
                    data-testid="support-description"
                  />
                </div>

                {user && (
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="text-sm text-muted-foreground">
                      Submitting as: <span className="font-medium text-foreground">
                        {(user as any)?.username || (user as any)?.email || 'User'}
                      </span>
                    </div>
                  </div>
                )}

                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full"
                  data-testid="support-submit"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {isSubmitting ? "Submitting..." : "Submit Ticket"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Contact Options */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Other Ways to Get Help</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <MessageCircle className="h-5 w-5 text-primary" />
                <div>
                  <div className="font-medium">Live Chat</div>
                  <div className="text-sm text-muted-foreground">
                    Available 24/7 for urgent issues
                  </div>
                </div>
                <Badge variant="outline" className="ml-auto">Coming Soon</Badge>
              </div>
              
              <div className="flex items-center gap-3">
                <HelpCircle className="h-5 w-5 text-primary" />
                <div>
                  <div className="font-medium">Knowledge Base</div>
                  <div className="text-sm text-muted-foreground">
                    Search our comprehensive wiki
                  </div>
                </div>
                <Button variant="outline" size="sm" className="ml-auto">
                  Browse Wiki
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}