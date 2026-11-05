"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  CircleCheck,
  Settings2,
  Users,
  ShieldAlert,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabaseBrowser } from "@/lib/auth/supabase-browser";
import { formatPesewas } from "@/lib/formatting/currency";

type GroupData = {
  id: string;
  name: string;
  contributionAmount: number;
  memberCount: number;
  monthlyTarget: number;
  members: {
    id: string;
    fullName: string;
    rotationPosition: number;
  }[];
  cycles: {
    id: string;
    cycleNumber: number;
    status: string;
    periods: { id: string; periodNumber: number; dueDate: string }[];
  }[];
};

function parsePesewas(value: string) {
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(value.trim());
  return match
    ? Number(match[1]) * 100 + Number((match[2] ?? "").padEnd(2, "0"))
    : null;
}

function isoDate(value: FormDataEntryValue | null, time = "23:59:59.999") {
  return new Date(`${String(value)}T${time}Z`).toISOString();
}

export default function SettingsPage() {
  const [group, setGroup] = useState<GroupData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Edit Capacity state
  const [nameInput, setNameInput] = useState("");
  const [capacityInput, setCapacityInput] = useState<number>(4);
  const [amountInput, setAmountInput] = useState<string>("250.00");

  const authHeaders = useCallback(async () => {
    const {
      data: { session },
    } = await supabaseBrowser.auth
      .getSession()
      .catch(() => ({ data: { session: null } }));
    const headers: Record<string, string> = {};
    if (session?.access_token) {
      headers["Authorization"] = `Bearer ${session.access_token}`;
    }
    return headers;
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/group", {
        headers: await authHeaders(),
      });
      const body = await response.json();
      if (response.ok && body.group) {
        setGroup(body.group);
        setNameInput(body.group.name);
        setCapacityInput(body.group.memberCount || 4);
        setAmountInput((body.group.contributionAmount / 100).toFixed(2));
      } else {
        setError(body.error ?? "Could not load group settings.");
      }
    } catch {
      setError("Network error while loading group settings.");
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  useEffect(() => {
    void load();
  }, [load]);

  async function createGroup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    const form = new FormData(event.currentTarget);
    const contributionAmount = parsePesewas(String(form.get("amount")));
    if (!contributionAmount) {
      setError("Enter a valid contribution amount in GHS.");
      setSaving(false);
      return;
    }
    try {
      const response = await fetch("/api/group", {
        method: "POST",
        headers: {
          ...(await authHeaders()),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.get("name"),
          contributionAmount,
        }),
      });
      const body = await response.json();
      if (!response.ok) {
        setError(body.error ?? "Could not create group.");
      } else {
        setNotice("Group and ledger accounts are ready.");
        await load();
      }
    } catch {
      setError("Failed to create group. Please check your connection.");
    } finally {
      setSaving(false);
    }
  }

  async function updateGroupSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    const contributionPesewas = parsePesewas(amountInput);
    if (!contributionPesewas || contributionPesewas <= 0) {
      setError("Enter a valid positive contribution amount.");
      setSaving(false);
      return;
    }

    if (capacityInput < (group?.members.length ?? 0)) {
      setError(
        `Cannot reduce group capacity to ${capacityInput} because there are already ${group?.members.length} active members registered.`
      );
      setSaving(false);
      return;
    }

    try {
      const response = await fetch("/api/group", {
        method: "PATCH",
        headers: {
          ...(await authHeaders()),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: nameInput.trim(),
          memberCount: capacityInput,
          contributionAmount: contributionPesewas,
        }),
      });

      const body = await response.json();
      if (!response.ok) {
        setError(body.error ?? "Could not update group capacity.");
      } else {
        setNotice(
          `Group capacity successfully updated to ${body.group.memberCount} members. You can now register up to ${body.group.memberCount} members in the Members tab.`
        );
        await load();
      }
    } catch {
      setError("Failed to update group settings. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function createCycle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    const form = new FormData(event.currentTarget);
    const startDate = String(form.get("startDate"));
    const requiredPeriods = group?.memberCount ?? 4;

    const dueDates = Array.from({ length: requiredPeriods }, (_, i) =>
      String(form.get(`due${i + 1}`))
    );

    if (!startDate || dueDates.some((date) => !date)) {
      setError(`Set the cycle start date and all ${requiredPeriods} contribution deadlines.`);
      setSaving(false);
      return;
    }

    try {
      const response = await fetch("/api/cycles", {
        method: "POST",
        headers: {
          ...(await authHeaders()),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startDate: isoDate(startDate, "00:00:00.000"),
          dueDates: dueDates.map((date) => isoDate(date)),
        }),
      });

      const body = await response.json();
      if (!response.ok) {
        setError(body.error ?? "Could not create cycle.");
      } else {
        setNotice(
          `Cycle ${body.cycle.cycleNumber} is active. ${body.cycle.periods?.length ?? requiredPeriods} periods, obligations and payout positions were generated.`
        );
        await load();
      }
    } catch {
      setError("Network error while creating cycle.");
    } finally {
      setSaving(false);
    }
  }

  const parsedCurrentAmount = parsePesewas(amountInput) ?? (group?.contributionAmount ?? 25000);
  const projectedMonthlyTotal = parsedCurrentAmount * capacityInput;
  const activeMembersCount = group?.members?.length ?? 0;
  const hasActiveCycle = group?.cycles?.some((c) => c.status === "ACTIVE");

  return (
    <div className="mx-auto max-w-5xl space-y-7">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          Configuration
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Group settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure membership capacity, monthly contributions, and cycle schedules.
        </p>
      </header>

      {error && (
        <div
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      {notice && (
        <div
          role="status"
          className="rounded-md border border-emerald-700/30 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          {notice}
        </div>
      )}

      {loading ? (
        <div className="h-28 animate-pulse rounded-md bg-muted" />
      ) : !group ? (
        <Card className="rounded-md shadow-none">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Settings2 className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle className="text-base">Create the savings group</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Default settings follow the rotating savings plan.
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={createGroup} className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1.5 text-sm">
                Group name
                <Input
                  name="name"
                  required
                  minLength={2}
                  maxLength={120}
                  placeholder="e.g. Adom Savings Circle"
                />
              </label>
              <label className="space-y-1.5 text-sm">
                Monthly contribution (GHS)
                <Input
                  name="amount"
                  defaultValue="250.00"
                  required
                  inputMode="decimal"
                />
              </label>
              <div className="sm:col-span-2">
                <Button disabled={saving}>
                  {saving ? "Saving…" : "Create group"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Group Capacity & Financial Limits Section */}
          <Card className="rounded-md shadow-none">
            <CardHeader className="border-b">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle className="text-base">Group Capacity & Membership Limit</CardTitle>
                  <CardDescription>
                    Adjust how many members can join the savings group and configure their monthly contribution amounts.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={updateGroupSettings} className="space-y-6">
                <div className="grid gap-5 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="groupName">Group Name</Label>
                    <Input
                      id="groupName"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      required
                      minLength={2}
                      maxLength={120}
                      disabled={saving}
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Display name for the savings circle.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="capacityInput">Group Capacity (Members)</Label>
                    <Input
                      id="capacityInput"
                      type="number"
                      min={Math.max(2, activeMembersCount)}
                      max={100}
                      value={capacityInput}
                      onChange={(e) => setCapacityInput(Math.max(2, parseInt(e.target.value) || 2))}
                      required
                      disabled={saving}
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Minimum {Math.max(2, activeMembersCount)} (currently {activeMembersCount} registered).
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="amountInput">Monthly Contribution (GHS)</Label>
                    <Input
                      id="amountInput"
                      value={amountInput}
                      onChange={(e) => setAmountInput(e.target.value)}
                      required
                      inputMode="decimal"
                      disabled={saving}
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Amount each member contributes per period.
                    </p>
                  </div>
                </div>

                {/* Calculation Summary Preview */}
                <div className="grid gap-4 rounded-lg border bg-muted/40 p-4 sm:grid-cols-3">
                  <div>
                    <span className="text-xs text-muted-foreground">Active Members</span>
                    <p className="text-lg font-semibold">
                      {activeMembersCount} / {capacityInput}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {capacityInput - activeMembersCount > 0
                        ? `${capacityInput - activeMembersCount} open seat(s) available`
                        : "Group is at maximum capacity"}
                    </p>
                  </div>

                  <div>
                    <span className="text-xs text-muted-foreground">Monthly Collection Target</span>
                    <p className="text-lg font-semibold text-primary">
                      {formatPesewas(projectedMonthlyTotal)}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {formatPesewas(parsedCurrentAmount)} × {capacityInput} members
                    </p>
                  </div>

                  <div>
                    <span className="text-xs text-muted-foreground">Cycle Rotation Length</span>
                    <p className="text-lg font-semibold">
                      {capacityInput} Months
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Each member receives 1 full payout turn of {formatPesewas(projectedMonthlyTotal)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                  <div className="text-xs text-muted-foreground">
                    Increasing capacity immediately allows registering more members in{" "}
                    <Link href="/members" className="font-medium text-primary underline">
                      Members
                    </Link>.
                  </div>
                  <Button type="submit" disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving changes…
                      </>
                    ) : (
                      "Save Group Settings"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Create Cycle Section (only if no active cycle) */}
          {!hasActiveCycle && (
            <Card className="rounded-md shadow-none">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <CalendarDays className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <CardTitle className="text-base">
                      Create a {group.memberCount}-month cycle
                    </CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                      You need {group.memberCount} active members in rotation positions 1 through {group.memberCount}.
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {activeMembersCount < group.memberCount && (
                  <div className="mb-5 flex items-center gap-2 rounded-md border border-amber-600/30 bg-amber-50 p-3 text-xs text-amber-800">
                    <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600" />
                    <span>
                      Notice: Group currently has {activeMembersCount} registered member(s), but capacity is set to {group.memberCount}. Either register the remaining members in{" "}
                      <Link href="/members" className="font-medium underline">
                        Members
                      </Link>{" "}
                      or adjust group capacity to {activeMembersCount} above to start a cycle.
                    </span>
                  </div>
                )}
                <form onSubmit={createCycle} className="space-y-5">
                  <label className="block max-w-sm space-y-1.5 text-sm">
                    Cycle start date
                    <Input name="startDate" type="date" required />
                  </label>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {Array.from({ length: group.memberCount }, (_, i) => i + 1).map(
                      (period) => (
                        <label key={period} className="space-y-1.5 text-sm">
                          Period {period} contribution deadline
                          <Input name={`due${period}`} type="date" required />
                        </label>
                      )
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Deadlines are saved per period. A later cycle can use different dates; closed period dates stay unchanged.
                  </p>
                  <Button disabled={saving || activeMembersCount !== group.memberCount}>
                    {saving ? "Creating cycle…" : "Generate cycle and obligations"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Cycle History */}
          {!!group.cycles?.length && (
            <Card className="rounded-md shadow-none">
              <CardHeader className="border-b">
                <CardTitle className="text-base">Cycle history</CardTitle>
              </CardHeader>
              <CardContent className="divide-y p-0">
                {group.cycles.map((cycle) => (
                  <div
                    key={cycle.id}
                    className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
                  >
                    <div>
                      <p className="font-medium">Cycle {cycle.cycleNumber}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {cycle.periods.length} contribution periods
                      </p>
                    </div>
                    <span className="flex items-center gap-1.5 rounded-sm border px-2 py-1 text-xs">
                      <CircleCheck className="h-3.5 w-3.5" />
                      {cycle.status}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
