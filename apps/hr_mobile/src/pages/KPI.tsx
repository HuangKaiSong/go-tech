import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2, ChevronRight, Circle, Loader2, Send, Target } from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  type MyPerfResult,
  type MyPerfTask,
  type PerfTaskStatus,
  getMyPerfResults,
  getMyPerfTasks,
  getPerfTaskDetail,
  submitPerfScore
} from '@/api/performance';
import MobileLayout from '@/components/MobileLayout';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';

type Tab = 'mine' | 'todo';

interface ScoreState {
  comment: string;
  score: number;
}

const statusClass: Record<PerfTaskStatus, string> = {
  0: 'bg-warning/10 text-warning',
  1: 'bg-info/10 text-info',
  2: 'bg-accent/10 text-accent',
  3: 'bg-primary/10 text-primary',
  4: 'bg-success/10 text-success'
};

const emptyBlock = (text: string): ReactNode => (
  <div className="py-16 text-center text-muted-foreground text-sm">
    <Target className="w-8 h-8 mx-auto mb-2 opacity-40" />
    {text}
  </div>
);

function gradeClass(grade: string | null): string {
  if (!grade) return 'text-muted-foreground';
  if (grade.startsWith('A')) return 'text-success';
  if (grade.startsWith('B')) return 'text-primary';
  return 'text-warning';
}

/** 待办列表项 */
function TodoRow({ item, onOpen }: { item: MyPerfTask; onOpen: (id: string) => void }) {
  return (
    <button
      onClick={() => onOpen(item.taskId)}
      className="w-full flex items-center gap-3 px-4 py-3 text-left active:bg-muted/50 transition-colors"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">{item.revieweeName}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{item.reviewerTypeText}</span>
          {item.submitStatus === 1
            ? <span className="text-[10px] px-1.5 py-0.5 rounded bg-success/10 text-success">已提交</span>
            : <span className="text-[10px] px-1.5 py-0.5 rounded bg-warning/10 text-warning">待評分</span>}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">
          {item.planName}{item.departmentName ? ` · ${item.departmentName}` : ''}
        </p>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
    </button>
  );
}

