"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPesewas } from "@/lib/formatting/currency";
import { formatDate } from "@/lib/formatting/date";
import { X, Loader2, BookOpen, ShieldCheck, CheckCheck, Clock } from "lucide-react";

interface PayoutDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  payoutId: string | null;
}

export function PayoutDetailsDialog({
  isOpen,
  onClose,
  payoutId,
}: PayoutDetailsDialogProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && payoutId) {
      setLoading(true);
      setError(null);
      fetch(`/api/payouts/${payoutId}`)
        .then((res) => res.json())
        .then((json) => {
          if (json.error) setError(json.error);
          else setData(json);
        })
        .catch((err) => setError(err.message || "Could not load payout details"))
        .finally(() => setLoading(false));
    } else {
      setData(null);
    }
  }, [isOpen, payoutId]);

  if (!isOpen || !payoutId) return null;

  const payout = data?.payout;
  const ledgerTransactions = data?.ledgerTransactions || [];

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg border bg-background p-6 shadow-xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-4">
          <h2 className="text-xl font-bold tracking-tight">Payout & Ledger Audit Trail</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Full lifecycle record: authorization, disbursement, acknowledgement, and general ledger postings.
          </p>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mb-2" />
            <p className="text-sm">Loading audit records...</p>
          </div>
        )}

        {error && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
            {error}
          </div>
        )}

        {payout && !loading && (
          <div className="space-y-6 text-sm">
            {/* Header Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-lg border bg-muted/30 text-xs">
              <div>
                <span className="text-muted-foreground block text-[11px]">Recipient</span>
                <span className="font-semibold">{payout.member.fullName}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Rotation Position</span>
                <span className="font-semibold">Position {payout.member.rotationPosition}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Expected Amount</span>
                <span className="font-mono">{formatPesewas(payout.expectedAmount)}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Actual Disbursed</span>
                <span className="font-mono font-bold text-foreground">
                  {formatPesewas(payout.actualAmount)}
                </span>
              </div>
            </div>

            {/* Lifecycle Timeline */}
            <div className="rounded-md border p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Lifecycle Status:</span>
                <Badge
                  variant={
                    payout.status === "ACKNOWLEDGED"
                      ? "default"
                      : payout.status === "DISBURSED"
                      ? "outline"
                      : payout.status === "AUTHORIZED"
                      ? "secondary"
                      : "destructive"
                  }
                >
                  {payout.status}
                </Badge>
              </div>

              {payout.authorizedAt && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Authorized:</span>
                  <span>
                    {formatDate(new Date(payout.authorizedAt))} by{" "}
                    {payout.authorizer?.fullName || "Admin"}
                  </span>
                </div>
              )}

              {payout.disbursedAt && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Disbursed:</span>
                  <span>
                    {formatDate(new Date(payout.disbursedAt))} via {payout.channel} (Ref:{" "}
                    <code className="font-mono">{payout.reference}</code>)
                  </span>
                </div>
              )}

              {payout.acknowledgedAt && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Acknowledged:</span>
                  <span className="flex items-center gap-1 text-emerald-600 font-medium">
                    <CheckCheck className="h-3.5 w-3.5" />
                    {formatDate(new Date(payout.acknowledgedAt))}
                  </span>
                </div>
              )}

              {payout.notes && (
                <div className="pt-2 border-t mt-2">
                  <span className="text-muted-foreground block mb-0.5">Notes & Evidence:</span>
                  <p className="font-mono text-[11px] whitespace-pre-wrap bg-background p-2 rounded border">
                    {payout.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Double-Entry Ledger Transactions */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <BookOpen className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                  Double-Entry Ledger Postings
                </h3>
              </div>
              {ledgerTransactions.length === 0 ? (
                <p className="text-xs text-muted-foreground italic p-3 border rounded-md">
                  No ledger postings recorded yet. (Postings occur upon fund disbursement).
                </p>
              ) : (
                <div className="space-y-3">
                  {ledgerTransactions.map((txn: any) => {
                    const totalDebits = txn.entries
                      .filter((e: any) => e.direction === "DEBIT")
                      .reduce((sum: number, e: any) => sum + e.amount, 0);
                    const totalCredits = txn.entries
                      .filter((e: any) => e.direction === "CREDIT")
                      .reduce((sum: number, e: any) => sum + e.amount, 0);
                    const isBalanced = totalDebits === totalCredits;

                    return (
                      <div
                        key={txn.id}
                        className="rounded-md border p-3.5 bg-muted/20 text-xs space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-semibold text-foreground">
                            {txn.reference}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {formatDate(new Date(txn.createdAt))}
                          </span>
                        </div>
                        <p className="text-muted-foreground">{txn.description}</p>

                        <div className="border rounded bg-background divide-y text-[11px]">
                          {txn.entries.map((entry: any) => (
                            <div
                              key={entry.id}
                              className="p-2 flex items-center justify-between"
                            >
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className={
                                    entry.direction === "DEBIT"
                                      ? "text-blue-600 border-blue-200"
                                      : "text-emerald-600 border-emerald-200"
                                  }
                                >
                                  {entry.direction}
                                </Badge>
                                <span className="font-mono font-medium">
                                  {entry.account.code}
                                </span>
                                <span>{entry.account.name}</span>
                              </div>
                              <span className="font-mono font-semibold">
                                {formatPesewas(entry.amount)}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center justify-between pt-1 text-[11px]">
                          <span className="text-muted-foreground">
                            Ledger Invariant Verification:
                          </span>
                          <span
                            className={`font-semibold ${
                              isBalanced ? "text-emerald-600" : "text-destructive"
                            }`}
                          >
                            {isBalanced
                              ? `Balanced (Debits = Credits = ${formatPesewas(totalDebits)})`
                              : `Unbalanced`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end pt-3 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

