"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Calendar,
  Wallet,
  ArrowUpDown,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Search,
  Filter,
  Edit2,
  CreditCard,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EditDeadlineDialog } from "@/components/cycles/edit-deadline-dialog";
import { formatPesewas } from "@/lib/formatting/currency";
import { formatDate } from "@/lib/formatting/date";

interface ObligationItem {
  id: string;
  periodId: string;
  memberId: string;
  memberName: string;
  memberPhone: string;
  rotationPosition: number;
  amount: number;
  paidAmount: number;
  outstandingAmount: number;
  status: "PENDING" | "PARTIAL" | "PAID" | "OVERDUE" | "OVERDUE_PARTIAL";
}

interface PeriodItem {
  id: string;
  periodNumber: number;
  startDate: string;
  dueDate: string;
  closeDate: string;
  isOverdue: boolean;
  expectedPesewas: number;
  verifiedPesewas: number;
  outstandingPesewas: number;
  shortfallPesewas: number;
  obligations: ObligationItem[];
}

interface ContributionOverviewResponse {
  cycle: {
    id: string;
    cycleNumber: number;
    status: string;
    startDate: string;
    endDate: string;
    contributionAmount: number;
    monthlyTarget: number;
  } | null;
  summary: {
    totalExpectedPesewas: number;
    totalVerifiedPesewas: number;
    totalOutstandingPesewas: number;
    totalShortfallPesewas: number;
    collectionRatePercent: number;
  } | null;
  periods: PeriodItem[];
}

