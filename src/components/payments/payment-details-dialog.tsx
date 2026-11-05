"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPesewas } from "@/lib/formatting/currency";
import { formatDate } from "@/lib/formatting/date";
import { X, Loader2, ArrowRight, BookOpen, ShieldCheck, Clock, Receipt } from "lucide-react";
import { authFetch } from "@/lib/auth/auth-fetch";

interface PaymentDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  paymentId: string | null;
  onViewReceipt?: (paymentId: string) => void;
}

export function PaymentDetailsDialog({
  isOpen,
  onClose,
  paymentId,
  onViewReceipt,
}: PaymentDetailsDialogProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && paymentId) {
      setLoading(true);
      setError(null);
      authFetch(`/api/payments/${paymentId}`)
        .then((res) => res.json())
        .then((json) => {
          if (json.error) setError(json.error);
          else setData(json);
        })
        .catch((err) => setError(err.message || "Could not load details"))
        .finally(() => setLoading(false));
    } else {
      setData(null);
    }
  }, [isOpen, paymentId]);

  if (!isOpen || !paymentId) return null;

  const payment = data?.payment;
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
          <h2 className="text-xl font-bold tracking-tight">Payment & Ledger Details</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Audit trail, allocations, and double-entry transaction record.
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

        {payment && !loading && (
          <div className="space-y-6 text-sm">
            {/* Header Card */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-lg border bg-muted/30 text-xs">
              <div>
                <span className="text-muted-foreground block text-[11px]">Member</span>
                <span className="font-semibold">{payment.member.fullName}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Channel</span>
                <span className="font-medium">{payment.channel}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Reference</span>
                <span className="font-mono">{payment.reference || "—"}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Amount</span>
                <span className="font-mono font-bold text-foreground">
                  {formatPesewas(payment.amount)}
                </span>
              </div>
            </div>

            {/* Status & Verification Info */}
            <div className="rounded-md border p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Payment Status:</span>
                <Badge
                  variant={
                    payment.status === "VERIFIED"
                      ? "default"
                      : payment.status === "PENDING"
                      ? "outline"
                      : "destructive"
                  }
                >
                  {payment.status}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Payment Date:</span>
                <span>{formatDate(new Date(payment.paymentDate))}</span>
              </div>
              {payment.verifiedAt && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Verified At:</span>
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                    {formatDate(new Date(payment.verifiedAt))}
                  </span>
                </div>
              )}
              {payment.verifier && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Verified By:</span>
                  <span>{payment.verifier.fullName || payment.verifier.email}</span>
                </div>
              )}
              {payment.notes && (
                <div className="pt-2 border-t mt-2">
                  <span className="text-muted-foreground block mb-0.5">Notes:</span>
                  <p className="font-mono text-[11px] whitespace-pre-wrap bg-background p-2 rounded border">
                    {payment.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Allocations */}
            <div>
              <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-2">
                Obligation Allocations
              </h3>
              {payment.allocations?.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">
                  No allocations linked to this payment.
                </p>
              ) : (
                <div className="border rounded-md divide-y text-xs">
                  {payment.allocations.map((alloc: any) => (
                    <div
                      key={alloc.id}
                      className="p-3 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium">
                          Period {alloc.obligation.period.periodNumber} Contribution
                        </p>
                        <p className="text-muted-foreground text-[11px]">
                          Due: {formatDate(new Date(alloc.obligation.period.dueDate))}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-semibold">
                          {formatPesewas(alloc.amount)}
                        </span>
                        <p className="text-muted-foreground text-[11px]">
                          Status: {alloc.obligation.status}
                        </p>
                      </div>
                    </div>
                  ))}
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
                  No ledger postings yet (payments post to the ledger upon verification).
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

                        {/* Entry Rows */}
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

                        {/* Balance Verification */}
                        <div className="flex items-center justify-between pt-1 text-[11px]">
                          <span className="text-muted-foreground">
                            Ledger Balancing Invariant:
                          </span>
                          <span
                            className={`font-semibold ${
                              isBalanced ? "text-emerald-600" : "text-destructive"
                            }`}
                          >
                            {isBalanced
                              ? `Balanced (Debits = Credits = ${formatPesewas(totalDebits)})`
                              : `Unbalanced: Debits (${formatPesewas(totalDebits)}) ≠ Credits (${formatPesewas(totalCredits)})`}
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

        <div className="mt-6 flex items-center justify-between pt-3 border-t">
          {onViewReceipt ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onViewReceipt(paymentId);
                onClose();
              }}
              className="text-xs"
            >
              <Receipt className="mr-1.5 h-3.5 w-3.5 text-primary" />
              View Official Receipt
            </Button>
          ) : (
            <div />
          )}
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

