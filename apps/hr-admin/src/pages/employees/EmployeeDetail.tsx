import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useNavigate } from "react-router-dom";
import { getEmployeeById, updateEmployee, type EmployeeUpdatePayload } from "@/api/employee";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useOrgOptions } from "@/hooks/useOrgOptions";
import { hasPerm } from "@/lib/auth";
import { EMP_PERM } from "@/lib/perms";
import { getScheduleOptions, SCHEDULE_TYPE_TEXT, type AttendanceSchedule } from "@/api/attendance";
import { deriveWorkHoursFromSchedule } from "@/lib/workHours";
import { SALARY_TYPE_OPTIONS } from "@/lib/salaryType";
import { getPayrollPlanOptions, getPayrollPlanDetail, type PayrollPlanOption } from "@/api/payroll";
import { getSSLabels } from "@/lib/socialSecurity";
import {
  ArrowLeft, User, Building2, Wallet, Shield, Clock, GraduationCap,
  Phone, Mail, MapPin, AlertTriangle, Lock, Eye, EyeOff, Landmark,
  Calendar, Briefcase, Edit, Save, X, Check, FileText, ExternalLink,
} from "lucide-react";

const employeesDetail: Record<string, any> = {
  EMP001: {
    id: "EMP001", name: "張小明", englishName: "Ming Zhang", gender: "男",
    birthday: "1990-05-15", idNumber: "A123456789", nationality: "台灣",
    maritalStatus: "已婚", phone: "0912-345-678", email: "ming.zhang@company.com",
    address: "台北市信義區信義路五段7號",
    emergencyName: "張太太", emergencyPhone: "0922-111-222", emergencyRelation: "配偶",
    education: "碩士", school: "台灣大學", major: "資訊工程",
    bankName: "中國信託", bankAccount: "1234-5678-9012-3456",
    department: "技術部", position: "高級工程師",
    joinDate: "2022-03-15", probation: 3, probationPassDate: "2022-06-15",
    employmentType: "全職", partTime: false, flexibleHours: true,
    dailyHours: 8, weeklyDays: 5, monthlyHours: 173,
    salaryType: "MONTHLY", baseSalary: 85000, paymentType: "銀行轉帳",
    payrollGroup: "月結A組", leaveCategory: "年假A類", leaveGroup: "LG-01",
    contributionType: "標準供款", mpfType: "僱員強制", empMpfType: "標準",
    orsoType: "雙方供款", orsoEmpRatio: 5, orsoEmployerRatio: 5,
    employerMpf: "3,000", employerOrso: "4,250",
    overtimeLeave: false, adwOvertime: 1, storeCategory: "總部", bankRatio: 100,
    status: "在職",
  },
  EMP002: {
    id: "EMP002", name: "李文華", englishName: "Wenhua Li", gender: "男",
    birthday: "1988-11-20", idNumber: "B987654321", nationality: "台灣",
    maritalStatus: "未婚", phone: "0923-456-789", email: "wenhua.li@company.com",
    address: "台北市大安區敦化南路一段100號",
    emergencyName: "李先生", emergencyPhone: "0933-222-333", emergencyRelation: "父母",
    education: "學士", school: "政治大學", major: "企業管理",
    bankName: "台北富邦", bankAccount: "9876-5432-1098-7654",
    department: "銷售部", position: "銷售經理",
    joinDate: "2021-07-01", probation: 3, probationPassDate: "2021-10-01",
    employmentType: "全職", partTime: false, flexibleHours: false,
    dailyHours: 8, weeklyDays: 5, monthlyHours: 173,
    salaryType: "MONTHLY", baseSalary: 72000, paymentType: "銀行轉帳",
    payrollGroup: "月結A組", leaveCategory: "年假A類", leaveGroup: "LG-01",
    contributionType: "標準供款", mpfType: "僱員強制", empMpfType: "標準",
    orsoType: "僱主供款", orsoEmpRatio: 0, orsoEmployerRatio: 5,
    employerMpf: "2,500", employerOrso: "3,600",
    overtimeLeave: true, adwOvertime: 0, storeCategory: "總部", bankRatio: 100,
    status: "在職",
  },
};

const defaultEmployee: any = {
  id: "—", name: "未知", englishName: "", gender: "—", birthday: "—", idNumber: "—",
  nationality: "—", maritalStatus: "—", phone: "—", email: "—", address: "—",
  emergencyName: "—", emergencyPhone: "—", emergencyRelation: "—",
  education: "—", school: "—", major: "—", bankName: "—", bankAccount: "—",
  department: "—", position: "—", joinDate: "—", probation: 0,
  probationPassDate: "—", employmentType: "—", partTime: false, flexibleHours: false,
  dailyHours: 0, weeklyDays: 0, monthlyHours: 0,
  salaryType: "—", baseSalary: 0, paymentType: "—", payrollGroup: "—",
  leaveCategory: "—", leaveGroup: "—", contributionType: "—", mpfType: "—",
  empMpfType: "—", orsoType: "—", orsoEmpRatio: 0, orsoEmployerRatio: 0,
  employerMpf: "—", employerOrso: "—", overtimeLeave: false, adwOvertime: 0,
  storeCategory: "—", bankRatio: 100, status: "在職",
};

