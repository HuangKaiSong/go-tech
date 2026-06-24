import { AlertTriangle, ArrowLeft, GitBranch, GripVertical, Plus, Save, Settings2, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

interface LevelForm {
  approver: string;
  approverType: string;
  condition: string;
  id: string;
  name: string;
}

interface ConditionForm {
  action: string;
  field: string;
  id: string;
  operator: string;
  value: string;
}

const approvalTypes = [
  { value: '請假申請', label: '請假申請' },
  { value: '報銷申請', label: '報銷申請' },
  { value: '加班申請', label: '加班申請' },
  { value: '出差申請', label: '出差申請' },
  { value: '離職申請', label: '離職申請' }
];

const scopeOptions = ['全公司', '技術部', '銷售部', '市場部', '財務部', '人事部'];
const approverTypes = [
  { value: '直屬主管', label: '直屬主管' },
  { value: '指定角色', label: '指定角色' },
  { value: '指定人員', label: '指定人員' },
  { value: '部門主管', label: '部門主管' }
];
const conditionFields: Record<string, string[]> = {
  請假申請: ['請假天數', '假別'],
  報銷申請: ['報銷金額', '報銷類別'],
  加班申請: ['加班時數', '加班類型'],
  出差申請: ['出差天數', '目的地類型'],
  離職申請: ['在職天數', '員工類型', '離職原因']
};
const operators = ['=', '≠', '>', '≥', '<', '≤'];

let uid = 0;
// oxlint-disable-next-line no-plusplus
const genId = () => `tmp-${++uid}`;

export default function ApprovalRuleForm() {
  const { ruleId } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(ruleId);

  const [name, setName] = useState(isEdit ? '請假審批流程' : '');
  const [type, setType] = useState(isEdit ? '請假申請' : '');
  const [scope, setScope] = useState(isEdit ? '全公司' : '');
  const [description, setDescription] = useState(isEdit ? '適用於全公司員工的請假審批流程。' : '');
  const [enabled, setEnabled] = useState(true);

  const [levels, setLevels] = useState<LevelForm[]>(
    isEdit
      ? [
          { id: genId(), name: '部門主管審批', approverType: '直屬主管', approver: '自動匹配', condition: '' },
          { id: genId(), name: '人事部審核', approverType: '指定角色', approver: '人事專員', condition: '' },
          {
            id: genId(),
            name: '總經理審批',
            approverType: '指定人員',
            approver: '陳總經理',
            condition: '請假天數 > 3 天'
          }
        ]
      : [{ id: genId(), name: '', approverType: '直屬主管', approver: '', condition: '' }]
  );

  const [conditions, setConditions] = useState<ConditionForm[]>(
    isEdit
      ? [
          { id: genId(), field: '請假天數', operator: '≤', value: '3 天', action: '跳過第 3 級' },
          { id: genId(), field: '請假天數', operator: '>', value: '3 天', action: '完整審批' }
        ]
      : []
  );

  const [timeLimit, setTimeLimit] = useState('48');
  const [overtimeAction, setOvertimeAction] = useState('自動提醒');
  const [allowWithdraw, setAllowWithdraw] = useState(true);
  const [notifyApplicant, setNotifyApplicant] = useState(true);
  const [notifyNextApprover, setNotifyNextApprover] = useState(true);

  const addLevel = () =>
    setLevels(p => [...p, { id: genId(), name: '', approverType: '直屬主管', approver: '', condition: '' }]);
  const removeLevel = (id: string) => setLevels(p => p.filter(l => l.id !== id));
  const updateLevel = (id: string, field: keyof LevelForm, value: string) =>
    setLevels(p => p.map(l => (l.id === id ? { ...l, [field]: value } : l)));

  const addCondition = () =>
    setConditions(p => [...p, { id: genId(), field: '', operator: '=', value: '', action: '' }]);
  const removeCondition = (id: string) => setConditions(p => p.filter(c => c.id !== id));
  const updateCondition = (id: string, field: keyof ConditionForm, value: string) =>
    setConditions(p => p.map(c => (c.id === id ? { ...c, [field]: value } : c)));

  const handleSave = () => {
    if (!name || !type || !scope) {
      toast.error('請填寫必填欄位');
      return;
    }
    if (levels.length === 0) {
      toast.error('請至少新增一個審批層級');
      return;
    }
    toast.success(isEdit ? '審批規則已更新' : '審批規則已建立');
    navigate('/attendance/approval');
  };

  const availableFields = type ? conditionFields[type] || [] : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{isEdit ? '編輯審批規則' : '新增審批規則'}</h1>
            <p className="text-muted-foreground text-sm mt-0.5">設定審批流程的層級、條件與通知規則</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{enabled ? '啟用' : '停用'}</span>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>
          <Button variant="outline" onClick={() => navigate(-1)}>
            取消
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            儲存
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
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>
                    規則名稱 <span className="text-destructive">*</span>
                  </Label>
                  <Input value={name} onChange={e => setName(e.target.value)} placeholder="例如：請假審批流程" />
                </div>
                <div className="space-y-2">
                  <Label>
                    申請類型 <span className="text-destructive">*</span>
                  </Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger>
                      <SelectValue placeholder="選擇類型" />
                    </SelectTrigger>
                    <SelectContent>
                      {approvalTypes.map(t => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>
                    適用範圍 <span className="text-destructive">*</span>
                  </Label>
                  <Select value={scope} onValueChange={setScope}>
                    <SelectTrigger>
                      <SelectValue placeholder="選擇範圍" />
                    </SelectTrigger>
                    <SelectContent>
                      {scopeOptions.map(s => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>規則描述</Label>
                <Textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="描述此審批規則的用途..."
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Approval Levels */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <GitBranch className="h-4 w-4 text-primary" />
                  審批層級
                </CardTitle>
                <Button variant="outline" size="sm" onClick={addLevel}>
                  <Plus className="h-4 w-4 mr-1" />
                  新增層級
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {levels.map((lvl, index) => (
                <div key={lvl.id} className="border rounded-lg p-4 space-y-3 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">第 {index + 1} 級</span>
                    </div>
                    {levels.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => removeLevel(lvl.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">節點名稱</Label>
                      <Input
                        value={lvl.name}
                        onChange={e => updateLevel(lvl.id, 'name', e.target.value)}
                        placeholder="例如：部門主管審批"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">審批人類型</Label>
                      <Select value={lvl.approverType} onValueChange={v => updateLevel(lvl.id, 'approverType', v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {approverTypes.map(a => (
                            <SelectItem key={a.value} value={a.value}>
                              {a.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">審批人</Label>
                      <Input
                        value={lvl.approver}
                        onChange={e => updateLevel(lvl.id, 'approver', e.target.value)}
                        placeholder="人員/角色名稱"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">觸發條件（選填）</Label>
                    <Input
                      value={lvl.condition}
                      onChange={e => updateLevel(lvl.id, 'condition', e.target.value)}
                      placeholder="例如：金額 > 30,000 時觸發此層級"
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Conditions */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  條件規則
                </CardTitle>
                <Button variant="outline" size="sm" onClick={addCondition} disabled={!type}>
                  <Plus className="h-4 w-4 mr-1" />
                  新增條件
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {!type && <p className="text-sm text-muted-foreground">請先選擇申請類型以設定條件規則</p>}
              {conditions.map(c => (
                <div key={c.id} className="flex items-end gap-2 p-3 border rounded-lg bg-muted/30">
                  <div className="space-y-1.5 flex-1">
                    <Label className="text-xs">欄位</Label>
                    <Select value={c.field} onValueChange={v => updateCondition(c.id, 'field', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="選擇" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableFields.map(f => (
                          <SelectItem key={f} value={f}>
                            {f}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5 w-20">
                    <Label className="text-xs">運算</Label>
                    <Select value={c.operator} onValueChange={v => updateCondition(c.id, 'operator', v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {operators.map(o => (
                          <SelectItem key={o} value={o}>
                            {o}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <Label className="text-xs">值</Label>
                    <Input
                      value={c.value}
                      onChange={e => updateCondition(c.id, 'value', e.target.value)}
                      placeholder="條件值"
                    />
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <Label className="text-xs">動作</Label>
                    <Input
                      value={c.action}
                      onChange={e => updateCondition(c.id, 'action', e.target.value)}
                      placeholder="觸發動作"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-destructive shrink-0"
                    onClick={() => removeCondition(c.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {conditions.length === 0 && type && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  尚未設定條件規則，所有申請將走完整審批流程
                </p>
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
              <div className="space-y-2">
                <Label>審批時限（小時）</Label>
                <Input type="number" value={timeLimit} onChange={e => setTimeLimit(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>超時處理</Label>
                <Select value={overtimeAction} onValueChange={setOvertimeAction}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="自動提醒">自動提醒</SelectItem>
                    <SelectItem value="自動通過">自動通過</SelectItem>
                    <SelectItem value="自動轉簽">自動轉簽</SelectItem>
                    <SelectItem value="自動駁回">自動駁回</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <Label>允許撤回</Label>
                <Switch checked={allowWithdraw} onCheckedChange={setAllowWithdraw} />
              </div>
              <div className="flex items-center justify-between">
                <Label>通知申請人</Label>
                <Switch checked={notifyApplicant} onCheckedChange={setNotifyApplicant} />
              </div>
              <div className="flex items-center justify-between">
                <Label>通知下一審批人</Label>
                <Switch checked={notifyNextApprover} onCheckedChange={setNotifyNextApprover} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
