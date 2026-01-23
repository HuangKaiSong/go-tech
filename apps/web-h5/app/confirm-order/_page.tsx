"use client";

import servicePlanBg from "@/assets/service-plan-bg.jpg";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from "@go-tech-frontend/ui";
import {
  Banknote,
  Building,
  Calendar,
  Check,
  Clock,
  Copy,
  CreditCard,
  Droplets,
  FileText,
  LayoutDashboard,
  Monitor,
  Receipt,
  Upload,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import Footer from "../components/Footer";
import Header from "../components/Header";

// Plan data with features
const plansData = [
  {
    id: "A",
    name: "服务计划套餐A",
    subtitle: "最多可創建25個單位",
    price: 1000,
    currency: "HKD",
    features: [
      { icon: Users, label: "管理層" },
      { icon: FileText, label: "代理列表" },
      { icon: Users, label: "客戶列表" },
      { icon: FileText, label: "合同列表(線上&線下合同)" },
      { icon: Building, label: "單位列表" },
      { icon: Droplets, label: "水電列表" },
      { icon: Clock, label: "水電列表" },
      { icon: Calendar, label: "日程" },
      { icon: LayoutDashboard, label: "dashboard" },
      { icon: Receipt, label: "費用單列表" },
      { icon: Monitor, label: "租單列表" },
      { icon: CreditCard, label: "支票列印列表" },
    ],
  },
  {
    id: "B",
    name: "服务计划套餐B",
    subtitle: "最多可創建100個單位",
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
      { icon: Receipt, label: "費用單列表" },
      { icon: Monitor, label: "租單列表" },
      { icon: CreditCard, label: "支票列印列表" },
    ],
  },
  {
    id: "C",
    name: "服务计划套餐C",
    subtitle: "最多可創建400個單位",
    price: 12000,
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
      { icon: Receipt, label: "費用審列表" },
      { icon: Monitor, label: "租單列表" },
      { icon: CreditCard, label: "支票列印列表" },
    ],
  },
];

// Value-added services
const valueAddedServices = [
  { id: "sales", name: "Sales Module（租務）", price: 20 },
  { id: "followup", name: "跟進 Module（維務）", price: 20 },
  { id: "xero", name: "Xero Module（會計）", price: 50 },
  { id: "customer", name: "客服 Module（維務）", price: 20 },
  { id: "units", name: "增加單位數量", price: 80 },
];

