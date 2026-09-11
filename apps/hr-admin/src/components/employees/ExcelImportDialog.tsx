import { useState, useRef } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import * as XLSX from "xlsx";

interface ExcelImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (data: Record<string, string>[]) => Promise<{ success: number; fail: number }>;
}

const EXPECTED_HEADERS = ["姓名", "部門", "職位", "聯絡電話", "入職日期"];

export function ExcelImportDialog({ open, onOpenChange, onImport }: ExcelImportDialogProps) {
  const { t } = useTranslation();
  const [previewData, setPreviewData] = useState<Record<string, string>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setPreviewData([]);
    setHeaders([]);
    setFileName("");
    setError("");
    setImporting(false);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setError("");

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target?.result, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: "" });
        if (json.length === 0) {
          setError(t("檔案中沒有資料"));
          return;
        }
        const h = Object.keys(json[0]);
        setHeaders(h);
        setPreviewData(json.slice(0, 10));
      } catch {
        setError(t("無法解析此檔案，請確認格式正確"));
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImport = async () => {
    if (previewData.length === 0) return;
    setImporting(true);
    try {
      const { success, fail } = await onImport(previewData);
      if (fail > 0) {
        toast.warning(t("匯入完成：成功 {{success}} 筆，失敗 {{fail}} 筆", { success, fail }));
      } else {
        toast.success(t("成功匯入 {{n}} 筆員工資料", { n: success }));
      }
      reset();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || t("匯入失敗"));
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([EXPECTED_HEADERS]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "員工資料");
    XLSX.writeFile(wb, "員工匯入範本.xlsx");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            {t("Excel 批量匯入員工")}
          </DialogTitle>
          <DialogDescription>{t("上傳 Excel 檔案批量新增員工資料")}</DialogDescription>
        </DialogHeader>

        {importing ? (
          <div className="flex flex-col items-center gap-3 py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">{t("正在匯入 {{n}} 筆資料...", { n: previewData.length })}</p>
          </div>
        ) : !fileName ? (
          <div className="flex flex-col items-center gap-4 py-10 border-2 border-dashed rounded-lg border-muted-foreground/25">
            <Upload className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{t("點擊選擇或拖放 Excel 檔案")}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                {t("選擇檔案")}
              </Button>
              <Button variant="ghost" size="sm" onClick={downloadTemplate}>
                {t("下載範本")}
              </Button>
            </div>
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFile} />
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 p-4 rounded-lg bg-destructive/10 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <span className="text-sm">{error}</span>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-success" />
              {t("已讀取")} <strong>{fileName}</strong>{t("，預覽前 {{n}} 筆", { n: previewData.length })}
            </div>
            <div className="border rounded-lg overflow-auto max-h-[300px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    {headers.map((h) => <TableHead key={h}>{h}</TableHead>)}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.map((row, i) => (
                    <TableRow key={i}>
                      {headers.map((h) => <TableCell key={h}>{row[h]}</TableCell>)}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          {fileName && !error && !importing && (
            <>
              <Button variant="outline" onClick={reset}>{t("重新選擇")}</Button>
              <Button onClick={handleImport} disabled={importing}>
                {importing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
                {t("確定匯入")}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}