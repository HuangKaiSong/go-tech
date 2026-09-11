import {
  ArrowLeft,
  Briefcase,
  Building2,
  ChevronRight,
  Edit,
  Mail,
  Phone,
  Save,
  Target,
  UserCheck,
  Users,
  X
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  type Department,
  type DepartmentMember,
  type DepartmentOption,
  getDepartmentById,
  getDepartmentList,
  getDepartmentMembers,
  getDepartmentOptions,
  saveDepartment
} from '@/api/department';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';

/** 员工状态色（对齐 EmployeeStatusEnum 文案） */
const memberStatusColors: Record<string, string> = {
  在職: 'bg-success/10 text-success border-success/20',
  休假中: 'bg-accent/10 text-accent border-accent/20',
  待離職: 'bg-destructive/10 text-destructive border-destructive/20'
};

const subDeptStatusColors: Record<string, string> = {
  啟用: 'bg-success/10 text-success border-success/20',
  停用: 'bg-muted text-muted-foreground'
};

const sideNav = [
  { id: 'basic', label: '基本資訊', icon: Building2 },
  { id: 'members', label: '部門成員', icon: Users },
  { id: 'sub', label: '下級部門', icon: Briefcase },
  { id: 'kpi', label: '部門 KPI', icon: Target }
];

/** 编辑表单结构 */
interface EditForm {
  budget: string;
  code: string;
  description: string;
  email: string;
  managerName: string;
  name: string;
  parentId?: number;
  phone: string;
  status: number;
}

function toForm(d: Department): EditForm {
  return {
    name: d.name,
    code: d.code,
    parentId: d.parentId,
    managerName: d.managerName ?? '',
    phone: d.phone ?? '',
    email: d.email ?? '',
    budget: d.budget != null ? String(d.budget) : '',
    description: d.description ?? '',
    status: d.statusCode ?? 1
  };
}

