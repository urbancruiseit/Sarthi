import React, { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/* ------------------------------------------------------------------ */
/*  STATIC CONFIG                                                      */
/* ------------------------------------------------------------------ */

const MONTH_MAP: Record<string, number> = {
  JAN: 1,
  FEB: 2,
  MAR: 3,
  APR: 4,
  MAY: 5,
  JUN: 6,
  JUL: 7,
  AUG: 8,
  SEP: 9,
  OCT: 10,
  NOV: 11,
  DEC: 12,
};

const ALL_MONTHS = Object.keys(MONTH_MAP);
const YEARS = ["2024", "2025", "2026"];
const WEEKDAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];

// attendance-code -> pill style (matches the reference sheet)
const CODE_STYLE: Record<string, string> = {
  "1P": "bg-green-100 text-green-700",
  WO: "bg-sky-100 text-sky-700",
  COF: "bg-[#5b3a22] text-white",
  PL: "bg-emerald-600 text-white",
  HD: "bg-yellow-100 text-yellow-700",
};

const STAFF_NAMES = [
  "Sristi Kumari",
  "Rahul Verma",
  "Ankita Sharma",
  "Mohit Yadav",
];

const AVATAR_COLORS = [
  "bg-pink-400",
  "bg-indigo-400",
  "bg-emerald-400",
  "bg-amber-400",
];

/* ------------------------------------------------------------------ */
/*  DUMMY DATA GENERATOR (no API / no redux — everything is fabricated) */
/* ------------------------------------------------------------------ */

