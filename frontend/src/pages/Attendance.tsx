import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/hooks/useRedux";

import {
  Users,
  Clock,
  CheckCircle,
  Search,
  CalendarOff,
  Timer,
  TimerReset,
  AlarmClock,
  Check,
  X,
  CalendarDays,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  fetchAttendance,
  markEmployeeAttendance,
  AttendanceRecord,
} from "@/redux/features/Attendance/attendanceSlice";
import { getAttendance } from "@/redux/features/Attendance/attendanceApi";
import { RootState } from "@/redux/store";
import ShiftAssignment from "@/components/addFromModels/Shiftassignment";
import BranchFilter from "@/components/FilterComponent/BranchFilter";
import DepartmentFilter from "@/components/FilterComponent/DepartmentFilter";
import EmployeeFilter from "@/components/FilterComponent/EmployeeFilter";

type AttendanceStatus =
  | "Present"
  | "Absent"
  | "Half Day"
  | "Leave"
  | "Holiday"
  | "Pending";

const STATUS_COLORS: Record<AttendanceStatus, { bg: string; color: string }> = {
  Present: {
    bg: "hsl(var(--success) / 0.12)",
    color: "hsl(var(--success))",
  },

  Absent: {
    bg: "hsl(var(--destructive) / 0.12)",
    color: "hsl(var(--destructive))",
  },

  "Half Day": {
    bg: "hsl(var(--warning) / 0.12)",
    color: "hsl(var(--warning))",
  },

  Leave: {
    bg: "hsl(var(--primary) / 0.12)",
    color: "hsl(var(--primary))",
  },

  Holiday: {
    bg: "hsl(var(--muted))",
    color: "hsl(var(--muted-foreground))",
  },

  Pending: {
    bg: "#FFF7ED",
    color: "#EA580C",
  },
};

const LEAVE_TYPES = [
  "Sick Leave",
  "Casual Leave",
  "Earned Leave",
  "Unpaid Leave",
];

type Override = { status: AttendanceStatus; leaveType?: string };

type ModalState =
  | { type: "halfday"; empId: string; empName: string }
  | { type: "leave"; empId: string; empName: string; leaveType: string }
  | null;

// ---------- Time helpers ----------

