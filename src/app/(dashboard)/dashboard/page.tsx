"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, CalendarDays, CircleAlert, CircleCheck, Clock3, Wallet } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { authFetch } from "@/lib/auth/auth-fetch";
import { formatDate } from "@/lib/formatting/date";
import { formatPesewas } from "@/lib/formatting/currency";
import { cn } from "@/lib/utils";

type DashboardData = {
  configured: boolean;
  group?: { name: string; activeMembers: number; cycleNumber: number | null };
  period?: { periodNumber: number; dueDate: string; expected: number; verified: number; outstanding: number; obligations: { id: string; name: string; position: number; expected: number; status: string }[] } | null;
  disbursed?: number; available?: number;
  nextRecipient?: { name: string; position: number; scheduledDate: string; amount: number } | null;
  transactions?: { id: string; reference: string; type: string; description: string; date: string }[];
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    try {
      const response = await authFetch("/api/dashboard");
      const body = await response.json();
      if (response.ok) setData(body);
      else setError(body.error ?? "Could not load dashboard.");
    } catch {
      setError("Network error while loading dashboard.");
    }
  }, []);
  useEffect(() => { void load(); }, [load]);

  if (error) return <div role="alert" className="rounded-md border border-[#FECACA] bg-[#FEECEB] p-4 text-sm font-semibold text-[#991B1B]">{error}</div>;
  if (!data) return <div className="space-y-5"><div className="h-8 w-48 animate-pulse rounded bg-slate-200"/><div className="grid gap-3 md:grid-cols-4">{[1,2,3,4].map((n)=><div key={n} className="h-28 animate-pulse rounded-lg bg-slate-200"/>)}</div></div>;
  if (!data.configured) return <div className="mx-auto max-w-3xl py-12"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#087F5B]">Welcome to RSCMS</p><h1 className="mt-3 text-3xl font-bold text-[#102A43]">Start with your savings group</h1><p className="mt-2 max-w-xl text-[#475569]">Set the group name, monthly contribution and dates first. Financial totals will appear here once cycles and verified records exist.</p><Button asChild className="mt-6"><Link href="/settings">Configure group</Link></Button></div>;

  const period = data.period;
  const tiles = [
    { title: "Expected this period", value: formatPesewas(period?.expected ?? 0), caption: period ? `Period ${period.periodNumber} · due ${formatDate(new Date(period.dueDate))}` : "No active contribution period", icon: CalendarDays, valueColor: "text-[#102A43]" },
    { title: "Verified contributions", value: formatPesewas(period?.verified ?? 0), caption: "Verified payments only", icon: CircleCheck, valueColor: "text-[#087F5B]" },
    { title: "Outstanding", value: formatPesewas(period?.outstanding ?? 0), caption: "Based on verified allocations", icon: CircleAlert, valueColor: (period?.outstanding ?? 0) > 0 ? "text-[#B45309]" : "text-[#102A43]" },
    { title: "Available balance", value: formatPesewas(data.available ?? 0), caption: "From posted asset ledger entries", icon: Wallet, valueColor: "text-[#087F5B]" },
  ];
  return <div className="mx-auto max-w-6xl space-y-8">
    <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#087F5B]">{data.group?.name}</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-[#102A43]">Group Overview</h1>
        <p className="mt-1 text-sm text-[#475569]">Cycle {data.group?.cycleNumber ?? "—"} · {data.group?.activeMembers ?? 0} active members</p>
      </div>
      <Button asChild variant="outline" className="border-[#CBD5E1] bg-white text-[#102A43] hover:bg-slate-50 shadow-xs">
        <Link href="/payments"><ArrowDownLeft className="mr-2 h-4 w-4 text-[#087F5B]"/>Record payment</Link>
      </Button>
    </header>

    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {tiles.map(({title,value,caption,icon:Icon,valueColor})=>(
        <Card key={title} className="rounded-lg border border-[#E2E8F0] bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">{title}</span>
            <Icon className="h-4 w-4 text-[#64748B]"/>
          </div>
          <p className={cn("text-2xl font-bold tabular-nums font-mono", valueColor)}>{value}</p>
          <p className="mt-1.5 text-xs text-[#64748B]">{caption}</p>
        </Card>
      ))}
    </section>

    <section className="grid gap-5 lg:grid-cols-[1.45fr_1fr]">
      <Card className="rounded-lg border border-[#E2E8F0] bg-white shadow-xs">
        <CardHeader className="border-b border-[#E2E8F0] pb-4">
          <CardTitle className="text-base font-bold text-[#102A43]">Contribution Status</CardTitle>
          <p className="text-xs text-[#64748B]">{period ? `Period ${period.periodNumber} · deadline ${formatDate(new Date(period.dueDate))}` : "There is no active contribution period."}</p>
        </CardHeader>
        <CardContent className="p-0">
          {period?.obligations.length ? (
            <div className="divide-y divide-[#E2E8F0]">
              {period.obligations.map((obligation)=>(
                <div key={obligation.id} className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-[#F8FAFC] transition-colors">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#E6F4EF] text-xs font-bold text-[#066849] border border-[#A3E0CE]">{obligation.position}</span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#102A43]">{obligation.name}</p>
                      <p className="text-xs text-[#64748B]">Expected {formatPesewas(obligation.expected)}</p>
                    </div>
                  </div>
                  <StatusBadge status={obligation.status} size="sm" />
                </div>
              ))}
            </div>
          ) : (
            <p className="px-5 py-8 text-sm text-[#64748B]">No obligations have been generated for this period.</p>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-lg border border-[#E2E8F0] bg-white shadow-xs">
        <CardHeader className="border-b border-[#E2E8F0] pb-4">
          <CardTitle className="text-base font-bold text-[#102A43]">Payout Rotation</CardTitle>
          <p className="text-xs text-[#64748B]">Fixed order · requires administrator authorization</p>
        </CardHeader>
        <CardContent className="p-5">
          {data.nextRecipient ? (
            <>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE] text-sm font-bold">
                  {data.nextRecipient.position}
                </div>
                <div>
                  <p className="text-sm font-bold text-[#102A43]">{data.nextRecipient.name}</p>
                  <p className="text-xs text-[#64748B]">Position {data.nextRecipient.position} · {formatDate(new Date(data.nextRecipient.scheduledDate))}</p>
                </div>
              </div>
              <div className="mt-5 flex items-end justify-between border-t border-[#E2E8F0] pt-4">
                <span className="text-xs font-medium text-[#64748B]">Scheduled amount</span>
                <span className="text-lg font-bold text-[#102A43] tabular-nums font-mono">{formatPesewas(data.nextRecipient.amount)}</span>
              </div>
            </>
          ) : (
            <div className="py-4 text-sm text-[#64748B]">No payout schedule is available.</div>
          )}
          <div className="mt-4 flex items-center justify-between border-t border-[#E2E8F0] pt-4 text-xs">
            <span className="text-[#64748B]">Total disbursed to date</span>
            <span className="font-bold text-[#087F5B] tabular-nums font-mono text-sm">{formatPesewas(data.disbursed ?? 0)}</span>
          </div>
        </CardContent>
      </Card>
    </section>

    <Card className="rounded-lg border border-[#E2E8F0] bg-white shadow-xs">
      <CardHeader className="border-b border-[#E2E8F0] pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold text-[#102A43]">Recent Ledger Activity</CardTitle>
            <p className="mt-0.5 text-xs text-[#64748B]">Posted financial transactions</p>
          </div>
          <Button asChild variant="ghost" size="sm" className="text-[#102A43] hover:text-[#087F5B]">
            <Link href="/transactions">View ledger <ArrowUpRight className="ml-1 h-4 w-4"/></Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {data.transactions?.length ? (
          <div className="divide-y divide-[#E2E8F0]">
            {data.transactions.map((transaction)=>(
              <div key={transaction.id} className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-[#F8FAFC] transition-colors">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#102A43]">{transaction.description}</p>
                  <p className="text-xs text-[#64748B] font-mono">{transaction.reference} · {transaction.type.replaceAll("_", " ")}</p>
                </div>
                <span className="shrink-0 text-xs text-[#64748B]">{formatDate(new Date(transaction.date))}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-3 px-5 py-7 text-sm text-[#64748B]">
            <Clock3 className="h-4 w-4"/>No posted ledger activity yet.
          </div>
        )}
      </CardContent>
    </Card>
  </div>;
}
