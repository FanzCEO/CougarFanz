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
import { Shield, AlertTriangle, CheckCircle, FileText, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Schema for FANZ™ Group Holdings LLC Co-Star Verification Form
const coStarVerificationSchema = z.object({
  // Co-Star Information
  legalName: z.string().min(1, "Legal name is required"),
  stageName: z.string().optional(),
  coStarStory: z.string().min(1, "Story is required").max(200, "Story must be 200 characters or less"),
  maidenName: z.string().optional(),
  previousLegalName: z.string().optional(),
  otherNames: z.string().optional(),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  age: z.number().min(18, "Must be 18 or older"),

  // Identification
  identificationType: z.enum(["drivers_license", "passport", "non_dl_id", "other"]),
  identificationNumber: z.string().min(1, "ID number is required"),
  identificationState: z.string().optional(),
  identificationOther: z.string().optional(),

  // Address
  address: z.string().min(1, "Address is required"),
  apt: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zipCode: z.string().min(1, "ZIP code is required"),
  cellPhone: z.string().min(1, "Cell phone is required"),
  homePhone: z.string().optional(),

  // Primary Creator Information
  primaryCreatorLegalName: z.string().min(1, "Primary creator legal name is required"),
  primaryCreatorStageName: z.string().optional(),
  contentCreationDate: z.string().min(1, "Content creation date is required"),

  // === Media / Publicity / Marketing License ===
  socialHandle: z.string().max(80).optional(),
  preferredCredit: z.string().max(120).optional(),

  grantMediaLicense: z.boolean().refine(v => v === true, "Media license is required"),
  grantNameLikeness: z.boolean().refine(v => v === true, "Name/likeness consent is required"),
  allowEditingAndDerivatives: z.boolean().refine(v => v === true, "Editing/derivatives consent is required"),
  allowPaidAdvertising: z.boolean().refine(v => v === true, "Paid advertising consent is required"),
  waiveApprovalRights: z.boolean().refine(v => v === true, "Approval waiver is required"),
  waiveCompensationClaims: z.boolean().refine(v => v === true, "Compensation waiver is required"),

  // === Brand statements / Non-disparagement / Truthfulness ===
  agreeSpeakHighly: z.boolean().refine(v => v === true, "Agreement to speak positively is required"),
  agreeNoDisparagement: z.boolean().refine(v => v === true, "Non-disparagement is required"),
  agreeNoFalseStatements: z.boolean().refine(v => v === true, "Truthfulness agreement is required"),

  // === DMCA + Forensics ===
  acknowledgeFanzForensic: z.boolean().refine(v => v === true, "FANZ Forensic acknowledgment required"),
  acknowledgeDmcaPartnership: z.boolean().refine(v => v === true, "DMCA partnership acknowledgment required"),
  consentEnforcementAndEvidenceUse: z.boolean().refine(v => v === true, "Enforcement/evidence consent required"),

  // === Legal mechanics ===
  releaseAndIndemnity: z.boolean().refine(v => v === true, "Release/indemnity is required"),
  electronicSignatureConsent: z.boolean().refine(v => v === true, "E-sign consent is required"),

  // Stronger "final gate"
  agreementInitials: z.string().min(2, "Initials required").max(5, "Max 5 characters"),

  // Certifications
  certifyAge18: z.boolean().refine(val => val === true, "Must certify age 18+"),
  certifyAllNames: z.boolean().refine(val => val === true, "Must certify all names disclosed"),
  certifyValidId: z.boolean().refine(val => val === true, "Must certify valid ID"),
  certifyNoIllegalActs: z.boolean().refine(val => val === true, "Must certify no illegal acts"),
  certifyFreelyEntering: z.boolean().refine(val => val === true, "Must certify entering freely"),

  // Signatures & Dates
  coStarSignatureDate: z.string().min(1, "Co-star signature date required"),
  coStarInitials: z.string().min(1, "Initials required"),
  primaryCreatorSignatureDate: z.string().min(1, "Primary creator signature date required"),

  // Document Uploads
  idFrontImage: z.any().optional(),
  idBackImage: z.any().optional(),
  holdingIdImage: z.any().optional(),
  additionalDocuments: z.any().optional(),

  // Notes
  notes: z.string().optional(),

  // Audit trail (optional but recommended)
  signerIp: z.string().optional(),
  signerUserAgent: z.string().optional(),
  agreementVersion: z.string().optional(),
});

type CoStarVerificationForm = z.infer<typeof coStarVerificationSchema>;

interface CoStarVerificationFormProps {
  mode?: "demo" | "production";
  onSubmit?: (data: CoStarVerificationForm) => void;
  initialData?: Partial<CoStarVerificationForm>;
}

export function CoStarVerificationForm({
  mode = "production",
  onSubmit,
  initialData,
}: CoStarVerificationFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CoStarVerificationForm>({
    resolver: zodResolver(coStarVerificationSchema),
    defaultValues: initialData || {
      legalName: "",
      stageName: "",
      coStarStory: "",
      maidenName: "",
      previousLegalName: "",
      otherNames: "",
      dateOfBirth: "",
      age: 18,
      identificationType: "drivers_license",
      identificationNumber: "",
      identificationState: "",
      address: "",
      apt: "",
      city: "",
      state: "",
      zipCode: "",
      cellPhone: "",
      homePhone: "",
      primaryCreatorLegalName: "",
      primaryCreatorStageName: "",
      contentCreationDate: "",
      // Media / Publicity / Marketing License
      socialHandle: "",
      preferredCredit: "",
      grantMediaLicense: false,
      grantNameLikeness: false,
      allowEditingAndDerivatives: false,
      allowPaidAdvertising: false,
      waiveApprovalRights: false,
      waiveCompensationClaims: false,
      // Brand statements / Non-disparagement / Truthfulness
      agreeSpeakHighly: false,
      agreeNoDisparagement: false,
      agreeNoFalseStatements: false,
      // DMCA + Forensics
      acknowledgeFanzForensic: false,
      acknowledgeDmcaPartnership: false,
      consentEnforcementAndEvidenceUse: false,
      // Legal mechanics
      releaseAndIndemnity: false,
      electronicSignatureConsent: false,
      agreementInitials: "",
      // Certifications
      certifyAge18: false,
      certifyAllNames: false,
      certifyValidId: false,
      certifyNoIllegalActs: false,
      certifyFreelyEntering: false,
      coStarSignatureDate: "",
      coStarInitials: "",
      primaryCreatorSignatureDate: "",
      notes: "",
      // Audit trail
      agreementVersion: "COS-2257-MR-PR-2025.02.06",
    },
  });

  const handleFormSubmit = async (data: CoStarVerificationForm) => {
    setIsSubmitting(true);
    try {
      if (onSubmit) {
        await onSubmit(data);
      }
      toast({
        title: "Form Submitted Successfully",
        description: "Co-Star verification form has been submitted for processing.",
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

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card className="cyber-card border-cyan-500/30">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Shield className="w-12 h-12 text-cyan-400 mr-3" />
            <div className="text-left">
              <h1 className="text-2xl font-bold cyber-text-glow">FANZ™ Group Holdings LLC</h1>
              <p className="text-sm text-gray-400">Adult Co-Star Model Release + 2257 Compliance</p>
            </div>
          </div>
          <Badge variant="outline" className="mx-auto border-cyan-500 text-cyan-400">
            Effective Date: February 6, 2025 | Last Updated: February 6, 2025
          </Badge>
        </CardHeader>
      </Card>

      {/* Demo Warning */}
      {mode === "demo" && (
        <Alert className="border-yellow-500/50 bg-yellow-500/10">
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
          <AlertTitle className="text-yellow-400">Demo Version</AlertTitle>
          <AlertDescription className="text-gray-300">
            This is a demo version of the Co-Star Consent Form. To complete an official and legally
            binding version, the primary Content Star must send a verified invitation link through the FANZ™ Platform.
          </AlertDescription>
        </Alert>
      )}

      {/* Purpose Notice */}
      <Card className="cyber-card">
        <CardHeader>
          <CardTitle className="flex items-center text-cyan-400">
            <FileText className="w-5 h-5 mr-2" />
            Purpose and Legal Scope
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-300 space-y-2">
          <p>
            This document ensures compliance with <strong>18 U.S.C. § 2257</strong>, protecting both Content Stars
            and Co-Stars who collaborate and distribute media through the platforms operated under FANZ™ Group Holdings LLC
            — including but not limited to its subsidiaries: Fanz™ Unlimited Network LLC, BoyFanz™, GirlFanz™, PupFanz™,
            and any other entities under the FANZ™ brand ecosystem.
          </p>
          <p>
            <strong>FANZ™ Group Holdings LLC does not produce or create media content.</strong> It acts solely as a
            digital hosting and technology platform enabling independent creators to distribute and monetize their work
            while maintaining full ownership and control of their intellectual property.
          </p>
        </CardContent>
      </Card>

      {/* Main Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">

          {/* Co-Star Information */}
          <Card className="cyber-card">
            <CardHeader>
              <CardTitle className="text-cyan-400">Co-Star Information</CardTitle>
              <CardDescription>All fields are required unless marked optional</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="legalName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Legal Name *</FormLabel>
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
                      <FormLabel>Stage Name (if any)</FormLabel>
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
                name="coStarStory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tell us about your story *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Textarea
                          {...field}
                          className="cyber-input resize-none"
                          placeholder="Share your story, what makes you unique, your style..."
                          maxLength={200}
                          rows={3}
                        />
                        <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                          {field.value?.length || 0} / 200
                        </div>
                      </div>
                    </FormControl>
                    <FormDescription className="text-xs text-gray-400">
                      This will appear on your co-star profile
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="maidenName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maiden Name (if applicable)</FormLabel>
                      <FormControl>
                        <Input {...field} className="cyber-input" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="previousLegalName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Previous Legal Name (if any)</FormLabel>
                      <FormControl>
                        <Input {...field} className="cyber-input" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="otherNames"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Other Names Known By</FormLabel>
                      <FormControl>
                        <Input {...field} className="cyber-input" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                      <FormLabel>Age</FormLabel>
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
              </div>

              <Separator className="my-4 bg-cyan-500/20" />

              {/* Identification Section */}
              <h3 className="text-lg font-semibold text-cyan-400 mt-4">Identification</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="identificationType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ID Type *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="cyber-input">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="drivers_license">Driver's License</SelectItem>
                          <SelectItem value="passport">Passport</SelectItem>
                          <SelectItem value="non_dl_id">Non-DL State ID</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="identificationNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ID Number *</FormLabel>
                      <FormControl>
                        <Input {...field} className="cyber-input" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {(form.watch("identificationType") === "drivers_license" ||
                  form.watch("identificationType") === "non_dl_id") && (
                  <FormField
                    control={form.control}
                    name="identificationState"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State *</FormLabel>
                        <FormControl>
                          <Input {...field} className="cyber-input" placeholder="e.g., WY" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {form.watch("identificationType") === "other" && (
                  <FormField
                    control={form.control}
                    name="identificationOther"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Specify ID Type *</FormLabel>
                        <FormControl>
                          <Input {...field} className="cyber-input" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <Separator className="my-4 bg-cyan-500/20" />

              {/* Address Section */}
              <h3 className="text-lg font-semibold text-cyan-400 mt-4">Address</h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-10">
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Street Address *</FormLabel>
                          <FormControl>
                            <Input {...field} className="cyber-input" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="col-span-2">
                    <FormField
                      control={form.control}
                      name="apt"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Apt</FormLabel>
                          <FormControl>
                            <Input {...field} className="cyber-input" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

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
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State *</FormLabel>
                        <FormControl>
                          <Input {...field} className="cyber-input" placeholder="e.g., WY" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="zipCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ZIP Code *</FormLabel>
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
                    name="cellPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cell Phone *</FormLabel>
                        <FormControl>
                          <Input {...field} type="tel" className="cyber-input" placeholder="(   )     -" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="homePhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Home Phone</FormLabel>
                        <FormControl>
                          <Input {...field} type="tel" className="cyber-input" placeholder="(   )     -" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Primary Creator Information */}
          <Card className="cyber-card">
            <CardHeader>
              <CardTitle className="text-cyan-400">Primary Creator Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="primaryCreatorLegalName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Creator Legal Name *</FormLabel>
                      <FormControl>
                        <Input {...field} className="cyber-input" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="primaryCreatorStageName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Creator Stage Name (if any)</FormLabel>
                      <FormControl>
                        <Input {...field} className="cyber-input" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contentCreationDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Content Creation *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} className="cyber-input" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Document Upload Section */}
          <Card className="cyber-card">
            <CardHeader>
              <CardTitle className="text-cyan-400 flex items-center">
                <Upload className="w-5 h-5 mr-2" />
                Required Documentation
              </CardTitle>
              <CardDescription>Upload clear, readable images of required identification documents</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>ID Front Image *</Label>
                  <Input type="file" accept="image/*" className="cyber-input" />
                  <p className="text-xs text-gray-400">Clear photo of the front of your ID</p>
                </div>

                <div className="space-y-2">
                  <Label>ID Back Image *</Label>
                  <Input type="file" accept="image/*" className="cyber-input" />
                  <p className="text-xs text-gray-400">Clear photo of the back of your ID</p>
                </div>

                <div className="space-y-2">
                  <Label>Holding ID Photo *</Label>
                  <Input type="file" accept="image/*" className="cyber-input" />
                  <p className="text-xs text-gray-400">Photo of you holding your ID next to your face</p>
                </div>

                <div className="space-y-2">
                  <Label>Additional Documents</Label>
                  <Input type="file" accept="image/*,.pdf" multiple className="cyber-input" />
                  <p className="text-xs text-gray-400">Any additional supporting documents</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Media License + FANZ Forensic + DMCA Partnership */}
          <Card className="cyber-card border-cyan-500/30">
            <CardHeader>
              <CardTitle className="text-cyan-400 flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Media License + FANZ Forensic + DMCA Partnership
              </CardTitle>
              <CardDescription>
                This section is mandatory if you appear in any content distributed through the FANZ ecosystem.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Agreement Text */}
              <div className="rounded-lg border border-cyan-500/20 bg-black/30 p-4 max-h-72 overflow-auto text-sm text-gray-300 whitespace-pre-line">
{`MEDIA + PUBLICITY LICENSE (IRONCLAD)
By checking the boxes below, Co-Star grants FANZ™ Group Holdings LLC, Fanz™ Unlimited Network LLC, and all affiliated brands, platforms, successors, assigns, partners, contractors, and sublicensees ("FANZ Parties") a worldwide, perpetual, irrevocable, transferable, sublicensable, fully-paid, royalty-free right and license to:
(1) use, reproduce, distribute, display, perform, publish, transmit, stream, host, store, archive, advertise, market, promote, and otherwise exploit any content, footage, images, clips, stills, audio, behind-the-scenes content, promotional assets, metadata, and excerpts that include or reference Co-Star ("Media"),
(2) in any and all media now known or later developed (including social, paid ads, TV/OTT, out-of-home, email, web, apps, partner networks),
(3) for marketing, PR, platform promotion, safety/compliance communications, and enforcement purposes,
(4) with the right to edit, crop, blur, watermark, add graphics/text, create compilations, excerpts, trailers, and derivative promotional works.

NO APPROVAL / NO COMPENSATION
Co-Star waives any right to inspect or approve any use of the Media or Co-Star's name/likeness/voice, and waives any claim to compensation for such use, except where a separate written agreement expressly provides compensation.

FANZ FORENSIC + DMCA ENFORCEMENT
Co-Star acknowledges FANZ may apply forensic watermarking, fingerprinting, hashing, and related tracking ("FANZ Forensic") to Media to deter piracy and verify authenticity. Co-Star authorizes FANZ Parties and their DMCA/enforcement partners to (a) send takedown notices, subpoenas, preservation requests, and platform enforcement actions, and (b) use copies of Media, metadata, watermarks, and verification records as evidence in disputes, claims, and enforcement actions.

SPEAK HIGHLY / NON-DISPARAGEMENT / TRUTHFULNESS
Co-Star agrees not to make, publish, or amplify statements that disparage the FANZ Parties, FANZ Forensic, or FANZ's enforcement/DMCA efforts. Co-Star further agrees not to make false or misleading statements about FANZ Parties or their services.

RELEASE + INDEMNITY
Co-Star releases FANZ Parties from claims arising out of authorized uses of the Media, including claims for invasion of privacy, right of publicity, defamation, emotional distress, or IP/publicity claims (except willful misconduct). Co-Star will indemnify and hold harmless FANZ Parties for losses arising from Co-Star's breach, false statements, or lack of rights/authority to grant the permissions herein.

E-SIGN + RECORDS
Co-Star consents to electronic signatures and acknowledges these records may be retained and produced for compliance and legal purposes, including 18 U.S.C. § 2257 record-keeping.`}
              </div>

              {/* Optional Social/Credit Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="socialHandle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Social Handle (optional)</FormLabel>
                      <FormControl>
                        <Input {...field} className="cyber-input" placeholder="@yourhandle" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="preferredCredit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred Credit (optional)</FormLabel>
                      <FormControl>
                        <Input {...field} className="cyber-input" placeholder="Stage name / preferred attribution" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator className="my-2 bg-cyan-500/20" />

              {/* Required Checkboxes */}
              <div className="space-y-3">
                <FormField
                  control={form.control}
                  name="grantMediaLicense"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-gray-200">I grant FANZ Parties a worldwide, perpetual, irrevocable, sublicensable license to use the Media anywhere (including paid ads, PR, and partner placements).</FormLabel>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="grantNameLikeness"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-gray-200">I grant permission to use my name, stage name, image/likeness, voice, and biographical info for promotion and platform marketing.</FormLabel>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="allowEditingAndDerivatives"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-gray-200">I allow editing, cropping, watermarking, compilations, excerpts, and derivative promotional works (including trailers and social clips).</FormLabel>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="allowPaidAdvertising"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-gray-200">I authorize use of the Media in paid advertising and sponsored placements across any channels.</FormLabel>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="waiveApprovalRights"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-gray-200">I waive any right to inspect or approve how the Media is used or presented.</FormLabel>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="waiveCompensationClaims"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-gray-200">I waive claims for additional compensation for authorized marketing/PR uses unless a separate written agreement states otherwise.</FormLabel>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                <Separator className="my-2 bg-cyan-500/20" />

                <FormField
                  control={form.control}
                  name="acknowledgeFanzForensic"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-gray-200">I acknowledge and consent to FANZ Forensic protections (watermarking/fingerprinting/hashing) for anti-piracy and authenticity verification.</FormLabel>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="acknowledgeDmcaPartnership"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-gray-200">I acknowledge FANZ's DMCA/enforcement partnerships and authorize enforcement actions on my behalf as needed.</FormLabel>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="consentEnforcementAndEvidenceUse"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-gray-200">I consent to FANZ using the Media, watermarks, metadata, and verification records as evidence for enforcement, disputes, and legal compliance.</FormLabel>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                <Separator className="my-2 bg-cyan-500/20" />

                <FormField
                  control={form.control}
                  name="agreeSpeakHighly"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-gray-200">I agree to speak positively about FANZ, including FANZ Forensic and FANZ's DMCA enforcement efforts, when publicly referencing them.</FormLabel>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="agreeNoDisparagement"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-gray-200">I agree to a strict non-disparagement obligation regarding FANZ Parties and their services.</FormLabel>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="agreeNoFalseStatements"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-gray-200">I agree not to make false, misleading, or unverified claims about FANZ Parties or their operations.</FormLabel>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                <Separator className="my-2 bg-cyan-500/20" />

                <FormField
                  control={form.control}
                  name="releaseAndIndemnity"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-gray-200">I agree to the release + indemnity obligations described above.</FormLabel>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="electronicSignatureConsent"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-gray-200">I consent to electronic signatures and to FANZ retaining these records for compliance (including 18 U.S.C. § 2257).</FormLabel>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              <Separator className="my-2 bg-cyan-500/20" />

              {/* Agreement Initials */}
              <FormField
                control={form.control}
                name="agreementInitials"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Initials (Required) *</FormLabel>
                    <FormControl>
                      <Input {...field} className="cyber-input" maxLength={5} placeholder="e.g., JS" />
                    </FormControl>
                    <FormDescription className="text-xs text-gray-400">
                      By initialing, you confirm you read and agree to the Media License + Forensics + DMCA terms above.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Certifications */}
          <Card className="cyber-card border-yellow-500/30">
            <CardHeader>
              <CardTitle className="text-yellow-400">Certification and Agreement</CardTitle>
              <CardDescription>All certifications must be checked to proceed</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="certifyAge18"
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
                        I certify that I am <strong>18 years of age or older</strong>
                      </FormLabel>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="certifyAllNames"
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
                        I certify I have <strong>disclosed all other names</strong> I have been known by
                      </FormLabel>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="certifyValidId"
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
                        I certify I have provided <strong>valid and accurate identification</strong>
                      </FormLabel>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="certifyNoIllegalActs"
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
                        I certify I will <strong>not engage in or permit any illegal acts or substances</strong> during production
                      </FormLabel>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="certifyFreelyEntering"
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
                        I certify I am entering this agreement <strong>freely and without coercion</strong>
                      </FormLabel>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Sworn Statements & Signatures */}
          <Card className="cyber-card border-red-500/30">
            <CardHeader>
              <CardTitle className="text-red-400">Sworn Statements & Signatures</CardTitle>
              <CardDescription>
                Under 28 U.S.C. § 1746 and penalty of perjury
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert className="border-red-500/50 bg-red-500/10">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <AlertTitle className="text-red-400">Legal Warning</AlertTitle>
                <AlertDescription className="text-gray-300">
                  Any false statement may subject the signer to civil and criminal penalties.
                  I declare the foregoing information is true and correct.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <h3 className="font-semibold text-cyan-400">Co-Star Acknowledgment</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="coStarInitials"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Co-Star Initials *</FormLabel>
                        <FormControl>
                          <Input {...field} className="cyber-input" maxLength={5} />
                        </FormControl>
                        <FormDescription className="text-xs">
                          I understand this information is required under federal law
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="coStarSignatureDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Co-Star Signature Date *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} className="cyber-input" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator className="my-4 bg-cyan-500/20" />

              <div className="space-y-4">
                <h3 className="font-semibold text-cyan-400">Primary Creator Verification</h3>
                <FormField
                  control={form.control}
                  name="primaryCreatorSignatureDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Creator Signature Date *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} className="cyber-input" />
                      </FormControl>
                      <FormDescription className="text-xs">
                        I confirm I have personally verified the Co-Star's valid photo ID and date of birth
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator className="my-4 bg-cyan-500/20" />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea {...field} className="cyber-input" rows={4} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Legal Agreement Footer */}
          <Card className="cyber-card">
            <CardContent className="pt-6">
              <div className="text-sm text-gray-400 space-y-2">
                <h4 className="font-semibold text-cyan-400">Jurisdiction</h4>
                <p>
                  This Agreement is governed by and enforceable under the laws of the State of Wyoming, USA.
                </p>
                <p className="pt-4">
                  © 2025 FANZ™ Group Holdings LLC — All Rights Reserved.<br />
                  FANZ™: Empowering the Creator Revolution.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-center">
            <Button
              type="submit"
              size="lg"
              className="w-full md:w-auto px-12 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <CheckCircle className="w-5 h-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Submit Co-Star Verification Form
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
