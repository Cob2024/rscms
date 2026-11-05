"use client";

import {
  X,
  Scale,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  FileText,
  Copy,
  Check,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPesewas } from "@/lib/formatting/currency";
import { formatDateTime } from "@/lib/formatting/date";
import { LedgerDirection } from "@prisma/client";

export interface TransactionDetail {
  id: string;
  reference: string;
  transactionType: string;
  description: string;
  sourceType: string;
  sourceId: string;
  createdAt: string;
  createdBy?: {
    id: string;
    email: string;
    fullName: string;
  } | null;
  totalDebits: number;
  totalCredits: number;
  isBalanced: boolean;
  entries: Array<{
    id: string;
    accountId: string;
    accountCode: string;
    accountName: string;
    accountType: string;
    direction: LedgerDirection;
    amount: number;
  }>;
}

interface TransactionDetailsDialogProps {
  transaction: TransactionDetail | null;
  isOpen: boolean;
  onClose: () => void;
}

export function TransactionDetailsDialog({
  transaction,
  isOpen,
  onClose,
}: TransactionDetailsDialogProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !transaction) return null;

  const handleCopyRef = () => {
    navigator.clipboard.writeText(transaction.reference);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
            <h2 className="text-lg font-semibold">Double-Entry Journal Slip</h2>
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

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-4 rounded-lg bg-muted/30 p-4 border text-sm">
            <div>
              <span className="text-xs text-muted-foreground">Transaction Reference</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-mono font-bold text-primary">
                  {transaction.reference}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  onClick={handleCopyRef}
                >
                  {copied ? (
                    <Check className="h-3 w-3 text-emerald-600" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>

            <div>
              <span className="text-xs text-muted-foreground">Transaction Type</span>
              <div className="mt-0.5">
                <Badge variant="outline" className="font-medium">
                  {transaction.transactionType.replace("_", " ")}
                </Badge>
              </div>
            </div>

            <div>
              <span className="text-xs text-muted-foreground">Posting Date</span>
              <div className="flex items-center gap-1.5 mt-0.5 text-xs text-foreground">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                {formatDateTime(transaction.createdAt)}
              </div>
            </div>

            <div>
              <span className="text-xs text-muted-foreground">Authorized Administrator</span>
              <div className="flex items-center gap-1.5 mt-0.5 text-xs text-foreground">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                {transaction.createdBy?.fullName || transaction.createdBy?.email || "System"}
              </div>
            </div>

            <div className="col-span-2 pt-2 border-t">
              <span className="text-xs text-muted-foreground">Description / Memo</span>
              <p className="mt-0.5 text-sm font-medium">{transaction.description}</p>
            </div>
          </div>

          {/* Double-Entry Journal Lines Table */}
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 text-xs">
                  <TableHead className="w-[80px]">Code</TableHead>
                  <TableHead>Ledger Account</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Debit (GH₵)</TableHead>
                  <TableHead className="text-right">Credit (GH₵)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transaction.entries.map((entry) => {
                  const isDebit = entry.direction === LedgerDirection.DEBIT;
                  return (
                    <TableRow key={entry.id} className="text-xs">
                      <TableCell className="font-mono font-semibold text-primary">
                        {entry.accountCode}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{entry.accountName}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] font-normal">
                          {entry.accountType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        {isDebit ? (
                          <span className="font-semibold text-foreground">
                            {formatPesewas(entry.amount)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/30">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        {!isDebit ? (
                          <span className="font-semibold text-foreground">
                            {formatPesewas(entry.amount)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/30">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}

                {/* Totals & Balance Check Row */}
                <TableRow className="border-t-2 bg-muted/40 font-semibold text-xs">
                  <TableCell colSpan={3} className="text-right pr-4">
                    Journal Slip Total:
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums text-foreground">
                    {formatPesewas(transaction.totalDebits)}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums text-foreground">
                    {formatPesewas(transaction.totalCredits)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {/* Balanced Status Badge */}
          <div
            className={`flex items-center justify-between p-3 rounded-lg border text-xs ${
              transaction.isBalanced
                ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900"
                : "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-900"
            }`}
          >
            <div className="flex items-center gap-2">
              {transaction.isBalanced ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-rose-600" />
              )}
              <span className="font-medium">
                {transaction.isBalanced
                  ? "Double-entry posting verified: Total Debits = Total Credits"
                  : "Ledger transaction imbalance detected!"}
              </span>
            </div>
            <span className="font-mono font-bold">
              Diff: {formatPesewas(Math.abs(transaction.totalDebits - transaction.totalCredits))}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-3 bg-muted/10 flex justify-end">
          <Button variant="outline" onClick={onClose} size="sm">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

