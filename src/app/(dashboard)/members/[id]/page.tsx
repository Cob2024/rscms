"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Phone,
  Mail,
  Wallet,
  ArrowUpDown,
  CreditCard,
  Edit,
  ShieldAlert,
  AlertCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { MemberFormDialog } from "@/components/members/member-form-dialog";
import { StatusDialog } from "@/components/members/status-dialog";
import { formatPesewas } from "@/lib/formatting/currency";
import { formatDate, isPastDate } from "@/lib/formatting/date";
import { MemberStatus, ContributionStatus, PayoutStatus } from "@prisma/client";

interface ObligationRecord {
  id: string;
  amount: number;
  paidAmount: number;
  outstandingAmount: number;
  status: ContributionStatus;
  period: {
    periodNumber: number;
    startDate: string;
    dueDate: string;
    closeDate: string;
    cycle: {
      cycleNumber: number;
      status: string;
    };
  };
  allocations: {
    id: string;
    amount: number;
    payment: {
      paymentDate: string;
      channel: string;
      reference: string | null;
      status: string;
    };
  }[];
}

interface PayoutRecord {
  id: string;
  expectedAmount: number;
  authorizedAmount: number;
  actualAmount: number;
  outstandingAmount: number;
  status: PayoutStatus;
  channel: string | null;
  reference: string | null;
  disbursedAt: string | null;
  acknowledgedAt: string | null;
  schedule: {
    scheduledDate: string;
    cycle: { cycleNumber: number };
    period: { periodNumber: number };
  };
}

interface PaymentRecord {
  id: string;
  amount: number;
  channel: string;
  reference: string | null;
  paymentDate: string;
  status: string;
}

interface MemberDetailsResponse {
  member: {
    id: string;
    fullName: string;
    phoneNumber: string;
    email: string | null;
    rotationPosition: number;
    status: MemberStatus;
    joinedAt: string;
    group: {
      id: string;
      name: string;
      contributionAmount: number;
      currency: string;
      memberCount: number;
    };
  };
  financialSummary: {
    totalObligationsPesewas: number;
    totalPaidPesewas: number;
    outstandingBalancePesewas: number;
    totalPayoutsReceivedPesewas: number;
  };
  obligations: ObligationRecord[];
  payouts: PayoutRecord[];
  recentPayments: PaymentRecord[];
}

