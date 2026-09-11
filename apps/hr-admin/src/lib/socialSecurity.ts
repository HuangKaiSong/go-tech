/**
 * 社會保障 / 退休金 —— 按國籍的欄位標籤配置。
 *
 * 設計：各國社保欄位「結構同構」，共用員工表同一組中性槽位，不另建表。
 * 這裡只做「標籤 + 區塊標題」按國籍切換；底層欄位 key 不變：
 *   contributionType / mpfType / empMpfType / employerMpf
 *   orsoType / orsoEmpRatio / orsoEmployerRatio / employerOrso
 * 核算引擎（Phase 3）再按 nationality 選對應演算法與法定參數。
 */
export interface SSLabels {
  /** 區塊標題 */
  section: string;
  contributionType: string;
  mpfType: string;
  empMpfType: string;
  employerMpf: string;
  orsoType: string;
  orsoEmpRatio: string;
  orsoEmployerRatio: string;
  employerOrso: string;
}

/** 各國籍對應的社保標籤。未列出的國籍回落到「其他」。 */
export const SS_LABELS: Record<string, SSLabels> = {
  香港: {
    section: "強積金 / 退休計劃",
    contributionType: "供款類型",
    mpfType: "強積金類型",
    empMpfType: "員工強積金類型",
    employerMpf: "僱主的強積金",
    orsoType: "退休計劃供款類型",
    orsoEmpRatio: "員工供款比例（%）",
    orsoEmployerRatio: "僱主供款比例（%）",
    employerOrso: "僱主的退休計劃",
  },
  中國: {
    section: "社會保險 / 公積金",
    contributionType: "社保繳費類型",
    mpfType: "社會保險類型",
    empMpfType: "住房公積金類型",
    employerMpf: "單位社保繳費",
    orsoType: "補充公積金類型",
    orsoEmpRatio: "個人繳費比例（%）",
    orsoEmployerRatio: "單位繳費比例（%）",
    employerOrso: "單位補充公積金",
  },
  台灣: {
    section: "勞保 / 勞退",
    contributionType: "勞保投保類型",
    mpfType: "勞工保險類型",
    empMpfType: "全民健保類型",
    employerMpf: "雇主勞健保負擔",
    orsoType: "勞退提繳類型",
    orsoEmpRatio: "員工自提比例（%）",
    orsoEmployerRatio: "雇主提繳比例（%）",
    employerOrso: "雇主勞退提繳",
  },
  新加坡: {
    section: "公積金 CPF",
    contributionType: "CPF供款類型",
    mpfType: "公積金（CPF）類型",
    empMpfType: "員工CPF帳戶類型",
    employerMpf: "僱主的CPF供款",
    orsoType: "補充退休計劃（SRS）類型",
    orsoEmpRatio: "CPF員工供款比例（%）",
    orsoEmployerRatio: "CPF僱主供款比例（%）",
    employerOrso: "僱主的補充退休計劃",
  },
  澳洲: {
    section: "退休金 Superannuation",
    contributionType: "退休金供款類型",
    mpfType: "超級年金類型",
    empMpfType: "退休金帳戶類型",
    employerMpf: "僱主的退休金",
    orsoType: "額外供款類型",
    orsoEmpRatio: "員工供款比例（%）",
    orsoEmployerRatio: "僱主保證供款比例（%）",
    employerOrso: "僱主的額外供款",
  },
  其他: {
    section: "社會保障 / 退休金",
    contributionType: "供款類型",
    mpfType: "計劃類型",
    empMpfType: "帳戶類型",
    employerMpf: "僱主供款",
    orsoType: "補充計劃供款類型",
    orsoEmpRatio: "員工供款比例（%）",
    orsoEmployerRatio: "僱主供款比例（%）",
    employerOrso: "僱主補充供款",
  },
};

/** 取某國籍的社保標籤；空值/未知回落「香港」（HK 為預設）。 */
export function getSSLabels(nationality?: string | null): SSLabels {
  if (nationality && SS_LABELS[nationality]) return SS_LABELS[nationality];
  return SS_LABELS["香港"];
}
