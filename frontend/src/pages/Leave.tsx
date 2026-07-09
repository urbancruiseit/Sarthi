import React from "react";

function Leave() {
  return (
    <>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                {["Employee", "Department", "Leave Type", "Status"].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leaveEmployees.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="text-center py-12 text-muted-foreground"
                  >
                    No employees on leave today
                  </td>
                </tr>
              ) : (
                leaveEmployees.map((emp) => (
                  <tr
                    key={emp.id}
                    className="border-b border-border/50 hover:bg-muted/30"
                  >
                    <td className="px-4 py-3">
                      {emp.firstName} {emp.lastName}
                    </td>
                    <td className="px-4 py-3">{emp.department}</td>
                    <td className="px-4 py-3">Casual Leave</td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        Approved
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export default Leave;
