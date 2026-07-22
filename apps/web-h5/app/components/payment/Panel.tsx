'use client';

import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, type UploadedFile } from '@go-tech-frontend/ui';
import { CreditCard } from 'lucide-react';
import dynamic from 'next/dynamic';
import { type FC, useEffect, useState } from 'react';
import { KPAY_ENABLE, PayTypeEnum } from '@/app/constants/payment';
import { DynamicText } from '../DynamicI18nText';
const Fps = dynamic(() => import('./Fps'), { ssr: false });

type PanelProps = {
  handleBackToPaymentMethods: () => void;
  handleFpsPaymentConfirm: (voucherFile: UploadedFile) => void;
  /** 线上支付：由父组件先创建业务订单（packageOrder/add 或 reAdd，payType=Online）， 再生成 KPay 全托管收银台并跳转。Panel 仅负责触发与 loading 态。 */
  handleOnlinePaymentConfirm: () => Promise<void> | void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  price: number;
};

export const Panel: FC<PanelProps> = ({
  handleBackToPaymentMethods,
  handleFpsPaymentConfirm,
  handleOnlinePaymentConfirm,
  onOpenChange,
  open,
  price
}) => {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PayTypeEnum | null>(null);
  const [onlineLoading, setOnlineLoading] = useState(false);

  // 弹框关闭时（含父组件主动关闭）重置已选支付方式，避免下次打开仍停留在上次的子视图
  useEffect(() => {
    if (!open) {
      setSelectedPaymentMethod(null);
    }
  }, [open]);

  const handleOnlinePayment = async () => {
    if (onlineLoading) return;
    setOnlineLoading(true);
    try {
      await handleOnlinePaymentConfirm();
    } finally {
      setOnlineLoading(false);
    }
  };

  const handlePaymentSelect = (method: PayTypeEnum) => {
    if (method === PayTypeEnum.FPS) {
      setSelectedPaymentMethod(PayTypeEnum.FPS);
    } else if (method === PayTypeEnum.Online) {
      handleOnlinePayment();
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={flag => {
        onOpenChange(flag);
        if (!flag) {
          setSelectedPaymentMethod(null);
        }
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            {selectedPaymentMethod === PayTypeEnum.FPS ? (
              <DynamicText text="FPS 轉數快支付" />
            ) : (
              <DynamicText text="選擇支付方式" />
            )}
          </DialogTitle>
        </DialogHeader>

        {selectedPaymentMethod === PayTypeEnum.FPS ? (
          <Fps
            price={price}
            handleBackToPaymentMethods={handleBackToPaymentMethods}
            handleFpsPaymentConfirm={handleFpsPaymentConfirm}
          />
        ) : (
          <div className="grid gap-4 py-4">
            {KPAY_ENABLE ? (
              <Button
                variant="outline"
                loading={onlineLoading}
                disabled={onlineLoading}
                onClick={() => handlePaymentSelect(PayTypeEnum.Online)}
                className="h-14 text-lg justify-start gap-4 hover:bg-blue-50 hover:border-blue-500 hover:text-primary"
              >
                <div className="w-8 h-8 bg-linear-to-br from-blue-500 to-green-500 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-white" />
                </div>
                <DynamicText text="線上支付" />
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  disabled
                  onClick={() => handlePaymentSelect(PayTypeEnum.WechatPay)}
                  className="h-14 text-lg justify-start gap-4 hover:bg-green-50 hover:border-green-500 hover:text-primary"
                >
                  <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm font-bold">微</span>
                  </div>
                  <DynamicText text="微信支付" />
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
                  <DynamicText text="支付寶支付" />
                </Button>
              </>
            )}
            <Button
              variant="outline"
              onClick={() => handlePaymentSelect(PayTypeEnum.FPS)}
              className="h-14 text-lg justify-start gap-4 hover:bg-orange-50 hover:border-orange-500 hover:text-primary"
            >
              <div className="w-8 h-8 bg-linear-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-xs font-bold">FPS</span>
              </div>
              <DynamicText text="FPS 轉數快" />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default Panel;
