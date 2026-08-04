import { useCallback, useEffect, useState } from "react";
import MobileLayout from "@/components/MobileLayout";
import { useLocation, useNavigate } from "react-router-dom";
import { AlertCircle, ArrowLeft, CalendarDays, Check, CheckCircle2, ChevronRight, Circle, ClipboardCheck, Clock, Loader2, LogOut, MinusCircle, Paperclip, Plane, Plus, Receipt, RotateCcw, X as XIcon } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import ApplicationForm, { type ApplicationFormInitial } from "@/components/ApplicationForm";
import {
  APPROVAL_STATUS_COLOR, type ApplicationTypeKey, type Approval, NODE_STATUS_TEXT,
  approveApproval, getApprovalById, getMyApplications,
  getMyPending, getMyReviewed,
  rejectApproval, withdrawApproval,
} from "@/api/approval";

const applicationTypes: { color: string; desc: string; icon: typeof CalendarDays; key: ApplicationTypeKey; label: string }[] = [
  { key: "leave", icon: CalendarDays, label: "請假申請", desc: "類別/起止時間/事由", color: "bg-primary" },
  { key: "overtime", icon: Clock, label: "加班申請", desc: "日期/時段/預計工時", color: "bg-warning" },
  { key: "expense", icon: Receipt, label: "報銷申請", desc: "金額/幣別/發票附件", color: "bg-accent" },
  { key: "trip", icon: Plane, label: "出差申請", desc: "城市/國家/起止日期", color: "bg-info" },
  { key: "resign", icon: LogOut, label: "離職申請", desc: "離職日期/原因/交接", color: "bg-destructive" },
  { key: "supplement", icon: ClipboardCheck, label: "補卡申請", desc: "漏打卡補登/需主管核准", color: "bg-primary" },
];

const tabs = ["我的申請", "待審批", "已審核"];

/** payload 字段展示：顺序即渲染顺序，未登记的键不展示（reason 另在底部单独渲染） */
const PAYLOAD_LABELS: [string, string][] = [
  ["startDate", "開始日期"],
  ["endDate", "結束日期"],
  ["date", "日期"],
  ["startTime", "開始時間"],
  ["endTime", "結束時間"],
  ["clockInTime", "上班補卡時間"],
  ["clockOutTime", "下班補卡時間"],
  ["missReason", "漏打原因"],
  ["witness", "見證同事"],
  ["days", "天數"],
  ["hours", "時數"],
  ["half", "時段"],
  ["amount", "金額"],
  ["currency", "幣別"],
  ["invoiceNo", "發票號碼"],
  ["payee", "收款人/店家"],
  ["country", "國家/地區"],
  ["city", "城市"],
  ["transport", "交通方式"],
  ["budget", "預估費用"],
  ["companions", "同行人員"],
  ["contact", "緊急聯絡"],
  ["resignDate", "預計離職日"],
  ["resignReason", "離職原因"],
  ["handover", "交接對象"],
  ["feedback", "建議回饋"],
  ["compensation", "補償方式"],
];

/** 表单里存的是码值，展示要换回中文 */
const VALUE_TEXT: Record<string, Record<string, string>> = {
  half: { full: "全天", am: "上午半天", pm: "下午半天" },
  compensation: { pay: "加班費", leave: "折換補休" },
};

const formatValue = (key: string, value: unknown) => {
  const mapped = VALUE_TEXT[key]?.[String(value)];
  if (mapped) return mapped;
  if (key === "days") return `${value} 天`;
  if (key === "hours") return `${value} 小時`;
  return String(value);
};

type ViewMode = "detail" | "form" | "list";

const getFlowIcon = (statusCode: number, current?: boolean) => {
  if (statusCode === 2) return <CheckCircle2 className="w-5 h-5 text-success" />;
  if (statusCode === 3) return <AlertCircle className="w-5 h-5 text-destructive" />;
  if (statusCode === 4) return <MinusCircle className="w-5 h-5 text-muted-foreground" />;
  return current
    ? <Clock className="w-5 h-5 text-warning" />
    : <Circle className="w-5 h-5 text-muted-foreground" />;
};

const nodeBadgeCls = (statusCode: number, current?: boolean) => {
  if (statusCode === 2) return "text-success bg-success/10";
  if (statusCode === 3) return "text-destructive bg-destructive/10";
  if (statusCode === 1 && current) return "text-warning bg-warning/10";
  return "text-muted-foreground bg-muted";
};

const nodeBadgeText = (statusCode: number, current?: boolean) =>
  statusCode === 1 && !current ? "等待中" : NODE_STATUS_TEXT[statusCode] ?? "";

