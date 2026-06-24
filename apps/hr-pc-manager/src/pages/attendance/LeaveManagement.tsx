import {
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  Filter,
  Paperclip,
  Plus,
  RotateCcw,
  Search,
  Send,
  Timer,
  XCircle
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

type LeaveStatus = '審核中' | '已撤回' | '已核准' | '已駁回' | '待審核' | '草稿';

interface LeaveRecord {
  applicant: string;
  code: string;
  currentNode: string;
  days: number;
  department: string;
  endDate: string;
  id: string;
  leaveType: string;
  reason: string;
  startDate: string;
  status: LeaveStatus;
  submitTime: string;
}

const leaveTypes = [
  { value: 'annual', label: '年假' },
  { value: 'sick', label: '病假' },
  { value: 'personal', label: '事假' },
  { value: 'marriage', label: '婚假' },
  { value: 'maternity', label: '產假' },
  { value: 'paternity', label: '陪產假' },
  { value: 'bereavement', label: '喪假' },
  { value: 'official', label: '公假' },
  { value: 'compensatory', label: '補休' }
];

const statusConfig: Record<LeaveStatus, { color: string; icon: React.ElementType }> = {
  草稿: { color: 'bg-muted text-muted-foreground', icon: FileText },
  待審核: { color: 'bg-warning/10 text-warning border-warning/20', icon: Clock },
  審核中: { color: 'bg-accent/10 text-accent border-accent/20', icon: Clock },
  已核准: { color: 'bg-success/10 text-success border-success/20', icon: CheckCircle2 },
  已駁回: { color: 'bg-destructive/10 text-destructive border-destructive/20', icon: XCircle },
  已撤回: { color: 'bg-muted text-muted-foreground', icon: RotateCcw }
};

const mockLeaves: LeaveRecord[] = [
  {
    id: 'LV-2026-0045',
    code: 'LV-2026-0045',
    applicant: '張小明',
    department: '技術部',
    leaveType: '年假',
    startDate: '2026-03-10',
    endDate: '2026-03-12',
    days: 3,
    reason: '家庭旅遊',
    status: '待審核',
    submitTime: '2026-03-05 09:30',
    currentNode: '部門主管審批'
  },
  {
    id: 'LV-2026-0044',
    code: 'LV-2026-0044',
    applicant: '李文華',
    department: '銷售部',
    leaveType: '事假',
    startDate: '2026-03-08',
    endDate: '2026-03-09',
    days: 2,
    reason: '個人事務處理',
    status: '審核中',
    submitTime: '2026-03-04 14:20',
    currentNode: '人事部審核'
  },
  {
    id: 'LV-2026-0043',
    code: 'LV-2026-0043',
    applicant: '王美玲',
    department: '人事部',
    leaveType: '病假',
    startDate: '2026-03-06',
    endDate: '2026-03-06',
    days: 1,
    reason: '身體不適就醫',
    status: '已核准',
    submitTime: '2026-03-05 08:00',
    currentNode: '已完成'
  },
  {
    id: 'LV-2026-0042',
    code: 'LV-2026-0042',
    applicant: '陳大偉',
    department: '市場部',
    leaveType: '年假',
    startDate: '2026-03-15',
    endDate: '2026-03-19',
    days: 5,
    reason: '出國旅遊',
    status: '待審核',
    submitTime: '2026-03-03 10:15',
    currentNode: '部門主管審批'
  },
  {
    id: 'LV-2026-0041',
    code: 'LV-2026-0041',
    applicant: '林佳蓉',
    department: '財務部',
    leaveType: '補休',
    startDate: '2026-03-07',
    endDate: '2026-03-07',
    days: 1,
    reason: '使用加班補休',
    status: '已核准',
    submitTime: '2026-03-02 16:30',
    currentNode: '已完成'
  },
  {
    id: 'LV-2026-0040',
    code: 'LV-2026-0040',
    applicant: '黃志偉',
    department: '技術部',
    leaveType: '事假',
    startDate: '2026-03-03',
    endDate: '2026-03-03',
    days: 1,
    reason: '搬家',
    status: '已駁回',
    submitTime: '2026-02-28 11:00',
    currentNode: '已結束'
  },
  {
    id: 'LV-2026-0039',
    code: 'LV-2026-0039',
    applicant: '趙芷琳',
    department: '設計部',
    leaveType: '婚假',
    startDate: '2026-03-20',
    endDate: '2026-03-27',
    days: 8,
    reason: '結婚及蜜月',
    status: '已核准',
    submitTime: '2026-02-25 09:00',
    currentNode: '已完成'
  },
  {
    id: 'LV-2026-0038',
    code: 'LV-2026-0038',
    applicant: '周大軍',
    department: '技術部',
    leaveType: '病假',
    startDate: '2026-02-28',
    endDate: '2026-02-28',
    days: 1,
    reason: '感冒發燒',
    status: '已撤回',
    submitTime: '2026-02-27 08:30',
    currentNode: '已撤回'
  }
];

const stats = [
  { label: '待審核', value: 2, icon: Clock, color: 'text-warning' },
  { label: '審核中', value: 1, icon: Timer, color: 'text-accent' },
  { label: '已核准', value: 3, icon: CheckCircle2, color: 'text-success' },
  { label: '已駁回', value: 1, icon: XCircle, color: 'text-destructive' }
];

export default function LeaveManagement() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [applyOpen, setApplyOpen] = useState(false);

  // Form state
  const [formType, setFormType] = useState('');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formStartHalf, setFormStartHalf] = useState('full');
  const [formEndHalf, setFormEndHalf] = useState('full');
  const [formReason, setFormReason] = useState('');

  const filtered = mockLeaves.filter(r => {
    const matchSearch = r.applicant.includes(search) || r.code.includes(search) || r.department.includes(search);
    const matchType = typeFilter === 'all' || r.leaveType === typeFilter;
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchSearch && matchType && matchStatus;
  });

  const calcDays = () => {
    if (!formStartDate || !formEndDate) return 0;
    const start = new Date(formStartDate);
    const end = new Date(formEndDate);
    let days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    if (formStartHalf === 'pm') days -= 0.5;
    if (formEndHalf === 'am') days -= 0.5;
    return Math.max(0, days);
  };

  const resetForm = () => {
    setFormType('');
    setFormStartDate('');
    setFormEndDate('');
    setFormStartHalf('full');
    setFormEndHalf('full');
    setFormReason('');
  };

  const handleSubmit = () => {
    if (!formType || !formStartDate || !formEndDate || !formReason) {
      toast.error('請填寫完整的請假資訊');
      return;
    }
    toast.success('請假申請已提交，等待審核');
    setApplyOpen(false);
    resetForm();
  };

  const handleSaveDraft = () => {
    toast.success('已儲存為草稿');
    setApplyOpen(false);
    resetForm();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <CalendarDays className="h-6 w-6 text-primary" />
            請假管理
          </h1>
          <p className="text-muted-foreground mt-1">管理員工請假申請與審批流程</p>
        </div>
        <Dialog
          open={applyOpen}
          onOpenChange={open => {
            setApplyOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              申請請假
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-primary" />
                申請請假
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              {/* Leave Type */}
              <div className="space-y-2">
                <Label>
                  假別 <span className="text-destructive">*</span>
                </Label>
                <Select value={formType} onValueChange={setFormType}>
                  <SelectTrigger>
                    <SelectValue placeholder="請選擇假別" />
                  </SelectTrigger>
                  <SelectContent>
                    {leaveTypes.map(t => (
                      <SelectItem key={t.value} value={t.label}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>
                    開始日期 <span className="text-destructive">*</span>
                  </Label>
                  <Input type="date" value={formStartDate} onChange={e => setFormStartDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>開始時段</Label>
                  <Select value={formStartHalf} onValueChange={setFormStartHalf}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">全天</SelectItem>
                      <SelectItem value="am">上午</SelectItem>
                      <SelectItem value="pm">下午</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>
                    結束日期 <span className="text-destructive">*</span>
                  </Label>
                  <Input type="date" value={formEndDate} onChange={e => setFormEndDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>結束時段</Label>
                  <Select value={formEndHalf} onValueChange={setFormEndHalf}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">全天</SelectItem>
                      <SelectItem value="am">上午</SelectItem>
                      <SelectItem value="pm">下午</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Duration Display */}
              {formStartDate && formEndDate && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
                  <CalendarRange className="h-4 w-4 text-primary" />
                  <span className="text-sm text-foreground">
                    請假時長：<span className="font-semibold text-primary">{calcDays()} 天</span>
                  </span>
                </div>
              )}

              {/* Leave Balance Info */}
              {formType && (
                <div className="p-3 rounded-lg bg-muted border border-border">
                  <p className="text-xs text-muted-foreground mb-1">假期餘額</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{formType}</span>
                    <span className="text-sm">
                      剩餘{' '}
                      <span className="font-bold text-primary">
                        {({ 年假: '10', 病假: '28', 補休: '2.5' } as Record<string, string>)[formType] ?? '—'}
                      </span>{' '}
                      天
                    </span>
                  </div>
                </div>
              )}

              {/* Reason */}
              <div className="space-y-2">
                <Label>
                  請假事由 <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  placeholder="請輸入請假事由..."
                  value={formReason}
                  onChange={e => setFormReason(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Attachment */}
              <div className="space-y-2">
                <Label>
                  附件{formType === '病假' && <span className="text-destructive ml-1">（病假需附診斷證明）</span>}
                </Label>
                <div className="border-2 border-dashed border-border rounded-lg p-4 text-center text-muted-foreground text-sm cursor-pointer hover:border-primary/50 transition-colors">
                  <Paperclip className="h-5 w-5 mx-auto mb-1" />
                  點擊或拖拽上傳附件
                </div>
              </div>

              {/* Approval Flow Preview */}
              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs">審批流程預覽</Label>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline" className="text-xs">
                    提交申請
                  </Badge>
                  <ChevronRight className="h-3 w-3" />
                  <Badge variant="outline" className="text-xs">
                    部門主管
                  </Badge>
                  <ChevronRight className="h-3 w-3" />
                  <Badge variant="outline" className="text-xs">
                    人事部
                  </Badge>
                  <ChevronRight className="h-3 w-3" />
                  <Badge variant="outline" className="text-xs bg-success/10 text-success">
                    完成
                  </Badge>
                </div>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setApplyOpen(false);
                  resetForm();
                }}
              >
                取消
              </Button>
              <Button variant="secondary" onClick={handleSaveDraft}>
                <FileText className="h-4 w-4 mr-1" />
                儲存草稿
              </Button>
              <Button onClick={handleSubmit} disabled={!formType || !formStartDate || !formEndDate || !formReason}>
                <Send className="h-4 w-4 mr-1" />
                提交申請
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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

      {/* Table with Tabs */}
      <Tabs defaultValue="all">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <TabsList>
            <TabsTrigger value="all">全部記錄</TabsTrigger>
            <TabsTrigger value="pending">待處理</TabsTrigger>
            <TabsTrigger value="mine">我的請假</TabsTrigger>
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
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-28">
                <Filter className="h-4 w-4 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部假別</SelectItem>
                {leaveTypes.map(t => (
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

        {['all', 'pending', 'mine'].map(tab => (
          <TabsContent key={tab} value={tab} className="mt-0">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>申請編號</TableHead>
                      <TableHead>申請人</TableHead>
                      <TableHead>部門</TableHead>
                      <TableHead>假別</TableHead>
                      <TableHead>起始日期</TableHead>
                      <TableHead>結束日期</TableHead>
                      <TableHead>天數</TableHead>
                      <TableHead>當前節點</TableHead>
                      <TableHead>狀態</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(tab === 'pending'
                      ? filtered.filter(r => r.status === '待審核' || r.status === '審核中')
                      : filtered
                    ).map(r => {
                      const sc = statusConfig[r.status];
                      return (
                        <TableRow
                          key={r.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => navigate(`/attendance/leave/${r.id}`)}
                        >
                          <TableCell className="font-mono text-sm">{r.code}</TableCell>
                          <TableCell className="font-medium">{r.applicant}</TableCell>
                          <TableCell>{r.department}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-normal">
                              {r.leaveType}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">{r.startDate}</TableCell>
                          <TableCell className="text-sm">{r.endDate}</TableCell>
                          <TableCell className="text-sm font-medium">{r.days}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{r.currentNode}</TableCell>
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
                        <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                          暫無符合條件的請假記錄
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
