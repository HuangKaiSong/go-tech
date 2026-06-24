import { CheckCircle2, Download, Eye, Filter, Mail, Plus, Search, Upload, UserCheck, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { AddEmployeeDialog } from '@/components/employees/AddEmployeeDialog';
import { ExcelImportDialog } from '@/components/employees/ExcelImportDialog';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';

interface EmployeeRow {
  department_name: string | null;
  email?: string | null;
  employee_no: string;
  id: string;
  join_date: string | null;
  name: string;
  phone: string | null;
  position: string | null;
  status: string | null;
}

/* ===== 邀請待填 / 待HR完善 模擬資料（暫不入庫） ===== */
const inviteData: EmployeeRow[] = [
  {
    id: 'INV-001',
    employee_no: '—',
    name: '黃靖雯',
    department_name: '技術部',
    position: '前端工程師',
    phone: '0956-123-456',
    email: 'jw.huang@email.com',
    join_date: '2026-03-25',
    status: '待HR完善'
  },
  {
    id: 'INV-002',
    employee_no: '—',
    name: '陳子翔',
    department_name: '銷售部',
    position: '業務代表',
    phone: '0967-789-012',
    email: 'zx.chen@email.com',
    join_date: '2026-04-01',
    status: '已邀請待填'
  }
];

const columns = [
  { key: 'employee_no', label: '工號' },
  { key: 'name', label: '姓名' },
  { key: 'department_name', label: '部門' },
  { key: 'position', label: '職位' },
  { key: 'phone', label: '聯絡電話' },
  { key: 'join_date', label: '入職日期' },
  { key: 'status', label: '狀態' },
  { key: 'actions', label: '操作' }
];

const statusColors: Record<string, string> = {
  在職: 'bg-success/10 text-success border-success/20',
  休假中: 'bg-warning/10 text-warning border-warning/20',
  離職: 'bg-destructive/10 text-destructive border-destructive/20',
  已邀請待填: 'bg-muted text-muted-foreground border-border',
  待HR完善: 'bg-warning/10 text-warning border-warning/20'
};

export default function EmployeeList() {
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [rows, setRows] = useState<EmployeeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [completeRow, setCompleteRow] = useState<EmployeeRow | null>(null);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('employees')
      .select('id,employee_no,name,department_name,position,phone,email,join_date,status')
      .order('employee_no', { ascending: true });
    if (error) toast.error(`載入員工資料失敗：${error.message}`);
    else setRows((data ?? []) as EmployeeRow[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const merged = [...inviteData, ...rows];
  const data = merged.filter(row => {
    if (statusFilter !== 'all' && row.status !== statusFilter) return false;
    if (
      search &&
      !Object.values(row).some(v =>
        String(v ?? '')
          .toLowerCase()
          .includes(search.toLowerCase())
      )
    )
      return false;
    return true;
  });

  const inviteCount = inviteData.filter(r => r.status === '已邀請待填').length;
  const awaitHRCount = inviteData.filter(r => r.status === '待HR完善').length;

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            員工資料
          </h1>
          <p className="page-description">管理所有員工的基本資料與檔案（含邀請填寫流程）</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
            <Upload className="h-4 w-4 mr-1" />
            Excel 匯入
          </Button>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            新增員工
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜尋..."
                  className="pl-9 h-9"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部狀態</SelectItem>
                  <SelectItem value="已邀請待填">已邀請待填 ({inviteCount})</SelectItem>
                  <SelectItem value="待HR完善">待HR完善 ({awaitHRCount})</SelectItem>
                  <SelectItem value="在職">在職</SelectItem>
                  <SelectItem value="休假中">休假中</SelectItem>
                  <SelectItem value="離職">離職</SelectItem>
                </SelectContent>
              </Select>
              {(inviteCount > 0 || awaitHRCount > 0) && (
                <div className="flex items-center gap-2 text-xs">
                  {awaitHRCount > 0 && (
                    <Badge variant="secondary" className="bg-warning/10 text-warning border-warning/20">
                      <UserCheck className="h-3 w-3 mr-1" />
                      {awaitHRCount} 筆待 HR 完善
                    </Badge>
                  )}
                  {inviteCount > 0 && (
                    <Badge variant="secondary" className="bg-muted text-muted-foreground">
                      <Mail className="h-3 w-3 mr-1" />
                      {inviteCount} 筆已邀請待填
                    </Badge>
                  )}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-1" />
                篩選
              </Button>
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
                {columns.map(col => (
                  <TableHead key={col.key}>{col.label}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={columns.length} className="text-center py-10 text-muted-foreground">
                    載入中...
                  </TableCell>
                </TableRow>
              )}
              {!loading && data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={columns.length} className="text-center py-10 text-muted-foreground">
                    暫無員工資料
                  </TableCell>
                </TableRow>
              )}
              {!loading &&
                data.length > 0 &&
                data.map(row => {
                  const isInvite = row.status === '已邀請待填' || row.status === '待HR完善';
                  return (
                    <TableRow
                      key={row.id}
                      className={isInvite ? '' : 'cursor-pointer'}
                      onClick={() => {
                        if (!isInvite) navigate(`/employees/${row.employee_no}`);
                      }}
                    >
                      {columns.map(col => (
                        <TableCell key={col.key}>
                          {col.key === 'status' && (
                            <Badge variant="secondary" className={statusColors[row.status || ''] || ''}>
                              {row.status}
                            </Badge>
                          )}
                          {col.key === 'actions' && (
                            <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                              {row.status === '待HR完善' && (
                                <Button
                                  variant="default"
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={() => setCompleteRow(row)}
                                >
                                  <UserCheck className="h-3.5 w-3.5 mr-1" />
                                  完善
                                </Button>
                              )}
                              {row.status === '已邀請待填' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={() => toast.success(`已重新發送邀請至 ${row.email}`)}
                                >
                                  <Mail className="h-3.5 w-3.5 mr-1" />
                                  重發
                                </Button>
                              )}
                              {!isInvite && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => navigate(`/employees/${row.employee_no}`)}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  查看
                                </Button>
                              )}
                            </div>
                          )}
                          {col.key !== 'status' && col.key !== 'actions' && ((row as any)[col.key] ?? '-')}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AddEmployeeDialog open={addOpen} onOpenChange={setAddOpen} />
      <ExcelImportDialog open={importOpen} onOpenChange={setImportOpen} onImport={() => {}} />
      <HRCompleteDialog open={Boolean(completeRow)} onOpenChange={v => !v && setCompleteRow(null)} row={completeRow} />
    </div>
  );
}

/* ===== HR 完善資料 Dialog ===== */
function HRCompleteDialog({
  onOpenChange,
  open,
  row
}: {
  onOpenChange: (v: boolean) => void;
  open: boolean;
  row: EmployeeRow | null;
}) {
  if (!row) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-primary" />
            完善員工資料 — {row.name}
          </DialogTitle>
          <DialogDescription>
            員工已透過邀請連結提交個人資料，請 HR
            補充組織與薪資相關欄位後提交，系統將自動建立員工檔案並轉入「入職管理」流程。
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground">員工自填資料（已完成）</p>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">姓名：</span>
              {row.name}
            </div>
            <div>
              <span className="text-muted-foreground">電話：</span>
              {row.phone}
            </div>
            <div>
              <span className="text-muted-foreground">郵箱：</span>
              {row.email}
            </div>
            <div>
              <span className="text-muted-foreground">部門意向：</span>
              {row.department_name}
            </div>
            <div>
              <span className="text-muted-foreground">職位意向：</span>
              {row.position}
            </div>
            <div>
              <span className="text-muted-foreground">預定入職：</span>
              {row.join_date}
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-2">
          <h3 className="text-sm font-semibold text-muted-foreground border-b pb-2">HR 補充 — 組織與薪資設定</h3>
          <div className="grid grid-cols-2 gap-4">
            <Field label="員工編號" required>
              <Input placeholder="自動生成或手動輸入" />
            </Field>
            <Field label="確認部門" required>
              <Select defaultValue={row.department_name || undefined}>
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
            </Field>
            <Field label="確認職位" required>
              <Input defaultValue={row.position || ''} />
            </Field>
            <Field label="直屬主管" required>
              <Input placeholder="請輸入主管姓名" />
            </Field>
            <Field label="僱用類型" required>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="請選擇" />
                </SelectTrigger>
                <SelectContent>
                  {['全職', '兼職', '合約', '實習'].map(o => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="試用期（月）">
              <Input type="number" defaultValue={3} />
            </Field>
            <Field label="薪資類型" required>
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
            </Field>
            <Field label="基本薪金 (HK$)" required>
              <Input type="number" placeholder="0" />
            </Field>
            <Field label="確認入職日期" required>
              <Input type="date" defaultValue={row.join_date || ''} />
            </Field>
            <Field label="負責 HR">
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
            </Field>
            <Field label="強積金類型">
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="請選擇" />
                </SelectTrigger>
                <SelectContent>
                  {['僱員強制', '僱主自願', '行業計劃'].map(o => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="支付方式">
              <Select defaultValue="銀行轉帳">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['銀行轉帳', '現金', '支票'].map(o => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="備註">
            <Textarea placeholder="其他需要注意的事項..." rows={2} />
          </Field>
        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            暫存
          </Button>
          <Button
            onClick={() => {
              toast.success(`已提交 ${row.name} 的資料，已轉入入職管理`);
              onOpenChange(false);
            }}
          >
            <CheckCircle2 className="h-4 w-4 mr-1" />
            提交並建立員工
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ children, label, required }: { children: React.ReactNode; label: string; required?: boolean }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
    </div>
  );
}
