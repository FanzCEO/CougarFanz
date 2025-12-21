/**
 * CoStarVerify Page - Public page for co-stars to complete verification
 *
 * Accessed via invite link: /costar/verify/:token
 */

import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { CoStar2257VerificationForm } from "@/components/costar";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, AlertTriangle, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface InvitationData {
  id: string;
  coStarName: string;
  creatorName: string;
  creatorHandle: string;
  platformName: string;
  status: string;
  expiresAt: string;
}

export default function CoStarVerify() {
  const params = useParams();
  const token = params.token as string;

  const {
    data: invitation,
    isLoading,
    error,
  } = useQuery<InvitationData>({
    queryKey: ["/api/costar/invite", token],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/costar/invite/${token}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to load invitation");
      }
      return response.json();
    },
    enabled: !!token,
    retry: false,
  });

  // Get platform name from env or default
  const platformName = import.meta.env.VITE_PLATFORM_NAME || "FANZ";

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Invalid or Expired Link</h2>
            <p className="text-muted-foreground mb-4">
              This verification link is invalid or has expired. Please contact the creator who
              invited you to request a new link.
            </p>
            <p className="text-sm text-muted-foreground">
              Invitation links expire after 30 days for security purposes.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if invitation is expired
  if (new Date(invitation.expiresAt) < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-500/10 flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Invitation Expired</h2>
            <p className="text-muted-foreground mb-4">
              This verification invitation has expired. Please contact{" "}
              <strong>{invitation.creatorName}</strong> to request a new invitation link.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if already completed
  if (invitation.status === "completed") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center">
              <Shield className="h-8 w-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Already Verified</h2>
            <p className="text-muted-foreground">
              You have already completed verification for this invitation.{" "}
              <strong>{invitation.creatorName}</strong> can now tag you in their content.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <CoStar2257VerificationForm
      inviteToken={token}
      inviterName={invitation.creatorName || "The Creator"}
      platformName={invitation.platformName || platformName}
    />
  );
}