// small deterministic pseudo-random helper so the demo looks the same on every render
function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function minutesToHHMM(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${pad(h)}:${pad(m)}`;
}

type DayCell = {
  day: number;
  code: string;
  in: string;
  out: string;
  wh: string;
  ot: string;
  f: string;
};

type DummyEmployee = {
  id: number;
  name: string;
  avatarColor: string;
  days: DayCell[];
  totalHours: string;
  totalPresent: number;
  totalAbsent: number;
  totalLate: number;
  totalHalfDay: number;
};

function buildDummyEmployees(
  month: number,
  year: number,
  daysInMonth: number,
): DummyEmployee[] {
  return STAFF_NAMES.map((name, empIdx) => {
    let presentCount = 0;
    let lateCount = 0;
    let halfDayCount = 0;
    let totalWorkMinutes = 0;

    const days: DayCell[] = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const dow = new Date(year, month - 1, day).getDay(); // 0 = Sunday
      const seed = empIdx * 97 + day * 13;

      // pick attendance code
      let code = "1P";
      if (dow === 0) {
        code = "WO";
      } else if (seededRandom(seed) < 0.06) {
        code = "COF";
      } else if (seededRandom(seed + 1) < 0.03) {
        code = "PL";
      }

      if (code !== "1P") {
        return {
          day,
          code,
          in: "-",
          out: "-",
          wh: "-",
          ot: "",
          f: "",
        };
      }

      presentCount += 1;

      const inHour = 10 + Math.floor(seededRandom(seed + 2) * 2); // 10-11
      const inMin = Math.floor(seededRandom(seed + 3) * 59);
      const workMin = 480 + Math.floor(seededRandom(seed + 4) * 60); // 8h - 9h
      const outTotalMin = inHour * 60 + inMin + workMin;
      const otMin = Math.max(0, workMin - 480);
      const isLate = inHour >= 11 && seededRandom(seed + 5) < 0.4;
      const isHalfDay = seededRandom(seed + 6) < 0.03;

      if (isLate) lateCount += 1;
      if (isHalfDay) halfDayCount += 1;

      totalWorkMinutes += workMin;

      return {
        day,
        code,
        in: `${pad(inHour)}:${pad(inMin)}`,
        out: minutesToHHMM(outTotalMin),
        wh: minutesToHHMM(workMin),
        ot: otMin > 0 ? minutesToHHMM(otMin) : "",
        f: isLate ? minutesToHHMM(Math.floor(seededRandom(seed + 7) * 15)) : "",
      };
    });

    return {
      id: empIdx + 1,
      name,
      avatarColor: AVATAR_COLORS[empIdx % AVATAR_COLORS.length],
      days,
      totalHours: minutesToHHMM(totalWorkMinutes),
      totalPresent: presentCount,
      totalAbsent: 0,
      totalLate: lateCount,
      totalHalfDay: halfDayCount,
    };
  });
}

/* ------------------------------------------------------------------ */
/*  COMPONENT                                                          */
/* ------------------------------------------------------------------ */

const ROW_TYPES = ["Status", "IN", "OUT", "WH", "OT", "F"] as const;

const Empreport = () => {
  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear().toString(),
  );
  const [selectedMonth, setSelectedMonth] = useState(
    ALL_MONTHS[new Date().getMonth()],
  );

  const monthNum = MONTH_MAP[selectedMonth];
  const yearNum = Number(selectedYear);

  const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const employees = useMemo(
    () => buildDummyEmployees(monthNum, yearNum, daysInMonth),
    [monthNum, yearNum, daysInMonth],
  );

  const weekdayLetterFor = (day: number) =>
    WEEKDAY_LETTERS[new Date(yearNum, monthNum - 1, day).getDay()];

  const isSundayCol = (day: number) =>
    new Date(yearNum, monthNum - 1, day).getDay() === 0;

  return (
    <div className="">
      {/* HEADER */}
      <div className="sticky top-0 z-30 bg-white shadow-sm">
        <div className="pl-4 border-l-8 border-orange-500 bg-white px-3">
          <div className="flex justify-between items-center py-4">
            <h2 className="text-3xl font-bold text-emerald-800 p-2">
              Employee Attendance – {selectedMonth} {selectedYear}
            </h2>

            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-sm">
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[110px] text-sm font-medium text-slate-700 focus:ring-emerald-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALL_MONTHS.map((month) => (
                    <SelectItem key={month} value={month}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-[90px] text-sm font-medium text-slate-700 focus:ring-emerald-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {YEARS.map((y) => (
                    <SelectItem key={y} value={y}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl mt-2 shadow overflow-x-auto border border-slate-200">
        <table className="border-collapse text-xs whitespace-nowrap w-full">
          <thead>
            <tr>
              <th className="sticky left-0 z-20 bg-emerald-800 text-white border border-white p-2 min-w-[40px]">
                S.N.
              </th>
              <th className="sticky left-[40px] z-20 bg-emerald-800 text-white border border-white p-1 w-[36px] min-w-[36px]">
                Staff Name
              </th>
              <th className="sticky left-[76px] z-20 bg-emerald-800 text-white border border-white p-1 min-w-[60px]">
                <div className="flex items-center justify-center gap-1">
                  Days <ChevronDown className="w-3 h-3" />
                </div>
              </th>

              {daysArray.map((day) => (
                <th
                  key={day}
                  className={`border border-slate-300 text-white p-1 min-w-[46px] text-center ${
                    isSundayCol(day) ? "bg-emerald-900" : "bg-emerald-800"
                  }`}
                >
                  <div className="text-[11px] leading-tight">
                    {weekdayLetterFor(day)}
                  </div>
                  <div className="text-[11px] leading-tight font-semibold">
                    {pad(day)}-{pad(monthNum)}
                  </div>
                </th>
              ))}

              <th className="border border-white p-2 bg-orange-700 text-white min-w-[70px]">
                Total Hours
              </th>
              <th className="border border-white p-2 bg-emerald-900 text-white min-w-[60px]">
                Total Present
              </th>
              <th className="border border-white p-2 bg-red-800 text-white min-w-[60px]">
                Total Absent
              </th>
              <th className="border border-white p-2 bg-pink-700 text-white min-w-[70px]">
                Total late marks
              </th>
              <th className="border border-white p-2 bg-orange-800 text-white min-w-[70px]">
                Total half day
              </th>
            </tr>
          </thead>

          <tbody>
            {employees.map((employee, empIndex) => {
              const rowBg = empIndex % 2 === 0 ? "bg-white" : "bg-slate-50";

              return (
                <React.Fragment key={employee.id}>
                  {ROW_TYPES.map((rowType, rowIdx) => (
                    <tr key={`${employee.id}-${rowType}`} className={rowBg}>
                      {rowIdx === 0 && (
                        <>
                          <td
                            rowSpan={ROW_TYPES.length}
                            className={`sticky left-0 z-10 border font-bold text-center align-middle ${rowBg}`}
                          >
                            {employee.id}
                          </td>
                          <td
                            rowSpan={ROW_TYPES.length}
                            className={`sticky left-[40px] z-10 border w-[36px] min-w-[36px] max-w-[36px] p-0 text-center align-middle ${rowBg}`}
                          >
                            <div className="flex flex-col items-center justify-center gap-1 py-1.5">
                              <span
                                className={`h-2 w-2 rounded-full ${employee.avatarColor}`}
                                aria-hidden="true"
                              />
                              <div
                                className="flex items-center justify-center mx-auto font-extrabold text-[11px]"
                                style={{
                                  writingMode: "vertical-rl",
                                  transform: "rotate(180deg)",
                                  whiteSpace: "nowrap",
                                  lineHeight: "14px",
                                  letterSpacing: "2px",
                                }}
                              >
                                {employee.name.toUpperCase()}
                              </div>
                            </div>
                          </td>
                        </>
                      )}

                      {/* row-type label ("Days" sticky column) */}
                      <td
                        className={`sticky left-[76px] z-10 border p-1 font-semibold text-center ${
                          rowType === "OT"
                            ? "bg-green-50"
                            : rowType === "F"
                              ? "bg-red-50 text-red-600"
                              : rowType === "Status"
                                ? "bg-slate-100"
                                : "bg-white"
                        }`}
                      >
                        {rowType}
                      </td>

                      {employee.days.map((d) => {
                        if (rowType === "Status") {
                          return (
                            <td key={d.day} className="border text-center p-1">
                              <Badge
                                className={`rounded-md px-1.5 py-0.5 text-[11px] font-semibold border-none justify-center w-full hover:opacity-90 ${CODE_STYLE[d.code]}`}
                              >
                                {d.code}
                              </Badge>
                            </td>
                          );
                        }
                        const value =
                          rowType === "IN"
                            ? d.in
                            : rowType === "OUT"
                              ? d.out
                              : rowType === "WH"
                                ? d.wh
                                : rowType === "OT"
                                  ? d.ot
                                  : d.f;

                        return (
                          <td
                            key={d.day}
                            className={`border text-center ${
                              rowType === "F"
                                ? "text-red-600 font-semibold bg-red-50"
                                : rowType === "OT"
                                  ? "text-green-700 bg-green-50"
                                  : "text-slate-700"
                            }`}
                          >
                            {value || "-"}
                          </td>
                        );
                      })}

                      {/* summary columns - only rendered once, on the first row, spanning all rows */}
                      {rowIdx === 0 && (
                        <>
                          <td
                            rowSpan={ROW_TYPES.length}
                            className="border text-center align-middle font-bold bg-orange-50 text-orange-800"
                          >
                            {employee.totalHours}
                          </td>
                          <td
                            rowSpan={ROW_TYPES.length}
                            className="border text-center align-middle font-bold bg-emerald-50 text-emerald-800"
                          >
                            {employee.totalPresent}
                          </td>
                          <td
                            rowSpan={ROW_TYPES.length}
                            className="border text-center align-middle font-bold bg-red-50 text-red-700"
                          >
                            {employee.totalAbsent}
                          </td>
                          <td
                            rowSpan={ROW_TYPES.length}
                            className="border text-center align-middle font-bold text-pink-700 bg-pink-50"
                          >
                            {employee.totalLate}
                          </td>
                          <td
                            rowSpan={ROW_TYPES.length}
                            className="border text-center align-middle font-bold text-orange-800 bg-orange-50"
                          >
                            {employee.totalHalfDay}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Empreport;
