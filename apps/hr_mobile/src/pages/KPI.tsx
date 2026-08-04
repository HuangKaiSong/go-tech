import { useState } from "react";
import MobileLayout from "@/components/MobileLayout";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle, ChevronRight, Clock, Send, Star, UserCheck, Users } from "lucide-react";
import { toast } from "sonner";

type Phase = "completed" | "manager" | "peer" | "self";

interface KpiItem {
  id: string;
  managerComment: string;
  managerScore: number | null;
  name: string;
  peerScores: { comment: string; name: string; score: number }[];
  selfComment: string;
  selfScore: number | null;
  weight: string;
}

const initialKpiItems: KpiItem[] = [
  { id: "1", name: "銷售業績", weight: "40%", selfScore: null, selfComment: "", peerScores: [], managerScore: null, managerComment: "" },
  { id: "2", name: "客戶滿意度", weight: "25%", selfScore: null, selfComment: "", peerScores: [], managerScore: null, managerComment: "" },
  { id: "3", name: "團隊協作", weight: "20%", selfScore: null, selfComment: "", peerScores: [], managerScore: null, managerComment: "" },
  { id: "4", name: "創新貢獻", weight: "15%", selfScore: null, selfComment: "", peerScores: [], managerScore: null, managerComment: "" },
];

const peers = ["李小華", "張大偉", "陳美玲"];

const phaseConfig: Record<Phase, { bgColor: string; color: string; icon: typeof Clock; label: string }> = {
  self: { label: "自評階段", icon: Clock, color: "text-warning", bgColor: "bg-warning/10" },
  peer: { label: "互評階段", icon: Users, color: "text-info", bgColor: "bg-info/10" },
  manager: { label: "主管評核", icon: UserCheck, color: "text-accent", bgColor: "bg-accent/10" },
  completed: { label: "評核完成", icon: CheckCircle, color: "text-success", bgColor: "bg-success/10" },
};

const getScoreColor = (score: number) => {
  if (score >= 90) return "text-success";
  if (score >= 75) return "text-primary";
  if (score >= 60) return "text-warning";
  return "text-destructive";
};

const submitLabel = (p: Phase) => {
  if (p === "self") return "提交自評";
  if (p === "peer") return "提交互評";
  return "提交主管評核";
};

const evalName = (p: Phase) => {
  if (p === "self") return "自評";
  if (p === "peer") return "互評";
  return "主管評核";
};

const dialogTitle = (p: Phase, peerName: string) => {
  if (p === "self") return "自我評分";
  if (p === "peer") return `評核 - ${peerName}`;
  return "主管評分";
};

