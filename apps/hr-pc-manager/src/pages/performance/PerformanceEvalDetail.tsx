import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Target, ArrowLeft, User, Users, UserCheck, Save, Edit2, Star,
  MessageSquare, CheckCircle, Clock, AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

// ─── Mock Data ───────────────────────────────────────────────

interface EvalCriterion {
  id: string;
  category: string;
  name: string;
  weight: number;
  description: string;
  selfScore: number | null;
  selfComment: string;
  peerReviews: { reviewer: string; department: string; score: number; comment: string }[];
  managerScore: number | null;
  managerComment: string;
}

const mockEmployee = {
  id: "EVL001",
  employeeId: "EMP001",
  name: "張小明",
  department: "技術部",
  position: "高級工程師",
  plan: "2026 Q1 績效考核",
  cycle: "2026-01 至 2026-03",
  status: "已完成",
  selfSubmittedAt: "2026-03-25",
  peerCompletedAt: "2026-03-28",
  managerReviewedAt: "2026-03-30",
  weightConfig: { self: 20, peer: 30, manager: 50 },
};

const mockCriteria: EvalCriterion[] = [
  {
    id: "C1", category: "工作業績", name: "專案交付達成率", weight: 25,
    description: "按時按質完成所負責專案的比率",
    selfScore: 92, selfComment: "本季度負責 3 個核心專案，均按時交付，其中支付系統重構提前一週完成，代碼品質通過率 98%。",
    peerReviews: [
      { reviewer: "黃志偉", department: "技術部", score: 90, comment: "技術能力紮實，程式碼品質高，Code Review 反饋及時有效。" },
      { reviewer: "李文華", department: "銷售部", score: 88, comment: "需求溝通順暢，能準確理解業務需求並快速實現。" },
      { reviewer: "林佳蓉", department: "財務部", score: 91, comment: "財務系統對接配合度高，數據準確性佳。" },
    ],
    managerScore: 94, managerComment: "專案管理能力突出，交付品質穩定，是團隊技術骨幹。建議承擔更多架構設計工作。",
  },
  {
    id: "C2", category: "工作業績", name: "代碼品質與技術債務", weight: 20,
    description: "代碼審查通過率、bug 修復速度及技術債務清理",
    selfScore: 88, selfComment: "重構了 3 個核心模組，減少技術債務約 30%，引入自動化測試覆蓋率提升至 85%。",
    peerReviews: [
      { reviewer: "黃志偉", department: "技術部", score: 92, comment: "重構方案設計合理，團隊成員受益匪淺，測試覆蓋率大幅提升。" },
      { reviewer: "王美玲", department: "人事部", score: 85, comment: "系統穩定性明顯改善，HR 系統故障率下降。" },
    ],
    managerScore: 90, managerComment: "技術債務清理工作做得很好，但需注意平衡新功能開發與重構的時間分配。",
  },
  {
    id: "C3", category: "工作能力", name: "團隊協作與溝通", weight: 20,
    description: "跨部門協作效率、知識分享及溝通能力",
    selfScore: 85, selfComment: "主導了 4 次技術分享會，協助 2 位新人完成入職培訓，跨部門需求對接效率提升。",
    peerReviews: [
      { reviewer: "黃志偉", department: "技術部", score: 90, comment: "技術分享內容豐富實用，對新人指導耐心細緻。" },
      { reviewer: "李文華", department: "銷售部", score: 86, comment: "回應速度快，能用淺顯語言解釋技術問題，溝通效果好。" },
      { reviewer: "陳大偉", department: "市場部", score: 84, comment: "跨部門合作態度積極，偶爾在需求優先級協調上有延遲。" },
    ],
    managerScore: 88, managerComment: "團隊影響力持續增強，知識分享做得出色。建議加強對下游團隊的主動溝通。",
  },
  {
    id: "C4", category: "工作能力", name: "問題解決與創新", weight: 15,
    description: "面對技術難題的解決能力及創新貢獻",
    selfScore: 90, selfComment: "提出並實現了快取優化方案，API 回應時間降低 40%。解決了 2 個長期存在的疑難 bug。",
    peerReviews: [
      { reviewer: "黃志偉", department: "技術部", score: 93, comment: "快取方案設計精巧，效果顯著，值得全團隊推廣。" },
      { reviewer: "林佳蓉", department: "財務部", score: 88, comment: "報表查詢速度明顯提升，使用體驗改善很大。" },
    ],
    managerScore: 95, managerComment: "創新能力是團隊亮點，快取優化方案已作為最佳實踐推廣。期待更多創新提案。",
  },
  {
    id: "C5", category: "工作態度", name: "工作積極性與責任感", weight: 10,
    description: "工作主動性、責任心及對團隊目標的貢獻",
    selfScore: 92, selfComment: "主動承擔緊急需求，多次在週末協助排查線上問題，確保系統穩定運行。",
    peerReviews: [
      { reviewer: "黃志偉", department: "技術部", score: 94, comment: "責任心極強，緊急情況下總是第一個響應。" },
      { reviewer: "王美玲", department: "人事部", score: 90, comment: "工作態度端正，團隊口碑很好。" },
    ],
    managerScore: 93, managerComment: "責任感和主動性值得表揚，是團隊可靠的核心成員。注意保持工作與生活平衡。",
  },
  {
    id: "C6", category: "工作態度", name: "學習成長與自我提升", weight: 10,
    description: "專業技能提升、學習計畫執行及職業發展",
    selfScore: 88, selfComment: "完成雲端架構師認證考試，閱讀了 3 本技術書籍，參加 2 場外部技術研討會。",
    peerReviews: [
      { reviewer: "黃志偉", department: "技術部", score: 86, comment: "持續學習態度好，新技術應用能力強。" },
    ],
    managerScore: 90, managerComment: "學習計畫執行到位，建議將所學更多應用於實際專案，並帶領團隊共同成長。",
  },
];