export default function MemberDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [data, setData] = useState<MemberDetailsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"obligations" | "payouts" | "payments">("obligations");

  // Modals state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);

  const fetchDetails = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/members/${id}`);
      const body = await res.json();
      if (!res.ok) {
        setError(body.error || "Failed to load member profile.");
      } else {
        setData(body);
      }
    } catch {
      setError("Network error while loading member details.");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading member record...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" asChild>
          <Link href="/members">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Members
          </Link>
        </Button>
        <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error || "Member not found."}</span>
        </div>
      </div>
    );
  }

  const { member, financialSummary, obligations, payouts, recentPayments } = data;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/members">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Members
          </Link>
        </Button>
      </div>

      {/* Member Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
                {member.rotationPosition}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold">{member.fullName}</h1>
                  <StatusBadge status={member.status} />
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1 font-mono">
                    <Phone className="h-3.5 w-3.5" />
                    {member.phoneNumber}
                  </span>
                  {member.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5" />
                      {member.email}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Joined {formatDate(member.joinedAt)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditOpen(true)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Profile
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsStatusOpen(true)}
              >
                <ShieldAlert className="mr-2 h-4 w-4" />
                Change Status
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Statement KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Obligations</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPesewas(financialSummary.totalObligationsPesewas)}
            </div>
            <p className="text-xs text-muted-foreground">
              {obligations.length} monthly period(s)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Verified Paid</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {formatPesewas(financialSummary.totalPaidPesewas)}
            </div>
            <p className="text-xs text-muted-foreground">Recorded & verified</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {formatPesewas(financialSummary.outstandingBalancePesewas)}
            </div>
            <p className="text-xs text-muted-foreground">Total balance due</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payouts Received</CardTitle>
            <CreditCard className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {formatPesewas(financialSummary.totalPayoutsReceivedPesewas)}
            </div>
            <p className="text-xs text-muted-foreground">Rotation payouts disbursed</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#E2E8F0]">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab("obligations")}
            className={`border-b-2 pb-3 text-sm font-semibold transition-colors ${
              activeTab === "obligations"
                ? "border-[#087F5B] text-[#087F5B]"
                : "border-transparent text-[#64748B] hover:text-[#102A43]"
            }`}
          >
            Contribution Obligations ({obligations.length})
          </button>
          <button
            onClick={() => setActiveTab("payouts")}
            className={`border-b-2 pb-3 text-sm font-semibold transition-colors ${
              activeTab === "payouts"
                ? "border-[#087F5B] text-[#087F5B]"
                : "border-transparent text-[#64748B] hover:text-[#102A43]"
            }`}
          >
            Payout History ({payouts.length})
          </button>
          <button
            onClick={() => setActiveTab("payments")}
            className={`border-b-2 pb-3 text-sm font-semibold transition-colors ${
              activeTab === "payments"
                ? "border-[#087F5B] text-[#087F5B]"
                : "border-transparent text-[#64748B] hover:text-[#102A43]"
            }`}
          >
            Payment Transactions ({recentPayments.length})
          </button>
        </div>
      </div>

      {/* Tab 1: Obligations */}
      {activeTab === "obligations" && (
        <Card>
          <CardHeader>
            <CardTitle>Contribution Obligations</CardTitle>
            <CardDescription>
              Expected monthly contributions and verified payments.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cycle & Period</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="text-right">Obligation</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="text-right">Balance Due</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {obligations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                      No contribution obligations generated for this member yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  obligations.map((ob) => {
                    const isOverdue =
                      ob.status !== "PAID" && isPastDate(ob.period.dueDate);
                    return (
                      <TableRow key={ob.id}>
                        <TableCell>
                          <div className="font-medium">
                            Period {ob.period.periodNumber}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Cycle {ob.period.cycle.cycleNumber}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>{formatDate(ob.period.dueDate)}</div>
                          {isOverdue && (
                            <span className="text-[10px] font-semibold text-destructive">
                              Passed Deadline
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono font-medium text-[#102A43]">
                          {formatPesewas(ob.amount)}
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold text-[#087F5B]">
                          {formatPesewas(ob.paidAmount)}
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold text-[#B45309]">
                          {formatPesewas(Math.max(0, ob.amount - ob.paidAmount))}
                        </TableCell>
                        <TableCell className="text-center">
                          <StatusBadge
                            status={
                              isOverdue && ob.status === "PENDING"
                                ? "OVERDUE"
                                : isOverdue && ob.status === "PARTIAL"
                                ? "OVERDUE_PARTIAL"
                                : ob.status
                            }
                            size="sm"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Tab 2: Payouts */}
      {activeTab === "payouts" && (
        <Card>
          <CardHeader>
            <CardTitle>Payout History</CardTitle>
            <CardDescription>
              Scheduled, authorized, and disbursed rotation payouts.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cycle & Period</TableHead>
                  <TableHead>Scheduled Date</TableHead>
                  <TableHead className="text-right">Expected</TableHead>
                  <TableHead className="text-right">Actual Disbursed</TableHead>
                  <TableHead>Channel & Reference</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payouts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                      No payouts scheduled or recorded for this member yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  payouts.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div className="font-medium">
                          Period {p.schedule.period.periodNumber}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Cycle {p.schedule.cycle.cycleNumber}
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(p.schedule.scheduledDate)}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatPesewas(p.expectedAmount)}
                      </TableCell>
                      <TableCell className="text-right font-medium text-primary">
                        {formatPesewas(p.actualAmount)}
                      </TableCell>
                      <TableCell>
                        <div className="text-xs font-medium">
                          {p.channel ? p.channel.replace("_", " ") : "Not set"}
                        </div>
                        <div className="text-[11px] font-mono text-muted-foreground">
                          {p.reference || "No reference"}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <StatusBadge status={p.status} size="sm" />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Tab 3: Recent Payments */}
      {activeTab === "payments" && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Payment Records</CardTitle>
            <CardDescription>
              Payments received and verified from this member.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentPayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                      No payments recorded for this member yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  recentPayments.map((pm) => (
                    <TableRow key={pm.id}>
                      <TableCell>{formatDate(pm.paymentDate)}</TableCell>
                      <TableCell className="font-medium text-[#102A43]">
                        {pm.channel.replace("_", " ")}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-[#64748B]">
                        {pm.reference || "None"}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-[#087F5B]">
                        {formatPesewas(pm.amount)}
                      </TableCell>
                      <TableCell className="text-center">
                        <StatusBadge status={pm.status} size="sm" />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Edit Member Dialog */}
      {isEditOpen && (
        <MemberFormDialog
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          onSuccess={fetchDetails}
          occupiedPositions={[]}
          maxCapacity={member.group.memberCount}
          initialData={{
            id: member.id,
            fullName: member.fullName,
            phoneNumber: member.phoneNumber,
            email: member.email,
            rotationPosition: member.rotationPosition,
          }}
        />
      )}

      {/* Status Dialog */}
      {isStatusOpen && (
        <StatusDialog
          isOpen={isStatusOpen}
          onClose={() => setIsStatusOpen(false)}
          onSuccess={fetchDetails}
          member={{
            id: member.id,
            fullName: member.fullName,
            currentStatus: member.status,
          }}
        />
      )}
    </div>
  );
}

