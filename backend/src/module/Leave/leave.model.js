import { v4 as uuidv4 } from "uuid";
import { pool } from "../../config/mySqlDB.js";

export const applyLeave = async ({
  employeeId,
  leaveType,
  fromDate,
  toDate,
  totalDays,
  reason,
}) => {
  try {
    const uuid = uuidv4();

    const sql = `
      INSERT INTO leaves
      (
        uuid,
        employee_id,
        leave_type,
        from_date,
        to_date,
        total_days,
        reason,
        status,
        applied_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending', NOW())
    `;

    const [result] = await pool.execute(sql, [
      uuid,
      employeeId,
      leaveType,
      fromDate,
      toDate,
      totalDays,
      reason,
    ]);

    return {
      ...result,
      uuid,
    };
  } catch (error) {
    console.error("applyLeave error:", error);
    throw error;
  }
};

// ---------- Approve / Reject Leave ----------
export const updateLeaveStatus = async ({
  leaveId,
  status, // 'Approved' | 'Rejected'
  approvedBy,
  rejectionReason = null,
}) => {
  try {
    const sql = `
      UPDATE leaves
      SET
        status = ?,
        approved_by = ?,
        approved_at = NOW(),
        rejection_reason = ?
      WHERE id = ?
    `;

    const [result] = await pool.execute(sql, [
      status,
      approvedBy,
      status === "Rejected" ? rejectionReason : null,
      leaveId,
    ]);

    return result;
  } catch (error) {
    console.error("updateLeaveStatus error:", error);
    throw error;
  }
};

// ---------- Get Leaves (by employee) ----------
export const getLeavesByEmployee = async (employeeId) => {
  try {
    const [rows] = await pool.execute(
      `SELECT * FROM leaves WHERE employee_id = ? ORDER BY applied_at DESC`,
      [employeeId],
    );
    return rows;
  } catch (error) {
    console.error("getLeavesByEmployee error:", error);
    throw error;
  }
};

// ---------- Get Single Leave ----------
export const getLeaveById = async (leaveId) => {
  try {
    const [rows] = await pool.execute(`SELECT * FROM leaves WHERE id = ?`, [
      leaveId,
    ]);
    return rows[0] || null;
  } catch (error) {
    console.error("getLeaveById error:", error);
    throw error;
  }
};

export const getAllLeaves = async ({
  status,
  leaveType,
  employeeId,
  branchId,
  departmentId,
  fromDate,
  toDate,
  search,
  page = 1,
  limit = 20,
} = {}) => {
  try {
    const conditions = [];
    const params = [];

    if (status) {
      conditions.push("l.status = ?");
      params.push(status);
    }

    if (leaveType) {
      conditions.push("l.leave_type = ?");
      params.push(leaveType);
    }

    if (employeeId) {
      conditions.push("l.employee_id = ?");
      params.push(employeeId);
    }

    if (branchId) {
      conditions.push("u.branch_id = ?");
      params.push(branchId);
    }

    if (departmentId) {
      conditions.push("u.department_id = ?");
      params.push(departmentId);
    }

    // Overlap with given range: leave.from_date <= toDate AND leave.to_date >= fromDate
    if (fromDate) {
      conditions.push("l.to_date >= ?");
      params.push(fromDate);
    }

    if (toDate) {
      conditions.push("l.from_date <= ?");
      params.push(toDate);
    }

    if (search) {
      conditions.push("(u.name LIKE ? OR u.employee_code LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    const offset = (Number(page) - 1) * Number(limit);

    // Total count for pagination
    const [countRows] = await pool.execute(
      `
      SELECT COUNT(*) AS total
      FROM leaves l
      LEFT JOIN users u ON u.id = l.employee_id
      ${whereClause}
      `,
      params,
    );

    const total = countRows[0]?.total || 0;

    // Actual rows
    const [rows] = await pool.execute(
      `
      SELECT
        l.*,
        u.name AS employee_name,
        u.employee_code,
        u.department_id,
        u.branch_id,
        approver.name AS approved_by_name
      FROM leaves l
      LEFT JOIN users u ON u.id = l.employee_id
      LEFT JOIN users approver ON approver.id = l.approved_by
      ${whereClause}
      ORDER BY l.applied_at DESC
      LIMIT ? OFFSET ?
      `,
      [...params, Number(limit), offset],
    );

    return {
      leaves: rows,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    };
  } catch (error) {
    console.error("getAllLeaves error:", error);
    throw error;
  }
};
