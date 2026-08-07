import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  Camera,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileEdit,
  History,
  ImageIcon,
  Loader2,
  MapPin,
  RotateCcw,
  Wifi,
  XCircle
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  type Approval,
  SUPPLEMENT_BOTH,
  SUPPLEMENT_CLOCK_IN,
  SUPPLEMENT_CLOCK_OUT,
  TYPE_CODE,
  getMyApplications
} from '@/api/approval';
import {
  type ClockHistoryItem,
  type ClockPrecheck,
  type ClockToday,
  getClockHistory,
  getTodayClock,
  precheckClock,
  punchClock
} from '@/api/attendance';
import MobileLayout from '@/components/MobileLayout';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';

/** 状态码 → 展示样式键 + 文案 */
const STATUS_MAP: Record<number, { key: AttendanceRecord['status']; label: string }> = {
  1: { key: 'normal', label: '正常' },
  2: { key: 'late', label: '遲到' },
  3: { key: 'early', label: '早退' },
  4: { key: 'absent', label: '缺勤' },
  5: { key: 'leave', label: '請假' },
  6: { key: 'leave', label: '出差' }
};

/** 十进制小时 → "Xh Ym" */
function formatHours(h?: number): string {
  if (h === undefined || h <= 0) return '--';
  const total = Math.round(h * 60);
  const hh = Math.floor(total / 60);
  const mm = total % 60;
  return mm > 0 ? `${hh}h${mm}m` : `${hh}h`;
}

/** 分钟 → 超 60 分按「X小時Y分」显示，否则「Y分」 */
function formatMins(m?: number): string {
  if (!m || m <= 0) return '0分';
  if (m < 60) return `${m}分`;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return mm > 0 ? `${h}小時${mm}分` : `${h}小時`;
}

/** 压缩打卡照片：最长边缩到 maxDim，输出 JPEG，返回 dataURL */
function compressImage(dataUrl: string, maxDim = 1080, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener('load', () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('no ctx'));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', quality));
    });
    img.addEventListener('error', () => reject(new Error('image load failed')));
    img.src = dataUrl;
  });
}

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

