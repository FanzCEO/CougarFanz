import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  AlertTriangle, 
  Shield,
  FileText,
  User,
  Image,
  MessageCircle
} from "lucide-react";

const reportCategories = [
  { value: "harassment", label: "Harassment or Bullying", icon: User },
  { value: "illegal", label: "Illegal Content", icon: AlertTriangle },
  { value: "copyright", label: "Copyright Infringement", icon: FileText },
  { value: "spam", label: "Spam or Scam", icon: MessageCircle },
  { value: "inappropriate", label: "Inappropriate Content", icon: Image },
  { value: "other", label: "Other Violation", icon: Shield },
];

export default function Report() {
  const { toast } = useToast();
  const [category, setCategory] = useState("");
  const [contentUrl, setContentUrl] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!category || !description) {
      toast({
        title: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Report submitted successfully",
        description: "Our moderation team will review your report within 24 hours.",
      });
      
      setCategory("");
      setContentUrl("");
      setDescription("");
    } catch (error) {
      toast({
        title: "Failed to submit report",
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
          <AlertTriangle className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Report Abuse</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Help us maintain a safe community by reporting violations of our guidelines
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Submit a Report</CardTitle>
              <CardDescription>
                Provide as much detail as possible to help us investigate
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="text-sm font-medium mb-2 block">Violation Type *</label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger data-testid="select-report-category">
                      <SelectValue placeholder="Select a violation type" />
                    </SelectTrigger>
                    <SelectContent>
                      {reportCategories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Content URL (Optional)</label>
                  <Input
                    value={contentUrl}
                    onChange={(e) => setContentUrl(e.target.value)}
                    placeholder="https://example.com/content/..."
                    data-testid="input-content-url"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    If reporting specific content, paste the URL here
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Description *</label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide detailed information about the violation, including what happened, when it occurred, and any other relevant context..."
                    rows={8}
                    data-testid="textarea-description"
                  />
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <div className="font-medium mb-1">Anonymous Reporting</div>
                      <div className="text-muted-foreground">
                        Your report will be reviewed confidentially. The reported user will not know who submitted the report.
                      </div>
                    </div>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full"
                  data-testid="button-submit-report"
                >
                  {isSubmitting ? "Submitting..." : "Submit Report"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">What Happens Next?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="font-medium mb-1">1. Review</div>
                <p className="text-sm text-muted-foreground">
                  Our moderation team reviews your report within 24 hours
                </p>
              </div>
              <div>
                <div className="font-medium mb-1">2. Investigation</div>
                <p className="text-sm text-muted-foreground">
                  We thoroughly investigate the reported content or behavior
                </p>
              </div>
              <div>
                <div className="font-medium mb-1">3. Action</div>
                <p className="text-sm text-muted-foreground">
                  Appropriate action is taken based on our guidelines
                </p>
              </div>
              <div>
                <div className="font-medium mb-1">4. Follow-up</div>
                <p className="text-sm text-muted-foreground">
                  You'll receive an update on the outcome of your report
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-lg">Emergency?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                If you or someone else is in immediate danger, contact local law enforcement immediately.
              </p>
              <Button variant="destructive" className="w-full" data-testid="button-emergency">
                Emergency Resources
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
