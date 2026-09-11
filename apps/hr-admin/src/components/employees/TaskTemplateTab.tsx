import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, RotateCcw, ListChecks, Loader2, UserCog, User } from "lucide-react";
import { toast } from "sonner";
import {
  getTaskTemplates, saveTaskTemplate, toggleTaskTemplate, deleteTaskTemplate, resetTaskTemplates,
  type TaskTemplate,
} from "@/api/lifecycleTemplate";

/** 各業務類型的建議分類（值留繁體、顯示 t()）。編輯既有項時其分類會併入選項，避免丟值 */
const CATEGORY_OPTIONS: Record<number, string[]> = {
  1: ["文件", "薪資", "IT", "行政", "培訓"],
  2: ["審批流程", "工作交接", "資產歸還", "帳號權限", "薪資結算", "離職面談"],
};

/** 負責方展示 */
function assigneeText(t: (k: string) => string, type: number) {
  return type === 2 ? t("員工") : t("HR");
}

/** 截止日偏移展示：0=當天，正負顯示 +N/-N 天 */
function offsetText(t: (k: string, o?: Record<string, unknown>) => string, n: number) {
  if (!n) return t("當天");
  return n > 0 ? t("+{{n}} 天", { n }) : t("{{n}} 天", { n });
}

export default function TaskTemplateTab({ bizType }: { bizType: number }) {
  const { t } = useTranslation();
  const [list, setList] = useState<TaskTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TaskTemplate | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TaskTemplate | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    getTaskTemplates(bizType)
      .then((res) => setList(res.data ?? []))
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, [bizType]);
  useEffect(() => { load(); }, [load]);

  const enabledCount = list.filter((x) => x.enabled === 1).length;

  const handleToggle = async (row: TaskTemplate, v: boolean) => {
    try {
      await toggleTaskTemplate(row.id, v ? 1 : 0);
      setList((prev) => prev.map((x) => (x.id === row.id ? { ...x, enabled: v ? 1 : 0 } : x)));
      toast.success(v ? t("已啟用") : t("已停用"));
    } catch (err: any) {
      toast.error(err.message || t("操作失敗"));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteTaskTemplate(deleteTarget.id);
      toast.success(t("已刪除"));
      setDeleteTarget(null);
      load();
    } catch (err: any) {
      toast.error(err.message || t("刪除失敗"));
    }
  };

  const handleReset = async () => {
    try {
      await resetTaskTemplates(bizType);
      toast.success(t("已恢復默認清單"));
      setConfirmReset(false);
      load();
    } catch (err: any) {
      toast.error(err.message || t("操作失敗"));
    }
  };

  return (
    <div className="space-y-4">
      {/* 工具列 */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {t("配置建單時自動生成的任務清單；停用的項目不會生成。未配置任何項目時建單將回退內置默認。")}
        </p>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => setConfirmReset(true)}>
            <RotateCcw className="h-4 w-4 mr-1" />{t("恢復默認")}
          </Button>
          <Button size="sm" onClick={() => { setEditing(null); setDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" />{t("新增任務")}
          </Button>
        </div>
      </div>

      {/* 統計卡 */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-muted"><ListChecks className="h-5 w-5 text-primary" /></div>
          <div><p className="text-2xl font-bold">{list.length}</p><p className="text-xs text-muted-foreground">{t("模板總數")}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-muted"><ListChecks className="h-5 w-5 text-success" /></div>
          <div><p className="text-2xl font-bold">{enabledCount}</p><p className="text-xs text-muted-foreground">{t("已啟用")}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-muted"><UserCog className="h-5 w-5 text-warning" /></div>
          <div><p className="text-2xl font-bold">{list.filter((x) => x.assigneeType === 1).length}</p><p className="text-xs text-muted-foreground">{t("HR 負責")}</p></div>
        </CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">{t("排序")}</TableHead>
                <TableHead>{t("任務名稱")}</TableHead>
                <TableHead>{t("分類")}</TableHead>
                <TableHead>{t("負責方")}</TableHead>
                <TableHead>{t("截止日")}</TableHead>
                <TableHead>{t("啟用")}</TableHead>
                <TableHead className="w-24 text-right">{t("操作")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="text-muted-foreground">{row.sort}</TableCell>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell><Badge variant="outline" className="font-normal">{t(row.category)}</Badge></TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1 text-sm">
                      {row.assigneeType === 2 ? <User className="h-3.5 w-3.5" /> : <UserCog className="h-3.5 w-3.5" />}
                      {assigneeText(t, row.assigneeType)}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{offsetText(t, row.dueOffsetDays)}</TableCell>
                  <TableCell>
                    <Switch checked={row.enabled === 1} onCheckedChange={(v) => handleToggle(row, v)} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditing(row); setDialogOpen(true); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteTarget(row)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {list.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    {loading ? (
                      <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />{t("載入中...")}</span>
                    ) : t("尚未配置任務模板，建單時將使用內置默認清單")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <TemplateEditDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        bizType={bizType}
        editing={editing}
        onSaved={load}
      />

      {/* 刪除確認 */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => { if (!v) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("確認刪除該任務模板？")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("刪除後新建的單據將不再包含「{{name}}」，已建立的單據不受影響。", { name: deleteTarget?.name ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("取消")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>{t("確定刪除")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 恢復默認確認 */}
      <AlertDialog open={confirmReset} onOpenChange={setConfirmReset}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("確認恢復默認清單？")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("將清空當前所有模板並寫回系統內置的默認清單，此操作不可撤銷。已建立的單據不受影響。")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("取消")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset}>{t("確認恢復")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ===== 新增/編輯任務模板彈窗 ===== */
function TemplateEditDialog({
  open, onOpenChange, bizType, editing, onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  bizType: number;
  editing: TaskTemplate | null;
  onSaved: () => void;
}) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [assigneeType, setAssigneeType] = useState("1");
  const [dueOffsetDays, setDueOffsetDays] = useState("0");
  const [sort, setSort] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setName(editing.name);
      setCategory(editing.category);
      setAssigneeType(String(editing.assigneeType));
      setDueOffsetDays(String(editing.dueOffsetDays ?? 0));
      setSort(String(editing.sort ?? ""));
      setEnabled(editing.enabled === 1);
    } else {
      setName(""); setCategory(""); setAssigneeType("1"); setDueOffsetDays("0"); setSort(""); setEnabled(true);
    }
  }, [open, editing]);

  // 分類選項：內置建議 + 編輯項既有值（去重），值留繁體、顯示 t()
  const baseCats = CATEGORY_OPTIONS[bizType] ?? [];
  const categoryOptions = category && !baseCats.includes(category) ? [category, ...baseCats] : baseCats;

  const submit = async () => {
    if (!name.trim()) { toast.error(t("請填寫任務名稱")); return; }
    if (!category) { toast.error(t("請選擇任務分類")); return; }
    setSubmitting(true);
    try {
      await saveTaskTemplate({
        id: editing?.id,
        bizType,
        name: name.trim(),
        category,
        assigneeType: Number(assigneeType),
        dueOffsetDays: Number(dueOffsetDays) || 0,
        sort: sort === "" ? undefined : Number(sort),
        enabled: enabled ? 1 : 0,
      });
      toast.success(t("已保存"));
      onSaved();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || t("保存失敗"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? t("編輯任務模板") : t("新增任務模板")}</DialogTitle>
          <DialogDescription>{t("配置該項在建單時如何生成到任務清單")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-sm">{t("任務名稱")} <span className="text-destructive">*</span></Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("例如：勞動合約簽署")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm">{t("分類")} <span className="text-destructive">*</span></Label>
              <Select value={category || undefined} onValueChange={setCategory}>
                <SelectTrigger><SelectValue placeholder={t("請選擇")} /></SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((c) => <SelectItem key={c} value={c}>{t(c)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">{t("負責方")}</Label>
              <Select value={assigneeType} onValueChange={setAssigneeType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">{t("HR")}</SelectItem>
                  <SelectItem value="2">{t("員工")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">{t("截止日偏移（天）")}</Label>
              <Input type="number" value={dueOffsetDays} onChange={(e) => setDueOffsetDays(e.target.value)} />
              <p className="text-xs text-muted-foreground">{t("相對入/離職日，0=當天")}</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">{t("排序")}</Label>
              <Input type="number" value={sort} onChange={(e) => setSort(e.target.value)} placeholder={t("留空排到末尾")} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={enabled} onCheckedChange={setEnabled} />
            <Label className="text-sm">{t("啟用")}</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>{t("取消")}</Button>
          <Button onClick={submit} disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
            {t("保存")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
