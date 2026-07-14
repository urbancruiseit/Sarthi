import { pool } from "../../config/mySqlDB.js";

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
  STR_TO_DATE(
    TRIM(
      SUBSTRING_INDEX(
        COALESCE(eso.shift_timing, u.shiftTiming),
        '-',
        1
      )
    ),
    '%h:%i %p'
  ) ASC,
  u.firstName ASC,
  a.attendance_date DESC;
    `;

    const [rows] = await pool.execute(sql, params);

    return rows;
  } catch (error) {
    console.error("getAttendanceByDate error:", error);
    throw error;
  }
};

export const getAttendanceByMonth = async (filters = {}) => {
  try {
    const { month, employeeId, branchId, departmentId, managerId } = filters;

    if (!month) {
      throw new Error("Month is required. Format: YYYY-MM");
    }

    const [year, monthNum] = month.split("-").map(Number);

    if (!year || !monthNum) {
      throw new Error(`Invalid month format: ${month}`);
    }

    const startDate = `${month}-01`;
    const lastDay = new Date(year, monthNum, 0).getDate();
    const endDate = `${month}-${String(lastDay).padStart(2, "0")}`;

    const conditions = [];
    const params = [startDate, endDate];

    if (employeeId) {
      conditions.push("u.id = ?");
      params.push(employeeId);
    }

    if (branchId) {
      conditions.push("u.branchOffice_id = ?");
      params.push(branchId);
    }

    if (departmentId) {
      conditions.push("u.department_id = ?");
      params.push(departmentId);
    }

    if (managerId) {
      conditions.push("(u.manager_id = ? OR u.id = ?)");
      params.push(managerId, managerId);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const sql = `
      WITH RECURSIVE calendar AS (
        SELECT CAST(? AS DATE) AS dt
        UNION ALL
        SELECT DATE_ADD(dt, INTERVAL 1 DAY)
        FROM calendar
        WHERE dt < CAST(? AS DATE)
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
        calendar.dt AS attendance_date,

        COALESCE(a.status,'Absent') AS status,
        a.punch_in,
        a.punch_out,
        a.leave_type,
        a.remarks,

        /* Attendance Calculation */
        COALESCE(a.late_minutes,0) AS late_minutes,
        COALESCE(a.early_exit_minutes,0) AS early_exit_minutes,
        COALESCE(a.worked_minutes,0) AS worked_minutes,
        COALESCE(a.overtime_minutes,0) AS overtime_minutes,
        COALESCE(a.short_minutes,0) AS short_minutes

      FROM calendar

      CROSS JOIN users u

      LEFT JOIN attendance a
        ON a.employee_id = u.id
       AND a.attendance_date = calendar.dt

      LEFT JOIN departments d
        ON d.id = u.department_id

      LEFT JOIN branches b
        ON b.id = u.branchOffice_id

      /* Temporary Shift Override */
      LEFT JOIN employee_shift_override eso
        ON eso.employee_id = u.id
       AND eso.is_active = 1
       AND calendar.dt BETWEEN eso.from_date AND eso.to_date

      ${whereClause}

      ORDER BY
        u.firstName ASC,
        calendar.dt ASC;
    `;

    const [rows] = await pool.execute(sql, params);

    const formatMinutes = (minutes) => {
      if (minutes == null) return "00:00";

      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;

      return `${String(hours).padStart(2, "0")}:${String(mins).padStart(
        2,
        "0",
      )}`;
    };

    return rows.map((row) => ({
      ...row,

      late_time: formatMinutes(row.late_minutes),
      early_exit_time: formatMinutes(row.early_exit_minutes),
      worked_time: formatMinutes(row.worked_minutes),
      overtime_time: formatMinutes(row.overtime_minutes),
      short_time: formatMinutes(row.short_minutes),
    }));
  } catch (error) {
    console.error("getAttendanceByMonth error:", error);
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
    // Get Employee Shift (Temporary > Permanent)
    const [shiftRows] = await pool.execute(
      `
      SELECT
        COALESCE(eso.shift_timing, u.shiftTiming) AS shift_timing
      FROM users u
      LEFT JOIN employee_shift_override eso
        ON eso.employee_id = u.id
       AND eso.is_active = 1
       AND ? BETWEEN eso.from_date AND eso.to_date
      WHERE u.id = ?
      `,
      [attendanceDate, employeeId],
    );

    let lateMinutes = 0;

    if (shiftRows.length && shiftRows[0].shift_timing && punchIn) {
      const shiftTiming = shiftRows[0].shift_timing;

      // Example: "10:00 AM - 06:30 PM"
      const shiftStart = shiftTiming.split("-")[0].trim();

      const shiftStartDate = new Date(`${attendanceDate} ${shiftStart}`);
      const punchInDate = new Date(`${attendanceDate}T${punchIn}`);

      lateMinutes = Math.max(
        0,
        Math.floor((punchInDate - shiftStartDate) / 60000),
      );
    }

    const sql = `
      INSERT INTO attendance
      (
        employee_id,
        attendance_date,
        status,
        punch_in,
        late_minutes
      )
      VALUES (?, ?, ?, ?, ?)

      ON DUPLICATE KEY UPDATE
        status = VALUES(status),
        punch_in = VALUES(punch_in),
        late_minutes = VALUES(late_minutes)
    `;

    const [result] = await pool.execute(sql, [
      employeeId,
      attendanceDate,
      status,
      punchIn,
      lateMinutes,
    ]);

    return {
      ...result,
      late_minutes: lateMinutes,
    };
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
    const [rows] = await pool.execute(
      `
      SELECT
          a.id,
          a.punch_in,
          COALESCE(eso.shift_timing, u.shiftTiming) AS shift_timing
      FROM attendance a
      JOIN users u
        ON u.id = a.employee_id

      LEFT JOIN employee_shift_override eso
        ON eso.employee_id = u.id
       AND eso.is_active = 1
       AND ? BETWEEN eso.from_date AND eso.to_date

      WHERE a.employee_id = ?
        AND a.attendance_date = ?
      `,
      [attendanceDate, employeeId, attendanceDate],
    );

    if (!rows.length) {
      throw new Error("Attendance not found.");
    }

    const attendance = rows[0];

    let workedMinutes = 0;
    let overtimeMinutes = 0;
    let shortMinutes = 0;
    let earlyExitMinutes = 0;

    const REQUIRED_MINUTES = 8 * 60 + 30; // 510 Minutes

    const formatMinutes = (minutes) => {
      if (minutes == null || minutes < 0) return "00:00";

      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;

      return `${String(hours).padStart(2, "0")}:${String(mins).padStart(
        2,
        "0",
      )}`;
    };

    if (attendance.punch_in) {
      const punchIn = new Date(`${attendanceDate} ${attendance.punch_in}`);
      const punchOut = new Date(`${attendanceDate} ${punch_out}`);

      // Worked Minutes
      workedMinutes = Math.max(0, Math.floor((punchOut - punchIn) / 60000));

      // Overtime
      overtimeMinutes = Math.max(0, workedMinutes - REQUIRED_MINUTES);

      // Short Hours
      shortMinutes = Math.max(0, REQUIRED_MINUTES - workedMinutes);

      // Early Exit
      if (attendance.shift_timing) {
        // Format: 09:00 AM - 05:30 PM
        const [, shiftEnd] = attendance.shift_timing
          .split("-")
          .map((item) => item.trim());

        const shiftEndTime = new Date(`${attendanceDate} ${shiftEnd}`);

        earlyExitMinutes = Math.max(
          0,
          Math.floor((shiftEndTime - punchOut) / 60000),
        );
      }

      console.log({
        shiftTiming: attendance.shift_timing,
        punchIn,
        punchOut,
        workedMinutes,
        overtimeMinutes,
        shortMinutes,
        earlyExitMinutes,
        workedTime: formatMinutes(workedMinutes),
        overtimeTime: formatMinutes(overtimeMinutes),
        shortTime: formatMinutes(shortMinutes),
        earlyExitTime: formatMinutes(earlyExitMinutes),
      });
    }

    const sql = `
      UPDATE attendance
      SET
          punch_out = ?,
          status = COALESCE(?, status),
          worked_minutes = ?,
          overtime_minutes = ?,
          short_minutes = ?,
          early_exit_minutes = ?
      WHERE employee_id = ?
        AND attendance_date = ?
    `;

    const [result] = await pool.execute(sql, [
      punch_out,
      status ?? null,
      workedMinutes,
      overtimeMinutes,
      shortMinutes,
      earlyExitMinutes,
      employeeId,
      attendanceDate,
    ]);

    return {
      success: result.affectedRows > 0,

      worked_minutes: workedMinutes,
      overtime_minutes: overtimeMinutes,
      short_minutes: shortMinutes,
      early_exit_minutes: earlyExitMinutes,

      worked_time: formatMinutes(workedMinutes),
      overtime_time: formatMinutes(overtimeMinutes),
      short_time: formatMinutes(shortMinutes),
      early_exit_time: formatMinutes(earlyExitMinutes),
    };
  } catch (error) {
    console.error("updatePunchOut error:", error);
    throw error;
  }
};
export const updateStatus = async ({ employeeId, attendanceDate, status }) => {
  try {
    const sql = `
      UPDATE attendance
      SET status = ?
      WHERE employee_id = ? 
        AND attendance_date = ?
    `;

    const [result] = await pool.execute(sql, [
      status,
      employeeId,
      attendanceDate,
    ]);

    return result;
  } catch (error) {
    console.error("updateStatus error:", error);
    throw error;
  }
};
