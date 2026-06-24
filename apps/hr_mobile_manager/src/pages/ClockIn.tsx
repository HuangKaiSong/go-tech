import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  Camera,
  CheckCircle2,
  Clock,
  FileEdit,
  History,
  ImageIcon,
  MapPin,
  RotateCcw,
  Send,
  Wifi,
  XCircle
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

type AttendanceRecord = {
  clockIn: string;
  clockOut: string;
  date: string;
  hours: string;
  status: 'absent' | 'early' | 'late' | 'leave' | 'normal';
  statusLabel: string;
  weekday: string;
};

const historyRecords: AttendanceRecord[] = [
  {
    date: '03/10',
    weekday: '一',
    clockIn: '09:02',
    clockOut: '--:--',
    status: 'normal',
    statusLabel: '正常',
    hours: '--'
  },
  {
    date: '03/07',
    weekday: '五',
    clockIn: '08:55',
    clockOut: '18:10',
    status: 'normal',
    statusLabel: '正常',
    hours: '9h15m'
  },
  {
    date: '03/06',
    weekday: '四',
    clockIn: '09:15',
    clockOut: '18:30',
    status: 'late',
    statusLabel: '遲到',
    hours: '9h15m'
  },
  {
    date: '03/05',
    weekday: '三',
    clockIn: '08:50',
    clockOut: '18:05',
    status: 'normal',
    statusLabel: '正常',
    hours: '9h15m'
  },
  {
    date: '03/04',
    weekday: '二',
    clockIn: '08:58',
    clockOut: '18:00',
    status: 'normal',
    statusLabel: '正常',
    hours: '9h02m'
  },
  {
    date: '03/03',
    weekday: '一',
    clockIn: '09:00',
    clockOut: '20:30',
    status: 'normal',
    statusLabel: '加班',
    hours: '11h30m'
  },
  {
    date: '02/28',
    weekday: '五',
    clockIn: '08:45',
    clockOut: '18:00',
    status: 'normal',
    statusLabel: '正常',
    hours: '9h15m'
  },
  {
    date: '02/27',
    weekday: '四',
    clockIn: '--:--',
    clockOut: '--:--',
    status: 'leave',
    statusLabel: '請假',
    hours: '--'
  },
  {
    date: '02/26',
    weekday: '三',
    clockIn: '09:05',
    clockOut: '17:30',
    status: 'early',
    statusLabel: '早退',
    hours: '8h25m'
  },
  {
    date: '02/25',
    weekday: '二',
    clockIn: '08:50',
    clockOut: '18:10',
    status: 'normal',
    statusLabel: '正常',
    hours: '9h20m'
  },
  {
    date: '02/24',
    weekday: '一',
    clockIn: '08:55',
    clockOut: '18:00',
    status: 'normal',
    statusLabel: '正常',
    hours: '9h05m'
  },
  {
    date: '02/21',
    weekday: '五',
    clockIn: '--:--',
    clockOut: '--:--',
    status: 'absent',
    statusLabel: '缺勤',
    hours: '--'
  },
  {
    date: '02/20',
    weekday: '四',
    clockIn: '09:10',
    clockOut: '--:--',
    status: 'absent',
    statusLabel: '漏打卡',
    hours: '--'
  }
];

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
  date: string;
  reason: string;
  status: 'approved' | 'pending' | 'rejected';
  time: string;
  type: 'clockIn' | 'clockOut';
};

type ViewMode = 'absent' | 'clock' | 'history' | 'supplement';

const getApplyBg = (status: string) => {
  if (status === 'approved') return 'bg-success/10';
  if (status === 'rejected') return 'bg-destructive/10';
  return 'bg-warning/10';
};

const getApplyText = (status: string) => {
  if (status === 'approved') return 'text-success';
  if (status === 'rejected') return 'text-destructive';
  return 'text-warning';
};

const getReqBadgeClass = (status: string) => {
  if (status === 'approved') return 'text-success bg-success/10';
  if (status === 'rejected') return 'text-destructive bg-destructive/10';
  return 'text-warning bg-warning/10';
};

const getApplyStatusLabel = (status: string) => {
  if (status === 'approved') return '已通過';
  if (status === 'rejected') return '已駁回';
  return '審核中';
};

