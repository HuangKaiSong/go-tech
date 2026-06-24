'use client';

import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Separator,
  type UploadedFile,
  toast
} from '@go-tech-frontend/ui';
import dayjs from 'dayjs';
import { Minus, Plus } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { type FC, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import valueAddedServices, { type SpecificValueAddedServicesId } from '../constants/addedServices';
import { type OrderItemInfoType, OrderItemTypeEnum, OrderTypeEnum } from '../constants/order';
import { DAYSPERMONTH, PayTypeEnum } from '../constants/payment';
const PaymentPanel = dynamic(() => import('../components/payment/Panel'), {
  ssr: false
});

type AddServiceProps = {
  data: OrderItemInfoType;
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

function fmt(num: number) {
  return num.toLocaleString('en-HK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

export const AddService: FC<AddServiceProps> = ({
  data,
  onOpenChange: setShowAddonsDialog,
  open: showAddonsDialog
}) => {
  const currentOrder = data;

  const { token } = useAuth();
  const router = useRouter();
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

  // 計算到當前訂單到期日剩餘的天數與按比例係數（按月度價格折算）
  const getProrationInfo = () => {
    const order = data;
    if (!order) return { daysRemaining: 0, ratio: 0, count: 0, expiryDate: '' };
    const orderPackageInfo = order.orderItems.find(item => item.itemType === OrderItemTypeEnum.PACKAGE);
    if (!orderPackageInfo) return { daysRemaining: 0, ratio: 0, count: 0, expiryDate: '' };

    const expiry = dayjs(new Date(order.expireDate!));

    // const totalDay =
    //   orderPackageInfo.days || orderPackageInfo.count! * DAYSPERMONTH || 0;
    const totalDay = expiry.diff(dayjs(new Date(order.activateDate || order.payTime! || order.createTime)), 'day') + 1;
    const count = orderPackageInfo?.count || 0;
    const today = dayjs();
    // 剩余天数
    const daysRemaining = expiry.diff(today, 'day') + 1;

    const ratio = daysRemaining / totalDay;

    return { daysRemaining, ratio, count, expiryDate: order.expireDate };
  };

  const calculateAddonsTotal = () => {
    const { daysRemaining, ratio } = getProrationInfo();

    return Object.entries(selectedServices).reduce((sum, [id, qty]) => {
      const service = valueAddedServices.find(s => s.id === id);
      let price = 0;
      if (service) {
        price = currentOrder?.platformPackageDto?.[service.id] || 0;
      }
      const subTotal = service ? Math.floor((price / DAYSPERMONTH) * daysRemaining * ratio * qty * 100) / 100 : 0;
      // 計算增值服務金額
      return sum + subTotal;
    }, 0);
  };

  const handleConfirmAddons = () => {
    setShowPaymentDialog(true);
  };

  const handleBackToPaymentMethods = () => {
    setShowPaymentDialog(false);
  };

  const handleFpsPaymentConfirm = async (voucherFile: UploadedFile) => {
    toast.dismiss();
    const toastId = toast.loading('創建增值服務訂單中...');
    const headers = new Headers({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'User-Type': 'platform_customer'
    });
    const orderInfo: any = {
      orderType: OrderTypeEnum.ADDITION,
      payType: PayTypeEnum.FPS,
      originalOrder: currentOrder.orderNo,
      orderItems: []
    };

    Object.entries(selectedServices).map(([serviceId, quantity]) => {
      const service = valueAddedServices.find(s => s.id === serviceId);
      if (!service) return null;
      const serviceTotalPrice = currentOrder.platformPackageDto[serviceId as SpecificValueAddedServicesId];

      orderInfo.orderItems.push({
        itemType: OrderItemTypeEnum.ADDITION,
        count: quantity,
        price: serviceTotalPrice,
        packageId: data.platformPackageDto?.id,
        itemName: service.name,
        itemCode: serviceId.replace('Price', '')
      });
      return null;
    });

    try {
      // 创建订单
      const orderResponse = await fetch('/go-tech/platform/packageOrder/add', {
        method: 'POST',
        headers,
        body: JSON.stringify(orderInfo)
      })
        .then(res => res.json())
        .catch(err => {
          throw err;
        });
      if (orderResponse.code === 200) {
        toast.success('增值服務訂單創建成功', { id: toastId });
        const orderId = orderResponse.data;
        if (orderInfo.payType === PayTypeEnum.FPS) {
          // 上传凭证
          await fetch('/go-tech/platform/packageOrder/payEvidence', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              id: orderId,
              payEvidence: voucherFile.url
            })
          })
            .catch(err => {
              throw err;
            })
            .then(res => res.json());

          router.push(`/my-orders/${orderId}`);
        }

        setShowPaymentDialog(false);
        toast.success('支付憑證已提交，我們將在確認後為您增加增值服務');
      } else {
        toast.error(orderResponse.message);
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <>
      <Dialog open={showAddonsDialog} onOpenChange={setShowAddonsDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>購買增值服務</DialogTitle>
          </DialogHeader>
          {(() => {
            const { daysRemaining, expiryDate, ratio } = getProrationInfo();
            return (
              <div className="space-y-4 mt-4">
                <div className="p-3 rounded-lg bg-[#FFF8F5] border text-sm text-muted-foreground">
                  按當前訂單剩餘 <span className="font-medium text-foreground">{daysRemaining}</span> 天計費（至{' '}
                  {expiryDate} 到期），費用按單價 x {(ratio * 100).toFixed(2)}% 折算。
                </div>
                {valueAddedServices.map(service => {
                  const isSelected = selectedServices[service.id] !== undefined;
                  const quantity = selectedServices[service.id] || 0;
                  const price = currentOrder?.platformPackageDto?.[service.id] || 0;

                  return (
                    <div
                      key={service.id}
                      className={`p-4 rounded-lg border-2 transition-colors ${
                        isSelected ? 'border-primary bg-primary/5' : 'border-border'
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
                            <p className="text-sm text-muted-foreground">+${price} HKD Each / 月</p>
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
                          小計：
                          <span className="font-medium text-foreground">
                            ${Math.floor((price / DAYSPERMONTH) * daysRemaining * ratio * quantity * 100) / 100} HKD
                          </span>
                          <span className="ml-2 text-xs">
                            （單價 ${((price / DAYSPERMONTH) * daysRemaining).toLocaleString()} x{' '}
                            {(ratio * 100).toFixed(2)}%）
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}

                <Separator />

                <div className="flex justify-between items-center text-lg font-bold">
                  <span>總計</span>
                  <span className="text-primary">${fmt(calculateAddonsTotal())} HKD</span>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button variant="outline" className="flex-1" onClick={() => setShowAddonsDialog(false)}>
                    取消
                  </Button>
                  <Button className="flex-1" disabled={calculateAddonsTotal() === 0} onClick={handleConfirmAddons}>
                    確認購買
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* 支付弹框 */}
      <PaymentPanel
        open={showPaymentDialog}
        onOpenChange={setShowPaymentDialog}
        price={calculateAddonsTotal()}
        handleBackToPaymentMethods={handleBackToPaymentMethods}
        handleFpsPaymentConfirm={handleFpsPaymentConfirm}
      />
    </>
  );
};
