import { ArrowLeft, Building2, Calendar, DollarSign, Edit, FileText, Save, Tag, Trash2, User, X } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { type BonusPenaltyRecord, mockBonusPenaltyRecords } from './BonusPenaltyManagement';

const statusColors: Record<string, string> = {
  未計入: 'bg-warning/10 text-warning border-warning/20',
  已計入: 'bg-success/10 text-success border-success/20',
  已取消: 'bg-muted text-muted-foreground border-border'
};

const typeColors: Record<string, string> = {
  獎金: 'bg-success/10 text-success border-success/20',
  罰款: 'bg-destructive/10 text-destructive border-destructive/20'
};

const bonusCategories = ['績效獎金', '專案獎金', '年終獎金', '推薦獎金', '全勤獎金', '其他獎金'];
const penaltyCategories = ['遲到罰款', '曠工罰款', '違規罰款', '損壞賠償', '其他罰款'];

const monthOptions = [
  { value: '2026-03', label: '2026年03月' },
  { value: '2026-04', label: '2026年04月' },
  { value: '2026-05', label: '2026年05月' },
  { value: '2026-06', label: '2026年06月' }
];

const employeeOptions = [
  { id: 'EMP-001', name: '張小明', department: '技術部' },
  { id: 'EMP-002', name: '李文華', department: '銷售部' },
  { id: 'EMP-003', name: '王美玲', department: '人事部' },
  { id: 'EMP-004', name: '陳大偉', department: '技術部' },
  { id: 'EMP-005', name: '林小芬', department: '行政部' },
  { id: 'EMP-006', name: '黃志豪', department: '技術部' },
  { id: 'EMP-007', name: '趙雅婷', department: '銷售部' },
  { id: 'EMP-008', name: '周建國', department: '人事部' },
  { id: 'EMP-009', name: '吳佩珊', department: '會計部' },
  { id: 'EMP-010', name: '鄭國強', department: '會計部' },
  { id: 'EMP-011', name: '何志明', department: '技術部' },
  { id: 'EMP-012', name: '蔡美惠', department: '行政部' }
];

function buildEditForm(record: BonusPenaltyRecord | undefined) {
  return {
    category: record?.category || '',
    employeeId: record?.employeeId || '',
    amount: String(record?.amount || ''),
    applyMonth: record?.applyMonth || '',
    reason: record?.reason || '',
    note: record?.note || ''
  };
}

function buildInfoItems(record: BonusPenaltyRecord, isEditing: boolean) {
  return [
    { icon: Tag, label: '類型', value: record.type, badge: true, badgeClass: typeColors[record.type] },
    { icon: FileText, label: '類別', value: isEditing ? null : record.category },
    { icon: User, label: '員工', value: isEditing ? null : `${record.employeeName}（${record.employeeId}）` },
    { icon: Building2, label: '部門', value: record.department },
    {
      icon: DollarSign,
      label: '金額',
      value: isEditing ? null : `${record.type === '獎金' ? '+' : '-'}HK$ ${record.amount.toLocaleString()}`,
      color: record.type === '獎金' ? 'text-success' : 'text-destructive'
    },
    { icon: Calendar, label: '計入月份', value: isEditing ? null : record.applyMonthLabel }
  ];
}

