import {
  ArrowLeft,
  Building2,
  Calculator,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  DollarSign,
  Download,
  Layers,
  Play,
  Search,
  Send,
  TrendingDown,
  TrendingUp,
  User,
  Users,
  Wallet
} from 'lucide-react';
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { mockBonusPenaltyRecords } from './BonusPenaltyManagement';
import {
  type DepartmentPayrollSummary,
  type PayrollEmployee,
  getEmployeesWithBonusPenalty,
  mockCalcRecords,
  mockEmployees
} from './PayrollCalculate';

const statusColors: Record<string, string> = {
  待計算: 'bg-muted text-muted-foreground border-border',
  計算中: 'bg-primary/10 text-primary border-primary/20',
  已計算: 'bg-accent/10 text-accent-foreground border-accent/20',
  已確認: 'bg-success/10 text-success border-success/20',
  已發放: 'bg-primary/10 text-primary border-primary/20'
};

const empStatusColors: Record<string, string> = {
  待計算: 'bg-muted text-muted-foreground border-border',
  已計算: 'bg-success/10 text-success border-success/20',
  已調整: 'bg-warning/10 text-warning border-warning/20',
  已確認: 'bg-primary/10 text-primary border-primary/20'
};

// Group employees by department then sub-department
function groupByDepartmentAndSub(employees: PayrollEmployee[]): Map<string, Map<string, PayrollEmployee[]>> {
  const map = new Map<string, Map<string, PayrollEmployee[]>>();
  employees.forEach(e => {
    if (!map.has(e.department)) map.set(e.department, new Map());
    const subMap = map.get(e.department)!;
    if (!subMap.has(e.subDepartment)) subMap.set(e.subDepartment, []);
    subMap.get(e.subDepartment)!.push(e);
  });
  return map;
}

// Column width classes for consistent alignment
const colWidths = {
  employee: 'w-[15%]',
  position: 'w-[9%]',
  base: 'w-[10%]',
  allowance: 'w-[10%]',
  bonus: 'w-[9%]',
  overtime: 'w-[9%]',
  deduction: 'w-[10%]',
  net: 'w-[10%]',
  status: 'w-[14%]'
};

