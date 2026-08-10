import { pool } from "../../config/mySqlDB.js";

import { randomUUID } from "crypto";

export const createCompOffIfEligible = async (employeeId, attendanceDate) => {
  // Employee weekoff + holiday
  const [rows] = await pool.execute(
    `
    SELECT
      COALESCE(eso.week_off, u.weeklyOff) AS week_off,
      h.id AS holiday_id
    FROM users u

    LEFT JOIN employee_shift_override eso
      ON eso.employee_id = u.id
      AND eso.is_active = 1
      AND ? BETWEEN eso.from_date AND eso.to_date

    LEFT JOIN holidays h
      ON h.date = ?
      AND h.is_active = 1
      AND h.branch_id = u.branchOffice_id

    WHERE u.id = ?
    `,
    [attendanceDate, attendanceDate, employeeId],
  );

  if (!rows.length) return;

  const dayName = new Date(attendanceDate).toLocaleDateString("en-US", {
    weekday: "long",
  });

  const isWeekOff = rows[0].week_off === dayName;
  const isHoliday = !!rows[0].holiday_id;

  if (!isWeekOff && !isHoliday) return;

  // Duplicate Check
  const [exists] = await pool.execute(
    `
    SELECT id
    FROM comp_offs
    WHERE employee_id = ?
    AND earned_date = ?
    LIMIT 1
    `,
    [employeeId, attendanceDate],
  );

  if (exists.length) return;

  const uuid = randomUUID();

  await pool.execute(
    `
    INSERT INTO comp_offs
    (
      uuid,
      employee_id,
      earned_date,
      days,
      status,
      remarks
    )
    VALUES
    (
      ?,
      ?,
      ?,
      1,
      'Available',
      ?
    )
    `,
    [
      uuid,
      employeeId,
      attendanceDate,
      isHoliday ? "Worked on Holiday" : "Worked on Weekly Off",
    ],
  );
};

export const getCompOffs = async (filters = {}) => {
  const {
    employeeId,
    managerId,
    hodId,
    zonalHeadId,
    branchId,
    departmentId,
    status,
    startDate,
    endDate,
  } = filters;

  const conditions = [];
  const values = [];
  if (managerId) {
    conditions.push("u.manager_id = ?");
    values.push(managerId);
  }

  if (hodId) {
    conditions.push("u.manager_id = ?");
    values.push(hodId);
  }

  if (zonalHeadId) {
    conditions.push("u.manager_id = ?");
    values.push(zonalHeadId);
  }

  if (employeeId) {
    conditions.push("c.employee_id = ?");
    values.push(employeeId);
  }

  if (branchId) {
    conditions.push("u.branchOffice_id = ?");
    values.push(branchId);
  }

  if (departmentId) {
    conditions.push("u.department_id = ?");
    values.push(departmentId);
  }

  if (status) {
    conditions.push("c.status = ?");
    values.push(status);
  }

  if (startDate && endDate) {
    conditions.push("c.earned_date BETWEEN ? AND ?");
    values.push(startDate, endDate);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const [rows] = await pool.execute(
    `
    SELECT
      c.*,
      CONCAT(u.firstName, ' ', u.lastName) AS employee_name
    FROM comp_offs c
    JOIN users u
      ON u.id = c.employee_id
    ${whereClause}
    ORDER BY c.earned_date DESC
    `,
    values,
  );

  return rows;
};

export const getCompOffBalance = async (employeeId) => {
  const [rows] = await hrmsPool.execute(
    `
    SELECT
      COALESCE(
        SUM(
          CASE
            WHEN status='Available'
            THEN days
            ELSE 0
          END
        ),
      0) AS balance
    FROM comp_offs
    WHERE employee_id = ?
    `,
    [employeeId],
  );

  return rows[0];
};
