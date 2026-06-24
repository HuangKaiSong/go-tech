import {
  AlertCircle,
  Bell,
  Building2,
  CheckCircle,
  Clock,
  Eye,
  Info,
  Megaphone,
  Plus,
  Search,
  Send,
  Users
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';

interface Notification {
  content: string;
  createdAt: string;
  createdBy: string;
  id: string;
  priority: string;
  readCount: number;
  sentAt: string | null;
  status: string;
  targetNames: string[];
  targetType: string;
  title: string;
  totalCount: number;
  type: string;
}

const initialData: Notification[] = [
  {
    id: 'NTF001',
    title: '2026 Q1 績效考核通知',
    content: '請各位同仁於 3/25 前完成自評填寫...',
    type: '考核通知',
    priority: '高',
    targetType: '全公司',
    targetNames: ['全公司'],
    status: '已發送',
    createdBy: '王美玲',
    createdAt: '2026-03-01',
    sentAt: '2026-03-01',
    readCount: 38,
    totalCount: 45
  },
  {
    id: 'NTF002',
    title: '技術部週五團建活動通知',
    content: '本週五下午 2 點在會議室 A 舉辦團建...',
    type: '活動通知',
    priority: '一般',
    targetType: '部門',
    targetNames: ['技術部'],
    status: '已發送',
    createdBy: '黃志偉',
    createdAt: '2026-03-05',
    sentAt: '2026-03-05',
    readCount: 10,
    totalCount: 12
  },
  {
    id: 'NTF003',
    title: '薪資結構調整公告',
    content: '經管理層決議，自 4 月起調整薪資結構...',
    type: '公告',
    priority: '高',
    targetType: '部門',
    targetNames: ['財務部', '人事部'],
    status: '已發送',
    createdBy: '林佳蓉',
    createdAt: '2026-03-08',
    sentAt: '2026-03-08',
    readCount: 5,
    totalCount: 8
  },
  {
    id: 'NTF004',
    title: '新員工入職培訓安排',
    content: '3 月新入職員工請於 3/15 參加培訓...',
    type: '培訓通知',
    priority: '一般',
    targetType: '指定人員',
    targetNames: ['張小明', '黃志偉'],
    status: '已發送',
    createdBy: '王美玲',
    createdAt: '2026-03-10',
    sentAt: '2026-03-10',
    readCount: 1,
    totalCount: 2
  },
  {
    id: 'NTF005',
    title: '系統維護通知',
    content: '本週日凌晨 2-6 點進行系統維護升級...',
    type: '系統通知',
    priority: '一般',
    targetType: '全公司',
    targetNames: ['全公司'],
    status: '草稿',
    createdBy: '王美玲',
    createdAt: '2026-03-10',
    sentAt: null,
    readCount: 0,
    totalCount: 45
  },
  {
    id: 'NTF006',
    title: '銷售部月度業績達標獎勵',
    content: '恭喜銷售部本月業績超額完成目標...',
    type: '獎勵通知',
    priority: '一般',
    targetType: '部門',
    targetNames: ['銷售部'],
    status: '草稿',
    createdBy: '李文華',
    createdAt: '2026-03-09',
    sentAt: null,
    readCount: 0,
    totalCount: 8
  }
];

const statusColors: Record<string, string> = {
  已發送: 'bg-success/10 text-success border-success/20',
  草稿: 'bg-muted text-muted-foreground'
};

const priorityColors: Record<string, string> = {
  高: 'bg-destructive/10 text-destructive border-destructive/20',
  一般: 'bg-muted text-muted-foreground',
  低: 'bg-muted text-muted-foreground'
};

const typeIcons: Record<string, React.ElementType> = {
  考核通知: AlertCircle,
  活動通知: Megaphone,
  公告: Info,
  培訓通知: Info,
  系統通知: Bell,
  獎勵通知: CheckCircle
};

const employeeList = ['張小明', '李文華', '王美玲', '陳大偉', '林佳蓉', '黃志偉'];
const departments = ['技術部', '銷售部', '人事部', '市場部', '財務部'];

export default function Notifications() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState<Notification | null>(null);

  const data = initialData.filter(row => {
    const matchSearch =
      !search || [row.title, row.content, row.createdBy].some(v => v.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFilter === 'all' || row.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const sent = initialData.filter(d => d.status === '已發送').length;
  const drafts = initialData.filter(d => d.status === '草稿').length;
  const totalRead = initialData.filter(d => d.status === '已發送').reduce((s, d) => s + d.readCount, 0);
  const totalTarget = initialData.filter(d => d.status === '已發送').reduce((s, d) => s + d.totalCount, 0);

  const summaryCards = [
    { label: '通知總數', value: initialData.length, icon: Bell, color: 'text-primary' },
    { label: '已發送', value: sent, icon: Send, color: 'text-success' },
    { label: '草稿', value: drafts, icon: Clock, color: 'text-muted-foreground' },
    {
      label: '已讀率',
      value: totalTarget > 0 ? `${Math.round((totalRead / totalTarget) * 100)}%` : '-',
      icon: Eye,
      color: 'text-primary'
    }
  ];

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary" />
            消息通知
          </h1>
          <p className="page-description">管理系統通知、公告與消息推送</p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          建立通知
        </Button>
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
                placeholder="搜尋通知標題、內容..."
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
                <SelectItem value="已發送">已發送</SelectItem>
                <SelectItem value="草稿">草稿</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>標題</TableHead>
                <TableHead>類型</TableHead>
                <TableHead>優先級</TableHead>
                <TableHead>通知對象</TableHead>
                <TableHead className="text-center">已讀/總數</TableHead>
                <TableHead>建立者</TableHead>
                <TableHead>發送時間</TableHead>
                <TableHead>狀態</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-10 text-muted-foreground">
                    暫無通知記錄
                  </TableCell>
                </TableRow>
              ) : (
                data.map(row => (
                  <TableRow key={row.id} className="cursor-pointer" onClick={() => setDetailOpen(row)}>
                    <TableCell className="font-medium max-w-[200px] truncate">{row.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {row.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={priorityColors[row.priority] || ''}>
                        {row.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {row.targetType === '部門' ? (
                          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                        ) : (
                          <Users className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                        <span className="text-sm">{row.targetNames.join('、')}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {row.status === '已發送' ? (
                        <span className="text-sm">
                          {row.readCount}/{row.totalCount}
                        </span>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>{row.createdBy}</TableCell>
                    <TableCell>{row.sentAt || '-'}</TableCell>
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
                            setDetailOpen(row);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {row.status === '草稿' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-success"
                            onClick={e => {
                              e.stopPropagation();
                              toast({ title: '通知已發送', description: `「${row.title}」已成功發送` });
                            }}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <CreateNotificationDialog open={createOpen} onOpenChange={setCreateOpen} />
      <NotificationDetailDialog notification={detailOpen} onClose={() => setDetailOpen(null)} />
    </div>
  );
}

// ─── Employee Selector with Search ──────────────────────────

function EmployeeSelector({
  employees,
  selectedEmployees,
  toggleEmployee
}: {
  employees: string[];
  selectedEmployees: string[];
  toggleEmployee: (emp: string) => void;
}) {
  const [empSearch, setEmpSearch] = useState('');
  const filtered = employees.filter(emp => !empSearch || emp.toLowerCase().includes(empSearch.toLowerCase()));

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <p className="text-sm text-muted-foreground flex items-center gap-1.5">
        <Users className="h-4 w-4" /> 選擇要通知的員工（可多選）
      </p>
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="搜尋員工姓名..."
          className="pl-9 h-9"
          value={empSearch}
          onChange={e => setEmpSearch(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[200px] overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground col-span-full text-center py-3">無匹配結果</p>
        ) : (
          filtered.map(emp => (
            <label
              key={emp}
              className="flex items-center gap-2 rounded-md border p-3 cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <Checkbox checked={selectedEmployees.includes(emp)} onCheckedChange={() => toggleEmployee(emp)} />
              <span className="text-sm">{emp}</span>
            </label>
          ))
        )}
      </div>
      {selectedEmployees.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          <span className="text-xs text-muted-foreground">已選：</span>
          {selectedEmployees.map(e => (
            <Badge key={e} variant="secondary" className="text-xs">
              {e}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Create Dialog ───────────────────────────────────────────

function CreateNotificationDialog({ onOpenChange, open }: { onOpenChange: (v: boolean) => void; open: boolean }) {
  const [form, setForm] = useState({
    title: '',
    content: '',
    type: '公告',
    priority: '一般',
    targetType: '全公司'
  });
  const [selectedDepts, setSelectedDepts] = useState<string[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);

  const updateForm = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const toggleDept = (dept: string) => {
    setSelectedDepts(prev => (prev.includes(dept) ? prev.filter(d => d !== dept) : [...prev, dept]));
  };

  const toggleEmployee = (emp: string) => {
    setSelectedEmployees(prev => (prev.includes(emp) ? prev.filter(e => e !== emp) : [...prev, emp]));
  };

  const handleSubmit = (send: boolean) => {
    if (!form.title || !form.content) {
      toast({ title: '請填寫標題和內容', variant: 'destructive' });
      return;
    }
    if (form.targetType === '部門' && selectedDepts.length === 0) {
      toast({ title: '請選擇至少一個部門', variant: 'destructive' });
      return;
    }
    if (form.targetType === '指定人員' && selectedEmployees.length === 0) {
      toast({ title: '請選擇至少一位員工', variant: 'destructive' });
      return;
    }
    toast({
      title: send ? '通知已發送' : '通知已儲存為草稿',
      description: `「${form.title}」已成功${send ? '發送' : '建立'}`
    });
    onOpenChange(false);
    setForm({ title: '', content: '', type: '公告', priority: '一般', targetType: '全公司' });
    setSelectedDepts([]);
    setSelectedEmployees([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>建立通知</DialogTitle>
          <DialogDescription>填寫通知內容並選擇通知對象</DialogDescription>
        </DialogHeader>
        <div className="grid gap-5 py-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label>通知標題 *</Label>
              <Input
                placeholder="輸入通知標題"
                value={form.title}
                onChange={e => updateForm('title', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>通知類型</Label>
              <Select value={form.type} onValueChange={v => updateForm('type', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="公告">公告</SelectItem>
                  <SelectItem value="考核通知">考核通知</SelectItem>
                  <SelectItem value="培訓通知">培訓通知</SelectItem>
                  <SelectItem value="活動通知">活動通知</SelectItem>
                  <SelectItem value="系統通知">系統通知</SelectItem>
                  <SelectItem value="獎勵通知">獎勵通知</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>優先級</Label>
              <Select value={form.priority} onValueChange={v => updateForm('priority', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="高">高</SelectItem>
                  <SelectItem value="一般">一般</SelectItem>
                  <SelectItem value="低">低</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>通知內容 *</Label>
            <Textarea
              rows={5}
              placeholder="輸入通知內容..."
              value={form.content}
              onChange={e => updateForm('content', e.target.value)}
            />
          </div>

          <Separator />

          {/* Target Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">通知對象</Label>
            <Select
              value={form.targetType}
              onValueChange={v => {
                updateForm('targetType', v);
                setSelectedDepts([]);
                setSelectedEmployees([]);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="全公司">全公司</SelectItem>
                <SelectItem value="部門">指定部門</SelectItem>
                <SelectItem value="指定人員">指定人員</SelectItem>
              </SelectContent>
            </Select>

            {form.targetType === '全公司' && (
              <div className="rounded-lg border p-4 bg-muted/30">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  通知將發送給全公司所有員工
                </div>
              </div>
            )}

            {form.targetType === '部門' && (
              <div className="rounded-lg border p-4 space-y-3">
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <Building2 className="h-4 w-4" /> 選擇要通知的部門（可多選）
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {departments.map(dept => (
                    <label
                      key={dept}
                      className="flex items-center gap-2 rounded-md border p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      <Checkbox checked={selectedDepts.includes(dept)} onCheckedChange={() => toggleDept(dept)} />
                      <span className="text-sm">{dept}</span>
                    </label>
                  ))}
                </div>
                {selectedDepts.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="text-xs text-muted-foreground">已選：</span>
                    {selectedDepts.map(d => (
                      <Badge key={d} variant="secondary" className="text-xs">
                        {d}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}

            {form.targetType === '指定人員' && (
              <EmployeeSelector
                employees={employeeList}
                selectedEmployees={selectedEmployees}
                toggleEmployee={toggleEmployee}
              />
            )}
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button variant="outline" onClick={() => handleSubmit(false)}>
            儲存草稿
          </Button>
          <Button onClick={() => handleSubmit(true)}>
            <Send className="h-4 w-4 mr-1" />
            立即發送
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Detail Dialog ───────────────────────────────────────────

function NotificationDetailDialog({
  notification,
  onClose
}: {
  notification: Notification | null;
  onClose: () => void;
}) {
  if (!notification) return null;
  const Icon = typeIcons[notification.type] || Bell;

  return (
    <Dialog open={Boolean(notification)} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>{notification.title}</DialogTitle>
              <DialogDescription>
                {notification.type} · {notification.createdBy} · {notification.createdAt}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className={statusColors[notification.status] || ''}>
              {notification.status}
            </Badge>
            <Badge variant="secondary" className={priorityColors[notification.priority] || ''}>
              優先級：{notification.priority}
            </Badge>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-1">通知內容</p>
            <p className="text-sm leading-relaxed bg-muted/30 rounded-lg p-3">{notification.content}</p>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-0.5">通知對象</p>
              <div className="flex items-center gap-1.5">
                {notification.targetType === '部門' ? (
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Users className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-sm font-medium">{notification.targetNames.join('、')}</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-0.5">發送時間</p>
              <p className="text-sm font-medium">{notification.sentAt || '未發送'}</p>
            </div>
            {notification.status === '已發送' && (
              <>
                <div>
                  <p className="text-sm text-muted-foreground mb-0.5">已讀人數</p>
                  <p className="text-sm font-medium">
                    {notification.readCount} / {notification.totalCount}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-0.5">已讀率</p>
                  <p className="text-sm font-medium">
                    {Math.round((notification.readCount / notification.totalCount) * 100)}%
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            關閉
          </Button>
          {notification.status === '草稿' && (
            <Button
              onClick={() => {
                toast({ title: '通知已發送' });
                onClose();
              }}
            >
              <Send className="h-4 w-4 mr-1" />
              立即發送
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
