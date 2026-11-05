"use client";

import { useCallback, useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  RotateCcw,
  Receipt,
  Eye,
  Smartphone,
  Banknote,
  Building,
  AlertCircle,
  ShieldCheck,
  RefreshCw,
  Calendar,
  Users,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { ManualPaymentDialog } from "@/components/payments/manual-payment-dialog";
import { ReversePaymentDialog } from "@/components/payments/reverse-payment-dialog";
import { PaymentDetailsDialog } from "@/components/payments/payment-details-dialog";

interface Member {
  id: string;
  fullName: string;
  phoneNumber: string;
  rotationPosition: number;
}

interface Obligation {
  id: string;
  periodId: string;
  periodNumber: number;
  dueDate: string;
  memberId: string;
  memberName: string;
  rotationPosition: number;
  amount: number;
  paidAmount: number;
  outstandingAmount: number;
  status: string;
}

interface PaymentRecord {
  id: string;
  groupId: string;
  memberId: string;
  periodId: string | null;
  amount: number;
  channel: string;
  reference: string | null;
  notes: string | null;
  paymentDate: string;
  status: "PENDING" | "VERIFIED" | "REVERSED" | "FAILED";
  verifiedAt: string | null;
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
  } | null;
  allocations: {
    id: string;
    amount: number;
    obligation: {
      period: {
        periodNumber: number;
      };
    };
  }[];
}

interface PaymentStats {
  totalVerifiedPesewas: number;
  totalPendingPesewas: number;
  totalReversedPesewas: number;
  totalReceiptsCount: number;
}

const channelLabels: Record<string, { label: string; icon: any }> = {
  MTN_MOMO: { label: "MTN MoMo", icon: Smartphone },
  TELECEL_CASH: { label: "Telecel Cash", icon: Smartphone },
  AT_MONEY: { label: "AT Money", icon: Smartphone },
  CASH: { label: "Cash Receipt", icon: Banknote },
  BANK_TRANSFER: { label: "Bank Transfer", icon: Building },
  OTHER: { label: "Other", icon: CreditCard },
};

