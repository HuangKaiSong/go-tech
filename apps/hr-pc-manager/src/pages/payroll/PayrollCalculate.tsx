import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import {
  DollarSign, Calculator, CheckCircle,
  Users, Download, Building2, Eye, Search
} from "lucide-react";
import { toast } from "sonner";
import { mockBonusPenaltyRecords, type BonusPenaltyRecord } from "./BonusPenaltyManagement";

export interface PayrollEmployee {
  id: string;
  name: string;
  employeeId: string;
  department: string;
  subDepartment: string;
  position: string;
  planName: string;
  baseSalary: number;
  allowances: { name: string; amount: number }[];
  overtime: { hours: number; rate: number; amount: number };
  deductions: { name: string; amount: number }[];
  totalEarnings: number;
  totalDeduction: number;
  netSalary: number;
  status: "待計算" | "已計算" | "已調整" | "已確認";
  note: string;
}

export const mockEmployees: PayrollEmployee[] = [
  {
    id: "E001", name: "張小明", employeeId: "EMP-001", department: "技術部", subDepartment: "前端開發組", position: "高級工程師", planName: "技術職等 A",
    baseSalary: 65000, allowances: [{ name: "交通補助", amount: 2000 }, { name: "伙食津貼", amount: 2400 }, { name: "技術加給", amount: 5000 }],
    overtime: { hours: 12, rate: 406, amount: 4872 },
    deductions: [{ name: "勞保", amount: 1463 }, { name: "健保", amount: 687 }, { name: "勞退", amount: 798 }],
    totalEarnings: 79272, totalDeduction: 2948, netSalary: 76324, status: "已計算", note: ""
  },
  {
    id: "E002", name: "李文華", employeeId: "EMP-002", department: "銷售部", subDepartment: "企業客戶組", position: "銷售經理", planName: "管理職等",
    baseSalary: 75000, allowances: [{ name: "交通補助", amount: 3000 }, { name: "伙食津貼", amount: 2400 }, { name: "主管加給", amount: 8000 }],
    overtime: { hours: 0, rate: 0, amount: 0 },
    deductions: [{ name: "勞保", amount: 1688 }, { name: "健保", amount: 793 }, { name: "勞退", amount: 921 }],
    totalEarnings: 88400, totalDeduction: 3402, netSalary: 84998, status: "已計算", note: ""
  },
  {
    id: "E003", name: "王美玲", employeeId: "EMP-003", department: "人事部", subDepartment: "招聘組", position: "人事專員", planName: "行政職等",
    baseSalary: 42000, allowances: [{ name: "交通補助", amount: 2000 }, { name: "伙食津貼", amount: 2400 }],
    overtime: { hours: 0, rate: 0, amount: 0 },
    deductions: [{ name: "勞保", amount: 946 }, { name: "健保", amount: 444 }, { name: "勞退", amount: 516 }],
    totalEarnings: 46400, totalDeduction: 1906, netSalary: 44494, status: "已計算", note: ""
  },
  {
    id: "E004", name: "陳大偉", employeeId: "EMP-004", department: "技術部", subDepartment: "後端開發組", position: "工程師", planName: "技術職等 B",
    baseSalary: 48000, allowances: [{ name: "交通補助", amount: 2000 }, { name: "伙食津貼", amount: 2400 }, { name: "技術加給", amount: 3000 }],
    overtime: { hours: 8, rate: 300, amount: 2400 },
    deductions: [{ name: "勞保", amount: 1080 }, { name: "健保", amount: 507 }, { name: "勞退", amount: 589 }],
    totalEarnings: 57800, totalDeduction: 2176, netSalary: 55624, status: "已計算", note: ""
  },
  {
    id: "E005", name: "林小芬", employeeId: "EMP-005", department: "行政部", subDepartment: "總務組", position: "行政助理", planName: "行政職等",
    baseSalary: 35000, allowances: [{ name: "交通補助", amount: 2000 }, { name: "伙食津貼", amount: 2400 }],
    overtime: { hours: 4, rate: 219, amount: 876 },
    deductions: [{ name: "勞保", amount: 788 }, { name: "健保", amount: 370 }, { name: "勞退", amount: 430 }],
    totalEarnings: 40276, totalDeduction: 1588, netSalary: 38688, status: "已計算", note: ""
  },
  {
    id: "E006", name: "黃志豪", employeeId: "EMP-006", department: "技術部", subDepartment: "前端開發組", position: "資深工程師", planName: "技術職等 A",
    baseSalary: 72000, allowances: [{ name: "交通補助", amount: 2000 }, { name: "伙食津貼", amount: 2400 }, { name: "技術加給", amount: 5000 }],
    overtime: { hours: 6, rate: 450, amount: 2700 },
    deductions: [{ name: "勞保", amount: 1620 }, { name: "健保", amount: 761 }, { name: "勞退", amount: 884 }],
    totalEarnings: 84100, totalDeduction: 3265, netSalary: 80835, status: "已確認", note: "已確認無誤"
  },
  {
    id: "E007", name: "趙雅婷", employeeId: "EMP-007", department: "銷售部", subDepartment: "渠道銷售組", position: "業務代表", planName: "銷售職等",
    baseSalary: 38000, allowances: [{ name: "交通補助", amount: 2500 }, { name: "伙食津貼", amount: 2400 }, { name: "業績獎金", amount: 12000 }],
    overtime: { hours: 0, rate: 0, amount: 0 },
    deductions: [{ name: "勞保", amount: 855 }, { name: "健保", amount: 401 }, { name: "勞退", amount: 467 }],
    totalEarnings: 54900, totalDeduction: 1723, netSalary: 53177, status: "已計算", note: ""
  },
  {
    id: "E008", name: "周建國", employeeId: "EMP-008", department: "人事部", subDepartment: "薪酬福利組", position: "人事主管", planName: "管理職等",
    baseSalary: 58000, allowances: [{ name: "交通補助", amount: 2000 }, { name: "伙食津貼", amount: 2400 }, { name: "主管加給", amount: 6000 }],
    overtime: { hours: 0, rate: 0, amount: 0 },
    deductions: [{ name: "勞保", amount: 1305 }, { name: "健保", amount: 613 }, { name: "勞退", amount: 712 }],
    totalEarnings: 68400, totalDeduction: 2630, netSalary: 65770, status: "已計算", note: ""
  },
  {
    id: "E009", name: "吳佩珊", employeeId: "EMP-009", department: "會計部", subDepartment: "應收帳款組", position: "會計專員", planName: "行政職等",
    baseSalary: 45000, allowances: [{ name: "交通補助", amount: 2000 }, { name: "伙食津貼", amount: 2400 }],
    overtime: { hours: 0, rate: 0, amount: 0 },
    deductions: [{ name: "勞保", amount: 1013 }, { name: "健保", amount: 476 }, { name: "勞退", amount: 553 }],
    totalEarnings: 49400, totalDeduction: 2042, netSalary: 47358, status: "已計算", note: ""
  },
  {
    id: "E010", name: "鄭國強", employeeId: "EMP-010", department: "會計部", subDepartment: "財務分析組", position: "財務主管", planName: "管理職等",
    baseSalary: 62000, allowances: [{ name: "交通補助", amount: 2000 }, { name: "伙食津貼", amount: 2400 }, { name: "主管加給", amount: 7000 }],
    overtime: { hours: 0, rate: 0, amount: 0 },
    deductions: [{ name: "勞保", amount: 1395 }, { name: "健保", amount: 655 }, { name: "勞退", amount: 761 }],
    totalEarnings: 73400, totalDeduction: 2811, netSalary: 70589, status: "已計算", note: ""
  },
  {
    id: "E011", name: "何志明", employeeId: "EMP-011", department: "技術部", subDepartment: "測試組", position: "測試工程師", planName: "技術職等 B",
    baseSalary: 44000, allowances: [{ name: "交通補助", amount: 2000 }, { name: "伙食津貼", amount: 2400 }, { name: "技術加給", amount: 2000 }],
    overtime: { hours: 3, rate: 275, amount: 825 },
    deductions: [{ name: "勞保", amount: 990 }, { name: "健保", amount: 465 }, { name: "勞退", amount: 540 }],
    totalEarnings: 51225, totalDeduction: 1995, netSalary: 49230, status: "已計算", note: ""
  },
  {
    id: "E012", name: "蔡美惠", employeeId: "EMP-012", department: "行政部", subDepartment: "採購組", position: "採購專員", planName: "行政職等",
    baseSalary: 38000, allowances: [{ name: "交通補助", amount: 2000 }, { name: "伙食津貼", amount: 2400 }],
    overtime: { hours: 0, rate: 0, amount: 0 },
    deductions: [{ name: "勞保", amount: 855 }, { name: "健保", amount: 401 }, { name: "勞退", amount: 467 }],
    totalEarnings: 42400, totalDeduction: 1723, netSalary: 40677, status: "已計算", note: ""
  },
];

