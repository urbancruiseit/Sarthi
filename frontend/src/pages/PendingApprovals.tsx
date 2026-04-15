import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { StatusBadge } from "@/components/StatusBadge";
import { EmployeeDetailModal } from "@/components/EmployeeDetailModal";
import { SkeletonLoader } from "@/components/Loading";
import { Search, ClipboardCheck, Eye } from "lucide-react";
import { format } from "date-fns";
import { useAppDispatch } from "@/hooks/useRedux";
import { fetchEmployeesThunk } from "@/redux/features/userSlice";

const formatDate = (date?: string | null) => {
  if (!date) return "—";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "—";
  return format(d, "MMM d, yyyy");
};

export default function PendingApprovals() {
  const dispatch = useAppDispatch();
  const { employees, loading } = useSelector((state: RootState) => state.user);

  const [search, setSearch] = useState("");
  const [selectedViewId, setSelectedViewId] = useState<number | null>(null);

  useEffect(() => {
    dispatch(fetchEmployeesThunk());
  }, [dispatch]);

  // Only pending and resubmitted
  const pendingEmployees = employees.filter((e) => e.status === "pending");

  const filtered = pendingEmployees.filter((e) =>
    `${e.firstName} ${e.lastName} ${e.employeeId} ${e.tempId}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  const selectedEmployee = selectedViewId
    ? employees.find((e) => e.id === selectedViewId)
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Pending Approvals</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {pendingEmployees.length} form
          {pendingEmployees.length !== 1 ? "s" : ""} awaiting review
        </p>
      </div>

      {loading ? (
        <div className="stat-card p-4">
          <SkeletonLoader type="table" />
        </div>
      ) : pendingEmployees.length === 0 ? (
        <div className="stat-card flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-success-light flex items-center justify-center mb-4">
            <ClipboardCheck
              size={28}
              style={{ color: "hsl(var(--success))" }}
            />
          </div>
          <h2 className="font-semibold text-lg">All caught up!</h2>
          <p className="text-muted-foreground text-sm mt-1">
            No pending approvals at the moment.
          </p>
        </div>
      ) : (
        <>
          {/* Search */}
          <div className="stat-card">
            <div className="relative">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search pending employees..."
                className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-border bg-muted/40 focus:outline-none focus:ring-2 focus:ring-ring max-w-sm"
              />
            </div>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.length === 0 ? (
              <p className="text-muted-foreground text-sm col-span-full text-center py-8">
                No employees match your search.
              </p>
            ) : (
              filtered.map((emp) => (
                <div
                  key={emp.id}
                  className="stat-card cursor-pointer hover:scale-[1.01] transition-transform"
                  onClick={() => setSelectedViewId(emp.id)}
                >
                  {/* Top: avatar + name + status */}
                  <div className="flex items-start gap-3 mb-4">
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                      style={{ background: "var(--gradient-primary)" }}
                    >
                      {(emp.firstName?.charAt(0) || "") +
                        (emp.lastName?.charAt(0) || "") || "NA"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground">
                        {emp.firstName} {emp.lastName}
                      </p>
                      {emp.employeeId && (
                        <p className="text-xs text-muted-foreground">
                          {emp.employeeId}
                        </p>
                      )}
                      {emp.tempId && (
                        <p
                          className={`text-xs text-muted-foreground ${emp.employeeId ? "opacity-50" : ""}`}
                        >
                          {emp.tempId}
                        </p>
                      )}
                    </div>
                    <StatusBadge status={emp.status} />
                  </div>

                  {/* Info rows */}
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-xs">
                        Department
                      </span>
                      <span className="text-xs font-medium">
                        {emp.department_name || "—"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-xs">
                        Designation
                      </span>
                      <span className="text-xs font-medium">
                        {emp.subDepartment_name || "—"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-xs">
                        Joining Date
                      </span>
                      <span className="text-xs font-medium">
                        {formatDate(emp.joiningDate)}
                      </span>
                    </div>
                  </div>

                  {/* View only button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedViewId(emp.id);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90 bg-green-600"
                  >
                    <Eye size={13} /> Review & Decide
                  </button>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* View Modal only */}
      {selectedEmployee && (
        <EmployeeDetailModal
          employee={selectedEmployee}
          onClose={() => setSelectedViewId(null)}
        />
      )}
    </div>
  );
}
