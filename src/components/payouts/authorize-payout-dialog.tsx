"use client";

import { useState, useId } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPesewas } from "@/lib/formatting/currency";
import {
  Loader2,
  X,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Info,
} from "lucide-react";

interface ScheduleItem {
  id: string;
  rotationPosition: number;
  expectedAmount: number;
  scheduledDate: string;
  periodShortfall: number;
  member: {
    id: string;
    fullName: string;
    phoneNumber: string;
    rotationPosition: number;
  };
  period: {
    id: string;
    periodNumber: number;
    dueDate: string;
  };
}

interface AuthorizePayoutDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  schedule: ScheduleItem | null;
  availableFundsPesewas: number;
}

function parseCediToPesewas(input: string): number | null {
  const clean = input.trim().replace(/,/g, "");
  if (!clean) return null;
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(clean);
  if (!match) return null;
  const cedis = parseInt(match[1], 10);
  const pesewaPart = (match[2] || "").padEnd(2, "0").slice(0, 2);
  return cedis * 100 + parseInt(pesewaPart, 10);
}

export function AuthorizePayoutDialog({
  isOpen,
  onClose,
  onSuccess,
  schedule,
  availableFundsPesewas,
}: AuthorizePayoutDialogProps) {
  const dialogId = useId();

  const [amountStr, setAmountStr] = useState(
    schedule ? (schedule.expectedAmount / 100).toFixed(2) : "1000.00"
  );
  const [resolutionType, setResolutionType] = useState<string>("CARRY_FORWARD");
  const [reason, setReason] = useState("");
  const [groupAuthorized, setGroupAuthorized] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !schedule) return null;

  const hasShortfall = schedule.periodShortfall > 0;
  const parsedPesewas = parseCediToPesewas(amountStr) || 0;
  const isPartial = parsedPesewas < schedule.expectedAmount;
  const isException = hasShortfall || isPartial;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const pesewas = parseCediToPesewas(amountStr);
    if (!pesewas || pesewas <= 0) {
      setError("Please enter a valid positive authorized amount in Ghana Cedis.");
      return;
    }

    if (pesewas > schedule.expectedAmount) {
      setError(
        `Authorized amount cannot exceed the expected payout amount of ${formatPesewas(
          schedule.expectedAmount
        )}.`
      );
      return;
    }

    if (pesewas > availableFundsPesewas) {
      setError(
        `Authorized amount exceeds available verified group funds of ${formatPesewas(
          availableFundsPesewas
        )}.`
      );
      return;
    }

    if (isException) {
      if (!reason.trim()) {
        setError(
          "A substantive reason is required when authorizing a payout with outstanding period contributions or partial amounts."
        );
        return;
      }
      if (!groupAuthorized) {
        setError(
          "Confirmation that the group authorized this payout exception is required."
        );
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/payouts/${schedule.id}/authorize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountPesewas: pesewas,
          resolutionType: isException ? resolutionType : undefined,
          reason: isException ? reason.trim() : undefined,
          groupAuthorized,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to authorize payout.");
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
      <div className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-lg border bg-background p-6 shadow-xl">
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
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary mb-2">
            <span>Rotation Position {schedule.rotationPosition}</span>
          </div>
          <h2 id={`${dialogId}-title`} className="text-xl font-bold tracking-tight">
            Authorize Payout
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Review period financials and authorize disbursement for {schedule.member.fullName}.
          </p>
        </div>

        {/* Financial Context Card */}
        <div className="p-3.5 rounded-md border bg-muted/30 text-xs space-y-1.5 mb-4">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Recipient Member:</span>
            <span className="font-semibold">{schedule.member.fullName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Period Number:</span>
            <span>Period {schedule.period.periodNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Expected Full Payout:</span>
            <span className="font-mono font-semibold">
              {formatPesewas(schedule.expectedAmount)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Available Group Funds:</span>
            <span
              className={`font-mono font-semibold ${
                availableFundsPesewas < schedule.expectedAmount
                  ? "text-amber-600"
                  : "text-emerald-600"
              }`}
            >
              {formatPesewas(availableFundsPesewas)}
            </span>
          </div>
        </div>

        {/* Shortfall Alert */}
        {hasShortfall && (
          <div className="mb-4 flex items-start gap-2.5 rounded-md border border-amber-500/40 bg-amber-50 dark:bg-amber-950/40 p-3 text-xs text-amber-900 dark:text-amber-200">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
            <div>
              <p className="font-semibold">Period Contribution Shortfall</p>
              <p className="mt-0.5">
                One or more members have outstanding contributions totaling{" "}
                <strong className="font-mono">{formatPesewas(schedule.periodShortfall)}</strong>{" "}
                for this period. Authorizing this payout requires a documented resolution and
                confirmation of group consent.
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Authorized Amount */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor={`${dialogId}-amount`}>Authorized Amount (GH₵)</Label>
              {hasShortfall && (
                <button
                  type="button"
                  onClick={() => {
                    const partialAmount = Math.max(
                      0,
                      schedule.expectedAmount - schedule.periodShortfall
                    );
                    setAmountStr((partialAmount / 100).toFixed(2));
                    setResolutionType("PARTIAL_PAYOUT");
                  }}
                  className="text-xs text-primary hover:underline font-medium"
                >
                  Set to Available ({formatPesewas(Math.max(0, schedule.expectedAmount - schedule.periodShortfall))})
                </button>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-sm font-semibold text-muted-foreground">
                GH₵
              </span>
              <Input
                id={`${dialogId}-amount`}
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                className="pl-12 font-mono font-medium"
                required
              />
            </div>
          </div>

          {/* Exception Resolution Fields */}
          {isException && (
            <div className="space-y-3 p-3.5 rounded-md border bg-muted/20">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <ShieldAlert className="h-4 w-4 text-primary" />
                <span>Documented Exception Resolution</span>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor={`${dialogId}-resolution`}>Resolution Type</Label>
                <select
                  id={`${dialogId}-resolution`}
                  value={resolutionType}
                  onChange={(e) => setResolutionType(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="CARRY_FORWARD">
                    Option B — Carry forward outstanding contributions
                  </option>
                  <option value="PARTIAL_PAYOUT">
                    Option C — Approve partial payout of available funds
                  </option>
                  <option value="CUSTOM">
                    Option D — Other documented resolution
                  </option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor={`${dialogId}-reason`}>Administrative Decision Notes</Label>
                <textarea
                  id={`${dialogId}-reason`}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain the background and repayment agreement with the group."
                  rows={2}
                  required
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div className="flex items-start gap-2 pt-1">
                <input
                  id={`${dialogId}-group-consent`}
                  type="checkbox"
                  checked={groupAuthorized}
                  onChange={(e) => setGroupAuthorized(e.target.checked)}
                  required
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label
                  htmlFor={`${dialogId}-group-consent`}
                  className="text-xs cursor-pointer text-foreground"
                >
                  I confirm that the savings group has reviewed and approved this arrangement.
                </label>
              </div>
            </div>
          )}

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
                  Authorizing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Authorize Payout
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

