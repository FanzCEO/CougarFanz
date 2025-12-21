/**
 * CoStarPromptModal - Asks creator if their content features a co-star
 *
 * This modal appears when a creator attempts to upload media.
 * If they have a co-star, it directs them to the invitation flow.
 */

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Users, User, ArrowRight, Shield } from "lucide-react";

interface CoStarPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNoCoStar: () => void;
  onHasCoStar: () => void;
}

export function CoStarPromptModal({
  isOpen,
  onClose,
  onNoCoStar,
  onHasCoStar,
}: CoStarPromptModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            2257 Compliance Check
          </DialogTitle>
          <DialogDescription>
            Federal law requires verification of all performers appearing in adult content.
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          <h3 className="text-lg font-semibold mb-4 text-center">
            Does this content feature any other performers?
          </h3>

          <div className="grid grid-cols-2 gap-4">
            {/* Solo Content */}
            <button
              onClick={onNoCoStar}
              className="flex flex-col items-center p-6 rounded-lg border-2 border-border hover:border-primary hover:bg-primary/5 transition-all group"
            >
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-3 group-hover:bg-primary/10 transition-colors">
                <User className="h-8 w-8 text-muted-foreground group-hover:text-primary" />
              </div>
              <span className="font-medium">Solo Content</span>
              <span className="text-xs text-muted-foreground mt-1">Just me</span>
            </button>

            {/* Has Co-Star */}
            <button
              onClick={onHasCoStar}
              className="flex flex-col items-center p-6 rounded-lg border-2 border-border hover:border-primary hover:bg-primary/5 transition-all group"
            >
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-3 group-hover:bg-primary/10 transition-colors">
                <Users className="h-8 w-8 text-muted-foreground group-hover:text-primary" />
              </div>
              <span className="font-medium">With Co-Star(s)</span>
              <span className="text-xs text-muted-foreground mt-1">Other performers</span>
            </button>
          </div>
        </div>

        <div className="bg-muted/50 rounded-lg p-4 text-sm">
          <p className="text-muted-foreground">
            <strong className="text-foreground">Important:</strong> All performers in your content must complete
            identity verification before the content can be published. This is required by
            <strong className="text-foreground"> 18 U.S.C. § 2257</strong>.
          </p>
        </div>

        <DialogFooter className="sm:justify-center">
          <Button variant="ghost" onClick={onClose} className="text-muted-foreground">
            Cancel Upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default CoStarPromptModal;
