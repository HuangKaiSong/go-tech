import { useState } from "react";
import { FileText, ArrowLeft, Image } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Mock order detail data with enhanced structure
const mockOrderDetails: Record<string, {
  id: string;
  customer: string;
  phone: string;
  email: string;
  companyName: string;
  customerType: string;
  package: {
    name: string;
    price: number;
    maxUnits: number;
    features: string[];
  };
  addons: {
    name: string;
    price: number;
    quantity: number;
  }[];
  originalPrice: number;
  discount: number;
  totalAmount: number;
  paymentMethod: string;
  paymentTime: string;
  status: string;
  createTime: string;
  paymentInfo?: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    transferTime: string;
    referenceNumber: string;
  };
  paymentProof?: string;
}> = {
  "TC000001": {
    id: "TC000001",
    customer: "陳先生",
    phone: "01234567",
    email: "1234578@Gmail.com",
    companyName: "12843646.cn",
    customerType: "公司",
    package: {
      name: "服务计划套餐A",
      price: 1000,
      maxUnits: 25,
      features: ["管理層", "代理列表", "客戶列表", "合同列表(線上&線下合同)", "單位列表", "水電列表", "水電列表", "日程", "dashboard", "費用單列表", "租單列表", "支票列印列表"],
    },
    addons: [
      { name: "Sales Module（租務）", price: 60, quantity: 3 },
    ],
    originalPrice: 1060,
    discount: 212,
    totalAmount: 848,
    paymentMethod: "轉賬",
    paymentTime: "12/08/2025 10:00:23",
    status: "已支付",
    createTime: "12/08/2025 09:30:00",
    paymentInfo: {
      bankName: "中國銀行",
      accountName: "陳大明",
      accountNumber: "****1234",
      transferTime: "12/08/2025 09:45:00",
      referenceNumber: "TRF202508120001",
    },
    paymentProof: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600",
  },
  "TC000002": {
    id: "TC000002",
    customer: "李先生",
    phone: "9825 3973",
    email: "XXXXX@126.com",
    companyName: "李氏有限公司",
    customerType: "公司",
    package: {
      name: "白金套餐",
      price: 2800,
      maxUnits: 50,
      features: ["管理層", "代理列表", "客戶列表", "合同列表", "單位列表", "水電列表", "日程", "dashboard", "費用單列表", "租單列表", "支票列印列表", "報表系統"],
    },
    addons: [
      { name: "場務系統", price: 200, quantity: 1 },
      { name: "增加單位", price: 28, quantity: 10 },
    ],
    originalPrice: 3280,
    discount: 0,
    totalAmount: 3280,
    paymentMethod: "網銀",
    paymentTime: "12/08/2025 10:00:23",
    status: "待確認",
    createTime: "12/08/2025 09:00:00",
    paymentInfo: {
      bankName: "匯豐銀行",
      accountName: "李大華",
      accountNumber: "****5678",
      transferTime: "12/08/2025 09:30:00",
      referenceNumber: "TRF202508120002",
    },
    paymentProof: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600",
  },
  "TC000003": {
    id: "TC000003",
    customer: "王先生",
    phone: "9825 3973",
    email: "XXXXX@126.com",
    companyName: "",
    customerType: "個人",
    package: {
      name: "鑽石套餐",
      price: 10000,
      maxUnits: 100,
      features: ["管理層", "代理列表", "客戶列表", "合同列表", "單位列表", "水電列表", "日程", "dashboard", "費用單列表", "租單列表", "支票列印列表", "報表系統", "會計系統", "租務系統"],
    },
    addons: [
      { name: "租務系統", price: 1000, quantity: 1 },
      { name: "會計系統", price: 1080, quantity: 1 },
    ],
    originalPrice: 12080,
    discount: 0,
    totalAmount: 12080,
    paymentMethod: "",
    paymentTime: "",
    status: "未支付",
    createTime: "12/08/2025 08:30:00",
  },
  "TC000004": {
    id: "TC000004",
    customer: "劉先生",
    phone: "9825 3973",
    email: "XXXXX@126.com",
    companyName: "劉氏集團",
    customerType: "公司",
    package: {
      name: "白金套餐",
      price: 2800,
      maxUnits: 50,
      features: ["管理層", "代理列表", "客戶列表", "合同列表", "單位列表", "水電列表", "日程", "dashboard"],
    },
    addons: [
      { name: "場務系統", price: 200, quantity: 1 },
      { name: "增加單位", price: 28, quantity: 10 },
    ],
    originalPrice: 3280,
    discount: 0,
    totalAmount: 3280,
    paymentMethod: "網銀",
    paymentTime: "12/08/2025 10:00:23",
    status: "已支付",
    createTime: "12/08/2025 08:00:00",
    paymentInfo: {
      bankName: "渣打銀行",
      accountName: "劉建國",
      accountNumber: "****9012",
      transferTime: "12/08/2025 07:45:00",
      referenceNumber: "TRF202508120004",
    },
    paymentProof: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600",
  },
};

const OrderDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [proofPreviewOpen, setProofPreviewOpen] = useState(false);

  const orderDetail = mockOrderDetails[id || "TC000001"] || mockOrderDetails["TC000001"];

  const handleBack = () => {
    navigate(-1);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "已支付":
        return <Badge variant="outline" className="text-success border-success">已支付</Badge>;
      case "待確認":
        return <Badge variant="outline" className="text-warning border-warning">待確認</Badge>;
      case "已取消":
        return <Badge variant="outline" className="text-destructive border-destructive">已取消</Badge>;
      default:
        return <Badge variant="outline" className="text-primary border-primary">未支付</Badge>;
    }
  };

  const hasPaymentInfo = orderDetail.paymentInfo || orderDetail.paymentProof;

  return (
    <div className="space-y-6">
      {/* Page Header with Breadcrumb */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">
            訂單列表/<span className="text-muted-foreground">訂單詳情</span>
          </h1>
        </div>
        <Button 
          variant="outline" 
          className="gap-2"
          onClick={handleBack}
        >
          <ArrowLeft className="w-4 h-4" />
          返回
        </Button>
      </div>

      {/* Order Detail Card */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        {/* Order Info Section */}
        <div className="px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-5 bg-primary rounded-full" />
            <h3 className="text-base font-medium">訂單信息</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-8">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">訂單編號：</span>
              <span className="font-medium">{orderDetail.id}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">支付方式：</span>
              <span className="font-medium">{orderDetail.paymentMethod || "-"}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">支付時間：</span>
              <span className="font-medium">{orderDetail.paymentTime || "-"}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">訂單狀態：</span>
              {getStatusBadge(orderDetail.status)}
            </div>
          </div>
        </div>

        {/* Customer Info Section */}
        <div className="px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-5 bg-primary rounded-full" />
            <h3 className="text-base font-medium">客戶信息</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-8">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">客戶名稱：</span>
              <span className="font-medium">{orderDetail.customer}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">電子郵箱：</span>
              <span className="font-medium">{orderDetail.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">聯繫電話：</span>
              <span className="font-medium">{orderDetail.phone}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">公司名稱：</span>
              <span className="font-medium">{orderDetail.companyName || "-"}</span>
            </div>
          </div>
        </div>

        {/* Payment Info Section - Only show if payment info exists */}
        {hasPaymentInfo && (
          <div className="px-6 py-4 border-b border-border">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-5 bg-primary rounded-full" />
              <h3 className="text-base font-medium">支付信息</h3>
            </div>
            
            {/* Payment Method Details - Display directly */}
            {orderDetail.paymentInfo && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-y-4 gap-x-8 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">銀行名稱：</span>
                  <span className="font-medium">{orderDetail.paymentInfo.bankName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">賬戶名稱：</span>
                  <span className="font-medium">{orderDetail.paymentInfo.accountName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">賬戶號碼：</span>
                  <span className="font-medium">{orderDetail.paymentInfo.accountNumber}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">轉賬時間：</span>
                  <span className="font-medium">{orderDetail.paymentInfo.transferTime}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">參考編號：</span>
                  <span className="font-medium">{orderDetail.paymentInfo.referenceNumber}</span>
                </div>
              </div>
            )}

            {/* Payment Proof Button */}
            {orderDetail.paymentProof && (
              <Button 
                variant="outline" 
                className="gap-2"
                onClick={() => setProofPreviewOpen(true)}
              >
                <Image className="w-4 h-4" />
                查看支付憑證
              </Button>
            )}
          </div>
        )}

        {/* Package Info Section */}
        <div className="px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 bg-primary rounded-full" />
              <h3 className="text-base font-medium">{orderDetail.package.name}</h3>
            </div>
            <span className="text-xl font-bold text-foreground">
              ${orderDetail.package.price.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">HKD</span>
            </span>
          </div>
          
          <div className="space-y-4">
            <div>
              <span className="text-sm text-muted-foreground">套餐內容</span>
              <span className="text-primary ml-4 text-sm">最多可創建{orderDetail.package.maxUnits}個單位</span>
            </div>
            
            <div>
              <span className="text-sm text-muted-foreground mb-2 block">包含功能</span>
              <div className="flex flex-wrap gap-2">
                {orderDetail.package.features.map((feature, index) => (
                  <Badge 
                    key={index} 
                    variant="outline" 
                    className="bg-background border-border text-foreground font-normal px-3 py-1.5 rounded-md"
                  >
                    {feature}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Addons Section */}
        {orderDetail.addons.length > 0 && (
          <div className="px-6 py-4 border-b border-border">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-5 bg-primary rounded-full" />
              <h3 className="text-base font-medium">增值服务</h3>
            </div>
            
            <div className="space-y-3">
              {orderDetail.addons.map((addon, index) => (
                <div key={index} className="flex items-center justify-between py-2">
                  <span className="text-foreground">{addon.name}</span>
                  <div className="flex items-center gap-6">
                    <span className="text-foreground">${addon.price}</span>
                    <span className="text-muted-foreground">數量 {addon.quantity}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Price Summary Section */}
        <div className="px-6 py-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-5 bg-primary rounded-full" />
          </div>
          <div className="flex items-center gap-8 flex-wrap">
            <div>
              <span className="text-muted-foreground">原價：</span>
              <span className="font-bold text-foreground">${orderDetail.originalPrice.toLocaleString()}HKD</span>
            </div>
            <div>
              <span className="text-muted-foreground">優惠：</span>
              <span className="font-bold text-foreground">${orderDetail.discount.toLocaleString()}HKD</span>
            </div>
            <div>
              <span className="text-muted-foreground">總計：</span>
              <span className="font-bold text-primary text-xl">${orderDetail.totalAmount.toLocaleString()} HKD</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Proof Preview Dialog */}
      <Dialog open={proofPreviewOpen} onOpenChange={setProofPreviewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Image className="w-5 h-5 text-primary" />
              支付憑證
            </DialogTitle>
          </DialogHeader>
          
          {orderDetail.paymentProof && (
            <div className="relative">
              <img 
                src={orderDetail.paymentProof} 
                alt="支付憑證" 
                className="w-full h-auto rounded-lg"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrderDetailPage;
