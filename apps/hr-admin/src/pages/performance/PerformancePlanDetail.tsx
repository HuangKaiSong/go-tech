import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Target, ArrowLeft, Edit2, Trash2, Send, Download, BarChart3, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { getPerfPlanDetail, deletePerfPlan, publishPerfPlan, getPerfPlanResult, exportPerfResult, type PerfPlanStatus } from "@/api/performance";

const statusColors: Record<PerfPlanStatus, string> = {
  1: "bg-primary/10 text-primary border-primary/20",
  2: "bg-success/10 text-success border-success/20",
  0: "bg-muted text-muted-foreground",
};

export default function PerformancePlanDetail() {
  const { t } = useTranslation();
  const { planId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [delOpen, setDelOpen] = useState(false);
  const [pubOpen, setPubOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["perfPlanDetail", planId],
    queryFn: () => getPerfPlanDetail(planId!).then(r => r.data),
    enabled: !!planId,
  });

  const notDraft = data && data.planStatus !== 0;
  const { data: result } = useQuery({
    queryKey: ["perfPlanResult", planId],
    queryFn: () => getPerfPlanResult(planId!).then(r => r.data),
    enabled: !!planId && !!notDraft,
  });

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await exportPerfResult(planId!);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `${t("績效結果")}_${data?.name || planId}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      toast({ title: t("導出失敗"), description: e?.message, variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  const deleteMutation = useMutation({
    mutationFn: () => deletePerfPlan(planId!),
    onSuccess: () => {
      toast({ title: t("方案已刪除") });
      queryClient.invalidateQueries({ queryKey: ["perfPlanPage"] });
      navigate("/performance/plans");
    },
    onError: (e: any) => toast({ title: t("刪除失敗"), description: e?.message, variant: "destructive" }),
  });

  const publishMutation = useMutation({
    mutationFn: () => publishPerfPlan(planId!),
    onSuccess: (res) => {
      toast({ title: t("方案已發佈"), description: t("已生成考核任務，進入評分階段") });
      const warning = res?.data;
      if (warning) {
        toast({ title: t("互評人數不足提醒"), description: warning, variant: "warning", duration: 8000 });
      }
      queryClient.invalidateQueries({ queryKey: ["perfPlanPage"] });
      queryClient.invalidateQueries({ queryKey: ["perfPlanDetail", planId] });
      navigate("/performance/evaluation");
    },
    onError: (e: any) => toast({ title: t("發佈失敗"), description: e?.message, variant: "destructive" }),
  });

  if (isLoading || !data) {
    return <div className="py-20 text-center text-muted-foreground">{t("載入中...")}</div>;
  }

  const isDraft = data.planStatus === 0;
  const totalWeight = data.indicators.reduce((s, c) => s + c.weight, 0);

  return (
    <div>
      <div className="page-header">
        <Button variant="ghost" size="sm" className="mb-2 -ml-2 text-muted-foreground" onClick={() => navigate("/performance/plans")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> {t("返回列表")}
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title flex items-center gap-2">
              <Target className="h-6 w-6 text-primary" />
              {data.name}
            </h1>
            <p className="page-description">{t("查看考核方案的詳細設定")}</p>
          </div>
          <div className="flex gap-2">
            {notDraft && (
              <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting}>
                {exporting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Download className="h-4 w-4 mr-1" />}{t("匯出結果")}
              </Button>
            )}
            {isDraft && (
              <>
                <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDelOpen(true)}>
                  <Trash2 className="h-4 w-4 mr-1" />{t("刪除")}
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigate(`/performance/plans/${planId}/edit`)}>
                  <Edit2 className="h-4 w-4 mr-1" />{t("編輯方案")}
                </Button>
                <Button size="sm" onClick={() => setPubOpen(true)}>
                  <Send className="h-4 w-4 mr-1" />{t("發佈方案")}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 基本资讯 */}
      <Card className="mb-6">
        <CardHeader><CardTitle className="text-base">{t("基本資訊")}</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-5 gap-x-8">
            <InfoField label={t("方案名稱")} value={data.name} />
            <InfoField label={t("考核週期")} value={data.period || "-"} />
            <InfoField label={t("週期類型")} value={t(data.cycleText)} />
            <InfoField label={t("考核範圍")} value={data.scopeText} />
            <InfoField label={t("建立者")} value={data.creatorName || "-"} />
            <InfoField label={t("狀態")}>
              <Badge variant="secondary" className={statusColors[data.planStatus] || ""}>{t(data.planStatusText)}</Badge>
            </InfoField>
            <InfoField label={t("建立時間")} value={data.createTime || "-"} />
            <InfoField label={t("互評者人數")} value={String(data.peerCount)} />
          </div>
          {data.remark && (
            <>
              <Separator className="my-5" />
              <div>
                <p className="text-sm text-muted-foreground mb-1">{t("方案說明")}</p>
                <p className="text-sm leading-relaxed">{data.remark}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* 结果统计（非草稿） */}
      {notDraft && result && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><BarChart3 className="h-4 w-4" />{t("結果統計")}</CardTitle>
            <CardDescription>{t("考核任務完成情況與等級分布")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
              <StatBox label={t("考核人數")} value={result.totalTasks} />
              <StatBox label={t("已完成")} value={result.finishedTasks} />
              <StatBox label={t("完成率")} value={`${result.completionRate}%`} />
              <StatBox label={t("平均分")} value={result.avgScore ?? "—"} />
            </div>
            <div className="mb-5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-muted-foreground">{t("執行進度")}</span>
                <span className="text-sm font-semibold">{result.finishedTasks} / {result.totalTasks}</span>
              </div>
              <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${result.completionRate}%` }} />
              </div>
              <p className="text-xs text-muted-foreground mt-1 text-right">{result.completionRate}%</p>
            </div>
            {result.grades.length > 0 && (
              <div className="space-y-2">
                {result.grades.map(g => {
                  const pct = result.finishedTasks > 0 ? Math.round(g.count * 100 / result.finishedTasks) : 0;
                  return (
                    <div key={g.grade} className="flex items-center gap-3">
                      <Badge variant="outline" className="font-semibold w-12 justify-center shrink-0">{g.grade}</Badge>
                      <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-sm text-muted-foreground w-16 text-right shrink-0">{t("{{n}} 人", { n: g.count })}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 权重配置 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">{t("評分權重配置")}</CardTitle>
          <CardDescription>{t("各評估維度的權重佔比")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <WeightCard label={t("員工自評")} percent={data.selfWeight} color="bg-primary" />
            <WeightCard label={t("同事互評")} percent={data.peerWeight} color="bg-warning" />
            <WeightCard label={t("主管評價")} percent={data.managerWeight} color="bg-success" />
          </div>
        </CardContent>
      </Card>

      {/* 等级评定规则 */}
      <Card className="mb-6">
        <CardHeader><CardTitle className="text-base">{t("等級評定規則")}</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("等級")}</TableHead>
                <TableHead>{t("分數區間")}</TableHead>
                <TableHead>{t("說明")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.gradeRules.length === 0 ? (
                <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">{t("未設定評級規則")}</TableCell></TableRow>
              ) : data.gradeRules.map(rule => (
                <TableRow key={rule.grade + rule.minScore}>
                  <TableCell><Badge variant="outline" className="font-semibold">{rule.grade}</Badge></TableCell>
                  <TableCell>{t("{{min}} – {{max}} 分", { min: rule.minScore, max: rule.maxScore })}</TableCell>
                  <TableCell>{rule.description}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 考核指标 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("考核指標（共 {{count}} 項，總權重 {{weight}}%）", { count: data.indicators.length, weight: totalWeight })}</CardTitle>
          <CardDescription>{t("各分類考核指標的權重與評分方式")}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("分類")}</TableHead>
                <TableHead>{t("指標名稱")}</TableHead>
                <TableHead className="text-center">{t("權重")}</TableHead>
                <TableHead className="text-center">{t("滿分")}</TableHead>
                <TableHead>{t("評分方式")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.indicators.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">{t("未設定考核指標")}</TableCell></TableRow>
              ) : data.indicators.map(c => (
                <TableRow key={c.id}>
                  <TableCell><Badge variant="outline" className="text-xs">{t(c.categoryText)}</Badge></TableCell>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-center font-semibold">{c.weight}%</TableCell>
                  <TableCell className="text-center">{c.maxScore}</TableCell>
                  <TableCell className="text-sm">{t(c.scoringTypeText)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={pubOpen} onOpenChange={setPubOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("發佈考核方案")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("發佈後將按考核範圍生成逐員工任務並分配自評/互評/主管評，方案轉為「進行中」且不可再編輯。確定發佈「{{name}}」？", { name: data.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("取消")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => publishMutation.mutate()} disabled={publishMutation.isPending}>{t("確定發佈")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={delOpen} onOpenChange={setDelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("刪除考核方案")}</AlertDialogTitle>
            <AlertDialogDescription>{t("確定刪除方案「{{name}}」？此操作不可復原。", { name: data.name })}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("取消")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}>{t("確定刪除")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function InfoField({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground mb-0.5">{label}</p>
      {children || <p className="text-sm font-medium">{value}</p>}
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border p-3 text-center">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function WeightCard({ label, percent, color }: { label: string; percent: number; color: string }) {
  return (
    <div className="rounded-lg border p-4 text-center">
      <p className="text-sm text-muted-foreground mb-2">{label}</p>
      <p className="text-3xl font-bold mb-2">{percent}%</p>
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
