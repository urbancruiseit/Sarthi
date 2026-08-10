import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { getCompOffs } from "./compOff.model.js";

const getCompOffController = asyncHandler(async (req, res) => {
  const { month, employeeId, branchId, departmentId, status } = req.query;

  const filters = {
    employeeId,
    branchId,
    departmentId,
    status,
  };

  // Month filter
  if (month) {
    const [year, mon] = month.split("-").map(Number);

    filters.startDate = new Date(year, mon - 1, 1).toISOString().slice(0, 10);

    filters.endDate = new Date(year, mon, 0).toISOString().slice(0, 10);
  }

  // Apply role-based filters
  applyRoleBasedFilters(filters, req);

  const compOffs = await getCompOffs(filters);

  return res
    .status(200)
    .json(new ApiResponse(200, compOffs, "Comp Off fetched successfully"));
});
export { getCompOffController };
