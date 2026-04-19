// =====================================================
// UPDATED Sidebar.tsx — Department + Sub-Dept Access
// =====================================================

import { useState } from "react";
import { NavLink } from "react-router-dom";
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

// ─── Role Types ───────────────────────────────────────────────────────────────
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

const isAccessRole = (role: string): role is AccessRole =>
  ALL_ACCESS_ROLES.includes(role as AccessRole);

// ─── Department / Sub-Department Types ───────────────────────────────────────
type Department = "HR" | "Finance" | "Operations" | "Sales" | "IT" | "General";

type SubDepartment =
  // HR
  | "Ops & Admin"
  | "Recruitment"
  | "Statutory"
  // Finance
  | "Accounts"
  | "Audit"
  | "Payroll"
  // Operations
  | "Logistics"
  | "Procurement"
  | "Facilities"
  // Sales
  | "Inside Sales"
  | "Field Sales"
  | "CRM"
  // IT
  | "Development"
  | "Infrastructure"
  | "Support"
  // General (no sub-dept)
  | "General";

// ─── Department → Sub-Department Map ─────────────────────────────────────────
export const DEPARTMENT_SUB_MAP: Record<Department, SubDepartment[]> = {
  HR: ["Ops & Admin", "Recruitment", "Statutory"],
  Finance: ["Accounts", "Audit", "Payroll"],
  Operations: ["Logistics", "Procurement", "Facilities"],
  Sales: ["Inside Sales", "Field Sales", "CRM"],
  IT: ["Development", "Infrastructure", "Support"],
  General: ["General"],
};

// ─── Access Matrix: SubDepartment → Role → allowed nav routes ────────────────
//
//  Structure:
//    SUB_DEPT_ACCESS[subDept][role] = string[]  (route paths)
//
//  Rules applied:
//   • SUPER_ADMIN always gets everything (handled at runtime)
//   • HOD gets all routes for their sub-dept
//   • Lower roles get progressively fewer routes
//
// ─────────────────────────────────────────────────────────────────────────────

const ALL_ROUTES = [
  "/approvals",
  "/documents",
  "/payroll",
  "/ops",
  "/hr-policies",
  "/access",
  "/assets",
];

type RouteAccessMap = Partial<Record<AccessRole, string[]>>;

