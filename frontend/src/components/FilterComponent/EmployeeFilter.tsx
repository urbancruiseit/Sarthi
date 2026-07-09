import { useEffect, useMemo, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/hooks/useRedux";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { fetchEmployeeListThunk } from "@/redux/features/userSlice";
import { RootState } from "@/redux/store";

interface EmployeeFilterProps {
  value: string;
  onChange: (value: string) => void;
  includeAllOption?: boolean;
  className?: string;
}

export default function EmployeeFilter({
  value,
  onChange,
  includeAllOption = true,
  className = "w-full sm:w-[220px] h-9",
}: EmployeeFilterProps) {
  const dispatch = useAppDispatch();
  const [open, setOpen] = useState(false);

  const employeeList = useAppSelector(
    (state: RootState) => state.user.employeeList,
  );

  useEffect(() => {
    if (!employeeList?.length) {
      dispatch(fetchEmployeeListThunk());
    }
  }, [dispatch, employeeList]);

  const employeeOptions = useMemo(
    () => (Array.isArray(employeeList) ? employeeList : []),
    [employeeList],
  );

  const selectedEmployee = employeeOptions.find(
    (e: any) => String(e.id) === value,
  );

  const selectedLabel =
    value === "all" || !value
      ? "All Employees"
      : selectedEmployee?.full_name || "Select Employee";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className={cn(className, "justify-between")}
        >
          <span className="truncate">{selectedLabel}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[260px] p-0">
        <Command>
          <CommandInput placeholder="Search employee..." />

          <CommandList>
            <CommandEmpty>No employee found.</CommandEmpty>

            <CommandGroup>
              {includeAllOption && (
                <CommandItem
                  value="all"
                  onSelect={() => {
                    onChange("all");
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === "all" || !value ? "opacity-100" : "opacity-0",
                    )}
                  />
                  All Employees
                </CommandItem>
              )}

              {employeeOptions.map((emp: any) => (
                <CommandItem
                  key={emp.id}
                  value={`${emp.id} ${emp.full_name ?? ""}`}
                  onSelect={() => {
                    onChange(String(emp.id));
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === String(emp.id) ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {emp.full_name || "Unknown Employee"}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