function parseTimeToMinutes(time?: string | null): number | null {
  if (!time) return null;

  const ampm = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (ampm) {
    let hours = parseInt(ampm[1], 10);
    const minutes = parseInt(ampm[2], 10);
    const period = ampm[3].toUpperCase();
    if (period === "PM" && hours !== 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;
    return hours * 60 + minutes;
  }

  const h24 = time.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (h24) {
    const hours = parseInt(h24[1], 10);
    const minutes = parseInt(h24[2], 10);
    return hours * 60 + minutes;
  }

  return null;
}

function formatTime12h(time?: string | null): string {
  const mins = parseTimeToMinutes(time);
  if (mins === null) return "—";
  const h24 = Math.floor(mins / 60);
  const m = mins % 60;
  const period = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${period}`;
}

function getShiftStartMinutes(shiftTiming?: string | null): number {
  const parsed = parseTimeToMinutes(shiftTiming);
  return parsed !== null ? parsed : 9 * 60;
}

function getShiftEndMinutes(shiftTiming?: string | null): number {
  if (!shiftTiming) return 18 * 60;

  const parts = shiftTiming.split("-");
  if (parts.length === 2) {
    const parsed = parseTimeToMinutes(parts[1].trim());
    if (parsed !== null) return parsed;
  }

  return 18 * 60;
}

function formatDuration(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h <= 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/** Shapes a raw AttendanceRecord into the display-ready row used by the table. */
function toDisplayRow(r: AttendanceRecord, override?: Override) {
  const empId = String(r.employee_id);

  const status: AttendanceStatus =
    override?.status ?? (r.status as AttendanceStatus) ?? "Absent";
  const leaveType = override?.leaveType ?? r.leave_type ?? undefined;

  const inTime = formatTime12h(r.punch_in);
  const outTime = formatTime12h(r.punch_out);

  const shiftStartMinutes = getShiftStartMinutes(r.shift_timing);
  const shiftEndMinutes = getShiftEndMinutes(r.shift_timing);
  const inMinutes = parseTimeToMinutes(r.punch_in);
  const outMinutes = parseTimeToMinutes(r.punch_out);

  const isLate = inMinutes !== null && inMinutes > shiftStartMinutes;
  const lateMinutes = isLate ? inMinutes! - shiftStartMinutes : 0;

  const isEarlyOut = outMinutes !== null && outMinutes < shiftEndMinutes;
  const earlyMinutes = isEarlyOut ? shiftEndMinutes - outMinutes! : 0;

  const workingMinutes =
    inMinutes !== null && outMinutes !== null && outMinutes > inMinutes
      ? outMinutes - inMinutes
      : null;

  const workingHours =
    workingMinutes !== null ? formatDuration(workingMinutes) : null;

  return {
    id: empId,
    attendanceDate: r.attendance_date,
    fullName: r.full_name,
    department: r.department_name || "—",
    shiftTiming: r.shift_timing || "Morning",
    branchOfficeId: r.branchOffice_id,
    status,
    leaveType,
    inTime,
    outTime,
    isLate,
    lateMinutes,
    isEarlyOut,
    earlyMinutes,
    workingMinutes,
    workingHours,
  };
}

export default function Attendance() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { list, loading, error } = useAppSelector((s) => s.attendance);

  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [employeeFilter, setEmployeeFilter] = useState<string>("all");
  const [overrides, setOverrides] = useState<Record<string, Override>>({});
  const [modal, setModal] = useState<ModalState>(null);

  const [activeTab, setActiveTab] = useState("attendance");

  const todayISO = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const currentMonthStr = useMemo(() => todayISO.slice(0, 7), [todayISO]);

  // Single date filter — controlled via the calendar input next to Department
  const [selectedDate, setSelectedDate] = useState<string>(todayISO);

  const selectedDateLabel = useMemo(
    () =>
      new Date(selectedDate).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    [selectedDate],
  );

  // ---- Selected employee (drill-down) state ----
  // When set, the SAME table switches to showing this employee's current-month records.
  const [selectedEmployee, setSelectedEmployee] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [employeeMonthRecords, setEmployeeMonthRecords] = useState<
    AttendanceRecord[]
  >([]);
  const [employeeMonthLoading, setEmployeeMonthLoading] = useState(false);
  const [employeeMonthError, setEmployeeMonthError] = useState<string | null>(
    null,
  );

  // Fetch attendance whenever the calendar date changes (only relevant in list view).
  useEffect(() => {
    if (!selectedEmployee) {
      dispatch(fetchAttendance({ date: selectedDate }));
    }
  }, [dispatch, selectedDate, selectedEmployee]);

  const handleTabChange = (value: string) => {
    if (value === "calendar") {
      navigate("/calendar");
      return;
    }

    setActiveTab(value);
  };

  // ---- List view rows (all employees, selected date) ----
  const attendanceData = useMemo(() => {
    return list
      .filter((r) => {
        const fullName = (r.full_name ?? "").toLowerCase();
        const department = (r.department_name ?? "").toLowerCase();
        const keyword = search.toLowerCase();

        const matchesSearch =
          fullName.includes(keyword) || department.includes(keyword);

        const matchesBranch =
          branchFilter === "all" ||
          String(r.branchOffice_id ?? "") === branchFilter;

        const matchesDepartment =
          departmentFilter === "all" ||
          String(r.department_id ?? "") === departmentFilter;

        const matchesEmployee =
          employeeFilter === "all" ||
          String(r.employee_id ?? "") === employeeFilter;

        return (
          matchesSearch && matchesBranch && matchesDepartment && matchesEmployee
        );
      })
      .map((r) => toDisplayRow(r, overrides[String(r.employee_id)]));
  }, [list, search, branchFilter, departmentFilter, employeeFilter, overrides]);

  // ---- Drill-down view rows (one employee, current month, every date) ----
  const employeeMonthData = useMemo(() => {
    return employeeMonthRecords
      .slice()
      .sort((a, b) =>
        (b.attendance_date ?? "").localeCompare(a.attendance_date ?? ""),
      )
      .map((r) => toDisplayRow(r));
  }, [employeeMonthRecords]);

  const isDrillDown = !!selectedEmployee;
  const rowsToRender = isDrillDown ? employeeMonthData : attendanceData;

  const presentCount = rowsToRender.filter(
    (e) => e.status === "Present",
  ).length;

  const absentCount = rowsToRender.filter((e) => e.status === "Absent").length;

  const leaveCount = rowsToRender.filter((e) => e.status === "Leave").length;

  const totalLateMinutes = rowsToRender.reduce((total, emp) => {
    return total + (emp.lateMinutes || 0);
  }, 0);

  const totalOvertimeMinutes = rowsToRender.reduce((total, emp) => {
    if (!emp.workingMinutes) return total;

    // Office Working Hours = 8 Hours 30 Minutes
    const overtime = emp.workingMinutes - 510;

    return total + (overtime > 0 ? overtime : 0);
  }, 0);

  const totalShortMinutes = rowsToRender.reduce((total, emp) => {
    if (!emp.workingMinutes) return total;

    // Employee worked less than 8:30 Hours
    const shortTime = 510 - emp.workingMinutes;

    return total + (shortTime > 0 ? shortTime : 0);
  }, 0);

  const totalEarlyMinutes = rowsToRender.reduce((total, emp) => {
    return total + (emp.earlyMinutes || 0);
  }, 0);

  const totalLossMinutes = rowsToRender.reduce((total, emp) => {
    return total + (emp.lateMinutes || 0) + (emp.earlyMinutes || 0);
  }, 0);

  const totalLateTime = formatDuration(totalLateMinutes);
  const totalOvertime = formatDuration(totalOvertimeMinutes);
  const totalShortTime = formatDuration(totalShortMinutes);
  const totalEarlyTime = formatDuration(totalEarlyMinutes);
  const totalLossTime = formatDuration(totalLossMinutes);
  const openHalfDayModal = (empId: string, empName: string) => {
    setModal({ type: "halfday", empId, empName });
  };

  const openLeaveModal = (empId: string, empName: string, current?: string) => {
    setModal({
      type: "leave",
      empId,
      empName,
      leaveType: current || LEAVE_TYPES[0],
    });
  };

  const loadEmployeeMonth = async (empId: string) => {
    setEmployeeMonthLoading(true);
    setEmployeeMonthError(null);
    try {
      const records = await getAttendance({
        employeeId: empId,
        month: currentMonthStr,
      });
      setEmployeeMonthRecords(records ?? []);
    } catch (err: any) {
      setEmployeeMonthError(err?.message || "Failed to load attendance");
    } finally {
      setEmployeeMonthLoading(false);
    }
  };

  // Employee ki row pe click -> same table employee-drilldown mode me switch
  const openEmployeeMonth = (empId: string, empName: string) => {
    setSelectedEmployee({ id: empId, name: empName });
    loadEmployeeMonth(empId);
  };

  const backToAllEmployees = () => {
    setSelectedEmployee(null);
    setEmployeeMonthRecords([]);
    setEmployeeMonthError(null);
  };

  const refetchCurrentView = () => {
    if (selectedEmployee) {
      loadEmployeeMonth(selectedEmployee.id);
    } else {
      dispatch(fetchAttendance({ date: selectedDate }));
    }
  };

  const confirmHalfDay = async () => {
    if (!modal || modal.type !== "halfday") return;
    const empId = modal.empId;

    setOverrides((prev) => ({
      ...prev,
      [empId]: { status: "Half Day" },
    }));
    setModal(null);

    try {
      await dispatch(
        markEmployeeAttendance({
          employee_id: Number(empId),
          attendance_date: selectedDate,
          status: "Half Day",
        } as any),
      ).unwrap();
      refetchCurrentView();
    } catch {
      // request failed — local override still reflects the intended change;
      // consider surfacing a toast here.
    }
  };

  const confirmLeave = async () => {
    if (!modal || modal.type !== "leave") return;
    const empId = modal.empId;
    const leaveType = modal.leaveType;

    setOverrides((prev) => ({
      ...prev,
      [empId]: { status: "Leave", leaveType },
    }));
    setModal(null);

    try {
      await dispatch(
        markEmployeeAttendance({
          employee_id: Number(empId),
          attendance_date: selectedDate,
          status: "Leave",
          leave_type: leaveType,
        } as any),
      ).unwrap();
      refetchCurrentView();
    } catch {
      // request failed — local override still reflects the intended change;
      // consider surfacing a toast here.
    }
  };

  return (
    <div className="space-y-6">
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
        <div
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl p-4 border-l-4"
          style={{ background: "#FFF7ED", borderColor: "#F97316" }}
        >
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "#166534" }}>
              Attendance Management
            </h1>
            <p className="text-sm mt-1" style={{ color: "#EA580C" }}>
              Attendance tracking & workforce operations
            </p>
          </div>

          <TabsList className="grid grid-cols-3 w-fit bg-white border border-orange-200">
            <TabsTrigger
              value="attendance"
              className="gap-1.5 data-[state=active]:bg-orange-500 data-[state=active]:text-white"
            >
              <Users size={14} />
              Attendance
            </TabsTrigger>
            <TabsTrigger
              value="shift"
              className="gap-1.5 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              <Clock size={14} />
              Shift Assignment
            </TabsTrigger>
            <TabsTrigger
              value="calendar"
              className="gap-1.5 data-[state=active]:bg-green-600 data-[state=active]:text-white"
            >
              <CalendarDays size={14} />
              Calendar
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ---------- Attendance Tab ---------- */}
        <TabsContent value="attendance" className="space-y-6 mt-6">
          {error && !isDrillDown && (
            <div
              className="rounded-lg px-4 py-2.5 text-sm font-medium"
              style={{ background: "#FEE2E2", color: "#B91C1C" }}
            >
              {error}
            </div>
          )}

          {employeeMonthError && isDrillDown && (
            <div
              className="rounded-lg px-4 py-2.5 text-sm font-medium"
              style={{ background: "#FEE2E2", color: "#B91C1C" }}
            >
              {employeeMonthError}
            </div>
          )}

          {/* Drill-down header — shown only when an employee is selected */}
          {isDrillDown && (
            <div
              className="flex items-center justify-between rounded-xl p-4 border-l-4"
              style={{ background: "#F0FDF4", borderColor: "#16A34A" }}
            >
              <div className="flex items-center gap-3">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1.5"
                  onClick={backToAllEmployees}
                >
                  <ArrowLeft size={14} />
                  Back
                </Button>
                <div>
                  <p
                    className="font-semibold text-sm"
                    style={{ color: "#166534" }}
                  >
                    {selectedEmployee?.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Attendance for {currentMonthStr}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-6 xl:grid-cols-6 gap-4">
            {[
              {
                label: isDrillDown ? "This Month" : "Selected Date",
                value: isDrillDown ? currentMonthStr : selectedDateLabel,
                icon: CalendarDays,
                bg: "bg-orange-200",
              },
              {
                label: "Present",
                value: presentCount,
                icon: CheckCircle,
                bg: "bg-green-200",
              },
              {
                label: "Absent",
                value: absentCount,
                icon: Users,
                bg: "bg-red-200",
              },
              {
                label: "Leave",
                value: leaveCount,
                icon: CalendarOff,
                bg: "bg-blue-200",
              },
              {
                label: "Short Time",
                value: totalShortTime,
                icon: Timer,
                bg: "bg-rose-200",
              },
              {
                label: "Overtime",
                value: totalOvertime,
                icon: TimerReset,
                bg: "bg-violet-200",
              },
            ].map(({ label, value, icon: Icon, bg }) => (
              <div
                key={label}
                className={`${bg} rounded-2xl p-5 flex items-center gap-4 shadow-md hover:shadow-xl transition-all`}
              >
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-white/40">
                  <Icon size={28} className="text-gray-700" />
                </div>

                <div>
                  <p className="text-sm font-semibold tracking-wide text-gray-700">
                    {label}
                  </p>

                  <p className="text-2xl font-extrabold text-gray-900 mt-1">
                    {value}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Search + Filters (Branch, Department, Employee, Calendar) — hidden in drill-down */}
          {!isDrillDown && (
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative max-w-xs w-full">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search employees…"
                  className="w-full pl-9 pr-4 h-9 rounded-lg border border-input bg-background text-sm"
                />
              </div>

              <BranchFilter value={branchFilter} onChange={setBranchFilter} />

              <DepartmentFilter
                value={departmentFilter}
                onChange={setDepartmentFilter}
              />

              <EmployeeFilter
                value={employeeFilter}
                onChange={setEmployeeFilter}
              />

              {/* Calendar filter — department ke bagal me, isi se date filter hota hai */}
              <div className="relative w-full sm:w-[170px]">
                <CalendarDays
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full pl-9 pr-3 h-9 rounded-lg border border-input bg-background text-sm"
                />
              </div>

              {selectedDate !== todayISO && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-9"
                  onClick={() => setSelectedDate(todayISO)}
                >
                  Today
                </Button>
              )}
            </div>
          )}

          {/* Table */}
          <div
            className="rounded-xl border-2 bg-card overflow-hidden"
            style={{ borderColor: "#BBF7D0" }}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm table-fixed">
                <colgroup>
                  {isDrillDown ? (
                    <>
                      <col className="w-[13%]" />
                      <col className="w-[11%]" />
                      <col className="w-[11%]" />
                      <col className="w-[11%]" />
                      <col className="w-[13%]" />
                      <col className="w-[13%]" />
                      <col className="w-[13%]" />
                      <col className="w-[15%]" />
                    </>
                  ) : (
                    <>
                      <col className="w-[16%]" />
                      <col className="w-[12%]" />
                      <col className="w-[10%]" />
                      <col className="w-[10%]" />
                      <col className="w-[12%]" />
                      <col className="w-[12%]" />
                      <col className="w-[13%]" />
                      <col className="w-[15%]" />
                    </>
                  )}
                </colgroup>
                <thead>
                  <tr style={{ background: "#166534" }}>
                    {[
                      "Employee",
                      "Department",
                      "Shift",
                      ...(isDrillDown ? ["Date"] : []),
                      "Punch-In",
                      "Punch-Out",
                      "Working Hours",
                      "Status",
                      "Actions",
                    ].map((h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-3 text-xs font-semibold text-white uppercase"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(isDrillDown ? employeeMonthLoading : loading) &&
                    rowsToRender.length === 0 && (
                      <tr>
                        <td
                          colSpan={isDrillDown ? 9 : 8}
                          className="px-4 py-8 text-center"
                        >
                          <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
                            <Loader2 size={16} className="animate-spin" />
                            Loading attendance…
                          </div>
                        </td>
                      </tr>
                    )}

                  {!(isDrillDown ? employeeMonthLoading : loading) &&
                    rowsToRender.length === 0 && (
                      <tr>
                        <td
                          colSpan={isDrillDown ? 9 : 8}
                          className="px-4 py-8 text-center text-sm text-muted-foreground"
                        >
                          {isDrillDown
                            ? "No attendance records found for this month."
                            : "No attendance records found."}
                        </td>
                      </tr>
                    )}

                  {rowsToRender.map((emp, idx) => {
                    const sc = STATUS_COLORS[
                      emp.status as AttendanceStatus
                    ] ?? {
                      bg: "#F3F4F6",
                      color: "#6B7280",
                    };
                    const hasPunchIn = emp.inTime !== "—";
                    const hasPunchOut = emp.outTime !== "—";
                    return (
                      <tr
                        key={
                          isDrillDown
                            ? `${emp.id}-${emp.attendanceDate ?? idx}`
                            : emp.id
                        }
                        className={
                          "border-b border-border/50 hover:bg-muted/30" +
                          (isDrillDown ? "" : " cursor-pointer")
                        }
                        onClick={
                          isDrillDown
                            ? undefined
                            : () => openEmployeeMonth(emp.id, emp.fullName)
                        }
                        title={
                          isDrillDown
                            ? undefined
                            : "Click to view this month's full attendance"
                        }
                      >
                        <td
                          className={
                            "px-4 py-3 truncate" +
                            (isDrillDown ? "" : " font-medium hover:underline")
                          }
                        >
                          {emp.fullName}
                        </td>
                        <td className="px-4 py-3 truncate">{emp.department}</td>
                        <td className="px-4 py-3 truncate">
                          {emp.shiftTiming}
                        </td>

                        {isDrillDown && (
                          <td className="px-4 py-3 truncate">
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

                        <td className="px-4 py-3">
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

                        <td className="px-4 py-3">
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

                        <td className="px-4 py-3">
                          {emp.workingHours ? (
                            <span
                              className="font-medium"
                              style={{
                                color:
                                  emp.workingMinutes !== null &&
                                  emp.workingMinutes >= 8 * 60 + 30
                                    ? "hsl(var(--success))"
                                    : "hsl(var(--destructive))",
                              }}
                            >
                              {emp.workingHours}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>

                        <td className="px-4 py-3">
                          <span
                            className="px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap"
                            style={{ background: sc.bg, color: sc.color }}
                          >
                            {emp.status}
                            {emp.status === "Leave" && emp.leaveType
                              ? ` · ${emp.leaveType}`
                              : ""}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div
                            className="flex items-center gap-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              size="sm"
                              className="h-8 text-xs gap-1.5 text-white border-none hover:opacity-90"
                              style={{ background: "#F97316" }}
                              onClick={() =>
                                openHalfDayModal(emp.id, emp.fullName)
                              }
                            >
                              <Timer size={13} />
                              Half Day
                            </Button>

                            <Button
                              size="sm"
                              className="h-8 text-xs gap-1.5 text-white border-none hover:opacity-90"
                              style={{ background: "#16A34A" }}
                              onClick={() =>
                                openLeaveModal(
                                  emp.id,
                                  emp.fullName,
                                  emp.leaveType,
                                )
                              }
                            >
                              <CalendarOff size={13} />
                              Leave
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="shift" className="mt-6">
          <ShiftAssignment />
        </TabsContent>
      </Tabs>

      {/* Half Day Confirmation Modal */}
      <Dialog
        open={modal?.type === "halfday"}
        onOpenChange={(open) => !open && setModal(null)}
      >
        <DialogContent className="sm:max-w-[420px] p-0 gap-0 overflow-hidden rounded-2xl border-none shadow-2xl bg-white">
          <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground z-10">
            <X className="h-4 w-4 text-red-500 hover:text-red-700 transition-colors" />
            <span className="sr-only">Close</span>
          </DialogClose>

          <div
            className="h-24 w-full relative"
            style={{ background: "#F97316" }}
          >
            <div className="absolute -bottom-9 left-1/2 -translate-x-1/2 w-[72px] h-[72px] rounded-2xl bg-white border-2 border-border shadow-lg flex items-center justify-center">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: "#FFEDD5" }}
              >
                <Timer size={24} style={{ color: "#F97316" }} />
              </div>
            </div>
          </div>

          <div className="pt-14 px-6 pb-6 space-y-6">
            <DialogHeader className="space-y-2.5">
              <DialogTitle className="text-center text-xl font-bold">
                Mark as Half Day
              </DialogTitle>
              <DialogDescription className="text-center text-sm leading-relaxed text-muted-foreground">
                {modal?.type === "halfday" && (
                  <>
                    You're about to mark{" "}
                    <span className="font-semibold text-foreground">
                      {modal.empName}
                    </span>{" "}
                    as{" "}
                    <span className="font-semibold text-foreground">
                      Half Day
                    </span>{" "}
                    for{" "}
                    <span className="font-medium text-foreground">
                      {selectedDateLabel}
                    </span>
                    . This action can be updated later.
                  </>
                )}
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="flex-row justify-center gap-3 sm:justify-center pt-2">
              <Button
                variant="outline"
                className="flex-1 h-11 rounded-xl text-sm font-medium border-2 hover:bg-gray-50 hover:border-gray-300 transition-all"
                onClick={() => setModal(null)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 h-11 rounded-xl gap-2 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200 border-none"
                style={{ background: "#F97316" }}
                onClick={confirmHalfDay}
              >
                <Check size={16} />
                Confirm
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Leave Confirmation Modal */}
      <Dialog
        open={modal?.type === "leave"}
        onOpenChange={(open) => !open && setModal(null)}
      >
        <DialogContent className="sm:max-w-[420px] p-0 gap-0 overflow-hidden rounded-2xl border-none shadow-2xl bg-white">
          <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground z-10">
            <X className="h-4 w-4 text-red-500 hover:text-red-700 transition-colors" />
            <span className="sr-only">Close</span>
          </DialogClose>

          <div
            className="h-24 w-full relative"
            style={{ background: "#16A34A" }}
          >
            <div className="absolute -bottom-9 left-1/2 -translate-x-1/2 w-[72px] h-[72px] rounded-2xl bg-white border-2 border-border shadow-lg flex items-center justify-center">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: "#DCFCE7" }}
              >
                <CalendarOff size={24} style={{ color: "#16A34A" }} />
              </div>
            </div>
          </div>

          <div className="pt-14 px-6 pb-6 space-y-6">
            <DialogHeader className="space-y-2.5">
              <DialogTitle className="text-center text-xl font-bold">
                Mark Leave
              </DialogTitle>
              <DialogDescription className="text-center text-sm leading-relaxed text-muted-foreground">
                {modal?.type === "leave" && (
                  <>
                    Select a leave type for{" "}
                    <span className="font-semibold text-foreground">
                      {modal.empName}
                    </span>
                  </>
                )}
              </DialogDescription>
            </DialogHeader>

            {modal?.type === "leave" && (
              <Select
                value={modal.leaveType}
                onValueChange={(value) =>
                  setModal({ ...modal, leaveType: value })
                }
              >
                <SelectTrigger className="w-full h-11 rounded-xl border-2 focus:ring-2 focus:ring-primary/20 transition-all">
                  <SelectValue placeholder="Select leave type" />
                </SelectTrigger>
                <SelectContent>
                  {LEAVE_TYPES.map((lt) => (
                    <SelectItem key={lt} value={lt}>
                      {lt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <DialogFooter className="flex-row justify-center gap-3 sm:justify-center pt-2">
              <Button
                variant="outline"
                className="flex-1 h-11 rounded-xl text-sm font-medium border-2 hover:bg-gray-50 hover:border-gray-300 transition-all"
                onClick={() => setModal(null)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 h-11 rounded-xl gap-2 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200 border-none"
                style={{ background: "#16A34A" }}
                onClick={confirmLeave}
              >
                <Check size={16} />
                Confirm
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
