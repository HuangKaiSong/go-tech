import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  CircleCheck,
  Clock,
  FileText,
  GraduationCap,
  Loader2,
  Lock,
  PlayCircle
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  type MyTraining,
  type MyTrainingModule,
  getMyTrainingDetail,
  getMyTrainings,
  toggleMyModule
} from '@/api/training';
import MobileLayout from '@/components/MobileLayout';
import LearningPage from '@/components/training/LearningPage';
import { Progress } from '@/components/ui/progress';

type ViewMode = 'detail' | 'learning' | 'list';

const statusCfg = (pStatus: number) => {
  switch (pStatus) {
    case 2:
      return {
        label: '已完成',
        color: 'text-[hsl(var(--success))]',
        bg: 'bg-[hsl(var(--success))]/10',
        icon: CheckCircle2
      };
    case 1:
      return { label: '進行中', color: 'text-primary', bg: 'bg-primary/10', icon: Clock };
    case 3:
      return { label: '未通過', color: 'text-destructive', bg: 'bg-destructive/10', icon: Lock };
    default:
      return { label: '未開始', color: 'text-muted-foreground', bg: 'bg-muted', icon: BookOpen };
  }
};

const Training = () => {
  const queryClient = useQueryClient();
  const [view, setView] = useState<ViewMode>('list');
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [learningModule, setLearningModule] = useState<MyTrainingModule | null>(null);
  const [learningIndex, setLearningIndex] = useState(0);

  const { data: myTrainings = [], isLoading } = useQuery({
    queryKey: ['my-trainings'],
    queryFn: async () => (await getMyTrainings()).data ?? []
  });

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ['my-training-detail', selectedPlanId],
    queryFn: async () => (await getMyTrainingDetail(selectedPlanId!)).data,
    enabled: Boolean(selectedPlanId) && (view === 'detail' || view === 'learning')
  });

  const toggleMutation = useMutation({
    mutationFn: toggleMyModule,
    onSuccess: () => {
      toast.success('已標記完成');
      queryClient.invalidateQueries({ queryKey: ['my-training-detail', selectedPlanId] });
      queryClient.invalidateQueries({ queryKey: ['my-trainings'] });
    },
    onError: (e: any) => toast.error(e?.message || '操作失敗')
  });

  const overall = useMemo(() => {
    const total = myTrainings.length;
    const done = myTrainings.filter(t => t.pStatus === 2).length;
    const inProgress = myTrainings.filter(t => t.pStatus === 1).length;
    return { total, done, inProgress, percent: total > 0 ? Math.round((done / total) * 100) : 0 };
  }, [myTrainings]);

  // ===== LEARNING VIEW =====
  if (view === 'learning' && learningModule && detail) {
    return (
      <LearningPage
        module={learningModule}
        moduleIndex={learningIndex}
        courseTitle={detail.summary.planName}
        totalModules={detail.modules.length}
        onComplete={() => {
          toggleMutation.mutate({ planId: learningModule.planId, moduleId: learningModule.id, done: true });
          setView('detail');
        }}
        onBack={() => setView('detail')}
      />
    );
  }

  // ===== DETAIL VIEW =====
  if (view === 'detail' && selectedPlanId) {
    if (detailLoading || !detail) {
      return (
        <MobileLayout title="培訓詳情">
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> 載入中...
          </div>
        </MobileLayout>
      );
    }
    const s = detail.summary;
    const cfg = statusCfg(s.pStatus);
    return (
      <MobileLayout title="培訓詳情">
        <div className="px-5 pt-4 pb-6">
          <button
            onClick={() => {
              setView('list');
              setSelectedPlanId(null);
            }}
            className="flex items-center gap-1 text-sm text-primary mb-4"
          >
            <ArrowLeft className="w-5 h-5" /> 返回
          </button>

          <div className="bg-card rounded-2xl border border-border p-5 mb-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h2 className="text-lg font-bold text-foreground">{s.planName}</h2>
                {s.description && <p className="text-xs text-muted-foreground mt-1">{s.description}</p>}
              </div>
              <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.color}`}>
                {cfg.label}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
              {s.type && (
                <span className="flex items-center gap-1">
                  <BookOpen className="w-4 h-4" />
                  {s.type}
                </span>
              )}
              <span className="flex items-center gap-1">
                <FileText className="w-4 h-4" />
                {detail.modules.length} 個模組
              </span>
              {s.mandatory && <span className="text-destructive">必修</span>}
            </div>
            <div className="flex items-center gap-3">
              <Progress value={s.progress} className="h-2 flex-1" />
              <span className="text-xs font-semibold text-foreground">
                {s.completedModules}/{s.totalModules}
              </span>
            </div>
          </div>

          <h3 className="text-sm font-semibold text-foreground mb-3">課程模組</h3>
          <div className="space-y-2.5">
            {detail.modules.map((mod, i) => (
              <div
                key={mod.id}
                className={`bg-card rounded-xl border p-4 flex items-center gap-3 ${mod.done ? 'border-[hsl(var(--success))]/30' : 'border-border'}`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${mod.done ? 'bg-[hsl(var(--success))]/10' : 'bg-primary/10'}`}
                >
                  {mod.done ? (
                    <CircleCheck className="w-5 h-5 text-[hsl(var(--success))]" />
                  ) : (
                    <PlayCircle className="w-5 h-5 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium ${mod.done ? 'text-muted-foreground line-through' : 'text-foreground'}`}
                  >
                    {mod.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {mod.duration} 分鐘{mod.required ? ' · 必修' : ''}
                  </p>
                </div>
                {mod.done ? (
                  <span className="text-xs text-[hsl(var(--success))] font-medium">✓ 完成</span>
                ) : (
                  <button
                    onClick={() => {
                      setLearningModule(mod);
                      setLearningIndex(i);
                      setView('learning');
                    }}
                    className="text-xs font-medium text-primary-foreground bg-primary px-3 py-1.5 rounded-lg active:scale-95 transition-transform"
                  >
                    開始學習
                  </button>
                )}
              </div>
            ))}
            {detail.modules.length === 0 && (
              <div className="text-center text-sm text-muted-foreground py-8">此培訓尚未添加課程模組</div>
            )}
          </div>
        </div>
      </MobileLayout>
    );
  }

  // ===== LIST VIEW =====
  return (
    <MobileLayout title="培訓中心">
      <div className="px-5 pt-4 pb-6">
        <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-5 mb-5">
          <div className="flex items-center gap-3 mb-3">
            <GraduationCap className="w-8 h-8 text-primary-foreground" />
            <div>
              <h2 className="text-lg font-bold text-primary-foreground">我的培訓進度</h2>
              <p className="text-xs text-primary-foreground/70">
                已完成 {overall.done}/{overall.total} 項培訓
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Progress value={overall.percent} className="h-2.5 flex-1 bg-primary-foreground/20" />
            <span className="text-sm font-bold text-primary-foreground">{overall.percent}%</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: '總培訓', value: overall.total, color: 'text-primary' },
            { label: '已完成', value: overall.done, color: 'text-[hsl(var(--success))]' },
            { label: '進行中', value: overall.inProgress, color: 'text-[hsl(var(--warning))]' }
          ].map(stat => (
            <div key={stat.label} className="bg-card rounded-xl border border-border p-3 text-center">
              <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        <h3 className="text-sm font-semibold text-foreground mb-3">我的培訓</h3>
        {isLoading && (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> 載入中...
          </div>
        )}
        {!isLoading && myTrainings.length === 0 && (
          <div className="text-center text-sm text-muted-foreground py-16">目前沒有分配給您的培訓</div>
        )}
        {!isLoading && myTrainings.length > 0 && (
          <div className="space-y-3">
            {myTrainings.map((t: MyTraining) => {
              const cfg = statusCfg(t.pStatus);
              const StatusIcon = cfg.icon;
              return (
                <button
                  key={t.participantId}
                  onClick={() => {
                    setSelectedPlanId(t.planId);
                    setView('detail');
                  }}
                  className="w-full bg-card rounded-xl border border-border p-4 flex items-center gap-4 text-left active:bg-muted/50 transition-colors"
                >
                  <div className={`w-12 h-12 rounded-xl ${cfg.bg} flex items-center justify-center shrink-0`}>
                    <StatusIcon className={`w-6 h-6 ${cfg.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground truncate">{t.planName}</p>
                      {t.mandatory && <span className="text-[10px] text-destructive shrink-0">必修</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Progress value={t.progress} className="h-1.5 flex-1" />
                      <span className="text-xs text-muted-foreground shrink-0">
                        {t.completedModules}/{t.totalModules}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </MobileLayout>
  );
};

export default Training;
