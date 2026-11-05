"use client";

import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Coins,
  Shield,
  Layers,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPesewas } from "@/lib/formatting/currency";
import { AccountType } from "@prisma/client";
import type { AccountCategorySummary } from "@/services/ledger.service";

interface AccountBalancesGridProps {
  summary: AccountCategorySummary | null;
  loading: boolean;
}

export function AccountBalancesGrid({
  summary,
  loading,
}: AccountBalancesGridProps) {
  if (loading && !summary) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="h-20 bg-muted/30" />
            <CardContent className="h-24" />
          </Card>
        ))}
      </div>
    );
  }

  if (!summary) {
    return null;
  }

  const {
    totalAssets,
    totalLiabilities,
    totalEquity,
    totalRevenue,
    totalExpense,
    netSurplus,
    isAccountingEquationBalanced,
    equationDiscrepancy,
    accountsByType,
  } = summary;

  // Flatten all accounts
  const allAccounts = [
    ...(accountsByType[AccountType.ASSET] || []),
    ...(accountsByType[AccountType.LIABILITY] || []),
    ...(accountsByType[AccountType.EQUITY] || []),
    ...(accountsByType[AccountType.REVENUE] || []),
    ...(accountsByType[AccountType.EXPENSE] || []),
  ];

  const getAccountTypeIcon = (type: AccountType) => {
    switch (type) {
      case AccountType.ASSET:
        return <Wallet className="h-4 w-4 text-emerald-600" />;
      case AccountType.LIABILITY:
        return <Shield className="h-4 w-4 text-amber-600" />;
      case AccountType.EQUITY:
        return <Layers className="h-4 w-4 text-indigo-600" />;
      case AccountType.REVENUE:
        return <ArrowDownLeft className="h-4 w-4 text-blue-600" />;
      case AccountType.EXPENSE:
        return <ArrowUpRight className="h-4 w-4 text-rose-600" />;
      default:
        return <Coins className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getAccountTypeColor = (type: AccountType) => {
    switch (type) {
      case AccountType.ASSET:
        return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300";
      case AccountType.LIABILITY:
        return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300";
      case AccountType.EQUITY:
        return "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-300";
      case AccountType.REVENUE:
        return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300";
      case AccountType.EXPENSE:
        return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      {/* Fundamental Accounting Equation Widget */}
      <Card className="rounded-lg border shadow-sm bg-gradient-to-br from-card to-muted/20">
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Fundamental Accounting Equation Check
            </CardTitle>
            <div className="flex items-center gap-1.5">
              {isAccountingEquationBalanced ? (
                <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle2 className="h-3 w-3" />
                  Balanced
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs font-medium text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-800">
                  <AlertCircle className="h-3 w-3" />
                  Discrepancy ({formatPesewas(equationDiscrepancy)})
                </span>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            {/* Assets */}
            <div className="p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
              <span className="text-xs font-medium text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                Total Assets
              </span>
              <div className="mt-1 font-mono text-xl font-bold text-emerald-950 dark:text-emerald-200">
                {formatPesewas(totalAssets)}
              </div>
              <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400 mt-0.5">
                Cash + Receivables
              </p>
            </div>

            {/* Equals Sign Indicator */}
            <div className="hidden md:flex items-center justify-center font-bold text-muted-foreground text-xl">
              =
            </div>

            {/* Liabilities + Equity + Net Profit */}
            <div className="p-3 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40">
              <span className="text-xs font-medium text-indigo-800 dark:text-indigo-300 uppercase tracking-wider">
                Liabilities + Equity + Net Surplus
              </span>
              <div className="mt-1 font-mono text-xl font-bold text-indigo-950 dark:text-indigo-200">
                {formatPesewas(totalLiabilities + totalEquity + netSurplus)}
              </div>
              <p className="text-[11px] text-indigo-700/80 dark:text-indigo-400 mt-0.5">
                Liabilities ({formatPesewas(totalLiabilities)}) + Equity ({formatPesewas(totalEquity)}) + Surplus ({formatPesewas(netSurplus)})
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 6 Standard Chart of Accounts Grid */}
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Standard Chart of Accounts (6 Core Accounts)
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {allAccounts.map((account) => {
            const isDebitNormal =
              account.type === AccountType.ASSET ||
              account.type === AccountType.EXPENSE;

            return (
              <Card
                key={account.id}
                className="rounded-lg border shadow-sm hover:border-primary/40 transition-colors"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="rounded-md p-1.5 bg-muted">
                        {getAccountTypeIcon(account.type)}
                      </div>
                      <div>
                        <span className="font-mono text-xs font-semibold text-primary">
                          {account.code}
                        </span>
                        <h4 className="text-sm font-semibold text-foreground line-clamp-1">
                          {account.name}
                        </h4>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-medium border ${getAccountTypeColor(
                        account.type
                      )}`}
                    >
                      {account.type}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="mt-1">
                    <span className="text-xs text-muted-foreground">
                      Net Balance ({isDebitNormal ? "Normal Debit" : "Normal Credit"})
                    </span>
                    <div className="font-mono text-xl font-bold tabular-nums text-foreground mt-0.5">
                      {formatPesewas(account.netBalance)}
                    </div>
                  </div>

                  {account.description && (
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                      {account.description}
                    </p>
                  )}

                  <div className="mt-3 pt-2 border-t flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>
                      Debits:{" "}
                      <strong className="text-foreground font-mono">
                        {formatPesewas(account.rawDebits)}
                      </strong>
                    </span>
                    <span>
                      Credits:{" "}
                      <strong className="text-foreground font-mono">
                        {formatPesewas(account.rawCredits)}
                      </strong>
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

