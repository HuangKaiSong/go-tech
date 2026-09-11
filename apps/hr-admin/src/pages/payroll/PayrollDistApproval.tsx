import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  CheckCircle, XCircle, Clock, Eye, Wallet, ArrowLeft, AlertCircle, Send, History, AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import {
  getDistBatches, getPendingDistBatches, getDistLogs, getDistLevels, getDistBatchDetail,
  approveDist, rejectDist, returnDist, reassignDist,
  DIST_STATUS_TEXT, APPROVAL_LEVEL_TITLES, type DistBatch, type DistStatus,
} from "@/api/payrollDist";
import { getActiveEmployeeOptions } from "@/api/employee";
import { ApproveConfirmDialog, ReassignDialog } from "@/components/payroll/PayrollApproveDialogs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search } from "lucide-react";

const statusColors: Record<DistStatus, string> = {
  1: "bg-muted text-muted-foreground border-border",
  2: "bg-warning/10 text-warning border-warning/20",
  3: "bg-accent/10 text-accent-foreground border-accent/20",
  4: "bg-primary/10 text-primary border-primary/20",
  5: "bg-success/10 text-success border-success/20",
  6: "bg-destructive/10 text-destructive border-destructive/20",
};
const num = (v: number | null | undefined) => (v ?? 0).toLocaleString();
/** 異常嚴重度 → 提示樣式 */
const anomalyTone = (severity: string) =>
  severity === "error" ? "bg-destructive/5 border-destructive/20 text-destructive"
    : severity === "warning" ? "bg-warning/5 border-warning/20 text-warning"
    : "bg-muted/40 border-border text-muted-foreground";

