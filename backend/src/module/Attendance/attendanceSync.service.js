// import { pool } from "../../config/mySqlDB.js";
// import { createCompOffIfEligible } from "../CompOff/compOff.model.js";
// import { markAttendance, updatePunchOut } from "./attendance.model.js";
// import { getLatestPunches } from "./etimeoffice.service.js";

// let isSyncing = false;

// export const syncAttendance = async () => {
//   if (isSyncing) {
//     console.log("syncAttendance: previous run still in progress, skipping");
//     return;
//   }
//   isSyncing = true;

//   try {
//     const [syncRows] = await pool.query(
//       "SELECT last_record FROM attendance_sync LIMIT 1",
//     );

//     const lastRecord = syncRows[0].last_record;

//     const response = await getLatestPunches(lastRecord);

//     if (!response.PunchData || response.PunchData.length === 0) {
//       console.log("No new punches");
//       return;
//     }

//     for (const punch of response.PunchData) {
//       try {
//         const [users] = await pool.query(
//           "SELECT id FROM users WHERE emp_code=? LIMIT 1",
//           [punch.Empcode],
//         );

//         if (!users.length) {
//           console.log(`No matching user for emp_code: ${punch.Empcode}`);
//           continue;
//         }

//         const employeeId = users[0].id;

//         const [day, month, yearAndTime] = punch.PunchDate.split("/");
//         const [year, time] = yearAndTime.split(" ");

//         const attendanceDate = `${year}-${month}-${day}`;

//         const [attendance] = await pool.query(
//           `SELECT id, punch_out
//                  FROM attendance
//                  WHERE employee_id=? AND attendance_date=?`,
//           [employeeId, attendanceDate],
//         );

//         if (!attendance.length) {
//           // First Punch -> Punch In
//           await markAttendance({
//             employeeId,
//             attendanceDate,
//             status: "Pending",
//             punchIn: time,
//           });
//         } else if (!attendance[0].punch_out) {
//           // Second Punch -> Punch Out
//           await updatePunchOut({
//             employeeId,
//             attendanceDate,
//             punch_out: time,
//             status: "Present",
//           });

//           await createCompOffIfEligible(employeeId, attendanceDate);
//         } else {
//           console.log(`Extra Punch Ignored : ${employeeId}`);
//         }
//       } catch (punchErr) {
//         console.error(
//           `Failed to process punch for emp_code ${punch.Empcode}:`,
//           punchErr,
//         );
//       }
//     }

//     await pool.query("UPDATE attendance_sync SET last_record=?", [
//       response.MaxRecord,
//     ]);

//     console.log("Sync Completed");
//   } catch (err) {
//     // Top-level error (jaise getLatestPunches fail, DB connection issue)
//     console.error("syncAttendance failed:", err);
//     throw err; // caller (cron) ke try-catch me pakda jayega
//   } finally {
//     isSyncing = false;
//   }
// };

import { pool } from "../../config/mySqlDB.js";
import { createCompOffIfEligible } from "../CompOff/compOff.model.js";
import { markAttendance, updatePunchOut } from "./attendance.model.js";
import { getLatestPunches } from "./etimeoffice.service.js";

let isSyncing = false;

export const syncAttendance = async () => {
  if (isSyncing) {
    console.log("syncAttendance: previous run still in progress, skipping");
    return;
  }
  isSyncing = true;

  try {
    const [syncRows] = await pool.query(
      "SELECT last_record FROM attendance_sync LIMIT 1",
    );

    const lastRecord = syncRows[0].last_record;

    const response = await getLatestPunches(lastRecord);

    if (!response.PunchData || response.PunchData.length === 0) {
      console.log("No new punches");
      return;
    }

    for (const punch of response.PunchData) {
      try {
        const [users] = await pool.query(
          "SELECT id FROM users WHERE emp_code=? LIMIT 1",
          [punch.Empcode],
        );

        if (!users.length) {
          console.log(`No matching user for emp_code: ${punch.Empcode}`);
          continue;
        }

        const employeeId = users[0].id;

        const [day, month, yearAndTime] = punch.PunchDate.split("/");
        const [year, time] = yearAndTime.split(" ");

        const attendanceDate = `${year}-${month}-${day}`;

        const [attendance] = await pool.query(
          `SELECT id, punch_out
                 FROM attendance
                 WHERE employee_id=? AND attendance_date=?`,
          [employeeId, attendanceDate],
        );

        if (!attendance.length) {
          // 1st Punch of the day -> Punch In
          await markAttendance({
            employeeId,
            attendanceDate,
            status: "Pending",
            punchIn: time,
          });
        } else {
          await updatePunchOut({
            employeeId,
            attendanceDate,
            punch_out: time,
            status: "Present",
          });

          await createCompOffIfEligible(employeeId, attendanceDate);
        }
      } catch (punchErr) {
        console.error(
          `Failed to process punch for emp_code ${punch.Empcode}:`,
          punchErr,
        );
      }
    }

    await pool.query("UPDATE attendance_sync SET last_record=?", [
      response.MaxRecord,
    ]);

    console.log("Sync Completed");
  } catch (err) {
    console.error("syncAttendance failed:", err);
    throw err;
  } finally {
    isSyncing = false;
  }
};
