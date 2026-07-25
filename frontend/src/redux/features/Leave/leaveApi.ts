import {
  ApplyLeavePayload,
  LeaveFilters,
  UpdateLeaveStatusPayload,
} from "@/components/Leave/Leaveutils";
import axiosInstance from "@/utils/axiosInstance";

export const applyLeave = async (payload: ApplyLeavePayload) => {
  try {
    const response = await axiosInstance.post("/leaves", payload);

    if (response.data?.success) {
      return response.data.data;
    }

    throw new Error(response.data?.message || "Failed to apply leave");
  } catch (error: any) {
    console.error("Apply Leave Error:", error.response?.data || error.message);
    throw error;
  }
};

export const updateLeaveStatus = async (payload: UpdateLeaveStatusPayload) => {
  try {
    const response = await axiosInstance.patch(
      "/leaves/update-status",
      payload,
    );

    if (response.data?.success) {
      return response.data.data;
    }

    throw new Error(response.data?.message || "Failed to update leave status");
  } catch (error: any) {
    console.error(
      "Update Leave Status Error:",
      error.response?.data || error.message,
    );
    throw error;
  }
};

export const getMyLeaves = async (
  filters: Omit<LeaveFilters, "employeeId"> = {},
) => {
  try {
    const response = await axiosInstance.get("/leaves/my-leaves", {
      params: filters,
    });

    if (response.data?.success) {
      return response.data.data;
    }

    throw new Error(response.data?.message || "Failed to fetch my leaves");
  } catch (error: any) {
    console.error(
      "Get My Leaves Error:",
      error.response?.data || error.message,
    );
    throw error;
  }
};

export const getLeaveById = async (leaveId: number) => {
  try {
    const response = await axiosInstance.get(`/leaves/${leaveId}`);

    if (response.data?.success) {
      return response.data.data;
    }

    throw new Error(response.data?.message || "Failed to fetch leave");
  } catch (error: any) {
    console.error("Get Leave Error:", error.response?.data || error.message);
    throw error;
  }
};

export const getAllLeaves = async (filters: LeaveFilters = {}) => {
  try {
    const response = await axiosInstance.get("/leaves", {
      params: filters,
    });

    if (response.data?.success) {
      return response.data.data;
    }

    throw new Error(response.data?.message || "Failed to fetch leaves");
  } catch (error: any) {
    console.error(
      "Get All Leaves Error:",
      error.response?.data || error.message,
    );
    throw error;
  }
};
