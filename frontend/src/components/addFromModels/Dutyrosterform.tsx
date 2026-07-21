import { Dispatch, SetStateAction } from "react";
import { ClipboardList, X, Check, Loader2, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import BranchFilter from "@/components/FilterComponent/BranchFilter";
import EmployeeFilter from "../FilterComponent/EmployeeFilter";
import { Holiday } from "../Callender/Holidaymanager";

export type FormState = {
  id: number | null;
  branchId: string;
  holidayId: string;
  employeeId: string;
  dutyDate: string;
  status: string; // "Present" | "Absent"
  isActive: boolean;
};

export const DUTY_TYPES = [
  "Guard Duty",
  "Floor Duty",
  "Reception Duty",
  "On-Call",
  "Supervisory",
];

export const STATUS_OPTIONS = ["Present", "Absent"];

export const EMPTY_FORM: FormState = {
  id: null,
  branchId: "",
  employeeId: "",
  holidayId: "",
  dutyDate: "",
  status: "",
  isActive: true,
};

export function formatDateLabel(date?: string | null): string {
  if (!date) return "—";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function toDateInputValue(date?: string | null): string {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date.slice(0, 10);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

type HolidayRecord = {
  branch_id: number | string;
  date?: string;
  name: string;
} | null;

type DutyRosterFormProps = {
  open: boolean;
  onClose: () => void;
  form: FormState;
  setForm: Dispatch<SetStateAction<FormState>>;
  onSubmit: () => void;
  saving: boolean;
  formError: string | null;
  matchedHoliday: HolidayRecord;
  branchHolidays: Holiday[];
  onSelectHoliday: (holidayId: string) => void;
  isEditing: boolean;
};

export default function DutyRosterForm({
  open,
  onClose,
  form,
  setForm,
  onSubmit,
  saving,
  formError,
  matchedHoliday,
  branchHolidays,
  onSelectHoliday,
  isEditing,
}: DutyRosterFormProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-[560px] p-0 gap-0 overflow-hidden rounded-2xl border-none shadow-2xl bg-white">
        <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none z-10">
          <X className="h-4 w-4 text-red-500 hover:text-red-700 transition-colors" />
          <span className="sr-only">Close</span>
        </DialogClose>

        <div className="h-20 w-full relative" style={{ background: "#9333EA" }}>
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-16 h-16 rounded-2xl bg-white border-2 border-border shadow-lg flex items-center justify-center">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{ background: "#F3E8FF" }}
            >
              <ClipboardList size={22} style={{ color: "#9333EA" }} />
            </div>
          </div>
        </div>

        <div className="pt-12 px-6 pb-6 space-y-5 max-h-[75vh] overflow-y-auto">
          <DialogHeader className="space-y-1.5">
            <DialogTitle className="text-center text-xl font-bold">
              {isEditing ? "Edit Duty Roster Entry" : "New Duty Roster Entry"}
            </DialogTitle>
            <DialogDescription className="text-center text-sm text-muted-foreground">
              {isEditing
                ? "Update the duty assignment for this employee."
                : "Pick a branch, then the employee, and mark attendance."}
            </DialogDescription>
          </DialogHeader>

          {formError && (
            <div
              className="rounded-lg px-3 py-2 text-sm font-medium"
              style={{ background: "#FEE2E2", color: "#B91C1C" }}
            >
              {formError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Branch</Label>
              <BranchFilter
                value={form.branchId}
                onChange={(v: string) =>
                  setForm((f) => ({
                    ...f,
                    branchId: v,
                    employeeId: "",
                    holidayId: "",
                  }))
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label>Employee</Label>
              <EmployeeFilter
                value={form.employeeId}
                onChange={(v: string) =>
                  setForm((f) => ({ ...f, employeeId: v }))
                }
                branchId={form.branchId}
              />
            </div>
          </div>

          {/* Holiday (auto-fills Duty Date) + Duty Date */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Holiday</Label>

              <Select
                value={form.holidayId}
                onValueChange={(id) => {
                  setForm((f) => ({ ...f, holidayId: id }));
                  onSelectHoliday(id);
                }}
              >
                <SelectTrigger className="h-10 rounded-xl">
                  <SelectValue placeholder="Select Holiday" />
                </SelectTrigger>

                <SelectContent>
                  {branchHolidays.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      No holidays found for this branch.
                    </div>
                  ) : (
                    branchHolidays.map((holiday) => (
                      <SelectItem key={holiday.id} value={String(holiday.id)}>
                        {holiday.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Duty Date</Label>

              <Input
                type="date"
                value={form.dutyDate}
                className="h-10 rounded-xl"
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    dutyDate: e.target.value,
                    holidayId: "",
                  }))
                }
              />
            </div>
          </div>

          {/* Present / Absent */}
          <div className="space-y-1.5">
            <Label>Attendance Status</Label>
            <Select
              value={form.status}
              onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}
            >
              <SelectTrigger className="h-10 rounded-xl">
                <SelectValue placeholder="Select present or absent" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between rounded-xl border p-3">
            <div>
              <p className="text-sm font-medium">Active</p>
              <p className="text-xs text-muted-foreground">
                Inactive entries are kept for history but won't apply.
              </p>
            </div>
            <Switch
              checked={form.isActive}
              onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
            />
          </div>

          <DialogFooter className="flex-row justify-center gap-3 sm:justify-center pt-1">
            <Button
              variant="outline"
              className="flex-1 h-11 rounded-xl"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 h-11 rounded-xl gap-2 text-white border-none"
              style={{ background: "#9333EA" }}
              onClick={onSubmit}
              disabled={saving}
            >
              {saving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Check size={16} />
              )}
              {isEditing ? "Save Changes" : "Create"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
