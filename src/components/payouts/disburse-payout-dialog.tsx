"use client";

import { useState, useId } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPesewas } from "@/lib/formatting/currency";
import { paymentChannels } from "@/lib/validation/payment";
import {
  Loader2,
  X,
  ArrowDownToLine,
  Smartphone,
  Banknote,
  Building,
  CreditCard,
  Sparkles,
} from "lucide-react";

interface PayoutRecord {
  id: string;
  expectedAmount: number;
  authorizedAmount: number;
  actualAmount: number;
  status: string;
  member: {
    fullName: string;
  };
}

interface DisbursePayoutDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  payout: PayoutRecord | null;
  availableFundsPesewas: number;
}

const channelLabels: Record<string, { label: string; icon: any; placeholder: string }> = {
  MTN_MOMO: {
    label: "MTN Mobile Money",
    icon: Smartphone,
    placeholder: "e.g. 19827364501 (MoMo Transfer ID)",
  },
  TELECEL_CASH: {
    label: "Telecel Cash",
    icon: Smartphone,
    placeholder: "e.g. TC-92837482",
  },
  AT_MONEY: {
    label: "AT Money",
    icon: Smartphone,
    placeholder: "e.g. AT-82736410",
  },
  CASH: {
    label: "Cash Envelope",
    icon: Banknote,
    placeholder: "e.g. CASH-DISB-00123",
  },
  BANK_TRANSFER: {
    label: "Bank Transfer",
    icon: Building,
    placeholder: "e.g. GCB-TRANSFER-8392",
  },
  OTHER: {
    label: "Other Channel",
    icon: CreditCard,
    placeholder: "e.g. REF-2025-001",
  },
};

export function DisbursePayoutDialog({
  isOpen,
  onClose,
  onSuccess,
  payout,
  availableFundsPesewas,
}: DisbursePayoutDialogProps) {
  const dialogId = useId();

  const [channel, setChannel] = useState<string>("MTN_MOMO");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !payout) return null;

  const handleGenerateCashReceipt = () => {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    setReference(`CASH-DISB-${dateStr}-${randomSuffix}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!reference.trim()) {
      setError("Please provide a transaction reference or voucher receipt number.");
      return;
    }

    if (payout.authorizedAmount > availableFundsPesewas) {
      setError(
        `Insufficient verified funds: group available balance is ${formatPesewas(
          availableFundsPesewas
        )}, but disbursement requires ${formatPesewas(payout.authorizedAmount)}.`
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/payouts/${payout.id}/disburse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel,
          reference: reference.trim(),
          notes: notes.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to disburse payout.");
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
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 mb-2">
            <ArrowDownToLine className="h-3.5 w-3.5" />
            <span>Fund Disbursement</span>
          </div>
          <h2 id={`${dialogId}-title`} className="text-xl font-bold tracking-tight">
            Record Payout Disbursement
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Confirm disbursement to {payout.member.fullName} and post double-entry ledger entries.
          </p>
        </div>

        {/* Payout Summary */}
        <div className="p-3.5 rounded-md border bg-muted/30 text-xs space-y-1.5 mb-4">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Recipient:</span>
            <span className="font-semibold text-foreground">{payout.member.fullName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Authorized Disbursement:</span>
            <span className="font-mono font-bold text-foreground">
              {formatPesewas(payout.authorizedAmount)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Available Group Funds:</span>
            <span className="font-mono font-semibold text-emerald-600">
              {formatPesewas(availableFundsPesewas)}
            </span>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Payment Channel Pills */}
          <div className="space-y-1.5">
            <Label>Disbursement Channel</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {paymentChannels.map((ch) => {
                const meta = channelLabels[ch] || channelLabels.OTHER;
                const Icon = meta.icon;
                const isSelected = channel === ch;
                return (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => {
                      setChannel(ch);
                      if (ch === "CASH" && !reference) {
                        handleGenerateCashReceipt();
                      }
                    }}
                    className={`flex items-center gap-2 p-2.5 rounded-md border text-left text-xs font-medium transition-all ${
                      isSelected
                        ? "border-primary ring-2 ring-primary/20 bg-primary/5 text-foreground shadow-sm"
                        : "border-border hover:bg-muted/50 text-muted-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{meta.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reference */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor={`${dialogId}-ref`}>Transaction Reference / Slip</Label>
              {channel === "CASH" && (
                <button
                  type="button"
                  onClick={handleGenerateCashReceipt}
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
                >
                  <Sparkles className="h-3 w-3" />
                  Generate Voucher ID
                </button>
              )}
            </div>
            <Input
              id={`${dialogId}-ref`}
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder={channelLabels[channel]?.placeholder || "Reference ID"}
              className="font-mono text-xs"
              required
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor={`${dialogId}-notes`}>Disbursement Notes (Optional)</Label>
            <Input
              id={`${dialogId}-notes`}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Sent via MTN MoMo merchant portal, fee absorbed by group"
              className="text-xs"
              maxLength={500}
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
                  Disbursing...
                </>
              ) : (
                <>
                  <ArrowDownToLine className="mr-2 h-4 w-4" />
                  Confirm Disbursement
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

