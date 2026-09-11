import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserPlus, Send, Minus, Plus, Loader2, Copy, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { submitEmployee, inviteEmployee, type EmployeeSavePayload } from "@/api/employee";
import { useOrgOptions } from "@/hooks/useOrgOptions";
import type { DepartmentOption } from "@/api/department";
import type { PositionOption } from "@/api/position";
import { getScheduleOptions, SCHEDULE_TYPE_TEXT, type AttendanceSchedule } from "@/api/attendance";
import { deriveWorkHoursFromSchedule } from "@/lib/workHours";
import { SALARY_TYPE_OPTIONS } from "@/lib/salaryType";
import { getPayrollPlanOptions, getPayrollPlanDetail, type PayrollPlanOption } from "@/api/payroll";
import { getSSLabels } from "@/lib/socialSecurity";

interface AddEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

/** 表單欄位狀態（僅對齊後端 EmployeeSaveDTO 已有欄位） */
interface FormState {
  // 個人資料
  name: string;
  englishName: string;
  alias: string;
  gender: string;        // 1男 2女 3其他
  birthday: string;
  idNumber: string;
  nationality: string;
  maritalStatus: string; // 1未婚 2已婚 3離婚 4喪偶
  phone: string;
  email: string;
  address: string;
  education: string;
  school: string;
  major: string;
  bankName: string;
  bankAccount: string;
  // 緊急聯絡人
  emergencyContactName: string;
  emergencyContactRelation: string;
  emergencyContactPhone: string;
  // 組織與薪資
  departmentId: string;
  department: string;
  positionId: string;
  position: string;
  employmentType: string;
  joinDate: string;
  probationPassDate: string;
  scheduleId: string;
  shiftType: string;
  shiftCode: string;
  salaryType: string;
  baseSalary: string;
  salaryPlanId: string;
  paymentType: string;
  payrollGroup: string;
  storeCategory: string;
  mpfType: string;
  empMpfType: string;
  contributionType: string;
  orsoType: string;
  dailyHours: string;
  weeklyDays: string;
  monthlyHours: string;
  orsoEmpRatio: string;
  orsoEmployerRatio: string;
  employerMpf: string;
  employerOrso: string;
}

const initialForm: FormState = {
  name: "", englishName: "", alias: "", gender: "", birthday: "", idNumber: "", nationality: "",
  maritalStatus: "", phone: "", email: "", address: "", education: "", school: "", major: "",
  bankName: "", bankAccount: "",
  emergencyContactName: "", emergencyContactRelation: "", emergencyContactPhone: "",
  departmentId: "", department: "", positionId: "", position: "", employmentType: "全職", joinDate: "",
  probationPassDate: "", scheduleId: "", shiftType: "", shiftCode: "", salaryType: "MONTHLY", baseSalary: "", salaryPlanId: "", paymentType: "銀行轉帳",
  // 各下拉默认选中首个选项（供款类型/社保/公积金等），减少手动选择
  payrollGroup: "月結A組", storeCategory: "", mpfType: "僱員強制", empMpfType: "標準", contributionType: "標準供款", orsoType: "僱員供款",
  // 香港全職標準工時默認值（選班次後按班次自動覆蓋，可再手改）：每日8時 / 每週5天 / 每月 8×5×52÷12≈173 時
  dailyHours: "8", weeklyDays: "5", monthlyHours: "173",
  // 員工/僱主供款比例不设默认，选薪资方案时以方案供款率回填
  orsoEmpRatio: "", orsoEmployerRatio: "", employerMpf: "", employerOrso: "",
};

