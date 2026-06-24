import { ArrowLeft, Briefcase, DollarSign, Gift, type LucideIcon, Plus, Save, Shield, Trash2 } from 'lucide-react';
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
import { mockPlans } from './PayrollStructure';

type ItemCategory = 'deduction' | 'earning';
type ItemType = 'fixed' | 'percentage';

interface SalaryItem {
  category: ItemCategory;
  description: string;
  id: string;
  name: string;
  type: ItemType;
  value: number;
}

const defaultItems: SalaryItem[] = [
  { id: '1', name: '交通補助', type: 'fixed', category: 'earning', value: 2000, description: '每月固定交通補助' },
  { id: '2', name: '伙食津貼', type: 'fixed', category: 'earning', value: 2400, description: '每月固定伙食津貼' },
  {
    id: '3',
    name: '勞保',
    type: 'percentage',
    category: 'deduction',
    value: 11,
    description: '勞工保險費用（雇主+員工）'
  },
  { id: '4', name: '健保', type: 'percentage', category: 'deduction', value: 5.17, description: '全民健康保險費' },
  { id: '5', name: '勞退提撥', type: 'percentage', category: 'deduction', value: 6, description: '勞工退休金提撥' }
];

const CURRENCIES = [
  { value: 'TWD', label: 'TWD - 新台幣' },
  { value: 'USD', label: 'USD - 美元' },
  { value: 'CNY', label: 'CNY - 人民幣' },
  { value: 'JPY', label: 'JPY - 日圓' },
  { value: 'EUR', label: 'EUR - 歐元' },
  { value: 'GBP', label: 'GBP - 英鎊' },
  { value: 'HKD', label: 'HKD - 港幣' },
  { value: 'SGD', label: 'SGD - 新加坡幣' }
];

const OVERTIME_BASES = [
  { value: 'hourly', label: '時薪制' },
  { value: 'daily', label: '日薪制' },
  { value: 'monthly', label: '月薪制' }
];

const fmt = (n: number) => n.toLocaleString();

interface SalaryItemRowProps {
  currency: string;
  item: SalaryItem;
  onChange: (id: string, key: keyof SalaryItem, value: string | number) => void;
  onRemove: (id: string) => void;
}

const SalaryItemRow = ({ currency, item, onChange, onRemove }: SalaryItemRowProps) => (
  <div className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/30">
    <div className="flex-1 grid grid-cols-3 gap-3">
      <div className="space-y-1">
        <Label className="text-xs">項目名稱</Label>
        <Input
          value={item.name}
          onChange={e => onChange(item.id, 'name', e.target.value)}
          placeholder="項目名稱"
          className="h-9"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">類型</Label>
        <Select value={item.type} onValueChange={v => onChange(item.id, 'type', v)}>
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="fixed">固定金額</SelectItem>
            <SelectItem value="percentage">百分比</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">{item.type === 'fixed' ? `金額（${currency}）` : '百分比（%）'}</Label>
        <Input
          type="number"
          value={item.value}
          onChange={e => onChange(item.id, 'value', Number(e.target.value))}
          className="h-9"
        />
      </div>
    </div>
    <Button
      variant="ghost"
      size="icon"
      className="h-9 w-9 text-muted-foreground hover:text-destructive shrink-0 mt-5"
      onClick={() => onRemove(item.id)}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  </div>
);

interface SalaryItemSectionProps {
  addLabel: string;
  category: ItemCategory;
  currency: string;
  emptyText: string;
  icon: LucideIcon;
  iconClassName: string;
  items: SalaryItem[];
  onAdd: (category: ItemCategory) => void;
  onChange: (id: string, key: keyof SalaryItem, value: string | number) => void;
  onRemove: (id: string) => void;
  title: string;
}

const SalaryItemSection = ({
  addLabel,
  category,
  currency,
  emptyText,
  icon: Icon,
  iconClassName,
  items,
  onAdd,
  onChange,
  onRemove,
  title
}: SalaryItemSectionProps) => (
  <Card>
    <CardHeader className="pb-3">
      <div className="flex items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <Icon className={`h-4 w-4 ${iconClassName}`} />
          {title}
        </CardTitle>
        <Button variant="outline" size="sm" onClick={() => onAdd(category)}>
          <Plus className="h-3.5 w-3.5 mr-1" />
          {addLabel}
        </Button>
      </div>
    </CardHeader>
    <CardContent>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">{emptyText}</p>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <SalaryItemRow key={item.id} item={item} currency={currency} onChange={onChange} onRemove={onRemove} />
          ))}
        </div>
      )}
    </CardContent>
  </Card>
);

interface PreviewRowProps {
  currency: string;
  item: SalaryItem;
}

const PreviewRow = ({ currency, item }: PreviewRowProps) => (
  <div className="flex justify-between text-sm">
    <span className="text-muted-foreground">{item.name || '未命名'}</span>
    <span className="text-foreground">
      {item.type === 'fixed' ? `${currency} ${fmt(item.value)}` : `${item.value}%`}
    </span>
  </div>
);

type ExistingPlan = (typeof mockPlans)[number] | null | undefined;

