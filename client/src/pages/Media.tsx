import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ObjectUploader } from "@/components/ObjectUploader";
import { CoStarPromptModal, CoStarInviteForm } from "@/components/costar";
import { Upload, Eye, MoreHorizontal, Users } from "lucide-react";
import type { UploadResult } from "@uppy/core";
import { apiRequest } from "@/lib/queryClient";

type UploadFlow = "idle" | "costar-prompt" | "costar-invite" | "upload-form";

export default function Media() {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadFlow, setUploadFlow] = useState<UploadFlow>("idle");
  const [pendingCoStars, setPendingCoStars] = useState<any[]>([]);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    uploadedUrl: '',
    coStarInvitations: [] as string[],
  });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: mediaAssets, isLoading } = useQuery({
    queryKey: ['/api/media'],
  });

  const createMediaMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('POST', '/api/media', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/media'] });
      setIsUploadOpen(false);
      setUploadForm({ title: '', description: '', uploadedUrl: '' });
      toast({
        title: "Success",
        description: "Media uploaded successfully and sent for moderation",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getUploadParameters = async () => {
    const response = await apiRequest('POST', '/api/media/upload', {});
    const data = await response.json();
    return {
      method: 'PUT' as const,
      url: data.uploadURL,
    };
  };

  const handleUploadComplete = (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      setUploadForm(prev => ({
        ...prev,
        uploadedUrl: uploadedFile.uploadURL || ''
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.title || !uploadForm.uploadedUrl) {
      toast({
        title: "Error",
        description: "Please fill in all required fields and upload a file",
        variant: "destructive",
      });
      return;
    }

    // Extract file info from uploaded URL
    const urlParts = uploadForm.uploadedUrl.split('/');
    const fileName = urlParts[urlParts.length - 1] || 'unknown';
    
    createMediaMutation.mutate({
      title: uploadForm.title,
      description: uploadForm.description,
      s3Key: uploadForm.uploadedUrl,
      mimeType: 'application/octet-stream', // Would be determined from actual file
      size: 1024, // Would be actual file size
      checksum: 'placeholder-checksum', // Would be actual checksum
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-accent text-accent-foreground';
      case 'pending': return 'bg-yellow-500 text-yellow-50';
      case 'rejected': return 'bg-destructive text-destructive-foreground';
      case 'processing': return 'bg-blue-500 text-blue-50';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Handle the upload button click - starts the co-star check flow
  const handleUploadClick = () => {
    setUploadFlow("costar-prompt");
  };

  // User confirmed no co-star - go straight to upload form
  const handleNoCoStar = () => {
    setUploadFlow("upload-form");
    setIsUploadOpen(true);
  };

  // User has a co-star - show invite form
  const handleHasCoStar = () => {
    setUploadFlow("costar-invite");
  };

  // Co-star invitations created - continue to upload
  const handleCoStarInviteComplete = (invitations: any[]) => {
    setPendingCoStars(invitations);
    setUploadForm(prev => ({
      ...prev,
      coStarInvitations: invitations.map(i => i.id),
    }));
    setUploadFlow("upload-form");
    setIsUploadOpen(true);
  };

  // Reset the upload flow
  const handleCloseFlow = () => {
    setUploadFlow("idle");
    setIsUploadOpen(false);
    setPendingCoStars([]);
    setUploadForm({ title: '', description: '', uploadedUrl: '', coStarInvitations: [] });
  };

  return (
    <div className="space-y-6" data-testid="media-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display" data-testid="page-title">Media Assets</h1>
          <p className="text-muted-foreground" data-testid="page-description">
            Upload and manage your content
          </p>
        </div>
        
        {/* Upload Button - Starts the Co-Star Check Flow */}
        <Button className="glow-effect" data-testid="upload-media-button" onClick={handleUploadClick}>
          <Upload className="mr-2 h-4 w-4" />
          Upload Media
        </Button>

        {/* Co-Star Prompt Modal */}
        <CoStarPromptModal
          isOpen={uploadFlow === "costar-prompt"}
          onClose={handleCloseFlow}
          onNoCoStar={handleNoCoStar}
          onHasCoStar={handleHasCoStar}
        />

        {/* Co-Star Invite Form */}
        <CoStarInviteForm
          isOpen={uploadFlow === "costar-invite"}
          onClose={handleCloseFlow}
          onComplete={handleCoStarInviteComplete}
          onBack={() => setUploadFlow("costar-prompt")}
        />

        {/* Upload Dialog - Now triggered after co-star check */}
        <Dialog open={isUploadOpen} onOpenChange={(open) => {
          if (!open) handleCloseFlow();
          else setIsUploadOpen(open);
        }}>
          <DialogContent className="sm:max-w-md" data-testid="upload-dialog">
            <DialogHeader>
              <DialogTitle>Upload New Content</DialogTitle>
              <DialogDescription>
                Upload your media files and provide details
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Show pending co-star invitations */}
              {pendingCoStars.length > 0 && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Co-Stars ({pendingCoStars.length})</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {pendingCoStars.map((cs) => (
                      <Badge key={cs.id} variant="secondary" className="text-xs">
                        {cs.coStarName} <span className="text-muted-foreground">(pending)</span>
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Co-stars must complete verification before you can tag them.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter content title"
                  required
                  data-testid="upload-title-input"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your content"
                  rows={3}
                  data-testid="upload-description-input"
                />
              </div>
              
              <div className="space-y-2">
                <Label>File Upload *</Label>
                <ObjectUploader
                  maxNumberOfFiles={1}
                  maxFileSize={50 * 1024 * 1024} // 50MB
                  onGetUploadParameters={getUploadParameters}
                  onComplete={handleUploadComplete}
                  buttonClassName="w-full border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {uploadForm.uploadedUrl ? 'File uploaded! Click to change' : 'Click to upload file'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Max file size: 50MB
                    </span>
                  </div>
                </ObjectUploader>
              </div>
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsUploadOpen(false)}
                  data-testid="upload-cancel-button"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMediaMutation.isPending}
                  className="glow-effect"
                  data-testid="upload-submit-button"
                >
                  {createMediaMutation.isPending ? 'Uploading...' : 'Upload Content'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Media Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="bg-card border-border animate-pulse">
              <div className="h-48 bg-muted rounded-t-lg"></div>
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-3 bg-muted rounded w-2/3 mb-4"></div>
                <div className="flex justify-between items-center">
                  <div className="h-6 bg-muted rounded w-16"></div>
                  <div className="h-8 bg-muted rounded w-8"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : mediaAssets && mediaAssets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mediaAssets.map((media: any) => (
            <Card key={media.id} className="bg-card border-border" data-testid={`media-card-${media.id}`}>
              <div className="h-48 bg-muted rounded-t-lg flex items-center justify-center">
                <i className="fas fa-image text-4xl text-muted-foreground"></i>
              </div>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold truncate flex-1" data-testid={`media-title-${media.id}`}>
                    {media.title}
                  </h3>
                  <Button variant="ghost" size="sm" data-testid={`media-menu-${media.id}`}>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
                
                {media.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2" data-testid={`media-description-${media.id}`}>
                    {media.description}
                  </p>
                )}
                
                <div className="flex justify-between items-center text-xs text-muted-foreground mb-3">
                  <span data-testid={`media-size-${media.id}`}>
                    {formatFileSize(media.size)}
                  </span>
                  <span data-testid={`media-date-${media.id}`}>
                    {new Date(media.createdAt).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <Badge className={getStatusColor(media.status)} data-testid={`media-status-${media.id}`}>
                    {media.status}
                  </Badge>
                  
                  {media.status === 'approved' && (
                    <Button variant="outline" size="sm" data-testid={`media-view-${media.id}`}>
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-card border-border">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Upload className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2" data-testid="empty-state-title">
              No media uploaded yet
            </h3>
            <p className="text-muted-foreground text-center mb-6" data-testid="empty-state-description">
              Start building your content library by uploading your first media file.
            </p>
            <Button onClick={() => setIsUploadOpen(true)} className="glow-effect" data-testid="empty-state-upload-button">
              <Upload className="mr-2 h-4 w-4" />
              Upload Your First Media
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
