import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft, CalendarDays, CheckCircle2, Clock, XCircle,
  User, Building2, FileText, Paperclip, MessageSquare,
  RotateCcw, Send, DollarSign, MapPin, AlertTriangle, ArrowRight
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type ApprovalStatus = "草稿" | "待審" | "通過" | "駁回" | "撤回";

interface ApprovalStep {
  id: number;
  nodeName: string;
  approver: string;
  role: string;
  status: "completed" | "current" | "pending" | "rejected";
  action?: string;
  time?: string;
  comment?: string;
}

const statusConfig: Record<ApprovalStatus, { color: string; icon: React.ElementType; label: string }> = {
  "草稿": { color: "bg-muted text-muted-foreground", icon: FileText, label: "草稿" },
  "待審": { color: "bg-warning/10 text-warning border-warning/20", icon: Clock, label: "待審核" },
  "通過": { color: "bg-success/10 text-success border-success/20", icon: CheckCircle2, label: "已通過" },
  "駁回": { color: "bg-destructive/10 text-destructive border-destructive/20", icon: XCircle, label: "已駁回" },
  "撤回": { color: "bg-muted text-muted-foreground", icon: RotateCcw, label: "已撤回" },
};

interface ApprovalData {
  code: string;
  applicant: string;
  department: string;
  position: string;
  type: string;
  subType?: string;
  summary: string;
  status: ApprovalStatus;
  submitTime: string;
  attachments: string[];
  steps: ApprovalStep[];
  details: Record<string, string>;
}

