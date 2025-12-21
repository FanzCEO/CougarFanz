import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Shield, AlertTriangle, CheckCircle, FileText, Upload, Camera, Lock, Fingerprint, Database } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Schema for Content Creator Verification
const contentCreatorVerificationSchema = z.object({
  // Creator Identification
  fullLegalName: z.string().min(1, "Full legal name is required"),
  stageName: z.string().optional(),
  creatorStory: z.string().max(200, "Story must be 200 characters or less").optional(),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  age: z.number().min(18, "Must be 18 or older"),
  pronouns: z.string().optional(),
  countryOfCitizenship: z.string().min(1, "Country is required"),
  residentialAddress: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  stateProvince: z.string().min(1, "State/Province is required"),
  zipPostalCode: z.string().min(1, "ZIP/Postal code is required"),
  mobilePhone: z.string().min(1, "Mobile phone is required"),
  emailAddress: z.string().email("Valid email is required"),

  // Identification Verification
  identificationType: z.array(z.enum(["drivers_license", "passport", "national_id", "other"])).min(1, "Select at least one ID type"),
  driversLicenseNumber: z.string().optional(),
  driversLicenseState: z.string().optional(),
  passportNumber: z.string().optional(),
  passportCountry: z.string().optional(),
  nationalIdNumber: z.string().optional(),
  nationalIdAuthority: z.string().optional(),
  otherIdType: z.string().optional(),
  otherIdNumber: z.string().optional(),

  // Digital Verification
  photoIdUploaded: z.boolean().refine(val => val === true, "Photo ID upload required"),
  selfieVerified: z.boolean().refine(val => val === true, "Selfie verification required"),
  ageMetadataValidated: z.boolean().refine(val => val === true, "Age validation required"),
  blockchainIdOptIn: z.boolean().optional(),
  signatureCaptured: z.boolean().refine(val => val === true, "Signature required"),
  twoFactorSetup: z.boolean().refine(val => val === true, "2FA setup required"),

  // Certifications
  certifyIndependentCreator: z.boolean().refine(val => val === true, "Must certify independent creator status"),
  certifyRetainOwnership: z.boolean().refine(val => val === true, "Must acknowledge content ownership"),
  certify2257Compliance: z.boolean().refine(val => val === true, "Must certify 2257 compliance"),
  certifyAllPerformers18: z.boolean().refine(val => val === true, "Must certify all performers are 18+"),
  certifyDistributionRights: z.boolean().refine(val => val === true, "Must certify distribution rights"),

  // Content Policy Acknowledgment
  acknowledgeProhibitedContent: z.boolean().refine(val => val === true, "Must acknowledge prohibited content"),
  acknowledgeProhibitedConduct: z.boolean().refine(val => val === true, "Must acknowledge prohibited conduct"),
  acknowledgeZeroTolerance: z.boolean().refine(val => val === true, "Must acknowledge zero tolerance policy"),

  // Legal Agreements
  acknowledgeContentOwnership: z.boolean().refine(val => val === true, "Must acknowledge content ownership"),
  acknowledgeDataPrivacy: z.boolean().refine(val => val === true, "Must acknowledge data privacy"),
  acceptArbitration: z.boolean().refine(val => val === true, "Must accept arbitration clause"),
  acceptIndemnification: z.boolean().refine(val => val === true, "Must accept indemnification"),

  // Sworn Declaration
  swornDeclarationAllIdsValid: z.boolean().refine(val => val === true, "Must swear IDs are valid"),
  swornDeclarationAllPerformersVerified: z.boolean().refine(val => val === true, "Must swear performers verified"),
  swornDeclarationMaintain2257: z.boolean().refine(val => val === true, "Must swear to maintain 2257 records"),
  swornDeclarationFreelyEntering: z.boolean().refine(val => val === true, "Must swear entering freely"),

  // Signature
  signatureDate: z.string().min(1, "Signature date required"),
  electronicSignatureAcknowledged: z.boolean().refine(val => val === true, "Must acknowledge electronic signature"),

  // Optional
  notes: z.string().optional(),
});

type ContentCreatorVerificationForm = z.infer<typeof contentCreatorVerificationSchema>;

