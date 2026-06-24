import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileText,
  Plus,
  Search,
  UserPlus
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';

/* ===== 模擬資料 ===== */
interface OnboardingRecord {
  department: string;
  email: string;
  hrOwner: string;
  id: string;
  name: string;
  phone: string;
  planDate: string;
  position: string;
  progress: number;
  source: string;
  status: '已取消' | '已完成' | '待入職' | '資料待補' | '進行中';
  tasks: { assignee: string; category: string; done: boolean; dueDate: string; name: string }[];
}

const onboardingData: OnboardingRecord[] = [
  {
    id: 'OB-2026001',
    name: '趙明軒',
    department: '技術部',
    position: '後端工程師',
    planDate: '2026-03-10',
    hrOwner: '王美玲',
    status: '進行中',
    progress: 65,
    phone: '0912-111-222',
    email: 'mx.zhao@email.com',
    source: '獵頭推薦',
    tasks: [
      { name: '發送 Offer Letter', category: '文件', done: true, dueDate: '2026-02-20', assignee: '王美玲' },
      { name: '勞動合約簽署', category: '文件', done: true, dueDate: '2026-02-25', assignee: '王美玲' },
      { name: '個人資料收集', category: '文件', done: true, dueDate: '2026-02-28', assignee: '趙明軒' },
      { name: '體檢報告', category: '文件', done: false, dueDate: '2026-03-05', assignee: '趙明軒' },
      { name: '銀行帳戶開設', category: '薪資', done: true, dueDate: '2026-03-01', assignee: '趙明軒' },
      { name: '社保公積金登記', category: '薪資', done: false, dueDate: '2026-03-08', assignee: '林佳蓉' },
      { name: '電腦設備申請', category: 'IT', done: true, dueDate: '2026-03-03', assignee: '黃志偉' },
      { name: '帳號權限開通', category: 'IT', done: false, dueDate: '2026-03-08', assignee: '黃志偉' },
      { name: '工位安排', category: '行政', done: true, dueDate: '2026-03-05', assignee: '王美玲' },
      { name: '門禁卡製作', category: '行政', done: false, dueDate: '2026-03-08', assignee: '王美玲' },
      { name: '部門介紹與導師分配', category: '培訓', done: false, dueDate: '2026-03-10', assignee: '張小明' },
      { name: '新人培訓排程', category: '培訓', done: false, dueDate: '2026-03-10', assignee: '王美玲' }
    ]
  },
  {
    id: 'OB-2026002',
    name: '吳雅婷',
    department: '市場部',
    position: '行銷專員',
    planDate: '2026-03-15',
    hrOwner: '王美玲',
    status: '資料待補',
    progress: 30,
    phone: '0923-333-444',
    email: 'yt.wu@email.com',
    source: '校園招聘',
    tasks: [
      { name: '發送 Offer Letter', category: '文件', done: true, dueDate: '2026-02-28', assignee: '王美玲' },
      { name: '勞動合約簽署', category: '文件', done: true, dueDate: '2026-03-05', assignee: '王美玲' },
      { name: '個人資料收集', category: '文件', done: false, dueDate: '2026-03-08', assignee: '吳雅婷' },
      { name: '體檢報告', category: '文件', done: false, dueDate: '2026-03-10', assignee: '吳雅婷' },
      { name: '銀行帳戶開設', category: '薪資', done: false, dueDate: '2026-03-10', assignee: '吳雅婷' },
      { name: '社保公積金登記', category: '薪資', done: false, dueDate: '2026-03-12', assignee: '林佳蓉' },
      { name: '電腦設備申請', category: 'IT', done: true, dueDate: '2026-03-10', assignee: '黃志偉' },
      { name: '帳號權限開通', category: 'IT', done: false, dueDate: '2026-03-13', assignee: '黃志偉' },
      { name: '工位安排', category: '行政', done: false, dueDate: '2026-03-12', assignee: '王美玲' },
      { name: '門禁卡製作', category: '行政', done: false, dueDate: '2026-03-13', assignee: '王美玲' }
    ]
  },
  {
    id: 'OB-2026003',
    name: '鄭家豪',
    department: '運營部',
    position: '產品經理',
    planDate: '2026-02-20',
    hrOwner: '王美玲',
    status: '已完成',
    progress: 100,
    phone: '0934-555-666',
    email: 'jh.zheng@email.com',
    source: '內部推薦',
    tasks: [
      { name: '發送 Offer Letter', category: '文件', done: true, dueDate: '2026-02-01', assignee: '王美玲' },
      { name: '勞動合約簽署', category: '文件', done: true, dueDate: '2026-02-05', assignee: '王美玲' },
      { name: '個人資料收集', category: '文件', done: true, dueDate: '2026-02-08', assignee: '鄭家豪' },
      { name: '體檢報告', category: '文件', done: true, dueDate: '2026-02-10', assignee: '鄭家豪' },
      { name: '銀行帳戶開設', category: '薪資', done: true, dueDate: '2026-02-10', assignee: '鄭家豪' },
      { name: '社保公積金登記', category: '薪資', done: true, dueDate: '2026-02-15', assignee: '林佳蓉' },
      { name: '電腦設備申請', category: 'IT', done: true, dueDate: '2026-02-12', assignee: '黃志偉' },
      { name: '帳號權限開通', category: 'IT', done: true, dueDate: '2026-02-15', assignee: '黃志偉' },
      { name: '工位安排', category: '行政', done: true, dueDate: '2026-02-15', assignee: '王美玲' },
      { name: '門禁卡製作', category: '行政', done: true, dueDate: '2026-02-18', assignee: '王美玲' },
      { name: '部門介紹與導師分配', category: '培訓', done: true, dueDate: '2026-02-20', assignee: '陳大偉' },
      { name: '新人培訓排程', category: '培訓', done: true, dueDate: '2026-02-20', assignee: '王美玲' }
    ]
  },
  {
    id: 'OB-2026004',
    name: '林詩涵',
    department: '財務部',
    position: '會計師',
    planDate: '2026-03-20',
    hrOwner: '王美玲',
    status: '待入職',
    progress: 10,
    phone: '0945-777-888',
    email: 'sh.lin@email.com',
    source: '求職平台',
    tasks: [
      { name: '發送 Offer Letter', category: '文件', done: true, dueDate: '2026-03-05', assignee: '王美玲' },
      { name: '勞動合約簽署', category: '文件', done: false, dueDate: '2026-03-10', assignee: '王美玲' },
      { name: '個人資料收集', category: '文件', done: false, dueDate: '2026-03-12', assignee: '林詩涵' },
      { name: '體檢報告', category: '文件', done: false, dueDate: '2026-03-15', assignee: '林詩涵' },
      { name: '銀行帳戶開設', category: '薪資', done: false, dueDate: '2026-03-15', assignee: '林詩涵' },
      { name: '社保公積金登記', category: '薪資', done: false, dueDate: '2026-03-18', assignee: '林佳蓉' },
      { name: '電腦設備申請', category: 'IT', done: false, dueDate: '2026-03-15', assignee: '黃志偉' },
      { name: '帳號權限開通', category: 'IT', done: false, dueDate: '2026-03-18', assignee: '黃志偉' },
      { name: '工位安排', category: '行政', done: false, dueDate: '2026-03-18', assignee: '王美玲' },
      { name: '門禁卡製作', category: '行政', done: false, dueDate: '2026-03-18', assignee: '王美玲' }
    ]
  }
];

