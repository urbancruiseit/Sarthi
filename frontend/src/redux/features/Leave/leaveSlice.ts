import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import {
  applyLeave,
  updateLeaveStatus,
  getMyLeaves,
  getLeaveById,
  getAllLeaves,
} from "./leaveApi";

import {
  LeaveFilters,
  ApplyLeavePayload,
  UpdateLeaveStatusPayload,
  LeaveRequest,
} from "@/components/Leave/Leaveutils";

export const applyLeaveThunk = createAsyncThunk(
  "leave/apply",
  async (payload: ApplyLeavePayload, { rejectWithValue }) => {
    try {
      return await applyLeave(payload);
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to apply leave",
      );
    }
  },
);

export const updateLeaveStatusThunk = createAsyncThunk(
  "leave/updateStatus",
  async (payload: UpdateLeaveStatusPayload, { rejectWithValue }) => {
    try {
      return await updateLeaveStatus(payload);
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update leave status",
      );
    }
  },
);

export const getMyLeavesThunk = createAsyncThunk(
  "leave/getMyLeaves",
  async (
    filters: Omit<LeaveFilters, "employeeId"> = {},
    { rejectWithValue },
  ) => {
    try {
      return await getMyLeaves(filters);
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch my leaves",
      );
    }
  },
);

export const getLeaveByIdThunk = createAsyncThunk(
  "leave/getById",
  async (leaveId: number, { rejectWithValue }) => {
    try {
      return await getLeaveById(leaveId);
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch leave",
      );
    }
  },
);

export const getAllLeavesThunk = createAsyncThunk(
  "leave/getAll",
  async (filters: LeaveFilters = {}, { rejectWithValue }) => {
    try {
      return await getAllLeaves(filters);
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch leaves",
      );
    }
  },
);

// ---------- State ----------

interface LeaveState {
  leaves: LeaveRequest[];
  myLeaves: LeaveRequest[];
  currentLeave: LeaveRequest | null;
  loading: boolean;
  error: string | null;
}

const initialState: LeaveState = {
  leaves: [],
  myLeaves: [],
  currentLeave: null,
  loading: false,
  error: null,
};

const leaveSlice = createSlice({
  name: "leave",
  initialState,
  reducers: {
    clearCurrentLeave: (state) => {
      state.currentLeave = null;
    },
    clearLeaveError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Apply Leave
      .addCase(applyLeaveThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        applyLeaveThunk.fulfilled,
        (state, action: PayloadAction<LeaveRequest>) => {
          state.loading = false;
          state.myLeaves.unshift(action.payload);
        },
      )
      .addCase(applyLeaveThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Update Leave Status
      .addCase(updateLeaveStatusThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateLeaveStatusThunk.fulfilled, (state, action) => {
        state.loading = false;
        const updated = action.payload;
        state.leaves = state.leaves.map((leave) =>
          leave.id === updated.id ? { ...leave, ...updated } : leave,
        );
        if (state.currentLeave?.id === updated.id) {
          state.currentLeave = { ...state.currentLeave, ...updated };
        }
      })
      .addCase(updateLeaveStatusThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Get My Leaves
      .addCase(getMyLeavesThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        getMyLeavesThunk.fulfilled,
        (state, action: PayloadAction<LeaveRequest[]>) => {
          state.loading = false;
          state.myLeaves = action.payload;
        },
      )
      .addCase(getMyLeavesThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Get Leave By Id
      .addCase(getLeaveByIdThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        getLeaveByIdThunk.fulfilled,
        (state, action: PayloadAction<LeaveRequest>) => {
          state.loading = false;
          state.currentLeave = action.payload;
        },
      )
      .addCase(getLeaveByIdThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Get All Leaves
      .addCase(getAllLeavesThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        getAllLeavesThunk.fulfilled,
        (state, action: PayloadAction<LeaveRequest[]>) => {
          state.loading = false;
          state.leaves = action.payload;
        },
      )
      .addCase(getAllLeavesThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearCurrentLeave, clearLeaveError } = leaveSlice.actions;
export default leaveSlice.reducer;