const getClockRingClass = (clockedOut: boolean, requirePhoto: boolean, capturedPhoto: string | null) => {
  if (clockedOut)
    return 'bg-gradient-to-br from-emerald-400 to-teal-500 dark:from-emerald-600 dark:to-teal-700 shadow-[0_0_30px_rgba(16,185,129,0.3)] dark:shadow-[0_0_30px_rgba(16,185,129,0.15)]';
  if (!requirePhoto || capturedPhoto)
    return 'bg-gradient-to-br from-primary to-blue-600 dark:from-[hsl(220,30%,25%)] dark:to-[hsl(215,25%,30%)] shadow-[0_0_30px_rgba(59,130,246,0.3)] dark:shadow-[0_0_30px_rgba(59,130,246,0.15)]';
  return 'bg-gradient-to-br from-muted-foreground/40 to-muted-foreground/30 shadow-none';
};

const getClockButtonClass = (clockedOut: boolean, requirePhoto: boolean, capturedPhoto: string | null) => {
  if (clockedOut)
    return 'bg-gradient-to-br from-emerald-500 to-teal-600 dark:from-emerald-700 dark:to-teal-800 text-white';
  if (!requirePhoto || capturedPhoto)
    return 'bg-gradient-to-br from-primary to-blue-600 dark:from-[hsl(220,30%,22%)] dark:to-[hsl(215,25%,28%)] text-primary-foreground hover:opacity-90';
  return 'bg-gradient-to-br from-muted to-muted text-muted-foreground cursor-not-allowed';
};

const getClockButtonText = (clockedOut: boolean, requirePhoto: boolean, capturedPhoto: string | null) => {
  if (clockedOut) return '✓ 已完成打卡';
  if (requirePhoto && !capturedPhoto) return '📷 請先拍照';
  return '點擊下班打卡';
};

