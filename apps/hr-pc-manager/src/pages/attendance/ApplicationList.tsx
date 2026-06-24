import {
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  Filter,
  ListTodo,
  RotateCcw,
  Search,
  Timer,
  XCircle
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NewApplicationDialog } from '@/components/attendance/NewApplicationDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

/* ─── Types ─── */
type AppStatus = '審核中' | '已撤回' | '已核准' | '已駁回' | '待審核' | '草稿';
type AppCategory = 'expense' | 'leave' | 'overtime' | 'resignation' | 'travel';

interface AppRecord {
  applicant: string;
  category: AppCategory;
  code: string;
  currentNode: string;
  department: string;
  duration: string;
  endDate: string;
  id: string;
  reason: string;
  startDate: string;
  status: AppStatus;
  submitTime: string;
  subType: string;
}

const categoryConfig: Record<AppCategory, { color: string; label: string }> = {
  leave: { label: '請假', color: 'bg-primary/10 text-primary border-primary/20' },
  overtime: { label: '加班', color: 'bg-accent/10 text-accent border-accent/20' },
  travel: { label: '出差', color: 'bg-warning/10 text-warning border-warning/20' },
  expense: { label: '報銷', color: 'bg-success/10 text-success border-success/20' },
  resignation: { label: '離職', color: 'bg-destructive/10 text-destructive border-destructive/20' }
};

const statusConfig: Record<AppStatus, { color: string; icon: React.ElementType }> = {
  草稿: { color: 'bg-muted text-muted-foreground', icon: FileText },
  待審核: { color: 'bg-warning/10 text-warning border-warning/20', icon: Clock },
  審核中: { color: 'bg-accent/10 text-accent border-accent/20', icon: Clock },
  已核准: { color: 'bg-success/10 text-success border-success/20', icon: CheckCircle2 },
  已駁回: { color: 'bg-destructive/10 text-destructive border-destructive/20', icon: XCircle },
  已撤回: { color: 'bg-muted text-muted-foreground', icon: RotateCcw }
};

