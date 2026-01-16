import { useState } from "react";
import Link from "@/components/Link";
import { useRouter } from "next/router";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, Badge, Button, Separator, Label, RadioGroup, RadioGroupItem } from "@/components/ui";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Settings, Users, FileText, Building, Droplets, Clock, Calendar, 
  LayoutDashboard, Package, ArrowLeft, RefreshCw, CheckCircle, CreditCard
} from "lucide-react";
import { GetStaticPaths, GetStaticProps } from "next";

// 模擬訂單數據
const mockOrders: Record<string, {
  id: string;
  planName: string;
  planSubtitle: string;
  price: number;
  currency: string;
  features: { icon: React.ComponentType<{ className?: string }>; label: string }[];
  expiryDate: string;
}> = {
  "ORD-2024-001": {
    id: "ORD-2024-001",
    planName: "套餐B",
    planSubtitle: "最多可創建100個單位",
    price: 3200,
    currency: "HKD",
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
    expiryDate: "2025-01-15",
  },
};

const renewalOptions = [
  { id: "1year", label: "續費1年", months: 12, discount: 0 },
  { id: "2years", label: "續費2年", months: 24, discount: 0.1 },
  { id: "3years", label: "續費3年", months: 36, discount: 0.15 },
];

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


const RenewOrder = () => {
  const router = useRouter();
  const { id: orderId } = router.query;
  const order = orderId ? mockOrders[orderId as string] : null;
  
  const [selectedPeriod, setSelectedPeriod] = useState("1year");
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

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

  const selectedOption = renewalOptions.find(opt => opt.id === selectedPeriod)!;
  const yearlyPrice = order.price;
  const years = selectedOption.months / 12;
  const originalPrice = yearlyPrice * years;
  const discountAmount = originalPrice * selectedOption.discount;
  const finalPrice = originalPrice - discountAmount;

  // 計算新到期日
  const currentExpiry = new Date(order.expiryDate);
  const newExpiry = new Date(currentExpiry);
  newExpiry.setMonth(newExpiry.getMonth() + selectedOption.months);

  const handleConfirmPayment = () => {
    setShowPaymentDialog(true);
  };

  const handlePaymentSelect = (method: string) => {
    console.log("Selected payment method:", method);
    setShowPaymentDialog(false);
    // 這裡可以跳轉到支付頁面或顯示成功訊息
    router.push("/my-orders");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative py-6 bg-[#FFF8F5]">
        <div className="container mx-auto px-4">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            返回
          </button>
          <div className="flex items-center gap-3">
            <RefreshCw className="w-10 h-10 text-primary" />
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-primary">
                續費套餐
              </h1>
              <p className="text-muted-foreground">訂單編號：{order.id}</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Renewal Content */}
      <section className="py-8 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto space-y-6">
            {/* 當前套餐信息 */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Settings className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">{order.planName}</h2>
                      <p className="text-sm text-muted-foreground">{order.planSubtitle}</p>
                    </div>
                  </div>
                  <Badge className="bg-green-500/10 text-green-600 border-green-200">
                    使用中
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <Clock className="w-4 h-4" />
                  <span>當前到期日：{order.expiryDate}</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {order.features.slice(0, 6).map((feature, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center gap-2 py-1.5 px-2 rounded bg-[#FAEEEB]"
                    >
                      <feature.icon className="w-4 h-4 text-[#F9881E]" />
                      <span className="text-xs">{feature.label}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 續費選項 */}
            <Card>
              <CardHeader>
                <h2 className="text-lg font-bold">選擇續費時長</h2>
              </CardHeader>
              <CardContent>
                <RadioGroup 
                  value={selectedPeriod} 
                  onValueChange={setSelectedPeriod}
                  className="space-y-3"
                >
                  {renewalOptions.map((option) => {
                    const years = option.months / 12;
                    const price = yearlyPrice * years;
                    const discount = price * option.discount;
                    const final = price - discount;
                    
                    return (
                      <div
                        key={option.id}
                        className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedPeriod === option.id 
                            ? "border-primary bg-primary/5" 
                            : "border-border hover:border-primary/50"
                        }`}
                        onClick={() => setSelectedPeriod(option.id)}
                      >
                        <div className="flex items-center gap-3">
                          <RadioGroupItem value={option.id} id={option.id} />
                          <Label htmlFor={option.id} className="cursor-pointer">
                            <span className="font-medium">{option.label}</span>
                            {option.discount > 0 && (
                              <Badge variant="secondary" className="ml-2 bg-red-100 text-red-600">
                                省 {option.discount * 100}%
                              </Badge>
                            )}
                          </Label>
                        </div>
                        <div className="text-right">
                          {option.discount > 0 && (
                            <span className="text-sm text-muted-foreground line-through mr-2">
                              ${price.toLocaleString()}
                            </span>
                          )}
                          <span className="font-bold text-primary">
                            ${final.toLocaleString()} {order.currency}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </RadioGroup>
              </CardContent>
            </Card>

            {/* 價格明細 */}
            <Card>
              <CardHeader>
                <h2 className="text-lg font-bold">價格明細</h2>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>{order.planName} × {years}年</span>
                  <span>${originalPrice.toLocaleString()} {order.currency}</span>
                </div>
                
                {selectedOption.discount > 0 && (
                  <div className="flex justify-between items-center text-green-600">
                    <span>優惠折扣 ({selectedOption.discount * 100}%)</span>
                    <span>-${discountAmount.toLocaleString()} {order.currency}</span>
                  </div>
                )}
                
                <Separator />
                
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>應付金額</span>
                  <span className="text-primary">${finalPrice.toLocaleString()} {order.currency}</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>續費後新到期日：{newExpiry.toISOString().split('T')[0]}</span>
                </div>
              </CardContent>
            </Card>

            {/* 操作按鈕 */}
            <div className="flex flex-col sm:flex-row gap-4 justify-end">
              <Button 
                variant="outline" 
                onClick={() => router.back()}
              >
                取消
              </Button>
              <Button 
                className="gap-2"
                onClick={handleConfirmPayment}
              >
                <CreditCard className="w-4 h-4" />
                確認續費
              </Button>
            </div>

            {/* 購買新套餐 */}
            <Separator className="my-4" />
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-gray-300">
              <div>
                <h3 className="font-medium">需要更多功能？</h3>
                <p className="text-sm text-muted-foreground">探索其他套餐方案，找到最適合您的選擇</p>
              </div>
              <Link href="/service-plan">
                <Button variant="outline" className="gap-2">
                  <Package className="w-4 h-4" />
                  購買新套餐
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 支付方式選擇 Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>選擇支付方式</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="text-center mb-4">
              <p className="text-2xl font-bold text-primary">
                ${finalPrice.toLocaleString()} {order.currency}
              </p>
              <p className="text-sm text-muted-foreground">
                {order.planName} 續費{years}年
              </p>
            </div>
            <Button 
              className="w-full h-14 text-lg bg-[#07C160] hover:bg-[#07C160]/90"
              onClick={() => handlePaymentSelect("wechat")}
            >
              微信支付
            </Button>
            <Button 
              className="w-full h-14 text-lg bg-[#1677FF] hover:bg-[#1677FF]/90"
              onClick={() => handlePaymentSelect("alipay")}
            >
              支付寶支付
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      <Footer />
    </div>
  );
};

export default RenewOrder;
