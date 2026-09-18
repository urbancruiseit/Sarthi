"use client";

import React, { useMemo, useState } from "react";
import { ChevronDown, Download, Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const months = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
];

const employees = [
  {
    id: 1,
    name: "Ashish Mathur",
    doj: "17-Apr-25",
    dol: "",
    tenure: "",
    joiningMonth: 3,
    monthly: {
      JAN: null,
      FEB: null,
      MAR: null,
      APR: null,
      MAY: null,
      JUN: null,
      JUL: null,
      AUG: null,
      SEP: 1,
      OCT: 0,
      NOV: 1,
      DEC: 0,
    },
    cf: 0,
    credit: 5,
    total: 5,
    available: 2,
    balance: 3,
  },
  {
    id: 2,
    name: "Monu Gehlot",
    doj: "29-May-25",
    dol: "",
    tenure: "",
    joiningMonth: 4,
    monthly: {
      JAN: null,
      FEB: null,
      MAR: null,
      APR: null,
      MAY: null,
      JUN: null,
      JUL: null,
      AUG: null,
      SEP: null,
      OCT: null,
      NOV: 2,
      DEC: 0,
    },
    cf: 0,
    credit: 3,
    total: 3,
    available: 2,
    balance: 1,
  },
  {
    id: 3,
    name: "Vishnu Yadav",
    doj: "27-May-25",
    dol: "13-Oct-25",
    tenure: "",
    joiningMonth: 4,
    leavingMonth: 9,
    monthly: {
      JAN: null,
      FEB: null,
      MAR: null,
      APR: null,
      MAY: null,
      JUN: null,
      JUL: null,
      AUG: null,
      SEP: null,
      OCT: null,
      NOV: null,
      DEC: null,
    },
    cf: 0,
    credit: 0,
    total: 0,
    available: 0,
    balance: 0,
  },
  {
    id: 4,
    name: "Mitali Singh",
    doj: "27-Nov-25",
    dol: "",
    tenure: "",
    joiningMonth: 10,
    monthly: {
      JAN: null,
      FEB: null,
      MAR: null,
      APR: null,
      MAY: null,
      JUN: null,
      JUL: null,
      AUG: null,
      SEP: null,
      OCT: null,
      NOV: null,
      DEC: null,
    },
    cf: 0,
    credit: 4,
    total: 4,
    available: 0,
    balance: 4,
  },
  {
    id: 5,
    name: "Garima Verma",
    doj: "11-Jun-25",
    dol: "",
    tenure: "",
    joiningMonth: 5,
    monthly: {
      JAN: null,
      FEB: null,
      MAR: null,
      APR: null,
      MAY: null,
      JUN: null,
      JUL: null,
      AUG: null,
      SEP: null,
      OCT: null,
      NOV: null,
      DEC: null,
    },
    cf: 0,
    credit: 0,
    total: 0,
    available: 0,
    balance: 0,
  },
  {
    id: 6,
    name: "Abhishek Kumar",
    doj: "15-Sep-25",
    dol: "",
    tenure: "",
    joiningMonth: 8,
    monthly: {
      JAN: null,
      FEB: null,
      MAR: null,
      APR: null,
      MAY: null,
      JUN: null,
      JUL: null,
      AUG: null,
      SEP: null,
      OCT: null,
      NOV: null,
      DEC: null,
    },
    cf: 0,
    credit: 0,
    total: 0,
    available: 0,
    balance: 0,
  },
  {
    id: 7,
    name: "Kumari Cristi",
    doj: "10-Jun-25",
    dol: "",
    tenure: "",
    joiningMonth: 5,
    monthly: {
      JAN: null,
      FEB: null,
      MAR: null,
      APR: null,
      MAY: null,
      JUN: null,
      JUL: null,
      AUG: null,
      SEP: 1,
      OCT: 0,
      NOV: 0,
      DEC: 0,
    },
    cf: 0,
    credit: 4,
    total: 4,
    available: 1,
    balance: 3,
  },
  {
    id: 8,
    name: "Sannu Chaturedi",
    doj: "10-Nov-25",
    dol: "",
    tenure: "",
    joiningMonth: 10,
    monthly: {
      JAN: null,
      FEB: null,
      MAR: null,
      APR: null,
      MAY: null,
      JUN: null,
      JUL: null,
      AUG: null,
      SEP: null,
      OCT: null,
      NOV: null,
      DEC: null,
    },
    cf: 0,
    credit: 5,
    total: 5,
    available: 0,
    balance: 5,
  },
  {
    id: 9,
    name: "Anshika Chaurasiya",
    doj: "30-Jun-25",
    dol: "",
    tenure: "",
    joiningMonth: 6,
    monthly: {
      JAN: null,
      FEB: null,
      MAR: null,
      APR: null,
      MAY: null,
      JUN: null,
      JUL: null,
      AUG: null,
      SEP: null,
      OCT: null,
      NOV: null,
      DEC: null,
    },
    cf: 0,
    credit: 0,
    total: 0,
    available: 0,
    balance: 0,
  },
];