export const SUB_DEPT_ACCESS: Record<SubDepartment, RouteAccessMap> = {
  // ── HR ──────────────────────────────────────────────────────────────────────
  "Ops & Admin": {
    EMPLOYEE: [
      "/approvals",
      "/documents",
      "/ops",
      "/hr-policies",
      "/access",
      "/assets",
      "/payroll",
    ],

    MANAGER: [
      "/approvals",
      "/documents",
      "/ops",
      "/hr-policies",
      "/access",
      "/assets",
      "/payroll",
    ],

    HOD: ALL_ROUTES,
    SUPER_ADMIN: ALL_ROUTES,
  },

  Recruitment: {
    EMPLOYEE: ["/documents", "/approvals", "/assets", "/access"],

    MANAGER: ["/approvals", "/documents", "/access", "/assets"],

    HOD: ALL_ROUTES,
    SUPER_ADMIN: ALL_ROUTES,
  },

  Statutory: {
    EMPLOYEE: ["/hr-policies", "/ops", "/payroll"],
    MANAGER: ["/hr-policies", "/ops", "/payroll"],

    HOD: ALL_ROUTES,
    SUPER_ADMIN: ALL_ROUTES,
  },

  // ── Finance ─────────────────────────────────────────────────────────────────
  Accounts: {
    EMPLOYEE: ["/documents", "/hr-policies"],
    TEAM_LEAD: ["/documents", "/hr-policies", "/access"],
    MANAGER: ["/approvals", "/documents", "/hr-policies", "/access"],
    ZONAL_HEAD: [
      "/approvals",
      "/documents",
      "/payroll",
      "/hr-policies",
      "/access",
    ],
    HOD: ALL_ROUTES,
    SUPER_ADMIN: ALL_ROUTES,
  },

  Audit: {
    EMPLOYEE: ["/documents", "/hr-policies"],
    TEAM_LEAD: ["/documents", "/hr-policies", "/access"],
    MANAGER: [
      "/approvals",
      "/documents",
      "/payroll",
      "/hr-policies",
      "/access",
    ],
    ZONAL_HEAD: [
      "/approvals",
      "/documents",
      "/payroll",
      "/ops",
      "/hr-policies",
      "/access",
    ],
    HOD: ALL_ROUTES,
    SUPER_ADMIN: ALL_ROUTES,
  },

  Payroll: {
    EMPLOYEE: ["/documents", "/hr-policies"],
    TEAM_LEAD: ["/documents", "/payroll", "/hr-policies"],
    MANAGER: [
      "/approvals",
      "/documents",
      "/payroll",
      "/hr-policies",
      "/access",
    ],
    ZONAL_HEAD: [
      "/approvals",
      "/documents",
      "/payroll",
      "/ops",
      "/hr-policies",
      "/access",
    ],
    HOD: ALL_ROUTES,
    SUPER_ADMIN: ALL_ROUTES,
  },

  // ── Operations ──────────────────────────────────────────────────────────────
  Logistics: {
    EMPLOYEE: ["/documents", "/hr-policies", "/assets"],
    TEAM_LEAD: ["/documents", "/hr-policies", "/assets", "/access"],
    MANAGER: [
      "/approvals",
      "/documents",
      "/ops",
      "/hr-policies",
      "/assets",
      "/access",
    ],
    ZONAL_HEAD: [
      "/approvals",
      "/documents",
      "/ops",
      "/hr-policies",
      "/assets",
      "/access",
    ],
    HOD: ALL_ROUTES,
    SUPER_ADMIN: ALL_ROUTES,
  },

  Procurement: {
    EMPLOYEE: ["/documents", "/hr-policies", "/assets"],
    TEAM_LEAD: ["/documents", "/hr-policies", "/assets"],
    MANAGER: ["/approvals", "/documents", "/ops", "/hr-policies", "/assets"],
    ZONAL_HEAD: [
      "/approvals",
      "/documents",
      "/ops",
      "/hr-policies",
      "/assets",
      "/access",
    ],
    HOD: ALL_ROUTES,
    SUPER_ADMIN: ALL_ROUTES,
  },

  Facilities: {
    EMPLOYEE: ["/documents", "/hr-policies"],
    TEAM_LEAD: ["/documents", "/ops", "/hr-policies"],
    MANAGER: ["/approvals", "/documents", "/ops", "/hr-policies", "/assets"],
    ZONAL_HEAD: [
      "/approvals",
      "/documents",
      "/ops",
      "/hr-policies",
      "/assets",
      "/access",
    ],
    HOD: ALL_ROUTES,
    SUPER_ADMIN: ALL_ROUTES,
  },

  // ── Sales ───────────────────────────────────────────────────────────────────
  "Inside Sales": {
    EMPLOYEE: ["/documents", "/hr-policies", "/access"],
    TEAM_LEAD: ["/approvals", "/documents", "/hr-policies", "/access"],
    MANAGER: ["/approvals", "/documents", "/ops", "/hr-policies", "/access"],
    ZONAL_HEAD: [
      "/approvals",
      "/documents",
      "/ops",
      "/hr-policies",
      "/access",
      "/assets",
    ],
    HOD: ALL_ROUTES,
    SUPER_ADMIN: ALL_ROUTES,
  },

  "Field Sales": {
    EMPLOYEE: ["/documents", "/hr-policies"],
    TEAM_LEAD: ["/approvals", "/documents", "/hr-policies", "/access"],
    MANAGER: ["/approvals", "/documents", "/ops", "/hr-policies", "/access"],
    ZONAL_HEAD: [
      "/approvals",
      "/documents",
      "/ops",
      "/hr-policies",
      "/access",
      "/assets",
    ],
    HOD: ALL_ROUTES,
    SUPER_ADMIN: ALL_ROUTES,
  },

  CRM: {
    EMPLOYEE: ["/documents", "/hr-policies", "/access"],
    TEAM_LEAD: ["/approvals", "/documents", "/hr-policies", "/access"],
    MANAGER: ["/approvals", "/documents", "/ops", "/hr-policies", "/access"],
    ZONAL_HEAD: [
      "/approvals",
      "/documents",
      "/ops",
      "/hr-policies",
      "/access",
      "/assets",
    ],
    HOD: ALL_ROUTES,
    SUPER_ADMIN: ALL_ROUTES,
  },

  // ── IT ──────────────────────────────────────────────────────────────────────
  Development: {
    EMPLOYEE: ["/documents", "/hr-policies", "/access", "/assets"],
    TEAM_LEAD: [
      "/approvals",
      "/documents",
      "/hr-policies",
      "/access",
      "/assets",
    ],
    MANAGER: [
      "/approvals",
      "/documents",
      "/ops",
      "/hr-policies",
      "/access",
      "/assets",
    ],
    ZONAL_HEAD: [
      "/approvals",
      "/documents",
      "/ops",
      "/hr-policies",
      "/access",
      "/assets",
    ],
    HOD: ALL_ROUTES,
    SUPER_ADMIN: ALL_ROUTES,
  },

  Infrastructure: {
    EMPLOYEE: ["/documents", "/hr-policies", "/assets"],
    TEAM_LEAD: ["/documents", "/hr-policies", "/access", "/assets"],
    MANAGER: [
      "/approvals",
      "/documents",
      "/ops",
      "/hr-policies",
      "/access",
      "/assets",
    ],
    ZONAL_HEAD: [
      "/approvals",
      "/documents",
      "/ops",
      "/hr-policies",
      "/access",
      "/assets",
    ],
    HOD: ALL_ROUTES,
    SUPER_ADMIN: ALL_ROUTES,
  },

  Support: {
    EMPLOYEE: ["/documents", "/hr-policies"],
    TEAM_LEAD: ["/documents", "/hr-policies", "/access"],
    MANAGER: ["/approvals", "/documents", "/hr-policies", "/access", "/assets"],
    ZONAL_HEAD: [
      "/approvals",
      "/documents",
      "/ops",
      "/hr-policies",
      "/access",
      "/assets",
    ],
    HOD: ALL_ROUTES,
    SUPER_ADMIN: ALL_ROUTES,
  },

  // ── General / Fallback ───────────────────────────────────────────────────────
  General: {
    EMPLOYEE: ["/documents", "/hr-policies"],
    TEAM_LEAD: ["/documents", "/hr-policies", "/access"],
    MANAGER: ["/approvals", "/documents", "/hr-policies", "/access"],
    ZONAL_HEAD: ["/approvals", "/documents", "/ops", "/hr-policies", "/access"],
    HOD: ALL_ROUTES,
    SUPER_ADMIN: ALL_ROUTES,
  },
};

