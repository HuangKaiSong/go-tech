import { Badge, Button } from '@go-tech-frontend/ui';
import { useQuery } from '@tanstack/react-query';
import { Image as ImageEl } from 'antd';
import { ArrowLeft, FileText, Image } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { OrderStatusEnum } from '@/constants/order';
import { PayTypelabel } from '@/constants/payment';
import { type OrderDetail as Detail } from '@/mocks/orders';

type Reponse = {} & Detail;

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
        <Badge variant="outline" className="text-destructive border-destructive">
          已取消
        </Badge>
      );
    case OrderStatusEnum.REJECT:
      return (
        <Badge variant="outline" className="text-destructive border-destructive">
          已拒絕
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

const toMoney = (value?: number) => value?.toLocaleString() ?? '';

const OrderDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [proofPreviewOpen, setProofPreviewOpen] = useState(false);

  const { data: orderDetail } = useQuery<Reponse>({
    queryKey: ['platform/packageOrder/detail/', id],
    queryFn: async () => {
      try {
        const url = `${import.meta.env.VITE_PROXY_PREFIX}/go-tech/platform/packageOrder/detail/${id}`;

        const res = await fetch(url);
        const response = await res.json();
        if (!response || !response.code || response.code !== 200) {
          throw new Error('Failed to fetch data');
        }

        return response.data;
      } catch (error) {
        console.log(error);
        return {};
      }
    },
    initialData: () => {
      return {} as Detail;
    }
  });

  const handleBack = () => {
    navigate(-1);
  };

  const hasPaymentInfo = orderDetail.payTime || orderDetail.payEvidence;
  const orderPackage = orderDetail.orderItems?.find(item => item.itemType === 1);
  const otherService = orderDetail.orderItems?.filter(item => item.itemType !== 1);

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
        <Button variant="outline" className="gap-2" onClick={handleBack}>
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
              <span className="font-medium">{orderDetail.orderNo}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">支付方式：</span>
              <span className="font-medium">{PayTypelabel[orderDetail.payType] || '-'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">支付時間：</span>
              <span className="font-medium">{orderDetail.payTime || '-'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">訂單狀態：</span>
              {getStatusBadge(orderDetail.orderStatus)}
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
              <span className="font-medium">{orderDetail.custName}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">電子郵箱：</span>
              <span className="font-medium">{orderDetail.custEmail}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">聯繫電話：</span>
              <span className="font-medium">{orderDetail.custPhone}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">公司名稱：</span>
              <span className="font-medium"> -{/* {orderDetail?.companyName || "-"} */}</span>
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
            {/* {orderDetail.paymentInfo && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-y-4 gap-x-8 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">銀行名稱：</span>
                  <span className="font-medium">
                    {orderDetail.paymentInfo.bankName}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">賬戶名稱：</span>
                  <span className="font-medium">
                    {orderDetail.paymentInfo.accountName}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">賬戶號碼：</span>
                  <span className="font-medium">
                    {orderDetail.paymentInfo.accountNumber}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">轉賬時間：</span>
                  <span className="font-medium">
                    {orderDetail.paymentInfo.transferTime}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">參考編號：</span>
                  <span className="font-medium">
                    {orderDetail.paymentInfo.referenceNumber}
                  </span>
                </div>
              </div>
            )} */}

            {/* Payment Proof Button */}
            {orderDetail.payEvidence && (
              <Button variant="outline" className="gap-2" onClick={() => setProofPreviewOpen(true)}>
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
              <h3 className="text-base font-medium">{orderPackage?.itemName}</h3>
            </div>
            <span className="text-xl font-bold text-foreground">
              ${toMoney(orderPackage?.price)} <span className="text-sm font-normal text-muted-foreground">HKD</span>
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <span className="text-sm text-muted-foreground">套餐內容</span>
              <span className="text-primary ml-4 text-sm">
                最多可創建{orderDetail.platformPackageDto?.unitCount}個單位
              </span>
            </div>

            <div>
              <span className="text-sm text-muted-foreground mb-2 block">包含功能</span>
              <div className="flex flex-wrap gap-2">
                {orderDetail.platformPackageDto?.packageItemList?.map((feature, index) => {
                  return feature.level <= 1 ? (
                    <Badge
                      key={index}
                      variant="outline"
                      className="bg-background border-border text-foreground font-normal px-3 py-1.5 rounded-md"
                    >
                      {feature.menuTitle}
                    </Badge>
                  ) : null;
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Addons Section */}
        {otherService?.length > 0 && (
          <div className="px-6 py-4 border-b border-border">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-5 bg-primary rounded-full" />
              <h3 className="text-base font-medium">增值服务</h3>
            </div>

            <div className="space-y-3">
              {otherService?.map((addon, index) => (
                <div key={index} className="flex items-center justify-between py-2 pl-4">
                  <span className="text-sm">
                    {addon.itemName} × {addon.count}
                    <span className="text-muted-foreground ml-2">({addon.price}/個)</span>
                  </span>
                  <span className="font-medium">{addon.amount} HKD</span>
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
              <span className="font-bold text-foreground">${toMoney(orderDetail.orderAmount)}HKD</span>
            </div>
            <div>
              <span className="text-muted-foreground">優惠：</span>
              <span className="font-bold text-foreground">${toMoney(orderDetail.discountAmount)}HKD</span>
            </div>
            <div>
              <span className="text-muted-foreground">總計：</span>
              <span className="font-bold text-primary text-xl">${toMoney(orderDetail.finalAmount)} HKD</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Proof Preview */}
      <ImageEl
        preview={{
          open: proofPreviewOpen,
          src: orderDetail.payEvidence,
          onOpenChange: setProofPreviewOpen
        }}
      />
    </div>
  );
};

export default OrderDetailPage;
