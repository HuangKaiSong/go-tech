import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Edit,
  GitBranch,
  Settings2,
  Trash2,
  Users
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  APPROVAL_TYPE_TEXT,
  type ApprovalRule,
  changeRuleStatus,
  deleteRule,
  getRuleById,
  TIMEOUT_ACTION_TEXT
} from '@/api/approval';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { hasPerm } from '@/lib/auth';
import { APPROVAL_PERM } from '@/lib/perms';

const typeColors: Record<string, string> = {
  請假申請: 'bg-primary/10 text-primary border-primary/20',
  報銷申請: 'bg-warning/10 text-warning border-warning/20',
  加班申請: 'bg-accent/10 text-accent border-accent/20',
  出差申請: 'bg-success/10 text-success border-success/20',
  離職申請: 'bg-destructive/10 text-destructive border-destructive/20'
};

export default function ApprovalRuleDetail() {
  const { ruleId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<ApprovalRule | null>(null);
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (!ruleId) return;
    setLoading(true);
    getRuleById(Number(ruleId))
      .then(res => {
        setData(res.data ?? null);
        setEnabled(Boolean(res.data?.enabled));
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [ruleId]);

  if (loading) {
    return <div className="py-20 text-center text-muted-foreground">載入中...</div>;
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Settings2 className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">找不到該審批規則</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/attendance/approval')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回審批管理
        </Button>
      </div>
    );
  }

  const typeText = APPROVAL_TYPE_TEXT[data.type] ?? data.typeName ?? '';
  const levels = data.levels ?? [];
  // 條件規則 = 有觸發條件的層級（條件不滿足則跳過該級）
  const conditionalLevels = levels.filter(l => Boolean(l.conditions));

  const handleToggle = async (v: boolean) => {
    try {
      await changeRuleStatus(data.id, v ? 1 : 2);
      setEnabled(v);
      toast.success(v ? '規則已啟用' : '規則已停用');
    } catch (err: any) {
      toast.error(err.message || '操作失敗');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteRule(data.id);
      toast.success('規則已刪除');
      navigate('/attendance/approval');
    } catch (err: any) {
      toast.error(err.message || '刪除失敗');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/attendance/approval')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{data.name}</h1>
            <p className="text-muted-foreground text-sm mt-0.5">{data.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{enabled ? '已啟用' : '已停用'}</span>
            <Switch checked={enabled} onCheckedChange={handleToggle} disabled={!hasPerm(APPROVAL_PERM.CONFIG)} />
          </div>
          {hasPerm(APPROVAL_PERM.CONFIG) && (
            <Button variant="outline" onClick={() => navigate(`/attendance/approval/rules/${ruleId}/edit`)}>
              <Edit className="h-4 w-4 mr-2" />
              編輯
            </Button>
          )}
          {hasPerm(APPROVAL_PERM.CONFIG) && (
            <Button variant="destructive" size="icon" onClick={handleDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-primary" />
                基本資訊
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">申請類型</p>
                  <Badge className={`${typeColors[typeText] || ''} border`}>{typeText}</Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">適用範圍</p>
                  <p className="text-sm font-medium text-foreground">{data.applyScope}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">審批層級</p>
                  <Badge variant="outline">{levels.length} 級</Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">建立者</p>
                  <p className="text-sm text-foreground">{data.creator || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">建立時間</p>
                  <p className="text-sm text-foreground">{data.createdAt || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">最後更新</p>
                  <p className="text-sm text-foreground">{data.updatedAt || '—'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Approval Flow */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-primary" />
                審批流程
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-2 flex-wrap">
                {/* Start node */}
                <div className="flex flex-col items-center">
                  <div className="w-24 h-16 rounded-lg border-2 border-primary bg-primary/5 flex flex-col items-center justify-center">
                    <Users className="h-4 w-4 text-primary mb-1" />
                    <span className="text-xs font-medium text-primary">申請人提交</span>
                  </div>
                </div>
                {levels.map(lvl => (
                  <div key={lvl.id ?? lvl.levelNo} className="flex items-start gap-2">
                    <ArrowRight className="h-4 w-4 text-muted-foreground mt-6 shrink-0" />
                    <div className="flex flex-col items-center">
                      <div className="w-28 rounded-lg border-2 border-border bg-card p-3 text-center">
                        <p className="text-xs font-medium text-foreground">{lvl.name}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {lvl.approverTypeName}：{lvl.approver}
                        </p>
                        {lvl.conditionText && (
                          <p className="text-[10px] text-warning mt-1 flex items-center justify-center gap-0.5">
                            <AlertTriangle className="h-2.5 w-2.5" />
                            {lvl.conditionText}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div className="flex items-start gap-2">
                  <ArrowRight className="h-4 w-4 text-muted-foreground mt-6 shrink-0" />
                  <div className="w-24 h-16 rounded-lg border-2 border-success bg-success/5 flex flex-col items-center justify-center">
                    <CheckCircle2 className="h-4 w-4 text-success mb-1" />
                    <span className="text-xs font-medium text-success">審批完成</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Conditions（由層級觸發條件推導） */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                條件規則
              </CardTitle>
            </CardHeader>
            <CardContent>
              {conditionalLevels.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  未設定觸發條件，所有申請都走完整 {levels.length} 級審批
                </p>
              ) : (
                <div className="space-y-3">
                  {conditionalLevels.map(lvl => (
                    <div
                      key={lvl.id ?? lvl.levelNo}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border"
                    >
                      <Badge variant="outline" className="shrink-0">
                        {lvl.conditionText}
                      </Badge>
                      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm text-muted-foreground">
                        才需要「{lvl.name}」（第 {lvl.levelNo} 級），否則跳過
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Settings */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">流程設定</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">允許撤回</span>
                <Badge variant={data.allowWithdraw ? 'default' : 'outline'}>{data.allowWithdraw ? '是' : '否'}</Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">審批時限</span>
                <span className="text-sm font-medium text-foreground">
                  {data.slaHours != null ? `${data.slaHours} 小時` : '不限'}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">超時處理</span>
                <Badge variant="outline">{TIMEOUT_ACTION_TEXT[data.timeoutAction ?? 1]}</Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">通知申請人</span>
                <Badge variant={data.notifyApplicant ? 'default' : 'outline'}>
                  {data.notifyApplicant ? '是' : '否'}
                </Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">通知下一審批人</span>
                <Badge variant={data.notifyNextApprover ? 'default' : 'outline'}>
                  {data.notifyNextApprover ? '是' : '否'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
