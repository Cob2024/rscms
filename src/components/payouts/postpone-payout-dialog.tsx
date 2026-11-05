"use client";

import { useState, useId } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { formatPesewas } from "@/lib/formatting/currency";
import { Loader2, X, Clock, AlertTriangle } from "lucide-react";

interface ScheduleItem {
  id: string;
  rotationPosition: number;
  periodShortfall: number;
  member: {
    fullName: string;
  };
  period: {
    periodNumber: number;
  };
}

interface PostponePayoutDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  schedule: ScheduleItem | null;
}

export function PostponePayoutDialog({
  isOpen,
  onClose,
  onSuccess,
  schedule,
}: PostponePayoutDialogProps) {
  const dialogId = useId();

  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !schedule) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (reason.trim().length < 5) {
      setError("Please provide a postponement reason (at least 5 characters).");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/payouts/${schedule.id}/postpone`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to postpone payout.");
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
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 mb-2">
            <Clock className="h-3.5 w-3.5" />
            <span>Option A: Postpone</span>
          </div>
          <h2 id={`${dialogId}-title`} className="text-xl font-bold tracking-tight">
            Postpone Payout
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Hold disbursement for Position {schedule.rotationPosition} ({schedule.member.fullName})
            until period contributions are collected.
          </p>
        </div>

        {schedule.periodShortfall > 0 && (
          <div className="mb-4 p-3 rounded-md border border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20 text-xs text-amber-900 dark:text-amber-200">
            Current Period {schedule.period.periodNumber} shortfall is{" "}
            <strong>{formatPesewas(schedule.periodShortfall)}</strong>.
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor={`${dialogId}-reason`}>Reason for Postponement</Label>
            <textarea
              id={`${dialogId}-reason`}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Awaiting 2 pending MoMo deposits before releasing group payout funds."
              rows={3}
              required
              minLength={5}
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
            <Button type="submit" variant="default" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Confirm Postponement"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

