"use client";

import { useState, useId, useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { formatPesewas } from "@/lib/formatting/currency";
import { formatDate } from "@/lib/formatting/date";
import { paymentChannels } from "@/lib/validation/payment";
import { authFetch } from "@/lib/auth/auth-fetch";
import {
  Loader2,
  X,
  CreditCard,
  Banknote,
  Smartphone,
  Building,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Calendar,
  Users,
  Info,
  ArrowRight,
} from "lucide-react";

interface MemberOption {
  id: string;
  fullName: string;
  phoneNumber: string;
  rotationPosition: number;
}

interface ObligationOption {
  id: string;
  periodId: string;
  periodNumber: number;
  dueDate: string | Date;
  memberId: string;
  memberName: string;
  rotationPosition: number;
  amount: number;
  paidAmount: number;
  outstandingAmount: number;
  status: string;
}

interface ManualPaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (paymentId?: string) => void;
  members: MemberOption[];
  obligations: ObligationOption[];
  preselectedMemberId?: string;
  preselectedObligationId?: string;
}

const channelMeta: Record<
  string,
  { label: string; icon: any; colorClass: string; placeholderRef: string }
> = {
  MTN_MOMO: {
    label: "MTN Mobile Money",
    icon: Smartphone,
    colorClass: "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-200",
    placeholderRef: "e.g. 19827364501 (MoMo Transaction ID)",
  },
  TELECEL_CASH: {
    label: "Telecel Cash",
    icon: Smartphone,
    colorClass: "bg-red-100 text-red-900 border-red-300 dark:bg-red-950 dark:text-red-200",
    placeholderRef: "e.g. TC-92837482",
  },
  AT_MONEY: {
    label: "AT Money",
    icon: Smartphone,
    colorClass: "bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950 dark:text-blue-200",
    placeholderRef: "e.g. AT-82736410",
  },
  CASH: {
    label: "Cash Receipt",
    icon: Banknote,
    colorClass: "bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200",
    placeholderRef: "e.g. CASH-REC-00123",
  },
  BANK_TRANSFER: {
    label: "Bank Transfer",
    icon: Building,
    colorClass: "bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-950 dark:text-purple-200",
    placeholderRef: "e.g. GCB-TXN-839201",
  },
  OTHER: {
    label: "Other Channel",
    icon: CreditCard,
    colorClass: "bg-slate-100 text-slate-900 border-slate-300 dark:bg-slate-800 dark:text-slate-200",
    placeholderRef: "e.g. REF-2025-001",
  },
};

/**
 * Safely parses Ghana Cedi string into integer pesewas
 */
function parseCediToPesewas(input: string): number | null {
  const clean = input.trim().replace(/,/g, "");
  if (!clean) return null;
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(clean);
  if (!match) return null;
  const cedis = parseInt(match[1], 10);
  const pesewaPart = (match[2] || "").padEnd(2, "0").slice(0, 2);
  const pesewas = parseInt(pesewaPart, 10);
  return cedis * 100 + pesewas;
}

