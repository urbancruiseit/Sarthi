import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import { createDutyRoster, getDutyRosterList } from "./dutyroster.model.js";

export const getDutyRosterListController = asyncHandler(async (req, res) => {
  const { isActive, employeeId } = req.query;

  const result = await getDutyRosterList({ isActive, employeeId });

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Duty roster fetched successfully"));
});

export const createDutyRosterController = asyncHandler(async (req, res) => {
  const { branchId, employeeId, dutyDate, status, isActive } = req.body;
  console.log(" req.body ", req.body);
  if (!branchId || !employeeId || !dutyDate || !status) {
    throw new ApiError(
      400,
      "branchId, employeeId, dutyDate and status are required",
    );
  }

  const result = await createDutyRoster({
    branchId,
    employeeId,
    dutyDate,
    status,
    isActive: isActive === undefined ? 1 : isActive,
  });

  return res
    .status(201)
    .json(
      new ApiResponse(201, result, "Duty roster entry created successfully"),
    );
});

export const updateDutyRosterController = asyncHandler(async (req, res) => {
  const {
    id,
    employeeId,
    dutyDate,
    dutyType,
    dutyTiming,
    location,
    remarks,
    isActive,
  } = req.body;

  if (!id) {
    throw new ApiError(400, "id is required");
  }

  if (!employeeId || !dutyDate || !dutyType) {
    throw new ApiError(400, "employeeId, dutyDate and dutyType are required");
  }

  const result = await updateDutyRoster({
    id,
    employeeId,
    dutyDate,
    dutyType,
    dutyTiming: dutyTiming ?? null,
    location: location ?? null,
    remarks: remarks ?? null,
    isActive: isActive === undefined ? 1 : isActive,
  });

  if (!result) {
    throw new ApiError(404, "Duty roster entry not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, result, "Duty roster entry updated successfully"),
    );
});

export const deactivateDutyRosterController = asyncHandler(async (req, res) => {
  const { id } = req.body;

  if (!id) {
    throw new ApiError(400, "id is required");
  }

  const result = await deactivateDutyRoster(id);

  if (!result || result.affectedRows === 0) {
    throw new ApiError(404, "Duty roster entry not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { id },
        "Duty roster entry deactivated successfully",
      ),
    );
});
