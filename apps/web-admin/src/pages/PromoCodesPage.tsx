import {
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  Pagination,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  toast
} from '@go-tech-frontend/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Skeleton } from 'antd';
import { Percent, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { mockPromoCodes } from '@/mocks/promos';

type PromoCodeRecord = (typeof mockPromoCodes)[number];

interface PromotionPageResponse {
  records: PromoCodeRecord[];
  total: number;
}

export interface PromotionDetail {
  active?: boolean;
  endTime?: string;
  id: number;
  maxCount?: number;
  promotionCode?: string;
  promotionItems?: Array<{
    checked?: boolean;
    discountValue?: string | number;
    packageId: number;
    packageName?: string;
    ruleType?: 1 | 2;
    thresholdAmount?: string | number;
  }>;
  promotionName?: string;
  promotionType?: number;
  remark?: string;
  startTime?: string;
  status?: number;
}

// ---------------------------------------------------------------------------
// 类型 & Schema
// ---------------------------------------------------------------------------

/** 套餐接口返回的单条数据 */
interface Plan {
  id: number;
  packageName: string;
  [key: string]: unknown;
}

const discountMethodSchema = z.enum(['amount', 'percent']);
type DiscountMethod = z.infer<typeof discountMethodSchema>;

// amount => 1 percent => 2
const RuleType = {
  amount: 1,
  percent: 2
} as const satisfies Record<DiscountMethod, 1 | 2>;
type RuleType = (typeof RuleType)[DiscountMethod];
const ruleTypeSchema = z.union([z.literal(RuleType.amount), z.literal(RuleType.percent)]);

const discountItemSchema = z.object({
  ruleType: ruleTypeSchema,
  packageId: z.number(),
  packageName: z.string(),
  checked: z.boolean(),
  /** 滿減门槛（仅 discountMethod === "amount" 时有效） */
  thresholdAmount: z.string().default(''),
  /** 减免金额（amount）或折扣百分比（percent） */
  discountValue: z.string().default('')
});

const promoCodeSchema = z.object({
  id: z.number().optional(),
  promotionName: z.string().min(1, '請輸入優惠名稱'),
  /** 优惠类型（1-优惠活动，2-优惠码，3优惠券） */
  promotionType: z.coerce.number().int().default(2),
  remark: z.string().default(''),
  discountMethod: discountMethodSchema,
  /** 各套餐的优惠配置，planId 与套餐接口返回的 id 对应 */
  promotionItems: z.array(discountItemSchema),
  /** Z.coerce 将文本输入自动转为数字 */
  maxCount: z.coerce.number().int().min(1, '請輸入有效數量'),
  promotionCode: z.string().min(1, '請輸入優惠碼口令'),
  startTime: z.string().min(1, '請選擇開始日期'),
  endTime: z.string().min(1, '請選擇結束日期'),
  active: z.boolean().default(false),
  target: z.string().optional(),
  displayStyle: z.string().optional()
});

type PromoCodeForm = z.infer<typeof promoCodeSchema>;
type DiscountItem = z.infer<typeof discountItemSchema>;

const defaultValues: PromoCodeForm = {
  promotionType: 2,
  promotionName: '',
  remark: '',
  discountMethod: 'amount',
  promotionItems: [],
  maxCount: 0,
  promotionCode: '',
  startTime: '',
  endTime: '',
  active: false
};

// ---------------------------------------------------------------------------
// 表单骨架屏（仅替换内部元素，保留表单布局，避免加载完成后跳动）
// ---------------------------------------------------------------------------

const SkeletonLabel = () => (
  <div className="w-20 shrink-0 flex justify-end">
    <Skeleton.Input active size="small" style={{ width: 56, height: 16, minWidth: 56 }} />
  </div>
);

const PromoFormSkeleton = () => (
  <div className="space-y-4 py-4">
    {/* 優惠碼名稱 */}
    <div className="flex items-center gap-4">
      <SkeletonLabel />
      <Skeleton.Input active block size="medium" />
    </div>

    {/* 優惠方式 */}
    <div className="flex items-center gap-4">
      <SkeletonLabel />
      <div className="flex items-center gap-6 flex-1">
        <Skeleton.Input active size="small" style={{ width: 60, height: 16, minWidth: 60 }} />
        <Skeleton.Input active size="small" style={{ width: 60, height: 16, minWidth: 60 }} />
      </div>
    </div>

    {/* 優惠信息（3 行套餐占位） */}
    <div className="flex items-start gap-4">
      <SkeletonLabel />
      <div className="space-y-3 flex-1">
        {[0, 1, 2].map(i => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton.Input active size="small" style={{ width: 16, height: 16, minWidth: 16 }} />
            <Skeleton.Input active size="small" style={{ width: 60, height: 16, minWidth: 60 }} />
            <Skeleton.Input active size="medium" style={{ width: 80, minWidth: 80 }} />
            <Skeleton.Input active size="medium" style={{ width: 80, minWidth: 80 }} />
          </div>
        ))}
      </div>
    </div>

    {/* 優惠碼數量 */}
    <div className="flex items-center gap-4">
      <SkeletonLabel />
      <Skeleton.Input active block size="medium" />
    </div>

    {/* 優惠碼口令 */}
    <div className="flex items-center gap-4">
      <SkeletonLabel />
      <Skeleton.Input active block size="medium" />
    </div>

    {/* 活動日期 */}
    <div className="flex items-center gap-4">
      <SkeletonLabel />
      <div className="flex items-center gap-2 flex-1">
        <Skeleton.Input active block size="medium" />
        <Skeleton.Input active size="small" style={{ width: 16, height: 16, minWidth: 16 }} />
        <Skeleton.Input active block size="medium" />
      </div>
    </div>

    {/* 活動狀態 */}
    <div className="flex items-center gap-4">
      <SkeletonLabel />
      <Skeleton.Button active size="small" shape="round" style={{ width: 40 }} />
    </div>

    {/* 備註 */}
    <div className="flex items-center gap-4">
      <SkeletonLabel />
      <Skeleton.Input active block size="medium" />
    </div>

    {/* 提交按钮 */}
    <Skeleton.Button active block size="medium" />
  </div>
);