// ─── Dashboard route per role ─────────────────────────────────────────────────
const ROLE_DASHBOARD_MAP: Record<AccessRole, string> = {
  EMPLOYEE: "/employee-dashboard",
  TEAM_LEAD: "/teamlead-dashboard",
  MANAGER: "/manager-dashboard",
  ZONAL_HEAD: "/zonal-dashboard",
  HOD: "/hod-dashboard",
  SUPER_ADMIN: "/",
};

// ─── Nav Item definitions ─────────────────────────────────────────────────────
interface NavItem {
  label: string;
  icon: any;
  to: string;
  color: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    to: "DYNAMIC",
    color: "text-blue-600",
  },
  {
    label: "Employees",
    icon: Users,
    to: "/approvals",
    color: "text-purple-600",
  },
  {
    label: "Documentation",
    icon: FileText,
    to: "/documents",
    color: "text-yellow-600",
  },
  {
    label: "Payroll",
    icon: DollarSign,
    to: "/payroll",
    color: "text-green-700",
  },
  { label: "HR OPS", icon: Activity, to: "/ops", color: "text-pink-600" },
  {
    label: "HR Policies",
    icon: BookOpen,
    to: "/hr-policies",
    color: "text-indigo-600",
  },
  {
    label: "Training",
    icon: GraduationCap,
    to: "/access",
    color: "text-teal-600",
  },
  {
    label: "Asset Management",
    icon: Package,
    to: "/assets",
    color: "text-red-600",
  },
];

// ─── Helper: resolve allowed nav items ───────────────────────────────────────
function resolveNavItems(
  role: AccessRole,
  subDept: SubDepartment,
  dashboardRoute: string,
): NavItem[] {
  // SUPER_ADMIN bypasses all restrictions
  const allowedRoutes: Set<string> =
    role === "SUPER_ADMIN"
      ? new Set(ALL_ROUTES)
      : new Set(SUB_DEPT_ACCESS[subDept]?.[role] ?? []);

  return NAV_ITEMS.filter((item) => {
    if (item.to === "DYNAMIC") return true; // Dashboard always visible
    return allowedRoutes.has(item.to);
  }).map((item) =>
    item.to === "DYNAMIC" ? { ...item, to: dashboardRoute } : item,
  );
}

// ─── Sidebar Component ────────────────────────────────────────────────────────
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

  // ── Resolve role ──────────────────────────────────────────────────────────
  const rawRole = currentEmployee?.access_role ?? "";
  const currentRole: AccessRole = isAccessRole(rawRole) ? rawRole : "EMPLOYEE";

  // ── Resolve sub-department ────────────────────────────────────────────────
  const rawSubDept = currentEmployee?.subDepartment_name ?? "";
  const currentSubDept: SubDepartment =
    rawSubDept in SUB_DEPT_ACCESS ? (rawSubDept as SubDepartment) : "General";

  // ── Build filtered nav ────────────────────────────────────────────────────
  const dashboardRoute = ROLE_DASHBOARD_MAP[currentRole];
  // Sidebar.tsx mein — filteredNavItems ke upar

  const filteredNavItems = resolveNavItems(
    currentRole,
    currentSubDept,
    dashboardRoute,
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
