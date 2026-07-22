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
      status,
    } = filters;

    const conditions = [];
    const params = [];

    let attendanceJoin = `
      LEFT JOIN attendance a
        ON a.employee_id = u.id
    `;

    if (startDate && endDate) {
      attendanceJoin += ` AND a.attendance_date BETWEEN ? AND ?`;
      params.push(startDate, endDate);
    } else if (attendanceDate) {
      attendanceJoin += ` AND a.attendance_date = ?`;
      params.push(attendanceDate);
    }

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
    if (status && status !== "All") {
      conditions.push("LOWER(COALESCE(a.status, 'Absent')) = LOWER(?)");
      params.push(status);
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

        u.workShift AS permanent_shift_type,
        u.shiftTiming AS permanent_shift_timing,

        eso.shift_type AS temporary_shift_type,
        eso.shift_timing AS temporary_shift_timing,
        eso.week_off,
        eso.from_date,
        eso.to_date,

        COALESCE(eso.shift_type, u.workShift) AS shift_type,
        COALESCE(eso.shift_timing, u.shiftTiming) AS shift_timing,

        CASE
          WHEN eso.id IS NOT NULL THEN 'Temporary'
          ELSE 'Permanent'
        END AS shift_source,

        a.id AS attendance_id,
        a.attendance_date,
        COALESCE(a.status, 'Pending') AS status,
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

    // ---------- SUMMARY CALCULATION ----------

    const uniqueEmployees = new Set();
    let presentCount = 0;
    let absentCount = 0;
    let leaveCount = 0;
    let lwpCount = 0;

    for (const row of rows) {
      uniqueEmployees.add(row.employee_id);

      const status = (row.status || "").toLowerCase();

      if (status === "present") presentCount++;
      else if (status === "absent") absentCount++;
      else if (status === "leave") leaveCount++;
      else if (status === "lwp") lwpCount++;
    }

    // ---------- COMP OFF COUNT (from comp_offs table, status = 'Available') ----------
    // CHANGED: date filter hata diya — Comp Off ek "currently available balance" hai,
    // "is specific date ko earn hua" wala count nahi. Sirf employee/branch/department/manager
    // se filter karo, taaki employeeId diya jaaye to uska sahi available balance mile,
    // chahe date filter kuch bhi ho.

    const compOffConditions = ["co.status = 'Available'"];
    const compOffParams = [];

    if (employeeId) {
      compOffConditions.push("co.employee_id = ?");
      compOffParams.push(employeeId);
    }
    if (branchId) {
      compOffConditions.push("u.branchOffice_id = ?");
      compOffParams.push(branchId);
    }
    if (departmentId) {
      compOffConditions.push("u.department_id = ?");
      compOffParams.push(departmentId);
    }
    if (managerId) {
      compOffConditions.push("(u.manager_id = ? OR u.id = ?)");
      compOffParams.push(managerId, managerId);
    }

    const compOffSql = `
      SELECT COUNT(*) AS compOffCount
      FROM comp_offs co
      JOIN users u ON u.id = co.employee_id
      WHERE ${compOffConditions.join(" AND ")}
    `;

    const [compOffRows] = await pool.execute(compOffSql, compOffParams);
    const compOffCount = compOffRows[0]?.compOffCount || 0;

    const summary = {
      month: new Date().toISOString().slice(0, 7),
      totalEmployee: uniqueEmployees.size,
      present: presentCount,
      absent: absentCount,
      leave: leaveCount,
      compOff: compOffCount,
      lwp: lwpCount,
    };

    return {
      data: rows,
      summary,
    };
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

    // ---------- Helper: shift_timing string se start time (minutes) nikalo ----------
    const getShiftStartMinutes = (shiftTiming) => {
      if (!shiftTiming) return null;

      const startPart = shiftTiming.split("-")[0]?.trim();
      if (!startPart) return null;

      const match = startPart.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
      if (!match) return null;

      let [, hh, mm, meridian] = match;
      hh = parseInt(hh, 10);
      mm = parseInt(mm, 10);

      if (meridian) {
        meridian = meridian.toUpperCase();
        if (meridian === "PM" && hh !== 12) hh += 12;
        if (meridian === "AM" && hh === 12) hh = 0;
      }

      return hh * 60 + mm;
    };

    // ---------- Helper: punch_in (HH:MM:SS ya HH:MM) se minutes nikalo ----------
    const getPunchInMinutes = (punchIn) => {
      if (!punchIn) return null;

      const parts = String(punchIn).split(":");
      const hh = parseInt(parts[0], 10);
      const mm = parseInt(parts[1], 10);

      if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
      return hh * 60 + mm;
    };

    const LATE_GRACE_MINUTES = 10; // 10 minute grace period

    // ---------- Row-level: isLate flag add karo ----------
    const enrichedRows = rows.map((row) => {
      const shiftStartMinutes = getShiftStartMinutes(row.shift_timing);
      const punchInMinutes = getPunchInMinutes(row.punch_in);

      let isLate = false;

      if (
        row.status === "Present" &&
        shiftStartMinutes != null &&
        punchInMinutes != null
      ) {
        const diff = punchInMinutes - shiftStartMinutes;
        isLate = diff > LATE_GRACE_MINUTES;
      }

      return {
        ...row,
        late_time: formatMinutes(row.late_minutes),
        early_exit_time: formatMinutes(row.early_exit_minutes),
        worked_time: formatMinutes(row.worked_minutes),
        overtime_time: formatMinutes(row.overtime_minutes),
        short_time: formatMinutes(row.short_minutes),
        is_late: isLate,
      };
    });

    // ---------- Employee-wise Month Summary ----------
    const summaryMap = new Map();

    for (const row of enrichedRows) {
      if (!summaryMap.has(row.employee_id)) {
        summaryMap.set(row.employee_id, {
          employeeId: row.employee_id,
          fullName: row.full_name,
          totalMinutes: 0, // NEW — worked_minutes accumulate karne ke liye
          present: 0,
          absent: 0,
          lateMarks: 0,
          halfDay: 0,
        });
      }

      const emp = summaryMap.get(row.employee_id);

      // NEW — Total Hours ke liye worked_minutes sab dino ka sum
      emp.totalMinutes += row.worked_minutes || 0;

      if (row.status === "Present") {
        emp.present++;
        if (row.is_late) emp.lateMarks++;
      } else if (row.status === "Absent") {
        emp.absent++;
      } else if (row.status === "Half Day") {
        emp.halfDay++;
      }
    }

    // totalMinutes ko totalHours (HH:MM string) me convert karke summary banao
    const summary = Array.from(summaryMap.values()).map((emp) => ({
      ...emp,
      totalHours: formatMinutes(emp.totalMinutes), // NEW
    }));

    // ---------- Overall totals (poore filter-set ke liye) ----------
    const overallSummary = summary.reduce(
      (acc, emp) => {
        acc.totalMinutes += emp.totalMinutes; // NEW
        acc.present += emp.present;
        acc.absent += emp.absent;
        acc.lateMarks += emp.lateMarks;
        acc.halfDay += emp.halfDay;
        return acc;
      },
      { totalMinutes: 0, present: 0, absent: 0, lateMarks: 0, halfDay: 0 },
    );

    // NEW — overall totalMinutes ko bhi HH:MM string me convert karo
    overallSummary.totalHours = formatMinutes(overallSummary.totalMinutes);

    return {
      data: enrichedRows,
      summary, // per-employee breakdown (totalHours included)
      overallSummary, // total across all employees (totalHours included)
    };
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
          COALESCE(eso.shift_timing, u.shiftTiming) AS shift_timing,
          u.branchOffice_id,
          h.id AS holiday_id
      FROM attendance a
      JOIN users u
        ON u.id = a.employee_id

      LEFT JOIN employee_shift_override eso
        ON eso.employee_id = u.id
       AND eso.is_active = 1
       AND ? BETWEEN eso.from_date AND eso.to_date

      LEFT JOIN holidays h
        ON h.branch_id = u.branchOffice_id
       AND h.date = ?
       AND h.is_active = 1

      WHERE a.employee_id = ?
        AND a.attendance_date = ?
      `,
      [attendanceDate, attendanceDate, employeeId, attendanceDate],
    );

    if (!rows.length) {
      throw new Error("Attendance not found.");
    }

    const attendance = rows[0];

    // Sunday check
    const isSunday = new Date(attendanceDate).getDay() === 0; // 0 = Sunday

    // Branch holiday check (from holidays table join)
    const isBranchHoliday = attendance.holiday_id != null;

    const isHoliday = isSunday || isBranchHoliday;

    let workedMinutes = 0;
    let overtimeMinutes = 0;
    let shortMinutes = 0;
    let earlyExitMinutes = 0;

    // 8:00 on Sunday/branch holiday, else 8:30
    const REQUIRED_MINUTES = isHoliday ? 8 * 60 : 8 * 60 + 30;

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
        isHoliday,
        isSunday,
        isBranchHoliday,
        requiredMinutes: REQUIRED_MINUTES,
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

      is_holiday: isHoliday,
      required_minutes: REQUIRED_MINUTES,

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

export const runAutoAttendanceMarking = async () => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const todayDate = new Date().toISOString().slice(0, 10);
    const todayDayName = new Date().toLocaleDateString("en-US", {
      weekday: "long",
    });

    const [employees] = await connection.execute(
      `
      SELECT
        u.id AS employee_id,
        u.weeklyOff AS permanent_week_off,

        eso.week_off AS temp_week_off,
        eso.is_active AS eso_active,
        eso.from_date,
        eso.to_date,

        a.id AS attendance_id,
        a.punch_in,
        a.status AS existing_status

      FROM users u

      LEFT JOIN employee_shift_override eso
        ON eso.employee_id = u.id
        AND eso.is_active = 1
        AND ? BETWEEN eso.from_date AND eso.to_date

      LEFT JOIN attendance a
        ON a.employee_id = u.id
        AND a.attendance_date = ?
      `,
      // CHANGED: WHERE u.status = 'Active' hata diya — kyunki getAttendanceByDate
      // (jo kaam kar raha hai) is condition ko use hi nahi karta, isliye ye
      // hamari query me galat filter tha jo sab employees ko exclude kar raha tha
      [todayDate, todayDate],
    );

    let weekOffCount = 0;
    let absentCount = 0;
    let skippedCount = 0;

    for (const emp of employees) {
      if (emp.attendance_id) {
        skippedCount++;
        continue;
      }

      const effectiveWeekOff =
        emp.temp_week_off || emp.permanent_week_off || "";

      const weekOffDays = effectiveWeekOff
        .split(",")
        .map((d) => d.trim().toLowerCase())
        .filter(Boolean);

      const isWeekOffToday = weekOffDays.includes(todayDayName.toLowerCase());

      const finalStatus = isWeekOffToday ? "Week Off" : "Absent";

      if (isWeekOffToday) weekOffCount++;
      else absentCount++;

      await connection.execute(
        `INSERT INTO attendance
          (employee_id, attendance_date, status, remarks, created_at)
         VALUES (?, ?, ?, ?, NOW())`,
        [
          emp.employee_id,
          todayDate,
          finalStatus,
          "Auto-marked by system (no punch-in till 1:00 PM)",
        ],
      );
    }

    await connection.commit();

    return {
      date: todayDate,
      day: todayDayName,
      totalChecked: employees.length,
      markedAbsent: absentCount,
      markedWeekOff: weekOffCount,
      skipped: skippedCount,
    };
  } catch (error) {
    await connection.rollback();
    console.error("runAutoAttendanceMarking error:", error);
    throw error;
  } finally {
    connection.release();
  }
};
