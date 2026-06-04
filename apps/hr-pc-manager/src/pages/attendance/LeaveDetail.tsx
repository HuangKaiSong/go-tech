import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft, CalendarDays, CheckCircle2, Clock, XCircle,
  User, Building2, FileText, Paperclip, MessageSquare,
  RotateCcw, Send, ChevronRight
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type LeaveStatus = "草稿" | "待審核" | "審核中" | "已核准" | "已駁回" | "已撤回";

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

const statusConfig: Record<LeaveStatus, { color: string; icon: React.ElementType; label: string }> = {
  "草稿": { color: "bg-muted text-muted-foreground", icon: FileText, label: "草稿" },
  "待審核": { color: "bg-warning/10 text-warning border-warning/20", icon: Clock, label: "待審核" },
  "審核中": { color: "bg-accent/10 text-accent border-accent/20", icon: Clock, label: "審核中" },
  "已核准": { color: "bg-success/10 text-success border-success/20", icon: CheckCircle2, label: "已核准" },
  "已駁回": { color: "bg-destructive/10 text-destructive border-destructive/20", icon: XCircle, label: "已駁回" },
  "已撤回": { color: "bg-muted text-muted-foreground", icon: RotateCcw, label: "已撤回" },
};

// Mock data based on ID
const mockLeaveData: Record<string, {
  code: string; applicant: string; department: string; position: string;
  leaveType: string; startDate: string; endDate: string; days: number;
  reason: string; status: LeaveStatus; submitTime: string;
  attachments: string[]; steps: ApprovalStep[];
}> = {
  "LV-2026-0045": {
    code: "LV-2026-0045", applicant: "張小明", department: "技術部", position: "前端工程師",
    leaveType: "年假", startDate: "2026-03-10", endDate: "2026-03-12", days: 3,
    reason: "計畫與家人一同前往日本旅遊，已提前完成手邊工作交接，期間由同事李文華代理。",
    status: "待審核", submitTime: "2026-03-05 09:30", attachments: [],
    steps: [
      { id: 1, nodeName: "提交申請", approver: "張小明", role: "申請人", status: "completed", action: "提交", time: "2026-03-05 09:30", comment: "計畫家庭旅遊，已安排工作交接" },
      { id: 2, nodeName: "部門主管審批", approver: "王大明", role: "技術部主管", status: "current", action: "", time: "", comment: "" },
      { id: 3, nodeName: "人事部審核", approver: "劉美君", role: "人事專員", status: "pending" },
      { id: 4, nodeName: "審批完成", approver: "系統", role: "", status: "pending" },
    ],
  },
  "LV-2026-0044": {
    code: "LV-2026-0044", applicant: "李文華", department: "銷售部", position: "業務經理",
    leaveType: "事假", startDate: "2026-03-08", endDate: "2026-03-09", days: 2,
    reason: "需要處理個人事務，包括房屋過戶手續辦理。",
    status: "審核中", submitTime: "2026-03-04 14:20", attachments: [],
    steps: [
      { id: 1, nodeName: "提交申請", approver: "李文華", role: "申請人", status: "completed", action: "提交", time: "2026-03-04 14:20", comment: "個人事務處理" },
      { id: 2, nodeName: "部門主管審批", approver: "陳經理", role: "銷售部主管", status: "completed", action: "通過", time: "2026-03-04 16:00", comment: "同意，請安排好客戶跟進" },
      { id: 3, nodeName: "人事部審核", approver: "劉美君", role: "人事專員", status: "current" },
      { id: 4, nodeName: "審批完成", approver: "系統", role: "", status: "pending" },
    ],
  },
  "LV-2026-0043": {
    code: "LV-2026-0043", applicant: "王美玲", department: "人事部", position: "人事專員",
    leaveType: "病假", startDate: "2026-03-06", endDate: "2026-03-06", days: 1,
    reason: "身體不適需前往醫院就診，已附診斷證明。",
    status: "已核准", submitTime: "2026-03-05 08:00", attachments: ["診斷證明書.pdf"],
    steps: [
      { id: 1, nodeName: "提交申請", approver: "王美玲", role: "申請人", status: "completed", action: "提交", time: "2026-03-05 08:00", comment: "身體不適需就醫" },
      { id: 2, nodeName: "部門主管審批", approver: "趙主管", role: "人事部主管", status: "completed", action: "通過", time: "2026-03-05 08:30", comment: "注意休息，早日康復" },
      { id: 3, nodeName: "人事部審核", approver: "系統自動", role: "同部門免審", status: "completed", action: "自動通過", time: "2026-03-05 08:30", comment: "同部門申請，系統自動審核通過" },
      { id: 4, nodeName: "審批完成", approver: "系統", role: "", status: "completed", action: "完成", time: "2026-03-05 08:31", comment: "" },
    ],
  },
  "LV-2026-0040": {
    code: "LV-2026-0040", applicant: "黃志偉", department: "技術部", position: "後端工程師",
    leaveType: "事假", startDate: "2026-03-03", endDate: "2026-03-03", days: 1,
    reason: "搬家需要一天時間處理。",
    status: "已駁回", submitTime: "2026-02-28 11:00", attachments: [],
    steps: [
      { id: 1, nodeName: "提交申請", approver: "黃志偉", role: "申請人", status: "completed", action: "提交", time: "2026-02-28 11:00", comment: "搬家" },
      { id: 2, nodeName: "部門主管審批", approver: "王大明", role: "技術部主管", status: "rejected", action: "駁回", time: "2026-02-28 14:00", comment: "當日有重要版本上線，建議改期，可選擇週末搬家後補休一天" },
      { id: 3, nodeName: "人事部審核", approver: "劉美君", role: "人事專員", status: "pending" },
      { id: 4, nodeName: "審批完成", approver: "系統", role: "", status: "pending" },
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

export default function LeaveDetail() {
  const { leaveId } = useParams();
  const navigate = useNavigate();
  const [approvalComment, setApprovalComment] = useState("");

  const data = leaveId ? mockLeaveData[leaveId] : null;

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">找不到該請假記錄</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/attendance/leave")}>
          <ArrowLeft className="h-4 w-4 mr-2" />返回請假管理
        </Button>
      </div>
    );
  }

  const sc = statusConfig[data.status];
  const StatusIcon = sc.icon;
  const isActionable = data.status === "待審核" || data.status === "審核中";
  const canWithdraw = data.status === "待審核" || data.status === "審核中";

  const handleAction = (action: string) => {
    toast.success(`已${action}請假申請 ${data.code}`);
    navigate("/attendance/leave");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/attendance/leave")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              請假詳情
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" />
                請假資訊
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
                <div>
                  <p className="text-xs text-muted-foreground mb-1">假別</p>
                  <Badge variant="outline">{data.leaveType}</Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">起始日期</p>
                  <p className="text-sm font-medium text-foreground">{data.startDate}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">結束日期</p>
                  <p className="text-sm font-medium text-foreground">{data.endDate}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">請假天數</p>
                  <p className="text-sm font-bold text-primary">{data.days} 天</p>
                </div>
              </div>

              <Separator className="my-4" />

              <div>
                <p className="text-xs text-muted-foreground mb-1">請假事由</p>
                <p className="text-sm text-foreground leading-relaxed">{data.reason}</p>
              </div>

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

          {/* Approval Actions (for approver) */}
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
                <div className="flex items-center gap-3">
                  <Button onClick={() => handleAction("核准")} className="bg-success hover:bg-success/90 text-success-foreground">
                    <CheckCircle2 className="h-4 w-4 mr-1" />核准
                  </Button>
                  <Button variant="destructive" onClick={() => handleAction("駁回")}>
                    <XCircle className="h-4 w-4 mr-1" />駁回
                  </Button>
                  <Button variant="outline" onClick={() => handleAction("轉簽")}>
                    <Send className="h-4 w-4 mr-1" />轉簽
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Withdraw for applicant */}
          {canWithdraw && (
            <div className="flex justify-end">
              <Button variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/5" onClick={() => handleAction("撤回")}>
                <RotateCcw className="h-4 w-4 mr-1" />撤回申請
              </Button>
            </div>
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
                      {/* Vertical line */}
                      {!isLast && (
                        <div className={`absolute left-[15px] top-[32px] w-0.5 h-[calc(100%-16px)] ${stepLineStyle[step.status]}`} />
                      )}

                      {/* Icon */}
                      <div className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 shrink-0 ${stepStatusStyle[step.status]}`}>
                        <StepIcon className="h-4 w-4" />
                      </div>

                      {/* Content */}
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

          {/* Leave Balance */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">假期餘額</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { type: "年假", total: 14, used: 4, color: "bg-primary" },
                  { type: "病假", total: 30, used: 2, color: "bg-warning" },
                  { type: "事假", total: 14, used: 3, color: "bg-accent" },
                  { type: "補休", total: 3.5, used: 1, color: "bg-success" },
                ].map((item) => (
                  <div key={item.type}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-muted-foreground">{item.type}</span>
                      <span className="text-foreground font-medium">{item.total - item.used} / {item.total} 天</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full ${item.color} transition-all`}
                        style={{ width: `${(item.used / item.total) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
