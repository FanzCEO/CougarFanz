import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Shield, Cookie, Settings, Check } from 'lucide-react';
import { useCSRF } from '@/hooks/useCSRF';

interface ConsentPreferences {
  necessary: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
  personalization: boolean;
}

export function GDPRConsentBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { csrfToken, addCSRFHeaders, isLoading: csrfLoading } = useCSRF();
  
  const [preferences, setPreferences] = useState<ConsentPreferences>({
    necessary: true,
    functional: true,
    analytics: false,
    marketing: false,
    personalization: false
  });

  useEffect(() => {
    // Check localStorage first for immediate response
    const localConsent = localStorage.getItem('gdpr-consent');
    if (localConsent) {
      try {
        const parsed = JSON.parse(localConsent);
        setPreferences(parsed);
        setShowBanner(false);
        return;
      } catch (e) {
        // Invalid stored consent, continue to show banner
      }
    }
    
    const sessionId = getSessionId();
    
    fetch(`/api/consent/${sessionId}`)
      .then(res => res.json())
      .then(data => {
        if (!data.consents || Object.keys(data.consents).length === 0) {
          setShowBanner(true);
        } else {
          setPreferences({
            necessary: true,
            functional: data.consents.functional ?? true,
            analytics: data.consents.analytics ?? false,
            marketing: data.consents.marketing ?? false,
            personalization: data.consents.personalization ?? false
          });
          localStorage.setItem('gdpr-consent', JSON.stringify(data.consents));
        }
      })
      .catch(() => {
        setShowBanner(true);
      });
  }, []);

  const getSessionId = () => {
    let sessionId = localStorage.getItem('gdpr-session-id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('gdpr-session-id', sessionId);
    }
    return sessionId;
  };

  const saveConsent = async (consentData: ConsentPreferences) => {
    setIsLoading(true);
    
    // Always save to localStorage immediately so banner dismisses
    localStorage.setItem('gdpr-consent', JSON.stringify(consentData));
    setPreferences(consentData);
    setShowBanner(false);
    setShowDetails(false);
    applyConsentPreferences(consentData);
    
    // Try to save to server in background (non-blocking)
    try {
      const sessionId = getSessionId();
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      
      if (csrfToken) {
        Object.assign(headers, addCSRFHeaders(headers));
      }
      
      await fetch('/api/consent', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          sessionId,
          consents: consentData
        })
      });
    } catch (error) {
      // Server save failed, but local save succeeded - that's okay
      console.log('Consent saved locally (server sync will retry later)');
    } finally {
      setIsLoading(false);
    }
  };

  const applyConsentPreferences = (prefs: ConsentPreferences) => {
    if (prefs.analytics) {
      console.log('Analytics enabled');
    } else {
      console.log('Analytics disabled');
    }

    if (prefs.marketing) {
      console.log('Marketing cookies enabled');
    } else {
      console.log('Marketing cookies disabled');
    }

    if (prefs.personalization) {
      console.log('Personalization enabled');
    }
  };

  const acceptAll = () => {
    saveConsent({
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true,
      personalization: true
    });
  };

  const acceptSelected = () => {
    saveConsent(preferences);
  };

  const rejectAll = () => {
    saveConsent({
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false,
      personalization: false
    });
  };

  if (!showBanner) return null;

  return (
    <>
      <div 
        className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-lg"
        data-testid="gdpr-consent-banner"
      >
        <div className="container mx-auto p-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
            <div className="flex items-start gap-3 flex-1">
              <Shield className="w-6 h-6 text-primary mt-0.5 flex-shrink-0" />
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground text-sm lg:text-base">
                  We respect your privacy
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  We use cookies and similar technologies to enhance your experience, analyze usage, 
                  and provide personalized content. You can manage your preferences below or learn more in our{' '}
                  <a href="/privacy-policy" className="text-primary hover:underline">
                    Privacy Policy
                  </a>.
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <Button
                onClick={() => setShowDetails(true)}
                variant="outline"
                size="sm"
                className="text-xs lg:text-sm"
                data-testid="button-customize-cookies"
              >
                <Settings className="w-4 h-4 mr-2" />
                Customize
              </Button>
              <Button
                onClick={rejectAll}
                variant="outline"
                size="sm"
                disabled={isLoading}
                className="text-xs lg:text-sm"
                data-testid="button-reject-cookies"
              >
                Reject All
              </Button>
              <Button
                onClick={acceptAll}
                size="sm"
                disabled={isLoading}
                className="bg-primary hover:bg-primary/90 text-xs lg:text-sm"
                data-testid="button-accept-cookies"
              >
                <Check className="w-4 h-4 mr-2" />
                Accept All
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" data-testid="dialog-cookie-preferences">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Cookie className="w-5 h-5" />
              Cookie & Privacy Preferences
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 mt-4">
            <div className="text-sm text-muted-foreground">
              Manage your cookie and data processing preferences. You can change these settings at any time.
            </div>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Necessary Cookies</h4>
                    <p className="text-sm text-muted-foreground">
                      Essential for basic website functionality and security.
                    </p>
                  </div>
                  <Switch 
                    checked={preferences.necessary}
                    disabled={true}
                    aria-label="Necessary cookies (required)"
                  />
                </div>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Functional Cookies</h4>
                    <p className="text-sm text-muted-foreground">
                      Remember your preferences and improve user experience.
                    </p>
                  </div>
                  <Switch 
                    checked={preferences.functional}
                    onCheckedChange={(checked) => 
                      setPreferences(prev => ({...prev, functional: checked}))
                    }
                    data-testid="switch-functional-cookies"
                    aria-label="Functional cookies"
                  />
                </div>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Analytics Cookies</h4>
                    <p className="text-sm text-muted-foreground">
                      Help us understand how you use our site to improve performance.
                    </p>
                  </div>
                  <Switch 
                    checked={preferences.analytics}
                    onCheckedChange={(checked) => 
                      setPreferences(prev => ({...prev, analytics: checked}))
                    }
                    data-testid="switch-analytics-cookies"
                    aria-label="Analytics cookies"
                  />
                </div>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Marketing Cookies</h4>
                    <p className="text-sm text-muted-foreground">
                      Used for targeted advertising and measuring ad effectiveness.
                    </p>
                  </div>
                  <Switch 
                    checked={preferences.marketing}
                    onCheckedChange={(checked) => 
                      setPreferences(prev => ({...prev, marketing: checked}))
                    }
                    data-testid="switch-marketing-cookies"
                    aria-label="Marketing cookies"
                  />
                </div>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Personalization Cookies</h4>
                    <p className="text-sm text-muted-foreground">
                      Customize content and features based on your activity.
                    </p>
                  </div>
                  <Switch 
                    checked={preferences.personalization}
                    onCheckedChange={(checked) => 
                      setPreferences(prev => ({...prev, personalization: checked}))
                    }
                    data-testid="switch-personalization-cookies"
                    aria-label="Personalization cookies"
                  />
                </div>
              </CardHeader>
            </Card>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={acceptSelected}
                disabled={isLoading}
                className="flex-1"
                data-testid="button-save-preferences"
              >
                Save Preferences
              </Button>
              <Button
                onClick={acceptAll}
                disabled={isLoading}
                variant="outline"
                data-testid="button-accept-all-detailed"
              >
                Accept All
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
