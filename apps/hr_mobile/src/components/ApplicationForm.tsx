import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, CalendarDays, ClipboardCheck, Clock, Loader2, LogOut, Paperclip, Plane, Receipt, Upload, X } from "lucide-react";
import { toast } from "sonner";
import {
  type ApplicationTypeKey, SUPPLEMENT_BOTH, SUPPLEMENT_CLOCK_IN,
  SUPPLEMENT_CLOCK_OUT, TYPE_CODE, submitApproval,
  uploadAttachment,
} from "@/api/approval";
import { type EmployeeOption, getActiveEmployeeOptions } from "@/api/employee";
import { getLeaveTypes } from "@/api/leave";
import { useQuery } from "@tanstack/react-query";

export type { ApplicationTypeKey };

/** 已上传附件：name 用于展示，url 是提交给后端的地址 */
type Attachment = { name: string; url: string };

/** 由外部带入的初始值（如打卡页从缺勤记录跳来时预填补卡日期） */
export type ApplicationFormInitial = {
  supplementDate?: string;
  supplementSlot?: string;
};

type Props = {
  initial?: ApplicationFormInitial;
  onBack: () => void;
  onSubmit: () => void;
  typeKey: ApplicationTypeKey;
};

const typeMeta: Record<ApplicationTypeKey, { color: string; icon: React.ComponentType<{ className?: string }>; label: string }> = {
  leave: { label: "請假申請", icon: CalendarDays, color: "bg-primary" },
  overtime: { label: "加班申請", icon: Clock, color: "bg-warning" },
  expense: { label: "報銷申請", icon: Receipt, color: "bg-accent" },
  trip: { label: "出差申請", icon: Plane, color: "bg-info" },
  resign: { label: "離職申請", icon: LogOut, color: "bg-destructive" },
  supplement: { label: "補卡申請", icon: ClipboardCheck, color: "bg-primary" },
};

/** 假别兜底列表：后端「假期設定」无配置或接口异常时回退 */
const LEAVE_CATEGORIES_FALLBACK = ["年假", "事假", "病假", "婚假", "產假", "陪產假", "喪假", "補休"];
/** 假别名称→code 兜底映射（后端期望的是 code；正常走 leaveTypeData，接口异常时用此表） */
const LEAVE_NAME_CODE_FALLBACK: Record<string, string> = {
  年假: "annual",
  病假: "sick",
  事假: "personal",
  婚假: "marriage",
  產假: "maternity",
  補休: "compensate",
};
const expenseCategories = ["交通費", "餐費", "住宿費", "招待費", "辦公用品", "通訊費", "其他"];
const overtimeTypes = ["平日加班", "假日加班", "國定假日加班"];
const tripTypes = ["國內出差", "國外出差"];
const resignReasons = ["職涯發展", "個人因素", "家庭因素", "健康因素", "薪資福利", "工作環境", "其他"];
const supplementSlots = [SUPPLEMENT_CLOCK_IN, SUPPLEMENT_CLOCK_OUT, SUPPLEMENT_BOTH];
const supplementReasons = ["忘記打卡", "外出公務", "系統故障", "設備問題", "其他"];
/** 僅允許補登最近 7 日內（含今日）的打卡 */
const SUPPLEMENT_DAY_LIMIT = 7;

const inputCls = "w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30";
const labelCls = "text-xs font-medium text-foreground mb-1.5 block";
const requiredMark = <span className="text-destructive ml-0.5">*</span>;

const Field = ({ children, hint, label, required }: { children: React.ReactNode; hint?: string; label: string; required?: boolean }) => (
  <div>
    <label className={labelCls}>{label}{required && requiredMark}</label>
    {children}
    {hint && <p className="text-[10px] text-muted-foreground mt-1">{hint}</p>}
  </div>
);

