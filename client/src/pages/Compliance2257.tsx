import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, FileCheck, AlertCircle } from "lucide-react";

export default function Compliance2257() {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">18 U.S.C. 2257 Compliance</h1>
        </div>
        <p className="text-muted-foreground">
          Record-Keeping Requirements Compliance Statement
        </p>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <FileCheck className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-muted-foreground mb-4">
                All models, actors, actresses and other persons that appear in any visual depiction of actual or 
                simulated sexually explicit conduct appearing or otherwise contained in this platform were over the 
                age of eighteen (18) years at the time of the creation of such depictions.
              </p>
              <p className="text-muted-foreground">
                All other visual depictions displayed on this platform are exempt from the provision of 18 U.S.C. 
                section 2257 and 28 C.F.R. 75 because said visual depictions do not consist of depictions of conduct 
                as specifically listed in 18 U.S.C section 2256 (2) (A) through (D), but are merely depictions of 
                non-sexually explicit nudity, or are depictions of simulated sexual conduct, or are otherwise exempt 
                because the visual depictions were created prior to July 3, 1995.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card data-testid="section-records">
          <CardHeader>
            <CardTitle className="text-lg">Custodian of Records</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              With respect to all visual depictions displayed on this platform, whether of actual or simulated 
              sexually explicit conduct, depictions of non-sexually explicit nudity, or otherwise, the following is 
              the required information and statements prescribed by 18 U.S.C. section 2257 and 28 C.F.R. 75:
            </p>
            <div className="bg-muted p-4 rounded-lg">
              <div className="space-y-2">
                <p className="font-medium">Custodian of Records Information:</p>
                <p className="text-sm text-muted-foreground">
                  Available upon request to authorized government officials
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="section-verification">
          <CardHeader>
            <CardTitle className="text-lg">Age Verification Process</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              We maintain strict compliance with 18 U.S.C. 2257 Record-Keeping Requirements through:
            </p>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium">Mandatory Identity Verification</div>
                  <div className="text-sm text-muted-foreground">
                    All content creators must verify their age through government-issued identification
                  </div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium">Secure Record Keeping</div>
                  <div className="text-sm text-muted-foreground">
                    All required records are maintained securely and are available for inspection by authorized officials
                  </div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium">Co-Star Verification</div>
                  <div className="text-sm text-muted-foreground">
                    All individuals appearing in content must be verified through our co-star verification system
                  </div>
                </div>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card data-testid="section-statement">
          <CardHeader>
            <CardTitle className="text-lg">Compliance Statement</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              The operators of this platform are committed to full compliance with all applicable federal regulations, 
              including 18 U.S.C. 2257 and 28 C.F.R. 75. We take our legal obligations seriously and maintain 
              comprehensive systems to ensure all content meets legal requirements.
            </p>
            <p className="text-muted-foreground">
              For producers/primary producers who upload content to this platform: You are responsible for maintaining 
              your own records as required by 18 U.S.C. 2257 and making them available to the platform's custodian 
              of records and authorized government officials upon request.
            </p>
          </CardContent>
        </Card>

        <Card data-testid="section-disclaimer">
          <CardHeader>
            <CardTitle className="text-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                Important Legal Notice
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This platform prohibits and does not tolerate any content involving minors. Any user found to be in 
              violation of this policy will be immediately reported to the National Center for Missing & Exploited 
              Children (NCMEC) and appropriate law enforcement agencies, and their account will be permanently 
              terminated. We actively cooperate with law enforcement in all investigations.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