const getDiscountMethodLabel = (items: PromoCodeRecord['promotionItems'] | undefined) => {
  const list = items || [];
  if (list.some(item => item.ruleType === 1)) return '滿減';
  if (list.some(item => item.ruleType === 2)) return '按百分比';
  return '未知';
};

const getStatusColor = (status: number) => {
  switch (status) {
    case 0:
    case 1:
    case 2:
      return 'text-primary';
    default:
      return 'text-muted-foreground';
  }
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const PROMOTION_TYPE = 2;

/** 统一的 POST 请求：解析响应并校验业务 code，失败时抛出后端返回的错误信息 */
const postJson = async (uri: string, body?: unknown) => {
  const response = await fetch(uri, {
    method: 'POST',
    headers: { 'Content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const result = await response.json().catch(() => null);
  if (!response.ok || !result || result.code !== 200) {
    throw new Error(result?.message || '請求失敗，請稍後重試');
  }
  return result;
};

const fallbackPage = (page: number, pageSize: number): PromotionPageResponse => {
  const start = (page - 1) * pageSize;
  return {
    records: mockPromoCodes.slice(start, start + pageSize),
    total: mockPromoCodes.length
  };
};

const PromoCodesPage = () => {
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [current, setCurrent] = useState(1);
  const [size, setSize] = useState(10);
  const [editId, setEditId] = useState<number | null>(null);

  /** 暂存待编辑条目。plans 是异步加载的，handleOpenEdit 调用时可能还没数据， 先把条目存起来，等 plans 到位后由 useEffect 完成 promotionItems 初始化。 */
  const [pendingEditCode, setPendingEditCode] = useState<PromoCodeRecord | null>(null);

  // ---------------------------------------------------------------------------
  // 分页列表查询
  // ---------------------------------------------------------------------------
  const { data: pageData, refetch: refetchList } = useQuery<PromotionPageResponse>({
    queryKey: ['promotions', current, size, PROMOTION_TYPE],
    retry: false,
    queryFn: async () => {
      try {
        const url = new URL(`${import.meta.env.VITE_PROXY_PREFIX}/go-tech/platform/promotion/page`, location.origin);
        url.searchParams.set('current', String(current));
        url.searchParams.set('size', String(size));
        url.searchParams.set('promotionType', String(PROMOTION_TYPE));
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch promotions');
        const response = await res.json();
        return (response?.data ?? fallbackPage(current, size)) as PromotionPageResponse;
      } catch {
        return fallbackPage(current, size);
      }
    },
    placeholderData: prev => prev
  });

  const records = pageData?.records ?? [];
  const total = pageData?.total ?? 0;

  // ---------------------------------------------------------------------------
  // 优惠码详情查询（点击编辑时触发）
  // ---------------------------------------------------------------------------
  const {
    data: detailData,
    error: detailError,
    isFetching: isDetailFetching
  } = useQuery<PromotionDetail | null>({
    queryKey: ['promotion-detail', editId],
    enabled: editId !== null,
    retry: false,
    queryFn: async () => {
      const url = `${import.meta.env.VITE_PROXY_PREFIX}/go-tech/platform/promotion/detail/${editId}`;
      const res = await fetch(url);
      const response = await res.json().catch(() => null);
      if (!res.ok || !response || response.code !== 200) {
        throw new Error(response?.message || '獲取優惠碼詳情失敗');
      }
      return (response.data ?? null) as PromotionDetail | null;
    },
    staleTime: 0,
    gcTime: 0
  });

  // 详情请求失败时弹框提示（v5 的 useQuery 已移除 onError，改用副作用监听）
  useEffect(() => {
    if (detailError) toast.error((detailError as Error).message);
  }, [detailError]);

  // ---------------------------------------------------------------------------
  // React Hook Form
  // ---------------------------------------------------------------------------

  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setValue,
    watch
  } = useForm<PromoCodeForm>({
    resolver: zodResolver(promoCodeSchema),
    defaultValues
  });

  const { fields, replace } = useFieldArray({ control, name: 'promotionItems' });
  const discountMethod = watch('discountMethod');

  // ---------------------------------------------------------------------------
  // Plans 查询
  // ---------------------------------------------------------------------------

  // dialog 打开时才请求，避免页面挂载缓存脏数据；
  // staleTime/gcTime 均为 0，每次打开都拿最新数据
  const { data: plans = [], isFetching: isPlansFetching } = useQuery<Plan[]>({
    queryKey: ['plans'],
    enabled: dialogOpen,
    queryFn: async () => {
      try {
        const url = new URL(
          `${import.meta.env.VITE_PROXY_PREFIX}/go-tech/platform/platformPackage/enabledList`,
          location.origin
        );
        const res = await fetch(url);
        const response = await res.json();
        if (!response?.code || response.code !== 200) {
          throw new Error('Failed to fetch plans');
        }
        return response.data as Plan[];
      } catch (error) {
        console.log(error);
        return [];
      }
    },
    staleTime: 0,
    gcTime: 0
  });

  const patchMutation = useMutation({
    mutationFn: async (data: PromoCodeForm) => {
      const addUri = '/api/go-tech/platform/promotion/add';
      const updateUri = '/api/go-tech/platform/promotion/edit';
      const fetchUri = data.id ? updateUri : addUri;
      return postJson(fetchUri, data);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });
  /** 暂停活动 */
  const pauseMutation = useMutation({
    mutationFn: async (id: number) => postJson(`/api/go-tech/platform/promotion/pause?id=${id}`),
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });
  /** 开始活动 */
  const startMutation = useMutation({
    mutationFn: async (id: number) => postJson(`/api/go-tech/platform/promotion/start?id=${id}`),
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  /** Plans 到位后将其与当前编辑条目的已有 promotionItems 合并，写入 RHF 的 promotionItems 字段。 编辑时用已保存的配置预填，未匹配到的套餐也补全为未勾选。 */
  useEffect(() => {
    if (!dialogOpen || plans.length === 0) return;

    const existingDiscounts: DiscountItem[] = (pendingEditCode?.promotionItems ?? []) as DiscountItem[];

    // 后端返回的 thresholdAmount/discountValue 可能是 number，需归一化为字符串，
    // 否则 zod 的 z.string() 校验会在提交时静默失败（onSubmit 不触发）。
    const toText = (value: unknown) => (value === undefined || value === null ? '' : String(value));

    const data: DiscountItem[] = plans.map(plan => {
      const existing = existingDiscounts.find(d => d.packageId === plan.id);
      if (existing) {
        return {
          ruleType: existing.ruleType ?? RuleType[discountMethod],
          packageId: plan.id,
          packageName: plan.packageName,
          checked: existing.checked ?? true,
          thresholdAmount: toText(existing.thresholdAmount),
          discountValue: toText(existing.discountValue)
        };
      }
      return {
        ruleType: RuleType[discountMethod],
        packageId: plan.id,
        packageName: plan.packageName,
        checked: false,
        thresholdAmount: '',
        discountValue: ''
      };
    });

    replace(data);
  }, [dialogOpen, plans, pendingEditCode, replace]);

  // 编辑时等详情接口；新增/编辑均等套餐接口
  const isFormLoading = dialogOpen && (isPlansFetching || plans.length === 0 || (editId !== null && isDetailFetching));

  // ---------------------------------------------------------------------------
  // Dialog handlers
  // ---------------------------------------------------------------------------

  const handleOpenAdd = () => {
    reset({ ...defaultValues, promotionItems: [] });
    setIsEditing(false);
    setPendingEditCode(null);
    setEditId(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (code: PromoCodeRecord) => {
    // 先用列表已有数据预填，详情接口返回后由 useEffect 覆盖
    reset({
      ...defaultValues,
      id: code.id,
      promotionType: 2,
      promotionName: code.promotionName,
      remark: code.remark ?? '',
      promotionItems: [],
      maxCount: code.maxCount,
      promotionCode: code.promotionCode ?? '',
      startTime: code.startTime ?? '',
      endTime: code.endTime ?? '',
      active: code.status === 1
    });
    setIsEditing(true);
    setPendingEditCode(code);
    setEditId(code.id);
    setDialogOpen(true);
  };

  // 详情接口返回后，用接口数据覆盖表单与 pendingEditCode（保证 promotionItems 合并准确）
  useEffect(() => {
    if (!detailData || editId === null) return;

    const isAmount = (detailData.promotionItems || []).some(item => item.ruleType === 1);
    const nextMethod: DiscountMethod = isAmount ? 'amount' : 'percent';

    // 用 setValue 而不是 reset，避免清掉 useFieldArray 管理的 promotionItems
    setValue('id', detailData.id);
    setValue('promotionType', detailData.promotionType ?? 2);
    setValue('promotionName', detailData.promotionName ?? '');
    setValue('discountMethod', nextMethod);
    setValue('remark', detailData.remark ?? '');
    setValue('maxCount', detailData.maxCount ?? 0);
    setValue('promotionCode', detailData.promotionCode ?? '');
    setValue('startTime', detailData.startTime ?? '');
    setValue('endTime', detailData.endTime ?? '');
    setValue('active', detailData.active ?? detailData.status === 1);

    setPendingEditCode(prev =>
      prev
        ? {
            ...prev,
            promotionItems: (detailData.promotionItems ?? []).map(item => ({
              ...item,
              checked: true
            })) as PromoCodeRecord['promotionItems']
          }
        : prev
    );
  }, [detailData, editId, setValue]);

  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) setEditId(null);
  };

  const onSubmit = (data: PromoCodeForm) => {
    const payload = {
      ...data,
      // 只提交勾选的套餐
      promotionItems: data.promotionItems
        .filter(d => d.checked)
        .map(item => ({
          ...item,
          ruleType: RuleType[data.discountMethod]
        }))
    };

    patchMutation
      .mutateAsync(payload)
      .then(() => {
        toast.success(data.id ? '優惠碼已更新' : '優惠碼已新增');
        handleDialogOpenChange(false);
        refetchList();
      })
      // 错误已由 mutation 的 onError 弹框提示，这里仅吞掉 rejection 避免未捕获
      .catch(() => {});
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
              <TableHead className="text-center font-medium">優惠碼編號</TableHead>
              <TableHead className="text-center font-medium">優惠碼名稱</TableHead>
              <TableHead className="text-center font-medium">優惠方式</TableHead>
              <TableHead className="text-center font-medium">優惠信息</TableHead>
              <TableHead className="text-center font-medium">優惠碼可用數量</TableHead>
              <TableHead className="text-center font-medium">優惠碼口令</TableHead>
              <TableHead className="text-center font-medium">開始日期</TableHead>
              <TableHead className="text-center font-medium">結束日期</TableHead>
              <TableHead className="text-center font-medium">已使用數量</TableHead>
              <TableHead className="text-center font-medium">狀態</TableHead>
              <TableHead className="text-center font-medium">備註</TableHead>
              <TableHead className="text-center font-medium">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map(code => (
              <TableRow key={code.id} className="hover:bg-muted/30">
                <TableCell className="text-center">{code.createTime}</TableCell>
                <TableCell className="text-center">{code.promotionNo}</TableCell>
                <TableCell className="text-center">{code.promotionName}</TableCell>
                <TableCell className="text-center">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-primary/10 text-primary">
                    {getDiscountMethodLabel(code.promotionItems || [])}
                  </span>
                </TableCell>
                <TableCell className="text-center">{code.promotionDesc}</TableCell>
                <TableCell className="text-center">{code.maxCount}</TableCell>
                <TableCell className="text-center">{code.promotionCode}</TableCell>
                <TableCell className="text-center">{code.startTime}</TableCell>
                <TableCell className="text-center">{code.endTime}</TableCell>
                <TableCell className="text-center">{code.useCount}</TableCell>
                <TableCell className="text-center">
                  <span className={getStatusColor(code.status)}>{code.statusName}</span>
                </TableCell>
                <TableCell className="text-center text-muted-foreground">{code.remark}</TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    {code.status === 0 && (
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
                          loading={startMutation.isPending}
                          onClick={() =>
                            startMutation
                              .mutateAsync(code.id)
                              .then(() => refetchList())
                              .catch(() => {})
                          }
                        >
                          開始活動
                        </Button>
                      </>
                    )}
                    {code.status === 1 && (
                      <>
                        <Button
                          variant="link"
                          className="text-primary p-0 h-auto text-sm"
                          loading={pauseMutation.isPending}
                          onClick={() =>
                            pauseMutation
                              .mutateAsync(code.id)
                              .then(() => refetchList())
                              .catch(() => {})
                          }
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
                    {code.status === 2 && (
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
                          loading={startMutation.isPending}
                          onClick={() =>
                            startMutation
                              .mutateAsync(code.id)
                              .then(() => refetchList())
                              .catch(() => {})
                          }
                        >
                          開始活動
                        </Button>
                      </>
                    )}
                    {code.status === 3 && (
                      <>
                        <Button
                          variant="link"
                          className="text-primary p-0 h-auto text-sm"
                          onClick={() => navigate(`/promo-codes/${code.id}`)}
                        >
                          查看
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Pagination
        current={current}
        pageSize={size}
        total={total}
        onChange={(nextCurrent, nextSize) => {
          setCurrent(nextCurrent);
          setSize(nextSize);
        }}
      />

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="sm:max-w-125">
          <DialogHeader>
            <DialogTitle className="text-lg font-medium">{isEditing ? '編輯優惠碼' : '新增優惠碼'}</DialogTitle>
          </DialogHeader>

          {isFormLoading ? (
            <PromoFormSkeleton />
          ) : (
            <form
              className="space-y-4 py-4"
              onSubmit={handleSubmit(onSubmit, formErrors =>
                // 校验失败时不再静默，方便定位是哪个字段（尤其是 promotionItems 嵌套字段）阻止了提交
                console.warn('优惠码表单校验未通过：', formErrors)
              )}
            >
              {/* 优惠码名稱 */}
              <div className="flex items-center gap-4">
                <label className="w-20 text-sm text-muted-foreground text-right shrink-0">優惠碼名稱</label>
                <div className="flex-1">
                  <Input placeholder="秋季優惠" {...register('promotionName')} />
                  {errors.promotionName && (
                    <p className="text-xs text-destructive mt-1">{errors.promotionName.message}</p>
                  )}
                </div>
              </div>

              {/* 優惠方式 */}
              <div className="flex items-center gap-4">
                <label className="w-20 text-sm text-muted-foreground text-right shrink-0">優惠方式</label>
                <div className="flex items-center gap-6 flex-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" value="amount" className="accent-primary" {...register('discountMethod')} />
                    <span className="text-sm">滿減</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" value="percent" className="accent-primary" {...register('discountMethod')} />
                    <span className="text-sm">按百分比</span>
                  </label>
                </div>
              </div>

              {/* 優惠信息 */}
              <div className="flex items-start gap-4">
                <label className="w-20 text-sm text-muted-foreground text-right shrink-0 mt-2">優惠信息</label>
                <div className="space-y-3 flex-1">
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex items-center gap-2">
                      <Controller
                        control={control}
                        name={`promotionItems.${index}.checked`}
                        render={({ field: f }) => <Checkbox checked={f.value} onCheckedChange={f.onChange} />}
                      />
                      <span className="text-sm w-16">{field.packageName}</span>
                      {discountMethod === 'amount' ? (
                        <>
                          <span className="text-sm text-muted-foreground">滿</span>
                          <Input
                            className="w-20 text-center"
                            placeholder="金額"
                            {...register(`promotionItems.${index}.thresholdAmount`)}
                          />
                          <span className="text-sm text-muted-foreground">減</span>
                          <Input
                            className="w-20 text-center"
                            placeholder="金額"
                            {...register(`promotionItems.${index}.discountValue`)}
                          />
                          <span className="text-sm text-muted-foreground">元</span>
                        </>
                      ) : (
                        <>
                          <Input
                            className="w-20 text-center"
                            placeholder="折扣"
                            {...register(`promotionItems.${index}.discountValue`)}
                          />
                          <span className="text-sm text-muted-foreground">%OFF</span>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* 優惠碼數量 */}
              <div className="flex items-center gap-4">
                <label className="w-20 text-sm text-muted-foreground text-right shrink-0">優惠碼數量</label>
                <div className="flex-1">
                  <Input placeholder="請輸入數量" type="number" min={1} {...register('maxCount')} />
                  {errors.maxCount && <p className="text-xs text-destructive mt-1">{errors.maxCount.message}</p>}
                </div>
              </div>

              {/* 優惠碼口令 */}
              <div className="flex items-center gap-4">
                <label className="w-20 text-sm text-muted-foreground text-right shrink-0">優惠碼口令</label>
                <div className="flex-1">
                  <Input placeholder="文本輸入" {...register('promotionCode')} />
                  {errors.promotionCode && (
                    <p className="text-xs text-destructive mt-1">{errors.promotionCode.message}</p>
                  )}
                </div>
              </div>

              {/* 活動日期 */}
              <div className="flex items-center gap-4">
                <label className="w-20 text-sm text-muted-foreground text-right shrink-0">活動日期</label>
                <div className="flex items-center gap-2 flex-1">
                  <Input type="date" className="flex-1" {...register('startTime')} />
                  <span className="text-muted-foreground">至</span>
                  <Input type="date" className="flex-1" {...register('endTime')} />
                </div>
              </div>
              {(errors.startTime || errors.endTime) && (
                <p className="text-xs text-destructive -mt-2 pl-24">
                  {errors.startTime?.message ?? errors.endTime?.message}
                </p>
              )}

              {/* 活動狀態 */}
              <div className="flex items-center gap-4">
                <label className="w-20 text-sm text-muted-foreground text-right shrink-0">活動狀態</label>
                <Controller
                  control={control}
                  name="active"
                  render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
                />
              </div>

              {/* 備註 */}
              <div className="flex items-center gap-4">
                <label className="w-20 text-sm text-muted-foreground text-right shrink-0">備註</label>
                <Input placeholder="請輸入備註" {...register('remark')} />
              </div>

              {/* 提交 */}
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90" loading={patchMutation.isPending}>
                確認
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PromoCodesPage;
