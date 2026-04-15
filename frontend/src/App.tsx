import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "@/redux/store";
import { useAppDispatch, useAppSelector } from "@/hooks/useRedux";

import { useEffect } from "react";
import { PrivateRoute } from "@/components/PrivateRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { connectSocket, disconnectSocket } from "@/socket";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Employees from "@/pages/Employees";
import AddEmployee from "@/pages/AddEmployee";
import PendingApprovals from "@/pages/PendingApprovals";
import Notifications from "@/pages/Notifications";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/NotFound";
import Payroll from "@/pages/Payroll";
import AssetManagement from "@/pages/AssetManagement";
import ImprestExpense from "@/pages/ImprestExpense";
import OPS from "@/pages/OPS";
import HRPolicies from "@/pages/HRPolicies";
import CreateLetter from "@/pages/CreateLetter";
import ManageLetters from "@/pages/ManageLetters";
import LetterTemplates from "@/pages/LetterTemplates";
import Training from "./pages/Training";
import OnboardingSubmitted from "./pages/OnboardingSubmitted";
import { currentEmployeeThunk } from "./redux/features/userSlice";
import { PublicRoute } from "./components/PublicRoute";
import { OnboardingVerifyTable } from "./pages/StepActivity";
import NoticeManager from "./pages/Announcement";
import EmployeeManager from "./pages/accessPage";
import { UnauthorizedPage } from "@/pages/Unauthorized";
import EmployeeDashboard from "./pages/Dashboard/EmployeeDashboard";
import TeamLeadDashboard from "./pages/Dashboard/TeamLeadDashboard";
import ManagerDashboard from "./pages/Dashboard/ManagerDashboard";
import ZonalDashboard from "./pages/Dashboard/ZonalDashboard";
import HodDashboard from "./pages/Dashboard/HodDashboard";
import Profile from "./pages/Profile";

const queryClient = new QueryClient();

const AppInitializer = ({ children }: { children: React.ReactNode }) => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, initialized } = useAppSelector((s) => s.user);

  useEffect(() => {
    if (!initialized) {
      dispatch(currentEmployeeThunk());
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      connectSocket();
    } else {
      disconnectSocket();
    }
  }, [isAuthenticated]);

  return <>{children}</>;
};

const App = () => (
  <Provider store={store}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner richColors />
        <BrowserRouter>
          <AppInitializer>
            <Routes>
              {/* ✅ Public Routes */}
              <Route element={<PublicRoute />}>
                <Route path="/login" element={<Login />} />
              </Route>

              {/* ✅ No auth needed */}
              <Route
                path="/add-employee/onboarding-form"
                element={<AddEmployee />}
              />
              <Route
                path="/onboarding-submitted"
                element={<OnboardingSubmitted />}
              />

              {/* ✅ Unauthorized page */}
              <Route path="/unauthorized" element={<UnauthorizedPage />} />

              {/* ✅ Protected Routes */}
              <Route element={<PrivateRoute />}>
                <Route element={<AppLayout />}>
                  <Route
                    path="/self-profile"
                    element={
                      <PrivateRoute>
                        <Profile />
                      </PrivateRoute>
                    }
                  />
                  {/* ✅ SUPER_ADMIN dashboard — "/" pe sirf ye */}
                  <Route path="/" element={<Dashboard />} />

                  {/* ✅ Role-wise dashboards */}
                  <Route
                    path="/employee-dashboard"
                    element={
                      <PrivateRoute allowedRoles={["EMPLOYEE"]}>
                        <EmployeeDashboard />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/teamlead-dashboard"
                    element={
                      <PrivateRoute allowedRoles={["TEAM_LEAD"]}>
                        <TeamLeadDashboard />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/manager-dashboard"
                    element={
                      <PrivateRoute allowedRoles={["MANAGER"]}>
                        <ManagerDashboard />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/zonal-dashboard"
                    element={
                      <PrivateRoute allowedRoles={["ZONAL_HEAD"]}>
                        <ZonalDashboard />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/hod-dashboard"
                    element={
                      <PrivateRoute allowedRoles={["HOD"]}>
                        <HodDashboard />
                      </PrivateRoute>
                    }
                  />

                  {/* ✅ All roles — common pages */}
                  <Route
                    path="/documents"
                    element={<Navigate to="/documents/create" replace />}
                  />
                  <Route path="/documents/create" element={<CreateLetter />} />
                  <Route path="/documents/manage" element={<ManageLetters />} />
                  <Route
                    path="/documents/templates"
                    element={<LetterTemplates />}
                  />
                  <Route path="/hr-policies" element={<HRPolicies />} />
                  <Route path="/access" element={<EmployeeManager />} />
                  <Route path="/assets" element={<AssetManagement />} />
                  <Route path="/trainig" element={<Training />} />
                  <Route path="/notifications" element={<Notifications />} />
                  <Route path="/settings" element={<Settings />} />

                  {/* ✅ TEAM_LEAD, HOD, SUPER_ADMIN only */}
                  <Route
                    path="/approvals"
                    element={
                      <PrivateRoute
                        allowedRoles={["TEAM_LEAD", "HOD", "SUPER_ADMIN"]}
                      >
                        <PendingApprovals />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/employees"
                    element={
                      <PrivateRoute
                        allowedRoles={["TEAM_LEAD", "HOD", "SUPER_ADMIN"]}
                      >
                        <Employees />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/add-employee"
                    element={
                      <PrivateRoute
                        allowedRoles={["TEAM_LEAD", "HOD", "SUPER_ADMIN"]}
                      >
                        <AddEmployee />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/onboardingVerify"
                    element={
                      <PrivateRoute
                        allowedRoles={["TEAM_LEAD", "HOD", "SUPER_ADMIN"]}
                      >
                        <OnboardingVerifyTable />
                      </PrivateRoute>
                    }
                  />

                  {/* ✅ ZONAL_HEAD, HOD, SUPER_ADMIN only */}
                  <Route
                    path="/ops"
                    element={
                      <PrivateRoute
                        allowedRoles={["ZONAL_HEAD", "HOD", "SUPER_ADMIN"]}
                      >
                        <OPS />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/expense"
                    element={
                      <PrivateRoute
                        allowedRoles={["ZONAL_HEAD", "HOD", "SUPER_ADMIN"]}
                      >
                        <ImprestExpense />
                      </PrivateRoute>
                    }
                  />

                  {/* ✅ HOD, SUPER_ADMIN only */}
                  <Route
                    path="/payroll"
                    element={
                      <PrivateRoute allowedRoles={["HOD", "SUPER_ADMIN"]}>
                        <Payroll />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/add-announcement"
                    element={
                      <PrivateRoute allowedRoles={["HOD", "SUPER_ADMIN"]}>
                        <NoticeManager />
                      </PrivateRoute>
                    }
                  />
                </Route>
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppInitializer>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </Provider>
);

export default App;