const mockApprovalData: Record<string, ApprovalData> = {
  "AP-2026-0301": {
    code: "AP-2026-0301",
    applicant: "張小明",
    department: "技術部",
    position: "前端工程師",
    type: "請假申請",
    subType: "年假",
    summary: "年假 3 天 (03/05-03/07)",
    status: "待審",
    submitTime: "2026-03-01 09:30",
    attachments: [],
    details: {
      "假別": "年假",
      "起始日期": "2026-03-05",
      "結束日期": "2026-03-07",
      "請假天數": "3 天",
      "請假事由": "計畫與家人一同前往日本旅遊，已提前完成手邊工作交接，期間由同事李文華代理。",
    },
    steps: [
      { id: 1, nodeName: "提交申請", approver: "張小明", role: "申請人", status: "completed", action: "提交", time: "2026-03-01 09:30", comment: "申請年假出遊" },
      { id: 2, nodeName: "部門主管審批", approver: "王大明", role: "技術部主管", status: "current" },
      { id: 3, nodeName: "人事部審核", approver: "劉美君", role: "人事專員", status: "pending" },
      { id: 4, nodeName: "審批完成", approver: "系統", role: "", status: "pending" },
    ],
  },
  "AP-2026-0298": {
    code: "AP-2026-0298",
    applicant: "李文華",
    department: "銷售部",
    position: "業務經理",
    type: "報銷申請",
    subType: "差旅費",
    summary: "出差報銷 NT$12,500",
    status: "待審",
    submitTime: "2026-02-28 14:20",
    attachments: ["發票_001.pdf", "住宿收據.pdf", "交通費明細.xlsx"],
    details: {
      "報銷類別": "差旅費",
      "報銷金額": "NT$ 12,500",
      "發生日期": "2026-02-20 ~ 2026-02-22",
      "報銷事由": "上海客戶拜訪出差，包含住宿費、交通費及餐費。已附相關發票及收據。",
    },
    steps: [
      { id: 1, nodeName: "提交申請", approver: "李文華", role: "申請人", status: "completed", action: "提交", time: "2026-02-28 14:20", comment: "出差報銷申請" },
      { id: 2, nodeName: "部門主管審批", approver: "陳經理", role: "銷售部主管", status: "completed", action: "通過", time: "2026-02-28 16:30", comment: "費用合理，同意報銷" },
      { id: 3, nodeName: "財務審核", approver: "林會計", role: "財務專員", status: "current" },
      { id: 4, nodeName: "審批完成", approver: "系統", role: "", status: "pending" },
    ],
  },
  "AP-2026-0295": {
    code: "AP-2026-0295",
    applicant: "王美玲",
    department: "人事部",
    position: "人事專員",
    type: "加班申請",
    summary: "加班 4 小時 (02/28)",
    status: "通過",
    submitTime: "2026-02-27 17:00",
    attachments: [],
    details: {
      "加班日期": "2026-02-28",
      "加班時段": "18:00 ~ 22:00",
      "加班時數": "4 小時",
      "加班類型": "平日加班",
      "加班事由": "月底薪資結算作業，需配合完成全公司薪資計算及核對。",
    },
    steps: [
      { id: 1, nodeName: "提交申請", approver: "王美玲", role: "申請人", status: "completed", action: "提交", time: "2026-02-27 17:00", comment: "月底薪資結算加班" },
      { id: 2, nodeName: "部門主管審批", approver: "趙主管", role: "人事部主管", status: "completed", action: "通過", time: "2026-02-27 17:30", comment: "同意加班" },
      { id: 3, nodeName: "人事部審核", approver: "系統自動", role: "同部門免審", status: "completed", action: "自動通過", time: "2026-02-27 17:30", comment: "同部門申請，系統自動審核通過" },
      { id: 4, nodeName: "審批完成", approver: "系統", role: "", status: "completed", action: "完成", time: "2026-02-27 17:31" },
    ],
  },
  "AP-2026-0290": {
    code: "AP-2026-0290",
    applicant: "陳大偉",
    department: "市場部",
    position: "市場經理",
    type: "出差申請",
    summary: "上海出差 3 天 (03/10-03/12)",
    status: "通過",
    submitTime: "2026-02-26 10:15",
    attachments: ["出差行程表.pdf", "客戶會議邀請函.pdf"],
    details: {
      "出差目的地": "上海",
      "起始日期": "2026-03-10",
      "結束日期": "2026-03-12",
      "出差天數": "3 天",
      "預估費用": "NT$ 25,000",
      "出差事由": "參加上海客戶年度合作會議，洽談下半年合作方案。",
    },
    steps: [
      { id: 1, nodeName: "提交申請", approver: "陳大偉", role: "申請人", status: "completed", action: "提交", time: "2026-02-26 10:15", comment: "上海客戶會議出差" },
      { id: 2, nodeName: "部門主管審批", approver: "吳總監", role: "市場部總監", status: "completed", action: "通過", time: "2026-02-26 14:00", comment: "重要客戶會議，同意出差" },
      { id: 3, nodeName: "人事部審核", approver: "劉美君", role: "人事專員", status: "completed", action: "通過", time: "2026-02-26 16:00", comment: "已確認出差保險" },
      { id: 4, nodeName: "審批完成", approver: "系統", role: "", status: "completed", action: "完成", time: "2026-02-26 16:01" },
    ],
  },
  "AP-2026-0288": {
    code: "AP-2026-0288",
    applicant: "林佳蓉",
    department: "財務部",
    position: "會計師",
    type: "請假申請",
    subType: "病假",
    summary: "病假 1 天 (02/25)",
    status: "駁回",
    submitTime: "2026-02-25 08:45",
    attachments: ["診斷證明書.pdf"],
    details: {
      "假別": "病假",
      "起始日期": "2026-02-25",
      "結束日期": "2026-02-25",
      "請假天數": "1 天",
      "請假事由": "身體不適需前往醫院就診。",
    },
    steps: [
      { id: 1, nodeName: "提交申請", approver: "林佳蓉", role: "申請人", status: "completed", action: "提交", time: "2026-02-25 08:45", comment: "身體不適需就醫" },
      { id: 2, nodeName: "部門主管審批", approver: "財務主管", role: "財務部主管", status: "rejected", action: "駁回", time: "2026-02-25 09:30", comment: "當日為月結日，請改期或提供更詳細的診斷證明" },
      { id: 3, nodeName: "人事部審核", approver: "劉美君", role: "人事專員", status: "pending" },
      { id: 4, nodeName: "審批完成", approver: "系統", role: "", status: "pending" },
    ],
  },
  "AP-2026-0285": {
    code: "AP-2026-0285",
    applicant: "黃志偉",
    department: "技術部",
    position: "後端工程師",
    type: "報銷申請",
    subType: "交通費",
    summary: "交通費報銷 NT$2,300",
    status: "撤回",
    submitTime: "2026-02-24 11:30",
    attachments: ["交通費收據.pdf"],
    details: {
      "報銷類別": "交通費",
      "報銷金額": "NT$ 2,300",
      "發生日期": "2026-02-20",
      "報銷事由": "客戶現場支援交通費用。",
    },
    steps: [
      { id: 1, nodeName: "提交申請", approver: "黃志偉", role: "申請人", status: "completed", action: "提交", time: "2026-02-24 11:30", comment: "交通費報銷" },
      { id: 2, nodeName: "已撤回", approver: "黃志偉", role: "申請人", status: "completed", action: "撤回", time: "2026-02-24 15:00", comment: "金額有誤，需重新提交" },
    ],
  },
  "AP-2026-0310": {
    code: "AP-2026-0310",
    applicant: "趙志強",
    department: "技術部",
    position: "後端工程師",
    type: "加班申請",
    summary: "加班 3 小時 (03/02)",
    status: "待審",
    submitTime: "2026-03-02 18:00",
    attachments: [],
    details: {
      "加班日期": "2026-03-02",
      "加班時段": "19:00 ~ 22:00",
      "加班時數": "3 小時",
      "加班類型": "平日加班",
      "加班事由": "趕專案上線，需進行最終測試與部署。",
    },
    steps: [
      { id: 1, nodeName: "提交申請", approver: "趙志強", role: "申請人", status: "completed", action: "提交", time: "2026-03-02 18:00", comment: "趕專案上線加班" },
      { id: 2, nodeName: "部門主管審批", approver: "王大明", role: "技術部主管", status: "current" },
      { id: 3, nodeName: "人事部備案", approver: "劉美君", role: "人事專員", status: "pending" },
      { id: 4, nodeName: "審批完成", approver: "系統", role: "", status: "pending" },
    ],
  },
  "AP-2026-0312": {
    code: "AP-2026-0312",
    applicant: "周雅婷",
    department: "市場部",
    position: "市場專員",
    type: "出差申請",
    summary: "北京出差 5 天 (03/15-03/19)",
    status: "待審",
    submitTime: "2026-02-25 09:00",
    attachments: ["出差計畫書.pdf"],
    details: {
      "出差目的地": "北京",
      "起始日期": "2026-03-15",
      "結束日期": "2026-03-19",
      "出差天數": "5 天",
      "預估費用": "NT$ 45,000",
      "出差事由": "參加行業峰會暨客戶拓展活動。",
    },
    steps: [
      { id: 1, nodeName: "提交申請", approver: "周雅婷", role: "申請人", status: "completed", action: "提交", time: "2026-02-25 09:00", comment: "北京行業峰會出差" },
      { id: 2, nodeName: "部門主管審批", approver: "吳總監", role: "市場部總監", status: "completed", action: "通過", time: "2026-02-25 14:00", comment: "同意出差" },
      { id: 3, nodeName: "總經理審批", approver: "總經理", role: "總經理", status: "current" },
      { id: 4, nodeName: "審批完成", approver: "系統", role: "", status: "pending" },
    ],
  },
  "AP-2026-0315": {
    code: "AP-2026-0315",
    applicant: "吳建國",
    department: "人事部",
    position: "人事主管",
    type: "請假申請",
    subType: "事假",
    summary: "事假 1 天 (03/04)",
    status: "待審",
    submitTime: "2026-03-03 08:00",
    attachments: [],
    details: {
      "假別": "事假",
      "起始日期": "2026-03-04",
      "結束日期": "2026-03-04",
      "請假天數": "1 天",
      "請假事由": "家中有事需處理。",
    },
    steps: [
      { id: 1, nodeName: "提交申請", approver: "吳建國", role: "申請人", status: "completed", action: "提交", time: "2026-03-03 08:00", comment: "家中有事" },
      { id: 2, nodeName: "部門主管審批", approver: "趙主管", role: "人事部主管", status: "current" },
      { id: 3, nodeName: "審批完成", approver: "系統", role: "", status: "pending" },
    ],
  },
};

