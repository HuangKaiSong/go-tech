import { BarChart3, CheckCircle, Clock, Download, Eye, Plus, Search, Target, Users } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface EvalRecord {
  cycle: string;
  department: string;
  employeeId: string;
  finalScore: number | null;
  grade: string;
  id: string;
  managerScore: number | null;
  name: string;
  peerScore: number | null;
  plan: string;
  position: string;
  selfScore: number | null;
  status: string;
}

const initialData: EvalRecord[] = [
  {
    id: 'EVL001',
    employeeId: 'EMP001',
    name: '張小明',
    department: '技術部',
    position: '高級工程師',
    plan: '2026 Q1 績效考核',
    cycle: '2026 Q1',
    selfScore: 90,
    peerScore: 88,
    managerScore: 94,
    finalScore: 92,
    grade: 'A',
    status: '已完成'
  },
  {
    id: 'EVL002',
    employeeId: 'EMP002',
    name: '李文華',
    department: '銷售部',
    position: '銷售經理',
    plan: '銷售部季度考核',
    cycle: '2026 Q1',
    selfScore: 82,
    peerScore: 86,
    managerScore: 85,
    finalScore: 85,
    grade: 'B+',
    status: '已完成'
  },
  {
    id: 'EVL003',
    employeeId: 'EMP003',
    name: '王美玲',
    department: '人事部',
    position: 'HR 專員',
    plan: '2026 Q1 績效考核',
    cycle: '2026 Q1',
    selfScore: 88,
    peerScore: null,
    managerScore: null,
    finalScore: null,
    grade: '-',
    status: '同事互評中'
  },
  {
    id: 'EVL004',
    employeeId: 'EMP006',
    name: '黃志偉',
    department: '技術部',
    position: '前端工程師',
    plan: '2026 Q1 績效考核',
    cycle: '2026 Q1',
    selfScore: null,
    peerScore: null,
    managerScore: null,
    finalScore: null,
    grade: '-',
    status: '待自評'
  },
  {
    id: 'EVL005',
    employeeId: 'EMP004',
    name: '陳大偉',
    department: '市場部',
    position: '市場總監',
    plan: '2026 Q1 績效考核',
    cycle: '2026 Q1',
    selfScore: 85,
    peerScore: 83,
    managerScore: null,
    finalScore: null,
    grade: '-',
    status: '待主管評'
  },
  {
    id: 'EVL006',
    employeeId: 'EMP005',
    name: '林佳蓉',
    department: '財務部',
    position: '財務主管',
    plan: '2026 Q1 績效考核',
    cycle: '2026 Q1',
    selfScore: 92,
    peerScore: 90,
    managerScore: 95,
    finalScore: 93,
    grade: 'A',
    status: '已完成'
  }
];

const statusColors: Record<string, string> = {
  已完成: 'bg-success/10 text-success border-success/20',
  待自評: 'bg-warning/10 text-warning border-warning/20',
  同事互評中: 'bg-primary/10 text-primary border-primary/20',
  待主管評: 'bg-accent text-accent-foreground'
};

export default function PerformanceEvaluation() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');

  const departments = [...new Set(initialData.map(d => d.department))];

  const data = initialData.filter(row => {
    const matchSearch =
      !search || [row.name, row.department, row.plan].some(v => v.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFilter === 'all' || row.status === statusFilter;
    const matchDept = deptFilter === 'all' || row.department === deptFilter;
    return matchSearch && matchStatus && matchDept;
  });

  const completed = initialData.filter(d => d.status === '已完成').length;
  const inProgress = initialData.filter(d => d.status !== '已完成').length;
  const avgScore =
    initialData.filter(d => d.finalScore).reduce((s, d) => s + (d.finalScore || 0), 0) /
    (initialData.filter(d => d.finalScore).length || 1);

  const summaryCards = [
    { label: '考核人數', value: initialData.length, icon: Users, color: 'text-primary' },
    { label: '已完成', value: completed, icon: CheckCircle, color: 'text-success' },
    { label: '進行中', value: inProgress, icon: Clock, color: 'text-warning' },
    { label: '平均分數', value: avgScore.toFixed(1), icon: BarChart3, color: 'text-primary' }
  ];

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Target className="h-6 w-6 text-primary" />
            績效評估
          </h1>
          <p className="page-description">查看與管理員工績效評估結果</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" />
            匯出
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1" />
            開始評估
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {summaryCards.map(card => (
          <Card key={card.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
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
                placeholder="搜尋員工姓名、部門..."
                className="pl-9 h-9"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Select value={deptFilter} onValueChange={setDeptFilter}>
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
                <SelectTrigger className="w-[140px] h-9">
                  <SelectValue placeholder="狀態" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部狀態</SelectItem>
                  <SelectItem value="待自評">待自評</SelectItem>
                  <SelectItem value="同事互評中">同事互評中</SelectItem>
                  <SelectItem value="待主管評">待主管評</SelectItem>
                  <SelectItem value="已完成">已完成</SelectItem>
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
                <TableHead>考核方案</TableHead>
                <TableHead className="text-center">自評</TableHead>
                <TableHead className="text-center">互評</TableHead>
                <TableHead className="text-center">主管評</TableHead>
                <TableHead className="text-center">最終分數</TableHead>
                <TableHead className="text-center">等級</TableHead>
                <TableHead>狀態</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-10 text-muted-foreground">
                    暫無符合條件的記錄
                  </TableCell>
                </TableRow>
              ) : (
                data.map(row => (
                  <TableRow
                    key={row.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/performance/evaluation/${row.id}`)}
                  >
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell>{row.department}</TableCell>
                    <TableCell>{row.position}</TableCell>
                    <TableCell>{row.plan}</TableCell>
                    <TableCell className="text-center">{row.selfScore ?? '-'}</TableCell>
                    <TableCell className="text-center">{row.peerScore ?? '-'}</TableCell>
                    <TableCell className="text-center">{row.managerScore ?? '-'}</TableCell>
                    <TableCell className="text-center font-semibold">{row.finalScore ?? '-'}</TableCell>
                    <TableCell className="text-center">
                      {row.grade !== '-' ? (
                        <Badge
                          variant="secondary"
                          className={(() => {
                            if (row.grade.startsWith('A')) return 'bg-success/10 text-success border-success/20';
                            if (row.grade.startsWith('B')) return 'bg-primary/10 text-primary border-primary/20';
                            return '';
                          })()}
                        >
                          {row.grade}
                        </Badge>
                      ) : (
                        '-'
                      )}
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
                          navigate(`/performance/evaluation/${row.id}`);
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
    </div>
  );
}
