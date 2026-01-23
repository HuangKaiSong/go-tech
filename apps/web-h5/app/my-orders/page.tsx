"use client";

import Footer from "@/app/components/Footer";
import Header from "@/app/components/Header";
import Link from "@/app/components/Link";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Separator,
} from "@go-tech-frontend/ui";
import {
  ArrowUpCircle,
  Building,
  Calendar,
  Check,
  Clock,
  Droplets,
  Eye,
  FileText,
  LayoutDashboard,
  Minus,
  Package,
  Plus,
  Settings,
  ShoppingCart,
  Users,
} from "lucide-react";
import { useState } from "react";

// 增值服務列表
const valueAddedServices = [
  { id: "extra-50-units", name: "額外50個單位", price: 500 },
  { id: "extra-100-units", name: "額外100個單位", price: 900 },
  { id: "priority-support", name: "優先客服支援", price: 300 },
  { id: "data-backup", name: "數據備份服務", price: 200 },
  { id: "custom-report", name: "自訂報表功能", price: 400 },
];

// 套餐升級選項
const upgradePlans = [
  {
    id: "plan-b",
    name: "套餐B",
    subtitle: "最多可創建100個單位",
    price: 3200,
    features: [
      "管理層",
      "代理列表",
      "客戶列表",
      "合同列表",
      "單位列表",
      "水電列表",
      "跟進列表",
      "日程",
      "dashboard",
    ],
  },
  {
    id: "plan-c",
    name: "套餐C",
    subtitle: "最多可創建500個單位",
    price: 6800,
    features: [
      "管理層",
      "代理列表",
      "客戶列表",
      "合同列表",
      "單位列表",
      "水電列表",
      "跟進列表",
      "日程",
      "dashboard",
      "高級報表",
      "API接口",
      "多公司管理",
    ],
  },
];

// 模擬訂單數據
const mockOrders = [
  {
    id: "ORD-2024-001",
    orderDate: "2024-01-15",
    planName: "套餐B",
    planSubtitle: "最多可創建100個單位",
    price: "$3,200",
    currency: "HKD",
    status: "active",
    statusLabel: "使用中",
    features: [
      { icon: Users, label: "管理層" },
      { icon: FileText, label: "代理列表" },
      { icon: Users, label: "客戶列表" },
      { icon: FileText, label: "合同列表(線上&線下合同)" },
      { icon: Building, label: "單位列表" },
      { icon: Droplets, label: "水電列表" },
      { icon: Clock, label: "跟進列表" },
      { icon: Calendar, label: "日程" },
      { icon: LayoutDashboard, label: "dashboard" },
    ],
    addons: [{ name: "額外50個單位", quantity: 2, price: "$500" }],
    expiryDate: "2025-01-15",
  },
  {
    id: "ORD-2023-042",
    orderDate: "2023-06-20",
    planName: "套餐A",
    planSubtitle: "最多可創建25個單位",
    price: "$1,000",
    currency: "HKD",
    status: "expired",
    statusLabel: "已過期",
    features: [
      { icon: Users, label: "管理層" },
      { icon: FileText, label: "代理列表" },
      { icon: Users, label: "客戶列表" },
      { icon: FileText, label: "合同列表(線上&線下合同)" },
      { icon: Building, label: "單位列表" },
      { icon: Droplets, label: "水電列表" },
    ],
    addons: [],
    expiryDate: "2024-06-20",
  },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "active":
      return "bg-green-500/10 text-green-600 border-green-200";
    case "pending":
      return "bg-yellow-500/10 text-yellow-600 border-yellow-200";
    case "expired":
      return "bg-gray-500/10 text-gray-600 border-gray-200";
    default:
      return "bg-gray-500/10 text-gray-600 border-gray-200";
  }
};

