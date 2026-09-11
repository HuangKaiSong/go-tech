/**
 * 员工薪资类型：存英文码（与后端 SalaryTypeEnum 一致），显示走繁體 label（再经 i18n t()）。
 * 组件里比较一律用 code（MONTHLY/DAILY/HOURLY），不要再比较中文。
 */
export const SALARY_TYPES = [
  { code: "MONTHLY", label: "月薪" },
  { code: "DAILY", label: "日薪" },
  { code: "HOURLY", label: "時薪" },
] as const;

export type SalaryTypeCode = (typeof SALARY_TYPES)[number]["code"];

/** 下拉选项：{label:繁體, value:code}，SelectField 非 raw 会自动 t(label) */
export const SALARY_TYPE_OPTIONS = SALARY_TYPES.map((s) => ({ label: s.label, value: s.code }));

/** code → 繁體 label；未知码原样返回（兼容历史中文值直接回显） */
export function salaryTypeLabel(code?: string): string {
  if (!code) return "";
  return SALARY_TYPES.find((s) => s.code === code)?.label ?? code;
}