/**
 * Merge bonus/penalty records into employee data for a given month.
 * Bonuses are added to allowances; penalties are added to deductions.
 * Recalculates totalEarnings, totalDeduction, and netSalary.
 */
export function getEmployeesWithBonusPenalty(
  employees: PayrollEmployee[],
  bpRecords: BonusPenaltyRecord[],
  month: string // e.g. "2026-03"
): PayrollEmployee[] {
  const activeRecords = bpRecords.filter(r => r.applyMonth === month && r.status === "已計入");
  return employees.map(emp => {
    const empBPs = activeRecords.filter(r => r.employeeId === emp.employeeId);
    if (empBPs.length === 0) return emp;

    const bonusItems = empBPs.filter(r => r.type === "獎金").map(r => ({ name: `${r.category}（獎罰）`, amount: r.amount }));
    const penaltyItems = empBPs.filter(r => r.type === "罰款").map(r => ({ name: `${r.category}（獎罰）`, amount: r.amount }));

    const newAllowances = [...emp.allowances, ...bonusItems];
    const newDeductions = [...emp.deductions, ...penaltyItems];
    const totalEarnings = emp.baseSalary + newAllowances.reduce((s, a) => s + a.amount, 0) + emp.overtime.amount;
    const totalDeduction = newDeductions.reduce((s, d) => s + d.amount, 0);
    const netSalary = totalEarnings - totalDeduction;

    return { ...emp, allowances: newAllowances, deductions: newDeductions, totalEarnings, totalDeduction, netSalary };
  });
}

