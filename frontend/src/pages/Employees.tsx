import { useEffect, useState, useRef } from "react";
import { useAppDispatch } from "@/hooks/useRedux";
import { StatusBadge } from "@/components/StatusBadge";

import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  Pencil,
  FileEdit,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { EmployeeStatus } from "@/types";
import { EmployeeDetailModal } from "@/components/EmployeeDetailModal";
import { useNavigate } from "react-router-dom";
import { EmploymentDetails } from "@/components/EmploymentDetails";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import {
  fetchEmployeesByStatusThunk,
  fetchEmployeesThunk,
} from "@/redux/features/userSlice";
import { toast } from "sonner";
import { fetchDepartments } from "@/redux/features/department/departmentSlice";
import { ApprovalPopup } from "@/components/ApprovalPopup";
import AddEmployee from "@/pages/AddEmployee";
import { SkeletonLoader } from "@/components/Loading";

const formatDate = (date?: string | null) => {
  if (!date) return "-";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "-";
  return format(d, "MMM d, yyyy");
};

export default function Employees() {
  const dispatch = useAppDispatch();

  const { employees, totalPages, currentPage, loading } = useSelector(
    (state: RootState) => state.user,
  );
  const { departments } = useSelector((state: RootState) => state.department);

  const [search, setSearch] = useState("");
  const [dept, setDept] = useState("all");
  const [statusFilter, setStatusFilter] = useState<EmployeeStatus | "all">(
    "all",
  );
  const [page, setPage] = useState(1);

  const [selectedViewId, setSelectedViewId] = useState<number | null>(null);
  const [selectedEmploymentId, setSelectedEmploymentId] = useState<
    number | null
  >(null);
  const [editOnboardingId, setEditOnboardingId] = useState<number | null>(null);

  const [showApprovePopup, setShowApprovePopup] = useState(false);
  const [approvedEmployee, setApprovedEmployee] = useState<any>(null);

  const prevEmployeesRef = useRef(employees);

  const selectedEmployee = selectedViewId
    ? employees.find((e) => e.id === selectedViewId)
    : null;

  useEffect(() => {
    if (statusFilter === "all") dispatch(fetchEmployeesThunk(page));
    else dispatch(fetchEmployeesByStatusThunk({ page, status: statusFilter }));
    dispatch(fetchDepartments());
  }, [dispatch, page, statusFilter]);

  const handleStatusChange = (value: EmployeeStatus | "all") => {
    setStatusFilter(value);
    setPage(1);
  };

  useEffect(() => {
    const prevEmployees = prevEmployeesRef.current;
    employees.forEach((emp) => {
      const prevEmp = prevEmployees.find((e) => e.id === emp.id);
      if (
        prevEmp &&
        prevEmp.status !== "approved" &&
        emp.status === "approved"
      ) {
        setApprovedEmployee(emp);
        setShowApprovePopup(true);
        toast.success(`${emp.firstName} ${emp.lastName} approved successfully`);
      }
    });
    prevEmployeesRef.current = employees;
  }, [employees]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Employees</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {employees.length} employees found
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="stat-card">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, ID, email..."
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border-2 border-border border-purple-200 bg-white focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-purple-700"
            />
          </div>

          <Select value={dept} onValueChange={setDept}>
            <SelectTrigger className="w-full sm:w-44 border-2 border-purple-300">
              <Filter size={14} className="mr-1 text-muted-foreground" />
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d.id} value={d.department_name}>
                  {d.department_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={statusFilter}
            onValueChange={(v) =>
              handleStatusChange(v as EmployeeStatus | "all")
            }
          >
            <SelectTrigger className="w-full sm:w-36 border-2 border-purple-300">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="resubmitted">Re-Submitted</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="stat-card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 text-sm uppercase">
                  Employee
                </th>
                <th className="text-left px-4 py-3 text-sm uppercase hidden md:table-cell">
                  Department
                </th>
                <th className="text-left px-4 py-3 text-sm uppercase hidden lg:table-cell">
                  Designation
                </th>
                <th className="text-left px-4 py-3 text-sm uppercase hidden xl:table-cell">
                  Joining Date
                </th>
                <th className="text-left px-4 py-3 text-sm uppercase">
                  Status
                </th>
                <th className="text-left px-4 py-3 text-sm uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-4">
                    <SkeletonLoader type="table" />
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-muted-foreground"
                  >
                    No employees found.
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr
                    key={emp.id}
                    className="border-b hover:bg-muted/30 cursor-pointer"
                    onClick={() => setSelectedViewId(emp.id)}
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white"
                          style={{ background: "var(--gradient-primary)" }}
                        >
                          {(emp.firstName?.charAt(0) || "") +
                            (emp.lastName?.charAt(0) || "") || "NA"}
                        </div>
                        <div>
                          <p className="font-medium">
                            {emp.firstName} {emp.lastName}
                          </p>
                          {emp.employeeId && (
                            <p className="text-sm text-muted-foreground">
                              {emp.employeeId}
                            </p>
                          )}
                          {emp.tempId && (
                            <p
                              className={`text-sm text-muted-foreground ${emp.employeeId ? "opacity-50" : "opacity-100"}`}
                            >
                              {emp.tempId}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      {emp.department_name}
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      {emp.designation}
                    </td>
                    <td className="px-4 py-3.5 text-sm hidden xl:table-cell">
                      {formatDate(emp.joiningDate)}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={emp.status} />
                    </td>
                    <td
                      className="px-4 py-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-2">
                        <button
                          title="View Profile"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedViewId(emp.id);
                          }}
                          className="p-1.5 rounded border bg-green-600 text-white hover:bg-green-700 transition-colors"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          title="Edit Onboarding Form"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditOnboardingId(emp.id);
                          }}
                          className="p-1.5 rounded border bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          title="Edit Employment Details (HR)"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEmploymentId(emp.id);
                          }}
                          className="p-1.5 rounded border bg-orange-500 text-white hover:bg-orange-600 transition-colors"
                        >
                          <FileEdit size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <p className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex items-center gap-1">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-40"
              >
                <ChevronLeft size={15} />
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-40"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedEmployee && (
        <EmployeeDetailModal
          employee={selectedEmployee}
          onClose={() => setSelectedViewId(null)}
        />
      )}

      {selectedEmploymentId && (
        <EmploymentDetails
          employeeId={selectedEmploymentId}
          open={true}
          onClose={() => setSelectedEmploymentId(null)}
        />
      )}

      {editOnboardingId && (
        <AddEmployee
          editEmployeeId={editOnboardingId}
          isModal={true}
          onClose={() => setEditOnboardingId(null)}
        />
      )}

      <ApprovalPopup
        open={showApprovePopup}
        employeeName={`${approvedEmployee?.firstName || ""} ${approvedEmployee?.lastName || ""}`}
        onClose={() => setShowApprovePopup(false)}
      />
    </div>
  );
}