// ─── Helpers ─────────────────────────────────────────────────

const statusColors: Record<string, string> = {
  "已完成": "bg-success/10 text-success border-success/20",
  "進行中": "bg-primary/10 text-primary border-primary/20",
  "待自評": "bg-warning/10 text-warning border-warning/20",
  "同事互評中": "bg-primary/10 text-primary border-primary/20",
  "待主管評": "bg-accent text-accent-foreground",
};

const ScoreStars = ({ score }: { score: number }) => {
  const stars = Math.round(score / 20);
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star key={s} className={`h-3.5 w-3.5 ${s <= stars ? "text-warning fill-warning" : "text-muted-foreground/20"}`} />
      ))}
      <span className="ml-1.5 text-sm font-semibold">{score}</span>
    </div>
  );
};

const ScoreBadge = ({ score }: { score: number | null }) => {
  if (score === null) return <span className="text-muted-foreground">-</span>;
  const cls = score >= 90 ? "bg-success/10 text-success border-success/20"
    : score >= 80 ? "bg-primary/10 text-primary border-primary/20"
    : score >= 70 ? "bg-warning/10 text-warning border-warning/20"
    : "bg-destructive/10 text-destructive border-destructive/20";
  return <Badge variant="secondary" className={cls}>{score}</Badge>;
};

const getGrade = (s: number) => s >= 95 ? "A+" : s >= 90 ? "A" : s >= 85 ? "B+" : s >= 80 ? "B" : s >= 70 ? "C" : "D";

// ─── Component ───────────────────────────────────────────────