const mockData: AppRecord[] = [
  // 請假
  {
    id: 'LV-2026-0045',
    code: 'LV-2026-0045',
    category: 'leave',
    applicant: '張小明',
    department: '技術部',
    subType: '年假',
    startDate: '2026-03-10',
    endDate: '2026-03-12',
    duration: '3 天',
    reason: '家庭旅遊',
    status: '待審核',
    submitTime: '2026-03-05 09:30',
    currentNode: '部門主管審批'
  },
  {
    id: 'LV-2026-0044',
    code: 'LV-2026-0044',
    category: 'leave',
    applicant: '李文華',
    department: '銷售部',
    subType: '事假',
    startDate: '2026-03-08',
    endDate: '2026-03-09',
    duration: '2 天',
    reason: '個人事務處理',
    status: '審核中',
    submitTime: '2026-03-04 14:20',
    currentNode: '人事部審核'
  },
  {
    id: 'LV-2026-0043',
    code: 'LV-2026-0043',
    category: 'leave',
    applicant: '王美玲',
    department: '人事部',
    subType: '病假',
    startDate: '2026-03-06',
    endDate: '2026-03-06',
    duration: '1 天',
    reason: '身體不適就醫',
    status: '已核准',
    submitTime: '2026-03-05 08:00',
    currentNode: '已完成'
  },
  {
    id: 'LV-2026-0042',
    code: 'LV-2026-0042',
    category: 'leave',
    applicant: '陳大偉',
    department: '市場部',
    subType: '年假',
    startDate: '2026-03-15',
    endDate: '2026-03-19',
    duration: '5 天',
    reason: '出國旅遊',
    status: '待審核',
    submitTime: '2026-03-03 10:15',
    currentNode: '部門主管審批'
  },
  {
    id: 'LV-2026-0041',
    code: 'LV-2026-0041',
    category: 'leave',
    applicant: '林佳蓉',
    department: '財務部',
    subType: '補休',
    startDate: '2026-03-07',
    endDate: '2026-03-07',
    duration: '1 天',
    reason: '使用加班補休',
    status: '已核准',
    submitTime: '2026-03-02 16:30',
    currentNode: '已完成'
  },
  {
    id: 'LV-2026-0040',
    code: 'LV-2026-0040',
    category: 'leave',
    applicant: '黃志偉',
    department: '技術部',
    subType: '事假',
    startDate: '2026-03-03',
    endDate: '2026-03-03',
    duration: '1 天',
    reason: '搬家',
    status: '已駁回',
    submitTime: '2026-02-28 11:00',
    currentNode: '已結束'
  },
  // 加班
  {
    id: 'OT-2026-0012',
    code: 'OT-2026-0012',
    category: 'overtime',
    applicant: '張小明',
    department: '技術部',
    subType: '平日加班',
    startDate: '2026-02-25',
    endDate: '2026-02-25',
    duration: '3 小時',
    reason: '專案上線',
    status: '已核准',
    submitTime: '2026-02-24 17:00',
    currentNode: '已完成'
  },
  {
    id: 'OT-2026-0011',
    code: 'OT-2026-0011',
    category: 'overtime',
    applicant: '黃志偉',
    department: '技術部',
    subType: '平日加班',
    startDate: '2026-02-24',
    endDate: '2026-02-24',
    duration: '2 小時',
    reason: 'Bug 修復',
    status: '已核准',
    submitTime: '2026-02-23 18:00',
    currentNode: '已完成'
  },
  {
    id: 'OT-2026-0010',
    code: 'OT-2026-0010',
    category: 'overtime',
    applicant: '林佳蓉',
    department: '財務部',
    subType: '假日加班',
    startDate: '2026-02-26',
    endDate: '2026-02-26',
    duration: '4 小時',
    reason: '月結報告',
    status: '待審核',
    submitTime: '2026-02-25 09:00',
    currentNode: '部門主管審批'
  },
  {
    id: 'OT-2026-0009',
    code: 'OT-2026-0009',
    category: 'overtime',
    applicant: '陳大偉',
    department: '市場部',
    subType: '平日加班',
    startDate: '2026-03-01',
    endDate: '2026-03-01',
    duration: '2.5 小時',
    reason: '活動策劃',
    status: '待審核',
    submitTime: '2026-02-28 17:30',
    currentNode: '部門主管審批'
  },
  {
    id: 'OT-2026-0008',
    code: 'OT-2026-0008',
    category: 'overtime',
    applicant: '李文華',
    department: '銷售部',
    subType: '假日加班',
    startDate: '2026-03-02',
    endDate: '2026-03-02',
    duration: '6 小時',
    reason: '客戶演示準備',
    status: '審核中',
    submitTime: '2026-03-01 10:00',
    currentNode: '人事部審核'
  },
  // 出差
  {
    id: 'TR-2026-0005',
    code: 'TR-2026-0005',
    category: 'travel',
    applicant: '陳大偉',
    department: '市場部',
    subType: '國內出差',
    startDate: '2026-03-20',
    endDate: '2026-03-22',
    duration: '3 天',
    reason: '參加行業展覽會',
    status: '待審核',
    submitTime: '2026-03-06 10:00',
    currentNode: '部門主管審批'
  },
  {
    id: 'TR-2026-0004',
    code: 'TR-2026-0004',
    category: 'travel',
    applicant: '李文華',
    department: '銷售部',
    subType: '國內出差',
    startDate: '2026-03-15',
    endDate: '2026-03-16',
    duration: '2 天',
    reason: '客戶拜訪',
    status: '已核准',
    submitTime: '2026-03-03 09:00',
    currentNode: '已完成'
  },
  {
    id: 'TR-2026-0003',
    code: 'TR-2026-0003',
    category: 'travel',
    applicant: '張小明',
    department: '技術部',
    subType: '海外出差',
    startDate: '2026-04-01',
    endDate: '2026-04-05',
    duration: '5 天',
    reason: '技術交流會議',
    status: '審核中',
    submitTime: '2026-03-01 14:00',
    currentNode: '總經理審批'
  },
  // 報銷
  {
    id: 'EX-2026-0008',
    code: 'EX-2026-0008',
    category: 'expense',
    applicant: '李文華',
    department: '銷售部',
    subType: '差旅費',
    startDate: '2026-03-05',
    endDate: '2026-03-05',
    duration: 'NT$12,500',
    reason: '客戶拜訪差旅報銷',
    status: '待審核',
    submitTime: '2026-03-06 11:00',
    currentNode: '部門主管審批'
  },
  {
    id: 'EX-2026-0007',
    code: 'EX-2026-0007',
    category: 'expense',
    applicant: '王美玲',
    department: '人事部',
    subType: '辦公用品',
    startDate: '2026-03-02',
    endDate: '2026-03-02',
    duration: 'NT$3,200',
    reason: '採購辦公文具',
    status: '已核准',
    submitTime: '2026-03-03 09:30',
    currentNode: '已完成'
  },
  {
    id: 'EX-2026-0006',
    code: 'EX-2026-0006',
    category: 'expense',
    applicant: '陳大偉',
    department: '市場部',
    subType: '餐費',
    startDate: '2026-02-28',
    endDate: '2026-02-28',
    duration: 'NT$2,800',
    reason: '客戶餐敘',
    status: '已駁回',
    submitTime: '2026-03-01 15:00',
    currentNode: '已結束'
  },
  // 離職
  {
    id: 'RS-2026-0003',
    code: 'RS-2026-0003',
    category: 'resignation',
    applicant: '周建國',
    department: '技術部',
    subType: '自願離職',
    startDate: '2026-04-01',
    endDate: '2026-04-01',
    duration: '—',
    reason: '個人職涯規劃',
    status: '審核中',
    submitTime: '2026-03-01 10:00',
    currentNode: '人事部審核'
  },
  {
    id: 'RS-2026-0002',
    code: 'RS-2026-0002',
    category: 'resignation',
    applicant: '吳雅琪',
    department: '銷售部',
    subType: '自願離職',
    startDate: '2026-03-15',
    endDate: '2026-03-15',
    duration: '—',
    reason: '家庭因素搬遷至外縣市',
    status: '已核准',
    submitTime: '2026-02-15 09:00',
    currentNode: '已完成'
  },
  {
    id: 'RS-2026-0001',
    code: 'RS-2026-0001',
    category: 'resignation',
    applicant: '劉志明',
    department: '財務部',
    subType: '自願離職',
    startDate: '2026-04-15',
    endDate: '2026-04-15',
    duration: '—',
    reason: '轉換跑道至其他產業',
    status: '待審核',
    submitTime: '2026-03-07 14:30',
    currentNode: '部門主管審批'
  }
];