/*
 * 權限模型：職位即權限單元。頁簽可見（個人資料 / 組織與工作 / 薪資福利）與「編輯」按鈕，
 * 由職位分配的權限碼（hr_menu.perms）決定；能看到頁簽即對該頁簽有完整讀寫。權限碼於登入時
 * 隨 EmployeeLoginVO.perms 返回並緩存，經 hasPerm() 判定；未提供權限集合（舊 session / 未接
 * 權限後端）時 hasPerm 一律放行，保證功能不被鎖死。權限碼集中定義於 @/lib/perms。
 * 註：欄位級（逐欄編輯 / 敏感脫敏）暫不細分，如日後需要再於 EMP_PERM 擴充。
 */

// Select options map。值即显示的用 string[]；需 code/label 分离的用 {label,value}[]（如薪资类型存英文码）
type SelectOpt = string | { label: string; value: string };
const SELECT_OPTIONS: Record<string, SelectOpt[]> = {
  gender: ["男", "女", "其他"],
  maritalStatus: ["未婚", "已婚", "離婚", "喪偶"],
  emergencyRelation: ["配偶", "父母", "兄弟姐妹", "子女", "朋友", "其他"],
  education: ["高中/職", "大專", "學士", "碩士", "博士"],
  employmentType: ["全職", "兼職", "合約", "實習"],
  shiftType: ["固定班", "輪班", "彈性班"],
  shiftCode: ["A班", "B班", "C班"],
  salaryType: SALARY_TYPE_OPTIONS,
  paymentType: ["銀行轉帳", "現金", "支票"],
  payrollGroup: ["月結A組", "月結B組", "半月結"],
  leaveCategory: ["年假A類", "年假B類", "特殊假期"],
  contributionType: ["標準供款", "自願供款", "豁免"],
  mpfType: ["僱員強制", "僱主自願", "行業計劃"],
  empMpfType: ["標準", "特別"],
  orsoType: ["僱員供款", "僱主供款", "雙方供款"],
  storeCategory: ["總部", "分店A", "分店B"],
  status: ["在職", "休假中", "離職"],
};

/* ===== 編輯保存：文案→碼、欄位名映射、類型轉換 ===== */
const TEXT_TO_GENDER: Record<string, number> = { "男": 1, "女": 2, "其他": 3 };
const TEXT_TO_MARITAL: Record<string, number> = { "未婚": 1, "已婚": 2, "離婚": 3, "喪偶": 4 };
const TEXT_TO_STATUS: Record<string, number> = {
  "已邀請待填": 0, "待HR完善": 1, "待入職": 2, "在職": 3, "休假中": 4, "待離職": 5, "已離職": 6, "離職": 6,
};

// 頁面欄位鍵 → 後端 EmployeeUpdateDTO 欄位鍵（名稱不同的才列）
const FIELD_KEY_MAP: Record<string, string> = {
  emergencyName: "emergencyContactName",
  emergencyRelation: "emergencyContactRelation",
  emergencyPhone: "emergencyContactPhone",
};

// Switch（布林）欄位 → 0/1
const BOOL_KEYS = new Set(["partTime", "flexibleHours", "overtimeLeave"]);
// 數值欄位 → number
const NUMERIC_KEYS = new Set([
  "probation", "dailyHours", "weeklyDays", "monthlyHours", "baseSalary",
  "adwOvertime", "bankRatio", "orsoEmpRatio", "orsoEmployerRatio",
  "departmentId", "positionId", "scheduleId", "salaryPlanId",
]);
// 後端 EmployeeUpdateDTO 支援的欄位白名單（不在其中的頁面欄位不提交，如已下線的 leaveGroup）
const UPDATE_ALLOWED = new Set<string>([
  "name", "englishName", "gender", "birthday", "idNumber", "nationality", "maritalStatus",
  "phone", "email", "address", "emergencyContactName", "emergencyContactRelation", "emergencyContactPhone",
  "education", "school", "major", "departmentId", "department", "positionId", "position", "employmentType", "storeCategory",
  "joinDate", "probation", "probationPassDate", "scheduleId", "shiftType", "shiftCode", "dailyHours", "weeklyDays",
  "monthlyHours", "partTime", "flexibleHours", "overtimeLeave", "leaveCategory", "salaryType",
  "baseSalary", "paymentType", "payrollGroup", "adwOvertime", "bankName", "bankAccount",
  "bankAccountHolder", "bankRatio", "contributionType", "mpfType", "empMpfType", "employerMpf",
  "orsoType", "orsoEmpRatio", "orsoEmployerRatio", "employerOrso", "status", "salaryPlanId",
]);