const ChipGroup = ({ onChange, options, value }: { onChange: (v: string) => void; options: string[]; value: string }) => (
  <div className="flex flex-wrap gap-2">
    {options.map((opt) => (
      <button
        key={opt}
        type="button"
        onClick={() => onChange(opt)}
        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors active:scale-95 ${
          value === opt
            ? "bg-primary text-primary-foreground border-primary"
            : "bg-card text-foreground border-border"
        }`}
      >
        {opt}
      </button>
    ))}
  </div>
);

const AttachmentPicker = ({ files, label = "上傳附件", setFiles }: { files: Attachment[]; label?: string; setFiles: (f: Attachment[]) => void }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // 清空 input 值，否则同一檔案第二次選取不會觸發 change
    if (inputRef.current) inputRef.current.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadAttachment(file);
      setFiles([...files, { name: res.data.originalFilename, url: res.data.url }]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "上傳失敗");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {files.map((f, i) => (
          <span key={f.url} className="inline-flex items-center gap-1.5 bg-muted rounded-lg px-2.5 py-1 text-[11px] text-foreground max-w-full">
            <Paperclip className="w-3 h-3 shrink-0" />
            <span className="truncate">{f.name}</span>
            <button type="button" onClick={() => setFiles(files.filter((_, idx) => idx !== i))} className="text-muted-foreground active:scale-90 shrink-0">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      <input ref={inputRef} type="file" onChange={pick} className="hidden" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" />
      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className="w-full border-2 border-dashed border-border rounded-lg py-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground active:scale-[0.99] disabled:opacity-60"
      >
        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
        {uploading ? "上傳中..." : label}
      </button>
    </div>
  );
};

const daySpan = (start: string, end: string) => {
  if (!start || !end) return 0;
  const diff = Math.floor((new Date(end).getTime() - new Date(start).getTime()) / 86400000) + 1;
  return diff > 0 ? diff : 0;
};

/** 校验失败：提示并返回 null */
const err = (msg: string) => {
  toast.error(msg);
  return null;
};

const ApplicationForm = ({ initial, onBack, onSubmit, typeKey }: Props) => {
  const meta = typeMeta[typeKey];
  const Icon = meta.icon;

  // Shared
  const [reason, setReason] = useState("");
  const [files, setFiles] = useState<Attachment[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Leave 假别取后端「假期設定」的启用假别（供请假单下拉），异常回退兜底列表
  const { data: leaveTypeData } = useQuery({
    queryKey: ["leaveTypes"],
    queryFn: async () => (await getLeaveTypes()).data ?? [],
    enabled: typeKey === "leave",
  });
  const leaveCategories = useMemo(
    () => (leaveTypeData && leaveTypeData.length ? leaveTypeData.map((t) => t.name) : LEAVE_CATEGORIES_FALLBACK),
    [leaveTypeData],
  );
  // 名称→code：提交给后端的是 code（后端按 code 接收），显示用名称
  const leaveNameToCode = useMemo(() => {
    const m: Record<string, string> = {};
    (leaveTypeData ?? []).forEach((t) => {
      if (t.name) m[t.name] = t.code;
    });
    return m;
  }, [leaveTypeData]);
  const [leaveType, setLeaveType] = useState(LEAVE_CATEGORIES_FALLBACK[0]);
  // 列表加载后若当前选中项不在其中，重置为第一项
  useEffect(() => {
    if (leaveCategories.length && !leaveCategories.includes(leaveType)) {
      setLeaveType(leaveCategories[0]);
    }
  }, [leaveCategories, leaveType]);
  const [leaveStart, setLeaveStart] = useState("");
  const [leaveEnd, setLeaveEnd] = useState("");
  const [leaveHalf, setLeaveHalf] = useState<"am" | "full" | "pm">("full");
  const [leaveContact, setLeaveContact] = useState("");

  // Overtime
  const [otType, setOtType] = useState(overtimeTypes[0]);
  const [otDate, setOtDate] = useState("");
  const [otStart, setOtStart] = useState("");
  const [otEnd, setOtEnd] = useState("");
  const [otCompensation, setOtCompensation] = useState<"leave" | "pay">("pay");

  // Expense
  const [expCategory, setExpCategory] = useState(expenseCategories[0]);
  const [expDate, setExpDate] = useState("");
  const [expAmount, setExpAmount] = useState("");
  const [expCurrency, setExpCurrency] = useState("HKD");
  const [expInvoiceNo, setExpInvoiceNo] = useState("");
  const [expPayee, setExpPayee] = useState("");

  // Trip
  const [tripType, setTripType] = useState(tripTypes[0]);
  const [tripCountry, setTripCountry] = useState("");
  const [tripCity, setTripCity] = useState("");
  const [tripStart, setTripStart] = useState("");
  const [tripEnd, setTripEnd] = useState("");
  const [tripTransport, setTripTransport] = useState("飛機");
  const [tripBudget, setTripBudget] = useState("");
  const [tripCompanions, setTripCompanions] = useState("");

  // Supplement（補卡）
  const [supDate, setSupDate] = useState(initial?.supplementDate ?? "");
  const [supSlot, setSupSlot] = useState(initial?.supplementSlot ?? SUPPLEMENT_CLOCK_IN);
  const [supInTime, setSupInTime] = useState("");
  const [supOutTime, setSupOutTime] = useState("");
  const [supMissReason, setSupMissReason] = useState(supplementReasons[0]);
  const [supWitness, setSupWitness] = useState("");

  // 補卡日期可選範圍：最近 7 日內（含今日），由 date 控件直接限制
  const supDateRange = useMemo(() => {
    const today = new Date();
    const min = new Date(today);
    min.setDate(min.getDate() - (SUPPLEMENT_DAY_LIMIT - 1));
    const fmt = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return { min: fmt(min), max: fmt(today) };
  }, []);

  // Resign
  const [resignDate, setResignDate] = useState("");
  const [resignReason, setResignReason] = useState(resignReasons[0]);
  const [resignHandover, setResignHandover] = useState("");
  const [resignFeedback, setResignFeedback] = useState("");
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);

  // 交接对象取在职员工，仅离职单需要
  useEffect(() => {
    if (typeKey !== "resign") return;
    getActiveEmployeeOptions()
      .then((res) => setEmployees(res.data ?? []))
      .catch((e) => toast.error(e instanceof Error ? e.message : "載入員工清單失敗"));
  }, [typeKey]);

  /** 两个 yyyy-MM-dd 之间的自然日天数（含头尾）；无效返回 0 */
  /** 加班时数（数值，参与规则条件判定） */
  const otHours = useMemo(() => {
    if (!otStart || !otEnd) return 0;
    const [sh, sm] = otStart.split(":").map(Number);
    const [eh, em] = otEnd.split(":").map(Number);
    const diff = (eh * 60 + em - sh * 60 - sm) / 60;
    return diff > 0 ? Number(diff.toFixed(1)) : 0;
  }, [otStart, otEnd]);

  /** 请假天数（数值，半天扣 0.5，参与规则条件判定） */
  const leaveDays = useMemo(() => {
    const base = daySpan(leaveStart, leaveEnd);
    if (!base) return 0;
    return leaveHalf === "full" ? base : base - 0.5;
  }, [leaveStart, leaveEnd, leaveHalf]);

  /** 出差天数（数值，参与规则条件判定） */
  const tripDays = useMemo(() => daySpan(tripStart, tripEnd), [tripStart, tripEnd]);

  /**
   * 各类型的表单校验 + 组装提交入参。
   * payload 中 days/hours/amount/subType 为规则引擎的条件判定字段，键名不可改。
   * 校验不通过时提示并返回 null。
   */
  // oxlint-disable-next-line complexity
  const buildParams = () => {
    const attachments = files.map((f) => f.url);

    if (typeKey === "leave") {
      if (!leaveStart || !leaveEnd) return err("請選擇起止日期");
      if (!leaveDays) return err("結束日期需不早於開始日期");
      if (!reason.trim()) return err("請填寫請假事由");
      const leaveCode = leaveNameToCode[leaveType] ?? LEAVE_NAME_CODE_FALLBACK[leaveType] ?? leaveType;
      return {
        type: TYPE_CODE.leave,
        subType: leaveCode,
        summary: `${leaveType} ${leaveDays}天（${leaveStart} ~ ${leaveEnd}）`,
        payload: { days: leaveDays, startDate: leaveStart, endDate: leaveEnd, half: leaveHalf, contact: leaveContact, reason },
        attachments,
      };
    }
    if (typeKey === "overtime") {
      if (!otDate || !otStart || !otEnd) return err("請填寫加班日期與時段");
      if (!otHours) return err("結束時間需晚於開始時間");
      if (!reason.trim()) return err("請填寫加班事由");
      return {
        type: TYPE_CODE.overtime,
        subType: otType,
        summary: `${otType} ${otHours}小時（${otDate} ${otStart}-${otEnd}）`,
        payload: { hours: otHours, date: otDate, startTime: otStart, endTime: otEnd, compensation: otCompensation, reason },
        attachments,
      };
    }
    if (typeKey === "expense") {
      if (!expDate || !expAmount) return err("請填寫報銷日期與金額");
      const amount = Number(expAmount);
      if (!(amount > 0)) return err("金額需大於 0");
      if (files.length === 0) return err("請至少上傳一張發票");
      if (!reason.trim()) return err("請填寫報銷說明");
      return {
        type: TYPE_CODE.expense,
        subType: expCategory,
        summary: `${expCategory} ${expCurrency} ${amount}`,
        payload: { amount, currency: expCurrency, date: expDate, invoiceNo: expInvoiceNo, payee: expPayee, reason },
        attachments,
      };
    }
    if (typeKey === "trip") {
      if (!tripCountry || !tripCity || !tripStart || !tripEnd) return err("請填寫出差目的地與起止日期");
      if (!tripDays) return err("返回日期需不早於出發日期");
      if (!reason.trim()) return err("請填寫出差事由");
      return {
        type: TYPE_CODE.trip,
        subType: tripType,
        summary: `${tripCountry}${tripCity} ${tripDays}天（${tripStart} ~ ${tripEnd}）`,
        payload: {
          days: tripDays, country: tripCountry, city: tripCity, startDate: tripStart, endDate: tripEnd,
          transport: tripTransport, budget: tripBudget ? Number(tripBudget) : undefined, companions: tripCompanions, reason,
        },
        attachments,
      };
    }
    if (typeKey === "supplement") {
      if (!supDate) return err("請選擇補卡日期");
      const needIn = supSlot === SUPPLEMENT_CLOCK_IN || supSlot === SUPPLEMENT_BOTH;
      const needOut = supSlot === SUPPLEMENT_CLOCK_OUT || supSlot === SUPPLEMENT_BOTH;
      if (needIn && !supInTime) return err("請填寫上班補卡時間");
      if (needOut && !supOutTime) return err("請填寫下班補卡時間");
      if (supSlot === SUPPLEMENT_BOTH && supOutTime <= supInTime) return err("下班時間需晚於上班時間");
      if (!reason.trim()) return err("請填寫詳細說明");
      const times = [needIn ? supInTime : null, needOut ? supOutTime : null].filter(Boolean).join(" - ");
      return {
        type: TYPE_CODE.supplement,
        subType: supSlot,
        summary: `${supDate} ${supSlot} ${times}`,
        payload: {
          date: supDate,
          // 依時段只帶對應時間，避免未填的一側落庫成空值
          clockInTime: needIn ? supInTime : undefined,
          clockOutTime: needOut ? supOutTime : undefined,
          missReason: supMissReason,
          witness: supWitness,
          reason,
        },
        attachments,
      };
    }
    // resign
    if (!resignDate) return err("請選擇預計離職日期");
    if (!resignHandover) return err("請選擇工作交接對象");
    if (!reason.trim()) return err("請填寫離職原因說明");
    const handover = employees.find((p) => String(p.id) === resignHandover);
    return {
      type: TYPE_CODE.resign,
      subType: resignReason,
      summary: `預計離職日 ${resignDate}（${resignReason}）`,
      payload: {
        resignDate, resignReason, feedback: resignFeedback, reason,
        // 姓名供审批人阅读，id 供后续离职交接流程取用
        handover: handover?.name,
        handoverId: handover?.id,
      },
      attachments,
    };
  };

  const handleSubmit = async () => {
    const params = buildParams();
    if (!params) return;
    setSubmitting(true);
    try {
      await submitApproval(params);
      toast.success(`${meta.label}已提交，等待審批`);
      onSubmit();
    } catch (e) {
      // 后端校验规则（如「病假需上傳診斷證明」）不通过时也会走这里
      toast.error(e instanceof Error ? e.message : "提交失敗");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="px-5 pt-4 pb-8">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4 active:opacity-70">
        <ArrowLeft className="w-4 h-4" />
        返回
      </button>

      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className={`w-11 h-11 rounded-xl ${meta.color} flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-foreground">{meta.label}</h2>
          <p className="text-[11px] text-muted-foreground">請完整填寫以下資料</p>
        </div>
      </div>

      <div className="space-y-4">
        {typeKey === "leave" && (
          <>
            <Field label="請假類別" required>
              <ChipGroup options={leaveCategories} value={leaveType} onChange={setLeaveType} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="開始日期" required>
                <input type="date" value={leaveStart} onChange={(e) => setLeaveStart(e.target.value)} className={inputCls} />
              </Field>
              <Field label="結束日期" required>
                <input type="date" value={leaveEnd} onChange={(e) => setLeaveEnd(e.target.value)} className={inputCls} />
              </Field>
            </div>
            <Field label="時段">
              <div className="flex gap-2">
                {([["full", "全天"], ["am", "上午半天"], ["pm", "下午半天"]] as const).map(([k, l]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setLeaveHalf(k)}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-colors ${
                      leaveHalf === k ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-foreground"
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </Field>
            {leaveDays > 0 && (
              <div className="bg-muted/50 rounded-lg px-3 py-2 text-xs text-foreground">
                共計 <span className="font-semibold text-primary">{leaveDays} 天</span>
              </div>
            )}
            <Field label="請假事由" required>
              <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="請詳細說明請假原因..." className={`${inputCls} h-24 resize-none`} />
            </Field>
            <Field label="緊急聯絡方式">
              <input value={leaveContact} onChange={(e) => setLeaveContact(e.target.value)} placeholder="請假期間可聯絡的電話" className={inputCls} />
            </Field>
            <Field label="附件（診斷書、證明文件等）">
              <AttachmentPicker files={files} setFiles={setFiles} />
            </Field>
          </>
        )}

        {typeKey === "overtime" && (
          <>
            <Field label="加班類型" required>
              <ChipGroup options={overtimeTypes} value={otType} onChange={setOtType} />
            </Field>
            <Field label="加班日期" required>
              <input type="date" value={otDate} onChange={(e) => setOtDate(e.target.value)} className={inputCls} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="開始時間" required>
                <input type="time" value={otStart} onChange={(e) => setOtStart(e.target.value)} className={inputCls} />
              </Field>
              <Field label="結束時間" required>
                <input type="time" value={otEnd} onChange={(e) => setOtEnd(e.target.value)} className={inputCls} />
              </Field>
            </div>
            {otHours > 0 && (
              <div className="bg-muted/50 rounded-lg px-3 py-2 text-xs text-foreground">
                預計加班時數 <span className="font-semibold text-primary">{otHours} 小時</span>
              </div>
            )}
            <Field label="補償方式" required>
              <div className="flex gap-2">
                {([["pay", "加班費"], ["leave", "折換補休"]] as const).map(([k, l]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setOtCompensation(k)}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-colors ${
                      otCompensation === k ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-foreground"
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="加班事由" required>
              <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="請說明加班的工作內容與必要性..." className={`${inputCls} h-24 resize-none`} />
            </Field>
          </>
        )}

        {typeKey === "expense" && (
          <>
            <Field label="報銷類別" required>
              <ChipGroup options={expenseCategories} value={expCategory} onChange={setExpCategory} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="消費日期" required>
                <input type="date" value={expDate} onChange={(e) => setExpDate(e.target.value)} className={inputCls} />
              </Field>
              <Field label="幣別">
                <select value={expCurrency} onChange={(e) => setExpCurrency(e.target.value)} className={inputCls}>
                  <option value="HKD">HKD 港幣</option>
                  <option value="TWD">TWD 台幣</option>
                  <option value="CNY">CNY 人民幣</option>
                  <option value="USD">USD 美元</option>
                  <option value="JPY">JPY 日圓</option>
                </select>
              </Field>
            </div>
            <Field label="金額" required>
              <input type="number" inputMode="decimal" value={expAmount} onChange={(e) => setExpAmount(e.target.value)} placeholder="0.00" className={inputCls} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="發票號碼">
                <input value={expInvoiceNo} onChange={(e) => setExpInvoiceNo(e.target.value)} placeholder="選填" className={inputCls} />
              </Field>
              <Field label="收款人/店家">
                <input value={expPayee} onChange={(e) => setExpPayee(e.target.value)} placeholder="選填" className={inputCls} />
              </Field>
            </div>
            <Field label="說明" required>
              <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="請說明費用用途..." className={`${inputCls} h-20 resize-none`} />
            </Field>
            <Field label="發票附件" required hint="請上傳發票或收據照片">
              <AttachmentPicker files={files} setFiles={setFiles} label="上傳發票" />
            </Field>
          </>
        )}

        {typeKey === "trip" && (
          <>
            <Field label="出差類型" required>
              <ChipGroup options={tripTypes} value={tripType} onChange={setTripType} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="國家/地區" required>
                <input value={tripCountry} onChange={(e) => setTripCountry(e.target.value)} placeholder="如：日本" className={inputCls} />
              </Field>
              <Field label="城市" required>
                <input value={tripCity} onChange={(e) => setTripCity(e.target.value)} placeholder="如：東京" className={inputCls} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="出發日期" required>
                <input type="date" value={tripStart} onChange={(e) => setTripStart(e.target.value)} className={inputCls} />
              </Field>
              <Field label="返回日期" required>
                <input type="date" value={tripEnd} onChange={(e) => setTripEnd(e.target.value)} className={inputCls} />
              </Field>
            </div>
            {tripDays > 0 && (
              <div className="bg-muted/50 rounded-lg px-3 py-2 text-xs text-foreground">
                共計 <span className="font-semibold text-primary">{tripDays} 天</span>
              </div>
            )}
            <Field label="交通方式">
              <ChipGroup options={["飛機", "高鐵", "火車", "自駕", "其他"]} value={tripTransport} onChange={setTripTransport} />
            </Field>
            <Field label="預估費用 (HKD)">
              <input type="number" value={tripBudget} onChange={(e) => setTripBudget(e.target.value)} placeholder="包含機票、住宿、交通等" className={inputCls} />
            </Field>
            <Field label="同行人員">
              <input value={tripCompanions} onChange={(e) => setTripCompanions(e.target.value)} placeholder="如無填「無」" className={inputCls} />
            </Field>
            <Field label="出差事由/行程" required>
              <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="請說明出差目的、預計會議或拜訪對象..." className={`${inputCls} h-24 resize-none`} />
            </Field>
          </>
        )}

        {typeKey === "supplement" && (
          <>
            <Field label="補卡日期" required hint={`僅能補登最近 ${SUPPLEMENT_DAY_LIMIT} 日內的打卡記錄`}>
              <input
                type="date"
                value={supDate}
                min={supDateRange.min}
                max={supDateRange.max}
                onChange={(e) => setSupDate(e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="補卡時段" required>
              <ChipGroup options={supplementSlots} value={supSlot} onChange={setSupSlot} />
            </Field>
            {(supSlot === SUPPLEMENT_CLOCK_IN || supSlot === SUPPLEMENT_BOTH) && (
              <Field label="上班補卡時間" required>
                <input type="time" value={supInTime} onChange={(e) => setSupInTime(e.target.value)} className={inputCls} />
              </Field>
            )}
            {(supSlot === SUPPLEMENT_CLOCK_OUT || supSlot === SUPPLEMENT_BOTH) && (
              <Field label="下班補卡時間" required>
                <input type="time" value={supOutTime} onChange={(e) => setSupOutTime(e.target.value)} className={inputCls} />
              </Field>
            )}
            <Field label="漏打原因" required>
              <ChipGroup options={supplementReasons} value={supMissReason} onChange={setSupMissReason} />
            </Field>
            <Field label="詳細說明" required>
              <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="請詳細描述漏打原因及當時情境..." className={`${inputCls} h-24 resize-none`} />
            </Field>
            <Field label="見證同事" hint="可填寫當日在場可證明的同事姓名">
              <input value={supWitness} onChange={(e) => setSupWitness(e.target.value)} placeholder="選填" className={inputCls} />
            </Field>
            <Field label="證明附件" hint="如公務行程、外出簽核、系統故障截圖等">
              <AttachmentPicker files={files} setFiles={setFiles} label="上傳證明文件" />
            </Field>
            <div className="bg-primary/5 border border-primary/20 rounded-lg px-3 py-2.5 text-[11px]">
              <p className="font-medium text-primary">補卡規範</p>
              <p className="text-muted-foreground mt-0.5">
                每月補卡以 3 次為限，超過將計入考勤異常。請如實填寫，經直屬主管核准後方可補登。
              </p>
            </div>
          </>
        )}

        {typeKey === "resign" && (
          <>
            <Field label="預計離職日期" required hint="依合約需提前 30 日提出">
              <input type="date" value={resignDate} onChange={(e) => setResignDate(e.target.value)} className={inputCls} />
            </Field>
            <Field label="離職原因" required>
              <ChipGroup options={resignReasons} value={resignReason} onChange={setResignReason} />
            </Field>
            <Field label="工作交接對象" required>
              <select value={resignHandover} onChange={(e) => setResignHandover(e.target.value)} className={inputCls}>
                <option value="">請選擇</option>
                {employees.map((p) => (
                  <option key={p.id} value={String(p.id)}>
                    {p.employeeNo ? `${p.name}（${p.employeeNo}）` : p.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="詳細原因說明" required>
              <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="請詳細說明離職原因..." className={`${inputCls} h-24 resize-none`} />
            </Field>
            <Field label="給公司的建議或回饋">
              <textarea value={resignFeedback} onChange={(e) => setResignFeedback(e.target.value)} placeholder="選填，感謝您的分享" className={`${inputCls} h-20 resize-none`} />
            </Field>
            <Field label="交接文件">
              <AttachmentPicker files={files} setFiles={setFiles} label="上傳交接清單" />
            </Field>
            <div className="bg-warning/10 border border-warning/30 rounded-lg px-3 py-2.5 text-[11px] text-warning-foreground">
              <p className="font-medium text-warning">提示</p>
              <p className="text-muted-foreground mt-0.5">送出後將由直屬主管與人資部門依序審核，通過後由人資協助後續離職手續。</p>
            </div>
          </>
        )}
      </div>

      {/* Submit */}
      <div className="mt-6 flex gap-3">
        <button
          onClick={onBack}
          disabled={submitting}
          className="flex-1 bg-muted text-foreground rounded-xl py-3 text-sm font-medium active:scale-[0.98] transition-transform disabled:opacity-60"
        >
          取消
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="flex-[2] bg-primary text-primary-foreground rounded-xl py-3 text-sm font-medium active:scale-[0.98] transition-transform disabled:opacity-60 flex items-center justify-center gap-1.5"
        >
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {submitting ? "提交中..." : "提交申請"}
        </button>
      </div>
    </div>
  );
};

export default ApplicationForm;
