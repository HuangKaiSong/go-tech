import request from "@/lib/request";
import type { ApiResult, PageResult } from "@/api/employee";

/** 培训计划状态码：对齐后端 TrainingPlanStatusEnum */
export type TrainingPlanStatus = 0 | 1 | 2 | 3; // 0草稿 1已發佈 2進行中 3已結束

/** 适用对象类型 code：对齐后端 TrainingTargetTypeEnum */
export type TrainingTargetType = "all_new" | "position" | "department" | "manual";

/** 培训计划（对齐后端 TrainingPlanVO） */
export interface TrainingPlan {
  id: string;
  name: string;
  type: string;
  description: string;
  targetType: TrainingTargetType;
  targetTypeText: string;
  targetScope: string;
  targetPositionIds: number[];
  targetDepartmentIds: number[];
  targetNames: string[];
  mandatory: boolean;
  estimatedHours: number | null;
  planStatus: TrainingPlanStatus;
  planStatusText: string;
  creatorName: string;
  createTime: string;
  updateTime: string;
  publishedTime: string | null;
  totalModules: number;
  participantCount: number;
  completedCount: number;
}

/** 分页查询参数 */
export interface TrainingPlanPageParams {
  current?: number;
  size?: number;
  keyword?: string;
  type?: string;
  planStatus?: number;
}

/** 新建/编辑入参（对齐后端 TrainingPlanSaveDTO） */
export interface TrainingPlanSavePayload {
  id?: number;
  name: string;
  type?: string;
  description?: string;
  targetType: TrainingTargetType;
  targetPositionIds?: number[];
  targetDepartmentIds?: number[];
  targetNames?: string[];
  mandatory?: boolean;
  estimatedHours?: number;
}

/** 培训计划分页 */
export function getTrainingPlanPage(params: TrainingPlanPageParams) {
  return request.get<any, ApiResult<PageResult<TrainingPlan>>>("training/plan/page", { params });
}

/** 培训计划下拉选项（仅 id + 名称，供筛选下拉用） */
export interface TrainingPlanOption {
  id: string;
  name: string;
}
export function getTrainingPlanOptions() {
  return request.get<any, ApiResult<TrainingPlanOption[]>>("training/plan/options");
}

/** 培训计划详情 */
export function getTrainingPlanDetail(id: number | string) {
  return request.get<any, ApiResult<TrainingPlan>>("training/plan/detail", { params: { id } });
}

/** 新建/编辑草稿，返回 id */
export function saveTrainingPlan(data: TrainingPlanSavePayload) {
  return request.post<any, ApiResult<string>>("training/plan/save", data);
}

/** 发布计划 */
export function publishTrainingPlan(id: number | string) {
  return request.post<any, ApiResult<boolean>>("training/plan/publish", null, { params: { id } });
}

/** 删除计划 */
export function deleteTrainingPlan(id: number | string) {
  return request.post<any, ApiResult<boolean>>("training/plan/delete", null, { params: { id } });
}

// ==================== 课程模组 ====================

/** 模组内容类型 */
export type ModuleContentType = "text" | "video" | "image" | "mixed" | "ppt" | "word";

/** 模组附件（对齐后端 AttachVO） */
export interface ModuleFile {
  id: number;
  name: string;
  url: string;
  fileSize?: number;
  uploaderName?: string;
  uploadTime?: string;
}

/** 课程模组（对齐后端 TrainingModuleVO） */
export interface TrainingModule {
  id: string;
  planId: string;
  title: string;
  contentType: ModuleContentType;
  content: string;
  videoUrl: string | null;
  imageUrl: string | null;
  duration: number;
  sortOrder: number;
  required: boolean;
  files: ModuleFile[];
}

/** 新建/编辑模组入参（对齐后端 TrainingModuleSaveDTO） */
export interface TrainingModuleSavePayload {
  id?: number;
  planId: number | string;
  title: string;
  contentType?: ModuleContentType;
  content?: string;
  videoUrl?: string;
  imageUrl?: string;
  duration?: number;
  required?: boolean;
}

/** 某计划下的模组列表（含附件） */
export function getTrainingModules(planId: number | string) {
  return request.get<any, ApiResult<TrainingModule[]>>("training/module/list", { params: { planId } });
}

/** 新建/编辑模组，返回 id */
export function saveTrainingModule(data: TrainingModuleSavePayload) {
  return request.post<any, ApiResult<string>>("training/module/save", data);
}

/** 删除模组（连同附件） */
export function deleteTrainingModule(id: number | string) {
  return request.post<any, ApiResult<boolean>>("training/module/delete", null, { params: { id } });
}

