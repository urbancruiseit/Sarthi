import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/useRedux";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchBranchesThunk } from "@/redux/features/branch/branchSlice";
import { RootState } from "@/redux/store";
import { Branch } from "@/types";
interface BranchFilterProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  includeAllOption?: boolean;
  className?: string;
}

export default function BranchFilter({
  value,
  onChange,
  placeholder = "Branch",
  includeAllOption = true,
  className = "w-full sm:w-[160px] h-9 text-sm",
}: BranchFilterProps) {
  const dispatch = useAppDispatch();
  const { branches } = useAppSelector((state: RootState) => state.branch);

  useEffect(() => {
    if (!branches || branches.length === 0) {
      dispatch(fetchBranchesThunk());
    }
  }, [dispatch, branches]);

  const branchOptions = branches ?? [];

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {includeAllOption && <SelectItem value="all">All Branches</SelectItem>}
        {branchOptions.map((branch: any) => (
          <SelectItem key={branch.id} value={String(branch.id)}>
            {branch.branch_name ?? branch.name ?? `Branch ${branch.id}`}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
