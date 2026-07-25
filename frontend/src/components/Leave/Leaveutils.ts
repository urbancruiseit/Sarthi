export type LeaveStatus = "Pending" | "Approved" | "Rejected";

export interface LeaveRequest {
  id: number;
  uuid: string;
  employee_id: number;
  employeeName: string;
  leave_type: string;
  department: string;
  from_date: string;
  to_date: string;
  total_days: number;
  reason: string | null;
  status: "Pending" | "Approved" | "Rejected";
  applied_at: string;
  approved_by: number | null;
  approved_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}
export interface LeaveFilters {
  employeeId?: number;
  status?: "Pending" | "Approved" | "Rejected";
  leaveType?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}

export interface ApplyLeavePayload {
  leaveType: string;
  fromDate: string;
  toDate: string;
  totalDays: number;
  reason?: string;
}

export interface UpdateLeaveStatusPayload {
  leaveId: number;
  status: "Approved" | "Rejected";
  rejectionReason?: string;
}

export interface Holiday {
  id: string;
  branchId: string;
  name: string;
  date: string;
}

export const LEAVE_TYPES = ["Short PL", "Long PL", "Comp Off", "Unpaid Leave"];

export const STATUS_STYLES: Record<LeaveStatus, { bg: string; color: string }> =
  {
    Pending: { bg: "#FEF3C7", color: "#B45309" },
    Approved: { bg: "#DCFCE7", color: "#166534" },
    Rejected: { bg: "#FEE2E2", color: "#B91C1C" },
  };

export const INITIAL_REQUESTS: LeaveRequest[] = [
  {
    id: "LR-1042",
    employeeName: "Aditi Sharma",
    department: "Sales",
    leaveType: "Casual Leave",
    fromDate: "2026-07-18",
    toDate: "2026-07-19",
    days: 2,
    reason: "Family function",
    status: "Pending",
    appliedOn: "2026-07-14",
  },
  {
    id: "LR-1041",
    employeeName: "Rohit Verma",
    department: "IT",
    leaveType: "Sick Leave",
    fromDate: "2026-07-12",
    toDate: "2026-07-12",
    days: 1,
    reason: "Fever",
    status: "Approved",
    appliedOn: "2026-07-11",
  },
  {
    id: "LR-1040",
    employeeName: "Priya Nair",
    department: "Finance",
    leaveType: "Earned Leave",
    fromDate: "2026-07-05",
    toDate: "2026-07-09",
    days: 5,
    reason: "Personal travel",
    status: "Rejected",
    appliedOn: "2026-06-28",
  },
];

// Placeholder branches — backend ready hone tak local list.
export const MOCK_BRANCHES = [
  { id: "1", name: "Head Office" },
  { id: "2", name: "Delhi Branch" },
  { id: "3", name: "Mumbai Branch" },
];

// Placeholder company holiday list — backend ready hone tak local mock data.
export const INITIAL_HOLIDAYS: Holiday[] = [
  { id: "H-1", branchId: "1", name: "Republic Day", date: "2026-01-26" },
  { id: "H-2", branchId: "1", name: "Holi", date: "2026-03-04" },
  { id: "H-3", branchId: "1", name: "Independence Day", date: "2026-08-15" },
  { id: "H-4", branchId: "2", name: "Gandhi Jayanti", date: "2026-10-02" },
  { id: "H-5", branchId: "2", name: "Diwali", date: "2026-11-08" },
  { id: "H-6", branchId: "3", name: "Christmas", date: "2026-12-25" },
];

// Tab-wise header content.
export const TAB_CONTENT: Record<string, { title: string; subtitle: string }> =
  {
    leave: {
      title: "Leave Management",
      subtitle: "Apply for leave and track request status",
    },
    assign: {
      title: "Leave Assignment",
      subtitle: "Assign leave directly to an employee",
    },
    holiday: {
      title: "Company Holidays",
      subtitle: "List of official company holidays",
    },
  };
