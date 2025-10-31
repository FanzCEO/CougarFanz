import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { ObjectUploader } from "@/components/ObjectUploader";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AgeVerification from "@/components/safety/AgeVerification";
import ConsentManagement from "@/components/safety/ConsentManagement";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Settings as SettingsIcon, 
  User, 
  Shield, 
  Bell, 
  CreditCard,
  Lock,
  Eye,
  Upload,
  Trash2,
  Save,
  Camera
} from "lucide-react";

export default function Settings() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("profile");

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    displayName: "",
    bio: "",
    packType: "",
    isAftercareFriendly: false,
    allowsFreeAccess: false,
    avatarUrl: "",
    bannerUrl: "",
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, toast]);

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['/api/profile', user?.id],
    enabled: isAuthenticated && !!user?.id,
  });

  const { data: consents } = useQuery({
    queryKey: ['/api/consent'],
    enabled: isAuthenticated,
  });

  // Update form when profile loads
  useEffect(() => {
    if (profile?.profile) {
      setProfileForm({
        displayName: profile.profile.displayName || "",
        bio: profile.profile.bio || "",
        packType: profile.profile.packType || "",
        isAftercareFriendly: profile.profile.isAftercareFriendly || false,
        allowsFreeAccess: profile.profile.allowsFreeAccess || false,
        avatarUrl: profile.profile.avatarUrl || "",
        bannerUrl: profile.profile.bannerUrl || "",
      });
    }
  }, [profile]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest('PUT', '/api/profile', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
      toast({
        title: "Success!",
        description: "Profile updated successfully!",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(profileForm);
  };

  const handleInputChange = (field: string, value: any) => {
    setProfileForm(prev => ({ ...prev, [field]: value }));
  };

  // Handle file upload completion
  const handleUploadComplete = async (result: any, type: 'avatar' | 'banner') => {
    if (result.successful && result.successful.length > 0) {
      try {
        const uploadedFile = result.successful[0];
        const response = await apiRequest('PUT', '/api/media-upload', {
          mediaUrl: uploadedFile.uploadURL
        }) as { objectPath: string };
        
        const objectPath = response.objectPath;
        
        // Update form with new image URL
        setProfileForm(prev => ({
          ...prev,
          [type === 'avatar' ? 'avatarUrl' : 'bannerUrl']: objectPath
        }));
        
        toast({
          title: "Upload Successful!",
          description: `${type === 'avatar' ? 'Avatar' : 'Banner'} uploaded successfully!`,
        });
      } catch (error) {
        console.error('Error finalizing upload:', error);
        toast({
          title: "Upload Error",
          description: "Failed to finalize upload. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  // Get upload parameters for ObjectUploader
  const getUploadParameters = async () => {
    try {
      const response = await apiRequest('POST', '/api/objects/upload');
      const data = await response.json();
      return {
        method: 'PUT' as const,
        url: data.uploadURL,
      };
    } catch (error) {
      console.error('Error getting upload parameters:', error);
      throw error;
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="pt-40 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="neon-heading text-3xl mb-2">
              Pack
              <span className="neon-text-accent ml-2">Settings</span>
            </h1>
            <p className="text-muted">Manage your profile, safety settings, and preferences</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5 bg-card border border-border">
              <TabsTrigger value="profile" data-testid="tab-profile">
                <User className="h-4 w-4 mr-2" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="safety" data-testid="tab-safety">
                <Shield className="h-4 w-4 mr-2" />
                Safety
              </TabsTrigger>
              <TabsTrigger value="notifications" data-testid="tab-notifications">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="privacy" data-testid="tab-privacy">
                <Eye className="h-4 w-4 mr-2" />
                Privacy
              </TabsTrigger>
              <TabsTrigger value="account" data-testid="tab-account">
                <Lock className="h-4 w-4 mr-2" />
                Account
              </TabsTrigger>
            </TabsList>

            {/* Profile Settings */}
            <TabsContent value="profile" className="space-y-6">
              <Card className="pack-card">
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleProfileSubmit} className="space-y-6">
                    {/* Avatar Section */}
                    <div className="flex items-center space-x-6">
                      <Avatar className="w-20 h-20 border-2 border-primary/30">
                        <AvatarImage src={profileForm.avatarUrl || profile?.profileImageUrl} />
                        <AvatarFallback className="text-xl">
                          {(profileForm.displayName || user?.username)?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <ObjectUploader
                          maxNumberOfFiles={1}
                          maxFileSize={5 * 1024 * 1024} // 5MB
                          onGetUploadParameters={getUploadParameters}
                          onComplete={(result) => handleUploadComplete(result, 'avatar')}
                          buttonClassName="btn-outline"
                        >
                          <Camera className="h-4 w-4 mr-2" />
                          Upload New Avatar
                        </ObjectUploader>
                        <p className="text-sm text-muted mt-2">JPG, PNG up to 5MB</p>
                      </div>
                    </div>

                    {/* Banner Section */}
                    <div className="space-y-3">
                      <Label>Profile Banner</Label>
                      <div className="relative h-32 bg-moonyard rounded-lg overflow-hidden border-2 border-dashed border-border">
                        {profileForm.bannerUrl ? (
                          <img 
                            src={profileForm.bannerUrl} 
                            alt="Profile banner"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-muted">
                            <div className="text-center">
                              <Upload className="h-8 w-8 mx-auto mb-2" />
                              <p>Upload a banner image</p>
                            </div>
                          </div>
                        )}
                        <div className="absolute bottom-3 right-3">
                          <ObjectUploader
                            maxNumberOfFiles={1}
                            maxFileSize={10 * 1024 * 1024} // 10MB for banners
                            onGetUploadParameters={getUploadParameters}
                            onComplete={(result) => handleUploadComplete(result, 'banner')}
                            buttonClassName="btn-outline btn-sm"
                          >
                            <Camera className="h-4 w-4 mr-2" />
                            Upload Banner
                          </ObjectUploader>
                        </div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="displayName">Display Name</Label>
                        <Input
                          id="displayName"
                          value={profileForm.displayName}
                          onChange={(e) => handleInputChange('displayName', e.target.value)}
                          placeholder="Your pack name"
                          className="form-input"
                          data-testid="input-display-name"
                        />
                      </div>

                      <div>
                        <Label htmlFor="packType">Pack Type</Label>
                        <Select 
                          value={profileForm.packType} 
                          onValueChange={(value) => handleInputChange('packType', value)}
                        >
                          <SelectTrigger className="form-select" data-testid="select-pack-type">
                            <SelectValue placeholder="Select your pack type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="alpha">Alpha Leader</SelectItem>
                            <SelectItem value="playful">Playful Pup</SelectItem>
                            <SelectItem value="supportive">Supportive Pack</SelectItem>
                            <SelectItem value="training">Training Focus</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        value={profileForm.bio}
                        onChange={(e) => handleInputChange('bio', e.target.value)}
                        placeholder="Tell your pack about yourself..."
                        rows={4}
                        className="form-textarea"
                        data-testid="textarea-bio"
                      />
                    </div>

                    <div className="flex items-center space-x-3">
                      <Switch
                        id="aftercare"
                        checked={profileForm.isAftercareFriendly}
                        onCheckedChange={(checked) => handleInputChange('isAftercareFriendly', checked)}
                        data-testid="switch-aftercare"
                      />
                      <div>
                        <Label htmlFor="aftercare" className="font-medium">Aftercare-Friendly</Label>
                        <p className="text-sm text-muted">Show that you prioritize aftercare in your content</p>
                      </div>
                    </div>

                    {user?.role === 'creator' && (
                      <div className="flex items-center space-x-3">
                        <Switch
                          id="freeAccess"
                          checked={profileForm.allowsFreeAccess}
                          onCheckedChange={(checked) => handleInputChange('allowsFreeAccess', checked)}
                          data-testid="switch-free-access"
                        />
                        <div>
                          <Label htmlFor="freeAccess" className="font-medium">Allow Free Preview Access</Label>
                          <p className="text-sm text-muted">Allow age-verified fans to preview your content for free (requires VerifyMy age verification)</p>
                        </div>
                      </div>
                    )}

                    <Button 
                      type="submit" 
                      className="btn-primary"
                      disabled={updateProfileMutation.isPending}
                      data-testid="button-save-profile"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Current Status */}
              <Card className="pack-card">
                <CardHeader>
                  <CardTitle>Pack Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Age Verification</span>
                      <Badge className={profile?.profile?.ageVerified ? "safety-badge-verified" : "bg-warning/20 text-warning"}>
                        {profile?.profile?.ageVerified ? "Verified" : "Pending"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>KYC Status</span>
                      <Badge className={profile?.profile?.kycStatus === 'verified' ? "safety-badge-consent" : "bg-warning/20 text-warning"}>
                        {profile?.profile?.kycStatus || "Pending"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Account Type</span>
                      <Badge variant="outline">{user?.role || "Fan"}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Safety Settings */}
            <TabsContent value="safety" className="space-y-6">
              <AgeVerification />
              <ConsentManagement />
              
              <Card className="pack-card">
                <CardHeader>
                  <CardTitle>Content Safety</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Content Warnings</p>
                      <p className="text-sm text-muted">Automatically add content warnings to uploads</p>
                    </div>
                    <Switch defaultChecked data-testid="switch-content-warnings" />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Safe Mode</p>
                      <p className="text-sm text-muted">Filter potentially sensitive content</p>
                    </div>
                    <Switch data-testid="switch-safe-mode" />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notifications */}
            <TabsContent value="notifications" className="space-y-6">
              <Card className="pack-card">
                <CardHeader>
                  <CardTitle>Pack Notifications</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">New Pack Members</p>
                      <p className="text-sm text-muted">Get notified when someone joins your pack</p>
                    </div>
                    <Switch defaultChecked data-testid="switch-new-members" />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Tips & Payments</p>
                      <p className="text-sm text-muted">Notifications for tips and subscription payments</p>
                    </div>
                    <Switch defaultChecked data-testid="switch-payments" />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Messages</p>
                      <p className="text-sm text-muted">New message notifications</p>
                    </div>
                    <Switch defaultChecked data-testid="switch-messages" />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Content Updates</p>
                      <p className="text-sm text-muted">Notifications when creators you follow post new content</p>
                    </div>
                    <Switch defaultChecked data-testid="switch-content-updates" />
                  </div>
                </CardContent>
              </Card>

              <Card className="pack-card">
                <CardHeader>
                  <CardTitle>Delivery Preferences</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Email Notifications</p>
                      <p className="text-sm text-muted">Receive notifications via email</p>
                    </div>
                    <Switch defaultChecked data-testid="switch-email" />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Push Notifications</p>
                      <p className="text-sm text-muted">Browser and mobile push notifications</p>
                    </div>
                    <Switch defaultChecked data-testid="switch-push" />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Privacy */}
            <TabsContent value="privacy" className="space-y-6">
              <Card className="pack-card">
                <CardHeader>
                  <CardTitle>Profile Privacy</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Show Online Status</p>
                      <p className="text-sm text-muted">Let others see when you're online</p>
                    </div>
                    <Switch defaultChecked data-testid="switch-online-status" />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Public Profile</p>
                      <p className="text-sm text-muted">Make your profile visible to non-subscribers</p>
                    </div>
                    <Switch defaultChecked data-testid="switch-public-profile" />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Show Pack Count</p>
                      <p className="text-sm text-muted">Display your subscriber count publicly</p>
                    </div>
                    <Switch defaultChecked data-testid="switch-pack-count" />
                  </div>
                </CardContent>
              </Card>

              <Card className="pack-card">
                <CardHeader>
                  <CardTitle>Data & Privacy</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button variant="outline" className="w-full justify-start" data-testid="button-download-data">
                    <Upload className="h-4 w-4 mr-2" />
                    Download My Data
                  </Button>
                  <Button variant="outline" className="w-full justify-start" data-testid="button-privacy-settings">
                    <Shield className="h-4 w-4 mr-2" />
                    Advanced Privacy Settings
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Account */}
            <TabsContent value="account" className="space-y-6">
              <Card className="pack-card">
                <CardHeader>
                  <CardTitle>Account Security</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <Label>Change Password</Label>
                    <Input type="password" placeholder="Current password" className="form-input" data-testid="input-current-password" />
                    <Input type="password" placeholder="New password" className="form-input" data-testid="input-new-password" />
                    <Input type="password" placeholder="Confirm new password" className="form-input" data-testid="input-confirm-password" />
                    <Button variant="outline" data-testid="button-change-password">
                      Update Password
                    </Button>
                  </div>
                  
                  <div className="pt-4 border-t border-border">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Two-Factor Authentication</p>
                        <p className="text-sm text-muted">Add an extra layer of security to your account</p>
                      </div>
                      <Button variant="outline" data-testid="button-enable-2fa">
                        Enable
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="pack-card border-destructive/50">
                <CardHeader>
                  <CardTitle className="text-destructive">Danger Zone</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Deactivate Account</p>
                      <p className="text-sm text-muted">Temporarily disable your account</p>
                    </div>
                    <Button variant="outline" className="text-destructive border-destructive hover:bg-destructive/10" data-testid="button-deactivate">
                      Deactivate
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Delete Account</p>
                      <p className="text-sm text-muted">Permanently delete your account and all data</p>
                    </div>
                    <Button variant="destructive" data-testid="button-delete-account">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Account
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
}
