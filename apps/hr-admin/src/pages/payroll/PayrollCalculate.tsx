import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DollarSign, Calculator, Users, Building2, Eye, AlertTriangle, PiggyBank, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { hasPerm } from "@/lib/auth";
import { PAYROLL_PERM } from "@/lib/perms";
import {
  getCalcBatches, calculatePayroll, deleteCalcBatch,
  CALC_STATUS_TEXT, type CalcBatch, type CalcBatchStatus,
} from "@/api/payrollCalc";

const statusColors: Record<CalcBatchStatus, string> = {
  1: "bg-accent/10 text-accent-foreground border-accent/20",
  2: "bg-success/10 text-success border-success/20",
  3: "bg-primary/10 text-primary border-primary/20",
};

const num = (v: number | null | undefined) => (v ?? 0).toLocaleString();

export default function PayrollCalculate() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [period, setPeriod] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<CalcBatch | null>(null);

  const { data: batches = [], isLoading } = useQuery({
    queryKey: ["calcBatches"],
    queryFn: async () => (await getCalcBatches()).data ?? [],
  });

  const calcMutation = useMutation({
    mutationFn: (p: string) => calculatePayroll(p),
    onSuccess: (res, p) => {
      const batchId = res.data;
      toast.success(t("{{period}} 薪資核算完成", { period: p }));
      queryClient.invalidateQueries({ queryKey: ["calcBatches"] });
      setPeriod("");
      if (batchId) navigate(`/payroll/calculate/${batchId}`);
    },
    onError: (e: any) => toast.error(e?.message || t("核算失敗")),
  });

  const deleteMutation = useMutation({
    mutationFn: (batchId: number) => deleteCalcBatch(batchId),
    onSuccess: () => {
      toast.success(t("批次已刪除"));
      queryClient.invalidateQueries({ queryKey: ["calcBatches"] });
      setDeleteTarget(null);
    },
    onError: (e: any) => toast.error(e?.message || t("刪除失敗")),
  });

  const totalNet = batches.reduce((s, b) => s + (b.totalNet ?? 0), 0);
  const totalEmployees = batches.reduce((s, b) => s + (b.employeeCount ?? 0), 0);
  const totalWarnings = batches.reduce((s, b) => s + (b.warningCount ?? 0), 0);

  const stats = [
    { label: "批次數", value: t("{{n}} 個", { n: batches.length }), icon: Calculator, color: "text-primary" },
    { label: "覆蓋人次", value: t("{{n}} 人", { n: totalEmployees }), icon: Users, color: "text-success" },
    { label: "實發合計", value: `HK$ ${num(totalNet)}`, icon: DollarSign, color: "text-primary" },
    { label: "合規告警", value: t("{{n}} 人", { n: totalWarnings }), icon: AlertTriangle, color: "text-warning" },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("薪資計算")}</h1>
          <p className="text-muted-foreground mt-1">{t("選擇月份執行核算，系統依薪資方案、系統參數、獎懲與員工檔案自動生成明細")}</p>
        </div>
        <div className="flex items-center gap-3">
          <Input type="month" value={period} onChange={e => setPeriod(e.target.value)} className="w-[180px]" />
          {hasPerm(PAYROLL_PERM.CALC_RUN) && (
            <Button onClick={() => period && calcMutation.mutate(period)} className="gap-2" disabled={!period || calcMutation.isPending}>
              <Calculator className="h-4 w-4" />
              {calcMutation.isPending ? t("核算中…") : t("開始薪資計算")}
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map(s => (
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

      {/* Batch list */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t("核算批次")}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("月份")}</TableHead>
                <TableHead>{t("狀態")}</TableHead>
                <TableHead>{t("人數")}</TableHead>
                <TableHead className="text-right">{t("基本薪資")}</TableHead>
                <TableHead className="text-right">{t("津貼")}</TableHead>
                <TableHead className="text-right">{t("獎金")}</TableHead>
                <TableHead className="text-right">{t("扣款")}</TableHead>
                <TableHead className="text-right">{t("實發")}</TableHead>
                <TableHead className="text-right">{t("公司承擔")}</TableHead>
                <TableHead className="text-center">{t("告警")}</TableHead>
                <TableHead className="text-right">{t("操作")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={11} className="text-center py-12 text-muted-foreground">{t("載入中…")}</TableCell></TableRow>
              ) : batches.length === 0 ? (
                <TableRow><TableCell colSpan={11} className="text-center py-12 text-muted-foreground">{t("尚無核算批次，請選擇月份開始計算")}</TableCell></TableRow>
              ) : batches.map(b => (
                <TableRow key={b.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/payroll/calculate/${b.id}`)}>
                  <TableCell className="font-medium">{b.period}</TableCell>
                  <TableCell><Badge variant="outline" className={statusColors[b.status]}>{t(CALC_STATUS_TEXT[b.status])}</Badge></TableCell>
                  <TableCell>{t("{{n}} 人", { n: b.employeeCount })}</TableCell>
                  <TableCell className="text-right">{num(b.totalBase)}</TableCell>
                  <TableCell className="text-right">{num(b.totalAllowance)}</TableCell>
                  <TableCell className="text-right">{num(b.totalBonus)}</TableCell>
                  <TableCell className="text-right text-destructive">{num(b.totalDeduction)}</TableCell>
                  <TableCell className="text-right font-semibold">{num(b.totalNet)}</TableCell>
                  <TableCell className="text-right text-accent-foreground">{num(b.totalEmployerContribution)}</TableCell>
                  <TableCell className="text-center">
                    {b.warningCount > 0
                      ? <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20 gap-1"><AlertTriangle className="h-3 w-3" />{b.warningCount}</Badge>
                      : <span className="text-muted-foreground text-sm">—</span>}
                  </TableCell>
                  <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/payroll/calculate/${b.id}`)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      {b.status === 1 && hasPerm(PAYROLL_PERM.CALC_DELETE) && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteTarget(b)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("刪除核算批次")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("確定刪除 {{period}} 的核算批次？連帶刪除所有員工明細，此操作無法復原。", { period: deleteTarget?.period ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("取消")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}>{t("刪除")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
