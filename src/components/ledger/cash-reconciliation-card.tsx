"use client";

import {
  Banknote,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  AlertTriangle,
  History,
  CheckCircle2,
  DollarSign,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import type { CashReconciliationResult } from "@/services/ledger.service";

interface CashReconciliationCardProps {
  data: CashReconciliationResult | null;
  loading: boolean;
}

export function CashReconciliationCard({
  data,
  loading,
}: CashReconciliationCardProps) {
  if (loading && !data) {
    return (
      <Card className="rounded-lg border shadow-sm">
        <CardContent className="py-12 text-center text-muted-foreground">
          Loading Cash Book & Liquidity Reconciliation...
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  const {
    netCashBalance,
    totalInflows,
    totalOutflows,
    openingBalance,
    canCoverFullPayout,
    standardMonthlyPayoutTarget,
    inflowBreakdown,
    outflowBreakdown,
    recentMovements,
  } = data;

  const coveragePercent = Math.min(
    100,
    Math.round((netCashBalance / (standardMonthlyPayoutTarget || 100000)) * 100)
  );

  return (
    <div className="space-y-6">
      {/* Top 3 Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Total Inflows */}
        <Card className="rounded-lg border shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase tracking-wider">
              <span>Total Cash Inflows</span>
              <div className="rounded-full bg-emerald-100 dark:bg-emerald-950/40 p-1.5 text-emerald-600">
                <ArrowDownLeft className="h-4 w-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="font-mono text-2xl font-bold text-foreground">
              {formatPesewas(totalInflows)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Member contributions: {formatPesewas(inflowBreakdown.contributions)}
            </p>
          </CardContent>
        </Card>

        {/* Total Outflows */}
        <Card className="rounded-lg border shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase tracking-wider">
              <span>Total Cash Outflows</span>
              <div className="rounded-full bg-rose-100 dark:bg-rose-950/40 p-1.5 text-rose-600">
                <ArrowUpRight className="h-4 w-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="font-mono text-2xl font-bold text-foreground">
              {formatPesewas(totalOutflows)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Payout disbursements: {formatPesewas(outflowBreakdown.payoutDisbursements)}
            </p>
          </CardContent>
        </Card>

        {/* Net Cash Balance */}
        <Card className="rounded-lg border shadow-sm border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between text-primary text-xs font-semibold uppercase tracking-wider">
              <span>Net Available Cash (1010)</span>
              <div className="rounded-full bg-primary/10 p-1.5 text-primary">
                <Banknote className="h-4 w-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="font-mono text-2xl font-bold text-primary">
              {formatPesewas(netCashBalance)}
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              {canCoverFullPayout ? (
                <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                  <CheckCircle2 className="h-3 w-3" />
                  Fully covers next payout ({formatPesewas(standardMonthlyPayoutTarget)})
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[11px] font-medium text-amber-600">
                  <AlertTriangle className="h-3 w-3" />
                  {formatPesewas(Math.max(0, standardMonthlyPayoutTarget - netCashBalance))} short of next payout
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payout Reserve Health Indicator */}
      <Card className="rounded-lg border shadow-sm">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
            <span>Cycle Payout Reserve Capacity</span>
            <span className="font-mono text-sm font-bold text-foreground">
              {coveragePercent}%
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-3">
          <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full transition-all rounded-full ${
                coveragePercent >= 100
                  ? "bg-emerald-600"
                  : coveragePercent >= 50
                  ? "bg-amber-500"
                  : "bg-rose-500"
              }`}
              style={{ width: `${coveragePercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Available Liquid: {formatPesewas(netCashBalance)}</span>
            <span>Monthly Payout Target: {formatPesewas(standardMonthlyPayoutTarget)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Recent Cash Movements */}
      <Card className="rounded-lg border shadow-sm">
        <CardHeader className="border-b bg-muted/20 pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <History className="h-4 w-4 text-primary" />
            Account 1010 Cash Book Transactions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/10">
                <TableHead>Date & Time</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Cash Inflow (Debit)</TableHead>
                <TableHead className="text-right">Cash Outflow (Credit)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentMovements.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-8 text-center text-sm text-muted-foreground"
                  >
                    No cash transactions recorded yet.
                  </TableCell>
                </TableRow>
              ) : (
                recentMovements.map((movement) => {
                  const isDebit = movement.direction === LedgerDirection.DEBIT;
                  return (
                    <TableRow key={movement.id} className="hover:bg-muted/30">
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {formatDateTime(movement.createdAt)}
                      </TableCell>
                      <TableCell className="font-mono text-xs font-semibold text-primary">
                        {movement.reference}
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {movement.description}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs font-normal">
                          {movement.transactionType.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm tabular-nums">
                        {isDebit ? (
                          <span className="text-emerald-600 font-semibold">
                            +{formatPesewas(movement.amount)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/30">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm tabular-nums">
                        {!isDebit ? (
                          <span className="text-rose-600 font-semibold">
                            -{formatPesewas(movement.amount)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/30">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

