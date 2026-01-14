import { useState } from "react";
import { Ticket, Plus, Clock, FileText, Calendar, Upload, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CouponForm {
  name: string;
  type: string;
  goldChecked: boolean;
  goldDiscount: string;
  platinumChecked: boolean;
  platinumDiscount: string;
  diamondChecked: boolean;
  diamondDiscount: string;
  quantity: string;
  template: string;
  target: string;
  startDate: string;
  endDate: string;
  active: boolean;
}

const defaultForm: CouponForm = {
  name: "",
  type: "套餐優惠/滿減優惠/增值服務優惠",
  goldChecked: false,
  goldDiscount: "",
  platinumChecked: false,
  platinumDiscount: "",
  diamondChecked: false,
  diamondDiscount: "",
  quantity: "",
  template: "",
  target: "",
  startDate: "",
  endDate: "",
  active: false,
};

const mockCoupons = [
  { 
    id: 1,
    createdAt: "12/08/2025", 
    code: "自動生成", 
    name: "春季優惠", 
    target: "白金會員",
    info: "滿1000減100",
    quantity: 99,
    used: 90,
    startDate: "12/08/2025",
    endDate: "12/08/2025",
    status: "active"
  },
  { 
    id: 2,
    createdAt: "12/08/2025", 
    code: "自動生成", 
    name: "夏季優惠", 
    target: "鉑金會員",
    info: "滿1000減100",
    quantity: 99,
    used: 97,
    startDate: "12/09/2025",
    endDate: "12/08/2025",
    status: "active"
  },
  { 
    id: 3,
    createdAt: "12/08/2025", 
    code: "自動生成", 
    name: "秋季優惠", 
    target: "黃金會員",
    info: "滿1000減100",
    quantity: 99,
    used: 24,
    startDate: "12/08/2025",
    endDate: "12/08/2025",
    status: "paused"
  },
  { 
    id: 4,
    createdAt: "12/08/2025", 
    code: "自動生成", 
    name: "冬季優惠", 
    target: "鑽石會員",
    info: "滿1000減100",
    quantity: 99,
    used: 50,
    startDate: "12/09/2025",
    endDate: "12/08/2025",
    status: "paused"
  },
  { 
    id: 5,
    createdAt: "12/08/2025", 
    code: "自動生成", 
    name: "春季優惠", 
    target: "黃金會員",
    info: "滿1000減100",
    quantity: 99,
    used: 69,
    startDate: "12/08/2025",
    endDate: "12/08/2025",
    status: "ended"
  },
];

const getStatusIcon = (status: string) => {
  switch (status) {
    case "active":
      return <FileText className="w-5 h-5 text-primary" />;
    case "paused":
      return <Clock className="w-5 h-5 text-muted-foreground" />;
    case "ended":
      return <Clock className="w-5 h-5 text-muted-foreground" />;
    default:
      return null;
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case "active":
      return "未開始";
    case "paused":
      return "進行中";
    case "ended":
      return "已結束";
    default:
      return "";
  }
};

const CouponsPage = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<CouponForm>(defaultForm);

  const handleOpenAdd = () => {
    setForm(defaultForm);
    setIsEditing(false);
    setDialogOpen(true);
  };

  const handleOpenEdit = (coupon: typeof mockCoupons[0]) => {
    setForm({
      name: coupon.name,
      type: "套餐優惠/滿減優惠/增值服務優惠",
      goldChecked: false,
      goldDiscount: "",
      platinumChecked: false,
      platinumDiscount: "",
      diamondChecked: false,
      diamondDiscount: "",
      quantity: String(coupon.quantity),
      template: "",
      target: coupon.target,
      startDate: coupon.startDate,
      endDate: coupon.endDate,
      active: coupon.status === "active",
    });
    setIsEditing(true);
    setDialogOpen(true);
  };

  const handleConfirm = () => {
    setDialogOpen(false);
  };

  // Coupon template icons (colored printer icons)
  const templateColors = ["text-green-500", "text-blue-500", "text-yellow-500", "text-primary"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Ticket className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">
            優惠管理/<span className="text-primary">優惠券</span>
          </h1>
        </div>
        <Button className="bg-primary hover:bg-primary/90" onClick={handleOpenAdd}>
          <Plus className="w-4 h-4 mr-2" />
          新增優惠券
        </Button>
      </div>

      {/* Table */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-center font-medium">創建日期</TableHead>
              <TableHead className="text-center font-medium">優惠券編號</TableHead>
              <TableHead className="text-center font-medium">優惠券名稱</TableHead>
              <TableHead className="text-center font-medium">優惠對象</TableHead>
              <TableHead className="text-center font-medium">優惠信息</TableHead>
              <TableHead className="text-center font-medium">優惠券數量</TableHead>
              <TableHead className="text-center font-medium">已使用數量</TableHead>
              <TableHead className="text-center font-medium">優惠券開始日期</TableHead>
              <TableHead className="text-center font-medium">優惠券結束日期</TableHead>
              <TableHead className="text-center font-medium">狀態</TableHead>
              <TableHead className="text-center font-medium">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockCoupons.map((coupon) => (
              <TableRow key={coupon.id} className="hover:bg-muted/30">
                <TableCell className="text-center">{coupon.createdAt}</TableCell>
                <TableCell className="text-center">{coupon.code}</TableCell>
                <TableCell className="text-center">{coupon.name}</TableCell>
                <TableCell className="text-center">{coupon.target}</TableCell>
                <TableCell className="text-center">{coupon.info}</TableCell>
                <TableCell className="text-center">{coupon.quantity}</TableCell>
                <TableCell className="text-center">{coupon.used}</TableCell>
                <TableCell className="text-center">{coupon.startDate}</TableCell>
                <TableCell className="text-center">{coupon.endDate}</TableCell>
                <TableCell className="text-center">
                  <span className="text-primary">{getStatusText(coupon.status)}</span>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    {coupon.status === "active" && (
                      <>
                        <Button 
                          variant="link" 
                          className="text-primary p-0 h-auto text-sm"
                          onClick={() => handleOpenEdit(coupon)}
                        >
                          編輯
                        </Button>
                        <Button variant="link" className="text-primary p-0 h-auto text-sm">查看</Button>
                        <Button variant="link" className="text-primary p-0 h-auto text-sm">開始活動</Button>
                      </>
                    )}
                    {coupon.status === "paused" && (
                      <>
                        <Button variant="link" className="text-primary p-0 h-auto text-sm">暫停活動</Button>
                        <Button variant="link" className="text-primary p-0 h-auto text-sm">查看</Button>
                      </>
                    )}
                    {coupon.status === "ended" && (
                      <Button variant="link" className="text-primary p-0 h-auto text-sm">查看</Button>
                    )}
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
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg font-medium">
                {isEditing ? "編輯優惠券" : "新增優惠券"}
              </DialogTitle>
              {/* Template icons */}
              <div className="flex items-center gap-2">
                {templateColors.map((color, idx) => (
                  <Printer key={idx} className={`w-5 h-5 ${color}`} />
                ))}
              </div>
            </div>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* 優惠券名稱 */}
            <div className="flex items-center gap-4">
              <label className="w-20 text-sm text-muted-foreground text-right shrink-0">優惠券名稱</label>
              <Input 
                placeholder="秋季優惠" 
                value={form.name}
                onChange={(e) => setForm({...form, name: e.target.value})}
              />
            </div>

            {/* 優惠類型 */}
            <div className="flex items-center gap-4">
              <label className="w-20 text-sm text-muted-foreground text-right shrink-0">優惠類型</label>
              <Input 
                value={form.type}
                onChange={(e) => setForm({...form, type: e.target.value})}
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
                    onCheckedChange={(checked) => setForm({...form, goldChecked: !!checked})}
                  />
                  <span className="text-sm w-16">黃金套餐</span>
                  <Input 
                    className="w-16 text-center" 
                    value={form.goldDiscount}
                    onChange={(e) => setForm({...form, goldDiscount: e.target.value})}
                  />
                  <span className="text-sm text-muted-foreground">%OFF</span>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox 
                    checked={form.platinumChecked}
                    onCheckedChange={(checked) => setForm({...form, platinumChecked: !!checked})}
                  />
                  <span className="text-sm w-16">白金套餐</span>
                  <Input 
                    className="w-16 text-center" 
                    value={form.platinumDiscount}
                    onChange={(e) => setForm({...form, platinumDiscount: e.target.value})}
                  />
                  <span className="text-sm text-muted-foreground">%OFF</span>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox 
                    checked={form.diamondChecked}
                    onCheckedChange={(checked) => setForm({...form, diamondChecked: !!checked})}
                  />
                  <span className="text-sm w-16">鑽石套餐</span>
                  <Input 
                    className="w-16 text-center" 
                    value={form.diamondDiscount}
                    onChange={(e) => setForm({...form, diamondDiscount: e.target.value})}
                  />
                  <span className="text-sm text-muted-foreground">%OFF</span>
                </div>
              </div>
            </div>

            {/* 優惠券數量 */}
            <div className="flex items-center gap-4">
              <label className="w-20 text-sm text-muted-foreground text-right shrink-0">優惠券數量</label>
              <Input 
                placeholder="請輸入數量" 
                value={form.quantity}
                onChange={(e) => setForm({...form, quantity: e.target.value})}
              />
            </div>

            {/* 優惠券樣式 */}
            <div className="flex items-center gap-4">
              <label className="w-20 text-sm text-muted-foreground text-right shrink-0">優惠券樣式</label>
              <Button variant="outline" className="border-primary text-primary hover:bg-primary/10">
                <Upload className="w-4 h-4 mr-2" />
                上傳
              </Button>
            </div>

            {/* 優惠對象 */}
            <div className="flex items-center gap-4">
              <label className="w-20 text-sm text-muted-foreground text-right shrink-0">優惠對象</label>
              <Select value={form.target} onValueChange={(value) => setForm({...form, target: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="請選擇" />
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
              <div className="flex items-center gap-2 flex-1">
                <div className="relative flex-1">
                  <Input 
                    placeholder="开始日期" 
                    value={form.startDate}
                    onChange={(e) => setForm({...form, startDate: e.target.value})}
                  />
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                </div>
                <span className="text-muted-foreground">至</span>
                <div className="relative flex-1">
                  <Input 
                    placeholder="結束日期" 
                    value={form.endDate}
                    onChange={(e) => setForm({...form, endDate: e.target.value})}
                  />
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            </div>

            {/* 活動狀態 */}
            <div className="flex items-center gap-4">
              <label className="w-20 text-sm text-muted-foreground text-right shrink-0">活動狀態</label>
              <Switch 
                checked={form.active}
                onCheckedChange={(checked) => setForm({...form, active: checked})}
              />
            </div>
          </div>

          {/* Button */}
          <Button 
            className="w-full bg-primary hover:bg-primary/90"
            onClick={handleConfirm}
          >
            確認
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CouponsPage;
