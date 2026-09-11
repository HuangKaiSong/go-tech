import request from "@/lib/request";
import type { ApiResult, PageResult } from "@/api/employee";

/** 入職單列表行（對齊後端 OnboardingVO） */
export interface OnboardingItem {
  id: number;
  onboardingNo: string;
  employeeId: number;
  employeeName: string;
  department?: string;
  position?: string;
  planDate?: string;
  hrOwnerName?: string;
  source?: string;
  /** 狀態碼 1.待入職 2.進行中 3.資料待補 4.已完成 5.已取消 */
  statusCode: number;
  /** 狀態文案 */
  status: string;
  taskTotal: number;
  taskDone: number;
  /** 進度百分比 0~100 */
  progress: number;
}

/** 入職單分頁查詢參數 */
export interface OnboardingPageParams {
  current?: number;
  size?: number;
  keyword?: string;
  status?: number;
}

/** 分頁查詢入職單列表 */
export function getOnboardingList(params: OnboardingPageParams) {
  return request.get<any, ApiResult<PageResult<OnboardingItem>>>("onboarding/list", { params });
}

/** 待入職且未建單的員工（新增入職彈窗選人 + 回顯，對齊後端 PendingEmployeeVO） */
export interface PendingEmployee {
  id: number;
  employeeNo?: string;
  name: string;
  phone?: string;
  email?: string;
  department?: string;
  position?: string;
  joinDate?: string;
  hrOwnerName?: string;
  managerName?: string;
  probation?: number;
  salaryType?: string;
}

/** 入職單狀態統計行 */
export interface OnboardingStatusCount {
  /** 狀態碼 1.待入職 2.進行中 3.資料待補 4.已完成 5.已取消 */
  status: number;
  cnt: number;
}

/** 統計各狀態入職單數量（統計卡用） */
export function getOnboardingStatusCount() {
  return request.get<any, ApiResult<OnboardingStatusCount[]>>("onboarding/statusCount");
}

/** 查詢可建入職單的待入職員工 */
export function getPendingEmployees() {
  return request.get<any, ApiResult<PendingEmployee[]>>("onboarding/pendingEmployees");
}

/** 新增入職單入參（員工信息由後端從檔案冗余） */
export interface OnboardingCreatePayload {
  employeeId: number;
  planDate?: string;
  source?: string;
  mentor?: string;
  remark?: string;
}

/** 新增入職單（自動生成默認任務清單） */
export function createOnboarding(data: OnboardingCreatePayload) {
  return request.post<any, ApiResult<boolean>>("onboarding/create", data);
}

/** 任務附件行（對齊後端 AttachVO，通用附件表） */
export interface TaskAttach {
  id: number;
  /** 原始檔名 */
  name: string;
  url: string;
  /** 檔案大小(字節) */
  fileSize?: number;
  uploaderName?: string;
  uploadTime?: string;
}

/** 入職任務行（對齊後端 LifecycleTaskVO） */
export interface LifecycleTask {
  id: number;
  name: string;
  category?: string;
  done: boolean;
  doneTime?: string;
  doneUserName?: string;
  dueDate?: string;
  assignee?: string;
  /** 附件列表 */
  attachments?: TaskAttach[];
}

/** 入職單詳情（對齊後端 OnboardingDetailVO） */
export interface OnboardingDetailData {
  id: number;
  onboardingNo: string;
  employeeId: number;
  employeeName: string;
  department?: string;
  position?: string;
  planDate?: string;
  actualDate?: string;
  phone?: string;
  email?: string;
  source?: string;
  mentor?: string;
  hrOwnerName?: string;
  managerName?: string;
  probation?: number;
  salaryType?: string;
  remark?: string;
  statusCode: number;
  status: string;
  tasks: LifecycleTask[];
}

/** 查詢入職單詳情 */
export function getOnboardingById(id: number) {
  return request.get<any, ApiResult<OnboardingDetailData>>("onboarding/getById", { params: { id } });
}

/** 勾選/取消任務；返回聯動後的入職單狀態碼（4=已完成，員工已自動轉在職） */
export function toggleOnboardingTask(taskId: number, done: boolean) {
  return request.post<any, ApiResult<number>>("onboarding/task/toggle", { taskId, done: done ? 1 : 0 });
}

/** 上傳任務附件（MinIO + attach 表）；返回該任務最新附件列表 */
export function uploadTaskAttach(taskId: number, file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return request.post<any, ApiResult<TaskAttach[]>>("onboarding/task/uploadAttach", formData, {
    params: { taskId },
    // 上傳大檔放寬超時
    timeout: 60000,
  });
}

/** 刪除任務附件（刪 attach 記錄與 MinIO 對象）；返回最新附件列表 */
export function deleteTaskAttach(attachId: number) {
  return request.post<any, ApiResult<TaskAttach[]>>("minio/delete", null, {
    params: { attachId },
  });
}
