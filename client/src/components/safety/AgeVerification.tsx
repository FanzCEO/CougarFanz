import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { ObjectUploader } from "@/components/ObjectUploader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Shield, 
  Upload, 
  Check, 
  AlertTriangle, 
  Clock,
  FileText,
  Camera,
  Loader2
} from "lucide-react";

export default function AgeVerification() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [verificationStep, setVerificationStep] = useState(1);
  const [uploadedDocUrl, setUploadedDocUrl] = useState<string | null>(null);
  const [docType, setDocType] = useState("");

  const { data: profile } = useQuery({
    queryKey: ['/api/profile', user?.id],
    enabled: !!user?.id,
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/objects/upload');
      return response.json();
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

  const submitVerificationMutation = useMutation({
    mutationFn: async (data: { docType: string; documentPath: string }) => {
      await apiRequest('POST', '/api/kyc/verify', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
      toast({
        title: "Verification Submitted!",
        description: "Your age verification documents have been submitted for review.",
      });
      setVerificationStep(4);
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
        title: "Verification Failed",
        description: "Failed to submit verification. Please try again.",
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
      const uploadUrl = result.successful[0].uploadURL;
      setUploadedDocUrl(uploadUrl);
      
      try {
        await apiRequest('PUT', '/api/media-upload', {
          mediaUrl: uploadUrl
        });
        toast({
          title: "Document Uploaded!",
          description: "ID document uploaded successfully.",
        });
        setVerificationStep(3);
      } catch (error) {
        toast({
          title: "Error",
          description: "Document uploaded but failed to set permissions.",
          variant: "destructive",
        });
      }
    }
  };

  const handleSubmitVerification = () => {
    if (!uploadedDocUrl || !docType) {
      toast({
        title: "Missing Information",
        description: "Please select document type and upload your ID.",
        variant: "destructive",
      });
      return;
    }

    submitVerificationMutation.mutate({
      docType,
      documentPath: uploadedDocUrl,
    });
  };

  const getVerificationStatus = () => {
    if (profile?.profile?.ageVerified) return "verified";
    if (profile?.profile?.kycStatus === "pending") return "pending";
    return "not_started";
  };

  const status = getVerificationStatus();

  const renderVerificationStep = () => {
    switch (verificationStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Shield className="h-12 w-12 text-warning mx-auto mb-4" />
              <h3 className="font-semibold text-xl mb-2">Age Verification Required</h3>
              <p className="text-muted max-w-md mx-auto">
                To comply with adult content regulations, we need to verify that you are 18 years of age or older.
              </p>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This is a one-time verification process. Your documents are encrypted and stored securely according to 18 U.S.C. §2257 requirements.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <h4 className="font-medium">What you'll need:</h4>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center space-x-3 p-3 bg-background rounded-lg border border-border">
                  <FileText className="h-5 w-5 text-secondary" />
                  <div>
                    <p className="font-medium">Government ID</p>
                    <p className="text-muted">Driver's license, passport, or state ID</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-background rounded-lg border border-border">
                  <Camera className="h-5 w-5 text-accent" />
                  <div>
                    <p className="font-medium">Clear Photo</p>
                    <p className="text-muted">Well-lit, legible document image</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-background rounded-lg border border-border">
                  <Clock className="h-5 w-5 text-success" />
                  <div>
                    <p className="font-medium">Quick Process</p>
                    <p className="text-muted">Usually verified within 24 hours</p>
                  </div>
                </div>
              </div>
            </div>

            <Button 
              className="w-full btn-primary"
              onClick={() => setVerificationStep(2)}
              data-testid="button-start-verification"
            >
              Start Verification Process
            </Button>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Upload className="h-8 w-8 text-primary mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">Upload Your ID Document</h3>
              <p className="text-muted">Select your document type and upload a clear photo</p>
            </div>

            <div>
              <Label htmlFor="docType">Document Type</Label>
              <Select value={docType} onValueChange={setDocType}>
                <SelectTrigger className="form-select" data-testid="select-document-type">
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="drivers_license">Driver's License</SelectItem>
                  <SelectItem value="passport">Passport</SelectItem>
                  <SelectItem value="state_id">State ID</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
              <ObjectUploader
                maxNumberOfFiles={1}
                maxFileSize={10485760} // 10MB
                onGetUploadParameters={handleGetUploadParameters}
                onComplete={handleUploadComplete}
                buttonClassName="btn-primary"
              >
                <Upload className="h-5 w-5 mr-2" />
                Upload ID Document
              </ObjectUploader>
              <p className="text-xs text-muted mt-4">
                JPG, PNG up to 10MB • Document must be clearly visible and legible
              </p>
            </div>

            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Your document will be encrypted and stored securely. We only use this information for age verification purposes.
              </AlertDescription>
            </Alert>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Check className="h-8 w-8 text-success mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">Document Uploaded Successfully</h3>
              <p className="text-muted">Review your information and submit for verification</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-background rounded-lg border border-border">
                <span>Document Type</span>
                <Badge variant="outline">
                  {docType === 'drivers_license' ? "Driver's License" : 
                   docType === 'passport' ? "Passport" : "State ID"}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-background rounded-lg border border-border">
                <span>Upload Status</span>
                <Badge className="safety-badge safety-badge-verified">
                  <Check className="h-3 w-3 mr-1" />
                  Uploaded
                </Badge>
              </div>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Once submitted, your verification will be reviewed by our compliance team within 24-48 hours.
              </AlertDescription>
            </Alert>

            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setVerificationStep(2)}
                data-testid="button-upload-different"
              >
                Upload Different Document
              </Button>
              <Button 
                className="flex-1 btn-primary"
                onClick={handleSubmitVerification}
                disabled={submitVerificationMutation.isPending}
                data-testid="button-submit-verification"
              >
                {submitVerificationMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit for Verification'
                )}
              </Button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6 text-center">
            <Clock className="h-12 w-12 text-secondary mx-auto mb-4" />
            <h3 className="font-semibold text-xl mb-2">Verification Submitted</h3>
            <p className="text-muted max-w-md mx-auto">
              Your age verification has been submitted and is being reviewed by our compliance team.
            </p>
            
            <div className="p-4 bg-secondary/10 border border-secondary/20 rounded-lg">
              <p className="font-medium text-secondary mb-2">What happens next?</p>
              <div className="text-sm text-muted space-y-1">
                <p>• Our team will review your documents within 24-48 hours</p>
                <p>• You'll receive an email notification when complete</p>
                <p>• Your account will be automatically updated</p>
              </div>
            </div>

            <Button 
              variant="outline"
              onClick={() => window.location.reload()}
              data-testid="button-refresh-status"
            >
              Check Status
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="pack-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Shield className="mr-2 h-5 w-5" />
            Age Verification
          </div>
          <Badge 
            className={
              status === 'verified' ? 'safety-badge safety-badge-verified' :
              status === 'pending' ? 'bg-warning/20 text-warning' :
              'bg-muted/20 text-muted'
            }
          >
            {status === 'verified' ? (
              <>
                <Check className="mr-1 h-3 w-3" />
                Verified
              </>
            ) : status === 'pending' ? (
              <>
                <Clock className="mr-1 h-3 w-3" />
                Pending Review
              </>
            ) : (
              <>
                <AlertTriangle className="mr-1 h-3 w-3" />
                Required
              </>
            )}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {status === 'verified' ? (
          <div className="text-center py-6">
            <Check className="h-12 w-12 text-success mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">Age Verification Complete</h3>
            <p className="text-muted">Your account has been verified and you can access all platform features.</p>
            <div className="mt-4 p-3 bg-success/10 border border-success/20 rounded-lg">
              <p className="text-sm text-success">
                ✓ 18+ Age Verified • Compliant with 18 U.S.C. §2257
              </p>
            </div>
          </div>
        ) : status === 'pending' ? (
          <div className="text-center py-6">
            <Clock className="h-12 w-12 text-secondary mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">Verification In Progress</h3>
            <p className="text-muted mb-4">
              Your documents are being reviewed by our compliance team.
            </p>
            <Progress value={75} className="mb-4" />
            <p className="text-sm text-muted">
              Expected completion: Within 24-48 hours
            </p>
          </div>
        ) : (
          renderVerificationStep()
        )}
      </CardContent>
    </Card>
  );
}
