import { Badge } from "@/components/ui/badge";
import { MemberStatus } from "@prisma/client";

interface StatusBadgeProps {
  status: MemberStatus | string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  switch (status) {
    case "ACTIVE":
      return (
        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-950/40 dark:text-emerald-400">
          Active
        </span>
      );
    case "INACTIVE":
      return (
        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700 ring-1 ring-inset ring-gray-600/20 dark:bg-gray-800 dark:text-gray-300">
          Inactive
        </span>
      );
    case "SUSPENDED":
      return (
        <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700 ring-1 ring-inset ring-red-600/20 dark:bg-red-950/40 dark:text-red-400">
          Suspended
        </span>
      );
    case "LEFT":
      return (
        <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-950/40 dark:text-amber-400">
          Left
        </span>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

