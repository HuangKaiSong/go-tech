"use client";

import servicePlanBg from "@/assets/service-plan-bg.jpg";
import { useAuth } from "@/contexts/AuthContext";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  toast,
  UploadedFile
} from "@go-tech-frontend/ui";
import { useSessionStorageState } from "ahooks";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Footer from "../../components/Footer";
import Header from "../../components/Header";
import { OrderItemTypeEnum, OrderTypeEnum } from '../../constants/order';
import { PayTypeEnum } from '../../constants/payment';
const Fps = dynamic(() => import("../../components/payment/Fps"), { ssr: false })


// Value-added services
const valueAddedServices = [
  { id: "rentSysPrice", name: "Sales Module（租務）", price: 20 },
  { id: "venueSysPrice", name: "跟進 Module（維務）", price: 20 },
  { id: "accountingSysPrice", name: "Xero Module（會計）", price: 50 },
  { id: "custServiceSysPrice", name: "客服 Module（維務）", price: 20 },
  { id: "addUnitPrice", name: "增加單位數量", price: 80 },
];

const ConfirmOrder = ({ planId: planIdFromQuery, data }: { planId?: string, data?: Packages }) => {
  const router = useRouter();
  const { planId } = { planId: planIdFromQuery};
  const { user, token } = useAuth();

  const selectedPlan = data;
  const [hasMounted, setHasMounted] = useState(false);

  const [selectedServices, setSelectedServices] = useSessionStorageState<
    Record<string, number>
  >('user-selected-services', {
    defaultValue: () => ({}),
    listenStorageChange: true,
  });

  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    PayTypeEnum | null
  >(null);
  // Customer info state
  const [customerInfo, setCustomerInfo] = useState({
    name: user?.nickname,
    email: user?.sub,
    phone: "",
    company: "",
  });
  const [month, setMonth] = useState<number>(1)

  useEffect(() => {
    setHasMounted(true);
    return () => {
      setSelectedServices({})
    }
  }, []);

  const selectedServicesSafe = hasMounted ? (selectedServices ?? {}) : {};

  const handleGoBack = () => {
    router.push(`/select-plan/${planId}`);
  };

  const handleConfirmPayment = () => {
    setShowPaymentDialog(true);
  };

  const handlePaymentSelect = (method: PayTypeEnum) => {
    if (method === PayTypeEnum.FPS) {
      setSelectedPaymentMethod(PayTypeEnum.FPS);
    } else {
      console.log("Payment method selected:", method);
      setShowPaymentDialog(false);
      // Handle payment logic here
    }
  };

  const handleFpsPaymentConfirm = async (voucherFile: UploadedFile) => {
    toast.dismiss()
    const toastId = toast.loading("创建订单中...");
    const orderInfo = {
      orderType: OrderTypeEnum.PURCHASE,
      payType: selectedPaymentMethod,
      orderItems: [{
        packageId: selectedPlan?.id,
        itemType: OrderItemTypeEnum.PACKAGE,
        itemName: selectedPlan?.packageName,
        price: selectedPlan?.price,
        count: month
      }]
    }

    if (selectedServices) {
      Object.entries(selectedServicesSafe).map(
        ([serviceId, quantity]) => {
          const service = valueAddedServices.find(
            s => s.id === serviceId
          );
          if (!service) return null;
          const serviceTotalPrice = getServiceUnitPrice(serviceId);
          orderInfo.orderItems.push({
            itemType: OrderItemTypeEnum.ADDITION,
            count: quantity,
            price: serviceTotalPrice,
            packageId: selectedPlan?.id,
            itemName: service.name
          })
        })
    }
    const requestHeaders = new Headers({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'User-Type': 'platform_customer'
    })

    try {
      // 创建订单
      const orderResponse = await fetch('/go-tech/platform/packageOrder/add', {
        method: 'POST',
        headers: requestHeaders,
        body: JSON.stringify(orderInfo)
      }).then(res => res.json()).catch(err => { throw err })
      if (orderResponse.code === 200) {
        toast.success('订单创建成功', { id: toastId })
        const orderId = orderResponse.data;
        if (orderInfo.payType === PayTypeEnum.FPS) {
          // 上传凭证
          await fetch('/go-tech/platform/packageOrder/payEvidence', {
            method: 'POST',
            headers: requestHeaders,
            body: JSON.stringify({
              id: orderId,
              payEvidence: voucherFile.url
            })
          }).catch(err => { throw err }).then(res => res.json())
        }
    
        setShowPaymentDialog(false);
        setSelectedPaymentMethod(null);
        toast.success("支付憑證已提交，我們將在確認後為您開通服務");
      } else {
        toast.error(orderResponse.message);
      }
    } catch (error) {
      console.log(error);
      
    }
  };

  const handleBackToPaymentMethods = () => {
    setSelectedPaymentMethod(null);
  };

  const getServiceUnitPrice = (serviceId: string) => {
    if (!selectedPlan) return 0;

    if (serviceId === "rentSysPrice") return selectedPlan.rentSysPrice;
    if (serviceId === "venueSysPrice") return selectedPlan.venueSysPrice;
    if (serviceId === "accountingSysPrice") return selectedPlan.accountingSysPrice;
    if (serviceId === "custServiceSysPrice") return selectedPlan.custServiceSysPrice;
    if (serviceId === "addUnitPrice") return selectedPlan.addUnitPrice;

    return 0;
  };

  const addonsTotal = Object.entries(selectedServicesSafe).reduce(
    (sum, [serviceId, quantity]) => sum + getServiceUnitPrice(serviceId) * quantity,
    0
  );
  // @ts-ignore
  const originalPrice = (selectedPlan?.price * month || 0) + addonsTotal;
  const discount = 0;
  const totalPrice = originalPrice - discount;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      {/* Hero Section */}
      <section
        className="relative pt-32 pb-16 bg-cover bg-center"
        style={{ backgroundImage: `url(${servicePlanBg})` }}
      >
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-2">
            套餐確認
          </h1>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 flex-1" style={{ backgroundColor: "#FFF8F5" }}>
        <div className="container mx-auto px-4 max-w-5xl">
          {/* Notice */}
          <p className="text-center text-sm text-muted-foreground mb-6">
            !
            為確保您的發票有效，請提供與貴公司營業登記相符的公司名稱，如需修改請點擊修改按鈕
          </p>

          {/* Customer Info Card */}
          {/* <div className="bg-white rounded-lg border border-border p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1 h-6 bg-primary rounded-full"></div>
              <h2 className="text-lg font-bold text-foreground">客户信息</h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">
                  客戶名稱：
                </label>
                <Input
                  value={customerInfo.name}
                  onChange={e =>
                    setCustomerInfo({ ...customerInfo, name: e.target.value })
                  }
                  className="h-9"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">
                  電子郵箱：
                </label>
                <Input
                  type="email"
                  value={customerInfo.email}
                  onChange={e =>
                    setCustomerInfo({ ...customerInfo, email: e.target.value })
                  }
                  className="h-9"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">
                  聯繫電話：
                </label>
                <Input
                  type="tel"
                  value={customerInfo.phone}
                  onChange={e =>
                    setCustomerInfo({ ...customerInfo, phone: e.target.value })
                  }
                  className="h-9"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">
                  公司名稱：
                </label>
                <Input
                  value={customerInfo.company}
                  onChange={e =>
                    setCustomerInfo({
                      ...customerInfo,
                      company: e.target.value,
                    })
                  }
                  className="h-9"
                />
              </div>
            </div>
          </div> */}

               {/* Customer Info Card */}
          <div className="bg-white rounded-lg border border-border p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1 h-6 bg-primary rounded-full"></div>
              <h2 className="text-lg font-bold text-gray-700">時長</h2>
            </div>

            <div className="flex flex-row items-center gap-2">
              <Input
                value={month}
                type="number"
                min={1}
                onChange={e =>
                  setMonth(Number(e.target.value))
                }
                className="h-9"
              />
              <div className="text-lg">月</div>
            </div>
          </div>


          {/* Plan Details Card */}
          <div className="bg-white rounded-lg border border-border p-6 mb-6">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="w-1 h-8 bg-primary rounded-full mt-1"></div>
                <div>
                  <h2 className="text-xl font-bold text-gray-700">
                    {selectedPlan?.packageName}
                  </h2>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-gray-700">
                  ${selectedPlan?.price?.toLocaleString()}
                </span>
                <span className="text-lg text-gray-700 ml-1">
                  
                </span>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex gap-4 mb-4">
                <span className="text-sm font-medium text-muted-foreground min-w-15">
                  套餐内容
                </span>
                <span className="text-sm text-gray-700">
                  最多可創建{selectedPlan?.unitCount}個單位
                </span>
              </div>

              <div className="flex gap-4">
                <span className="text-sm font-medium text-muted-foreground min-w-15">
                  包含功能
                </span>
                <div className="flex flex-wrap gap-2">
                  {selectedPlan?.packageItemList?.map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-muted-foreground"
                      style={{ backgroundColor: "#FAEEEB" }}
                    >
                      {feature.menuIcon && (
                        <svg className="svg-icon w-4 h-4 text-primary mr-1" aria-hidden="true">
                          <use href={`#icon-${feature.menuIcon}`} xlinkHref={`#icon-${feature.menuIcon}`}></use>
                        </svg>
                      )}
                      <span>{feature.menuTitle}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Value-Added Services Card */}
          {Object.keys(selectedServicesSafe).length > 0 && (
            <div className="bg-white rounded-lg border border-border p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-1 h-6 bg-primary rounded-full"></div>
                <h3 className="text-lg font-bold text-gray-700">增值服务</h3>
              </div>

              <div className="space-y-3">
                {Object.entries(selectedServicesSafe).map(
                  ([serviceId, quantity]) => {
                    const service = valueAddedServices.find(
                      s => s.id === serviceId
                    );
                    if (!service) return null;
                    const serviceTotalPrice = getServiceUnitPrice(serviceId) * quantity;

                    return (
                      <div
                        key={serviceId}
                        className="flex items-center justify-between py-3 border-b border-border last:border-0"
                      >
                        <span className="text-sm text-gray-700">
                          {service.name}
                        </span>
                        <div className="flex items-center gap-8">
                          <span className="text-sm font-medium">
                            ${serviceTotalPrice}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            數量 {quantity}
                          </span>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          )}

          {/* Price Summary Card */}
          <div className="bg-white rounded-lg border border-border p-6 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1 h-6 bg-primary rounded-full"></div>
              <div className="flex flex-wrap items-center gap-8">
                <span className="text-lg font-bold text-gray-700">
                  原價：
                  <span className="line-through">
                    ${originalPrice?.toLocaleString()}HKD
                  </span>
                </span>
                <span className="text-lg font-medium text-gray-700">
                  優惠：
                  <span className="text-primary">
                    ${discount.toLocaleString()}HKD
                  </span>
                </span>
                <span className="text-lg font-bold">
                  總計：
                  <span className="text-2xl text-primary">
                    ${totalPrice.toLocaleString()} HKD
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-center gap-4">
            <Button
              variant="outline"
              onClick={handleGoBack}
              className="min-w-45 h-12 text-primary border-primary hover:bg-primary/5"
            >
              上一步
            </Button>
            <Button onClick={handleConfirmPayment} className="min-w-45 h-12">
              確認支付
            </Button>
          </div>
        </div>
      </section>

      {/* 支付弹框 */}
      <Dialog
        open={showPaymentDialog}
        onOpenChange={open => {
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
              price={totalPrice}
              handleBackToPaymentMethods={handleBackToPaymentMethods}
              handleFpsPaymentConfirm={handleFpsPaymentConfirm}
            />
          ) : (
            <div className="grid gap-4 py-4">
              <Button
                variant="outline"
                disabled
                onClick={() => handlePaymentSelect(PayTypeEnum.WechatPay)}
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
                onClick={() => handlePaymentSelect(PayTypeEnum.Alipay)}
                className="h-14 text-lg justify-start gap-4 hover:bg-blue-50 hover:border-blue-500 hover:text-primary"
              >
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-bold">支</span>
                </div>
                支付寶支付
              </Button>
              <Button
                variant="outline"
                onClick={() => handlePaymentSelect(PayTypeEnum.FPS)}
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

      <Footer />
    </div>
  );
};

export default ConfirmOrder;
