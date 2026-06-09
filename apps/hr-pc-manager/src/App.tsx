import { AppLayout } from "@/components/AppLayout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Loading } from "@/components/Loading";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";

const ApprovalDetail = lazy(() => import("./pages/attendance/ApprovalDetail"));
const ApprovalManagement = lazy(() => import("./pages/attendance/ApprovalManagement"));
const ApprovalRuleDetail = lazy(() => import("./pages/attendance/ApprovalRuleDetail"));
const ApprovalRuleForm = lazy(() => import("./pages/attendance/ApprovalRuleForm"));
const AttendanceRecords = lazy(() => import("./pages/attendance/AttendanceRecords"));
const ClockInManagement = lazy(() => import("./pages/attendance/ClockInManagement"));
const LeaveDetail = lazy(() => import("./pages/attendance/LeaveDetail"));
const MonthlyAttendance = lazy(() => import("./pages/attendance/MonthlyAttendance"));
const EmployeeDetail = lazy(() => import("./pages/employees/EmployeeDetail"));
const EmployeeList = lazy(() => import("./pages/employees/EmployeeList"));
const EmployeeSelfService = lazy(() => import("./pages/employees/EmployeeSelfService"));
const Offboarding = lazy(() => import("./pages/employees/Offboarding"));
const OffboardingDetail = lazy(() => import("./pages/employees/OffboardingDetail"));
const Onboarding = lazy(() => import("./pages/employees/Onboarding"));
const OnboardingDetail = lazy(() => import("./pages/employees/OnboardingDetail"));
const Notifications = lazy(() => import("./pages/Notifications"));
const DepartmentDetail = lazy(() => import("./pages/organization/DepartmentDetail"));
const Departments = lazy(() => import("./pages/organization/Departments"));
const OrgChart = lazy(() => import("./pages/organization/OrgChart"));
const RoleDetail = lazy(() => import("./pages/organization/RoleDetail"));
const Roles = lazy(() => import("./pages/organization/Roles"));
const BonusPenaltyDetail = lazy(() => import("./pages/payroll/BonusPenaltyDetail"));
const BonusPenaltyManagement = lazy(() => import("./pages/payroll/BonusPenaltyManagement"));
const PayrollCalcDetail = lazy(() => import("./pages/payroll/PayrollCalcDetail"));
const PayrollCalcForm = lazy(() => import("./pages/payroll/PayrollCalcForm"));
const PayrollCalculate = lazy(() => import("./pages/payroll/PayrollCalculate"));
const PayrollDistApproval = lazy(() => import("./pages/payroll/PayrollDistApproval"));
const PayrollDistDetail = lazy(() => import("./pages/payroll/PayrollDistDetail"));
const PayrollDistForm = lazy(() => import("./pages/payroll/PayrollDistForm"));
const PayrollDistribute = lazy(() => import("./pages/payroll/PayrollDistribute"));
const PayrollPlanDetail = lazy(() => import("./pages/payroll/PayrollPlanDetail"));
const PayrollPlanForm = lazy(() => import("./pages/payroll/PayrollPlanForm"));
const PayrollStructure = lazy(() => import("./pages/payroll/PayrollStructure"));
const PerformanceEvalDetail = lazy(() => import("./pages/performance/PerformanceEvalDetail"));
const PerformanceEvaluation = lazy(() => import("./pages/performance/PerformanceEvaluation"));
const PerformancePlanDetail = lazy(() => import("./pages/performance/PerformancePlanDetail"));
const PerformancePlanForm = lazy(() => import("./pages/performance/PerformancePlanForm"));
const PerformancePlans = lazy(() => import("./pages/performance/PerformancePlans"));
const Reports = lazy(() => import("./pages/Reports"));
const SystemSettings = lazy(() => import("./pages/SystemSettings"));
const TrainingPlanDetail = lazy(() => import("./pages/training/TrainingPlanDetail"));
const TrainingPlans = lazy(() => import("./pages/training/TrainingPlans"));
const TrainingRecords = lazy(() => import("./pages/training/TrainingRecords"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <SettingsProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ErrorBoundary>
            <Suspense fallback={<Loading />}>
              <Routes>
              <Route element={<AppLayout />}>
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
              <Route path="/attendance/leave/:leaveId" element={<LeaveDetail />} />
              <Route path="/payroll/structure" element={<PayrollStructure />} />
              <Route path="/payroll/structure/new" element={<PayrollPlanForm />} />
              <Route path="/payroll/structure/:planId" element={<PayrollPlanDetail />} />
              <Route path="/payroll/structure/:planId/edit" element={<PayrollPlanForm />} />
              <Route path="/payroll/calculate" element={<PayrollCalculate />} />
              <Route path="/payroll/calculate/new" element={<PayrollCalcForm />} />
              <Route path="/payroll/calculate/:calcId" element={<PayrollCalcDetail />} />
              <Route path="/payroll/calculate/:calcId/edit" element={<PayrollCalcForm />} />
              <Route path="/payroll/bonus-penalty" element={<BonusPenaltyManagement />} />
              <Route path="/payroll/bonus-penalty/:bpId" element={<BonusPenaltyDetail />} />
              <Route path="/payroll/distribute" element={<PayrollDistribute />} />
              <Route path="/payroll/distribute/new" element={<PayrollDistForm />} />
              <Route path="/payroll/distribute/:distId" element={<PayrollDistDetail />} />
              <Route path="/payroll/distribute/:distId/edit" element={<PayrollDistForm />} />
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
            </Route>
            <Route path="/employee-form" element={<EmployeeSelfService />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
        </ErrorBoundary>
      </BrowserRouter>
      </SettingsProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
