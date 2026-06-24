import {
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@go-tech-frontend/ui';
import { Gift, Plus } from 'lucide-react';
import { useState } from 'react';

interface PromotionForm {
  active: boolean;
  dateRange: string;
  diamondChecked: boolean;
  diamondDiscount: string;
  goldChecked: boolean;
  goldDiscount: string;
  name: string;
  platinumChecked: boolean;
  platinumDiscount: string;
  target: string;
  type: string;
}

const defaultForm: PromotionForm = {
  name: '',
  type: '套餐優惠/滿減優惠/增值服務優惠',
  goldChecked: false,
  goldDiscount: '',
  platinumChecked: false,
  platinumDiscount: '',
  diamondChecked: false,
  diamondDiscount: '',
  target: '',
  dateRange: '',
  active: true
};

const mockPromotions = [
  {
    id: 'NOV_1',
    createdAt: '12/08/2025',
    name: '春季優惠',
    type: '套餐優惠',
    info: ['黃金套餐 20%OFF', '白金套餐 30%OFF'],
    target: '註冊會員',
    startDate: '12/08/2025',
    endDate: '12/08/2025',
    active: true
  },
  {
    id: 'NOV_2',
    createdAt: '12/08/2025',
    name: '夏季優惠',
    type: '套餐優惠',
    info: ['滿1000減100'],
    target: '所有會員',
    startDate: '12/09/2025',
    endDate: '12/08/2025',
    active: true
  },
  {
    id: 'NOV_3',
    createdAt: '12/08/2025',
    name: '春季優惠',
    type: '套餐優惠',
    info: ['黃金套餐 20%OFF', '白金套餐 30%OFF'],
    target: '註冊會員',
    startDate: '12/08/2025',
    endDate: '12/08/2025',
    active: true
  },
  {
    id: 'NOV_4',
    createdAt: '12/08/2025',
    name: '夏季優惠',
    type: '套餐優惠',
    info: ['滿1000減100'],
    target: '所有會員',
    startDate: '12/09/2025',
    endDate: '12/08/2025',
    active: false
  },
  {
    id: 'NOV_1',
    createdAt: '12/08/2025',
    name: '春季優惠',
    type: '套餐優惠',
    info: ['黃金套餐 20%OFF', '白金套餐 30%OFF'],
    target: '註冊會員',
    startDate: '12/08/2025',
    endDate: '12/08/2025',
    active: true
  }
];

const PromotionsPage = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<PromotionForm>(defaultForm);

  const handleOpenAdd = () => {
    setForm(defaultForm);
    setIsEditing(false);
    setDialogOpen(true);
  };

  const handleOpenEdit = (promo: (typeof mockPromotions)[0]) => {
    setForm({
      name: promo.name,
      type: promo.type,
      goldChecked: promo.info.some(i => i.includes('黃金')),
      goldDiscount: promo.info.find(i => i.includes('黃金'))?.match(/\d+/)?.[0] || '',
      platinumChecked: promo.info.some(i => i.includes('白金')),
      platinumDiscount: promo.info.find(i => i.includes('白金'))?.match(/\d+/)?.[0] || '',
      diamondChecked: promo.info.some(i => i.includes('鑽石')),
      diamondDiscount: promo.info.find(i => i.includes('鑽石'))?.match(/\d+/)?.[0] || '',
      target: promo.target,
      dateRange: '',
      active: promo.active
    });
    setIsEditing(true);
    setDialogOpen(true);
  };

  const handleSave = () => {
    setDialogOpen(false);
  };

  const handleConfirm = () => {
    setDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Gift className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">
            優惠管理/<span className="text-primary">優惠活動</span>
          </h1>
        </div>
        <Button className="bg-primary hover:bg-primary/90" onClick={handleOpenAdd}>
          <Plus className="w-4 h-4 mr-2" />
          新增活動
        </Button>
      </div>

      {/* Table */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-center font-medium">創建時間</TableHead>
              <TableHead className="text-center font-medium">活動編號</TableHead>
              <TableHead className="text-center font-medium">活動名稱</TableHead>
              <TableHead className="text-center font-medium">優惠類型</TableHead>
              <TableHead className="text-center font-medium">優惠信息</TableHead>
              <TableHead className="text-center font-medium">優惠對象</TableHead>
              <TableHead className="text-center font-medium">活動開始日期</TableHead>
              <TableHead className="text-center font-medium">活動結束日期</TableHead>
              <TableHead className="text-center font-medium">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockPromotions.map((promo, index) => (
              <TableRow key={index} className="hover:bg-muted/30">
                <TableCell className="text-center">{promo.createdAt}</TableCell>
                <TableCell className="text-center">{promo.id}</TableCell>
                <TableCell className="text-center">{promo.name}</TableCell>
                <TableCell className="text-center">{promo.type}</TableCell>
                <TableCell className="text-center">
                  {promo.info.map((line, i) => (
                    <div key={i}>{line}</div>
                  ))}
                </TableCell>
                <TableCell className="text-center">{promo.target}</TableCell>
                <TableCell className="text-center">{promo.startDate}</TableCell>
                <TableCell className="text-center">{promo.endDate}</TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Button variant="link" className="text-primary p-0 h-auto text-sm">
                      {promo.active ? '開始活動' : '暫停活動'}
                    </Button>
                    <Button
                      variant="link"
                      className="text-primary p-0 h-auto text-sm"
                      onClick={() => handleOpenEdit(promo)}
                    >
                      編輯
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-125">
          <DialogHeader>
            <DialogTitle className="text-lg font-medium">{isEditing ? '編輯活動' : '新增活动'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* 活動名稱 */}
            <div className="flex items-center gap-4">
              <label className="w-20 text-sm text-muted-foreground text-right shrink-0">活動名稱</label>
              <Input
                placeholder="秋季優惠"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />
            </div>

            {/* 優惠類型 */}
            <div className="flex items-center gap-4">
              <label className="w-20 text-sm text-muted-foreground text-right shrink-0">優惠類型</label>
              <Input
                value={form.type}
                onChange={e => setForm({ ...form, type: e.target.value })}
                className="text-muted-foreground"
              />
            </div>

            {/* 優惠信息 */}
            <div className="flex items-start gap-4">
              <label className="w-20 text-sm text-muted-foreground text-right shrink-0 mt-2">優惠信息</label>
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={form.goldChecked}
                    onCheckedChange={checked => setForm({ ...form, goldChecked: Boolean(checked) })}
                  />
                  <span className="text-sm w-16">黃金套餐</span>
                  <Input
                    className="w-16 text-center"
                    value={form.goldDiscount}
                    onChange={e => setForm({ ...form, goldDiscount: e.target.value })}
                  />
                  <span className="text-sm text-muted-foreground">%OFF</span>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={form.platinumChecked}
                    onCheckedChange={checked => setForm({ ...form, platinumChecked: Boolean(checked) })}
                  />
                  <span className="text-sm w-16">白金套餐</span>
                  <Input
                    className="w-16 text-center"
                    value={form.platinumDiscount}
                    onChange={e => setForm({ ...form, platinumDiscount: e.target.value })}
                  />
                  <span className="text-sm text-muted-foreground">%OFF</span>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={form.diamondChecked}
                    onCheckedChange={checked => setForm({ ...form, diamondChecked: Boolean(checked) })}
                  />
                  <span className="text-sm w-16">鑽石套餐</span>
                  <Input
                    className="w-16 text-center"
                    value={form.diamondDiscount}
                    onChange={e => setForm({ ...form, diamondDiscount: e.target.value })}
                  />
                  <span className="text-sm text-muted-foreground">%OFF</span>
                </div>
              </div>
            </div>

            {/* 優惠對象 */}
            <div className="flex items-center gap-4">
              <label className="w-20 text-sm text-muted-foreground text-right shrink-0">優惠對象</label>
              <Select value={form.target} onValueChange={value => setForm({ ...form, target: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="下拉選擇會員類型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有會員</SelectItem>
                  <SelectItem value="registered">註冊會員</SelectItem>
                  <SelectItem value="gold">黃金會員</SelectItem>
                  <SelectItem value="platinum">白金會員</SelectItem>
                  <SelectItem value="diamond">鑽石會員</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 活動日期 */}
            <div className="flex items-center gap-4">
              <label className="w-20 text-sm text-muted-foreground text-right shrink-0">活動日期</label>
              <Select value={form.dateRange} onValueChange={value => setForm({ ...form, dateRange: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="請選擇" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7days">7天</SelectItem>
                  <SelectItem value="14days">14天</SelectItem>
                  <SelectItem value="30days">30天</SelectItem>
                  <SelectItem value="custom">自訂</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 活動狀態 */}
            <div className="flex items-center gap-4">
              <label className="w-20 text-sm text-muted-foreground text-right shrink-0">活動狀態</label>
              <Switch checked={form.active} onCheckedChange={checked => setForm({ ...form, active: checked })} />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-4">
            <Button
              variant="outline"
              className="flex-1 border-primary text-primary hover:bg-primary/10"
              onClick={handleSave}
            >
              保存
            </Button>
            <Button className="flex-1 bg-primary hover:bg-primary/90" onClick={handleConfirm}>
              確認
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PromotionsPage;
