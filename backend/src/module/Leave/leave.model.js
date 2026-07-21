import { hrmsPool } from "../config/db.js";

export const createLeave = async (payload) => {
  const { uuid, employeeId, leaveType, fromDate, toDate, totalDays, reason } =
    payload;

  const [result] = await hrmsPool.execute(
    `
    INSERT INTO leaves (
      uuid,
      employee_id,
      leave_type,
      from_date,
      to_date,
      total_days,
      reason
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [uuid, employeeId, leaveType, fromDate, toDate, totalDays, reason],
  );

  return {
    id: result.insertId,
    ...payload,
  };
};

export const getLeavesByEmployee = async (employeeId) => {
  const [rows] = await hrmsPool.execute(
    `
    SELECT
      l.*,
      CONCAT(u.firstName,' ',u.lastName) AS employee_name
    FROM leaves l
    JOIN users u ON u.id = l.employee_id
    WHERE l.employee_id = ?
    ORDER BY l.created_at DESC
    `,
    [employeeId],
  );

  return rows;
};

export const getLeaveById = async (id) => {
  const [rows] = await hrmsPool.execute(
    `
    SELECT *
    FROM leaves
    WHERE id = ?
    LIMIT 1
    `,
    [id],
  );

  return rows[0] || null;
};
