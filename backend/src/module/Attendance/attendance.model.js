import { pool } from "../../config/mySqlDB.js";

// export const getAttendanceByDate = async (filters = {}) => {
//   try {
//     const {
//       // ⚠️ Default to today's date (YYYY-MM-DD) when no attendanceDate is
//       // passed, so the attendance list always shows today's marks by default.
//       attendanceDate = new Date().toISOString().slice(0, 10),
//       employeeId,
//       branchId,
//       departmentId,
//     } = filters;

//     const conditions = [];
//     const params = [];

//     // Attendance Join
//     let attendanceJoin = `
//       LEFT JOIN attendance a
//         ON a.employee_id = u.id
//     `;

//     // Selected date ki attendance hi lao
//     if (attendanceDate) {
//       attendanceJoin += ` AND a.attendance_date = ?`;
//       params.push(attendanceDate);
//     }

//     // Employee Filter
//     if (employeeId) {
//       conditions.push("u.id = ?");
//       params.push(employeeId);
//     }

//     // Branch Filter
//     if (branchId) {
//       conditions.push("u.branchOffice_id = ?");
//       params.push(branchId);
//     }

//     // Department Filter
//     if (departmentId) {
//       conditions.push("u.department_id = ?");
//       params.push(departmentId);
//     }

//     const whereClause =
//       conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

//     const sql = `
//       SELECT
//         u.id AS employee_id,

//         CONCAT(
//           u.firstName,
//           ' ',
//           COALESCE(CONCAT(u.middleName, ' '), ''),
//           u.lastName
//         ) AS full_name,

//         u.firstName,
//         u.middleName,
//         u.lastName,

//         u.department_id,
//         d.department_name,

//         u.branchOffice_id,

//         u.workShift AS shift_type,
//         u.shiftTiming AS shift_timing,

//         a.id AS attendance_id,
//         a.attendance_date,
//         a.status,
//         a.punch_in,
//         a.punch_out,
//         a.leave_type,
//         a.remarks

//       FROM users u

//       LEFT JOIN departments d
//         ON d.id = u.department_id

//       ${attendanceJoin}

//       ${whereClause}

//       ORDER BY u.firstName ASC;
//     `;

//     const [rows] = await pool.execute(sql, params);

//     return rows;
//   } catch (error) {
//     console.error("getAttendanceByDate error:", error);
//     throw error;
//   }
// };

