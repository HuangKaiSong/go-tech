import {
  AlertCircle,
  ArrowLeft,
  Building2,
  CheckCircle,
  Clock,
  CreditCard,
  DollarSign,
  Download,
  FileText,
  Pencil,
  Search,
  Send,
  TrendingDown,
  TrendingUp,
  User,
  Users,
  Wallet,
  XCircle
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { type DistEmployee, mockDistEmployees, mockDistRecords } from './PayrollDistribute';

const statusColors: Record<string, string> = {
  草稿: 'bg-muted text-muted-foreground border-border',
  待審核: 'bg-warning/10 text-warning border-warning/20',
  已審核: 'bg-accent/10 text-accent-foreground border-accent/20',
  發放中: 'bg-primary/10 text-primary border-primary/20',
  已發放: 'bg-success/10 text-success border-success/20',
  已取消: 'bg-destructive/10 text-destructive border-destructive/20'
};

const empPayStatusColors: Record<string, string> = {
  待發放: 'bg-warning/10 text-warning border-warning/20',
  已發放: 'bg-success/10 text-success border-success/20',
  發放失敗: 'bg-destructive/10 text-destructive border-destructive/20',
  已取消: 'bg-muted text-muted-foreground border-border'
};

export default function PayrollDistDetail() {
  const { distId } = useParams();
  const navigate = useNavigate();
  const record = mockDistRecords.find(r => r.id === distId) || mockDistRecords[0];
  const [search, setSearch] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<DistEmployee | null>(null);
  const [approveOpen, setApproveOpen] = useState(false);
  const [approveComment, setApproveComment] = useState('');
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const filtered = mockDistEmployees.filter(
    e =>
      e.name.includes(search) ||
      e.employeeId.toLowerCase().includes(search.toLowerCase()) ||
      e.department.includes(search)
  );

  const isEditable = record.status === '草稿';
  const canSubmitReview = record.status === '草稿';
  const canApprove = record.status === '待審核';
  const canDistribute = record.status === '已審核';

  const summaryCards = [
    { label: '應發總額', value: `HK$ ${record.totalGross.toLocaleString()}`, icon: TrendingUp, color: 'text-success' },
    {
      label: '扣款總額',
      value: `HK$ ${record.totalDeduction.toLocaleString()}`,
      icon: TrendingDown,
      color: 'text-destructive'
    },
    { label: '實發總額', value: `HK$ ${record.totalNet.toLocaleString()}`, icon: Wallet, color: 'text-primary' },
    { label: '發薪人數', value: `${record.employeeCount} 人`, icon: Users, color: 'text-accent-foreground' }
  ];

  const approvalTimeline = [
    { step: '建立批次', user: record.createdBy, time: record.createdAt, status: 'completed' },
    {
      step: '提交審核',
      user: record.status !== '草稿' ? record.createdBy : '—',
      time: record.status !== '草稿' ? record.createdAt : '—',
      status: record.status === '草稿' ? 'pending' : 'completed'
    },
    {
      step: '審核通過',
      user: record.approvedBy || '—',
      time: record.approvedBy ? record.updatedAt : '—',
      status: ['已審核', '發放中', '已發放'].includes(record.status) ? 'completed' : 'pending'
    },
    {
      step: '執行發放',
      user: record.status === '已發放' ? '系統' : '—',
      time: record.status === '已發放' ? record.updatedAt : '—',
      status: record.status === '已發放' ? 'completed' : 'pending'
    }
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/payroll/distribute')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">{record.period} 發薪管理</h1>
              <Badge variant="outline" className={statusColors[record.status]}>
                {record.status}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">
              編號 {record.id} · 建立者 {record.createdBy} · 發薪日 {record.payDate}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" /> 匯出
          </Button>
          {isEditable && (
            <Button variant="outline" className="gap-2" onClick={() => navigate(`/payroll/distribute/${distId}/edit`)}>
              <Pencil className="h-4 w-4" /> 編輯
            </Button>
          )}
          {canSubmitReview && (
            <Button className="gap-2" onClick={() => toast.success('已提交審核')}>
              <Send className="h-4 w-4" /> 提交審核
            </Button>
          )}
          {canApprove && (
            <>
              <Button
                variant="outline"
                className="gap-2 text-destructive border-destructive/20 hover:bg-destructive/10"
                onClick={() => setRejectOpen(true)}
              >
                <XCircle className="h-4 w-4" /> 駁回
              </Button>
              <Button
                className="gap-2 bg-success text-success-foreground hover:bg-success/90"
                onClick={() => setApproveOpen(true)}
              >
                <CheckCircle className="h-4 w-4" /> 審核通過
              </Button>
            </>
          )}
          {canDistribute && (
            <Button
              className="gap-2 bg-success text-success-foreground hover:bg-success/90"
              onClick={() => toast.success('薪資已發放')}
            >
              <DollarSign className="h-4 w-4" /> 執行發放
            </Button>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

      <Tabs defaultValue="employees" className="space-y-4">
        <TabsList>
          <TabsTrigger value="employees">發薪明細</TabsTrigger>
          <TabsTrigger value="info">批次資訊</TabsTrigger>
          <TabsTrigger value="timeline">審批流程</TabsTrigger>
        </TabsList>

        {/* Employee List Tab */}
        <TabsContent value="employees">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">員工發薪明細</CardTitle>
                    <div className="relative w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="搜尋員工..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-9 h-9"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>員工</TableHead>
                        <TableHead>部門</TableHead>
                        <TableHead>銀行</TableHead>
                        <TableHead>帳號</TableHead>
                        <TableHead className="text-right">實發金額</TableHead>
                        <TableHead>狀態</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map(emp => (
                        <TableRow
                          key={emp.id}
                          className={`cursor-pointer hover:bg-muted/50 ${selectedEmployee?.id === emp.id ? 'bg-primary/5' : ''}`}
                          onClick={() => setSelectedEmployee(emp)}
                        >
                          <TableCell>
                            <div>
                              <p className="font-medium">{emp.name}</p>
                              <p className="text-xs text-muted-foreground">{emp.employeeId}</p>
                            </div>
                          </TableCell>
                          <TableCell>{emp.department}</TableCell>
                          <TableCell>{emp.bankName}</TableCell>
                          <TableCell className="font-mono text-muted-foreground">{emp.bankAccount}</TableCell>
                          <TableCell className="text-right font-semibold">{emp.netSalary.toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={empPayStatusColors[emp.payStatus]}>
                              {emp.payStatus}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>

            {/* Employee Detail Sidebar */}
            <div>
              {selectedEmployee ? (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">發薪詳情</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">{selectedEmployee.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {selectedEmployee.employeeId} · {selectedEmployee.position}
                        </p>
                      </div>
                    </div>
                    <Separator />
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Building2 className="h-3.5 w-3.5" /> 部門
                        </span>
                        <span className="font-medium">{selectedEmployee.department}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <CreditCard className="h-3.5 w-3.5" /> 銀行
                        </span>
                        <span className="font-medium">{selectedEmployee.bankName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <CreditCard className="h-3.5 w-3.5" /> 帳號
                        </span>
                        <span className="font-medium font-mono">{selectedEmployee.bankAccount}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">發放狀態</span>
                        <Badge variant="outline" className={empPayStatusColors[selectedEmployee.payStatus]}>
                          {selectedEmployee.payStatus}
                        </Badge>
                      </div>
                      {selectedEmployee.payTime && selectedEmployee.payStatus === '已發放' && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" /> 發放時間
                            </span>
                            <span className="font-medium">{selectedEmployee.payTime}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground flex items-center gap-1">
                              <FileText className="h-3.5 w-3.5" /> 交易編號
                            </span>
                            <span className="font-medium text-xs font-mono">{selectedEmployee.transactionId}</span>
                          </div>
                        </>
                      )}
                    </div>
                    <Separator />
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
                    <p>點擊左側員工查看發薪詳情</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Batch Info Tab */}
        <TabsContent value="info">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">基本資訊</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: '批次編號', value: record.id },
                  { label: '薪資期間', value: record.period },
                  { label: '發薪日期', value: record.payDate },
                  { label: '發薪方式', value: record.payMethod },
                  { label: '銀行名稱', value: record.bankName },
                  { label: '建立者', value: record.createdBy },
                  { label: '建立日期', value: record.createdAt },
                  { label: '最後更新', value: record.updatedAt }
                ].map(item => (
                  <div key={item.label} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-medium">{item.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">金額摘要</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">應發總額</span>
                  <span className="font-medium">HK$ {record.totalGross.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">扣款總額</span>
                  <span className="font-medium text-destructive">- HK$ {record.totalDeduction.toLocaleString()}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm font-semibold">
                  <span>實發總額</span>
                  <span className="text-primary">HK$ {record.totalNet.toLocaleString()}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">發薪人數</span>
                  <span className="font-medium">{record.employeeCount} 人</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">人均薪資</span>
                  <span className="font-medium">
                    HK$ {Math.round(record.totalNet / record.employeeCount).toLocaleString()}
                  </span>
                </div>
                {record.approvedBy && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">審核人</span>
                    <span className="font-medium">{record.approvedBy}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">審批流程</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-0">
                {approvalTimeline.map((step, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div
                        className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          step.status === 'completed'
                            ? 'bg-success text-success-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {step.status === 'completed' ? <CheckCircle className="h-4 w-4" /> : i + 1}
                      </div>
                      {i < approvalTimeline.length - 1 && (
                        <div className={`w-0.5 h-16 ${step.status === 'completed' ? 'bg-success/30' : 'bg-border'}`} />
                      )}
                    </div>
                    <div className="pb-8">
                      <p
                        className={`font-semibold ${step.status === 'completed' ? 'text-foreground' : 'text-muted-foreground'}`}
                      >
                        {step.step}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {step.user !== '—' ? `${step.user} · ${step.time}` : '等待處理'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Approve Dialog */}
      <Dialog
        open={approveOpen}
        onOpenChange={() => {
          setApproveOpen(false);
          setApproveComment('');
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-success" /> 審核通過確認
            </DialogTitle>
            <DialogDescription>
              確認審核通過 {record.period} 的發薪批次，實發總額 HK$ {record.totalNet.toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">批次編號</span>
                <span className="font-medium">{record.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">發薪人數</span>
                <span className="font-medium">{record.employeeCount} 人</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>實發總額</span>
                <span className="text-primary">HK$ {record.totalNet.toLocaleString()}</span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">審核意見（選填）</label>
              <Textarea
                placeholder="輸入審核意見..."
                value={approveComment}
                onChange={e => setApproveComment(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setApproveOpen(false);
                setApproveComment('');
              }}
            >
              取消
            </Button>
            <Button
              className="gap-2 bg-success text-success-foreground hover:bg-success/90"
              onClick={() => {
                toast.success('已審核通過');
                setApproveOpen(false);
                setApproveComment('');
              }}
            >
              <CheckCircle className="h-4 w-4" /> 確認通過
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog
        open={rejectOpen}
        onOpenChange={() => {
          setRejectOpen(false);
          setRejectReason('');
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" /> 駁回發薪批次
            </DialogTitle>
            <DialogDescription>駁回 {record.period} 的發薪批次，批次將退回草稿狀態</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
              <p className="text-sm text-destructive">駁回後批次將退回草稿狀態，提交者需修改後重新提交審核。</p>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                駁回原因 <span className="text-destructive">*</span>
              </label>
              <Textarea
                placeholder="請說明駁回原因..."
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectOpen(false);
                setRejectReason('');
              }}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              className="gap-2"
              onClick={() => {
                if (!rejectReason.trim()) {
                  toast.error('請填寫駁回原因');
                  return;
                }
                toast.success('已駁回');
                setRejectOpen(false);
                setRejectReason('');
              }}
            >
              <XCircle className="h-4 w-4" /> 確認駁回
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
