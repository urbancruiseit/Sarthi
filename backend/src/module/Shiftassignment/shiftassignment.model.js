import { pool } from "../../config/mySqlDB.js";
export const createShiftAssignment = async ({
  employeeId,
  fromDate,
  toDate,
  shiftType,
  shiftTiming = null,
  weekOff = null,
  reason = null,
  isActive = 1,
}) => {
  try {
    const sql = `
      INSERT INTO employee_shift_override
        (
          employee_id,
          from_date,
          to_date,
          shift_type,
          shift_timing,
          week_off,
          reason,
          is_active
        )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      employeeId,
      fromDate,
      toDate,
      shiftType,
      shiftTiming,
      weekOff,
      reason,
      isActive,
    ];

    const [result] = await pool.execute(sql, params);
    return result;
  } catch (error) {
    console.error("createShiftAssignment error:", error);
    throw error;
  }
};

/**
 * Update an existing shift assignment by id.
 * Only fields passed in `fields` are updated (partial update).
 */
export const updateShiftAssignment = async (id, fields = {}) => {
  try {
    const allowed = [
      "employee_id",
      "from_date",
      "to_date",
      "shift_type",
      "shift_timing",
      "week_off",
      "reason",
      "is_active",
    ];

    const keyMap = {
      employeeId: "employee_id",
      fromDate: "from_date",
      toDate: "to_date",
      shiftType: "shift_type",
      shiftTiming: "shift_timing",
      weekOff: "week_off",
      reason: "reason",
      isActive: "is_active",
    };

    const setClauses = [];
    const params = [];

    for (const [key, value] of Object.entries(fields)) {
      const column = keyMap[key] ?? (allowed.includes(key) ? key : null);
      if (!column) continue;
      setClauses.push(`${column} = ?`);
      params.push(value);
    }

    if (setClauses.length === 0) {
      throw new Error("No valid fields provided to update");
    }

    params.push(id);

    const sql = `
      UPDATE employee_shift_override
      SET ${setClauses.join(", ")}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    const [result] = await pool.execute(sql, params);
    return result;
  } catch (error) {
    console.error("updateShiftAssignment error:", error);
    throw error;
  }
};

/**
 * Soft-delete (deactivate) a shift assignment instead of hard-deleting it,
 * so history is preserved. Pass hardDelete=true to actually remove the row.
 */
export const deleteShiftAssignment = async (id, hardDelete = false) => {
  try {
    if (hardDelete) {
      const [result] = await pool.execute(
        `DELETE FROM employee_shift_override WHERE id = ?`,
        [id],
      );
      return result;
    }

    const [result] = await pool.execute(
      `UPDATE employee_shift_override
       SET is_active = 0, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [id],
    );
    return result;
  } catch (error) {
    console.error("deleteShiftAssignment error:", error);
    throw error;
  }
};

/**
 * Fetch a single shift assignment by id, joined with employee name.
 */
export const getShiftAssignmentById = async (id) => {
  try {
    const sql = `
      SELECT
        es.*,
        CONCAT(u.firstName, ' ', u.lastName) AS full_name
      FROM employee_shift_override es
      LEFT JOIN users u ON u.id = es.employee_id
      WHERE es.id = ?
    `;

    const [rows] = await pool.execute(sql, [id]);
    return rows[0] ?? null;
  } catch (error) {
    console.error("getShiftAssignmentById error:", error);
    throw error;
  }
};

export const getShiftAssignments = async (filters = {}) => {
  try {
    const { employeeId, isActive, fromDate, toDate } = filters;

    const where = [];
    const params = [];

    if (employeeId) {
      where.push("es.employee_id = ?");
      params.push(employeeId);
    }

    if (isActive !== undefined && isActive !== null && isActive !== "") {
      where.push("es.is_active = ?");
      params.push(isActive);
    }

    // Overlap-style range filter: shifts active anywhere within the given window.
    if (fromDate) {
      where.push("es.to_date >= ?");
      params.push(fromDate);
    }
    if (toDate) {
      where.push("es.from_date <= ?");
      params.push(toDate);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const sql = `
  SELECT
    es.*,
    CONCAT(u.firstName, ' ', u.lastName) AS full_name
  FROM employee_shift_override es
  LEFT JOIN users u ON u.id = es.employee_id
  ${whereSql}
  ORDER BY es.from_date DESC, es.id DESC
`;

    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    console.error("getShiftAssignments error:", error);
    throw error;
  }
};

/**
 * Fetch all shift assignments for one employee (history view).
 */
export const getShiftAssignmentsByEmployee = async (employeeId) => {
  try {
    const sql = `
      SELECT *
      FROM employee_shift_override
      WHERE employee_id = ?
      ORDER BY from_date DESC
    `;
    const [rows] = await pool.execute(sql, [employeeId]);
    return rows;
  } catch (error) {
    console.error("getShiftAssignmentsByEmployee error:", error);
    throw error;
  }
};
