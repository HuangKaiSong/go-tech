import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Target, ArrowLeft, User, Users, UserCheck, Save, Edit2, Star, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface KpiItem {
  id: string;
  name: string;
  weight: number;
  target: string;
  actual: string;
  completionRate: number;
  selfScore: number;
  selfComment: string;
  peerScores: { reviewer: string; score: number; comment: string }[];
  managerScore: number;
  managerComment: string;
  finalScore: number;
}

const mockKpiItems: KpiItem[] = [
  {
    id: "K1", name: "季度銷售額達標率", weight: 30, target: "100萬", actual: "95萬",
    completionRate: 95,
    selfScore: 90, selfComment: "本季度積極開拓新客戶，雖未完全達標但已超出預期進度，下季度有信心完成目標。",
    peerScores: [
      { reviewer: "王美玲", score: 88, comment: "協作配合度高，主動分享客戶資源，對團隊貢獻良好。" },
      { reviewer: "黃志偉", score: 85, comment: "跨部門溝通順暢，需求對接及時。" },
    ],
    managerScore: 92, managerComment: "銷售業績穩定成長，客戶維護做得很好，建議加強新市場開拓。",
    finalScore: 90,
  },
  {
    id: "K2", name: "客戶滿意度", weight: 25, target: "≥ 90%", actual: "92%",
    completionRate: 100,
    selfScore: 95, selfComment: "持續改進服務流程，客戶回訪好評率較上季提升5%。",
    peerScores: [
      { reviewer: "王美玲", score: 90, comment: "客戶反饋積極，處理投訴效率高。" },
      { reviewer: "陳大偉", score: 92, comment: "客戶關係維護到位，多次獲得客戶表揚。" },
    ],
    managerScore: 93, managerComment: "客戶滿意度超標完成，服務品質持續提升，是團隊標桿。",
    finalScore: 93,
  },
  {
    id: "K3", name: "新客戶開發數量", weight: 20, target: "15 位", actual: "12 位",
    completionRate: 80,
    selfScore: 78, selfComment: "受市場環境影響，新客戶開發有一定難度，已調整策略加強線上渠道推廣。",
    peerScores: [
      { reviewer: "黃志偉", score: 75, comment: "線上推廣素材準備充分，但轉化率有提升空間。" },
      { reviewer: "林佳蓉", score: 80, comment: "費用控制合理，ROI表現良好。" },
    ],
    managerScore: 76, managerComment: "新客戶開發未達標，需加強市場分析和精準行銷能力。",
    finalScore: 77,
  },
  {
    id: "K4", name: "團隊培訓參與度", weight: 15, target: "100%", actual: "100%",
    completionRate: 100,
    selfScore: 95, selfComment: "按時完成所有培訓課程，並主動分享學習心得。",
    peerScores: [
      { reviewer: "王美玲", score: 92, comment: "培訓中積極發言，帶動團隊學習氛圍。" },
    ],
    managerScore: 90, managerComment: "學習態度認真，建議更多參與外部進修。",
    finalScore: 92,
  },
  {
    id: "K5", name: "月度報告提交及時率", weight: 10, target: "100%", actual: "90%",
    completionRate: 90,
    selfScore: 85, selfComment: "有一次因出差延遲提交，已與主管溝通調整。",
    peerScores: [
      { reviewer: "林佳蓉", score: 82, comment: "報告品質不錯，偶爾有延遲。" },
    ],
    managerScore: 83, managerComment: "整體及時率尚可，注意出差期間的工作安排。",
    finalScore: 83,
  },
];

const employeeInfo = {
  name: "李文華",
  employeeId: "EMP002",
  department: "銷售部",
  position: "銷售經理",
  cycle: "2026 Q1",
  status: "已完成",
  overallScore: 85,
  grade: "B+",
};

const statusColors: Record<string, string> = {
  "已完成": "bg-success/10 text-success border-success/20",
  "進行中": "bg-primary/10 text-primary border-primary/20",
  "待評估": "bg-warning/10 text-warning border-warning/20",
};

