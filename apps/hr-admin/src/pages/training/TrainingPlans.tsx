import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { DataPagination } from "@/components/common/DataPagination";
import {
  GraduationCap, Plus, Search, BookOpen, Users, Eye,
  Layers, Target, UserPlus, Send, Trash2, Loader2
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { hasPerm } from "@/lib/auth";
import { TRAINING_PERM } from "@/lib/perms";
import {
  getTrainingPlanPage, saveTrainingPlan, publishTrainingPlan, deleteTrainingPlan,
  type TrainingPlan, type TrainingTargetType,
} from "@/api/training";
import { getDepartmentOptions } from "@/api/department";
import { getPositionOptions } from "@/api/position";

const typeOptions = ["入職培訓", "職位培訓", "技能培訓", "管理培訓", "合規培訓"];

const statusOptions = [
  { value: 0, label: "草稿" },
  { value: 1, label: "已發佈" },
  { value: 2, label: "進行中" },
  { value: 3, label: "已結束" },
];

const targetTypeOptions: { value: TrainingTargetType; label: string }[] = [
  { value: "all_new", label: "所有新員工" },
  { value: "position", label: "指定職位" },
  { value: "department", label: "指定部門" },
  { value: "manual", label: "手動指定" },
];

const statusColors: Record<string, string> = {
  "草稿": "bg-muted text-muted-foreground border-border",
  "已發佈": "bg-primary/10 text-primary border-primary/20",
  "進行中": "bg-warning/10 text-warning border-warning/20",
  "已結束": "bg-success/10 text-success border-success/20",
};

const typeColors: Record<string, string> = {
  "入職培訓": "bg-primary/10 text-primary border-primary/20",
  "職位培訓": "bg-accent/10 text-accent-foreground border-accent/20",
  "技能培訓": "bg-warning/10 text-warning border-warning/20",
  "管理培訓": "bg-success/10 text-success border-success/20",
  "合規培訓": "bg-destructive/10 text-destructive border-destructive/20",
};

interface FormData {
  name: string;
  type: string;
  targetType: TrainingTargetType;
  targetPositionIds: number[];
  targetDepartmentIds: number[];
  mandatory: boolean;
  estimatedHours: string;
  description: string;
}

const emptyForm: FormData = {
  name: "", type: "入職培訓", targetType: "all_new",
  targetPositionIds: [], targetDepartmentIds: [],
  mandatory: true, estimatedHours: "", description: "",
};

export default function TrainingPlans() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [current, setCurrent] = useState(1);
  const [size, setSize] = useState(10);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<TrainingPlan | null>(null);

  const params = {
    current, size,
    keyword: search || undefined,
    type: typeFilter === "all" ? undefined : typeFilter,
    planStatus: statusFilter === "all" ? undefined : Number(statusFilter),
  };

  const { data, isLoading } = useQuery({
    queryKey: ["training-plans", params],
    queryFn: () => getTrainingPlanPage(params).then((r) => r.data),
  });

  const rows = data?.records ?? [];
  const total = data?.total ?? 0;

  // 目标选择的选项（仅在弹窗打开时拉取）
  const { data: departments = [] } = useQuery({
    queryKey: ["dept-options"],
    queryFn: () => getDepartmentOptions().then((r) => r.data),
    enabled: dialogOpen,
  });
  const { data: positions = [] } = useQuery({
    queryKey: ["position-options"],
    queryFn: () => getPositionOptions().then((r) => r.data),
    enabled: dialogOpen,
  });

  const saveMutation = useMutation({
    mutationFn: saveTrainingPlan,
    onSuccess: (r) => {
      toast.success(t("培訓計劃「{{name}}」已建立", { name: form.name }));
      setForm(emptyForm);
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["training-plans"] });
      if (r.data) navigate(`/training/plans/${r.data}`);
    },
    onError: (e: any) => toast.error(e?.message || t("建立失敗")),
  });

  const publishMutation = useMutation({
    mutationFn: publishTrainingPlan,
    onSuccess: () => {
      toast.success(t("培訓計劃已發佈"));
      queryClient.invalidateQueries({ queryKey: ["training-plans"] });
    },
    onError: (e: any) => toast.error(e?.message || t("發佈失敗")),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTrainingPlan,
    onSuccess: () => {
      toast.success(t("培訓計劃已刪除"));
      queryClient.invalidateQueries({ queryKey: ["training-plans"] });
    },
    onError: (e: any) => toast.error(e?.message || t("刪除失敗")),
  });

  const resetFilters = () => { setSearch(""); setTypeFilter("all"); setStatusFilter("all"); setCurrent(1); };

  const stats = useMemo(() => {
    const activePlans = rows.filter((r) => r.planStatus === 1 || r.planStatus === 2).length;
    const totalParticipants = rows.reduce((s, r) => s + (r.participantCount ?? 0), 0);
    const withParticipants = rows.filter((r) => (r.participantCount ?? 0) > 0);
    const avgCompletion = withParticipants.length > 0
      ? Math.round(withParticipants.reduce((s, r) => s + (r.completedCount / r.participantCount) * 100, 0) / withParticipants.length)
      : 0;
    return [
      { label: "培訓計劃總數", value: t("{{n}} 個", { n: total }), icon: BookOpen, color: "text-primary" },
      { label: "本頁進行中/已發佈", value: t("{{n}} 個", { n: activePlans }), icon: Target, color: "text-warning" },
      { label: "本頁參訓人次", value: t("{{n}} 人", { n: totalParticipants }), icon: Users, color: "text-success" },
      { label: "本頁平均完成率", value: `${avgCompletion}%`, icon: GraduationCap, color: "text-accent-foreground" },
    ];
  }, [rows, total]);

  const togglePosition = (id: number) => {
    setForm((prev) => ({
      ...prev,
      targetPositionIds: prev.targetPositionIds.includes(id)
        ? prev.targetPositionIds.filter((p) => p !== id)
        : [...prev.targetPositionIds, id],
    }));
  };

  const toggleDepartment = (id: number) => {
    setForm((prev) => ({
      ...prev,
      targetDepartmentIds: prev.targetDepartmentIds.includes(id)
        ? prev.targetDepartmentIds.filter((d) => d !== id)
        : [...prev.targetDepartmentIds, id],
    }));
  };

  const handleSubmit = () => {
    if (!form.name.trim()) { toast.error(t("請填寫計劃名稱")); return; }
    if (form.targetType === "position" && form.targetPositionIds.length === 0) { toast.error(t("請選擇至少一個目標職位")); return; }
    if (form.targetType === "department" && form.targetDepartmentIds.length === 0) { toast.error(t("請選擇至少一個目標部門")); return; }

    const targetNames = form.targetType === "position"
      ? positions.filter((p) => form.targetPositionIds.includes(p.id)).map((p) => p.title)
      : form.targetType === "department"
        ? departments.filter((d) => form.targetDepartmentIds.includes(d.id)).map((d) => d.name)
        : [];

    saveMutation.mutate({
      name: form.name.trim(),
      type: form.type,
      description: form.description,
      targetType: form.targetType,
      targetPositionIds: form.targetType === "position" ? form.targetPositionIds : [],
      targetDepartmentIds: form.targetType === "department" ? form.targetDepartmentIds : [],
      targetNames,
      mandatory: form.mandatory,
      estimatedHours: form.estimatedHours ? parseFloat(form.estimatedHours) : undefined,
    });
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("培訓計劃")}</h1>
          <p className="text-muted-foreground mt-1">{t("建立與管理培訓計劃，支援關聯新員工或特定職位自動分配培訓")}</p>
        </div>
        {hasPerm(TRAINING_PERM.PLAN_ADD) && (
          <Button className="gap-2" onClick={() => { setForm(emptyForm); setDialogOpen(true); }}>
            <Plus className="h-4 w-4" /> {t("新增培訓計劃")}
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t(s.label)}</p>
                <p className="text-xl font-bold text-foreground">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("搜尋計劃名稱...")}
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrent(1); }}
                className="pl-9"
              />
            </div>
            <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setCurrent(1); }}>
              <SelectTrigger className="w-[130px]"><SelectValue placeholder={t("培訓類型")} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("全部類型")}</SelectItem>
                {typeOptions.map((opt) => <SelectItem key={opt} value={opt}>{t(opt)}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrent(1); }}>
              <SelectTrigger className="w-[120px]"><SelectValue placeholder={t("狀態")} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("全部狀態")}</SelectItem>
                {statusOptions.map((s) => <SelectItem key={s.value} value={String(s.value)}>{t(s.label)}</SelectItem>)}
              </SelectContent>
            </Select>
            {(search || typeFilter !== "all" || statusFilter !== "all") && (
              <Button variant="ghost" size="sm" onClick={resetFilters}>{t("清除篩選")}</Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("計劃名稱")}</TableHead>
                <TableHead>{t("培訓類型")}</TableHead>
                <TableHead>{t("適用對象")}</TableHead>
                <TableHead>{t("課程模組")}</TableHead>
                <TableHead>{t("預計時數")}</TableHead>
                <TableHead>{t("完成進度")}</TableHead>
                <TableHead>{t("必修")}</TableHead>
                <TableHead>{t("狀態")}</TableHead>
                <TableHead className="text-right">{t("操作")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r: TrainingPlan) => (
                <TableRow key={r.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/training/plans/${r.id}`)}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{r.name}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[220px]">{r.description}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {r.type ? <Badge variant="outline" className={typeColors[r.type]}>{t(r.type)}</Badge> : <span className="text-xs text-muted-foreground">-</span>}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {r.targetType === "all_new" && <UserPlus className="h-3.5 w-3.5 text-primary" />}
                      {r.targetType === "position" && <Target className="h-3.5 w-3.5 text-accent-foreground" />}
                      {r.targetType === "department" && <Layers className="h-3.5 w-3.5 text-warning" />}
                      {r.targetType === "manual" && <Users className="h-3.5 w-3.5 text-muted-foreground" />}
                      <span className="text-sm">{r.targetScope}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{t("{{n}} 個", { n: r.totalModules })}</TableCell>
                  <TableCell className="text-sm">{t("{{n}} 小時", { n: r.estimatedHours ?? 0 })}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full"
                          style={{ width: `${r.participantCount > 0 ? (r.completedCount / r.participantCount) * 100 : 0}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground">{r.completedCount}/{r.participantCount}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {r.mandatory
                      ? <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-xs">{t("必修")}</Badge>
                      : <span className="text-xs text-muted-foreground">{t("選修")}</span>}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusColors[r.planStatusText]}>{t(r.planStatusText)}</Badge>
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" className="gap-1 h-7" onClick={() => navigate(`/training/plans/${r.id}`)}>
                        <Eye className="h-3.5 w-3.5" /> {t("查看")}
                      </Button>
                      {r.planStatus === 0 && hasPerm(TRAINING_PERM.PLAN_PUBLISH) && (
                        <Button variant="ghost" size="sm" className="gap-1 h-7 text-primary"
                          disabled={publishMutation.isPending || r.totalModules === 0 || (r.participantCount ?? 0) === 0}
                          title={
                            r.totalModules === 0 ? t("請先新增課程模組再發佈")
                              : (r.participantCount ?? 0) === 0 ? t("請先分配參訓人員再發佈")
                              : undefined
                          }
                          onClick={() => {
                            if (r.totalModules === 0) { toast.error(t("請先新增課程模組再發佈")); return; }
                            if ((r.participantCount ?? 0) === 0) { toast.error(t("請先分配參訓人員再發佈")); return; }
                            publishMutation.mutate(r.id);
                          }}>
                          <Send className="h-3.5 w-3.5" /> {t("發佈")}
                        </Button>
                      )}
                      {hasPerm(TRAINING_PERM.PLAN_DELETE) && (
                        <Button variant="ghost" size="sm" className="h-7 text-destructive"
                          disabled={deleteMutation.isPending}
                          onClick={() => setDeleteTarget(r)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && rows.length === 0 && (
                <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-12">{t("沒有符合條件的培訓計劃")}</TableCell></TableRow>
              )}
              {isLoading && (
                <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-12">
                  <Loader2 className="h-5 w-5 animate-spin inline mr-2" />{t("載入中...")}
                </TableCell></TableRow>
              )}
            </TableBody>
          </Table>
          {total > 0 && (
            <div className="p-4">
              <DataPagination
                current={current}
                pageSize={size}
                total={total}
                onChange={setCurrent}
                onPageSizeChange={(s) => { setSize(s); setCurrent(1); }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("新增培訓計劃")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("計劃名稱")} <span className="text-destructive">*</span></Label>
              <Input placeholder={t("例：新員工入職培訓")} value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("培訓類型")}</Label>
                <Select value={form.type} onValueChange={(v) => setForm((prev) => ({ ...prev, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {typeOptions.map((opt) => <SelectItem key={opt} value={opt}>{t(opt)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("預計時數 (小時)")}</Label>
                <Input type="number" placeholder={t("例：8")} value={form.estimatedHours} onChange={(e) => setForm((prev) => ({ ...prev, estimatedHours: e.target.value }))} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("適用對象")} <span className="text-destructive">*</span></Label>
              <Select value={form.targetType} onValueChange={(v) => setForm((prev) => ({ ...prev, targetType: v as TrainingTargetType, targetPositionIds: [], targetDepartmentIds: [] }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {targetTypeOptions.map((opt) => <SelectItem key={opt.value} value={opt.value}>{t(opt.label)}</SelectItem>)}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {form.targetType === "all_new" && t("所有新入職員工將自動分配此培訓")}
                {form.targetType === "position" && t("新員工若為指定職位，將自動分配此培訓")}
                {form.targetType === "department" && t("指定部門的員工將被分配此培訓")}
                {form.targetType === "manual" && t("需手動在詳情頁中添加參訓人員")}
              </p>
            </div>

            {form.targetType === "position" && (
              <div className="space-y-2">
                <Label>{t("選擇職位")} <span className="text-destructive">*</span></Label>
                <div className="grid grid-cols-2 gap-2 border rounded-lg p-3 max-h-40 overflow-y-auto">
                  {positions.map((pos) => (
                    <label key={pos.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox checked={form.targetPositionIds.includes(pos.id)} onCheckedChange={() => togglePosition(pos.id)} />
                      {pos.title}
                    </label>
                  ))}
                  {positions.length === 0 && <p className="text-xs text-muted-foreground col-span-2">{t("暫無職位")}</p>}
                </div>
              </div>
            )}

            {form.targetType === "department" && (
              <div className="space-y-2">
                <Label>{t("選擇部門")} <span className="text-destructive">*</span></Label>
                <div className="grid grid-cols-2 gap-2 border rounded-lg p-3 max-h-40 overflow-y-auto">
                  {departments.map((dept) => (
                    <label key={dept.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox checked={form.targetDepartmentIds.includes(dept.id)} onCheckedChange={() => toggleDepartment(dept.id)} />
                      {dept.name}
                    </label>
                  ))}
                  {departments.length === 0 && <p className="text-xs text-muted-foreground col-span-2">{t("暫無部門")}</p>}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Checkbox checked={form.mandatory} onCheckedChange={(v) => setForm((prev) => ({ ...prev, mandatory: !!v }))} />
              <Label className="cursor-pointer">{t("設為必修課程")}</Label>
              <span className="text-xs text-muted-foreground">{t("（必修課程員工需在期限內完成）")}</span>
            </div>

            <div className="space-y-2">
              <Label>{t("培訓簡介")}</Label>
              <Textarea placeholder={t("請輸入培訓計劃的簡要描述...")} value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t("取消")}</Button>
            <Button onClick={handleSubmit} disabled={saveMutation.isPending}>
              {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}{t("建立計劃")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认 */}
      <AlertDialog open={deleteTarget != null} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("確認刪除培訓計劃？")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("即將刪除「{{name}}」，其課程模組與參訓記錄也將一併移除。此操作不可撤銷。", { name: deleteTarget?.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("取消")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (deleteTarget) deleteMutation.mutate(deleteTarget.id); setDeleteTarget(null); }}>
              {t("確認刪除")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
