import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, AlertTriangle, Send } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { DistBatch } from "@/api/payrollDist";
import type { EmployeeOption } from "@/api/employee";

const num = (v: number | null | undefined) => (v ?? 0).toLocaleString();
/** 由期間派生批次編號展示：PD-YYYYMM（後端無獨立批次號） */
const batchNo = (b?: DistBatch | null) => (b?.period ? `PD-${b.period.replace(/-/g, "")}` : "—");

interface ApproveProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batch: DistBatch | null;
  /** 當前審批節點標題 */
  levelTitle?: string;
  /** 該批次是否含異常項目（含則顯示提醒框） */
  hasAnomaly?: boolean;
  comment: string;
  onCommentChange: (v: string) => void;
  onConfirm: () => void;
  loading?: boolean;
}

/** 審核通過確認：批次摘要 + 異常提醒 + 審核意見 */
export function ApproveConfirmDialog({
  open, onOpenChange, batch, levelTitle, hasAnomaly, comment, onCommentChange, onConfirm, loading,
}: ApproveProps) {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-success" /> {t("審核通過確認")}</DialogTitle>
          <DialogDescription>
            {t("確認通過 {{period}} 的發薪批次", { period: batch?.period ?? "" })}{levelTitle ? `（${t(levelTitle)}）` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-border bg-muted/30 divide-y divide-border/70 text-sm overflow-hidden">
          <Row label={t("批次編號")} value={batchNo(batch)} />
          <Row label={t("發薪人數")} value={t("{{n}} 人", { n: batch?.employeeCount ?? 0 })} />
          <Row label={t("發薪日期")} value={batch?.payDate ?? "—"} />
          <Row label={t("發薪方式")} value={batch?.payMethod ? t(batch.payMethod) : "—"} />
          <Row label={t("應發總額")} value={`HK$ ${num(batch?.totalGross)}`} />
          <Row label={t("扣款總額")} value={`- HK$ ${num(batch?.totalDeduction)}`} valueClass="text-destructive" />
          <Row label={t("實發總額")} value={`HK$ ${num(batch?.totalNet)}`} valueClass="text-primary font-bold" bold />
        </div>

        {hasAnomaly && (
          <div className="bg-warning/5 border border-warning/20 rounded-lg p-3 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-warning">{t("此批次包含異常項目")}</p>
              <p className="text-muted-foreground mt-0.5">{t("請確認已檢視異常項目後再進行審核。")}</p>
            </div>
          </div>
        )}

        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">{t("審核意見（選填）")}</label>
          <Textarea placeholder={t("輸入審核意見...")} value={comment} onChange={e => onCommentChange(e.target.value)} rows={3} />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("取消")}</Button>
          <Button className="gap-2 bg-success text-success-foreground hover:bg-success/90" disabled={loading} onClick={onConfirm}>
            <CheckCircle className="h-4 w-4" /> {t("確認通過")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value, valueClass = "", bold }: { label: string; value: string; valueClass?: string; bold?: boolean }) {
  // 有自定義文字顏色時不再疊加 text-foreground，避免 Tailwind 同級顏色類衝突把顏色吃掉
  const colorClass = /text-(destructive|primary|success|warning)/.test(valueClass) ? valueClass : `text-foreground ${valueClass}`;
  return (
    <div className={`flex items-center justify-between px-3 py-2 ${bold ? "bg-muted/40" : ""}`}>
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-medium ${colorClass}`}>{value}</span>
    </div>
  );
}

interface ReassignProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batch: DistBatch | null;
  levelTitle?: string;
  employees: EmployeeOption[];
  targetId: string;
  onTargetChange: (v: string) => void;
  comment: string;
  onCommentChange: (v: string) => void;
  onConfirm: () => void;
  loading?: boolean;
}

/** 轉簽（移交）：把當前級審核任務移交給任意在職員工 */
export function ReassignDialog({
  open, onOpenChange, batch, levelTitle, employees, targetId, onTargetChange, comment, onCommentChange, onConfirm, loading,
}: ReassignProps) {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Send className="h-5 w-5 text-primary" /> {t("轉簽（移交）")}</DialogTitle>
          <DialogDescription>
            {t("將 {{period}} 的發薪批次移交給其他人審核", { period: batch?.period ?? "" })}{levelTitle ? `（${t(levelTitle)}）` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-sm text-muted-foreground">
            {t("移交後由所選審批人審核本級，您將不再看到此待辦；對方通過後流程照常推進到下一級。")}
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">{t("轉簽對象")} <span className="text-destructive">*</span></label>
            <Select value={targetId} onValueChange={onTargetChange}>
              <SelectTrigger><SelectValue placeholder={t("選擇在職員工")} /></SelectTrigger>
              <SelectContent>
                {employees.map(e => (
                  <SelectItem key={e.id} value={String(e.id)}>
                    {e.name}{e.employeeNo ? `（${e.employeeNo}）` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">{t("轉簽說明（選填）")}</label>
            <Textarea placeholder={t("輸入轉簽原因或交接說明...")} value={comment} onChange={e => onCommentChange(e.target.value)} rows={3} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("取消")}</Button>
          <Button className="gap-2" disabled={loading} onClick={onConfirm}><Send className="h-4 w-4" /> {t("確認轉簽")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
