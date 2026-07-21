import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import {
  getDutyRosterList,
  createDutyRoster,
  updateDutyRoster,
  deactivateDutyRoster,
  DutyRosterRecord,
  DutyRosterPayload,
  DutyRosterListParams,
} from "@/redux/features/Dutyroster/Dutyrosterapi";

export type { DutyRosterRecord, DutyRosterPayload };

interface DutyRosterState {
  list: DutyRosterRecord[];
  loading: boolean;
  creating: boolean;
  error: string | null;
}

const initialState: DutyRosterState = {
  list: [],
  loading: false,
  creating: false,
  error: null,
};

export const fetchDutyRosters = createAsyncThunk(
  "dutyRoster/fetchAll",
  async (params: DutyRosterListParams | undefined, { rejectWithValue }) => {
    try {
      return await getDutyRosterList(params);
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to fetch duty roster",
      );
    }
  },
);

export const createDutyRosterThunk = createAsyncThunk(
  "dutyRoster/create",
  async (payload: DutyRosterPayload, { rejectWithValue }) => {
    try {
      return await createDutyRoster(payload);
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to create duty roster entry",
      );
    }
  },
);

export const updateDutyRosterThunk = createAsyncThunk(
  "dutyRoster/update",
  async (
    { id, payload }: { id: number; payload: DutyRosterPayload },
    { rejectWithValue },
  ) => {
    try {
      return await updateDutyRoster({ ...payload, id });
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to update duty roster entry",
      );
    }
  },
);

export const deleteDutyRosterThunk = createAsyncThunk(
  "dutyRoster/delete",
  async ({ id }: { id: number }, { rejectWithValue }) => {
    try {
      return await deactivateDutyRoster(id);
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to deactivate duty roster entry",
      );
    }
  },
);

const dutyRosterSlice = createSlice({
  name: "dutyRoster",
  initialState,
  reducers: {
    clearDutyRosterError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetch
      .addCase(fetchDutyRosters.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchDutyRosters.fulfilled,
        (state, action: PayloadAction<DutyRosterRecord[]>) => {
          state.loading = false;
          state.list = action.payload;
        },
      )
      .addCase(fetchDutyRosters.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) || "Failed to load duty roster";
      })
      // create
      .addCase(createDutyRosterThunk.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(
        createDutyRosterThunk.fulfilled,
        (state, action: PayloadAction<DutyRosterRecord>) => {
          state.creating = false;
          state.list = [action.payload, ...state.list];
        },
      )
      .addCase(createDutyRosterThunk.rejected, (state, action) => {
        state.creating = false;
        state.error = (action.payload as string) || "Failed to create entry";
      })
      // update
      .addCase(
        updateDutyRosterThunk.fulfilled,
        (state, action: PayloadAction<DutyRosterRecord>) => {
          state.list = state.list.map((r) =>
            r.id === action.payload.id ? action.payload : r,
          );
        },
      )
      .addCase(updateDutyRosterThunk.rejected, (state, action) => {
        state.error = (action.payload as string) || "Failed to update entry";
      })
      // deactivate
      .addCase(
        deleteDutyRosterThunk.fulfilled,
        (state, action: PayloadAction<number>) => {
          state.list = state.list.map((r) =>
            r.id === action.payload ? { ...r, is_active: 0 } : r,
          );
        },
      )
      .addCase(deleteDutyRosterThunk.rejected, (state, action) => {
        state.error =
          (action.payload as string) || "Failed to deactivate entry";
      });
  },
});

export const { clearDutyRosterError } = dutyRosterSlice.actions;
export default dutyRosterSlice.reducer;
