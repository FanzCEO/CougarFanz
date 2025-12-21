/**
 * CoStarInviteForm - Form for creator to invite a co-star
 *
 * After submitting, shows QR code and shareable link.
 * Co-star uses the link to complete their 2257 verification.
 */

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  Mail,
  Phone,
  QrCode,
  Copy,
  Check,
  Send,
  ArrowLeft,
  Plus,
  Loader2,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface CoStarInviteFormProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (invitations: CoStarInvitation[]) => void;
  onBack: () => void;
}

interface CoStarInvitation {
  id: string;
  coStarName: string;
  coStarEmail?: string;
  coStarPhone?: string;
  inviteToken: string;
  inviteUrl: string;
  qrCodeDataUrl: string;
  status: string;
}

interface CoStarFormData {
  name: string;
  email: string;
  phone: string;
}

export function CoStarInviteForm({
  isOpen,
  onClose,
  onComplete,
  onBack,
}: CoStarInviteFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<"form" | "result">("form");
  const [coStars, setCoStars] = useState<CoStarFormData[]>([
    { name: "", email: "", phone: "" },
  ]);
  const [createdInvitations, setCreatedInvitations] = useState<CoStarInvitation[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const createInvitationMutation = useMutation({
    mutationFn: async (coStarData: CoStarFormData) => {
      const response = await apiRequest("POST", "/api/costar/invitations", {
        coStarName: coStarData.name,
        coStarEmail: coStarData.email || undefined,
        coStarPhone: coStarData.phone || undefined,
      });
      return response.json();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create invitation",
        variant: "destructive",
      });
    },
  });

  const handleAddCoStar = () => {
    setCoStars([...coStars, { name: "", email: "", phone: "" }]);
  };

  const handleRemoveCoStar = (index: number) => {
    if (coStars.length > 1) {
      setCoStars(coStars.filter((_, i) => i !== index));
    }
  };

  const handleCoStarChange = (
    index: number,
    field: keyof CoStarFormData,
    value: string
  ) => {
    const updated = [...coStars];
    updated[index][field] = value;
    setCoStars(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate at least one co-star has a name
    const validCoStars = coStars.filter((cs) => cs.name.trim());
    if (validCoStars.length === 0) {
      toast({
        title: "Error",
        description: "Please enter at least one co-star name",
        variant: "destructive",
      });
      return;
    }

    // Validate email or phone for each
    for (const cs of validCoStars) {
      if (!cs.email && !cs.phone) {
        toast({
          title: "Error",
          description: `Please provide email or phone for ${cs.name}`,
          variant: "destructive",
        });
        return;
      }
    }

    try {
      const invitations: CoStarInvitation[] = [];
      for (const coStar of validCoStars) {
        const invitation = await createInvitationMutation.mutateAsync(coStar);
        invitations.push(invitation);
      }

      setCreatedInvitations(invitations);
      setStep("result");

      queryClient.invalidateQueries({ queryKey: ["/api/costar/invitations"] });
    } catch (error) {
      console.error("Failed to create invitations:", error);
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
      toast({
        title: "Copied!",
        description: "Link copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      });
    }
  };

  const handleDone = () => {
    onComplete(createdInvitations);
    // Reset state
    setStep("form");
    setCoStars([{ name: "", email: "", phone: "" }]);
    setCreatedInvitations([]);
  };

  const handleClose = () => {
    setStep("form");
    setCoStars([{ name: "", email: "", phone: "" }]);
    setCreatedInvitations([]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            {step === "form" ? "Invite Co-Star(s)" : "Invitation Created"}
          </DialogTitle>
          <DialogDescription>
            {step === "form"
              ? "Enter your co-star's information to send them a verification request."
              : "Share this link with your co-star to complete their verification."}
          </DialogDescription>
        </DialogHeader>

        {step === "form" ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            {coStars.map((coStar, index) => (
              <div
                key={index}
                className="p-4 border rounded-lg space-y-4 relative"
              >
                {coStars.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveCoStar(index)}
                    className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"
                  >
                    ×
                  </button>
                )}

                <div className="text-sm font-medium text-muted-foreground">
                  Co-Star {index + 1}
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`name-${index}`}>Full Name *</Label>
                  <Input
                    id={`name-${index}`}
                    placeholder="Enter co-star's full name"
                    value={coStar.name}
                    onChange={(e) =>
                      handleCoStarChange(index, "name", e.target.value)
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`email-${index}`} className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                  <Input
                    id={`email-${index}`}
                    type="email"
                    placeholder="costar@email.com"
                    value={coStar.email}
                    onChange={(e) =>
                      handleCoStarChange(index, "email", e.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`phone-${index}`} className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone
                  </Label>
                  <Input
                    id={`phone-${index}`}
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={coStar.phone}
                    onChange={(e) =>
                      handleCoStarChange(index, "phone", e.target.value)
                    }
                  />
                </div>

                <p className="text-xs text-muted-foreground">
                  * Email or phone required for sending invitation
                </p>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={handleAddCoStar}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Another Co-Star
            </Button>

            <DialogFooter className="gap-2">
              <Button type="button" variant="ghost" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button
                type="submit"
                disabled={createInvitationMutation.isPending}
                className="glow-effect"
              >
                {createInvitationMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Invitation{coStars.filter((c) => c.name).length > 1 ? "s" : ""}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-6">
            {createdInvitations.map((invitation) => (
              <div
                key={invitation.id}
                className="p-4 border rounded-lg space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{invitation.coStarName}</span>
                  <span className="text-xs px-2 py-1 bg-yellow-500/10 text-yellow-500 rounded-full">
                    Pending
                  </span>
                </div>

                {/* QR Code */}
                <div className="flex justify-center">
                  <div className="p-4 bg-white rounded-lg">
                    {invitation.qrCodeDataUrl ? (
                      <img
                        src={invitation.qrCodeDataUrl}
                        alt="QR Code"
                        className="w-48 h-48"
                      />
                    ) : (
                      <div className="w-48 h-48 flex items-center justify-center bg-muted">
                        <QrCode className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Shareable Link */}
                <div className="space-y-2">
                  <Label>Shareable Link</Label>
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      value={invitation.inviteUrl}
                      className="font-mono text-xs"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        copyToClipboard(invitation.inviteUrl, invitation.id)
                      }
                    >
                      {copiedId === invitation.id ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  This link expires in 30 days
                </p>
              </div>
            ))}

            <div className="bg-muted/50 rounded-lg p-4 text-sm">
              <p className="text-muted-foreground">
                <strong className="text-foreground">Next Steps:</strong>
              </p>
              <ol className="list-decimal list-inside mt-2 space-y-1 text-muted-foreground">
                <li>Share the link or QR code with your co-star</li>
                <li>They complete the verification form</li>
                <li>Once verified, you can tag them using @username</li>
                <li>Only YOU can tag this co-star in your content</li>
              </ol>
            </div>

            <DialogFooter>
              <Button onClick={handleDone} className="w-full glow-effect">
                Done - Continue with Upload
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default CoStarInviteForm;
