"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowDownToLine,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  RefreshCw,
  Eye,
  ShieldCheck,
  CheckCheck,
  Lock,
  ArrowRight,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { formatDate } from "@/lib/formatting/date";
import { AuthorizePayoutDialog } from "@/components/payouts/authorize-payout-dialog";
import { DisbursePayoutDialog } from "@/components/payouts/disburse-payout-dialog";
import { AcknowledgePayoutDialog } from "@/components/payouts/acknowledge-payout-dialog";
import { PostponePayoutDialog } from "@/components/payouts/postpone-payout-dialog";
import { PayoutDetailsDialog } from "@/components/payouts/payout-details-dialog";

interface ScheduleItem {
  id: string;
  rotationPosition: number;
  expectedAmount: number;
  scheduledDate: string;
  status: string;
  periodShortfall: number;
  isRotationBlocked: boolean;
  member: {
    id: string;
    fullName: string;
    phoneNumber: string;
    rotationPosition: number;
  };
  period: {
    id: string;
    periodNumber: number;
    dueDate: string;
  };
  activePayout: {
    id: string;
    expectedAmount: number;
    authorizedAmount: number;
    actualAmount: number;
    status: string;
    channel: string | null;
    reference: string | null;
    disbursedAt: string | null;
    acknowledgedAt: string | null;
  } | null;
}

interface PayoutSummary {
  totalExpectedPesewas: number;
  totalDisbursedPesewas: number;
  totalOutstandingPesewas: number;
  currentRecipient: {
    id: string;
    fullName: string;
    rotationPosition: number;
  } | null;
  nextRecipient: {
    id: string;
    fullName: string;
    rotationPosition: number;
  } | null;
}

