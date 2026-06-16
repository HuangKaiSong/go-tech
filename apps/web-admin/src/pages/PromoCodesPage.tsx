import {
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@go-tech-frontend/ui";
import { Calendar, Percent, Plus } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface PromoCodeForm {
  name: string;
  remark: string;
  discountMethod: "amount" | "percent";
  goldChecked: boolean;
  goldDiscount: string;
  platinumChecked: boolean;
  platinumDiscount: string;
  diamondChecked: boolean;
  diamondDiscount: string;
  quantity: string;
  codeValue: string;
  target: string;
  startDate: string;
  endDate: string;
  active: boolean;
}

const defaultForm: PromoCodeForm = {
  name: "",
  remark: "",
  discountMethod: "amount",
  goldChecked: false,
  goldDiscount: "",
  platinumChecked: false,
  platinumDiscount: "",
  diamondChecked: false,
  diamondDiscount: "",
  quantity: "",
  codeValue: "",
  target: "",
  startDate: "",
  endDate: "",
  active: false,
};

const mockPromoCodes = [
  {
    id: 1,
    createdAt: "12/08/2025",
    code: "自動生成",
    name: "春季優惠",
    remark: "新春活動專用",
    target: "白金會員",
    discountMethod: "滿減",
    info: "滿1000減100",
    codeValue: "1234567",
    available: 99,
    used: 90,
    startDate: "12/08/2025",
    endDate: "12/08/2025",
    status: "未開始",
  },
  {
    id: 2,
    createdAt: "12/08/2025",
    code: "自動生成",
    name: "夏季優惠",
    remark: "夏日清涼活動",
    target: "鉑金會員",
    discountMethod: "百分比",
    info: "全場 9 折",
    codeValue: "",
    available: 99,
    used: 97,
    startDate: "12/09/2025",
    endDate: "12/08/2025",
    status: "未開始",
  },
  {
    id: 3,
    createdAt: "12/08/2025",
    code: "自動生成",
    name: "秋季優惠",
    remark: "秋季限定優惠",
    target: "黃金會員",
    discountMethod: "滿減",
    info: "滿1000減100",
    codeValue: "",
    available: 99,
    used: 24,
    startDate: "12/08/2025",
    endDate: "12/08/2025",
    status: "進行中",
  },
  {
    id: 4,
    createdAt: "12/08/2025",
    code: "自動生成",
    name: "冬季優惠",
    remark: "年末感恩回饋",
    target: "鑽石會員",
    discountMethod: "百分比",
    info: "全場 85 折",
    codeValue: "",
    available: 99,
    used: 50,
    startDate: "12/09/2025",
    endDate: "12/08/2025",
    status: "進行中",
  },
  {
    id: 5,
    createdAt: "12/08/2025",
    code: "自動生成",
    name: "春季優惠",
    remark: "舊版春季活動",
    target: "黃金會員",
    discountMethod: "滿減",
    info: "滿1000減100",
    codeValue: "",
    available: 99,
    used: 69,
    startDate: "12/08/2025",
    endDate: "12/08/2025",
    status: "已結束",
  },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "未開始":
      return "text-primary";
    case "進行中":
      return "text-primary";
    case "已結束":
      return "text-primary";
    default:
      return "text-muted-foreground";
  }
};

