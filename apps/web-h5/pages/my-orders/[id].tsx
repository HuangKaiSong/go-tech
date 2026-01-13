import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Settings, Users, FileText, Building, Droplets, Clock, Calendar, 
  LayoutDashboard, Package, ArrowLeft,
  Download, RefreshCw, CheckCircle, Plus, Minus, ShoppingCart
} from "lucide-react";
import { GetStaticPaths, GetStaticProps } from "next";

// 增值服務列表
const valueAddedServices = [
  { id: "extra-50-units", name: "額外50個單位", price: 500 },
  { id: "extra-100-units", name: "額外100個單位", price: 900 },
  { id: "priority-support", name: "優先客服支援", price: 300 },
  { id: "data-backup", name: "數據備份服務", price: 200 },
  { id: "custom-report", name: "自訂報表功能", price: 400 },
];

// 模擬訂單數據
const mockOrders: Record<string, {
  id: string;
  orderDate: string;
  planName: string;
  planSubtitle: string;
  price: string;
  currency: string;
  status: string;
  statusLabel: string;
  features: { icon: React.ComponentType<{ className?: string }>; label: string }[];
  addons: { name: string; quantity: number; price: string; unitPrice: string }[];
  expiryDate: string;
  paymentMethod: string;
  transactionId: string;
}> = {
  "ORD-2024-001": {
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
    addons: [
      { name: "額外50個單位", quantity: 2, price: "$1,000", unitPrice: "$500" },
    ],
    expiryDate: "2025-01-15",
    paymentMethod: "微信支付",
    transactionId: "WX20240115123456789",
  },
  "ORD-2023-042": {
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
    paymentMethod: "支付寶",
    transactionId: "ALI20230620987654321",
  },
};

type OrderProps = {
  id: string;
}

export const getStaticProps = (async (context) => {
  return { props: { id: context.params?.id as string } }
}) satisfies GetStaticProps<OrderProps>

export const getStaticPaths = (async () => {
  return {
    paths: [
      {
        params: {
          id: 'ORD-2024-001',
        },
      }, // See the "paths" section below
    ],
    fallback: true,
  }
}) satisfies GetStaticPaths

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

const OrderDetail = () => {
  const router = useRouter();
  const orderId = router.query.id as string;
  const order = orderId ? mockOrders[orderId] : null;
  
  const [showAddonsDialog, setShowAddonsDialog] = useState(false);
  const [selectedServices, setSelectedServices] = useState<Record<string, number>>({});
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

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

  const handleConfirmAddons = () => {
    setShowAddonsDialog(false);
    setShowPaymentDialog(true);
  };

  const handlePaymentSelect = (method: string) => {
    console.log("購買增值服務:", { method, services: selectedServices });
    setShowPaymentDialog(false);
    setSelectedServices({});
    // 這裡可以添加實際的支付邏輯
  };

  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <section className="pt-32 pb-16">
          <div className="container mx-auto px-4 text-center">
            <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-4">找不到訂單</h1>
            <p className="text-muted-foreground mb-6">該訂單不存在或已被刪除</p>
            <Link href="/my-orders">
              <Button>返回我的訂單</Button>
            </Link>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  // 計算總價
  const planPrice = parseFloat(order.price.replace(/[^0-9.]/g, ""));
  const addonsTotal = order.addons.reduce((sum, addon) => {
    return sum + parseFloat(addon.price.replace(/[^0-9.]/g, ""));
  }, 0);
  const totalPrice = planPrice + addonsTotal;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative py-6 bg-[#FFF8F5]">
        <div className="container mx-auto px-4">
          <button 
            onClick={() => router.push("/my-orders")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            返回我的訂單
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-primary mb-2">
                訂單詳情
              </h1>
              <p className="text-muted-foreground">訂單編號：{order.id}</p>
            </div>
            <Badge className={`text-sm px-3 py-1 ${getStatusColor(order.status)}`}>
              {order.statusLabel}
            </Badge>
          </div>
        </div>
      </section>
      
      {/* Order Content */}
      <section className="py-8 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* 套餐信息 */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Settings className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{order.planName}</h2>
                    <p className="text-sm text-muted-foreground">{order.planSubtitle}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <h3 className="font-medium mb-4 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  包含功能
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {order.features.map((feature, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center gap-2 py-2 px-3 rounded-lg bg-[#FAEEEB]"
                    >
                      <feature.icon className="w-4 h-4 text-[#F9881E]" />
                      <span className="text-sm">{feature.label}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 訂單明細 */}
            <Card>
              <CardHeader>
                <h2 className="text-lg font-bold">訂單明細</h2>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>{order.planName}</span>
                  <span className="font-medium">{order.price} {order.currency}</span>
                </div>
                
                {order.addons.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">增值服務</p>
                      {order.addons.map((addon, idx) => (
                        <div key={idx} className="flex justify-between items-center pl-4">
                          <span className="text-sm">
                            {addon.name} × {addon.quantity}
                            <span className="text-muted-foreground ml-2">({addon.unitPrice}/個)</span>
                          </span>
                          <span className="font-medium">{addon.price} {order.currency}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
                
                <Separator />
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>總計</span>
                  <span className="text-primary">${totalPrice.toLocaleString()} {order.currency}</span>
                </div>
              </CardContent>
            </Card>

            {/* 付款信息 */}
            <Card>
              <CardHeader>
                <h2 className="text-lg font-bold">付款信息</h2>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">付款方式</span>
                      <span>{order.paymentMethod}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">交易編號</span>
                      <span className="font-mono text-xs">{order.transactionId}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">下單日期</span>
                      <span>{order.orderDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">到期日期</span>
                      <span>{order.expiryDate}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 操作按鈕 */}
            <div className="flex flex-col sm:flex-row gap-4 justify-end">
              <Button variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                下載發票
              </Button>
              {order.status === "active" && (
                <>
                  <Button 
                    variant="outline" 
                    className="gap-2"
                    onClick={() => setShowAddonsDialog(true)}
                  >
                    <ShoppingCart className="w-4 h-4" />
                    購買增值服務
                  </Button>
                  <Link href={`/renew-order/${order.id}`}>
                    <Button className="gap-2 w-full sm:w-auto">
                      <RefreshCw className="w-4 h-4" />
                      續費套餐
                    </Button>
                  </Link>
                </>
              )}
              {order.status === "expired" && (
                <Link href="/service-plan">
                  <Button className="gap-2 w-full sm:w-auto">
                    重新訂購
                  </Button>
                </Link>
              )}
            </div>

            {/* 購買增值服務對話框 */}
            <Dialog open={showAddonsDialog} onOpenChange={setShowAddonsDialog}>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>購買增值服務</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  {valueAddedServices.map((service) => {
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
                              <span className="w-8 text-center font-medium">{quantity}</span>
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
                          <div className="mt-2 pt-2 border-t text-right text-sm text-muted-foreground">
                            小計：<span className="font-medium text-foreground">${(service.price * quantity).toLocaleString()} HKD</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  
                  <Separator />
                  
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>總計</span>
                    <span className="text-primary">${calculateAddonsTotal().toLocaleString()} HKD</span>
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

            {/* 支付方式選擇對話框 */}
            <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>選擇支付方式</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <p className="text-center text-muted-foreground">
                    應付金額：<span className="text-xl font-bold text-primary">${calculateAddonsTotal().toLocaleString()} HKD</span>
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
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default OrderDetail;
