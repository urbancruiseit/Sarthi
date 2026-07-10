import {
  Users,
  CheckCircle,
  CalendarOff,
  TimerReset,
  CalendarDays,
} from "lucide-react";
import { DisplayRow } from "./Attendanceutils";

interface AttendanceStatsCardsProps {
  rows: DisplayRow[];
  isDrillDown: boolean;
  currentMonthStr: string;
  selectedDateLabel: string;
}

export default function AttendanceStatsCards({
  rows,
  isDrillDown,
  currentMonthStr,
  selectedDateLabel,
}: AttendanceStatsCardsProps) {
  const totalEmployee = rows.length;
  const presentCount = rows.filter((e) => e.status === "Present").length;
  const absentCount = rows.filter((e) => e.status === "Absent").length;
  const leaveCount = rows.filter((e) => e.status === "Leave").length;

  const cards = [
    {
      label: isDrillDown ? "This Month" : "Selected Date",
      value: isDrillDown ? currentMonthStr : selectedDateLabel,
      icon: CalendarDays,
      bg: "bg-orange-200",
    },
    {
      label: "Total Employee",
      value: totalEmployee,
      icon: Users,
      bg: "bg-sky-200",
    },
    {
      label: "Present",
      value: presentCount,
      icon: CheckCircle,
      bg: "bg-green-200",
    },
    {
      label: "Absent",
      value: absentCount,
      icon: Users,
      bg: "bg-red-200",
    },
    {
      label: "Leave",
      value: leaveCount,
      icon: CalendarOff,
      bg: "bg-blue-200",
    },
    {
      label: "Comp Off",
      value: 0,
      icon: TimerReset,
      bg: "bg-violet-200",
    },
    {
      label: "LWP",
      value: 0,
      icon: TimerReset,
      bg: "bg-yellow-200",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-7 xl:grid-cols-7 gap-4">
      {cards.map(({ label, value, icon: Icon, bg }) => (
        <div
          key={label}
          className={`${bg} rounded-2xl p-5 flex items-center gap-4 shadow-md hover:shadow-xl transition-all`}
        >
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-white/40">
            <Icon size={28} className="text-gray-700" />
          </div>

          <div>
            <p className="text-sm font-semibold tracking-wide text-gray-700">
              {label}
            </p>

            <p className="text-xl font-extrabold text-gray-900 mt-1">{value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
