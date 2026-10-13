import { useState } from "react";
import {
  Search,
  Plus,
  CalendarDays,
  CheckCircle2,
  XCircle,
  HourglassIcon,
  Loader2,
  X,
  FileText,
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

const REASON_LIMIT = 20;

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
  // Modal ke liye selected reason (null = modal band)
  const [selectedReason, setSelectedReason] = useState<{
    name: string;
    reason: string;
  } | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
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

                  const reasonText = r.reason ?? "";
                  const isLongReason = reasonText.length > REASON_LIMIT;

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
                      <td className="px-4 py-3 whitespace-nowrap">
                        {reasonText ? (
                          <>
                            {isLongReason
                              ? `${reasonText.slice(0, REASON_LIMIT)}… `
                              : reasonText}
                            {isLongReason && (
                              <button
                                type="button"
                                className="text-xs font-medium text-green-600 hover:underline"
                                onClick={() =>
                                  setSelectedReason({
                                    name: r.full_name ?? "Employee",
                                    reason: reasonText,
                                  })
                                }
                              >
                                Read more
                              </button>
                            )}
                          </>
                        ) : (
                          "—"
                        )}
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
      {/* Reason Modal */}
      {selectedReason && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedReason(null)}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-2xl bg-background shadow-2xl border animate-in zoom-in-95 slide-in-from-bottom-2 duration-200"
            style={{ borderColor: "#BBF7D0" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between gap-3 px-5 py-4"
              style={{
                background: "linear-gradient(135deg, #166534, #16A34A)",
              }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 text-white font-semibold ring-2 ring-white/30">
                  {selectedReason.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-white leading-tight">
                    Leave Reason
                  </h3>
                  <p className="text-xs text-green-100 truncate">
                    {selectedReason.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="shrink-0 rounded-full bg-white/20 p-1.5 text-white transition hover:bg-red-500 hover:rotate-90 duration-200"
                onClick={() => setSelectedReason(null)}
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="p-5">
              <div
                className="rounded-xl border p-4"
                style={{ background: "#F0FDF4", borderColor: "#BBF7D0" }}
              >
                <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-green-800">
                  <FileText size={13} />
                  Reason
                </div>
                <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap break-words max-h-[50vh] overflow-y-auto pr-1">
                  {selectedReason.reason}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