export function ManualPaymentDialog({
  isOpen,
  onClose,
  onSuccess,
  members,
  obligations,
  preselectedMemberId,
  preselectedObligationId,
}: ManualPaymentDialogProps) {
  const [selectedMemberId, setSelectedMemberId] = useState(preselectedMemberId || "");
  const [selectedObligationId, setSelectedObligationId] = useState(preselectedObligationId || "");
  const [amountStr, setAmountStr] = useState("250.00");
  const [channel, setChannel] = useState<string>("MTN_MOMO");
  const [paymentDate, setPaymentDate] = useState(() => {
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  });
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [verifyImmediately, setVerifyImmediately] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dialogId = useId();
  const selectedMemberIdRef = useRef(selectedMemberId);

  useEffect(() => {
    selectedMemberIdRef.current = selectedMemberId;
  }, [selectedMemberId]);

  // Reset and synchronize state when dialog opens or dependencies change
  useEffect(() => {
    if (!isOpen) return;

    setError(null);
    setIsSubmitting(false);

    // Refresh default timestamp
    const now = new Date();
    setPaymentDate(
      new Date(now.getTime() - now.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16)
    );

    // Determine initial member: preselected, or current if still valid, or first member in group
    const initialMemberId =
      (preselectedMemberId && members.some((m) => m.id === preselectedMemberId)
        ? preselectedMemberId
        : selectedMemberIdRef.current && members.some((m) => m.id === selectedMemberIdRef.current)
        ? selectedMemberIdRef.current
        : members[0]?.id) || "";

    setSelectedMemberId(initialMemberId);

    // Determine initial obligation for this member
    const mObls = obligations.filter((o) => o.memberId === initialMemberId);
    const targetObl =
      (preselectedObligationId && mObls.find((o) => o.id === preselectedObligationId)) ||
      mObls.find((o) => o.amount - o.paidAmount > 0) ||
      mObls[0];

    if (targetObl) {
      setSelectedObligationId(targetObl.id);
      const remaining = Math.max(0, targetObl.amount - targetObl.paidAmount);
      setAmountStr(
        remaining > 0 ? (remaining / 100).toFixed(2) : (targetObl.amount / 100).toFixed(2)
      );
    } else {
      setSelectedObligationId("");
      setAmountStr("250.00");
    }
  }, [isOpen, preselectedMemberId, preselectedObligationId, members, obligations]);

  // Obligations for currently selected member
  const memberObligations = obligations.filter(
    (o) => o.memberId === selectedMemberId
  );

  // Active obligation currently picked in dropdown
  const activeObligation = obligations.find((o) => o.id === selectedObligationId);
  const remainingForActive = activeObligation
    ? Math.max(0, activeObligation.amount - activeObligation.paidAmount)
    : 0;

  // Parsed amount in pesewas
  const parsedPesewas = parseCediToPesewas(amountStr);
  const isOverpaying =
    activeObligation &&
    parsedPesewas !== null &&
    remainingForActive > 0 &&
    parsedPesewas > remainingForActive;

  // Member selection change handler
  const handleMemberChange = (newMemberId: string) => {
    setSelectedMemberId(newMemberId);
    setError(null);

    const mObls = obligations.filter((o) => o.memberId === newMemberId);
    const targetObl =
      mObls.find((o) => o.amount - o.paidAmount > 0) || mObls[0];

    if (targetObl) {
      setSelectedObligationId(targetObl.id);
      const remaining = Math.max(0, targetObl.amount - targetObl.paidAmount);
      setAmountStr(
        remaining > 0 ? (remaining / 100).toFixed(2) : (targetObl.amount / 100).toFixed(2)
      );
    } else {
      setSelectedObligationId("");
      setAmountStr("250.00");
    }
  };

  // Obligation selection change handler
  const handleObligationChange = (oblId: string) => {
    setSelectedObligationId(oblId);
    setError(null);
    const obl = obligations.find((o) => o.id === oblId);
    if (obl) {
      const remaining = Math.max(0, obl.amount - obl.paidAmount);
      setAmountStr(
        remaining > 0 ? (remaining / 100).toFixed(2) : (obl.amount / 100).toFixed(2)
      );
    }
  };

  const handleGenerateCashReceipt = () => {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    setReference(`CASH-${dateStr}-${randomSuffix}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (members.length === 0) {
      setError("No registered members found. Please register members first.");
      return;
    }

    if (obligations.length === 0) {
      setError(
        "No active savings cycle found. In RSCMS, every contribution must be linked to a specific monthly cycle obligation. Please launch a cycle in Settings."
      );
      return;
    }

    if (!selectedMemberId) {
      setError("Please select the contributing member.");
      return;
    }

    if (!selectedObligationId) {
      setError("Please select the target contribution period obligation.");
      return;
    }

    const pesewas = parseCediToPesewas(amountStr);
    if (!pesewas || pesewas <= 0) {
      setError("Please enter a valid positive amount in Ghana Cedis.");
      return;
    }

    if (activeObligation) {
      const remaining = activeObligation.amount - activeObligation.paidAmount;
      if (remaining > 0 && pesewas > remaining) {
        setError(
          `Amount exceeds remaining balance of ${formatPesewas(remaining)} for Period ${activeObligation.periodNumber}.`
        );
        return;
      }
      if (remaining === 0) {
        setError(
          `Period ${activeObligation.periodNumber} for this member is already fully settled.`
        );
        return;
      }
    }

    if (!reference.trim()) {
      setError("Receipt or transaction reference is required for audit verification.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await authFetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: selectedMemberId,
          obligationId: selectedObligationId,
          amountPesewas: pesewas,
          channel,
          paymentDate: new Date(paymentDate).toISOString(),
          reference: reference.trim(),
          notes: notes.trim() || undefined,
          verifyImmediately,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to record payment.");
      }

      onSuccess(data.payment?.id);
      onClose();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const canSubmit =
    !isSubmitting &&
    members.length > 0 &&
    obligations.length > 0 &&
    Boolean(selectedMemberId) &&
    Boolean(selectedObligationId) &&
    !isOverpaying &&
    (parsedPesewas ?? 0) > 0 &&
    Boolean(reference.trim());

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${dialogId}-title`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-lg border bg-background p-6 shadow-xl">
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
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary mb-2">
            <CreditCard className="h-3.5 w-3.5" />
            <span>Manual Payment Entry</span>
          </div>
          <h2 id={`${dialogId}-title`} className="text-xl font-bold tracking-tight text-foreground">
            Record Member Contribution
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Record cash, mobile money, or bank transfer payments with full double-entry
            ledger posting.
          </p>
        </div>

        {/* Informational Guidance: Zero Members State */}
        {members.length === 0 && (
          <div className="mb-5 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-amber-950 dark:text-amber-100">
                  No Members Registered Yet
                </h4>
                <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                  RSCMS manages rotating savings among 4 group participants. Before recording manual
                  payments, please register the 4 group members with rotation positions 1 through 4.
                </p>
                <div className="pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    asChild
                    className="border-amber-400 bg-white hover:bg-amber-100 text-amber-950 dark:bg-amber-900 dark:text-amber-100 dark:hover:bg-amber-800"
                  >
                    <Link href="/members">
                      Go to Members Directory <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Informational Guidance: Zero Active Cycle / Obligations State */}
        {members.length > 0 && obligations.length === 0 && (
          <div className="mb-5 rounded-lg border border-blue-200 bg-blue-50/80 p-4 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-blue-950 dark:text-blue-100">
                    No Active Savings Cycle (No Obligations Found)
                  </h4>
                  <Badge variant="outline" className="text-[10px] bg-blue-100 text-blue-800 border-blue-300">
                    Cycle Required
                  </Badge>
                </div>
                <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                  <strong>What is a Target Obligation?</strong> In rotating savings (ROSCA / Susu),
                  contributions are not loose deposits. Each payment must settle a specific monthly
                  period requirement called an <strong>Obligation</strong> (e.g. Period 1 Contribution
                  of GH₵250.00).
                </p>
                <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                  Because no 4-month savings cycle has been launched yet, there are no obligations in
                  the system to credit. Please launch an active cycle in Settings to generate the 4
                  periods and 16 member obligations.
                </p>
                <div className="pt-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    asChild
                    className="border-blue-400 bg-white hover:bg-blue-100 text-blue-950 dark:bg-blue-900 dark:text-blue-100 dark:hover:bg-blue-800"
                  >
                    <Link href="/settings">
                      Launch 4-Month Cycle in Settings <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mb-5 flex items-start gap-2.5 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Recording error</p>
              <p className="text-xs mt-0.5">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Member Selection */}
          <div className="space-y-1.5">
            <Label htmlFor={`${dialogId}-member`}>
              Contributing Member <span className="text-destructive">*</span>
            </Label>
            <select
              id={`${dialogId}-member`}
              value={selectedMemberId}
              onChange={(e) => handleMemberChange(e.target.value)}
              disabled={members.length === 0}
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            >
              <option value="">
                {members.length === 0 ? "No members registered yet" : "Select contributing member..."}
              </option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  Position {m.rotationPosition}: {m.fullName} ({m.phoneNumber})
                </option>
              ))}
            </select>
          </div>

          {/* Obligation / Period Selection (Target Obligation) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor={`${dialogId}-obligation`}>
                Target Contribution Period <span className="text-destructive">*</span>
              </Label>
              <span className="text-[11px] text-muted-foreground">
                Period obligation being settled
              </span>
            </div>
            <select
              id={`${dialogId}-obligation`}
              value={selectedObligationId}
              onChange={(e) => handleObligationChange(e.target.value)}
              disabled={
                !selectedMemberId ||
                memberObligations.length === 0 ||
                members.length === 0 ||
                obligations.length === 0
              }
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            >
              <option value="">
                {members.length === 0
                  ? "No members registered"
                  : obligations.length === 0
                  ? "No active cycle or obligations found"
                  : !selectedMemberId
                  ? "Select a member first..."
                  : memberObligations.length === 0
                  ? "No obligations found for this member"
                  : "Select period obligation to credit..."}
              </option>
              {memberObligations.map((obl) => {
                const remaining = Math.max(0, obl.amount - obl.paidAmount);
                const isFullyPaid = remaining === 0;
                return (
                  <option key={obl.id} value={obl.id}>
                    Period {obl.periodNumber} (Due: {formatDate(new Date(obl.dueDate))}) —{" "}
                    {isFullyPaid
                      ? "✓ Fully Settled (GH₵0.00 remaining)"
                      : `Remaining: ${formatPesewas(remaining)} of ${formatPesewas(obl.amount)}`}
                  </option>
                );
              })}
            </select>

            <p className="text-[11px] text-muted-foreground">
              Every payment must be credited against a specific monthly obligation to update the
              member&apos;s contribution standing and balanced ledger accounts.
            </p>

            {/* Active Obligation Breakdown Card */}
            {activeObligation && (
              <div className="mt-2 rounded-md border bg-muted/40 p-3 text-xs space-y-2">
                <div className="flex items-center justify-between border-b pb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-foreground">
                      Period {activeObligation.periodNumber} Obligation
                    </span>
                    <Badge variant="outline" className="text-[10px] font-normal">
                      Due: {formatDate(new Date(activeObligation.dueDate))}
                    </Badge>
                  </div>
                  <Badge
                    variant={
                      remainingForActive === 0
                        ? "default"
                        : activeObligation.paidAmount > 0
                        ? "secondary"
                        : "outline"
                    }
                    className="text-[10px]"
                  >
                    {remainingForActive === 0
                      ? "FULLY PAID"
                      : activeObligation.paidAmount > 0
                      ? "PARTIAL"
                      : "UNPAID"}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-0.5">
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase tracking-wider">
                      Target
                    </span>
                    <strong className="text-foreground font-mono">
                      {formatPesewas(activeObligation.amount)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase tracking-wider">
                      Already Paid
                    </span>
                    <strong className="text-emerald-600 font-mono">
                      {formatPesewas(activeObligation.paidAmount)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase tracking-wider">
                      Remaining Due
                    </span>
                    <strong
                      className={`font-mono ${
                        remainingForActive === 0 ? "text-muted-foreground" : "text-primary"
                      }`}
                    >
                      {formatPesewas(remainingForActive)}
                    </strong>
                  </div>
                </div>

                {/* Overpayment Warning or Remaining Balance calculation */}
                {parsedPesewas !== null && parsedPesewas > 0 && (
                  <div className="pt-1.5 border-t text-[11px] flex items-center justify-between">
                    <span className="text-muted-foreground">Balance after payment:</span>
                    {isOverpaying ? (
                      <span className="font-semibold text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Exceeds period balance by {formatPesewas(parsedPesewas - remainingForActive)}
                      </span>
                    ) : (
                      <span className="font-mono font-semibold text-foreground">
                        {formatPesewas(Math.max(0, remainingForActive - parsedPesewas))}
                        {parsedPesewas === remainingForActive && (
                          <span className="text-emerald-600 ml-1 font-sans font-medium">
                            (Settles Period)
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Amount input & Quick Buttons */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor={`${dialogId}-amount`}>
                Payment Amount (GH₵) <span className="text-destructive">*</span>
              </Label>
              {activeObligation && remainingForActive > 0 && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setAmountStr((remainingForActive / 100).toFixed(2));
                    }}
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    Remaining ({formatPesewas(remainingForActive)})
                  </button>
                  {remainingForActive === 25000 && (
                    <>
                      <span className="text-muted-foreground">·</span>
                      <button
                        type="button"
                        onClick={() => setAmountStr("125.00")}
                        className="text-xs text-primary hover:underline font-medium"
                      >
                        Half (GH₵125)
                      </button>
                    </>
                  )}
                  <span className="text-muted-foreground">·</span>
                  <button
                    type="button"
                    onClick={() => setAmountStr("250.00")}
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    Full GH₵250
                  </button>
                </div>
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
                placeholder="250.00"
                className="pl-12 font-mono font-medium"
                required
                disabled={members.length === 0 || obligations.length === 0}
              />
            </div>
            {(() => {
              const p = parseCediToPesewas(amountStr);
              if (p !== null && p > 0) {
                return (
                  <p className="text-xs text-muted-foreground">
                    Stored strictly in integer arithmetic as:{" "}
                    <strong className="font-mono text-foreground">
                      {p.toLocaleString()} pesewas
                    </strong>
                  </p>
                );
              }
              return null;
            })()}
          </div>

          {/* Payment Channel Pills */}
          <div className="space-y-1.5">
            <Label>
              Payment Channel <span className="text-destructive">*</span>
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {paymentChannels.map((ch) => {
                const meta = channelMeta[ch] || channelMeta.OTHER;
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

          {/* Reference & Auto-generate */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor={`${dialogId}-reference`}>
                Receipt / Transaction Reference <span className="text-destructive">*</span>
              </Label>
              {channel === "CASH" && (
                <button
                  type="button"
                  onClick={handleGenerateCashReceipt}
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
                >
                  <Sparkles className="h-3 w-3" />
                  Generate Receipt ID
                </button>
              )}
            </div>
            <Input
              id={`${dialogId}-reference`}
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder={channelMeta[channel]?.placeholderRef || "e.g. REC-12345"}
              className="font-mono"
              required
              disabled={members.length === 0 || obligations.length === 0}
            >
            </Input>
            <p className="text-[11px] text-muted-foreground">
              Unique financial identifier for MoMo, bank slip, or cash receipt book.
            </p>
          </div>

          {/* Payment Date */}
          <div className="space-y-1.5">
            <Label htmlFor={`${dialogId}-date`}>
              Payment Date & Time <span className="text-destructive">*</span>
            </Label>
            <Input
              id={`${dialogId}-date`}
              type="datetime-local"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              required
              disabled={members.length === 0 || obligations.length === 0}
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor={`${dialogId}-notes`}>Evidence / Notes (Optional)</Label>
            <Input
              id={`${dialogId}-notes`}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Received at Saturday monthly meeting, cash envelope signed"
              maxLength={500}
              disabled={members.length === 0 || obligations.length === 0}
            />
          </div>

          {/* Verification Checkbox */}
          <div className="flex items-start gap-2.5 p-3 rounded-md border bg-muted/30">
            <input
              id={`${dialogId}-verify`}
              type="checkbox"
              checked={verifyImmediately}
              onChange={(e) => setVerifyImmediately(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label htmlFor={`${dialogId}-verify`} className="text-xs cursor-pointer">
              <span className="font-semibold text-foreground">
                Verify immediately & post to balanced double-entry ledger
              </span>
              <p className="text-muted-foreground mt-0.5">
                Immediately allocates payment to period obligation, marks status as VERIFIED,
                and creates balanced ledger transactions (Debit Cash 1010, Credit Revenue 4010).
              </p>
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-3 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Recording...
                </>
              ) : members.length === 0 ? (
                "No Members Registered"
              ) : obligations.length === 0 ? (
                "No Active Cycle"
              ) : isOverpaying ? (
                "Amount Exceeds Balance"
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  {verifyImmediately ? "Record & Verify" : "Record Pending"}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
