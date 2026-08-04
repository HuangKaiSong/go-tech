import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import MobileLayout from "@/components/MobileLayout";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  AlertCircle, ArrowLeft, CalendarDays, Camera, CheckCircle2, Clock, FileEdit, History,
  ImageIcon, MapPin, RotateCcw, Wifi, XCircle
} from "lucide-react";
import { toast } from "sonner";
import { type ClockHistoryItem, type ClockToday, getClockHistory, getTodayClock, punchClock } from "@/api/attendance";
import {
  type Approval, SUPPLEMENT_BOTH,
  SUPPLEMENT_CLOCK_IN, SUPPLEMENT_CLOCK_OUT, TYPE_CODE,
  getMyApplications,
} from "@/api/approval";

/** 状态码 → 展示样式键 + 文案 */
const STATUS_MAP: Record<number, { key: AttendanceRecord["status"]; label: string }> = {
  1: { key: "normal", label: "正常" },
  2: { key: "late", label: "遲到" },
  3: { key: "early", label: "早退" },
  4: { key: "absent", label: "缺勤" },
  5: { key: "leave", label: "請假" },
  6: { key: "leave", label: "出差" },
};

/** 十进制小时 → "Xh Ym" */
function formatHours(h?: number): string {
  if (h === undefined || h <= 0) return "--";
  const total = Math.round(h * 60);
  const hh = Math.floor(total / 60);
  const mm = total % 60;
  return mm > 0 ? `${hh}h${mm}m` : `${hh}h`;
}

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

/** 后端历史记录 → 页面展示行 */
function mapHistory(item: ClockHistoryItem): AttendanceRecord {
  const meta = STATUS_MAP[item.statusCode] ?? { key: "normal" as const, label: item.status ?? "-" };
  const d = new Date(item.date.replace(/-/g, "/"));
  return {
    date: item.date.slice(5).replace("-", "/"),
    // 顯示用 date 已去掉年份，補卡提交需完整日期，故另存一份
    fullDate: item.date,
    weekday: WEEKDAYS[d.getDay()] ?? "",
    clockIn: item.clockIn ?? "--:--",
    clockOut: item.clockOut ?? "--:--",
    status: meta.key,
    statusLabel: meta.label,
    hours: formatHours(item.hoursWorked),
  };
}

type AttendanceRecord = {
  clockIn: string;
  clockOut: string;
  /** 顯示用 MM/DD */
  date: string;
  /** 完整日期 yyyy-MM-dd（補卡提交用） */
  fullDate: string;
  hours: string;
  status: "absent" | "early" | "late" | "leave" | "normal";
  statusLabel: string;
  weekday: string;
};

const getStatusStyle = (status: string) => {
  switch (status) {
    case "normal": return "text-success bg-success/10";
    case "late": return "text-warning bg-warning/10";
    case "early": return "text-warning bg-warning/10";
    case "absent": return "text-destructive bg-destructive/10";
    case "leave": return "text-info bg-info/10";
    default: return "text-muted-foreground bg-muted";
  }
};

type SupplementRequest = {
  /** 顯示用 MM/DD */
  date: string;
  /** 完整日期 yyyy-MM-dd（比對缺勤記錄用） */
  fullDate: string;
  reason: string;
  /** 補卡時段：上班打卡 / 下班打卡 / 上下班皆漏 */
  slot: string;
  /** 單據狀態碼 1待審 2審批中 3已通過 4已拒絕 5已撤回 */
  statusCode: number;
  statusText: string;
  time: string;
};

/** 補卡單狀態碼 → 徽章配色（對齊後端 ApprovalStatusEnum） */
const SUPPLEMENT_STATUS_STYLE: Record<number, string> = {
  1: "text-warning bg-warning/10",
  2: "text-warning bg-warning/10",
  3: "text-success bg-success/10",
  4: "text-destructive bg-destructive/10",
  5: "text-muted-foreground bg-muted",
};

type ViewMode = "absent" | "clock" | "history" | "supplement";