const ClockIn = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [_clockedIn] = useState(true);
  const [clockedOut, setClockedOut] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('clock');
  const [showSupplementDialog, setShowSupplementDialog] = useState(false);
  const [supplementDate, setSupplementDate] = useState('');
  const [supplementType, setSupplementType] = useState<'clockIn' | 'clockOut'>('clockIn');
  const [supplementTime, setSupplementTime] = useState('');
  const [supplementReason, setSupplementReason] = useState('');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [showCameraPrompt, setShowCameraPrompt] = useState(false);
  const [requirePhoto, setRequirePhoto] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [supplementRequests, setSupplementRequests] = useState<SupplementRequest[]>([
    { date: '02/20', type: 'clockOut', time: '18:05', reason: '忘記下班打卡', status: 'approved' },
    { date: '02/21', type: 'clockIn', time: '09:00', reason: '系統故障無法打卡', status: 'pending' }
  ]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleClock = () => {
    if (clockedOut) return;
    if (requirePhoto && !capturedPhoto) {
      setShowCameraPrompt(true);
      return;
    }
    setClockedOut(true);
    setShowCameraPrompt(false);
  };

  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.addEventListener('load', ev => {
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

  const handleSubmitSupplement = () => {
    if (!supplementDate || !supplementTime || !supplementReason.trim()) return;
    setSupplementRequests(prev => [
      {
        date: supplementDate,
        type: supplementType,
        time: supplementTime,
        reason: supplementReason.trim(),
        status: 'pending'
      },
      ...prev
    ]);
    setShowSupplementDialog(false);
    setSupplementDate('');
    setSupplementTime('');
    setSupplementReason('');
  };

  // Get absent records that haven't been applied for yet
  const absentRecords = historyRecords.filter(r => r.status === 'absent');
  const pendingDates = supplementRequests.map(r => r.date);
  const availableAbsentRecords = absentRecords.filter(r => !pendingDates.includes(r.date));

  const selectAbsentRecord = (record: AttendanceRecord) => {
    setSupplementDate(record.date);
    setSupplementType(record.clockIn === '--:--' ? 'clockIn' : 'clockOut');
  };

  const supplementDialog = (
    <Dialog open={showSupplementDialog} onOpenChange={setShowSupplementDialog}>
      <DialogContent className="max-w-[340px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-base">補卡申請</DialogTitle>
          <DialogDescription>請填寫補卡資訊，提交後將由主管審核</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {/* Quick select absent records */}
          {availableAbsentRecords.length > 0 && (
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">快速選擇缺卡記錄</label>
              <div className="space-y-1.5">
                {availableAbsentRecords.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => selectAbsentRecord(r)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-lg border text-left text-sm transition-colors ${
                      supplementDate === r.date
                        ? 'border-primary bg-primary/5 text-foreground'
                        : 'border-border bg-card text-muted-foreground hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-3.5 h-3.5" />
                      <span className="font-medium">
                        {r.date} 週{r.weekday}
                      </span>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${getStatusStyle(r.status)}`}>
                      {r.statusLabel}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
          <Separator />
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">補卡日期</label>
            <Input
              value={supplementDate}
              onChange={e => setSupplementDate(e.target.value)}
              placeholder="例：03/10"
              className="h-9 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">補卡類型</label>
            <div className="flex gap-2">
              <button
                onClick={() => setSupplementType('clockIn')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${supplementType === 'clockIn' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
              >
                上班打卡
              </button>
              <button
                onClick={() => setSupplementType('clockOut')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${supplementType === 'clockOut' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
              >
                下班打卡
              </button>
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">實際打卡時間</label>
            <Input
              value={supplementTime}
              onChange={e => setSupplementTime(e.target.value)}
              placeholder="例：09:00"
              className="h-9 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">補卡原因</label>
            <Input
              value={supplementReason}
              onChange={e => setSupplementReason(e.target.value)}
              placeholder="請輸入補卡原因..."
              className="h-9 text-sm"
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowSupplementDialog(false)}>
            取消
          </Button>
          <Button
            size="sm"
            className="gap-1"
            onClick={handleSubmitSupplement}
            disabled={!supplementDate || !supplementTime || !supplementReason.trim()}
          >
            <Send className="w-3.5 h-3.5" />
            提交申請
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

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
                const applied = supplementRequests.find(r => r.date === record.date);
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
                        className={`flex items-center justify-between p-2.5 rounded-lg ${getApplyBg(applied.status)}`}
                      >
                        <span className="text-xs text-muted-foreground">
                          已申請{applied.type === 'clockIn' ? '上班' : '下班'}補卡 · {applied.time}
                        </span>
                        <span className={`text-[10px] font-medium ${getApplyText(applied.status)}`}>
                          {getApplyStatusLabel(applied.status)}
                        </span>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        className="w-full h-8 gap-1 text-xs"
                        onClick={() => {
                          selectAbsentRecord(record);
                          setSupplementTime('');
                          setSupplementReason('');
                          setShowSupplementDialog(true);
                        }}
                      >
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
        {supplementDialog}
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
                <div key={i} className="bg-card rounded-xl border border-border p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">{req.date}</span>
                      <span className="text-xs text-muted-foreground">
                        {req.type === 'clockIn' ? '上班補卡' : '下班補卡'}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${getReqBadgeClass(req.status)}`}
                    >
                      {getApplyStatusLabel(req.status)}
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
                  {record.status === 'absent' && (
                    <button
                      onClick={() => {
                        selectAbsentRecord(record);
                        setSupplementTime('');
                        setSupplementReason('');
                        setShowSupplementDialog(true);
                      }}
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
        {supplementDialog}
      </MobileLayout>
    );
  }

  // ── Clock view ──
  return (
    <MobileLayout title="打卡">
      <div className="px-5 pt-6">
        {/* Location info */}
        <div className="flex items-center gap-2 justify-center text-muted-foreground mb-4">
          <MapPin className="w-4 h-4" />
          <span className="text-sm">台北市信義區 · 公司Wi-Fi已連接</span>
          <Wifi className="w-4 h-4 text-success" />
        </div>

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
          <div className={`rounded-full p-1 ${getClockRingClass(clockedOut, requirePhoto, capturedPhoto)}`}>
            <button
              onClick={handleClock}
              disabled={clockedOut}
              className={`w-44 h-44 rounded-full flex flex-col items-center justify-center transition-all active:scale-95 ${getClockButtonClass(
                clockedOut,
                requirePhoto,
                capturedPhoto
              )}`}
            >
              <Clock className="w-8 h-8 mb-2" />
              <span className="text-2xl font-bold">
                {currentTime.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span className="text-sm mt-1 opacity-90">
                {getClockButtonText(clockedOut, requirePhoto, capturedPhoto)}
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
                <div className="w-2 h-2 rounded-full bg-success" />
                <span className="text-sm text-foreground">上班打卡</span>
              </div>
              <span className="text-sm font-medium text-foreground">09:02</span>
            </div>
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${clockedOut ? 'bg-success' : 'bg-muted-foreground/30'}`} />
                <span className="text-sm text-foreground">下班打卡</span>
              </div>
              <span className="text-sm font-medium text-foreground">
                {clockedOut
                  ? currentTime.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })
                  : '未打卡'}
              </span>
            </div>
          </div>
        </div>

        {/* Monthly summary */}
        <div className="mt-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">本月統計</h3>
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: '出勤', value: '18天', color: 'text-success', action: undefined },
              { label: '遲到', value: '1次', color: 'text-warning', action: undefined },
              { label: '缺勤', value: '2次', color: 'text-destructive', action: () => setViewMode('absent') },
              { label: '加班', value: '12小時', color: 'text-info', action: undefined }
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
