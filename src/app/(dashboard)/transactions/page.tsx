"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BookOpenCheck,
  Scale,
  Wallet,
  History,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  Eye,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { TransactionType } from "@prisma/client";
import { TrialBalanceCard } from "@/components/ledger/trial-balance-card";
import { AccountBalancesGrid } from "@/components/ledger/account-balances-grid";
import { CashReconciliationCard } from "@/components/ledger/cash-reconciliation-card";
import {
  TransactionDetailsDialog,
  type TransactionDetail,
} from "@/components/ledger/transaction-details-dialog";
import { RecordAdjustmentDialog } from "@/components/ledger/record-adjustment-dialog";
import type {
  TrialBalanceResult,
  CashReconciliationResult,
  AccountCategorySummary,
  AccountBalanceSummary,
} from "@/services/ledger.service";

type ActiveTab = "journal" | "trial-balance" | "chart-of-accounts" | "cash-book";

export default function TransactionsPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("journal");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [trialBalance, setTrialBalance] = useState<TrialBalanceResult | null>(null);
  const [cashReconciliation, setCashReconciliation] = useState<CashReconciliationResult | null>(null);
  const [accountsSummary, setAccountsSummary] = useState<AccountCategorySummary | null>(null);
  const [transactions, setTransactions] = useState<TransactionDetail[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, totalCount: 0, totalPages: 1 });

  // Filter states for Journal
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");

  // Dialog states
  const [selectedTx, setSelectedTx] = useState<TransactionDetail | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isAdjustmentOpen, setIsAdjustmentOpen] = useState(false);

  const fetchLedgerData = useCallback(async () => {
    try {
      setRefreshing(true);
      setError(null);

      // Build query string for transactions
      const params = new URLSearchParams();
      params.set("page", String(pagination.page));
      params.set("limit", "50");
      if (typeFilter !== "ALL") {
        params.set("type", typeFilter);
      }
      if (searchQuery.trim()) {
        params.set("search", searchQuery.trim());
      }

      const [ledgerRes, txRes] = await Promise.all([
        fetch("/api/ledger"),
        fetch(`/api/transactions?${params.toString()}`),
      ]);

      if (!ledgerRes.ok || !txRes.ok) {
        throw new Error("Failed to load financial ledger data.");
      }

      const ledgerBody = await ledgerRes.json();
      const txBody = await txRes.json();

      setTrialBalance(ledgerBody.trialBalance);
      setCashReconciliation(ledgerBody.cashReconciliation);
      setAccountsSummary(ledgerBody.accountsSummary);
      setTransactions(txBody.transactions);
      setPagination(txBody.pagination);
    } catch (err: any) {
      setError(err.message || "Could not load financial records.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [pagination.page, typeFilter, searchQuery]);

  useEffect(() => {
    void fetchLedgerData();
  }, [fetchLedgerData]);

  const handleOpenDetails = (tx: TransactionDetail) => {
    setSelectedTx(tx);
    setIsDetailsOpen(true);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void fetchLedgerData();
  };

  const availableAccounts: AccountBalanceSummary[] = trialBalance?.accounts || [];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            Double-Entry Accounting & Audit
          </p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight">
            Financial Ledger & Reconciliation
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Immutable, balanced double-entry book of accounts. Every debit strictly equals a credit in integer pesewas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void fetchLedgerData()}
            disabled={refreshing}
          >
            <RefreshCw
              className={`mr-2 h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`}
            />
            Sync Ledger
          </Button>
          <Button
            size="sm"
            onClick={() => setIsAdjustmentOpen(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Post Adjustment
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive flex items-center gap-2"
        >
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-border space-x-1 sm:space-x-2 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab("journal")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "journal"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <BookOpenCheck className="h-4 w-4" />
          General Journal ({pagination.totalCount})
        </button>

        <button
          onClick={() => setActiveTab("trial-balance")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "trial-balance"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Scale className="h-4 w-4" />
          Trial Balance
          {trialBalance && (
            <Badge
              variant={trialBalance.isBalanced ? "default" : "destructive"}
              className={`ml-1 text-[10px] px-1.5 py-0 ${
                trialBalance.isBalanced ? "bg-emerald-600 hover:bg-emerald-600" : ""
              }`}
            >
              {trialBalance.isBalanced ? "Balanced" : "Discrepancy"}
            </Badge>
          )}
        </button>

        <button
          onClick={() => setActiveTab("chart-of-accounts")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "chart-of-accounts"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Wallet className="h-4 w-4" />
          Chart of Accounts (6)
        </button>

        <button
          onClick={() => setActiveTab("cash-book")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "cash-book"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <History className="h-4 w-4" />
          Cash Book & Liquidity
        </button>
      </div>

      {/* Tab 1: General Journal */}
      {activeTab === "journal" && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <Card className="rounded-lg border shadow-sm">
            <CardContent className="p-3">
              <form
                onSubmit={handleSearchSubmit}
                className="flex flex-col sm:flex-row items-center gap-3"
              >
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search by reference (TXN-...) or description memo..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9 text-xs"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <select
                    className="h-9 rounded-md border bg-background px-3 text-xs focus:ring-1 focus:ring-primary w-full sm:w-auto"
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                  >
                    <option value="ALL">All Types</option>
                    <option value={TransactionType.CONTRIBUTION}>Contribution</option>
                    <option value={TransactionType.PAYOUT}>Payout</option>
                    <option value={TransactionType.REVERSAL}>Reversal</option>
                    <option value={TransactionType.ADJUSTMENT}>Adjustment</option>
                    <option value={TransactionType.OPENING_BALANCE}>Opening Balance</option>
                  </select>

                  <Button type="submit" variant="secondary" size="sm" className="h-9 text-xs">
                    Filter
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Transactions Table */}
          <Card className="rounded-lg border shadow-sm overflow-hidden">
            <CardHeader className="border-b bg-muted/20 pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <BookOpenCheck className="h-4 w-4 text-primary" />
                  Posted Transactions Journal
                </CardTitle>
                <span className="text-xs text-muted-foreground">
                  Showing {transactions.length} of {pagination.totalCount} records
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/10 text-xs">
                    <TableHead>Posting Date</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description & Accounts</TableHead>
                    <TableHead className="text-right">Debit (GH₵)</TableHead>
                    <TableHead className="text-right">Credit (GH₵)</TableHead>
                    <TableHead className="text-center">Balanced</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                        <RefreshCw className="mx-auto h-5 w-5 animate-spin mb-2" />
                        Loading journal transactions...
                      </TableCell>
                    </TableRow>
                  ) : transactions.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="py-12 text-center text-sm text-muted-foreground"
                      >
                        No transactions found matching your criteria.
                      </TableCell>
                    </TableRow>
                  ) : (
                    transactions.map((tx) => (
                      <TableRow
                        key={tx.id}
                        className="hover:bg-muted/30 cursor-pointer text-xs"
                        onClick={() => handleOpenDetails(tx)}
                      >
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {formatDateTime(tx.createdAt)}
                        </TableCell>
                        <TableCell className="font-mono font-semibold text-primary">
                          {tx.reference}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] font-normal">
                            {tx.transactionType.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-foreground line-clamp-1">
                            {tx.description}
                          </div>
                          <div className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                            {tx.entries
                              .map(
                                (e) =>
                                  `${e.direction}: ${e.accountCode} ${e.accountName}`
                              )
                              .join(" · ")}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono tabular-nums font-medium">
                          {formatPesewas(tx.totalDebits)}
                        </TableCell>
                        <TableCell className="text-right font-mono tabular-nums font-medium">
                          {formatPesewas(tx.totalCredits)}
                        </TableCell>
                        <TableCell className="text-center">
                          {tx.isBalanced ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-900">
                              <CheckCircle2 className="h-3 w-3" />
                              OK
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-destructive bg-destructive/10 px-1.5 py-0.5 rounded border border-destructive/20">
                              <AlertTriangle className="h-3 w-3" />
                              Diff
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDetails(tx);
                            }}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab 2: Trial Balance */}
      {activeTab === "trial-balance" && (
        <TrialBalanceCard
          data={trialBalance}
          loading={loading}
          onRefresh={() => void fetchLedgerData()}
        />
      )}

      {/* Tab 3: Chart of Accounts */}
      {activeTab === "chart-of-accounts" && (
        <AccountBalancesGrid
          summary={accountsSummary}
          loading={loading}
        />
      )}

      {/* Tab 4: Cash Book & Liquidity */}
      {activeTab === "cash-book" && (
        <CashReconciliationCard
          data={cashReconciliation}
          loading={loading}
        />
      )}

      {/* Transaction Details Dialog */}
      <TransactionDetailsDialog
        transaction={selectedTx}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
      />

      {/* Post Manual Adjustment Dialog */}
      <RecordAdjustmentDialog
        isOpen={isAdjustmentOpen}
        onClose={() => setIsAdjustmentOpen(false)}
        onSuccess={() => void fetchLedgerData()}
        accounts={availableAccounts}
      />
    </div>
  );
}
