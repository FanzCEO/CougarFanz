/**
 * CoStar2257VerificationForm - Full 2257 Compliance Form for Co-Stars
 *
 * This is the complete verification form that co-stars must fill out.
 * It includes ID verification, personal info, and digital signature.
 */

import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Shield,
  User,
  MapPin,
  CreditCard,
  Camera,
  FileSignature,
  Check,
  Loader2,
  Upload,
  AlertTriangle,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface CoStar2257VerificationFormProps {
  inviteToken: string;
  inviterName: string;
  platformName: string;
}

interface FormData {
  // Personal Info
  legalFirstName: string;
  legalLastName: string;
  stageName: string;
  dateOfBirth: string;
  pronouns: string;
  chosenHandle: string;

  // Contact
  email: string;
  phone: string;

  // Address
  streetAddress: string;
  city: string;
  stateProvince: string;
  postalCode: string;
  country: string;

  // ID Verification
  idType: string;
  idNumber: string;
  idIssuingAuthority: string;
  idExpirationDate: string;

  // Agreements
  termsAccepted: boolean;
  privacyAccepted: boolean;
  releaseAccepted: boolean;
  ageConfirmed: boolean;
}

const initialFormData: FormData = {
  legalFirstName: "",
  legalLastName: "",
  stageName: "",
  dateOfBirth: "",
  pronouns: "",
  chosenHandle: "",
  email: "",
  phone: "",
  streetAddress: "",
  city: "",
  stateProvince: "",
  postalCode: "",
  country: "United States",
  idType: "",
  idNumber: "",
  idIssuingAuthority: "",
  idExpirationDate: "",
  termsAccepted: false,
  privacyAccepted: false,
  releaseAccepted: false,
  ageConfirmed: false,
};

const steps = [
  { id: 1, title: "Personal Information", icon: User },
  { id: 2, title: "Contact & Address", icon: MapPin },
  { id: 3, title: "ID Verification", icon: CreditCard },
  { id: 4, title: "Photo Verification", icon: Camera },
  { id: 5, title: "Agreements & Signature", icon: FileSignature },
];

