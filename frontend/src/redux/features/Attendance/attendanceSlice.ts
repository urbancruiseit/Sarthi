import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import {
  getAttendance,
  getMyAttendance,
  markAttendance,
} from "./attendanceApi";

export interface AttendanceRecord {
  employee_id: number;
  attendance_id?: number | null;

  firstName?: string;
  middleName?: string;
  lastName?: string;

  full_name: string;

  department_id?: number | null;
  department_name: string | null;

  branchOffice_id?: number | null;
  branch_name?: string | null;

  attendance_date: string | null;

  status: "Present" | "Absent" | "Half Day" | "Leave" | "Holiday" | "Pending" | null;

  punch_in: string | null;
  punch_out: string | null;

  // Final Shift (COALESCE)
  shift_type: string | null;
  shift_timing: string | null;

  // Permanent Shift
  permanent_shift_type?: string | null;
  permanent_shift_timing?: string | null;

  // Temporary Shift
  temporary_shift_type?: string | null;
  temporary_shift_timing?: string | null;

  week_off?: string | null;
  from_date?: string | null;
  to_date?: string | null;

  // Shift Source
  shift_source?: "Permanent" | "Temporary";

  leave_type: string | null;
  remarks: string | null;
}

export interface AttendanceFilters {
  date?: string; // "2026-07-06"
  month?: string; // "2026-07"
  startDate?: string; // "2026-06-01"
  endDate?: string; // "2026-06-30"
  employeeId?: string | number;
  branchId?: string | number;
  departmentId?: string | number;
}

interface AttendanceState {
  list: AttendanceRecord[];
  myAttendance: AttendanceRecord[];

  loading: boolean;
  marking: boolean;

  error: string | null;
}

const initialState: AttendanceState = {
  list: [],
  myAttendance: [],
  loading: false,
  marking: false,
  error: null,
};

// =======================
// Fetch All Attendance
// =======================

export const fetchAttendance = createAsyncThunk<
  AttendanceRecord[],
  AttendanceFilters
>("attendance/fetchAttendance", async (filters = {}, { rejectWithValue }) => {
  try {
    return await getAttendance(filters);
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

// =======================
// Fetch My Attendance
// =======================

export const fetchMyAttendance = createAsyncThunk<
  AttendanceRecord[],
  Omit<AttendanceFilters, "employeeId" | "branchId" | "departmentId">
>("attendance/fetchMyAttendance", async (filters = {}, { rejectWithValue }) => {
  try {
    return await getMyAttendance(filters);
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || error.message);
  }
});

// =======================
// Mark Attendance
// =======================

export const markEmployeeAttendance = createAsyncThunk(
  "attendance/markEmployeeAttendance",
  async (
    payload: Parameters<typeof markAttendance>[0],
    { rejectWithValue },
  ) => {
    try {
      return await markAttendance(payload);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  },
);

const attendanceSlice = createSlice({
  name: "attendance",
  initialState,

  reducers: {
    clearAttendanceError(state) {
      state.error = null;
    },

    clearAttendance(state) {
      state.list = [];
    },
  },

  extraReducers: (builder) => {
    builder

      .addCase(fetchAttendance.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(
        fetchAttendance.fulfilled,
        (state, action: PayloadAction<AttendanceRecord[]>) => {
          state.loading = false;
          state.list = action.payload;
        },
      )

      .addCase(fetchAttendance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // =======================
      // Fetch My Attendance
      // =======================

      .addCase(fetchMyAttendance.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(
        fetchMyAttendance.fulfilled,
        (state, action: PayloadAction<AttendanceRecord[]>) => {
          state.loading = false;
          state.myAttendance = action.payload;
        },
      )

      .addCase(fetchMyAttendance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // =======================
      // Mark Attendance
      // =======================

      .addCase(markEmployeeAttendance.pending, (state) => {
        state.marking = true;
        state.error = null;
      })

      .addCase(markEmployeeAttendance.fulfilled, (state) => {
        state.marking = false;
      })

      .addCase(markEmployeeAttendance.rejected, (state, action) => {
        state.marking = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearAttendanceError, clearAttendance } =
  attendanceSlice.actions;

export default attendanceSlice.reducer;
