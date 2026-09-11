import { ArrowLeft, GitBranch, GripVertical, Loader2, Plus, Save, Settings2, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  APPROVAL_TYPE_TEXT,
  type ApprovalRuleSaveParams,
  getRuleById,
  saveRule,
  SCOPE_ALL,
  SCOPE_DEPARTMENT
} from '@/api/approval';
import { type DepartmentOption, getDepartmentOptions } from '@/api/department';
import { type EmployeeOption, getActiveEmployeeOptions } from '@/api/employee';
import { getPositionOptions, type PositionOption } from '@/api/position';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { hasPerm } from '@/lib/auth';
import { APPROVAL_PERM } from '@/lib/perms';

/** 编辑态的层级表单 */
interface LevelForm {
  approverType: number;
  /** 触发条件：field 为空表示恒触发 */
  condField: string;
  condOp: string;
  condValue: string;
  employeeId: string;
  id: string;
  name: string;
  positionId: string;
}

const approverTypes = [
  { value: 3, label: '指定職位' },
  { value: 4, label: '指定人員' }
];

/** 各申请类型可用的条件字段（value 对应后端 conditions.field） */
const FIELD_OPTIONS: Record<number, { label: string; value: string }[]> = {
  1: [
    { value: 'days', label: '請假天數' },
    { value: 'subType', label: '假別' }
  ],
  2: [
    { value: 'amount', label: '報銷金額' },
    { value: 'subType', label: '報銷類別' }
  ],
  3: [
    { value: 'hours', label: '加班時數' },
    { value: 'subType', label: '加班類型' }
  ],
  4: [
    { value: 'days', label: '出差天數' },
    { value: 'subType', label: '目的地類型' }
  ],
  5: [
    { value: 'days', label: '在職天數' },
    { value: 'subType', label: '離職原因' }
  ],
  6: [],
  8: []
};

const OP_OPTIONS = [
  { value: 'gt', label: '>' },
  { value: 'gte', label: '≥' },
  { value: 'lt', label: '<' },
  { value: 'lte', label: '≤' },
  { value: 'eq', label: '=' },
  { value: 'ne', label: '≠' }
];

const TIMEOUT_OPTIONS = [
  { value: 1, label: '自動提醒' },
  { value: 4, label: '自動駁回' }
];

let uid = 0;
const genId = () => `tmp-${++uid}`;
const emptyLevel = (): LevelForm => ({
  id: genId(),
  name: '',
  approverType: 3,
  positionId: '',
  employeeId: '',
  condField: '',
  condOp: 'gt',
  condValue: ''
});

