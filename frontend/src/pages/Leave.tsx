import { useEffect, useMemo, useState } from "react";
import {
  Users,
  UserPlus,
  Gift,
  Building2,
  ClipboardList,
  CalendarClock,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAppDispatch, useAppSelector } from "@/hooks/useRedux";
import { RootState } from "@/redux/store";
// apne actual path se update kar lena

import { daysBetween } from "@/utils/leaveUtils";
import ApplyLeaveModal from "@/components/Leave/ApplyLeaveModal";
import BranchFilter from "@/components/FilterComponent/BranchFilter";

import {
  fetchHolidays,
  createHolidayThunk,
  updateHolidayThunk,
  deleteHolidayThunk,
} from "@/redux/features/Calendar/calendarSlice";

import { LeaveRequest, TAB_CONTENT } from "@/components/Leave/Leaveutils";
import LeaveRequestsTab from "@/components/Leave/LeaveRequestsTab";
import AssignLeaveTab, {
  AssignLeaveFormData,
} from "@/components/Leave/AssignLeaveTab";
import HolidayManager from "@/components/Callender/Holidaymanager";
import DutyRoster from "@/components/Leave/Dutyroster";

import {
  applyLeaveThunk,
  getMyLeavesThunk,
} from "@/redux/features/Leave/leaveSlice";
import CompOffTable from "@/components/Leave/Compofftable";
import { useAccessControl } from "@/utils/Accesscontrol";

function Leave() {
  const dispatch = useAppDispatch();
  const { isSuperAdmin } = useAccessControl();

  // Non-super-admin ko sirf Comp Off tab dikhega, baaki sab hidden
  const [activeTab, setActiveTab] = useState("compoff");
  const headerContent = TAB_CONTENT[activeTab] ?? TAB_CONTENT.leave;

  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");

  const currentEmployeeName = "You";
  const currentEmployeeDept = "—";

  const { myLeaves, loading: leavesLoading } = useAppSelector(
    (s: RootState) => s.leave,
  );

  // Super admin ke liye default "leave" tab, baaki sab ke liye "compoff"
  useEffect(() => {
    setActiveTab(isSuperAdmin ? "leave" : "compoff");
  }, [isSuperAdmin]);

  useEffect(() => {
    if (activeTab === "leave") {
      dispatch(getMyLeavesThunk());
    }
  }, [dispatch, activeTab]);

  const requests: LeaveRequest[] = useMemo(
    () =>
      myLeaves.map((l) => ({
        id: l.uuid,
        employeeName: currentEmployeeName,
        department: currentEmployeeDept,
        leaveType: l.leave_type,
        fromDate: l.from_date,
        toDate: l.to_date,
        days: l.total_days,
        reason: l.reason ?? "",
        status: l.status,
        appliedOn: l.applied_at?.slice(0, 10) ?? "",
      })),
    [myLeaves],
  );

  const handleApply = async (data: {
    leaveType: string;
    fromDate: string;
    toDate: string;
    reason: string;
  }) => {
    try {
      await dispatch(
        applyLeaveThunk({
          leaveType: data.leaveType,
          fromDate: data.fromDate,
          toDate: data.toDate,
          totalDays: daysBetween(data.fromDate, data.toDate),
          reason: data.reason,
        }),
      ).unwrap();

      setModalOpen(false);
      dispatch(getMyLeavesThunk());
    } catch (err) {
      console.error("Failed to apply leave:", err);
    }
  };

  const handleAssign = (data: AssignLeaveFormData) => {
    console.log("Assign leave (not yet wired to API):", data);
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

  useEffect(() => {
    if (!branch && branches.length > 0) {
      setBranch(String(branches[0].id));
    }
  }, [branches, branch]);

  const branchLabel =
    branches.find((b: any) => String(b.id) === branch)?.branch_name ??
    branches.find((b: any) => String(b.id) === branch)?.name ??
    "Branch";

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

          <TabsList
            className={`grid w-fit bg-white border border-orange-200 ${
              isSuperAdmin ? "grid-cols-5" : "grid-cols-1"
            }`}
          >
            {/* Super admin ke alawa sabko sirf ye ek tab dikhega */}
            <TabsTrigger
              value="compoff"
              className="gap-1.5 data-[state=active]:bg-teal-600 data-[state=active]:text-white"
            >
              <CalendarClock size={14} />
              Comp Off
            </TabsTrigger>

            {isSuperAdmin && (
              <>
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
              </>
            )}
          </TabsList>
        </div>

        {/* ---------- Comp Off Tab — sabko dikhta hai ---------- */}
        <TabsContent value="compoff" className="mt-6">
          <CompOffTable />
        </TabsContent>

        {/* ---------- Baaki sab tabs sirf Super Admin ke liye ---------- */}
        {isSuperAdmin && (
          <>
            <TabsContent value="leave" className="mt-6">
              <LeaveRequestsTab
                requests={filteredRequests}
                search={search}
                onSearchChange={setSearch}
                onApplyClick={() => setModalOpen(true)}
                loading={leavesLoading}
              />
            </TabsContent>

            <TabsContent value="assign" className="mt-6">
              <AssignLeaveTab
                onAssign={handleAssign}
                recentlyAssigned={recentlyAssigned}
              />
            </TabsContent>

            <TabsContent value="holiday" className="space-y-4 mt-6">
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

            <TabsContent value="duty-roster" className="mt-6">
              <DutyRoster />
            </TabsContent>
          </>
        )}
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
