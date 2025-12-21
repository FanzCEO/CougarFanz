import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Check, Shield, Eye, Lock, FileText, AlertTriangle } from "lucide-react";

export default function FanSignup() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const totalSteps = 3;

  // Step 1: Account Info
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");

  // Step 2: Policy Agreements
  const [ageVerification, setAgeVerification] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [contentWarning, setContentWarning] = useState(false);
  const [noRedistribution, setNoRedistribution] = useState(false);
  const [respectCreators, setRespectCreators] = useState(false);

  // Step 3: Preferences
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);

  const registerMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/auth/register", data);
      return await res.json();
    },
    onSuccess: (user: any) => {
      queryClient.setQueryData(["/api/auth/user"], user);
      toast({
        title: "Welcome to CougarFanz!",
        description: "Your account has been created successfully.",
      });
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const calculateAge = (dob: string): number => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const validateStep1 = () => {
    if (!email || !password || !confirmPassword || !username || !dateOfBirth) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return false;
    }
    if (password !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return false;
    }
    if (password.length < 8) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 8 characters.",
        variant: "destructive",
      });
      return false;
    }
    const age = calculateAge(dateOfBirth);
    if (age < 18) {
      toast({
        title: "Age Requirement",
        description: "You must be 18 years or older to create an account.",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!ageVerification || !termsAccepted || !privacyAccepted || !contentWarning || !noRedistribution || !respectCreators) {
      toast({
        title: "Agreement Required",
        description: "You must accept all policies to continue.",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = () => {
    registerMutation.mutate({
      email,
      password,
      username,
      role: "fan",
      dateOfBirth,
      agreements: {
        ageVerification: true,
        termsAccepted: true,
        privacyAccepted: true,
        contentWarning: true,
        noRedistribution: true,
        respectCreators: true,
        agreedAt: new Date().toISOString(),
      },
      preferences: {
        emailNotifications,
        marketingEmails,
      },
    });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl glass-card">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-display neon-text">
            Join CougarFanz
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Create your fan account to connect with mature creators
          </CardDescription>

          {/* Progress indicator */}
          <div className="flex justify-center gap-2 mt-6">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-2 w-16 rounded-full transition-all ${
                  s <= step ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Step {step} of {totalSteps}:{" "}
            {step === 1 && "Account Information"}
            {step === 2 && "Policy Agreements"}
            {step === 3 && "Preferences"}
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Step 1: Account Information */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary mb-4">
                <Shield className="w-5 h-5" />
                <span className="font-semibold">Account Information</span>
              </div>

              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="club-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Username *</Label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Choose a username"
                    className="club-input"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 8 characters"
                      className="club-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm password"
                      className="club-input"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dob">Date of Birth *</Label>
                  <Input
                    id="dob"
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="club-input"
                    max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                  />
                  <p className="text-xs text-muted-foreground">
                    You must be 18 years or older to use this platform.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Policy Agreements */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary mb-4">
                <FileText className="w-5 h-5" />
                <span className="font-semibold">Policy Agreements</span>
              </div>

              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-destructive">Adult Content Warning</h4>
                    <p className="text-sm text-muted-foreground">
                      CougarFanz contains explicit adult content intended only for adults 18 years of age or older.
                      By creating an account, you confirm you are legally allowed to view such content in your jurisdiction.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {/* Age Verification */}
                <div className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:border-primary/50 transition-colors">
                  <Checkbox
                    id="ageVerification"
                    checked={ageVerification}
                    onCheckedChange={(checked) => setAgeVerification(checked as boolean)}
                  />
                  <div className="space-y-1">
                    <Label htmlFor="ageVerification" className="font-medium cursor-pointer">
                      Age Verification *
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      I confirm that I am at least 18 years of age and legally permitted to view adult content
                      in my jurisdiction. I understand that CougarFanz contains sexually explicit material.
                    </p>
                  </div>
                </div>

                {/* Terms of Service */}
                <div className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:border-primary/50 transition-colors">
                  <Checkbox
                    id="termsAccepted"
                    checked={termsAccepted}
                    onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                  />
                  <div className="space-y-1">
                    <Label htmlFor="termsAccepted" className="font-medium cursor-pointer">
                      Terms of Service *
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      I have read and agree to the{" "}
                      <a href="/terms" className="text-primary hover:underline" target="_blank">
                        Terms of Service
                      </a>
                      , including the acceptable use policy and community guidelines.
                    </p>
                  </div>
                </div>

                {/* Privacy Policy */}
                <div className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:border-primary/50 transition-colors">
                  <Checkbox
                    id="privacyAccepted"
                    checked={privacyAccepted}
                    onCheckedChange={(checked) => setPrivacyAccepted(checked as boolean)}
                  />
                  <div className="space-y-1">
                    <Label htmlFor="privacyAccepted" className="font-medium cursor-pointer">
                      Privacy Policy *
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      I have read and agree to the{" "}
                      <a href="/privacy" className="text-primary hover:underline" target="_blank">
                        Privacy Policy
                      </a>
                      . I understand how my personal data will be collected, used, and protected.
                    </p>
                  </div>
                </div>

                {/* Content Warning */}
                <div className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:border-primary/50 transition-colors">
                  <Checkbox
                    id="contentWarning"
                    checked={contentWarning}
                    onCheckedChange={(checked) => setContentWarning(checked as boolean)}
                  />
                  <div className="space-y-1">
                    <Label htmlFor="contentWarning" className="font-medium cursor-pointer flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      Content Acknowledgment *
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      I understand that I may view sexually explicit content created by adult performers.
                      I take full responsibility for any content I choose to access on this platform.
                    </p>
                  </div>
                </div>

                {/* No Redistribution */}
                <div className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:border-primary/50 transition-colors">
                  <Checkbox
                    id="noRedistribution"
                    checked={noRedistribution}
                    onCheckedChange={(checked) => setNoRedistribution(checked as boolean)}
                  />
                  <div className="space-y-1">
                    <Label htmlFor="noRedistribution" className="font-medium cursor-pointer flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      No Redistribution Agreement *
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      I agree NOT to download, screenshot, record, or redistribute any content from this platform
                      without explicit written permission from the creator. I understand that violation may result
                      in legal action and permanent account termination.
                    </p>
                  </div>
                </div>

                {/* Respect Creators */}
                <div className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:border-primary/50 transition-colors">
                  <Checkbox
                    id="respectCreators"
                    checked={respectCreators}
                    onCheckedChange={(checked) => setRespectCreators(checked as boolean)}
                  />
                  <div className="space-y-1">
                    <Label htmlFor="respectCreators" className="font-medium cursor-pointer">
                      Creator Respect Policy *
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      I agree to treat all creators with respect. I will not engage in harassment, hate speech,
                      or abusive behavior. I understand that creators have the right to block users and that
                      violations will result in account suspension.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Preferences */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary mb-4">
                <Check className="w-5 h-5" />
                <span className="font-semibold">Final Step - Preferences</span>
              </div>

              <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-primary">Almost Done!</h4>
                <p className="text-sm text-muted-foreground">
                  Set your communication preferences below, then click "Create Account" to complete your registration.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:border-primary/50 transition-colors">
                  <Checkbox
                    id="emailNotifications"
                    checked={emailNotifications}
                    onCheckedChange={(checked) => setEmailNotifications(checked as boolean)}
                  />
                  <div className="space-y-1">
                    <Label htmlFor="emailNotifications" className="font-medium cursor-pointer">
                      Email Notifications
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications about new content from creators you subscribe to, messages, and important account updates.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:border-primary/50 transition-colors">
                  <Checkbox
                    id="marketingEmails"
                    checked={marketingEmails}
                    onCheckedChange={(checked) => setMarketingEmails(checked as boolean)}
                  />
                  <div className="space-y-1">
                    <Label htmlFor="marketingEmails" className="font-medium cursor-pointer">
                      Promotional Emails
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Receive occasional emails about special offers, new features, and platform updates.
                    </p>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="mt-6 p-4 rounded-lg bg-muted/50 border border-border">
                <h4 className="font-semibold mb-2">Account Summary</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Email:</span>
                  <span>{email}</span>
                  <span className="text-muted-foreground">Username:</span>
                  <span>{username}</span>
                  <span className="text-muted-foreground">Account Type:</span>
                  <span>Fan Account</span>
                  <span className="text-muted-foreground">Policies Accepted:</span>
                  <span className="text-green-500">All Required ✓</span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex justify-between pt-4">
            {step > 1 ? (
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                className="neon-button"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            ) : (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setLocation("/")}
              >
                Cancel
              </Button>
            )}

            {step < totalSteps ? (
              <Button
                type="button"
                onClick={handleNext}
                className="neon-button"
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={registerMutation.isPending}
                className="neon-button bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {registerMutation.isPending ? "Creating Account..." : "Create Account"}
                <Check className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>

          {/* Login link */}
          <div className="text-center pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <a href="/login" className="text-primary hover:underline">
                Sign in
              </a>
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Want to create content?{" "}
              <a href="/creator-signup" className="text-primary hover:underline">
                Apply as a Creator
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
