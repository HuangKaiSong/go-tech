import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import {
  ArrowLeft, Edit, Save, X, Trash2, Ban,
  User, DollarSign, Calendar, FileText, Building2, Tag
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { hasPerm } from "@/lib/auth";
import { PAYROLL_PERM } from "@/lib/perms";
import {
  getBonusPenaltyDetail, submitBonusPenalty, cancelBonusPenalty, deleteBonusPenalty,
} from "@/api/bonusPenalty";
import { getActiveEmployeeOptions } from "@/api/employee";

const TYPE_TEXT: Record<number, string> = { 1: "獎金", 2: "罰款" };
const STATUS_TEXT: Record<number, string> = { 1: "未計入", 2: "已計入", 3: "已取消" };

const statusColors: Record<string, string> = {
  "未計入": "bg-warning/10 text-warning border-warning/20",
  "已計入": "bg-success/10 text-success border-success/20",
  "已取消": "bg-muted text-muted-foreground border-border",
};
const typeColors: Record<string, string> = {
  "獎金": "bg-success/10 text-success border-success/20",
  "罰款": "bg-destructive/10 text-destructive border-destructive/20",
};

const bonusCategories = ["績效獎金", "專案獎金", "年終獎金", "推薦獎金", "全勤獎金", "其他獎金"];
const penaltyCategories = ["遲到罰款", "曠工罰款", "違規罰款", "損壞賠償", "其他罰款"];

export default function BonusPenaltyDetail() {
  const { t } = useTranslation();
  const { bpId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const idNum = bpId ? Number(bpId) : undefined;

  const { data: record, isLoading } = useQuery({
    queryKey: ["bonusPenaltyDetail", idNum],
    queryFn: () => getBonusPenaltyDetail(idNum!).then(r => r.data),
    enabled: !!idNum,
  });

  const { data: employeeOptions = [] } = useQuery({
    queryKey: ["activeEmployeeOptions"],
    queryFn: () => getActiveEmployeeOptions().then(r => r.data),
  });

  const [isEditing, setIsEditing] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editForm, setEditForm] = useState({ category: "", employeeId: "", amount: "", applyMonth: "", reason: "", note: "" });

  useEffect(() => {
    if (record && !isEditing) {
      setEditForm({
        category: record.category || "",
        employeeId: String(record.employeeId ?? ""),
        amount: String(record.amount ?? ""),
        applyMonth: record.applyMonth || "",
        reason: record.reason || "",
        note: record.note || "",
      });
    }
  }, [record, isEditing]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["bonusPenaltyDetail", idNum] });
    queryClient.invalidateQueries({ queryKey: ["bonusPenaltyList"] });
  };

  const saveMutation = useMutation({
    mutationFn: () => submitBonusPenalty({
      id: idNum,
      type: record!.type,
      category: editForm.category,
      employeeId: Number(editForm.employeeId),
      amount: Number(editForm.amount),
      applyMonth: editForm.applyMonth,
      reason: editForm.reason || undefined,
      note: editForm.note || undefined,
    }),
    onSuccess: () => { toast.success(t("記錄已更新")); setIsEditing(false); invalidate(); },
    onError: (e: Error) => toast.error(e.message || t("更新失敗")),
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelBonusPenalty(idNum!),
    onSuccess: () => { toast.success(t("記錄已取消")); setCancelOpen(false); invalidate(); },
    onError: (e: Error) => toast.error(e.message || t("取消失敗")),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteBonusPenalty(idNum!),
    onSuccess: () => { toast.success(t("記錄已刪除")); navigate("/payroll/bonus-penalty"); },
    onError: (e: Error) => toast.error(e.message || t("刪除失敗")),
  });

  if (isLoading) {
    return <div className="p-6 text-center text-muted-foreground py-20">{t("載入中...")}</div>;
  }
  if (!record) {
    return (
      <div className="p-6">
        <Button variant="ghost" className="gap-2 mb-4" onClick={() => navigate("/payroll/bonus-penalty")}>
          <ArrowLeft className="h-4 w-4" /> {t("返回列表")}
        </Button>
        <Card><CardContent className="p-12 text-center text-muted-foreground">{t("找不到該記錄")}</CardContent></Card>
      </div>
    );
  }

  const typeText = TYPE_TEXT[record.type];
  const statusText = STATUS_TEXT[record.status];
  const categories = record.type === 1 ? bonusCategories : penaltyCategories;
  const isEditable = record.status === 1;

  const handleSave = () => {
    if (!editForm.amount || !editForm.reason || !editForm.category || !editForm.employeeId || !editForm.applyMonth) {
      toast.error(t("請填寫所有必填欄位"));
      return;
    }
    saveMutation.mutate();
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/payroll/bonus-penalty")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">{t("{{type}}詳情", { type: t(typeText) })}</h1>
              <Badge variant="outline" className={typeColors[typeText]}>{t(typeText)}</Badge>
              <Badge variant="outline" className={statusColors[statusText]}>{t(statusText)}</Badge>
            </div>
            <p className="text-muted-foreground mt-1">{t("編號 #{{id}} · 建立於 {{date}}", { id: record.id, date: record.createTime?.slice(0, 10) || "—" })}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" className="gap-2" onClick={() => setIsEditing(false)}>
                <X className="h-4 w-4" /> {t("取消")}
              </Button>
              <Button className="gap-2" onClick={handleSave} disabled={saveMutation.isPending}>
                <Save className="h-4 w-4" /> {t("儲存")}
              </Button>
            </>
          ) : isEditable ? (
            <>
              {hasPerm(PAYROLL_PERM.BONUS_EDIT) && (
                <Button variant="outline" className="gap-2" onClick={() => setIsEditing(true)}>
                  <Edit className="h-4 w-4" /> {t("編輯")}
                </Button>
              )}
              {hasPerm(PAYROLL_PERM.BONUS_EDIT) && (
                <Button variant="outline" className="gap-2" onClick={() => setCancelOpen(true)}>
                  <Ban className="h-4 w-4" /> {t("取消記錄")}
                </Button>
              )}
              {hasPerm(PAYROLL_PERM.BONUS_DELETE) && (
                <Button variant="destructive" className="gap-2" onClick={() => setDeleteOpen(true)}>
                  <Trash2 className="h-4 w-4" /> {t("刪除")}
                </Button>
              )}
            </>
          ) : (
            <span className="text-sm text-muted-foreground self-center">
              {record.status === 2 ? t("已計入核算批次，不可編輯") : t("已取消")}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">{t("基本資訊")}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Row icon={Tag} label={t("類型")}><Badge variant="outline" className={typeColors[typeText]}>{t(typeText)}</Badge></Row>
              <Row icon={FileText} label={t("類別")}>
                {isEditing ? (
                  <Select value={editForm.category} onValueChange={v => setEditForm(p => ({ ...p, category: v }))}>
                    <SelectTrigger className="w-[200px] h-8"><SelectValue placeholder={t("選擇類別")} /></SelectTrigger>
                    <SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{t(c)}</SelectItem>)}</SelectContent>
                  </Select>
                ) : <span className="text-sm font-medium">{t(record.category)}</span>}
              </Row>
              <Row icon={User} label={t("員工")}>
                {isEditing ? (
                  <Select value={editForm.employeeId} onValueChange={v => setEditForm(p => ({ ...p, employeeId: v }))}>
                    <SelectTrigger className="w-[280px] h-8"><SelectValue placeholder={t("選擇員工")} /></SelectTrigger>
                    <SelectContent>
                      {employeeOptions.map(e => <SelectItem key={e.id} value={String(e.id)}>{e.name}{e.employeeNo ? `（${e.employeeNo}）` : ""}</SelectItem>)}
                    </SelectContent>
                  </Select>
                ) : <span className="text-sm font-medium">{record.employeeName || `#${record.employeeId}`}</span>}
              </Row>
              <Row icon={Building2} label={t("部門")}><span className="text-sm font-medium">{record.departmentName || "—"}</span></Row>
              <Row icon={DollarSign} label={t("金額")}>
                {isEditing ? (
                  <Input type="number" className="w-[160px] h-8" value={editForm.amount} onChange={e => setEditForm(p => ({ ...p, amount: e.target.value }))} />
                ) : <span className={`text-sm font-medium ${record.type === 1 ? "text-success" : "text-destructive"}`}>{record.type === 1 ? "+" : "-"}HK$ {Number(record.amount).toLocaleString()}</span>}
              </Row>
              <Row icon={Calendar} label={t("計入月份")}>
                {isEditing ? (
                  <Input type="month" className="w-[180px] h-8" value={editForm.applyMonth} onChange={e => setEditForm(p => ({ ...p, applyMonth: e.target.value }))} />
                ) : <span className="text-sm font-medium">{record.applyMonth}</span>}
              </Row>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">{t("原因說明")}</CardTitle></CardHeader>
            <CardContent>
              {isEditing ? (
                <Textarea value={editForm.reason} onChange={e => setEditForm(p => ({ ...p, reason: e.target.value }))} rows={4} />
              ) : <p className="text-sm text-foreground leading-relaxed">{record.reason || "—"}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">{t("備註")}</CardTitle></CardHeader>
            <CardContent>
              {isEditing ? (
                <Input value={editForm.note} onChange={e => setEditForm(p => ({ ...p, note: e.target.value }))} placeholder={t("選填備註")} />
              ) : <p className="text-sm text-muted-foreground">{record.note || t("無備註")}</p>}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-6 text-center">
              <div className={`text-3xl font-bold mb-2 ${record.type === 1 ? "text-success" : "text-destructive"}`}>
                {record.type === 1 ? "+" : "-"}HK$ {Number(record.amount).toLocaleString()}
              </div>
              <p className="text-sm text-muted-foreground">{t(record.category)}</p>
              <Separator className="my-4" />
              <div className="space-y-3 text-left">
                <SumRow label={t("員工")} value={record.employeeName || `#${record.employeeId}`} />
                <SumRow label={t("部門")} value={record.departmentName || "—"} />
                <SumRow label={t("計入月份")} value={record.applyMonth} />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("狀態")}</span>
                  <Badge variant="outline" className={statusColors[statusText]}>{t(statusText)}</Badge>
                </div>
                <SumRow label={t("建立日期")} value={record.createTime?.slice(0, 10) || "—"} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Cancel Dialog */}
      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("確認取消")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("確定要取消此{{type}}記錄嗎？取消後該筆金額將不會計入 {{month}} 的薪資計算。", { type: t(typeText), month: record.applyMonth })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("返回")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => cancelMutation.mutate()}>{t("確認取消")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("確認刪除")}</AlertDialogTitle>
            <AlertDialogDescription>{t("確定要刪除此{{type}}記錄嗎？此操作無法復原。", { type: t(typeText) })}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("返回")}</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteMutation.mutate()}>{t("確認刪除")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Row({ icon: Icon, label, children }: { icon: React.ComponentType<{ className?: string }>; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2 w-28 shrink-0">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      {children}
    </div>
  );
}

function SumRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
