import {
  Search,
  Plus,
  CalendarDays,
  CheckCircle2,
  XCircle,
  HourglassIcon,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  LeaveRequest,
  LeaveStatus,
  STATUS_STYLES,
  DEFAULT_STATUS_STYLE,
  normalizeLeaveStatus,
} from "./Leaveutils";

const STATUS_ICONS: Record<LeaveStatus, any> = {
  Pending: HourglassIcon,
  Approved: CheckCircle2,
  Rejected: XCircle,
};

interface LeaveRequestsTabProps {
  requests: LeaveRequest[];
  search: string;
  onSearchChange: (value: string) => void;
  onApplyClick: () => void;
  onApprove: (id: string | number, name?: string) => void;
  onReject: (id: string | number, name?: string) => void;
  actionLoadingId?: string | number | null;
  loading?: boolean;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

export default function LeaveRequestsTab({
  requests,
  search,
  onSearchChange,
  onApplyClick,
  onApprove,
  onReject,
  actionLoadingId = null,
  loading = false,
}: LeaveRequestsTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="relative max-w-xs w-full sm:w-[260px]">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search leave requests…"
            className="w-full pl-9 pr-4 h-9 rounded-lg border border-input bg-background text-sm"
          />
        </div>
        <Button
          className="gap-2 text-white border-none hover:opacity-90 w-fit"
          style={{ background: "#16A34A" }}
          onClick={onApplyClick}
        >
          <Plus size={16} />
          Apply Leave
        </Button>
      </div>

      <div
        className="rounded-xl border-2 bg-card overflow-hidden"
        style={{ borderColor: "#BBF7D0" }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#166534" }}>
                {[
                  "Employee",
                  "Department",
                  "Leave Type",
                  "From",
                  "To",
                  "Days",
                  "Reason",
                  "Applied On",
                  "Status",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-xs font-semibold text-white uppercase whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center">
                    <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 size={16} className="animate-spin" />
                      Loading leave requests…
                    </span>
                  </td>
                </tr>
              )}

              {!loading && requests.length === 0 && (
                <tr>
                  <td
                    colSpan={10}
                    className="px-4 py-10 text-center text-sm text-muted-foreground"
                  >
                    No leave requests found.
                  </td>
                </tr>
              )}

              {!loading &&
                requests.map((r) => {
                  const normalizedStatus = normalizeLeaveStatus(r.status);
                  const sc = normalizedStatus
                    ? STATUS_STYLES[normalizedStatus]
                    : DEFAULT_STATUS_STYLE;
                  const StatusIcon = normalizedStatus
                    ? STATUS_ICONS[normalizedStatus]
                    : HourglassIcon;

                  const rowId: string | number = r.id ?? r.uuid;
                  const isPending = normalizedStatus === "Pending";
                  const isRowLoading = actionLoadingId === rowId;

                  return (
                    <tr
                      key={rowId}
                      className="border-b border-border/50 hover:bg-muted/30"
                    >
                      <td className="px-4 py-3 font-medium">
                        {r.full_name ?? "—"}
                      </td>
                      <td className="px-4 py-3">{r.department_name}</td>
                      <td className="px-4 py-3">{r.leave_type}</td>
                      <td className="px-4 py-3">{formatDate(r.from_date)}</td>
                      <td className="px-4 py-3">{formatDate(r.to_date)}</td>
                      <td className="px-4 py-3">{r.total_days}</td>
                      <td
                        className="px-4 py-3 max-w-[220px] truncate"
                        title={r.reason ?? undefined}
                      >
                        {r.reason ?? "—"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                          <CalendarDays size={13} />
                          {formatDate(r.applied_at)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap"
                          style={{ background: sc.bg, color: sc.color }}
                        >
                          <StatusIcon size={12} />
                          {normalizedStatus ?? r.status ?? "Unknown"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {isPending ? (
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              className="h-8 text-xs gap-1 text-white border-none hover:opacity-90"
                              style={{ background: "#16A34A" }}
                              disabled={isRowLoading}
                              onClick={() => onApprove(rowId, r.full_name)}
                            >
                              {isRowLoading ? (
                                <Loader2 size={13} className="animate-spin" />
                              ) : (
                                <CheckCircle2 size={13} />
                              )}
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs gap-1 border-red-300 text-red-600 hover:bg-red-50"
                              disabled={isRowLoading}
                              onClick={() => onReject(rowId, r.full_name)}
                            >
                              <XCircle size={13} />
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            —
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
