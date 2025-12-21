import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Heart, CreditCard, Sparkles, 
  ArrowRight, ArrowLeft, CheckCircle, Users 
} from "lucide-react";

interface FanzOnboardingProps {
  isOpen: boolean;
  onComplete: () => void;
}

const interests = [
  "Art", "Music", "Gaming", "Fitness", "Cooking", "Fashion",
  "Photography", "Dance", "Comedy", "Lifestyle", "Tech", "Travel"
];

export default function FanzOnboarding({ isOpen, onComplete }: FanzOnboardingProps) {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [paymentSkipped, setPaymentSkipped] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['/api/auth/user'],
  });

  const updateOnboardingMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/onboarding/update', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save progress. Please try again.",
        variant: "destructive",
      });
    },
  });

  const completeOnboardingMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/onboarding/complete', {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Welcome to the community! 🎉",
        description: "Your feed is ready. Start exploring!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      onComplete();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to complete onboarding. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleNext = () => {
    // Save current step data
    if (currentStep === 2) {
      updateOnboardingMutation.mutate({
        step: currentStep,
        data: { interests: selectedInterests },
      });
    }

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    completeOnboardingMutation.mutate();
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev => 
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const progress = (currentStep / totalSteps) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-2xl bg-card border border-border" data-testid="dialog-fanz-onboarding">
        <DialogHeader>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Users className="w-6 h-6 text-secondary" />
            <DialogTitle className="font-display text-2xl">Fanz Onboarding</DialogTitle>
          </div>
          <Progress value={progress} className="h-2" data-testid="progress-onboarding" />
          <DialogDescription className="text-center mt-2">
            Step {currentStep} of {totalSteps}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6">
          {/* Step 1: Welcome */}
          {currentStep === 1 && (
            <div className="space-y-6" data-testid="step-welcome">
              <div className="text-center space-y-4">
                <Heart className="w-16 h-16 mx-auto text-secondary" />
                <h3 className="font-display text-2xl">
                  Discover. Connect. Support. 💖
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Your new world of creators awaits! Explore personalized content, 
                  connect directly with creators, and be part of something special.
                </p>
                <div className="bg-secondary/10 p-4 rounded-lg mt-4">
                  <h4 className="font-semibold mb-2">What you'll love:</h4>
                  <ul className="text-sm space-y-2 text-left max-w-sm mx-auto">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-secondary" />
                      Personalized discovery feed
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-secondary" />
                      Direct access to creators
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-secondary" />
                      Exclusive content & experiences
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-secondary" />
                      Safe & secure platform
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Personalization */}
          {currentStep === 2 && (
            <div className="space-y-6" data-testid="step-personalization">
              <div className="text-center">
                <Sparkles className="w-16 h-16 mx-auto text-secondary mb-4" />
                <h3 className="font-display text-xl mb-2">What interests you?</h3>
                <p className="text-muted-foreground mb-4">
                  Select your interests to get a personalized feed
                </p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                {interests.map(interest => (
                  <Badge
                    key={interest}
                    variant={selectedInterests.includes(interest) ? "default" : "outline"}
                    className="cursor-pointer px-4 py-2 text-sm"
                    onClick={() => toggleInterest(interest)}
                    data-testid={`badge-interest-${interest.toLowerCase()}`}
                  >
                    {interest}
                  </Badge>
                ))}
              </div>
              <p className="text-center text-sm text-muted-foreground">
                Selected {selectedInterests.length} interests
              </p>
            </div>
          )}

          {/* Step 3: Payment Setup (Optional) */}
          {currentStep === 3 && (
            <div className="space-y-6" data-testid="step-payment">
              <div className="text-center">
                <CreditCard className="w-16 h-16 mx-auto text-secondary mb-4" />
                <h3 className="font-display text-xl mb-2">Payment Setup</h3>
                <p className="text-muted-foreground mb-4">
                  Add a payment method to tip or subscribe instantly (optional)
                </p>
              </div>
              <div className="bg-muted/50 p-6 rounded-lg space-y-4">
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4" />
                  <span>Bank-level encryption</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4" />
                  <span>Your privacy is protected</span>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => setPaymentSkipped(true)}
                  data-testid="button-skip-payment"
                >
                  Skip for now
                </Button>
                <Button className="w-full btn-secondary" data-testid="button-add-payment">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Add Payment Method
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Dashboard Intro */}
          {currentStep === 4 && (
            <div className="space-y-6" data-testid="step-dashboard">
              <div className="text-center">
                <Sparkles className="w-16 h-16 mx-auto text-secondary mb-4" />
                <h3 className="font-display text-2xl mb-2">You're All Set! 🎉</h3>
                <p className="text-muted-foreground mb-4">
                  Your personalized feed is ready. Here's how to get started:
                </p>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <Heart className="w-5 h-5 text-secondary mt-0.5" />
                  <div>
                    <h4 className="font-semibold">Discover Creators</h4>
                    <p className="text-sm text-muted-foreground">
                      Browse your personalized feed and find creators you love
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <Users className="w-5 h-5 text-secondary mt-0.5" />
                  <div>
                    <h4 className="font-semibold">Follow & Subscribe</h4>
                    <p className="text-sm text-muted-foreground">
                      Support creators and get access to exclusive content
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <Sparkles className="w-5 h-5 text-secondary mt-0.5" />
                  <div>
                    <h4 className="font-semibold">Engage & Connect</h4>
                    <p className="text-sm text-muted-foreground">
                      Like, comment, tip, and message your favorite creators
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          {currentStep < totalSteps ? (
            <Button
              onClick={handleNext}
              disabled={updateOnboardingMutation.isPending}
              data-testid="button-next"
            >
              {updateOnboardingMutation.isPending ? 'Saving...' : 'Next'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleComplete}
              disabled={completeOnboardingMutation.isPending}
              className="btn-secondary"
              data-testid="button-complete"
            >
              {completeOnboardingMutation.isPending ? 'Completing...' : 'Start Exploring'}
              <CheckCircle className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
