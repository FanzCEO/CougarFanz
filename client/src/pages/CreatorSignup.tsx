import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useCSRFHeaders } from "@/hooks/useCSRF";
import {
  Shield,
  AlertTriangle,
  Upload,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  FileText,
  Camera,
  User,
  Calendar,
  MapPin
} from "lucide-react";

type Step = 1 | 2 | 3 | 4;

export default function CreatorSignup() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { token: csrfToken } = useCSRFHeaders();
  const [step, setStep] = useState<Step>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    email: "",
    password: "",
    confirmPassword: "",
    username: "",

    // Step 2: Personal Info (2257 Required)
    legalFirstName: "",
    legalLastName: "",
    dateOfBirth: "",
    country: "",
    state: "",

    // Step 3: ID Verification
    idType: "passport" as "passport" | "drivers_license" | "national_id",
    idNumber: "",
    idExpiryDate: "",
    idFrontFile: null as File | null,
    idBackFile: null as File | null,
    selfieFile: null as File | null,

    // Step 4: Compliance Agreements
    consent2257: false,
    consentRecordKeeping: false,
    consentAgeVerification: false,
    consentTerms: false,
    consentPrivacy: false,
    consentContentPolicy: false,
    consentDMCA: false,
  });

  const updateForm = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep = (currentStep: Step): boolean => {
    switch (currentStep) {
      case 1:
        if (!formData.email || !formData.password || !formData.username) {
          toast({ title: "Please fill in all fields", variant: "destructive" });
          return false;
        }
        if (formData.password !== formData.confirmPassword) {
          toast({ title: "Passwords don't match", variant: "destructive" });
          return false;
        }
        if (formData.password.length < 8) {
          toast({ title: "Password must be at least 8 characters", variant: "destructive" });
          return false;
        }
        return true;

      case 2:
        if (!formData.legalFirstName || !formData.legalLastName || !formData.dateOfBirth || !formData.country) {
          toast({ title: "Please fill in all required fields", variant: "destructive" });
          return false;
        }
        // Check age (must be 18+)
        const birthDate = new Date(formData.dateOfBirth);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        if (age < 18) {
          toast({ title: "You must be 18 or older to create content", variant: "destructive" });
          return false;
        }
        return true;

      case 3:
        if (!formData.idNumber || !formData.idExpiryDate) {
          toast({ title: "Please provide ID information", variant: "destructive" });
          return false;
        }
        if (!formData.idFrontFile) {
          toast({ title: "Please upload the front of your ID", variant: "destructive" });
          return false;
        }
        if (!formData.selfieFile) {
          toast({ title: "Please upload a selfie holding your ID", variant: "destructive" });
          return false;
        }
        return true;

      case 4:
        if (!formData.consent2257 || !formData.consentRecordKeeping ||
            !formData.consentAgeVerification || !formData.consentTerms ||
            !formData.consentPrivacy || !formData.consentContentPolicy) {
          toast({ title: "Please accept all required agreements", variant: "destructive" });
          return false;
        }
        return true;

      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep((prev) => Math.min(prev + 1, 4) as Step);
    }
  };

  const prevStep = () => {
    setStep((prev) => Math.max(prev - 1, 1) as Step);
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) return;
    if (!csrfToken) {
      toast({ title: "Security token loading, please wait", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create FormData for file uploads
      const submitData = new FormData();
      submitData.append("email", formData.email);
      submitData.append("password", formData.password);
      submitData.append("username", formData.username);
      submitData.append("accountType", "creator");
      submitData.append("legalFirstName", formData.legalFirstName);
      submitData.append("legalLastName", formData.legalLastName);
      submitData.append("dateOfBirth", formData.dateOfBirth);
      submitData.append("country", formData.country);
      submitData.append("state", formData.state);
      submitData.append("idType", formData.idType);
      submitData.append("idNumber", formData.idNumber);
      submitData.append("idExpiryDate", formData.idExpiryDate);

      if (formData.idFrontFile) submitData.append("idFront", formData.idFrontFile);
      if (formData.idBackFile) submitData.append("idBack", formData.idBackFile);
      if (formData.selfieFile) submitData.append("selfie", formData.selfieFile);

      // Compliance consents
      submitData.append("consent2257", String(formData.consent2257));
      submitData.append("consentRecordKeeping", String(formData.consentRecordKeeping));
      submitData.append("consentAgeVerification", String(formData.consentAgeVerification));
      submitData.append("consentTerms", String(formData.consentTerms));
      submitData.append("consentPrivacy", String(formData.consentPrivacy));
      submitData.append("consentContentPolicy", String(formData.consentContentPolicy));
      submitData.append("consentDMCA", String(formData.consentDMCA));

      await fetch("/api/auth/creator-signup", {
        method: "POST",
        headers: {
          "X-CSRF-Token": csrfToken,
        },
        body: submitData,
        credentials: "include",
      });

      toast({
        title: "Application Submitted!",
        description: "Your creator application is being reviewed. We'll email you within 24-48 hours.",
      });

      setLocation("/");
    } catch (error) {
      toast({
        title: "Signup Failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <User className="h-12 w-12 text-df-cyan mx-auto mb-2" />
        <h3 className="text-xl font-bold text-df-snow">Account Information</h3>
        <p className="text-df-fog text-sm">Create your creator account credentials</p>
      </div>

      <div>
        <Label htmlFor="username" className="text-df-fog">Username *</Label>
        <Input
          id="username"
          value={formData.username}
          onChange={(e) => updateForm("username", e.target.value)}
          className="input-df"
          placeholder="Choose a display name"
          required
        />
      </div>

      <div>
        <Label htmlFor="email" className="text-df-fog">Email Address *</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => updateForm("email", e.target.value)}
          className="input-df"
          placeholder="your@email.com"
          required
        />
      </div>

      <div>
        <Label htmlFor="password" className="text-df-fog">Password *</Label>
        <Input
          id="password"
          type="password"
          value={formData.password}
          onChange={(e) => updateForm("password", e.target.value)}
          className="input-df"
          placeholder="Minimum 8 characters"
          minLength={8}
          required
        />
      </div>

      <div>
        <Label htmlFor="confirmPassword" className="text-df-fog">Confirm Password *</Label>
        <Input
          id="confirmPassword"
          type="password"
          value={formData.confirmPassword}
          onChange={(e) => updateForm("confirmPassword", e.target.value)}
          className="input-df"
          placeholder="Confirm your password"
          required
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <FileText className="h-12 w-12 text-df-gold mx-auto mb-2" />
        <h3 className="text-xl font-bold text-df-snow">Legal Information</h3>
        <p className="text-df-fog text-sm">Required for 18 U.S.C. § 2257 Compliance</p>
      </div>

      <div className="bg-df-brick/30 border border-df-gold/30 rounded-lg p-4 mb-4">
        <div className="flex items-start gap-2">
          <Shield className="h-5 w-5 text-df-gold mt-0.5" />
          <div>
            <p className="text-df-snow text-sm font-medium">Why we need this information</p>
            <p className="text-df-fog text-xs mt-1">
              Federal law (18 U.S.C. § 2257) requires us to verify the age and identity of all content creators.
              This information is securely stored and used only for compliance purposes.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="legalFirstName" className="text-df-fog">Legal First Name *</Label>
          <Input
            id="legalFirstName"
            value={formData.legalFirstName}
            onChange={(e) => updateForm("legalFirstName", e.target.value)}
            className="input-df"
            placeholder="As shown on ID"
            required
          />
        </div>
        <div>
          <Label htmlFor="legalLastName" className="text-df-fog">Legal Last Name *</Label>
          <Input
            id="legalLastName"
            value={formData.legalLastName}
            onChange={(e) => updateForm("legalLastName", e.target.value)}
            className="input-df"
            placeholder="As shown on ID"
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="dateOfBirth" className="text-df-fog flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Date of Birth *
        </Label>
        <Input
          id="dateOfBirth"
          type="date"
          value={formData.dateOfBirth}
          onChange={(e) => updateForm("dateOfBirth", e.target.value)}
          className="input-df"
          required
        />
        <p className="text-df-fog text-xs mt-1">You must be 18 or older</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="country" className="text-df-fog flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Country *
          </Label>
          <select
            id="country"
            value={formData.country}
            onChange={(e) => updateForm("country", e.target.value)}
            className="input-df w-full"
            required
          >
            <option value="">Select Country</option>
            <option value="US">United States</option>
            <option value="CA">Canada</option>
            <option value="GB">United Kingdom</option>
            <option value="AU">Australia</option>
            <option value="DE">Germany</option>
            <option value="FR">France</option>
            <option value="ES">Spain</option>
            <option value="IT">Italy</option>
            <option value="NL">Netherlands</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
        <div>
          <Label htmlFor="state" className="text-df-fog">State/Province</Label>
          <Input
            id="state"
            value={formData.state}
            onChange={(e) => updateForm("state", e.target.value)}
            className="input-df"
            placeholder="State or Province"
          />
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <Camera className="h-12 w-12 text-df-cyan mx-auto mb-2" />
        <h3 className="text-xl font-bold text-df-snow">Identity Verification</h3>
        <p className="text-df-fog text-sm">Upload your government-issued ID</p>
      </div>

      <div>
        <Label className="text-df-fog">ID Type *</Label>
        <select
          value={formData.idType}
          onChange={(e) => updateForm("idType", e.target.value)}
          className="input-df w-full"
        >
          <option value="passport">Passport</option>
          <option value="drivers_license">Driver's License</option>
          <option value="national_id">National ID Card</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="idNumber" className="text-df-fog">ID Number *</Label>
          <Input
            id="idNumber"
            value={formData.idNumber}
            onChange={(e) => updateForm("idNumber", e.target.value)}
            className="input-df"
            placeholder="Document number"
            required
          />
        </div>
        <div>
          <Label htmlFor="idExpiryDate" className="text-df-fog">Expiry Date *</Label>
          <Input
            id="idExpiryDate"
            type="date"
            value={formData.idExpiryDate}
            onChange={(e) => updateForm("idExpiryDate", e.target.value)}
            className="input-df"
            required
          />
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <Label className="text-df-fog">Front of ID *</Label>
          <div className="border-2 border-dashed border-df-steel rounded-lg p-4 text-center hover:border-df-cyan transition-colors">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => updateForm("idFrontFile", e.target.files?.[0] || null)}
              className="hidden"
              id="idFront"
            />
            <label htmlFor="idFront" className="cursor-pointer">
              {formData.idFrontFile ? (
                <div className="flex items-center justify-center gap-2 text-df-cyan">
                  <CheckCircle className="h-5 w-5" />
                  <span>{formData.idFrontFile.name}</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-df-fog">
                  <Upload className="h-8 w-8" />
                  <span>Click to upload front of ID</span>
                </div>
              )}
            </label>
          </div>
        </div>

        <div>
          <Label className="text-df-fog">Back of ID (if applicable)</Label>
          <div className="border-2 border-dashed border-df-steel rounded-lg p-4 text-center hover:border-df-cyan transition-colors">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => updateForm("idBackFile", e.target.files?.[0] || null)}
              className="hidden"
              id="idBack"
            />
            <label htmlFor="idBack" className="cursor-pointer">
              {formData.idBackFile ? (
                <div className="flex items-center justify-center gap-2 text-df-cyan">
                  <CheckCircle className="h-5 w-5" />
                  <span>{formData.idBackFile.name}</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-df-fog">
                  <Upload className="h-8 w-8" />
                  <span>Click to upload back of ID</span>
                </div>
              )}
            </label>
          </div>
        </div>

        <div>
          <Label className="text-df-fog">Selfie with ID *</Label>
          <p className="text-df-fog text-xs mb-2">Take a photo of yourself holding your ID next to your face</p>
          <div className="border-2 border-dashed border-df-steel rounded-lg p-4 text-center hover:border-df-cyan transition-colors">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => updateForm("selfieFile", e.target.files?.[0] || null)}
              className="hidden"
              id="selfie"
            />
            <label htmlFor="selfie" className="cursor-pointer">
              {formData.selfieFile ? (
                <div className="flex items-center justify-center gap-2 text-df-cyan">
                  <CheckCircle className="h-5 w-5" />
                  <span>{formData.selfieFile.name}</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-df-fog">
                  <Camera className="h-8 w-8" />
                  <span>Click to upload selfie with ID</span>
                </div>
              )}
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <Shield className="h-12 w-12 text-df-gold mx-auto mb-2" />
        <h3 className="text-xl font-bold text-df-snow">Legal Agreements</h3>
        <p className="text-df-fog text-sm">Please review and accept the following</p>
      </div>

      <div className="bg-df-brick/30 border border-df-gold/30 rounded-lg p-4 mb-4">
        <h4 className="text-df-snow font-bold mb-2 flex items-center gap-2">
          <Shield className="h-5 w-5 text-df-gold" />
          18 U.S.C. § 2257 Compliance
        </h4>
        <p className="text-df-fog text-xs mb-3">
          By checking the boxes below, you acknowledge that you understand and agree to comply with federal
          record-keeping requirements for adult content production.
        </p>

        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Checkbox
              id="consent2257"
              checked={formData.consent2257}
              onCheckedChange={(checked) => updateForm("consent2257", checked)}
              className="mt-1"
            />
            <label htmlFor="consent2257" className="text-df-fog text-sm cursor-pointer">
              <span className="text-df-snow font-medium">2257 Acknowledgment *</span><br />
              I certify that I am 18 years of age or older and that all content I upload will only
              feature individuals who are 18 years of age or older at the time of production.
            </label>
          </div>

          <div className="flex items-start gap-3">
            <Checkbox
              id="consentRecordKeeping"
              checked={formData.consentRecordKeeping}
              onCheckedChange={(checked) => updateForm("consentRecordKeeping", checked)}
              className="mt-1"
            />
            <label htmlFor="consentRecordKeeping" className="text-df-fog text-sm cursor-pointer">
              <span className="text-df-snow font-medium">Record-Keeping Consent *</span><br />
              I consent to the retention of my identification documents and personal information
              for compliance with 18 U.S.C. § 2257 record-keeping requirements.
            </label>
          </div>

          <div className="flex items-start gap-3">
            <Checkbox
              id="consentAgeVerification"
              checked={formData.consentAgeVerification}
              onCheckedChange={(checked) => updateForm("consentAgeVerification", checked)}
              className="mt-1"
            />
            <label htmlFor="consentAgeVerification" className="text-df-fog text-sm cursor-pointer">
              <span className="text-df-snow font-medium">Age Verification *</span><br />
              I consent to age verification checks and understand that my identity will be verified
              before I can upload adult content to the platform.
            </label>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <Checkbox
            id="consentTerms"
            checked={formData.consentTerms}
            onCheckedChange={(checked) => updateForm("consentTerms", checked)}
            className="mt-1"
          />
          <label htmlFor="consentTerms" className="text-df-fog text-sm cursor-pointer">
            I agree to the <a href="/legal/terms" className="text-df-cyan hover:underline" target="_blank">Terms of Service</a> *
          </label>
        </div>

        <div className="flex items-start gap-3">
          <Checkbox
            id="consentPrivacy"
            checked={formData.consentPrivacy}
            onCheckedChange={(checked) => updateForm("consentPrivacy", checked)}
            className="mt-1"
          />
          <label htmlFor="consentPrivacy" className="text-df-fog text-sm cursor-pointer">
            I agree to the <a href="/legal/privacy" className="text-df-cyan hover:underline" target="_blank">Privacy Policy</a> *
          </label>
        </div>

        <div className="flex items-start gap-3">
          <Checkbox
            id="consentContentPolicy"
            checked={formData.consentContentPolicy}
            onCheckedChange={(checked) => updateForm("consentContentPolicy", checked)}
            className="mt-1"
          />
          <label htmlFor="consentContentPolicy" className="text-df-fog text-sm cursor-pointer">
            I agree to the <a href="/legal/content-policy" className="text-df-cyan hover:underline" target="_blank">Content Policy</a> and <a href="/legal/acceptable-use" className="text-df-cyan hover:underline" target="_blank">Acceptable Use Policy</a> *
          </label>
        </div>

        <div className="flex items-start gap-3">
          <Checkbox
            id="consentDMCA"
            checked={formData.consentDMCA}
            onCheckedChange={(checked) => updateForm("consentDMCA", checked)}
            className="mt-1"
          />
          <label htmlFor="consentDMCA" className="text-df-fog text-sm cursor-pointer">
            I understand the <a href="/legal/dmca" className="text-df-cyan hover:underline" target="_blank">DMCA Policy</a> and agree to respect intellectual property rights
          </label>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-df-dungeon py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress Indicator */}
        <div className="flex items-center justify-center mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                s === step
                  ? "bg-df-cyan text-df-dungeon"
                  : s < step
                    ? "bg-df-gold text-df-dungeon"
                    : "bg-df-brick text-df-fog"
              }`}>
                {s < step ? <CheckCircle className="h-5 w-5" /> : s}
              </div>
              {s < 4 && (
                <div className={`w-12 h-1 ${s < step ? "bg-df-gold" : "bg-df-brick"}`} />
              )}
            </div>
          ))}
        </div>

        <Card className="card-df">
          <CardHeader>
            <CardTitle className="text-2xl neon-heading-caps text-center">
              Creator Application
            </CardTitle>
            <CardDescription className="text-center text-df-fog">
              Step {step} of 4
            </CardDescription>
          </CardHeader>

          <CardContent>
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            {step === 4 && renderStep4()}

            <div className="flex justify-between mt-8">
              {step > 1 ? (
                <Button onClick={prevStep} variant="outline" className="btn-outline">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              ) : (
                <Button onClick={() => setLocation("/")} variant="outline" className="btn-outline">
                  Cancel
                </Button>
              )}

              {step < 4 ? (
                <Button onClick={nextStep} className="btn-primary">
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="btn-primary"
                >
                  {isSubmitting ? "Submitting..." : "Submit Application"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-df-fog text-sm mt-6">
          <AlertTriangle className="inline h-4 w-4 text-df-gold mr-1" />
          Your information is encrypted and stored securely in compliance with federal law.
        </p>
      </div>
    </div>
  );
}
