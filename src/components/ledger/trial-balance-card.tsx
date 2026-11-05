"use client";

import { ShieldCheck, AlertTriangle, Scale, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import type { TrialBalanceResult } from "@/services/ledger.service";

interface TrialBalanceCardProps {
  data: TrialBalanceResult | null;
  loading: boolean;
  onRefresh: () => void;
}

export function TrialBalanceCard({
  data,
  loading,
  onRefresh,
}: TrialBalanceCardProps) {
  if (loading && !data) {
    return (
      <Card className="rounded-lg border shadow-sm">
        <CardContent className="py-12 text-center text-muted-foreground">
          <RefreshCw className="mx-auto h-6 w-6 animate-spin mb-2" />
          Loading Double-Entry Trial Balance...
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="rounded-lg border shadow-sm">
        <CardContent className="py-8 text-center text-muted-foreground">
          No trial balance data available.
        </CardContent>
      </Card>
    );
  }

  const { isBalanced, totalDebits, totalCredits, differencePesewas, accounts, asOf } = data;

  return (
    <div className="space-y-6">
      {/* Balance Invariant Status Banner */}
      <div
        className={`rounded-lg border p-4 transition-colors ${
          isBalanced
            ? "border-emerald-200 bg-emerald-50/70 text-emerald-950 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-200"
            : "border-red-200 bg-red-50/70 text-red-950 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-200"
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            {isBalanced ? (
              <div className="rounded-full bg-emerald-100 p-2 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                <ShieldCheck className="h-6 w-6" />
              </div>
            ) : (
              <div className="rounded-full bg-red-100 p-2 text-red-700 dark:bg-red-900/50 dark:text-red-300">
                <AlertTriangle className="h-6 w-6" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold">
                  {isBalanced
                    ? "Ledger In Perfect Balance"
                    : "Trial Balance Imbalance Detected"}
                </h3>
                <Badge
                  variant={isBalanced ? "default" : "destructive"}
                  className={
                    isBalanced
                      ? "bg-emerald-600 hover:bg-emerald-600 text-white"
                      : ""
                  }
                >
                  {isBalanced ? "Balanced (0.00 Diff)" : "Imbalance"}
                </Badge>
              </div>
              <p className="mt-1 text-sm opacity-90">
                {isBalanced
                  ? `Every financial transaction is balanced. Total Debits (${formatPesewas(
                      totalDebits
                    )}) exactly equal Total Credits (${formatPesewas(
                      totalCredits
                    )}).`
                  : `Discrepancy of ${formatPesewas(
                      differencePesewas
                    )} found between debits and credits.`}
              </p>
              <p className="mt-1 text-xs opacity-70">
                Calculated as of {formatDateTime(asOf)}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
            className="shrink-0"
          >
            <RefreshCw
              className={`mr-2 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
            />
            Recalculate
          </Button>
        </div>
      </div>

      {/* Trial Balance Table */}
      <Card className="rounded-lg border shadow-sm">
        <CardHeader className="border-b bg-muted/20 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Scale className="h-4 w-4 text-primary" />
                Standard Trial Balance (Net Balances)
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Displays the ending debit or credit balance for every active account in the chart of accounts.
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-muted-foreground">Accounts Count: </span>
              <span className="font-semibold text-xs">{accounts.length}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/10">
                <TableHead className="w-[100px]">Code</TableHead>
                <TableHead>Account Name</TableHead>
                <TableHead>Account Type</TableHead>
                <TableHead className="text-center">Entries</TableHead>
                <TableHead className="text-right">Debit Balance (GH₵)</TableHead>
                <TableHead className="text-right">Credit Balance (GH₵)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((acc) => {
                const isDebit = acc.debitBalance > 0;
                const isCredit = acc.creditBalance > 0;

                return (
                  <TableRow key={acc.id} className="hover:bg-muted/30">
                    <TableCell className="font-mono text-xs font-semibold text-primary">
                      {acc.code}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-sm">{acc.name}</div>
                      {acc.description && (
                        <div className="text-xs text-muted-foreground line-clamp-1">
                          {acc.description}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs font-normal">
                        {acc.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center text-xs text-muted-foreground">
                      {acc.entryCount}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm tabular-nums">
                      {isDebit ? (
                        <span className="font-medium">
                          {formatPesewas(acc.debitBalance)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/40">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm tabular-nums">
                      {isCredit ? (
                        <span className="font-medium">
                          {formatPesewas(acc.creditBalance)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/40">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}

              {/* Grand Total Row */}
              <TableRow className="border-t-2 bg-muted/40 font-semibold">
                <TableCell colSpan={4} className="text-right pr-4 text-sm">
                  Grand Totals:
                </TableCell>
                <TableCell className="text-right font-mono text-base tabular-nums text-foreground">
                  {formatPesewas(totalDebits)}
                </TableCell>
                <TableCell className="text-right font-mono text-base tabular-nums text-foreground">
                  {formatPesewas(totalCredits)}
                </TableCell>
              </TableRow>

              {/* Invariant Reconciliation Row */}
              <TableRow className="bg-muted/20 text-xs">
                <TableCell colSpan={4} className="text-right pr-4 text-muted-foreground">
                  Double-Entry Invariant (Debits - Credits):
                </TableCell>
                <TableCell
                  colSpan={2}
                  className={`text-center font-mono font-semibold ${
                    isBalanced ? "text-emerald-600" : "text-destructive"
                  }`}
                >
                  {isBalanced
                    ? "GH₵0.00 (In Balance)"
                    : `Discrepancy: ${formatPesewas(differencePesewas)}`}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