export default function DepartmentDetail() {
  const { deptId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const id = Number(deptId);

  const [loading, setLoading] = useState(true);
  const [dept, setDept] = useState<Department | null>(null);
  const [members, setMembers] = useState<DepartmentMember[]>([]);
  const [children, setChildren] = useState<Department[]>([]);
  const [deptOptions, setDeptOptions] = useState<DepartmentOption[]>([]);
  const [activeTab, setActiveTab] = useState('basic');

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<EditForm | null>(null);
  const [saving, setSaving] = useState(false);

  const loadDept = useCallback(() => {
    return getDepartmentById(id)
      .then(res => setDept(res.data ?? null))
      .catch(e => toast.error(e.message || t('部門載入失敗')));
  }, [id, t]);

  const loadChildren = useCallback(() => {
    // 下级部门：全量列表按 parentId 过滤（含实时人数）
    return getDepartmentList()
      .then(res => setChildren((res.data ?? []).filter(d => d.parentId === id)))
      .catch(() => setChildren([]));
  }, [id]);

  useEffect(() => {
    if (!Number.isFinite(id)) {
      setLoading(false);
      return;
    }
    Promise.all([
      loadDept(),
      loadChildren(),
      getDepartmentMembers(id)
        .then(res => setMembers(res.data ?? []))
        .catch(() => setMembers([])),
      getDepartmentOptions(id)
        .then(res => setDeptOptions(res.data ?? []))
        .catch(() => {})
    ]).finally(() => setLoading(false));
  }, [id, loadDept, loadChildren]);

  const startEdit = () => {
    if (dept) {
      setForm(toForm(dept));
      setEditing(true);
    }
  };
  const cancelEdit = () => {
    setEditing(false);
    setForm(null);
  };

  const handleSave = async () => {
    if (!dept || !form) return;
    if (!form.name.trim() || !form.code.trim()) {
      toast.error(t('請填寫必填欄位（名稱、代碼）'));
      return;
    }
    setSaving(true);
    try {
      await saveDepartment({
        id: dept.id,
        name: form.name.trim(),
        code: form.code.trim(),
        parentId: form.parentId,
        managerName: form.managerName.trim() || undefined,
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
        budget: form.budget ? Number(form.budget) : undefined,
        description: form.description.trim() || undefined,
        status: form.status
      });
      toast.success(t('部門資料已更新'));
      setEditing(false);
      setForm(null);
      await Promise.all([loadDept(), loadChildren()]);
    } catch (e: any) {
      toast.error(e.message || t('保存失敗'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-24 text-muted-foreground">{t('載入中…')}</div>;
  }

  if (!dept) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground mb-4">{t('找不到該部門')}</p>
        <Button variant="outline" onClick={() => navigate('/organization/departments')}>
          <ArrowLeft className="h-4 w-4 mr-1" /> {t('返回部門列表')}
        </Button>
      </div>
    );
  }

  const budgetText = dept.budget != null ? `HK$ ${dept.budget.toLocaleString()}` : '—';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/organization/departments')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-lg">
              {dept.code.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{dept.name}</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{t('代碼：{{code}}', { code: dept.code })}</span>
                <span>·</span>
                <Badge
                  variant="secondary"
                  className={
                    dept.statusCode === 1
                      ? 'bg-success/10 text-success border-success/20'
                      : 'bg-muted text-muted-foreground'
                  }
                >
                  {t(dept.status)}
                </Badge>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {editing ? (
            <>
              <Button variant="outline" onClick={cancelEdit} disabled={saving}>
                <X className="h-4 w-4 mr-1" />
                {t('取消')}
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-1" />
                {saving ? t('儲存中…') : t('儲存')}
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={startEdit}>
              <Edit className="h-4 w-4 mr-1" />
              {t('編輯')}
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{dept.memberCount ?? members.length}</p>
              <p className="text-xs text-muted-foreground">{t('部門人數')}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <Briefcase className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{children.length}</p>
              <p className="text-xs text-muted-foreground">{t('下級部門')}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <UserCheck className="h-5 w-5 text-success" />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold text-foreground truncate">{dept.managerName || '—'}</p>
              <p className="text-xs text-muted-foreground">{t('部門主管')}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <Target className="h-5 w-5 text-warning" />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold text-foreground truncate">{budgetText}</p>
              <p className="text-xs text-muted-foreground">{t('年度預算')}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content */}
      <div className="flex gap-6">
        {/* Side nav */}
        <div className="w-48 shrink-0 space-y-1 hidden md:block">
          <div className="sticky top-24 space-y-1">
            {sideNav.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  activeTab === item.id
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <item.icon className="h-4 w-4" />
                {t(item.label)}
              </button>
            ))}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Basic Info */}
          {activeTab === 'basic' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('基本資訊')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                  <Field
                    label={t('部門名稱')}
                    required
                    editing={editing}
                    view={dept.name}
                    edit={
                      <Input
                        value={form?.name ?? ''}
                        onChange={e => setForm(f => f && { ...f, name: e.target.value })}
                      />
                    }
                  />
                  <Field
                    label={t('部門代碼')}
                    required
                    editing={editing}
                    view={
                      <span className="flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                        {dept.code}
                      </span>
                    }
                    edit={
                      <Input
                        value={form?.code ?? ''}
                        onChange={e => setForm(f => f && { ...f, code: e.target.value })}
                      />
                    }
                  />
                  <Field
                    label={t('上級部門')}
                    editing={editing}
                    view={dept.parentName || t('頂級部門')}
                    edit={
                      <Select
                        value={form?.parentId != null ? String(form.parentId) : 'none'}
                        onValueChange={v => setForm(f => f && { ...f, parentId: v === 'none' ? undefined : Number(v) })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">{t('頂級部門（無上級）')}</SelectItem>
                          {deptOptions.map(d => (
                            <SelectItem key={d.id} value={String(d.id)}>
                              {d.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    }
                  />
                  <Field
                    label={t('部門主管')}
                    editing={editing}
                    view={
                      <span className="flex items-center gap-1.5">
                        <UserCheck className="h-3.5 w-3.5 text-muted-foreground" />
                        {dept.managerName || '—'}
                      </span>
                    }
                    edit={
                      <Input
                        value={form?.managerName ?? ''}
                        onChange={e => setForm(f => f && { ...f, managerName: e.target.value })}
                      />
                    }
                  />
                  <Field
                    label={t('部門狀態')}
                    editing={editing}
                    view={
                      <Badge
                        variant="secondary"
                        className={
                          dept.statusCode === 1
                            ? 'bg-success/10 text-success border-success/20'
                            : 'bg-muted text-muted-foreground'
                        }
                      >
                        {t(dept.status)}
                      </Badge>
                    }
                    edit={
                      <Select
                        value={String(form?.status ?? 1)}
                        onValueChange={v => setForm(f => f && { ...f, status: Number(v) })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">{t('啟用')}</SelectItem>
                          <SelectItem value="2">{t('停用')}</SelectItem>
                        </SelectContent>
                      </Select>
                    }
                  />
                  <Field
                    label={t('年度預算 (HK$)')}
                    editing={editing}
                    view={budgetText}
                    edit={
                      <Input
                        type="number"
                        value={form?.budget ?? ''}
                        onChange={e => setForm(f => f && { ...f, budget: e.target.value })}
                      />
                    }
                  />
                  <Field
                    label={t('聯絡電話')}
                    editing={editing}
                    view={
                      <span className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                        {dept.phone || '—'}
                      </span>
                    }
                    edit={
                      <Input
                        value={form?.phone ?? ''}
                        onChange={e => setForm(f => f && { ...f, phone: e.target.value })}
                      />
                    }
                  />
                  <Field
                    label={t('部門信箱')}
                    editing={editing}
                    view={
                      <span className="flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                        {dept.email || '—'}
                      </span>
                    }
                    edit={
                      <Input
                        value={form?.email ?? ''}
                        onChange={e => setForm(f => f && { ...f, email: e.target.value })}
                      />
                    }
                  />
                  <div className="space-y-1.5">
                    <Label className="text-muted-foreground text-xs">{t('建立日期')}</Label>
                    <p className="text-sm font-medium">{dept.createdAt || '—'}</p>
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <Label className="text-muted-foreground text-xs">{t('部門職責說明')}</Label>
                    {editing ? (
                      <Textarea
                        rows={3}
                        value={form?.description ?? ''}
                        onChange={e => setForm(f => f && { ...f, description: e.target.value })}
                      />
                    ) : (
                      <p className="text-sm">{dept.description || '—'}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Members */}
          {activeTab === 'members' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('部門成員（{{count}}）', { count: members.length })}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {members.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">{t('目前無在職成員')}</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('姓名')}</TableHead>
                        <TableHead>{t('職位')}</TableHead>
                        <TableHead>{t('工號')}</TableHead>
                        <TableHead>{t('入職日期')}</TableHead>
                        <TableHead>{t('狀態')}</TableHead>
                        <TableHead className="w-12" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {members.map(m => (
                        <TableRow
                          key={m.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => navigate(`/employees/${m.id}`)}
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-7 w-7">
                                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                  {(m.name || '').slice(-2)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{m.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>{m.position || '—'}</TableCell>
                          <TableCell className="text-muted-foreground">{m.employeeNo || '—'}</TableCell>
                          <TableCell className="text-muted-foreground">{m.joinDate || '—'}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={memberStatusColors[m.status] || ''}>
                              {t(m.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}

          {/* Sub-departments */}
          {activeTab === 'sub' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('下級部門（{{count}}）', { count: children.length })}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {children.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">{t('暫無下級部門')}</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('部門名稱')}</TableHead>
                        <TableHead>{t('部門代碼')}</TableHead>
                        <TableHead>{t('負責人')}</TableHead>
                        <TableHead className="text-right">{t('人數')}</TableHead>
                        <TableHead>{t('狀態')}</TableHead>
                        <TableHead className="w-12" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {children.map(sub => (
                        <TableRow
                          key={sub.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => navigate(`/organization/departments/${sub.id}`)}
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              {sub.name}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm text-muted-foreground">{sub.code}</TableCell>
                          <TableCell>{sub.managerName || '—'}</TableCell>
                          <TableCell className="text-right">{sub.memberCount ?? 0}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={subDeptStatusColors[sub.status] || ''}>
                              {t(sub.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}

          {/* KPI（待接口完成后再接） */}
          {activeTab === 'kpi' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('部門 KPI')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <Target className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">{t('部門 KPI 功能開發中，待後端接口完成後接入。')}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

/** 基本信息单元格：编辑态渲染 edit，只读态渲染 view */
function Field({
  edit,
  editing,
  label,
  required,
  view
}: {
  edit: React.ReactNode;
  editing: boolean;
  label: string;
  required?: boolean;
  view: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-muted-foreground text-xs">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {editing ? edit : <div className="text-sm font-medium text-foreground">{view}</div>}
    </div>
  );
}