const MyOrders = () => {
  const [showAddonsDialog, setShowAddonsDialog] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedServices, setSelectedServices] = useState<
    Record<string, number>
  >({});
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [selectedUpgradePlan, setSelectedUpgradePlan] = useState<string | null>(
    null
  );
  const [paymentType, setPaymentType] = useState<"addons" | "upgrade">(
    "addons"
  );
  const [upgradeSelectedServices, setUpgradeSelectedServices] = useState<
    Record<string, number>
  >({});

  const toggleService = (serviceId: string) => {
    setSelectedServices(prev => {
      if (prev[serviceId]) {
        const { [serviceId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [serviceId]: 1 };
    });
  };

  const updateQuantity = (serviceId: string, delta: number) => {
    setSelectedServices(prev => {
      const current = prev[serviceId] || 0;
      const newQty = Math.max(0, current + delta);
      if (newQty === 0) {
        const { [serviceId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [serviceId]: newQty };
    });
  };

  const calculateAddonsTotal = () => {
    return Object.entries(selectedServices).reduce((sum, [id, qty]) => {
      const service = valueAddedServices.find(s => s.id === id);
      return sum + (service ? service.price * qty : 0);
    }, 0);
  };

  const openAddonsDialog = (orderId: string) => {
    setSelectedOrderId(orderId);
    setSelectedServices({});
    setShowAddonsDialog(true);
  };

  const handleConfirmAddons = () => {
    setShowAddonsDialog(false);
    setPaymentType("addons");
    setShowPaymentDialog(true);
  };

  const handlePaymentSelect = (method: string) => {
    if (paymentType === "addons") {
      console.log("購買增值服務:", {
        method,
        orderId: selectedOrderId,
        services: selectedServices,
      });
    } else {
      console.log("套餐升級:", {
        method,
        orderId: selectedOrderId,
        upgradePlan: selectedUpgradePlan,
      });
    }
    setShowPaymentDialog(false);
    setSelectedServices({});
    setSelectedOrderId(null);
    setSelectedUpgradePlan(null);
  };

  const openUpgradeDialog = (orderId: string) => {
    setSelectedOrderId(orderId);
    setSelectedUpgradePlan(null);
    setUpgradeSelectedServices({});
    setShowUpgradeDialog(true);
  };

  const toggleUpgradeService = (serviceId: string) => {
    setUpgradeSelectedServices(prev => {
      if (prev[serviceId]) {
        const { [serviceId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [serviceId]: 1 };
    });
  };

  const updateUpgradeQuantity = (serviceId: string, delta: number) => {
    setUpgradeSelectedServices(prev => {
      const current = prev[serviceId] || 0;
      const newQty = Math.max(0, current + delta);
      if (newQty === 0) {
        const { [serviceId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [serviceId]: newQty };
    });
  };

  const calculateUpgradeAddonsTotal = () => {
    return Object.entries(upgradeSelectedServices).reduce((sum, [id, qty]) => {
      const service = valueAddedServices.find(s => s.id === id);
      return sum + (service ? service.price * qty : 0);
    }, 0);
  };

  const handleConfirmUpgrade = () => {
    setShowUpgradeDialog(false);
    setPaymentType("upgrade");
    setShowPaymentDialog(true);
  };

  const getUpgradePrice = () => {
    const plan = upgradePlans.find(p => p.id === selectedUpgradePlan);
    return plan ? plan.price : 0;
  };

  const getPaymentAmount = () => {
    if (paymentType === "addons") {
      return calculateAddonsTotal();
    }
    return getUpgradePrice() + calculateUpgradeAddonsTotal();
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative py-7 bg-[#FFF8F5]">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Package className="w-10 h-10 text-primary" />
            <h1 className="text-4xl md:text-5xl font-bold text-primary">
              我的訂單
            </h1>
          </div>
          <p className="text-lg text-primary/80">My Orders</p>
        </div>
      </section>

      {/* Orders List */}
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-6">
            {mockOrders.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">暫無訂單</h3>
                  <p className="text-muted-foreground mb-6">
                    您還沒有任何訂單記錄
                  </p>
                  <Link href="/service-plan">
                    <Button>查看服務計劃</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              mockOrders.map(order => (
                <Card
                  key={order.id}
                  className="border border-border hover:shadow-lg transition-shadow"
                >
                  <CardHeader className="pb-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <Settings className="w-6 h-6 text-primary" />
                          <h3 className="text-xl font-bold text-foreground">
                            {order.planName}
                          </h3>
                          <Badge className={getStatusColor(order.status)}>
                            {order.statusLabel}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {order.planSubtitle}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">
                          {order.price}{" "}
                          <span className="text-base">{order.currency}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          訂單編號：{order.id}
                        </p>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* 訂單資訊 */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-foreground border-b border-foreground/30 pb-2">
                          訂單資訊
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              下單日期
                            </span>
                            <span>{order.orderDate}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              到期日期
                            </span>
                            <span>{order.expiryDate}</span>
                          </div>
                          {order.addons.length > 0 && (
                            <div className="pt-2 border-t border-foreground/30">
                              <span className="text-muted-foreground">
                                增值服務：
                              </span>
                              {order.addons.map((addon, idx) => (
                                <div
                                  key={idx}
                                  className="flex justify-between mt-1"
                                >
                                  <span>
                                    {addon.name} x{addon.quantity}
                                  </span>
                                  <span>{addon.price}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 包含功能 */}
                      <div>
                        <h4 className="font-medium text-foreground border-b border-foreground/30 pb-2 mb-3">
                          包含功能
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                          {order.features.map((feature, fIndex) => (
                            <div
                              key={fIndex}
                              className="flex items-center gap-2 py-1.5 px-2 rounded bg-[#FAEEEB]"
                            >
                              <feature.icon className="w-4 h-4 text-[#F9881E]" />
                              <span className="text-xs text-muted-foreground">
                                {feature.label}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* 操作按鈕 */}
                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-foreground/30">
                      <Link href={`/my-orders/${order.id}`}>
                        <Button variant="outline" size="sm" className="gap-2">
                          <Eye className="w-4 h-4" />
                          查看詳情
                        </Button>
                      </Link>
                      {order.status === "active" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() => openAddonsDialog(order.id)}
                          >
                            <ShoppingCart className="w-4 h-4" />
                            購買增值服務
                          </Button>
                          {order.planName !== "套餐C" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-2 border-primary text-primary hover:bg-primary hover:text-white"
                              onClick={() => openUpgradeDialog(order.id)}
                            >
                              <ArrowUpCircle className="w-4 h-4" />
                              套餐升級
                            </Button>
                          )}
                          <Link href={`/renew-order/${order.id}`}>
                            <Button size="sm">續費</Button>
                          </Link>
                        </>
                      )}
                      {order.status === "expired" && (
                        <Link href="/service-plan">
                          <Button size="sm">重新訂購</Button>
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}

            {/* 購買新套餐 */}
            <div className="flex items-center justify-between p-6 bg-muted/30 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 mt-8 border border-gray-300">
              <div>
                <h3 className="font-medium text-lg">需要更多功能？</h3>
                <p className="text-sm text-muted-foreground">
                  探索其他套餐方案，找到最適合您的選擇
                </p>
              </div>
              <Link href="/service-plan">
                <Button className="gap-2">
                  <Package className="w-4 h-4" />
                  購買新套餐
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 購買增值服務對話框 */}
      <Dialog open={showAddonsDialog} onOpenChange={setShowAddonsDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>購買增值服務</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {valueAddedServices.map(service => {
              const isSelected = selectedServices[service.id] !== undefined;
              const quantity = selectedServices[service.id] || 0;

              return (
                <div
                  key={service.id}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    isSelected ? "border-primary bg-primary/5" : "border-border"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleService(service.id)}
                        className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <div>
                        <p className="font-medium">{service.name}</p>
                        <p className="text-sm text-muted-foreground">
                          ${service.price} HKD / 個
                        </p>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(service.id, -1)}
                          className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-muted transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center font-medium">
                          {quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(service.id, 1)}
                          className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-muted transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {isSelected && quantity > 0 && (
                    <div className="mt-2 pt-2 border-t border-foreground/30 text-right text-sm text-muted-foreground">
                      小計：
                      <span className="font-medium text-foreground">
                        ${(service.price * quantity).toLocaleString()} HKD
                      </span>
                    </div>
                  )}
                </div>
              );
            })}

            <Separator />

            <div className="flex justify-between items-center text-lg font-bold">
              <span>總計</span>
              <span className="text-primary">
                ${calculateAddonsTotal().toLocaleString()} HKD
              </span>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowAddonsDialog(false)}
              >
                取消
              </Button>
              <Button
                className="flex-1"
                disabled={calculateAddonsTotal() === 0}
                onClick={handleConfirmAddons}
              >
                確認購買
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 套餐升級對話框 */}
      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowUpCircle className="w-5 h-5 text-primary" />
              套餐升級
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              選擇您想升級的套餐方案，享受更多功能與服務
            </p>

            {upgradePlans.map(plan => {
              const currentOrder = mockOrders.find(
                o => o.id === selectedOrderId
              );
              const isCurrentPlan = currentOrder?.planName === plan.name;
              const isLowerPlan =
                plan.name === "套餐B" && currentOrder?.planName === "套餐C";

              if (isCurrentPlan || isLowerPlan) return null;

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
                      <h4 className="font-bold text-lg">{plan.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {plan.subtitle}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-primary">
                        ${plan.price.toLocaleString()}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        HKD/年
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {plan.features.slice(0, 6).map((feature, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-[#FAEEEB] text-muted-foreground"
                      >
                        <Check className="w-3 h-3 text-[#F9881E]" />
                        {feature}
                      </span>
                    ))}
                    {plan.features.length > 6 && (
                      <span className="text-xs text-muted-foreground">
                        +{plan.features.length - 6} 更多功能
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
                    {valueAddedServices.map(service => {
                      const isSelected =
                        upgradeSelectedServices[service.id] !== undefined;
                      const quantity = upgradeSelectedServices[service.id] || 0;

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
                                  ${service.price} HKD / 個
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
                onClick={() => setShowUpgradeDialog(false)}
              >
                取消
              </Button>
              <Button
                className="flex-1"
                disabled={!selectedUpgradePlan}
                onClick={handleConfirmUpgrade}
              >
                確認升級
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 支付方式選擇對話框 */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>選擇支付方式</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <p className="text-center text-muted-foreground">
              應付金額：
              <span className="text-xl font-bold text-primary">
                ${getPaymentAmount().toLocaleString()} HKD
              </span>
            </p>
            <div className="space-y-3">
              <button
                onClick={() => handlePaymentSelect("wechat")}
                className="w-full p-4 rounded-lg border-2 hover:border-green-500 hover:bg-green-50 transition-colors flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">微</span>
                </div>
                <span className="font-medium">微信支付</span>
              </button>
              <button
                onClick={() => handlePaymentSelect("alipay")}
                className="w-full p-4 rounded-lg border-2 hover:border-blue-500 hover:bg-blue-50 transition-colors flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">支</span>
                </div>
                <span className="font-medium">支付寶支付</span>
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default MyOrders;
