import {
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  Filter,
  RotateCcw,
  Search,
  Settings2,
  XCircle
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ApprovalRulesTab from '@/components/attendance/ApprovalRulesTab';
import PendingApprovalTab from '@/components/attendance/PendingApprovalTab';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type ApprovalStatus = '待審' | '撤回' | '草稿' | '通過' | '駁回';

interface ApprovalRecord {
  applicant: string;
  attachments: number;
  code: string;
  currentNode: string;
  department: string;
  id: string;
  status: ApprovalStatus;
  submitTime: string;
  subType?: string;
  summary: string;
  type: string;
}

const statusConfig: Record<ApprovalStatus, { color: string; icon: React.ElementType }> = {
  草稿: { color: 'bg-muted text-muted-foreground', icon: FileText },
  待審: { color: 'bg-warning/10 text-warning border-warning/20', icon: Clock },
  通過: { color: 'bg-success/10 text-success border-success/20', icon: CheckCircle2 },
  駁回: { color: 'bg-destructive/10 text-destructive border-destructive/20', icon: XCircle },
  撤回: { color: 'bg-muted text-muted-foreground', icon: RotateCcw }
};

const approvalTypes = [
  { value: 'leave', label: '請假申請' },
  { value: 'expense', label: '報銷申請' },
  { value: 'overtime', label: '加班申請' },
  { value: 'travel', label: '出差申請' }
];

const mockRecords: ApprovalRecord[] = [
  {
    id: '1',
    code: 'AP-2026-0301',
    applicant: '張小明',
    department: '技術部',
    type: '請假申請',
    subType: '年假',
    submitTime: '2026-03-01 09:30',
    status: '待審',
    summary: '年假 3 天 (03/05-03/07)',
    currentNode: '部門主管審批',
    attachments: 0
  },
  {
    id: '2',
    code: 'AP-2026-0298',
    applicant: '李文華',
    department: '銷售部',
    type: '報銷申請',
    subType: '差旅費',
    submitTime: '2026-02-28 14:20',
    status: '待審',
    summary: '出差報銷 NT$12,500',
    currentNode: '財務審核',
    attachments: 3
  },
  {
    id: '3',
    code: 'AP-2026-0295',
    applicant: '王美玲',
    department: '人事部',
    type: '加班申請',
    submitTime: '2026-02-27 17:00',
    status: '通過',
    summary: '加班 4 小時 (02/28)',
    currentNode: '已完成',
    attachments: 0
  },
  {
    id: '4',
    code: 'AP-2026-0290',
    applicant: '陳大偉',
    department: '市場部',
    type: '出差申請',
    submitTime: '2026-02-26 10:15',
    status: '通過',
    summary: '上海出差 3 天 (03/10-03/12)',
    currentNode: '已完成',
    attachments: 2
  },
  {
    id: '5',
    code: 'AP-2026-0288',
    applicant: '林佳蓉',
    department: '財務部',
    type: '請假申請',
    subType: '病假',
    submitTime: '2026-02-25 08:45',
    status: '駁回',
    summary: '病假 1 天 (02/25)',
    currentNode: '已結束',
    attachments: 1
  },
  {
    id: '6',
    code: 'AP-2026-0285',
    applicant: '黃志偉',
    department: '技術部',
    type: '報銷申請',
    subType: '交通費',
    submitTime: '2026-02-24 11:30',
    status: '撤回',
    summary: '交通費報銷 NT$2,300',
    currentNode: '已撤回',
    attachments: 1
  }
];

const stats = [
  { label: '待我審批', value: 5, icon: Clock, color: 'text-warning' },
  { label: '已通過', value: 38, icon: CheckCircle2, color: 'text-success' },
  { label: '已駁回', value: 3, icon: XCircle, color: 'text-destructive' }
];

export default function ApprovalManagement() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = mockRecords.filter(r => {
    const matchSearch = r.applicant.includes(search) || r.code.includes(search) || r.summary.includes(search);
    const matchType = typeFilter === 'all' || r.type === typeFilter;
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchSearch && matchType && matchStatus && r.status !== '撤回';
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">審批管理</h1>
        <p className="text-muted-foreground mt-1">管理各類審批申請與審批流程</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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

      <Tabs defaultValue="all">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <TabsList>
            <TabsTrigger value="all">全部記錄</TabsTrigger>
            <TabsTrigger value="pending" className="gap-1">
              <Clock className="h-3.5 w-3.5" />
              待我審批
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                5
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="rules" className="gap-1">
              <Settings2 className="h-3.5 w-3.5" />
              審批規則
            </TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜尋編號/申請人..."
                className="pl-9 w-56"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-32">
                <Filter className="h-4 w-4 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部類型</SelectItem>
                {approvalTypes.map(t => (
                  <SelectItem key={t.value} value={t.label}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-28">
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

        <TabsContent value="all" className="mt-0">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>申請編號</TableHead>
                    <TableHead>申請人</TableHead>
                    <TableHead>部門</TableHead>
                    <TableHead>申請類型</TableHead>
                    <TableHead>摘要</TableHead>
                    <TableHead>提交時間</TableHead>
                    <TableHead>當前節點</TableHead>
                    <TableHead>狀態</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(r => {
                    const sc = statusConfig[r.status];
                    return (
                      <TableRow
                        key={r.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/attendance/approval/${r.code}`)}
                      >
                        <TableCell className="font-mono text-sm">{r.code}</TableCell>
                        <TableCell className="font-medium">{r.applicant}</TableCell>
                        <TableCell>{r.department}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-normal">
                            {r.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-48 truncate">{r.summary}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{r.submitTime}</TableCell>
                        <TableCell className="text-sm">{r.currentNode}</TableCell>
                        <TableCell>
                          <Badge className={`${sc.color} border`}>{r.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        暫無符合條件的審批記錄
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending" className="mt-0">
          <PendingApprovalTab />
        </TabsContent>

        <TabsContent value="rules" className="mt-0">
          <ApprovalRulesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
