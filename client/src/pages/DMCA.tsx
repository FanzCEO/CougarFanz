import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Shield, AlertCircle } from "lucide-react";

export default function DMCA() {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">DMCA Policy</h1>
        </div>
        <p className="text-muted-foreground">
          Digital Millennium Copyright Act Notice and Takedown Procedure
        </p>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-muted-foreground">
              We respect the intellectual property rights of others and expect our users to do the same. 
              In accordance with the Digital Millennium Copyright Act (DMCA), we will respond to valid notices 
              of alleged copyright infringement.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card data-testid="section-filing-notice">
          <CardHeader>
            <CardTitle className="text-lg">Filing a DMCA Notice</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              If you believe that your copyrighted work has been copied in a way that constitutes copyright infringement, 
              please provide our Copyright Agent with the following information:
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="font-medium text-foreground">1.</span>
                <span>A physical or electronic signature of the copyright owner or authorized representative</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium text-foreground">2.</span>
                <span>Identification of the copyrighted work claimed to have been infringed</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium text-foreground">3.</span>
                <span>Identification of the material that is claimed to be infringing, with information reasonably sufficient to permit us to locate the material</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium text-foreground">4.</span>
                <span>Your contact information, including address, telephone number, and email address</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium text-foreground">5.</span>
                <span>A statement that you have a good faith belief that use of the material is not authorized by the copyright owner</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium text-foreground">6.</span>
                <span>A statement, under penalty of perjury, that the information in the notification is accurate and that you are authorized to act on behalf of the copyright owner</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card data-testid="section-counter-notice">
          <CardHeader>
            <CardTitle className="text-lg">Counter-Notification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              If you believe that your content was removed by mistake or misidentification, you may file a counter-notification containing:
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="font-medium text-foreground">1.</span>
                <span>Your physical or electronic signature</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium text-foreground">2.</span>
                <span>Identification of the material that has been removed and the location where it appeared before removal</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium text-foreground">3.</span>
                <span>A statement under penalty of perjury that you have a good faith belief the material was removed by mistake or misidentification</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium text-foreground">4.</span>
                <span>Your name, address, telephone number, and a statement that you consent to jurisdiction of Federal District Court</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card data-testid="section-repeat-infringers">
          <CardHeader>
            <CardTitle className="text-lg">Repeat Infringer Policy</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              In accordance with the DMCA and other applicable law, we have adopted a policy of terminating, 
              in appropriate circumstances and at our sole discretion, accounts of users who are deemed to be repeat infringers. 
              We may also, at our sole discretion, limit access to the platform and/or terminate the accounts of any users 
              who infringe any intellectual property rights of others, whether or not there is any repeat infringement.
            </p>
          </CardContent>
        </Card>

        <Card data-testid="section-false-claims">
          <CardHeader>
            <CardTitle className="text-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                False Claims Warning
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Please be aware that under Section 512(f) of the DMCA, any person who knowingly materially misrepresents 
              that material or activity is infringing, or that material or activity was removed or disabled by mistake or 
              misidentification, may be subject to liability. We reserve the right to seek damages from any party that 
              submits a notification or counter-notification in violation of the law.
            </p>
          </CardContent>
        </Card>

        <Card data-testid="section-contact">
          <CardHeader>
            <CardTitle className="text-lg">Copyright Agent Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              All DMCA notices and counter-notifications should be sent to our designated Copyright Agent:
            </p>
            <div className="bg-muted p-4 rounded-lg">
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Email:</span> dmca@platform.com</p>
                <p><span className="font-medium">Subject Line:</span> DMCA Notice or DMCA Counter-Notice</p>
              </div>
            </div>
            <Button className="w-full" data-testid="button-contact-agent">
              Contact Copyright Agent
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