export default function PayrollDistApproval() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("pending");
  const [approveTarget, setApproveTarget] = useState<DistBatch | null>(null);
  const [approveComment, setApproveComment] = useState("");
  const [rejectTarget, setRejectTarget] = useState<DistBatch | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [returnTarget, setReturnTarget] = useState<DistBatch | null>(null);
  const [returnReason, setReturnReason] = useState("");
  const [reassignTarget, setReassignTarget] = useState<DistBatch | null>(null);
  const [reassignTo, setReassignTo] = useState("");
  const [reassignComment, setReassignComment] = useState("");
  const [previewTarget, setPreviewTarget] = useState<DistBatch | null>(null);
  const [logSearch, setLogSearch] = useState("");
  const [logAction, setLogAction] = useState("all");

  const { data: levelTitles = APPROVAL_LEVEL_TITLES } = useQuery({
    queryKey: ["distLevels"],
    queryFn: async () => (await getDistLevels()).data ?? APPROVAL_LEVEL_TITLES,
  });
  const TOTAL_LEVELS = levelTitles.length;
  const { data: pending = [] } = useQuery({ queryKey: ["pendingDist"], queryFn: async () => (await getPendingDistBatches()).data ?? [] });
  const { data: activeEmployees = [] } = useQuery({ queryKey: ["activeEmployees"], queryFn: async () => (await getActiveEmployeeOptions()).data ?? [] });
  // 審核彈窗打開時拉批次詳情，判斷是否含異常項目
  const { data: approveDetail } = useQuery({
    queryKey: ["distDetail", approveTarget?.id],
    queryFn: async () => (await getDistBatchDetail(approveTarget!.id)).data,
    enabled: !!approveTarget,
  });
  const approveHasAnomaly = (approveDetail?.anomalies?.length ?? 0) > 0;
  // 查看明細預覽：拉批次詳情（金額/異常/明細/審批流）
  const { data: previewDetail } = useQuery({
    queryKey: ["distDetail", previewTarget?.id],
    queryFn: async () => (await getDistBatchDetail(previewTarget!.id)).data,
    enabled: !!previewTarget,
  });
  const { data: all = [] } = useQuery({ queryKey: ["distBatches"], queryFn: async () => (await getDistBatches()).data ?? [] });
  const { data: logs = [] } = useQuery({
    queryKey: ["distLogs", logSearch, logAction],
    queryFn: async () => (await getDistLogs({
      keyword: logSearch || undefined,
      action: logAction === "all" ? undefined : logAction,
    })).data ?? [],
  });
  const reviewed = all.filter(r => [3, 4, 5].includes(r.status));
  const LOG_ACTIONS = ["提交審核", "審核通過", "終審通過", "審核駁回", "退回修改", "轉簽", "執行發放", "取消"];
  const actionColors: Record<string, string> = {
    "提交審核": "bg-muted text-muted-foreground border-border",
    "初審通過": "bg-primary/10 text-primary border-primary/20",
    "複審通過": "bg-accent/10 text-accent-foreground border-accent/20",
    "審核通過": "bg-accent/10 text-accent-foreground border-accent/20",
    "終審通過": "bg-success/10 text-success border-success/20",
    "執行發放": "bg-success/10 text-success border-success/20",
    "審核駁回": "bg-destructive/10 text-destructive border-destructive/20",
    "退回修改": "bg-warning/10 text-warning border-warning/20",
    "轉簽": "bg-primary/10 text-primary border-primary/20",
    "取消": "bg-destructive/10 text-destructive border-destructive/20",
  };

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["pendingDist"] });
    queryClient.invalidateQueries({ queryKey: ["distBatches"] });
  };
  const approveM = useMutation({ mutationFn: () => approveDist(approveTarget!.id, approveComment), onSuccess: () => { toast.success(t("已審核通過")); setApproveTarget(null); setApproveComment(""); invalidate(); }, onError: (e: any) => toast.error(e?.message || t("操作失敗")) });
  const rejectM = useMutation({ mutationFn: () => rejectDist(rejectTarget!.id, rejectReason), onSuccess: () => { toast.success(t("已駁回")); setRejectTarget(null); setRejectReason(""); invalidate(); }, onError: (e: any) => toast.error(e?.message || t("操作失敗")) });
  const returnM = useMutation({ mutationFn: () => returnDist(returnTarget!.id, returnReason), onSuccess: () => { toast.success(t("已退回修改")); setReturnTarget(null); setReturnReason(""); invalidate(); }, onError: (e: any) => toast.error(e?.message || t("操作失敗")) });
  const reassignM = useMutation({ mutationFn: () => reassignDist(reassignTarget!.id, Number(reassignTo), reassignComment), onSuccess: () => { toast.success(t("已轉簽")); setReassignTarget(null); setReassignTo(""); setReassignComment(""); invalidate(); }, onError: (e: any) => toast.error(e?.message || t("操作失敗")) });

  const stats = [
    { label: "待審核", value: t("{{n}} 筆", { n: pending.length }), icon: Clock, color: "text-warning" },
    { label: "已審核", value: t("{{n}} 筆", { n: reviewed.length }), icon: CheckCircle, color: "text-success" },
    { label: "待審核金額", value: `HK$ ${num(pending.reduce((s, r) => s + (r.totalNet ?? 0), 0))}`, icon: Wallet, color: "text-primary" },
    { label: "已發放", value: t("{{n}} 筆", { n: all.filter(r => r.status === 5).length }), icon: CheckCircle, color: "text-accent-foreground" },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/payroll/distribute")}><ArrowLeft className="h-5 w-5" /></Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("發薪審核")}</h1>
          <p className="text-muted-foreground mt-1">{t("四級審核薪資發放批次，確保合規與準確")}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(s => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center"><s.icon className={`h-5 w-5 ${s.color}`} /></div>
              <div><p className="text-sm text-muted-foreground">{t(s.label)}</p><p className="text-xl font-bold text-foreground">{s.value}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending" className="gap-2"><Clock className="h-4 w-4" /> {t("待我審核")}
            {pending.length > 0 && <Badge variant="destructive" className="ml-1 h-5 min-w-5 px-1 text-xs">{pending.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2"><History className="h-4 w-4" /> {t("已審核")}</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          {pending.length === 0 ? (
            <Card><CardContent className="p-12 text-center text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">{t("沒有待審核的發薪批次")}</p>
            </CardContent></Card>
          ) : (
            <div className="space-y-4">
              {pending.map(record => {
                const level = record.approvalLevel ?? 0;
                const currentTitle = levelTitles[Math.min(level, TOTAL_LEVELS - 1)];
                return (
                  <Card key={record.id} className="border-l-4 border-l-primary">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-foreground">{record.period}</h3>
                          <Badge variant="outline" className={statusColors[record.status]}>{t(DIST_STATUS_TEXT[record.status])}</Badge>
                          <Badge variant="outline" className="bg-muted/50 text-muted-foreground border-border">{record.payrollGroup}</Badge>
                        </div>
                        <span className="text-sm text-muted-foreground">{t("批次 #{{id}}", { id: record.id })}</span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div><p className="text-xs text-muted-foreground">{t("發薪人數")}</p><p className="font-semibold text-foreground">{t("{{n}} 人", { n: record.employeeCount })}</p></div>
                        <div><p className="text-xs text-muted-foreground">{t("應發總額")}</p><p className="font-semibold text-foreground">HK$ {num(record.totalGross)}</p></div>
                        <div><p className="text-xs text-muted-foreground">{t("扣款總額")}</p><p className="font-semibold text-destructive">- HK$ {num(record.totalDeduction)}</p></div>
                        <div><p className="text-xs text-muted-foreground">{t("實發總額")}</p><p className="font-bold text-primary">HK$ {num(record.totalNet)}</p></div>
                        <div><p className="text-xs text-muted-foreground">{t("發薪日期")}</p><p className="font-semibold text-foreground">{record.payDate ?? "—"}</p></div>
                      </div>

                      <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-foreground">{t("審批進度")}</span>
                          <span className="text-xs text-muted-foreground">{t("當前節點：{{title}}（第 {{cur}}/{{total}} 級）", { title: t(currentTitle), cur: level + 1, total: TOTAL_LEVELS })}</span>
                        </div>
                        <Progress value={(level / TOTAL_LEVELS) * 100} className="h-2 mb-2" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          {levelTitles.map((title, i) => (
                            <div key={title} className={`flex items-center gap-1 ${i < level ? "text-success" : i === level ? "text-primary font-medium" : ""}`}>
                              {i < level ? <CheckCircle className="h-3 w-3" /> : i === level ? <Clock className="h-3 w-3" /> : <span className="h-3 w-3 rounded-full border border-border inline-block" />}
                              {t(title)}
                            </div>
                          ))}
                        </div>
                      </div>

                      <Separator className="my-4" />
                      <div className="flex items-center justify-between">
                        <Button variant="outline" size="sm" className="gap-2" onClick={() => setPreviewTarget(record)}><Eye className="h-4 w-4" /> {t("查看明細")}</Button>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="gap-2" onClick={() => setReturnTarget(record)}><ArrowLeft className="h-4 w-4" /> {t("退回修改")}</Button>
                          <Button variant="outline" size="sm" className="gap-2" onClick={() => { setReassignTarget(record); setReassignTo(""); setReassignComment(""); }}><Send className="h-4 w-4" /> {t("轉簽")}</Button>
                          <Button variant="outline" size="sm" className="gap-2 text-destructive border-destructive/20 hover:bg-destructive/10" onClick={() => setRejectTarget(record)}><XCircle className="h-4 w-4" /> {t("駁回")}</Button>
                          <Button size="sm" className="gap-2 bg-success text-success-foreground hover:bg-success/90" onClick={() => setApproveTarget(record)}><CheckCircle className="h-4 w-4" /> {t("審核通過")}</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <h3 className="font-semibold text-foreground">{t("審核歷史記錄")}</h3>
                <div className="flex gap-2">
                  <Select value={logAction} onValueChange={setLogAction}>
                    <SelectTrigger className="w-36 h-9"><SelectValue placeholder={t("操作類型")} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("全部操作")}</SelectItem>
                      {LOG_ACTIONS.map(a => <SelectItem key={a} value={a}>{t(a)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <div className="relative w-56">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder={t("搜尋期間或操作人...")} value={logSearch} onChange={e => setLogSearch(e.target.value)} className="pl-9 h-9" />
                  </div>
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("時間")}</TableHead>
                    <TableHead>{t("批次期間")}</TableHead>
                    <TableHead>{t("操作")}</TableHead>
                    <TableHead>{t("操作人")}</TableHead>
                    <TableHead>{t("角色")}</TableHead>
                    <TableHead>{t("備註")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map(l => (
                    <TableRow key={l.id}>
                      <TableCell className="text-muted-foreground whitespace-nowrap">{l.time?.slice(0, 16)}</TableCell>
                      <TableCell className="font-medium text-primary cursor-pointer" onClick={() => navigate(`/payroll/distribute/${l.batchId}`)}>{l.period ?? `#${l.batchId}`}</TableCell>
                      <TableCell><Badge variant="outline" className={actionColors[l.action] || ""}>{t(l.action)}</Badge></TableCell>
                      <TableCell>{l.operator}</TableCell>
                      <TableCell className="text-muted-foreground">{t(l.role)}</TableCell>
                      <TableCell className="text-muted-foreground max-w-[260px] truncate">{l.comment ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                  {logs.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">{t("沒有符合條件的記錄")}</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Approve */}
      <ApproveConfirmDialog
        open={!!approveTarget}
        onOpenChange={(o) => { if (!o) { setApproveTarget(null); setApproveComment(""); } }}
        batch={approveTarget}
        levelTitle={approveTarget ? levelTitles[Math.min(approveTarget.approvalLevel ?? 0, TOTAL_LEVELS - 1)] : undefined}
        hasAnomaly={approveHasAnomaly}
        comment={approveComment}
        onCommentChange={setApproveComment}
        onConfirm={() => approveM.mutate()}
        loading={approveM.isPending}
      />

      {/* Reassign 轉簽 */}
      <ReassignDialog
        open={!!reassignTarget}
        onOpenChange={(o) => { if (!o) { setReassignTarget(null); setReassignTo(""); setReassignComment(""); } }}
        batch={reassignTarget}
        levelTitle={reassignTarget ? levelTitles[Math.min(reassignTarget.approvalLevel ?? 0, TOTAL_LEVELS - 1)] : undefined}
        employees={activeEmployees}
        targetId={reassignTo}
        onTargetChange={setReassignTo}
        comment={reassignComment}
        onCommentChange={setReassignComment}
        onConfirm={() => { if (!reassignTo) { toast.error(t("請選擇轉簽對象")); return; } reassignM.mutate(); }}
        loading={reassignM.isPending}
      />

      {/* 查看明細預覽 */}
      <Dialog open={!!previewTarget} onOpenChange={() => setPreviewTarget(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("{{period}} 發薪明細預覽", { period: previewTarget?.period ?? "" })}</DialogTitle>
            <DialogDescription>
              {t("批次 #{{id}} · {{count}} 人 · 實發 HK$ {{net}}", { id: previewTarget?.id ?? "", count: previewTarget?.employeeCount ?? 0, net: num(previewTarget?.totalNet) })}
            </DialogDescription>
          </DialogHeader>

          {/* 金額摘要 */}
          <div className="grid grid-cols-3 gap-4 my-2">
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground">{t("應發總額")}</p>
              <p className="font-bold text-foreground">HK$ {num(previewTarget?.totalGross)}</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground">{t("扣款總額")}</p>
              <p className="font-bold text-destructive">- HK$ {num(previewTarget?.totalDeduction)}</p>
            </div>
            <div className="bg-primary/5 rounded-lg p-3 text-center border border-primary/20">
              <p className="text-xs text-muted-foreground">{t("實發總額")}</p>
              <p className="font-bold text-primary">HK$ {num(previewTarget?.totalNet)}</p>
            </div>
          </div>

          {/* 異常項目 */}
          {(previewDetail?.anomalies?.length ?? 0) > 0 && (
            <div className="mb-2">
              <p className="text-sm font-medium text-foreground mb-2 flex items-center gap-1"><AlertTriangle className="h-4 w-4 text-warning" /> {t("異常項目")}</p>
              {previewDetail!.anomalies.map((a, i) => (
                <div key={i} className={`flex items-center gap-2 p-2 rounded-md border text-sm mb-1 ${anomalyTone(a.severity)}`}>
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  <span className="font-medium">{a.name}</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-muted-foreground flex-1">{a.description}</span>
                </div>
              ))}
            </div>
          )}

          {/* 員工明細 */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("員工")}</TableHead>
                <TableHead>{t("部門")}</TableHead>
                <TableHead>{t("職位")}</TableHead>
                <TableHead>{t("銀行 / 帳號")}</TableHead>
                <TableHead className="text-right">{t("實發金額")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(previewDetail?.items ?? []).map(emp => (
                <TableRow key={emp.id}>
                  <TableCell><div><p className="font-medium">{emp.employeeName}</p><p className="text-xs text-muted-foreground">{emp.employeeNo}</p></div></TableCell>
                  <TableCell>{emp.departmentName ?? "—"}</TableCell>
                  <TableCell>{emp.position ?? "—"}</TableCell>
                  <TableCell><div className="text-sm">{emp.bankName ?? "—"}</div><div className="font-mono text-xs text-muted-foreground">{emp.bankAccount ?? "—"}</div></TableCell>
                  <TableCell className="text-right font-semibold">HK$ {num(emp.netSalary)}</TableCell>
                </TableRow>
              ))}
              {(previewDetail?.items?.length ?? 0) === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">{t("載入中…")}</TableCell></TableRow>
              )}
            </TableBody>
          </Table>

          {/* 審批流程 */}
          {previewTarget && (
            <div className="mt-4">
              <p className="text-sm font-medium text-foreground mb-3">{t("審批流程")}</p>
              <div className="space-y-0">
                {levelTitles.slice(0, TOTAL_LEVELS).map((title, i) => {
                  const level = i + 1;
                  const done = (previewTarget.approvalLevel ?? 0) >= level;
                  const current = (previewTarget.approvalLevel ?? 0) === i;
                  const log = (previewDetail?.logs ?? []).find(l => l.level === level && (l.action === "審核通過" || l.action === "終審通過"));
                  return (
                    <div key={title} className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${done ? "bg-success text-success-foreground" : current ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                          {done ? <CheckCircle className="h-4 w-4" /> : level}
                        </div>
                        {i < TOTAL_LEVELS - 1 && <div className={`w-px h-6 ${done ? "bg-success/40" : "bg-border"}`} />}
                      </div>
                      <div className="flex-1 pb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm text-foreground">{t(title)}</span>
                          {current && <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs">{t("當前")}</Badge>}
                        </div>
                        {log && <p className="text-xs text-muted-foreground">{log.operator} · {t(log.role)}</p>}
                        {log?.comment && <p className="text-xs text-muted-foreground mt-0.5">「{log.comment}」</p>}
                        {log?.time && <p className="text-xs text-muted-foreground">{log.time.slice(0, 16)}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewTarget(null)}>{t("關閉")}</Button>
            <Button onClick={() => { const id = previewTarget?.id; setPreviewTarget(null); navigate(`/payroll/distribute/${id}`); }}>{t("查看完整詳情")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject */}
      <Dialog open={!!rejectTarget} onOpenChange={() => { setRejectTarget(null); setRejectReason(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><XCircle className="h-5 w-5 text-destructive" /> {t("駁回發薪批次")}</DialogTitle>
            <DialogDescription>{t("駁回 {{period}}，批次退回草稿", { period: rejectTarget?.period ?? "" })}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
              <p className="text-sm text-destructive">{t("駁回後批次退回草稿，提交者需修改後重新提交。")}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">{t("駁回原因")} <span className="text-destructive">*</span></label>
              <Textarea placeholder={t("請說明駁回原因...")} value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={4} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectTarget(null); setRejectReason(""); }}>{t("取消")}</Button>
            <Button variant="destructive" className="gap-2" onClick={() => { if (!rejectReason.trim()) { toast.error(t("請填寫駁回原因")); return; } rejectM.mutate(); }}><XCircle className="h-4 w-4" /> {t("確認駁回")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Return */}
      <Dialog open={!!returnTarget} onOpenChange={() => { setReturnTarget(null); setReturnReason(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><ArrowLeft className="h-5 w-5 text-warning" /> {t("退回修改")}</DialogTitle>
            <DialogDescription>{t("將 {{period}} 退回給提交者修改", { period: returnTarget?.period ?? "" })}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-warning/5 border border-warning/20 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-warning mt-0.5" />
              <p className="text-sm text-warning">{t("退回後批次回到草稿狀態，可修改後重新提交。")}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">{t("退回原因")} <span className="text-destructive">*</span></label>
              <Textarea placeholder={t("請說明需修改的內容...")} value={returnReason} onChange={e => setReturnReason(e.target.value)} rows={4} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setReturnTarget(null); setReturnReason(""); }}>{t("取消")}</Button>
            <Button className="gap-2 bg-warning text-warning-foreground hover:bg-warning/90" onClick={() => { if (!returnReason.trim()) { toast.error(t("請填寫退回原因")); return; } returnM.mutate(); }}><ArrowLeft className="h-4 w-4" /> {t("確認退回")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
