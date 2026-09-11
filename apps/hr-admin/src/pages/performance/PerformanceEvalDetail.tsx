import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  Target, ArrowLeft, Send, CheckCircle2, Circle, User, Users, UserCheck,
  Star, MessageSquare, CheckCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import {
  getPerfTaskDetail, getPerfTaskBreakdown, submitPerfScore, calibratePerfTask,
  type PerfTaskStatus, type PerfIndicatorBreakdown, type PerfReviewerProgress,
} from "@/api/performance";

const taskStatusColors: Record<PerfTaskStatus, string> = {
  0: "bg-warning/10 text-warning border-warning/20",
  1: "bg-primary/10 text-primary border-primary/20",
  2: "bg-accent text-accent-foreground",
  3: "bg-primary/10 text-primary border-primary/20",
  4: "bg-success/10 text-success border-success/20",
};

interface ScoreState {
  score: string;
  comment: string;
}

/** 按满分折算 5 星显示 */
function StarRow({ score, maxScore }: { score: number; maxScore: number }) {
  const unit = maxScore > 0 ? maxScore / 5 : 20;
  const stars = Math.round(score / unit);
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star key={s} className={`h-3.5 w-3.5 ${s <= stars ? "text-warning fill-warning" : "text-muted-foreground/20"}`} />
      ))}
      <span className="ml-1.5 text-sm font-semibold">{score}</span>
    </div>
  );
}

function ScoreBadge({ score }: { score: number | null }) {
  if (score == null) return <span className="text-muted-foreground">-</span>;
  const cls = score >= 90 ? "bg-success/10 text-success border-success/20"
    : score >= 80 ? "bg-primary/10 text-primary border-primary/20"
    : score >= 70 ? "bg-warning/10 text-warning border-warning/20"
    : "bg-destructive/10 text-destructive border-destructive/20";
  return <Badge variant="secondary" className={cls}>{score}</Badge>;
}

/** 互评均分（原始分，四舍五入到 1 位） */
function peerAvg(item: PerfIndicatorBreakdown): number | null {
  const vals = item.peerReviews.map(p => p.score).filter((v): v is number => v != null);
  if (vals.length === 0) return null;
  return Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 10) / 10;
}

