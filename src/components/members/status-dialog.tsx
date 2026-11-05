"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { MemberStatus } from "@prisma/client";
import { authFetch } from "@/lib/auth/auth-fetch";
import { Loader2, AlertCircle, X } from "lucide-react";

interface StatusDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  member: {
    id: string;
    fullName: string;
    currentStatus: MemberStatus;
  } | null;
}

export function StatusDialog({
  isOpen,
  onClose,
  onSuccess,
  member,
}: StatusDialogProps) {
  const [selectedStatus, setSelectedStatus] = useState<MemberStatus>(
    member?.currentStatus || MemberStatus.ACTIVE
  );
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !member) return null;

  async function handleStatusChange(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await authFetch(`/api/members/${member?.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: selectedStatus,
          reason: reason.trim() || undefined,
        }),
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(body.error || "Failed to update member status.");
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
          <h2 className="text-xl font-semibold">Change Member Status</h2>
          <p className="text-sm text-muted-foreground">
            Update active status for <span className="font-semibold">{member.fullName}</span>.
          </p>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleStatusChange} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="statusSelect">New Status</Label>
            <select
              id="statusSelect"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as MemberStatus)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value={MemberStatus.ACTIVE}>Active</option>
              <option value={MemberStatus.INACTIVE}>Inactive</option>
              <option value={MemberStatus.SUSPENDED}>Suspended</option>
              <option value={MemberStatus.LEFT}>Left</option>
            </select>
            <p className="text-xs text-muted-foreground">
              Historical contribution obligations and payments remain intact regardless of status.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="statusReason">Reason / Administrative Note</Label>
            <Input
              id="statusReason"
              placeholder="e.g. Temporary leave, travel, administrative hold"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isSubmitting}
            />
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
                "Save Status"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