/** 把詳情頁的 formData（已變更欄位）轉成後端編輯入參 */
function buildUpdatePayload(idNum: number, formData: Record<string, any>): EmployeeUpdatePayload {
  const payload: EmployeeUpdatePayload = { id: idNum };
  for (const [pageKey, raw] of Object.entries(formData)) {
    const key = FIELD_KEY_MAP[pageKey] ?? pageKey;
    if (!UPDATE_ALLOWED.has(key)) continue;
    let val: any = raw;
    if (pageKey === "gender") val = TEXT_TO_GENDER[raw];
    else if (pageKey === "maritalStatus") val = TEXT_TO_MARITAL[raw];
    else if (pageKey === "status") val = TEXT_TO_STATUS[raw];
    else if (BOOL_KEYS.has(pageKey)) val = raw ? 1 : 0;
    else if (NUMERIC_KEYS.has(pageKey)) val = raw === "" || raw == null ? undefined : Number(raw);
    if (val !== undefined && val !== null && !(typeof val === "number" && Number.isNaN(val))) {
      (payload as any)[key] = val;
    }
  }
  return payload;
}

/* ===== Primitives ===== */

function EditableField({ label, fieldKey, value, editing, editable, formData, onChange, type, colSpan }: {
  label: string; fieldKey: string; value: string | number | boolean;
  editing: boolean; editable: boolean;
  formData: Record<string, any>; onChange: (key: string, val: any) => void;
  type?: "text" | "number" | "date" | "select" | "boolean";
  colSpan?: number;
}) {
  const { t } = useTranslation();
  const isEditing = editing && editable;
  const rawOpts = SELECT_OPTIONS[fieldKey];
  const selectOpts = rawOpts?.map((o) => (typeof o === "string" ? { label: o, value: o } : o));
  const optLabel = (v: string) => selectOpts?.find((o) => o.value === v)?.label ?? v;
  const display = typeof value === "boolean"
    ? (value ? t("是") : t("否"))
    : (selectOpts && value ? t(optLabel(String(value))) : String(value || "—"));
  const inferredType = type || (selectOpts ? "select" : typeof value === "boolean" ? "boolean" : typeof value === "number" ? "number" : "text");

  return (
    <div className={`min-w-0 ${colSpan ? `col-span-${colSpan}` : ""}`}>
      <div className="flex items-center gap-1 mb-0.5">
        <p className="text-xs text-muted-foreground truncate">{label}</p>
        {editing && !editable && fieldKey !== "id" && (
          <Lock className="h-2.5 w-2.5 text-muted-foreground/50" />
        )}
      </div>
      {isEditing ? (
        inferredType === "select" && selectOpts ? (
          <Select value={String(formData[fieldKey] ?? value)} onValueChange={(v) => onChange(fieldKey, v)}>
            <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {selectOpts.map((o) => <SelectItem key={o.value} value={o.value}>{t(o.label)}</SelectItem>)}
            </SelectContent>
          </Select>
        ) : inferredType === "boolean" ? (
          <Switch
            checked={formData[fieldKey] !== undefined ? !!formData[fieldKey] : !!value}
            onCheckedChange={(v) => onChange(fieldKey, v)}
          />
        ) : (
          <Input
            className="h-8 text-sm"
            type={inferredType}
            value={formData[fieldKey] ?? value}
            onChange={(e) => onChange(fieldKey, inferredType === "number" ? Number(e.target.value) : e.target.value)}
          />
        )
      ) : (
        <p className="text-sm font-medium truncate">{display}</p>
      )}
    </div>
  );
}

function SecureField({ label, value, fieldKey, canView, editable, editing, formData, onChange }: {
  label: string; value: string | number; fieldKey: string; canView: boolean; editable: boolean;
  editing: boolean; formData: Record<string, any>; onChange: (key: string, val: any) => void;
}) {
  const { t } = useTranslation();
  const [show, setShow] = useState(false);
  if (!canView) {
    return (
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Lock className="h-3 w-3" />{t("需要權限")}
        </span>
      </div>
    );
  }
  if (editing && editable) {
    return (
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        <Input
          className="h-8 text-sm"
          value={formData[fieldKey] ?? value}
          onChange={(e) => onChange(fieldKey, e.target.value)}
        />
      </div>
    );
  }
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <div className="flex items-center gap-1.5">
        <p className="text-sm font-medium">{show ? String(value) : "••••••••"}</p>
        <button onClick={() => setShow(!show)} className="text-muted-foreground hover:text-foreground transition-colors">
          {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        </button>
      </div>
    </div>
  );
}