export default function PerformanceEvalDetail() {
  const { t } = useTranslation();
  const { evalId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [scores, setScores] = useState<Record<string, ScoreState>>({});
  const [calib, setCalib] = useState({ finalScore: "", grade: "", reason: "" });
  const [activeTab, setActiveTab] = useState("overview");

  const { data, isLoading } = useQuery({
    queryKey: ["perfTaskDetail", evalId],
    queryFn: () => getPerfTaskDetail(evalId!).then(r => r.data),
    enabled: !!evalId,
  });
  const { data: breakdown = [] } = useQuery({
    queryKey: ["perfTaskBreakdown", evalId],
    queryFn: () => getPerfTaskBreakdown(evalId!).then(r => r.data),
    enabled: !!evalId,
  });

  useEffect(() => {
    if (!data) return;
    if (data.scoreItems) {
      const init: Record<string, ScoreState> = {};
      data.scoreItems.forEach(it => {
        init[it.indicatorId] = {
          score: it.myScore != null ? String(it.myScore) : "",
          comment: it.myComment || "",
        };
      });
      setScores(init);
    }
    setCalib({
      finalScore: data.finalScore != null ? String(data.finalScore) : "",
      grade: data.grade || "",
      reason: "",
    });
  }, [data]);

  const submitMutation = useMutation({
    mutationFn: () => submitPerfScore({
      taskId: evalId!,
      items: (data?.scoreItems ?? []).map(it => ({
        indicatorId: it.indicatorId,
        score: Number(scores[it.indicatorId]?.score ?? 0),
        comment: scores[it.indicatorId]?.comment || undefined,
      })),
    }),
    onSuccess: () => {
      toast({ title: t("評分已提交") });
      queryClient.invalidateQueries({ queryKey: ["perfTaskDetail", evalId] });
      queryClient.invalidateQueries({ queryKey: ["perfTaskBreakdown", evalId] });
      queryClient.invalidateQueries({ queryKey: ["myPerfTasks"] });
      queryClient.invalidateQueries({ queryKey: ["perfTaskPage"] });
    },
    onError: (e: any) => toast({ title: t("提交失敗"), description: e?.message, variant: "destructive" }),
  });

  const calibrateMutation = useMutation({
    mutationFn: () => calibratePerfTask({
      taskId: evalId!,
      finalScore: Number(calib.finalScore),
      grade: calib.grade || undefined,
      reason: calib.reason || undefined,
    }),
    onSuccess: () => {
      toast({ title: t("已校准並完成") });
      queryClient.invalidateQueries({ queryKey: ["perfTaskDetail", evalId] });
      queryClient.invalidateQueries({ queryKey: ["perfTaskPage"] });
    },
    onError: (e: any) => toast({ title: t("校准失敗"), description: e?.message, variant: "destructive" }),
  });

  if (isLoading || !data) {
    return <div className="py-20 text-center text-muted-foreground">{t("載入中...")}</div>;
  }

  const handleSubmit = () => {
    const items = data.scoreItems ?? [];
    for (const it of items) {
      const raw = scores[it.indicatorId]?.score;
      if (raw === "" || raw == null) {
        toast({ title: t("請完成所有指標評分"), description: it.name, variant: "destructive" });
        return;
      }
      const n = Number(raw);
      if (Number.isNaN(n) || n < 0 || n > it.maxScore) {
        toast({ title: t("「{{name}}」評分需在 0~{{max}} 之間", { name: it.name, max: it.maxScore }), variant: "destructive" });
        return;
      }
    }
    submitMutation.mutate();
  };

  const setScore = (id: string, patch: Partial<ScoreState>) =>
    setScores(prev => ({
      ...prev,
      [id]: prev[id] ? { ...prev[id], ...patch } : { score: "", comment: "", ...patch },
    }));

  const { selfWeight: wSelf, peerWeight: wPeer, managerWeight: wMgr } = data;

  // 每条指标的三方加权（按在场方权重归一化，与后端口径一致）
  const weightedOf = (item: PerfIndicatorBreakdown): number | null => {
    let sum = 0, w = 0;
    if (item.selfScore != null) { sum += item.selfScore * wSelf; w += wSelf; }
    const pa = peerAvg(item);
    if (pa != null) { sum += pa * wPeer; w += wPeer; }
    if (item.managerScore != null) { sum += item.managerScore * wMgr; w += wMgr; }
    return w === 0 ? null : Math.round((sum / w) * 10) / 10;
  };

  // 评估流程时间线（由三方评价人提交状态推导）
  const byType = (rt: number) => data.reviewers.filter(r => r.reviewerType === rt);
  const selfR = byType(1);
  const peerR = byType(2);
  const mgrR = byType(3);
  const lastTime = (rs: PerfReviewerProgress[]) =>
    rs.filter(r => r.submitStatus === 1).map(r => r.submitTime).filter(Boolean).sort().pop() || null;
  const selfDone = selfR.length > 0 && selfR.every(r => r.submitStatus === 1);
  const peerDone = peerR.length > 0 && peerR.every(r => r.submitStatus === 1);
  const mgrDone = mgrR.length > 0 && mgrR.every(r => r.submitStatus === 1);
  const steps = [
    { label: t("員工自評"), date: lastTime(selfR), done: selfDone, icon: User },
    { label: t("同事互評"), date: lastTime(peerR), done: peerDone, icon: Users, na: peerR.length === 0 },
    { label: t("主管評價"), date: lastTime(mgrR), done: mgrDone, icon: UserCheck, na: mgrR.length === 0 },
    { label: t("評估完成"), date: null, done: data.taskStatus === 4, icon: CheckCircle },
  ];

  const categories = [...new Set(breakdown.map(c => c.categoryText))];
  const peerParticipants = new Set(
    breakdown.flatMap(c => c.peerReviews.map(p => p.reviewerName).filter(Boolean))
  ).size;

  return (
    <div>
      <div className="page-header">
        <Button variant="ghost" size="sm" className="mb-2 -ml-2 text-muted-foreground" onClick={() => navigate("/performance/evaluation")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> {t("返回列表")}
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title flex items-center gap-2">
              <Target className="h-6 w-6 text-primary" />
              {t("績效評估詳情")}
            </h1>
            <p className="page-description">{data.employeeName} — {data.planName}</p>
          </div>
          <Badge variant="secondary" className={`${taskStatusColors[data.taskStatus] || ""} text-sm px-3 py-1`}>{t(data.taskStatusText)}</Badge>
        </div>
      </div>

      {/* 员工信息卡 + 评估流程 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <User className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">{data.employeeName}</h2>
                  <p className="text-sm text-muted-foreground">
                    {[data.departmentName, data.position].filter(Boolean).join(" · ") || "-"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-0.5">{data.planName}</p>
                </div>
              </div>
            </div>

            <Separator className="my-5" />

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">{t("加權總分")}</p>
                <p className="text-3xl font-bold text-primary">{data.finalScore ?? "—"}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">{t("考核等級")}</p>
                <p className="text-3xl font-bold">{data.grade || "—"}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">{t("評分權重")}</p>
                <p className="text-sm font-medium mt-2">{t("自評 {{self}}% · 互評 {{peer}}% · 主管 {{mgr}}%", { self: wSelf, peer: wPeer, mgr: wMgr })}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">{t("考核指標")}</p>
                <p className="text-3xl font-bold">{breakdown.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">{t("評估流程")}</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {steps.map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${step.done ? "bg-success/10" : "bg-muted"}`}>
                    <step.icon className={`h-4 w-4 ${step.done ? "text-success" : "text-muted-foreground"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${step.done ? "" : "text-muted-foreground"}`}>{step.label}</p>
                    <p className="text-xs text-muted-foreground">{step.na ? t("無此環節") : step.done ? (step.date || t("已完成")) : t("待進行")}</p>
                  </div>
                  {step.done && <CheckCircle2 className="h-4 w-4 text-success mt-1 shrink-0" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* HR 校准（待校准时） */}
      {data.taskStatus === 3 && (
        <Card className="mb-6 border-primary/40">
          <CardHeader>
            <CardTitle className="text-base">{t("校准並完成")}</CardTitle>
            <CardDescription>{t("三方評分已齊全，系統已自動算出最終分與評級，可在此調整後確認完成")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">{t("最終分")}</Label>
                <Input type="number" min={0} max={100} value={calib.finalScore}
                  onChange={e => setCalib(p => ({ ...p, finalScore: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t("評級")}</Label>
                <Input value={calib.grade} placeholder={t("如 A / B")} onChange={e => setCalib(p => ({ ...p, grade: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t("調整原因（選填）")}</Label>
                <Input value={calib.reason} placeholder={t("與自動值不同時建議填寫")} onChange={e => setCalib(p => ({ ...p, reason: e.target.value }))} />
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <Button onClick={() => calibrateMutation.mutate()} disabled={calibrateMutation.isPending || calib.finalScore === ""}>
                <CheckCircle2 className="h-4 w-4 mr-1" />{t("確認完成")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 我的评分录入（当前登录人是评价人时） */}
      {data.myReviewerType != null && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">
                  {t("我的評分（{{type}}）", { type: t(data.myReviewerTypeText ?? "") })}
                </CardTitle>
                <CardDescription>
                  {data.mySubmitted ? t("您已提交，以下為評分記錄") : t("為每個指標打分，分數區間為 0~該指標滿分")}
                </CardDescription>
              </div>
              {data.mySubmitted && <Badge variant="secondary" className="bg-success/10 text-success border-success/20">{t("已提交")}</Badge>}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {(data.scoreItems ?? []).map(it => (
              <div key={it.indicatorId} className="rounded-lg border p-4">
                <div className="flex items-center justify-between mb-3 gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{t(it.categoryText)}</Badge>
                      <span className="font-medium truncate">{it.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{t("權重 {{weight}}% · 滿分 {{max}} · {{type}}", { weight: it.weight, max: it.maxScore, type: t(it.scoringTypeText) })}</p>
                  </div>
                  <div className="w-28 shrink-0">
                    <Input
                      type="number" min={0} max={it.maxScore}
                      placeholder={`0~${it.maxScore}`}
                      disabled={data.mySubmitted}
                      value={scores[it.indicatorId]?.score ?? ""}
                      onChange={e => setScore(it.indicatorId, { score: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">{t("評語（選填）")}</Label>
                  <Textarea
                    rows={2} disabled={data.mySubmitted}
                    placeholder={t("對該指標表現的評語...")}
                    value={scores[it.indicatorId]?.comment ?? ""}
                    onChange={e => setScore(it.indicatorId, { comment: e.target.value })}
                  />
                </div>
              </div>
            ))}
            {!data.mySubmitted && (
              <div className="flex justify-end">
                <Button onClick={handleSubmit} disabled={submitMutation.isPending}>
                  <Send className="h-4 w-4 mr-1" />{t("提交評分")}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 三方明细四 Tab */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="overview">{t("指標總覽")}</TabsTrigger>
          <TabsTrigger value="self"><User className="h-4 w-4 mr-1" />{t("自評")}</TabsTrigger>
          <TabsTrigger value="peer"><Users className="h-4 w-4 mr-1" />{t("同事互評")}</TabsTrigger>
          <TabsTrigger value="manager"><UserCheck className="h-4 w-4 mr-1" />{t("主管評價")}</TabsTrigger>
        </TabsList>

        {/* 指标总览 */}
        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("各項指標評分對比")}</CardTitle>
              <CardDescription>{t("自評（{{self}}%）、同事互評（{{peer}}%）、主管評分（{{mgr}}%）按在場方權重加權", { self: wSelf, peer: wPeer, mgr: wMgr })}</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("分類")}</TableHead>
                    <TableHead>{t("考核指標")}</TableHead>
                    <TableHead className="text-center">{t("權重")}</TableHead>
                    <TableHead className="text-center">{t("自評")}</TableHead>
                    <TableHead className="text-center">{t("互評均分")}</TableHead>
                    <TableHead className="text-center">{t("主管評分")}</TableHead>
                    <TableHead className="text-center">{t("加權得分")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {breakdown.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">{t("尚無評分數據")}</TableCell></TableRow>
                  ) : breakdown.map(c => (
                    <TableRow key={c.indicatorId}>
                      <TableCell><Badge variant="outline" className="text-xs">{t(c.categoryText)}</Badge></TableCell>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell className="text-center font-medium">{c.weight}%</TableCell>
                      <TableCell className="text-center"><ScoreBadge score={c.selfScore} /></TableCell>
                      <TableCell className="text-center"><ScoreBadge score={peerAvg(c)} /></TableCell>
                      <TableCell className="text-center"><ScoreBadge score={c.managerScore} /></TableCell>
                      <TableCell className="text-center"><ScoreBadge score={weightedOf(c)} /></TableCell>
                    </TableRow>
                  ))}
                  {breakdown.length > 0 && (
                    <TableRow className="bg-muted/30 font-semibold">
                      <TableCell colSpan={2}>{t("加權總分")}</TableCell>
                      <TableCell className="text-center">{breakdown.reduce((s, c) => s + c.weight, 0)}%</TableCell>
                      <TableCell colSpan={3} />
                      <TableCell className="text-center">
                        <Badge className="bg-primary text-primary-foreground">
                          {data.finalScore ?? "—"}{data.grade ? ` (${data.grade})` : ""}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 自评 */}
        <TabsContent value="self">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">{t("員工自評")}</CardTitle>
                </div>
                <CardDescription>{t("權重佔比：{{weight}}%", { weight: wSelf })}{selfDone ? t(" · 提交時間：{{time}}", { time: lastTime(selfR) || "-" }) : t(" · 尚未提交")}</CardDescription>
              </CardHeader>
            </Card>
            {categories.map(cat => (
              <div key={cat}>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">{cat}</h3>
                <div className="space-y-3">
                  {breakdown.filter(c => c.categoryText === cat).map(item => (
                    <Card key={item.indicatorId}>
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-2 gap-3">
                          <div>
                            <h4 className="font-semibold">{item.name}</h4>
                            <p className="text-xs text-muted-foreground">{t("權重 {{weight}}% · 滿分 {{max}}", { weight: item.weight, max: item.maxScore })}</p>
                          </div>
                          {item.selfScore != null && <StarRow score={item.selfScore} maxScore={item.maxScore} />}
                        </div>
                        <Separator className="my-3" />
                        <div className="flex items-start gap-2">
                          <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                          <p className="text-sm leading-relaxed">{item.selfComment || t("未填寫")}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* 同事互评 */}
        <TabsContent value="peer">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">{t("同事互評")}</CardTitle>
                </div>
                <CardDescription>{t("權重佔比：{{weight}}% · 共 {{count}} 位同事參與", { weight: wPeer, count: peerParticipants })}</CardDescription>
              </CardHeader>
            </Card>
            {categories.map(cat => (
              <div key={cat}>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">{cat}</h3>
                <div className="space-y-3">
                  {breakdown.filter(c => c.categoryText === cat).map(item => (
                    <Card key={item.indicatorId}>
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-3 gap-3">
                          <div>
                            <h4 className="font-semibold">{item.name}</h4>
                            <p className="text-xs text-muted-foreground">{t("權重 {{weight}}% · 共 {{count}} 位評價", { weight: item.weight, count: item.peerReviews.length })}</p>
                          </div>
                          {peerAvg(item) != null && <Badge variant="secondary">{t("均分：{{avg}}", { avg: peerAvg(item) })}</Badge>}
                        </div>
                        <Separator className="my-3" />
                        {item.peerReviews.length === 0 ? (
                          <p className="text-sm text-muted-foreground">{t("尚無互評")}</p>
                        ) : (
                          <div className="space-y-4">
                            {item.peerReviews.map((peer, idx) => (
                              <div key={idx} className="flex items-start gap-3">
                                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                                  <User className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2">
                                    <div>
                                      <span className="text-sm font-medium">{peer.reviewerName || t("同事")}</span>
                                      {peer.department && <span className="text-xs text-muted-foreground ml-2">{peer.department}</span>}
                                    </div>
                                    {peer.score != null && <StarRow score={peer.score} maxScore={item.maxScore} />}
                                  </div>
                                  {peer.comment && <p className="text-sm text-muted-foreground mt-1">{peer.comment}</p>}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* 主管评价 */}
        <TabsContent value="manager">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">{t("主管評價")}</CardTitle>
                </div>
                <CardDescription>{t("權重佔比：{{weight}}%", { weight: wMgr })}{mgrDone ? t(" · 評價時間：{{time}}", { time: lastTime(mgrR) || "-" }) : t(" · 尚未提交")}</CardDescription>
              </CardHeader>
            </Card>
            {categories.map(cat => (
              <div key={cat}>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">{cat}</h3>
                <div className="space-y-3">
                  {breakdown.filter(c => c.categoryText === cat).map(item => (
                    <Card key={item.indicatorId}>
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-2 gap-3">
                          <div>
                            <h4 className="font-semibold">{item.name}</h4>
                            <p className="text-xs text-muted-foreground">
                              {t("權重 {{weight}}% · 自評：{{self}} · 互評均分：{{peer}}", { weight: item.weight, self: item.selfScore ?? "-", peer: peerAvg(item) ?? "-" })}
                            </p>
                          </div>
                          {item.managerScore != null && <StarRow score={item.managerScore} maxScore={item.maxScore} />}
                        </div>
                        <Separator className="my-3" />
                        <div className="flex items-start gap-2">
                          <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                          <p className="text-sm leading-relaxed">{item.managerComment || t("未填寫")}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
