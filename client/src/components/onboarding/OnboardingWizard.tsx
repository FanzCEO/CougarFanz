import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import { Card } from "@/components/ui/card";
import { Star, Users, Sparkles, Heart } from "lucide-react";
import CreatorOnboarding from "./CreatorOnboarding";
import FanzOnboarding from "./FanzOnboarding";

interface OnboardingWizardProps {
  isOpen: boolean;
  onComplete: () => void;
}

export default function OnboardingWizard({ isOpen, onComplete }: OnboardingWizardProps) {
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState<'creator' | 'fan' | null>(null);

  // Fetch current user to check onboarding status
  const { data: user } = useQuery<any>({
    queryKey: ['/api/auth/user'],
    enabled: isOpen,
  });

  const selectRoleMutation = useMutation({
    mutationFn: async (role: 'creator' | 'fan') => {
      const response = await apiRequest('POST', '/api/onboarding/select-role', { role });
      return response.json();
    },
    onSuccess: (data) => {
      setSelectedRole(data.role);
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to select role. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleRoleSelect = (role: 'creator' | 'fan') => {
    selectRoleMutation.mutate(role);
  };

  // If user already completed onboarding or has a role selected
  useEffect(() => {
    if (user?.onboardingCompleted) {
      onComplete();
    } else if (user?.role && user?.role !== 'admin') {
      setSelectedRole(user.role as 'creator' | 'fan');
    }
  }, [user, onComplete]);

  // Role selection screen
  if (!selectedRole) {
    return (
      <Dialog open={isOpen} onOpenChange={() => {}}>
        <DialogContent className="max-w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto bg-card border border-border p-4 sm:p-6" data-testid="dialog-role-selection">
          <DialogHeader>
            <DialogTitle className="text-center font-display text-xl sm:text-2xl md:text-3xl">
              Welcome to the FUN Empire! 🎉
            </DialogTitle>
            <DialogDescription className="text-center text-sm sm:text-base md:text-lg mt-2">
              Choose your path and start your journey
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mt-4 sm:mt-6">
            {/* Creator Path */}
            <Card 
              className="p-6 cursor-pointer border-2 hover:border-primary transition-all hover:scale-105"
              onClick={() => handleRoleSelect('creator')}
              data-testid="card-select-creator"
            >
              <div className="text-center space-y-4">
                <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                  <Star className="w-10 h-10 text-primary" />
                </div>
                <h3 className="font-display text-2xl">I'm a Creator</h3>
                <p className="text-muted-foreground">
                  Claim your star power and build your empire
                </p>
                <ul className="text-sm space-y-2 text-left">
                  <li className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    100% of your earnings
                  </li>
                  <li className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    Full content ownership
                  </li>
                  <li className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    Advanced creator tools
                  </li>
                  <li className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    Community support
                  </li>
                </ul>
                <Button className="w-full btn-primary" disabled={selectRoleMutation.isPending}>
                  {selectRoleMutation.isPending ? 'Selecting...' : 'Claim Your Star Power →'}
                </Button>
              </div>
            </Card>

            {/* Fanz Path */}
            <Card 
              className="p-6 cursor-pointer border-2 hover:border-primary transition-all hover:scale-105"
              onClick={() => handleRoleSelect('fan')}
              data-testid="card-select-fanz"
            >
              <div className="text-center space-y-4">
                <div className="w-20 h-20 mx-auto bg-secondary/10 rounded-full flex items-center justify-center">
                  <Users className="w-10 h-10 text-secondary" />
                </div>
                <h3 className="font-display text-2xl">I'm a Fanz</h3>
                <p className="text-muted-foreground">
                  Discover, connect, and support your favorite creators
                </p>
                <ul className="text-sm space-y-2 text-left">
                  <li className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-secondary" />
                    Personalized discovery feed
                  </li>
                  <li className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-secondary" />
                    Direct creator access
                  </li>
                  <li className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-secondary" />
                    Exclusive content
                  </li>
                  <li className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-secondary" />
                    Safe & secure platform
                  </li>
                </ul>
                <Button className="w-full btn-secondary" disabled={selectRoleMutation.isPending}>
                  {selectRoleMutation.isPending ? 'Selecting...' : 'Start Discovering →'}
                </Button>
              </div>
            </Card>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-4">
            Single account system - you can upgrade from Fanz to Creator anytime
          </p>
        </DialogContent>
      </Dialog>
    );
  }

  // Show appropriate onboarding flow based on selected role
  if (selectedRole === 'creator') {
    return <CreatorOnboarding isOpen={isOpen} onComplete={onComplete} />;
  }

  if (selectedRole === 'fan') {
    return <FanzOnboarding isOpen={isOpen} onComplete={onComplete} />;
  }

  return null;
}