const ConfirmOrder = () => {
  const router = useRouter();
  const { planId, selectedServices } = {
    planId: "A",
    selectedServices: {},
  };

  const selectedPlan = plansData.find(p => p.id === planId) || plansData[0];
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    string | null
  >(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Customer info state
  const [customerInfo, setCustomerInfo] = useState({
    name: "陳先生",
    email: "1234578@Gmail.com",
    phone: "01234567",
    company: "12843646.cn",
  });

  // FPS Account Info
  const fpsAccountInfo = {
    accountName: "ABC Property Management Ltd",
    bankName: "香港上海匯豐銀行",
    accountNumber: "123-456789-001",
    fpsId: "1234567",
    fpsPhone: "91234567",
  };

  // Calculate totals
  const planPrice = selectedPlan.price;
  const addonsTotal = Object.entries(
    selectedServices as Record<string, number>
  ).reduce((total, [serviceId, quantity]) => {
    const service = valueAddedServices.find(s => s.id === serviceId);
    return total + (service ? service.price * quantity : 0);
  }, 0);
  const originalPrice = planPrice + addonsTotal;
  const discount = Math.round(originalPrice * 0.2); // 20% discount example
  const totalPrice = originalPrice - discount;

  const handleGoBack = () => {
    router.push(`/select-plan/${planId}`);
  };

  const handleConfirmPayment = () => {
    setShowPaymentDialog(true);
  };

  const handlePaymentSelect = (method: string) => {
    if (method === "fps") {
      setSelectedPaymentMethod("fps");
    } else {
      console.log("Payment method selected:", method);
      setShowPaymentDialog(false);
      // Handle payment logic here
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      toast.success("憑證上傳成功");
    }
  };

  const handleCopy = async (text: string, field: string) => {
    try {
      // 检查是否在浏览器环境中
      if (typeof navigator === "undefined" || !navigator.clipboard) {
        await fallbackCopyTextToClipboard(text);
        setCopiedField(field);
        toast.success("已複製到剪貼板");
        setTimeout(() => setCopiedField(null), 2000);
        return;
      }

      // 检查是否为安全上下文
      if (window.isSecureContext) {
        try {
          // 检查剪贴板写入权限（可选）
          if (navigator.permissions) {
            const permission = await navigator.permissions.query({
              name: "clipboard-write" as PermissionName,
            });

            if (
              permission.state === "granted" ||
              permission.state === "prompt"
            ) {
              await navigator.clipboard.writeText(text);
              setCopiedField(field);
              toast.success("已複製到剪貼板");
              setTimeout(() => setCopiedField(null), 2000);
              return;
            }
          }

          // 如果没有权限API或权限被拒绝，直接尝试写入
          await navigator.clipboard.writeText(text);
          setCopiedField(field);
          toast.success("已複製到剪貼板");
          setTimeout(() => setCopiedField(null), 2000);
        } catch (clipboardError) {
          console.warn("Clipboard API failed, using fallback:", clipboardError);
          await fallbackCopyTextToClipboard(text);
          setCopiedField(field);
          toast.success("已複製到剪貼板");
          setTimeout(() => setCopiedField(null), 2000);
        }
      } else {
        // 非安全上下文，使用备用方法
        await fallbackCopyTextToClipboard(text);
        setCopiedField(field);
        toast.success("已複製到剪貼板");
        setTimeout(() => setCopiedField(null), 2000);
      }
    } catch (error) {
      console.error("复制操作失败:", error);
      toast.error("复制失败，请手动复制");
    }
  };

  const fallbackCopyTextToClipboard = (text: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const textArea = document.createElement("textarea");
      textArea.value = text;

      textArea.style.cssText = `
      position: fixed;
      top: -9999px;
      left: -9999px;
      opacity: 0;
      pointer-events: none;
      z-index: -1;
    `;

      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      let successful = false;
      try {
        successful = document.execCommand("copy");
      } catch (err) {
        console.error("Fallback copy command failed:", err);
      }

      document.body.removeChild(textArea);

      if (successful) {
        resolve();
      } else {
        reject(new Error("Fallback copy failed"));
      }
    });
  };

  const handleFpsPaymentConfirm = () => {
    if (!uploadedFile) {
      toast.error("請上傳支付憑證");
      return;
    }
    console.log("FPS payment confirmed with file:", uploadedFile.name);
    setShowPaymentDialog(false);
    setSelectedPaymentMethod(null);
    setUploadedFile(null);
    toast.success("支付憑證已提交，我們將在確認後為您開通服務");
  };

  const handleBackToPaymentMethods = () => {
    setSelectedPaymentMethod(null);
    setUploadedFile(null);
  };

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
          <div className="bg-white rounded-lg border border-border p-6 mb-6">
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
          </div>

          {/* Plan Details Card */}
          <div className="bg-white rounded-lg border border-border p-6 mb-6">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-start gap-3">
                <div className="w-1 h-8 bg-primary rounded-full mt-1"></div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">
                    {selectedPlan.name}
                  </h2>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-foreground">
                  ${selectedPlan.price.toLocaleString()}
                </span>
                <span className="text-lg text-foreground ml-1">
                  {selectedPlan.currency}
                </span>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex gap-4 mb-4">
                <span className="text-sm font-medium text-muted-foreground min-w-15">
                  套餐内容
                </span>
                <span className="text-sm text-foreground">
                  {selectedPlan.subtitle}
                </span>
              </div>

              <div className="flex gap-4">
                <span className="text-sm font-medium text-muted-foreground min-w-15">
                  包含功能
                </span>
                <div className="flex flex-wrap gap-2">
                  {selectedPlan.features.map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-muted-foreground"
                      style={{ backgroundColor: "#FAEEEB" }}
                    >
                      <feature.icon
                        className="w-4 h-4"
                        style={{ color: "#F9881E" }}
                      />
                      <span>{feature.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Value-Added Services Card */}
          {Object.keys(selectedServices).length > 0 && (
            <div className="bg-white rounded-lg border border-border p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-1 h-6 bg-primary rounded-full"></div>
                <h3 className="text-lg font-bold text-foreground">增值服务</h3>
              </div>

              <div className="space-y-3">
                {Object.entries(selectedServices as Record<string, number>).map(
                  ([serviceId, quantity]) => {
                    const service = valueAddedServices.find(
                      s => s.id === serviceId
                    );
                    if (!service) return null;

                    return (
                      <div
                        key={serviceId}
                        className="flex items-center justify-between py-3 border-b border-border last:border-0"
                      >
                        <span className="text-sm text-foreground">
                          {service.name}
                        </span>
                        <div className="flex items-center gap-8">
                          <span className="text-sm font-medium">
                            ${service.price * quantity}
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
                <span className="text-lg font-bold text-foreground">
                  原價：
                  <span className="line-through">
                    ${originalPrice.toLocaleString()}HKD
                  </span>
                </span>
                <span className="text-lg font-medium text-foreground">
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

      {/* Payment Method Dialog */}
      <Dialog
        open={showPaymentDialog}
        onOpenChange={open => {
          setShowPaymentDialog(open);
          if (!open) {
            setSelectedPaymentMethod(null);
            setUploadedFile(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">
              {selectedPaymentMethod === "fps"
                ? "FPS 轉數快支付"
                : "選擇支付方式"}
            </DialogTitle>
          </DialogHeader>

          {selectedPaymentMethod === "fps" ? (
            <div className="space-y-6 py-4">
              {/* Payment Amount */}
              <div className="text-center p-4 bg-primary/5 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">應付金額</p>
                <p className="text-3xl font-bold text-primary">
                  ${totalPrice.toLocaleString()} HKD
                </p>
              </div>

              {/* Account Info */}
              <div className="space-y-3">
                <h4 className="font-medium text-foreground flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-primary" />
                  收款賬戶信息
                </h4>
                <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      賬戶名稱
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {fpsAccountInfo.accountName}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() =>
                          handleCopy(fpsAccountInfo.accountName, "accountName")
                        }
                      >
                        {copiedField === "accountName" ? (
                          <Check className="h-3 w-3 text-green-500" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      銀行名稱
                    </span>
                    <span className="text-sm font-medium">
                      {fpsAccountInfo.bankName}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      銀行賬號
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {fpsAccountInfo.accountNumber}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() =>
                          handleCopy(
                            fpsAccountInfo.accountNumber,
                            "accountNumber"
                          )
                        }
                      >
                        {copiedField === "accountNumber" ? (
                          <Check className="h-3 w-3 text-green-500" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      FPS ID
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {fpsAccountInfo.fpsId}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() =>
                          handleCopy(fpsAccountInfo.fpsId, "fpsId")
                        }
                      >
                        {copiedField === "fpsId" ? (
                          <Check className="h-3 w-3 text-green-500" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      FPS 手機號碼
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {fpsAccountInfo.fpsPhone}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() =>
                          handleCopy(fpsAccountInfo.fpsPhone, "fpsPhone")
                        }
                      >
                        {copiedField === "fpsPhone" ? (
                          <Check className="h-3 w-3 text-green-500" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Upload Section */}
              <div className="space-y-3">
                <Label className="font-medium flex items-center gap-2">
                  <Upload className="w-4 h-4 text-primary" />
                  上傳支付憑證
                </Label>
                <div
                  className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  {uploadedFile ? (
                    <div className="flex items-center justify-center gap-2 text-green-600">
                      <Check className="w-5 h-5" />
                      <span className="font-medium">{uploadedFile.name}</span>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        點擊或拖拽上傳支付截圖
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        支持 JPG、PNG、PDF 格式
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleBackToPaymentMethods}
                  className="flex-1"
                >
                  返回
                </Button>
                <Button
                  onClick={handleFpsPaymentConfirm}
                  className="flex-1"
                  disabled={!uploadedFile}
                >
                  確認提交
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 py-4">
              <Button
                variant="outline"
                onClick={() => handlePaymentSelect("wechat")}
                className="h-14 text-lg justify-start gap-4 hover:bg-green-50 hover:border-green-500"
              >
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-bold">微</span>
                </div>
                微信支付
              </Button>
              <Button
                variant="outline"
                onClick={() => handlePaymentSelect("alipay")}
                className="h-14 text-lg justify-start gap-4 hover:bg-blue-50 hover:border-blue-500"
              >
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-bold">支</span>
                </div>
                支付寶支付
              </Button>
              <Button
                variant="outline"
                onClick={() => handlePaymentSelect("fps")}
                className="h-14 text-lg justify-start gap-4 hover:bg-orange-50 hover:border-orange-500"
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
