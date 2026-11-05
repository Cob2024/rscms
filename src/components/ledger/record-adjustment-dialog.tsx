"use client";

import { useState } from "react";
import {
  X,
  Plus,
  Trash2,
  Scale,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  formatPesewas,
  parseGhsToPesewas,
} from "@/lib/formatting/currency";
import { LedgerDirection } from "@prisma/client";
import { authFetch } from "@/lib/auth/auth-fetch";
import type { AccountBalanceSummary } from "@/services/ledger.service";

interface RecordAdjustmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  accounts: AccountBalanceSummary[];
}

interface EntryRow {
  id: string;
  accountId: string;
  direction: LedgerDirection;
  amountGhs: string;
}

export function RecordAdjustmentDialog({
  isOpen,
  onClose,
  onSuccess,
  accounts,
}: RecordAdjustmentDialogProps) {
  const [reference, setReference] = useState("");
  const [description, setDescription] = useState("");
  const [entries, setEntries] = useState<EntryRow[]>([
    {
      id: "row-1",
      accountId: accounts[0]?.id || "",
      direction: LedgerDirection.DEBIT,
      amountGhs: "",
    },
    {
      id: "row-2",
      accountId: accounts[1]?.id || "",
      direction: LedgerDirection.CREDIT,
      amountGhs: "",
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Calculate live debits and credits
  let totalDebitsPesewas = 0;
  let totalCreditsPesewas = 0;
  let hasInvalidAmount = false;

  for (const entry of entries) {
    if (!entry.amountGhs || entry.amountGhs.trim() === "") continue;
    const pesewas = parseGhsToPesewas(entry.amountGhs);
    if (pesewas === null || pesewas <= 0) {
      hasInvalidAmount = true;
      continue;
    }
    if (entry.direction === LedgerDirection.DEBIT) {
      totalDebitsPesewas += pesewas;
    } else {
      totalCreditsPesewas += pesewas;
    }
  }

  const isBalanced =
    totalDebitsPesewas > 0 &&
    totalDebitsPesewas === totalCreditsPesewas &&
    !hasInvalidAmount;
  const differencePesewas = Math.abs(totalDebitsPesewas - totalCreditsPesewas);

  const handleAddRow = () => {
    const nextAccount =
      accounts.find((a) => !entries.some((e) => e.accountId === a.id)) ||
      accounts[0];

    setEntries((prev) => [
      ...prev,
      {
        id: `row-${Date.now()}`,
        accountId: nextAccount?.id || "",
        direction:
          totalDebitsPesewas > totalCreditsPesewas
            ? LedgerDirection.CREDIT
            : LedgerDirection.DEBIT,
        amountGhs: "",
      },
    ]);
  };

  const handleRemoveRow = (id: string) => {
    if (entries.length <= 2) return;
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const handleRowChange = (
    id: string,
    field: keyof EntryRow,
    value: string
  ) => {
    setEntries((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isBalanced) {
      setError(
        "Total Debits must exactly equal Total Credits before posting an adjustment."
      );
      return;
    }

    if (!description.trim() || description.trim().length < 5) {
      setError("Please provide a business description of at least 5 characters.");
      return;
    }

    // Prepare payload
    const payloadEntries = entries.map((e) => ({
      accountId: e.accountId,
      direction: e.direction,
      amountPesewas: parseGhsToPesewas(e.amountGhs)!,
    }));

    setLoading(true);
    try {
      const response = await authFetch("/api/transactions/adjustment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reference: reference.trim() || undefined,
          description: description.trim(),
          entries: payloadEntries,
        }),
      });

      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error || "Failed to record adjustment entry.");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl rounded-xl border bg-card text-card-foreground shadow-2xl z-10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4 bg-muted/20">
          <div className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Post Manual Journal Adjustment</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 text-sm rounded-lg border border-destructive/40 bg-destructive/10 text-destructive flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Reference & Description */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="adj-ref" className="text-xs">
                Transaction Reference (Optional)
              </Label>
              <Input
                id="adj-ref"
                placeholder="Auto-generated if empty"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="font-mono text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="adj-desc" className="text-xs">
                Reason / Memo <span className="text-destructive">*</span>
              </Label>
              <Input
                id="adj-desc"
                placeholder="e.g. Correction of bank charge adjustment"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="text-xs"
              />
            </div>
          </div>

          {/* Journal Lines */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Journal Lines (Debits & Credits)
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddRow}
                className="h-7 text-xs"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add Line
              </Button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {entries.map((entry, index) => (
                <div
                  key={entry.id}
                  className="flex items-center gap-2 p-2 rounded-lg border bg-muted/20 text-xs"
                >
                  {/* Account Selector */}
                  <div className="flex-1 min-w-[140px]">
                    <select
                      className="w-full h-8 rounded-md border bg-background px-2 text-xs focus:ring-1 focus:ring-primary"
                      value={entry.accountId}
                      onChange={(e) =>
                        handleRowChange(entry.id, "accountId", e.target.value)
                      }
                      required
                    >
                      {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.code} - {acc.name} ({acc.type})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Direction Selector */}
                  <div className="w-24">
                    <select
                      className="w-full h-8 rounded-md border bg-background px-2 text-xs font-semibold focus:ring-1 focus:ring-primary"
                      value={entry.direction}
                      onChange={(e) =>
                        handleRowChange(
                          entry.id,
                          "direction",
                          e.target.value as LedgerDirection
                        )
                      }
                    >
                      <option value={LedgerDirection.DEBIT}>DEBIT</option>
                      <option value={LedgerDirection.CREDIT}>CREDIT</option>
                    </select>
                  </div>

                  {/* Amount Input */}
                  <div className="w-28 relative">
                    <span className="absolute left-2 top-2 text-[10px] text-muted-foreground">
                      GH₵
                    </span>
                    <Input
                      type="text"
                      placeholder="0.00"
                      value={entry.amountGhs}
                      onChange={(e) =>
                        handleRowChange(entry.id, "amountGhs", e.target.value)
                      }
                      className="h-8 pl-8 font-mono text-xs tabular-nums text-right"
                      required
                    />
                  </div>

                  {/* Remove Button */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                    onClick={() => handleRemoveRow(entry.id)}
                    disabled={entries.length <= 2}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Real-time Double-Entry Balance Box */}
          <div
            className={`p-4 rounded-lg border text-xs space-y-2 ${
              isBalanced
                ? "bg-emerald-50/70 text-emerald-950 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-200 dark:border-emerald-900"
                : "bg-muted/40 text-foreground border-border"
            }`}
          >
            <div className="flex items-center justify-between font-mono">
              <span>Total Debits:</span>
              <span className="font-bold">{formatPesewas(totalDebitsPesewas)}</span>
            </div>
            <div className="flex items-center justify-between font-mono">
              <span>Total Credits:</span>
              <span className="font-bold">{formatPesewas(totalCreditsPesewas)}</span>
            </div>
            <div className="pt-2 border-t flex items-center justify-between font-mono font-semibold">
              <span className="flex items-center gap-1.5">
                {isBalanced ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="text-emerald-600">Perfect Double-Entry Balance</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-3.5 w-3.5 text-rose-500" />
                    <span>Imbalance:</span>
                  </>
                )}
              </span>
              <span className={isBalanced ? "text-emerald-600" : "text-rose-500 font-bold"}>
                {formatPesewas(differencePesewas)}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!isBalanced || loading}
              className="min-w-[120px]"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Posting...
                </>
              ) : (
                "Post Adjustment"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

