import { useEffect, useMemo, useState } from "react";
import { Users, UserPlus, Gift, Building2, ClipboardList } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAppDispatch, useAppSelector } from "@/hooks/useRedux";
import { RootState } from "@/redux/store";

import { daysBetween } from "@/utils/leaveUtils"; // ya jahan utility rakhi ho
import ApplyLeaveModal from "@/components/Leave/ApplyLeaveModal";
import BranchFilter from "@/components/FilterComponent/BranchFilter";

import {
  fetchHolidays,
  createHolidayThunk,
  updateHolidayThunk,
  deleteHolidayThunk,
} from "@/redux/features/Calendar/calendarSlice";

import {
  LeaveRequest,
  INITIAL_REQUESTS,
  TAB_CONTENT,
} from "@/components/Leave/Leaveutils";
import LeaveRequestsTab from "@/components/Leave/LeaveRequestsTab";
import AssignLeaveTab, {
  AssignLeaveFormData,
} from "@/components/Leave/AssignLeaveTab";
import HolidayManager from "@/components/Callender/Holidaymanager";
import DutyRoster from "@/components/Leave/Dutyroster";

function Leave() {
  const dispatch = useAppDispatch();

  const [activeTab, setActiveTab] = useState("leave");
  const headerContent = TAB_CONTENT[activeTab] ?? TAB_CONTENT.leave;

  /* ---------------- Leave requests state ---------------- */
  const [requests, setRequests] = useState<LeaveRequest[]>(INITIAL_REQUESTS);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");

  // In a real integration this would come from the logged-in employee /
  // current user in redux, same pattern as Attendance's currentEmployeeId.
  const currentEmployeeName = "You";
  const currentEmployeeDept = "—";

  const handleApply = (req: {
    leaveType: string;
    fromDate: string;
    toDate: string;
    reason: string;
  }) => {
    const newRequest: LeaveRequest = {
      id: `LR-${Math.floor(1000 + Math.random() * 9000)}`,
      employeeName: currentEmployeeName,
      department: currentEmployeeDept,
      leaveType: req.leaveType,
      fromDate: req.fromDate,
      toDate: req.toDate,
      days: daysBetween(req.fromDate, req.toDate),
      reason: req.reason,
      status: "Pending",
      appliedOn: new Date().toISOString().slice(0, 10),
    };
    setRequests((prev) => [newRequest, ...prev]);
    setModalOpen(false);
  };

  const handleAssign = (data: AssignLeaveFormData) => {
    const assigned: LeaveRequest = {
      id: `LR-${Math.floor(1000 + Math.random() * 9000)}`,
      employeeName: data.employeeName.trim(),
      department: data.department.trim() || "—",
      leaveType: data.leaveType,
      fromDate: data.fromDate,
      toDate: data.toDate,
      days: daysBetween(data.fromDate, data.toDate),
      reason: data.reason.trim() || "Assigned by admin",
      status: "Approved", // direct assign = pre-approved
      appliedOn: new Date().toISOString().slice(0, 10),
    };
    setRequests((prev) => [assigned, ...prev]);
  };

  const filteredRequests = useMemo(() => {
    const keyword = search.toLowerCase();
    return requests.filter(
      (r) =>
        r.employeeName.toLowerCase().includes(keyword) ||
        r.leaveType.toLowerCase().includes(keyword) ||
        r.department.toLowerCase().includes(keyword),
    );
  }, [requests, search]);

  const recentlyAssigned = useMemo(
    () => requests.filter((r) => r.reason === "Assigned by admin").slice(0, 5),
    [requests],
  );

  /* ---------------- Company Holiday state (moved in from AttendanceCalendar) ---------------- */
  const branches = useAppSelector((s: RootState) => s.branch.branches) ?? [];
  const {
    list: holidays,
    loading: holidaysLoading,
    creating,
  } = useAppSelector((s: RootState) => s.holiday);

  const today = new Date();
  const currentYear = today.getFullYear();
  const YEAR_OPTIONS = Array.from({ length: 6 }, (_, i) => currentYear - 1 + i);

  const [branch, setBranch] = useState<string>("");
  const [holidayYear, setHolidayYear] = useState<number>(currentYear);

  // Default to the first available branch once branches have loaded.
  useEffect(() => {
    if (!branch && branches.length > 0) {
      setBranch(String(branches[0].id));
    }
  }, [branches, branch]);

  const branchLabel =
    branches.find((b: any) => String(b.id) === branch)?.branch_name ??
    branches.find((b: any) => String(b.id) === branch)?.name ??
    "Branch";

  // Fetch holidays only when the Company Holiday tab is active — avoids an
  // unnecessary dispatch on first load when the user is on the Leave tab.
  useEffect(() => {
    if (activeTab !== "holiday" || !branch) return;
    dispatch(fetchHolidays({ branchId: branch, year: holidayYear }));
  }, [dispatch, activeTab, branch, holidayYear]);

  const branchHolidays = useMemo(
    () => holidays.filter((h) => String(h.branch_id) === branch),
    [holidays, branch],
  );

  const handleAddHoliday = async (data: {
    branchId: string;
    date: string;
    name: string;
  }) => {
    try {
      await dispatch(
        createHolidayThunk({
          branchId: data.branchId,
          date: data.date,
          name: data.name,
        }),
      ).unwrap();

      dispatch(fetchHolidays({ branchId: branch, year: holidayYear }));
    } catch (err) {
      console.error("Failed to add holiday:", err);
    }
  };

  const handleEditHoliday = async (data: {
    id: string;
    branchId: string;
    date: string;
    name: string;
  }) => {
    try {
      await dispatch(
        updateHolidayThunk({
          id: data.id,
          branchId: data.branchId,
          date: data.date,
          name: data.name,
        }),
      ).unwrap();

      dispatch(fetchHolidays({ branchId: branch, year: holidayYear }));
    } catch (err) {
      console.error("Failed to update holiday:", err);
    }
  };

  const handleRemoveHoliday = (id: string) => {
    dispatch(deleteHolidayThunk(id));
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* ---------- Header (same visual language as Attendance) ---------- */}
        <div
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl p-4 border-l-4"
          style={{ background: "#FFF7ED", borderColor: "#F97316" }}
        >
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "#166534" }}>
              {headerContent.title}
            </h1>
            <p className="text-sm mt-1" style={{ color: "#EA580C" }}>
              {headerContent.subtitle}
            </p>
          </div>

          <TabsList className="grid grid-cols-4 w-fit bg-white border border-orange-200">
            <TabsTrigger
              value="leave"
              className="gap-1.5 data-[state=active]:bg-orange-500 data-[state=active]:text-white"
            >
              <Users size={14} />
              Leave
            </TabsTrigger>
            <TabsTrigger
              value="assign"
              className="gap-1.5 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              <UserPlus size={14} />
              Assign Leave
            </TabsTrigger>
            <TabsTrigger
              value="holiday"
              className="gap-1.5 data-[state=active]:bg-green-600 data-[state=active]:text-white"
            >
              <Gift size={14} />
              Company Holiday
            </TabsTrigger>
            <TabsTrigger
              value="duty-roster"
              className="gap-1.5 data-[state=active]:bg-purple-600 data-[state=active]:text-white"
            >
              <ClipboardList size={14} />
              Duty Roster
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ---------- Leave Tab ---------- */}
        <TabsContent value="leave" className="mt-6">
          <LeaveRequestsTab
            requests={filteredRequests}
            search={search}
            onSearchChange={setSearch}
            onApplyClick={() => setModalOpen(true)}
          />
        </TabsContent>

        {/* ---------- Assign Leave Tab ---------- */}
        <TabsContent value="assign" className="mt-6">
          <AssignLeaveTab
            onAssign={handleAssign}
            recentlyAssigned={recentlyAssigned}
          />
        </TabsContent>

        {/* ---------- Company Holiday Tab ---------- */}
        <TabsContent value="holiday" className="space-y-4 mt-6">
          {/* Branch filter — Attendance.tsx jaisa hi plain usage */}
          <div className="flex items-center gap-2">
            <Building2 size={16} className="text-muted-foreground" />
            <BranchFilter value={branch} onChange={setBranch} />
          </div>

          <HolidayManager
            branch={branch}
            branchLabel={branchLabel}
            holidays={branchHolidays}
            loading={holidaysLoading}
            creating={creating}
            yearOptions={YEAR_OPTIONS}
            onAddHoliday={handleAddHoliday}
            onEditHoliday={handleEditHoliday}
            onRemoveHoliday={handleRemoveHoliday}
          />
        </TabsContent>

        {/* ---------- Duty Roster Tab ---------- */}
        <TabsContent value="duty-roster" className="mt-6">
          <DutyRoster />
        </TabsContent>
      </Tabs>

      <ApplyLeaveModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleApply}
      />
    </div>
  );
}

export default Leave;
