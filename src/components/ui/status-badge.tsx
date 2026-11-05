import React from "react";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  AlertCircle,
  ArrowDownToLine,
  CheckCheck,
  ShieldCheck,
  LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type StatusType =
  // Member statuses
  | "ACTIVE"
  | "INACTIVE"
  | "SUSPENDED"
  | "LEFT"
  // Obligation / Contribution statuses
  | "PAID"
  | "PARTIAL"
  | "PARTIALLY_PAID"
  | "PENDING"
  | "OVERDUE"
  | "OVERDUE_PARTIAL"
  // Payment statuses
  | "VERIFIED"
  | "REVERSED"
  | "FAILED"
  // Payout statuses
  | "SCHEDULED"
  | "AUTHORIZED"
  | "DISBURSED"
  | "ACKNOWLEDGED"
  | "POSTPONED"
  | "BLOCKED"
  // Cycle / General
  | "COMPLETED"
  | "POSTED"
  | "ARCHIVED"
  | string;

interface StatusConfig {
  variant: "success" | "warning" | "danger" | "info" | "neutral";
  label: string;
  icon: LucideIcon;
  badgeClasses: string;
  iconClasses: string;
}

const statusMap: Record<string, StatusConfig> = {
  // --- SUCCESS (Emerald #087F5B, Bg #E6F4EF, Border #A3E0CE, Text #066849: 5.63:1 contrast) ---
  ACTIVE: {
    variant: "success",
    label: "Active",
    icon: CheckCircle2,
    badgeClasses: "bg-[#E6F4EF] text-[#066849] border-[#A3E0CE]",
    iconClasses: "text-[#066849]",
  },
  PAID: {
    variant: "success",
    label: "Paid",
    icon: CheckCircle2,
    badgeClasses: "bg-[#E6F4EF] text-[#066849] border-[#A3E0CE]",
    iconClasses: "text-[#066849]",
  },
  VERIFIED: {
    variant: "success",
    label: "Verified",
    icon: CheckCircle2,
    badgeClasses: "bg-[#E6F4EF] text-[#066849] border-[#A3E0CE]",
    iconClasses: "text-[#066849]",
  },
  COMPLETED: {
    variant: "success",
    label: "Completed",
    icon: CheckCheck,
    badgeClasses: "bg-[#E6F4EF] text-[#066849] border-[#A3E0CE]",
    iconClasses: "text-[#066849]",
  },
  ACKNOWLEDGED: {
    variant: "success",
    label: "Acknowledged",
    icon: CheckCheck,
    badgeClasses: "bg-[#E6F4EF] text-[#066849] border-[#A3E0CE]",
    iconClasses: "text-[#066849]",
  },
  POSTED: {
    variant: "success",
    label: "Posted",
    icon: CheckCircle2,
    badgeClasses: "bg-[#E6F4EF] text-[#066849] border-[#A3E0CE]",
    iconClasses: "text-[#066849]",
  },

  // --- WARNING / AMBER (Amber #B45309, Bg #FFF4E5, Border #FDE68A, Text #92400E: 6.53:1 contrast) ---
  PARTIAL: {
    variant: "warning",
    label: "Partially Paid",
    icon: Clock,
    badgeClasses: "bg-[#FFF4E5] text-[#92400E] border-[#FDE68A]",
    iconClasses: "text-[#92400E]",
  },
  PARTIALLY_PAID: {
    variant: "warning",
    label: "Partially Paid",
    icon: Clock,
    badgeClasses: "bg-[#FFF4E5] text-[#92400E] border-[#FDE68A]",
    iconClasses: "text-[#92400E]",
  },
  OVERDUE_PARTIAL: {
    variant: "warning",
    label: "Overdue (Partial)",
    icon: AlertCircle,
    badgeClasses: "bg-[#FFF4E5] text-[#92400E] border-[#FDE68A]",
    iconClasses: "text-[#92400E]",
  },
  AUTHORIZED: {
    variant: "warning",
    label: "Authorized",
    icon: ShieldCheck,
    badgeClasses: "bg-[#FFF4E5] text-[#92400E] border-[#FDE68A]",
    iconClasses: "text-[#92400E]",
  },
  SUSPENDED: {
    variant: "warning",
    label: "Suspended",
    icon: AlertCircle,
    badgeClasses: "bg-[#FFF4E5] text-[#92400E] border-[#FDE68A]",
    iconClasses: "text-[#92400E]",
  },
  LEFT: {
    variant: "warning",
    label: "Left Group",
    icon: AlertCircle,
    badgeClasses: "bg-[#FFF4E5] text-[#92400E] border-[#FDE68A]",
    iconClasses: "text-[#92400E]",
  },

  // --- DANGER / RED (Danger #B42318, Bg #FEECEB, Border #FECACA, Text #991B1B: 7.32:1 contrast) ---
  OVERDUE: {
    variant: "danger",
    label: "Overdue",
    icon: AlertTriangle,
    badgeClasses: "bg-[#FEECEB] text-[#991B1B] border-[#FECACA]",
    iconClasses: "text-[#991B1B]",
  },
  FAILED: {
    variant: "danger",
    label: "Failed",
    icon: AlertTriangle,
    badgeClasses: "bg-[#FEECEB] text-[#991B1B] border-[#FECACA]",
    iconClasses: "text-[#991B1B]",
  },
  REVERSED: {
    variant: "danger",
    label: "Reversed",
    icon: RotateCcw,
    badgeClasses: "bg-[#FEECEB] text-[#991B1B] border-[#FECACA]",
    iconClasses: "text-[#991B1B]",
  },
  BLOCKED: {
    variant: "danger",
    label: "Blocked",
    icon: AlertTriangle,
    badgeClasses: "bg-[#FEECEB] text-[#991B1B] border-[#FECACA]",
    iconClasses: "text-[#991B1B]",
  },

  // --- INFORMATION / BLUE (Info #2563EB, Bg #EFF6FF, Border #BFDBFE, Text #1D4ED8: 6.19:1 contrast) ---
  PENDING: {
    variant: "info",
    label: "Pending",
    icon: Clock,
    badgeClasses: "bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]",
    iconClasses: "text-[#1D4ED8]",
  },
  PROCESSING: {
    variant: "info",
    label: "Processing",
    icon: Clock,
    badgeClasses: "bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]",
    iconClasses: "text-[#1D4ED8]",
  },
  DISBURSED: {
    variant: "info",
    label: "Disbursed",
    icon: ArrowDownToLine,
    badgeClasses: "bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]",
    iconClasses: "text-[#1D4ED8]",
  },
  SCHEDULED: {
    variant: "info",
    label: "Scheduled",
    icon: Clock,
    badgeClasses: "bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]",
    iconClasses: "text-[#1D4ED8]",
  },
  POSTPONED: {
    variant: "info",
    label: "Postponed",
    icon: Clock,
    badgeClasses: "bg-[#FFF4E5] text-[#92400E] border-[#FDE68A]",
    iconClasses: "text-[#92400E]",
  },

  // --- NEUTRAL / INACTIVE ---
  INACTIVE: {
    variant: "neutral",
    label: "Inactive",
    icon: Clock,
    badgeClasses: "bg-slate-100 text-slate-700 border-slate-300",
    iconClasses: "text-slate-600",
  },
  ARCHIVED: {
    variant: "neutral",
    label: "Archived",
    icon: Clock,
    badgeClasses: "bg-slate-100 text-slate-700 border-slate-300",
    iconClasses: "text-slate-600",
  },
};

export interface StatusBadgeProps {
  status: StatusType;
  customLabel?: string;
  showIcon?: boolean;
  className?: string;
  size?: "sm" | "default";
}

export function StatusBadge({
  status,
  customLabel,
  showIcon = true,
  className,
  size = "default",
}: StatusBadgeProps) {
  const normalizedKey = (status || "").toUpperCase();
  const config = statusMap[normalizedKey] || {
    variant: "neutral",
    label: (status || "Unknown").replaceAll("_", " "),
    icon: Clock,
    badgeClasses: "bg-slate-100 text-slate-700 border-slate-300",
    iconClasses: "text-slate-600",
  };

  const Icon = config.icon;
  const label = customLabel || config.label;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-semibold shadow-xs select-none",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-0.5 text-xs",
        config.badgeClasses,
        className
      )}
    >
      {showIcon && <Icon className={cn("shrink-0", size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5", config.iconClasses)} aria-hidden="true" />}
      <span>{label}</span>
    </span>
  );
}