function Section({ icon: Icon, title, children, locked, editing, sectionEditable }: {
  icon: any; title: string; children: React.ReactNode; locked?: boolean;
  editing?: boolean; sectionEditable?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center">
          <Icon className="h-3.5 w-3.5 text-primary" />
        </div>
        <h3 className="text-sm font-semibold tracking-wide">{title}</h3>
        {locked && <Lock className="h-3 w-3 text-muted-foreground" />}
        {editing && sectionEditable && (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-primary/20">{t("可編輯")}</Badge>
        )}
        {editing && !sectionEditable && (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{t("僅限查看")}</Badge>
        )}
      </div>
      {children}
    </div>
  );
}

function FieldGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-4">{children}</div>;
}

/** 部门 + 职位：动态级联选择（编辑态两个联动下拉；只读态显示名称）。占两个 FieldGrid 格子。 */
function DeptPositionEditable({ editing, editable, emp, formData, onChange }: {
  editing: boolean; editable: boolean; emp: Record<string, any>;
  formData: Record<string, any>; onChange: (key: string, val: any) => void;
}) {
  const { t } = useTranslation();
  const isEditing = editing && editable;
  const deptId: string = String(formData.departmentId ?? emp.departmentId ?? "");
  const posId: string = String(formData.positionId ?? emp.positionId ?? "");
  const { departments, positions } = useOrgOptions(deptId ? Number(deptId) : undefined);

  const Cell = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="min-w-0">
      <div className="flex items-center gap-1 mb-0.5">
        <p className="text-xs text-muted-foreground truncate">{label}</p>
        {editing && !editable && <Lock className="h-2.5 w-2.5 text-muted-foreground/50" />}
      </div>
      {children}
    </div>
  );

  if (!isEditing) {
    return (
      <>
        <Cell label={t("部門")}><p className="text-sm font-medium truncate">{emp.department || "—"}</p></Cell>
        <Cell label={t("職位")}><p className="text-sm font-medium truncate">{emp.position || "—"}</p></Cell>
      </>
    );
  }
  return (
    <>
      <Cell label={t("部門")}>
        <Select
          value={deptId || undefined}
          onValueChange={(v) => {
            onChange("departmentId", v);
            onChange("department", departments.find((d) => String(d.id) === v)?.name ?? "");
            onChange("positionId", "");
            onChange("position", "");
          }}
        >
          <SelectTrigger className="h-8 text-sm"><SelectValue placeholder={t("請選擇部門")} /></SelectTrigger>
          <SelectContent>
            {departments.map((d) => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </Cell>
      <Cell label={t("職位")}>
        <Select
          value={posId || undefined}
          onValueChange={(v) => {
            onChange("positionId", v);
            onChange("position", positions.find((p) => String(p.id) === v)?.title ?? "");
          }}
        >
          <SelectTrigger className="h-8 text-sm"><SelectValue placeholder={deptId ? t("請選擇職位") : t("請先選擇部門")} /></SelectTrigger>
          <SelectContent>
            {positions.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.title}</SelectItem>)}
          </SelectContent>
        </Select>
      </Cell>
    </>
  );
}