function PaymentsPageContent() {
  const searchParams = useSearchParams();
  const urlMemberId = searchParams?.get("memberId") || undefined;
  const urlPeriodId = searchParams?.get("periodId") || undefined;
  const urlObligationId = searchParams?.get("obligationId") || undefined;

  const [preselectedMemberId, setPreselectedMemberId] = useState<string | undefined>(urlMemberId);
  const [preselectedObligationId, setPreselectedObligationId] = useState<string | undefined>(urlObligationId);

  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [stats, setStats] = useState<PaymentStats>({
    totalVerifiedPesewas: 0,
    totalPendingPesewas: 0,
    totalReversedPesewas: 0,
    totalReceiptsCount: 0,
  });
  const [members, setMembers] = useState<Member[]>([]);
  const [obligations, setObligations] = useState<Obligation[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [channelFilter, setChannelFilter] = useState<string>("ALL");
  const [memberFilter, setMemberFilter] = useState<string>("ALL");

  // Dialog states
  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const [reversingPayment, setReversingPayment] = useState<PaymentRecord | null>(null);
  const [detailsPaymentId, setDetailsPaymentId] = useState<string | null>(null);
  const [isVerifyingId, setIsVerifyingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const queryParams = new URLSearchParams();
      if (searchQuery.trim()) queryParams.set("q", searchQuery.trim());
      if (statusFilter !== "ALL") queryParams.set("status", statusFilter);
      if (channelFilter !== "ALL") queryParams.set("channel", channelFilter);
      if (memberFilter !== "ALL") queryParams.set("memberId", memberFilter);

      const res = await fetch(`/api/payments?${queryParams.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load payments");
      }

      setPayments(data.payments || []);
      setStats(
        data.stats || {
          totalVerifiedPesewas: 0,
          totalPendingPesewas: 0,
          totalReversedPesewas: 0,
          totalReceiptsCount: 0,
        }
      );
      setMembers(data.members || []);
      setObligations(data.obligations || []);
    } catch (err: any) {
      setError(err.message || "Failed to connect to payments service.");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter, channelFilter, memberFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Synchronize preselection from URL parameters
  useEffect(() => {
    if (urlMemberId) {
      setPreselectedMemberId(urlMemberId);
      setIsRecordOpen(true);
    }
    if (urlObligationId) {
      setPreselectedObligationId(urlObligationId);
    } else if (urlPeriodId && urlMemberId && obligations.length > 0) {
      const match = obligations.find(
        (o) => o.memberId === urlMemberId && o.periodId === urlPeriodId
      );
      if (match) {
        setPreselectedObligationId(match.id);
      }
    }
  }, [urlMemberId, urlPeriodId, urlObligationId, obligations]);

  const handleVerifyPending = async (paymentId: string) => {
    try {
      setIsVerifyingId(paymentId);
      const res = await fetch(`/api/payments/${paymentId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to verify payment");
      }

      await loadData();
    } catch (err: any) {
      alert(err.message || "Could not verify payment");
    } finally {
      setIsVerifyingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              Financial Administration
            </span>
            <Badge variant="outline" className="text-[10px]">
              Phase 7
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mt-1">
            Manual Payment Recording
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Record member contributions via Cash, MTN MoMo, Telecel Cash, AT Money, or Bank
            Transfer with balanced ledger accounting.
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
          <Button onClick={() => setIsRecordOpen(true)} className="shadow-sm">
            <Plus className="mr-2 h-4 w-4" />
            Record Payment
          </Button>
        </div>
      </header>

      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold">Unable to load payments</h4>
            <p className="text-xs mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Advisory Guidance: No Members State */}
      {!loading && members.length === 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          <div className="flex items-start gap-3">
            <Users className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div>
              <h3 className="font-semibold text-sm text-amber-950 dark:text-amber-100">
                No Group Members Registered
              </h3>
              <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5 leading-relaxed">
                RSCMS manages rotating contributions across all group participants. You must register members in rotation seats before payments can be recorded.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            asChild
            className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white"
          >
            <Link href="/members">
              Register Members <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      )}

      {/* Advisory Guidance: No Active Cycle / Obligations State */}
      {!loading && members.length > 0 && obligations.length === 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-lg border border-blue-200 bg-blue-50/80 p-4 text-blue-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm text-blue-950 dark:text-blue-100">
                  No Active Savings Cycle (Missing Target Obligations)
                </h3>
                <Badge variant="outline" className="text-[10px] bg-blue-100 text-blue-800 border-blue-300">
                  Setup Step
                </Badge>
              </div>
              <p className="text-xs text-blue-800 dark:text-blue-300 mt-0.5 leading-relaxed">
                In RSCMS, contributions cannot be recorded as loose deposits. Each payment must be credited against a specific monthly period <strong>Obligation</strong> (e.g. Period 1 Contribution of GH₵250.00). Please launch a 4-month cycle in Settings to generate the period obligations.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            asChild
            className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Link href="/settings">
              Launch Cycle <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Verified Contributions
              </span>
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="mt-2 text-xl sm:text-2xl font-bold tracking-tight text-emerald-600 font-mono">
              {formatPesewas(stats.totalVerifiedPesewas)}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Posted to general ledger (1010/4010)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Pending Verification
              </span>
              <Clock className="h-4 w-4 text-amber-500" />
            </div>
            <div className="mt-2 text-xl sm:text-2xl font-bold tracking-tight text-amber-600 font-mono">
              {formatPesewas(stats.totalPendingPesewas)}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Requires administrative confirmation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Reversed Amount
              </span>
              <RotateCcw className="h-4 w-4 text-destructive" />
            </div>
            <div className="mt-2 text-xl sm:text-2xl font-bold tracking-tight text-destructive font-mono">
              {formatPesewas(stats.totalReversedPesewas)}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Rolled back with audit reason
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Total Receipts
              </span>
              <Receipt className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-2 text-xl sm:text-2xl font-bold tracking-tight font-mono">
              {stats.totalReceiptsCount}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Unique recorded payment entries
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Toolbar */}
      <Card>
        <CardContent className="p-3.5 sm:p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search reference, member, notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Member */}
              <select
                value={memberFilter}
                onChange={(e) => setMemberFilter(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-2.5 text-xs ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="ALL">All Members</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    Pos {m.rotationPosition}: {m.fullName}
                  </option>
                ))}
              </select>

              {/* Channel */}
              <select
                value={channelFilter}
                onChange={(e) => setChannelFilter(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-2.5 text-xs ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="ALL">All Channels</option>
                <option value="CASH">Cash</option>
                <option value="MTN_MOMO">MTN MoMo</option>
                <option value="TELECEL_CASH">Telecel Cash</option>
                <option value="AT_MONEY">AT Money</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="OTHER">Other</option>
              </select>

              {/* Status */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-2.5 text-xs ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="ALL">All Statuses</option>
                <option value="VERIFIED">Verified</option>
                <option value="PENDING">Pending</option>
                <option value="REVERSED">Reversed</option>
              </select>

              {(searchQuery || statusFilter !== "ALL" || channelFilter !== "ALL" || memberFilter !== "ALL") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("ALL");
                    setChannelFilter("ALL");
                    setMemberFilter("ALL");
                  }}
                  className="h-9 text-xs px-2.5 text-muted-foreground hover:text-foreground"
                >
                  Clear filters
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Date</TableHead>
                <TableHead>Member</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Period</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="w-[100px] text-center">Status</TableHead>
                <TableHead className="w-[140px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-12 text-center text-muted-foreground text-sm">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-primary" />
                    Loading payment records...
                  </TableCell>
                </TableRow>
              ) : payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-16 text-center">
                    <CreditCard className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
                    <p className="font-semibold text-foreground text-base">No payment records found</p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                      {members.length === 0
                        ? "Register group members to begin tracking rotating contributions."
                        : obligations.length === 0
                        ? "Launch a savings cycle in Settings to generate period obligations."
                        : "Record a manual cash, mobile money, or bank payment received from a member."}
                    </p>
                    {members.length === 0 ? (
                      <Button asChild size="sm" className="mt-4">
                        <Link href="/members">
                          <Users className="mr-1.5 h-4 w-4" /> Go to Members Directory
                        </Link>
                      </Button>
                    ) : obligations.length === 0 ? (
                      <Button asChild size="sm" className="mt-4">
                        <Link href="/settings">
                          <Calendar className="mr-1.5 h-4 w-4" /> Launch Savings Cycle
                        </Link>
                      </Button>
                    ) : (
                      <Button
                        onClick={() => setIsRecordOpen(true)}
                        size="sm"
                        className="mt-4"
                      >
                        <Plus className="mr-1.5 h-4 w-4" /> Record First Payment
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((payment) => {
                  const channelInfo = channelLabels[payment.channel] || {
                    label: payment.channel,
                    icon: CreditCard,
                  };
                  const ChannelIcon = channelInfo.icon;
                  const isVerified = payment.status === "VERIFIED";
                  const isPending = payment.status === "PENDING";
                  const isReversed = payment.status === "REVERSED";

                  return (
                    <TableRow key={payment.id} className="hover:bg-muted/40 text-xs">
                      {/* Date */}
                      <TableCell className="font-medium text-muted-foreground whitespace-nowrap">
                        {formatDate(new Date(payment.paymentDate))}
                      </TableCell>

                      {/* Member */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[11px]">
                            {payment.member.rotationPosition}
                          </span>
                          <div>
                            <span className="font-semibold text-foreground block">
                              {payment.member.fullName}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              {payment.member.phoneNumber}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      {/* Channel */}
                      <TableCell>
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border bg-muted/30 text-foreground font-medium text-[11px]">
                          <ChannelIcon className="h-3 w-3 text-muted-foreground" />
                          <span>{channelInfo.label}</span>
                        </div>
                      </TableCell>

                      {/* Reference */}
                      <TableCell>
                        <span className="font-mono font-medium text-foreground">
                          {payment.reference || "—"}
                        </span>
                        {payment.notes && (
                          <span className="block text-[10px] text-muted-foreground truncate max-w-[150px]">
                            {payment.notes}
                          </span>
                        )}
                      </TableCell>

                      {/* Target Period */}
                      <TableCell>
                        {payment.period ? (
                          <Badge variant="outline" className="font-normal text-[11px]">
                            Period {payment.period.periodNumber}
                          </Badge>
                        ) : payment.allocations?.[0] ? (
                          <Badge variant="outline" className="font-normal text-[11px]">
                            Period {payment.allocations[0].obligation.period.periodNumber}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>

                      {/* Amount */}
                      <TableCell className="text-right font-mono font-bold text-foreground text-sm tabular-nums">
                        {formatPesewas(payment.amount)}
                      </TableCell>

                      {/* Status */}
                      <TableCell className="text-center">
                        {isVerified && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            <CheckCircle2 className="h-3 w-3" />
                            VERIFIED
                          </span>
                        )}
                        {isPending && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                            <Clock className="h-3 w-3" />
                            PENDING
                          </span>
                        )}
                        {isReversed && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                            <RotateCcw className="h-3 w-3" />
                            REVERSED
                          </span>
                        )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View details */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDetailsPaymentId(payment.id)}
                            className="h-7 w-7 p-0"
                            title="View audit & ledger details"
                          >
                            <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>

                          {/* Verify Pending */}
                          {isPending && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleVerifyPending(payment.id)}
                              disabled={isVerifyingId === payment.id}
                              className="h-7 text-xs px-2 font-medium border-emerald-300 hover:bg-emerald-50 text-emerald-700"
                            >
                              {isVerifyingId === payment.id ? (
                                <RefreshCw className="h-3 w-3 animate-spin" />
                              ) : (
                                <>
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Verify
                                </>
                              )}
                            </Button>
                          )}

                          {/* Reverse Verified */}
                          {isVerified && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setReversingPayment(payment)}
                              className="h-7 text-xs px-2 text-destructive hover:bg-destructive/10"
                              title="Reverse payment with audit justification"
                            >
                              <RotateCcw className="h-3 w-3 mr-1" />
                              Reverse
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
      <ManualPaymentDialog
        isOpen={isRecordOpen}
        onClose={() => {
          setIsRecordOpen(false);
          setPreselectedMemberId(undefined);
          setPreselectedObligationId(undefined);
        }}
        onSuccess={() => {
          loadData();
        }}
        members={members}
        obligations={obligations}
        preselectedMemberId={preselectedMemberId}
        preselectedObligationId={preselectedObligationId}
      />

      <ReversePaymentDialog
        isOpen={Boolean(reversingPayment)}
        onClose={() => setReversingPayment(null)}
        onSuccess={() => {
          loadData();
        }}
        payment={reversingPayment}
      />

      <PaymentDetailsDialog
        isOpen={Boolean(detailsPaymentId)}
        onClose={() => setDetailsPaymentId(null)}
        paymentId={detailsPaymentId}
      />
    </div>
  );
}

export default function PaymentsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <RefreshCw className="h-6 w-6 animate-spin text-primary" />
        </div>
      }
    >
      <PaymentsPageContent />
    </Suspense>
  );
}
