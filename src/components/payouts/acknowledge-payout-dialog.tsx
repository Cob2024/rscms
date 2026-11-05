"use client";

import { useState, useId } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { formatPesewas } from "@/lib/formatting/currency";
import { Loader2, X, CheckCheck, ShieldCheck } from "lucide-react";

interface PayoutRecord {
  id: string;
  actualAmount: number;
  channel: string | null;
  reference: string | null;
  member: {
    fullName: string;
  };
}

interface AcknowledgePayoutDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  payout: PayoutRecord | null;
}

export function AcknowledgePayoutDialog({
  isOpen,
  onClose,
  onSuccess,
  payout,
}: AcknowledgePayoutDialogProps) {
  const dialogId = useId();

  const [acknowledgement, setAcknowledgement] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !payout) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (acknowledgement.trim().length < 3) {
      setError("Please describe the recipient's acknowledgement (at least 3 characters).");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/payouts/${payout.id}/acknowledge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acknowledgement: acknowledgement.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to record acknowledgement.");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${dialogId}-title`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-md rounded-lg border bg-background p-6 shadow-xl">
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          aria-label="Close dialog"
          className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 disabled:pointer-events-none"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-4">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 mb-2">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Receipt Confirmation</span>
          </div>
          <h2 id={`${dialogId}-title`} className="text-xl font-bold tracking-tight">
            Record Recipient Acknowledgement
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Document that {payout.member.fullName} has confirmed receipt of funds.
          </p>
        </div>

        {/* Payout Details */}
        <div className="p-3 rounded-md border bg-muted/30 text-xs space-y-1 mb-4">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Recipient:</span>
            <span className="font-semibold">{payout.member.fullName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Disbursed Amount:</span>
            <span className="font-mono font-semibold">{formatPesewas(payout.actualAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Reference:</span>
            <span className="font-mono">{payout.reference || "—"}</span>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor={`${dialogId}-ack`}>Acknowledgement Evidence / Confirmation</Label>
            <textarea
              id={`${dialogId}-ack`}
              value={acknowledgement}
              onChange={(e) => setAcknowledgement(e.target.value)}
              placeholder="e.g. Member signed physical receipt voucher during weekly assembly, or confirmed via MoMo SMS."
              rows={3}
              required
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Recording...
                </>
              ) : (
                <>
                  <CheckCheck className="mr-2 h-4 w-4" />
                  Record Acknowledgement
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