const buildInitialForm = (plan: ExistingPlan) => ({
  name: plan?.name ?? '',
  code: plan?.code ?? '',
  currency: 'HKD',
  baseSalaryMin: plan?.baseSalaryMin?.toString() ?? '',
  baseSalaryMax: plan?.baseSalaryMax?.toString() ?? '',
  applicable: plan?.applicable ?? '',
  description: plan?.description ?? '',
  probationRatio: '80',
  overtimeBase: 'hourly',
  includeBonus: true
});

export default function PayrollPlanForm() {
  const { planId } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(planId);
  const existingPlan = isEdit ? mockPlans.find(p => p.id === planId) : null;

  const [form, setForm] = useState(() => buildInitialForm(existingPlan));

  const [items, setItems] = useState<SalaryItem[]>(defaultItems);

  const updateForm = (key: string, value: string | boolean) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const addItem = (category: ItemCategory) => {
    setItems(prev => [
      ...prev,
      { id: Date.now().toString(), name: '', type: 'fixed', category, value: 0, description: '' }
    ]);
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const updateItem = (id: string, key: keyof SalaryItem, value: string | number) => {
    setItems(prev => prev.map(i => (i.id === id ? { ...i, [key]: value } : i)));
  };

  const handleSave = () => {
    if (!form.name || !form.code) {
      toast.error('請填寫方案名稱與代碼');
      return;
    }
    toast.success(isEdit ? `已更新方案「${form.name}」` : `已建立方案「${form.name}」`);
    navigate('/payroll/structure');
  };

  const earnings = items.filter(i => i.category === 'earning');
  const deductions = items.filter(i => i.category === 'deduction');
  const baseSalaryText =
    form.baseSalaryMin && form.baseSalaryMax
      ? `${fmt(Number(form.baseSalaryMin))} ~ ${fmt(Number(form.baseSalaryMax))}`
      : '—';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/payroll/structure')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{isEdit ? '編輯薪資方案' : '新增薪資方案'}</h1>
            <p className="text-muted-foreground mt-0.5 text-sm">
              {isEdit ? `編輯方案 ${existingPlan?.name}` : '設定薪資結構與項目'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/payroll/structure')}>
            取消
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            儲存方案
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-primary" />
                基本資訊
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>
                    方案名稱 <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={form.name}
                    onChange={e => updateForm('name', e.target.value)}
                    placeholder="如：技術職等 A"
                  />
                </div>
                <div className="space-y-2">
                  <Label>
                    方案代碼 <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={form.code}
                    onChange={e => updateForm('code', e.target.value)}
                    placeholder="如：TECH-A"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>方案說明</Label>
                <Textarea
                  value={form.description}
                  onChange={e => updateForm('description', e.target.value)}
                  placeholder="描述此方案的適用範圍與特點..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>適用對象</Label>
                  <Input
                    value={form.applicable}
                    onChange={e => updateForm('applicable', e.target.value)}
                    placeholder="如：高級工程師"
                  />
                </div>
                <div className="space-y-2">
                  <Label>薪資幣別</Label>
                  <Select value={form.currency} onValueChange={v => updateForm('currency', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map(c => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" />
                薪資範圍
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>最低基本薪資（{form.currency}）</Label>
                  <Input
                    type="number"
                    value={form.baseSalaryMin}
                    onChange={e => updateForm('baseSalaryMin', e.target.value)}
                    placeholder="30000"
                  />
                </div>
                <div className="space-y-2">
                  <Label>最高基本薪資（{form.currency}）</Label>
                  <Input
                    type="number"
                    value={form.baseSalaryMax}
                    onChange={e => updateForm('baseSalaryMax', e.target.value)}
                    placeholder="80000"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>試用期薪資比例（%）</Label>
                  <Input
                    type="number"
                    value={form.probationRatio}
                    onChange={e => updateForm('probationRatio', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>加班費計算基準</Label>
                  <Select value={form.overtimeBase} onValueChange={v => updateForm('overtimeBase', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {OVERTIME_BASES.map(o => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <SalaryItemSection
            title="加項（津貼/補助）"
            addLabel="新增加項"
            emptyText="尚未設定加項"
            icon={Gift}
            iconClassName="text-success"
            category="earning"
            items={earnings}
            currency={form.currency}
            onAdd={addItem}
            onChange={updateItem}
            onRemove={removeItem}
          />

          <SalaryItemSection
            title="減項（扣除/保險）"
            addLabel="新增減項"
            emptyText="尚未設定減項"
            icon={Shield}
            iconClassName="text-warning"
            category="deduction"
            items={deductions}
            currency={form.currency}
            onAdd={addItem}
            onChange={updateItem}
            onRemove={removeItem}
          />
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">方案預覽</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">基本薪資</span>
                  <span className="font-medium text-foreground">{baseSalaryText}</span>
                </div>
                <Separator />
                <p className="text-xs font-medium text-success">加項</p>
                {earnings.map(i => (
                  <PreviewRow key={i.id} item={i} currency={form.currency} />
                ))}
                <Separator />
                <p className="text-xs font-medium text-warning">減項</p>
                {deductions.map(i => (
                  <PreviewRow key={i.id} item={i} currency={form.currency} />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">其他設定</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">含年終獎金</p>
                  <p className="text-xs text-muted-foreground">是否適用年終獎金計算</p>
                </div>
                <Switch checked={form.includeBonus} onCheckedChange={v => updateForm('includeBonus', v)} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
