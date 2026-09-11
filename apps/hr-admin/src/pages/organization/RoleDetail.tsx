import {
  ArrowLeft,
  Building2,
  ChevronRight,
  DollarSign,
  Edit2,
  FileText,
  Layers,
  Save,
  Shield,
  Users,
  X
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { type DepartmentOption, getDepartmentOptions } from '@/api/department';
import { assignPositionMenus, getMenuTree, getPositionMenuIds, type MenuTreeNode } from '@/api/menu';
import { getPositionById, getPositionMembers, type Position, type PositionMember, savePosition } from '@/api/position';
import { countNodes, MenuTreePicker } from '@/components/organization/MenuTreePicker';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { hasPerm } from '@/lib/auth';
import { POSITION_PERM } from '@/lib/perms';

/** 职等选项 */
const LEVEL_OPTIONS = ['M3', 'M2', 'M1', 'P3', 'P2', 'P1', 'P0'];

const levelColors: Record<string, string> = {
  M3: 'bg-primary/10 text-primary border-primary/20',
  M2: 'bg-primary/10 text-primary border-primary/20',
  M1: 'bg-primary/10 text-primary border-primary/20',
  P3: 'bg-accent/10 text-accent border-accent/20',
  P2: 'bg-accent/10 text-accent border-accent/20',
  P1: 'bg-warning/10 text-warning border-warning/20',
  P0: 'bg-muted text-muted-foreground'
};

/** 员工状态色（对齐 EmployeeStatusEnum 文案） */
const memberStatusColors: Record<string, string> = {
  在職: 'bg-success/10 text-success border-success/20',
  休假中: 'bg-accent/10 text-accent border-accent/20',
  待入職: 'bg-warning/10 text-warning border-warning/20',
  待HR完善: 'bg-warning/10 text-warning border-warning/20',
  已邀請待填: 'bg-muted text-muted-foreground',
  待離職: 'bg-destructive/10 text-destructive border-destructive/20',
  已離職: 'bg-destructive/10 text-destructive border-destructive/20'
};

const sections = [
  { id: 'basic', label: '基本資訊', icon: FileText },
  { id: 'members', label: '在職人員', icon: Users },
  { id: 'menus', label: '菜單授權', icon: Shield }
];

/** 编辑表单结构 */
interface EditForm {
  code: string;
  departmentId?: number;
  description: string;
  level: string;
  salaryMax: string;
  salaryMin: string;
  salaryRange: string;
  status: number;
  title: string;
}

function toForm(p: Position): EditForm {
  return {
    title: p.title,
    code: p.code ?? '',
    departmentId: p.departmentId,
    level: p.level ?? '',
    salaryRange: p.salaryRange ?? '',
    salaryMin: p.salaryMin != null ? String(p.salaryMin) : '',
    salaryMax: p.salaryMax != null ? String(p.salaryMax) : '',
    description: p.description ?? '',
    status: p.statusCode ?? 1
  };
}

export default function RoleDetail() {
  const { roleId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const id = Number(roleId);

  const [loading, setLoading] = useState(true);
  const [position, setPosition] = useState<Position | null>(null);
  const [members, setMembers] = useState<PositionMember[]>([]);
  const [depts, setDepts] = useState<DepartmentOption[]>([]);
  const [activeSection, setActiveSection] = useState('basic');

  // 基本信息编辑
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<EditForm | null>(null);
  const [saving, setSaving] = useState(false);

  // 菜单授权
  const [menuTree, setMenuTree] = useState<MenuTreeNode[]>([]);
  const [menuChecked, setMenuChecked] = useState<Set<number>>(new Set());
  const [menuSaving, setMenuSaving] = useState(false);

  const loadPosition = useCallback(() => {
    return getPositionById(id)
      .then(res => setPosition(res.data ?? null))
      .catch(e => toast.error(e.message || t('職位載入失敗')));
  }, [id, t]);

  useEffect(() => {
    if (!Number.isFinite(id)) {
      setLoading(false);
      return;
    }
    Promise.all([
      loadPosition(),
      getPositionMembers(id)
        .then(res => setMembers(res.data ?? []))
        .catch(() => setMembers([])),
      getDepartmentOptions()
        .then(res => setDepts(res.data ?? []))
        .catch(() => {}),
      getMenuTree()
        .then(res => setMenuTree(res.data ?? []))
        .catch(() => {}),
      getPositionMenuIds(id)
        .then(res => setMenuChecked(new Set(res.data ?? [])))
        .catch(() => {})
    ]).finally(() => setLoading(false));
  }, [id, loadPosition]);

  const scrollTo = (sid: string) => {
    setActiveSection(sid);
    document.getElementById(sid)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const startEdit = () => {
    if (position) {
      setForm(toForm(position));
      setEditing(true);
    }
  };
  const cancelEdit = () => {
    setEditing(false);
    setForm(null);
  };

  const handleSave = async () => {
    if (!position || !form) return;
    if (!form.title.trim() || form.departmentId == null) {
      toast.error(t('請填寫必填欄位（名稱、所屬部門）'));
      return;
    }
    setSaving(true);
    try {
      // 不传 menuIds，避免动到菜单授权（授权在下方独立保存）
      await savePosition({
        id: position.id,
        title: form.title.trim(),
        departmentId: form.departmentId,
        code: form.code.trim() || undefined,
        level: form.level || undefined,
        salaryRange: form.salaryRange.trim() || undefined,
        salaryMin: form.salaryMin ? Number(form.salaryMin) : undefined,
        salaryMax: form.salaryMax ? Number(form.salaryMax) : undefined,
        description: form.description.trim() || undefined,
        status: form.status
      });
      toast.success(t('職位資料已更新'));
      setEditing(false);
      setForm(null);
      await loadPosition();
    } catch (e: any) {
      toast.error(e.message || t('保存失敗'));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveMenus = async () => {
    if (!position) return;
    setMenuSaving(true);
    try {
      await assignPositionMenus(position.id, Array.from(menuChecked));
      toast.success(t('菜單權限已保存'));
    } catch (e: any) {
      toast.error(e.message || t('保存失敗'));
    } finally {
      setMenuSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-24 text-muted-foreground">{t('載入中…')}</div>;
  }

  if (!position) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground mb-4">{t('找不到該職位')}</p>
        <Button variant="outline" onClick={() => navigate('/organization/roles')}>
          <ArrowLeft className="h-4 w-4 mr-1" /> {t('返回職位列表')}
        </Button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="page-header flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/organization/roles')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="page-title">{position.title}</h1>
              {position.level && (
                <Badge variant="outline" className={levelColors[position.level] || ''}>
                  {position.level}
                </Badge>
              )}
              <Badge
                variant="secondary"
                className={position.statusCode === 1 ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}
              >
                {t(position.status)}
              </Badge>
            </div>
            <p className="page-description">
              {position.departmentName || '—'}
              {position.createdAt ? ` · ${t('建立於 {{date}}', { date: position.createdAt })}` : ''}
            </p>
          </div>
        </div>
        {editing ? (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={cancelEdit} disabled={saving}>
              <X className="h-4 w-4 mr-1" />
              {t('取消')}
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-1" />
              {saving ? t('儲存中…') : t('儲存')}
            </Button>
          </div>
        ) : (
          hasPerm(POSITION_PERM.EDIT) && (
            <Button variant="outline" size="sm" onClick={startEdit}>
              <Edit2 className="h-4 w-4 mr-1" />
              {t('編輯')}
            </Button>
          )
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          {
            label: t('在職人數'),
            value: String(position.memberCount ?? members.length),
            icon: Users,
            color: 'text-primary'
          },
          { label: t('職等'), value: position.level || '—', icon: Layers, color: 'text-accent' },
          { label: t('薪資範圍'), value: position.salaryRange || '—', icon: DollarSign, color: 'text-success' },
          { label: t('所屬部門'), value: position.departmentName || '—', icon: Building2, color: 'text-warning' }
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="p-2 rounded-lg bg-muted">
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-lg font-bold truncate">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-6">
        {/* Side nav */}
        <div className="hidden md:block w-48 shrink-0">
          <div className="sticky top-24 space-y-1">
            {sections.map(s => (
              <button
                key={s.id}
                onClick={() => scrollTo(s.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${activeSection === s.id ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted'}`}
              >
                <s.icon className="h-4 w-4" />
                {t(s.label)}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-6 min-w-0">
          {/* Basic Info */}
          <Card id="basic">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4 text-primary" /> {t('基本資訊')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                <Field
                  label={t('職位名稱')}
                  required
                  editing={editing}
                  view={position.title}
                  edit={
                    <Input
                      value={form?.title ?? ''}
                      onChange={e => setForm(f => f && { ...f, title: e.target.value })}
                    />
                  }
                />
                <Field
                  label={t('職位代碼')}
                  editing={editing}
                  view={position.code || '—'}
                  edit={
                    <Input value={form?.code ?? ''} onChange={e => setForm(f => f && { ...f, code: e.target.value })} />
                  }
                />
                <Field
                  label={t('所屬部門')}
                  required
                  editing={editing}
                  view={position.departmentName || '—'}
                  edit={
                    <Select
                      value={form?.departmentId != null ? String(form.departmentId) : ''}
                      onValueChange={v => setForm(f => f && { ...f, departmentId: v ? Number(v) : undefined })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('選擇部門')} />
                      </SelectTrigger>
                      <SelectContent>
                        {depts.map(d => (
                          <SelectItem key={d.id} value={String(d.id)}>
                            {d.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  }
                />
                <Field
                  label={t('職等')}
                  editing={editing}
                  view={position.level || '—'}
                  edit={
                    <Select value={form?.level ?? ''} onValueChange={v => setForm(f => f && { ...f, level: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('選擇職等')} />
                      </SelectTrigger>
                      <SelectContent>
                        {LEVEL_OPTIONS.map(l => (
                          <SelectItem key={l} value={l}>
                            {l}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  }
                />
                <Field
                  label={t('薪資範圍')}
                  editing={editing}
                  view={position.salaryRange || '—'}
                  edit={
                    <Input
                      placeholder={t('如：40K-65K')}
                      value={form?.salaryRange ?? ''}
                      onChange={e => setForm(f => f && { ...f, salaryRange: e.target.value })}
                    />
                  }
                />
                <Field
                  label={t('狀態')}
                  editing={editing}
                  view={t(position.status)}
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
                  label={t('薪資下限 (HK$)')}
                  editing={editing}
                  view={position.salaryMin != null ? String(position.salaryMin) : '—'}
                  edit={
                    <Input
                      type="number"
                      value={form?.salaryMin ?? ''}
                      onChange={e => setForm(f => f && { ...f, salaryMin: e.target.value })}
                    />
                  }
                />
                <Field
                  label={t('薪資上限 (HK$)')}
                  editing={editing}
                  view={position.salaryMax != null ? String(position.salaryMax) : '—'}
                  edit={
                    <Input
                      type="number"
                      value={form?.salaryMax ?? ''}
                      onChange={e => setForm(f => f && { ...f, salaryMax: e.target.value })}
                    />
                  }
                />
                <div className="space-y-1.5">
                  <Label className="text-muted-foreground text-xs">{t('在職人數')}</Label>
                  <p className="text-sm font-medium">{position.memberCount ?? members.length}</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-muted-foreground text-xs">{t('建立日期')}</Label>
                  <p className="text-sm font-medium">{position.createdAt || '—'}</p>
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-muted-foreground text-xs">{t('職位描述')}</Label>
                  {editing ? (
                    <Textarea
                      rows={3}
                      value={form?.description ?? ''}
                      onChange={e => setForm(f => f && { ...f, description: e.target.value })}
                    />
                  ) : (
                    <p className="text-sm">{position.description || '—'}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Members */}
          <Card id="members">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4 text-primary" /> {t('在職人員')}
                <Badge variant="secondary" className="ml-1">
                  {members.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {members.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">{t('目前無在職人員')}</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('姓名')}</TableHead>
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
                              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                {(m.name || '').slice(-2)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{m.name}</span>
                          </div>
                        </TableCell>
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

          {/* Menu authorization */}
          <Card id="menus">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" /> {t('菜單授權')}
                  <span className="text-xs font-normal text-muted-foreground">
                    {t('已選 {{checked}} / {{total}}', { checked: menuChecked.size, total: countNodes(menuTree) })}
                  </span>
                </span>
                {hasPerm(POSITION_PERM.ASSIGN_MENU) && (
                  <Button size="sm" onClick={handleSaveMenus} disabled={menuSaving}>
                    <Save className="h-4 w-4 mr-1" />
                    {menuSaving ? t('保存中…') : t('保存授權')}
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-2">
                {t('勾選該職位可存取的菜單與按鈕，勾選目錄會級聯選中其下全部子項。')}
              </p>
              <div className="max-h-96 overflow-y-auto border rounded p-2">
                <MenuTreePicker tree={menuTree} checked={menuChecked} onChange={setMenuChecked} />
              </div>
            </CardContent>
          </Card>
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
      {editing ? edit : <p className="text-sm font-medium">{view}</p>}
    </div>
  );
}
