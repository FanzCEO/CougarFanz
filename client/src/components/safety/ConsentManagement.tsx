import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Handshake, 
  Check, 
  Shield, 
  Heart,
  MessageCircle,
  Database,
  Cookie,
  Globe,
  Lock,
  Info
} from "lucide-react";

interface ConsentType {
  id: string;
  title: string;
  description: string;
  icon: any;
  required: boolean;
  granted?: boolean;
}

export default function ConsentManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: consents } = useQuery({
    queryKey: ['/api/consent'],
    enabled: !!user,
  });

  const updateConsentMutation = useMutation({
    mutationFn: async (data: { consentType: string; granted: boolean; details?: any }) => {
      await apiRequest('POST', '/api/consent', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/consent'] });
      toast({
        title: "Consent Updated",
        description: "Your consent preferences have been saved.",
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
        description: "Failed to update consent. Please try again.",
        variant: "destructive",
      });
    },
  });

  const consentTypes: ConsentType[] = [
    {
      id: 'content_sharing',
      title: 'Content Creation & Sharing',
      description: 'Consent to create, share, and monetize adult content on the platform',
      icon: Heart,
      required: true,
      granted: consents?.find((c: any) => c.consentType === 'content_sharing' && c.granted && !c.revokedAt)
    },
    {
      id: 'communication',
      title: 'Communication Preferences',
      description: 'Allow direct messaging, tips notifications, and pack member interactions',
      icon: MessageCircle,
      required: false,
      granted: consents?.find((c: any) => c.consentType === 'communication' && c.granted && !c.revokedAt)
    },
    {
      id: 'data_usage',
      title: 'Data Processing & Analytics',
      description: 'Process your data for platform analytics, content recommendations, and improvements',
      icon: Database,
      required: true,
      granted: consents?.find((c: any) => c.consentType === 'data_usage' && c.granted && !c.revokedAt)
    },
    {
      id: 'marketing',
      title: 'Marketing Communications',
      description: 'Receive platform updates, promotional emails, and personalized offers',
      icon: Globe,
      required: false,
      granted: consents?.find((c: any) => c.consentType === 'marketing' && c.granted && !c.revokedAt)
    },
    {
      id: 'cookies',
      title: 'Cookie & Tracking Preferences',
      description: 'Use of cookies for functionality, analytics, and personalized experience',
      icon: Cookie,
      required: true,
      granted: consents?.find((c: any) => c.consentType === 'cookies' && c.granted && !c.revokedAt)
    }
  ];

  const handleConsentToggle = (consentType: string, granted: boolean, required: boolean) => {
    if (required && !granted) {
      toast({
        title: "Required Consent",
        description: "This consent is required to use the platform.",
        variant: "destructive",
      });
      return;
    }

    updateConsentMutation.mutate({
      consentType,
      granted,
      details: {
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      }
    });
  };

  const getConsentStatus = () => {
    const requiredConsents = consentTypes.filter(c => c.required);
    const grantedRequired = requiredConsents.filter(c => c.granted).length;
    return {
      total: requiredConsents.length,
      granted: grantedRequired,
      isComplete: grantedRequired === requiredConsents.length
    };
  };

  const status = getConsentStatus();

  return (
    <Card className="pack-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Handshake className="mr-2 h-5 w-5" />
            Consent Management
          </div>
          <Badge 
            className={status.isComplete ? 'safety-badge safety-badge-verified' : 'bg-warning/20 text-warning'}
          >
            {status.isComplete ? (
              <>
                <Check className="mr-1 h-3 w-3" />
                Complete
              </>
            ) : (
              <>
                <Info className="mr-1 h-3 w-3" />
                {status.granted}/{status.total} Required
              </>
            )}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Clear consent is required for all interactions on PupFanz. You can update your preferences at any time. 
            Required consents are necessary for platform functionality.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          {consentTypes.map((consent, index) => (
            <div key={consent.id}>
              <div className="flex items-start space-x-4 p-4 bg-background rounded-lg border border-border">
                <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <consent.icon className="h-5 w-5 text-primary" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium text-foreground">{consent.title}</h4>
                        {consent.required && (
                          <Badge variant="outline" className="text-xs">Required</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted">{consent.description}</p>
                    </div>
                    
                    <div className="flex items-center space-x-3 ml-4">
                      <Switch
                        checked={!!consent.granted}
                        onCheckedChange={(checked) => handleConsentToggle(consent.id, checked, consent.required)}
                        disabled={updateConsentMutation.isPending}
                        data-testid={`switch-consent-${consent.id}`}
                      />
                    </div>
                  </div>

                  {consent.granted && (
                    <div className="mt-3 flex items-center space-x-2 text-xs text-success">
                      <Check className="h-3 w-3" />
                      <span>Consent granted and recorded</span>
                    </div>
                  )}
                </div>
              </div>
              
              {index < consentTypes.length - 1 && <Separator className="my-4" />}
            </div>
          ))}
        </div>

        {/* Consent History */}
        <div className="pt-6 border-t border-border">
          <h4 className="font-medium mb-4 flex items-center">
            <Lock className="mr-2 h-4 w-4" />
            Consent Record
          </h4>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between p-3 bg-background rounded-lg border border-border">
              <span>Last Updated</span>
              <span className="text-muted">
                {consents?.[0]?.createdAt ? new Date(consents[0].createdAt).toLocaleDateString() : 'Never'}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-background rounded-lg border border-border">
              <span>IP Address (Recorded)</span>
              <span className="text-muted font-mono text-xs">
                {consents?.[0]?.ipAddress || 'Not recorded'}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-background rounded-lg border border-border">
              <span>Total Consent Records</span>
              <Badge variant="outline">
                {consents?.length || 0} entries
              </Badge>
            </div>
          </div>
        </div>

        {/* GDPR Rights */}
        <div className="pt-6 border-t border-border">
          <h4 className="font-medium mb-4">Your Data Rights</h4>
          <div className="grid md:grid-cols-2 gap-3">
            <Button variant="outline" className="justify-start" data-testid="button-download-data">
              <Database className="mr-2 h-4 w-4" />
              Download My Data
            </Button>
            <Button variant="outline" className="justify-start" data-testid="button-revoke-all">
              <Lock className="mr-2 h-4 w-4" />
              Revoke All Consent
            </Button>
          </div>
          <p className="text-xs text-muted mt-2">
            Under GDPR and CCPA, you have the right to access, modify, or delete your personal data.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