/** 后端历史记录 → 页面展示行 */
function mapHistory(item: ClockHistoryItem): AttendanceRecord {
  const meta = STATUS_MAP[item.statusCode] ?? { key: 'normal' as const, label: item.status ?? '-' };
  const d = new Date(item.date.replace(/-/g, '/'));
  return {
    date: item.date.slice(5).replace('-', '/'),
    // 顯示用 date 已去掉年份，補卡提交需完整日期，故另存一份
    fullDate: item.date,
    weekday: WEEKDAYS[d.getDay()] ?? '',
    clockIn: item.clockIn ?? '--:--',
    clockOut: item.clockOut ?? '--:--',
    status: meta.key,
    statusLabel: meta.label,
    hours: formatHours(item.hoursWorked)
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
  status: 'absent' | 'early' | 'late' | 'leave' | 'normal';
  statusLabel: string;
  weekday: string;
};

const getStatusStyle = (status: string) => {
  switch (status) {
    case 'normal':
      return 'text-success bg-success/10';
    case 'late':
      return 'text-warning bg-warning/10';
    case 'early':
      return 'text-warning bg-warning/10';
    case 'absent':
      return 'text-destructive bg-destructive/10';
    case 'leave':
      return 'text-info bg-info/10';
    default:
      return 'text-muted-foreground bg-muted';
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
  1: 'text-warning bg-warning/10',
  2: 'text-warning bg-warning/10',
  3: 'text-success bg-success/10',
  4: 'text-destructive bg-destructive/10',
  5: 'text-muted-foreground bg-muted'
};

type ViewMode = 'absent' | 'clock' | 'history' | 'supplement';

/** 获取定位：返回坐标+精度；失败时带 error 原因（不阻塞打卡，是否必须由后端按地点判定） */
const getCoords = (): Promise<{ accuracy?: number; error?: string; lat?: number; lng?: number }> =>
  new Promise(resolve => {
    if (!('geolocation' in navigator)) {
      resolve({ error: '此瀏覽器不支援定位' });
      return;
    }
    // 非安全上下文（HTTP 非 localhost）浏览器会停用定位
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      resolve({ error: '當前為非安全連線(HTTP)，瀏覽器已停用定位，請用 HTTPS 或 localhost 存取' });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }),
      err => {
        let msg = '定位失敗';
        if (err.code === err.PERMISSION_DENIED) msg = '定位權限被拒絕，請在瀏覽器允許定位後再打卡';
        else if (err.code === err.POSITION_UNAVAILABLE) msg = '無法取得目前位置，請確認已開啟定位';
        else if (err.code === err.TIMEOUT) msg = '定位逾時，請重試';
        resolve({ error: msg });
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  });

const toMin = (t?: string): number | null => {
  if (!t) return null;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

// oxlint-disable-next-line complexity
const ClockIn = () => {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [today, setToday] = useState<ClockToday | null>(null);
  const [punching, setPunching] = useState(false);
  const clockedOut = Boolean(today?.clockOut);
  const [viewMode, setViewMode] = useState<ViewMode>('clock');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [showCameraPrompt, setShowCameraPrompt] = useState(false);
  const [requirePhoto, setRequirePhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const monthInputRef = useRef<HTMLInputElement>(null);
  const [supplementApprovals, setSupplementApprovals] = useState<Approval[]>([]);
  // 打卡范围预检状态（用于按钮变色与「是否远端打卡」确认）
  const [range, setRange] = useState<ClockPrecheck | null>(null);
  const [rangeLoading, setRangeLoading] = useState(true);
  const [accuracyM, setAccuracyM] = useState<number | undefined>(undefined);
  const [remoteConfirm, setRemoteConfirm] = useState<{
    coords: { accuracy?: number; lat?: number; lng?: number };
    open: boolean;
  }>({ open: false, coords: {} });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 载入今日打卡状态
  useEffect(() => {
    getTodayClock()
      .then(res => setToday(res.data))
      .catch(() => setToday(null));
  }, []);

  // 当月考勤（本月統計 + 缺勤补卡用）——按年月查，只取当月
  const curY = new Date().getFullYear();
  const curM = new Date().getMonth() + 1;
  const [curRaw, setCurRaw] = useState<ClockHistoryItem[]>([]);
  useEffect(() => {
    getClockHistory({ year: curY, month: curM })
      .then(res => setCurRaw(res.data ?? []))
      .catch(() => setCurRaw([]));
  }, [curY, curM]);
  const curRecords = useMemo(() => curRaw.map(mapHistory), [curRaw]);

  // 历史浏览（考勤记录详细列表）——可切换月份，默认当月；进入历史视图才拉，按年月查
  const [histY, setHistY] = useState(curY);
  const [histM, setHistM] = useState(curM);
  const [histRaw, setHistRaw] = useState<ClockHistoryItem[]>([]);
  const [histLoading, setHistLoading] = useState(false);
  useEffect(() => {
    if (viewMode !== 'history') return;
    setHistLoading(true);
    getClockHistory({ year: histY, month: histM })
      .then(res => setHistRaw(res.data ?? []))
      .catch(() => setHistRaw([]))
      .finally(() => setHistLoading(false));
  }, [viewMode, histY, histM]);
  const historyRecords = useMemo(() => histRaw.map(mapHistory), [histRaw]);

  // 载入我的补卡申请（type=7），用于标记缺勤记录是否已申请
  const loadSupplements = useCallback(() => {
    getMyApplications({ type: TYPE_CODE.supplement })
      .then(res => setSupplementApprovals(res.data ?? []))
      .catch(() => setSupplementApprovals([]));
  }, []);
  useEffect(() => {
    loadSupplements();
  }, [loadSupplements]);

  /** 审批单 → 补卡记录展示模型（payload 由「我的申请」接口一并返回） */
  const supplementRequests = useMemo<SupplementRequest[]>(
    () =>
      supplementApprovals.map(a => {
        const full = String(a.payload?.date ?? '');
        const inTime = a.payload?.clockInTime ? String(a.payload.clockInTime) : '';
        const outTime = a.payload?.clockOutTime ? String(a.payload.clockOutTime) : '';
        return {
          fullDate: full,
          date: full.slice(5).replace('-', '/'),
          slot: a.subType ?? SUPPLEMENT_CLOCK_IN,
          // 上下班皆漏时两个时间都要展示
          time: [inTime, outTime].filter(Boolean).join(' - '),
          reason: String(a.payload?.reason ?? ''),
          statusCode: a.statusCode,
          statusText: a.status ?? ''
        };
      }),
    [supplementApprovals]
  );

  // 本月统计（当月考勤，后端已按年月过滤，直接聚合）
  const monthStats = useMemo(() => {
    const attend = curRaw.filter(r => Boolean(r.clockIn)).length;
    const late = curRaw.filter(r => r.statusCode === 2).length;
    const absent = curRaw.filter(r => r.statusCode === 4).length;
    const hours = curRaw.reduce((sum, r) => sum + (r.hoursWorked ?? 0), 0);
    return { attend, late, absent, hours: Math.round(hours * 10) / 10 };
  }, [curRaw]);

  // 迟到/早退确认弹框
  const [confirm, setConfirm] = useState<{ msg: string; open: boolean }>({ open: false, msg: '' });

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

  /** 预检当前定位所处范围（不落库），用于按钮变色与远端确认；返回结果与坐标供打卡复用 */
  const refreshRange = useCallback(async (): Promise<{
    coords: { accuracy?: number; lat?: number; lng?: number };
    data: ClockPrecheck | null;
    geoErr?: string;
  }> => {
    setRangeLoading(true);
    const { accuracy, error: geoErr, lat, lng } = await getCoords();
    setAccuracyM(accuracy);
    try {
      const res = await precheckClock({ lat, lng, accuracy });
      setRange(res.data);
      return { data: res.data, coords: { lat, lng, accuracy }, geoErr };
    } catch {
      setRange(null);
      return { data: null, coords: { lat, lng, accuracy }, geoErr };
    } finally {
      setRangeLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 进入打卡页时预检一次（决定椭圆颜色与提示）
  useEffect(() => {
    refreshRange();
  }, [refreshRange]);

  /** 实际执行打卡（coords 由预检复用，避免二次定位） */
  const doPunch = async (coords?: { accuracy?: number; lat?: number; lng?: number }, geoErr?: string) => {
    setShowCameraPrompt(false);
    setPunching(true);
    const { accuracy, error, lat, lng } = coords
      ? { lat: coords.lat, lng: coords.lng, accuracy: coords.accuracy, error: geoErr }
      : await getCoords();
    try {
      const res = await punchClock({ lat, lng, accuracy, photo: capturedPhoto ?? undefined });
      setToday(res.data);
      toast.success(res.data.message || '打卡成功');
      setCapturedPhoto(null); // 打卡成功后清空照片，下次打卡需重新拍
      refreshRange();
    } catch (err: any) {
      // 打卡失败时，若有定位失败原因，优先提示原因（比后端"無法獲取定位"更具体）
      toast.error(error || err.message || '打卡失敗');
    } finally {
      setPunching(false);
    }
  };

  const handleClock = async () => {
    if (!today || (!today.canClockIn && !today.canClockOut)) return;
    if (requirePhoto && !capturedPhoto) {
      setShowCameraPrompt(true);
      return;
    }
    // 先做范围预检（拿最新定位）
    const { coords, data, geoErr } = await refreshRange();
    if (data && !data.canClock) {
      // 超范围/无定位且不允许远端 —— 拦截
      toast.error(geoErr || data.message || '目前無法打卡');
      return;
    }
    if (data && data.remote) {
      // 不在范围内但允许远端 —— 二次确认
      setRemoteConfirm({ open: true, coords });
      return;
    }
    const warn = checkAbnormal();
    if (warn) {
      setConfirm({ open: true, msg: warn });
      return;
    }
    doPunch(coords, geoErr);
  };

  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.addEventListener('load', ev => {
      const src = ev.target?.result as string;
      // 压缩后再存：降到最长边1080、JPEG 0.7，避免相机原图(数MB)超出后端POST上限
      compressImage(src)
        .then(compressed => {
          setCapturedPhoto(compressed);
          setShowCameraPrompt(false);
        })
        .catch(() => {
          setCapturedPhoto(src);
          setShowCameraPrompt(false);
        });
    });
    reader.readAsDataURL(file);
  };

  const handleRetakePhoto = () => {
    setCapturedPhoto(null);
    fileInputRef.current?.click();
  };

  // 補卡表單與「新增申請」共用一套，此處只帶著日期跳過去
  const goSupplementForm = (record: AttendanceRecord) => {
    let slot = SUPPLEMENT_CLOCK_OUT;
    if (record.clockIn === '--:--' && record.clockOut === '--:--') {
      slot = SUPPLEMENT_BOTH;
    } else if (record.clockIn === '--:--') {
      slot = SUPPLEMENT_CLOCK_IN;
    }
    navigate('/applications', {
      state: {
        openForm: 'supplement',
        initial: { supplementDate: record.fullDate, supplementSlot: slot }
      }
    });
  };

  const absentRecords = curRecords.filter(r => r.status === 'absent');

  // ── Absent records view ──
  if (viewMode === 'absent') {
    return (
      <MobileLayout title="缺勤記錄">
        <div className="px-5 pt-4">
          <button
            onClick={() => setViewMode('clock')}
            className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4 active:opacity-70"
          >
            <ArrowLeft className="w-4 h-4" />
            返回打卡
          </button>

          <div className="bg-muted/50 rounded-xl p-3 mb-4 flex items-center gap-2">
            <XCircle className="w-4 h-4 text-destructive" />
            <span className="text-xs text-muted-foreground">
              共 {absentRecords.length} 筆缺勤記錄，點擊「補卡」可提交補卡申請
            </span>
          </div>

          {absentRecords.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">暫無缺勤記錄 🎉</div>
          ) : (
            <div className="space-y-3 mb-6">
              {absentRecords.map((record, i) => {
                // 只認仍在審或已通過的單；已駁回/撤回視同未申請，可重新提交
                const applied = supplementRequests.find(
                  r => r.fullDate === record.fullDate && [1, 2, 3].includes(r.statusCode)
                );
                return (
                  <div key={i} className="bg-card rounded-xl border border-border p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">
                          {record.date} 週{record.weekday}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${getStatusStyle(record.status)}`}
                      >
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
                      <div
                        className={`flex items-center justify-between p-2.5 rounded-lg ${
                          applied.statusCode === 3 ? 'bg-success/10' : 'bg-warning/10'
                        }`}
                      >
                        <span className="text-xs text-muted-foreground">
                          已申請{applied.slot} · {applied.time}
                        </span>
                        <span
                          className={`text-[10px] font-medium ${
                            applied.statusCode === 3 ? 'text-success' : 'text-warning'
                          }`}
                        >
                          {applied.statusText}
                        </span>
                      </div>
                    ) : (
                      <Button size="sm" className="w-full h-8 gap-1 text-xs" onClick={() => goSupplementForm(record)}>
                        <FileEdit className="w-3.5 h-3.5" />
                        申請補卡
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
  if (viewMode === 'supplement') {
    return (
      <MobileLayout title="補卡記錄">
        <div className="px-5 pt-4">
          <button
            onClick={() => setViewMode('clock')}
            className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4 active:opacity-70"
          >
            <ArrowLeft className="w-4 h-4" />
            返回打卡
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
                      <span className="text-xs text-muted-foreground">{req.slot}</span>
                    </div>
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${SUPPLEMENT_STATUS_STYLE[req.statusCode] ?? 'text-muted-foreground bg-muted'}`}
                    >
                      {req.statusText}
                    </span>
                  </div>
                  <Separator className="my-2" />
                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span>補卡時間</span>
                      <span className="text-foreground font-medium">{req.time}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>原因</span>
                      <span className="text-foreground">{req.reason}</span>
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
  if (viewMode === 'history') {
    const normalCount = historyRecords.filter(r => r.status === 'normal').length;
    const lateCount = historyRecords.filter(r => r.status === 'late' || r.status === 'early').length;
    const absentCount = historyRecords.filter(r => r.status === 'absent').length;
    const leaveCount = historyRecords.filter(r => r.status === 'leave').length;

    const isCurMonth = histY === curY && histM === curM;
    const goPrevMonth = () => {
      let m = histM - 1;
      let y = histY;
      if (m < 1) {
        m = 12;
        y -= 1;
      }
      setHistY(y);
      setHistM(m);
    };
    const goNextMonth = () => {
      if (isCurMonth) return;
      let m = histM + 1;
      let y = histY;
      if (m > 12) {
        m = 1;
        y += 1;
      }
      setHistY(y);
      setHistM(m);
    };
    const onMonthInput = (e: React.ChangeEvent<HTMLInputElement>) => {
      const [y, m] = e.target.value.split('-').map(Number);
      if (!y || !m) return;
      // 不允许选到未来月
      if (y > curY || (y === curY && m > curM)) {
        setHistY(curY);
        setHistM(curM);
      } else {
        setHistY(y);
        setHistM(m);
      }
    };

    return (
      <MobileLayout title="考勤記錄">
        <div className="px-5 pt-4">
          <button
            onClick={() => setViewMode('clock')}
            className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4 active:opacity-70"
          >
            <ArrowLeft className="w-4 h-4" />
            返回打卡
          </button>

          {/* Month switcher */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <button onClick={goPrevMonth} className="p-2 rounded-lg active:bg-muted">
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
            <button
              onClick={() => monthInputRef.current?.showPicker?.()}
              className="text-sm font-semibold text-foreground min-w-[110px] text-center active:opacity-70"
            >
              {histY} 年 {histM} 月
            </button>
            <button
              onClick={goNextMonth}
              disabled={isCurMonth}
              className="p-2 rounded-lg active:bg-muted disabled:opacity-30"
            >
              <ChevronRight className="w-5 h-5 text-foreground" />
            </button>
            <input
              ref={monthInputRef}
              type="month"
              value={`${histY}-${String(histM).padStart(2, '0')}`}
              max={`${curY}-${String(curM).padStart(2, '0')}`}
              onChange={onMonthInput}
              className="sr-only"
              tabIndex={-1}
              aria-hidden
            />
          </div>

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
          {histLoading && (
            <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              載入中...
            </div>
          )}
          {!histLoading && historyRecords.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm mb-6">
              {histY} 年 {histM} 月暫無考勤記錄
            </div>
          )}
          {!histLoading && historyRecords.length > 0 && (
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
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${getStatusStyle(record.status)}`}
                    >
                      {record.statusLabel}
                    </span>
                    {record.status === 'absent' && (
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
          )}
        </div>
      </MobileLayout>
    );
  }

  // ── Clock view ──
  // 范围视觉：warn=可远端(黄) / block=超范围或无定位(红) / ok=在范围内或未设点(蓝)
  let rangeTone: 'block' | 'loading' | 'ok' | 'warn' = 'ok';
  if (rangeLoading && !range) {
    rangeTone = 'loading';
  } else if (range?.status === 'remote') {
    rangeTone = 'warn';
  } else if (range?.status === 'out_of_range' || range?.status === 'no_gps') {
    rangeTone = 'block';
  }
  let rangeChip: { cls: string; text: string } | null = null;
  if (rangeTone === 'loading') {
    rangeChip = { text: '定位中…', cls: 'text-muted-foreground bg-muted' };
  } else if (range?.status === 'in_range') {
    rangeChip = { text: '已在打卡範圍內', cls: 'text-success bg-success/10' };
  } else if (range?.status === 'remote') {
    rangeChip = { text: '不在範圍內 · 可遠端打卡', cls: 'text-warning bg-warning/10' };
  } else if (range?.status === 'out_of_range') {
    rangeChip = { text: '不在任何打卡範圍內', cls: 'text-destructive bg-destructive/10' };
  } else if (range?.status === 'no_gps') {
    rangeChip = { text: '無法取得定位', cls: 'text-destructive bg-destructive/10' };
  }
  let locationLabel = '定位打卡';
  if (range?.locationName) {
    locationLabel = range.locationName;
  } else if (today?.locationName) {
    locationLabel = today.locationName;
  } else if (today?.scheduleName) {
    locationLabel = `班次：${today.scheduleName}`;
  }

  const photoReady = !requirePhoto || capturedPhoto;
  let ringCls =
    'bg-gradient-to-br from-primary to-blue-600 dark:from-[hsl(220,30%,25%)] dark:to-[hsl(215,25%,30%)] shadow-[0_0_30px_rgba(59,130,246,0.3)] dark:shadow-[0_0_30px_rgba(59,130,246,0.15)]';
  if (clockedOut) {
    ringCls =
      'bg-gradient-to-br from-emerald-400 to-teal-500 dark:from-emerald-600 dark:to-teal-700 shadow-[0_0_30px_rgba(16,185,129,0.3)] dark:shadow-[0_0_30px_rgba(16,185,129,0.15)]';
  } else if (!photoReady) {
    ringCls = 'bg-gradient-to-br from-muted-foreground/40 to-muted-foreground/30 shadow-none';
  } else if (rangeTone === 'warn') {
    ringCls =
      'bg-gradient-to-br from-amber-400 to-orange-500 dark:from-amber-600 dark:to-orange-700 shadow-[0_0_30px_rgba(245,158,11,0.3)] dark:shadow-[0_0_30px_rgba(245,158,11,0.15)]';
  } else if (rangeTone === 'block') {
    ringCls =
      'bg-gradient-to-br from-rose-400 to-red-500 dark:from-rose-600 dark:to-red-700 shadow-[0_0_30px_rgba(244,63,94,0.3)] dark:shadow-[0_0_30px_rgba(244,63,94,0.15)]';
  }
  let btnCls =
    'bg-gradient-to-br from-primary to-blue-600 dark:from-[hsl(220,30%,22%)] dark:to-[hsl(215,25%,28%)] text-primary-foreground hover:opacity-90';
  if (clockedOut) {
    btnCls = 'bg-gradient-to-br from-emerald-500 to-teal-600 dark:from-emerald-700 dark:to-teal-800 text-white';
  } else if (!photoReady) {
    btnCls = 'bg-gradient-to-br from-muted to-muted text-muted-foreground cursor-not-allowed';
  } else if (rangeTone === 'warn') {
    btnCls = 'bg-gradient-to-br from-amber-500 to-orange-600 dark:from-amber-700 dark:to-orange-800 text-white hover:opacity-90';
  } else if (rangeTone === 'block') {
    btnCls = 'bg-gradient-to-br from-rose-500 to-red-600 dark:from-rose-700 dark:to-red-800 text-white hover:opacity-90';
  }
  let clockLabel = '✓ 已完成打卡';
  if (punching) {
    clockLabel = '打卡中...';
  } else if (requirePhoto && !capturedPhoto) {
    clockLabel = '📷 請先拍照';
  } else if (!clockedOut && rangeTone === 'warn') {
    clockLabel = '遠端打卡';
  } else if (!clockedOut && rangeTone === 'block') {
    clockLabel = '不在範圍內';
  } else if (today?.canClockIn) {
    clockLabel = '點擊上班打卡';
  } else if (today?.canClockOut) {
    clockLabel = '點擊下班打卡';
  }
  return (
    <MobileLayout title="打卡">
      <div className="px-5 pt-6">
        {/* Location info */}
        <div className="flex items-center gap-2 justify-center text-muted-foreground mb-2">
          <MapPin className="w-4 h-4" />
          <span className="text-sm">
            {locationLabel}
          </span>
          <Wifi className="w-4 h-4 text-success" />
        </div>

        {/* Range status chip */}
        {rangeChip && (
          <div className="flex justify-center mb-4">
            <span className={`text-[11px] font-medium px-3 py-1 rounded-full ${rangeChip.cls}`}>
              {rangeChip.text}
              {accuracyM ? ` · 定位精度±${Math.round(accuracyM)}m` : ''}
            </span>
          </div>
        )}

        {/* Clock mode toggle */}
        <div className="flex items-center justify-center gap-1 mb-6">
          <button
            onClick={() => {
              setRequirePhoto(false);
              setCapturedPhoto(null);
            }}
            className={`px-4 py-1.5 rounded-l-full text-xs font-medium transition-colors ${
              !requirePhoto
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            普通打卡
          </button>
          <button
            onClick={() => setRequirePhoto(true)}
            className={`px-4 py-1.5 rounded-r-full text-xs font-medium transition-colors flex items-center gap-1 ${
              requirePhoto
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            <Camera className="w-3 h-3" />
            拍照打卡
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
                  <Camera className="w-4 h-4" />
                  拍照打卡
                </DialogTitle>
                <DialogDescription>請先拍照驗證身份，方可完成打卡</DialogDescription>
              </DialogHeader>
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
                  <Camera className="w-10 h-10 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground text-center">點擊下方按鈕開啟相機拍照</p>
                <Button className="w-full gap-2" onClick={() => fileInputRef.current?.click()}>
                  <Camera className="w-4 h-4" />
                  開啟相機
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* 远端打卡确认弹框 */}
        <Dialog open={remoteConfirm.open} onOpenChange={v => setRemoteConfirm(c => ({ ...c, open: v }))}>
          <DialogContent className="max-w-[320px] rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-base flex items-center gap-2">
                <MapPin className="w-4 h-4 text-warning" />
                遠端打卡確認
              </DialogTitle>
              <DialogDescription className="text-sm leading-relaxed pt-1">
                您目前不在打卡範圍內，本次將記為「遠端打卡」，HR 可見。確定要遠端打卡嗎？
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button variant="outline" size="sm" onClick={() => setRemoteConfirm({ open: false, coords: {} })}>
                取消
              </Button>
              <Button
                size="sm"
                className="bg-warning text-warning-foreground hover:bg-warning/90"
                onClick={() => {
                  const c = remoteConfirm.coords;
                  setRemoteConfirm({ open: false, coords: {} });
                  doPunch(c);
                }}
              >
                確定遠端打卡
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 迟到/早退确认弹框 */}
        <Dialog open={confirm.open} onOpenChange={v => setConfirm(c => ({ ...c, open: v }))}>
          <DialogContent className="max-w-[320px] rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-base flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-warning" />
                打卡提示
              </DialogTitle>
              <DialogDescription className="text-sm leading-relaxed pt-1">{confirm.msg}</DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button variant="outline" size="sm" onClick={() => setConfirm({ open: false, msg: '' })}>
                取消
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setConfirm({ open: false, msg: '' });
                  doPunch();
                }}
              >
                確定打卡
              </Button>
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
                    <ImageIcon className="w-3 h-3" />
                    照片已就緒
                  </span>
                  {!clockedOut && (
                    <button
                      onClick={handleRetakePhoto}
                      className="text-xs text-muted-foreground flex items-center gap-1 hover:text-foreground transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" />
                      重拍
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
                {currentTime.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
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
                <div className={`w-2 h-2 rounded-full ${today?.clockIn ? 'bg-success' : 'bg-muted-foreground/30'}`} />
                <span className="text-sm text-foreground">上班打卡</span>
                {today?.lateMinutes ? (
                  <span className="text-[10px] text-warning">遲到{formatMins(today.lateMinutes)}</span>
                ) : null}
              </div>
              <span className="text-sm font-medium text-foreground">{today?.clockIn ?? '未打卡'}</span>
            </div>
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${today?.clockOut ? 'bg-success' : 'bg-muted-foreground/30'}`} />
                <span className="text-sm text-foreground">下班打卡</span>
                {today?.earlyMinutes ? (
                  <span className="text-[10px] text-warning">早退{formatMins(today.earlyMinutes)}</span>
                ) : null}
              </div>
              <span className="text-sm font-medium text-foreground">{today?.clockOut ?? '未打卡'}</span>
            </div>
          </div>
        </div>

        {/* Monthly summary */}
        <div className="mt-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">本月統計</h3>
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: '出勤', value: `${monthStats.attend}天`, color: 'text-success', action: undefined },
              { label: '遲到', value: `${monthStats.late}次`, color: 'text-warning', action: undefined },
              {
                label: '缺勤',
                value: `${monthStats.absent}次`,
                color: 'text-destructive',
                action: () => setViewMode('absent')
              },
              { label: '工時', value: `${monthStats.hours}h`, color: 'text-info', action: undefined }
            ].map(stat => (
              <button
                key={stat.label}
                onClick={stat.action}
                className={`bg-card rounded-xl border border-border p-3 text-center ${stat.action ? 'active:scale-[0.97] transition-transform' : ''}`}
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
            onClick={() => setViewMode('history')}
            className="bg-card rounded-xl border border-border p-3.5 flex items-center justify-center gap-2 text-sm font-medium text-primary active:scale-[0.98] transition-transform"
          >
            <History className="w-4 h-4" />
            考勤記錄
          </button>
          <button
            onClick={() => setViewMode('supplement')}
            className="bg-card rounded-xl border border-border p-3.5 flex items-center justify-center gap-2 text-sm font-medium text-primary active:scale-[0.98] transition-transform"
          >
            <FileEdit className="w-4 h-4" />
            補卡記錄
          </button>
        </div>
      </div>
    </MobileLayout>
  );
};

export default ClockIn;
