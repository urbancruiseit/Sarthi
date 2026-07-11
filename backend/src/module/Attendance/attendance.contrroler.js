// apna actual path daalna
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  getAttendanceByDate,
  getAttendanceByEmployeeMonth,
  markAttendance,
  updatePunchOut,
} from "./attendance.model.js";

const getAttendanceController = asyncHandler(async (req, res) => {
  const {
    date,
    month,
    startDate,
    endDate,
    employeeId,
    branchId,
    departmentId,
  } = req.query;

  const role = req.user.access_role;
  const userId = req.user.id;

  const filters = {
    branchId,
    departmentId,
  };

  // Current Month Helper
  const today = new Date();

  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
    .toISOString()
    .slice(0, 10);

  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    .toISOString()
    .slice(0, 10);

  if (employeeId) {
    filters.employeeId = employeeId;
    filters.startDate = firstDay;
    filters.endDate = lastDay;
  } else {
    /**
     * Other Filters
     */
    if (startDate && endDate) {
      filters.startDate = startDate;
      filters.endDate = endDate;
    } else if (month) {
      const [year, mon] = month.split("-").map(Number);

      const first = new Date(year, mon - 1, 1);
      const last = new Date(year, mon, 0);

      filters.startDate = first.toISOString().slice(0, 10);
      filters.endDate = last.toISOString().slice(0, 10);
    } else if (date) {
      filters.attendanceDate = date;
    }
  }

  /**
   * Role Based Restriction
   */

  switch (role) {
    case "EMPLOYEE":
      filters.employeeId = userId;

      filters.startDate = firstDay;
      filters.endDate = lastDay;
      delete filters.attendanceDate;
      break;

    case "TEAM_LEAD":
    case "MANAGER":
      filters.managerId = userId;
      break;

    case "HOD":
      filters.hodId = userId;
      break;

    case "ZONAL_HEAD":
      filters.zonalHeadId = userId;
      break;

    case "SUPER_ADMIN":
      break;

    default:
      filters.employeeId = userId;
      filters.startDate = firstDay;
      filters.endDate = lastDay;
      break;
  }

  const attendance = await getAttendanceByDate(filters);

  return res
    .status(200)
    .json(new ApiResponse(200, attendance, "Attendance fetched successfully"));
});

const getMyAttendanceController = asyncHandler(async (req, res) => {
  const employeeId = req.user.id; // JWT/auth middleware se aata hai
  const { month } = req.query;

  const attendance = await getAttendanceByEmployeeMonth({
    employeeId,
    month,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(200, attendance, "My attendance fetched successfully"),
    );
});

const markAttendanceController = asyncHandler(async (req, res) => {
  const employeeId = req.user?.id;
  const { attendanceDate, punchIn } = req.body;

  if (!employeeId) {
    throw new ApiError(401, "Unauthorized: employee id not found on request");
  }

  if (!attendanceDate || !punchIn) {
    throw new ApiError(400, "attendanceDate and punchIn are required");
  }

  const result = await markAttendance({
    employeeId,
    attendanceDate,
    status: "Pending",
    punchIn,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Attendance marked successfully"));
});

const updatePunchOutController = asyncHandler(async (req, res) => {
  const employeeId = req.user?.id;
  console.log();
  const { attendanceDate, punchOut, punch_out } = req.body;

  const finalPunchOut = punchOut || punch_out;

  if (!attendanceDate || !finalPunchOut) {
    throw new ApiError(400, "attendanceDate and punchOut are required");
  }

  const result = await updatePunchOut({
    employeeId,
    attendanceDate,
    punch_out: finalPunchOut,
    status: "Present",
  });

  if (result.affectedRows === 0) {
    throw new ApiError(
      404,
      "No attendance record found for this employee on this date",
    );
  }

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Punch-out updated successfully"));
});

export {
  getAttendanceController,
  getMyAttendanceController,
  markAttendanceController,
  updatePunchOutController,
};
