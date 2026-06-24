import { ArrowLeft, Plus, Save, Target, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';

interface CriterionForm {
  category: string;
  description: string;
  id: string;
  name: string;
  scoringMethod: string;
  weight: string;
}

interface GradeRule {
  description: string;
  grade: string;
  max: string;
  min: string;
}

const defaultGradeRules: GradeRule[] = [
  { grade: 'A+', min: '95', max: '100', description: '卓越表現' },
  { grade: 'A', min: '90', max: '94', description: '優秀' },
  { grade: 'B+', min: '85', max: '89', description: '良好' },
  { grade: 'B', min: '80', max: '84', description: '合格' },
  { grade: 'C', min: '70', max: '79', description: '需改進' },
  { grade: 'D', min: '0', max: '69', description: '不合格' }
];

const existingCriteria: CriterionForm[] = [
  {
    id: '1',
    category: '工作業績',
    name: '專案交付達成率',
    weight: '25',
    description: '按時按質完成所負責專案的比率',
    scoringMethod: '目標達成率計算'
  },
  {
    id: '2',
    category: '工作業績',
    name: '代碼品質與技術債務',
    weight: '20',
    description: '代碼審查通過率、bug 修復速度及技術債務清理',
    scoringMethod: '量化指標評分'
  },
  {
    id: '3',
    category: '工作能力',
    name: '團隊協作與溝通',
    weight: '20',
    description: '跨部門協作效率、知識分享及溝通能力',
    scoringMethod: '360度回饋評分'
  },
  {
    id: '4',
    category: '工作能力',
    name: '問題解決與創新',
    weight: '15',
    description: '面對技術難題的解決能力及創新貢獻',
    scoringMethod: '案例評估'
  },
  {
    id: '5',
    category: '工作態度',
    name: '工作積極性與責任感',
    weight: '10',
    description: '工作主動性、責任心及對團隊目標的貢獻',
    scoringMethod: '行為觀察評分'
  },
  {
    id: '6',
    category: '工作態度',
    name: '學習成長與自我提升',
    weight: '10',
    description: '專業技能提升、學習計畫執行及職業發展',
    scoringMethod: '成果記錄評估'
  }
];

let nextId = 100;

function buildInitialForm(isEdit: boolean) {
  return {
    name: isEdit ? '2026 Q1 績效考核' : '',
    cycle: isEdit ? '季度' : '',
    scope: isEdit ? '全公司' : '',
    periodStart: isEdit ? '2026-01-01' : '',
    periodEnd: isEdit ? '2026-03-31' : '',
    description: isEdit ? '2026年第一季度全公司績效考核方案，涵蓋工作業績、工作能力和工作態度三大維度。' : '',
    selfWeight: '20',
    peerWeight: '30',
    managerWeight: '50',
    selfDeadline: isEdit ? '2026-03-25' : '',
    peerDeadline: isEdit ? '2026-03-28' : '',
    managerDeadline: isEdit ? '2026-03-31' : ''
  };
}

export default function PerformancePlanForm() {
  const { planId } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(planId);

  const [form, setForm] = useState(buildInitialForm(isEdit));

  const [criteria, setCriteria] = useState<CriterionForm[]>(isEdit ? existingCriteria : []);
  const [gradeRules, setGradeRules] = useState<GradeRule[]>(defaultGradeRules);

  const updateForm = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const addCriterion = () => {
    setCriteria(prev => [
      ...prev,
      {
        id: String((nextId += 1)),
        category: '工作業績',
        name: '',
        weight: '',
        description: '',
        scoringMethod: '量化指標評分'
      }
    ]);
  };

  const updateCriterion = (id: string, key: keyof CriterionForm, value: string) => {
    setCriteria(prev => prev.map(c => (c.id === id ? { ...c, [key]: value } : c)));
  };

  const removeCriterion = (id: string) => {
    setCriteria(prev => prev.filter(c => c.id !== id));
  };

  const totalWeight = criteria.reduce((s, c) => s + (Number.parseInt(c.weight, 10) || 0), 0);
  const evalTotalWeight =
    (Number.parseInt(form.selfWeight, 10) || 0) +
    (Number.parseInt(form.peerWeight, 10) || 0) +
    (Number.parseInt(form.managerWeight, 10) || 0);

  const handleSave = (asDraft: boolean) => {
    if (!form.name || !form.cycle || !form.periodStart || !form.periodEnd) {
      toast({ title: '請填寫必填欄位', variant: 'destructive' });
      return;
    }
    if (totalWeight !== 100) {
      toast({ title: '指標權重總和需為 100%', description: `目前為 ${totalWeight}%`, variant: 'destructive' });
      return;
    }
    if (evalTotalWeight !== 100) {
      toast({ title: '評分權重總和需為 100%', description: `目前為 ${evalTotalWeight}%`, variant: 'destructive' });
      return;
    }
    toast({
      title: asDraft ? '已儲存為草稿' : '方案已儲存',
      description: `考核方案「${form.name}」已成功${isEdit ? '更新' : '建立'}`
    });
    navigate('/performance/plans');
  };

  return (
    <div>
      <div className="page-header">
        <Button variant="ghost" size="sm" className="mb-2 -ml-2 text-muted-foreground" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-1" /> 返回
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title flex items-center gap-2">
              <Target className="h-6 w-6 text-primary" />
              {isEdit ? '編輯考核方案' : '新增考核方案'}
            </h1>
            <p className="page-description">{isEdit ? '修改考核方案的設定與指標' : '建立新的績效考核方案'}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
              取消
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleSave(true)}>
              儲存草稿
            </Button>
            <Button size="sm" onClick={() => handleSave(false)}>
              <Save className="h-4 w-4 mr-1" />
              {isEdit ? '更新方案' : '建立方案'}
            </Button>
          </div>
        </div>
      </div>

      {/* Basic Info */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">基本資訊</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div className="space-y-2 sm:col-span-2 lg:col-span-1">
              <Label>方案名稱 *</Label>
              <Input
                placeholder="例：2026 Q2 績效考核"
                value={form.name}
                onChange={e => updateForm('name', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>週期類型 *</Label>
              <Select value={form.cycle} onValueChange={v => updateForm('cycle', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="選擇週期" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="月度">月度</SelectItem>
                  <SelectItem value="季度">季度</SelectItem>
                  <SelectItem value="半年度">半年度</SelectItem>
                  <SelectItem value="年度">年度</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>考核範圍</Label>
              <Select value={form.scope} onValueChange={v => updateForm('scope', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="選擇範圍" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="全公司">全公司</SelectItem>
                  <SelectItem value="技術部">技術部</SelectItem>
                  <SelectItem value="銷售部">銷售部</SelectItem>
                  <SelectItem value="人事部">人事部</SelectItem>
                  <SelectItem value="市場部">市場部</SelectItem>
                  <SelectItem value="財務部">財務部</SelectItem>
                  <SelectItem value="管理層">管理層</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>考核開始日期 *</Label>
              <Input type="date" value={form.periodStart} onChange={e => updateForm('periodStart', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>考核結束日期 *</Label>
              <Input type="date" value={form.periodEnd} onChange={e => updateForm('periodEnd', e.target.value)} />
            </div>
          </div>
          <div className="mt-5 space-y-2">
            <Label>方案說明</Label>
            <Textarea
              rows={3}
              placeholder="描述此考核方案的目的與範圍..."
              value={form.description}
              onChange={e => updateForm('description', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Weight Config */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">評分權重配置</CardTitle>
          <CardDescription>
            自評、互評、主管評的權重比例，總和需為 100%
            {evalTotalWeight !== 100 && <span className="text-destructive ml-2">（目前 {evalTotalWeight}%）</span>}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="space-y-2">
              <Label>員工自評 (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={form.selfWeight}
                onChange={e => updateForm('selfWeight', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>同事互評 (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={form.peerWeight}
                onChange={e => updateForm('peerWeight', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>主管評價 (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={form.managerWeight}
                onChange={e => updateForm('managerWeight', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deadlines */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">時間節點</CardTitle>
          <CardDescription>各評估階段的截止時間</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="space-y-2">
              <Label>自評截止日期</Label>
              <Input type="date" value={form.selfDeadline} onChange={e => updateForm('selfDeadline', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>互評截止日期</Label>
              <Input type="date" value={form.peerDeadline} onChange={e => updateForm('peerDeadline', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>主管評價截止日期</Label>
              <Input
                type="date"
                value={form.managerDeadline}
                onChange={e => updateForm('managerDeadline', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grade Rules */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">等級評定規則</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">等級</TableHead>
                <TableHead className="w-28">最低分</TableHead>
                <TableHead className="w-28">最高分</TableHead>
                <TableHead>說明</TableHead>
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Criteria */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">
                考核指標（共 {criteria.length} 項，總權重 {totalWeight}%）
                {totalWeight !== 100 && <span className="text-destructive ml-2">需為 100%</span>}
              </CardTitle>
              <CardDescription>設定各考核指標的分類、權重與評分方式</CardDescription>
            </div>
            <Button size="sm" variant="outline" onClick={addCriterion}>
              <Plus className="h-4 w-4 mr-1" />
              新增指標
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {criteria.length === 0 && (
              <div className="text-center py-10 text-muted-foreground">尚未新增指標，請點擊「新增指標」開始設定</div>
            )}
            {criteria.map((c, idx) => (
              <div key={c.id} className="rounded-lg border p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-muted-foreground">指標 {idx + 1}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => removeCriterion(c.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">分類</Label>
                    <Select value={c.category} onValueChange={v => updateCriterion(c.id, 'category', v)}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="工作業績">工作業績</SelectItem>
                        <SelectItem value="工作能力">工作能力</SelectItem>
                        <SelectItem value="工作態度">工作態度</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">指標名稱 *</Label>
                    <Input
                      className="h-9"
                      placeholder="指標名稱"
                      value={c.name}
                      onChange={e => updateCriterion(c.id, 'name', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">權重 (%)</Label>
                    <Input
                      className="h-9"
                      type="number"
                      min="0"
                      max="100"
                      placeholder="權重"
                      value={c.weight}
                      onChange={e => updateCriterion(c.id, 'weight', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">評分方式</Label>
                    <Select value={c.scoringMethod} onValueChange={v => updateCriterion(c.id, 'scoringMethod', v)}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="量化指標評分">量化指標評分</SelectItem>
                        <SelectItem value="目標達成率計算">目標達成率計算</SelectItem>
                        <SelectItem value="360度回饋評分">360度回饋評分</SelectItem>
                        <SelectItem value="案例評估">案例評估</SelectItem>
                        <SelectItem value="行為觀察評分">行為觀察評分</SelectItem>
                        <SelectItem value="成果記錄評估">成果記錄評估</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="mt-3 space-y-1.5">
                  <Label className="text-xs">指標說明</Label>
                  <Input
                    className="h-9"
                    placeholder="描述此指標的衡量標準"
                    value={c.description}
                    onChange={e => updateCriterion(c.id, 'description', e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bottom Actions */}
      <div className="flex justify-end gap-2 pb-8">
        <Button variant="outline" onClick={() => navigate(-1)}>
          取消
        </Button>
        <Button variant="outline" onClick={() => handleSave(true)}>
          儲存草稿
        </Button>
        <Button onClick={() => handleSave(false)}>
          <Save className="h-4 w-4 mr-1" />
          {isEdit ? '更新方案' : '建立方案'}
        </Button>
      </div>
    </div>
  );
}
