import { BarChart3, Download, Eye, Minus, Plus, Search, Target, TrendingDown, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';

interface KpiRecord {
  completionRate: number;
  cycle: string;
  department: string;
  employeeId: string;
  employeeName: string;
  grade: string;
  id: string;
  kpiCount: number;
  position: string;
  score: number;
  status: string;
  trend: 'down' | 'stable' | 'up';
}

const initialData: KpiRecord[] = [
  {
    id: 'KPI001',
    employeeId: 'EMP001',
    employeeName: '張小明',
    department: '技術部',
    position: '高級工程師',
    cycle: '2026 Q1',
    kpiCount: 5,
    completionRate: 95,
    score: 92,
    grade: 'A',
    trend: 'up',
    status: '已完成'
  },
  {
    id: 'KPI002',
    employeeId: 'EMP002',
    employeeName: '李文華',
    department: '銷售部',
    position: '銷售經理',
    cycle: '2026 Q1',
    kpiCount: 6,
    completionRate: 88,
    score: 85,
    grade: 'B+',
    trend: 'stable',
    status: '已完成'
  },
  {
    id: 'KPI003',
    employeeId: 'EMP003',
    employeeName: '王美玲',
    department: '人事部',
    position: 'HR 專員',
    cycle: '2026 Q1',
    kpiCount: 4,
    completionRate: 0,
    score: 0,
    grade: '-',
    trend: 'stable',
    status: '待評估'
  },
  {
    id: 'KPI004',
    employeeId: 'EMP006',
    employeeName: '黃志偉',
    department: '技術部',
    position: '前端工程師',
    cycle: '2026 Q1',
    kpiCount: 5,
    completionRate: 72,
    score: 78,
    grade: 'B',
    trend: 'down',
    status: '進行中'
  },
  {
    id: 'KPI005',
    employeeId: 'EMP004',
    employeeName: '陳大偉',
    department: '市場部',
    position: '市場總監',
    cycle: '2026 Q1',
    kpiCount: 7,
    completionRate: 60,
    score: 0,
    grade: '-',
    trend: 'stable',
    status: '進行中'
  },
  {
    id: 'KPI006',
    employeeId: 'EMP005',
    employeeName: '林佳蓉',
    department: '財務部',
    position: '財務主管',
    cycle: '2026 Q1',
    kpiCount: 5,
    completionRate: 100,
    score: 96,
    grade: 'A+',
    trend: 'up',
    status: '已完成'
  },
  {
    id: 'KPI007',
    employeeId: 'EMP001',
    employeeName: '張小明',
    department: '技術部',
    position: '高級工程師',
    cycle: '2025 Q4',
    kpiCount: 5,
    completionRate: 90,
    score: 88,
    grade: 'B+',
    trend: 'up',
    status: '已歸檔'
  },
  {
    id: 'KPI008',
    employeeId: 'EMP002',
    employeeName: '李文華',
    department: '銷售部',
    position: '銷售經理',
    cycle: '2025 Q4',
    kpiCount: 6,
    completionRate: 85,
    score: 83,
    grade: 'B',
    trend: 'stable',
    status: '已歸檔'
  }
];

const statusColors: Record<string, string> = {
  已完成: 'bg-success/10 text-success border-success/20',
  進行中: 'bg-primary/10 text-primary border-primary/20',
  待評估: 'bg-warning/10 text-warning border-warning/20',
  已歸檔: 'bg-muted text-muted-foreground'
};

const gradeColors: Record<string, string> = {
  'A+': 'bg-success/10 text-success border-success/20',
  A: 'bg-success/10 text-success border-success/20',
  'B+': 'bg-primary/10 text-primary border-primary/20',
  B: 'bg-primary/10 text-primary border-primary/20',
  C: 'bg-warning/10 text-warning border-warning/20',
  D: 'bg-destructive/10 text-destructive border-destructive/20'
};

const TrendIcon = ({ trend }: { trend: 'down' | 'stable' | 'up' }) => {
  if (trend === 'up') return <TrendingUp className="h-4 w-4 text-success" />;
  if (trend === 'down') return <TrendingDown className="h-4 w-4 text-destructive" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
};

export default function KpiAssessment() {
  const [search, setSearch] = useState('');
  const [cycleFilter, setCycleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [addOpen, setAddOpen] = useState(false);
  const navigate = useNavigate();

  const cycles = [...new Set(initialData.map(d => d.cycle))];
  const departments = [...new Set(initialData.map(d => d.department))];

  const data = initialData.filter(row => {
    const matchSearch = !search || Object.values(row).some(v => String(v).toLowerCase().includes(search.toLowerCase()));
    const matchCycle = cycleFilter === 'all' || row.cycle === cycleFilter;
    const matchStatus = statusFilter === 'all' || row.status === statusFilter;
    const matchDept = departmentFilter === 'all' || row.department === departmentFilter;
    return matchSearch && matchCycle && matchStatus && matchDept;
  });

  // Summary stats
  const currentCycleData = initialData.filter(d => d.cycle === '2026 Q1');
  const completedCount = currentCycleData.filter(d => d.status === '已完成').length;
  const inProgressCount = currentCycleData.filter(d => d.status === '進行中').length;
  // const pendingCount = currentCycleData.filter(d => d.status === '待評估').length;
  const avgScore =
    currentCycleData.filter(d => d.score > 0).reduce((sum, d) => sum + d.score, 0) /
    (currentCycleData.filter(d => d.score > 0).length || 1);

  const summaryCards = [
    { label: '本期考核人數', value: currentCycleData.length, icon: Target, color: 'text-primary' },
    { label: '已完成', value: completedCount, icon: BarChart3, color: 'text-success' },
    { label: '進行中', value: inProgressCount, icon: TrendingUp, color: 'text-primary' },
    { label: '平均分數', value: avgScore.toFixed(1), icon: Target, color: 'text-warning' }
  ];

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Target className="h-6 w-6 text-primary" />
            KPI 考核
          </h1>
          <p className="page-description">管理員工 KPI 指標設定、追蹤與考核評估</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" />
            匯出報表
          </Button>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            新增考核
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {summaryCards.map(card => (
          <Card key={card.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-muted`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{card.label}</p>
                <p className="text-2xl font-bold">{card.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜尋員工姓名、工號..."
                className="pl-9 h-9"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Select value={cycleFilter} onValueChange={setCycleFilter}>
                <SelectTrigger className="w-[140px] h-9">
                  <SelectValue placeholder="考核週期" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部週期</SelectItem>
                  {cycles.map(c => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-[130px] h-9">
                  <SelectValue placeholder="部門" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部部門</SelectItem>
                  {departments.map(d => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px] h-9">
                  <SelectValue placeholder="狀態" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部狀態</SelectItem>
                  <SelectItem value="進行中">進行中</SelectItem>
                  <SelectItem value="待評估">待評估</SelectItem>
                  <SelectItem value="已完成">已完成</SelectItem>
                  <SelectItem value="已歸檔">已歸檔</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>員工姓名</TableHead>
                <TableHead>部門</TableHead>
                <TableHead>職位</TableHead>
                <TableHead>考核週期</TableHead>
                <TableHead className="text-center">KPI 數量</TableHead>
                <TableHead className="text-center">完成率</TableHead>
                <TableHead className="text-center">評分</TableHead>
                <TableHead className="text-center">等級</TableHead>
                <TableHead className="text-center">趨勢</TableHead>
                <TableHead>狀態</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-10 text-muted-foreground">
                    暫無符合條件的考核記錄
                  </TableCell>
                </TableRow>
              ) : (
                data.map(row => (
                  <TableRow
                    key={row.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/employees/kpi/${row.id}`)}
                  >
                    <TableCell className="font-medium">{row.employeeName}</TableCell>
                    <TableCell>{row.department}</TableCell>
                    <TableCell>{row.position}</TableCell>
                    <TableCell>{row.cycle}</TableCell>
                    <TableCell className="text-center">{row.kpiCount}</TableCell>
                    <TableCell className="text-center">
                      {row.completionRate > 0 ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${(() => {
                                if (row.completionRate >= 80) return 'bg-success';
                                if (row.completionRate >= 50) return 'bg-warning';
                                return 'bg-destructive';
                              })()}`}
                              style={{ width: `${row.completionRate}%` }}
                            />
                          </div>
                          <span className="text-sm">{row.completionRate}%</span>
                        </div>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className="text-center font-medium">{row.score > 0 ? row.score : '-'}</TableCell>
                    <TableCell className="text-center">
                      {row.grade !== '-' ? (
                        <Badge variant="secondary" className={gradeColors[row.grade] || ''}>
                          {row.grade}
                        </Badge>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <TrendIcon trend={row.trend} />
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={statusColors[row.status] || ''}>
                        {row.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={e => {
                          e.stopPropagation();
                          navigate(`/employees/kpi/${row.id}`);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        查看
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* New KPI Dialog */}
      <NewKpiDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}

function NewKpiDialog({ onOpenChange, open }: { onOpenChange: (v: boolean) => void; open: boolean }) {
  const [form, setForm] = useState({
    employee: '',
    cycle: '2026 Q1',
    kpiName: '',
    weight: '',
    target: '',
    description: ''
  });

  const handleSubmit = () => {
    if (!form.employee || !form.kpiName) {
      toast({ title: '請填寫必填欄位', variant: 'destructive' });
      return;
    }
    toast({ title: 'KPI 考核已建立', description: `已為 ${form.employee} 建立 KPI 考核任務` });
    onOpenChange(false);
    setForm({ employee: '', cycle: '2026 Q1', kpiName: '', weight: '', target: '', description: '' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>新增 KPI 考核</DialogTitle>
          <DialogDescription>為員工設定 KPI 指標與考核目標</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>考核員工 *</Label>
              <Select value={form.employee} onValueChange={v => setForm({ ...form, employee: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="選擇員工" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="張小明">張小明</SelectItem>
                  <SelectItem value="李文華">李文華</SelectItem>
                  <SelectItem value="王美玲">王美玲</SelectItem>
                  <SelectItem value="陳大偉">陳大偉</SelectItem>
                  <SelectItem value="林佳蓉">林佳蓉</SelectItem>
                  <SelectItem value="黃志偉">黃志偉</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>考核週期</Label>
              <Select value={form.cycle} onValueChange={v => setForm({ ...form, cycle: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2026 Q1">2026 Q1</SelectItem>
                  <SelectItem value="2026 Q2">2026 Q2</SelectItem>
                  <SelectItem value="2026 年度">2026 年度</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>KPI 指標名稱 *</Label>
            <Input
              placeholder="例：季度銷售額達標率"
              value={form.kpiName}
              onChange={e => setForm({ ...form, kpiName: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>權重 (%)</Label>
              <Input
                type="number"
                placeholder="例：30"
                value={form.weight}
                onChange={e => setForm({ ...form, weight: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>目標值</Label>
              <Input
                placeholder="例：100萬"
                value={form.target}
                onChange={e => setForm({ ...form, target: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>指標說明</Label>
            <Textarea
              placeholder="描述此 KPI 的衡量標準與計算方式..."
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit}>確認建立</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
