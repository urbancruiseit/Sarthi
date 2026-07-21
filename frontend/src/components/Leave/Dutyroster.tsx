import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2,
  Search,
  CalendarDays,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppDispatch, useAppSelector } from "@/hooks/useRedux";
import {
  fetchDutyRosters,
  createDutyRosterThunk,
  updateDutyRosterThunk,
  deleteDutyRosterThunk,
  clearDutyRosterError,
  DutyRosterRecord,
} from "@/redux/features/Dutyroster/Dutyrosterslice";
import { fetchHolidays } from "@/redux/features/Calendar/calendarSlice";

import { RootState } from "@/redux/store";
import BranchFilter from "@/components/FilterComponent/BranchFilter";
import DepartmentFilter from "@/components/FilterComponent/DepartmentFilter";
import EmployeeFilter from "../FilterComponent/EmployeeFilter";
import DutyRosterForm, {
  EMPTY_FORM,
  FormState,
  formatDateLabel,
  toDateInputValue,
} from "../addFromModels/Dutyrosterform";

export default function DutyRoster() {
  const dispatch = useAppDispatch();
  const {
    list: rows,
    loading,
    error,
  } = useAppSelector((state: RootState) => state.dutyRoster);
  const { list: holidays } = useAppSelector((s: RootState) => s.holiday);

  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [employeeFilter, setEmployeeFilter] = useState<string>("all");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("");

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<DutyRosterRecord | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const isEditing = form.id !== null;

  useEffect(() => {
    dispatch(
      fetchDutyRosters(
        activeFilter !== "all" ? { isActive: activeFilter } : undefined,
      ),
    );
  }, [dispatch, activeFilter]);

  // Fetch holidays for the branch picked inside the modal, as soon as the
  // branch is chosen (not just once a date is picked) so the Holiday
  // dropdown is already populated for the user to choose from. Uses the
  // selected duty date's year if present, else falls back to the current
  // year, and refetches whenever the date's year changes.
  useEffect(() => {
    if (!form.branchId) return;
    const year = form.dutyDate
      ? new Date(form.dutyDate).getFullYear()
      : new Date().getFullYear();
    if (Number.isNaN(year)) return;
    dispatch(fetchHolidays({ branchId: form.branchId, year }));
  }, [dispatch, form.branchId, form.dutyDate]);

  // All holidays for the branch currently picked inside the modal.
  const branchHolidays = useMemo(() => {
    if (!form.branchId) return [];
    return holidays.filter((h) => String(h.branch_id) === form.branchId);
  }, [holidays, form.branchId]);

  // Holiday (if any) matching the selected branch + duty date. Uses
  // toDateInputValue (local-timezone date) instead of slicing the raw UTC
  // string, since the API stores midnight IST as the previous day's UTC time.
  const matchedHoliday = useMemo(() => {
    if (!form.branchId || !form.dutyDate) return null;
    return (
      branchHolidays.find((h) => toDateInputValue(h.date) === form.dutyDate) ??
      null
    );
  }, [branchHolidays, form.dutyDate]);

  // Called when the user picks a holiday from the dropdown inside the form —
  // auto-fills the Duty Date field with that holiday's date.
  const handleSelectHoliday = (holidayId: string) => {
    const holiday = branchHolidays.find((h) => String(h.id) === holidayId);
    if (holiday?.date) {
      setForm((f) => ({ ...f, dutyDate: toDateInputValue(holiday.date) }));
    }
  };

  const filteredRows = useMemo(() => {
    const keyword = search.toLowerCase();
    return rows.filter((r) => {
      const anyRow = r as any;
      const name = (r.employee_name ?? r.full_name ?? "").toLowerCase();
      const department = (anyRow.department_name ?? "").toLowerCase();

      const matchesSearch =
        name.includes(keyword) ||
        department.includes(keyword) ||
        (r.duty_type ?? "").toLowerCase().includes(keyword);

      const matchesBranch =
        branchFilter === "all" ||
        String(anyRow.branch_id ?? "") === branchFilter;

      const matchesDepartment =
        departmentFilter === "all" ||
        String(anyRow.department_id ?? "") === departmentFilter;

      const matchesEmployee =
        employeeFilter === "all" ||
        String(r.employee_id ?? "") === employeeFilter;

      const matchesDate =
        !dateFilter || r.duty_date?.slice(0, 10) === dateFilter;

      return (
        matchesSearch &&
        matchesBranch &&
        matchesDepartment &&
        matchesEmployee &&
        matchesDate
      );
    });
  }, [
    rows,
    search,
    branchFilter,
    departmentFilter,
    employeeFilter,
    dateFilter,
  ]);

  const openCreateForm = () => {
    setForm(EMPTY_FORM);
    setFormError(null);
    setFormOpen(true);
  };

  const openEditForm = (row: DutyRosterRecord) => {
    const anyRow = row as any;
    const dutyDate = toDateInputValue(row.duty_date);
    const branchId = String(anyRow.branch_id ?? "");

    // Try to preselect the matching holiday (if this duty date happens to
    // land on one) so the Holiday dropdown stays in sync when editing.
    const matched = holidays.find(
      (h) =>
        String(h.branch_id) === branchId &&
        toDateInputValue(h.date) === dutyDate,
    );

    setForm({
      id: row.id,
      branchId,
      employeeId: String(row.employee_id),
      dutyDate,
      holidayId: matched ? String(matched.id) : "",
      status: anyRow.status ?? "",
      dutyType: row.duty_type ?? "",
      dutyTiming: row.duty_timing ?? "",
      location: row.location ?? "",
      remarks: row.remarks ?? "",
      isActive: Number(row.is_active) === 1,
    });

    setFormError(null);
    setFormOpen(true);
  };

  const closeForm = () => {
    if (saving) return;
    setFormOpen(false);
  };

  const validateForm = (): string | null => {
    if (!form.branchId) return "Please select a branch.";
    if (!form.employeeId) return "Please select an employee.";
    if (!form.dutyDate) return "Duty date is required.";
    if (!form.status) return "Please select present or absent.";

    return null;
  };

  const refetchList = () =>
    dispatch(
      fetchDutyRosters(
        activeFilter !== "all" ? { isActive: activeFilter } : undefined,
      ),
    );

  const submitForm = async () => {
    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setSaving(true);
    setFormError(null);

    const payload = {
      branchId: Number(form.branchId),
      employeeId: Number(form.employeeId),
      dutyDate: form.dutyDate,
      status: form.status,
      isActive: form.isActive ? 1 : 0,
    };

    try {
      if (isEditing && form.id !== null) {
        await dispatch(
          updateDutyRosterThunk({ id: form.id, payload }),
        ).unwrap();
      } else {
        await dispatch(createDutyRosterThunk(payload)).unwrap();
      }

      setFormOpen(false);
      refetchList();
    } catch (err: any) {
      setFormError(
        typeof err === "string"
          ? err
          : err?.message || "Failed to save duty roster entry",
      );
    } finally {
      setSaving(false);
    }
  };

  // Inline Active/Inactive toggle straight from the table — reuses the same
  // update/deactivate thunks so no separate endpoint is needed.
  const handleToggleActive = async (row: DutyRosterRecord, next: boolean) => {
    const anyRow = row as any;
    setTogglingId(row.id);
    try {
      if (!next) {
        // turning OFF -> deactivate
        await dispatch(deleteDutyRosterThunk({ id: row.id })).unwrap();
      } else {
        // turning ON -> reactivate via full update, keeping existing values
        await dispatch(
          updateDutyRosterThunk({
            id: row.id,
            payload: {
              branchId: Number(anyRow.branch_id),
              employeeId: Number(row.employee_id),
              dutyDate: row.duty_date?.slice(0, 10) ?? "",
              status: anyRow.status ?? "",
              isActive: 1,
            },
          }),
        ).unwrap();
      }
      refetchList();
    } catch {
      // error already captured in redux state via `error`
    } finally {
      setTogglingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await dispatch(deleteDutyRosterThunk({ id: deleteTarget.id })).unwrap();
      setDeleteTarget(null);
      refetchList();
    } catch {
      // error already captured in redux state via `error`
    } finally {
      setDeleting(false);
    }
  };

  const dismissError = () => dispatch(clearDutyRosterError());

  return (
    <div className="space-y-6">
      {/* Filters — same components/pattern as Attendance.tsx */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-col sm:flex-row flex-wrap gap-3">
          <div className="relative max-w-xs w-full">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search employee or department…"
              className="w-full pl-9 pr-4 h-9 rounded-lg border border-input bg-background text-sm"
            />
          </div>

          <BranchFilter value={branchFilter} onChange={setBranchFilter} />

          <DepartmentFilter
            value={departmentFilter}
            onChange={setDepartmentFilter}
          />

          <EmployeeFilter
            value={employeeFilter}
            onChange={setEmployeeFilter}
            branchId={branchFilter}
          />

          <Select value={activeFilter} onValueChange={setActiveFilter}>
            <SelectTrigger className="w-full sm:w-[150px] h-9 text-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="1">Active</SelectItem>
              <SelectItem value="0">Inactive</SelectItem>
            </SelectContent>
          </Select>

          <div className="relative w-full sm:w-[170px]">
            <CalendarDays
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full pl-9 pr-3 h-9 rounded-lg border border-input bg-background text-sm"
            />
          </div>

          {dateFilter && (
            <Button
              size="sm"
              variant="secondary"
              className="h-9"
              onClick={() => setDateFilter("")}
            >
              Clear Date
            </Button>
          )}
        </div>

        {/* Right Side */}
        <Button
          className="gap-2 text-white border-none hover:opacity-90"
          style={{ background: "#9333EA" }}
          onClick={openCreateForm}
        >
          <Plus size={16} />
          New Duty
        </Button>
      </div>

      {error && (
        <div
          className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium"
          style={{ background: "#FEE2E2", color: "#B91C1C" }}
        >
          <span>{error}</span>
          <button onClick={dismissError} className="ml-3">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Table */}
      <div
        className="rounded-xl border-2 bg-card overflow-hidden"
        style={{ borderColor: "#E9D5FF" }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#6B21A8" }}>
                {[
                  "Employee",
                  "Department",
                  "Branch",
                  "Duty Date",
                  "Status",
                  "Active",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-xs font-semibold text-white uppercase whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && filteredRows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
                      <Loader2 size={16} className="animate-spin" />
                      Loading duty roster…
                    </div>
                  </td>
                </tr>
              )}

              {!loading && filteredRows.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-sm text-muted-foreground"
                  >
                    No duty roster entries found.
                  </td>
                </tr>
              )}

              {filteredRows.map((row) => {
                const anyRow = row as any;
                const isActive = Number(row.is_active) === 1;

                return (
                  <tr
                    key={row.id}
                    className="border-b border-border/50 hover:bg-muted/30"
                  >
                    <td className="px-4 py-3 font-medium">
                      {row.full_name ||
                        row.employee_name ||
                        `#${row.employee_id ?? "-"}`}
                    </td>

                    <td className="px-4 py-3">
                      {anyRow.department_name || "-"}
                    </td>

                    <td className="px-4 py-3">{anyRow.branch_name || "-"}</td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      {row.duty_date ? formatDateLabel(row.duty_date) : "-"}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className="px-3 py-1 rounded-full text-xs font-medium"
                        style={
                          anyRow.status === "Present"
                            ? {
                                background: "hsl(var(--success) / 0.12)",
                                color: "hsl(var(--success))",
                              }
                            : {
                                background: "#FEE2E2",
                                color: "#B91C1C",
                              }
                        }
                      >
                        {anyRow.status || "-"}
                      </span>
                    </td>

                    {/* Inline active/inactive edit toggle */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={isActive}
                          disabled={togglingId === row.id}
                          onCheckedChange={(next) =>
                            handleToggleActive(row, next)
                          }
                        />
                        <span
                          className="text-xs font-medium"
                          style={{
                            color: isActive ? "#16A34A" : "#6B7280",
                          }}
                        >
                          {togglingId === row.id
                            ? "..."
                            : isActive
                              ? "Active"
                              : "Inactive"}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 gap-1.5"
                          onClick={() => openEditForm(row)}
                        >
                          <Pencil size={13} />
                          Edit
                        </Button>

                        <Button
                          size="sm"
                          className="h-8 gap-1.5 text-white border-none hover:opacity-90"
                          style={{ background: "#DC2626" }}
                          onClick={() => setDeleteTarget(row)}
                          disabled={!isActive}
                        >
                          <Trash2 size={13} />
                          Deactivate
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal — extracted into its own component */}
      <DutyRosterForm
        open={formOpen}
        onClose={closeForm}
        form={form}
        setForm={setForm}
        onSubmit={submitForm}
        saving={saving}
        formError={formError}
        matchedHoliday={matchedHoliday}
        branchHolidays={branchHolidays}
        onSelectHoliday={handleSelectHoliday}
        isEditing={isEditing}
      />

      {/* Deactivate Confirmation Modal */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent className="sm:max-w-[420px] p-0 gap-0 overflow-hidden rounded-2xl border-none shadow-2xl bg-white">
          <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background hover:opacity-100 z-10">
            <X className="h-4 w-4 text-red-500 hover:text-red-700 transition-colors" />
            <span className="sr-only">Close</span>
          </DialogClose>

          <div
            className="h-20 w-full relative"
            style={{ background: "#DC2626" }}
          >
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-16 h-16 rounded-2xl bg-white border-2 border-border shadow-lg flex items-center justify-center">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{ background: "#FEE2E2" }}
              >
                <Trash2 size={20} style={{ color: "#DC2626" }} />
              </div>
            </div>
          </div>

          <div className="pt-12 px-6 pb-6 space-y-6">
            <DialogHeader className="space-y-2">
              <DialogTitle className="text-center text-xl font-bold">
                Deactivate Duty Entry
              </DialogTitle>
              <DialogDescription className="text-center text-sm text-muted-foreground">
                {deleteTarget && (
                  <>
                    This will mark the duty roster entry for{" "}
                    <span className="font-semibold text-foreground">
                      {deleteTarget.employee_name ??
                        `#${deleteTarget.employee_id}`}
                    </span>{" "}
                    as inactive. You can still view it in history.
                  </>
                )}
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="flex-row justify-center gap-3 sm:justify-center">
              <Button
                variant="outline"
                className="flex-1 h-11 rounded-xl"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 h-11 rounded-xl gap-2 text-white border-none"
                style={{ background: "#DC2626" }}
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Trash2 size={16} />
                )}
                Deactivate
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
