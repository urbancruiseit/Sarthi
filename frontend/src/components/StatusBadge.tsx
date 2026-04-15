import { EmployeeStatus } from "@/types";
import { CheckCircle, Clock, XCircle, FileEdit, RefreshCw } from "lucide-react";

interface StatusBadgeProps {
  status: EmployeeStatus;
}

const config: Record<EmployeeStatus, { label: string; className: string; Icon: React.ElementType }> = {
  approved: { label: "Approved", className: "badge-approved", Icon: CheckCircle },
  pending: { label: "Pending", className: "badge-pending", Icon: Clock },
  rejected: { label: "Rejected", className: "badge-rejected", Icon: XCircle },
  draft: { label: "Draft", className: "badge-draft", Icon: FileEdit },
  resubmitted: { label: "Re-Submitted", className: "badge-resubmitted", Icon: RefreshCw },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const { label, className, Icon } = config[status] ?? config.draft;
  return (
    <span className={className}>
      <Icon size={11} />
      {label}
    </span>
  );
}
