import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  applyLeave,
  getLeaveById,
  getLeavesByEmployee,
  updateLeaveStatus,
} from "./leave.model.js";

const applyLeaveController = asyncHandler(async (req, res) => {
  const employeeId = req.user?.id;
  const { leaveType, fromDate, toDate, totalDays, reason } = req.body;

  if (!employeeId) {
    throw new ApiError(401, "Unauthorized: employee id not found on request");
  }

  if (!leaveType || !fromDate || !toDate || !totalDays) {
    throw new ApiError(
      400,
      "leaveType, fromDate, toDate and totalDays are required",
    );
  }

  const result = await applyLeave({
    employeeId,
    leaveType,
    fromDate,
    toDate,
    totalDays,
    reason,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, result, "Leave applied successfully"));
});

const updateLeaveStatusController = asyncHandler(async (req, res) => {
  const approvedBy = req.user?.id;
  const { leaveId, status, rejectionReason } = req.body;

  if (!approvedBy) {
    throw new ApiError(401, "Unauthorized: approver id not found on request");
  }

  if (!leaveId || !status) {
    throw new ApiError(400, "leaveId and status are required");
  }

  if (!["Approved", "Rejected"].includes(status)) {
    throw new ApiError(400, "status must be 'Approved' or 'Rejected'");
  }

  if (status === "Rejected" && !rejectionReason) {
    throw new ApiError(400, "rejectionReason is required when rejecting");
  }

  const result = await updateLeaveStatus({
    leaveId,
    status,
    approvedBy,
    rejectionReason,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        result,
        `Leave ${status.toLowerCase()} successfully`,
      ),
    );
});

const getMyLeavesController = asyncHandler(async (req, res) => {
  const employeeId = req.user?.id;

  if (!employeeId) {
    throw new ApiError(401, "Unauthorized: employee id not found on request");
  }

  const leaves = await getLeavesByEmployee(employeeId);

  return res
    .status(200)
    .json(new ApiResponse(200, leaves, "Leaves fetched successfully"));
});

const getLeaveByIdController = asyncHandler(async (req, res) => {
  const { leaveId } = req.params;

  if (!leaveId) {
    throw new ApiError(400, "leaveId is required");
  }

  const leave = await getLeaveById(leaveId);

  if (!leave) {
    throw new ApiError(404, "Leave not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, leave, "Leave fetched successfully"));
});

const getAllLeavesController = asyncHandler(async (req, res) => {
  const {
    status,
    leaveType,
    employeeId,
    branchId,
    departmentId,
    fromDate,
    toDate,
    search,
    page,
    limit,
  } = req.query;

  const result = await getAllLeaves({
    status,
    leaveType,
    employeeId: employeeId ? Number(employeeId) : undefined,
    branchId: branchId ? Number(branchId) : undefined,
    departmentId: departmentId ? Number(departmentId) : undefined,
    fromDate,
    toDate,
    search,
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : 20,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Leaves fetched successfully"));
});

export {
  applyLeaveController,
  updateLeaveStatusController,
  getMyLeavesController,
  getLeaveByIdController,
  getAllLeavesController,
};
