import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import MobileLayout from "@/components/MobileLayout";
import { ArrowLeft, CheckCircle2, Clock, History, Loader2, Wallet } from "lucide-react";
import { getMyPayslips, type Payslip } from "@/api/payroll";

type ViewMode = "current" | "history";

const num = (v: number | null | undefined) => (v ?? 0).toLocaleString();
/** yyyy-MM → yyyy年MM月 */
const fmtPeriod = (p?: string | null) => {
  if (!p) return "—";
  const m = /^(\d{4})-(\d{2})/.exec(p);
  return m ? `${m[1]}年${m[2]}月` : p;
};
/** 已發放(3) 视为已发放，其余为待发放 */
const isPaid = (s?: number) => s === 3;

const Salary = () => {
  const [viewMode, setViewMode] = useState<ViewMode>("current");
  const [selectedIdx, setSelectedIdx] = useState(0);

  const { data: payslips = [], isLoading } = useQuery({
    queryKey: ["myPayslips"],
    queryFn: async () => (await getMyPayslips()).data ?? [],
  });

  const selected: Payslip | undefined = payslips[selectedIdx];
  const paid = isPaid(selected?.statusCode);

  const StatusBadge = useMemo(
    () =>
      ({ statusCode, text }: { statusCode?: number; text?: string }) =>
        isPaid(statusCode) ? (
          <span className="flex items-center gap-1 text-[10px] font-medium bg-success/15 text-success px-2 py-0.5 rounded-full">
            <CheckCircle2 className="w-3 h-3" /> {text || "已發放"}
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[10px] font-medium bg-warning/15 text-warning px-2 py-0.5 rounded-full">
            <Clock className="w-3 h-3" /> {text || "待發放"}
          </span>
        ),
    [],
  );

  if (isLoading) {
    return (
      <MobileLayout title="薪酬">
        <div className="flex justify-center py-20 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      </MobileLayout>
    );
  }

  if (payslips.length === 0) {
    return (
      <MobileLayout title="薪酬">
        <div className="flex flex-col items-center gap-3 py-20 text-muted-foreground px-5 text-center">
          <Wallet className="w-12 h-12 opacity-30" />
          <p className="text-sm">暫無薪酬記錄</p>
          <p className="text-xs">薪資核算確認後即可在此查看</p>
        </div>
      </MobileLayout>
    );
  }

  // History list view
  if (viewMode === "history") {
    return (
      <MobileLayout title="歷史薪酬">
        <div className="px-5 pt-4">
          <button onClick={() => setViewMode("current")} className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4 active:opacity-70">
            <ArrowLeft className="w-4 h-4" />
            返回當月
          </button>

          <div className="space-y-3">
            {payslips.map((month, i) => (
              <button
                key={month.period}
                onClick={() => { setSelectedIdx(i); setViewMode("current"); }}
                className="w-full bg-card rounded-xl border border-border p-4 flex items-center text-left active:scale-[0.99] transition-transform"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{fmtPeriod(month.period)}</p>
                    <StatusBadge statusCode={month.statusCode} text={month.status} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">應發 HK$ {num(month.grossPay)}</p>
                </div>
                <p className="text-base font-bold text-foreground">HK$ {num(month.netPay)}</p>
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
          <span className="text-sm font-medium text-foreground">{fmtPeriod(selected?.period)}</span>
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
            <span className="flex items-center gap-1 text-[10px] font-medium bg-primary-foreground/20 text-primary-foreground px-2 py-0.5 rounded-full">
              {paid ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
              {selected?.status || (paid ? "已發放" : "待發放")}
            </span>
          </div>
          <p className="text-3xl font-bold text-primary-foreground mt-1">HK$ {num(selected?.netPay)}</p>
          <div className="flex gap-6 mt-4">
            <div>
              <p className="text-xs text-primary-foreground/60">應發</p>
              <p className="text-sm font-semibold text-primary-foreground">HK$ {num(selected?.grossPay)}</p>
            </div>
            <div>
              <p className="text-xs text-primary-foreground/60">扣除</p>
              <p className="text-sm font-semibold text-primary-foreground">- HK$ {num(selected?.totalDeduction)}</p>
            </div>
          </div>
        </div>

        {/* Income */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">收入明細</h3>
          <div className="bg-card rounded-xl border border-border divide-y divide-border">
            {(selected?.incomes ?? []).map((item, i) => (
              <div key={`${item.name}-${i}`} className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-foreground">{item.name}</span>
                <span className="text-sm font-medium text-foreground">HK$ {num(item.amount)}</span>
              </div>
            ))}
            {(selected?.incomes ?? []).length === 0 && (
              <div className="px-4 py-3 text-sm text-muted-foreground">無收入明細</div>
            )}
          </div>
        </div>

        {/* Deductions */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-foreground mb-3">扣除項目</h3>
          <div className="bg-card rounded-xl border border-border divide-y divide-border">
            {(selected?.deductions ?? []).map((item, i) => (
              <div key={`${item.name}-${i}`} className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-foreground">{item.name}</span>
                <span className="text-sm font-medium text-destructive">- HK$ {num(item.amount)}</span>
              </div>
            ))}
            {(selected?.deductions ?? []).length === 0 && (
              <div className="px-4 py-3 text-sm text-muted-foreground">無扣除項目</div>
            )}
          </div>
        </div>
      </div>
    </MobileLayout>
  );
};

export default Salary;