export default function PayoutsPage() {
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [availablePesewas, setAvailablePesewas] = useState(0);
  const [summary, setSummary] = useState<PayoutSummary>({
    totalExpectedPesewas: 0,
    totalDisbursedPesewas: 0,
    totalOutstandingPesewas: 0,
    currentRecipient: null,
    nextRecipient: null,
  });
  const [cycleNumber, setCycleNumber] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog management
  const [authorizingSchedule, setAuthorizingSchedule] = useState<ScheduleItem | null>(null);
  const [disbursingPayout, setDisbursingPayout] = useState<any | null>(null);
  const [acknowledgingPayout, setAcknowledgingPayout] = useState<any | null>(null);
  const [postponingSchedule, setPostponingSchedule] = useState<ScheduleItem | null>(null);
  const [detailsPayoutId, setDetailsPayoutId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/payouts");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load payouts");
      }

      setSchedules(data.schedules || []);
      setAvailablePesewas(data.availablePesewas || 0);
      setSummary(
        data.summary || {
          totalExpectedPesewas: 0,
          totalDisbursedPesewas: 0,
          totalOutstandingPesewas: 0,
          currentRecipient: null,
          nextRecipient: null,
        }
      );
      setCycleNumber(data.cycle?.cycleNumber || null);
    } catch (err: any) {
      setError(err.message || "Failed to connect to payouts service.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              Fixed Rotation Management
            </span>
            <Badge variant="outline" className="text-[10px]">
              Phase 8
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mt-1">
            Payout Management
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Fixed monthly rotation (Positions 1 to 4) · Authorization, disbursement, and recipient
            acknowledgement tracked separately.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadData()}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </header>

      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold">Unable to load payout records</h4>
            <p className="text-xs mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {/* Available Group Funds */}
        <Card>
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Available Verified Funds
              </span>
              <Wallet className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="mt-2 text-xl sm:text-2xl font-bold tracking-tight text-emerald-600 font-mono">
              {formatPesewas(availablePesewas)}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Current group cash & bank balance
            </p>
          </CardContent>
        </Card>

        {/* Total Disbursed */}
        <Card>
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Total Disbursed (Cycle {cycleNumber || 1})
              </span>
              <ArrowDownToLine className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-2 text-xl sm:text-2xl font-bold tracking-tight font-mono">
              {formatPesewas(summary.totalDisbursedPesewas)}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Disbursed of {formatPesewas(summary.totalExpectedPesewas)} expected
            </p>
          </CardContent>
        </Card>

        {/* Outstanding Payouts */}
        <Card>
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Remaining Payouts Due
              </span>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-2 text-xl sm:text-2xl font-bold tracking-tight font-mono">
              {formatPesewas(summary.totalOutstandingPesewas)}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Remaining obligations this cycle
            </p>
          </CardContent>
        </Card>

        {/* Active Rotation Recipient */}
        <Card>
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Current Due Recipient
              </span>
              <ShieldCheck className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-2 text-lg sm:text-xl font-bold tracking-tight truncate">
              {summary.currentRecipient ? (
                summary.currentRecipient.fullName
              ) : (
                <span className="text-muted-foreground text-base">Cycle Completed</span>
              )}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {summary.currentRecipient ? (
                <>Position {summary.currentRecipient.rotationPosition} in fixed rotation</>
              ) : (
                "All 4 rotation payouts processed"
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Visual Rotation Progression Stepper */}
      <Card>
        <CardContent className="p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              4-Month Fixed Rotation Flow
            </h3>
            <span className="text-xs text-muted-foreground">
              Cycle {cycleNumber || 1} · Monthly GH₵1,000 Target
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {schedules.map((schedule) => {
              const active = schedule.activePayout;
              const isAcknowledged =
                schedule.status === "ACKNOWLEDGED" || active?.status === "ACKNOWLEDGED";
              const isDisbursed =
                schedule.status === "DISBURSED" || active?.status === "DISBURSED";
              const isAuthorized =
                schedule.status === "AUTHORIZED" || active?.status === "AUTHORIZED";
              const isPostponed = schedule.status === "POSTPONED";

              return (
                <div
                  key={schedule.id}
                  className={`p-3 rounded-lg border transition-all text-xs space-y-1.5 ${
                    isAcknowledged
                      ? "bg-emerald-50/50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900"
                      : isDisbursed
                      ? "bg-blue-50/50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900"
                      : isAuthorized
                      ? "bg-amber-50/50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900"
                      : isPostponed
                      ? "bg-rose-50/50 border-rose-200 dark:bg-rose-950/20 dark:border-rose-900"
                      : "bg-muted/30 border-border"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold flex items-center gap-1.5">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[10px]">
                        {schedule.rotationPosition}
                      </span>
                      <span>Pos {schedule.rotationPosition}</span>
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 h-5"
                    >
                      {active?.status || schedule.status}
                    </Badge>
                  </div>
                  <p className="font-semibold text-foreground truncate">
                    {schedule.member.fullName}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t">
                    <span>{formatDate(new Date(schedule.scheduledDate))}</span>
                    <span className="font-mono font-medium text-foreground">
                      {formatPesewas(schedule.expectedAmount)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Payout Schedule Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Position</TableHead>
                <TableHead>Recipient Member</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Scheduled Date</TableHead>
                <TableHead className="text-right">Expected</TableHead>
                <TableHead className="text-right">Shortfall</TableHead>
                <TableHead className="text-center">Lifecycle Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-12 text-center text-muted-foreground text-sm">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-primary" />
                    Loading payout schedules...
                  </TableCell>
                </TableRow>
              ) : schedules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-16 text-center">
                    <p className="font-semibold text-foreground text-base">
                      No active payout schedule
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Activate a 4-member savings cycle to generate the fixed payout schedule.
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                schedules.map((schedule) => {
                  const activePayout = schedule.activePayout;
                  const isScheduledOrPostponed =
                    !activePayout &&
                    (schedule.status === "SCHEDULED" || schedule.status === "POSTPONED");
                  const isAuthorized = activePayout?.status === "AUTHORIZED";
                  const isDisbursedOrPartial =
                    activePayout &&
                    (activePayout.status === "DISBURSED" || activePayout.status === "PARTIAL");
                  const isAcknowledged =
                    activePayout?.status === "ACKNOWLEDGED" ||
                    (isDisbursedOrPartial && activePayout?.acknowledgedAt !== null);

                  return (
                    <TableRow key={schedule.id} className="hover:bg-muted/40 text-xs">
                      {/* Position */}
                      <TableCell className="font-bold">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                          {schedule.rotationPosition}
                        </span>
                      </TableCell>

                      {/* Recipient */}
                      <TableCell>
                        <span className="font-semibold text-foreground block">
                          {schedule.member.fullName}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {schedule.member.phoneNumber}
                        </span>
                      </TableCell>

                      {/* Period */}
                      <TableCell>
                        <Badge variant="outline" className="text-[11px]">
                          Period {schedule.period.periodNumber}
                        </Badge>
                      </TableCell>

                      {/* Date */}
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        {formatDate(new Date(schedule.scheduledDate))}
                      </TableCell>

                      {/* Expected Amount */}
                      <TableCell className="text-right font-mono font-bold text-foreground tabular-nums">
                        {formatPesewas(schedule.expectedAmount)}
                      </TableCell>

                      {/* Shortfall */}
                      <TableCell className="text-right tabular-nums">
                        {schedule.periodShortfall > 0 ? (
                          <span className="text-amber-600 font-semibold font-mono">
                            {formatPesewas(schedule.periodShortfall)}
                          </span>
                        ) : (
                          <span className="text-emerald-600 font-medium">None (0)</span>
                        )}
                      </TableCell>

                      {/* Status */}
                      <TableCell className="text-center">
                        {isAcknowledged ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            <CheckCheck className="h-3 w-3" />
                            ACKNOWLEDGED
                          </span>
                        ) : isDisbursedOrPartial ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                            <ArrowDownToLine className="h-3 w-3" />
                            {activePayout.status}
                          </span>
                        ) : isAuthorized ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                            <ShieldCheck className="h-3 w-3" />
                            AUTHORIZED
                          </span>
                        ) : schedule.status === "POSTPONED" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                            <Clock className="h-3 w-3" />
                            POSTPONED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                            SCHEDULED
                          </span>
                        )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Details Button */}
                          {activePayout && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDetailsPayoutId(activePayout.id)}
                              className="h-7 w-7 p-0"
                              title="View audit trail & ledger postings"
                            >
                              <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                            </Button>
                          )}

                          {/* Action 1: Authorize (if scheduled or postponed) */}
                          {isScheduledOrPostponed && (
                            <>
                              {schedule.isRotationBlocked ? (
                                <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground italic px-2">
                                  <Lock className="h-3 w-3" /> Awaiting Pos {schedule.rotationPosition - 1}
                                </span>
                              ) : (
                                <div className="flex items-center gap-1">
                                  <Button
                                    size="sm"
                                    onClick={() => setAuthorizingSchedule(schedule)}
                                    className="h-7 text-xs px-2.5 font-medium"
                                  >
                                    Authorize
                                  </Button>
                                  {schedule.status === "SCHEDULED" && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => setPostponingSchedule(schedule)}
                                      className="h-7 text-xs px-2 text-muted-foreground hover:text-foreground"
                                    >
                                      Postpone
                                    </Button>
                                  )}
                                </div>
                              )}
                            </>
                          )}

                          {/* Action 2: Disburse (if authorized) */}
                          {isAuthorized && (
                            <Button
                              size="sm"
                              onClick={() =>
                                setDisbursingPayout({
                                  ...activePayout,
                                  member: schedule.member,
                                })
                              }
                              className="h-7 text-xs px-2.5 font-medium bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                              <ArrowDownToLine className="h-3 w-3 mr-1" />
                              Disburse
                            </Button>
                          )}

                          {/* Action 3: Acknowledge (if disbursed but not acknowledged) */}
                          {isDisbursedOrPartial && !activePayout.acknowledgedAt && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setAcknowledgingPayout({
                                  ...activePayout,
                                  member: schedule.member,
                                })
                              }
                              className="h-7 text-xs px-2.5 font-medium border-emerald-300 hover:bg-emerald-50 text-emerald-700"
                            >
                              <CheckCheck className="h-3 w-3 mr-1" />
                              Record Receipt
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <AuthorizePayoutDialog
        isOpen={Boolean(authorizingSchedule)}
        onClose={() => setAuthorizingSchedule(null)}
        onSuccess={() => loadData()}
        schedule={authorizingSchedule}
        availableFundsPesewas={availablePesewas}
      />

      <DisbursePayoutDialog
        isOpen={Boolean(disbursingPayout)}
        onClose={() => setDisbursingPayout(null)}
        onSuccess={() => loadData()}
        payout={disbursingPayout}
        availableFundsPesewas={availablePesewas}
      />

      <AcknowledgePayoutDialog
        isOpen={Boolean(acknowledgingPayout)}
        onClose={() => setAcknowledgingPayout(null)}
        onSuccess={() => loadData()}
        payout={acknowledgingPayout}
      />

      <PostponePayoutDialog
        isOpen={Boolean(postponingSchedule)}
        onClose={() => setPostponingSchedule(null)}
        onSuccess={() => loadData()}
        schedule={postponingSchedule}
      />

      <PayoutDetailsDialog
        isOpen={Boolean(detailsPayoutId)}
        onClose={() => setDetailsPayoutId(null)}
        payoutId={detailsPayoutId}
      />
    </div>
  );
}
