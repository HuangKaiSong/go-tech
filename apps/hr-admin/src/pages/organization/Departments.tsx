import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Search, Plus, Users, TrendingUp, Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { hasPerm } from "@/lib/auth";
import { DEPT_PERM } from "@/lib/perms";
import {
  getDepartmentList, getDepartmentOptions, saveDepartment, deleteDepartment,
  type Department, type DepartmentOption,
} from "@/api/department";

const statusColors: Record<string, string> = {
  "啟用": "bg-success/10 text-success border-success/20",
  "停用": "bg-muted text-muted-foreground",
};

/** 新增/编辑表单初始值 */
const emptyForm = {
  id: undefined as number | undefined,
  name: "", code: "", parentId: undefined as number | undefined,
  managerName: "", phone: "", email: "", description: "",
};

export default function Departments() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [list, setList] = useState<Department[]>([]);
  const [options, setOptions] = useState<DepartmentOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [confirmId, setConfirmId] = useState<number | null>(null);

  const reload = useCallback(() => {
    return getDepartmentList()
      .then((res) => setList(res.data ?? []))
      .catch((e) => toast.error(e.message || t("部門載入失敗")));
  }, [t]);

  useEffect(() => {
    reload().finally(() => setLoading(false));
    getDepartmentOptions().then((res) => setOptions(res.data ?? [])).catch(() => {});
  }, [reload]);

  const filtered = list.filter(
    (d) => d.name.includes(search) || d.code.includes(search) || (d.managerName ?? "").includes(search)
  );

  const stats = [
    { label: t("部門總數"), value: list.length, icon: Building2, color: "text-primary" },
    { label: t("啟用中"), value: list.filter((d) => d.statusCode === 1).length, icon: TrendingUp, color: "text-success" },
    { label: t("總人數"), value: list.reduce((s, d) => s + (d.memberCount ?? 0), 0), icon: Users, color: "text-accent" },
  ];

  const openAdd = () => { setForm({ ...emptyForm }); setDialogOpen(true); };
  const openEdit = (d: Department) => {
    setForm({
      id: d.id, name: d.name, code: d.code, parentId: d.parentId,
      managerName: d.managerName ?? "", phone: d.phone ?? "", email: d.email ?? "", description: d.description ?? "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.code.trim()) {
      toast.error(t("請填寫必填欄位（名稱、代碼）"));
      return;
    }
    try {
      await saveDepartment({
        id: form.id,
        name: form.name.trim(),
        code: form.code.trim(),
        parentId: form.parentId,
        managerName: form.managerName.trim() || undefined,
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
        description: form.description.trim() || undefined,
      });
      toast.success(form.id ? t("部門「{{name}}」已更新", { name: form.name }) : t("部門「{{name}}」已新增", { name: form.name }));
      setDialogOpen(false);
      await reload();
      getDepartmentOptions().then((res) => setOptions(res.data ?? [])).catch(() => {});
    } catch (e: any) {
      toast.error(e.message || t("保存失敗"));
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteDepartment(id);
      toast.success(t("部門已刪除"));
      await reload();
    } catch (e: any) {
      toast.error(e.message || t("刪除失敗"));
    }
  };

  // 编辑时上级部门候选需排除自身
  const parentOptions = options.filter((o) => o.id !== form.id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            {t("部門管理")}
          </h1>
          <p className="text-muted-foreground mt-1">{t("管理公司部門架構與人員配置")}</p>
        </div>
        {hasPerm(DEPT_PERM.ADD) && <Button onClick={openAdd}><Plus className="h-4 w-4 mr-2" />{t("新增部門")}</Button>}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted"><s.icon className={`h-5 w-5 ${s.color}`} /></div>
              <div>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
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
              <Input placeholder={t("搜尋部門名稱、代碼、主管...")} className="pl-9 h-9" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("部門代碼")}</TableHead>
                <TableHead>{t("部門名稱")}</TableHead>
                <TableHead>{t("部門主管")}</TableHead>
                <TableHead>{t("上級部門")}</TableHead>
                <TableHead className="text-right">{t("人數")}</TableHead>
                <TableHead>{t("狀態")}</TableHead>
                <TableHead>{t("建立日期")}</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-10">{t("載入中…")}</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-10">{t("尚無部門資料，點擊「新增部門」開始建立。")}</TableCell></TableRow>
              ) : filtered.map((d) => (
                <TableRow key={d.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/organization/departments/${d.id}`)}>
                  <TableCell className="font-mono text-sm">{d.code}</TableCell>
                  <TableCell className="font-medium">{d.name}</TableCell>
                  <TableCell>{d.managerName || "—"}</TableCell>
                  <TableCell>{d.parentName || "—"}</TableCell>
                  <TableCell className="text-right">{d.memberCount ?? 0}</TableCell>
                  <TableCell><Badge variant="secondary" className={statusColors[d.status] || ""}>{t(d.status)}</Badge></TableCell>
                  <TableCell className="text-muted-foreground text-sm">{d.createdAt || "—"}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/organization/departments/${d.id}`); }}>
                          <Eye className="h-4 w-4 mr-2" />{t("查看詳情")}
                        </DropdownMenuItem>
                        {hasPerm(DEPT_PERM.EDIT) && (
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEdit(d); }}>
                            <Pencil className="h-4 w-4 mr-2" />{t("編輯")}
                          </DropdownMenuItem>
                        )}
                        {hasPerm(DEPT_PERM.DELETE) && (
                          <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); setConfirmId(d.id); }}>
                            <Trash2 className="h-4 w-4 mr-2" />{t("刪除")}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 新增/编辑弹窗 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{form.id ? t("編輯部門") : t("新增部門")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("部門名稱")} <span className="text-destructive">*</span></Label>
                <Input placeholder={t("如：技術部")} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>{t("部門代碼")} <span className="text-destructive">*</span></Label>
                <Input placeholder={t("如：TECH")} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("上級部門")}</Label>
                <Select
                  value={form.parentId != null ? String(form.parentId) : ""}
                  onValueChange={(v) => setForm({ ...form, parentId: v ? Number(v) : undefined })}
                >
                  <SelectTrigger><SelectValue placeholder={t("選擇上級部門（頂級可不選）")} /></SelectTrigger>
                  <SelectContent>
                    {parentOptions.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("部門主管")}</Label>
                <Input placeholder={t("主管姓名")} value={form.managerName} onChange={(e) => setForm({ ...form, managerName: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("聯絡電話")}</Label>
                <Input placeholder={t("分機號碼")} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>{t("部門信箱")}</Label>
                <Input type="email" placeholder="dept@company.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("部門職責說明")}</Label>
              <Textarea placeholder={t("簡述部門主要職責與工作範圍...")} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t("取消")}</Button>
            <Button onClick={handleSave}>{form.id ? t("儲存") : t("確認新增")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认 */}
      <AlertDialog open={confirmId != null} onOpenChange={(o) => !o && setConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("確認刪除此部門？")}</AlertDialogTitle>
            <AlertDialogDescription>{t("若該部門下存在子部門將無法刪除。此操作不可撤銷。")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("取消")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (confirmId != null) handleDelete(confirmId); setConfirmId(null); }}>
              {t("確認刪除")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
