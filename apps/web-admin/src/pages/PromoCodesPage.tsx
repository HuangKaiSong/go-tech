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
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { Percent, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";

// ---------------------------------------------------------------------------
// 类型 & Schema
// ---------------------------------------------------------------------------

/** 套餐接口返回的单条数据 */
interface Plan {
  id: number;
  packageName: string;
  [key: string]: unknown;
}

const discountItemSchema = z.object({
  planId: z.number(),
  planName: z.string(),
  checked: z.boolean(),
  /** 滿減门槛（仅 discountMethod === "amount" 时有效） */
  threshold: z.string().default(""),
  /** 减免金额（amount）或折扣百分比（percent） */
  discountValue: z.string().default(""),
});

const promoCodeSchema = z.object({
  name: z.string().min(1, "請輸入優惠名稱"),
  remark: z.string().default(""),
  discountMethod: z.enum(["amount", "percent"]),
  /** 各套餐的优惠配置，planId 与套餐接口返回的 id 对应 */
  discounts: z.array(discountItemSchema),
  /** z.coerce 将文本输入自动转为数字 */
  quantity: z.coerce.number().int().min(1, "請輸入有效數量"),
  codeValue: z.string().min(1, "請輸入優惠碼口令"),
  startDate: z.string().min(1, "請選擇開始日期"),
  endDate: z.string().min(1, "請選擇結束日期"),
  active: z.boolean().default(false),
  target: z.string().optional(),
  displayStyle: z.string().optional(),
});

type PromoCodeForm = z.infer<typeof promoCodeSchema>;
type DiscountItem = z.infer<typeof discountItemSchema>;

const defaultValues: PromoCodeForm = {
  name: "",
  remark: "",
  discountMethod: "amount",
  discounts: [],
  quantity: 0,
  codeValue: "",
  startDate: "",
  endDate: "",
  active: false,
};

// ---------------------------------------------------------------------------
// Mock 数据
// ---------------------------------------------------------------------------

const mockPromoCodes = [
  {
    id: 1,
    createdAt: "2025-12-08",
    code: "自動生成",
    name: "春季優惠",
    remark: "新春活動專用",
    target: "白金會員",
    discountMethod: "滿減",
    info: "滿1000減100",
    codeValue: "1234567",
    available: 99,
    used: 90,
    startDate: "2025-12-09",
    endDate: "2025-12-08",
    status: "未開始",
    discounts: [
      {
        planId: 7,
        planName: "升级版",
        checked: true,
        threshold: "1000",
        discountValue: "100",
      },
    ] satisfies DiscountItem[],
  },
  {
    id: 2,
    createdAt: "2025-12-08",
    code: "自動生成",
    name: "夏季優惠",
    remark: "夏日清涼活動",
    target: "鉑金會員",
    discountMethod: "百分比",
    info: "全場 9 折",
    codeValue: "",
    available: 99,
    used: 97,
    startDate: "2025-12-09",
    endDate: "2025-12-08",
    status: "未開始",
    discounts: [
      {
        planId: 7,
        planName: "升级版",
        checked: true,
        threshold: "",
        discountValue: "10",
      },
      {
        planId: 6,
        planName: "普通版",
        checked: true,
        threshold: "",
        discountValue: "10",
      },
      {
        planId: 8,
        planName: "豪华版",
        checked: true,
        threshold: "",
        discountValue: "10",
      },
    ] satisfies DiscountItem[],
  },
  {
    id: 3,
    createdAt: "2025-12-08",
    code: "自動生成",
    name: "秋季優惠",
    remark: "秋季限定優惠",
    target: "黃金會員",
    discountMethod: "滿減",
    info: "滿1000減100",
    codeValue: "",
    available: 99,
    used: 24,
    startDate: "2025-12-08",
    endDate: "2025-12-08",
    status: "進行中",
    discounts: [
      {
        planId: 8,
        planName: "豪华版",
        checked: true,
        threshold: "3000",
        discountValue: "300",
      },
    ] satisfies DiscountItem[],
  },
  {
    id: 4,
    createdAt: "2025-12-08",
    code: "自動生成",
    name: "冬季優惠",
    remark: "年末感恩回饋",
    target: "鑽石會員",
    discountMethod: "百分比",
    info: "全場 85 折",
    codeValue: "",
    available: 99,
    used: 50,
    startDate: "2025-12-09",
    endDate: "2025-12-08",
    status: "進行中",
    discounts: [] satisfies DiscountItem[],
  },
  {
    id: 5,
    createdAt: "2025-12-08",
    code: "自動生成",
    name: "春季優惠",
    remark: "舊版春季活動",
    target: "黃金會員",
    discountMethod: "滿減",
    info: "滿1000減100",
    codeValue: "",
    available: 99,
    used: 69,
    startDate: "2025-12-08",
    endDate: "2025-12-08",
    status: "已結束",
    discounts: [] satisfies DiscountItem[],
  },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "未開始":
    case "進行中":
    case "已結束":
      return "text-primary";
    default:
      return "text-muted-foreground";
  }
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const PromoCodesPage = () => {
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  /**
   * 暂存待编辑条目。plans 是异步加载的，handleOpenEdit 调用时可能还没数据，
   * 先把条目存起来，等 plans 到位后由 useEffect 完成 discounts 初始化。
   */
  const [pendingEditCode, setPendingEditCode] = useState<
    (typeof mockPromoCodes)[0] | null
  >(null);

  // ---------------------------------------------------------------------------
  // React Hook Form
  // ---------------------------------------------------------------------------

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<PromoCodeForm>({
    resolver: zodResolver(promoCodeSchema),
    defaultValues,
  });

  const { fields, replace } = useFieldArray({ control, name: "discounts" });
  const discountMethod = watch("discountMethod");

  // ---------------------------------------------------------------------------
  // Plans 查询
  // ---------------------------------------------------------------------------

  // dialog 打开时才请求，避免页面挂载缓存脏数据；
  // staleTime/gcTime 均为 0，每次打开都拿最新数据
  const { data: plans = [] } = useQuery<Plan[]>({
    queryKey: ["plans"],
    enabled: dialogOpen,
    queryFn: async () => {
      try {
        const url = new URL(
          `${import.meta.env.VITE_PROXY_PREFIX}/go-tech/platform/platformPackage/enabledList`,
          location.origin,
        );
        const res = await fetch(url);
        const response = await res.json();
        if (!response?.code || response.code !== 200) {
          throw new Error("Failed to fetch plans");
        }
        return response.data as Plan[];
      } catch (error) {
        console.log(error);
        return [];
      }
    },
    staleTime: 0,
    gcTime: 0,
  });

  /**
   * plans 到位后将其与当前编辑条目的已有 discounts 合并，写入 RHF 的 discounts 字段。
   * 编辑时用已保存的配置预填，未匹配到的套餐也补全为未勾选。
   */
  useEffect(() => {
    if (!dialogOpen || plans.length === 0) return;

    const existingDiscounts: DiscountItem[] = pendingEditCode?.discounts ?? [];

    const data = plans.map((plan) => {
      const existing = existingDiscounts.find((d) => d.planId === plan.id);
      return (
        existing ?? {
          planId: plan.id,
          planName: plan.packageName,
          checked: false,
          threshold: "",
          discountValue: "",
        }
      );
    });

    replace(data);
  }, [dialogOpen, plans, pendingEditCode, replace]);

  // ---------------------------------------------------------------------------
  // Dialog handlers
  // ---------------------------------------------------------------------------

  const handleOpenAdd = () => {
    reset({ ...defaultValues, discounts: [] });
    setIsEditing(false);
    setPendingEditCode(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (code: (typeof mockPromoCodes)[0]) => {
    // 先重置基础字段；discounts 由 useEffect 在 plans 就绪后填入
    reset({
      name: code.name,
      remark: code.remark ?? "",
      discountMethod: code.discountMethod === "百分比" ? "percent" : "amount",
      discounts: [],
      quantity: code.available,
      codeValue: code.codeValue ?? "",
      startDate: code.startDate ?? "",
      endDate: code.endDate ?? "",
      active: code.status === "進行中",
    });
    setIsEditing(true);
    setPendingEditCode(code);
    setDialogOpen(true);
  };

  const onSubmit = (data: PromoCodeForm) => {
    const payload = {
      ...data,
      // 只提交勾选的套餐
      discounts: data.discounts.filter((d) => d.checked),
    };
    console.log(payload);
    setDialogOpen(false);
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

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

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-125">
          <DialogHeader>
            <DialogTitle className="text-lg font-medium">
              {isEditing ? "編輯優惠碼" : "新增優惠碼"}
            </DialogTitle>
          </DialogHeader>

          <form className="space-y-4 py-4" onSubmit={handleSubmit(onSubmit)}>
            {/* 优惠码名稱 */}
            <div className="flex items-center gap-4">
              <label className="w-20 text-sm text-muted-foreground text-right shrink-0">
                優惠碼名稱
              </label>
              <div className="flex-1">
                <Input placeholder="秋季優惠" {...register("name")} />
                {errors.name && (
                  <p className="text-xs text-destructive mt-1">
                    {errors.name.message}
                  </p>
                )}
              </div>
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
                    value="amount"
                    className="accent-primary"
                    {...register("discountMethod")}
                  />
                  <span className="text-sm">滿減</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="percent"
                    className="accent-primary"
                    {...register("discountMethod")}
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
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-center gap-2">
                    <Controller
                      control={control}
                      name={`discounts.${index}.checked`}
                      render={({ field: f }) => (
                        <Checkbox
                          checked={f.value}
                          onCheckedChange={f.onChange}
                        />
                      )}
                    />
                    <span className="text-sm w-16">{field.planName}</span>
                    {discountMethod === "amount" ? (
                      <>
                        <span className="text-sm text-muted-foreground">
                          滿
                        </span>
                        <Input
                          className="w-20 text-center"
                          placeholder="金額"
                          {...register(`discounts.${index}.threshold`)}
                        />
                        <span className="text-sm text-muted-foreground">
                          減
                        </span>
                        <Input
                          className="w-20 text-center"
                          placeholder="金額"
                          {...register(`discounts.${index}.discountValue`)}
                        />
                        <span className="text-sm text-muted-foreground">
                          元
                        </span>
                      </>
                    ) : (
                      <>
                        <Input
                          className="w-20 text-center"
                          placeholder="折扣"
                          {...register(`discounts.${index}.discountValue`)}
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
              <div className="flex-1">
                <Input
                  placeholder="請輸入數量"
                  type="number"
                  min={1}
                  {...register("quantity")}
                />
                {errors.quantity && (
                  <p className="text-xs text-destructive mt-1">
                    {errors.quantity.message}
                  </p>
                )}
              </div>
            </div>

            {/* 優惠碼口令 */}
            <div className="flex items-center gap-4">
              <label className="w-20 text-sm text-muted-foreground text-right shrink-0">
                優惠碼口令
              </label>
              <div className="flex-1">
                <Input placeholder="文本輸入" {...register("codeValue")} />
                {errors.codeValue && (
                  <p className="text-xs text-destructive mt-1">
                    {errors.codeValue.message}
                  </p>
                )}
              </div>
            </div>

            {/* 活動日期 */}
            <div className="flex items-center gap-4">
              <label className="w-20 text-sm text-muted-foreground text-right shrink-0">
                活動日期
              </label>
              <div className="flex items-center gap-2 flex-1">
                <Input
                  type="date"
                  className="flex-1"
                  {...register("startDate")}
                />
                <span className="text-muted-foreground">至</span>
                <Input
                  type="date"
                  className="flex-1"
                  {...register("endDate")}
                />
              </div>
            </div>
            {(errors.startDate || errors.endDate) && (
              <p className="text-xs text-destructive -mt-2 pl-24">
                {errors.startDate?.message ?? errors.endDate?.message}
              </p>
            )}

            {/* 活動狀態 */}
            <div className="flex items-center gap-4">
              <label className="w-20 text-sm text-muted-foreground text-right shrink-0">
                活動狀態
              </label>
              <Controller
                control={control}
                name="active"
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>

            {/* 備註 */}
            <div className="flex items-center gap-4">
              <label className="w-20 text-sm text-muted-foreground text-right shrink-0">
                備註
              </label>
              <Input placeholder="請輸入備註" {...register("remark")} />
            </div>

            {/* 提交 */}
            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90"
            >
              確認
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PromoCodesPage;

