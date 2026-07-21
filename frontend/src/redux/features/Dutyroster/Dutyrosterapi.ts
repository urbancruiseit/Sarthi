import axiosInstance from "@/utils/axiosInstance";

export interface DutyRosterRecord {
  id: number;
  branch_id: number;
  branch_name?: string;

  employee_id: number;
  employee_name?: string;
  full_name?: string;

  duty_date: string;
  status: "Present" | "Absent";

  is_active: 0 | 1;

  created_at?: string;
  updated_at?: string;
}

export interface DutyRosterPayload {
  branchId: number;
  employeeId: number;
  dutyDate: string;
  status: "Present" | "Absent";
  isActive: 0 | 1;
}

export interface DutyRosterListParams {
  isActive?: string;
  employeeId?: string;
  branchId?: string;
}

export const getDutyRosterList = async (
  params?: DutyRosterListParams,
): Promise<DutyRosterRecord[]> => {
  const response = await axiosInstance.get("/duty-roster", { params });

  if (!response.data?.success) {
    throw new Error(response.data?.message || "Failed to fetch duty roster");
  }

  return response.data.data;
};

export const createDutyRoster = async (
  payload: DutyRosterPayload,
): Promise<DutyRosterRecord> => {
  console.log(" payload ", payload);
  const response = await axiosInstance.post("/duty-roster", payload);

  if (!response.data?.success) {
    throw new Error(
      response.data?.message || "Failed to create duty roster entry",
    );
  }

  return response.data.data;
};

export const updateDutyRoster = async (
  payload: DutyRosterPayload & { id: number },
): Promise<DutyRosterRecord> => {
  const response = await axiosInstance.put("/duty-roster/update", payload);

  if (!response.data?.success) {
    throw new Error(
      response.data?.message || "Failed to update duty roster entry",
    );
  }

  return response.data.data;
};

export const deactivateDutyRoster = async (id: number): Promise<number> => {
  const response = await axiosInstance.put("/duty-roster/deactivate", { id });

  if (!response.data?.success) {
    throw new Error(
      response.data?.message || "Failed to deactivate duty roster entry",
    );
  }

  return id;
};