const KPI = () => {
  const [phase, setPhase] = useState<Phase>("self");
  const [kpiItems, setKpiItems] = useState<KpiItem[]>(initialKpiItems);
  const [editingItem, setEditingItem] = useState<KpiItem | null>(null);
  const [tempScore, setTempScore] = useState(80);
  const [tempComment, setTempComment] = useState("");
  const [currentPeerIndex, setCurrentPeerIndex] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const currentPhase = phaseConfig[phase];
  const PhaseIcon = currentPhase.icon;

  const getWeightedAvg = (getter: (k: KpiItem) => number | null) => {
    const scores = kpiItems.map(getter);
    if (scores.some((s) => s === null)) return null;
    return Math.round(kpiItems.reduce((sum, k, i) => sum + (scores[i]! * Number.parseFloat(k.weight)) / 100, 0));
  };

  const selfAvg = getWeightedAvg((k) => k.selfScore);
  const peerAvg = getWeightedAvg((k) => k.peerScores.length ? Math.round(k.peerScores.reduce((s, p) => s + p.score, 0) / k.peerScores.length) : null);
  const managerAvg = getWeightedAvg((k) => k.managerScore);

  const finalScore = phase === "completed" && selfAvg !== null && peerAvg !== null && managerAvg !== null
    ? Math.round(selfAvg * 0.3 + peerAvg * 0.3 + managerAvg * 0.4)
    : null;

  const openEditor = (item: KpiItem) => {
    setEditingItem(item);
    if (phase === "self") {
      setTempScore(item.selfScore ?? 80);
      setTempComment(item.selfComment);
    } else if (phase === "peer") {
      const existing = item.peerScores.find((p) => p.name === peers[currentPeerIndex]);
      setTempScore(existing?.score ?? 80);
      setTempComment(existing?.comment ?? "");
    } else if (phase === "manager") {
      setTempScore(item.managerScore ?? 80);
      setTempComment(item.managerComment);
    }
  };

  const saveScore = () => {
    if (!editingItem) return;
    setKpiItems((prev) =>
      prev.map((k) => {
        if (k.id !== editingItem.id) return k;
        if (phase === "self") return { ...k, selfScore: tempScore, selfComment: tempComment };
        if (phase === "peer") {
          const filtered = k.peerScores.filter((p) => p.name !== peers[currentPeerIndex]);
          return { ...k, peerScores: [...filtered, { name: peers[currentPeerIndex], score: tempScore, comment: tempComment }] };
        }
        if (phase === "manager") return { ...k, managerScore: tempScore, managerComment: tempComment };
        return k;
      })
    );
    setEditingItem(null);
    toast.success("評分已儲存");
  };

  const canSubmitPhase = () => {
    if (phase === "self") return kpiItems.every((k) => k.selfScore !== null);
    if (phase === "peer") return kpiItems.every((k) => k.peerScores.length === peers.length);
    if (phase === "manager") return kpiItems.every((k) => k.managerScore !== null);
    return false;
  };

  const submitPhase = () => {
    if (phase === "self") { setPhase("peer"); toast.success("自評已提交，進入互評階段"); }
    else if (phase === "peer") { setPhase("manager"); toast.success("互評已提交，進入主管評核"); }
    else if (phase === "manager") { setPhase("completed"); toast.success("評核流程已完成！"); }
    setConfirmOpen(false);
  };

  const displayScore = finalScore ?? selfAvg ?? 0;

  return (
    <MobileLayout title="評價與KPI">
      <div className="px-5 pt-4 pb-6">
        {/* Period & Phase */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-muted-foreground">2026年 第一季度</span>
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1 ${currentPhase.bgColor} ${currentPhase.color}`}>
            <PhaseIcon className="w-3 h-3" />
            {currentPhase.label}
          </span>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6 px-2">
          {(["self", "peer", "manager", "completed"] as Phase[]).map((p, i, arr) => {
            const done = arr.indexOf(phase) >= i;
            const active = phase === p;
            return (
              <div key={p} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors
                    ${done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}
                    ${active ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}`}>
                    {arr.indexOf(phase) > i ? "✓" : i + 1}
                  </div>
                  <span className={`text-[10px] mt-1 whitespace-nowrap ${done ? "text-primary font-medium" : "text-muted-foreground"}`}>
                    {phaseConfig[p].label.replace("階段", "")}
                  </span>
                </div>
                {i < arr.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-1 mt-[-12px] ${arr.indexOf(phase) > i ? "bg-primary" : "bg-border"}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Score Circle */}
        <div className="flex flex-col items-center py-4">
          <div className={`w-28 h-28 rounded-full border-4 flex flex-col items-center justify-center
            ${phase === "completed" ? "border-success" : "border-primary"}`}>
            <span className={`text-3xl font-bold ${phase === "completed" && finalScore ? getScoreColor(finalScore) : "text-primary"}`}>
              {displayScore || "--"}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {phase === "completed" ? "最終得分" : "自評得分"}
            </span>
          </div>
          {phase === "completed" && selfAvg !== null && peerAvg !== null && managerAvg !== null && (
            <div className="flex gap-6 mt-3 text-xs text-muted-foreground">
              <span>自評 {selfAvg} (30%)</span>
              <span>互評 {peerAvg} (30%)</span>
              <span>主管 {managerAvg} (40%)</span>
            </div>
          )}
        </div>

        {/* Peer selector (only in peer phase) */}
        {phase === "peer" && (
          <div className="mb-4">
            <p className="text-xs text-muted-foreground mb-2">選擇要評核的同事：</p>
            <div className="flex gap-2">
              {peers.map((p, i) => {
                const allDone = kpiItems.every((k) => k.peerScores.some((ps) => ps.name === p));
                return (
                  <button
                    key={p}
                    onClick={() => setCurrentPeerIndex(i)}
                    className={`flex-1 text-xs py-2 px-3 rounded-lg border transition-colors flex items-center justify-center gap-1
                      ${currentPeerIndex === i ? "border-primary bg-primary/5 text-primary font-medium" : "border-border text-foreground"}
                      ${allDone ? "opacity-70" : ""}`}
                  >
                    {allDone && <CheckCircle className="w-3 h-3 text-success" />}
                    {p}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* KPI Items */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">考核指標</h3>
          {kpiItems.map((kpi) => {
            let currentScore = kpi.selfScore;
            if (phase === "peer") {
              currentScore = kpi.peerScores.find((p) => p.name === peers[currentPeerIndex])?.score ?? null;
            } else if (phase === "manager") {
              currentScore = kpi.managerScore;
            }

            return (
              <div
                key={kpi.id}
                onClick={() => phase !== "completed" ? openEditor(kpi) : undefined}
                className={`bg-card rounded-xl border border-border p-4 ${phase !== "completed" ? "cursor-pointer active:bg-muted/50 transition-colors" : ""}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">{kpi.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">權重 {kpi.weight}</span>
                    {phase !== "completed" && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
                  </div>
                </div>
                <Progress value={currentScore ?? 0} className="h-2 mb-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>自評：{kpi.selfScore ?? "待評"}</span>
                  <span>互評：{kpi.peerScores.length ? Math.round(kpi.peerScores.reduce((s, p) => s + p.score, 0) / kpi.peerScores.length) : "待評"}</span>
                  <span>主管：{kpi.managerScore ?? "待評"}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Submit Button */}
        {phase !== "completed" && (
          <Button
            className="w-full mt-5"
            disabled={!canSubmitPhase()}
            onClick={() => setConfirmOpen(true)}
          >
            <Send className="w-4 h-4 mr-2" />
            {submitLabel(phase)}
          </Button>
        )}

        {/* Completed summary */}
        {phase === "completed" && (
          <div className="mt-5 bg-success/5 border border-success/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-success" />
              <span className="text-sm font-semibold text-foreground">評核流程已完成</span>
            </div>
            <p className="text-xs text-muted-foreground">
              所有評核階段已結束。最終得分由自評(30%)、互評(30%)及主管評核(40%)加權計算。
            </p>
          </div>
        )}
      </div>

      {/* Score Editor Dialog */}
      <Dialog open={Boolean(editingItem)} onOpenChange={(o) => !o && setEditingItem(null)}>
        <DialogContent className="max-w-[92vw] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base">
              {dialogTitle(phase, peers[currentPeerIndex])} · {editingItem?.name}
            </DialogTitle>
            <DialogDescription className="text-xs">
              請根據實際表現給予 0-100 的評分並填寫評語
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">評分</span>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-warning" />
                  <span className={`text-2xl font-bold ${getScoreColor(tempScore)}`}>{tempScore}</span>
                </div>
              </div>
              <Slider
                value={[tempScore]}
                onValueChange={([v]) => setTempScore(v)}
                min={0}
                max={100}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
              </div>
            </div>
            <div>
              <span className="text-sm text-muted-foreground mb-1.5 block">評語</span>
              <Textarea
                value={tempComment}
                onChange={(e) => setTempComment(e.target.value)}
                placeholder="請輸入評語或改進建議..."
                rows={3}
                className="resize-none text-sm"
              />
            </div>
          </div>
          <DialogFooter className="flex-row gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setEditingItem(null)}>取消</Button>
            <Button className="flex-1" onClick={saveScore}>確認儲存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Submit Dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-[85vw] rounded-2xl">
          <DialogHeader>
            <DialogTitle>確認提交</DialogTitle>
            <DialogDescription>
              提交後將無法修改{evalName(phase)}結果，確定要提交嗎？
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setConfirmOpen(false)}>取消</Button>
            <Button className="flex-1" onClick={submitPhase}>確認提交</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MobileLayout>
  );
};

export default KPI;