/** 上传模组附件，返回该模组最新附件列表 */
export function uploadModuleFile(moduleId: number | string, file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return request.post<any, ApiResult<ModuleFile[]>>("training/module/uploadFile", formData, {
    params: { moduleId },
    timeout: 60000,
  });
}

/** 删除模组附件，返回该模组最新附件列表 */
export function deleteModuleFile(attachId: number | string) {
  return request.post<any, ApiResult<ModuleFile[]>>("training/module/deleteFile", null, { params: { attachId } });
}

// ==================== 参训人 ====================

/** 参训人状态码：0未開始 1進行中 2已完成 3未通過 */
export type ParticipantStatus = 0 | 1 | 2 | 3;

/** 参训人（对齐后端 TrainingParticipantVO） */
export interface TrainingParticipant {
  id: string;
  employeeId: string;
  employeeName: string;
  departmentName: string;
  position: string;
  pStatus: ParticipantStatus;
  pStatusText: string;
  score: number | null;
  completedModules: number;
  totalModules: number;
  progress: number;
  certificate: number;
  certificateText: string;
  completedAt: string | null;
}

/** 分配参训人入参（对齐后端 ParticipantAddDTO） */
export interface ParticipantAddPayload {
  planId: number | string;
  assignType: "manual" | "department" | "position" | "all";
  employeeIds?: number[];
  departmentIds?: number[];
  positionIds?: number[];
}

/** 某计划下的参训人列表 */
export function getPlanParticipants(planId: number | string) {
  return request.get<any, ApiResult<TrainingParticipant[]>>("training/participant/list", { params: { planId } });
}

/** 分配参训人，返回新增人数 */
export function addParticipants(data: ParticipantAddPayload) {
  return request.post<any, ApiResult<number>>("training/participant/add", data);
}

/** 移除参训人 */
export function removeParticipant(id: number | string) {
  return request.post<any, ApiResult<boolean>>("training/participant/remove", null, { params: { id } });
}

/** 发放证书 */
export function issueCertificate(id: number | string) {
  return request.post<any, ApiResult<boolean>>("training/participant/issueCertificate", null, { params: { id } });
}

// ==================== 培训记录 ====================

/** 培训记录（对齐后端 TrainingRecordVO） */
export interface TrainingRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  departmentName: string;
  position: string;
  planId: string;
  planName: string;
  planType: string;
  completedModules: number;
  totalModules: number;
  progress: number;
  score: number | null;
  pStatus: ParticipantStatus;
  pStatusText: string;
  certificateText: string;
  startDate: string | null;
  completedAt: string | null;
}

export interface TrainingRecordPageParams {
  current?: number;
  size?: number;
  keyword?: string;
  planId?: number | string;
  pStatus?: number;
  departmentName?: string;
}

/** 培训记录分页 */
export function getTrainingRecordPage(params: TrainingRecordPageParams) {
  return request.get<any, ApiResult<PageResult<TrainingRecord>>>("training/record/page", { params });
}

/** 导出培训记录（返回 blob） */
export function exportTrainingRecords(params: Omit<TrainingRecordPageParams, "current" | "size">) {
  return request.get<any, { data: Blob; headers: Record<string, string> }>("training/record/export", {
    params,
    responseType: "blob",
  });
}

// ==================== 我的培训（员工自助） ====================

/** 我的培训列表项（对齐后端 MyTrainingVO） */
export interface MyTraining {
  participantId: string;
  planId: string;
  planName: string;
  type: string | null;
  description: string | null;
  mandatory: boolean;
  completedModules: number;
  totalModules: number;
  progress: number;
  pStatus: ParticipantStatus;
  pStatusText: string;
}

/** 我的培训详情（对齐后端 MyTrainingDetailVO） */
export interface MyTrainingDetail {
  summary: MyTraining;
  modules: (TrainingModule & { done: boolean })[];
}

/** 我的培训列表 */
export function getMyTrainings() {
  return request.get<any, ApiResult<MyTraining[]>>("training/my/list");
}

/** 我的某培训详情 */
export function getMyTrainingDetail(planId: number | string) {
  return request.get<any, ApiResult<MyTrainingDetail>>("training/my/detail", { params: { planId } });
}

/** 标记模组完成/取消，返回重算后的概要 */
export function toggleMyModule(data: { planId: number | string; moduleId: number | string; done: boolean }) {
  return request.post<any, ApiResult<MyTraining>>("training/my/toggleModule", data);
}