export interface DepartmentPayrollSummary {
  department: string;
  subDepartments: { name: string; employeeCount: number; totalNet: number }[];
  employeeCount: number;
  totalBase: number;
  totalAllowance: number;
  totalBonus: number;
  totalOvertime: number;
  totalDeduction: number;
  totalNet: number;
}

export function getDepartmentSummaries(employees: PayrollEmployee[]): DepartmentPayrollSummary[] {
  const deptMap = new Map<string, PayrollEmployee[]>();
  employees.forEach(e => {
    if (!deptMap.has(e.department)) deptMap.set(e.department, []);
    deptMap.get(e.department)!.push(e);
  });
  return Array.from(deptMap.entries()).map(([dept, emps]) => {
    const subDeptMap = new Map<string, PayrollEmployee[]>();
    emps.forEach(e => {
      if (!subDeptMap.has(e.subDepartment)) subDeptMap.set(e.subDepartment, []);
      subDeptMap.get(e.subDepartment)!.push(e);
    });
    return {
      department: dept,
      subDepartments: Array.from(subDeptMap.entries()).map(([name, subEmps]) => ({
        name,
        employeeCount: subEmps.length,
        totalNet: subEmps.reduce((s, e) => s + e.netSalary, 0),
      })),
      employeeCount: emps.length,
      totalBase: emps.reduce((s, e) => s + e.baseSalary, 0),
      totalAllowance: emps.reduce((s, e) => s + e.allowances.filter(a => !a.name.includes("獎金")).reduce((a, al) => a + al.amount, 0), 0),
      totalBonus: emps.reduce((s, e) => s + e.allowances.filter(a => a.name.includes("獎金")).reduce((a, al) => a + al.amount, 0), 0),
      totalOvertime: emps.reduce((s, e) => s + e.overtime.amount, 0),
      totalDeduction: emps.reduce((s, e) => s + e.totalDeduction, 0),
      totalNet: emps.reduce((s, e) => s + e.netSalary, 0),
    };
  });
}

