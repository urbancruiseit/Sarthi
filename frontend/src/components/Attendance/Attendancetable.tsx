import { Loader2, ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AttendanceStatus,
  DisplayRow,
  STATUS_COLORS,
  formatDuration,
} from "./Attendanceutils";
import { useAccessControl } from "@/utils/Accesscontrol";

interface AttendanceTableProps {
  rows: DisplayRow[];
  isDrillDown: boolean;
  loading: boolean;
  onRowClick: (empId: string, empName: string) => void;
  onUpdateStatus: (empId: string, empName: string) => void;
}

export default function AttendanceTable({
  rows,
  isDrillDown,
  loading,
  onRowClick,
  onUpdateStatus,
}: AttendanceTableProps) {
  const { can } = useAccessControl();
  const canSeeFilters = can("ATTENDANCE_FILTERS");
  const columnCount = isDrillDown
    ? canSeeFilters
      ? 10
      : 9
    : canSeeFilters
      ? 9
      : 8;

  const headers = [
    "Employee",
    "Department",
    "Branch Office",
    "Shift",
    ...(isDrillDown ? ["Date"] : []),
    "Punch-In",
    "Punch-Out",
    "Working Hrs",
    "Status",
    ...(canSeeFilters ? ["Actions"] : []),
  ];

  return (
    <div
      className="rounded-xl border-2 bg-card"
      style={{ borderColor: "#BBF7D0" }}
    >
      <div className="overflow-auto max-h-[65vh] rounded-xl">
        <table className="w-full text-sm table-fixed">
          <colgroup>
            {isDrillDown ? (
              <>
                <col className="w-[12%]" />
                <col className="w-[10%]" />
                <col className="w-[10%]" />
                <col className="w-[8%]" />
                <col className="w-[9%]" />
                <col className="w-[10%]" />
                <col className="w-[10%]" />
                <col className="w-[11%]" />
                <col className="w-[11%]" />
                {canSeeFilters && <col className="w-[9%]" />}
              </>
            ) : (
              <>
                <col className="w-[15%]" />
                <col className="w-[11%]" />
                <col className="w-[11%]" />
                <col className="w-[9%]" />
                <col className="w-[11%]" />
                <col className="w-[11%]" />
                <col className="w-[12%]" />
                <col className="w-[12%]" />
                {canSeeFilters && <col className="w-[8%]" />}
              </>
            )}
          </colgroup>
          <thead className="sticky top-0 z-20">
            <tr style={{ background: "#166534" }}>
              {headers.map((h, i) => (
                <th
                  key={h}
                  className={
                    "text-left px-3 py-2 text-xs font-semibold text-white uppercase" +
                    (i === 0 ? " rounded-tl-xl" : "") +
                    (i === headers.length - 1 ? " rounded-tr-xl" : "")
                  }
                  style={{ background: "#166534" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && rows.length === 0 && (
              <tr>
                <td colSpan={columnCount} className="px-3 py-8 text-center">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
                    <Loader2 size={16} className="animate-spin" />
                    Loading attendance…
                  </div>
                </td>
              </tr>
            )}

            {!loading && rows.length === 0 && (
              <tr>
                <td
                  colSpan={columnCount}
                  className="px-3 py-8 text-center text-sm text-muted-foreground"
                >
                  {isDrillDown
                    ? "No attendance records found for this month."
                    : "No attendance records found."}
                </td>
              </tr>
            )}

            {rows.map((emp, idx) => {
              const sc = STATUS_COLORS[emp.status as AttendanceStatus] ?? {
                bg: "#F3F4F6",
                color: "#6B7280",
              };
              const hasPunchIn = emp.inTime !== "—";
              const hasPunchOut = emp.outTime !== "—";
              const rowBg = idx % 2 === 0 ? "#FFFFFF" : "#F9FAFB";

              return (
                <tr
                  key={
                    isDrillDown
                      ? `${emp.id}-${emp.attendanceDate ?? idx}`
                      : emp.id
                  }
                  className={
                    "hover:bg-muted/30 transition-colors" +
                    (isDrillDown ? "" : " cursor-pointer")
                  }
                  style={{
                    background: rowBg,
                  }}
                  onClick={
                    isDrillDown
                      ? undefined
                      : () => onRowClick(emp.id, emp.fullName)
                  }
                  title={
                    isDrillDown
                      ? undefined
                      : "Click to view this month's full attendance"
                  }
                >
                  <td
                    className={
                      "px-3 py-2 truncate text-blue-800" +
                      (isDrillDown ? "" : " font-medium hover:underline")
                    }
                  >
                    {emp.fullName}
                  </td>
                  <td className="px-3 py-2 truncate">{emp.department}</td>
                  <td className="px-3 py-2 truncate">{emp.branchName}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-col leading-tight">
                      <span className="font-medium">
                        {emp.permanentShiftTiming}
                      </span>

                      {emp.temporaryShiftTiming && (
                        <span className="text-[13px] font-medium text-orange-600">
                          {emp.temporaryShiftTiming}
                        </span>
                      )}
                    </div>
                  </td>

                  {isDrillDown && (
                    <td className="px-3 py-2 truncate">
                      {emp.attendanceDate
                        ? new Date(emp.attendanceDate).toLocaleDateString(
                            "en-IN",
                            {
                              day: "2-digit",
                              month: "short",
                            },
                          )
                        : "—"}
                    </td>
                  )}

                  <td className="px-3 py-2">
                    {hasPunchIn ? (
                      <div className="flex flex-col leading-tight">
                        <span
                          className="font-medium"
                          style={{
                            color: emp.isLate
                              ? "hsl(var(--destructive))"
                              : "hsl(var(--success))",
                          }}
                        >
                          {emp.inTime}
                        </span>
                        {emp.isLate && (
                          <span
                            className="text-[13px] font-medium"
                            style={{ color: "hsl(var(--destructive))" }}
                          >
                            {formatDuration(emp.lateMinutes)} late
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">
                        {emp.inTime}
                      </span>
                    )}
                  </td>

                  <td className="px-3 py-2">
                    {hasPunchOut ? (
                      <div className="flex flex-col leading-tight">
                        <span
                          className="font-medium"
                          style={{
                            color: emp.isEarlyOut
                              ? "hsl(var(--destructive))"
                              : "hsl(var(--success))",
                          }}
                        >
                          {emp.outTime}
                        </span>
                        {emp.isEarlyOut && (
                          <span
                            className="text-[11px] font-medium"
                            style={{ color: "hsl(var(--destructive))" }}
                          >
                            {formatDuration(emp.earlyMinutes)} early
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">
                        {emp.outTime}
                      </span>
                    )}
                  </td>

                  <td className="px-3 py-2">
                    {emp.workingHours ? (
                      <div className="flex flex-col">
                        <span
                          className="font-medium"
                          style={{
                            color:
                              emp.workingMinutes >= emp.expectedWorkingMinutes
                                ? "hsl(var(--success))"
                                : "hsl(var(--destructive))",
                          }}
                        >
                          {emp.workingHours}
                        </span>

                        {emp.shortfallMinutes > 0 && (
                          <span className="text-xs text-red-600">
                            Short: {emp.shortfall}
                          </span>
                        )}

                        {emp.overtimeMinutes > 0 && (
                          <span className="text-xs text-green-600">
                            OT: {emp.overtime}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>

                  <td className="px-3 py-2">
                    <span
                      className="px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap"
                      style={{
                        background:
                          emp.status === "Absent"
                            ? "#DC2626"
                            : emp.status === "Present"
                              ? "#16A34A"
                              : sc.bg,
                        color:
                          emp.status === "Absent" || emp.status === "Present"
                            ? "#FFFFFF"
                            : sc.color,
                      }}
                    >
                      {emp.status}
                      {emp.status === "Leave" && emp.leaveType
                        ? ` · ${emp.leaveType}`
                        : ""}
                    </span>
                  </td>
                  {canSeeFilters && (
                    <td className="px-3 py-2">
                      <div
                        className="flex items-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          size="sm"
                          className="h-8 text-xs gap-1.5 text-white border-none hover:opacity-90"
                          style={{ background: "#F97316" }}
                          onClick={() => onUpdateStatus(emp.id, emp.fullName)}
                        >
                          <ClipboardCheck size={13} />
                          Update Status
                        </Button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
