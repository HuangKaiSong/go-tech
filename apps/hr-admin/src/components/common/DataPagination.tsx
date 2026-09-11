import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from "lucide-react";

export interface DataPaginationProps {
  /** 當前頁碼（從 1 開始） */
  current: number;
  /** 每頁條數 */
  pageSize: number;
  /** 總條數 */
  total: number;
  /** 頁碼變更回呼 */
  onChange: (page: number) => void;
  /** 每頁條數變更回呼（不傳則不顯示每頁條數選擇器） */
  onPageSizeChange?: (size: number) => void;
  /** 每頁條數可選項 */
  pageSizeOptions?: number[];
  className?: string;
}

/**
 * 通用分頁組件
 * 顯示：總數 + 每頁條數 + 首頁/上一頁/頁碼/下一頁/末頁
 */
export function DataPagination({
  current,
  pageSize,
  total,
  onChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  className = "",
}: DataPaginationProps) {
  const { t } = useTranslation();
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, current - Math.floor(maxVisible / 2));
    const end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  const go = (p: number) => {
    const next = Math.min(totalPages, Math.max(1, p));
    if (next !== current) onChange(next);
  };

  if (total <= 0) return null;

  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 px-6 py-3 border-t ${className}`}>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span>{t("共 {{total}} 筆，第 {{current}}/{{pages}} 頁", { total, current, pages: totalPages })}</span>
        {onPageSizeChange && (
          <div className="flex items-center gap-1">
            <span>{t("每頁")}</span>
            <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v))}>
              <SelectTrigger className="h-8 w-[72px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((s) => (
                  <SelectItem key={s} value={String(s)}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span>{t("筆")}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon" className="h-8 w-8"
          disabled={current <= 1} onClick={() => go(1)} aria-label={t("首頁")}>
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" className="h-8 w-8"
          disabled={current <= 1} onClick={() => go(current - 1)} aria-label={t("上一頁")}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {getPageNumbers().map((page) => (
          <Button key={page} variant={page === current ? "default" : "outline"}
            size="icon" className="h-8 w-8" onClick={() => go(page)}>
            {page}
          </Button>
        ))}
        <Button variant="outline" size="icon" className="h-8 w-8"
          disabled={current >= totalPages} onClick={() => go(current + 1)} aria-label={t("下一頁")}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" className="h-8 w-8"
          disabled={current >= totalPages} onClick={() => go(totalPages)} aria-label={t("末頁")}>
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