function DepartmentSection({
  department,
  onSelectEmployee,
  selectedEmployee,
  subGroups,
  summary
}: {
  department: string;
  onSelectEmployee: (emp: PayrollEmployee) => void;
  selectedEmployee: PayrollEmployee | null;
  subGroups: Map<string, PayrollEmployee[]>;
  summary: DepartmentPayrollSummary;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const [openSubs, setOpenSubs] = useState<Set<string>>(new Set(Array.from(subGroups.keys())));

  const toggleSub = (sub: string) => {
    setOpenSubs(prev => {
      const next = new Set(prev);
      next.has(sub) ? next.delete(sub) : next.add(sub);
      return next;
    });
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-3 cursor-pointer hover:bg-muted/30 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isOpen ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
                <Building2 className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">{department}</CardTitle>
                <Badge variant="outline" className="bg-muted text-muted-foreground border-border">
                  {summary.employeeCount} 人
                </Badge>
                <Badge variant="outline" className="bg-muted/50 text-muted-foreground border-border text-xs">
                  {summary.subDepartments.length} 下級部門
                </Badge>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div className="text-right">
                  <p className="text-muted-foreground text-xs">基本薪資</p>
                  <p className="font-semibold">{summary.totalBase.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-muted-foreground text-xs">津貼</p>
                  <p className="font-semibold text-success">{summary.totalAllowance.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-muted-foreground text-xs">扣款</p>
                  <p className="font-semibold text-destructive">{summary.totalDeduction.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-muted-foreground text-xs">實發</p>
                  <p className="font-bold text-primary text-base">{summary.totalNet.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="p-0 pt-0">
            <Table className="table-fixed">
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className={colWidths.employee}>員工</TableHead>
                  <TableHead className={colWidths.position}>職位</TableHead>
                  <TableHead className={`${colWidths.base} text-right`}>基本薪資</TableHead>
                  <TableHead className={`${colWidths.allowance} text-right`}>津貼</TableHead>
                  <TableHead className={`${colWidths.bonus} text-right`}>獎金</TableHead>
                  <TableHead className={`${colWidths.overtime} text-right`}>加班費</TableHead>
                  <TableHead className={`${colWidths.deduction} text-right`}>扣款</TableHead>
                  <TableHead className={`${colWidths.net} text-right`}>實發</TableHead>
                  <TableHead className={colWidths.status}>狀態</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from(subGroups.entries()).map(([subDept, emps]) => {
                  const subTotal = emps.reduce((s, e) => s + e.netSalary, 0);
                  const isSubOpen = openSubs.has(subDept);
                  return (
                    <React.Fragment key={subDept}>
                      {/* Sub-department header row */}
                      <TableRow
                        className="bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors"
                        onClick={() => toggleSub(subDept)}
                      >
                        <TableCell colSpan={7} className="py-2">
                          <div className="flex items-center gap-2">
                            {isSubOpen ? (
                              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                            <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-sm font-medium text-muted-foreground">{subDept}</span>
                            <Badge variant="outline" className="text-xs bg-background">
                              {emps.length} 人
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-right py-2" colSpan={2}>
                          <span className="text-sm font-medium text-foreground">實發 {subTotal.toLocaleString()}</span>
                        </TableCell>
                      </TableRow>
                      {/* Employee rows */}
                      {isSubOpen &&
                        emps.map(emp => (
                          <TableRow
                            key={emp.id}
                            className={`cursor-pointer hover:bg-muted/50 ${selectedEmployee?.id === emp.id ? 'bg-primary/5' : ''}`}
                            onClick={() => onSelectEmployee(emp)}
                          >
                            <TableCell className={colWidths.employee}>
                              <div className="flex items-center gap-2">
                                <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                  <User className="h-3.5 w-3.5 text-primary" />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-medium text-sm truncate">{emp.name}</p>
                                  <p className="text-xs text-muted-foreground">{emp.employeeId}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className={`${colWidths.position} text-sm text-muted-foreground truncate`}>
                              {emp.position}
                            </TableCell>
                            <TableCell className={`${colWidths.base} text-right text-sm`}>
                              {emp.baseSalary.toLocaleString()}
                            </TableCell>
                            <TableCell className={`${colWidths.allowance} text-right text-sm`}>
                              {emp.allowances
                                .filter(a => !a.name.includes('獎金'))
                                .reduce((s, a) => s + a.amount, 0)
                                .toLocaleString()}
                            </TableCell>
                            <TableCell className={`${colWidths.bonus} text-right text-sm`}>
                              {emp.allowances
                                .filter(a => a.name.includes('獎金'))
                                .reduce((s, a) => s + a.amount, 0)
                                .toLocaleString()}
                            </TableCell>
                            <TableCell className={`${colWidths.overtime} text-right text-sm`}>
                              {emp.overtime.amount.toLocaleString()}
                            </TableCell>
                            <TableCell className={`${colWidths.deduction} text-right text-sm text-destructive`}>
                              {emp.totalDeduction.toLocaleString()}
                            </TableCell>
                            <TableCell className={`${colWidths.net} text-right text-sm font-semibold`}>
                              {emp.netSalary.toLocaleString()}
                            </TableCell>
                            <TableCell className={colWidths.status}>
                              <Badge variant="outline" className={`text-xs ${empStatusColors[emp.status]}`}>
                                {emp.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

// Build summaries from filtered data
const buildSummary = (dept: string, subGroups: Map<string, PayrollEmployee[]>): DepartmentPayrollSummary => {
  const allEmps = Array.from(subGroups.values()).flat();
  return {
    department: dept,
    subDepartments: Array.from(subGroups.entries()).map(([name, emps]) => ({
      name,
      employeeCount: emps.length,
      totalNet: emps.reduce((s, e) => s + e.netSalary, 0)
    })),
    employeeCount: allEmps.length,
    totalBase: allEmps.reduce((s, e) => s + e.baseSalary, 0),
    totalAllowance: allEmps.reduce(
      (s, e) => s + e.allowances.filter(a => !a.name.includes('獎金')).reduce((a, al) => a + al.amount, 0),
      0
    ),
    totalBonus: allEmps.reduce(
      (s, e) => s + e.allowances.filter(a => a.name.includes('獎金')).reduce((a, al) => a + al.amount, 0),
      0
    ),
    totalOvertime: allEmps.reduce((s, e) => s + e.overtime.amount, 0),
    totalDeduction: allEmps.reduce((s, e) => s + e.totalDeduction, 0),
    totalNet: allEmps.reduce((s, e) => s + e.netSalary, 0)
  };
};

export default function PayrollCalcDetail() {
  const { calcId } = useParams();
  const navigate = useNavigate();
  const originalRecord = mockCalcRecords.find(r => r.id === calcId) || mockCalcRecords[0];
  const [currentStatus, setCurrentStatus] = useState(originalRecord.status);
  const record = { ...originalRecord, status: currentStatus };
  const [search, setSearch] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<PayrollEmployee | null>(null);

  // Merge bonus/penalty records for the record's month
  const recordMonth = `${record.year}-${record.month}`;
  const mergedEmployees = getEmployeesWithBonusPenalty(mockEmployees, mockBonusPenaltyRecords, recordMonth);

  const filteredEmployees = mergedEmployees.filter(
    e =>
      e.name.includes(search) ||
      e.employeeId.toLowerCase().includes(search.toLowerCase()) ||
      e.department.includes(search) ||
      e.subDepartment.includes(search)
  );

  const departmentGroups = groupByDepartmentAndSub(filteredEmployees);

  const isEditable = record.status === '待計算' || record.status === '已計算';

  const summaryCards = [
    {
      label: '基本薪資合計',
      value: `HK$ ${record.totalBase.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-primary'
    },
    {
      label: '津貼合計',
      value: `HK$ ${record.totalAllowance.toLocaleString()}`,
      icon: TrendingUp,
      color: 'text-success'
    },
    {
      label: '加班費合計',
      value: `HK$ ${record.totalOvertime.toLocaleString()}`,
      icon: Calculator,
      color: 'text-accent-foreground'
    },
    {
      label: '扣款合計',
      value: `HK$ ${record.totalDeduction.toLocaleString()}`,
      icon: TrendingDown,
      color: 'text-destructive'
    },
    { label: '實發合計', value: `HK$ ${record.totalNet.toLocaleString()}`, icon: Wallet, color: 'text-primary' },
    {
      label: '部門 / 人數',
      value: `${record.departments.length} 部門 · ${record.employeeCount} 人`,
      icon: Users,
      color: 'text-muted-foreground'
    }
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/payroll/calculate')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">{record.period} 薪資計算</h1>
              <Badge variant="outline" className={statusColors[record.status]}>
                {record.status}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">
              編號 {record.id} · 建立者 {record.createdBy} · 更新於 {record.updatedAt}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" /> 匯出
          </Button>
          {isEditable && (
            <>
              {record.status === '待計算' && (
                <Button
                  className="gap-2"
                  onClick={() => {
                    setCurrentStatus('已計算');
                    toast.success('薪資計算完成');
                  }}
                >
                  <Play className="h-4 w-4" /> 執行計算
                </Button>
              )}
              {record.status === '已計算' && (
                <>
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => {
                      setCurrentStatus('已計算');
                      toast.success('已重新計算薪資');
                    }}
                  >
                    <Play className="h-4 w-4" /> 重新計算
                  </Button>
                  <Button
                    className="gap-2"
                    onClick={() => {
                      setCurrentStatus('已確認');
                      toast.success('薪資已確認並提交');
                    }}
                  >
                    <CheckCircle className="h-4 w-4" /> 確認並提交
                  </Button>
                </>
              )}
            </>
          )}
          {record.status === '已確認' && (
            <Button
              className="gap-2"
              onClick={() => {
                toast.success('已生成發薪申請');
                navigate('/payroll/distribute/new');
              }}
            >
              <Send className="h-4 w-4" /> 生成發薪申請
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {summaryCards.map(s => (
          <Card key={s.label}>
            <CardContent className="p-4 text-center">
              <s.icon className={`h-5 w-5 mx-auto mb-2 ${s.color}`} />
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-lg font-bold text-foreground mt-1">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜尋員工、部門或下級部門..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Sections */}
        <div className="lg:col-span-2 space-y-4">
          {Array.from(departmentGroups.entries()).map(([dept, subGroups]) => {
            const summary = buildSummary(dept, subGroups);
            return (
              <DepartmentSection
                key={dept}
                department={dept}
                subGroups={subGroups}
                summary={summary}
                selectedEmployee={selectedEmployee}
                onSelectEmployee={setSelectedEmployee}
              />
            );
          })}
          {departmentGroups.size === 0 && (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">沒有符合搜尋條件的員工</CardContent>
            </Card>
          )}
        </div>

        {/* Employee Detail Sidebar */}
        <div className="space-y-4">
          {selectedEmployee ? (
            <Card className="sticky top-6">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{selectedEmployee.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {selectedEmployee.department} · {selectedEmployee.subDepartment} · {selectedEmployee.position}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">工號</span>
                  <span className="font-medium">{selectedEmployee.employeeId}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">適用方案</span>
                  <span className="font-medium text-primary">{selectedEmployee.planName}</span>
                </div>
                <Separator />

                {/* Earnings */}
                <div>
                  <p className="text-sm font-semibold text-success mb-2">收入項目</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>基本薪資</span>
                      <span className="font-medium">{selectedEmployee.baseSalary.toLocaleString()}</span>
                    </div>
                    {selectedEmployee.allowances
                      .filter(a => !a.name.includes('（獎罰）'))
                      .map((a, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span>{a.name}</span>
                          <span className="font-medium">{a.amount.toLocaleString()}</span>
                        </div>
                      ))}
                    {selectedEmployee.allowances.filter(a => a.name.includes('（獎罰）')).length > 0 && (
                      <>
                        <Separator className="my-1" />
                        <p className="text-xs font-medium text-primary">獎金（來自獎罰管理）</p>
                        {selectedEmployee.allowances
                          .filter(a => a.name.includes('（獎罰）'))
                          .map((a, i) => (
                            <div key={`bp-${i}`} className="flex justify-between text-sm">
                              <span className="flex items-center gap-1">
                                <Badge
                                  variant="outline"
                                  className="text-[10px] px-1 py-0 bg-success/10 text-success border-success/20"
                                >
                                  獎
                                </Badge>
                                {a.name.replace('（獎罰）', '')}
                              </span>
                              <span className="font-medium text-success">+{a.amount.toLocaleString()}</span>
                            </div>
                          ))}
                      </>
                    )}
                    {selectedEmployee.overtime.amount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>加班費（{selectedEmployee.overtime.hours}h）</span>
                        <span className="font-medium">{selectedEmployee.overtime.amount.toLocaleString()}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between text-sm font-semibold">
                      <span>收入小計</span>
                      <span className="text-success">{selectedEmployee.totalEarnings.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Deductions */}
                <div>
                  <p className="text-sm font-semibold text-destructive mb-2">扣款項目</p>
                  <div className="space-y-2">
                    {selectedEmployee.deductions
                      .filter(d => !d.name.includes('（獎罰）'))
                      .map((d, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span>{d.name}</span>
                          <span className="font-medium text-destructive">-{d.amount.toLocaleString()}</span>
                        </div>
                      ))}
                    {selectedEmployee.deductions.filter(d => d.name.includes('（獎罰）')).length > 0 && (
                      <>
                        <Separator className="my-1" />
                        <p className="text-xs font-medium text-primary">罰款（來自獎罰管理）</p>
                        {selectedEmployee.deductions
                          .filter(d => d.name.includes('（獎罰）'))
                          .map((d, i) => (
                            <div key={`bp-d-${i}`} className="flex justify-between text-sm">
                              <span className="flex items-center gap-1">
                                <Badge
                                  variant="outline"
                                  className="text-[10px] px-1 py-0 bg-destructive/10 text-destructive border-destructive/20"
                                >
                                  罰
                                </Badge>
                                {d.name.replace('（獎罰）', '')}
                              </span>
                              <span className="font-medium text-destructive">-{d.amount.toLocaleString()}</span>
                            </div>
                          ))}
                      </>
                    )}
                    <Separator />
                    <div className="flex justify-between text-sm font-semibold">
                      <span>扣款小計</span>
                      <span className="text-destructive">-{selectedEmployee.totalDeduction.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Net */}
                <div className="bg-primary/5 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-foreground">實發金額</span>
                    <span className="text-2xl font-bold text-primary">
                      HK$ {selectedEmployee.netSalary.toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>點擊左側員工查看薪資詳情</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
