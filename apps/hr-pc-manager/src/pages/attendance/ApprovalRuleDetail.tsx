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
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';

interface ApprovalLevel {
  approver: string;
  approverType: string;
  condition?: string;
  level: number;
  name: string;
}

interface RuleData {
  applyScope: string;
  conditions: { action: string; label: string; operator: string; value: string }[];
  createdAt: string;
  creator: string;
  description: string;
  enabled: boolean;
  id: string;
  levels: ApprovalLevel[];
  name: string;
  settings: {
    allowWithdraw: boolean;
    autoApprove: boolean;
    autoApproveCondition: string;
    notifyApplicant: boolean;
    notifyNextApprover: boolean;
    overtimeAction: string;
    timeLimit: number;
  };
  type: string;
  updatedAt: string;
}

const mockRules: Record<string, RuleData> = {
  '1': {
    id: '1',
    name: '請假審批流程',
    type: '請假申請',
    applyScope: '全公司',
    description: '適用於全公司員工的請假審批流程，根據請假天數自動匹配不同的審批層級。',
    enabled: true,
    creator: '系統管理員',
    createdAt: '2026-01-01',
    updatedAt: '2026-02-20',
    levels: [
      { level: 1, name: '部門主管審批', approverType: '直屬主管', approver: '自動匹配' },
      { level: 2, name: '人事部審核', approverType: '指定角色', approver: '人事專員' },
      {
        level: 3,
        name: '總經理審批',
        approverType: '指定人員',
        approver: '陳總經理',
        condition: '請假天數 > 3 天時觸發'
      }
    ],
    conditions: [
      { label: '請假天數', operator: '≤', value: '3 天', action: '跳過第 3 級（總經理）' },
      { label: '請假天數', operator: '>', value: '3 天', action: '完整三級審批' },
      { label: '假別', operator: '=', value: '病假', action: '需上傳診斷證明' }
    ],
    settings: {
      autoApprove: false,
      autoApproveCondition: '',
      timeLimit: 48,
      overtimeAction: '自動提醒',
      allowWithdraw: true,
      notifyApplicant: true,
      notifyNextApprover: true
    }
  },
  '2': {
    id: '2',
    name: '報銷審批流程',
    type: '報銷申請',
    applyScope: '全公司',
    description: '根據報銷金額自動匹配審批層級，確保大額報銷經過充分審核。',
    enabled: true,
    creator: '系統管理員',
    createdAt: '2026-01-01',
    updatedAt: '2026-02-18',
    levels: [
      { level: 1, name: '部門主管審批', approverType: '直屬主管', approver: '自動匹配' },
      { level: 2, name: '財務審核', approverType: '指定角色', approver: '財務專員' },
      { level: 3, name: '財務經理審批', approverType: '指定角色', approver: '財務經理', condition: '金額 > 5,000' },
      { level: 4, name: '總經理審批', approverType: '指定人員', approver: '陳總經理', condition: '金額 > 30,000' }
    ],
    conditions: [
      { label: '報銷金額', operator: '≤', value: 'NT$ 5,000', action: '僅需主管 + 財務審核' },
      { label: '報銷金額', operator: '>', value: 'NT$ 5,000', action: '加財務經理審批' },
      { label: '報銷金額', operator: '>', value: 'NT$ 30,000', action: '加總經理審批' }
    ],
    settings: {
      autoApprove: false,
      autoApproveCondition: '',
      timeLimit: 72,
      overtimeAction: '自動提醒',
      allowWithdraw: true,
      notifyApplicant: true,
      notifyNextApprover: true
    }
  },
  '7': {
    id: '7',
    name: '離職審批流程',
    type: '離職申請',
    applyScope: '全公司',
    description: '適用於全公司員工的離職審批流程，根據員工在職天數及類型自動匹配審批層級，確保離職交接有序進行。',
    enabled: true,
    creator: '系統管理員',
    createdAt: '2026-02-15',
    updatedAt: '2026-03-01',
    levels: [
      { level: 1, name: '部門主管審批', approverType: '直屬主管', approver: '自動匹配' },
      { level: 2, name: '人事部審核', approverType: '指定角色', approver: '人事專員' },
      { level: 3, name: '人事經理確認', approverType: '指定角色', approver: '人事經理', condition: '正式員工觸發' },
      {
        level: 4,
        name: '總經理審批',
        approverType: '指定人員',
        approver: '陳總經理',
        condition: '在職超過 1 年或主管級以上'
      }
    ],
    conditions: [
      { label: '員工類型', operator: '=', value: '試用期', action: '僅需主管 + 人事審核（跳過第 3、4 級）' },
      { label: '員工類型', operator: '=', value: '正式員工', action: '需人事經理確認' },
      { label: '在職天數', operator: '>', value: '365 天', action: '加總經理審批' },
      { label: '離職原因', operator: '=', value: '辭退', action: '直接由人事 + 總經理審批' }
    ],
    settings: {
      autoApprove: false,
      autoApproveCondition: '',
      timeLimit: 72,
      overtimeAction: '自動提醒並升級',
      allowWithdraw: true,
      notifyApplicant: true,
      notifyNextApprover: true
    }
  }
};

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
  const data = ruleId ? mockRules[ruleId] : null;
  const [enabled, setEnabled] = useState(data?.enabled ?? false);

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

  const handleToggle = (v: boolean) => {
    setEnabled(v);
    toast.success(v ? '規則已啟用' : '規則已停用');
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
            <Switch checked={enabled} onCheckedChange={handleToggle} />
          </div>
          <Button variant="outline" onClick={() => navigate(`/attendance/approval/rules/${ruleId}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            編輯
          </Button>
          <Button
            variant="destructive"
            size="icon"
            onClick={() => {
              toast.success('規則已刪除');
              navigate('/attendance/approval');
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
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
                  <Badge className={`${typeColors[data.type] || ''} border`}>{data.type}</Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">適用範圍</p>
                  <p className="text-sm font-medium text-foreground">{data.applyScope}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">審批層級</p>
                  <Badge variant="outline">{data.levels.length} 級</Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">建立者</p>
                  <p className="text-sm text-foreground">{data.creator}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">建立時間</p>
                  <p className="text-sm text-foreground">{data.createdAt}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">最後更新</p>
                  <p className="text-sm text-foreground">{data.updatedAt}</p>
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
                {data.levels.map(lvl => (
                  <div key={lvl.level} className="flex items-start gap-2">
                    <ArrowRight className="h-4 w-4 text-muted-foreground mt-6 shrink-0" />
                    <div className="flex flex-col items-center">
                      <div className="w-28 rounded-lg border-2 border-border bg-card p-3 text-center">
                        <p className="text-xs font-medium text-foreground">{lvl.name}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {lvl.approverType}：{lvl.approver}
                        </p>
                        {lvl.condition && (
                          <p className="text-[10px] text-warning mt-1 flex items-center justify-center gap-0.5">
                            <AlertTriangle className="h-2.5 w-2.5" />
                            {lvl.condition}
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

          {/* Conditions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                條件規則
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.conditions.map((c, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
                    <Badge variant="outline" className="shrink-0">
                      {c.label}
                    </Badge>
                    <span className="text-sm font-mono text-foreground">
                      {c.operator} {c.value}
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm text-muted-foreground">{c.action}</span>
                  </div>
                ))}
              </div>
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
                <Badge variant={data.settings.allowWithdraw ? 'default' : 'outline'}>
                  {data.settings.allowWithdraw ? '是' : '否'}
                </Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">審批時限</span>
                <span className="text-sm font-medium text-foreground">{data.settings.timeLimit} 小時</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">超時處理</span>
                <Badge variant="outline">{data.settings.overtimeAction}</Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">通知申請人</span>
                <Badge variant={data.settings.notifyApplicant ? 'default' : 'outline'}>
                  {data.settings.notifyApplicant ? '是' : '否'}
                </Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">通知下一審批人</span>
                <Badge variant={data.settings.notifyNextApprover ? 'default' : 'outline'}>
                  {data.settings.notifyNextApprover ? '是' : '否'}
                </Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">自動審批</span>
                <Badge variant={data.settings.autoApprove ? 'default' : 'outline'}>
                  {data.settings.autoApprove ? '已啟用' : '未啟用'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
