'use client';

import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, type UploadedFile } from '@go-tech-frontend/ui';
import dynamic from 'next/dynamic';
import { type FC, useState } from 'react';
import { PayTypeEnum } from '@/app/constants/payment';
const Fps = dynamic(() => import('./Fps'), { ssr: false });

type PanelProps = {
  handleBackToPaymentMethods: () => void;
  handleFpsPaymentConfirm: (voucherFile: UploadedFile) => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  price: number;
};

export const Panel: FC<PanelProps> = ({
  handleBackToPaymentMethods,
  handleFpsPaymentConfirm,
  onOpenChange,
  open,
  price
}) => {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PayTypeEnum | null>(null);

  const handlePaymentSelect = (method: PayTypeEnum) => {
    if (method === PayTypeEnum.FPS) {
      setSelectedPaymentMethod(PayTypeEnum.FPS);
    } else {
      console.log('Payment method selected:', method);
      onOpenChange(false);
      // Handle payment logic here
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={flag => {
        onOpenChange(flag);
        if (!open) {
          setSelectedPaymentMethod(null);
        }
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            {selectedPaymentMethod === PayTypeEnum.FPS ? 'FPS 轉數快支付' : '選擇支付方式'}
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
  );
};

export default Panel;