export default function ContributionsPage() {
  const [data, setData] = useState<ContributionOverviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriodTab, setSelectedPeriodTab] = useState<number | "ALL">("ALL");

  // Deadline modal state
  const [editingPeriod, setEditingPeriod] = useState<{
    id: string;
    periodNumber: number;
    currentDueDate: string;
  } | null>(null);

  const fetchOverview = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/contributions");
      const body = await res.json();
      if (!res.ok) {
        setError(body.error || "Failed to load contribution obligations.");
      } else {
        setData(body);
      }
    } catch {
      setError("Network error while loading contribution records.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading contribution records...</p>
      </div>
    );
  }

  if (!data?.cycle) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contributions</h1>
          <p className="text-sm text-muted-foreground">
            Monthly member contribution obligations and payment tracking.
          </p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No Active Savings Cycle</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Add four members and start a savings cycle to automatically generate monthly contribution obligations.
            </p>
            <Button asChild className="mt-6">
              <Link href="/members">Go to Members</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { cycle, summary, periods } = data;

  const displayedPeriods =
    selectedPeriodTab === "ALL"
      ? periods
      : periods.filter((p) => p.periodNumber === selectedPeriodTab);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Contributions</h1>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              Cycle {cycle.cycleNumber}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Monthly contribution obligations for the 4 group participants.
          </p>
        </div>

        <Button asChild>
          <Link href="/payments">
            <CreditCard className="mr-2 h-4 w-4" />
            Record Payment
          </Link>
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Shortfall Notification Banner */}
      {summary && summary.totalShortfallPesewas > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-destructive">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="space-y-1">
            <p className="font-semibold">
              Contribution Deadline Shortfall: {formatPesewas(summary.totalShortfallPesewas)}
            </p>
            <p className="text-xs text-destructive/90">
              One or more monthly contribution deadlines have passed with outstanding member balances.
              Automatic payout disbursement is paused until an administrative resolution is recorded in Payouts.
            </p>
          </div>
        </div>
      )}

      {/* KPI Summary Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expected</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatPesewas(summary.totalExpectedPesewas)}
              </div>
              <p className="text-xs text-muted-foreground">
                GH₵1,000 × 4 months in Cycle {cycle.cycleNumber}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Verified Collections</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                {formatPesewas(summary.totalVerifiedPesewas)}
              </div>
              <p className="text-xs text-muted-foreground">
                From verified payments only
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
              <ArrowUpDown className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">
                {formatPesewas(summary.totalOutstandingPesewas)}
              </div>
              <p className="text-xs text-muted-foreground">
                Total unpaid across cycle
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Collection Rate</CardTitle>
              <Clock className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {summary.collectionRatePercent}%
              </div>
              <p className="text-xs text-muted-foreground">
                Cycle fulfillment progress
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Period Filter Tabs */}
      <div className="border-b">
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedPeriodTab("ALL")}
            className={`border-b-2 px-3 pb-3 text-sm font-medium transition-colors ${
              selectedPeriodTab === "ALL"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            All Periods
          </button>
          {periods.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedPeriodTab(p.periodNumber)}
              className={`flex items-center gap-2 border-b-2 px-3 pb-3 text-sm font-medium transition-colors ${
                selectedPeriodTab === p.periodNumber
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>Month {p.periodNumber}</span>
              {p.isOverdue && p.outstandingPesewas > 0 && (
                <span className="h-2 w-2 rounded-full bg-destructive" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Period Cards */}
      <div className="space-y-6">
        {displayedPeriods.map((period) => {
          const progressPercent =
            period.expectedPesewas > 0
              ? Math.min(
                  100,
                  Math.round((period.verifiedPesewas / period.expectedPesewas) * 100)
                )
              : 0;

          return (
            <Card key={period.id}>
              <CardHeader className="border-b bg-muted/20 pb-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-lg">
                        Period {period.periodNumber}
                      </CardTitle>
                      {period.isOverdue ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800 dark:bg-red-950 dark:text-red-300">
                          <AlertTriangle className="h-3 w-3" />
                          Passed Deadline
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                          Active Window
                        </span>
                      )}
                    </div>
                    <CardDescription className="text-xs">
                      Start: {formatDate(period.startDate)} &bull; Deadline:{" "}
                      <span className="font-semibold text-foreground">
                        {formatDate(period.dueDate)}
                      </span>
                    </CardDescription>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm font-semibold">
                        {formatPesewas(period.verifiedPesewas)} /{" "}
                        {formatPesewas(period.expectedPesewas)}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {progressPercent}% collected
                      </div>
                    </div>

                    {!period.isOverdue && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setEditingPeriod({
                            id: period.id,
                            periodNumber: period.periodNumber,
                            currentDueDate: period.dueDate,
                          })
                        }
                      >
                        <Edit2 className="mr-1 h-3.5 w-3.5" />
                        Adjust Deadline
                      </Button>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </CardHeader>

              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16 text-center">Seat</TableHead>
                      <TableHead>Member</TableHead>
                      <TableHead>Phone Number</TableHead>
                      <TableHead className="text-right">Expected</TableHead>
                      <TableHead className="text-right">Verified Paid</TableHead>
                      <TableHead className="text-right">Balance Due</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {period.obligations.map((obligation) => (
                      <TableRow key={obligation.id}>
                        <TableCell className="text-center font-bold">
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs text-primary">
                            {obligation.rotationPosition}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/members/${obligation.memberId}`}
                            className="font-medium hover:text-primary hover:underline"
                          >
                            {obligation.memberName}
                          </Link>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {obligation.memberPhone}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatPesewas(obligation.amount)}
                        </TableCell>
                        <TableCell className="text-right font-medium text-emerald-600">
                          {formatPesewas(obligation.paidAmount)}
                        </TableCell>
                        <TableCell className="text-right font-medium text-amber-600">
                          {formatPesewas(obligation.outstandingAmount)}
                        </TableCell>
                        <TableCell className="text-center">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              obligation.status === "PAID"
                                ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300"
                                : obligation.status === "PARTIAL"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                                : obligation.status === "OVERDUE"
                                ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                                : obligation.status === "OVERDUE_PARTIAL"
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                            }`}
                          >
                            {obligation.status.replace("_", " ")}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {obligation.outstandingAmount > 0 ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                              className="text-primary hover:text-primary"
                            >
                              <Link
                                href={`/payments?memberId=${obligation.memberId}&periodId=${period.id}`}
                              >
                                Record
                              </Link>
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">Settled</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Edit Deadline Dialog */}
      {editingPeriod && (
        <EditDeadlineDialog
          isOpen={Boolean(editingPeriod)}
          onClose={() => setEditingPeriod(null)}
          onSuccess={fetchOverview}
          period={editingPeriod}
        />
      )}
    </div>
  );
}
