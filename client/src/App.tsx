import { Switch, Route } from "wouter";
import { useState } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/Landing";
import Home from "@/pages/Home";
import Dashboard from "@/pages/Dashboard";
import CreatorProfile from "@/pages/CreatorProfile";
import Discovery from "@/pages/Discovery";
import Messages from "@/pages/Messages";
import Settings from "@/pages/Settings";
import Wiki from "@/pages/Wiki";
import Support from "@/pages/Support";
import Tutorials from "@/pages/Tutorials";
import Achievements from "@/pages/Achievements";
import Moderation from "@/pages/Moderation";
import CreatorDashboard from "@/pages/CreatorDashboard";
import CreatorSignup from "@/pages/CreatorSignup";
import Packs from "@/pages/Packs";
import Live from "@/pages/Live";
import Safety from "@/pages/Safety";
import Guidelines from "@/pages/Guidelines";
import Report from "@/pages/Report";
import Terms from "@/pages/Terms";
import Privacy from "@/pages/Privacy";
import DMCA from "@/pages/DMCA";
import Compliance2257 from "@/pages/Compliance2257";
import NotFound from "@/pages/not-found";
import Navigation from "@/components/layout/Navigation";
import OnboardingWizard from "@/components/onboarding/OnboardingWizard";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {/* Landing page for unauthenticated users */}
      <Route path="/" component={isAuthenticated ? Home : Landing} />
      
      {/* Home route (authenticated) */}
      <Route path="/home" component={isAuthenticated ? Home : Landing} />
      
      {/* Discovery page (accessible to all users) */}
      <Route path="/discover" component={Discovery} />
      
      {/* Public pages */}
      <Route path="/creator-signup" component={CreatorSignup} />
      <Route path="/packs" component={Packs} />
      <Route path="/live" component={Live} />
      <Route path="/safety" component={Safety} />
      <Route path="/guidelines" component={Guidelines} />
      <Route path="/report" component={Report} />
      <Route path="/terms" component={Terms} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/dmca" component={DMCA} />
      <Route path="/2257" component={Compliance2257} />
      
      {/* Public help pages */}
      <Route path="/wiki" component={Wiki} />
      <Route path="/tutorials" component={Tutorials} />
      <Route path="/support" component={Support} />
      
      {/* Authenticated routes */}
      {isAuthenticated && (
        <>
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/creator-control" component={CreatorDashboard} />
          <Route path="/profile/:userId" component={CreatorProfile} />
          <Route path="/messages" component={Messages} />
          <Route path="/achievements" component={Achievements} />
          <Route path="/moderation" component={Moderation} />
          <Route path="/settings" component={Settings} />
        </>
      )}
      
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { isAuthenticated } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Fetch user data to check onboarding status
  const { data: user } = useQuery<any>({
    queryKey: ['/api/auth/user'],
    enabled: isAuthenticated,
  });

  // Show onboarding for authenticated users who haven't completed it
  const needsOnboarding = isAuthenticated && user && !user.onboardingCompleted;

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    // Refresh user data
    queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
  };
  
  return (
    <TooltipProvider>
        <div className="min-h-screen bg-moonyard text-foreground">
          <div className="relative z-10 flex">
            {(isAuthenticated || ['/wiki', '/tutorials', '/support'].some(path => window.location.pathname.startsWith(path))) && (
              <Navigation />
            )}
            <div className="flex-1 pb-[calc(4rem+env(safe-area-inset-bottom))] lg:pb-0">
              <Toaster />
              <Router />
            </div>
          </div>
        </div>

        {/* Onboarding Wizard */}
        {needsOnboarding && (
          <OnboardingWizard 
            isOpen={true} 
            onComplete={handleOnboardingComplete} 
          />
        )}
      </TooltipProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;
