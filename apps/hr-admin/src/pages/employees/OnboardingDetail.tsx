import {
  AlertCircle,
  ArrowLeft,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  File,
  FileText,
  GraduationCap,
  Loader2,
  Mail,
  MapPin,
  Monitor,
  Paperclip,
  Phone,
  RotateCcw,
  Upload,
  User,
  X
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  deleteTaskAttach,
  getOnboardingById,
  type LifecycleTask,
  type OnboardingDetailData,
  type TaskAttach,
  toggleOnboardingTask,
  uploadTaskAttach
} from '@/api/onboarding';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { salaryTypeLabel } from '@/lib/salaryType';

/** 檔案大小展示：位元組 → KB/MB */
function formatSize(bytes?: number) {
  if (bytes == null) return '';
  return bytes > 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

const categoryIcon: Record<string, any> = {
  文件: FileText,
  薪資: Building2,
  IT: Monitor,
  行政: MapPin,
  培訓: GraduationCap
};

const statusConfig: Record<string, { color: string; dot: string }> = {
  待入職: { color: 'bg-primary/10 text-primary border-primary/20', dot: 'bg-primary' },
  進行中: { color: 'bg-info/10 text-info border-info/20', dot: 'bg-info' },
  資料待補: { color: 'bg-warning/10 text-warning border-warning/20', dot: 'bg-warning' },
  已完成: { color: 'bg-success/10 text-success border-success/20', dot: 'bg-success' },
  已取消: { color: 'bg-muted text-muted-foreground border-muted', dot: 'bg-muted-foreground' }
};

/* ===== Page ===== */
export default function OnboardingDetail() {
  const { obId } = useParams<{ obId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [detail, setDetail] = useState<OnboardingDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  // 正在切換中的任務id（防重複點擊）
  const [togglingId, setTogglingId] = useState<number | null>(null);
  // 附件上傳：當前上傳中的任務id + 隱藏文件選擇器
  const [uploadingTaskId, setUploadingTaskId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadTargetRef = useRef<number | null>(null);

  // silent=true 時靜默刷新（不顯示整頁載入態），避免任務列表卸載重建導致滾動位置丟失
  const fetchDetail = useCallback(
    async (silent = false) => {
      const id = Number(obId);
      if (!obId || Number.isNaN(id)) {
        setError(t('無效的入職單編號'));
        setLoading(false);
        return;
      }
      if (!silent) {
        setLoading(true);
      }
      setError('');
      try {
        const res = await getOnboardingById(id);
        setDetail(res.data);
      } catch (err: any) {
        setError(err.message || t('獲取入職單詳情失敗'));
        if (!silent) {
          setDetail(null);
        }
      } finally {
        setLoading(false);
      }
    },
    [obId]
  );

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleToggle = async (task: LifecycleTask) => {
    if (!detail || togglingId !== null) return;
    // 已完成/已取消的單據後端會攔截，前端先行禁用
    if (detail.statusCode === 4 || detail.statusCode === 5) {
      toast.error(detail.statusCode === 4 ? t('該入職單已完成，任務不可修改') : t('該入職單已取消，任務不可修改'));
      return;
    }
    setTogglingId(task.id);
    try {
      const res = await toggleOnboardingTask(task.id, !task.done);
      if (res.data === 4) {
        toast.success(t('🎉 全部任務已完成，{{name}} 已正式轉為「在職」', { name: detail.employeeName }));
      } else {
        toast.success(
          task.done ? t('已取消完成「{{name}}」', { name: task.name }) : t('已完成「{{name}}」', { name: task.name })
        );
      }
      await fetchDetail(true);
    } catch (err: any) {
      toast.error(err.message || t('操作失敗'));
    } finally {
      setTogglingId(null);
    }
  };

  // 點擊「上傳附件」：記錄目標任務並打開文件選擇器
  const handleUploadClick = (task: LifecycleTask) => {
    if (!detail) return;
    if (detail.statusCode === 4 || detail.statusCode === 5) {
      toast.error(detail.statusCode === 4 ? t('該入職單已完成，附件不可修改') : t('該入職單已取消，附件不可修改'));
      return;
    }
    uploadTargetRef.current = task.id;
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const taskId = uploadTargetRef.current;
    e.target.value = '';
    if (!file || taskId == null) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error(t('檔案大小不能超過 10MB'));
      return;
    }
    setUploadingTaskId(taskId);
    try {
      await uploadTaskAttach(taskId, file);
      toast.success(t('已上傳「{{name}}」', { name: file.name }));
      // 上傳附件後自動勾選對應任務（僅在尚未完成時），省去手動打勾
      const task = detail?.tasks?.find(x => x.id === taskId);
      if (task && !task.done) {
        try {
          const res = await toggleOnboardingTask(taskId, true);
          if (res.data === 4) {
            toast.success(t('🎉 全部任務已完成，{{name}} 已正式轉為「在職」', { name: detail?.employeeName }));
          } else {
            toast.success(t('已完成「{{name}}」', { name: task.name }));
          }
        } catch {
          /* 勾選失敗不阻斷上傳結果 */
        }
      }
      await fetchDetail(true);
    } catch (err: any) {
      toast.error(err.message || t('上傳失敗'));
    } finally {
      setUploadingTaskId(null);
      uploadTargetRef.current = null;
    }
  };

  const handleDeleteAttach = async (attach: TaskAttach) => {
    if (!detail) return;
    if (detail.statusCode === 4 || detail.statusCode === 5) {
      toast.error(t('該入職單已鎖定，附件不可修改'));
      return;
    }
    try {
      await deleteTaskAttach(attach.id);
      toast.success(t('已刪除「{{name}}」', { name: attach.name }));
      await fetchDetail(true);
    } catch (err: any) {
      toast.error(err.message || t('刪除失敗'));
    }
  };

  /* ----- 載入/錯誤態 ----- */
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin mb-3" />
        <p className="text-sm">{t('載入中...')}</p>
      </div>
    );
  }
  if (error || !detail) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
        <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mb-3">
          <AlertCircle className="h-6 w-6 text-destructive" />
        </div>
        <p className="text-lg font-medium">{error || t('找不到此入職記錄')}</p>
        <div className="flex gap-2 mt-3">
          <Button variant="outline" size="sm" onClick={() => fetchDetail()}>
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            {t('重新載入')}
          </Button>
          <Button variant="link" size="sm" onClick={() => navigate('/employees/onboarding')}>
            {t('返回列表')}
          </Button>
        </div>
      </div>
    );
  }

  const tasks = detail.tasks || [];
  const doneCount = tasks.filter(t => t.done).length;
  const progress = tasks.length === 0 ? 0 : Math.round((doneCount / tasks.length) * 100);
  const categories = Array.from(new Set(tasks.map(t => t.category || '其他')));
  const filteredTasks = activeCategory === 'all' ? tasks : tasks.filter(t => (t.category || '其他') === activeCategory);
  const locked = detail.statusCode === 4 || detail.statusCode === 5;

  const sc = statusConfig[detail.status] || statusConfig['待入職'];
  const daysUntil = detail.planDate
    ? Math.ceil((new Date(detail.planDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl bg-card border p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-5">
            <Button variant="ghost" size="icon" className="-ml-2" onClick={() => navigate('/employees/onboarding')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Avatar className="h-16 w-16 text-lg">
              <AvatarFallback className="bg-primary/10 text-primary font-bold">
                {(detail.employeeName || '').slice(-2)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-xl font-bold">{detail.employeeName}</h1>
                <Badge variant="secondary" className={sc.color}>
                  <span className={`inline-block h-1.5 w-1.5 rounded-full mr-1.5 ${sc.dot}`} />
                  {detail.status ? t(detail.status) : '—'}
                </Badge>
                {daysUntil > 0 && detail.statusCode !== 4 && (
                  <span className="text-xs text-muted-foreground bg-muted/60 px-2 py-0.5 rounded">
                    {t('距入職 {{n}} 天', { n: daysUntil })}
                  </span>
                )}
                {detail.actualDate && (
                  <span className="text-xs text-success bg-success/10 px-2 py-0.5 rounded">
                    {t('實際入職 {{date}}', { date: detail.actualDate })}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {detail.department || '—'} · {detail.position || '—'}
              </p>
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Briefcase className="h-3 w-3" />
                  {detail.onboardingNo}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {t('入職 {{date}}', { date: detail.planDate || '—' })}
                </span>
                {detail.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {detail.phone}
                  </span>
                )}
                {detail.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {detail.email}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Left: Info */}
        <div className="w-72 shrink-0 space-y-4">
          {/* Progress */}
          <Card>
            <CardContent className="pt-5 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{t('入職進度')}</p>
                <span className="text-lg font-bold text-primary">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {t('{{done}} / {{total}} 項任務已完成', { done: doneCount, total: tasks.length })}
              </p>
            </CardContent>
          </Card>

          {/* Details */}
          <Card>
            <CardContent className="pt-5 space-y-3">
              <p className="text-sm font-semibold mb-2">{t('入職資訊')}</p>
              <InfoLine label={t('招聘來源')} value={detail.source || '—'} />
              <InfoLine label={t('負責 HR')} value={detail.hrOwnerName || '—'} />
              <InfoLine label={t('直屬主管')} value={detail.managerName || '—'} />
              <InfoLine label={t('入職導師')} value={detail.mentor || t('待分配')} />
              <InfoLine
                label={t('試用期')}
                value={detail.probation != null ? t('{{n}} 個月', { n: detail.probation }) : '—'}
              />
              <InfoLine label={t('薪資類型')} value={detail.salaryType ? t(salaryTypeLabel(detail.salaryType)) : '—'} />
              {detail.remark && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{t('備註')}</p>
                    <p className="text-sm">{detail.remark}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Category nav */}
          <Card>
            <CardContent className="pt-5">
              <p className="text-sm font-semibold mb-3">{t('任務分類')}</p>
              <div className="space-y-1">
                <button
                  onClick={() => setActiveCategory('all')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                    activeCategory === 'all'
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-muted-foreground hover:bg-muted/60'
                  }`}
                >
                  <span>{t('全部')}</span>
                  <span className="text-xs">
                    {doneCount}/{tasks.length}
                  </span>
                </button>
                {categories.map(cat => {
                  const Icon = categoryIcon[cat] || Circle;
                  const catTasks = tasks.filter(t => (t.category || '其他') === cat);
                  const catDone = catTasks.filter(t => t.done).length;
                  return (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                        activeCategory === cat
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'text-muted-foreground hover:bg-muted/60'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Icon className="h-3.5 w-3.5" />
                        {t(cat)}
                      </span>
                      <span className="text-xs">
                        {catDone}/{catTasks.length}
                      </span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Tasks */}
        <div className="flex-1 min-w-0 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">{activeCategory === 'all' ? t('全部任務') : t(activeCategory)}</h2>
            <span className="text-xs text-muted-foreground">
              {filteredTasks.filter(tk => tk.done).length}/{filteredTasks.length} {t('已完成')}
            </span>
          </div>

          {locked && (
            <div className="rounded-lg border bg-muted/40 px-4 py-2.5 text-xs text-muted-foreground flex items-center gap-2">
              <AlertCircle className="h-3.5 w-3.5" />
              {detail.statusCode === 4 ? t('該入職單已完成，任務清單已鎖定') : t('該入職單已取消，任務清單已鎖定')}
            </div>
          )}

          <div className="space-y-2">
            {filteredTasks.map(task => {
              const isOverdue = !task.done && task.dueDate ? new Date(task.dueDate) < new Date() : false;
              return (
                <div
                  key={task.id}
                  className={`group rounded-lg border p-4 transition-colors ${
                    task.done ? 'bg-muted/30 border-border/50' : 'bg-card hover:border-primary/30'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {togglingId === task.id ? (
                      <Loader2 className="h-4 w-4 mt-0.5 animate-spin text-primary" />
                    ) : (
                      <Checkbox
                        checked={task.done}
                        disabled={locked || togglingId !== null}
                        onCheckedChange={() => handleToggle(task)}
                        className="mt-0.5"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-sm font-medium ${task.done ? 'line-through text-muted-foreground' : ''}`}>
                          {t(task.name)}
                        </p>
                        <div className="flex items-center gap-2 shrink-0">
                          {activeCategory === 'all' && task.category && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal">
                              {t(task.category)}
                            </Badge>
                          )}
                          {!locked && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs gap-1 px-2"
                              disabled={uploadingTaskId !== null}
                              onClick={e => {
                                e.stopPropagation();
                                handleUploadClick(task);
                              }}
                            >
                              {uploadingTaskId === task.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Upload className="h-3 w-3" />
                              )}
                              {t('上傳附件')}
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground">
                        {task.dueDate && (
                          <span
                            className={`flex items-center gap-1 ${isOverdue ? 'text-destructive font-medium' : ''}`}
                          >
                            <Clock className="h-3 w-3" />
                            {isOverdue ? t('已逾期 · ') : ''}
                            {task.dueDate}
                          </span>
                        )}
                        {task.assignee && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {task.assignee}
                          </span>
                        )}
                        {task.done && task.doneTime && (
                          <span className="flex items-center gap-1 text-success">
                            <CheckCircle2 className="h-3 w-3" />
                            {task.doneUserName ? `${task.doneUserName} · ` : ''}
                            {task.doneTime}
                          </span>
                        )}
                        {task.attachments && task.attachments.length > 0 && (
                          <span className="flex items-center gap-1 text-primary">
                            <Paperclip className="h-3 w-3" />
                            {t('{{n}} 個附件', { n: task.attachments.length })}
                          </span>
                        )}
                      </div>

                      {/* 附件列表（原始檔名 + 大小 + 上傳人/時間） */}
                      {task.attachments && task.attachments.length > 0 && (
                        <div className="mt-2.5 space-y-1.5">
                          {task.attachments.map(att => (
                            <div
                              key={att.id}
                              className="flex items-center gap-2 bg-muted/40 rounded-md px-2.5 py-1.5 text-xs group/file"
                            >
                              <File className="h-3.5 w-3.5 text-primary shrink-0" />
                              <a
                                href={att.url}
                                target="_blank"
                                rel="noreferrer"
                                onClick={e => e.stopPropagation()}
                                className="font-medium truncate flex-1 hover:text-primary hover:underline"
                              >
                                {att.name}
                              </a>
                              {att.fileSize != null && (
                                <span className="text-muted-foreground shrink-0">{formatSize(att.fileSize)}</span>
                              )}
                              {(att.uploaderName || att.uploadTime) && (
                                <span className="text-muted-foreground shrink-0">
                                  {att.uploaderName ? `${att.uploaderName} · ` : ''}
                                  {att.uploadTime || ''}
                                </span>
                              )}
                              {!locked && (
                                <button
                                  onClick={e => {
                                    e.stopPropagation();
                                    handleDeleteAttach(att);
                                  }}
                                  className="opacity-0 group-hover/file:opacity-100 text-muted-foreground hover:text-destructive transition-opacity shrink-0"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredTasks.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle2 className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm">{t('此分類下暫無任務')}</p>
            </div>
          )}
        </div>
      </div>

      {/* 隱藏文件選擇器（點任務的「上傳附件」觸發） */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
        className="hidden"
        onChange={handleFileSelected}
      />
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