export default function BonusPenaltyDetail() {
  const { bpId } = useParams();
  const navigate = useNavigate();
  const originalRecord = mockBonusPenaltyRecords.find(r => r.id === bpId);

  const [record, setRecord] = useState<BonusPenaltyRecord | null>(originalRecord || null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(buildEditForm(originalRecord));
  const [cancelOpen, setCancelOpen] = useState(false);

  if (!record) {
    return (
      <div className="p-6">
        <Button variant="ghost" className="gap-2 mb-4" onClick={() => navigate('/payroll/bonus-penalty')}>
          <ArrowLeft className="h-4 w-4" /> 返回列表
        </Button>
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">找不到該記錄</CardContent>
        </Card>
      </div>
    );
  }

  const handleStartEdit = () => {
    setEditForm({
      category: record.category,
      employeeId: record.employeeId,
      amount: String(record.amount),
      applyMonth: record.applyMonth,
      reason: record.reason,
      note: record.note
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!editForm.amount || !editForm.reason || !editForm.category) {
      toast.error('請填寫所有必填欄位');
      return;
    }
    const emp = employeeOptions.find(e => e.id === editForm.employeeId);
    const monthLabel = monthOptions.find(m => m.value === editForm.applyMonth)?.label || editForm.applyMonth;
    setRecord(prev =>
      prev
        ? {
            ...prev,
            category: editForm.category,
            employeeId: editForm.employeeId,
            employeeName: emp?.name || prev.employeeName,
            department: emp?.department || prev.department,
            amount: Number.parseFloat(editForm.amount),
            applyMonth: editForm.applyMonth,
            applyMonthLabel: monthLabel,
            reason: editForm.reason,
            note: editForm.note
          }
        : null
    );
    setIsEditing(false);
    toast.success('記錄已更新');
  };

  const handleCancel = () => {
    setRecord(prev => (prev ? { ...prev, status: '已取消' as const } : null));
    setCancelOpen(false);
    toast.success('記錄已取消');
  };

  const handleActivate = () => {
    setRecord(prev => (prev ? { ...prev, status: '已計入' as const } : null));
    toast.success('記錄已標記為已計入');
  };

  const categories = record.type === '獎金' ? bonusCategories : penaltyCategories;
  const isEditable = record.status === '未計入';

  const infoItems = buildInfoItems(record, isEditing);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/payroll/bonus-penalty')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">{record.type}詳情</h1>
              <Badge variant="outline" className={typeColors[record.type]}>
                {record.type}
              </Badge>
              <Badge variant="outline" className={statusColors[record.status]}>
                {record.status}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">
              編號 {record.id} · 建立者 {record.createdBy} · 建立於 {record.createdAt}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" className="gap-2" onClick={() => setIsEditing(false)}>
                <X className="h-4 w-4" /> 取消
              </Button>
              <Button className="gap-2" onClick={handleSave}>
                <Save className="h-4 w-4" /> 儲存
              </Button>
            </>
          ) : (
            <>
              {isEditable && (
                <>
                  <Button variant="outline" className="gap-2" onClick={handleStartEdit}>
                    <Edit className="h-4 w-4" /> 編輯
                  </Button>
                  <Button className="gap-2" onClick={handleActivate}>
                    標記已計入
                  </Button>
                  <Button variant="destructive" className="gap-2" onClick={() => setCancelOpen(true)}>
                    <Trash2 className="h-4 w-4" /> 取消記錄
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">基本資訊</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {infoItems.map(item => (
                <div key={item.label} className="flex items-center gap-4">
                  <div className="flex items-center gap-2 w-28 shrink-0">
                    <item.icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{item.label}</span>
                  </div>
                  {item.badge && (
                    <Badge variant="outline" className={item.badgeClass}>
                      {item.value}
                    </Badge>
                  )}
                  {!item.badge && item.value && (
                    <span className={`text-sm font-medium ${item.color || 'text-foreground'}`}>{item.value}</span>
                  )}

                  {/* Editable fields inline */}
                  {isEditing && item.label === '類別' && (
                    <Select
                      value={editForm.category}
                      onValueChange={v => setEditForm(prev => ({ ...prev, category: v }))}
                    >
                      <SelectTrigger className="w-[200px] h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(c => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {isEditing && item.label === '員工' && (
                    <Select
                      value={editForm.employeeId}
                      onValueChange={v => setEditForm(prev => ({ ...prev, employeeId: v }))}
                    >
                      <SelectTrigger className="w-[280px] h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {employeeOptions.map(e => (
                          <SelectItem key={e.id} value={e.id}>
                            {e.name}（{e.id}）
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {isEditing && item.label === '金額' && (
                    <Input
                      type="number"
                      className="w-[160px] h-8"
                      value={editForm.amount}
                      onChange={e => setEditForm(prev => ({ ...prev, amount: e.target.value }))}
                    />
                  )}
                  {isEditing && item.label === '計入月份' && (
                    <Select
                      value={editForm.applyMonth}
                      onValueChange={v => setEditForm(prev => ({ ...prev, applyMonth: v }))}
                    >
                      <SelectTrigger className="w-[200px] h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {monthOptions.map(m => (
                          <SelectItem key={m.value} value={m.value}>
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Reason */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">原因說明</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Textarea
                  value={editForm.reason}
                  onChange={e => setEditForm(prev => ({ ...prev, reason: e.target.value }))}
                  rows={4}
                />
              ) : (
                <p className="text-sm text-foreground leading-relaxed">{record.reason}</p>
              )}
            </CardContent>
          </Card>

          {/* Note */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">備註</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Input
                  value={editForm.note}
                  onChange={e => setEditForm(prev => ({ ...prev, note: e.target.value }))}
                  placeholder="選填備註"
                />
              ) : (
                <p className="text-sm text-muted-foreground">{record.note || '無備註'}</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Summary */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-6 text-center">
              <div
                className={`text-3xl font-bold mb-2 ${record.type === '獎金' ? 'text-success' : 'text-destructive'}`}
              >
                {record.type === '獎金' ? '+' : '-'}HK$ {record.amount.toLocaleString()}
              </div>
              <p className="text-sm text-muted-foreground">{record.category}</p>
              <Separator className="my-4" />
              <div className="space-y-3 text-left">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">員工</span>
                  <span className="font-medium">{record.employeeName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">部門</span>
                  <span className="font-medium">{record.department}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">計入月份</span>
                  <span className="font-medium">{record.applyMonthLabel}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">狀態</span>
                  <Badge variant="outline" className={statusColors[record.status]}>
                    {record.status}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">建立日期</span>
                  <span className="font-medium">{record.createdAt}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">建立者</span>
                  <span className="font-medium">{record.createdBy}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Cancel Dialog */}
      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認取消</AlertDialogTitle>
            <AlertDialogDescription>
              確定要取消此{record.type}記錄嗎？取消後該筆金額將不會計入 {record.applyMonthLabel} 的薪資計算。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>返回</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel}>確認取消</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
