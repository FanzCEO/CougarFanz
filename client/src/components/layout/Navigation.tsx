import { Link, useLocation } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { 
  Home, 
  Search, 
  MessageCircle, 
  Settings, 
  BarChart3, 
  HelpCircle,
  BookOpen,
  Ticket,
  Brain,
  Trophy,
  Shield,
  Menu
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function Navigation() {
  const [location] = useLocation();
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { path: "/", icon: Home, label: "Home", public: true },
    { path: "/discover", icon: Search, label: "Discover", public: true },
    { path: "/messages", icon: MessageCircle, label: "Messages", badge: "new" },
    { path: "/dashboard", icon: BarChart3, label: "Dashboard" },
    { path: "/achievements", icon: Trophy, label: "Achievements" },
    { path: "/moderation", icon: Shield, label: "Moderation" },
    { path: "/wiki", icon: Brain, label: "AI Wiki", public: true },
    { path: "/tutorials", icon: BookOpen, label: "Tutorials", public: true },
    { path: "/support", icon: HelpCircle, label: "Help", public: true },
    { path: "/tickets", icon: Ticket, label: "Support Tickets" },
    { path: "/settings", icon: Settings, label: "Settings" },
  ];

  // Mobile bottom nav items (most important 4-5)
  const mobileBottomItems = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/discover", icon: Search, label: "Discover" },
    { path: "/messages", icon: MessageCircle, label: "Messages", badge: "new" },
    { path: "/dashboard", icon: BarChart3, label: "Dashboard" },
    { path: "/settings", icon: Settings, label: "More" },
  ];

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  const NavContent = () => (
    <>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-foreground mb-2">
          FUN Empire
        </h2>
        <div className="flex flex-wrap gap-1 text-xs">
          <Badge variant="secondary" className="text-pink-400">GirlFanz</Badge>
          <Badge variant="secondary" className="text-green-400">CougarFanz</Badge>
          <Badge variant="secondary" className="text-amber-600">DaddyFanz</Badge>
        </div>
      </div>

      <div className="space-y-1">
        {navItems.map((item) => {
          const isPublic = item.public;
          const shouldShow = isPublic || user;
          
          if (!shouldShow) return null;

          return (
            <Link key={item.path} href={item.path}>
              <Button
                variant={isActive(item.path) ? "default" : "ghost"}
                className="w-full justify-start gap-2"
                onClick={() => setMobileOpen(false)}
                data-testid={`nav-${item.label.toLowerCase().replace(" ", "-")}`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
                {item.badge && (
                  <Badge variant="destructive" className="ml-auto text-xs">
                    {item.badge}
                  </Badge>
                )}
              </Button>
            </Link>
          );
        })}
      </div>

      {user && (
        <div className="pt-4 border-t border-border mt-4">
          <div className="text-sm text-muted-foreground">
            Logged in as <span className="font-medium">{(user as any)?.username || (user as any)?.email || 'User'}</span>
          </div>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Desktop Sidebar - Hidden on mobile */}
      <nav className="hidden lg:block bg-card border-r border-border h-full w-64 p-4 space-y-2">
        <NavContent />
      </nav>

      {/* Mobile Hamburger Menu */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="lg:hidden fixed top-4 left-4 z-[60] bg-card/80 backdrop-blur-sm"
            data-testid="button-mobile-menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-4">
          <NavContent />
        </SheetContent>
      </Sheet>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex justify-around items-center h-16 px-2">
          {mobileBottomItems.map((item) => {
            if (!user) return null;

            return (
              <Link key={item.path} href={item.path}>
                <button
                  className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                    isActive(item.path)
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  data-testid={`mobile-nav-${item.label.toLowerCase()}`}
                >
                  <div className="relative">
                    <item.icon className="h-5 w-5" />
                    {item.badge && (
                      <span className="absolute -top-1 -right-1 h-2 w-2 bg-destructive rounded-full" />
                    )}
                  </div>
                  <span className="text-xs font-medium">{item.label}</span>
                </button>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
