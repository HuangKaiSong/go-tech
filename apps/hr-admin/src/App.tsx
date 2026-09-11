import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { isLoggedIn } from "@/lib/auth";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import EmployeeList from "./pages/employees/EmployeeList";
import EmployeeDetail from "./pages/employees/EmployeeDetail";
import Onboarding from "./pages/employees/Onboarding";
import OnboardingDetail from "./pages/employees/OnboardingDetail";
import EmployeeSelfService from "./pages/employees/EmployeeSelfService";
import Offboarding from "./pages/employees/Offboarding";
import OffboardingDetail from "./pages/employees/OffboardingDetail";
import ClockInManagement from "./pages/attendance/ClockInManagement";
import ApprovalManagement from "./pages/attendance/ApprovalManagement";
import ApprovalDetail from "./pages/attendance/ApprovalDetail";
import ApprovalRuleDetail from "./pages/attendance/ApprovalRuleDetail";
import ApprovalRuleForm from "./pages/attendance/ApprovalRuleForm";
import AttendanceRecords from "./pages/attendance/AttendanceRecords";
import LeaveDetail from "./pages/attendance/LeaveDetail";
import LeaveSettings from "./pages/attendance/LeaveSettings";
import MonthlyAttendance from "./pages/attendance/MonthlyAttendance";
import PayrollStructure from "./pages/payroll/PayrollStructure";
import PayrollPlanDetail from "./pages/payroll/PayrollPlanDetail";
import PayrollPlanForm from "./pages/payroll/PayrollPlanForm";
import PayrollCalculate from "./pages/payroll/PayrollCalculate";
import PayrollCalcDetail from "./pages/payroll/PayrollCalcDetail";
import PayrollDistribute from "./pages/payroll/PayrollDistribute";
import PayrollDistDetail from "./pages/payroll/PayrollDistDetail";
import PayrollDistForm from "./pages/payroll/PayrollDistForm";
import PayrollDistApproval from "./pages/payroll/PayrollDistApproval";
import BonusPenaltyManagement from "./pages/payroll/BonusPenaltyManagement";
import BonusPenaltyDetail from "./pages/payroll/BonusPenaltyDetail";
import PerformancePlans from "./pages/performance/PerformancePlans";
import PerformancePlanDetail from "./pages/performance/PerformancePlanDetail";
import PerformancePlanForm from "./pages/performance/PerformancePlanForm";
import PerformanceEvaluation from "./pages/performance/PerformanceEvaluation";
import PerformanceEvalDetail from "./pages/performance/PerformanceEvalDetail";
import TrainingPlans from "./pages/training/TrainingPlans";
import TrainingPlanDetail from "./pages/training/TrainingPlanDetail";
import TrainingRecords from "./pages/training/TrainingRecords";
import Departments from "./pages/organization/Departments";
import OrgChart from "./pages/organization/OrgChart";
import DepartmentDetail from "./pages/organization/DepartmentDetail";
import Roles from "./pages/organization/Roles";
import RoleDetail from "./pages/organization/RoleDetail";
import Reports from "./pages/Reports";
import Notifications from "./pages/Notifications";
import SystemSettings from "./pages/SystemSettings";
import MenuManagement from "./pages/MenuManagement";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

/** 登录守卫：未登录跳转登录页 */
function RequireAuth({ children }: { children: JSX.Element }) {
  return isLoggedIn() ? children : <Navigate to="/login" replace />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-center" richColors />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/employees" element={<EmployeeList />} />
            <Route path="/employees/onboarding" element={<Onboarding />} />
            <Route path="/employees/onboarding/:obId" element={<OnboardingDetail />} />
            <Route path="/employees/offboarding" element={<Offboarding />} />
            <Route path="/employees/offboarding/:offId" element={<OffboardingDetail />} />
            <Route path="/employees/:id" element={<EmployeeDetail />} />
            <Route path="/attendance/clock-in" element={<ClockInManagement />} />
            <Route path="/attendance/approval" element={<ApprovalManagement />} />
            <Route path="/attendance/approval/rules/new" element={<ApprovalRuleForm />} />
            <Route path="/attendance/approval/rules/:ruleId" element={<ApprovalRuleDetail />} />
            <Route path="/attendance/approval/rules/:ruleId/edit" element={<ApprovalRuleForm />} />
            <Route path="/attendance/approval/:approvalId" element={<ApprovalDetail />} />
            <Route path="/attendance/records" element={<AttendanceRecords />} />
            <Route path="/attendance/records/monthly" element={<MonthlyAttendance />} />
            <Route path="/attendance/leave-settings" element={<LeaveSettings />} />
            <Route path="/attendance/leave/:leaveId" element={<LeaveDetail />} />
            <Route path="/payroll/structure" element={<PayrollStructure />} />
            <Route path="/payroll/structure/new" element={<PayrollPlanForm />} />
            <Route path="/payroll/structure/:planId" element={<PayrollPlanDetail />} />
            <Route path="/payroll/structure/:planId/edit" element={<PayrollPlanForm />} />
            <Route path="/payroll/calculate" element={<PayrollCalculate />} />
            <Route path="/payroll/calculate/:calcId" element={<PayrollCalcDetail />} />
            <Route path="/payroll/bonus-penalty" element={<BonusPenaltyManagement />} />
            <Route path="/payroll/bonus-penalty/:bpId" element={<BonusPenaltyDetail />} />
            <Route path="/payroll/distribute" element={<PayrollDistribute />} />
            <Route path="/payroll/distribute/new" element={<PayrollDistForm />} />
            <Route path="/payroll/distribute/:distId" element={<PayrollDistDetail />} />
            <Route path="/payroll/distribute/approval" element={<PayrollDistApproval />} />
            <Route path="/performance/plans" element={<PerformancePlans />} />
            <Route path="/performance/plans/new" element={<PerformancePlanForm />} />
            <Route path="/performance/plans/:planId" element={<PerformancePlanDetail />} />
            <Route path="/performance/plans/:planId/edit" element={<PerformancePlanForm />} />
            <Route path="/performance/evaluation" element={<PerformanceEvaluation />} />
            <Route path="/performance/evaluation/:evalId" element={<PerformanceEvalDetail />} />
            <Route path="/training/plans" element={<TrainingPlans />} />
            <Route path="/training/plans/:planId" element={<TrainingPlanDetail />} />
            <Route path="/training/records" element={<TrainingRecords />} />
            <Route path="/organization/departments/:deptId" element={<DepartmentDetail />} />
            <Route path="/organization/departments" element={<Departments />} />
            <Route path="/organization/roles" element={<Roles />} />
            <Route path="/organization/roles/:roleId" element={<RoleDetail />} />
            <Route path="/organization/chart" element={<OrgChart />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<SystemSettings />} />
            <Route path="/settings/menus" element={<MenuManagement />} />
          </Route>
          <Route path="/employee-form" element={<EmployeeSelfService />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
