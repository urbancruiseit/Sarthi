import { pool } from "../../config/mySqlDB.js";

export const getDutyRosterList = async ({ isActive, employeeId } = {}) => {
  try {
    const conditions = [];
    const params = [];

    if (isActive !== undefined && isActive !== null && isActive !== "") {
      conditions.push("dr.is_active = ?");
      params.push(isActive);
    }

    if (employeeId) {
      conditions.push("dr.employee_id = ?");
      params.push(employeeId);
    }

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    const sql = `
      SELECT
        dr.id,
        dr.employee_id,
        u.full_name,
        dr.duty_date,
        dr.duty_type,
        dr.duty_timing,
        dr.location,
        dr.remarks,
        dr.is_active
      FROM duty_roster dr
      LEFT JOIN users u ON u.id = dr.employee_id
      ${whereClause}
      ORDER BY dr.duty_date DESC, dr.id DESC
    `;

    const [rows] = await pool.execute(sql, params);

    return rows;
  } catch (error) {
    console.error("getDutyRosterList error:", error);
    throw error;
  }
};

export const createDutyRoster = async ({
  branchId,
  employeeId,
  dutyDate,
  status,
  isActive = 1,
}) => {
  try {
    const sql = `
      INSERT INTO duty_roster
      (
        branch_id,
        employee_id,
        duty_date,
        status,
        is_active
      )
      VALUES (?, ?, ?, ?, ?)
    `;

    const [result] = await pool.execute(sql, [
      branchId,
      employeeId,
      dutyDate,
      status,
      isActive,
    ]);

    const [rows] = await pool.execute(
      `
      SELECT
        dr.id,
        dr.branch_id,
        b.branch_name,
        dr.employee_id,
        u.full_name,
        dr.duty_date,
        dr.status,
        dr.is_active,
        dr.created_at,
        dr.updated_at
      FROM duty_roster dr
      LEFT JOIN users u
        ON u.id = dr.employee_id
      LEFT JOIN branches b
        ON b.id = dr.branch_id
      WHERE dr.id = ?
      `,
      [result.insertId],
    );

    return rows[0];
  } catch (error) {
    console.error("createDutyRoster error:", error);
    throw error;
  }
};
export const updateDutyRoster = async ({
  id,
  employeeId,
  dutyDate,
  dutyType,
  dutyTiming = null,
  location = null,
  remarks = null,
  isActive = 1,
}) => {
  try {
    const sql = `
      UPDATE duty_roster
      SET
        employee_id = ?,
        duty_date = ?,
        duty_type = ?,
        duty_timing = ?,
        location = ?,
        remarks = ?,
        is_active = ?
      WHERE id = ?
    `;

    await pool.execute(sql, [
      employeeId,
      dutyDate,
      dutyType,
      dutyTiming,
      location,
      remarks,
      isActive,
      id,
    ]);

    const [rows] = await pool.execute(
      `
      SELECT
        dr.id,
        dr.employee_id,
        u.full_name,
        dr.duty_date,
        dr.duty_type,
        dr.duty_timing,
        dr.location,
        dr.remarks,
        dr.is_active
      FROM duty_roster dr
      LEFT JOIN users u ON u.id = dr.employee_id
      WHERE dr.id = ?
      `,
      [id],
    );

    return rows[0];
  } catch (error) {
    console.error("updateDutyRoster error:", error);
    throw error;
  }
};

export const deactivateDutyRoster = async (id) => {
  try {
    const sql = `
      UPDATE duty_roster
      SET is_active = 0
      WHERE id = ?
    `;

    const [result] = await pool.execute(sql, [id]);

    return result;
  } catch (error) {
    console.error("deactivateDutyRoster error:", error);
    throw error;
  }
};