const PromoCodesPage = () => {
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<PromoCodeForm>(defaultForm);

  const handleOpenAdd = () => {
    setForm(defaultForm);
    setIsEditing(false);
    setDialogOpen(true);
  };

  const handleOpenEdit = (code: (typeof mockPromoCodes)[0]) => {
    setForm({
      name: code.name,
      remark: code.remark,
      discountMethod: code.discountMethod === "百分比" ? "percent" : "amount",
      goldChecked: false,
      goldDiscount: "",
      platinumChecked: false,
      platinumDiscount: "",
      diamondChecked: false,
      diamondDiscount: "",
      quantity: String(code.available),
      codeValue: code.codeValue,
      target: code.target,
      startDate: code.startDate,
      endDate: code.endDate,
      active: code.status === "進行中",
    });
    setIsEditing(true);
    setDialogOpen(true);
  };

  const handleConfirm = () => {
    setDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Percent className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">
            優惠管理/<span className="text-primary">優惠碼</span>
          </h1>
        </div>
        <Button
          className="bg-primary hover:bg-primary/90"
          onClick={handleOpenAdd}
        >
          <Plus className="w-4 h-4 mr-2" />
          新增優惠券
        </Button>
      </div>

      {/* Table */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-center font-medium">
                創建日期
              </TableHead>
              <TableHead className="text-center font-medium">
                優惠碼編號
              </TableHead>
              <TableHead className="text-center font-medium">
                優惠碼名稱
              </TableHead>
              <TableHead className="text-center font-medium">
                優惠方式
              </TableHead>
              <TableHead className="text-center font-medium">
                優惠信息
              </TableHead>
              <TableHead className="text-center font-medium">
                優惠碼可用數量
              </TableHead>
              <TableHead className="text-center font-medium">
                優惠碼口令
              </TableHead>

              <TableHead className="text-center font-medium">
                開始日期
              </TableHead>
              <TableHead className="text-center font-medium">
                結束日期
              </TableHead>
              <TableHead className="text-center font-medium">
                已使用數量
              </TableHead>
              <TableHead className="text-center font-medium">狀態</TableHead>
              <TableHead className="text-center font-medium">備註</TableHead>
              <TableHead className="text-center font-medium">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockPromoCodes.map((code) => (
              <TableRow key={code.id} className="hover:bg-muted/30">
                <TableCell className="text-center">{code.createdAt}</TableCell>
                <TableCell className="text-center">{code.code}</TableCell>
                <TableCell className="text-center">{code.name}</TableCell>
                <TableCell className="text-center">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-primary/10 text-primary">
                    {code.discountMethod}
                  </span>
                </TableCell>
                <TableCell className="text-center">{code.info}</TableCell>
                <TableCell className="text-center">{code.available}</TableCell>
                <TableCell className="text-center">{code.codeValue}</TableCell>

                <TableCell className="text-center">{code.startDate}</TableCell>
                <TableCell className="text-center">{code.endDate}</TableCell>
                <TableCell className="text-center">{code.used}</TableCell>
                <TableCell className="text-center">
                  <span className={getStatusColor(code.status)}>
                    {code.status}
                  </span>
                </TableCell>
                <TableCell className="text-center text-muted-foreground">
                  {code.remark}
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    {code.status === "未開始" && (
                      <>
                        <Button
                          variant="link"
                          className="text-primary p-0 h-auto text-sm"
                          onClick={() => handleOpenEdit(code)}
                        >
                          編輯
                        </Button>
                        <Button
                          variant="link"
                          className="text-primary p-0 h-auto text-sm"
                          onClick={() => navigate(`/promo-codes/${code.id}`)}
                        >
                          查看
                        </Button>
                        <Button
                          variant="link"
                          className="text-primary p-0 h-auto text-sm"
                        >
                          開始活動
                        </Button>
                      </>
                    )}
                    {code.status === "進行中" && (
                      <>
                        <Button
                          variant="link"
                          className="text-primary p-0 h-auto text-sm"
                        >
                          暫停活動
                        </Button>
                        <Button
                          variant="link"
                          className="text-primary p-0 h-auto text-sm"
                          onClick={() => navigate(`/promo-codes/${code.id}`)}
                        >
                          查看
                        </Button>
                      </>
                    )}
                    {code.status === "已結束" && (
                      <Button
                        variant="link"
                        className="text-primary p-0 h-auto text-sm"
                        onClick={() => navigate(`/promo-codes/${code.id}`)}
                      >
                        查看
                      </Button>
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
            <DialogTitle className="text-lg font-medium">
              {isEditing ? "編輯優惠碼" : "新增優惠碼"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* 优惠码名稱 */}
            <div className="flex items-center gap-4">
              <label className="w-20 text-sm text-muted-foreground text-right shrink-0">
                优惠码名稱
              </label>
              <Input
                placeholder="秋季優惠"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            {/* 優惠方式 */}
            <div className="flex items-center gap-4">
              <label className="w-20 text-sm text-muted-foreground text-right shrink-0">
                優惠方式
              </label>
              <div className="flex items-center gap-6 flex-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="discountMethod"
                    checked={form.discountMethod === "amount"}
                    onChange={() =>
                      setForm({ ...form, discountMethod: "amount" })
                    }
                    className="accent-primary"
                  />
                  <span className="text-sm">滿減</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="discountMethod"
                    checked={form.discountMethod === "percent"}
                    onChange={() =>
                      setForm({ ...form, discountMethod: "percent" })
                    }
                    className="accent-primary"
                  />
                  <span className="text-sm">按百分比</span>
                </label>
              </div>
            </div>

            {/* 優惠信息 */}
            <div className="flex items-start gap-4">
              <label className="w-20 text-sm text-muted-foreground text-right shrink-0 mt-2">
                優惠信息
              </label>
              <div className="space-y-3 flex-1">
                {[
                  {
                    key: "gold",
                    label: "黃金套餐",
                    checked: form.goldChecked,
                    value: form.goldDiscount,
                    onCheck: (c: boolean) =>
                      setForm({ ...form, goldChecked: c }),
                    onValue: (v: string) =>
                      setForm({ ...form, goldDiscount: v }),
                  },
                  {
                    key: "platinum",
                    label: "白金套餐",
                    checked: form.platinumChecked,
                    value: form.platinumDiscount,
                    onCheck: (c: boolean) =>
                      setForm({ ...form, platinumChecked: c }),
                    onValue: (v: string) =>
                      setForm({ ...form, platinumDiscount: v }),
                  },
                  {
                    key: "diamond",
                    label: "鑽石套餐",
                    checked: form.diamondChecked,
                    value: form.diamondDiscount,
                    onCheck: (c: boolean) =>
                      setForm({ ...form, diamondChecked: c }),
                    onValue: (v: string) =>
                      setForm({ ...form, diamondDiscount: v }),
                  },
                ].map((row) => (
                  <div key={row.key} className="flex items-center gap-2">
                    <Checkbox
                      checked={row.checked}
                      onCheckedChange={(c) => row.onCheck(!!c)}
                    />
                    <span className="text-sm w-16">{row.label}</span>
                    {form.discountMethod === "amount" ? (
                      <>
                        <span className="text-sm text-muted-foreground">
                          滿
                        </span>
                        <Input
                          className="w-20 text-center"
                          placeholder="金額"
                        />
                        <span className="text-sm text-muted-foreground">
                          減
                        </span>
                        <Input
                          className="w-20 text-center"
                          value={row.value}
                          onChange={(e) => row.onValue(e.target.value)}
                        />
                        <span className="text-sm text-muted-foreground">
                          元
                        </span>
                      </>
                    ) : (
                      <>
                        <Input
                          className="w-20 text-center"
                          value={row.value}
                          onChange={(e) => row.onValue(e.target.value)}
                        />
                        <span className="text-sm text-muted-foreground">
                          %OFF
                        </span>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 優惠碼數量 */}
            <div className="flex items-center gap-4">
              <label className="w-20 text-sm text-muted-foreground text-right shrink-0">
                優惠碼數量
              </label>
              <Input
                placeholder="請輸入數量"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              />
            </div>

            {/* 優惠碼口令 */}
            <div className="flex items-center gap-4">
              <label className="w-20 text-sm text-muted-foreground text-right shrink-0">
                優惠碼口令
              </label>
              <Input
                placeholder="文本輸入"
                value={form.codeValue}
                onChange={(e) =>
                  setForm({ ...form, codeValue: e.target.value })
                }
              />
            </div>

            {/* 活動日期 */}
            <div className="flex items-center gap-4">
              <label className="w-20 text-sm text-muted-foreground text-right shrink-0">
                活動日期
              </label>
              <div className="flex items-center gap-2 flex-1">
                <div className="relative flex-1">
                  <Input
                    placeholder="开始日期"
                    value={form.startDate}
                    onChange={(e) =>
                      setForm({ ...form, startDate: e.target.value })
                    }
                  />
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                </div>
                <span className="text-muted-foreground">至</span>
                <div className="relative flex-1">
                  <Input
                    placeholder="結束日期"
                    value={form.endDate}
                    onChange={(e) =>
                      setForm({ ...form, endDate: e.target.value })
                    }
                  />
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            </div>

            {/* 活動狀態 */}
            <div className="flex items-center gap-4">
              <label className="w-20 text-sm text-muted-foreground text-right shrink-0">
                活動狀態
              </label>
              <Switch
                checked={form.active}
                onCheckedChange={(checked) =>
                  setForm({ ...form, active: checked })
                }
              />
            </div>

            {/* 備註 */}
            <div className="flex items-center gap-4">
              <label className="w-20 text-sm text-muted-foreground text-right shrink-0">
                備註
              </label>
              <Input
                placeholder="請輸入備註"
                value={form.remark}
                onChange={(e) => setForm({ ...form, remark: e.target.value })}
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

export default PromoCodesPage;

