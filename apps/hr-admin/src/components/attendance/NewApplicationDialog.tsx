import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Send, Paperclip, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { getLeaveTypes } from "@/api/leaveSettings";
import { submitApproval, uploadAttachment } from "@/api/approval";

const approvalTypes = [
  { value: "leave", label: "請假申請" },
  { value: "expense", label: "報銷申請" },
  { value: "overtime", label: "加班申請" },
  { value: "travel", label: "出差申請" },
  { value: "resignation", label: "離職申請" },
];

/** 前端类型串 → 后端 ApprovalTypeEnum 码 */
const TYPE_CODE: Record<string, number> = {
  leave: 1, expense: 2, overtime: 3, travel: 4, resignation: 5,
};

/** 由起讫时间(HH:mm)算加班时数，保留2位；非法或跨零点返回 0 */
function diffHours(start: string, end: string): number {
  const m = /^(\d{1,2}):(\d{2})$/;
  const s = m.exec(start);
  const e = m.exec(end);
  if (!s || !e) return 0;
  const min = (Number(e[1]) * 60 + Number(e[2])) - (Number(s[1]) * 60 + Number(s[2]));
  if (min <= 0) return 0;
  return Math.round((min / 60) * 100) / 100;
}

/** 计算两个日期间的整天数（含首尾） */
function inclusiveDays(start: string, end: string): number {
  if (!start || !end) return 0;
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  if (Number.isNaN(s) || Number.isNaN(e) || e < s) return 0;
  return Math.floor((e - s) / 86400000) + 1;
}

interface NewApplicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultType?: string;
}

