// controllers/shiftAssignmentController.js

import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  createShiftAssignment,
  getShiftAssignmentById,
  getShiftAssignments,
} from "./shiftassignment.model.js";

export const createShiftAssignmentHandler = asyncHandler(async (req, res) => {
  const {
    employeeId,
    fromDate,
    toDate,
    shiftType,
    shiftTiming,
    weekOff,
    reason,
    isActive,
  } = req.body;

  if (!employeeId || !fromDate || !toDate || !shiftType) {
    throw new ApiError(
      400,
      "employeeId, fromDate, toDate and shiftType are required",
    );
  }

  const result = await createShiftAssignment({
    employeeId,
    fromDate,
    toDate,
    shiftType,
    shiftTiming,
    weekOff,
    reason,
    isActive: isActive ?? 1,
  });

  return res
    .status(201)
    .json(
      new ApiResponse(201, { id: result.insertId }, "Shift assignment created"),
    );
});

/**
 * GET /api/shift-assignments
 * Query: ?employeeId=&isActive=&fromDate=&toDate=
 */
export const getShiftAssignmentsHandler = asyncHandler(async (req, res) => {
  const { employeeId, isActive, fromDate, toDate } = req.query;

  const rows = await getShiftAssignments({
    employeeId,
    isActive,
    fromDate,
    toDate,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, rows, "Shift assignments fetched"));
});

/**
 * GET /api/shift-assignments/:id
 */
export const getShiftAssignmentByIdHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const row = await getShiftAssignmentById(id);

  if (!row) {
    throw new ApiError(404, "Shift assignment not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, row, "Shift assignment fetched"));
});

/**
 * GET /api/shift-assignments/employee/:employeeId
 */
export const getShiftAssignmentsByEmployeeHandler = asyncHandler(
  async (req, res) => {
    const { employeeId } = req.params;
    const rows = await getShiftAssignmentsByEmployee(employeeId);

    return res
      .status(200)
      .json(new ApiResponse(200, rows, "Employee shift history fetched"));
  },
);

/**
 * PUT /api/shift-assignments/:id
 * Body: any subset of { employeeId, fromDate, toDate, shiftType, shiftTiming, weekOff, reason, isActive }
 */
export const updateShiftAssignmentHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const existing = await getShiftAssignmentById(id);
  if (!existing) {
    throw new ApiError(404, "Shift assignment not found");
  }

  const result = await updateShiftAssignment(id, req.body);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { affectedRows: result.affectedRows },
        "Shift assignment updated",
      ),
    );
});

/**
 * DELETE /api/shift-assignments/:id
 * Query: ?hard=true to permanently delete, otherwise soft-deletes (is_active = 0)
 */
export const deleteShiftAssignmentHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const hardDelete = req.query.hard === "true";

  const existing = await getShiftAssignmentById(id);
  if (!existing) {
    throw new ApiError(404, "Shift assignment not found");
  }

  await deleteShiftAssignment(id, hardDelete);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        null,
        hardDelete
          ? "Shift assignment deleted permanently"
          : "Shift assignment deactivated",
      ),
    );
});
