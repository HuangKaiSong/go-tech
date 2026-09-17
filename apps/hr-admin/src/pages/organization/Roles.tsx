import {
  BarChart3,
  Building2,
  Eye,
  Filter,
  Layers,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  Users
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { type DepartmentOption, getDepartmentOptions } from '@/api/department';
import { getMenuTree, getPositionMenuIds, type MenuTreeNode } from '@/api/menu';
import { deletePosition, getPositionList, type Position, savePosition } from '@/api/position';
import { AssignMenuDialog } from '@/components/organization/AssignMenuDialog';
import { collectAllIds, countNodes, MenuTreePicker } from '@/components/organization/MenuTreePicker';
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
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { hasPerm } from '@/lib/auth';
import { POSITION_PERM } from '@/lib/perms';

/** 职等选项 */
const LEVEL_OPTIONS = ['M3', 'M2', 'M1', 'P3', 'P2', 'P1', 'P0'];

const statusColors: Record<string, string> = {
  啟用: 'bg-success/10 text-success border-success/20',
  停用: 'bg-muted text-muted-foreground'
};

const levelColors: Record<string, string> = {
  M3: 'bg-primary/10 text-primary border-primary/20',
  M2: 'bg-primary/10 text-primary border-primary/20',
  M1: 'bg-primary/10 text-primary border-primary/20',
  P3: 'bg-accent/10 text-accent border-accent/20',
  P2: 'bg-accent/10 text-accent border-accent/20',
  P1: 'bg-warning/10 text-warning border-warning/20',
  P0: 'bg-muted text-muted-foreground'
};

/** 新增/编辑表单初始值 */
const emptyForm = {
  id: undefined as number | undefined,
  title: '',
  code: '',
  departmentId: undefined as number | undefined,
  level: '',
  salaryRange: '',
  salaryMin: '',
  salaryMax: '',
  description: ''
};

export default function Roles() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [list, setList] = useState<Position[]>([]);
  const [depts, setDepts] = useState<DepartmentOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [assignFor, setAssignFor] = useState<Position | null>(null);
  // 新增/编辑弹窗内的菜单树勾选（一并分配菜单）
  const [menuTree, setMenuTree] = useState<MenuTreeNode[]>([]);
  const [menuChecked, setMenuChecked] = useState<Set<number>>(new Set());

  const reload = useCallback(() => {
    return getPositionList()
      .then(res => setList(res.data ?? []))
      .catch(e => toast.error(e.message || t('職位載入失敗')));
  }, [t]);

  useEffect(() => {
    reload().finally(() => setLoading(false));
    getDepartmentOptions()
      .then(res => setDepts(res.data ?? []))
      .catch(() => {});
    getMenuTree()
      .then(res => setMenuTree(res.data ?? []))
      .catch(() => {});
  }, [reload]);

  const filtered = list.filter(r => {
    const matchSearch =
      r.title.includes(search) || (r.level ?? '').includes(search) || (r.departmentName ?? '').includes(search);
    const matchDept = filterDept === 'all' || String(r.departmentId) === filterDept;
    return matchSearch && matchDept;
  });

  const totalHeadcount = list.reduce((s, r) => s + (r.memberCount ?? 0), 0);
  const activeCount = list.filter(r => r.statusCode === 1).length;
  const deptCoverage = new Set(list.map(r => r.departmentId).filter(Boolean)).size;

  const openAdd = () => {
    setForm({ ...emptyForm });
    setMenuChecked(new Set());
    setDialogOpen(true);
  };
  const openEdit = (r: Position) => {
    setForm({
      id: r.id,
      title: r.title,
      code: r.code ?? '',
      departmentId: r.departmentId,
      level: r.level ?? '',
      salaryRange: r.salaryRange ?? '',
      salaryMin: r.salaryMin !== null ? String(r.salaryMin) : '',
      salaryMax: r.salaryMax !== null ? String(r.salaryMax) : '',
      description: r.description ?? ''
    });
    // 编辑：回显该职位已授权的菜单
    setMenuChecked(new Set());
    getPositionMenuIds(r.id)
      .then(res => setMenuChecked(new Set(res.data ?? [])))
      .catch(() => {});
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || form.departmentId === null) {
      toast.error(t('請填寫必填欄位（名稱、所屬部門）'));
      return;
    }
    try {
      await savePosition({
        id: form.id,
        title: form.title.trim(),
        departmentId: form.departmentId,
        code: form.code.trim() || undefined,
        level: form.level || undefined,
        salaryRange: form.salaryRange.trim() || undefined,
        salaryMin: form.salaryMin ? Number(form.salaryMin) : undefined,
        salaryMax: form.salaryMax ? Number(form.salaryMax) : undefined,
        description: form.description.trim() || undefined,
        menuIds: Array.from(menuChecked)
      });
      toast.success(
        form.id
          ? t('職位「{{title}}」已更新', { title: form.title })
          : t('職位「{{title}}」已新增', { title: form.title })
      );
      setDialogOpen(false);
      await reload();
    } catch (e: any) {
      toast.error(e.message || t('保存失敗'));
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deletePosition(id);
      toast.success(t('職位已刪除'));
      await reload();
    } catch (e: any) {
      toast.error(e.message || t('刪除失敗'));
    }
  };

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            {t('職位管理')}
          </h1>
          <p className="page-description">{t('管理公司職位與職等體系')}</p>
        </div>
        {hasPerm(POSITION_PERM.ADD) && (
          <Button size="sm" onClick={openAdd}>
            <Plus className="h-4 w-4 mr-1" />
            {t('新增職位')}
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: t('職位總數'), value: list.length, icon: Layers, color: 'text-primary' },
          { label: t('啟用中'), value: activeCount, icon: Building2, color: 'text-success' },
          { label: t('在職人數'), value: totalHeadcount, icon: Users, color: 'text-accent' },
          { label: t('部門覆蓋'), value: deptCoverage, icon: BarChart3, color: 'text-warning' }
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="p-2 rounded-lg bg-muted">
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="text-2xl font-bold">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('搜尋職位名稱、職等...')}
                className="pl-9 h-9"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <Select value={filterDept} onValueChange={setFilterDept}>
              <SelectTrigger className="w-[160px] h-9">
                <Filter className="h-4 w-4 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('全部部門')}</SelectItem>
                {depts.map(d => (
                  <SelectItem key={d.id} value={String(d.id)}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('職位名稱')}</TableHead>
                <TableHead>{t('職等')}</TableHead>
                <TableHead>{t('所屬部門')}</TableHead>
                <TableHead>{t('在職人數')}</TableHead>
                <TableHead>{t('狀態')}</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                    {t('載入中…')}
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                    {t('尚無職位資料，點擊「新增職位」開始建立。')}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map(role => (
                  <TableRow
                    key={role.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/organization/roles/${role.id}`)}
                  >
                    <TableCell className="font-medium">{role.title}</TableCell>
                    <TableCell>
                      {role.level ? (
                        <Badge variant="outline" className={levelColors[role.level] || ''}>
                          {role.level}
                        </Badge>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell>{role.departmentName || '—'}</TableCell>
                    <TableCell>{role.memberCount ?? 0}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={statusColors[role.status] || ''}>
                        {t(role.status)}
                      </Badge>
                    </TableCell>
                    <TableCell onClick={e => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/organization/roles/${role.id}`)}>
                            <Eye className="h-4 w-4 mr-2" />
                            {t('查看詳情')}
                          </DropdownMenuItem>
                          {hasPerm(POSITION_PERM.ASSIGN_MENU) && (
                            <DropdownMenuItem onClick={() => setAssignFor(role)}>
                              <ShieldCheck className="h-4 w-4 mr-2" />
                              {t('分配菜單')}
                            </DropdownMenuItem>
                          )}
                          {hasPerm(POSITION_PERM.EDIT) && (
                            <DropdownMenuItem onClick={() => openEdit(role)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              {t('編輯')}
                            </DropdownMenuItem>
                          )}
                          {hasPerm(POSITION_PERM.DELETE) && (
                            <DropdownMenuItem className="text-destructive" onClick={() => setConfirmId(role.id)}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              {t('刪除')}
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 新增/编辑弹窗 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? t('編輯職位') : t('新增職位')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  {t('職位名稱')} <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder={t('例如：前端工程師')}
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>
                  {t('所屬部門')} <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={form.departmentId !== null ? String(form.departmentId) : ''}
                  onValueChange={v => setForm({ ...form, departmentId: v ? Number(v) : undefined })}
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
              </div>
              <div className="space-y-2">
                <Label>{t('職等')}</Label>
                <Select value={form.level} onValueChange={v => setForm({ ...form, level: v })}>
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
              </div>
              <div className="space-y-2">
                <Label>{t('職位代碼')}</Label>
                <Input
                  placeholder={t('如：FE-ENG')}
                  value={form.code}
                  onChange={e => setForm({ ...form, code: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>{t('薪資範圍')}</Label>
                <Input
                  placeholder={t('如：40K-65K')}
                  value={form.salaryRange}
                  onChange={e => setForm({ ...form, salaryRange: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('薪資下限')}</Label>
                <Input
                  type="number"
                  placeholder="HK$"
                  value={form.salaryMin}
                  onChange={e => setForm({ ...form, salaryMin: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('薪資上限')}</Label>
                <Input
                  type="number"
                  placeholder="HK$"
                  value={form.salaryMax}
                  onChange={e => setForm({ ...form, salaryMax: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('職位描述')}</Label>
              <Textarea
                placeholder={t('簡述該職位的職責與要求...')}
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{t('可存取菜單')}</Label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="text-xs text-primary hover:underline"
                    onClick={() => setMenuChecked(new Set(collectAllIds(menuTree)))}
                  >
                    {t('全選')}
                  </button>
                  <button
                    type="button"
                    className="text-xs text-primary hover:underline"
                    onClick={() => setMenuChecked(new Set())}
                  >
                    {t('全不選')}
                  </button>
                  <span className="text-xs text-muted-foreground">
                    {t('已選 {{checked}} / {{total}}', { checked: menuChecked.size, total: countNodes(menuTree) })}
                  </span>
                </div>
              </div>
              <div className="max-h-56 overflow-y-auto border rounded p-2">
                <MenuTreePicker tree={menuTree} checked={menuChecked} onChange={setMenuChecked} />
              </div>
              <p className="text-xs text-muted-foreground">
                {t('勾選目錄會級聯選中其下全部子項；此處分配即該職位可存取的菜單。')}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {t('取消')}
            </Button>
            <Button onClick={handleSave}>{form.id ? t('儲存') : t('確認新增')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 分配菜单弹窗 */}
      <AssignMenuDialog
        positionId={assignFor?.id ?? null}
        positionTitle={assignFor?.title}
        open={assignFor !== null}
        onClose={() => setAssignFor(null)}
      />

      {/* 删除确认 */}
      <AlertDialog open={confirmId !== null} onOpenChange={o => !o && setConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('確認刪除此職位？')}</AlertDialogTitle>
            <AlertDialogDescription>{t('將一併清除該職位的菜單授權關係。此操作不可撤銷。')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('取消')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmId !== null) handleDelete(confirmId);
                setConfirmId(null);
              }}
            >
              {t('確認刪除')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
