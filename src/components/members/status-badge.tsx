import { StatusBadge as UniversalStatusBadge } from "@/components/ui/status-badge";
import { MemberStatus } from "@prisma/client";

interface StatusBadgeProps {
  status: MemberStatus | string;
  className?: string;
  showIcon?: boolean;
}

export function StatusBadge({ status, className, showIcon = true }: StatusBadgeProps) {
  return <UniversalStatusBadge status={status} className={className} showIcon={showIcon} />;
}