const stepStatusStyle = {
  completed: "border-success bg-success text-success-foreground",
  current: "border-warning bg-warning text-warning-foreground animate-pulse",
  pending: "border-border bg-muted text-muted-foreground",
  rejected: "border-destructive bg-destructive text-destructive-foreground",
};

const stepLineStyle = {
  completed: "bg-success",
  current: "bg-warning",
  pending: "bg-border",
  rejected: "bg-destructive",
};

const typeIcons: Record<string, React.ElementType> = {
  "請假申請": CalendarDays,
  "加班申請": Clock,
  "報銷申請": DollarSign,
  "出差申請": MapPin,
};

type ActionType = "approve" | "reject" | "transfer" | "withdraw" | "returnModify" | null;

export default function ApprovalDetail() {
  const { approvalId } = useParams();
  const navigate = useNavigate();
  const [approvalComment, setApprovalComment] = useState("");
  const [actionDialog, setActionDialog] = useState<ActionType>(null);
  const [transferTo, setTransferTo] = useState("");
  const [data, setData] = useState<ApprovalData | null>(() =>
    approvalId ? mockApprovalData[approvalId] || null : null
  );

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">找不到該審批記錄</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/attendance/approval")}>
          <ArrowLeft className="h-4 w-4 mr-2" />返回審批管理
        </Button>
      </div>
    );
  }

  const sc = statusConfig[data.status];
  const StatusIcon = sc.icon;
  const TypeIcon = typeIcons[data.type] || FileText;
  const isActionable = data.status === "待審";
  const currentStepIndex = data.steps.findIndex((s) => s.status === "current");

  const now = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  const handleApprove = () => {
    const newSteps = [...data.steps];
    const ci = currentStepIndex;
    if (ci < 0) return;

    // Mark current step as completed
    newSteps[ci] = { ...newSteps[ci], status: "completed", action: "通過", time: now(), comment: approvalComment || "同意" };

    // Check if next step is the final "審批完成" node or another approval step
    const nextIndex = ci + 1;
    if (nextIndex < newSteps.length) {
      if (nextIndex === newSteps.length - 1) {
        // Final node - mark as completed
        newSteps[nextIndex] = { ...newSteps[nextIndex], status: "completed", action: "完成", time: now() };
        setData({ ...data, steps: newSteps, status: "通過" });
      } else {
        // Move to next approver
        newSteps[nextIndex] = { ...newSteps[nextIndex], status: "current" };
        setData({ ...data, steps: newSteps });
      }
    }

    toast.success(`已核准申請 ${data.code}，流程已推進至下一節點`);
    setActionDialog(null);
    setApprovalComment("");
  };

  const handleReject = () => {
    const newSteps = [...data.steps];
    const ci = currentStepIndex;
    if (ci < 0) return;

    newSteps[ci] = { ...newSteps[ci], status: "rejected", action: "駁回", time: now(), comment: approvalComment || "不同意" };
    // Mark remaining as pending (no further flow)
    setData({ ...data, steps: newSteps, status: "駁回" });
    toast.error(`已駁回申請 ${data.code}`);
    setActionDialog(null);
    setApprovalComment("");
  };

  const handleTransfer = () => {
    if (!transferTo.trim()) {
      toast.error("請選擇轉簽對象");
      return;
    }
    const newSteps = [...data.steps];
    const ci = currentStepIndex;
    if (ci < 0) return;

    // Add a transfer record and update current node
    newSteps[ci] = { ...newSteps[ci], status: "completed", action: "轉簽", time: now(), comment: `${approvalComment ? approvalComment + " — " : ""}轉簽至 ${transferTo}` };
    // Insert new step after current
    const transferStep: ApprovalStep = {
      id: Date.now(),
      nodeName: `${transferTo} 審批`,
      approver: transferTo,
      role: "轉簽審批人",
      status: "current",
    };
    newSteps.splice(ci + 1, 0, transferStep);
    setData({ ...data, steps: newSteps });
    toast.success(`已轉簽至 ${transferTo}`);
    setActionDialog(null);
    setApprovalComment("");
    setTransferTo("");
  };

  const handleWithdraw = () => {
    const newSteps = data.steps.map((s) =>
      s.status === "current" || s.status === "pending"
        ? { ...s, status: "pending" as const }
        : s
    );
    // Add withdraw step
    newSteps.push({
      id: Date.now(),
      nodeName: "申請人撤回",
      approver: data.applicant,
      role: "申請人",
      status: "completed",
      action: "撤回",
      time: now(),
      comment: approvalComment || "申請人主動撤回",
    });
    setData({ ...data, steps: newSteps, status: "撤回" });
    toast.success(`已撤回申請 ${data.code}`);
    setActionDialog(null);
    setApprovalComment("");
  };

  const handleReturnModify = () => {
    const newSteps = [...data.steps];
    const ci = currentStepIndex;
    if (ci < 0) return;

    newSteps[ci] = { ...newSteps[ci], status: "completed", action: "退回修改", time: now(), comment: approvalComment || "請修改後重新提交" };
    // Reset step 0 (submitter) to current
    newSteps.push({
      id: Date.now(),
      nodeName: "退回修改",
      approver: data.applicant,
      role: "申請人",
      status: "current",
    });
    setData({ ...data, steps: newSteps });
    toast.info(`已退回 ${data.applicant} 修改`);
    setActionDialog(null);
    setApprovalComment("");
  };

  const actionConfigs: Record<string, { title: string; desc: string; btnLabel: string; btnClass: string; handler: () => void }> = {
    approve: { title: "確認核准", desc: `確定要核准 ${data.applicant} 的${data.type}嗎？`, btnLabel: "確認核准", btnClass: "bg-success hover:bg-success/90 text-success-foreground", handler: handleApprove },
    reject: { title: "確認駁回", desc: `確定要駁回 ${data.applicant} 的${data.type}嗎？駁回後申請流程將終止。`, btnLabel: "確認駁回", btnClass: "bg-destructive hover:bg-destructive/90 text-destructive-foreground", handler: handleReject },
    transfer: { title: "轉簽審批", desc: "將此申請轉交給其他審批人處理。", btnLabel: "確認轉簽", btnClass: "", handler: handleTransfer },
    withdraw: { title: "確認撤回", desc: `確定要撤回申請 ${data.code}？撤回後需重新提交。`, btnLabel: "確認撤回", btnClass: "bg-destructive hover:bg-destructive/90 text-destructive-foreground", handler: handleWithdraw },
    returnModify: { title: "退回修改", desc: "將申請退回給申請人修改，修改後可重新提交。", btnLabel: "確認退回", btnClass: "bg-warning hover:bg-warning/90 text-warning-foreground", handler: handleReturnModify },
  };

  // Build flow status summary
  const completedSteps = data.steps.filter((s) => s.status === "completed").length;
  const totalSteps = data.steps.length;
  const progressPercent = Math.round((completedSteps / totalSteps) * 100);

  const detailEntries = Object.entries(data.details);
  const reasonKey = detailEntries.find(([k]) => k.includes("事由"));
  const infoEntries = detailEntries.filter(([k]) => !k.includes("事由"));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/attendance/approval")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              審批詳情
              <span className="text-lg font-mono text-muted-foreground">{data.code}</span>
            </h1>
            <p className="text-muted-foreground mt-0.5 text-sm">提交於 {data.submitTime}</p>
          </div>
        </div>
        <Badge className={`${sc.color} border text-sm px-3 py-1`}>
          <StatusIcon className="h-4 w-4 mr-1" />
          {sc.label}
        </Badge>
      </div>

      {/* Flow progress bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-foreground">審批進度</p>
            <span className="text-sm text-muted-foreground">{completedSteps}/{totalSteps} 節點已完成</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${data.status === "駁回" ? "bg-destructive" : data.status === "撤回" ? "bg-muted-foreground" : "bg-success"}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          {/* Horizontal step indicators */}
          <div className="flex items-center justify-between mt-3 px-1">
            {data.steps.map((step, i) => {
              const isActive = step.status === "current";
              const isDone = step.status === "completed";
              const isRejected = step.status === "rejected";
              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                      isDone ? "border-success bg-success text-success-foreground" :
                      isActive ? "border-warning bg-warning text-warning-foreground" :
                      isRejected ? "border-destructive bg-destructive text-destructive-foreground" :
                      "border-border bg-muted text-muted-foreground"
                    }`}>
                      {isDone ? <CheckCircle2 className="h-3.5 w-3.5" /> : isRejected ? <XCircle className="h-3.5 w-3.5" /> : i + 1}
                    </div>
                    <span className={`text-xs mt-1 max-w-16 text-center leading-tight ${isActive ? "text-warning font-medium" : "text-muted-foreground"}`}>
                      {step.nodeName.length > 6 ? step.nodeName.slice(0, 6) + "…" : step.nodeName}
                    </span>
                  </div>
                  {i < data.steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-1 mt-[-16px] ${isDone ? "bg-success" : "bg-border"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TypeIcon className="h-4 w-4 text-primary" />
                {data.type}資訊
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">申請人</p>
                  <p className="text-sm font-medium text-foreground flex items-center gap-1">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />{data.applicant}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">部門</p>
                  <p className="text-sm font-medium text-foreground flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground" />{data.department}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">職位</p>
                  <p className="text-sm font-medium text-foreground">{data.position}</p>
                </div>
                {infoEntries.map(([key, value]) => (
                  <div key={key}>
                    <p className="text-xs text-muted-foreground mb-1">{key}</p>
                    {key.includes("天數") || key.includes("時數") ? (
                      <p className="text-sm font-bold text-primary">{value}</p>
                    ) : key.includes("金額") || key.includes("費用") ? (
                      <p className="text-sm font-bold text-primary">{value}</p>
                    ) : key.includes("類別") || key.includes("假別") || key.includes("類型") ? (
                      <Badge variant="outline">{value}</Badge>
                    ) : (
                      <p className="text-sm font-medium text-foreground">{value}</p>
                    )}
                  </div>
                ))}
              </div>

              {reasonKey && (
                <>
                  <Separator className="my-4" />
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{reasonKey[0]}</p>
                    <p className="text-sm text-foreground leading-relaxed">{reasonKey[1]}</p>
                  </div>
                </>
              )}

              {data.attachments.length > 0 && (
                <>
                  <Separator className="my-4" />
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">附件</p>
                    <div className="space-y-1">
                      {data.attachments.map((file, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-primary cursor-pointer hover:underline">
                          <Paperclip className="h-3.5 w-3.5" />
                          {file}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Approval Actions */}
          {isActionable && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  審批操作
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">審批意見</p>
                  <Textarea
                    placeholder="請輸入審批意見（選填）..."
                    value={approvalComment}
                    onChange={(e) => setApprovalComment(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Button className="bg-success hover:bg-success/90 text-success-foreground" onClick={() => setActionDialog("approve")}>
                    <CheckCircle2 className="h-4 w-4 mr-1" />核准
                  </Button>
                  <Button variant="destructive" onClick={() => setActionDialog("reject")}>
                    <XCircle className="h-4 w-4 mr-1" />駁回
                  </Button>
                  <Button variant="outline" onClick={() => setActionDialog("transfer")}>
                    <Send className="h-4 w-4 mr-1" />轉簽
                  </Button>
                  <Button variant="outline" className="text-warning border-warning/30 hover:bg-warning/5" onClick={() => setActionDialog("returnModify")}>
                    <ArrowRight className="h-4 w-4 mr-1" />退回修改
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Withdraw (only for pending status) */}
          {isActionable && (
            <div className="flex justify-end">
              <Button variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/5" onClick={() => setActionDialog("withdraw")}>
                <RotateCcw className="h-4 w-4 mr-1" />撤回申請
              </Button>
            </div>
          )}

          {/* Status hint for completed/rejected */}
          {!isActionable && data.status !== "草稿" && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    data.status === "通過" ? "bg-success/10" :
                    data.status === "駁回" ? "bg-destructive/10" :
                    "bg-muted"
                  }`}>
                    <StatusIcon className={`h-5 w-5 ${
                      data.status === "通過" ? "text-success" :
                      data.status === "駁回" ? "text-destructive" :
                      "text-muted-foreground"
                    }`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {data.status === "通過" && "此申請已通過所有審批節點"}
                      {data.status === "駁回" && "此申請已被駁回"}
                      {data.status === "撤回" && "此申請已被申請人撤回"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {data.status === "駁回" && "申請人可修改後重新提交"}
                      {data.status === "撤回" && "申請人可重新發起申請"}
                      {data.status === "通過" && "審批流程已結束"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Approval Timeline */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                審批流程
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                {data.steps.map((step, index) => {
                  const isLast = index === data.steps.length - 1;
                  const StepIcon = step.status === "completed" ? CheckCircle2
                    : step.status === "rejected" ? XCircle
                    : step.status === "current" ? Clock
                    : FileText;

                  return (
                    <div key={step.id} className="relative flex gap-3">
                      {!isLast && (
                        <div className={`absolute left-[15px] top-[32px] w-0.5 h-[calc(100%-16px)] ${stepLineStyle[step.status]}`} />
                      )}
                      <div className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 shrink-0 ${stepStatusStyle[step.status]}`}>
                        <StepIcon className="h-4 w-4" />
                      </div>
                      <div className={`pb-6 flex-1 ${isLast ? "pb-0" : ""}`}>
                        <p className="text-sm font-medium text-foreground">{step.nodeName}</p>
                        {step.approver && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {step.approver}{step.role ? ` · ${step.role}` : ""}
                          </p>
                        )}
                        {step.action && (
                          <div className="mt-1.5">
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                step.action === "通過" || step.action === "自動通過" || step.action === "完成"
                                  ? "bg-success/10 text-success border-success/20"
                                  : step.action === "駁回"
                                  ? "bg-destructive/10 text-destructive border-destructive/20"
                                  : step.action === "撤回"
                                  ? "bg-muted text-muted-foreground"
                                  : step.action === "轉簽"
                                  ? "bg-primary/10 text-primary border-primary/20"
                                  : step.action === "退回修改"
                                  ? "bg-warning/10 text-warning border-warning/20"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {step.action}
                            </Badge>
                          </div>
                        )}
                        {step.time && (
                          <p className="text-xs text-muted-foreground mt-1">{step.time}</p>
                        )}
                        {step.comment && (
                          <div className="mt-2 p-2.5 rounded-md bg-muted/50 border border-border">
                            <p className="text-xs text-foreground leading-relaxed">{step.comment}</p>
                          </div>
                        )}
                        {step.status === "current" && !step.action && (
                          <p className="text-xs text-warning mt-1 font-medium">等待審批中...</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Action Confirmation Dialog */}
      {actionDialog && actionConfigs[actionDialog] && (
        <Dialog open={!!actionDialog} onOpenChange={() => { setActionDialog(null); setTransferTo(""); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {actionDialog === "approve" && <CheckCircle2 className="h-5 w-5 text-success" />}
                {actionDialog === "reject" && <XCircle className="h-5 w-5 text-destructive" />}
                {actionDialog === "transfer" && <Send className="h-5 w-5 text-primary" />}
                {actionDialog === "withdraw" && <RotateCcw className="h-5 w-5 text-muted-foreground" />}
                {actionDialog === "returnModify" && <AlertTriangle className="h-5 w-5 text-warning" />}
                {actionConfigs[actionDialog].title}
              </DialogTitle>
              <DialogDescription>{actionConfigs[actionDialog].desc}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {/* Application summary */}
              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{data.code}</span>
                  <Badge variant="outline">{data.type}</Badge>
                </div>
                <p className="text-sm font-medium text-foreground mt-1">{data.applicant} — {data.summary}</p>
              </div>

              {/* Transfer target */}
              {actionDialog === "transfer" && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">轉簽對象</p>
                  <Select value={transferTo} onValueChange={setTransferTo}>
                    <SelectTrigger><SelectValue placeholder="請選擇轉簽對象" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="趙總監">趙總監 · 技術總監</SelectItem>
                      <SelectItem value="劉美君">劉美君 · 人事專員</SelectItem>
                      <SelectItem value="林會計">林會計 · 財務專員</SelectItem>
                      <SelectItem value="陳經理">陳經理 · 銷售部主管</SelectItem>
                      <SelectItem value="吳總監">吳總監 · 市場部總監</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Comment */}
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {actionDialog === "reject" || actionDialog === "returnModify" ? "駁回/退回原因" : "備註（選填）"}
                </p>
                <Textarea
                  placeholder={actionDialog === "reject" ? "請說明駁回原因..." : actionDialog === "returnModify" ? "請說明需修改的內容..." : "請輸入備註..."}
                  value={approvalComment}
                  onChange={(e) => setApprovalComment(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Flow preview */}
              {(actionDialog === "approve" || actionDialog === "reject") && (
                <div className="p-3 rounded-lg border border-border bg-muted/30">
                  <p className="text-xs font-medium text-muted-foreground mb-2">狀態流轉預覽</p>
                  <div className="flex items-center gap-2 text-sm">
                    <Badge className="bg-warning/10 text-warning border border-warning/20">待審</Badge>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    {actionDialog === "approve" ? (
                      currentStepIndex < data.steps.length - 2 ? (
                        <Badge className="bg-warning/10 text-warning border border-warning/20">
                          {data.steps[currentStepIndex + 1]?.nodeName}
                        </Badge>
                      ) : (
                        <Badge className="bg-success/10 text-success border border-success/20">通過</Badge>
                      )
                    ) : (
                      <Badge className="bg-destructive/10 text-destructive border border-destructive/20">駁回</Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setActionDialog(null); setTransferTo(""); }}>取消</Button>
              <Button className={actionConfigs[actionDialog].btnClass} onClick={actionConfigs[actionDialog].handler}>
                {actionConfigs[actionDialog].btnLabel}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
