import request from "@/lib/request";
import type { ApiResult } from "@/api/auth";

/** 假别类型（对齐后端 LeaveTypeVO，仅取请假单下拉所需字段） */
export interface LeaveType {
  code: string;
  color?: string;
  enabled?: boolean;
  id: number;
  maxPerRequest?: number | null;
  name: string;
  paid?: boolean;
  proofThresholdDays?: number | null;
  requireProof?: boolean;
  unit?: string;
}

/** 启用中的假别（供请假单下拉，onlyEnabled=true） */
export function getLeaveTypes() {
  return request.get<any, ApiResult<LeaveType[]>>("leave/setting/type/list", {
    params: { onlyEnabled: true },
  });
}

/** 当前员工某假别的可用额度（请假前预览剩余天数）。tracked=false 表示该假别不追踪额度 */
export interface MyLeaveBalance {
  tracked: boolean;
  leaveCode?: string;
  remaining?: number;
}

export function getMyLeaveBalance(leaveCode: string) {
  return request.get<any, ApiResult<MyLeaveBalance>>("leave/balance/my", {
    params: { leaveCode },
  });
}
