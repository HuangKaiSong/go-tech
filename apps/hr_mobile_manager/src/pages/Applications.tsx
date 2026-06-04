import { useState } from "react";
import MobileLayout from "@/components/MobileLayout";
import { CalendarDays, Clock, Receipt, Plane, LogOut, ChevronRight, Plus, ArrowLeft, Check, X as XIcon, RotateCcw, User, CheckCircle2, Circle, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog";

const applicationTypes = [
  { icon: CalendarDays, label: "請假申請", desc: "類別/起止時間/事由", color: "bg-primary" },
  { icon: Clock, label: "加班申請", desc: "日期/時段/預計工時", color: "bg-warning" },
  { icon: Receipt, label: "報銷申請", desc: "金額/幣別/發票附件", color: "bg-accent" },
  { icon: Plane, label: "出差申請", desc: "城市/國家/起止日期", color: "bg-info" },
  { icon: LogOut, label: "離職申請", desc: "離職日期/原因/交接", color: "bg-destructive" },
];

const tabs = ["我的申請", "待審批", "已審核"];

type Record = {
  title: string;
  date: string;
  status: string;
  statusColor: string;
  days: string;
  type: string;
  reason: string;
  startDate: string;
  endDate: string;
  applicant: string;
  approvalFlow: { name: string; role: string; status: "approved" | "pending" | "rejected" | "waiting"; time?: string; comment?: string }[];
};

const myRecords: Record[] = [
  {
    title: "年假申請", date: "2026/03/05", status: "已通過", statusColor: "text-success bg-success/10", days: "3天",
    type: "請假", reason: "家庭旅遊，前往日本東京", startDate: "2026/03/10", endDate: "2026/03/12", applicant: "王小明",
    approvalFlow: [
      { name: "王小明", role: "申請人", status: "approved", time: "03/05 09:00" },
      { name: "李主管", role: "直屬主管", status: "approved", time: "03/05 14:30", comment: "核准，注意交接" },
      { name: "張經理", role: "部門經理", status: "approved", time: "03/06 10:00", comment: "同意" },
    ],
  },
  {
    title: "加班申請", date: "2026/03/01", status: "審批中", statusColor: "text-warning bg-warning/10", days: "3小時",
    type: "加班", reason: "專案交付期限緊迫，需趕工完成報告", startDate: "2026/03/01 18:00", endDate: "2026/03/01 21:00", applicant: "王小明",
    approvalFlow: [
      { name: "王小明", role: "申請人", status: "approved", time: "03/01 17:30" },
      { name: "李主管", role: "直屬主管", status: "pending" },
      { name: "張經理", role: "部門經理", status: "waiting" },
    ],
  },
  {
    title: "報銷申請", date: "2026/02/28", status: "已駁回", statusColor: "text-destructive bg-destructive/10", days: "NT$3,200",
    type: "報銷", reason: "客戶拜訪交通費及餐費", startDate: "2026/02/25", endDate: "2026/02/25", applicant: "王小明",
    approvalFlow: [
      { name: "王小明", role: "申請人", status: "approved", time: "02/28 10:00" },
      { name: "李主管", role: "直屬主管", status: "rejected", time: "02/28 16:00", comment: "缺少發票附件，請補齊後重新提交" },
      { name: "張經理", role: "部門經理", status: "waiting" },
    ],
  },
  {
    title: "事假申請", date: "2026/02/20", status: "已通過", statusColor: "text-success bg-success/10", days: "1天",
    type: "請假", reason: "個人事務處理", startDate: "2026/02/22", endDate: "2026/02/22", applicant: "王小明",
    approvalFlow: [
      { name: "王小明", role: "申請人", status: "approved", time: "02/20 08:30" },
      { name: "李主管", role: "直屬主管", status: "approved", time: "02/20 11:00", comment: "核准" },
      { name: "張經理", role: "部門經理", status: "approved", time: "02/20 15:00", comment: "同意" },
    ],
  },
];

const pendingRecords: Record[] = [
  {
    title: "年假申請", date: "2026/03/08", status: "待審批", statusColor: "text-warning bg-warning/10", days: "2天",
    type: "請假", reason: "回鄉探親", startDate: "2026/03/15", endDate: "2026/03/16", applicant: "陳大華",
    approvalFlow: [
      { name: "陳大華", role: "申請人", status: "approved", time: "03/08 09:00" },
      { name: "我（李主管）", role: "直屬主管", status: "pending" },
      { name: "張經理", role: "部門經理", status: "waiting" },
    ],
  },
  {
    title: "加班申請", date: "2026/03/07", status: "待審批", statusColor: "text-warning bg-warning/10", days: "4小時",
    type: "加班", reason: "系統上線前最終測試", startDate: "2026/03/09 18:00", endDate: "2026/03/09 22:00", applicant: "林小芳",
    approvalFlow: [
      { name: "林小芳", role: "申請人", status: "approved", time: "03/07 16:00" },
      { name: "我（李主管）", role: "直屬主管", status: "pending" },
      { name: "張經理", role: "部門經理", status: "waiting" },
    ],
  },
];

const reviewedRecords: Record[] = [
  {
    title: "出差申請", date: "2026/02/25", status: "已通過", statusColor: "text-success bg-success/10", days: "5天",
    type: "出差", reason: "參加上海技術研討會", startDate: "2026/03/01", endDate: "2026/03/05", applicant: "趙志強",
    approvalFlow: [
      { name: "趙志強", role: "申請人", status: "approved", time: "02/25 10:00" },
      { name: "我（李主管）", role: "直屬主管", status: "approved", time: "02/25 14:00", comment: "核准，注意安全" },
      { name: "張經理", role: "部門經理", status: "approved", time: "02/26 09:00", comment: "同意" },
    ],
  },
];

type ViewMode = "list" | "detail" | "approval";

const Applications = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedRecord, setSelectedRecord] = useState<Record | null>(null);
  const [showRecallDialog, setShowRecallDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [approvalComment, setApprovalComment] = useState("");

  const currentRecords = activeTab === 0 ? myRecords : activeTab === 1 ? pendingRecords : reviewedRecords;

  const handleRecordClick = (record: Record) => {
    setSelectedRecord(record);
    setViewMode(activeTab === 1 ? "approval" : "detail");
  };

  const handleBack = () => {
    setViewMode("list");
    setSelectedRecord(null);
    setApprovalComment("");
  };

  const getFlowIcon = (status: string) => {
    switch (status) {
      case "approved": return <CheckCircle2 className="w-5 h-5 text-success" />;
      case "rejected": return <AlertCircle className="w-5 h-5 text-destructive" />;
      case "pending": return <Clock className="w-5 h-5 text-warning" />;
      default: return <Circle className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getFlowLabel = (status: string) => {
    switch (status) {
      case "approved": return "已通過";
      case "rejected": return "已駁回";
      case "pending": return "審批中";
      default: return "等待中";
    }
  };

  // Detail / Approval view
  if (viewMode !== "list" && selectedRecord) {
    const isApproval = viewMode === "approval";
    const canRecall = selectedRecord.status === "審批中";

    return (
      <MobileLayout title={isApproval ? "審批詳情" : "申請詳情"}>
        <div className="px-5 pt-4">
          {/* Back button */}
          <button onClick={handleBack} className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4 active:opacity-70">
            <ArrowLeft className="w-4 h-4" />
            返回列表
          </button>

          {/* Header card */}
          <div className="bg-card rounded-xl border border-border p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-foreground">{selectedRecord.title}</h2>
              <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${selectedRecord.statusColor}`}>
                {selectedRecord.status}
              </span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">申請人</span>
                <span className="text-foreground font-medium">{selectedRecord.applicant}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">申請類型</span>
                <span className="text-foreground">{selectedRecord.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">提交日期</span>
                <span className="text-foreground">{selectedRecord.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">起始日期</span>
                <span className="text-foreground">{selectedRecord.startDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">結束日期</span>
                <span className="text-foreground">{selectedRecord.endDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">時長/金額</span>
                <span className="text-foreground font-medium">{selectedRecord.days}</span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground mb-1">事由</p>
              <p className="text-sm text-foreground">{selectedRecord.reason}</p>
            </div>
          </div>

          {/* Approval flow */}
          <div className="bg-card rounded-xl border border-border p-4 mb-4">
            <h3 className="text-sm font-semibold text-foreground mb-4">審批流程</h3>
            <div className="space-y-0">
              {selectedRecord.approvalFlow.map((step, i) => (
                <div key={i} className="flex gap-3">
                  {/* Timeline */}
                  <div className="flex flex-col items-center">
                    {getFlowIcon(step.status)}
                    {i < selectedRecord.approvalFlow.length - 1 && (
                      <div className={`w-0.5 flex-1 my-1 ${step.status === "approved" || step.status === "rejected" ? "bg-border" : "bg-muted"}`} />
                    )}
                  </div>
                  {/* Content */}
                  <div className="flex-1 pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">{step.name}</p>
                        <p className="text-xs text-muted-foreground">{step.role}</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                          step.status === "approved" ? "text-success bg-success/10" :
                          step.status === "rejected" ? "text-destructive bg-destructive/10" :
                          step.status === "pending" ? "text-warning bg-warning/10" :
                          "text-muted-foreground bg-muted"
                        }`}>
                          {getFlowLabel(step.status)}
                        </span>
                        {step.time && <p className="text-[10px] text-muted-foreground mt-0.5">{step.time}</p>}
                      </div>
                    </div>
                    {step.comment && (
                      <div className="mt-1.5 bg-muted/50 rounded-lg px-3 py-2">
                        <p className="text-xs text-muted-foreground">「{step.comment}」</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          {isApproval ? (
            <div className="flex gap-3 mb-6">
              <button
                onClick={() => setShowRejectDialog(true)}
                className="flex-1 bg-destructive/10 text-destructive rounded-xl py-3 text-sm font-medium active:scale-[0.98] transition-transform flex items-center justify-center gap-1.5"
              >
                <XIcon className="w-4 h-4" />
                駁回
              </button>
              <button
                onClick={() => setShowApproveDialog(true)}
                className="flex-1 bg-primary text-primary-foreground rounded-xl py-3 text-sm font-medium active:scale-[0.98] transition-transform flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                通過
              </button>
            </div>
          ) : canRecall ? (
            <button
              onClick={() => setShowRecallDialog(true)}
              className="w-full bg-warning/10 text-warning rounded-xl py-3 text-sm font-medium active:scale-[0.98] transition-transform flex items-center justify-center gap-1.5 mb-6"
            >
              <RotateCcw className="w-4 h-4" />
              撤回申請
            </button>
          ) : null}
        </div>

        {/* Recall confirmation */}
        <AlertDialog open={showRecallDialog} onOpenChange={setShowRecallDialog}>
          <AlertDialogContent className="max-w-[85vw] rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-base">確認撤回</AlertDialogTitle>
              <AlertDialogDescription className="text-xs">撤回後此申請將取消，如需重新提交請建立新申請。確定要撤回嗎？</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="text-xs">取消</AlertDialogCancel>
              <AlertDialogAction className="text-xs bg-warning text-warning-foreground hover:bg-warning/90" onClick={handleBack}>確認撤回</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Approve dialog */}
        <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
          <AlertDialogContent className="max-w-[85vw] rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-base">確認通過</AlertDialogTitle>
              <AlertDialogDescription className="text-xs">請輸入審批意見（選填）</AlertDialogDescription>
            </AlertDialogHeader>
            <textarea
              value={approvalComment}
              onChange={(e) => setApprovalComment(e.target.value)}
              placeholder="輸入審批意見..."
              className="w-full border border-border rounded-lg p-3 text-sm bg-background text-foreground placeholder:text-muted-foreground resize-none h-20 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <AlertDialogFooter>
              <AlertDialogCancel className="text-xs">取消</AlertDialogCancel>
              <AlertDialogAction className="text-xs" onClick={handleBack}>確認通過</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Reject dialog */}
        <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <AlertDialogContent className="max-w-[85vw] rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-base">確認駁回</AlertDialogTitle>
              <AlertDialogDescription className="text-xs">請輸入駁回原因</AlertDialogDescription>
            </AlertDialogHeader>
            <textarea
              value={approvalComment}
              onChange={(e) => setApprovalComment(e.target.value)}
              placeholder="輸入駁回原因..."
              className="w-full border border-border rounded-lg p-3 text-sm bg-background text-foreground placeholder:text-muted-foreground resize-none h-20 focus:outline-none focus:ring-2 focus:ring-destructive/30"
            />
            <AlertDialogFooter>
              <AlertDialogCancel className="text-xs">取消</AlertDialogCancel>
              <AlertDialogAction className="text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleBack}>確認駁回</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </MobileLayout>
    );
  }

  // List view
  return (
    <MobileLayout title="申請與審批">
      <div className="px-5 pt-4">
        {/* New Application Button */}
        <button
          onClick={() => setShowNewDialog(true)}
          className="w-full bg-primary text-primary-foreground rounded-xl p-3.5 flex items-center justify-center gap-2 mb-5 active:scale-[0.98] transition-transform font-medium text-sm shadow-sm"
        >
          <Plus className="w-4 h-4" />
          新增申請
        </button>

        {/* Tabs */}
        <div className="flex gap-1 bg-secondary rounded-xl p-1 mb-4">
          {tabs.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${
                activeTab === i
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground"
              }`}
            >
              {tab}
              {i === 1 && pendingRecords.length > 0 && (
                <span className="ml-1 bg-destructive text-destructive-foreground text-[9px] px-1.5 py-0.5 rounded-full">
                  {pendingRecords.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Records */}
        <div className="space-y-3">
          {currentRecords.map((record, i) => (
            <button
              key={i}
              onClick={() => handleRecordClick(record)}
              className="w-full bg-card rounded-xl border border-border p-4 flex items-center text-left active:scale-[0.99] transition-transform"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">{record.title}</p>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${record.statusColor}`}>
                    {record.status}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {activeTab !== 0 && <span>{record.applicant} · </span>}
                  {record.date} · {record.days}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </button>
          ))}
          {currentRecords.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">暫無記錄</div>
          )}
        </div>
      </div>

      {/* New Application Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="max-w-[92vw] rounded-2xl p-5">
          <DialogHeader>
            <DialogTitle className="text-base">新增申請</DialogTitle>
            <DialogDescription className="text-xs">請選擇申請類型</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 pt-1">
            {applicationTypes.map((type) => (
              <button
                key={type.label}
                onClick={() => setShowNewDialog(false)}
                className="bg-card rounded-xl border border-border p-3.5 flex items-start gap-3 text-left active:scale-[0.98] transition-transform hover:bg-muted/50"
              >
                <div className={`w-9 h-9 rounded-lg ${type.color} flex items-center justify-center shrink-0`}>
                  <type.icon className="w-4 h-4 text-primary-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{type.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{type.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </MobileLayout>
  );
};

export default Applications;
