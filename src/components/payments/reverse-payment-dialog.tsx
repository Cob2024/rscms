"use client";

import { useState, useId } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { formatPesewas } from "@/lib/formatting/currency";
import { authFetch } from "@/lib/auth/auth-fetch";
import { Loader2, X, AlertTriangle, RotateCcw } from "lucide-react";

interface ReversePaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  payment: {
    id: string;
    reference: string | null;
    amount: number;
    channel: string;
    member: {
      fullName: string;
    };
  } | null;
}

export function ReversePaymentDialog({
  isOpen,
  onClose,
  onSuccess,
  payment,
}: ReversePaymentDialogProps) {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dialogId = useId();

  if (!isOpen || !payment) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (reason.trim().length < 5) {
      setError("Please provide a substantive reversal reason (at least 5 characters).");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await authFetch(`/api/payments/${payment.id}/reverse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to reverse payment.");
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
      <div className="relative w-full max-w-lg rounded-lg border bg-background p-6 shadow-xl">
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          aria-label="Close dialog"
          className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 disabled:pointer-events-none"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-destructive/10 text-destructive mb-2">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Financial Reversal</span>
          </div>
          <h2 id={`${dialogId}-title`} className="text-xl font-bold tracking-tight">
            Reverse Payment
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            This action will restore the member’s outstanding obligation and post a reversing
            entry in the group’s double-entry general ledger.
          </p>
        </div>

        {/* Payment Summary Box */}
        <div className="p-3.5 rounded-md border bg-muted/40 text-xs space-y-1.5 mb-4">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Member:</span>
            <span className="font-semibold text-foreground">{payment.member.fullName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Amount:</span>
            <span className="font-semibold text-foreground font-mono">
              {formatPesewas(payment.amount)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Reference:</span>
            <span className="font-mono text-foreground">{payment.reference || "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Channel:</span>
            <span>{payment.channel}</span>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor={`${dialogId}-reason`}>
              Administrative Justification / Reason <span className="text-destructive">*</span>
            </Label>
            <textarea
              id={`${dialogId}-reason`}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Duplicate MoMo entry, erroneous member credited, or check bounce."
              rows={3}
              required
              minLength={5}
              maxLength={500}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <p className="text-[11px] text-muted-foreground">
              This reason will be permanently recorded in the immutable audit log and ledger notes.
            </p>
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
            <Button type="submit" variant="destructive" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Reversing...
                </>
              ) : (
                <>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Confirm Reversal
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

