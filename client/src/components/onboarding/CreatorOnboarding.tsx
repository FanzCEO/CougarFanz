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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { 
  Star, Upload, Shield, DollarSign, Sparkles, 
  ArrowRight, ArrowLeft, CheckCircle 
} from "lucide-react";

interface CreatorOnboardingProps {
  isOpen: boolean;
  onComplete: () => void;
}

export default function CreatorOnboarding({ isOpen, onComplete }: CreatorOnboardingProps) {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;

  const [formData, setFormData] = useState({
    displayName: '',
    stageName: '',
    pronouns: '',
    bio: '',
    niche: [] as string[],
    paymentMethod: '',
  });

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
        title: "Welcome to the creator community! 🎉",
        description: "Your profile is all set. Let's start creating!",
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
    updateOnboardingMutation.mutate({
      step: currentStep,
      data: formData,
    });

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
    updateOnboardingMutation.mutate({
      step: currentStep,
      data: formData,
    });
    setTimeout(() => {
      completeOnboardingMutation.mutate();
    }, 500);
  };

  const progress = (currentStep / totalSteps) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-2xl bg-card border border-border" data-testid="dialog-creator-onboarding">
        <DialogHeader>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Star className="w-6 h-6 text-primary" />
            <DialogTitle className="font-display text-2xl">Creator Onboarding</DialogTitle>
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
                <Sparkles className="w-16 h-16 mx-auto text-primary" />
                <h3 className="font-display text-2xl">Claim Your Star Power! ⭐</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  You're joining a creator-first platform where you keep 100% of your earnings, 
                  own all your content, and get the tools you need to succeed.
                </p>
                <div className="bg-primary/10 p-4 rounded-lg mt-4">
                  <h4 className="font-semibold mb-2">What you'll get:</h4>
                  <ul className="text-sm space-y-2 text-left max-w-sm mx-auto">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      100% earnings (you keep everything)
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      Full content ownership
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      Advanced creator dashboard
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      Direct fan engagement tools
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Profile Setup */}
          {currentStep === 2 && (
            <div className="space-y-4" data-testid="step-profile">
              <h3 className="font-display text-xl text-center mb-4">Let's set up your profile</h3>
              <div>
                <Label htmlFor="displayName">Display Name *</Label>
                <Input
                  id="displayName"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  placeholder="Your name"
                  data-testid="input-display-name"
                />
              </div>
              <div>
                <Label htmlFor="stageName">Stage Name</Label>
                <Input
                  id="stageName"
                  value={formData.stageName}
                  onChange={(e) => setFormData({ ...formData, stageName: e.target.value })}
                  placeholder="Your creator/artist name (optional)"
                  data-testid="input-stage-name"
                />
              </div>
              <div>
                <Label htmlFor="pronouns">Pronouns</Label>
                <Input
                  id="pronouns"
                  value={formData.pronouns}
                  onChange={(e) => setFormData({ ...formData, pronouns: e.target.value })}
                  placeholder="e.g., she/her, he/him, they/them"
                  data-testid="input-pronouns"
                />
              </div>
              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Tell your fans about yourself..."
                  rows={4}
                  data-testid="textarea-bio"
                />
              </div>
            </div>
          )}

          {/* Step 3: Verification */}
          {currentStep === 3 && (
            <div className="space-y-6" data-testid="step-verification">
              <div className="text-center">
                <Shield className="w-16 h-16 mx-auto text-primary mb-4" />
                <h3 className="font-display text-xl mb-2">Verification & Compliance</h3>
                <p className="text-muted-foreground mb-4">
                  To ensure safety and compliance, we need to verify your identity
                </p>
              </div>
              <div className="bg-muted/50 p-6 rounded-lg space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-semibold">1</span>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">ID Verification</h4>
                    <p className="text-sm text-muted-foreground">
                      Upload a valid government ID (seamless photo + selfie match)
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-semibold">2</span>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Age/Consent Forms</h4>
                    <p className="text-sm text-muted-foreground">
                      Complete required consent forms (clear + supportive guidance)
                    </p>
                  </div>
                </div>
                <Button className="w-full mt-4" variant="outline" data-testid="button-start-verification">
                  <Upload className="w-4 h-4 mr-2" />
                  Start Verification Process
                </Button>
                <p className="text-xs text-center text-muted-foreground mt-2">
                  You can complete this step later from your dashboard
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Monetization */}
          {currentStep === 4 && (
            <div className="space-y-6" data-testid="step-monetization">
              <div className="text-center">
                <DollarSign className="w-16 h-16 mx-auto text-primary mb-4" />
                <h3 className="font-display text-xl mb-2">Monetization Setup</h3>
                <p className="text-muted-foreground mb-4">
                  Set up how you'll receive your earnings
                </p>
              </div>
              <div className="bg-primary/10 p-4 rounded-lg mb-4">
                <p className="text-center font-semibold">
                  100% of your earnings go directly to you!
                </p>
              </div>
              <div>
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <select
                  id="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  data-testid="select-payment-method"
                >
                  <option value="">Select payment method...</option>
                  <option value="bank">Bank Transfer</option>
                  <option value="crypto">Cryptocurrency</option>
                  <option value="other">Other (Setup later)</option>
                </select>
              </div>
              <p className="text-xs text-center text-muted-foreground">
                You can update payment details anytime from settings
              </p>
            </div>
          )}

          {/* Step 5: Dashboard Intro */}
          {currentStep === 5 && (
            <div className="space-y-6" data-testid="step-dashboard">
              <div className="text-center">
                <Sparkles className="w-16 h-16 mx-auto text-primary mb-4" />
                <h3 className="font-display text-2xl mb-2">You're All Set! 🎉</h3>
                <p className="text-muted-foreground mb-4">
                  Your creator dashboard is ready. Here's what you can do:
                </p>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <Upload className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-semibold">Upload Content</h4>
                    <p className="text-sm text-muted-foreground">
                      Share photos, videos, and go live with your fans
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <DollarSign className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-semibold">Set Your Prices</h4>
                    <p className="text-sm text-muted-foreground">
                      Control subscriptions, tips, and exclusive content pricing
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <Star className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-semibold">Engage Your Pack</h4>
                    <p className="text-sm text-muted-foreground">
                      Chat with fans, respond to messages, and build your community
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
              className="btn-primary"
              data-testid="button-complete"
            >
              {completeOnboardingMutation.isPending ? 'Completing...' : 'Complete Setup'}
              <CheckCircle className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
