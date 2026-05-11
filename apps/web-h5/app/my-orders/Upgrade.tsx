"use client";

import { useAuth } from "@/contexts/AuthContext";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Empty,
  Separator,
  toast,
  UploadedFile,
} from "@go-tech-frontend/ui";
import dayjs from "dayjs";
import { ArrowUpCircle, Check } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FC } from "react";
import valueAddedServices, {
  SpecificValueAddedServicesId,
} from "../constants/addedServices";
import {
  OrderItemInfoType,
  OrderItemTypeEnum,
  OrderTypeEnum,
  PlatformPackageDto,
} from "../constants/order";
import { DAYSPERMONTH, PayTypeEnum } from "../constants/payment";
const PaymentPanel = dynamic(() => import("../components/payment/Panel"), {
  ssr: false,
});

type UpgradeProps = {
  data: OrderItemInfoType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function fmt(num: number) {
  return num.toLocaleString("en-HK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export const Upgrade: FC<UpgradeProps> = ({
  data,
  open: showUpgradeDialog,
  onOpenChange: setShowUpgradeDialog,
}) => {
  const currentOrder = data;

  const { token } = useAuth();
  const router = useRouter();
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  const [upgradePlans, setUpgradePlans] = useState<PlatformPackageDto[]>([]);
  const [selectedUpgradePlan, setSelectedUpgradePlan] = useState<number | null>(
    null
  );

  const [upgradeSelectedServices, setUpgradeSelectedServices] = useState<
    Record<string, number>
  >({});

  const toggleUpgradeService = (serviceId: string) => {
    setUpgradeSelectedServices(prev => {
      if (prev[serviceId]) {
        const { [serviceId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [serviceId]: 1 };
    });
  };

  const updateUpgradeQuantity = (serviceId: string, delta: number) => {
    setUpgradeSelectedServices(prev => {
      const current = prev[serviceId] || 0;
      const newQty = Math.max(0, current + delta);
      if (newQty === 0) {
        const { [serviceId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [serviceId]: newQty };
    });
  };

  // 升級增值服務按「升級後新訂單時長」計費（重新計時）
  const calculateUpgradeAddonsTotal = () => {
    const { ratio, months } = getUpgradeProrationInfo();
    const plan = upgradePlans.find(p => p.id === selectedUpgradePlan);

    return (
      Object.entries(upgradeSelectedServices).reduce((sum, [id, qty]) => {
        const service = valueAddedServices.find(s => s.id === id);
        let price = service?.price || 0;
        if (plan && service) {
          price = plan[service.id];
        }

        console.log(price);

        const subTotal = service
          ? Math.floor(price * qty * ratio * 100) / 100
          : 0;
        return sum + subTotal;
      }, 0) * months
    );
  };

  // 升級計算用：以「訂單原始時長」重新計時的比例
  const getUpgradeProrationInfo = () => {
    const order = data;
    if (!order) {
      return { months: 0, ratio: 0, newExpiryDate: "", remainingCredit: 0 };
    }
    const orderPackageInfo = order.orderItems.find(
      item => item.itemType === OrderItemTypeEnum.PACKAGE
    );
    if (!orderPackageInfo) {
      return { months: 0, ratio: 0, newExpiryDate: "", remainingCredit: 0 };
    }

    const dyas = orderPackageInfo.days || 0;

    // 新到期日 = 今天 + 訂單原始時長
    const newExpiry = dayjs();
    const newExpiryDate = newExpiry.add(dyas, "days").format("YYYY-MM-DD");

    // 已使用天數與剩餘餘額（按舊套餐每日單價計算）
    const today = dayjs();
    const expiry = dayjs(new Date(order.expireDate!));
    const totalDays =
      expiry.diff(
        dayjs(
          new Date(order.activateDate || order.payTime! || order.createTime)
        ),
        "day"
      ) + 1;

    const months = totalDays / DAYSPERMONTH;

    // 剩余天数
    const daysRemaining = expiry.diff(today, "day") + 1;
    const ratio = daysRemaining / totalDays;
    // 已使用天数
    const usedDays = totalDays - daysRemaining;
    const remainingDays = Math.max(0, totalDays - usedDays);
    const dailyAmount = order.finalAmount / dyas;
    const remainingCredit = Math.floor(dailyAmount * remainingDays * 100) / 100;

    return {
      months,
      ratio,
      newExpiryDate,
      remainingCredit,
      usedDays,
      remainingDays,
      totalDays,
    };
  };

  // 升級新套餐總費用（按原訂單時長重新計費）
  const getUpgradeNewPlanCost = () => {
    const plan = upgradePlans.find(p => p.id === selectedUpgradePlan);
    if (!plan) return 0;
    const { months } = getUpgradeProrationInfo();

    return plan.price * months;
    // return Math.round(plan.platformPackageDto.price * ratio);
  };

  // 升級應付差額 = 新套餐總價 - 舊套餐剩餘餘額（不為負）
  const getUpgradePrice = () => {
    const plan = upgradePlans.find(p => p.id === selectedUpgradePlan);
    if (!plan) return 0;
    const newCost = getUpgradeNewPlanCost();
    const { remainingCredit } = getUpgradeProrationInfo();
    return Math.max(0, newCost - remainingCredit);
  };

  const handleConfirmUpgrade = () => {
    setShowPaymentDialog(true);
  };

  const handleFpsPaymentConfirm = async (voucherFile: UploadedFile) => {
    toast.dismiss();
    const toastId = toast.loading("創建升級訂單中...");
    const plan = upgradePlans.find(p => p.id === selectedUpgradePlan);
    const orderPackageInfo = data.orderItems.find(
      item => item.itemType === OrderItemTypeEnum.PACKAGE
    );
    const headers = new Headers({
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "User-Type": "platform_customer",
    });
    const orderInfo: any = {
      orderType: OrderTypeEnum.UPGRADE,
      payType: PayTypeEnum.FPS,
      originalOrder: currentOrder.orderNo,
      orderItems: [
        {
          packageId: plan?.id,
          itemType: OrderItemTypeEnum.PACKAGE,
          itemName: plan?.packageName,
          price: plan?.price,
          count: orderPackageInfo?.count,
          days: orderPackageInfo?.days || 0,
        },
      ],
    };

    Object.entries(upgradeSelectedServices).map(([serviceId, quantity]) => {
      const service = valueAddedServices.find(s => s.id === serviceId);
      if (!service) return null;
      const serviceTotalPrice =
        currentOrder.platformPackageDto[
          serviceId as SpecificValueAddedServicesId
        ];

      orderInfo.orderItems.push({
        itemType: OrderItemTypeEnum.ADDITION,
        count: quantity,
        price: serviceTotalPrice,
        packageId: currentOrder.platformPackageDto?.id,
        itemName: service.name,
        itemCode: serviceId.replace("Price", ""),
      });
    });

    try {
      // 创建订单
      const orderResponse = await fetch("/go-tech/platform/packageOrder/add", {
        method: "POST",
        headers: headers,
        body: JSON.stringify(orderInfo),
      })
        .then(res => res.json())
        .catch(err => {
          throw err;
        });
      if (orderResponse.code === 200) {
        toast.success("升級訂單創建成功", { id: toastId });
        const orderId = orderResponse.data;
        if (orderInfo.payType === PayTypeEnum.FPS) {
          // 上传凭证
          await fetch("/go-tech/platform/packageOrder/payEvidence", {
            method: "POST",
            headers: headers,
            body: JSON.stringify({
              id: orderId,
              payEvidence: voucherFile.url,
            }),
          })
            .catch(err => {
              throw err;
            })
            .then(res => res.json());

          router.push(`/my-orders/${orderId}`);
        }

        setShowPaymentDialog(false);
        toast.success("支付憑證已提交，我們將在確認後為您升級");
      } else {
        toast.error(orderResponse.message);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleBackToPaymentMethods = () => {
    setShowPaymentDialog(false);
  };

  useEffect(() => {
    // 获取可升级套餐
    fetch("/go-tech/platform/platformPackage/enabledList")
      .then(res => res.json())
      .then(res => {
        if (res && res.code && res.code === 200) {
          const plans = res.data as PlatformPackageDto[];
          const originPackageId = currentOrder.platformPackageDto.id;
          const originPackage = plans.find(p => p.id === originPackageId);
          const accordPlans = plans.filter(p => p.id !== originPackageId);
          if (originPackage) {
            setUpgradePlans(
              accordPlans.filter(p => p.price > originPackage.price)
            );
          }
        }
      });
  }, []);

  return (
    <>
      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent className="sm:max-w-lg max-h-[calc(100dvh-2rem)] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowUpCircle className="w-5 h-5 text-primary" />
              套餐升級
            </DialogTitle>
          </DialogHeader>
          {(() => {
            if (upgradePlans.length === 0) {
              return (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="沒有可用的升級方案"
                />
              );
            } else {
              return (
                <div className="space-y-4 mt-4 flex-1 min-h-0 overflow-y-auto pr-1">
                  <p className="text-sm text-muted-foreground">
                    選擇您想升級的套餐方案，享受更多功能與服務
                  </p>
                  {upgradePlans.map(plan => {
                    const isCurrentPlan =
                      currentOrder?.packageName === plan.packageName;
                    const isLowerPlan =
                      plan.packageName === "升級版" &&
                      currentOrder?.packageName === "豪華版";

                    if (isCurrentPlan || isLowerPlan) return null;

                    return (
                      <div
                        key={plan.id}
                        onClick={() => setSelectedUpgradePlan(plan.id)}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedUpgradePlan === plan.id
                            ? "border-primary bg-primary/5 shadow-md"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-bold text-lg">
                              {plan.packageName}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              最多可創建{plan?.unitCount}個單位
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold text-primary">
                              ${plan.price.toLocaleString()}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              HKD/月
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {plan.packageItemList
                            .filter(feature => feature.level < 2)
                            .slice(0, 6)
                            .map((feature, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-[#FAEEEB] text-muted-foreground"
                              >
                                <Check className="w-3 h-3 text-[#F9881E]" />
                                {feature.menuTitle}
                              </span>
                            ))}
                          {plan.packageItemList.length > 6 && (
                            <span className="text-xs text-muted-foreground">
                              +{plan.packageItemList.length - 6} 更多功能
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* 增值服務選擇 */}
                  {selectedUpgradePlan && (
                    <>
                      {/* <Separator />
                      <div>
                        <h4 className="font-medium text-foreground mb-3">
                          選購增值服務（可選）
                        </h4>
                        <div className="space-y-3">
                          {valueAddedServices.map(service => {
                            const isSelected =
                              upgradeSelectedServices[service.id] !== undefined;
                            const quantity =
                              upgradeSelectedServices[service.id] || 0;
                            const plan = upgradePlans.find(
                              p => p.id === selectedUpgradePlan
                            );
                            let price = service.price;
                            if (plan) {
                              price = plan[service.id];
                            }

                            return (
                              <div
                                key={service.id}
                                className={`p-3 rounded-lg border transition-colors ${
                                  isSelected
                                    ? "border-primary bg-primary/5"
                                    : "border-border"
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() =>
                                        toggleUpgradeService(service.id)
                                      }
                                      className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                    <div>
                                      <p className="text-sm font-medium">
                                        {service.name}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        +${price} HKD Each / 月
                                      </p>
                                    </div>
                                  </div>

                                  {isSelected && (
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() =>
                                          updateUpgradeQuantity(service.id, -1)
                                        }
                                        className="w-6 h-6 rounded-full border flex items-center justify-center hover:bg-muted transition-colors"
                                      >
                                        <Minus className="w-3 h-3" />
                                      </button>
                                      <span className="w-6 text-center text-sm font-medium">
                                        {quantity}
                                      </span>
                                      <button
                                        onClick={() =>
                                          updateUpgradeQuantity(service.id, 1)
                                        }
                                        className="w-6 h-6 rounded-full border flex items-center justify-center hover:bg-muted transition-colors"
                                      >
                                        <Plus className="w-3 h-3" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div> */}
                    </>
                  )}

                  <Separator />

                  {/* 費用匯總 */}
                  {(() => {
                    const {
                      months,
                      newExpiryDate,
                      remainingCredit,
                      usedDays,
                      remainingDays,
                      totalDays,
                    } = getUpgradeProrationInfo();
                    const newPlanCost = getUpgradeNewPlanCost();
                    return (
                      <div className="space-y-2">
                        <div className="p-3 rounded-lg bg-[#FFF8F5] border text-xs text-muted-foreground space-y-1">
                          <div>
                            升級後按原訂單時長{" "}
                            <span className="font-medium text-foreground">
                              {months} 個月
                            </span>{" "}
                            重新計費， 新到期日：
                            <span className="font-medium text-foreground">
                              {newExpiryDate}
                            </span>
                            。
                          </div>
                          <div>
                            原套餐已使用{" "}
                            <span className="font-medium text-foreground">
                              {usedDays}
                            </span>{" "}
                            / {totalDays} 天， 剩餘{" "}
                            <span className="font-medium text-foreground">
                              {remainingDays}
                            </span>{" "}
                            天， 可抵扣餘額{" "}
                            <span className="font-medium text-foreground">
                              ${remainingCredit?.toLocaleString()} HKD
                            </span>
                            。
                          </div>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            新套餐費用（{months} 個月）
                          </span>
                          <span>${fmt(newPlanCost)} HKD</span>
                        </div>
                        <div className="flex justify-between text-sm text-green-600">
                          <span>抵扣原套餐剩餘餘額</span>
                          <span>
                            -${fmt(Math.min(remainingCredit ?? 0, newPlanCost))}{" "}
                            HKD
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            套餐升級應付尾款
                          </span>
                          <span>${fmt(getUpgradePrice())} HKD</span>
                        </div>
                        {calculateUpgradeAddonsTotal() > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                              增值服務（{months} 個月）
                            </span>
                            <span>
                              ${fmt(calculateUpgradeAddonsTotal())} HKD
                            </span>
                          </div>
                        )}
                        <Separator />
                        <div className="flex justify-between items-center text-lg font-bold">
                          <span>總計</span>
                          <span className="text-primary">
                            $
                            {fmt(
                              getUpgradePrice() + calculateUpgradeAddonsTotal()
                            )}{" "}
                            HKD
                          </span>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="flex gap-3 pt-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setShowUpgradeDialog(false)}
                    >
                      取消
                    </Button>
                    <Button
                      className="flex-1"
                      disabled={!selectedUpgradePlan}
                      onClick={handleConfirmUpgrade}
                    >
                      確認升級
                    </Button>
                  </div>
                </div>
              );
            }
          })()}
        </DialogContent>
      </Dialog>
      {/* 支付弹框 */}
      <PaymentPanel
        open={showPaymentDialog}
        onOpenChange={setShowPaymentDialog}
        price={getUpgradePrice() + calculateUpgradeAddonsTotal()}
        handleBackToPaymentMethods={handleBackToPaymentMethods}
        handleFpsPaymentConfirm={handleFpsPaymentConfirm}
      />
    </>
  );
};
