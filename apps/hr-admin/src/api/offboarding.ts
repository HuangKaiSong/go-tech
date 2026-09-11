import request from "@/lib/request";
import type { ApiResult, PageResult } from "@/api/employee";
import type { PendingEmployee, TaskAttach, LifecycleTask } from "@/api/onboarding";

/** 離職單列表行（對齊後端 OffboardingVO） */
export interface OffboardingItem {
  id: number;
  offboardingNo: string;
  employeeId: number;
  employeeName: string;
  department?: string;
  position?: string;
  applyDate?: string;
  lastWorkDate?: string;
  /** 離職類型碼 1.主動離職 2.公司辭退 3.合同到期 4.退休 5.其他 */
  leaveType?: number;
  leaveTypeName?: string;
  leaveReason?: string;
  hrOwnerName?: string;
  /** 狀態碼 1.待審批 2.交接中 3.待結算 4.已完成 5.已取消 */
  statusCode: number;
  /** 狀態文案 */
  status: string;
  taskTotal: number;
  taskDone: number;
  /** 進度百分比 0~100 */
  progress: number;
}

/** 離職單分頁查詢參數 */
export interface OffboardingPageParams {
  current?: number;
  size?: number;
  keyword?: string;
  status?: number;
}

/** 分頁查詢離職單列表 */
export function getOffboardingList(params: OffboardingPageParams) {
  return request.get<any, ApiResult<PageResult<OffboardingItem>>>("offboarding/list", { params });
}

/** 離職單狀態統計行 */
export interface OffboardingStatusCount {
  /** 狀態碼 1.待審批 2.交接中 3.待結算 4.已完成 5.已取消 */
  status: number;
  cnt: number;
}

/** 統計各狀態離職單數量（統計卡用） */
export function getOffboardingStatusCount() {
  return request.get<any, ApiResult<OffboardingStatusCount[]>>("offboarding/statusCount");
}

/** 查詢可建離職單的在職員工（結構同 PendingEmployee） */
export function getActiveEmployees() {
  return request.get<any, ApiResult<PendingEmployee[]>>("offboarding/activeEmployees");
}

/** 新增離職單入參（員工信息由後端從檔案冗余，建單後員工轉「待離職」） */
export interface OffboardingCreatePayload {
  employeeId: number;
  /** 離職類型 1.主動離職 2.公司辭退 3.合同到期 4.退休 5.其他 */
  leaveType: number;
  leaveReason: string;
  applyDate: string;
  lastWorkDate: string;
  handoverToId?: number;
  remark?: string;
}

/** 新增離職單（自動生成默認任務清單） */
export function createOffboarding(data: OffboardingCreatePayload) {
  return request.post<any, ApiResult<boolean>>("offboarding/create", data);
}

/** 離職單詳情（對齊後端 OffboardingDetailVO） */
export interface OffboardingDetailData {
  id: number;
  offboardingNo: string;
  employeeId: number;
  employeeName: string;
  department?: string;
  position?: string;
  applyDate?: string;
  lastWorkDate?: string;
  actualDate?: string;
  phone?: string;
  email?: string;
  leaveType?: number;
  leaveTypeName?: string;
  leaveReason?: string;
  handoverToName?: string;
  hrOwnerName?: string;
  managerName?: string;
  remark?: string;
  statusCode: number;
  status: string;
  tasks: LifecycleTask[];
}

/** 查詢離職單詳情 */
export function getOffboardingById(id: number) {
  return request.get<any, ApiResult<OffboardingDetailData>>("offboarding/getById", { params: { id } });
}

/** 勾選/取消任務；返回聯動後的離職單狀態碼（4=已完成，員工已自動轉已離職） */
export function toggleOffboardingTask(taskId: number, done: boolean) {
  return request.post<any, ApiResult<number>>("offboarding/task/toggle", { taskId, done: done ? 1 : 0 });
}

/** 上傳任務附件（MinIO + attach 表）；返回該任務最新附件列表 */
export function uploadOffboardingTaskAttach(taskId: number, file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return request.post<any, ApiResult<TaskAttach[]>>("offboarding/task/uploadAttach", formData, {
    params: { taskId },
    // 上傳大檔放寬超時
    timeout: 60000,
  });
}