const statusConfig: Record<string, { color: string; dot: string }> = {
  待入職: { color: 'bg-primary/10 text-primary border-primary/20', dot: 'bg-primary' },
  進行中: { color: 'bg-info/10 text-info border-info/20', dot: 'bg-info' },
  資料待補: { color: 'bg-warning/10 text-warning border-warning/20', dot: 'bg-warning' },
  已完成: { color: 'bg-success/10 text-success border-success/20', dot: 'bg-success' },
  已取消: { color: 'bg-muted text-muted-foreground border-muted', dot: 'bg-muted-foreground' }
};

/* ===== 新增入職 Dialog ===== */
function AddOnboardingDialog({ onOpenChange, open }: { onOpenChange: (v: boolean) => void; open: boolean }) {
  const [step, setStep] = useState(1);

  const reset = () => setStep(1);

  return (
    <Dialog
      open={open}
      onOpenChange={v => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            新增入職
          </DialogTitle>
          <DialogDescription>建立新員工的入職流程</DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2 py-2">
          {['基本資訊', '入職安排', '任務清單'].map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div
                className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-medium shrink-0 ${(() => {
                  if (step > i + 1) return 'bg-success text-success-foreground';
                  if (step === i + 1) return 'bg-primary text-primary-foreground';
                  return 'bg-muted text-muted-foreground';
                })()}`}
              >
                {step > i + 1 ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
              </div>
              <span className={`text-xs ${step === i + 1 ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                {s}
              </span>
              {i < 2 && <div className="flex-1 h-px bg-border" />}
            </div>
          ))}
        </div>

        <Separator />

        {step === 1 && (
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm">
                  員工姓名 <span className="text-destructive">*</span>
                </Label>
                <Input placeholder="請輸入姓名" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">
                  聯絡電話 <span className="text-destructive">*</span>
                </Label>
                <Input placeholder="09xx-xxx-xxx" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">
                  電子郵箱 <span className="text-destructive">*</span>
                </Label>
                <Input type="email" placeholder="name@example.com" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">招聘來源</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="請選擇" />
                  </SelectTrigger>
                  <SelectContent>
                    {['求職平台', '獵頭推薦', '校園招聘', '內部推薦', '社交媒體', '其他'].map(o => (
                      <SelectItem key={o} value={o}>
                        {o}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">
                  部門 <span className="text-destructive">*</span>
                </Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="請選擇" />
                  </SelectTrigger>
                  <SelectContent>
                    {['技術部', '銷售部', '人事部', '市場部', '財務部', '運營部'].map(o => (
                      <SelectItem key={o} value={o}>
                        {o}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">
                  職位 <span className="text-destructive">*</span>
                </Label>
                <Input placeholder="請輸入職位" />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm">
                  預定入職日期 <span className="text-destructive">*</span>
                </Label>
                <Input type="date" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">負責 HR</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="請選擇" />
                  </SelectTrigger>
                  <SelectContent>
                    {['王美玲', '李文華'].map(o => (
                      <SelectItem key={o} value={o}>
                        {o}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">直屬主管</Label>
                <Input placeholder="請輸入主管姓名" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">入職導師</Label>
                <Input placeholder="請輸入導師姓名（選填）" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">試用期（月）</Label>
                <Input type="number" defaultValue={3} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">薪資類型</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="請選擇" />
                  </SelectTrigger>
                  <SelectContent>
                    {['月薪', '日薪', '時薪'].map(o => (
                      <SelectItem key={o} value={o}>
                        {o}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">備註</Label>
              <Textarea placeholder="其他需要注意的事項..." rows={3} />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">系統將自動建立以下入職任務清單，您可在建立後調整：</p>
            <div className="space-y-3">
              {[
                {
                  cat: '文件',
                  icon: FileText,
                  items: ['發送 Offer Letter', '勞動合約簽署', '個人資料收集', '體檢報告']
                },
                { cat: '薪資', icon: CalendarDays, items: ['銀行帳戶開設', '社保公積金登記'] },
                { cat: 'IT', icon: Clock, items: ['電腦設備申請', '帳號權限開通'] },
                { cat: '行政', icon: CheckCircle2, items: ['工位安排', '門禁卡製作'] },
                { cat: '培訓', icon: AlertCircle, items: ['部門介紹與導師分配', '新人培訓排程'] }
              ].map(g => (
                <div key={g.cat} className="rounded-lg border p-3">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">{g.cat}</p>
                  <div className="space-y-1.5">
                    {g.items.map(item => (
                      <div key={item} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep(step - 1)}>
              上一步
            </Button>
          )}
          {step < 3 ? (
            <Button onClick={() => setStep(step + 1)}>下一步</Button>
          ) : (
            <Button
              onClick={() => {
                toast.success('入職流程已建立');
                reset();
                onOpenChange(false);
              }}
            >
              確認建立
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ===== 統計卡片 ===== */
function StatCard({ accent, icon: Icon, label, value }: { accent: string; icon: any; label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-card p-4 flex items-center gap-4">
      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${accent}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

/* ===== 主頁面 ===== */
export default function Onboarding() {
  const [addOpen, setAddOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const navigate = useNavigate();

  const filtered = onboardingData.filter(r => {
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    if (search && !Object.values(r).some(v => String(v).toLowerCase().includes(search.toLowerCase()))) return false;
    return true;
  });

  const stats = {
    total: onboardingData.length,
    pending: onboardingData.filter(r => r.status === '待入職').length,
    inProgress: onboardingData.filter(r => r.status === '進行中' || r.status === '資料待補').length,
    completed: onboardingData.filter(r => r.status === '已完成').length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <UserPlus className="h-6 w-6 text-primary" />
            入職管理
          </h1>
          <p className="page-description">管理新員工的入職流程、任務追蹤與資料準備</p>
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          新增入職
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="入職總數" value={stats.total} icon={UserPlus} accent="bg-primary/10 text-primary" />
        <StatCard label="待入職" value={stats.pending} icon={Clock} accent="bg-primary/10 text-primary" />
        <StatCard label="進行中" value={stats.inProgress} icon={AlertCircle} accent="bg-warning/10 text-warning" />
        <StatCard label="已完成" value={stats.completed} icon={CheckCircle2} accent="bg-success/10 text-success" />
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜尋姓名、部門、職位..."
                className="pl-9 h-9"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-28 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部狀態</SelectItem>
                  <SelectItem value="待入職">待入職</SelectItem>
                  <SelectItem value="進行中">進行中</SelectItem>
                  <SelectItem value="資料待補">資料待補</SelectItem>
                  <SelectItem value="已完成">已完成</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1" />
                匯出
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>員工</TableHead>
                <TableHead>部門 / 職位</TableHead>
                <TableHead>預定入職日</TableHead>
                <TableHead>負責 HR</TableHead>
                <TableHead>進度</TableHead>
                <TableHead>狀態</TableHead>
                <TableHead className="w-20">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(r => {
                const sc = statusConfig[r.status];
                return (
                  <TableRow
                    key={r.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/employees/onboarding/${r.id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                            {r.name.slice(-2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{r.name}</p>
                          <p className="text-xs text-muted-foreground">{r.id}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{r.department}</p>
                      <p className="text-xs text-muted-foreground">{r.position}</p>
                    </TableCell>
                    <TableCell className="text-sm">{r.planDate}</TableCell>
                    <TableCell className="text-sm">{r.hrOwner}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 w-28">
                        <Progress value={r.progress} className="h-1.5 flex-1" />
                        <span className="text-xs text-muted-foreground w-8">{r.progress}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={sc?.color || ''}>
                        <span className={`inline-block h-1.5 w-1.5 rounded-full mr-1.5 ${sc?.dot || ''}`} />
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={e => {
                          e.stopPropagation();
                          navigate(`/employees/onboarding/${r.id}`);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AddOnboardingDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}
