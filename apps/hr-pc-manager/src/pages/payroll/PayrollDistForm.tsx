import { ArrowLeft, DollarSign, Save, Search, Send } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { mockDistEmployees, mockDistRecords } from './PayrollDistribute';

const months = ['2026年03月', '2026年02月', '2026年01月', '2025年12月', '2025年11月', '2025年10月'];

const payMethods = ['銀行轉帳', '現金', '支票'];
const banks = ['匯豐銀行', '恒生銀行', '中銀香港', '渣打銀行', '東亞銀行', '花旗銀行'];

export default function PayrollDistForm() {
  const { distId } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(distId);
  const existing = isEdit ? mockDistRecords.find(r => r.id === distId) : null;

  const [form, setForm] = useState({
    period: existing?.period || months[0],
    payDate: existing?.payDate || '2026-03-28',
    payMethod: existing?.payMethod || '銀行轉帳',
    bankName: existing?.bankName || '匯豐銀行',
    note: existing?.note || ''
  });

  const [employees, setEmployees] = useState(mockDistEmployees.map(e => ({ ...e, selected: true })));
  const [search, setSearch] = useState('');

  const filtered = employees.filter(
    e =>
      e.name.includes(search) ||
      e.employeeId.toLowerCase().includes(search.toLowerCase()) ||
      e.department.includes(search)
  );

  const selectedCount = employees.filter(e => e.selected).length;
  const totalNet = employees.filter(e => e.selected).reduce((s, e) => s + e.netSalary, 0);

  const toggleAll = (checked: boolean) => {
    setEmployees(prev => prev.map(e => ({ ...e, selected: checked })));
  };

  const toggleOne = (id: string) => {
    setEmployees(prev => prev.map(e => (e.id === id ? { ...e, selected: !e.selected } : e)));
  };

  const handleSave = () => {
    toast.success(isEdit ? '發薪批次已更新' : '發薪批次已建立');
    navigate('/payroll/distribute');
  };

  const handleSaveAndSubmit = () => {
    toast.success('已儲存並提交審核');
    navigate('/payroll/distribute');
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{isEdit ? '編輯發薪批次' : '新增發薪批次'}</h1>
            <p className="text-muted-foreground mt-1">
              {isEdit ? `編輯 ${existing?.period} 的發薪資料` : '建立新的發薪批次並設定發放資訊'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(-1)}>
            取消
          </Button>
          <Button variant="outline" className="gap-2" onClick={handleSave}>
            <Save className="h-4 w-4" /> 儲存草稿
          </Button>
          <Button className="gap-2" onClick={handleSaveAndSubmit}>
            <Send className="h-4 w-4" /> 儲存並提交審核
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left - Settings */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">發薪設定</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>薪資期間</Label>
                <Select value={form.period} onValueChange={v => setForm(p => ({ ...p, period: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map(m => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>發薪日期</Label>
                <Input
                  type="date"
                  value={form.payDate}
                  onChange={e => setForm(p => ({ ...p, payDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>發薪方式</Label>
                <Select
                  value={form.payMethod}
                  onValueChange={(v: '支票' | '現金' | '銀行轉帳') => setForm(p => ({ ...p, payMethod: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {payMethods.map(m => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {form.payMethod === '銀行轉帳' && (
                <div className="space-y-2">
                  <Label>發薪銀行</Label>
                  <Select value={form.bankName} onValueChange={v => setForm(p => ({ ...p, bankName: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {banks.map(b => (
                        <SelectItem key={b} value={b}>
                          {b}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label>備註</Label>
                <Textarea
                  value={form.note}
                  onChange={e => setForm(p => ({ ...p, note: e.target.value }))}
                  placeholder="輸入備註..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-primary" />
                <span className="font-semibold text-foreground">發薪摘要</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">發薪期間</span>
                  <span className="font-medium">{form.period}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">發薪日期</span>
                  <span className="font-medium">{form.payDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">發薪方式</span>
                  <span className="font-medium">{form.payMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">選取人數</span>
                  <span className="font-medium">
                    {selectedCount} / {employees.length} 人
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold text-base">
                  <span>實發總額</span>
                  <span className="text-primary">HK$ {totalNet.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right - Employee Table */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">發薪人員名單</CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="搜尋員工..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-9 h-9"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={employees.every(e => e.selected)}
                        onCheckedChange={c => toggleAll(Boolean(c))}
                      />
                    </TableHead>
                    <TableHead>員工</TableHead>
                    <TableHead>部門</TableHead>
                    <TableHead>職位</TableHead>
                    <TableHead>銀行</TableHead>
                    <TableHead>帳號</TableHead>
                    <TableHead className="text-right">實發金額</TableHead>
                    <TableHead>狀態</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(emp => (
                    <TableRow key={emp.id} className={!emp.selected ? 'opacity-50' : ''}>
                      <TableCell>
                        <Checkbox checked={emp.selected} onCheckedChange={() => toggleOne(emp.id)} />
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{emp.name}</p>
                          <p className="text-xs text-muted-foreground">{emp.employeeId}</p>
                        </div>
                      </TableCell>
                      <TableCell>{emp.department}</TableCell>
                      <TableCell>{emp.position}</TableCell>
                      <TableCell>{emp.bankName}</TableCell>
                      <TableCell className="font-mono text-muted-foreground">{emp.bankAccount}</TableCell>
                      <TableCell className="text-right font-semibold">{emp.netSalary.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            emp.selected
                              ? 'bg-success/10 text-success border-success/20'
                              : 'bg-muted text-muted-foreground border-border'
                          }
                        >
                          {emp.selected ? '已選取' : '未選取'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