interface ContentCreatorVerificationFormProps {
  onSubmit?: (data: ContentCreatorVerificationForm) => void;
  initialData?: Partial<ContentCreatorVerificationForm>;
}

export function ContentCreatorVerificationForm({
  onSubmit,
  initialData,
}: ContentCreatorVerificationFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 7;

  const form = useForm<ContentCreatorVerificationForm>({
    resolver: zodResolver(contentCreatorVerificationSchema),
    defaultValues: initialData || {
      fullLegalName: "",
      stageName: "",
      creatorStory: "",
      dateOfBirth: "",
      age: 18,
      pronouns: "",
      countryOfCitizenship: "",
      residentialAddress: "",
      city: "",
      stateProvince: "",
      zipPostalCode: "",
      mobilePhone: "",
      emailAddress: "",
      identificationType: [],
      photoIdUploaded: false,
      selfieVerified: false,
      ageMetadataValidated: false,
      blockchainIdOptIn: false,
      signatureCaptured: false,
      twoFactorSetup: false,
      certifyIndependentCreator: false,
      certifyRetainOwnership: false,
      certify2257Compliance: false,
      certifyAllPerformers18: false,
      certifyDistributionRights: false,
      acknowledgeProhibitedContent: false,
      acknowledgeProhibitedConduct: false,
      acknowledgeZeroTolerance: false,
      acknowledgeContentOwnership: false,
      acknowledgeDataPrivacy: false,
      acceptArbitration: false,
      acceptIndemnification: false,
      swornDeclarationAllIdsValid: false,
      swornDeclarationAllPerformersVerified: false,
      swornDeclarationMaintain2257: false,
      swornDeclarationFreelyEntering: false,
      signatureDate: "",
      electronicSignatureAcknowledged: false,
      notes: "",
    },
  });

  const handleFormSubmit = async (data: ContentCreatorVerificationForm) => {
    setIsSubmitting(true);
    try {
      if (onSubmit) {
        await onSubmit(data);
      }
      toast({
        title: "Verification Submitted Successfully",
        description: "Your Content Creator verification has been submitted for review.",
      });
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: "An error occurred while submitting the form.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateAge = (dob: string) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card className="cyber-card border-cyan-500/30">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Shield className="w-12 h-12 text-cyan-400 mr-3" />
            <div className="text-left">
              <h1 className="text-2xl font-bold cyber-text-glow">FANZ™ Group Holdings LLC</h1>
              <p className="text-sm text-gray-400">Content Creator Verification, 2257 Compliance & Platform Agreement</p>
            </div>
          </div>
          <Badge variant="outline" className="mx-auto border-cyan-500 text-cyan-400">
            Effective Date: February 6, 2025 | Last Updated: February 6, 2025
          </Badge>
        </CardHeader>
      </Card>

      {/* Progress Tracker */}
      <Card className="cyber-card">
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Progress: Step {currentStep} of {totalSteps}</span>
              <span className="text-cyan-400">{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Mandatory Notice */}
      <Alert className="border-red-500/50 bg-red-500/10">
        <AlertTriangle className="h-4 w-4 text-red-500" />
        <AlertTitle className="text-red-400">⚠️ MANDATORY NOTICE</AlertTitle>
        <AlertDescription className="text-gray-300">
          This agreement must be completed and verified by all Primary Content Creators before uploading, publishing,
          or distributing any media through platforms operated by FANZ™ Group Holdings LLC. This document satisfies
          the requirements of <strong>18 U.S.C. § 2257</strong>, confirming that all individuals depicted in adult
          content are of legal age and have provided written consent.
        </AlertDescription>
      </Alert>

      {/* Main Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">

          {/* Step 1: Creator Identification */}
          {currentStep === 1 && (
            <Card className="cyber-card">
              <CardHeader>
                <CardTitle className="text-cyan-400">1. Creator Identification Information</CardTitle>
                <CardDescription>Provide your complete legal identification details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="fullLegalName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Legal Name *</FormLabel>
                        <FormControl>
                          <Input {...field} className="cyber-input" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="stageName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stage / Creator Name (optional)</FormLabel>
                        <FormControl>
                          <Input {...field} className="cyber-input" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="creatorStory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tell us about your story *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Textarea
                            {...field}
                            className="cyber-input resize-none"
                            placeholder="Share your story, what makes you unique, your content style..."
                            maxLength={200}
                            rows={3}
                          />
                          <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                            {field.value?.length || 0} / 200
                          </div>
                        </div>
                      </FormControl>
                      <FormDescription className="text-xs text-gray-400">
                        This will appear on your creator profile to help fans connect with you
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Birth *</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            className="cyber-input"
                            onChange={(e) => {
                              field.onChange(e);
                              const age = calculateAge(e.target.value);
                              form.setValue("age", age);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="age"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Age (must be 18+) *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            className="cyber-input"
                            disabled
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="pronouns"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pronouns (optional)</FormLabel>
                        <FormControl>
                          <Input {...field} className="cyber-input" placeholder="e.g., he/him, she/her, they/them" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="countryOfCitizenship"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country of Citizenship *</FormLabel>
                        <FormControl>
                          <Input {...field} className="cyber-input" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator className="my-4 bg-cyan-500/20" />

                <div className="grid grid-cols-1 gap-4">
                  <FormField
                    control={form.control}
                    name="residentialAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Residential Address *</FormLabel>
                        <FormControl>
                          <Input {...field} className="cyber-input" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City *</FormLabel>
                          <FormControl>
                            <Input {...field} className="cyber-input" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="stateProvince"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State / Province *</FormLabel>
                          <FormControl>
                            <Input {...field} className="cyber-input" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="zipPostalCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ZIP / Postal Code *</FormLabel>
                          <FormControl>
                            <Input {...field} className="cyber-input" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="mobilePhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mobile Phone *</FormLabel>
                          <FormControl>
                            <Input {...field} type="tel" className="cyber-input" placeholder="(   )      -" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="emailAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address *</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" className="cyber-input" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="flex justify-end mt-6">
                  <Button type="button" onClick={() => setCurrentStep(2)} className="bg-cyan-500">
                    Next Step →
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Identification Verification */}
          {currentStep === 2 && (
            <Card className="cyber-card">
              <CardHeader>
                <CardTitle className="text-cyan-400">2. Identification Verification</CardTitle>
                <CardDescription>Select and provide details for one or more valid forms of identification</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert className="border-yellow-500/50 bg-yellow-500/10">
                  <Lock className="h-4 w-4 text-yellow-500" />
                  <AlertDescription className="text-gray-300">
                    All IDs must be current, unexpired, and unaltered. Expired, altered, or falsified documents will
                    result in immediate suspension and may trigger a federal investigation.
                  </AlertDescription>
                </Alert>

                <FormField
                  control={form.control}
                  name="identificationType"
                  render={() => (
                    <FormItem>
                      <FormLabel>Select ID Type(s) *</FormLabel>
                      <div className="space-y-2">
                        {[
                          { value: "drivers_license", label: "Driver's License" },
                          { value: "passport", label: "Passport" },
                          { value: "national_id", label: "National / State ID" },
                          { value: "other", label: "Other" },
                        ].map((item) => (
                          <FormField
                            key={item.value}
                            control={form.control}
                            name="identificationType"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={item.value}
                                  className="flex flex-row items-start space-x-3 space-y-0"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(item.value as any)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...field.value, item.value])
                                          : field.onChange(
                                              field.value?.filter(
                                                (value: string) => value !== item.value
                                              )
                                            )
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal">
                                    {item.label}
                                  </FormLabel>
                                </FormItem>
                              )
                            }}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch("identificationType")?.includes("drivers_license") && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border border-cyan-500/30 rounded-lg">
                    <FormField
                      control={form.control}
                      name="driversLicenseNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Driver's License Number</FormLabel>
                          <FormControl>
                            <Input {...field} className="cyber-input" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="driversLicenseState"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State</FormLabel>
                          <FormControl>
                            <Input {...field} className="cyber-input" placeholder="e.g., WY" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {form.watch("identificationType")?.includes("passport") && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border border-cyan-500/30 rounded-lg">
                    <FormField
                      control={form.control}
                      name="passportNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Passport Number</FormLabel>
                          <FormControl>
                            <Input {...field} className="cyber-input" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="passportCountry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country</FormLabel>
                          <FormControl>
                            <Input {...field} className="cyber-input" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {form.watch("identificationType")?.includes("national_id") && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border border-cyan-500/30 rounded-lg">
                    <FormField
                      control={form.control}
                      name="nationalIdNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>National / State ID Number</FormLabel>
                          <FormControl>
                            <Input {...field} className="cyber-input" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="nationalIdAuthority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Issuing Authority</FormLabel>
                          <FormControl>
                            <Input {...field} className="cyber-input" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {form.watch("identificationType")?.includes("other") && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border border-cyan-500/30 rounded-lg">
                    <FormField
                      control={form.control}
                      name="otherIdType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Other ID Type (Specify)</FormLabel>
                          <FormControl>
                            <Input {...field} className="cyber-input" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="otherIdNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ID Number</FormLabel>
                          <FormControl>
                            <Input {...field} className="cyber-input" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                <div className="flex justify-between mt-6">
                  <Button type="button" variant="outline" onClick={() => setCurrentStep(1)}>
                    ← Previous
                  </Button>
                  <Button type="button" onClick={() => setCurrentStep(3)} className="bg-cyan-500">
                    Next Step →
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Digital & Biometric Verification */}
          {currentStep === 3 && (
            <Card className="cyber-card">
              <CardHeader>
                <CardTitle className="text-cyan-400 flex items-center">
                  <Fingerprint className="w-5 h-5 mr-2" />
                  3. Digital & Biometric Verification (Tech Layer)
                </CardTitle>
                <CardDescription>
                  Complete these verification steps through the secure FANZ™ Verification Portal
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <FormField
                    control={form.control}
                    name="photoIdUploaded"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border border-cyan-500/30 rounded-lg">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none flex-1">
                          <FormLabel className="flex items-center">
                            <Upload className="w-4 h-4 mr-2 text-cyan-400" />
                            Photo ID Upload *
                          </FormLabel>
                          <FormDescription className="text-xs">
                            Upload a high-resolution scan of your valid government ID
                          </FormDescription>
                          <Input type="file" accept="image/*" className="cyber-input mt-2" />
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="selfieVerified"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border border-cyan-500/30 rounded-lg">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none flex-1">
                          <FormLabel className="flex items-center">
                            <Camera className="w-4 h-4 mr-2 text-cyan-400" />
                            Selfie Verification *
                          </FormLabel>
                          <FormDescription className="text-xs">
                            Capture a live image for biometric face-matching
                          </FormDescription>
                          <Button type="button" variant="outline" size="sm" className="mt-2">
                            <Camera className="w-4 h-4 mr-2" />
                            Capture Selfie
                          </Button>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ageMetadataValidated"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border border-cyan-500/30 rounded-lg">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="flex items-center">
                            <Database className="w-4 h-4 mr-2 text-cyan-400" />
                            Age Metadata Validation *
                          </FormLabel>
                          <FormDescription className="text-xs">
                            Automated cross-check of date of birth and ID timestamps
                          </FormDescription>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="blockchainIdOptIn"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border border-purple-500/30 rounded-lg">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="flex items-center">
                            <Lock className="w-4 h-4 mr-2 text-purple-400" />
                            Blockchain ID Tag (Optional)
                          </FormLabel>
                          <FormDescription className="text-xs">
                            Generate a permanent verification hash stored on-chain
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="signatureCaptured"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border border-cyan-500/30 rounded-lg">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="flex items-center">
                            <FileText className="w-4 h-4 mr-2 text-cyan-400" />
                            Signature Capture *
                          </FormLabel>
                          <FormDescription className="text-xs">
                            Electronic signature stored with digital certificate
                          </FormDescription>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="twoFactorSetup"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border border-cyan-500/30 rounded-lg">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="flex items-center">
                            <Shield className="w-4 h-4 mr-2 text-cyan-400" />
                            2FA Setup *
                          </FormLabel>
                          <FormDescription className="text-xs">
                            Secure your Creator account through multi-factor authentication
                          </FormDescription>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-between mt-6">
                  <Button type="button" variant="outline" onClick={() => setCurrentStep(2)}>
                    ← Previous
                  </Button>
                  <Button type="button" onClick={() => setCurrentStep(4)} className="bg-cyan-500">
                    Next Step →
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Creator Certifications */}
          {currentStep === 4 && (
            <Card className="cyber-card border-yellow-500/30">
              <CardHeader>
                <CardTitle className="text-yellow-400">4. Certification of Independent Creator Status</CardTitle>
                <CardDescription>Acknowledge your responsibilities as an independent content creator</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert className="border-cyan-500/50 bg-cyan-500/10">
                  <Shield className="h-4 w-4 text-cyan-500" />
                  <AlertDescription className="text-gray-300 text-sm">
                    By signing this Agreement, you confirm that you are an independent content producer operating
                    under your own name or brand. You acknowledge that FANZ™ Group Holdings LLC and its subsidiaries
                    are hosting platforms, not producers.
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  <FormField
                    control={form.control}
                    name="certifyIndependentCreator"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            I confirm I am an <strong>independent content producer</strong> and FANZ™ is solely a hosting platform
                          </FormLabel>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="certifyRetainOwnership"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            I retain <strong>100% ownership and copyright</strong> over all original media uploaded
                          </FormLabel>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="certify2257Compliance"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            I am solely responsible for <strong>2257 compliance</strong> and maintaining identification records
                          </FormLabel>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="certifyAllPerformers18"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            All performers in my content are <strong>18 years or older, verified, and have signed consents</strong>
                          </FormLabel>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="certifyDistributionRights"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            I have obtained <strong>full distribution rights and authorization</strong> for all uploaded media
                          </FormLabel>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-between mt-6">
                  <Button type="button" variant="outline" onClick={() => setCurrentStep(3)}>
                    ← Previous
                  </Button>
                  <Button type="button" onClick={() => setCurrentStep(5)} className="bg-cyan-500">
                    Next Step →
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 5: Content Restrictions & Zero Tolerance */}
          {currentStep === 5 && (
            <Card className="cyber-card border-red-500/30">
              <CardHeader>
                <CardTitle className="text-red-400">5. Content Restrictions & Zero Tolerance Policy</CardTitle>
                <CardDescription>
                  Acknowledge prohibited content and conduct - violations result in immediate termination
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert className="border-red-500/50 bg-red-500/10">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <AlertTitle className="text-red-400">⚠️ ZERO TOLERANCE</AlertTitle>
                  <AlertDescription className="text-gray-300">
                    Uploading, distributing, or promoting any prohibited content will result in immediate account
                    termination and potential legal prosecution. Violations may result in federal reporting, permanent
                    ban, and asset forfeiture of unpaid balances.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div className="p-4 border border-red-500/30 rounded-lg bg-red-500/5">
                    <h4 className="font-semibold text-red-400 mb-3">Prohibited Content</h4>
                    <ul className="text-sm text-gray-300 space-y-2 list-disc list-inside">
                      <li><strong>CSAM (Child Sexual Abuse Material)</strong> — Any depiction of persons under 18</li>
                      <li><strong>Non-consensual content</strong> — Including revenge porn, hidden camera, or manipulated material</li>
                      <li><strong>Bestiality, incest, or necrophilia</strong> (real or simulated)</li>
                      <li><strong>Violent or coerced sexual acts</strong></li>
                      <li><strong>Drug or weapon trafficking content</strong></li>
                      <li><strong>Terrorism, hate speech, or extremist propaganda</strong></li>
                    </ul>
                  </div>

                  <div className="p-4 border border-red-500/30 rounded-lg bg-red-500/5">
                    <h4 className="font-semibold text-red-400 mb-3">Prohibited Conduct</h4>
                    <ul className="text-sm text-gray-300 space-y-2 list-disc list-inside">
                      <li><strong>Impersonation or identity fraud</strong></li>
                      <li><strong>Copyright infringement, piracy, or unlicensed material</strong></li>
                      <li><strong>Financial fraud, scams, or chargeback abuse</strong></li>
                      <li><strong>Use of bots, fake accounts, or artificial engagement</strong></li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-3 mt-4">
                  <FormField
                    control={form.control}
                    name="acknowledgeProhibitedContent"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            I acknowledge and understand the <strong>prohibited content policy</strong> and will not upload any such material
                          </FormLabel>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="acknowledgeProhibitedConduct"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            I acknowledge and understand the <strong>prohibited conduct policy</strong> and will not engage in such activities
                          </FormLabel>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="acknowledgeZeroTolerance"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            I understand FANZ™'s <strong>zero tolerance policy</strong> and accept immediate termination for violations
                          </FormLabel>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-between mt-6">
                  <Button type="button" variant="outline" onClick={() => setCurrentStep(4)}>
                    ← Previous
                  </Button>
                  <Button type="button" onClick={() => setCurrentStep(6)} className="bg-cyan-500">
                    Next Step →
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 6: Legal Agreements & Policies */}
          {currentStep === 6 && (
            <Card className="cyber-card border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-purple-400">6. Legal Agreements, Rights & Policies</CardTitle>
                <CardDescription>
                  Content ownership, data privacy, arbitration, and indemnification
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Content Rights */}
                <div className="p-4 border border-cyan-500/30 rounded-lg">
                  <h4 className="font-semibold text-cyan-400 mb-2">Content Rights, Ownership, & Monetization</h4>
                  <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
                    <li>You own all content you upload</li>
                    <li>FANZ™ provides hosting, distribution, and monetization tools only</li>
                    <li>You may set pricing, subscription models, and pay-per-view access</li>
                    <li>FANZ™ retains the right to remove violating content</li>
                    <li>FANZ™ takes no claim of copyright but reserves non-exclusive hosting rights</li>
                  </ul>
                </div>

                {/* Data Privacy */}
                <div className="p-4 border border-blue-500/30 rounded-lg">
                  <h4 className="font-semibold text-blue-400 mb-2">Data, Privacy, & Record-Keeping</h4>
                  <p className="text-sm text-gray-300 mb-2">All data handled in accordance with:</p>
                  <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
                    <li>18 U.S.C. § 2257 Record-Keeping Requirements</li>
                    <li>GDPR, CCPA, and international data protection laws</li>
                    <li>FANZ™'s Digital Identity & Compliance Security Protocol</li>
                  </ul>
                  <p className="text-xs text-gray-400 mt-2">
                    All records encrypted, timestamped, and stored for minimum 7 years. Access restricted to authorized compliance officers only.
                  </p>
                </div>

                {/* Arbitration */}
                <div className="p-4 border border-yellow-500/30 rounded-lg">
                  <h4 className="font-semibold text-yellow-400 mb-2">Arbitration, Jurisdiction & Dispute Resolution</h4>
                  <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
                    <li>Binding arbitration under American Arbitration Association (AAA)</li>
                    <li>Venue: Sheridan, Wyoming, USA (virtual with mutual consent)</li>
                    <li>Waive right to participate in class-action lawsuits</li>
                    <li>Governed by laws of the State of Wyoming</li>
                  </ul>
                </div>

                {/* Indemnification */}
                <div className="p-4 border border-orange-500/30 rounded-lg">
                  <h4 className="font-semibold text-orange-400 mb-2">Indemnification & Liability Waiver</h4>
                  <p className="text-sm text-gray-300 mb-2">
                    You agree to defend, indemnify, and hold harmless FANZ™ Group Holdings LLC from claims arising from:
                  </p>
                  <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
                    <li>Creation, uploading, or distribution of your content</li>
                    <li>Misrepresentation or failure to verify Co-Creators</li>
                    <li>Copyright, privacy, or defamation disputes</li>
                    <li>Breach of law or FANZ™'s policies</li>
                  </ul>
                  <p className="text-xs text-gray-400 mt-2">
                    FANZ™'s total liability shall not exceed your total earnings within the last six (6) months.
                  </p>
                </div>

                <div className="space-y-3 mt-4">
                  <FormField
                    control={form.control}
                    name="acknowledgeContentOwnership"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            I acknowledge and accept the <strong>content ownership and monetization</strong> terms
                          </FormLabel>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="acknowledgeDataPrivacy"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            I acknowledge and accept the <strong>data privacy and record-keeping</strong> terms
                          </FormLabel>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="acceptArbitration"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            I accept the <strong>binding arbitration clause</strong> and waive class-action rights
                          </FormLabel>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="acceptIndemnification"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            I accept the <strong>indemnification and liability waiver</strong> terms
                          </FormLabel>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-between mt-6">
                  <Button type="button" variant="outline" onClick={() => setCurrentStep(5)}>
                    ← Previous
                  </Button>
                  <Button type="button" onClick={() => setCurrentStep(7)} className="bg-cyan-500">
                    Next Step →
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 7: Sworn Declaration & Final Signature */}
          {currentStep === 7 && (
            <Card className="cyber-card border-red-500/30">
              <CardHeader>
                <CardTitle className="text-red-400">7. Sworn Declaration & Final Signature</CardTitle>
                <CardDescription>
                  Under 28 U.S.C. § 1746 and penalty of perjury
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert className="border-red-500/50 bg-red-500/10">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <AlertTitle className="text-red-400">Legal Warning - Penalty of Perjury</AlertTitle>
                  <AlertDescription className="text-gray-300">
                    Any false statement may subject the signer to civil and criminal penalties under federal law.
                    By signing, you declare under penalty of perjury that all information provided is true and correct.
                  </AlertDescription>
                </Alert>

                <div className="p-4 border border-cyan-500/30 rounded-lg bg-cyan-500/5">
                  <h4 className="font-semibold text-cyan-400 mb-3">Sworn Declaration by Content Creator</h4>
                  <p className="text-sm text-gray-300 mb-3">Under 28 U.S.C. § 1746 and penalty of perjury, I declare:</p>

                  <div className="space-y-3">
                    <FormField
                      control={form.control}
                      name="swornDeclarationAllIdsValid"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              All identification provided is <strong>valid and lawfully obtained</strong>
                            </FormLabel>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="swornDeclarationAllPerformersVerified"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              Every performer featured in my content is <strong>verified and over 18</strong>
                            </FormLabel>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="swornDeclarationMaintain2257"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              I am responsible for <strong>maintaining all required 2257 records</strong>
                            </FormLabel>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="swornDeclarationFreelyEntering"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              I am entering this agreement <strong>freely and without coercion</strong>
                            </FormLabel>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator className="my-4 bg-cyan-500/20" />

                {/* Electronic Signature */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-cyan-400">Electronic Signature & Legal Effect</h4>
                  <p className="text-sm text-gray-300">
                    By signing this Agreement electronically, you confirm your digital signature holds the same legal
                    weight as a handwritten one. You have read, understood, and accepted all terms herein.
                  </p>

                  <FormField
                    control={form.control}
                    name="signatureDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Signature Date *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} className="cyber-input" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="electronicSignatureAcknowledged"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border border-cyan-500/30 rounded-lg">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            I acknowledge my <strong>electronic signature</strong> is legally binding and this Agreement
                            remains effective as long as my creator account is active
                          </FormLabel>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-between mt-6">
                  <Button type="button" variant="outline" onClick={() => setCurrentStep(6)}>
                    ← Previous
                  </Button>
                  <Button
                    type="submit"
                    size="lg"
                    className="px-12 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <CheckCircle className="w-5 h-5 mr-2 animate-spin" />
                        Processing Verification...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Submit Content Creator Verification
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </form>
      </Form>

      {/* Footer */}
      <Card className="cyber-card">
        <CardContent className="pt-6">
          <div className="text-sm text-gray-400 space-y-2 text-center">
            <p className="font-semibold text-cyan-400">Jurisdiction</p>
            <p>
              This Agreement is governed by and enforceable under the laws of the State of Wyoming, USA.
            </p>
            <p className="pt-4">
              © 2025 FANZ™ Group Holdings LLC — All Rights Reserved.<br />
              FANZ™ | Empowerment. Ownership. Evolution.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
