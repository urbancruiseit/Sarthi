import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  ChevronLeft,
  ChevronRight,
  Building2,
  DollarSign,
  Activity,
  FileText,
  BookOpen,
  GraduationCap,
  Package,
} from "lucide-react";
import { useAppSelector } from "@/hooks/useRedux";
import { cn } from "@/lib/utils";
import { Navigate } from "react-router-dom";

type AccessRole =
  | "EMPLOYEE"
  | "TEAM_LEAD"
  | "MANAGER"
  | "ZONAL_HEAD"
  | "HOD"
  | "SUPER_ADMIN";

const ALL_ACCESS_ROLES: AccessRole[] = [
  "EMPLOYEE",
  "TEAM_LEAD",
  "MANAGER",
  "ZONAL_HEAD",
  "HOD",
  "SUPER_ADMIN",
];

const isAccessRole = (role: string): role is AccessRole => {
  return ALL_ACCESS_ROLES.includes(role as AccessRole);
};

// Role-wise dashboard routes
const ROLE_DASHBOARD_MAP: Record<AccessRole, string> = {
  EMPLOYEE: "/employee-dashboard",
  TEAM_LEAD: "/teamlead-dashboard",
  MANAGER: "/manager-dashboard",
  ZONAL_HEAD: "/zonal-dashboard",
  HOD: "/hod-dashboard",
  SUPER_ADMIN: "/",
};

interface NavItem {
  label: string;
  icon: any;
  to: string;
  color: string;
  roles: AccessRole[];
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    to: "DYNAMIC", // handled dynamically below
    color: "text-blue-600",
    roles: ALL_ACCESS_ROLES,
  },
  {
    label: "Employees",
    icon: Users,
    to: "/approvals",
    color: "text-purple-600",
    roles: ["TEAM_LEAD", "HOD", "SUPER_ADMIN"],
  },
  {
    label: "Documentation",
    icon: FileText,
    to: "/documents",
    color: "text-yellow-600",
    roles: ALL_ACCESS_ROLES,
  },
  {
    label: "Payroll",
    icon: DollarSign,
    to: "/payroll",
    color: "text-green-700",
    roles: ["HOD", "SUPER_ADMIN"],
  },
  {
    label: "HR OPS",
    icon: Activity,
    to: "/ops",
    color: "text-pink-600",
    roles: ["ZONAL_HEAD", "HOD", "SUPER_ADMIN"],
  },
  {
    label: "HR Policies",
    icon: BookOpen,
    to: "/hr-policies",
    color: "text-indigo-600",
    roles: ALL_ACCESS_ROLES,
  },
  {
    label: "Training",
    icon: GraduationCap,
    to: "/access",
    color: "text-teal-600",
    roles: ALL_ACCESS_ROLES,
  },
  {
    label: "Asset Management",
    icon: Package,
    to: "/assets",
    color: "text-red-600",
    roles: ALL_ACCESS_ROLES,
  },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const [hovered, setHovered] = useState(false);

  const pendingCount = useAppSelector(
    (s) =>
      s.employees.employees.filter(
        (e) => e.status === "pending" || e.status === "resubmitted",
      ).length,
  );

  const { currentEmployee } = useAppSelector((state) => state.user);
  const accessRoleFromUser = currentEmployee?.access_role;

  // Always default to lowest privilege in production
  const currentAccessRole: AccessRole =
    accessRoleFromUser && isAccessRole(accessRoleFromUser)
      ? (accessRoleFromUser as AccessRole)
      : "EMPLOYEE";

  // Get role-specific dashboard route
  const dashboardRoute = ROLE_DASHBOARD_MAP[currentAccessRole];

  // Inject dynamic dashboard route + filter by role
  const filteredNavItems = navItems
    .filter((item) => item.roles.includes(currentAccessRole))
    .map((item) =>
      item.label === "Dashboard" ? { ...item, to: dashboardRoute } : item,
    );

  const isCollapsed = collapsed && !hovered;

  return (
    <aside
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        "flex flex-col h-full transition-all duration-300 ease-in-out",
        "border-r border-green-200 bg-green-50 text-green-900",
        "shadow-lg shadow-green-900/5",
        isCollapsed ? "w-16" : "w-64",
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-5 border-b border-green-200",
          isCollapsed && "justify-center",
        )}
      >
        <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-gradient-to-r from-green-600 to-orange-500 shadow-md">
          <Building2 size={40} className="text-white" />
        </div>
        {!isCollapsed && (
          <div>
            <p className="text-sm font-bold text-green-700">SAARTHI HRMS</p>
            <p className="text-xs text-orange-500 uppercase font-semibold">
              URBAN CRUISE
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-3 overflow-y-auto">
        {filteredNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "group flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200",
                "hover:bg-green-600 hover:text-white",
                isActive && "bg-green-600 text-white font-semibold",
                isCollapsed && "justify-center",
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  size={30}
                  className={cn(
                    "transition-colors",
                    isActive
                      ? "text-white"
                      : `${item.color} group-hover:text-white`,
                  )}
                />
                {!isCollapsed && (
                  <>
                    <span
                      className={cn(
                        "flex-1 text-md transition-colors",
                        isActive
                          ? "text-white"
                          : `${item.color} group-hover:text-white`,
                      )}
                    >
                      {item.label}
                    </span>
                    {item.label === "Employees" && pendingCount > 0 && (
                      <span className="ml-auto w-5 h-5 rounded-full bg-orange-500 text-white text-xs flex items-center justify-center">
                        {pendingCount}
                      </span>
                    )}
                  </>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Collapse Button */}
      <div className="p-3 border-t border-green-200">
        <button
          onClick={onToggle}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-md font-medium hover:bg-green-600 hover:text-white transition"
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          {!isCollapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
