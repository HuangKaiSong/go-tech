import MobileLayout from "@/components/MobileLayout";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  History,
} from "lucide-react";
import { useState } from "react";

type SalaryMonth = {
  period: string;
  netPay: string;
  grossPay: string;
  totalDeduction: string;
  confirmed: boolean;
  items: { label: string; amount: string }[];
  deductions: { label: string; amount: string }[];
};

const salaryHistory: SalaryMonth[] = [
  {
    period: "2026年03月",
    netPay: "13,282",
    grossPay: "15,700",
    totalDeduction: "-2,418",
    confirmed: false,
    items: [
      { label: "基本工資", amount: "11,000" },
      { label: "崗位津貼", amount: "1,200" },
      { label: "績效獎金", amount: "2,100" },
      { label: "加班費", amount: "1,400" },
    ],
    deductions: [
      { label: "強積金（僱員）", amount: "-785" },
      { label: "薪俸稅", amount: "-1,133" },
      { label: "其他扣除", amount: "-500" },
    ],
  },
  {
    period: "2026年02月",
    netPay: "12,850",
    grossPay: "15,200",
    totalDeduction: "-2,350",
    confirmed: true,
    items: [
      { label: "基本工資", amount: "11,000" },
      { label: "崗位津貼", amount: "1,200" },
      { label: "績效獎金", amount: "1,800" },
      { label: "加班費", amount: "1,200" },
    ],
    deductions: [
      { label: "強積金（僱員）", amount: "-760" },
      { label: "薪俸稅", amount: "-1,090" },
      { label: "其他扣除", amount: "-500" },
    ],
  },
  {
    period: "2026年01月",
    netPay: "13,100",
    grossPay: "15,500",
    totalDeduction: "-2,400",
    confirmed: true,
    items: [
      { label: "基本工資", amount: "11,000" },
      { label: "崗位津貼", amount: "1,200" },
      { label: "績效獎金", amount: "2,000" },
      { label: "加班費", amount: "1,300" },
    ],
    deductions: [
      { label: "強積金（僱員）", amount: "-775" },
      { label: "薪俸稅", amount: "-1,125" },
      { label: "其他扣除", amount: "-500" },
    ],
  },
  {
    period: "2025年12月",
    netPay: "14,600",
    grossPay: "17,200",
    totalDeduction: "-2,600",
    confirmed: true,
    items: [
      { label: "基本工資", amount: "11,000" },
      { label: "崗位津貼", amount: "1,200" },
      { label: "績效獎金", amount: "2,500" },
      { label: "加班費", amount: "1,000" },
      { label: "年終花紅", amount: "1,500" },
    ],
    deductions: [
      { label: "強積金（僱員）", amount: "-860" },
      { label: "薪俸稅", amount: "-1,240" },
      { label: "其他扣除", amount: "-500" },
    ],
  },
];

type ViewMode = "current" | "history";