// oxlint-disable-next-line complexity
const Applications = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [formType, setFormType] = useState<ApplicationTypeKey | null>(null);
  const [formInitial, setFormInitial] = useState<ApplicationFormInitial>();

  const [myList, setMyList] = useState<Approval[]>([]);
  const [pendingList, setPendingList] = useState<Approval[]>([]);
  const [reviewedList, setReviewedList] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);

  const [detail, setDetail] = useState<Approval | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [showRecallDialog, setShowRecallDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [approvalComment, setApprovalComment] = useState("");
  const [acting, setActing] = useState(false);

  const loadLists = useCallback(async () => {
    setLoading(true);
    try {
      const [my, pending, reviewed] = await Promise.all([
        getMyApplications(), getMyPending(), getMyReviewed(),
      ]);
      setMyList(my.data ?? []);
      setPendingList(pending.data ?? []);
      setReviewedList(reviewed.data ?? []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "載入失敗");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLists();
  }, [loadLists]);

  // 由打卡页「申請補卡」跳转而来：直接开表单并预填日期
  // 用完即清掉 state，避免返回列表后再次刷新又弹回表单
  useEffect(() => {
    const state = location.state as { initial?: ApplicationFormInitial; openForm?: ApplicationTypeKey } | null;
    if (!state?.openForm) return;
    setFormType(state.openForm);
    setFormInitial(state.initial);
    setViewMode("form");
    navigate(location.pathname, { replace: true, state: null });
  }, [location, navigate]);

  let currentRecords = reviewedList;
  if (activeTab === 0) currentRecords = myList;
  else if (activeTab === 1) currentRecords = pendingList;

  const openDetail = async (id: number) => {
    setViewMode("detail");
    setDetailLoading(true);
    try {
      const res = await getApprovalById(id);
      setDetail(res.data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "載入失敗");
      setViewMode("list");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleBack = () => {
    setViewMode("list");
    setDetail(null);
    setFormType(null);
    setFormInitial(undefined);
    setApprovalComment("");
  };

  /** 提交/审批/撤回后：回列表并刷新，让状态与角标同步 */
  const backAndReload = () => {
    handleBack();
    loadLists();
  };

  const runAction = async (fn: () => Promise<unknown>, okMsg: string, close: () => void) => {
    setActing(true);
    try {
      await fn();
      toast.success(okMsg);
      close();
      backAndReload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "操作失敗");
    } finally {
      setActing(false);
    }
  };

  // Form view
  if (viewMode === "form" && formType) {
    return (
      <MobileLayout title="新增申請">
        <ApplicationForm typeKey={formType} initial={formInitial} onBack={handleBack} onSubmit={backAndReload} />
      </MobileLayout>
    );
  }

  // Detail view
  if (viewMode === "detail") {
    if (detailLoading || !detail) {
      return (
        <MobileLayout title="申請詳情">
          <div className="flex justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        </MobileLayout>
      );
    }

    const payload = detail.payload ?? {};
    const rows = PAYLOAD_LABELS.filter(([k]) => payload[k] !== undefined && payload[k] !== null && payload[k] !== "");

    return (
      <MobileLayout title={detail.canApprove ? "審批詳情" : "申請詳情"}>
        <div className="px-5 pt-4">
          <button onClick={handleBack} className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4 active:opacity-70">
            <ArrowLeft className="w-4 h-4" />
            返回列表
          </button>

          {/* Header card */}
          <div className="bg-card rounded-xl border border-border p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-foreground">{detail.typeName}</h2>
              <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${APPROVAL_STATUS_COLOR[detail.statusCode] ?? "text-muted-foreground bg-muted"}`}>
                {detail.status}
              </span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">單號</span>
                <span className="text-foreground font-mono text-xs">{detail.code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">申請人</span>
                <span className="text-foreground font-medium">
                  {detail.applicantName}
                  {detail.departmentName && <span className="text-muted-foreground font-normal"> · {detail.departmentName}</span>}
                </span>
              </div>
              {detail.subType && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">類別</span>
                  <span className="text-foreground">{detail.subType}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">提交時間</span>
                <span className="text-foreground">{detail.submittedAt}</span>
              </div>
              {rows.map(([key, label]) => (
                <div key={key} className="flex justify-between gap-3">
                  <span className="text-muted-foreground shrink-0">{label}</span>
                  <span className="text-foreground text-right break-all">{formatValue(key, payload[key])}</span>
                </div>
              ))}
            </div>

            {typeof payload.reason === "string" && payload.reason && (
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-xs text-muted-foreground mb-1">事由</p>
                <p className="text-sm text-foreground whitespace-pre-wrap">{payload.reason}</p>
              </div>
            )}

            {detail.attachments && detail.attachments.length > 0 && (
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-xs text-muted-foreground mb-1.5">附件</p>
                <div className="flex flex-wrap gap-2">
                  {detail.attachments.map((url, i) => (
                    <a
                      key={url}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 bg-muted rounded-lg px-2.5 py-1 text-[11px] text-foreground active:scale-95"
                    >
                      <Paperclip className="w-3 h-3" />
                      附件 {i + 1}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Approval flow */}
          <div className="bg-card rounded-xl border border-border p-4 mb-4">
            <h3 className="text-sm font-semibold text-foreground mb-4">審批流程</h3>
            <div className="space-y-0">
              {(detail.nodes ?? []).map((step, i) => (
                <div key={step.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    {getFlowIcon(step.statusCode, step.current)}
                    {i < (detail.nodes?.length ?? 0) - 1 && (
                      <div className={`w-0.5 flex-1 my-1 ${step.statusCode === 2 || step.statusCode === 3 ? "bg-border" : "bg-muted"}`} />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{step.approverName ?? "未指派"}</p>
                        <p className="text-xs text-muted-foreground truncate">{step.name}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${nodeBadgeCls(step.statusCode, step.current)}`}>
                          {nodeBadgeText(step.statusCode, step.current)}
                        </span>
                        {step.approvedAt && <p className="text-[10px] text-muted-foreground mt-0.5">{step.approvedAt}</p>}
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

          {/* History */}
          {detail.history && detail.history.length > 0 && (
            <div className="bg-card rounded-xl border border-border p-4 mb-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">操作紀錄</h3>
              <div className="space-y-2.5">
                {detail.history.map((h) => (
                  <div key={h.id} className="flex items-start justify-between gap-3 text-xs">
                    <div className="min-w-0">
                      <p className="text-foreground">
                        <span className="font-medium">{h.approverName}</span>
                        <span className="text-muted-foreground"> · {h.actionName}</span>
                      </p>
                      {h.comment && <p className="text-muted-foreground mt-0.5 break-all">{h.comment}</p>}
                    </div>
                    <span className="text-muted-foreground shrink-0">{h.createdAt}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons：以后端返回的权限为准，不靠 Tab 推断 */}
          {detail.canApprove && (
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
          )}
          {!detail.canApprove && detail.canWithdraw && (
            <button
              onClick={() => setShowRecallDialog(true)}
              className="w-full bg-warning/10 text-warning rounded-xl py-3 text-sm font-medium active:scale-[0.98] transition-transform flex items-center justify-center gap-1.5 mb-6"
            >
              <RotateCcw className="w-4 h-4" />
              撤回申請
            </button>
          )}
        </div>

        {/* Recall confirmation */}
        <AlertDialog open={showRecallDialog} onOpenChange={setShowRecallDialog}>
          <AlertDialogContent className="max-w-[85vw] rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-base">確認撤回</AlertDialogTitle>
              <AlertDialogDescription className="text-xs">撤回後此申請將取消，如需重新提交請建立新申請。確定要撤回嗎？</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="text-xs" disabled={acting}>取消</AlertDialogCancel>
              <AlertDialogAction
                className="text-xs bg-warning text-warning-foreground hover:bg-warning/90"
                disabled={acting}
                onClick={(e) => {
                  e.preventDefault();
                  runAction(() => withdrawApproval(detail.id), "已撤回申請", () => setShowRecallDialog(false));
                }}
              >
                {acting ? "處理中..." : "確認撤回"}
              </AlertDialogAction>
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
              <AlertDialogCancel className="text-xs" disabled={acting}>取消</AlertDialogCancel>
              <AlertDialogAction
                className="text-xs"
                disabled={acting}
                onClick={(e) => {
                  e.preventDefault();
                  runAction(() => approveApproval(detail.id, approvalComment), "已通過", () => setShowApproveDialog(false));
                }}
              >
                {acting ? "處理中..." : "確認通過"}
              </AlertDialogAction>
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
              <AlertDialogCancel className="text-xs" disabled={acting}>取消</AlertDialogCancel>
              <AlertDialogAction
                className="text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={acting}
                onClick={(e) => {
                  e.preventDefault();
                  if (!approvalComment.trim()) {
                    toast.error("請填寫駁回原因");
                    return;
                  }
                  runAction(() => rejectApproval(detail.id, approvalComment), "已駁回", () => setShowRejectDialog(false));
                }}
              >
                {acting ? "處理中..." : "確認駁回"}
              </AlertDialogAction>
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
                activeTab === i ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              {tab}
              {i === 1 && pendingList.length > 0 && (
                <span className="ml-1 bg-destructive text-destructive-foreground text-[9px] px-1.5 py-0.5 rounded-full">
                  {pendingList.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Records */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-3">
            {currentRecords.map((record) => (
              <button
                key={record.id}
                onClick={() => openDetail(record.id)}
                className="w-full bg-card rounded-xl border border-border p-4 flex items-center text-left active:scale-[0.99] transition-transform"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{record.typeName}</p>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${APPROVAL_STATUS_COLOR[record.statusCode] ?? "text-muted-foreground bg-muted"}`}>
                      {record.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {activeTab !== 0 && <span>{record.applicantName} · </span>}
                    {record.submittedAt}
                  </p>
                  {record.summary && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{record.summary}</p>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 ml-2" />
              </button>
            ))}
            {currentRecords.length === 0 && (
              <div className="text-center py-12 text-muted-foreground text-sm">暫無記錄</div>
            )}
          </div>
        )}
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
                key={type.key}
                onClick={() => { setShowNewDialog(false); setFormType(type.key); setViewMode("form"); }}
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