export function CoStar2257VerificationForm({
  inviteToken,
  inviterName,
  platformName,
}: CoStar2257VerificationFormProps) {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [idFrontFile, setIdFrontFile] = useState<File | null>(null);
  const [idBackFile, setIdBackFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [signature, setSignature] = useState<string>("");
  const [isComplete, setIsComplete] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const submitVerificationMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", `/api/costar/verify/${inviteToken}`, data);
      return response.json();
    },
    onSuccess: (data) => {
      setIsComplete(true);
      toast({
        title: "Verification Complete!",
        description: `Your verification is complete. ${inviterName} can now tag you as @${formData.chosenHandle}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit verification",
        variant: "destructive",
      });
    },
  });

  const updateFormData = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
    setter: (file: File | null) => void
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload a file smaller than 10MB",
          variant: "destructive",
        });
        return;
      }
      setter(file);
    }
  };

  // Signature canvas handlers
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
      }
    }
  }, [currentStep]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.beginPath();
        ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
        setIsDrawing(true);
      }
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
        ctx.stroke();
      }
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      setSignature(canvas.toDataURL("image/png"));
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        setSignature("");
      }
    }
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(
          formData.legalFirstName &&
          formData.legalLastName &&
          formData.dateOfBirth &&
          formData.chosenHandle
        );
      case 2:
        return !!(
          formData.email &&
          formData.streetAddress &&
          formData.city &&
          formData.stateProvince &&
          formData.postalCode &&
          formData.country
        );
      case 3:
        return !!(
          formData.idType &&
          formData.idNumber &&
          formData.idIssuingAuthority
        );
      case 4:
        return !!(idFrontFile && selfieFile);
      case 5:
        return !!(
          formData.termsAccepted &&
          formData.privacyAccepted &&
          formData.releaseAccepted &&
          formData.ageConfirmed &&
          signature
        );
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) {
      toast({
        title: "Missing Information",
        description: "Please complete all required fields",
        variant: "destructive",
      });
      return;
    }
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(5)) {
      toast({
        title: "Missing Information",
        description: "Please complete all required fields and sign",
        variant: "destructive",
      });
      return;
    }

    // Create FormData for file uploads
    const submitData = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      submitData.append(key, String(value));
    });
    submitData.append("digitalSignature", signature);
    if (idFrontFile) submitData.append("idFrontImage", idFrontFile);
    if (idBackFile) submitData.append("idBackImage", idBackFile);
    if (selfieFile) submitData.append("selfieImage", selfieFile);

    submitVerificationMutation.mutate(submitData);
  };

  if (isComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center">
              <Check className="h-8 w-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Verification Complete!</h2>
            <p className="text-muted-foreground mb-4">
              Your identity has been verified. {inviterName} can now tag you as{" "}
              <span className="font-mono text-primary">@{formData.chosenHandle}</span> in their content.
            </p>
            <p className="text-sm text-muted-foreground">
              Only {inviterName} has permission to tag you. Other creators would need to invite you separately.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Shield className="h-12 w-12 mx-auto mb-4 text-primary" />
          <h1 className="text-3xl font-bold mb-2">Co-Star Verification</h1>
          <p className="text-muted-foreground">
            {inviterName} has invited you to verify your identity for {platformName}
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-between mb-8">
          {steps.map((step, index) => {
            const StepIcon = step.icon;
            const isActive = currentStep === step.id;
            const isComplete = currentStep > step.id;
            return (
              <div key={step.id} className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-colors ${
                    isComplete
                      ? "bg-green-500 text-white"
                      : isActive
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isComplete ? <Check className="h-5 w-5" /> : <StepIcon className="h-5 w-5" />}
                </div>
                <span
                  className={`text-xs text-center ${
                    isActive ? "text-primary font-medium" : "text-muted-foreground"
                  }`}
                >
                  {step.title}
                </span>
                {index < steps.length - 1 && (
                  <div
                    className={`hidden sm:block absolute top-5 left-full w-full h-0.5 ${
                      isComplete ? "bg-green-500" : "bg-muted"
                    }`}
                    style={{ marginLeft: "1.25rem", width: "calc(100% - 2.5rem)" }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Form Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {(() => {
                const StepIcon = steps[currentStep - 1].icon;
                return <StepIcon className="h-5 w-5" />;
              })()}
              {steps[currentStep - 1].title}
            </CardTitle>
            <CardDescription>
              Step {currentStep} of {steps.length}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="legalFirstName">Legal First Name *</Label>
                    <Input
                      id="legalFirstName"
                      value={formData.legalFirstName}
                      onChange={(e) => updateFormData("legalFirstName", e.target.value)}
                      placeholder="John"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="legalLastName">Legal Last Name *</Label>
                    <Input
                      id="legalLastName"
                      value={formData.legalLastName}
                      onChange={(e) => updateFormData("legalLastName", e.target.value)}
                      placeholder="Doe"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stageName">Stage Name (Optional)</Label>
                  <Input
                    id="stageName"
                    value={formData.stageName}
                    onChange={(e) => updateFormData("stageName", e.target.value)}
                    placeholder="Your performer name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => updateFormData("dateOfBirth", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pronouns">Pronouns (Optional)</Label>
                    <Select
                      value={formData.pronouns}
                      onValueChange={(value) => updateFormData("pronouns", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="he/him">He/Him</SelectItem>
                        <SelectItem value="she/her">She/Her</SelectItem>
                        <SelectItem value="they/them">They/Them</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="chosenHandle">Choose Your @Username *</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                    <Input
                      id="chosenHandle"
                      value={formData.chosenHandle}
                      onChange={(e) =>
                        updateFormData("chosenHandle", e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))
                      }
                      placeholder="username"
                      className="pl-8"
                      required
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This is how {inviterName} will tag you in content. Only letters, numbers, and underscores.
                  </p>
                </div>
              </>
            )}

            {/* Step 2: Contact & Address */}
            {currentStep === 2 && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateFormData("email", e.target.value)}
                      placeholder="you@email.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => updateFormData("phone", e.target.value)}
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="streetAddress">Street Address *</Label>
                  <Input
                    id="streetAddress"
                    value={formData.streetAddress}
                    onChange={(e) => updateFormData("streetAddress", e.target.value)}
                    placeholder="123 Main St"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => updateFormData("city", e.target.value)}
                      placeholder="New York"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stateProvince">State/Province *</Label>
                    <Input
                      id="stateProvince"
                      value={formData.stateProvince}
                      onChange={(e) => updateFormData("stateProvince", e.target.value)}
                      placeholder="NY"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Postal Code *</Label>
                    <Input
                      id="postalCode"
                      value={formData.postalCode}
                      onChange={(e) => updateFormData("postalCode", e.target.value)}
                      placeholder="10001"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country *</Label>
                    <Select
                      value={formData.country}
                      onValueChange={(value) => updateFormData("country", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="United States">United States</SelectItem>
                        <SelectItem value="Canada">Canada</SelectItem>
                        <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                        <SelectItem value="Australia">Australia</SelectItem>
                        <SelectItem value="Germany">Germany</SelectItem>
                        <SelectItem value="France">France</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}

            {/* Step 3: ID Verification */}
            {currentStep === 3 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="idType">ID Type *</Label>
                  <Select
                    value={formData.idType}
                    onValueChange={(value) => updateFormData("idType", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select ID type..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="drivers_license">Driver's License</SelectItem>
                      <SelectItem value="passport">Passport</SelectItem>
                      <SelectItem value="national_id">National/State ID</SelectItem>
                      <SelectItem value="other">Other Government ID</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="idNumber">ID Number *</Label>
                  <Input
                    id="idNumber"
                    value={formData.idNumber}
                    onChange={(e) => updateFormData("idNumber", e.target.value)}
                    placeholder="Enter your ID number"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Your ID number is encrypted and stored securely.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="idIssuingAuthority">Issuing Authority *</Label>
                    <Input
                      id="idIssuingAuthority"
                      value={formData.idIssuingAuthority}
                      onChange={(e) => updateFormData("idIssuingAuthority", e.target.value)}
                      placeholder="e.g., State of California"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="idExpirationDate">Expiration Date</Label>
                    <Input
                      id="idExpirationDate"
                      type="date"
                      value={formData.idExpirationDate}
                      onChange={(e) => updateFormData("idExpirationDate", e.target.value)}
                    />
                  </div>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                  <div className="flex gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-yellow-500">Important</p>
                      <p className="text-muted-foreground">
                        Your ID must be current and unexpired. Expired or altered IDs will result in rejection.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Step 4: Photo Verification */}
            {currentStep === 4 && (
              <>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Front of ID *</Label>
                    <div className="border-2 border-dashed rounded-lg p-6 text-center">
                      {idFrontFile ? (
                        <div className="space-y-2">
                          <Check className="h-8 w-8 mx-auto text-green-500" />
                          <p className="text-sm font-medium">{idFrontFile.name}</p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setIdFrontFile(null)}
                          >
                            Remove
                          </Button>
                        </div>
                      ) : (
                        <label className="cursor-pointer">
                          <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                          <p className="text-sm font-medium">Upload front of ID</p>
                          <p className="text-xs text-muted-foreground">PNG, JPG up to 10MB</p>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleFileUpload(e, setIdFrontFile)}
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Back of ID (if applicable)</Label>
                    <div className="border-2 border-dashed rounded-lg p-6 text-center">
                      {idBackFile ? (
                        <div className="space-y-2">
                          <Check className="h-8 w-8 mx-auto text-green-500" />
                          <p className="text-sm font-medium">{idBackFile.name}</p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setIdBackFile(null)}
                          >
                            Remove
                          </Button>
                        </div>
                      ) : (
                        <label className="cursor-pointer">
                          <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                          <p className="text-sm font-medium">Upload back of ID</p>
                          <p className="text-xs text-muted-foreground">PNG, JPG up to 10MB</p>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleFileUpload(e, setIdBackFile)}
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Selfie Verification *</Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      Take a clear photo of yourself holding your ID next to your face.
                    </p>
                    <div className="border-2 border-dashed rounded-lg p-6 text-center">
                      {selfieFile ? (
                        <div className="space-y-2">
                          <Check className="h-8 w-8 mx-auto text-green-500" />
                          <p className="text-sm font-medium">{selfieFile.name}</p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setSelfieFile(null)}
                          >
                            Remove
                          </Button>
                        </div>
                      ) : (
                        <label className="cursor-pointer">
                          <Camera className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                          <p className="text-sm font-medium">Upload selfie with ID</p>
                          <p className="text-xs text-muted-foreground">PNG, JPG up to 10MB</p>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleFileUpload(e, setSelfieFile)}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Step 5: Agreements & Signature */}
            {currentStep === 5 && (
              <>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="ageConfirmed"
                      checked={formData.ageConfirmed}
                      onCheckedChange={(checked) =>
                        updateFormData("ageConfirmed", checked as boolean)
                      }
                    />
                    <label htmlFor="ageConfirmed" className="text-sm">
                      I confirm that I am at least 18 years of age and legally permitted to participate
                      in adult content creation in my jurisdiction.
                    </label>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="termsAccepted"
                      checked={formData.termsAccepted}
                      onCheckedChange={(checked) =>
                        updateFormData("termsAccepted", checked as boolean)
                      }
                    />
                    <label htmlFor="termsAccepted" className="text-sm">
                      I have read and agree to the{" "}
                      <a href="/terms" className="text-primary underline" target="_blank">
                        Terms of Service
                      </a>{" "}
                      and understand that my information will be retained for 2257 compliance purposes.
                    </label>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="privacyAccepted"
                      checked={formData.privacyAccepted}
                      onCheckedChange={(checked) =>
                        updateFormData("privacyAccepted", checked as boolean)
                      }
                    />
                    <label htmlFor="privacyAccepted" className="text-sm">
                      I have read and agree to the{" "}
                      <a href="/privacy" className="text-primary underline" target="_blank">
                        Privacy Policy
                      </a>
                      .
                    </label>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="releaseAccepted"
                      checked={formData.releaseAccepted}
                      onCheckedChange={(checked) =>
                        updateFormData("releaseAccepted", checked as boolean)
                      }
                    />
                    <label htmlFor="releaseAccepted" className="text-sm">
                      I grant {inviterName} permission to include me in their content and to tag me
                      using the @username I have chosen. I understand only they can tag me.
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Digital Signature *</Label>
                  <p className="text-xs text-muted-foreground">
                    Sign in the box below using your mouse or finger.
                  </p>
                  <div className="border rounded-lg overflow-hidden">
                    <canvas
                      ref={canvasRef}
                      width={400}
                      height={150}
                      className="w-full bg-white cursor-crosshair"
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                    />
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={clearSignature}>
                    Clear Signature
                  </Button>
                </div>

                <div className="bg-muted/50 rounded-lg p-4 text-sm">
                  <p className="font-medium mb-2">Sworn Declaration</p>
                  <p className="text-muted-foreground">
                    Under 28 U.S.C. § 1746 and penalty of perjury, I declare that all information
                    provided is true and accurate. I understand that providing false information may
                    result in legal consequences.
                  </p>
                </div>
              </>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-4">
              {currentStep > 1 && (
                <Button type="button" variant="outline" onClick={handleBack}>
                  Back
                </Button>
              )}
              <div className="ml-auto">
                {currentStep < steps.length ? (
                  <Button onClick={handleNext} className="glow-effect">
                    Continue
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={submitVerificationMutation.isPending}
                    className="glow-effect"
                  >
                    {submitVerificationMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <FileSignature className="h-4 w-4 mr-2" />
                        Submit Verification
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer Notice */}
        <div className="mt-8 text-center text-xs text-muted-foreground">
          <p>This verification is required by 18 U.S.C. § 2257.</p>
          <p>Your data is encrypted and stored securely for a minimum of 7 years.</p>
          <p className="mt-2">© 2025 FANZ™ Group Holdings LLC</p>
        </div>
      </div>
    </div>
  );
}

export default CoStar2257VerificationForm;