/** 我的绩效结果卡 */
function ResultCard({ item }: { item: MyPerfResult }) {
  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <div className="flex items-start justify-between mb-2">
        <span className="text-sm font-medium text-foreground flex-1 min-w-0 truncate pr-2">{item.planName}</span>
        <span className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ${statusClass[item.taskStatus]}`}>{item.taskStatusText}</span>
      </div>
      <div className="flex items-end gap-3">
        <div>
          <span className={`text-3xl font-bold ${gradeClass(item.grade)}`}>{item.finalScore ?? '--'}</span>
          <span className="text-xs text-muted-foreground ml-1">分</span>
        </div>
        {item.grade && <span className={`text-lg font-bold ${gradeClass(item.grade)} mb-0.5`}>{item.grade}</span>}
      </div>
      <div className="flex gap-4 mt-2 text-[11px] text-muted-foreground">
        <span>自評 {item.selfTotal ?? '-'}</span>
        <span>互評 {item.peerTotal ?? '-'}</span>
        <span>主管 {item.managerTotal ?? '-'}</span>
      </div>
    </div>
  );
}

const KPI = () => {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('todo');
  const [activeTask, setActiveTask] = useState<string | null>(null);
  const [scores, setScores] = useState<Record<string, ScoreState>>({});

  const { data: todos = [] } = useQuery({
    queryKey: ['myPerfTasks'],
    queryFn: () => getMyPerfTasks().then((r) => r.data)
  });
  const { data: results = [] } = useQuery({
    queryKey: ['myPerfResults'],
    queryFn: () => getMyPerfResults().then((r) => r.data)
  });
  const { data: detail } = useQuery({
    queryKey: ['perfTaskDetail', activeTask],
    queryFn: () => getPerfTaskDetail(activeTask!).then((r) => r.data),
    enabled: Boolean(activeTask)
  });

  useEffect(() => {
    if (!detail?.scoreItems) return;
    const init: Record<string, ScoreState> = {};
    detail.scoreItems.forEach((it) => {
      init[it.indicatorId] = { score: it.myScore ?? 80, comment: it.myComment ?? '' };
    });
    setScores(init);
  }, [detail]);

  const submitMutation = useMutation({
    mutationFn: () => submitPerfScore({
      taskId: activeTask!,
      items: (detail?.scoreItems ?? []).map((it) => ({
        indicatorId: it.indicatorId,
        score: scores[it.indicatorId]?.score ?? 0,
        comment: scores[it.indicatorId]?.comment || undefined
      }))
    }),
    onSuccess: () => {
      toast.success('評分已提交');
      queryClient.invalidateQueries({ queryKey: ['myPerfTasks'] });
      queryClient.invalidateQueries({ queryKey: ['perfTaskDetail', activeTask] });
      setActiveTask(null);
    },
    onError: (e: any) => toast.error(e?.message || '提交失敗')
  });

  const todoPending = todos.filter((t) => t.submitStatus === 0).length;

  // ============ 评分详情视图 ============
  if (activeTask) {
    return (
      <MobileLayout title="評分">
        <div className="px-5 pt-4 pb-6">
          <button onClick={() => setActiveTask(null)} className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
            <ArrowLeft className="w-4 h-4" /> 返回
          </button>

          {!detail ? (
            <div className="py-16 text-center text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin inline" /></div>
          ) : (
            <>
              <div className="bg-card rounded-xl border border-border p-4 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-base font-semibold text-foreground">{detail.employeeName}</span>
                  {detail.myReviewerTypeText && <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary">{detail.myReviewerTypeText}</span>}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {detail.planName}{detail.position ? ` · ${detail.position}` : ''}
                </p>
              </div>

              {/* 三方进度 */}
              <div className="bg-card rounded-xl border border-border p-4 mb-4 space-y-2">
                {detail.reviewers.map((r) => (
                  <div key={`${r.reviewerId}-${r.reviewerType}`} className="flex items-center gap-2 text-sm">
                    {r.submitStatus === 1
                      ? <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                      : <Circle className="w-4 h-4 text-muted-foreground shrink-0" />}
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{r.reviewerTypeText}</span>
                    <span className="flex-1 text-foreground">{r.reviewerName}</span>
                    <span className="text-xs text-muted-foreground">{r.submitStatus === 1 ? '已提交' : '未提交'}</span>
                  </div>
                ))}
              </div>

              {/* 评分录入 */}
              {detail.myReviewerType === null ? (
                <p className="text-center text-sm text-muted-foreground py-8">您不是此任務的評價人，僅可查看</p>
              ) : (
                <>
                  <h3 className="text-sm font-semibold text-foreground mb-2">
                    我的評分{detail.mySubmitted ? '（已提交）' : ''}
                  </h3>
                  <div className="space-y-3">
                    {(detail.scoreItems ?? []).map((it) => (
                      <div key={it.indicatorId} className="bg-card rounded-xl border border-border p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="min-w-0">
                            <span className="text-sm font-medium text-foreground">{it.name}</span>
                            <p className="text-[11px] text-muted-foreground">權重 {it.weight}% · 滿分 {it.maxScore}</p>
                          </div>
                          <span className="text-xl font-bold text-primary shrink-0">{scores[it.indicatorId]?.score ?? 0}</span>
                        </div>
                        <Slider
                          value={[scores[it.indicatorId]?.score ?? 0]}
                          onValueChange={([v]) => setScores((p) => ({ ...p, [it.indicatorId]: { score: v, comment: p[it.indicatorId]?.comment ?? '' } }))}
                          min={0}
                          max={it.maxScore}
                          step={1}
                          disabled={detail.mySubmitted}
                          className="w-full mb-3"
                        />
                        <Textarea
                          value={scores[it.indicatorId]?.comment ?? ''}
                          onChange={(e) => setScores((p) => ({ ...p, [it.indicatorId]: { score: p[it.indicatorId]?.score ?? 0, comment: e.target.value } }))}
                          placeholder="評語（選填）"
                          rows={2}
                          disabled={detail.mySubmitted}
                          className="resize-none text-sm"
                        />
                      </div>
                    ))}
                  </div>

                  {!detail.mySubmitted && detail.canSubmit && (
                    <Button className="w-full mt-5" onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending}>
                      {submitMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                      提交評分
                    </Button>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </MobileLayout>
    );
  }

  // ============ 列表视图 ============
  let listContent: ReactNode;
  if (tab === 'todo') {
    listContent = todos.length === 0 ? emptyBlock('暫無評價任務') : (
      <div className="bg-card rounded-xl border border-border divide-y divide-border overflow-hidden">
        {todos.map((t) => <TodoRow key={t.reviewerRecordId} item={t} onOpen={setActiveTask} />)}
      </div>
    );
  } else {
    listContent = results.length === 0 ? emptyBlock('暫無考核記錄') : (
      <div className="space-y-3">
        {results.map((r) => <ResultCard key={r.id} item={r} />)}
      </div>
    );
  }

  return (
    <MobileLayout title="績效評估">
      <div className="px-5 pt-4 pb-6">
        {/* Tab 切换 */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setTab('todo')}
            className={`flex-1 text-sm py-2 rounded-lg border transition-colors ${tab === 'todo' ? 'border-primary bg-primary/5 text-primary font-medium' : 'border-border text-muted-foreground'}`}
          >
            待評分{todoPending > 0 ? ` (${todoPending})` : ''}
          </button>
          <button
            onClick={() => setTab('mine')}
            className={`flex-1 text-sm py-2 rounded-lg border transition-colors ${tab === 'mine' ? 'border-primary bg-primary/5 text-primary font-medium' : 'border-border text-muted-foreground'}`}
          >
            我的績效
          </button>
        </div>

        {listContent}
      </div>
    </MobileLayout>
  );
};

export default KPI;