export default function PerformanceEvalDetail() {
  const { evalId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [isScoring, setIsScoring] = useState(false);
  const [scores, setScores] = useState<Record<string, { score: string; comment: string }>>(
    Object.fromEntries(mockCriteria.map(c => [c.id, { score: String(c.managerScore ?? ""), comment: c.managerComment }]))
  );

  const { self: wSelf, peer: wPeer, manager: wMgr } = mockEmployee.weightConfig;

  const calcFinal = (c: EvalCriterion) => {
    if (c.selfScore == null || c.managerScore == null) return null;
    const peerAvg = c.peerReviews.length > 0 ? c.peerReviews.reduce((s, p) => s + p.score, 0) / c.peerReviews.length : 0;
    return Math.round(c.selfScore * (wSelf / 100) + peerAvg * (wPeer / 100) + c.managerScore * (wMgr / 100));
  };

  const overallScore = mockCriteria.reduce((sum, c) => {
    const f = calcFinal(c);
    return sum + (f ? f * c.weight / 100 : 0);
  }, 0);

  const handleSave = () => {
    setIsScoring(false);
    toast({ title: "評分已儲存", description: "主管評分與評語已成功更新" });
  };

  // ── Workflow steps
  const steps = [
    { label: "員工自評", date: mockEmployee.selfSubmittedAt, done: !!mockEmployee.selfSubmittedAt, icon: User },
    { label: "同事互評", date: mockEmployee.peerCompletedAt, done: !!mockEmployee.peerCompletedAt, icon: Users },
    { label: "主管評價", date: mockEmployee.managerReviewedAt, done: !!mockEmployee.managerReviewedAt, icon: UserCheck },
    { label: "評估完成", date: mockEmployee.managerReviewedAt, done: mockEmployee.status === "已完成", icon: CheckCircle },
  ];

  // Group criteria by category
  const categories = [...new Set(mockCriteria.map(c => c.category))];

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <Button variant="ghost" size="sm" className="mb-2 -ml-2 text-muted-foreground" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-1" /> 返回列表
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title flex items-center gap-2">
              <Target className="h-6 w-6 text-primary" />
              績效評估詳情
            </h1>
            <p className="page-description">{mockEmployee.name} — {mockEmployee.plan}</p>
          </div>
          <div className="flex gap-2">
            {!isScoring ? (
              <Button size="sm" onClick={() => { setActiveTab("manager"); setIsScoring(true); }}>
                <Edit2 className="h-4 w-4 mr-1" /> 主管評分
              </Button>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={() => setIsScoring(false)}>取消</Button>
                <Button size="sm" onClick={handleSave}>
                  <Save className="h-4 w-4 mr-1" /> 儲存評分
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Top: Employee info + progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Employee card */}
        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">{mockEmployee.name}</h2>
                  <p className="text-sm text-muted-foreground">{mockEmployee.department} · {mockEmployee.position} · {mockEmployee.employeeId}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{mockEmployee.plan} · {mockEmployee.cycle}</p>
                </div>
              </div>
              <Badge variant="secondary" className={`${statusColors[mockEmployee.status] || ""} text-sm px-3 py-1`}>{mockEmployee.status}</Badge>
            </div>

            <Separator className="my-5" />

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">加權總分</p>
                <p className="text-3xl font-bold text-primary">{overallScore.toFixed(1)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">考核等級</p>
                <p className="text-3xl font-bold">{getGrade(overallScore)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">評分權重</p>
                <p className="text-sm font-medium">自評 {wSelf}% · 互評 {wPeer}% · 主管 {wMgr}%</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">考核指標</p>
                <p className="text-3xl font-bold">{mockCriteria.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Workflow progress */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">評估流程</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {steps.map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${step.done ? "bg-success/10" : "bg-muted"}`}>
                    <step.icon className={`h-4 w-4 ${step.done ? "text-success" : "text-muted-foreground"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${step.done ? "" : "text-muted-foreground"}`}>{step.label}</p>
                    <p className="text-xs text-muted-foreground">{step.done ? step.date : "待進行"}</p>
                  </div>
                  {step.done && <CheckCircle className="h-4 w-4 text-success mt-1 shrink-0" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="overview">指標總覽</TabsTrigger>
          <TabsTrigger value="self"><User className="h-4 w-4 mr-1" />自評</TabsTrigger>
          <TabsTrigger value="peer"><Users className="h-4 w-4 mr-1" />同事互評</TabsTrigger>
          <TabsTrigger value="manager"><UserCheck className="h-4 w-4 mr-1" />主管評價</TabsTrigger>
        </TabsList>

        {/* ── Overview ── */}
        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">各項指標評分對比</CardTitle>
              <CardDescription>自評（{wSelf}%）、同事互評（{wPeer}%）、主管評分（{wMgr}%）加權計算最終得分</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>分類</TableHead>
                    <TableHead>考核指標</TableHead>
                    <TableHead className="text-center">權重</TableHead>
                    <TableHead className="text-center">自評</TableHead>
                    <TableHead className="text-center">互評均分</TableHead>
                    <TableHead className="text-center">主管評分</TableHead>
                    <TableHead className="text-center">加權得分</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockCriteria.map(c => {
                    const peerAvg = c.peerReviews.length > 0 ? (c.peerReviews.reduce((s, p) => s + p.score, 0) / c.peerReviews.length) : null;
                    const final = calcFinal(c);
                    return (
                      <TableRow key={c.id}>
                        <TableCell><Badge variant="outline" className="text-xs">{c.category}</Badge></TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{c.name}</p>
                            <p className="text-xs text-muted-foreground">{c.description}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-medium">{c.weight}%</TableCell>
                        <TableCell className="text-center"><ScoreBadge score={c.selfScore} /></TableCell>
                        <TableCell className="text-center"><ScoreBadge score={peerAvg ? Math.round(peerAvg) : null} /></TableCell>
                        <TableCell className="text-center"><ScoreBadge score={c.managerScore} /></TableCell>
                        <TableCell className="text-center"><ScoreBadge score={final} /></TableCell>
                      </TableRow>
                    );
                  })}
                  <TableRow className="bg-muted/30 font-semibold">
                    <TableCell colSpan={2}>加權總分</TableCell>
                    <TableCell className="text-center">100%</TableCell>
                    <TableCell colSpan={3} />
                    <TableCell className="text-center">
                      <Badge className="bg-primary text-primary-foreground">{overallScore.toFixed(1)} ({getGrade(overallScore)})</Badge>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Self Evaluation ── */}
        <TabsContent value="self">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">員工自評</CardTitle>
                </div>
                <CardDescription>提交時間：{mockEmployee.selfSubmittedAt}　權重佔比：{wSelf}%</CardDescription>
              </CardHeader>
            </Card>
            {categories.map(cat => (
              <div key={cat}>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">{cat}</h3>
                <div className="space-y-3">
                  {mockCriteria.filter(c => c.category === cat).map(item => (
                    <Card key={item.id}>
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold">{item.name}</h4>
                            <p className="text-xs text-muted-foreground">{item.description} · 權重 {item.weight}%</p>
                          </div>
                          {item.selfScore != null && <ScoreStars score={item.selfScore} />}
                        </div>
                        <Separator className="my-3" />
                        <div className="flex items-start gap-2">
                          <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                          <p className="text-sm leading-relaxed">{item.selfComment || "未填寫"}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* ── Peer Review ── */}
        <TabsContent value="peer">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">同事互評</CardTitle>
                </div>
                <CardDescription>完成時間：{mockEmployee.peerCompletedAt}　權重佔比：{wPeer}%　共 {new Set(mockCriteria.flatMap(c => c.peerReviews.map(p => p.reviewer))).size} 位同事參與</CardDescription>
              </CardHeader>
            </Card>
            {categories.map(cat => (
              <div key={cat}>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">{cat}</h3>
                <div className="space-y-3">
                  {mockCriteria.filter(c => c.category === cat).map(item => (
                    <Card key={item.id}>
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-semibold">{item.name}</h4>
                            <p className="text-xs text-muted-foreground">權重 {item.weight}% · 共 {item.peerReviews.length} 位評價</p>
                          </div>
                          <Badge variant="secondary">
                            均分：{(item.peerReviews.reduce((s, p) => s + p.score, 0) / (item.peerReviews.length || 1)).toFixed(1)}
                          </Badge>
                        </div>
                        <Separator className="my-3" />
                        <div className="space-y-4">
                          {item.peerReviews.map((peer, idx) => (
                            <div key={idx} className="flex items-start gap-3">
                              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                                <User className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <span className="text-sm font-medium">{peer.reviewer}</span>
                                    <span className="text-xs text-muted-foreground ml-2">{peer.department}</span>
                                  </div>
                                  <ScoreStars score={peer.score} />
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">{peer.comment}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* ── Manager Review ── */}
        <TabsContent value="manager">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">主管評價</CardTitle>
                </div>
                <CardDescription>
                  {isScoring ? "編輯模式：修改各項指標評分與評語後點擊儲存" : `評價時間：${mockEmployee.managerReviewedAt}　權重佔比：${wMgr}%`}
                </CardDescription>
              </CardHeader>
            </Card>
            {categories.map(cat => (
              <div key={cat}>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">{cat}</h3>
                <div className="space-y-3">
                  {mockCriteria.filter(c => c.category === cat).map(item => {
                    const peerAvg = item.peerReviews.length > 0
                      ? (item.peerReviews.reduce((s, p) => s + p.score, 0) / item.peerReviews.length).toFixed(1) : "-";
                    return (
                      <Card key={item.id}>
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-semibold">{item.name}</h4>
                              <p className="text-xs text-muted-foreground">
                                權重 {item.weight}% · 自評：{item.selfScore ?? "-"} · 互評均分：{peerAvg}
                              </p>
                            </div>
                            {!isScoring && item.managerScore != null && <ScoreStars score={item.managerScore} />}
                          </div>
                          <Separator className="my-3" />
                          {isScoring ? (
                            <div className="space-y-3">
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-medium w-14 shrink-0">評分</span>
                                <Select
                                  value={scores[item.id]?.score || ""}
                                  onValueChange={v => setScores(prev => ({ ...prev, [item.id]: { ...prev[item.id], score: v } }))}
                                >
                                  <SelectTrigger className="w-[120px]"><SelectValue placeholder="選擇分數" /></SelectTrigger>
                                  <SelectContent>
                                    {Array.from({ length: 21 }, (_, i) => 100 - i * 5).map(v => (
                                      <SelectItem key={v} value={String(v)}>{v} 分</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <span className="text-sm font-medium">評語</span>
                                <Textarea
                                  className="mt-1.5"
                                  rows={3}
                                  placeholder="請輸入評語..."
                                  value={scores[item.id]?.comment || ""}
                                  onChange={e => setScores(prev => ({ ...prev, [item.id]: { ...prev[item.id], comment: e.target.value } }))}
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start gap-2">
                              <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                              <p className="text-sm leading-relaxed">{item.managerComment || "未填寫"}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
