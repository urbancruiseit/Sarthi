import {
  Search,
  Plus,
  CalendarDays,
  CheckCircle2,
  XCircle,
  HourglassIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LeaveRequest, LeaveStatus, STATUS_STYLES } from "./Leaveutils";

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
}

export default function LeaveRequestsTab({
  requests,
  search,
  onSearchChange,
  onApplyClick,
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
              {requests.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-10 text-center text-sm text-muted-foreground"
                  >
                    No leave requests found.
                  </td>
                </tr>
              )}

              {requests.map((r) => {
                const sc = STATUS_STYLES[r.status];
                const StatusIcon = STATUS_ICONS[r.status];
                return (
                  <tr
                    key={r.id}
                    className="border-b border-border/50 hover:bg-muted/30"
                  >
                    <td className="px-4 py-3 font-medium">{r.employeeName}</td>
                    <td className="px-4 py-3">{r.department}</td>
                    <td className="px-4 py-3">{r.leaveType}</td>
                    <td className="px-4 py-3">
                      {new Date(r.fromDate).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      {new Date(r.toDate).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </td>
                    <td className="px-4 py-3">{r.days}</td>
                    <td
                      className="px-4 py-3 max-w-[220px] truncate"
                      title={r.reason}
                    >
                      {r.reason}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                        <CalendarDays size={13} />
                        {new Date(r.appliedOn).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                        })}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap"
                        style={{ background: sc.bg, color: sc.color }}
                      >
                        <StatusIcon size={12} />
                        {r.status}
                      </span>
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