/** 获取定位：返回坐标；失败时带 error 原因（不阻塞打卡，是否必须由后端按地点判定） */
const getCoords = (): Promise<{ error?: string; lat?: number; lng?: number }> =>
  new Promise((resolve) => {
    if (!("geolocation" in navigator)) {
      resolve({ error: "此瀏覽器不支援定位" });
      return;
    }
    // 非安全上下文（HTTP 非 localhost）浏览器会停用定位
    if (typeof window !== "undefined" && !window.isSecureContext) {
      resolve({ error: "當前為非安全連線(HTTP)，瀏覽器已停用定位，請用 HTTPS 或 localhost 存取" });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => {
        let msg = "定位失敗";
        if (err.code === err.PERMISSION_DENIED) msg = "定位權限被拒絕，請在瀏覽器允許定位後再打卡";
        else if (err.code === err.POSITION_UNAVAILABLE) msg = "無法取得目前位置，請確認已開啟定位";
        else if (err.code === err.TIMEOUT) msg = "定位逾時，請重試";
        resolve({ error: msg });
      },
      { timeout: 8000, enableHighAccuracy: true },
    );
  });

const toMin = (t?: string): number | null => {
  if (!t) return null;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

// oxlint-disable-next-line complexity
const ClockIn = () => {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [today, setToday] = useState<ClockToday | null>(null);
  const [punching, setPunching] = useState(false);
  const clockedOut = Boolean(today?.clockOut);
  const [viewMode, setViewMode] = useState<ViewMode>("clock");
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [showCameraPrompt, setShowCameraPrompt] = useState(false);
  const [requirePhoto, setRequirePhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [supplementApprovals, setSupplementApprovals] = useState<Approval[]>([]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 载入今日打卡状态
  useEffect(() => {
    getTodayClock()
      .then((res) => setToday(res.data))
      .catch(() => setToday(null));
  }, []);

  // 载入考勤历史（当年全部，倒序）
  const [rawHistory, setRawHistory] = useState<ClockHistoryItem[]>([]);
  useEffect(() => {
    getClockHistory()
      .then((res) => setRawHistory(res.data ?? []))
      .catch(() => setRawHistory([]));
  }, []);
  const historyRecords = useMemo(() => rawHistory.map(mapHistory), [rawHistory]);

  // 载入我的补卡申请（type=7），用于标记缺勤记录是否已申请
  const loadSupplements = useCallback(() => {
    getMyApplications({ type: TYPE_CODE.supplement })
      .then((res) => setSupplementApprovals(res.data ?? []))
      .catch(() => setSupplementApprovals([]));
  }, []);
  useEffect(() => {
    loadSupplements();
  }, [loadSupplements]);

  /** 审批单 → 补卡记录展示模型（payload 由「我的申请」接口一并返回） */
  const supplementRequests = useMemo<SupplementRequest[]>(
    () => supplementApprovals.map((a) => {
      const full = String(a.payload?.date ?? "");
      const inTime = a.payload?.clockInTime ? String(a.payload.clockInTime) : "";
      const outTime = a.payload?.clockOutTime ? String(a.payload.clockOutTime) : "";
      return {
        fullDate: full,
        date: full.slice(5).replace("-", "/"),
        slot: a.subType ?? SUPPLEMENT_CLOCK_IN,
        // 上下班皆漏时两个时间都要展示
        time: [inTime, outTime].filter(Boolean).join(" - "),
        reason: String(a.payload?.reason ?? ""),
        statusCode: a.statusCode,
        statusText: a.status ?? "",
      };
    }),
    [supplementApprovals],
  );

  // 本月统计（从考勤历史按当前年月计算）
  const monthStats = useMemo(() => {
    const now = new Date();
    const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const cur = rawHistory.filter((r) => r.date.startsWith(prefix));
    const attend = cur.filter((r) => Boolean(r.clockIn)).length;
    const late = cur.filter((r) => r.statusCode === 2).length;
    const absent = cur.filter((r) => r.statusCode === 4).length;
    const hours = cur.reduce((sum, r) => sum + (r.hoursWorked ?? 0), 0);
    return { attend, late, absent, hours: Math.round(hours * 10) / 10 };
  }, [rawHistory]);

  // 迟到/早退确认弹框
  const [confirm, setConfirm] = useState<{ msg: string; open: boolean }>({ open: false, msg: "" });

  /** 判断本次打卡是否迟到/早退，返回提示语（无则 null） */
  const checkAbnormal = (): string | null => {
    if (!today) return null;
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    if (today.canClockIn) {
      const start = toMin(today.workStart);
      if (start !== null && nowMin > start + (today.lateGrace ?? 0)) {
        return `目前已超過上班時間（${today.workStart}），本次打卡將記為「遲到」，確定要打卡嗎？`;
      }
    } else if (today.canClockOut) {
      const end = toMin(today.workEnd);
      if (end !== null && nowMin < end - (today.earlyLeaveGrace ?? 0)) {
        return `目前尚未到下班時間（${today.workEnd}），本次打卡將記為「早退」，確定要打卡嗎？`;
      }
    }
    return null;
  };

  /** 实际执行打卡 */
  const doPunch = async () => {
    setShowCameraPrompt(false);
    setPunching(true);
    const { error: geoErr, lat, lng } = await getCoords();
    try {
      const res = await punchClock({ lat, lng });
      setToday(res.data);
      toast.success(res.data.message || "打卡成功");
    } catch (err: any) {
      // 打卡失败时，若有定位失败原因，优先提示原因（比后端"無法獲取定位"更具体）
      toast.error(geoErr || err.message || "打卡失敗");
    } finally {
      setPunching(false);
    }
  };

  const handleClock = () => {
    if (!today || (!today.canClockIn && !today.canClockOut)) return;
    if (requirePhoto && !capturedPhoto) {
      setShowCameraPrompt(true);
      return;
    }
    const warn = checkAbnormal();
    if (warn) {
      setConfirm({ open: true, msg: warn });
      return;
    }
    doPunch();
  };

  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.addEventListener("load", (ev) => {
        setCapturedPhoto(ev.target?.result as string);
        setShowCameraPrompt(false);
      });
      reader.readAsDataURL(file);
    }
  };

  const handleRetakePhoto = () => {
    setCapturedPhoto(null);
    fileInputRef.current?.click();
  };

  // 補卡表單與「新增申請」共用一套，此處只帶著日期跳過去
  const goSupplementForm = (record: AttendanceRecord) => {
    let slot = SUPPLEMENT_CLOCK_OUT;
    if (record.clockIn === "--:--" && record.clockOut === "--:--") {
      slot = SUPPLEMENT_BOTH;
    } else if (record.clockIn === "--:--") {
      slot = SUPPLEMENT_CLOCK_IN;
    }
    navigate("/applications", {
      state: {
        openForm: "supplement",
        initial: { supplementDate: record.fullDate, supplementSlot: slot },
      },
    });
  };

  const absentRecords = historyRecords.filter(r => r.status === "absent");

  // ── Absent records view ──
  if (viewMode === "absent") {
    return (
      <MobileLayout title="缺勤記錄">
        <div className="px-5 pt-4">
          <button onClick={() => setViewMode("clock")} className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4 active:opacity-70">
            <ArrowLeft className="w-4 h-4" />返回打卡
          </button>

          <div className="bg-muted/50 rounded-xl p-3 mb-4 flex items-center gap-2">
            <XCircle className="w-4 h-4 text-destructive" />
            <span className="text-xs text-muted-foreground">共 {absentRecords.length} 筆缺勤記錄，點擊「補卡」可提交補卡申請</span>
          </div>

          {absentRecords.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">暫無缺勤記錄 🎉</div>
          ) : (
            <div className="space-y-3 mb-6">
              {absentRecords.map((record, i) => {
                // 只認仍在審或已通過的單；已駁回/撤回視同未申請，可重新提交
                const applied = supplementRequests.find(
                  r => r.fullDate === record.fullDate && [1, 2, 3].includes(r.statusCode),
                );
                return (
                  <div key={i} className="bg-card rounded-xl border border-border p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">{record.date} 週{record.weekday}</span>
                      </div>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${getStatusStyle(record.status)}`}>
                        {record.statusLabel}
                      </span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                      <div className="flex gap-4">
                        <span>上班：{record.clockIn}</span>
                        <span>下班：{record.clockOut}</span>
                      </div>
                    </div>
                    {applied ? (
                      <div className={`flex items-center justify-between p-2.5 rounded-lg ${
                        applied.statusCode === 3 ? "bg-success/10" : "bg-warning/10"
                      }`}>
                        <span className="text-xs text-muted-foreground">
                          已申請{applied.slot} · {applied.time}
                        </span>
                        <span className={`text-[10px] font-medium ${
                          applied.statusCode === 3 ? "text-success" : "text-warning"
                        }`}>
                          {applied.statusText}
                        </span>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        className="w-full h-8 gap-1 text-xs"
                        onClick={() => goSupplementForm(record)}
                      >
                        <FileEdit className="w-3.5 h-3.5" />申請補卡
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </MobileLayout>
    );
  }

  // ── Supplement records view ──
  if (viewMode === "supplement") {
    return (
      <MobileLayout title="補卡記錄">
        <div className="px-5 pt-4">
          <button onClick={() => setViewMode("clock")} className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4 active:opacity-70">
            <ArrowLeft className="w-4 h-4" />返回打卡
          </button>

          <h3 className="text-sm font-semibold text-foreground mb-4">補卡記錄</h3>

          {supplementRequests.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">暫無補卡記錄</div>
          ) : (
            <div className="space-y-3 mb-6">
              {supplementRequests.map((req, i) => (
                <div key={`${req.fullDate}-${i}`} className="bg-card rounded-xl border border-border p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">{req.date}</span>
                      <span className="text-xs text-muted-foreground">
                        {req.slot}
                      </span>
                    </div>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${SUPPLEMENT_STATUS_STYLE[req.statusCode] ?? "text-muted-foreground bg-muted"}`}>
                      {req.statusText}
                    </span>
                  </div>
                  <Separator className="my-2" />
                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span>補卡時間</span><span className="text-foreground font-medium">{req.time}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>原因</span><span className="text-foreground">{req.reason}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </MobileLayout>
    );
  }

  // ── History view ──
  if (viewMode === "history") {
    const normalCount = historyRecords.filter(r => r.status === "normal").length;
    const lateCount = historyRecords.filter(r => r.status === "late" || r.status === "early").length;
    const absentCount = historyRecords.filter(r => r.status === "absent").length;
    const leaveCount = historyRecords.filter(r => r.status === "leave").length;

    return (
      <MobileLayout title="考勤記錄">
        <div className="px-5 pt-4">
          <button onClick={() => setViewMode("clock")} className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4 active:opacity-70">
            <ArrowLeft className="w-4 h-4" />返回打卡
          </button>

          {/* Summary */}
          <div className="grid grid-cols-4 gap-2 mb-5">
            <div className="bg-card rounded-xl border border-border p-3 text-center">
              <CheckCircle2 className="w-3.5 h-3.5 text-success mx-auto mb-1" />
              <p className="text-lg font-bold text-success">{normalCount}</p>
              <p className="text-[10px] text-muted-foreground">正常</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-3 text-center">
              <AlertCircle className="w-3.5 h-3.5 text-warning mx-auto mb-1" />
              <p className="text-lg font-bold text-warning">{lateCount}</p>
              <p className="text-[10px] text-muted-foreground">異常</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-3 text-center">
              <XCircle className="w-3.5 h-3.5 text-destructive mx-auto mb-1" />
              <p className="text-lg font-bold text-destructive">{absentCount}</p>
              <p className="text-[10px] text-muted-foreground">缺勤</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-3 text-center">
              <CalendarDays className="w-3.5 h-3.5 text-info mx-auto mb-1" />
              <p className="text-lg font-bold text-info">{leaveCount}</p>
              <p className="text-[10px] text-muted-foreground">請假</p>
            </div>
          </div>

          {/* Records list */}
          <h3 className="text-sm font-semibold text-foreground mb-3">詳細記錄</h3>
          <div className="bg-card rounded-xl border border-border divide-y divide-border mb-6">
            {historyRecords.map((record, i) => (
              <div key={i} className="flex items-center px-4 py-3">
                <div className="w-16">
                  <p className="text-sm font-medium text-foreground">{record.date}</p>
                  <p className="text-[10px] text-muted-foreground">週{record.weekday}</p>
                </div>
                <div className="flex-1 flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{record.clockIn}</span>
                  <span className="text-[10px]">→</span>
                  <span>{record.clockOut}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{record.hours}</span>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${getStatusStyle(record.status)}`}>
                    {record.statusLabel}
                  </span>
                  {record.status === "absent" && (
                    <button
                      onClick={() => goSupplementForm(record)}
                      className="text-[10px] text-primary font-medium px-2 py-0.5 rounded-full bg-primary/10 active:bg-primary/20"
                    >
                      補卡
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </MobileLayout>
    );
  }

  // ── Clock view ──
  let locationLabel = "定位打卡";
  if (today?.locationName) {
    locationLabel = today.locationName;
  } else if (today?.scheduleName) {
    locationLabel = `班次：${today.scheduleName}`;
  }

  const photoReady = !requirePhoto || capturedPhoto;
  let ringCls = "bg-gradient-to-br from-muted-foreground/40 to-muted-foreground/30 shadow-none";
  if (clockedOut) {
    ringCls = "bg-gradient-to-br from-emerald-400 to-teal-500 dark:from-emerald-600 dark:to-teal-700 shadow-[0_0_30px_rgba(16,185,129,0.3)] dark:shadow-[0_0_30px_rgba(16,185,129,0.15)]";
  } else if (photoReady) {
    ringCls = "bg-gradient-to-br from-primary to-blue-600 dark:from-[hsl(220,30%,25%)] dark:to-[hsl(215,25%,30%)] shadow-[0_0_30px_rgba(59,130,246,0.3)] dark:shadow-[0_0_30px_rgba(59,130,246,0.15)]";
  }
  let btnCls = "bg-gradient-to-br from-muted to-muted text-muted-foreground cursor-not-allowed";
  if (clockedOut) {
    btnCls = "bg-gradient-to-br from-emerald-500 to-teal-600 dark:from-emerald-700 dark:to-teal-800 text-white";
  } else if (photoReady) {
    btnCls = "bg-gradient-to-br from-primary to-blue-600 dark:from-[hsl(220,30%,22%)] dark:to-[hsl(215,25%,28%)] text-primary-foreground hover:opacity-90";
  }
  let clockLabel = "✓ 已完成打卡";
  if (punching) {
    clockLabel = "打卡中...";
  } else if (requirePhoto && !capturedPhoto) {
    clockLabel = "📷 請先拍照";
  } else if (today?.canClockIn) {
    clockLabel = "點擊上班打卡";
  } else if (today?.canClockOut) {
    clockLabel = "點擊下班打卡";
  }

  return (
    <MobileLayout title="打卡">
      <div className="px-5 pt-6">
        {/* Location info */}
        <div className="flex items-center gap-2 justify-center text-muted-foreground mb-4">
          <MapPin className="w-4 h-4" />
          <span className="text-sm">
            {locationLabel}
          </span>
          <Wifi className="w-4 h-4 text-success" />
        </div>

        {/* Clock mode toggle */}
        <div className="flex items-center justify-center gap-1 mb-6">
          <button
            onClick={() => { setRequirePhoto(false); setCapturedPhoto(null); }}
            className={`px-4 py-1.5 rounded-l-full text-xs font-medium transition-colors ${
              !requirePhoto
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            普通打卡
          </button>
          <button
            onClick={() => setRequirePhoto(true)}
            className={`px-4 py-1.5 rounded-r-full text-xs font-medium transition-colors flex items-center gap-1 ${
              requirePhoto
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            <Camera className="w-3 h-3" />拍照打卡
          </button>
        </div>

        {/* Hidden file input for camera */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="user"
          className="hidden"
          onChange={handleCapture}
        />

        {/* Camera prompt dialog */}
        {requirePhoto && (
          <Dialog open={showCameraPrompt} onOpenChange={setShowCameraPrompt}>
            <DialogContent className="max-w-[340px] rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-base flex items-center gap-2">
                  <Camera className="w-4 h-4" />拍照打卡
                </DialogTitle>
                <DialogDescription>請先拍照驗證身份，方可完成打卡</DialogDescription>
              </DialogHeader>
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
                  <Camera className="w-10 h-10 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground text-center">點擊下方按鈕開啟相機拍照</p>
                <Button className="w-full gap-2" onClick={() => fileInputRef.current?.click()}>
                  <Camera className="w-4 h-4" />開啟相機
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* 迟到/早退确认弹框 */}
        <Dialog open={confirm.open} onOpenChange={(v) => setConfirm(c => ({ ...c, open: v }))}>
          <DialogContent className="max-w-[320px] rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-base flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-warning" />打卡提示
              </DialogTitle>
              <DialogDescription className="text-sm leading-relaxed pt-1">{confirm.msg}</DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button variant="outline" size="sm" onClick={() => setConfirm({ open: false, msg: "" })}>取消</Button>
              <Button size="sm" onClick={() => { setConfirm({ open: false, msg: "" }); doPunch(); }}>確定打卡</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Photo capture area - only show in photo mode */}
        {requirePhoto && (
          <div className="flex flex-col items-center mt-2 mb-2">
            {capturedPhoto ? (
              <div className="flex flex-col items-center gap-2">
                <div className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-success shadow-md">
                  <img src={capturedPhoto} alt="打卡照片" className="w-full h-full object-cover" />
                  <div className="absolute top-0.5 right-0.5">
                    <CheckCircle2 className="w-4 h-4 text-success drop-shadow" />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-success font-medium flex items-center gap-1">
                    <ImageIcon className="w-3 h-3" />照片已就緒
                  </span>
                  {!clockedOut && (
                    <button onClick={handleRetakePhoto} className="text-xs text-muted-foreground flex items-center gap-1 hover:text-foreground transition-colors">
                      <RotateCcw className="w-3 h-3" />重拍
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center gap-1.5 px-6 py-3 rounded-xl border-2 border-dashed border-muted-foreground/30 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors active:scale-95"
              >
                <Camera className="w-6 h-6" />
                <span className="text-xs font-medium">拍照驗證</span>
              </button>
            )}
          </div>
        )}

        {/* Clock circle */}
        <div className="flex flex-col items-center mt-2">
          <div className={`rounded-full p-1 ${ringCls}`}>
            <button
              onClick={handleClock}
              disabled={punching || !today || (!today.canClockIn && !today.canClockOut)}
              className={`w-44 h-44 rounded-full flex flex-col items-center justify-center transition-all active:scale-95 ${btnCls}`}
            >
              <Clock className="w-8 h-8 mb-2" />
              <span className="text-2xl font-bold">
                {currentTime.toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" })}
              </span>
              <span className="text-sm mt-1 opacity-90">
                {clockLabel}
              </span>
            </button>
          </div>
        </div>

        {/* Today records */}
        <div className="mt-8 space-y-3">
          <h3 className="text-sm font-semibold text-foreground">今日打卡記錄</h3>
          <div className="bg-card rounded-xl border border-border divide-y divide-border">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${today?.clockIn ? "bg-success" : "bg-muted-foreground/30"}`} />
                <span className="text-sm text-foreground">上班打卡</span>
                {today?.lateMinutes ? <span className="text-[10px] text-warning">遲到{today.lateMinutes}分</span> : null}
              </div>
              <span className="text-sm font-medium text-foreground">{today?.clockIn ?? "未打卡"}</span>
            </div>
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${today?.clockOut ? "bg-success" : "bg-muted-foreground/30"}`} />
                <span className="text-sm text-foreground">下班打卡</span>
                {today?.earlyMinutes ? <span className="text-[10px] text-warning">早退{today.earlyMinutes}分</span> : null}
              </div>
              <span className="text-sm font-medium text-foreground">{today?.clockOut ?? "未打卡"}</span>
            </div>
          </div>
        </div>

        {/* Monthly summary */}
        <div className="mt-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">本月統計</h3>
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "出勤", value: `${monthStats.attend}天`, color: "text-success", action: undefined },
              { label: "遲到", value: `${monthStats.late}次`, color: "text-warning", action: undefined },
              { label: "缺勤", value: `${monthStats.absent}次`, color: "text-destructive", action: () => setViewMode("absent") },
              { label: "工時", value: `${monthStats.hours}h`, color: "text-info", action: undefined },
            ].map((stat) => (
              <button
                key={stat.label}
                onClick={stat.action}
                className={`bg-card rounded-xl border border-border p-3 text-center ${stat.action ? "active:scale-[0.97] transition-transform" : ""}`}
              >
                <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-3 mt-5 mb-6">
          <button
            onClick={() => setViewMode("history")}
            className="bg-card rounded-xl border border-border p-3.5 flex items-center justify-center gap-2 text-sm font-medium text-primary active:scale-[0.98] transition-transform"
          >
            <History className="w-4 h-4" />考勤記錄
          </button>
          <button
            onClick={() => setViewMode("supplement")}
            className="bg-card rounded-xl border border-border p-3.5 flex items-center justify-center gap-2 text-sm font-medium text-primary active:scale-[0.98] transition-transform"
          >
            <FileEdit className="w-4 h-4" />補卡記錄
          </button>
        </div>
      </div>
    </MobileLayout>
  );
};

export default ClockIn;