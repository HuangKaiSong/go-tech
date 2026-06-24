import {
  Ban,
  CheckCircle,
  Clock,
  DollarSign,
  Download,
  Eye,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Send,
  Users,
  Wallet
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export interface PayrollDistRecord {
  approvedBy: string;
  bankName: string;
  createdAt: string;
  createdBy: string;
  employeeCount: number;
  id: string;
  note: string;
  payDate: string;
  payMethod: '支票' | '現金' | '銀行轉帳';
  period: string;
  status: '已取消' | '已審核' | '已發放' | '待審核' | '發放中' | '草稿';
  totalDeduction: number;
  totalGross: number;
  totalNet: number;
  updatedAt: string;
}

export const mockDistRecords: PayrollDistRecord[] = [
  {
    id: 'PD-202603',
    period: '2026年03月',
    employeeCount: 65,
    totalGross: 3673500,
    totalDeduction: 487500,
    totalNet: 3186000,
    payDate: '2026-03-28',
    payMethod: '銀行轉帳',
    bankName: '匯豐銀行',
    status: '待審核',
    createdAt: '2026-03-10',
    updatedAt: '2026-03-10',
    createdBy: '王小美',
    approvedBy: '',
    note: '3月份正常薪資批次'
  },
  {
    id: 'PD-202603-B',
    period: '2026年03月(獎金)',
    employeeCount: 28,
    totalGross: 856000,
    totalDeduction: 128400,
    totalNet: 727600,
    payDate: '2026-03-28',
    payMethod: '銀行轉帳',
    bankName: '匯豐銀行',
    status: '待審核',
    createdAt: '2026-03-08',
    updatedAt: '2026-03-08',
    createdBy: '王小美',
    approvedBy: '',
    note: 'Q1業績獎金'
  },
  {
    id: 'PD-202602',
    period: '2026年02月',
    employeeCount: 63,
    totalGross: 3577000,
    totalDeduction: 472500,
    totalNet: 3104500,
    payDate: '2026-02-27',
    payMethod: '銀行轉帳',
    bankName: '匯豐銀行',
    status: '已發放',
    createdAt: '2026-02-01',
    updatedAt: '2026-02-27',
    createdBy: '王小美',
    approvedBy: '陳總監',
    note: ''
  },
  {
    id: 'PD-202601',
    period: '2026年01月',
    employeeCount: 62,
    totalGross: 3495000,
    totalDeduction: 465000,
    totalNet: 3030000,
    payDate: '2026-01-30',
    payMethod: '銀行轉帳',
    bankName: '匯豐銀行',
    status: '已發放',
    createdAt: '2026-01-02',
    updatedAt: '2026-01-30',
    createdBy: '王小美',
    approvedBy: '陳總監',
    note: ''
  },
  {
    id: 'PD-202512',
    period: '2025年12月',
    employeeCount: 60,
    totalGross: 3420000,
    totalDeduction: 450000,
    totalNet: 2970000,
    payDate: '2025-12-30',
    payMethod: '銀行轉帳',
    bankName: '匯豐銀行',
    status: '已發放',
    createdAt: '2025-12-01',
    updatedAt: '2025-12-30',
    createdBy: '王小美',
    approvedBy: '陳總監',
    note: ''
  },
  {
    id: 'PD-202511',
    period: '2025年11月',
    employeeCount: 58,
    totalGross: 3285000,
    totalDeduction: 435000,
    totalNet: 2850000,
    payDate: '2025-11-28',
    payMethod: '銀行轉帳',
    bankName: '匯豐銀行',
    status: '已發放',
    createdAt: '2025-11-01',
    updatedAt: '2025-11-28',
    createdBy: '李文華',
    approvedBy: '陳總監',
    note: ''
  },
  {
    id: 'PD-202510',
    period: '2025年10月',
    employeeCount: 56,
    totalGross: 3168000,
    totalDeduction: 420000,
    totalNet: 2748000,
    payDate: '2025-10-30',
    payMethod: '銀行轉帳',
    bankName: '匯豐銀行',
    status: '已發放',
    createdAt: '2025-10-01',
    updatedAt: '2025-10-30',
    createdBy: '李文華',
    approvedBy: '陳總監',
    note: ''
  }
];

export interface DistEmployee {
  bankAccount: string;
  bankName: string;
  department: string;
  employeeId: string;
  id: string;
  name: string;
  netSalary: number;
  payStatus: '已取消' | '已發放' | '待發放' | '發放失敗';
  payTime: string;
  position: string;
  transactionId: string;
}

export const mockDistEmployees: DistEmployee[] = [
  {
    id: 'E001',
    name: '張小明',
    employeeId: 'EMP-001',
    department: '技術部',
    position: '高級工程師',
    bankAccount: '****5678',
    bankName: '匯豐銀行',
    netSalary: 76324,
    payStatus: '已發放',
    payTime: '2026-02-27 10:00',
    transactionId: 'TXN-20260227-001'
  },
  {
    id: 'E002',
    name: '李文華',
    employeeId: 'EMP-002',
    department: '銷售部',
    position: '銷售經理',
    bankAccount: '****1234',
    bankName: '恒生銀行',
    netSalary: 84998,
    payStatus: '已發放',
    payTime: '2026-02-27 10:00',
    transactionId: 'TXN-20260227-002'
  },
  {
    id: 'E003',
    name: '王美玲',
    employeeId: 'EMP-003',
    department: '人事部',
    position: '人事專員',
    bankAccount: '****9012',
    bankName: '中銀香港',
    netSalary: 44494,
    payStatus: '已發放',
    payTime: '2026-02-27 10:01',
    transactionId: 'TXN-20260227-003'
  },
  {
    id: 'E004',
    name: '陳大偉',
    employeeId: 'EMP-004',
    department: '技術部',
    position: '工程師',
    bankAccount: '****3456',
    bankName: '匯豐銀行',
    netSalary: 55624,
    payStatus: '已發放',
    payTime: '2026-02-27 10:01',
    transactionId: 'TXN-20260227-004'
  },
  {
    id: 'E005',
    name: '林小芬',
    employeeId: 'EMP-005',
    department: '行政部',
    position: '行政助理',
    bankAccount: '****7890',
    bankName: '渣打銀行',
    netSalary: 38688,
    payStatus: '已發放',
    payTime: '2026-02-27 10:02',
    transactionId: 'TXN-20260227-005'
  },
  {
    id: 'E006',
    name: '黃志豪',
    employeeId: 'EMP-006',
    department: '技術部',
    position: '資深工程師',
    bankAccount: '****2345',
    bankName: '匯豐銀行',
    netSalary: 80835,
    payStatus: '已發放',
    payTime: '2026-02-27 10:02',
    transactionId: 'TXN-20260227-006'
  }
];

const statusColors: Record<string, string> = {
  草稿: 'bg-muted text-muted-foreground border-border',
  待審核: 'bg-warning/10 text-warning border-warning/20',
  已審核: 'bg-accent/10 text-accent-foreground border-accent/20',
  發放中: 'bg-primary/10 text-primary border-primary/20',
  已發放: 'bg-success/10 text-success border-success/20',
  已取消: 'bg-destructive/10 text-destructive border-destructive/20'
};

export default function PayrollDistribute() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [records, setRecords] = useState(mockDistRecords);
  const [cancelTarget, setCancelTarget] = useState<PayrollDistRecord | null>(null);

  const filtered = records.filter(r => {
    const matchSearch = r.period.includes(search) || r.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPaid = records.filter(r => r.status === '已發放').reduce((s, r) => s + r.totalNet, 0);
  const pendingCount = records.filter(
    r => r.status === '草稿' || r.status === '待審核' || r.status === '已審核'
  ).length;

  const stats = [
    { label: '累計已發放', value: `HK$ ${totalPaid.toLocaleString()}`, icon: Wallet, color: 'text-primary' },
    {
      label: '已發放批次',
      value: `${records.filter(r => r.status === '已發放').length} 筆`,
      icon: CheckCircle,
      color: 'text-success'
    },
    { label: '待處理', value: `${pendingCount} 筆`, icon: Clock, color: 'text-warning' },
    {
      label: '本月發薪人數',
      value: `${records[0]?.employeeCount || 0} 人`,
      icon: Users,
      color: 'text-accent-foreground'
    }
  ];

  const handleCancel = () => {
    if (!cancelTarget) return;
    setRecords(prev => prev.map(r => (r.id === cancelTarget.id ? { ...r, status: '已取消' as const } : r)));
    toast.success(`${cancelTarget.period} 發薪已取消`);
    setCancelTarget(null);
  };

  const handleSubmitReview = (record: PayrollDistRecord) => {
    setRecords(prev => prev.map(r => (r.id === record.id ? { ...r, status: '待審核' as const } : r)));
    toast.success(`${record.period} 已提交審核`);
  };

  const handleApprove = (record: PayrollDistRecord) => {
    setRecords(prev =>
      prev.map(r => (r.id === record.id ? { ...r, status: '已審核' as const, approvedBy: '當前用戶' } : r))
    );
    toast.success(`${record.period} 已審核通過`);
  };

  const handleDistribute = (record: PayrollDistRecord) => {
    setRecords(prev =>
      prev.map(r =>
        r.id === record.id ? { ...r, status: '已發放' as const, updatedAt: new Date().toISOString().split('T')[0] } : r
      )
    );
    toast.success(`${record.period} 薪資已發放`);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">發薪管理</h1>
          <p className="text-muted-foreground mt-1">管理薪資發放流程、審核與記錄</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/payroll/distribute/approval')} className="gap-2">
            <CheckCircle className="h-4 w-4" /> 發薪審核
            {records.filter(r => r.status === '待審核').length > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 min-w-5 px-1 text-xs">
                {records.filter(r => r.status === '待審核').length}
              </Badge>
            )}
          </Button>
          <Button onClick={() => navigate('/payroll/distribute/new')} className="gap-2">
            <Plus className="h-4 w-4" /> 新增發薪批次
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map(s => (
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

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜尋期間或編號..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="狀態篩選" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部狀態</SelectItem>
                <SelectItem value="草稿">草稿</SelectItem>
                <SelectItem value="待審核">待審核</SelectItem>
                <SelectItem value="已審核">已審核</SelectItem>
                <SelectItem value="發放中">發放中</SelectItem>
                <SelectItem value="已發放">已發放</SelectItem>
                <SelectItem value="已取消">已取消</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>編號</TableHead>
                <TableHead>薪資期間</TableHead>
                <TableHead>發薪人數</TableHead>
                <TableHead>發薪方式</TableHead>
                <TableHead className="text-right">應發總額</TableHead>
                <TableHead className="text-right">扣款總額</TableHead>
                <TableHead className="text-right">實發總額</TableHead>
                <TableHead>發薪日期</TableHead>
                <TableHead>狀態</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(r => (
                <TableRow
                  key={r.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/payroll/distribute/${r.id}`)}
                >
                  <TableCell className="font-medium text-primary">{r.id}</TableCell>
                  <TableCell className="font-medium">{r.period}</TableCell>
                  <TableCell>{r.employeeCount} 人</TableCell>
                  <TableCell>{r.payMethod}</TableCell>
                  <TableCell className="text-right">{r.totalGross.toLocaleString()}</TableCell>
                  <TableCell className="text-right text-destructive">{r.totalDeduction.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-semibold">{r.totalNet.toLocaleString()}</TableCell>
                  <TableCell>{r.payDate}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusColors[r.status]}>
                      {r.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/payroll/distribute/${r.id}`)}>
                          <Eye className="mr-2 h-4 w-4" /> 查看詳情
                        </DropdownMenuItem>
                        {r.status === '草稿' && (
                          <>
                            <DropdownMenuItem onClick={() => navigate(`/payroll/distribute/${r.id}/edit`)}>
                              <Pencil className="mr-2 h-4 w-4" /> 編輯
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleSubmitReview(r)}>
                              <Send className="mr-2 h-4 w-4" /> 提交審核
                            </DropdownMenuItem>
                          </>
                        )}
                        {r.status === '待審核' && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleApprove(r)}>
                              <CheckCircle className="mr-2 h-4 w-4" /> 審核通過
                            </DropdownMenuItem>
                          </>
                        )}
                        {r.status === '已審核' && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleDistribute(r)}>
                              <DollarSign className="mr-2 h-4 w-4" /> 執行發放
                            </DropdownMenuItem>
                          </>
                        )}
                        {(r.status === '草稿' || r.status === '待審核') && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => setCancelTarget(r)}>
                              <Ban className="mr-2 h-4 w-4" /> 取消
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <Download className="mr-2 h-4 w-4" /> 匯出報表
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-muted-foreground py-12">
                    沒有符合條件的記錄
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Cancel Dialog */}
      <AlertDialog open={Boolean(cancelTarget)} onOpenChange={() => setCancelTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>取消發薪</AlertDialogTitle>
            <AlertDialogDescription>
              確定要取消 {cancelTarget?.period} 的發薪批次嗎？此操作無法恢復。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>返回</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              取消發薪
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
