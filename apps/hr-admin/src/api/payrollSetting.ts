import request from "@/lib/request";
import type { ApiResult } from "@/api/employee";

/** 薪資系統參數（對齊後端 PayrollConfig；核算引擎讀取口徑） */
export interface PayrollConfig {
  id?: number | null;
  /** 月標準工時（時薪換算/加班時薪基數） */
  standardMonthlyHours: number;
  /** 加班倍率缺省（員工 adwOvertime 優先） */
  defaultOtMultiplier: number;
  /** 月加班時數異常上限（超過告警） */
  otHoursCap: number;
  /** 實發環比異動門檻 % */
  anomalyThreshold: number;
  /** 扣款佔工資上限 %（EO s.32） */
  deductionCapRatio: number;
  note?: string | null;
}

/** 取薪資系統參數（未設定過返回缺省值，id 為 null） */
export function getPayrollConfig() {
  return request.get<any, ApiResult<PayrollConfig>>("payroll/setting/config/get");
}

/** 保存薪資系統參數（單行 upsert） */
export function savePayrollConfig(payload: PayrollConfig) {
  return request.post<any, ApiResult<boolean>>("payroll/setting/config/save", payload);
}
