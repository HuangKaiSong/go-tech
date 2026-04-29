"use client";

import Footer from "@/app/components/Footer";
import Header from "@/app/components/Header";
import Link from "@/app/components/Link";
import valueAddedServices from '@/app/constants/addedServices';
import { useAuth } from "@/contexts/AuthContext";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@go-tech-frontend/ui";
import { useAsyncEffect } from "ahooks";
import {
  ArrowUpCircle,
  Eye,
  Package,
  Settings,
  ShoppingCart
} from "lucide-react";
import { useMemo, useState } from "react";
import { OrderStatusEnum } from "../constants/order";
import { AddService } from "./AddService";
import { Upgrade } from "./Upgrade";

const getStatusColor = (status: OrderStatusEnum) => {
  switch (status) {
    case OrderStatusEnum.COMPLETED:
      return "bg-green-500/10 text-green-600 border-green-200";
    case OrderStatusEnum.PROCESSING:
      return "bg-yellow-500/10 text-yellow-600 border-yellow-200";
    case OrderStatusEnum.WAIT_PAY:
      return "bg-gray-500/10 text-gray-600 border-gray-200";
    case OrderStatusEnum.REJECT:
      return "bg-red-500/10 text-red-600 border-red-200";
    default:
      return "bg-gray-500/10 text-gray-600 border-gray-200";
  }
};


const MyOrders = () => {
  const { token } = useAuth()

  const [orderList, setOrderList] = useState<any[]>([])
  const [showAddonsDialog, setShowAddonsDialog] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const selectOrder = useMemo(() => {
    return orderList.find(order => order.id === selectedOrderId);
  }, [orderList, selectedOrderId])
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
    if (!selectedOrderId) return 0
    return Object.entries(selectedServices).reduce((sum, [id, qty]) => {
      const service = valueAddedServices.find(s => s.id === id);
      let price = 0
      if (service) {
        price = selectOrder?.platformPackageDto?.[service.id] || 0;
      }
      
      return sum + (service ? price * qty : 0);
    }, 0);
  };

  const openAddonsDialog = (orderId: string) => {
    setSelectedOrderId(orderId);
    setSelectedServices({});
    setShowAddonsDialog(true);
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

  const calculateUpgradeAddonsTotal = () => {
    return Object.entries(upgradeSelectedServices).reduce((sum, [id, qty]) => {
      const service = valueAddedServices.find(s => s.id === id);
      return sum + (service ? service.price * qty : 0);
    }, 0);
  };

  const getUpgradePrice = () => {
    const plan = orderList.find(p => p.id === selectedUpgradePlan);
    return plan ? plan.price : 0;
  };

  const getPaymentAmount = () => {
    if (paymentType === "addons") {
      return calculateAddonsTotal();
    }
    return getUpgradePrice() + calculateUpgradeAddonsTotal();
  };

  useAsyncEffect(async() => {
    try {
      const data = await fetch('/go-tech/platform/packageOrder/myOrders', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Type': 'platform_customer',
          'Authorization': `Bearer ${token}`,
        },
      }).then(res => res.json())
      if (data.code === 200) {
        setOrderList(data.data)
      }
      
    } catch (error) {
      console.log(error);
      setOrderList([])
    }
  }, [])

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
            {orderList?.length === 0 ? (
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
              orderList?.map(order => (
                <Card
                  key={order.orderNo}
                  className="border border-border hover:shadow-lg transition-shadow"
                >
                  <CardHeader className="pb-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <Settings className="w-6 h-6 text-primary" />
                          <h3 className="text-xl font-bold text-foreground">
                            {order.platformPackageDto?.packageName}
                          </h3>
                          <Badge className={getStatusColor(order.orderStatus)}>
                            {order.orderStatusName}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          最多可創建{order.platformPackageDto?.unitCount}個單位
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">
                          {order.finalAmount}{" "}
                          <span className="text-base">HKD</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          訂單編號：{order.orderNo}
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
                            <span>{order.createTime}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              到期日期
                            </span>
                            <span>{order.expireDate || '-'}</span>
                          </div>
                          {order.orderItems?.filter((item: any) => item.itemType !== 1)?.length > 0 && (
                            <div className="pt-2 border-t border-foreground/30">
                              <span className="text-muted-foreground">
                                增值服務：
                              </span>
                              {order.orderItems?.filter((item: any) => item.itemType !== 1)?.map((addon: any) => (
                                <div
                                  key={addon.id}
                                  className="flex justify-between mt-1"
                                >
                                  <span>
                                    {addon.itemName} x{addon.count}
                                  </span>
                                  <span>{addon.amount}</span>
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
                          {order.platformPackageDto?.packageItemList?.map((feature: any) => {
                            if (feature.level >= 2) return null
                            return (
                              <div
                                key={feature.id}
                                className="flex items-center gap-2 py-1.5 px-2 rounded bg-[#FAEEEB]"
                              >
                                {/* <feature.icon className="w-4 h-4 text-[#F9881E]" /> */}
                                {feature.menuIcon && (
                                  <svg className="svg-icon w-4 h-4 text-primary mr-1" aria-hidden="true">
                                    <use href={`#icon-${feature.menuIcon}`} xlinkHref={`#icon-${feature.menuIcon}`}></use>
                                  </svg>
                                )}
                                <span className="text-xs text-muted-foreground">
                                  {feature.menuTitle}
                                </span>
                              </div>
                            )
                          })}
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
                        <>
                          {order.orderStatus === OrderStatusEnum.COMPLETED && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-2"
                                onClick={() => {
                                  openAddonsDialog(order.id)
                                }}
                              >
                                <ShoppingCart className="w-4 h-4" />
                                購買增值服務
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-2 border-primary text-primary hover:bg-primary hover:text-white"
                                onClick={() => openUpgradeDialog(order.id)}
                              >
                                <ArrowUpCircle className="w-4 h-4" />
                                套餐升級
                              </Button>
                              <Link href={`/renew-order/${order.id}`}>
                                <Button size="sm">續費</Button>
                              </Link>
                            </>
                          )}
                        </>
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
      {showAddonsDialog && (
        <AddService data={selectOrder} open={showAddonsDialog} onOpenChange={setShowAddonsDialog} />
      )}

      {/* 套餐升級對話框 */}
      {showUpgradeDialog && (
        <Upgrade data={selectOrder} open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog} />
      )}

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
