import { BarChart3, Calendar, Download, Eye, Plus, Search, Settings, Target } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface PlanRecord {
  createdAt: string;
  criteriaCount: number;
  cycle: string;
  employeeCount: number;
  id: string;
  name: string;
  period: string;
  scope: string;
  status: string;
  weightConfig: string;
}

const initialData: PlanRecord[] = [
  {
    id: 'PLN001',
    name: '2026 Q1 績效考核',
    period: '2026-01 至 2026-03',
    cycle: '季度',
    scope: '全公司',
    criteriaCount: 8,
    employeeCount: 45,
    weightConfig: '自評20% 互評30% 主管50%',
    status: '進行中',
    createdAt: '2025-12-15'
  },
  {
    id: 'PLN002',
    name: '技術部年度考核',
    period: '2025-01 至 2025-12',
    cycle: '年度',
    scope: '技術部',
    criteriaCount: 10,
    employeeCount: 12,
    weightConfig: '自評15% 互評25% 主管60%',
    status: '已完成',
    createdAt: '2024-12-20'
  },
  {
    id: 'PLN003',
    name: '銷售部季度考核',
    period: '2026-01 至 2026-03',
    cycle: '季度',
    scope: '銷售部',
    criteriaCount: 6,
    employeeCount: 8,
    weightConfig: '自評20% 互評30% 主管50%',
    status: '進行中',
    createdAt: '2025-12-28'
  },
  {
    id: 'PLN004',
    name: '2026 Q2 績效考核',
    period: '2026-04 至 2026-06',
    cycle: '季度',
    scope: '全公司',
    criteriaCount: 8,
    employeeCount: 48,
    weightConfig: '自評20% 互評30% 主管50%',
    status: '草稿',
    createdAt: '2026-02-10'
  },
  {
    id: 'PLN005',
    name: '管理層半年度考核',
    period: '2026-01 至 2026-06',
    cycle: '半年度',
    scope: '管理層',
    criteriaCount: 12,
    employeeCount: 6,
    weightConfig: '自評10% 互評20% 主管70%',
    status: '草稿',
    createdAt: '2026-01-20'
  }
];

const statusColors: Record<string, string> = {
  進行中: 'bg-primary/10 text-primary border-primary/20',
  已完成: 'bg-success/10 text-success border-success/20',
  草稿: 'bg-muted text-muted-foreground'
};

export default function PerformancePlans() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const data = initialData.filter(row => {
    const matchSearch =
      !search || [row.name, row.scope, row.period].some(v => v.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFilter === 'all' || row.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const active = initialData.filter(d => d.status === '進行中').length;
  const draft = initialData.filter(d => d.status === '草稿').length;
  const completed = initialData.filter(d => d.status === '已完成').length;

  const summaryCards = [
    { label: '方案總數', value: initialData.length, icon: Target, color: 'text-primary' },
    { label: '進行中', value: active, icon: BarChart3, color: 'text-primary' },
    { label: '草稿', value: draft, icon: Settings, color: 'text-muted-foreground' },
    { label: '已完成', value: completed, icon: Calendar, color: 'text-success' }
  ];

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Target className="h-6 w-6 text-primary" />
            考核方案
          </h1>
          <p className="page-description">管理績效考核方案與指標設定</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" />
            匯出
          </Button>
          <Button size="sm" onClick={() => navigate('/performance/plans/new')}>
            <Plus className="h-4 w-4 mr-1" />
            新增方案
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
                placeholder="搜尋方案名稱..."
                className="pl-9 h-9"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[130px] h-9">
                <SelectValue placeholder="狀態" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部狀態</SelectItem>
                <SelectItem value="進行中">進行中</SelectItem>
                <SelectItem value="草稿">草稿</SelectItem>
                <SelectItem value="已完成">已完成</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>方案名稱</TableHead>
                <TableHead>考核週期</TableHead>
                <TableHead>週期類型</TableHead>
                <TableHead>考核範圍</TableHead>
                <TableHead className="text-center">指標數</TableHead>
                <TableHead className="text-center">考核人數</TableHead>
                <TableHead>權重配置</TableHead>
                <TableHead>狀態</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-10 text-muted-foreground">
                    暫無符合條件的方案
                  </TableCell>
                </TableRow>
              ) : (
                data.map(row => (
                  <TableRow
                    key={row.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/performance/plans/${row.id}`)}
                  >
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell>{row.period}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{row.cycle}</Badge>
                    </TableCell>
                    <TableCell>{row.scope}</TableCell>
                    <TableCell className="text-center">{row.criteriaCount}</TableCell>
                    <TableCell className="text-center">{row.employeeCount}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{row.weightConfig}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={statusColors[row.status] || ''}>
                        {row.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={e => {
                            e.stopPropagation();
                            navigate(`/performance/plans/${row.id}`);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          查看
                        </Button>
                      </div>
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
