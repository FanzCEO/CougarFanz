import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { ObjectUploader } from "@/components/ObjectUploader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  Shield, 
  DollarSign, 
  Users, 
  Eye,
  Save,
  Loader2
} from "lucide-react";

export default function ContentUpload() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isExpanded, setIsExpanded] = useState(false);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [uploadedFileInfo, setUploadedFileInfo] = useState<{
    name: string;
    size: number;
    type: string;
  } | null>(null);
  
  const [contentForm, setContentForm] = useState({
    title: "",
    description: "",
    tags: "",
    accessLevel: "pack",
    price: "",
    ageVerified: false,
    consentDocumented: false,
    guidelinesCompliant: false,
  });

  // File type validation and size limits
  const getFileConfig = (fileType: string) => {
    if (fileType.startsWith('video/')) {
      return {
        maxSize: 524288000, // 500MB for videos
        allowedTypes: ['video/mp4', 'video/mov', 'video/avi', 'video/webm', 'video/quicktime'],
        label: 'Video'
      };
    } else if (fileType.startsWith('image/')) {
      return {
        maxSize: 52428800, // 50MB for images  
        allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
        label: 'Image'
      };
    }
    return {
      maxSize: 10485760, // 10MB default
      allowedTypes: [],
      label: 'File'
    };
  };

  const uploadMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/objects/upload');
      const data = await response.json();
      return data as { uploadURL: string };
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
        title: "Upload Error",
        description: "Failed to get upload URL. Please try again.",
        variant: "destructive",
      });
    },
  });

  const createContentMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest('POST', '/api/content', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/content'] });
      toast({
        title: "Content Uploaded!",
        description: "Your content has been uploaded and is pending review.",
      });
      // Reset form
      setContentForm({
        title: "",
        description: "",
        tags: "",
        accessLevel: "pack",
        price: "",
        ageVerified: false,
        consentDocumented: false,
        guidelinesCompliant: false,
      });
      setUploadedFileUrl(null);
      setIsExpanded(false);
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
        title: "Upload Failed",
        description: "Failed to create content. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleGetUploadParameters = async () => {
    const result = await uploadMutation.mutateAsync();
    return {
      method: 'PUT' as const,
      url: result.uploadURL,
    };
  };

  const handleUploadComplete = async (result: any) => {
    if (result.successful?.length > 0) {
      const uploadedFile = result.successful[0];
      const uploadUrl = uploadedFile.uploadURL;
      
      // Extract file info
      const fileInfo = {
        name: uploadedFile.name || 'Uploaded file',
        size: uploadedFile.size || 0,
        type: uploadedFile.type || 'application/octet-stream'
      };
      
      setUploadedFileUrl(uploadUrl);
      setUploadedFileInfo(fileInfo);
      
      // Set ACL policy for the uploaded file
      try {
        await apiRequest('PUT', '/api/media-upload', {
          mediaUrl: uploadUrl,
          fileInfo: fileInfo
        });
        
        toast({
          title: `${getFileConfig(fileInfo.type).label} Uploaded!`,
          description: `${fileInfo.name} uploaded successfully. Now add content details.`,
        });
        setIsExpanded(true);
      } catch (error) {
        toast({
          title: "Error",
          description: "File uploaded but failed to set permissions.",
          variant: "destructive",
        });
      }
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setContentForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!uploadedFileUrl) {
      toast({
        title: "No File",
        description: "Please upload a file first.",
        variant: "destructive",
      });
      return;
    }

    if (!contentForm.title.trim()) {
      toast({
        title: "Missing Title",
        description: "Please provide a title for your content.",
        variant: "destructive",
      });
      return;
    }

    if (!contentForm.ageVerified || !contentForm.consentDocumented || !contentForm.guidelinesCompliant) {
      toast({
        title: "Safety Requirements",
        description: "Please complete all safety verification checkboxes.",
        variant: "destructive",
      });
      return;
    }

    createContentMutation.mutate({
      title: contentForm.title,
      description: contentForm.description,
      objectPath: uploadedFileUrl,
      mimeType: uploadedFileInfo?.type || "application/octet-stream",
      fileSize: uploadedFileInfo?.size || 0,
      accessLevel: contentForm.accessLevel,
      price: contentForm.accessLevel === 'ppv' ? parseFloat(contentForm.price) || 0 : null,
      tags: contentForm.tags.split(',').map(tag => tag.trim()).filter(Boolean),
    });
  };

  if (!isExpanded) {
    return (
      <Card className="pack-card">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Upload className="mr-2 h-5 w-5" />
            Quick Upload
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <ObjectUploader
              maxNumberOfFiles={1}
              maxFileSize={524288000} // 500MB to support video uploads
              onGetUploadParameters={handleGetUploadParameters}
              onComplete={handleUploadComplete}
              buttonClassName="w-full h-20 border-2 border-dashed border-border hover:border-primary/50 bg-background hover:bg-primary/5 transition-colors"
            >
              <div className="flex flex-col items-center space-y-2">
                <Upload className="h-8 w-8 text-primary" />
                <span className="font-medium">Upload Content</span>
                <span className="text-xs text-muted">Click to select files</span>
              </div>
            </ObjectUploader>
            <p className="text-xs text-muted mt-2">
              <span className="font-medium">Images:</span> JPG, PNG, GIF, WebP (Max 50MB)<br/>
              <span className="font-medium">Videos:</span> MP4, MOV, AVI, WebM (Max 500MB)
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="pack-card">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Upload className="mr-2 h-5 w-5" />
          Content Details
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Status */}
          {uploadedFileUrl && (
            <div className="flex items-center space-x-3 p-3 bg-success/10 border border-success/20 rounded-lg">
              <div className="w-8 h-8 bg-success/20 rounded-lg flex items-center justify-center">
                <Eye className="h-4 w-4 text-success" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-success">File uploaded successfully</p>
                <p className="text-xs text-muted">Ready to add content details</p>
              </div>
            </div>
          )}

          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Content Title</Label>
              <Input
                id="title"
                value={contentForm.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Give your content a catchy title..."
                className="form-input"
                data-testid="input-content-title"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={contentForm.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe your content..."
                rows={3}
                className="form-textarea"
                data-testid="textarea-content-description"
              />
            </div>

            <div>
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                value={contentForm.tags}
                onChange={(e) => handleInputChange('tags', e.target.value)}
                placeholder="fitness, alpha, training..."
                className="form-input"
                data-testid="input-content-tags"
              />
              <p className="text-xs text-muted mt-1">Separate tags with commas</p>
            </div>
          </div>

          {/* Access & Pricing */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="accessLevel">Access Level</Label>
              <Select 
                value={contentForm.accessLevel} 
                onValueChange={(value) => handleInputChange('accessLevel', value)}
              >
                <SelectTrigger className="form-select" data-testid="select-access-level">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pack">Pack Members Only</SelectItem>
                  <SelectItem value="premium">Premium Pack ($5.99)</SelectItem>
                  <SelectItem value="ppv">Pay-Per-View</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {contentForm.accessLevel === 'ppv' && (
              <div>
                <Label htmlFor="price">PPV Price</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted" />
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={contentForm.price}
                    onChange={(e) => handleInputChange('price', e.target.value)}
                    placeholder="9.99"
                    className="form-input pl-10"
                    data-testid="input-content-price"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Safety Verification */}
          <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
            <h4 className="font-medium text-warning mb-3 flex items-center">
              <Shield className="mr-2 h-4 w-4" />
              Safety Verification
            </h4>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="age-verified"
                  checked={contentForm.ageVerified}
                  onCheckedChange={(checked) => handleInputChange('ageVerified', checked)}
                  data-testid="checkbox-age-verified"
                />
                <Label htmlFor="age-verified" className="text-sm">
                  All participants are 18+ verified
                </Label>
              </div>
              
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="consent-documented"
                  checked={contentForm.consentDocumented}
                  onCheckedChange={(checked) => handleInputChange('consentDocumented', checked)}
                  data-testid="checkbox-consent-documented"
                />
                <Label htmlFor="consent-documented" className="text-sm">
                  Consent documented and stored
                </Label>
              </div>
              
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="guidelines-compliant"
                  checked={contentForm.guidelinesCompliant}
                  onCheckedChange={(checked) => handleInputChange('guidelinesCompliant', checked)}
                  data-testid="checkbox-guidelines-compliant"
                />
                <Label htmlFor="guidelines-compliant" className="text-sm">
                  Content complies with platform guidelines
                </Label>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              type="button"
              variant="outline" 
              className="flex-1"
              onClick={() => setIsExpanded(false)}
              data-testid="button-save-draft"
            >
              <Save className="mr-2 h-4 w-4" />
              Save as Draft
            </Button>
            <Button 
              type="submit" 
              className="flex-1 btn-primary"
              disabled={createContentMutation.isPending}
              data-testid="button-upload-now"
            >
              {createContentMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Now
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
