import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUserPacks } from "@/hooks/usePacks";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { 
  PawPrint, 
  Search, 
  MessageCircle, 
  User, 
  Settings, 
  LogOut,
  Bell,
  Menu,
  X,
  Star,
  Shield,
  Heart
} from "lucide-react";
import { Link, useLocation } from "wouter";
import pupfanzLogo from "@/assets/pupfanz-logo.jpeg";

interface HeaderProps {
  onAuthClick?: (mode: 'login' | 'register') => void;
}

export default function Header({ onAuthClick }: HeaderProps) {
  const { user, isAuthenticated } = useAuth();
  const { data: userPacks } = useUserPacks(user?.id);
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Get the first pack name for display (user's primary pack)
  const primaryPack = userPacks && userPacks.length > 0 ? userPacks[0] : null;

  const navigation = [
    { name: 'Discover', href: '/discover', icon: Star },
    { name: 'Packs', href: '/packs', icon: Heart },
    { name: 'Safety', href: '/safety', icon: Shield },
    { name: 'Support', href: '/support', icon: MessageCircle },
  ];

  const handleLogout = () => {
    window.location.href = '/api/logout';
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 md:h-24 lg:h-32">
          {/* Logo - Responsive sizing */}
          <Link href="/" className="flex items-center space-x-3 group">
            <img 
              src={pupfanzLogo} 
              alt="PupFanz Logo" 
              className="h-12 sm:h-16 md:h-20 lg:h-28 w-auto group-hover:shadow-volt-glow transition-all duration-200 rounded-lg"
              data-testid="logo-header"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`text-muted hover:text-foreground transition-colors ${
                  location === item.href ? 'text-foreground' : ''
                }`}
                data-testid={`nav-${item.name.toLowerCase()}`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Search Bar (Desktop) */}
          <div className="hidden lg:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted" />
              <input
                type="text"
                placeholder="Search creators, packs..."
                className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-foreground"
                data-testid="input-search"
              />
            </div>
          </div>

          {/* Auth Controls */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {isAuthenticated ? (
              <>
                {/* Notifications - Hidden on small mobile */}
                <Button variant="ghost" size="sm" className="relative hidden sm:flex" data-testid="button-notifications">
                  <Bell className="h-5 w-5" />
                  <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 text-xs bg-primary text-primary-foreground">
                    3
                  </Badge>
                </Button>

                {/* Messages - Hidden on small mobile */}
                <Link href="/messages" className="hidden sm:block">
                  <Button variant="ghost" size="sm" className="relative" data-testid="button-messages">
                    <MessageCircle className="h-5 w-5" />
                  </Button>
                </Link>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full" data-testid="button-user-menu">
                      <Avatar className="h-8 w-8 border border-primary/30">
                        <AvatarImage src={user?.profileImageUrl} alt={user?.username} />
                        <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                          {user?.username?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium leading-none">{user?.username}</p>
                          {primaryPack && (
                            <Badge variant="outline" className="text-[10px] px-1 py-0" data-testid="user-pack-badge">
                              {primaryPack.name}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs leading-none text-muted">{user?.email}</p>
                        <div className="flex items-center space-x-1 pt-1">
                          <Badge className="safety-badge safety-badge-verified text-xs">Verified</Badge>
                          <Badge variant="outline" className="text-xs">{user?.role}</Badge>
                        </div>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href={`/profile/${user?.id}`} className="w-full" data-testid="menu-profile">
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    {user?.role === 'creator' && (
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard" className="w-full" data-testid="menu-dashboard">
                          <Star className="mr-2 h-4 w-4" />
                          <span>Dashboard</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                      <Link href="/settings" className="w-full" data-testid="menu-settings">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-destructive" data-testid="menu-logout">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button 
                  variant="ghost"
                  size="sm"
                  className="hidden sm:flex"
                  onClick={() => onAuthClick?.('login')}
                  data-testid="button-sign-in"
                >
                  Sign In
                </Button>
                <Button 
                  className="btn-primary text-sm sm:text-base px-3 sm:px-4"
                  size="sm"
                  onClick={() => onAuthClick?.('register')}
                  data-testid="button-join-pack"
                >
                  <span className="hidden sm:inline">Join Pack</span>
                  <span className="sm:hidden">Join</span>
                </Button>
              </>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            {/* Mobile Search */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted" />
                <input
                  type="text"
                  placeholder="Search creators, packs..."
                  className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-foreground"
                  data-testid="input-mobile-search"
                />
              </div>
            </div>

            {/* Mobile Navigation */}
            <nav className="space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-muted hover:text-foreground hover:bg-card/50 transition-colors ${
                    location === item.href ? 'text-foreground bg-card/50' : ''
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  data-testid={`mobile-nav-${item.name.toLowerCase()}`}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              ))}
            </nav>

            {/* Mobile Auth (if not authenticated) */}
            {!isAuthenticated && (
              <div className="mt-4 space-y-2">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start"
                  onClick={() => {
                    onAuthClick?.('login');
                    setIsMobileMenuOpen(false);
                  }}
                  data-testid="button-mobile-sign-in"
                >
                  Sign In
                </Button>
                <Button 
                  className="w-full btn-primary"
                  onClick={() => {
                    onAuthClick?.('register');
                    setIsMobileMenuOpen(false);
                  }}
                  data-testid="button-mobile-join-pack"
                >
                  Join Pack
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