export default function ApprovalRuleForm() {
  const { ruleId } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(ruleId) && ruleId !== 'new';

  const [name, setName] = useState('');
  const [type, setType] = useState<string>('');
  const [scopeType, setScopeType] = useState<string>(String(SCOPE_ALL));
  const [departmentId, setDepartmentId] = useState<string>('');
  const [description, setDescription] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [levels, setLevels] = useState<LevelForm[]>([emptyLevel()]);

  const [slaHours, setSlaHours] = useState('48');
  const [timeoutAction, setTimeoutAction] = useState<string>('1');
  const [allowWithdraw, setAllowWithdraw] = useState(true);
  const [notifyApplicant, setNotifyApplicant] = useState(true);
  const [notifyNextApprover, setNotifyNextApprover] = useState(true);
  const [saving, setSaving] = useState(false);

  // 下拉选项
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [positions, setPositions] = useState<PositionOption[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  useEffect(() => {
    getDepartmentOptions()
      .then(r => setDepartments(r.data ?? []))
      .catch(() => setDepartments([]));
    getPositionOptions()
      .then(r => setPositions(r.data ?? []))
      .catch(() => setPositions([]));
    getActiveEmployeeOptions()
      .then(r => setEmployees(r.data ?? []))
      .catch(() => setEmployees([]));
  }, []);

  // 编辑：回显规则
  useEffect(() => {
    if (!isEdit) return;
    getRuleById(Number(ruleId))
      .then(res => {
        const d = res.data;
        if (!d) {
          toast.error('審批規則不存在');
          return;
        }
        setName(d.name);
        setType(String(d.type));
        setScopeType(String(d.scopeType));
        setDepartmentId(d.departmentId != null ? String(d.departmentId) : '');
        setDescription(d.description ?? '');
        setEnabled(Boolean(d.enabled));
        setSlaHours(d.slaHours != null ? String(d.slaHours) : '');
        setTimeoutAction(String(d.timeoutAction ?? 1));
        setAllowWithdraw(d.allowWithdraw !== false);
        setNotifyApplicant(d.notifyApplicant !== false);
        setNotifyNextApprover(d.notifyNextApprover !== false);
        setLevels(
          (d.levels ?? []).map(l => ({
            id: genId(),
            name: l.name,
            approverType: l.approverType,
            positionId: l.positionId != null ? String(l.positionId) : '',
            employeeId: l.employeeId != null ? String(l.employeeId) : '',
            condField: l.conditions?.field ?? '',
            condOp: l.conditions?.op ?? 'gt',
            condValue: l.conditions?.value != null ? String(l.conditions.value) : ''
          }))
        );
      })
      .catch((err: any) => toast.error(err.message || '載入審批規則失敗'));
  }, [isEdit, ruleId]);

  const addLevel = () => setLevels(p => [...p, emptyLevel()]);
  const removeLevel = (id: string) => setLevels(p => p.filter(l => l.id !== id));
  const updateLevel = (id: string, patch: Partial<LevelForm>) =>
    setLevels(p => p.map(l => (l.id === id ? { ...l, ...patch } : l)));

  const availableFields = type ? (FIELD_OPTIONS[Number(type)] ?? []) : [];

  const handleSave = async () => {
    if (!name.trim() || !type || !scopeType) {
      toast.error('請填寫必填欄位');
      return;
    }
    if (Number(scopeType) === SCOPE_DEPARTMENT && !departmentId) {
      toast.error('適用範圍為指定部門時，請選擇部門');
      return;
    }
    if (levels.length === 0) {
      toast.error('請至少新增一個審批層級');
      return;
    }
    for (const [i, lvl] of levels.entries()) {
      if (!lvl.name.trim()) {
        toast.error(`第 ${i + 1} 級：請填寫節點名稱`);
        return;
      }
      if (lvl.approverType === 3 && !lvl.positionId) {
        toast.error(`第 ${i + 1} 級：請選擇職位`);
        return;
      }
      if (lvl.approverType === 4 && !lvl.employeeId) {
        toast.error(`第 ${i + 1} 級：請選擇人員`);
        return;
      }
      if (lvl.condField && !String(lvl.condValue).trim()) {
        toast.error(`第 ${i + 1} 級：請填寫觸發條件的值`);
        return;
      }
    }

    const payload: ApprovalRuleSaveParams = {
      id: isEdit ? Number(ruleId) : undefined,
      name: name.trim(),
      type: Number(type),
      scopeType: Number(scopeType),
      departmentId: Number(scopeType) === SCOPE_DEPARTMENT ? Number(departmentId) : undefined,
      description: description.trim() || undefined,
      slaHours: slaHours.trim() ? Number(slaHours) : undefined,
      timeoutAction: Number(timeoutAction),
      allowWithdraw,
      notifyApplicant,
      notifyNextApprover,
      status: enabled ? 1 : 2,
      // 数组顺序即第 1..N 级
      levels: levels.map(l => ({
        name: l.name.trim(),
        approverType: l.approverType,
        positionId: l.approverType === 3 ? Number(l.positionId) : undefined,
        employeeId: l.approverType === 4 ? Number(l.employeeId) : undefined,
        conditions: l.condField
          ? {
              field: l.condField,
              op: l.condOp,
              // subType 为字符串比较，其余字段按数值
              value: l.condField === 'subType' ? l.condValue.trim() : Number(l.condValue)
            }
          : null,
        signType: 1
      }))
    };

    setSaving(true);
    try {
      await saveRule(payload);
      toast.success(isEdit ? '審批規則已更新' : '審批規則已建立');
      navigate('/attendance/approval');
    } catch (err: any) {
      toast.error(err.message || '儲存失敗');
    } finally {
      setSaving(false);
    }
  };

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
          {hasPerm(APPROVAL_PERM.CONFIG) && (
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}儲存
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
                  <Select
                    value={type}
                    onValueChange={v => {
                      setType(v);
                      setLevels(p => p.map(l => ({ ...l, condField: '', condValue: '' })));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="選擇類型" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(APPROVAL_TYPE_TEXT).map(([code, label]) => (
                        <SelectItem key={code} value={code}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>
                    適用範圍 <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={Number(scopeType) === SCOPE_ALL ? 'all' : departmentId}
                    onValueChange={v => {
                      if (v === 'all') {
                        setScopeType(String(SCOPE_ALL));
                        setDepartmentId('');
                      } else {
                        setScopeType(String(SCOPE_DEPARTMENT));
                        setDepartmentId(v);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="選擇範圍" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全公司</SelectItem>
                      {departments.map(d => (
                        <SelectItem key={d.id} value={String(d.id)}>
                          {d.name}
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
                        onChange={e => updateLevel(lvl.id, { name: e.target.value })}
                        placeholder="例如：部門主管審批"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">審批人類型</Label>
                      <Select
                        value={String(lvl.approverType)}
                        onValueChange={v =>
                          updateLevel(lvl.id, { approverType: Number(v), positionId: '', employeeId: '' })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {approverTypes.map(a => (
                            <SelectItem key={a.value} value={String(a.value)}>
                              {a.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">審批人</Label>
                      {lvl.approverType === 3 ? (
                        <Select value={lvl.positionId} onValueChange={v => updateLevel(lvl.id, { positionId: v })}>
                          <SelectTrigger>
                            <SelectValue placeholder="選擇職位" />
                          </SelectTrigger>
                          <SelectContent>
                            {positions.map(p => (
                              <SelectItem key={p.id} value={String(p.id)}>
                                {p.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : lvl.approverType === 4 ? (
                        <Select value={lvl.employeeId} onValueChange={v => updateLevel(lvl.id, { employeeId: v })}>
                          <SelectTrigger>
                            <SelectValue placeholder="選擇人員" />
                          </SelectTrigger>
                          <SelectContent>
                            {employees.map(e => (
                              <SelectItem key={e.id} value={String(e.id)}>
                                {e.name}
                                {e.employeeNo ? `（${e.employeeNo}）` : ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input value="自動匹配" readOnly className="text-muted-foreground" />
                      )}
                    </div>
                  </div>
                  {/* 触发条件：不填 = 該級恒觸發 */}
                  <div className="space-y-1.5">
                    <Label className="text-xs">觸發條件（選填，不填表示此層級一定執行）</Label>
                    <div className="flex items-center gap-2">
                      <Select
                        value={lvl.condField || 'none'}
                        onValueChange={v => updateLevel(lvl.id, { condField: v === 'none' ? '' : v, condValue: '' })}
                        disabled={!type}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder={type ? '選擇欄位' : '請先選擇申請類型'} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">不設條件</SelectItem>
                          {availableFields.map(f => (
                            <SelectItem key={f.value} value={f.value}>
                              {f.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={lvl.condOp}
                        onValueChange={v => updateLevel(lvl.id, { condOp: v })}
                        disabled={!lvl.condField}
                      >
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {OP_OPTIONS.map(o => (
                            <SelectItem key={o.value} value={o.value}>
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        className="flex-1"
                        type={lvl.condField && lvl.condField !== 'subType' ? 'number' : 'text'}
                        value={lvl.condValue}
                        onChange={e => updateLevel(lvl.id, { condValue: e.target.value })}
                        placeholder="條件值"
                        disabled={!lvl.condField}
                      />
                    </div>
                  </div>
                </div>
              ))}
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
                <Input type="number" value={slaHours} onChange={e => setSlaHours(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>超時處理</Label>
                <Select value={timeoutAction} onValueChange={setTimeoutAction}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEOUT_OPTIONS.map(o => (
                      <SelectItem key={o.value} value={String(o.value)}>
                        {o.label}
                      </SelectItem>
                    ))}
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