const Salary = () => {
  const [viewMode, setViewMode] = useState<ViewMode>("current");
  const [selectedMonth, setSelectedMonth] = useState(salaryHistory[0]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmed, setConfirmed] = useState(selectedMonth.confirmed);

  const handleConfirm = () => {
    setConfirmed(true);
    setShowConfirmDialog(false);
  };

  const handleSelectHistory = (month: SalaryMonth) => {
    setSelectedMonth(month);
    setConfirmed(month.confirmed);
    setViewMode("current");
  };

  // History list view
  if (viewMode === "history") {
    return (
      <MobileLayout title="歷史薪酬">
        <div className="px-5 pt-4">
          <button
            onClick={() => setViewMode("current")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4 active:opacity-70"
          >
            <ArrowLeft className="w-4 h-4" />
            返回當月
          </button>

          <div className="space-y-3">
            {salaryHistory.map((month) => (
              <button
                key={month.period}
                onClick={() => handleSelectHistory(month)}
                className="w-full bg-card rounded-xl border border-border p-4 flex items-center text-left active:scale-[0.99] transition-transform"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">
                      {month.period}
                    </p>
                    {month.confirmed ? (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full text-success bg-success/10">
                        已確認
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full text-warning bg-warning/10">
                        待確認
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    實發 HK$ {month.netPay}
                  </p>
                </div>
                <p className="text-base font-bold text-foreground">
                  HK$ {month.netPay}
                </p>
              </button>
            ))}
          </div>
        </div>
      </MobileLayout>
    );
  }

  // Current salary detail view
  return (
    <MobileLayout title="薪酬">
      <div className="px-5 pt-4">
        {/* Period selector */}
        <div className="flex items-center justify-between mb-4">
          <button className="flex items-center gap-1.5 text-sm font-medium text-foreground">
            {selectedMonth.period}{" "}
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </button>
          <button
            onClick={() => setViewMode("history")}
            className="flex items-center gap-1.5 text-xs text-primary font-medium active:opacity-70"
          >
            <History className="w-3.5 h-3.5" />
            歷史薪酬
          </button>
        </div>

        {/* Total card */}
        <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-5 mb-5">
          <div className="flex items-center justify-between">
            <p className="text-primary-foreground/70 text-sm">實發工資</p>
            {confirmed ? (
              <span className="flex items-center gap-1 text-[10px] font-medium bg-primary-foreground/20 text-primary-foreground px-2 py-0.5 rounded-full">
                <CheckCircle2 className="w-3 h-3" /> 已確認
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] font-medium bg-primary-foreground/20 text-primary-foreground px-2 py-0.5 rounded-full">
                <Clock className="w-3 h-3" /> 待確認
              </span>
            )}
          </div>
          <p className="text-3xl font-bold text-primary-foreground mt-1">
            HK$ {selectedMonth.netPay}
          </p>
          <div className="flex gap-6 mt-4">
            <div>
              <p className="text-xs text-primary-foreground/60">應發</p>
              <p className="text-sm font-semibold text-primary-foreground">
                HK$ {selectedMonth.grossPay}
              </p>
            </div>
            <div>
              <p className="text-xs text-primary-foreground/60">扣除</p>
              <p className="text-sm font-semibold text-primary-foreground">
                HK$ {selectedMonth.totalDeduction}
              </p>
            </div>
          </div>
        </div>

        {/* Income */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">
            收入明細
          </h3>
          <div className="bg-card rounded-xl border border-border divide-y divide-border">
            {selectedMonth.items.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between px-4 py-3"
              >
                <span className="text-sm text-foreground">{item.label}</span>
                <span className="text-sm font-medium text-foreground">
                  HK$ {item.amount}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Deductions */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">
            扣除項目
          </h3>
          <div className="bg-card rounded-xl border border-border divide-y divide-border">
            {selectedMonth.deductions.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between px-4 py-3"
              >
                <span className="text-sm text-foreground">{item.label}</span>
                <span className="text-sm font-medium text-destructive">
                  HK$ {item.amount}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Confirm salary button */}
        {!confirmed ? (
          <button
            onClick={() => setShowConfirmDialog(true)}
            className="w-full bg-primary text-primary-foreground rounded-xl py-3.5 text-sm font-medium active:scale-[0.98] transition-transform flex items-center justify-center gap-2 mb-6 shadow-sm"
          >
            <Check className="w-4 h-4" />
            確認薪酬
          </button>
        ) : (
          <div className="w-full bg-success/10 text-success rounded-xl py-3.5 text-sm font-medium flex items-center justify-center gap-2 mb-6">
            <CheckCircle2 className="w-4 h-4" />
            已確認薪酬
          </div>
        )}
      </div>

      {/* Confirm dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="max-w-[85vw] rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base">確認薪酬</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              請確認 {selectedMonth.period}{" "}
              的薪酬資料無誤。確認後將無法撤回，如有疑問請聯繫人事部門。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1.5">
            <div className="flex justify-between">
              <span className="text-muted-foreground">應發工資</span>
              <span className="font-medium text-foreground">
                HK$ {selectedMonth.grossPay}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">扣除合計</span>
              <span className="font-medium text-destructive">
                HK$ {selectedMonth.totalDeduction}
              </span>
            </div>
            <div className="flex justify-between border-t border-border pt-1.5">
              <span className="text-muted-foreground font-medium">
                實發工資
              </span>
              <span className="font-bold text-foreground">
                HK$ {selectedMonth.netPay}
              </span>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs">取消</AlertDialogCancel>
            <AlertDialogAction className="text-xs" onClick={handleConfirm}>
              確認無誤
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MobileLayout>
  );
};

export default Salary;