export function AddEmployeeDialog({ open, onOpenChange, onSuccess }: AddEmployeeDialogProps) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<"manual" | "invite">("invite");
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  // 邀請發送成功後返回的完整填寫連結（用於 HR 複製發給員工）
  const [inviteLink, setInviteLink] = useState("");

  // 後端尚無對應欄位、僅用於 UI 顯示的計數器（不入庫）
  const [probation, setProbation] = useState(3);
  const [adwOvertime, setAdwOvertime] = useState(0);
  const [bankRatio, setBankRatio] = useState(100);
  const [partTime, setPartTime] = useState(0);
  const [flexibleHours, setFlexibleHours] = useState(0);
  const [overtimeLeave, setOvertimeLeave] = useState(0);

  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    // 輸入後即時清除該欄位的錯誤提示
    setErrors((prev) => {
      if (!prev[key as string]) return prev;
      const next = { ...prev };
      delete next[key as string];
      return next;
    });
  };

  // 部门 + 职位联动选项（职位随所选部门过滤）
  const { departments, positions } = useOrgOptions(form.departmentId ? Number(form.departmentId) : undefined);

  // 打卡班次选项（来自打卡管理，仅启用的班次）
  const [schedules, setSchedules] = useState<AttendanceSchedule[]>([]);
  useEffect(() => {
    getScheduleOptions()
      .then((res) => setSchedules(res.data ?? []))
      .catch(() => setSchedules([]));
  }, []);

  // 薪资方案选项（仅启用）
  const [planOptions, setPlanOptions] = useState<PayrollPlanOption[]>([]);
  useEffect(() => {
    getPayrollPlanOptions()
      .then((res) => setPlanOptions(res.data ?? []))
      .catch(() => setPlanOptions([]));
  }, []);

  /**
   * 选择薪资方案：记录 planId，并以方案退休金供款率兜底回填员工供款比例
   * （员工档案优先——仅回填当前为空的字段，不覆盖 HR 已手填的值）。
   */
  const handleSelectPlan = async (planId: string) => {
    setField("salaryPlanId", planId);
    if (!planId) return;
    try {
      const { data: detail } = await getPayrollPlanDetail(Number(planId));
      if (!detail) return;
      setForm((prev) => ({
        ...prev,
        orsoEmpRatio: prev.orsoEmpRatio.trim() || (detail.retireEmpRate != null ? String(detail.retireEmpRate) : ""),
        orsoEmployerRatio: prev.orsoEmployerRatio.trim() || (detail.retireEmployerRate != null ? String(detail.retireEmployerRate) : ""),
      }));
    } catch {
      /* 拉取方案详情失败时静默，不影响手动填写 */
    }
  };

  // 第二步（組織與薪資）必填欄位（部門/職位/薪資類型/基本薪金/入職日期/班次類型/薪資方案）
  const REQUIRED_ORG: { key: keyof FormState; label: string }[] = [
    { key: "department", label: "部門" },
    { key: "position", label: "職位" },
    { key: "salaryType", label: "薪資類型" },
    { key: "baseSalary", label: "基本薪金" },
    { key: "joinDate", label: "入職日期" },
    { key: "scheduleId", label: "班次類型" },
    { key: "salaryPlanId", label: "薪資方案" },
  ];
  const validateOrg = () => {
    const next: Record<string, string> = {};
    REQUIRED_ORG.forEach(({ key, label }) => {
      if (!String(form[key] ?? "").trim()) next[key as string] = t("請填寫{{label}}", { label: t(label) });
    });
    setErrors(next);
    return Object.keys(next).length === 0;
  };
  // 第一步（個人資料）必填：姓名/身份證號碼/國籍/聯絡電話/電子郵箱/通訊地址/銀行名稱/銀行帳號
  const REQUIRED_STEP1: { key: keyof FormState; label: string }[] = [
    { key: "name", label: "姓名" },
    { key: "idNumber", label: "身份證號碼" },
    { key: "nationality", label: "國籍" },
    { key: "phone", label: "聯絡電話" },
    { key: "email", label: "電子郵箱" },
    { key: "address", label: "通訊地址" },
    { key: "bankName", label: "銀行名稱" },
    { key: "bankAccount", label: "銀行帳號" },
  ];
  const validateStep1 = () => {
    const next: Record<string, string> = {};
    REQUIRED_STEP1.forEach(({ key, label }) => {
      if (!String(form[key] ?? "").trim()) next[key as string] = t("請填寫{{label}}", { label: t(label) });
    });
    // 電子郵箱格式校驗
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      next.email = t("電子郵箱格式不正確");
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };
  const handleNext = () => {
    if (validateStep1()) setStep(2);
  };

  const reset = () => {
    setStep(1); setMode("invite"); setProbation(3); setAdwOvertime(0); setBankRatio(100);
    setPartTime(0); setFlexibleHours(0); setOvertimeLeave(0);
    setForm(initialForm); setErrors({}); setInviteLink("");
  };

  // 邀請模式必填欄位（姓名/郵箱/手機/預定入職日期）
  const REQUIRED_INVITE: { key: keyof FormState; label: string }[] = [
    { key: "name", label: "員工姓名" },
    { key: "email", label: "電子郵箱" },
    { key: "phone", label: "手機號碼" },
    { key: "joinDate", label: "預定入職日期" },
  ];
  const validateInvite = () => {
    const next: Record<string, string> = {};
    REQUIRED_INVITE.forEach(({ key, label }) => {
      if (!String(form[key] ?? "").trim()) next[key as string] = t("請填寫{{label}}", { label: t(label) });
    });
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleInviteSubmit = async () => {
    if (!validateInvite()) {
      return;
    }
    setSubmitting(true);
    try {
      const res = await inviteEmployee({
        name: form.name.trim(),
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        joinDate: form.joinDate.trim() || undefined,
      });
      // 後端返回相對路徑，拼接當前域名得到完整連結
      const link = `${window.location.origin}${res.data.invitePath}`;
      setInviteLink(link);
      toast.success(t("邀請連結已生成，請複製發給員工"));
      onSuccess?.();
    } catch (err: any) {
      toast.error(err.message || t("生成邀請連結失敗"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      toast.success(t("連結已複製到剪貼簿"));
    } catch {
      toast.error(t("複製失敗，請手動選取連結"));
    }
  };

  /** 將表單轉為後端入參，空值不傳 */
  const buildPayload = (): EmployeeSavePayload => {
    const s = (v: string) => (v.trim() ? v.trim() : undefined);
    const n = (v: string) => (v.trim() ? Number(v) : undefined);
    return {
      name: form.name.trim(),
      englishName: s(form.englishName),
      alias: s(form.alias),
      gender: n(form.gender),
      birthday: s(form.birthday),
      idNumber: s(form.idNumber),
      nationality: s(form.nationality),
      maritalStatus: n(form.maritalStatus),
      phone: s(form.phone),
      email: s(form.email),
      address: s(form.address),
      education: s(form.education),
      school: s(form.school),
      major: s(form.major),
      bankName: s(form.bankName),
      bankAccount: s(form.bankAccount),
      emergencyContactName: s(form.emergencyContactName),
      emergencyContactRelation: s(form.emergencyContactRelation),
      emergencyContactPhone: s(form.emergencyContactPhone),
      departmentId: n(form.departmentId),
      department: s(form.department),
      positionId: n(form.positionId),
      position: s(form.position),
      employmentType: s(form.employmentType),
      joinDate: s(form.joinDate),
      probationPassDate: s(form.probationPassDate),
      probation,
      // 班次改为绑定打卡管理的班次：scheduleId 为主，shiftType/shiftCode 冗余存类型文案与班次名，便于旧展示
      scheduleId: n(form.scheduleId),
      shiftType: s(form.shiftType),
      shiftCode: s(form.shiftCode),
      salaryType: s(form.salaryType),
      baseSalary: n(form.baseSalary),
      salaryPlanId: n(form.salaryPlanId),
      paymentType: s(form.paymentType),
      payrollGroup: s(form.payrollGroup),
      storeCategory: s(form.storeCategory),
      mpfType: s(form.mpfType),
      empMpfType: s(form.empMpfType),
      contributionType: s(form.contributionType),
      orsoType: s(form.orsoType),
      adwOvertime,
      partTime,
      flexibleHours,
      overtimeLeave,
      bankRatio,
      dailyHours: n(form.dailyHours),
      weeklyDays: n(form.weeklyDays),
      monthlyHours: n(form.monthlyHours),
      orsoEmpRatio: n(form.orsoEmpRatio),
      orsoEmployerRatio: n(form.orsoEmployerRatio),
      employerMpf: s(form.employerMpf),
      employerOrso: s(form.employerOrso),
      // 狀態由後端統一設為「待HR完善」，前端不傳
    };
  };

  const handleManualSubmit = async () => {
    // 第一步（個人資料）必填校驗未通過則退回第一步並標紅
    if (!validateStep1()) {
      setStep(1);
      return;
    }
    // 第二步（組織與薪資）必填校驗未通過則退回第二步並標紅
    if (!validateOrg()) {
      setStep(2);
      return;
    }
    setSubmitting(true);
    try {
      await submitEmployee(buildPayload());
      toast.success(t("員工資料已新增成功"));
      reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      toast.error(err.message || t("新增失敗"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            {t("新增員工")}
          </DialogTitle>
          <DialogDescription>{t("選擇新增方式：HR 手動填寫或發送連結由員工自行填寫")}</DialogDescription>
        </DialogHeader>

        <Tabs value={mode} onValueChange={(v) => { setMode(v as "manual" | "invite"); setStep(1); }}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual">{t("HR 手動新增")}</TabsTrigger>
            <TabsTrigger value="invite">{t("發送連結邀請員工填寫")}</TabsTrigger>
          </TabsList>

          {/* ===== 邀請模式 ===== */}
          <TabsContent value="invite" className="space-y-6 pt-4">
            {inviteLink ? (
              // 連結已生成：展示可複製的填寫連結
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="text-sm font-medium">{t("邀請連結已生成（有效期 7 天）")}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t("請將以下連結複製發送給員工，員工打開後即可自行填寫個人資料；提交後該員工會進入「待HR完善」狀態。")}
                </p>
                <div className="flex gap-2">
                  <Input readOnly value={inviteLink} onFocus={(e) => e.currentTarget.select()} className="text-xs" />
                  <Button type="button" variant="outline" onClick={handleCopyLink}>
                    <Copy className="h-4 w-4 mr-1" />{t("複製")}
                  </Button>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => { setInviteLink(""); setForm(initialForm); }}>{t("再邀請一位")}</Button>
                  <Button onClick={() => { reset(); onOpenChange(false); }}>{t("完成")}</Button>
                </DialogFooter>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  {t("輸入員工的姓名與聯絡方式，系統將生成個人資料填寫連結；複製發給員工，員工提交後 HR 再補充組織與薪資相關欄位。")}
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <FieldRow label="員工姓名" required error={errors.name}><Input placeholder={t("請輸入姓名")} value={form.name} onChange={(e) => setField("name", e.target.value)} className={errors.name ? "border-destructive" : ""} /></FieldRow>
                  <FieldRow label="電子郵箱" required error={errors.email}><Input type="email" placeholder="name@example.com" value={form.email} onChange={(e) => setField("email", e.target.value)} className={errors.email ? "border-destructive" : ""} /></FieldRow>
                  <FieldRow label="手機號碼" required error={errors.phone}><Input placeholder="09xx-xxx-xxx" value={form.phone} onChange={(e) => setField("phone", e.target.value)} className={errors.phone ? "border-destructive" : ""} /></FieldRow>
                  <FieldRow label="預定入職日期" required error={errors.joinDate}><Input type="date" value={form.joinDate} onChange={(e) => setField("joinDate", e.target.value)} onClick={(e) => e.currentTarget.showPicker?.()} className={errors.joinDate ? "border-destructive" : ""} /></FieldRow>
                </div>
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <p className="text-sm font-medium">{t("員工將自行填寫以下資料：")}</p>
                  <ul className="text-xs text-muted-foreground grid grid-cols-2 gap-1 list-disc list-inside">
                    <li>{t("個人基本資料（姓名、性別、出生日期）")}</li>
                    <li>{t("身份證/護照資訊")}</li>
                    <li>{t("聯絡地址")}</li>
                    <li>{t("緊急聯絡人")}</li>
                    <li>{t("銀行帳戶資訊")}</li>
                    <li>{t("學歷與工作經歷")}</li>
                  </ul>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => { reset(); onOpenChange(false); }}>{t("關閉")}</Button>
                  <Button onClick={handleInviteSubmit} disabled={submitting}>
                    {submitting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
                    {t("生成邀請連結")}
                  </Button>
                </DialogFooter>
              </>
            )}
          </TabsContent>

          {/* ===== 手動模式 ===== */}
          <TabsContent value="manual" className="pt-4">
            {step === 1 && (
              <StepTwoEmployee form={form} setField={setField} errors={errors} />
            )}
            {step === 2 && (
              <StepOneHR
                form={form} setField={setField} errors={errors}
                planOptions={planOptions} onSelectPlan={handleSelectPlan}
                departments={departments} positions={positions} schedules={schedules}
                probation={probation} setProbation={setProbation}
                adwOvertime={adwOvertime} setAdwOvertime={setAdwOvertime}
                bankRatio={bankRatio} setBankRatio={setBankRatio}
                partTime={partTime} setPartTime={setPartTime}
                flexibleHours={flexibleHours} setFlexibleHours={setFlexibleHours}
                overtimeLeave={overtimeLeave} setOvertimeLeave={setOvertimeLeave}
              />
            )}

            <DialogFooter className="mt-6 gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>{t("關閉")}</Button>
              {step === 2 && <Button variant="outline" onClick={() => setStep(1)}>{t("上一步")}</Button>}
              {step === 1 ? (
                <Button onClick={handleNext}>{t("下一步")}</Button>
              ) : (
                <Button onClick={handleManualSubmit} disabled={submitting}>
                  {submitting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
                  {submitting ? t("提交中...") : t("確定")}
                </Button>
              )}
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

type SetField = <K extends keyof FormState>(key: K, value: FormState[K]) => void;

/* ===== Step 1: HR 填寫 - 組織與薪資 ===== */
function StepOneHR({
  form, setField, errors, planOptions, onSelectPlan, departments, positions, schedules, probation, setProbation, adwOvertime, setAdwOvertime, bankRatio, setBankRatio,
  partTime, setPartTime, flexibleHours, setFlexibleHours, overtimeLeave, setOvertimeLeave,
}: {
  form: FormState; setField: SetField; errors: Record<string, string>;
  planOptions: PayrollPlanOption[]; onSelectPlan: (planId: string) => void;
  departments: DepartmentOption[]; positions: PositionOption[]; schedules: AttendanceSchedule[];
  probation: number; setProbation: (n: number) => void;
  adwOvertime: number; setAdwOvertime: (n: number) => void;
  bankRatio: number; setBankRatio: (n: number) => void;
  partTime: number; setPartTime: (n: number) => void;
  flexibleHours: number; setFlexibleHours: (n: number) => void;
  overtimeLeave: number; setOvertimeLeave: (n: number) => void;
}) {
  const { t } = useTranslation();
  // 社保欄位標籤按國籍切換（同一組槽位，標籤隨 nationality 變）
  const ss = getSSLabels(form.nationality);
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-muted-foreground border-b pb-2">{t("第二步：HR 填寫 — 組織與薪資設定")}</h3>
      <div className="grid grid-cols-2 gap-x-8 gap-y-4">
        <FieldRow label="員工別名"><Input value={form.alias} onChange={(e) => setField("alias", e.target.value)} /></FieldRow>
        <FieldRow label="假期分類列表"><SelectField options={["年假A類", "年假B類", "特殊假期"]} /></FieldRow>

        <FieldRow label="部門" required error={errors.department}>
          <SelectField
            raw
            options={departments.map((d) => ({ label: d.name, value: String(d.id) }))}
            value={form.departmentId}
            onValueChange={(v) => {
              setField("departmentId", v);
              setField("department", departments.find((d) => String(d.id) === v)?.name ?? "");
              // 切换部门后清空原职位（职位随部门联动）
              setField("positionId", "");
              setField("position", "");
            }}
            error={!!errors.department}
          />
        </FieldRow>
        <FieldRow label="班次類型" required error={errors.scheduleId}>
          <SelectField
            raw
            options={schedules.map((sc) => ({ label: sc.name, value: String(sc.id) }))}
            value={form.scheduleId}
            error={!!errors.scheduleId}
            onValueChange={(v) => {
              const picked = schedules.find((sc) => String(sc.id) === v);
              setField("scheduleId", v);
              // 冗余存班次名与类型文案，供旧字段/列表展示
              setField("shiftCode", picked?.name ?? "");
              setField("shiftType", picked ? (SCHEDULE_TYPE_TEXT[picked.type] ?? "") : "");
              // 依所选班次时间自动带出工时字段（仍可手改）
              const wh = deriveWorkHoursFromSchedule(picked);
              if (wh.dailyHours) setField("dailyHours", wh.dailyHours);
              if (wh.weeklyDays) setField("weeklyDays", wh.weeklyDays);
              if (wh.monthlyHours) setField("monthlyHours", wh.monthlyHours);
            }}
          />
        </FieldRow>

        <FieldRow label="班次名稱">
          <Input value={form.shiftCode} readOnly placeholder={t("選擇班次後自動帶出")} />
        </FieldRow>
        <FieldRow label="僱用類型">
          <SelectField options={["全職", "兼職", "合約", "實習"]} value={form.employmentType} onValueChange={(v) => setField("employmentType", v)} />
        </FieldRow>

        <FieldRow label="職位" required error={errors.position}>
          <SelectField
            raw
            options={positions.map((p) => ({ label: p.title, value: String(p.id) }))}
            value={form.positionId}
            placeholder={form.departmentId ? "請選擇職位" : "請先選擇部門"}
            onValueChange={(v) => {
              setField("positionId", v);
              setField("position", positions.find((p) => String(p.id) === v)?.title ?? "");
            }}
            error={!!errors.position}
          />
        </FieldRow>
        <FieldRow label="薪資類型" required error={errors.salaryType}>
          <SelectField options={SALARY_TYPE_OPTIONS} value={form.salaryType} onValueChange={(v) => setField("salaryType", v)} error={!!errors.salaryType} />
        </FieldRow>

        <FieldRow label="基本薪金" required error={errors.baseSalary}>
          <Input type="number" value={form.baseSalary} onChange={(e) => setField("baseSalary", e.target.value)} className={errors.baseSalary ? "border-destructive" : ""} />
        </FieldRow>

        <FieldRow label="薪資方案" required error={errors.salaryPlanId}>
          <Select value={form.salaryPlanId} onValueChange={onSelectPlan}>
            <SelectTrigger className={errors.salaryPlanId ? "border-destructive" : ""}><SelectValue placeholder={t("請選擇薪資方案")} /></SelectTrigger>
            <SelectContent>
              {planOptions.map((p) => (
                <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldRow>

        <FieldRow label="試用期">
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => setProbation(Math.max(0, probation - 1))}><Minus className="h-3 w-3" /></Button>
            <Input className="w-16 text-center" value={probation} readOnly />
            <span className="text-sm text-muted-foreground">{t("月")}</span>
            <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => setProbation(probation + 1)}><Plus className="h-3 w-3" /></Button>
          </div>
        </FieldRow>
        <FieldRow label="支付類型">
          <SelectField options={["銀行轉帳", "現金", "支票"]} value={form.paymentType} onValueChange={(v) => setField("paymentType", v)} />
        </FieldRow>

        <FieldRow label="通過試用日期"><Input type="date" value={form.probationPassDate} onChange={(e) => setField("probationPassDate", e.target.value)} onClick={(e) => e.currentTarget.showPicker?.()} /></FieldRow>
        <FieldRow label="工資發放群組"><SelectField options={["月結A組", "月結B組", "半月結"]} value={form.payrollGroup} onValueChange={(v) => setField("payrollGroup", v)} /></FieldRow>

        <FieldRow label="入職日期" required error={errors.joinDate}>
          <Input type="date" value={form.joinDate} onChange={(e) => setField("joinDate", e.target.value)} onClick={(e) => e.currentTarget.showPicker?.()} className={errors.joinDate ? "border-destructive" : ""} />
        </FieldRow>
        <FieldRow label={ss.contributionType}><SelectField options={["標準供款", "自願供款", "豁免"]} value={form.contributionType} onValueChange={(v) => setField("contributionType", v)} /></FieldRow>

        <FieldRow label="每日工作時數"><Input type="number" value={form.dailyHours} onChange={(e) => setField("dailyHours", e.target.value)} /></FieldRow>
        <FieldRow label={ss.mpfType}><SelectField options={["僱員強制", "僱主自願", "行業計劃"]} value={form.mpfType} onValueChange={(v) => setField("mpfType", v)} /></FieldRow>

        <FieldRow label="每週工作日數"><Input type="number" value={form.weeklyDays} onChange={(e) => setField("weeklyDays", e.target.value)} /></FieldRow>
        <FieldRow label={ss.empMpfType}><SelectField options={["標準", "特別"]} value={form.empMpfType} onValueChange={(v) => setField("empMpfType", v)} /></FieldRow>

        <FieldRow label="每月工作数"><Input type="number" value={form.monthlyHours} onChange={(e) => setField("monthlyHours", e.target.value)} /></FieldRow>
        <FieldRow label={ss.orsoType}><SelectField options={["僱員供款", "僱主供款", "雙方供款"]} value={form.orsoType} onValueChange={(v) => setField("orsoType", v)} /></FieldRow>

        <FieldRow label="兼職員工">
          <RadioGroup value={partTime === 1 ? "yes" : "no"} onValueChange={(v) => setPartTime(v === "yes" ? 1 : 0)} className="flex gap-4">
            <div className="flex items-center gap-1.5"><RadioGroupItem value="yes" id="pt-y" /><Label htmlFor="pt-y" className="text-sm">{t("是")}</Label></div>
            <div className="flex items-center gap-1.5"><RadioGroupItem value="no" id="pt-n" /><Label htmlFor="pt-n" className="text-sm">{t("否")}</Label></div>
          </RadioGroup>
        </FieldRow>
        <FieldRow label={ss.orsoEmpRatio}><Input type="number" value={form.orsoEmpRatio} onChange={(e) => setField("orsoEmpRatio", e.target.value)} /></FieldRow>

        <FieldRow label="彈性上班時間">
          <RadioGroup value={flexibleHours === 1 ? "yes" : "no"} onValueChange={(v) => setFlexibleHours(v === "yes" ? 1 : 0)} className="flex gap-4">
            <div className="flex items-center gap-1.5"><RadioGroupItem value="yes" id="flex-y" /><Label htmlFor="flex-y" className="text-sm">{t("是")}</Label></div>
            <div className="flex items-center gap-1.5"><RadioGroupItem value="no" id="flex-n" /><Label htmlFor="flex-n" className="text-sm">{t("否")}</Label></div>
          </RadioGroup>
        </FieldRow>
        <FieldRow label={ss.orsoEmployerRatio}><Input type="number" value={form.orsoEmployerRatio} onChange={(e) => setField("orsoEmployerRatio", e.target.value)} /></FieldRow>

        <FieldRow label="加班換銷假"><Switch checked={overtimeLeave === 1} onCheckedChange={(c) => setOvertimeLeave(c ? 1 : 0)} /></FieldRow>
        <FieldRow label={ss.employerMpf}><Input value={form.employerMpf} onChange={(e) => setField("employerMpf", e.target.value)} /></FieldRow>

        <FieldRow label="適用於每日平均工資(ADW)的加班費">
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => setAdwOvertime(Math.max(0, adwOvertime - 1))}><Minus className="h-3 w-3" /></Button>
            <Input className="w-16 text-center" value={adwOvertime} readOnly />
            <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => setAdwOvertime(adwOvertime + 1)}><Plus className="h-3 w-3" /></Button>
          </div>
        </FieldRow>
        <FieldRow label={ss.employerOrso}><Input value={form.employerOrso} onChange={(e) => setField("employerOrso", e.target.value)} /></FieldRow>

        <FieldRow label="門市分類列表"><SelectField options={["總部", "分店A", "分店B"]} value={form.storeCategory} onValueChange={(v) => setField("storeCategory", v)} /></FieldRow>
        <FieldRow label="銀行戶口比例">
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => setBankRatio(Math.max(0, bankRatio - 5))}><Minus className="h-3 w-3" /></Button>
            <Input className="w-16 text-center" value={bankRatio} readOnly />
            <span className="text-sm text-muted-foreground">%</span>
            <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => setBankRatio(Math.min(100, bankRatio + 5))}><Plus className="h-3 w-3" /></Button>
          </div>
        </FieldRow>
      </div>
    </div>
  );
}

/* ===== Step 2: 員工個人資料 ===== */
const NATIONALITY_OPTIONS = ["香港", "中國", "台灣", "新加坡", "澳洲", "其他"];

/** 個人資料分組小標題 + 兩欄網格 */
function Group({ title, children }: { title: string; children: React.ReactNode }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      <p className="text-xs font-semibold text-primary/80 tracking-wide">{t(title)}</p>
      <div className="grid grid-cols-2 gap-x-8 gap-y-4">{children}</div>
    </div>
  );
}

function StepTwoEmployee({ form, setField, errors }: { form: FormState; setField: SetField; errors: Record<string, string> }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <h3 className="text-sm font-semibold text-muted-foreground border-b pb-2">{t("第一步：員工個人資料")}</h3>

      <Group title="基本資料">
        <FieldRow label="姓名" required error={errors.name}><Input value={form.name} onChange={(e) => setField("name", e.target.value)} className={errors.name ? "border-destructive" : ""} /></FieldRow>
        <FieldRow label="英文姓名"><Input value={form.englishName} onChange={(e) => setField("englishName", e.target.value)} /></FieldRow>
        <FieldRow label="性別">
          <SelectField
            options={[{ label: "男", value: "1" }, { label: "女", value: "2" }, { label: "其他", value: "3" }]}
            value={form.gender} onValueChange={(v) => setField("gender", v)}
          />
        </FieldRow>
        <FieldRow label="出生日期"><Input type="date" value={form.birthday} onChange={(e) => setField("birthday", e.target.value)} onClick={(e) => e.currentTarget.showPicker?.()} /></FieldRow>
        <FieldRow label="身份證號碼" required error={errors.idNumber}><Input value={form.idNumber} onChange={(e) => setField("idNumber", e.target.value)} className={errors.idNumber ? "border-destructive" : ""} /></FieldRow>
        <FieldRow label="國籍" required error={errors.nationality}>
          <SelectField options={NATIONALITY_OPTIONS} value={form.nationality} onValueChange={(v) => setField("nationality", v)} error={!!errors.nationality} />
        </FieldRow>
        <FieldRow label="婚姻狀況">
          <SelectField
            options={[{ label: "未婚", value: "1" }, { label: "已婚", value: "2" }, { label: "離婚", value: "3" }, { label: "喪偶", value: "4" }]}
            value={form.maritalStatus} onValueChange={(v) => setField("maritalStatus", v)}
          />
        </FieldRow>
      </Group>

      <Group title="聯絡資訊">
        <FieldRow label="聯絡電話" required error={errors.phone}><Input value={form.phone} onChange={(e) => setField("phone", e.target.value)} className={errors.phone ? "border-destructive" : ""} /></FieldRow>
        <FieldRow label="電子郵箱" required error={errors.email}><Input type="email" value={form.email} onChange={(e) => setField("email", e.target.value)} className={errors.email ? "border-destructive" : ""} /></FieldRow>
        <FieldRow label="通訊地址" required error={errors.address}><Input value={form.address} onChange={(e) => setField("address", e.target.value)} className={errors.address ? "border-destructive" : ""} /></FieldRow>
      </Group>

      <Group title="緊急聯絡人">
        <FieldRow label="緊急聯絡人姓名"><Input value={form.emergencyContactName} onChange={(e) => setField("emergencyContactName", e.target.value)} /></FieldRow>
        <FieldRow label="緊急聯絡人電話"><Input value={form.emergencyContactPhone} onChange={(e) => setField("emergencyContactPhone", e.target.value)} /></FieldRow>
        <FieldRow label="緊急聯絡人關係"><SelectField options={["配偶", "父母", "兄弟姐妹", "朋友"]} value={form.emergencyContactRelation} onValueChange={(v) => setField("emergencyContactRelation", v)} /></FieldRow>
      </Group>

      <Group title="學歷資訊">
        <FieldRow label="最高學歷">
          <SelectField options={["高中", "大專", "學士", "碩士", "博士"]} value={form.education} onValueChange={(v) => setField("education", v)} />
        </FieldRow>
        <FieldRow label="畢業學校"><Input value={form.school} onChange={(e) => setField("school", e.target.value)} /></FieldRow>
        <FieldRow label="主修科系"><Input value={form.major} onChange={(e) => setField("major", e.target.value)} /></FieldRow>
      </Group>

      <Group title="銀行資訊">
        <FieldRow label="銀行名稱" required error={errors.bankName}><Input value={form.bankName} onChange={(e) => setField("bankName", e.target.value)} className={errors.bankName ? "border-destructive" : ""} /></FieldRow>
        <FieldRow label="銀行帳號" required error={errors.bankAccount}><Input value={form.bankAccount} onChange={(e) => setField("bankAccount", e.target.value)} className={errors.bankAccount ? "border-destructive" : ""} /></FieldRow>
      </Group>
    </div>
  );
}

