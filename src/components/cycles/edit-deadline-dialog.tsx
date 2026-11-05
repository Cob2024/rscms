"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, AlertCircle, X } from "lucide-react";
import { formatDate } from "@/lib/formatting/date";

interface EditDeadlineDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  period: {
    id: string;
    periodNumber: number;
    currentDueDate: string;
  } | null;
}

export function EditDeadlineDialog({
  isOpen,
  onClose,
  onSuccess,
  period,
}: EditDeadlineDialogProps) {
  const [newDueDate, setNewDueDate] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !period) return null;

  async function handleUpdateDeadline(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/contributions/${period?.id}/deadline`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dueDate: new Date(`${newDueDate}T23:59:59Z`).toISOString(),
          reason: reason.trim() || undefined,
        }),
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(body.error || "Failed to update deadline.");
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-xl border bg-card p-6 shadow-xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-4">
          <h2 className="text-xl font-semibold">
            Adjust Contribution Deadline
          </h2>
          <p className="text-sm text-muted-foreground">
            Update deadline for <span className="font-semibold">Period {period.periodNumber}</span>.
          </p>
        </div>

        <div className="mb-4 rounded-md bg-muted/40 p-3 text-xs text-muted-foreground">
          Current deadline:{" "}
          <span className="font-semibold text-foreground">
            {formatDate(period.currentDueDate)}
          </span>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleUpdateDeadline} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newDate">New Due Date</Label>
            <Input
              id="newDate"
              type="date"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="adminReason">Administrative Reason</Label>
            <Input
              id="adminReason"
              placeholder="e.g. Group agreed deadline extension, public holiday"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              disabled={isSubmitting}
            />
            <p className="text-[11px] text-muted-foreground">
              Required for the permanent audit trail.
            </p>
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
                  Updating...
                </>
              ) : (
                "Save New Deadline"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

