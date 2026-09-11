import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowLeft, Plus, Save, Target, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { getDepartmentOptions } from '@/api/department';
import { getActiveEmployeeOptions } from '@/api/employee';
import {
  getPerfPlanDetail,
  type PerfCategory,
  type PerfPlanSavePayload,
  type PerfScoringType,
  savePerfPlan
} from '@/api/performance';
import { getPositionOptions } from '@/api/position';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';

interface CriterionForm {
  category: PerfCategory;
  key: string;
  maxScore: string;
  name: string;
  scoringType: PerfScoringType;
  weight: string;
}

interface GradeRuleForm {
  description: string;
  grade: string;
  max: string;
  min: string;
}

const defaultGradeRules: GradeRuleForm[] = [
  { grade: 'A', min: '90', max: '100', description: '卓越/優秀' },
  { grade: 'B', min: '80', max: '89', description: '良好/合格' },
  { grade: 'C', min: '70', max: '79', description: '需改進' },
  { grade: 'D', min: '0', max: '69', description: '不合格' }
];

let keySeq = 100;

export default function PerformancePlanForm() {
  const { t } = useTranslation();
  const { planId } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(planId);

  const [form, setForm] = useState({
    name: '',
    cycle: '1',
    scopeType: '1',
    periodStart: '',
    periodEnd: '',
    remark: '',
    selfWeight: '20',
    peerWeight: '30',
    managerWeight: '50',
    peerCount: '3'
  });
  const [scopeIds, setScopeIds] = useState<number[]>([]);
  const [criteria, setCriteria] = useState<CriterionForm[]>([]);
  const [gradeRules, setGradeRules] = useState<GradeRuleForm[]>(defaultGradeRules);

  // 范围候选项：按 scopeType 拉取
  const scopeType = Number(form.scopeType);
  const { data: deptOptions = [] } = useQuery({
    queryKey: ['deptOptions'],
    queryFn: () => getDepartmentOptions().then(r => r.data),
    enabled: scopeType === 2
  });
  const { data: posOptions = [] } = useQuery({
    queryKey: ['posOptions'],
    queryFn: () => getPositionOptions().then(r => r.data),
    enabled: scopeType === 3
  });
  const { data: empOptions = [] } = useQuery({
    queryKey: ['empOptions'],
    queryFn: () => getActiveEmployeeOptions().then(r => r.data),
    enabled: scopeType === 4
  });

  // 编辑：加载详情
  const { data: detail } = useQuery({
    queryKey: ['perfPlanDetail', planId],
    queryFn: () => getPerfPlanDetail(planId!).then(r => r.data),
    enabled: isEdit
  });

  useEffect(() => {
    if (!detail) return;
    const [pStart, pEnd] = (detail.period || '').split(' 至 ');
    setForm({
      name: detail.name,
      cycle: String(detail.cycle ?? 1),
      scopeType: String(detail.scopeType ?? 1),
      periodStart: pStart || '',
      periodEnd: pEnd || '',
      remark: detail.remark || '',
      selfWeight: String(detail.selfWeight),
      peerWeight: String(detail.peerWeight),
      managerWeight: String(detail.managerWeight),
      peerCount: String(detail.peerCount ?? 3)
    });
    setScopeIds(detail.scopeRef || []);
    setCriteria(
      detail.indicators.map(i => ({
        key: String(keySeq++),
        category: i.category,
        name: i.name,
        weight: String(i.weight),
        maxScore: String(i.maxScore),
        scoringType: i.scoringType
      }))
    );
    if (detail.gradeRules?.length) {
      setGradeRules(
        detail.gradeRules.map(g => ({
          grade: g.grade,
          min: String(g.minScore),
          max: String(g.maxScore),
          description: g.description || ''
        }))
      );
    }
  }, [detail]);

  const updateForm = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const scopeCandidates: { id: number; label: string }[] =
    scopeType === 2
      ? deptOptions.map(d => ({ id: d.id, label: d.name }))
      : scopeType === 3
        ? posOptions.map(p => ({ id: p.id, label: p.departmentName ? `${p.departmentName} - ${p.title}` : p.title }))
        : scopeType === 4
          ? empOptions.map(e => ({ id: e.id, label: e.employeeNo ? `${e.name}（${e.employeeNo}）` : e.name }))
          : [];

  const toggleScope = (id: number) => {
    setScopeIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  const addCriterion = () => {
    setCriteria(prev => [
      ...prev,
      {
        key: String(keySeq++),
        category: 1,
        name: '',
        weight: '',
        maxScore: '100',
        scoringType: 1
      }
    ]);
  };
  const updateCriterion = (key: string, patch: Partial<CriterionForm>) => {
    setCriteria(prev => prev.map(c => (c.key === key ? { ...c, ...patch } : c)));
  };
  const removeCriterion = (key: string) => setCriteria(prev => prev.filter(c => c.key !== key));

  const totalWeight = criteria.reduce((s, c) => s + (Number.parseInt(c.weight) || 0), 0);
  const evalTotalWeight =
    (Number.parseInt(form.selfWeight) || 0) +
    (Number.parseInt(form.peerWeight) || 0) +
    (Number.parseInt(form.managerWeight) || 0);

  const saveMutation = useMutation({
    mutationFn: (payload: PerfPlanSavePayload) => savePerfPlan(payload),
    onSuccess: () => {
      toast({ title: isEdit ? t('方案已更新') : t('方案已建立') });
      navigate('/performance/plans');
    },
    onError: (e: any) => toast({ title: t('儲存失敗'), description: e?.message, variant: 'destructive' })
  });

  const handleSave = () => {
    if (!form.name) {
      toast({ title: t('請填寫方案名稱'), variant: 'destructive' });
      return;
    }
    if (scopeType !== 1 && scopeIds.length === 0) {
      toast({ title: t('請選擇考核範圍對象'), variant: 'destructive' });
      return;
    }
    if (evalTotalWeight !== 100) {
      toast({
        title: t('評分權重總和需為 100%'),
        description: t('目前為 {{n}}%', { n: evalTotalWeight }),
        variant: 'destructive'
      });
      return;
    }
    if (criteria.length === 0) {
      toast({ title: t('請至少新增一個指標'), variant: 'destructive' });
      return;
    }
    if (criteria.some(c => !c.name.trim())) {
      toast({ title: t('指標名稱不可為空'), variant: 'destructive' });
      return;
    }
    if (totalWeight !== 100) {
      toast({
        title: t('指標權重總和需為 100%'),
        description: t('目前為 {{n}}%', { n: totalWeight }),
        variant: 'destructive'
      });
      return;
    }

    const period =
      form.periodStart && form.periodEnd
        ? `${form.periodStart} 至 ${form.periodEnd}`
        : form.periodStart || form.periodEnd || '';
    const scopeNames = scopeType === 1 ? [] : scopeCandidates.filter(c => scopeIds.includes(c.id)).map(c => c.label);

    const payload: PerfPlanSavePayload = {
      id: isEdit ? Number(planId) : undefined,
      name: form.name,
      period,
      cycle: Number(form.cycle),
      scopeType,
      scopeRef: scopeType === 1 ? [] : scopeIds,
      scopeNames,
      selfWeight: Number(form.selfWeight),
      peerWeight: Number(form.peerWeight),
      managerWeight: Number(form.managerWeight),
      peerCount: Number(form.peerCount),
      remark: form.remark,
      indicators: criteria.map((c, i) => ({
        name: c.name,
        category: c.category,
        weight: Number.parseInt(c.weight) || 0,
        maxScore: Number.parseInt(c.maxScore) || 100,
        scoringType: c.scoringType,
        sort: i
      })),
      gradeRules: gradeRules.map((g, i) => ({
        grade: g.grade,
        minScore: Number.parseFloat(g.min) || 0,
        maxScore: Number.parseFloat(g.max) || 0,
        description: g.description,
        sort: i
      }))
    };
    saveMutation.mutate(payload);
  };

  return (
    <div>
      <div className="page-header">
        <Button variant="ghost" size="sm" className="mb-2 -ml-2 text-muted-foreground" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-1" /> {t('返回')}
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title flex items-center gap-2">
              <Target className="h-6 w-6 text-primary" />
              {isEdit ? t('編輯考核方案') : t('新增考核方案')}
            </h1>
            <p className="page-description">{isEdit ? t('修改考核方案的設定與指標') : t('建立新的績效考核方案')}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
              {t('取消')}
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saveMutation.isPending}>
              <Save className="h-4 w-4 mr-1" />
              {isEdit ? t('更新方案') : t('建立方案')}
            </Button>
          </div>
        </div>
      </div>

      {/* 基本资讯 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">{t('基本資訊')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div className="space-y-2 sm:col-span-2 lg:col-span-1">
              <Label>{t('方案名稱')} *</Label>
              <Input
                placeholder={t('例：2026 Q2 績效考核')}
                value={form.name}
                onChange={e => updateForm('name', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('週期類型')} *</Label>
              <Select value={form.cycle} onValueChange={v => updateForm('cycle', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">{t('月度')}</SelectItem>
                  <SelectItem value="1">{t('季度')}</SelectItem>
                  <SelectItem value="2">{t('半年度')}</SelectItem>
                  <SelectItem value="3">{t('年度')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('考核範圍')} *</Label>
              <Select
                value={form.scopeType}
                onValueChange={v => {
                  updateForm('scopeType', v);
                  setScopeIds([]);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">{t('全公司')}</SelectItem>
                  <SelectItem value="2">{t('指定部門')}</SelectItem>
                  <SelectItem value="3">{t('指定職位')}</SelectItem>
                  <SelectItem value="4">{t('手動指定')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('考核開始日期')}</Label>
              <Input type="date" value={form.periodStart} onChange={e => updateForm('periodStart', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t('考核結束日期')}</Label>
              <Input type="date" value={form.periodEnd} onChange={e => updateForm('periodEnd', e.target.value)} />
            </div>
          </div>

          {scopeType !== 1 && (
            <div className="mt-5 space-y-2">
              <Label>{t('選擇對象 *（已選 {{n}} 項）', { n: scopeIds.length })}</Label>
              <div className="max-h-48 overflow-y-auto rounded-lg border p-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                {scopeCandidates.length === 0 ? (
                  <span className="text-sm text-muted-foreground col-span-full py-2">{t('暫無可選對象')}</span>
                ) : (
                  scopeCandidates.map(c => (
                    <label key={c.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox checked={scopeIds.includes(c.id)} onCheckedChange={() => toggleScope(c.id)} />
                      <span className="truncate">{c.label}</span>
                    </label>
                  ))
                )}
              </div>
            </div>
          )}

          <div className="mt-5 space-y-2">
            <Label>{t('方案說明')}</Label>
            <Textarea
              rows={2}
              placeholder={t('描述此考核方案的目的與範圍...')}
              value={form.remark}
              onChange={e => updateForm('remark', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* 权重配置 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">{t('評分權重配置')}</CardTitle>
          <CardDescription>
            {t('自評、互評、主管評的權重比例，總和需為 100%')}
            {evalTotalWeight !== 100 && (
              <span className="text-destructive ml-2">{t('（目前 {{n}}%）', { n: evalTotalWeight })}</span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
            <div className="space-y-2">
              <Label>{t('員工自評 (%)')}</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={form.selfWeight}
                onChange={e => updateForm('selfWeight', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('同事互評 (%)')}</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={form.peerWeight}
                onChange={e => updateForm('peerWeight', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('主管評價 (%)')}</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={form.managerWeight}
                onChange={e => updateForm('managerWeight', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('互評者人數')}</Label>
              <Input
                type="number"
                min="1"
                max="20"
                value={form.peerCount}
                onChange={e => updateForm('peerCount', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 等级评定规则 */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{t('等級評定規則')}</CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setGradeRules(prev => [...prev, { grade: '', min: '', max: '', description: '' }])}
            >
              <Plus className="h-4 w-4 mr-1" />
              {t('新增等級')}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">{t('等級')}</TableHead>
                <TableHead className="w-28">{t('最低分')}</TableHead>
                <TableHead className="w-28">{t('最高分')}</TableHead>
                <TableHead>{t('說明')}</TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {gradeRules.map((rule, idx) => (
                <TableRow key={idx}>
                  <TableCell>
                    <Input
                      value={rule.grade}
                      className="w-16"
                      onChange={e =>
                        setGradeRules(prev => prev.map((r, i) => (i === idx ? { ...r, grade: e.target.value } : r)))
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={rule.min}
                      className="w-20"
                      onChange={e =>
                        setGradeRules(prev => prev.map((r, i) => (i === idx ? { ...r, min: e.target.value } : r)))
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={rule.max}
                      className="w-20"
                      onChange={e =>
                        setGradeRules(prev => prev.map((r, i) => (i === idx ? { ...r, max: e.target.value } : r)))
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={rule.description}
                      onChange={e =>
                        setGradeRules(prev =>
                          prev.map((r, i) => (i === idx ? { ...r, description: e.target.value } : r))
                        )
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setGradeRules(prev => prev.filter((_, i) => i !== idx))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 考核指标 */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">
                {t('考核指標（共 {{count}} 項，總權重 {{weight}}%）', { count: criteria.length, weight: totalWeight })}
                {totalWeight !== 100 && <span className="text-destructive ml-2">{t('需為 100%')}</span>}
              </CardTitle>
              <CardDescription>{t('設定各考核指標的分類、權重與評分方式')}</CardDescription>
            </div>
            <Button size="sm" variant="outline" onClick={addCriterion}>
              <Plus className="h-4 w-4 mr-1" />
              {t('新增指標')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {criteria.length === 0 && (
              <div className="text-center py-10 text-muted-foreground">
                {t('尚未新增指標，請點擊「新增指標」開始設定')}
              </div>
            )}
            {criteria.map((c, idx) => (
              <div key={c.key} className="rounded-lg border p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-muted-foreground">{t('指標 {{n}}', { n: idx + 1 })}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => removeCriterion(c.key)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">{t('分類')}</Label>
                    <Select
                      value={String(c.category)}
                      onValueChange={v => updateCriterion(c.key, { category: Number(v) as PerfCategory })}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">{t('業績')}</SelectItem>
                        <SelectItem value="2">{t('能力')}</SelectItem>
                        <SelectItem value="3">{t('態度')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5 lg:col-span-2">
                    <Label className="text-xs">{t('指標名稱')} *</Label>
                    <Input
                      className="h-9"
                      placeholder={t('指標名稱')}
                      value={c.name}
                      onChange={e => updateCriterion(c.key, { name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">{t('權重 (%)')}</Label>
                    <Input
                      className="h-9"
                      type="number"
                      min="0"
                      max="100"
                      placeholder={t('權重')}
                      value={c.weight}
                      onChange={e => updateCriterion(c.key, { weight: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">{t('評分方式')}</Label>
                    <Select
                      value={String(c.scoringType)}
                      onValueChange={v => updateCriterion(c.key, { scoringType: Number(v) as PerfScoringType })}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">{t('打分')}</SelectItem>
                        <SelectItem value="2">{t('是否')}</SelectItem>
                        <SelectItem value="3">{t('量表')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2 pb-8">
        <Button variant="outline" onClick={() => navigate(-1)}>
          {t('取消')}
        </Button>
        <Button onClick={handleSave} disabled={saveMutation.isPending}>
          <Save className="h-4 w-4 mr-1" />
          {isEdit ? t('更新方案') : t('建立方案')}
        </Button>
      </div>
    </div>
  );
}
