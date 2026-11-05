"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, CalendarDays, CircleAlert, CircleCheck, Clock3, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabaseBrowser } from "@/lib/auth/supabase-browser";
import { formatDate } from "@/lib/formatting/date";
import { formatPesewas } from "@/lib/formatting/currency";

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
    const { data: { session } } = await supabaseBrowser.auth.getSession().catch(() => ({ data: { session: null } }));
    const headers: Record<string, string> = {};
    if (session?.access_token) {
      headers["Authorization"] = `Bearer ${session.access_token}`;
    }
    const response = await fetch("/api/dashboard", { headers });
    const body = await response.json();
    if (response.ok) setData(body); else setError(body.error ?? "Could not load dashboard.");
  }, []);
  useEffect(() => { void load(); }, [load]);

  if (error) return <div role="alert" className="rounded-md border border-destructive/40 p-4 text-sm text-destructive">{error}</div>;
  if (!data) return <div className="space-y-5"><div className="h-8 w-48 animate-pulse rounded bg-muted"/><div className="grid gap-3 md:grid-cols-4">{[1,2,3,4].map((n)=><div key={n} className="h-28 animate-pulse rounded-lg bg-muted"/>)}</div></div>;
  if (!data.configured) return <div className="mx-auto max-w-3xl py-12"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Welcome to RSCMS</p><h1 className="mt-3 text-3xl font-semibold">Start with your savings group</h1><p className="mt-2 max-w-xl text-muted-foreground">Set the group name, monthly contribution and dates first. Financial totals will appear here once cycles and verified records exist.</p><Button asChild className="mt-6"><Link href="/settings">Configure group</Link></Button></div>;

  const period = data.period;
  const tiles = [
    { title: "Expected this period", value: formatPesewas(period?.expected ?? 0), caption: period ? `Period ${period.periodNumber} · due ${formatDate(new Date(period.dueDate))}` : "No active contribution period", icon: CalendarDays },
    { title: "Verified contributions", value: formatPesewas(period?.verified ?? 0), caption: "Verified payments only", icon: CircleCheck },
    { title: "Outstanding", value: formatPesewas(period?.outstanding ?? 0), caption: "Based on verified allocations", icon: CircleAlert },
    { title: "Available balance", value: formatPesewas(data.available ?? 0), caption: "From posted asset ledger entries", icon: Wallet },
  ];
  return <div className="mx-auto max-w-6xl space-y-8">
    <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{data.group?.name}</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Group overview</h1><p className="mt-1 text-sm text-muted-foreground">Cycle {data.group?.cycleNumber ?? "—"} · {data.group?.activeMembers ?? 0} active members</p></div><Button asChild variant="outline"><Link href="/payments"><ArrowDownLeft className="mr-2 h-4 w-4"/>Record payment</Link></Button></header>
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{tiles.map(({title,value,caption,icon:Icon})=><Card key={title} className="rounded-md shadow-none"><CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3"><CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle><Icon className="h-4 w-4 text-muted-foreground"/></CardHeader><CardContent><p className="text-2xl font-semibold tabular-nums">{value}</p><p className="mt-1 text-xs text-muted-foreground">{caption}</p></CardContent></Card>)}</section>
    <section className="grid gap-5 lg:grid-cols-[1.45fr_1fr]">
      <Card className="rounded-md shadow-none"><CardHeader className="border-b"><CardTitle className="text-base">Contribution status</CardTitle><p className="text-sm text-muted-foreground">{period ? `Period ${period.periodNumber} · deadline ${formatDate(new Date(period.dueDate))}` : "There is no active contribution period."}</p></CardHeader><CardContent className="p-0">{period?.obligations.length ? <div className="divide-y">{period.obligations.map((obligation)=><div key={obligation.id} className="flex items-center justify-between gap-4 px-5 py-3"><div className="flex min-w-0 items-center gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">{obligation.position}</span><div className="min-w-0"><p className="truncate text-sm font-medium">{obligation.name}</p><p className="text-xs text-muted-foreground">Expected {formatPesewas(obligation.expected)}</p></div></div><span className="rounded-sm border px-2 py-1 text-xs text-muted-foreground">{obligation.status.replaceAll("_", " ")}</span></div>)}</div>:<p className="px-5 py-8 text-sm text-muted-foreground">No obligations have been generated for this period.</p>}</CardContent></Card>
      <Card className="rounded-md shadow-none"><CardHeader className="border-b"><CardTitle className="text-base">Payout rotation</CardTitle><p className="text-sm text-muted-foreground">Fixed order · requires administrator authorization</p></CardHeader><CardContent className="pt-5">{data.nextRecipient ? <><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold">{data.nextRecipient.position}</div><div><p className="text-sm font-medium">{data.nextRecipient.name}</p><p className="text-xs text-muted-foreground">Position {data.nextRecipient.position} · {formatDate(new Date(data.nextRecipient.scheduledDate))}</p></div></div><div className="mt-5 flex items-end justify-between border-t pt-4"><span className="text-sm text-muted-foreground">Scheduled amount</span><span className="text-lg font-semibold tabular-nums">{formatPesewas(data.nextRecipient.amount)}</span></div></>:<div className="py-4 text-sm text-muted-foreground">No payout schedule is available.</div>}<div className="mt-5 flex items-center justify-between border-t pt-4 text-sm"><span className="text-muted-foreground">Total disbursed</span><span className="font-medium tabular-nums">{formatPesewas(data.disbursed ?? 0)}</span></div></CardContent></Card>
    </section>
    <Card className="rounded-md shadow-none"><CardHeader className="border-b"><div className="flex items-center justify-between"><div><CardTitle className="text-base">Recent ledger activity</CardTitle><p className="mt-1 text-sm text-muted-foreground">Posted financial transactions</p></div><Button asChild variant="ghost" size="sm"><Link href="/transactions">View ledger <ArrowUpRight className="ml-1 h-4 w-4"/></Link></Button></div></CardHeader><CardContent className="p-0">{data.transactions?.length ? <div className="divide-y">{data.transactions.map((transaction)=><div key={transaction.id} className="flex items-center justify-between gap-4 px-5 py-3"><div className="min-w-0"><p className="truncate text-sm font-medium">{transaction.description}</p><p className="text-xs text-muted-foreground">{transaction.reference} · {transaction.type.replaceAll("_", " ")}</p></div><span className="shrink-0 text-xs text-muted-foreground">{formatDate(new Date(transaction.date))}</span></div>)}</div>:<div className="flex items-center gap-3 px-5 py-7 text-sm text-muted-foreground"><Clock3 className="h-4 w-4"/>No posted ledger activity yet.</div>}</CardContent></Card>
  </div>;
}
