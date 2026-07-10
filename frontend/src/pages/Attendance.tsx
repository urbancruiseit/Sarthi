import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/hooks/useRedux";

import {
  Users,
  Clock,
  CalendarDays,
  ArrowLeft,
  Timer,
  TimerReset,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  fetchAttendance,
  markEmployeeAttendance,
  AttendanceRecord,
} from "@/redux/features/Attendance/attendanceSlice";
import { getAttendance } from "@/redux/features/Attendance/attendanceApi";
import ShiftAssignment from "@/components/addFromModels/Shiftassignment";
import BranchFilter from "@/components/FilterComponent/BranchFilter";
import DepartmentFilter from "@/components/FilterComponent/DepartmentFilter";
import EmployeeFilter from "@/components/FilterComponent/EmployeeFilter";

import {
  ModalState,
  Override,
  toDisplayRow,
  LEAVE_TYPES,
} from "../components/Attendance/Attendanceutils";
import AttendanceStatsCards from "../components/Attendance/Attendancestatscards";
import AttendanceTable from "../components/Attendance/Attendancetable";
import HalfDayModal from "../components/Attendance/Halfdaymodal";
import LeaveModal from "../components/Attendance/Leavemodal";

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

  const totalOvertimeMinutes = rowsToRender.reduce((total, emp) => {
    if (!emp.workingMinutes) return total;

    const overtime = emp.workingMinutes - 510;
    return total + (overtime > 0 ? overtime : 0);
  }, 0);

  const totalShortMinutes = rowsToRender.reduce((total, emp) => {
    if (!emp.workingMinutes) return total;

    const shortTime = 510 - emp.workingMinutes;
    return total + (shortTime > 0 ? shortTime : 0);
  }, 0);

  const formatDuration = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hrs && mins) return `${hrs}h ${mins}m`;
    if (hrs) return `${hrs}h`;
    return `${mins}m`;
  };

  const totalOvertime = formatDuration(totalOvertimeMinutes);
  const totalShortTime = formatDuration(totalShortMinutes);

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

          <AttendanceStatsCards
            rows={rowsToRender}
            isDrillDown={isDrillDown}
            currentMonthStr={currentMonthStr}
            selectedDateLabel={selectedDateLabel}
          />

          {/* Search + Filters (Branch, Department, Employee, Calendar) — hidden in drill-down */}
          {!isDrillDown && (
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative max-w-xs w-full">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
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
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 h-9">
                  <Timer size={16} className="text-rose-600" />
                  <span className="text-sm font-medium text-rose-700">
                    Short Time:
                  </span>
                  <span className="font-bold text-rose-800">
                    {totalShortTime}
                  </span>
                </div>

                <div className="flex items-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-3 h-9">
                  <TimerReset size={16} className="text-violet-600" />
                  <span className="text-sm font-medium text-violet-700">
                    Overtime:
                  </span>
                  <span className="font-bold text-violet-800">
                    {totalOvertime}
                  </span>
                </div>
              </div>
            </div>
          )}

          <AttendanceTable
            rows={rowsToRender}
            isDrillDown={isDrillDown}
            loading={isDrillDown ? employeeMonthLoading : loading}
            onRowClick={openEmployeeMonth}
            onHalfDay={openHalfDayModal}
            
          />
        </TabsContent>
        <TabsContent value="shift" className="mt-6">
          <ShiftAssignment />
        </TabsContent>
      </Tabs>

      <HalfDayModal
        open={modal?.type === "halfday"}
        empName={modal?.type === "halfday" ? modal.empName : ""}
        dateLabel={selectedDateLabel}
        onOpenChange={(open) => !open && setModal(null)}
        onConfirm={confirmHalfDay}
      />

      <LeaveModal
        open={modal?.type === "leave"}
        empName={modal?.type === "leave" ? modal.empName : ""}
        leaveType={modal?.type === "leave" ? modal.leaveType : LEAVE_TYPES[0]}
        onOpenChange={(open) => !open && setModal(null)}
        onLeaveTypeChange={(value) =>
          setModal((prev) =>
            prev?.type === "leave" ? { ...prev, leaveType: value } : prev,
          )
        }
        onConfirm={confirmLeave}
      />
    </div>
  );
}
