import axiosInstance from "@/utils/axiosInstance"; // apna actual path daalna

interface AttendanceFilters {
  date?: string; // "2026-07-06"
  month?: string; // "2026-07"
  startDate?: string; // "2026-06-01"
  endDate?: string; // "2026-06-30"
  employeeId?: string | number;
  branchId?: string | number;
  departmentId?: string | number;
}

interface MarkAttendancePayload {
  employeeId: string | number;
  attendanceDate: string;
  status: "Present" | "Absent" | "Half Day" | "Leave" | "Holiday";
  punchIn?: string | null;
  punchOut?: string | null;
  shiftType?: "Regular" | "Temporary";
  shiftTiming?: string | null;
  leaveType?:
    | "Sick Leave"
    | "Casual Leave"
    | "Earned Leave"
    | "Unpaid Leave"
    | "Comp Off"
    | null;
  remarks?: string | null;
}

// Get attendance list (admin/HR view) with filters
export const getAttendance = async (filters: AttendanceFilters = {}) => {
  try {
    const response = await axiosInstance.get("/attendance", {
      params: filters,
    });

    if (response.data && response.data.success) {
      console.log(" response.data.data ", response.data.data);
      return response.data.data;
    } else {
      throw new Error(response.data.message || "Failed to fetch attendance");
    }
  } catch (error: any) {
    console.error(
      "Get Attendance Error:",
      error.response?.data || error.message,
    );
    throw error;
  }
};

// Get logged-in user's own attendance
// employeeId, branchId, departmentId omit — ye backend khud userId se decide karta hai
export const getMyAttendance = async (
  filters: Omit<
    AttendanceFilters,
    "employeeId" | "branchId" | "departmentId"
  > = {},
) => {
  try {
    const response = await axiosInstance.get("/attendance/me", {
      params: filters,
    });

    if (response.data && response.data.success) {
      return response.data.data;
    } else {
      throw new Error(
        response.data.message || "Failed to fetch your attendance",
      );
    }
  } catch (error: any) {
    console.error(
      "Get My Attendance Error:",
      error.response?.data || error.message,
    );
    throw error;
  }
};


export const markAttendance = async (payload: MarkAttendancePayload) => {
  try {
    const response = await axiosInstance.post("/attendance/mark", payload);

    if (response.data && response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || "Failed to mark attendance");
    }
  } catch (error: any) {
    console.error(
      "Mark Attendance Error:",
      error.response?.data || error.message,
    );
    throw error;
  }
};