export function NewApplicationDialog({ open, onOpenChange, defaultType }: NewApplicationDialogProps) {
  const { t: tr } = useTranslation();
  const qc = useQueryClient();
  const [newType, setNewType] = useState(defaultType || "");

  // 請假表单
  const [leaveCode, setLeaveCode] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [days, setDays] = useState("");
  const [reason, setReason] = useState("");
  const [attachments, setAttachments] = useState<{ url: string; name: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 加班表单
  const [otDate, setOtDate] = useState("");
  const [otStart, setOtStart] = useState("");
  const [otEnd, setOtEnd] = useState("");
  const [otCategory, setOtCategory] = useState("weekday");

  // 啟用的假別（真實配置驅動下拉）
  const { data: leaveTypes = [] } = useQuery({
    queryKey: ["leaveTypesEnabled"],
    queryFn: async () => (await getLeaveTypes(true)).data ?? [],
    enabled: open,
  });
  const selectedLeave = leaveTypes.find((t) => t.code === leaveCode);

  const resetForm = () => {
    setNewType(defaultType || "");
    setLeaveCode(""); setStartDate(""); setEndDate(""); setDays("");
    setReason(""); setAttachments([]);
    setOtDate(""); setOtStart(""); setOtEnd(""); setOtCategory("weekday");
  };

  useEffect(() => {
    if (open) resetForm();
    // oxlint-disable-next-line react/exhaustive-deps
  }, [open, defaultType]);

  // 起訖日變動自動算天數（用戶仍可手動改，如半天）
  useEffect(() => {
    const d = inclusiveDays(startDate, endDate);
    if (d > 0) setDays(String(d));
  }, [startDate, endDate]);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const res = await uploadAttachment(file);
        if (res.data?.url) {
          setAttachments((prev) => [...prev, { url: res.data!.url, name: res.data!.originalFilename || file.name }]);
        }
      }
    } catch (e: any) {
      toast.error(e?.message || tr("上傳失敗"));
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    resetForm();
  };

  const submitLeave = async () => {
    if (!leaveCode) { toast.error(tr("請選擇假別")); return; }
    if (!startDate || !endDate) { toast.error(tr("請選擇起訖日期")); return; }
    const dayNum = Number(days);
    if (!days || Number.isNaN(dayNum) || dayNum <= 0) { toast.error(tr("請填寫請假天數")); return; }

    setSubmitting(true);
    try {
      await submitApproval({
        type: TYPE_CODE.leave,
        subType: leaveCode,
        summary: reason,
        payload: {
          leaveType: selectedLeave?.name || leaveCode,
          leaveCode,
          days: dayNum,
          startDate,
          endDate,
          reason,
        },
        attachments: attachments.map((a) => a.url),
      });
      toast.success(tr("請假申請已提交，等待審批"));
      // 刷新可能展示真實數據的頁面 + 額度
      qc.invalidateQueries({ queryKey: ["myApplications"] });
      qc.invalidateQueries({ queryKey: ["approvals"] });
      qc.invalidateQueries({ queryKey: ["leaveBalances"] });
      handleClose();
    } catch (e: any) {
      // 後端業務校驗（假別停用/超上限/餘額不足…）的提示直接回顯
      toast.error(e?.message || tr("提交失敗"));
    } finally {
      setSubmitting(false);
    }
  };

  const submitOvertime = async () => {
    if (!otDate) { toast.error(tr("請選擇加班日期")); return; }
    const hours = diffHours(otStart, otEnd);
    if (hours <= 0) { toast.error(tr("請填寫有效的加班起訖時間")); return; }

    setSubmitting(true);
    try {
      await submitApproval({
        type: TYPE_CODE.overtime,
        subType: otCategory,
        summary: reason,
        payload: {
          date: otDate,
          startTime: otStart,
          endTime: otEnd,
          hours,
          category: otCategory,
          reason,
        },
        attachments: attachments.map((a) => a.url),
      });
      toast.success(tr("加班申請已提交，等待審批"));
      qc.invalidateQueries({ queryKey: ["myApplications"] });
      qc.invalidateQueries({ queryKey: ["approvals"] });
      handleClose();
    } catch (e: any) {
      toast.error(e?.message || tr("提交失敗"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = () => {
    if (newType === "leave") {
      submitLeave();
      return;
    }
    if (newType === "overtime") {
      submitOvertime();
      return;
    }
    // 其餘類型（報銷/出差/離職）本期未接後端，維持原提示
    toast.success(tr("申請已提交，等待審批"));
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{tr("新增審批申請")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>{tr("申請類型")}</Label>
            <Select value={newType} onValueChange={setNewType}>
              <SelectTrigger><SelectValue placeholder={tr("選擇申請類型")} /></SelectTrigger>
              <SelectContent>
                {approvalTypes.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{tr(t.label)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {newType === "leave" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{tr("假別")}</Label>
                  <Select value={leaveCode} onValueChange={setLeaveCode}>
                    <SelectTrigger><SelectValue placeholder={tr("選擇假別")} /></SelectTrigger>
                    <SelectContent>
                      {leaveTypes.length === 0 ? (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">{tr("尚無啟用假別")}</div>
                      ) : leaveTypes.map((t) => (
                        <SelectItem key={t.code} value={t.code}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{tr("時長（天）")}</Label>
                  <Input type="number" step="0.5" placeholder={tr("請輸入天數")} value={days}
                    onChange={(e) => setDays(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>{tr("開始日期")}</Label>
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
                <div className="space-y-2"><Label>{tr("結束日期")}</Label>
                  <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></div>
              </div>
              {selectedLeave && (
                <div className="flex flex-wrap gap-1.5 text-xs">
                  <Badge variant="outline" className={selectedLeave.paid ? "bg-success/10 text-success border-success/20" : ""}>
                    {selectedLeave.paid ? tr("帶薪") : tr("無薪")}
                  </Badge>
                  {selectedLeave.maxPerRequest != null && (
                    <Badge variant="outline">{tr("單次上限 {{n}} 天", { n: selectedLeave.maxPerRequest })}</Badge>
                  )}
                  {selectedLeave.advanceApplyDays > 0 && (
                    <Badge variant="outline">{tr("須提前 {{n}} 天", { n: selectedLeave.advanceApplyDays })}</Badge>
                  )}
                  {selectedLeave.requireProof && (
                    <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                      {tr("≥ {{n}} 天需附證明", { n: selectedLeave.proofThresholdDays })}
                    </Badge>
                  )}
                </div>
              )}
            </>
          )}

          {newType === "expense" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{tr("報銷類型")}</Label>
                  <Select><SelectTrigger><SelectValue placeholder={tr("選擇類型")} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="travel">{tr("差旅費")}</SelectItem>
                      <SelectItem value="transport">{tr("交通費")}</SelectItem>
                      <SelectItem value="meal">{tr("餐費")}</SelectItem>
                      <SelectItem value="office">{tr("辦公用品")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>{tr("金額")}</Label><Input type="number" placeholder="NT$" /></div>
              </div>
              <div className="space-y-2"><Label>{tr("發生日期")}</Label><Input type="date" /></div>
            </>
          )}

          {newType === "overtime" && (
            <>
              <div className="space-y-2"><Label>{tr("加班日期")}</Label><Input type="date" value={otDate} onChange={(e) => setOtDate(e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>{tr("開始時間")}</Label><Input type="time" value={otStart} onChange={(e) => setOtStart(e.target.value)} /></div>
                <div className="space-y-2"><Label>{tr("結束時間")}</Label><Input type="time" value={otEnd} onChange={(e) => setOtEnd(e.target.value)} /></div>
              </div>
              <div className="space-y-2">
                <Label>{tr("加班時數")}</Label>
                <Input value={diffHours(otStart, otEnd) || ""} readOnly placeholder={tr("由起訖時間自動計算")} />
              </div>
              <div className="space-y-2">
                <Label>{tr("加班類型")}</Label>
                <Select value={otCategory} onValueChange={setOtCategory}><SelectTrigger><SelectValue placeholder={tr("選擇類型")} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekday">{tr("工作日")}</SelectItem>
                    <SelectItem value="weekend">{tr("週末")}</SelectItem>
                    <SelectItem value="holiday">{tr("節假日")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {newType === "travel" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>{tr("目的地城市")}</Label><Input placeholder={tr("如：上海")} /></div>
                <div className="space-y-2"><Label>{tr("國家")}</Label><Input placeholder={tr("如：中國")} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>{tr("開始日期")}</Label><Input type="date" /></div>
                <div className="space-y-2"><Label>{tr("結束日期")}</Label><Input type="date" /></div>
              </div>
              <div className="space-y-2"><Label>{tr("預算（NT$）")}</Label><Input type="number" placeholder={tr("預估預算")} /></div>
            </>
          )}

          {newType === "resignation" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{tr("離職類型")}</Label>
                  <Select><SelectTrigger><SelectValue placeholder={tr("選擇類型")} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="voluntary">{tr("自願離職")}</SelectItem>
                      <SelectItem value="retirement">{tr("退休")}</SelectItem>
                      <SelectItem value="contract">{tr("合約到期")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>{tr("預計離職日")}</Label><Input type="date" /></div>
              </div>
              <div className="space-y-2"><Label>{tr("最後工作日")}</Label><Input type="date" /></div>
              <div className="space-y-2">
                <Label>{tr("是否願意接受慰留")}</Label>
                <Select><SelectTrigger><SelectValue placeholder={tr("請選擇")} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">{tr("是")}</SelectItem>
                    <SelectItem value="no">{tr("否")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {newType && (
            <>
              <div className="space-y-2">
                <Label>{tr("事由說明")}</Label>
                <Textarea placeholder={tr("請輸入申請事由...")} value={reason} onChange={(e) => setReason(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{tr("附件")}{newType === "leave" && selectedLeave?.requireProof ? tr("（本假別可能需要證明）") : ""}</Label>
                <label className="border-2 border-dashed border-border rounded-lg p-4 flex flex-col items-center justify-center text-muted-foreground text-sm cursor-pointer hover:border-primary/50 transition-colors">
                  {uploading ? <Loader2 className="h-5 w-5 mb-1 animate-spin" /> : <Paperclip className="h-5 w-5 mb-1" />}
                  {uploading ? tr("上傳中...") : tr("點擊上傳附件")}
                  <input type="file" multiple className="hidden" disabled={uploading}
                    onChange={(e) => handleUpload(e.target.files)} />
                </label>
                {attachments.length > 0 && (
                  <div className="space-y-1">
                    {attachments.map((a, i) => (
                      <div key={i} className="flex items-center justify-between text-xs bg-muted/50 rounded px-2 py-1">
                        <span className="truncate">{a.name}</span>
                        <button type="button" onClick={() => setAttachments((prev) => prev.filter((_, x) => x !== i))}>
                          <X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>{tr("取消")}</Button>
          <Button disabled={!newType || submitting} onClick={handleSubmit}>
            {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
            {tr("提交申請")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
