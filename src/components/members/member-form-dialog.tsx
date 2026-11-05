"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createMemberSchema, type CreateMemberInput } from "@/lib/validation/member";
import { Loader2, AlertCircle, X } from "lucide-react";

interface MemberFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  occupiedPositions: number[];
  initialData?: {
    id: string;
    fullName: string;
    phoneNumber: string;
    email: string | null;
    rotationPosition: number;
  };
}

export function MemberFormDialog({
  isOpen,
  onClose,
  onSuccess,
  occupiedPositions,
  initialData,
}: MemberFormDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = Boolean(initialData);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateMemberInput>({
    resolver: zodResolver(createMemberSchema),
    defaultValues: initialData
      ? {
          fullName: initialData.fullName,
          phoneNumber: initialData.phoneNumber,
          email: initialData.email || "",
          rotationPosition: initialData.rotationPosition,
        }
      : {
          fullName: "",
          phoneNumber: "",
          email: "",
          rotationPosition:
            [1, 2, 3, 4].find((p) => !occupiedPositions.includes(p)) || 1,
        },
  });

  if (!isOpen) return null;

  async function onSubmit(data: CreateMemberInput) {
    setIsSubmitting(true);
    setError(null);

    try {
      const url = isEditing ? `/api/members/${initialData?.id}` : "/api/members";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(body.error || "Failed to save member.");
        return;
      }

      reset();
      onSuccess();
      onClose();
    } catch {
      setError("A network error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Available rotation positions: for edit, include current member's position
  const availablePositions = [1, 2, 3, 4].filter(
    (p) => !occupiedPositions.includes(p) || (isEditing && p === initialData?.rotationPosition)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-xl border bg-card p-6 shadow-xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-6">
          <h2 className="text-xl font-semibold">
            {isEditing ? "Edit Member Profile" : "Register New Member"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isEditing
              ? "Update member details and contact information."
              : "Assign member details and their fixed rotation seat."}
          </p>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              placeholder="e.g. Kwame Mensah"
              disabled={isSubmitting}
              {...register("fullName")}
            />
            {errors.fullName && (
              <p className="text-xs text-destructive">{errors.fullName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Phone Number (MTN / Telecel / AT)</Label>
            <Input
              id="phoneNumber"
              placeholder="+233XXXXXXXXX or 024XXXXXXX"
              disabled={isSubmitting}
              {...register("phoneNumber")}
            />
            {errors.phoneNumber && (
              <p className="text-xs text-destructive">{errors.phoneNumber.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address (Optional)</Label>
            <Input
              id="email"
              type="email"
              placeholder="member@example.com"
              disabled={isSubmitting}
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="rotationPosition">Rotation Position (1 – 4)</Label>
            <select
              id="rotationPosition"
              disabled={isSubmitting}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              {...register("rotationPosition", { valueAsNumber: true })}
            >
              {availablePositions.map((pos) => (
                <option key={pos} value={pos}>
                  Position {pos} {pos === initialData?.rotationPosition ? "(Current)" : ""}
                </option>
              ))}
            </select>
            {errors.rotationPosition && (
              <p className="text-xs text-destructive">{errors.rotationPosition.message}</p>
            )}
            <p className="text-[11px] text-muted-foreground">
              Fixed payout sequence order in the 4-month savings cycle.
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
                  Saving...
                </>
              ) : isEditing ? (
                "Update Member"
              ) : (
                "Register Member"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