const departmentGroups = [
  {
    name: "HO",
    ids: [1, 2, 3, 4, 5, 6],
  },
  {
    name: "SALES",
    ids: [7, 8],
  },
  {
    name: "ADMIN",
    ids: [9],
  },
];

function getMonthIndex(month) {
  return months.indexOf(month);
}

function isBeforeJoining(employee, month) {
  return getMonthIndex(month) < employee.joiningMonth;
}

function isAfterLeaving(employee, month) {
  if (employee.leavingMonth === undefined) return false;

  return getMonthIndex(month) > employee.leavingMonth;
}

function EmployeeRow({ employee }) {
  return (
    <tr className="h-[34px]">
      {/* Employee Details */}
      <td className="sticky left-0 z-20 min-w-[105px] border border-gray-500 bg-[#b9a6ff] px-1 text-[12px] font-semibold text-black">
        {employee.name}
      </td>

      <td className="sticky left-[105px] z-20 min-w-[78px] border border-gray-500 bg-[#f8c890] px-1 text-[11px]">
        {employee.doj}
      </td>

      <td className="sticky left-[183px] z-20 min-w-[78px] border border-gray-500 bg-[#f8c890] px-1 text-[11px]">
        {employee.dol}
      </td>

      <td className="sticky left-[261px] z-20 min-w-[48px] border border-gray-500 bg-[#f8c890] px-1 text-[11px]">
        {employee.tenure}
      </td>

      {/* Monthly Leaves */}
      {months.map((month) => {
        const beforeJoining = isBeforeJoining(employee, month);
        const afterLeaving = isAfterLeaving(employee, month);

        const value = employee.monthly[month];

        let cellClass =
          "border border-gray-500 text-center text-[13px] font-semibold";

        if (beforeJoining || afterLeaving) {
          cellClass += " bg-[#333333] text-[#333333]";
        } else if (value !== null) {
          cellClass += " bg-white text-gray-500";
        } else {
          cellClass += " bg-[#00ff00] text-black";
        }

        return (
          <td key={month} className={cellClass}>
            {value !== null && !beforeJoining && !afterLeaving ? value : ""}
          </td>
        );
      })}

      {/* Annual */}
      <td className="min-w-[48px] border border-gray-500 bg-[#fff0cc] text-center text-[13px] font-semibold text-gray-500">
        {employee.cf}
      </td>

      <td className="min-w-[48px] border border-gray-500 bg-[#fff0cc] text-center text-[13px] font-semibold text-gray-700">
        {employee.credit}
      </td>

      <td className="min-w-[48px] border border-gray-500 bg-[#fff0cc] text-center text-[13px] font-bold">
        {employee.total}
      </td>

      <td className="min-w-[55px] border border-gray-500 bg-[#ffff00] text-center text-[13px] font-bold text-red-600">
        {employee.available}
      </td>

      <td className="min-w-[55px] border border-gray-500 bg-[#8cff58] text-center text-[13px] font-bold text-blue-700">
        {employee.balance}
      </td>
    </tr>
  );
}

function DepartmentRow({ name }) {
  return (
    <tr>
      <td
        colSpan={4 + months.length + 5}
        className="h-[24px] border border-gray-500 bg-[#d9ead3] px-2 text-left text-[12px] font-bold uppercase"
      >
        {name}
      </td>
    </tr>
  );
}

