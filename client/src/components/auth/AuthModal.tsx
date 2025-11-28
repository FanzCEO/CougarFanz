import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, PawPrint, Shield, Eye, EyeOff } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'login' | 'register';
  onModeChange: (mode: 'login' | 'register') => void;
}

export default function AuthModal({ isOpen, onClose, mode, onModeChange }: AuthModalProps) {
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
    ageVerified: false,
  });

  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const response = await apiRequest('POST', '/api/auth/login', data);
      return response.json();
    },
    onSuccess: (data) => {
      localStorage.setItem('auth_token', data.token);
      toast({
        title: "Welcome back!",
        description: "Successfully logged in to your pack.",
      });
      window.location.reload(); // Refresh to update auth state
    },
    onError: (error) => {
      toast({
        title: "Login Failed",
        description: "Invalid email or password. Please try again.",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: { username: string; email: string; password: string }) => {
      const response = await apiRequest('POST', '/api/auth/register', data);
      if (!response.ok) {
        const errorData = await response.json();
        throw { status: response.status, ...errorData };
      }
      return response.json();
    },
    onSuccess: (data) => {
      localStorage.setItem('auth_token', data.token);
      toast({
        title: "Welcome to the pack!",
        description: "Account created successfully. Please complete age verification.",
      });
      window.location.reload(); // Refresh to update auth state
    },
    onError: (error: any) => {
      let title = "Registration Failed";
      let description = "Failed to create account. Please try again.";
      
      if (error?.status === 409) {
        if (error?.field === 'email') {
          title = "Email Already Registered";
          description = "This email is already registered. Please use a different email or try logging in.";
        } else if (error?.field === 'username') {
          title = "Username Taken";
          description = "This username is already taken. Please choose a different username.";
        }
      } else if (error?.message) {
        description = error.message;
      }
      
      toast({
        title,
        description,
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }
    loginMutation.mutate({
      email: formData.email,
      password: formData.password,
    });
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.username || !formData.email || !formData.password) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 8) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.agreeTerms) {
      toast({
        title: "Terms Required",
        description: "You must agree to the terms of service.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.ageVerified) {
      toast({
        title: "Age Verification Required",
        description: "You must confirm you are 18 or older.",
        variant: "destructive",
      });
      return;
    }

    registerMutation.mutate({
      username: formData.username,
      email: formData.email,
      password: formData.password,
    });
  };

  const handleReplitAuth = () => {
    window.location.href = '/api/login';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card border border-border">
        <DialogHeader>
          <DialogTitle className="text-center font-display">
            {mode === 'login' ? 'Welcome Back to Your Pack' : 'Join the Pack'}
          </DialogTitle>
          <DialogDescription className="text-center">
            {mode === 'login' 
              ? 'Sign in to continue your pack journey'
              : 'Create your account and start connecting with the community'
            }
          </DialogDescription>
        </DialogHeader>

        <Tabs value={mode} onValueChange={(value) => onModeChange(value as 'login' | 'register')}>
          <TabsList className="grid w-full grid-cols-2 bg-background">
            <TabsTrigger 
              value="login" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              data-testid="tab-login"
            >
              Sign In
            </TabsTrigger>
            <TabsTrigger 
              value="register"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              data-testid="tab-register"
            >
              Join Pack
            </TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="pup@example.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="form-input"
                  data-testid="input-login-email"
                />
              </div>

              <div>
                <Label htmlFor="login-password">Password</Label>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="form-input pr-10"
                    data-testid="input-login-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1"
                    onClick={() => setShowPassword(!showPassword)}
                    data-testid="button-toggle-password"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full btn-primary"
                disabled={loginMutation.isPending}
                data-testid="button-login-submit"
              >
                {loginMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            <div className="text-center">
              <Button variant="link" className="text-sm" data-testid="button-forgot-password">
                Forgot your password?
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="register" className="space-y-4">
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <Label htmlFor="register-username">Pack Name</Label>
                <Input
                  id="register-username"
                  type="text"
                  placeholder="YourPackName"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  className="form-input"
                  data-testid="input-register-username"
                />
              </div>

              <div>
                <Label htmlFor="register-email">Email</Label>
                <Input
                  id="register-email"
                  type="email"
                  placeholder="pup@example.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="form-input"
                  data-testid="input-register-email"
                />
              </div>

              <div>
                <Label htmlFor="register-password">Password</Label>
                <div className="relative">
                  <Input
                    id="register-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="form-input pr-10"
                    data-testid="input-register-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="register-confirm-password">Confirm Password</Label>
                <Input
                  id="register-confirm-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className="form-input"
                  data-testid="input-register-confirm-password"
                />
              </div>

              {/* Age Verification Notice */}
              <div className="flex items-center space-x-3 p-4 bg-warning/10 border border-warning/20 rounded-lg">
                <Shield className="h-5 w-5 text-warning flex-shrink-0" />
                <div className="text-sm">
                  <span className="font-medium">18+ Verification Required</span>
                  <p className="text-muted">You'll need to upload valid ID after registration</p>
                </div>
              </div>

              {/* Terms and Age Checkboxes */}
              <div className="space-y-3">
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="age-verify"
                    checked={formData.ageVerified}
                    onCheckedChange={(checked) => handleInputChange('ageVerified', checked)}
                    data-testid="checkbox-age-verified"
                  />
                  <Label htmlFor="age-verify" className="text-sm">
                    I confirm that I am 18 years of age or older
                  </Label>
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="agree-terms"
                    checked={formData.agreeTerms}
                    onCheckedChange={(checked) => handleInputChange('agreeTerms', checked)}
                    data-testid="checkbox-agree-terms"
                  />
                  <Label htmlFor="agree-terms" className="text-sm">
                    I agree to the{' '}
                    <a href="/terms" className="text-primary hover:underline">Terms of Service</a>
                    {' '}and{' '}
                    <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>
                  </Label>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full btn-primary"
                disabled={registerMutation.isPending}
                data-testid="button-register-submit"
              >
                {registerMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  'Join the Pack'
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        {/* Replit OAuth Alternative */}
        <div className="mt-6 pt-6 border-t border-border">
          <Button 
            variant="outline"
            className="w-full btn-secondary"
            onClick={handleReplitAuth}
            data-testid="button-replit-oauth"
          >
            <PawPrint className="mr-3 h-5 w-5" />
            Continue with Replit
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