export const getAttendanceByDate = async (filters = {}) => {
  try {
    const {
      attendanceDate,
      startDate,
      endDate,
      employeeId,
      branchId,
      departmentId,
      managerId,
    } = filters;

    const conditions = [];
    const params = [];

    let attendanceJoin = `
      LEFT JOIN attendance a
        ON a.employee_id = u.id
    `;

    // Attendance Date Filter
    if (startDate && endDate) {
      attendanceJoin += ` AND a.attendance_date BETWEEN ? AND ?`;
      params.push(startDate, endDate);
    } else if (attendanceDate) {
      attendanceJoin += ` AND a.attendance_date = ?`;
      params.push(attendanceDate);
    }

    // Employee Filter
    if (employeeId) {
      conditions.push("u.id = ?");
      params.push(employeeId);
    }

    // Branch Filter
    if (branchId) {
      conditions.push("u.branchOffice_id = ?");
      params.push(branchId);
    }

    // Department Filter
    if (departmentId) {
      conditions.push("u.department_id = ?");
      params.push(departmentId);
    }

    // Manager Filter
    if (managerId) {
      conditions.push("(u.manager_id = ? OR u.id = ?)");
      params.push(managerId, managerId);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const sql = `
      SELECT
        u.id AS employee_id,

        TRIM(
          CONCAT(
            COALESCE(u.firstName,''),
            ' ',
            COALESCE(u.middleName,''),
            ' ',
            COALESCE(u.lastName,'')
          )
        ) AS full_name,

        u.firstName,
        u.middleName,
        u.lastName,

        u.department_id,
        d.department_name,

        u.branchOffice_id,
        b.branch_name,

        /* Permanent Shift */
        u.workShift AS permanent_shift_type,
        u.shiftTiming AS permanent_shift_timing,

        /* Temporary Shift */
        eso.shift_type AS temporary_shift_type,
        eso.shift_timing AS temporary_shift_timing,
        eso.week_off,
        eso.from_date,
        eso.to_date,

        /* Final Shift */
        COALESCE(eso.shift_type, u.workShift) AS shift_type,
        COALESCE(eso.shift_timing, u.shiftTiming) AS shift_timing,

        CASE
          WHEN eso.id IS NOT NULL THEN 'Temporary'
          ELSE 'Permanent'
        END AS shift_source,

        a.id AS attendance_id,
        a.attendance_date,
        COALESCE(a.status,'Absent') AS status,
        a.punch_in,
        a.punch_out,
        a.leave_type,
        a.remarks

      FROM users u

      LEFT JOIN departments d
        ON d.id = u.department_id

      LEFT JOIN branches b
        ON b.id = u.branchOffice_id

      ${attendanceJoin}

      /* Temporary Shift Override */
      LEFT JOIN employee_shift_override eso
  ON eso.employee_id = u.id
  AND eso.is_active = 1
  AND (
      a.attendance_date BETWEEN eso.from_date AND eso.to_date
      OR (
          a.attendance_date IS NULL
          AND CURDATE() BETWEEN eso.from_date AND eso.to_date
      )
  )

      ${whereClause}

      ORDER BY
        u.firstName ASC,
        a.attendance_date DESC
    `;

    const [rows] = await pool.execute(sql, params);

    return rows;
  } catch (error) {
    console.error("getAttendanceByDate error:", error);
    throw error;
  }
};

export const getAttendanceByEmployeeMonth = async (employeeId, month) => {
  try {
    if (!employeeId || !month) {
      throw new Error(
        `getAttendanceByEmployeeMonth called with invalid args: employeeId=${employeeId}, month=${month}`,
      );
    }

    // month is expected as "YYYY-MM"
    const [year, monthNum] = month.split("-").map(Number);
    if (!year || !monthNum) {
      throw new Error(
        `getAttendanceByEmployeeMonth invalid month format: ${month}`,
      );
    }

    const startDate = `${month}-01`;
    const lastDay = new Date(year, monthNum, 0).getDate(); // last day of that month
    const endDate = `${month}-${String(lastDay).padStart(2, "0")}`;

    const sql = `
      WITH RECURSIVE calendar AS (
        SELECT ? AS dt
        UNION ALL
        SELECT DATE_ADD(dt, INTERVAL 1 DAY)
        FROM calendar
        WHERE dt < ?
      )
      SELECT
        u.id AS employee_id,

        TRIM(
          CONCAT(
            COALESCE(u.firstName,''),
            ' ',
            COALESCE(u.middleName,''),
            ' ',
            COALESCE(u.lastName,'')
          )
        ) AS full_name,

        u.department_id,
        d.department_name,

        u.branchOffice_id,
        b.branch_name,

        u.workShift AS shift_type,
        u.shiftTiming AS shift_timing,

        a.id AS attendance_id,
        calendar.dt AS attendance_date,
        COALESCE(a.status,'Absent') AS status,
        a.punch_in,
        a.punch_out,
        a.leave_type,
        a.remarks

      FROM calendar

      CROSS JOIN users u

      LEFT JOIN attendance a
        ON a.employee_id = u.id
        AND a.attendance_date = calendar.dt

      LEFT JOIN departments d
        ON d.id = u.department_id

      LEFT JOIN branches b
        ON b.id = u.branchOffice_id

      WHERE u.id = ?

      ORDER BY calendar.dt DESC
    `;

    const [rows] = await pool.execute(sql, [startDate, endDate, employeeId]);
    return rows;
  } catch (error) {
    console.error("getAttendanceByEmployeeMonth error:", error);
    throw error;
  }
};

export const markAttendance = async ({
  employeeId,
  attendanceDate,
  status,
  punchIn = null,
}) => {
  try {
    const sql = `
      INSERT INTO attendance 
        (employee_id, attendance_date, status, punch_in)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        status = VALUES(status),
        punch_in = VALUES(punch_in)
    `;

    const params = [employeeId, attendanceDate, status, punchIn ?? null];

    const [result] = await pool.execute(sql, params);
    return result;
  } catch (error) {
    console.error("markAttendance error:", error);
    throw error;
  }
};

export const updatePunchOut = async ({
  employeeId,
  attendanceDate,
  punch_out,
  status,
}) => {
  try {
    const sql = `
      UPDATE attendance
      SET punch_out = ?,
          status = COALESCE(?, status)
      WHERE employee_id = ? AND attendance_date = ?
    `;

    const [result] = await pool.execute(sql, [
      punch_out,
      status ?? null,
      employeeId,
      attendanceDate,
    ]);

    return result;
  } catch (error) {
    console.error("updatePunchOut error:", error);
    throw error;
  }
};