export default function LeaveManagementTable() {
  const [year, setYear] = useState("2025");
  const [search, setSearch] = useState("");
  const [ho, setHo] = useState("HO");

  const filteredEmployees = useMemo(() => {
    if (!search.trim()) return employees;

    return employees.filter((employee) =>
      employee.name.toLowerCase().includes(search.toLowerCase()),
    );
  }, [search]);

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="mx-auto w-full max-w-[1600px] overflow-hidden rounded-lg border border-gray-400 bg-white shadow-md">
        {/* Top Header */}
        <div className="flex h-[44px] items-center border-b border-gray-600 bg-[#00a000]">
          <div className="flex flex-1 items-center justify-center">
            <h1 className="text-[21px] font-extrabold tracking-wide text-white">
              LEAVE MANAGEMENT SYSTEM
            </h1>
          </div>

          <div className="flex h-full w-[145px] items-center justify-center border-l border-r border-green-800 bg-[#008c00]">
            <Select value={ho} onValueChange={setHo}>
              <SelectTrigger className="h-8 w-[115px] border-none bg-transparent text-center text-[18px] font-bold text-white shadow-none focus:ring-0">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="HO">HO</SelectItem>
                <SelectItem value="Delhi">Delhi</SelectItem>
                <SelectItem value="Mumbai">Mumbai</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex h-full w-[245px] items-center justify-center bg-[#f3d7f3]">
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="h-9 w-[110px] border-none bg-transparent text-center text-[25px] font-extrabold tracking-[8px] shadow-none focus:ring-0">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2026">2026</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-gray-50 p-3">
          <div className="flex items-center gap-2">
            <Button className="gap-2 bg-green-600 hover:bg-green-700">
              <Plus size={16} />
              Add Employee
            </Button>

            <Button variant="outline" className="gap-2">
              <Download size={16} />
              Export
            </Button>
          </div>

          <div className="relative w-[260px]">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <Input
              placeholder="Search employee..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-auto">
          <table className="border-collapse table-fixed">
            {/* Header Row 1 */}
            <thead>
              <tr>
                <th
                  colSpan={4}
                  className="sticky left-0 z-30 border border-gray-500 bg-[#f6b832] py-2 text-[13px] font-extrabold"
                >
                  EMPLOYMENT DETAILS
                </th>

                <th
                  colSpan={12}
                  className="border border-gray-500 bg-[#e8b6d8] text-center text-[14px] font-extrabold"
                >
                  PAID LEAVES (MONTHLY)
                </th>

                <th
                  colSpan={5}
                  className="border border-gray-500 bg-[#f7e3ad] text-center text-[13px] font-extrabold"
                >
                  PAID LEAVES (ANNUAL)
                </th>
              </tr>

              {/* Header Row 2 */}
              <tr className="h-[38px]">
                <th className="sticky left-0 z-30 min-w-[105px] border border-gray-500 bg-[#f6c74e] text-[11px]">
                  STAFF NAME
                  <ChevronDown size={12} className="mx-auto" />
                </th>

                <th className="sticky left-[105px] z-30 min-w-[78px] border border-gray-500 bg-[#f6c74e] text-[11px]">
                  DOJ
                  <ChevronDown size={12} className="mx-auto" />
                </th>

                <th className="sticky left-[183px] z-30 min-w-[78px] border border-gray-500 bg-[#f6c74e] text-[11px]">
                  DOL
                  <ChevronDown size={12} className="mx-auto" />
                </th>

                <th className="sticky left-[261px] z-30 min-w-[48px] border border-gray-500 bg-[#f6c74e] text-[11px]">
                  TENURE
                </th>

                {months.map((month) => (
                  <th
                    key={month}
                    className="min-w-[48px] border border-gray-500 bg-[#f4bfdc] text-[12px] font-extrabold"
                  >
                    {month}
                    <ChevronDown size={11} className="mx-auto" />
                  </th>
                ))}

                <th className="min-w-[48px] border border-gray-500 bg-[#f7e3ad] text-[10px] font-bold">
                  C/F
                  <br />
                  202
                </th>

                <th className="min-w-[48px] border border-gray-500 bg-[#f7e3ad] text-[10px] font-bold">
                  CREDIT
                  <br />T 20
                </th>

                <th className="min-w-[48px] border border-gray-500 bg-[#f7e3ad] text-[10px] font-bold">
                  TOTAL
                </th>

                <th className="min-w-[55px] border border-gray-500 bg-[#ffff00] text-[10px] font-bold">
                  AVAILABLE
                </th>

                <th className="min-w-[55px] border border-gray-500 bg-[#8cff58] text-[10px] font-bold">
                  BALANCE
                </th>
              </tr>
            </thead>

            <tbody>
              {departmentGroups.map((group) => {
                const groupEmployees = filteredEmployees.filter((employee) =>
                  group.ids.includes(employee.id),
                );

                if (!groupEmployees.length) return null;

                return (
                  <React.Fragment key={group.name}>
                    <DepartmentRow name={group.name} />

                    {groupEmployees.map((employee) => (
                      <EmployeeRow key={employee.id} employee={employee} />
                    ))}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t bg-gray-50 px-4 py-2 text-xs text-gray-500">
          <span>Total Employees: {filteredEmployees.length}</span>

          <span>Year: {year}</span>
        </div>
      </div>
    </div>
  );
}