const ScoreStars = ({ score }: { score: number }) => {
  const stars = Math.round(score / 20);
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`h-4 w-4 ${s <= stars ? "text-warning fill-warning" : "text-muted-foreground/30"}`}
        />
      ))}
      <span className="ml-1.5 text-sm font-medium">{score}</span>
    </div>
  );
};

export default function KpiAssessmentDetail() {
  const { kpiId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [isScoring, setIsScoring] = useState(false);
  const [managerScores, setManagerScores] = useState<Record<string, { score: string; comment: string }>>(
    Object.fromEntries(mockKpiItems.map((item) => [item.id, { score: String(item.managerScore), comment: item.managerComment }]))
  );

  const weightedScore = mockKpiItems.reduce((sum, item) => sum + (item.finalScore * item.weight) / 100, 0);

  const getGrade = (score: number) => {
    if (score >= 95) return "A+";
    if (score >= 90) return "A";
    if (score >= 85) return "B+";
    if (score >= 80) return "B";
    if (score >= 70) return "C";
    return "D";
  };

  const handleSaveScores = () => {
    setIsScoring(false);
    toast({ title: "評分已儲存", description: "主管評分與評語已成功更新" });
  };

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
              KPI 考核詳情
            </h1>
            <p className="page-description">{employeeInfo.name} — {employeeInfo.cycle} 考核記錄</p>
          </div>
          <div className="flex gap-2">
            {!isScoring ? (
              <Button size="sm" onClick={() => setIsScoring(true)}>
                <Edit2 className="h-4 w-4 mr-1" /> 主管評分
              </Button>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={() => setIsScoring(false)}>取消</Button>
                <Button size="sm" onClick={handleSaveScores}>
                  <Save className="h-4 w-4 mr-1" /> 儲存評分
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Employee Summary */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">{employeeInfo.name}</h2>
                <p className="text-sm text-muted-foreground">{employeeInfo.department} · {employeeInfo.position} · {employeeInfo.employeeId}</p>
              </div>
              <Badge variant="secondary" className={statusColors[employeeInfo.status] || ""}>{employeeInfo.status}</Badge>
            </div>
            <div className="flex items-center gap-8">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">加權總分</p>
                <p className="text-3xl font-bold text-primary">{weightedScore.toFixed(1)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">考核等級</p>
                <p className="text-3xl font-bold">{getGrade(weightedScore)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">KPI 數量</p>
                <p className="text-3xl font-bold">{mockKpiItems.length}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="overview">總覽</TabsTrigger>
          <TabsTrigger value="self">
            <User className="h-4 w-4 mr-1" /> 自評
          </TabsTrigger>
          <TabsTrigger value="peer">
            <Users className="h-4 w-4 mr-1" /> 同事互評
          </TabsTrigger>
          <TabsTrigger value="manager">
            <UserCheck className="h-4 w-4 mr-1" /> 主管評價
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">KPI 指標總覽</CardTitle>
              <CardDescription>各項 KPI 指標的完成情況與各方評分對比</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>指標名稱</TableHead>
                    <TableHead className="text-center">權重</TableHead>
                    <TableHead>目標值</TableHead>
                    <TableHead>實際值</TableHead>
                    <TableHead className="text-center">完成率</TableHead>
                    <TableHead className="text-center">自評分</TableHead>
                    <TableHead className="text-center">互評均分</TableHead>
                    <TableHead className="text-center">主管評分</TableHead>
                    <TableHead className="text-center">最終得分</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockKpiItems.map((item) => {
                    const peerAvg = item.peerScores.length > 0
                      ? (item.peerScores.reduce((s, p) => s + p.score, 0) / item.peerScores.length).toFixed(1)
                      : "-";
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="text-center">{item.weight}%</TableCell>
                        <TableCell>{item.target}</TableCell>
                        <TableCell>{item.actual}</TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-2">
                            <Progress value={item.completionRate} className="w-16 h-2" />
                            <span className="text-sm">{item.completionRate}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-medium">{item.selfScore}</TableCell>
                        <TableCell className="text-center font-medium">{peerAvg}</TableCell>
                        <TableCell className="text-center font-medium">{item.managerScore}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className={
                            item.finalScore >= 90 ? "bg-success/10 text-success border-success/20"
                              : item.finalScore >= 80 ? "bg-primary/10 text-primary border-primary/20"
                              : "bg-warning/10 text-warning border-warning/20"
                          }>{item.finalScore}</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Self Evaluation Tab */}
        <TabsContent value="self">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">員工自評</CardTitle>
                </div>
                <CardDescription>員工針對各項 KPI 指標的自我評估與說明</CardDescription>
              </CardHeader>
            </Card>
            {mockKpiItems.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold">{item.name}</h4>
                      <p className="text-sm text-muted-foreground">權重 {item.weight}% · 目標：{item.target} · 實際：{item.actual}</p>
                    </div>
                    <div className="text-right">
                      <ScoreStars score={item.selfScore} />
                    </div>
                  </div>
                  <Separator className="my-3" />
                  <div className="flex items-start gap-2">
                    <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <p className="text-sm text-foreground leading-relaxed">{item.selfComment}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Peer Review Tab */}
        <TabsContent value="peer">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">同事互評</CardTitle>
                </div>
                <CardDescription>來自同事的多角度評價與回饋</CardDescription>
              </CardHeader>
            </Card>
            {mockKpiItems.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-semibold">{item.name}</h4>
                      <p className="text-sm text-muted-foreground">權重 {item.weight}% · 共 {item.peerScores.length} 位同事評價</p>
                    </div>
                    <Badge variant="secondary">
                      均分：{(item.peerScores.reduce((s, p) => s + p.score, 0) / (item.peerScores.length || 1)).toFixed(1)}
                    </Badge>
                  </div>
                  <Separator className="my-3" />
                  <div className="space-y-4">
                    {item.peerScores.map((peer, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                          <User className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{peer.reviewer}</span>
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
        </TabsContent>

        {/* Manager Review Tab */}
        <TabsContent value="manager">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">主管評價</CardTitle>
                </div>
                <CardDescription>{isScoring ? "編輯模式：您可以修改評分與評語" : "主管對各項 KPI 指標的綜合評價與打分"}</CardDescription>
              </CardHeader>
            </Card>
            {mockKpiItems.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold">{item.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        權重 {item.weight}% · 自評：{item.selfScore} · 互評均分：
                        {(item.peerScores.reduce((s, p) => s + p.score, 0) / (item.peerScores.length || 1)).toFixed(1)}
                      </p>
                    </div>
                    {!isScoring && <ScoreStars score={item.managerScore} />}
                  </div>
                  <Separator className="my-3" />
                  {isScoring ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium w-16 shrink-0">評分</span>
                        <Select
                          value={managerScores[item.id]?.score || String(item.managerScore)}
                          onValueChange={(v) => setManagerScores((prev) => ({
                            ...prev,
                            [item.id]: { ...prev[item.id], score: v },
                          }))}
                        >
                          <SelectTrigger className="w-[120px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 21 }, (_, i) => 100 - i * 5).map((v) => (
                              <SelectItem key={v} value={String(v)}>{v} 分</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <span className="text-sm font-medium">評語</span>
                        <Textarea
                          className="mt-1.5"
                          placeholder="請輸入評語..."
                          value={managerScores[item.id]?.comment || item.managerComment}
                          onChange={(e) => setManagerScores((prev) => ({
                            ...prev,
                            [item.id]: { ...prev[item.id], comment: e.target.value },
                          }))}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2">
                      <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <p className="text-sm text-foreground leading-relaxed">{item.managerComment}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