/** 班次：编辑态「班次類型」为打卡管理班次下拉（绑定 scheduleId），「班次名稱」只读回显。占两个 FieldGrid 格子。 */
function ScheduleEditable({ editing, editable, emp, formData, onChange }: {
  editing: boolean; editable: boolean; emp: Record<string, any>;
  formData: Record<string, any>; onChange: (key: string, val: any) => void;
}) {
  const { t } = useTranslation();
  const isEditing = editing && editable;
  const rawScheduleId: string = String(formData.scheduleId ?? emp.scheduleId ?? "");

  const [schedules, setSchedules] = useState<AttendanceSchedule[]>([]);
  useEffect(() => {
    getScheduleOptions().then((res) => setSchedules(res.data ?? [])).catch(() => setSchedules([]));
  }, []);

  // scheduleId 兜底：历史数据可能只存了冗余的 shiftCode（班次名称）而没有 scheduleId，
  // 此时按名称从班次表反查出 id，保证编辑态下拉能正确回显选中项。
  const fallbackName: string = String(formData.shiftCode ?? emp.shiftCode ?? "");
  const scheduleId: string = rawScheduleId
    || (fallbackName ? String(schedules.find((s) => s.name === fallbackName)?.id ?? "") : "");

  // 以绑定的 scheduleId 为准，从班次表取当前班次；取不到再回退冗余字段
  const current = schedules.find((s) => String(s.id) === scheduleId);
  const shiftType: string = current ? (SCHEDULE_TYPE_TEXT[current.type] ?? "—")
    : (String(formData.shiftType ?? emp.shiftType ?? "") || "—");
  const shiftCode: string = current ? current.name
    : (String(formData.shiftCode ?? emp.shiftCode ?? "") || "—");

  const Cell = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="min-w-0">
      <div className="flex items-center gap-1 mb-0.5">
        <p className="text-xs text-muted-foreground truncate">{label}</p>
        {editing && !editable && <Lock className="h-2.5 w-2.5 text-muted-foreground/50" />}
      </div>
      {children}
    </div>
  );

  if (!isEditing) {
    return (
      <>
        <Cell label={t("班次類型")}><p className="text-sm font-medium truncate">{t(shiftType)}</p></Cell>
        <Cell label={t("班次名稱")}><p className="text-sm font-medium truncate">{shiftCode}</p></Cell>
      </>
    );
  }
  return (
    <>
      <Cell label={t("班次類型")}>
        <Select
          value={scheduleId || undefined}
          onValueChange={(v) => {
            const picked = schedules.find((s) => String(s.id) === v);
            onChange("scheduleId", v);
            onChange("shiftCode", picked?.name ?? "");
            onChange("shiftType", picked ? (SCHEDULE_TYPE_TEXT[picked.type] ?? "") : "");
            // 依所选班次时间自动带出工时字段（仍可手改）
            const wh = deriveWorkHoursFromSchedule(picked);
            if (wh.dailyHours) onChange("dailyHours", Number(wh.dailyHours));
            if (wh.weeklyDays) onChange("weeklyDays", Number(wh.weeklyDays));
            if (wh.monthlyHours) onChange("monthlyHours", Number(wh.monthlyHours));
          }}
        >
          <SelectTrigger className="h-8 text-sm"><SelectValue placeholder={t("請選擇班次")} /></SelectTrigger>
          <SelectContent>
            {schedules.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </Cell>
      <Cell label={t("班次名稱")}>
        <p className="text-sm font-medium truncate h-8 flex items-center">{shiftCode}</p>
      </Cell>
    </>
  );
}

