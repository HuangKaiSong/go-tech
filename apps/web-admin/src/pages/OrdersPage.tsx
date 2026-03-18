import Fps from "@/components/payment/Fps";
import {
  OrderItemTypeEnum,
  OrderStatusEnum,
  OrderStatusLabel,
  OrderTypeEnum,
} from "@/constants/order";
import { PayTypeEnum, PayTypelabel } from "@/constants/payment";
import { useAuth } from "@/hooks/use-auth";
import { Order } from "@/mocks/orders";
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Pagination,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  toast,
  UploadedFile,
} from "@go-tech-frontend/ui";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Check,
  Eye,
  FilePlus,
  FileText,
  Minus,
  Plus,
  Receipt,
  RotateCcw,
  Search,
} from "lucide-react";
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

interface Reponse {
  records: Order[];
  total: number;
}

const valueAddedServices = [
  { id: "rentSysPrice", name: "Sales Module（租務）", price: 20 },
  { id: "venueSysPrice", name: "跟進 Module（維務）", price: 20 },
  { id: "accountingSysPrice", name: "Xero Module（會計）", price: 50 },
  { id: "custServiceSysPrice", name: "客服 Module（維務）", price: 20 },
  { id: "addUnitPrice", name: "增加單位數量", price: 80 },
];

const defaultSize = 10;

const OrdersPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [orderType, setOrderType] = useState("");
  const [orderStatus, setOrderStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultSize);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const toastId = useRef(null);

  const [client, setClient] = useState("");
  const [month, setMonth] = useState<number>(1);
  const [clientSearch, setClientSearch] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedUpgradePlan, setSelectedUpgradePlan] = useState<string | null>(
    null,
  );
  const [upgradeSelectedServices, setUpgradeSelectedServices] = useState<
    Record<string, number>
  >({});

  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<PayTypeEnum | null>(null);

  const { data, refetch } = useQuery<Reponse>({
    queryKey: [
      "platform/packageOrder/page",
      currentPage.toString(),
      pageSize.toString(),
    ],
    queryFn: async () => {
      try {
        const url = new URL(
          `${import.meta.env.VITE_PROXY_PREFIX}/go-tech/platform/packageOrder/page`,
          location.origin,
        );
        url.searchParams.append("current", currentPage.toString());
        url.searchParams.append("size", pageSize.toString());
        url.searchParams.append("orderStatus", orderStatus.toString());

        const res = await fetch(url.toString());
        const response = await res.json();
        if (!response || !response.code || response.code !== 200) {
          throw new Error("Failed to fetch data");
        }

        return response.data;
      } catch (error) {
        console.log(error);
        return {
          records: [],
          total: 0,
        };
      }
    },
    initialData: () => {
      return {
        records: [],
        total: 0,
      };
    },
  });

  const optionProp = { label: "custName", value: "custCode" } as const;

  const { data: customerData } = useQuery({
    queryKey: ["platformCustomer/page"],
    queryFn: async () => {
      const url = new URL(
        `${import.meta.env.VITE_PROXY_PREFIX}/go-tech/platform/platformCustomer/page`,
        location.origin,
      );
      url.searchParams.append("current", "1");
      url.searchParams.append("size", "999999");

      const res = await fetch(url.toString());
      const response = await res.json();

      if (!response || response.code !== 200) {
        throw new Error("Failed to fetch customers");
      }

      return response.data?.records ?? [];
    },
    initialData: () => [],
  });

  const filteredCustomers = (customerData ?? []).filter((item: any) => {
    if (!clientSearch) return true;
    const label = String(item?.[optionProp.label] ?? "");
    return label.toLowerCase().includes(clientSearch.toLowerCase());
  });

  const confirmOrder = useMutation({
    mutationFn: async (orderId: number) => {
      try {
        toast.dismiss();
        toastId.current = toast.loading("处理中...");
        const url = `${import.meta.env.VITE_PROXY_PREFIX}/go-tech/platform/packageOrder/confirm?id=${orderId.toString()}`;
        const res = await fetch(url, {
          method: "POST",
        });
        const response = await res.json();
        if (!response || !response.code || response.code !== 200) {
          throw new Error("Failed to fetch data");
        }

        return response;
      } catch (error) {
        console.log(error);
        throw error;
      }
    },
    onSuccess: () => {
      toast.success("订单确认成功", {
        id: toastId.current,
        onDismiss() {
          toastId.current = null;
        },
      });
      refetch();
      setConfirmDialogOpen(false);
      setSelectedOrder(null);
    },
    onError: (error) => {
      toast.error("订单确认失败", {
        id: toastId.current,
        description: error.message,
        onDismiss() {
          toastId.current = null;
        },
      });
      console.log(error);
    },
  });

  const { data: plans } = useQuery({
    queryKey: ["plans"],
    queryFn: async () => {
      try {
        const url = new URL(
          `${import.meta.env.VITE_PROXY_PREFIX}/go-tech/platform/platformPackage/enabledList`,
          location.origin,
        );
        const res = await fetch(url);
        const response = await res.json();
        if (!response || !response.code || response.code !== 200) {
          throw new Error("Failed to fetch data");
        }

        return response.data;
      } catch (error) {
        console.log(error);
        return [];
      }
    },
    initialData: () => {
      return [];
    },
  });

  const handleView = (orderId: number) => {
    navigate(`/orders/${orderId}`);
  };

  const handleReset = () => {
    setCustomerName("");
    setPhone("");
    setOrderType("");
    setOrderStatus("");
  };

  const handleOpenConfirmDialog = (order: Order) => {
    setSelectedOrder(order);
    setConfirmDialogOpen(true);
  };

  const handleConfirmPayment = () => {
    if (selectedOrder) {
      confirmOrder.mutateAsync(selectedOrder.id);
    }
  };

  const handleRejectPayment = () => {
    if (selectedOrder) {
      refetch();
      setConfirmDialogOpen(false);
      setSelectedOrder(null);
    }
  };

  const getStatusBadge = (status: OrderStatusEnum) => {
    switch (status) {
      case OrderStatusEnum.COMPLETED:
        return (
          <Badge variant="outline" className="text-success border-success">
            已支付
          </Badge>
        );
      case OrderStatusEnum.PROCESSING:
        return (
          <Badge variant="outline" className="text-warning border-warning">
            待確認
          </Badge>
        );
      case OrderStatusEnum.CANCELED:
        return (
          <Badge
            variant="outline"
            className="text-destructive border-destructive"
          >
            已取消
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-primary border-primary">
            未支付
          </Badge>
        );
    }
  };

  const handleCreate = () => {
    setShowCreateDialog(true);
  };

  const toggleUpgradeService = (serviceId: string) => {
    setUpgradeSelectedServices((prev) => {
      if (prev[serviceId]) {
        const { [serviceId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [serviceId]: 1 };
    });
  };

  const updateUpgradeQuantity = (serviceId: string, delta: number) => {
    setUpgradeSelectedServices((prev) => {
      const current = prev[serviceId] || 0;
      const newQty = Math.max(0, current + delta);
      if (newQty === 0) {
        const { [serviceId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [serviceId]: newQty };
    });
  };

  const getUpgradePrice = () => {
    const plan = plans.find((p) => p.id === selectedUpgradePlan);
    return plan ? plan.price * month : 0;
  };

  const calculateUpgradeAddonsTotal = () => {
    const plan = plans.find((p) => p.id === selectedUpgradePlan);
    if (!plan) return 0;
    return Object.entries(upgradeSelectedServices).reduce((sum, [id, qty]) => {
      const service = valueAddedServices.find((s) => s.id === id);
      return sum + (service ? plan[service.id] * qty : 0);
    }, 0);
  };

  const handleCreateDialogChange = (open: boolean) => {
    setShowCreateDialog(open);
    setUpgradeSelectedServices({});
    setSelectedUpgradePlan(null);
    setClient("");
  };

  const handleConfirmUpgrade = () => {
    setShowPaymentDialog(true);
    setSelectedPaymentMethod(null);
  };

  const handleBackToPaymentMethods = () => {
    setSelectedPaymentMethod(null);
    setShowPaymentDialog(false);
  };

  // 创建订单
  const createOrderMu = useMutation({
    mutationFn: async (data: any) => {
      toast.dismiss(toastId.current);
      toastId.current = toast.loading("处理中...");
      const url = `${import.meta.env.VITE_PROXY_PREFIX}/go-tech/platform/packageOrder/add`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      const response = await res.json();
      if (!response || !response.code || response.code !== 200) {
        throw new Error("Failed to fetch data");
      }

      return response;
    },
    onSuccess: (data) => {
      toast.success("订单创建成功", { id: toastId.current });
      return data;
    },
  });
  const payEvidenceMu = useMutation({
    mutationFn: async (data: any) => {
      const url = `${import.meta.env.VITE_PROXY_PREFIX}/go-tech/platform/packageOrder/payEvidence`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      const response = await res.json();
      if (!response || !response.code || response.code !== 200) {
        throw new Error("Failed to fetch data");
      }

      return response;
    },
    onSuccess: (data) => {
      return data;
    },
  });

  const getServiceUnitPrice = (serviceId: string) => {
    const currentPlan = plans.find(
      (plan) => plan.id === selectedUpgradePlan,
    ) as any;

    if (!currentPlan) return 0;

    if (serviceId === "rentSysPrice") return currentPlan.rentSysPrice;
    if (serviceId === "venueSysPrice") return currentPlan.venueSysPrice;
    if (serviceId === "accountingSysPrice")
      return currentPlan.accountingSysPrice;
    if (serviceId === "custServiceSysPrice")
      return currentPlan.custServiceSysPrice;
    if (serviceId === "addUnitPrice") return currentPlan.addUnitPrice;

    return 0;
  };

  const handleFpsPaymentConfirm = async (voucherFile: UploadedFile) => {
    // 设置参数创建订单
    const currentPlan = plans.find(
      (plan) => plan.id === selectedUpgradePlan,
    ) as any;

    const orderInfo: any = {
      orderType: OrderTypeEnum.PURCHASE,
      payType: selectedPaymentMethod,
      orderItems: [
        {
          packageId: currentPlan.id,
          itemType: OrderItemTypeEnum.PACKAGE,
          itemName: currentPlan?.packageName,
          price: currentPlan?.price,
          count: month,
        },
      ],
    };

    if (upgradeSelectedServices) {
      Object.entries(upgradeSelectedServices).map(([serviceId, quantity]) => {
        const service = valueAddedServices.find((s) => s.id === serviceId);
        if (!service) return null;
        const serviceTotalPrice = getServiceUnitPrice(serviceId);
        orderInfo.orderItems.push({
          itemType: OrderItemTypeEnum.ADDITION,
          count: quantity,
          price: serviceTotalPrice,
          packageId: currentPlan?.id,
          itemName: service.name,
        });
      });
    }

    // 创建人
    orderInfo.createUser = user.userId;
    // 客户编码
    orderInfo.custCode = client;

    try {
      // 创建订单
      const orderResponse = await createOrderMu.mutateAsync(orderInfo);

      if (orderResponse.code === 200) {
        const orderId = orderResponse.data;
        if (orderInfo.payType === PayTypeEnum.FPS) {
          // 上传凭证
          const payEvidenceData = {
            id: orderId,
            payEvidence: voucherFile.url,
          };
          await payEvidenceMu.mutateAsync(payEvidenceData);
        }

        setShowPaymentDialog(false);
        setSelectedPaymentMethod(null);
        handleCreateDialogChange(false);
        // 刷新订单列表
        refetch();
      } else {
        toast.error(orderResponse.message, { id: toastId.current });
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <FileText className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">訂單列表</h1>
      </div>

      {/* Search Filters */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground whitespace-nowrap">
              客戶名稱
            </label>
            <Input
              placeholder="請輸入文字"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-40"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground whitespace-nowrap">
              電話號碼
            </label>
            <Input
              placeholder="請輸入文字"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-40"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground whitespace-nowrap">
              訂單類型
            </label>
            <Select value={orderType} onValueChange={setOrderType}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="請選擇" />
              </SelectTrigger>
              <SelectContent></SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground whitespace-nowrap">
              訂單狀態
            </label>
            <Select value={orderStatus} onValueChange={setOrderStatus}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="請選擇" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(OrderStatusLabel).map(([key, value]) => (
                  <SelectItem key={key} value={key}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-3 ml-auto">
            <Button className="gap-2" onClick={() => refetch()}>
              <Search className="w-4 h-4" />
              搜索
            </Button>
            <Button variant="outline" onClick={handleReset} className="gap-2">
              <RotateCcw className="w-4 h-4" />
              重置
            </Button>
            <Button variant="outline" onClick={handleCreate} className="gap-2">
              <Plus className="w-4 h-4" />
              创建
            </Button>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-table-header hover:bg-table-header">
              <TableHead className="text-center font-medium">
                訂單編號
              </TableHead>
              <TableHead className="text-center font-medium">
                客戶名稱
              </TableHead>
              <TableHead className="text-center font-medium">
                電話號碼
              </TableHead>
              <TableHead className="text-center font-medium">
                電子郵箱
              </TableHead>
              <TableHead className="text-center font-medium">
                套餐類型
              </TableHead>
              <TableHead className="text-center font-medium">
                訂單金額
              </TableHead>
              <TableHead className="text-center font-medium">
                支付方式
              </TableHead>
              <TableHead className="text-center font-medium">
                支付時間
              </TableHead>
              <TableHead className="text-center font-medium">
                訂單狀態
              </TableHead>
              <TableHead className="text-center font-medium">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.records.map((order) => (
              <TableRow key={order.id} className="hover:bg-table-hover">
                <TableCell className="text-center">{order.orderNo}</TableCell>
                <TableCell className="text-center">{order.custName}</TableCell>
                <TableCell className="text-center">{order.custPhone}</TableCell>
                <TableCell className="text-center">{order.custEmail}</TableCell>
                <TableCell className="text-center">
                  {order.packageName}
                </TableCell>
                <TableCell className="text-center">
                  {order.orderAmount}
                </TableCell>
                <TableCell className="text-center">
                  {PayTypelabel[order.payType]}
                </TableCell>
                <TableCell className="text-center">{order.payTime}</TableCell>
                <TableCell className="text-center">
                  {getStatusBadge(order.orderStatus)}
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    {order.orderStatus === OrderStatusEnum.PROCESSING && (
                      <Button
                        variant="link"
                        className="text-warning p-0 h-auto gap-1"
                        onClick={() => handleOpenConfirmDialog(order)}
                      >
                        <Receipt className="w-4 h-4" />
                        確認
                      </Button>
                    )}
                    <Button
                      variant="link"
                      className="text-primary p-0 h-auto gap-1"
                      onClick={() => handleView(order.id)}
                    >
                      <Eye className="w-4 h-4" />
                      查看
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Pagination */}
        <div className="flex justify-end p-4 border-t border-table-border">
          <Pagination
            total={data.total}
            pageSize={pageSize}
            current={currentPage}
            onChange={(page, size) => {
              setCurrentPage(page);
              setPageSize(size);
            }}
          ></Pagination>
        </div>
      </div>

      {/* Confirm Payment Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>確認支付憑證</DialogTitle>
            <DialogDescription>請核實以下訂單資訊及支付憑證</DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">訂單編號：</span>
                  <span className="font-medium">{selectedOrder.id}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">客戶名稱：</span>
                  <span className="font-medium">{selectedOrder.custName}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">套餐類型：</span>
                  <span className="font-medium">{selectedOrder.orderType}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">訂單金額：</span>
                  <span className="font-medium text-primary">
                    {selectedOrder.orderAmount}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">支付方式：</span>
                  <span className="font-medium">
                    {PayTypelabel[selectedOrder.payType]}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">提交時間：</span>
                  <span className="font-medium">{selectedOrder.payTime}</span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-sm text-muted-foreground">
                  支付憑證：
                </span>
                <div className="border border-border rounded-lg overflow-hidden">
                  <img
                    src={
                      selectedOrder.payEvidence ||
                      "https://via.placeholder.com/400x300"
                    }
                    alt="支付憑證"
                    className="w-full h-48 object-cover"
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={handleRejectPayment}
              className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              拒絕
            </Button>
            <Button onClick={handleConfirmPayment}>確認支付</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Order Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={handleCreateDialogChange}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FilePlus className="w-5 h-5 text-primary" />
              创建订单
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              選擇您想创建的套餐方案，享受更多功能與服務
            </p>
            {/* 选择客户 */}
            <div className="space-y-3">
              <Label htmlFor="plan">选择客户</Label>
              <Select
                value={client}
                onValueChange={(value) => setClient(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="请选择客户" />
                </SelectTrigger>
                <SelectContent>
                  <div className="p-2">
                    <Input
                      value={clientSearch}
                      onChange={(e) => setClientSearch(e.target.value)}
                      placeholder="搜索客户"
                      className="h-8"
                      onKeyDown={(e) => e.stopPropagation()}
                      onPointerDown={(e) => e.stopPropagation()}
                    />
                  </div>
                  {filteredCustomers.length === 0 && (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      無匹配客戶
                    </div>
                  )}
                  {filteredCustomers.map((item: any) => (
                    <SelectItem
                      key={String(item?.[optionProp.value])}
                      value={String(item?.[optionProp.value])}
                    >
                      {String(item?.[optionProp.label] ?? "")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-row items-center gap-2">
              <label className="text-sm">時長：</label>
              <Input
                value={month}
                type="number"
                min={1}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="h-9 w-40"
              />
              <div className="text-sm">月</div>
            </div>
            {plans.map((plan) => {
              return (
                <div
                  key={plan.id}
                  onClick={() => setSelectedUpgradePlan(plan.id)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedUpgradePlan === plan.id
                      ? "border-primary bg-primary/5 shadow-md"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-bold text-lg">{plan.packageName}</h4>
                      <p className="text-sm text-muted-foreground">
                        最多可創建{plan.unitCount}個單位
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-primary">
                        ${plan.price.toLocaleString()}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        HKD/月
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {plan.packageItemList
                      ?.slice(0, 6)
                      ?.map((feature: any, idx: number) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-[#FAEEEB] text-muted-foreground"
                        >
                          <Check className="w-3 h-3 text-[#F9881E]" />
                          {feature.menuTitle}
                        </span>
                      ))}
                    {plan.packageItemList?.length > 6 && (
                      <span className="text-xs text-muted-foreground">
                        +{plan.packageItemList?.length - 6} 更多功能
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {/* 增值服務選擇 */}
            {selectedUpgradePlan && (
              <>
                <Separator />
                <div>
                  <h4 className="font-medium text-foreground mb-3">
                    選購增值服務（可選）
                  </h4>
                  <div className="space-y-3">
                    {valueAddedServices.map((service) => {
                      const isSelected =
                        upgradeSelectedServices[service.id] !== undefined;
                      const quantity = upgradeSelectedServices[service.id] || 0;
                      const currentPlan = plans.find(
                        (plan) => plan.id === selectedUpgradePlan,
                      );

                      return (
                        <div
                          key={service.id}
                          className={`p-3 rounded-lg border transition-colors ${
                            isSelected
                              ? "border-primary bg-primary/5"
                              : "border-border"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() =>
                                  toggleUpgradeService(service.id)
                                }
                                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                              />
                              <div>
                                <p className="text-sm font-medium">
                                  {service.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  ${currentPlan[service.id]} HKD / 個
                                </p>
                              </div>
                            </div>

                            {isSelected && (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() =>
                                    updateUpgradeQuantity(service.id, -1)
                                  }
                                  className="w-6 h-6 rounded-full border flex items-center justify-center hover:bg-muted transition-colors"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="w-6 text-center text-sm font-medium">
                                  {quantity}
                                </span>
                                <button
                                  onClick={() =>
                                    updateUpgradeQuantity(service.id, 1)
                                  }
                                  className="w-6 h-6 rounded-full border flex items-center justify-center hover:bg-muted transition-colors"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            <Separator />

            {/* 費用匯總 */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">套餐費用</span>
                <span>${getUpgradePrice().toLocaleString()} HKD</span>
              </div>
              {calculateUpgradeAddonsTotal() > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">增值服務</span>
                  <span>
                    ${calculateUpgradeAddonsTotal().toLocaleString()} HKD
                  </span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between items-center text-lg font-bold">
                <span>總計</span>
                <span className="text-primary">
                  $
                  {(
                    getUpgradePrice() + calculateUpgradeAddonsTotal()
                  ).toLocaleString()}{" "}
                  HKD
                </span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowCreateDialog(false)}
              >
                取消
              </Button>
              <Button
                className="flex-1"
                disabled={!selectedUpgradePlan || !client}
                onClick={handleConfirmUpgrade}
              >
                確認
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showPaymentDialog}
        onOpenChange={(open) => {
          setShowPaymentDialog(open);
          if (!open) {
            setSelectedPaymentMethod(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">
              {selectedPaymentMethod === PayTypeEnum.FPS
                ? "FPS 轉數快支付"
                : "選擇支付方式"}
            </DialogTitle>
          </DialogHeader>

          {selectedPaymentMethod === PayTypeEnum.FPS ? (
            <Fps
              price={getUpgradePrice() + calculateUpgradeAddonsTotal()}
              handleBackToPaymentMethods={handleBackToPaymentMethods}
              handleFpsPaymentConfirm={handleFpsPaymentConfirm}
            />
          ) : (
            <div className="grid gap-4 py-4">
              <Button
                variant="outline"
                disabled
                onClick={() => setSelectedPaymentMethod(PayTypeEnum.WechatPay)}
                className="h-14 text-lg justify-start gap-4 hover:bg-green-50 hover:border-green-500 hover:text-primary"
              >
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-bold">微</span>
                </div>
                微信支付
              </Button>
              <Button
                variant="outline"
                disabled
                onClick={() => setSelectedPaymentMethod(PayTypeEnum.Alipay)}
                className="h-14 text-lg justify-start gap-4 hover:bg-blue-50 hover:border-blue-500 hover:text-primary"
              >
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-bold">支</span>
                </div>
                支付寶支付
              </Button>
              <Button
                variant="outline"
                onClick={() => setSelectedPaymentMethod(PayTypeEnum.FPS)}
                className="h-14 text-lg justify-start gap-4 hover:bg-orange-50 hover:border-orange-500 hover:text-primary"
              >
                <div className="w-8 h-8 bg-linear-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xs font-bold">FPS</span>
                </div>
                FPS 轉數快
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrdersPage;