const stats = [
  { label: '待審核', value: mockData.filter(r => r.status === '待審核').length, icon: Clock, color: 'text-warning' },
  { label: '審核中', value: mockData.filter(r => r.status === '審核中').length, icon: Timer, color: 'text-accent' },
  {
    label: '已核准',
    value: mockData.filter(r => r.status === '已核准').length,
    icon: CheckCircle2,
    color: 'text-success'
  },
  {
    label: '已駁回',
    value: mockData.filter(r => r.status === '已駁回').length,
    icon: XCircle,
    color: 'text-destructive'
  }
];

const categoryTabs: { label: string; value: 'all' | AppCategory }[] = [
  { value: 'all', label: '全部申請' },
  { value: 'leave', label: '請假' },
  { value: 'overtime', label: '加班' },
  { value: 'travel', label: '出差' },
  { value: 'expense', label: '報銷' },
  { value: 'resignation', label: '離職' }
];

export default function ApplicationList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [categoryTab, setCategoryTab] = useState<'all' | AppCategory>('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);

  const filtered = mockData.filter(r => {
    const matchSearch = r.applicant.includes(search) || r.code.includes(search) || r.department.includes(search);
    const matchCategory = categoryTab === 'all' || r.category === categoryTab;
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchSearch && matchCategory && matchStatus;
  });

  const handleRowClick = (r: AppRecord) => {
    const routeMap: Record<AppCategory, string> = {
      leave: `/attendance/leave/${r.id}`,
      overtime: `/attendance/application/${r.id}`,
      travel: `/attendance/application/${r.id}`,
      expense: `/attendance/application/${r.id}`,
      resignation: `/attendance/application/${r.id}`
    };
    navigate(routeMap[r.category]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ListTodo className="h-6 w-6 text-primary" />
            申請列表
          </h1>
          <p className="text-muted-foreground mt-1">管理所有類型的申請</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <FileText className="h-4 w-4 mr-2" />
          新增申請
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(s => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters & Table */}
      <Tabs value={categoryTab} onValueChange={v => setCategoryTab(v as typeof categoryTab)}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <TabsList>
            {categoryTabs.map(t => (
              <TabsTrigger key={t.value} value={t.value}>
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜尋編號/姓名/部門..."
                className="pl-9 w-56"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-28">
                <Filter className="h-4 w-4 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部狀態</SelectItem>
                {Object.keys(statusConfig).map(s => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {categoryTabs.map(tab => (
          <TabsContent key={tab.value} value={tab.value} className="mt-0">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>申請編號</TableHead>
                      <TableHead>類型</TableHead>
                      <TableHead>申請人</TableHead>
                      <TableHead>部門</TableHead>
                      <TableHead>細項</TableHead>
                      <TableHead>日期</TableHead>
                      <TableHead>時長/金額</TableHead>
                      <TableHead>當前節點</TableHead>
                      <TableHead>狀態</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                          暫無記錄
                        </TableCell>
                      </TableRow>
                    ) : (
                      filtered.map(r => {
                        const sc = statusConfig[r.status];
                        const cc = categoryConfig[r.category];
                        return (
                          <TableRow
                            key={r.id}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => handleRowClick(r)}
                          >
                            <TableCell className="font-mono text-sm">{r.code}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={cc.color}>
                                {cc.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">{r.applicant}</TableCell>
                            <TableCell>{r.department}</TableCell>
                            <TableCell>{r.subType}</TableCell>
                            <TableCell className="text-sm">
                              {r.startDate === r.endDate ? r.startDate : `${r.startDate} ~ ${r.endDate}`}
                            </TableCell>
                            <TableCell>{r.duration}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{r.currentNode}</TableCell>
                            <TableCell>
                              <Badge className={`${sc.color} border text-xs`}>{r.status}</Badge>
                            </TableCell>
                            <TableCell>
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <NewApplicationDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
