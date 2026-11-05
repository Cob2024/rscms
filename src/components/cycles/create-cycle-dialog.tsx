"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, AlertCircle, X, Calendar, ArrowRight } from "lucide-react";
import { addMonths, format, startOfMonth } from "date-fns";
import { authFetch } from "@/lib/auth/auth-fetch";

interface CreateCycleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  members: { id: string; fullName: string; rotationPosition: number }[];
}

export function CreateCycleDialog({
  isOpen,
  onClose,
  onSuccess,
  members,
}: CreateCycleDialogProps) {
  const nextMonthStart = startOfMonth(addMonths(new Date(), 1));
  const defaultStartDate = format(nextMonthStart, "yyyy-MM-dd");

  const [startDateStr, setStartDateStr] = useState(defaultStartDate);
  const [dueDates, setDueDates] = useState<string[]>([
    format(new Date(nextMonthStart.getFullYear(), nextMonthStart.getMonth(), 15), "yyyy-MM-dd"),
    format(new Date(nextMonthStart.getFullYear(), nextMonthStart.getMonth() + 1, 15), "yyyy-MM-dd"),
    format(new Date(nextMonthStart.getFullYear(), nextMonthStart.getMonth() + 2, 15), "yyyy-MM-dd"),
    format(new Date(nextMonthStart.getFullYear(), nextMonthStart.getMonth() + 3, 15), "yyyy-MM-dd"),
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  function handleStartDateChange(newDate: string) {
    setStartDateStr(newDate);
    const d = new Date(newDate);
    if (!isNaN(d.getTime())) {
      setDueDates([
        format(new Date(d.getFullYear(), d.getMonth(), 15), "yyyy-MM-dd"),
        format(new Date(d.getFullYear(), d.getMonth() + 1, 15), "yyyy-MM-dd"),
        format(new Date(d.getFullYear(), d.getMonth() + 2, 15), "yyyy-MM-dd"),
        format(new Date(d.getFullYear(), d.getMonth() + 3, 15), "yyyy-MM-dd"),
      ]);
    }
  }

  function handleDueDateChange(index: number, value: string) {
    const updated = [...dueDates];
    updated[index] = value;
    setDueDates(updated);
  }

  async function handleCreateCycle(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        startDate: new Date(startDateStr).toISOString(),
        dueDates: dueDates.map((d) => new Date(`${d}T23:59:59Z`).toISOString()),
      };

      const res = await authFetch("/api/cycles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(body.error || "Failed to create savings cycle.");
        return;
      }

      onSuccess();
      onClose();
    } catch {
      setError("A network error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Sorted members by rotation seat
  const sortedMembers = [...members].sort((a, b) => a.rotationPosition - b.rotationPosition);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border bg-card p-6 shadow-xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-6">
          <h2 className="text-xl font-semibold">Establish 4-Month Savings Cycle</h2>
          <p className="text-sm text-muted-foreground">
            Configure custom contribution deadlines and verify the fixed payout rotation.
          </p>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleCreateCycle} className="space-y-6">
          {/* Cycle Parameters */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cycleStart">Cycle Start Date</Label>
              <Input
                id="cycleStart"
                type="date"
                value={startDateStr}
                onChange={(e) => handleStartDateChange(e.target.value)}
                required
              />
              <p className="text-[11px] text-muted-foreground">
                Beginning of Period 1.
              </p>
            </div>
            <div className="space-y-1 rounded-lg border bg-muted/30 p-3 text-xs">
              <span className="font-semibold text-foreground">Standard Group Parameters:</span>
              <ul className="mt-1 list-disc space-y-0.5 pl-4 text-muted-foreground">
                <li>4 Members × GH₵250 monthly = GH₵1,000 / month</li>
                <li>Duration: 4 Months (GH₵4,000 cycle total)</li>
                <li>Currency: Ghana Cedis (GHS)</li>
              </ul>
            </div>
          </div>

          {/* 4 Periods & Fixed Rotation Schedule Preview */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">
              Period Deadlines & Payout Rotation
            </Label>
            <p className="text-xs text-muted-foreground">
              Define the exact administrator-configured deadline for each monthly period.
            </p>

            <div className="space-y-3">
              {[0, 1, 2, 3].map((index) => {
                const assignedMember = sortedMembers[index];
                return (
                  <Card key={index} className="border-muted bg-card">
                    <CardContent className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {index + 1}
                        </span>
                        <div>
                          <div className="text-sm font-medium">Month {index + 1}</div>
                          <div className="text-xs text-muted-foreground">
                            Recipient:{" "}
                            <span className="font-semibold text-foreground">
                              {assignedMember ? assignedMember.fullName : `Position ${index + 1}`}
                            </span>{" "}
                            (GH₵1,000.00)
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Label htmlFor={`due-${index}`} className="text-xs text-muted-foreground">
                          Deadline:
                        </Label>
                        <Input
                          id={`due-${index}`}
                          type="date"
                          value={dueDates[index]}
                          onChange={(e) => handleDueDateChange(index, e.target.value)}
                          className="h-8 w-36 text-xs"
                          required
                        />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Cycle...
                </>
              ) : (
                "Create & Activate Cycle"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