export interface PayrollCalcRecord {
  id: string;
  period: string;
  year: string;
  month: string;
  departments: DepartmentPayrollSummary[];
  employeeCount: number;
  totalBase: number;
  totalAllowance: number;
  totalOvertime: number;
  totalDeduction: number;
  totalNet: number;
  status: "待計算" | "計算中" | "已計算" | "已確認" | "已發放";
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

const marchEmployees = getEmployeesWithBonusPenalty(mockEmployees, mockBonusPenaltyRecords, "2026-03");
const deptSummaries = getDepartmentSummaries(marchEmployees);

export const mockCalcRecords: PayrollCalcRecord[] = [
  {
    id: "PC-202603", period: "2026年03月", year: "2026", month: "03", departments: deptSummaries,
    employeeCount: marchEmployees.length,
    totalBase: deptSummaries.reduce((s, d) => s + d.totalBase, 0),
    totalAllowance: deptSummaries.reduce((s, d) => s + d.totalAllowance, 0),
    totalOvertime: deptSummaries.reduce((s, d) => s + d.totalOvertime, 0),
    totalDeduction: deptSummaries.reduce((s, d) => s + d.totalDeduction, 0),
    totalNet: deptSummaries.reduce((s, d) => s + d.totalNet, 0),
    status: "已計算",
    createdAt: "2026-03-01", updatedAt: "2026-03-13", createdBy: "王小美"
  },
  {
    id: "PC-202602", period: "2026年02月", year: "2026", month: "02", departments: deptSummaries,
    employeeCount: 63, totalBase: 3150000, totalAllowance: 315000, totalOvertime: 112000,
    totalDeduction: 472500, totalNet: 3104500, status: "已確認",
    createdAt: "2026-02-01", updatedAt: "2026-02-28", createdBy: "王小美"
  },
  {
    id: "PC-202601", period: "2026年01月", year: "2026", month: "01", departments: deptSummaries,
    employeeCount: 62, totalBase: 3100000, totalAllowance: 310000, totalOvertime: 85000,
    totalDeduction: 465000, totalNet: 3030000, status: "已發放",
    createdAt: "2026-01-01", updatedAt: "2026-01-31", createdBy: "王小美"
  },
  {
    id: "PC-202512", period: "2025年12月", year: "2025", month: "12", departments: deptSummaries,
    employeeCount: 60, totalBase: 3000000, totalAllowance: 300000, totalOvertime: 120000,
    totalDeduction: 450000, totalNet: 2970000, status: "已發放",
    createdAt: "2025-12-01", updatedAt: "2025-12-31", createdBy: "王小美"
  },
  {
    id: "PC-202511", period: "2025年11月", year: "2025", month: "11", departments: deptSummaries,
    employeeCount: 59, totalBase: 2950000, totalAllowance: 295000, totalOvertime: 98000,
    totalDeduction: 442500, totalNet: 2900500, status: "已發放",
    createdAt: "2025-11-01", updatedAt: "2025-11-30", createdBy: "王小美"
  },
];

const statusColors: Record<string, string> = {
  "待計算": "bg-muted text-muted-foreground border-border",
  "計算中": "bg-primary/10 text-primary border-primary/20",
  "已計算": "bg-accent/10 text-accent-foreground border-accent/20",
  "已確認": "bg-success/10 text-success border-success/20",
  "已發放": "bg-primary/10 text-primary border-primary/20",
};

const calcMonths = [
  { value: "2026-04", label: "2026年04月" },
  { value: "2026-05", label: "2026年05月" },
  { value: "2026-06", label: "2026年06月" },
];

const allMonthOptions = [
  { value: "2026-03", label: "2026年03月" },
  { value: "2026-02", label: "2026年02月" },
  { value: "2026-01", label: "2026年01月" },
  { value: "2025-12", label: "2025年12月" },
  { value: "2025-11", label: "2025年11月" },
];

export default function PayrollCalculate() {
  const navigate = useNavigate();
  const [records, setRecords] = useState(mockCalcRecords);
  const [confirmTarget, setConfirmTarget] = useState<PayrollCalcRecord | null>(null);
  const [selectedMonth, setSelectedMonth] = useState("");

  // Query month for viewing
  const [viewMonth, setViewMonth] = useState("2026-03");

  // Find record matching viewMonth
  const viewRecord = records.find(r => `${r.year}-${r.month}` === viewMonth);
  const viewDepts = viewRecord?.departments || [];

  // Grand totals
  const grandTotalBase = viewDepts.reduce((s, d) => s + d.totalBase, 0);
  const grandTotalAllowance = viewDepts.reduce((s, d) => s + d.totalAllowance, 0);
  const grandTotalBonus = viewDepts.reduce((s, d) => s + d.totalBonus, 0);
  const grandTotalOvertime = viewDepts.reduce((s, d) => s + d.totalOvertime, 0);
  const grandTotalDeduction = viewDepts.reduce((s, d) => s + d.totalDeduction, 0);
  const grandTotalNet = viewDepts.reduce((s, d) => s + d.totalNet, 0);
  const grandTotalEmployees = viewDepts.reduce((s, d) => s + d.employeeCount, 0);

  const handleConfirm = () => {
    if (!confirmTarget) return;
    setRecords(prev => prev.map(r => r.id === confirmTarget.id ? { ...r, status: "已確認" as const, updatedAt: new Date().toISOString().split("T")[0] } : r));
    toast.success(`${confirmTarget.period} 薪資已確認`);
    setConfirmTarget(null);
  };

  const handleStartCalculation = () => {
    if (!selectedMonth) return;
    const monthInfo = calcMonths.find(m => m.value === selectedMonth);
    if (!monthInfo) return;

    const existingId = `PC-${selectedMonth.replace("-", "")}`;
    if (records.some(r => r.id === existingId)) {
      toast.error(`${monthInfo.label} 已有薪資計算記錄`);
      return;
    }

    const [y, m] = selectedMonth.split("-");
    const mergedEmployees = getEmployeesWithBonusPenalty(mockEmployees, mockBonusPenaltyRecords, selectedMonth);
    const newDeptSummaries = getDepartmentSummaries(mergedEmployees);
    const totalBase = newDeptSummaries.reduce((s, d) => s + d.totalBase, 0);
    const totalAllowance = newDeptSummaries.reduce((s, d) => s + d.totalAllowance, 0);
    const totalOvertime = newDeptSummaries.reduce((s, d) => s + d.totalOvertime, 0);
    const totalDeduction = newDeptSummaries.reduce((s, d) => s + d.totalDeduction, 0);
    const totalNet = newDeptSummaries.reduce((s, d) => s + d.totalNet, 0);
    const employeeCount = newDeptSummaries.reduce((s, d) => s + d.employeeCount, 0);

    const newRecord: PayrollCalcRecord = {
      id: existingId,
      period: monthInfo.label,
      year: y,
      month: m,
      departments: newDeptSummaries,
      employeeCount,
      totalBase, totalAllowance, totalOvertime, totalDeduction, totalNet,
      status: "已計算",
      createdAt: new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString().split("T")[0],
      createdBy: "當前用戶",
    };

    setRecords(prev => [newRecord, ...prev]);
    toast.success(`${monthInfo.label} 薪資計算完成，已按部門生成明細`);
    setSelectedMonth("");
    setViewMonth(selectedMonth);
    navigate(`/payroll/calculate/${existingId}`);
  };

  const stats = viewRecord ? [
    { label: "實發合計", value: `HK$ ${grandTotalNet.toLocaleString()}`, icon: DollarSign, color: "text-primary" },
    { label: "計算人數", value: `${grandTotalEmployees} 人`, icon: Users, color: "text-success" },
    { label: "涵蓋部門", value: `${viewDepts.length} 個`, icon: Building2, color: "text-warning" },
    { label: "計算狀態", value: viewRecord.status, icon: CheckCircle, color: "text-accent-foreground" },
  ] : [];

  // Available months for query (from records)
  const availableMonths = records.map(r => ({ value: `${r.year}-${r.month}`, label: r.period }));

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">薪資計算</h1>
          <p className="text-muted-foreground mt-1">選擇月份開始薪資計算，系統將按部門自動生成薪資明細</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="選擇月份" />
            </SelectTrigger>
            <SelectContent>
              {calcMonths.map(m => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleStartCalculation} className="gap-2" disabled={!selectedMonth}>
            <Calculator className="h-4 w-4" />
            開始薪資計算
          </Button>
        </div>
      </div>

      {/* Month Query */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground font-medium">查詢月份</span>
            <Select value={viewMonth} onValueChange={setViewMonth}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="選擇月份" />
              </SelectTrigger>
              <SelectContent>
                {availableMonths.map(o => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {viewRecord && (
              <Badge variant="outline" className={statusColors[viewRecord.status]}>{viewRecord.status}</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      {stats.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {stats.map((s) => (
            <Card key={s.label}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                  <s.icon className={`h-5 w-5 ${s.color}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className="text-xl font-bold text-foreground">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Department Breakdown */}
      {viewRecord ? (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{viewRecord.period} 部門薪資明細</CardTitle>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => navigate(`/payroll/calculate/${viewRecord.id}`)}>
                <Eye className="h-4 w-4" /> 查看詳情
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>部門</TableHead>
                  <TableHead>下級部門</TableHead>
                  <TableHead>人數</TableHead>
                  <TableHead className="text-right">基本薪資</TableHead>
                  <TableHead className="text-right">津貼</TableHead>
                  <TableHead className="text-right">獎金</TableHead>
                  <TableHead className="text-right">加班費</TableHead>
                  <TableHead className="text-right">扣款</TableHead>
                  <TableHead className="text-right">實發</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {viewDepts.map(dept => (
                  <TableRow key={dept.department} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/payroll/calculate/${viewRecord.id}`)}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-primary" />
                        <span className="font-medium">{dept.department}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {dept.subDepartments.map(sub => (
                          <Badge key={sub.name} variant="outline" className="text-xs bg-muted/50">{sub.name}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{dept.employeeCount} 人</TableCell>
                    <TableCell className="text-right">{dept.totalBase.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{dept.totalAllowance.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{dept.totalBonus.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{dept.totalOvertime.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-destructive">{dept.totalDeduction.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-semibold">{dept.totalNet.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/30 font-semibold">
                  <TableCell>合計</TableCell>
                  <TableCell></TableCell>
                  <TableCell>{grandTotalEmployees} 人</TableCell>
                  <TableCell className="text-right">{grandTotalBase.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{grandTotalAllowance.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{grandTotalBonus.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{grandTotalOvertime.toLocaleString()}</TableCell>
                  <TableCell className="text-right text-destructive">{grandTotalDeduction.toLocaleString()}</TableCell>
                  <TableCell className="text-right text-primary">{grandTotalNet.toLocaleString()}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            該月份尚無薪資計算記錄
          </CardContent>
        </Card>
      )}

      {/* Confirm Dialog */}
      <AlertDialog open={!!confirmTarget} onOpenChange={() => setConfirmTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認薪資</AlertDialogTitle>
            <AlertDialogDescription>
              確認 {confirmTarget?.period} 的薪資計算結果？確認後將無法修改。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>確認</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
