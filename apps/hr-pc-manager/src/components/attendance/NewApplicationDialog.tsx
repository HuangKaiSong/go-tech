import { Paperclip, Send } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const approvalTypes = [
  { value: 'leave', label: '請假申請' },
  { value: 'expense', label: '報銷申請' },
  { value: 'overtime', label: '加班申請' },
  { value: 'travel', label: '出差申請' },
  { value: 'resignation', label: '離職申請' }
];

interface NewApplicationDialogProps {
  defaultType?: string;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}

export function NewApplicationDialog({ defaultType, onOpenChange, open }: NewApplicationDialogProps) {
  const [newType, setNewType] = useState(defaultType || '');

  useEffect(() => {
    if (open) setNewType(defaultType || '');
  }, [open, defaultType]);

  const handleSubmit = () => {
    toast.success('申請已提交，等待審批');
    onOpenChange(false);
    setNewType('');
  };

  const handleClose = () => {
    onOpenChange(false);
    setNewType('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>新增審批申請</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>申請類型</Label>
            <Select value={newType} onValueChange={setNewType}>
              <SelectTrigger>
                <SelectValue placeholder="選擇申請類型" />
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

          {newType === 'leave' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>假別</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="選擇假別" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="annual">年假</SelectItem>
                      <SelectItem value="sick">病假</SelectItem>
                      <SelectItem value="personal">事假</SelectItem>
                      <SelectItem value="marriage">婚假</SelectItem>
                      <SelectItem value="maternity">產假</SelectItem>
                      <SelectItem value="paternity">陪產假</SelectItem>
                      <SelectItem value="bereavement">喪假</SelectItem>
                      <SelectItem value="official">公假</SelectItem>
                      <SelectItem value="compensatory">補休</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>時長（天）</Label>
                  <Input type="number" placeholder="請輸入天數" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>開始日期</Label>
                  <Input type="date" />
                </div>
                <div className="space-y-2">
                  <Label>結束日期</Label>
                  <Input type="date" />
                </div>
              </div>
            </>
          )}

          {newType === 'expense' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>報銷類型</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="選擇類型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="travel">差旅費</SelectItem>
                      <SelectItem value="transport">交通費</SelectItem>
                      <SelectItem value="meal">餐費</SelectItem>
                      <SelectItem value="office">辦公用品</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>金額</Label>
                  <Input type="number" placeholder="NT$" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>發生日期</Label>
                <Input type="date" />
              </div>
            </>
          )}

          {newType === 'overtime' && (
            <>
              <div className="space-y-2">
                <Label>加班日期</Label>
                <Input type="date" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>開始時間</Label>
                  <Input type="time" />
                </div>
                <div className="space-y-2">
                  <Label>結束時間</Label>
                  <Input type="time" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>加班類型</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="選擇類型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekday">工作日</SelectItem>
                    <SelectItem value="weekend">週末</SelectItem>
                    <SelectItem value="holiday">節假日</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {newType === 'travel' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>目的地城市</Label>
                  <Input placeholder="如：上海" />
                </div>
                <div className="space-y-2">
                  <Label>國家</Label>
                  <Input placeholder="如：中國" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>開始日期</Label>
                  <Input type="date" />
                </div>
                <div className="space-y-2">
                  <Label>結束日期</Label>
                  <Input type="date" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>預算（NT$）</Label>
                <Input type="number" placeholder="預估預算" />
              </div>
            </>
          )}

          {newType === 'resignation' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>離職類型</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="選擇類型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="voluntary">自願離職</SelectItem>
                      <SelectItem value="retirement">退休</SelectItem>
                      <SelectItem value="contract">合約到期</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>預計離職日</Label>
                  <Input type="date" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>最後工作日</Label>
                <Input type="date" />
              </div>
              <div className="space-y-2">
                <Label>是否願意接受慰留</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="請選擇" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">是</SelectItem>
                    <SelectItem value="no">否</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {newType && (
            <>
              <div className="space-y-2">
                <Label>事由說明</Label>
                <Textarea placeholder="請輸入申請事由..." />
              </div>
              <div className="space-y-2">
                <Label>附件</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-4 text-center text-muted-foreground text-sm cursor-pointer hover:border-primary/50 transition-colors">
                  <Paperclip className="h-5 w-5 mx-auto mb-1" />
                  點擊或拖拽上傳附件
                </div>
              </div>
              <div className="space-y-2">
                <Label>備註</Label>
                <Input placeholder="選填" />
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            取消
          </Button>
          <Button disabled={!newType} onClick={handleSubmit}>
            <Send className="h-4 w-4 mr-2" />
            提交申請
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