/* ===== 共用元件 ===== */
function FieldRow({
  label, children, required, error,
}: {
  label: string; children: React.ReactNode; required?: boolean; error?: string;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex items-start gap-3">
      <Label className="w-[160px] text-right text-sm shrink-0 text-muted-foreground pt-2">
        {required && <span className="text-destructive mr-0.5">*</span>}
        {t(label)}
      </Label>
      <div className="flex-1">
        {children}
        {error && <p className="text-xs text-destructive mt-1">{error}</p>}
      </div>
    </div>
  );
}

type Option = string | { label: string; value: string };

function SelectField({
  options, value, onValueChange, placeholder = "請選擇", error, raw,
}: {
  options: Option[];
  value?: string;
  onValueChange?: (v: string) => void;
  placeholder?: string;
  error?: boolean;
  /** raw：選項來自後端數據（部門/職位/班次名），顯示原文不過 i18n；靜態枚舉選項則翻譯顯示 */
  raw?: boolean;
}) {
  const { t } = useTranslation();
  const opts = options.map((o) => (typeof o === "string" ? { label: o, value: o } : o));
  return (
    <Select value={value || undefined} onValueChange={onValueChange}>
      <SelectTrigger className={error ? "border-destructive" : ""}><SelectValue placeholder={t(placeholder)} /></SelectTrigger>
      <SelectContent>
        {opts.map((o) => <SelectItem key={o.value} value={o.value}>{raw ? o.label : t(o.label)}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}