/** 薪資方案（可編輯）：選方案時以方案退休金供款率兜底回填 ORSO 比例（僅填當前為空者，員工優先）。 */
function SalaryPlanEditable({ editing, editable, emp, formData, onChange }: {
  editing: boolean; editable: boolean; emp: Record<string, any>;
  formData: Record<string, any>; onChange: (key: string, val: any) => void;
}) {
  const { t } = useTranslation();
  const isEditing = editing && editable;
  const planId: string = String(formData.salaryPlanId ?? emp.salaryPlanId ?? "");

  const [plans, setPlans] = useState<PayrollPlanOption[]>([]);
  useEffect(() => {
    getPayrollPlanOptions().then((res) => setPlans(res.data ?? [])).catch(() => setPlans([]));
  }, []);

  const currentName = plans.find((p) => String(p.id) === planId)?.name ?? (planId ? `#${planId}` : "—");

  const handlePick = async (v: string) => {
    onChange("salaryPlanId", v);
    if (!v) return;
    try {
      const { data: detail } = await getPayrollPlanDetail(Number(v));
      if (!detail) return;
      // 換方案即以方案的公積金供款比例覆蓋兩個比例欄位（方案為準，直接刷新）
      if (detail.retireEmpRate != null) onChange("orsoEmpRatio", String(detail.retireEmpRate));
      if (detail.retireEmployerRate != null) onChange("orsoEmployerRatio", String(detail.retireEmployerRate));
    } catch {
      /* 靜默 */
    }
  };

  return (
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground truncate mb-0.5">{t("薪資方案")}</p>
      {isEditing ? (
        <Select value={planId || undefined} onValueChange={handlePick}>
          <SelectTrigger className="h-8 text-sm"><SelectValue placeholder={t("請選擇薪資方案")} /></SelectTrigger>
          <SelectContent>
            {plans.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
      ) : (
        <p className="text-sm font-medium truncate">{currentName}</p>
      )}
    </div>
  );
}

/* ===== Page ===== */
export default function EmployeeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  // 職位頁簽權限碼（登入緩存）。未提供時 hasPerm 放行全部，功能不被鎖死。
  const canViewPersonal = hasPerm(EMP_PERM.TAB_PERSONAL);
  const canViewOrg = hasPerm(EMP_PERM.TAB_ORG);
  const canViewSalary = hasPerm(EMP_PERM.TAB_SALARY);
  const canEdit = hasPerm(EMP_PERM.EDIT);
  const [activeSection, setActiveSection] = useState("personal");
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [emp, setEmp] = useState<Record<string, any>>({ ...defaultEmployee, id });
  const [loading, setLoading] = useState(false);

  // 載入後端員工詳情，回顯實體值（找不到對應後端資料時回退到本地預設）
  useEffect(() => {
    const numId = Number(id);
    if (!id || Number.isNaN(numId)) {
      setEmp(employeesDetail[id || ""] || { ...defaultEmployee, id, name: id });
      return;
    }
    setLoading(true);
    getEmployeeById(numId)
      .then((res) => {
        if (res.data) {
          const d = res.data;
          // 後端緊急聯絡人欄位（emergencyContactXxx）映射到頁面使用的鍵（emergencyXxx）
          const mapped = {
            emergencyName: d.emergencyContactName,
            emergencyRelation: d.emergencyContactRelation,
            emergencyPhone: d.emergencyContactPhone,
          };
          // 後端未返回的欄位用預設補齊，避免顯示 undefined；空值不覆蓋預設
          const clean = Object.fromEntries(
            Object.entries(mapped).filter(([, v]) => v != null && v !== ""),
          );
          setEmp({ ...defaultEmployee, ...d, ...clean });
        } else {
          setEmp({ ...defaultEmployee, id, name: t("查無此員工") });
        }
      })
      .catch(() => {
        toast.error(t("載入員工詳情失敗"));
        setEmp({ ...defaultEmployee, id });
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleChange = (key: string, val: any) => {
    setFormData((prev) => ({ ...prev, [key]: val }));
  };

  const handleSave = async () => {
    const changedKeys = Object.keys(formData);
    if (changedKeys.length === 0) {
      setEditing(false);
      return;
    }
    // 编辑不做必填校验（仅新增员工时校验）
    const numId = Number(id);
    // 本地 mock 資料（無後端數字 id）：僅前端更新，不調接口
    if (!id || Number.isNaN(numId)) {
      setEmp((prev) => ({ ...prev, ...formData }));
      toast.success(t("已成功更新 {{n}} 個欄位", { n: changedKeys.length }));
      setFormData({});
      setEditing(false);
      return;
    }
    try {
      await updateEmployee(buildUpdatePayload(numId, formData));
      // 後端成功後同步本地顯示（formData 用的是頁面鍵/文案，與展示一致）
      setEmp((prev) => ({ ...prev, ...formData }));
      toast.success(t("已成功更新 {{n}} 個欄位", { n: changedKeys.length }));
      setFormData({});
      setEditing(false);
    } catch (err: any) {
      toast.error(err.message || t("更新失敗"));
    }
  };

  const handleCancel = () => {
    setFormData({});
    setEditing(false);
  };

  const statusMap: Record<string, { color: string; dot: string }> = {
    "在職": { color: "bg-success/10 text-success border-success/20", dot: "bg-success" },
    "休假中": { color: "bg-warning/10 text-warning border-warning/20", dot: "bg-warning" },
    "離職": { color: "bg-destructive/10 text-destructive border-destructive/20", dot: "bg-destructive" },
  };

  const tenure = emp.joinDate && emp.joinDate !== "—"
    ? t("{{y}} 年 {{m}} 個月", {
        y: Math.floor((Date.now() - new Date(emp.joinDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)),
        m: Math.floor(((Date.now() - new Date(emp.joinDate).getTime()) / (30.44 * 24 * 60 * 60 * 1000)) % 12),
      })
    : "—";

  // 頁簽按職位權限過濾；當前頁簽若不可見則回退到第一個可見頁簽
  const sections = [
    { id: "personal", label: "個人資料", icon: User, visible: canViewPersonal },
    { id: "organization", label: "組織與工作", icon: Building2, visible: canViewOrg },
    { id: "salary", label: "薪資福利", icon: Wallet, visible: canViewSalary },
  ].filter((s) => s.visible);

  useEffect(() => {
    if (sections.length > 0 && !sections.some((s) => s.id === activeSection)) {
      setActiveSection(sections[0].id);
    }
  }, [sections, activeSection]);

  // Helper for field props（僅頁簽級控制：能看到頁簽即可編輯該頁簽所有欄位）
  const fp = (fieldKey: string, label: string, opts?: { type?: "text" | "number" | "date" | "select" | "boolean"; colSpan?: number }) => ({
    label, fieldKey, value: emp[fieldKey], editing, editable: true,
    formData, onChange: handleChange, ...opts,
  });

  // 社保欄位標籤按國籍切換（同一組槽位，標籤/標題隨 nationality 變）
  const ss = getSSLabels(String(formData.nationality ?? emp.nationality ?? ""));

  return (
    <div className="space-y-0">
      {/* ===== Profile Header ===== */}
      <div className="rounded-xl bg-card border p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-5">
            <Button variant="ghost" size="icon" className="shrink-0 -ml-2" onClick={() => navigate("/employees")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Avatar className="h-16 w-16 text-lg">
              <AvatarFallback className="bg-primary/10 text-primary font-bold">
                {emp.name?.slice(-2)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-xl font-bold tracking-tight">{emp.name}</h1>
                <span className="text-sm text-muted-foreground">{emp.englishName}</span>
                <Badge variant="secondary" className={statusMap[emp.status]?.color || ""}>
                  <span className={`inline-block h-1.5 w-1.5 rounded-full mr-1.5 ${statusMap[emp.status]?.dot || ""}`} />
                  {emp.status ? t(emp.status) : "—"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{emp.department} · {emp.position}</p>
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" />{emp.id}</span>
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{t("入職 {{date}}", { date: emp.joinDate })}</span>
                <span>{t("在職 {{tenure}}", { tenure })}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {editing ? (
              <>
                <Button variant="outline" size="sm" onClick={handleCancel}>
                  <X className="h-3.5 w-3.5 mr-1.5" />{t("取消")}
                </Button>
                <Button size="sm" onClick={handleSave}>
                  <Check className="h-3.5 w-3.5 mr-1.5" />{t("儲存")}
                </Button>
              </>
            ) : canEdit ? (
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                <Edit className="h-3.5 w-3.5 mr-1.5" />{t("編輯")}
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Editing hint */}
      {editing && (
        <div className="rounded-lg bg-primary/5 border border-primary/15 px-4 py-2.5 mb-6 flex items-center gap-2 text-sm">
          <Edit className="h-4 w-4 text-primary shrink-0" />
          <span className="text-muted-foreground">
            {t("編輯模式 — 標示")}
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 mx-1 bg-primary/10 text-primary border-primary/20">{t("可編輯")}</Badge>
            {t("的區塊可進行修改，帶")} <Lock className="h-3 w-3 inline" /> {t("的欄位需要更高權限")}
          </span>
        </div>
      )}

      {/* ===== Nav + Content ===== */}
      <div className="flex gap-6">
        <nav className="w-44 shrink-0 space-y-1 sticky top-6 self-start">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                activeSection === s.id
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              }`}
            >
              <s.icon className="h-4 w-4" />
              {t(s.label)}
            </button>
          ))}
        </nav>

        <div className="flex-1 min-w-0">
          {activeSection === "personal" && (
            <div className="space-y-8">
              <Section icon={User} title={t("基本資料")} editing={editing} sectionEditable={true}>
                <FieldGrid>
                  <EditableField {...fp("name", t("姓名"))} />
                  <EditableField {...fp("englishName", t("英文姓名"))} />
                  <EditableField {...fp("gender", t("性別"))} />
                  <EditableField {...fp("birthday", t("出生日期"), { type: "date" })} />
                  <SecureField label={t("身份證號碼")} value={emp.idNumber} fieldKey="idNumber" canView={true} editable={true} editing={editing} formData={formData} onChange={handleChange} />
                  <EditableField {...fp("nationality", t("國籍"))} />
                  <EditableField {...fp("maritalStatus", t("婚姻狀況"))} />
                  <div className="col-span-2 space-y-1.5">
                    <p className="text-xs text-muted-foreground">{t("身份證明文件")}</p>
                    {emp.idCardUrl ? (
                      <a
                        href={emp.idCardUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm hover:border-primary hover:text-primary transition-colors max-w-sm group"
                      >
                        <FileText className="h-4 w-4 text-primary shrink-0" />
                        <span className="flex-1 truncate">{t("查看證件影本")}</span>
                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary shrink-0" />
                      </a>
                    ) : (
                      <p className="text-sm text-muted-foreground">{t("員工尚未上傳")}</p>
                    )}
                  </div>
                </FieldGrid>
              </Section>

              <Separator />

              <Section icon={Phone} title={t("聯絡資訊")} editing={editing} sectionEditable={true}>
                <FieldGrid>
                  <EditableField {...fp("phone", t("聯絡電話"))} />
                  <EditableField {...fp("email", t("電子郵箱"))} />
                  <div className="col-span-2">
                    <EditableField {...fp("address", t("通訊地址"))} />
                  </div>
                </FieldGrid>
              </Section>

              <Separator />

              <Section icon={AlertTriangle} title={t("緊急聯絡人")} editing={editing} sectionEditable={true}>
                <FieldGrid>
                  <EditableField {...fp("emergencyName", t("姓名"))} />
                  <EditableField {...fp("emergencyRelation", t("關係"))} />
                  <EditableField {...fp("emergencyPhone", t("聯絡電話"))} />
                </FieldGrid>
              </Section>

              <Separator />

              <Section icon={GraduationCap} title={t("學歷資訊")} editing={editing} sectionEditable={true}>
                <FieldGrid>
                  <EditableField {...fp("education", t("最高學歷"))} />
                  <EditableField {...fp("school", t("畢業學校"))} />
                  <EditableField {...fp("major", t("主修科系"))} />
                </FieldGrid>
              </Section>
            </div>
          )}

          {activeSection === "organization" && (
            <div className="space-y-8">
              <Section icon={Building2} title={t("職位資訊")} editing={editing} sectionEditable={true}>
                <FieldGrid>
                  <DeptPositionEditable editing={editing} editable={true} emp={emp} formData={formData} onChange={handleChange} />
                  <EditableField {...fp("employmentType", t("僱用類型"))} />
                  <EditableField {...fp("storeCategory", t("門市分類"))} />
                </FieldGrid>
              </Section>

              <Separator />

              <Section icon={Clock} title={t("工作安排")} editing={editing} sectionEditable={true}>
                <FieldGrid>
                  <EditableField {...fp("joinDate", t("入職日期"), { type: "date" })} />
                  <EditableField {...fp("probation", t("試用期（月）"), { type: "number" })} />
                  <EditableField {...fp("probationPassDate", t("通過試用日期"), { type: "date" })} />
                  <ScheduleEditable editing={editing} editable={true} emp={emp} formData={formData} onChange={handleChange} />
                  <EditableField {...fp("dailyHours", t("每日工作時數"), { type: "number" })} />
                  <EditableField {...fp("weeklyDays", t("每週工作日數"), { type: "number" })} />
                  <EditableField {...fp("monthlyHours", t("每月工作数"), { type: "number" })} />
                </FieldGrid>
              </Section>

              <Separator />

              <Section icon={Calendar} title={t("出勤與假期")} editing={editing} sectionEditable={true}>
                <FieldGrid>
                  <EditableField {...fp("partTime", t("兼職員工"), { type: "boolean" })} />
                  <EditableField {...fp("flexibleHours", t("彈性上班"), { type: "boolean" })} />
                  <EditableField {...fp("overtimeLeave", t("加班換銷假"), { type: "boolean" })} />
                  <EditableField {...fp("leaveCategory", t("假期分類"))} />
                  <EditableField {...fp("leaveGroup", t("假期群組"))} />
                </FieldGrid>
              </Section>
            </div>
          )}

          {activeSection === "salary" && (
            <>
              {!canViewSalary ? (
                <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
                  <div className="h-16 w-16 rounded-full bg-muted/60 flex items-center justify-center mb-4">
                    <Lock className="h-7 w-7" />
                  </div>
                  <p className="font-medium text-base">{t("無權限查看")}</p>
                  <p className="text-sm mt-1">{t("薪資與福利資訊需具備對應職位權限方可查看")}</p>
                </div>
              ) : (
                <div className="space-y-8">
                  <Section icon={Wallet} title={t("薪資設定")} editing={editing} sectionEditable={true}>
                    <FieldGrid>
                      <EditableField {...fp("salaryType", t("薪資類型"))} />
                      <EditableField {...fp("baseSalary", t("基本薪金"), { type: "number" })} />
                      <EditableField {...fp("paymentType", t("支付類型"))} />
                      <EditableField {...fp("payrollGroup", t("工資發放群組"))} />
                      <SalaryPlanEditable editing={editing} editable={true} emp={emp} formData={formData} onChange={handleChange} />
                      <EditableField {...fp("adwOvertime", t("ADW 加班費倍數"), { type: "number" })} />
                    </FieldGrid>
                  </Section>

                  <Separator />

                  <Section icon={Landmark} title={t("銀行帳戶")} locked editing={editing} sectionEditable={true}>
                    <FieldGrid>
                      <SecureField label={t("銀行名稱")} value={emp.bankName} fieldKey="bankName" canView={true} editable={true} editing={editing} formData={formData} onChange={handleChange} />
                      <SecureField label={t("銀行帳號")} value={emp.bankAccount} fieldKey="bankAccount" canView={true} editable={true} editing={editing} formData={formData} onChange={handleChange} />
                      <EditableField {...fp("bankRatio", t("銀行戶口比例（%）"), { type: "number" })} />
                    </FieldGrid>
                  </Section>

                  <Separator />

                  <Section icon={Shield} title={t(ss.section)} editing={editing} sectionEditable={true}>
                    <FieldGrid>
                      <EditableField {...fp("contributionType", t(ss.contributionType))} />
                      <EditableField {...fp("mpfType", t(ss.mpfType))} />
                      <EditableField {...fp("empMpfType", t(ss.empMpfType))} />
                      <EditableField {...fp("employerMpf", t(ss.employerMpf))} />
                      <EditableField {...fp("orsoType", t(ss.orsoType))} />
                      <EditableField {...fp("orsoEmpRatio", t(ss.orsoEmpRatio), { type: "number" })} />
                      <EditableField {...fp("orsoEmployerRatio", t(ss.orsoEmployerRatio), { type: "number" })} />
                      <EditableField {...fp("employerOrso", t(ss.employerOrso))} />
                    </FieldGrid>
                  </Section>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
