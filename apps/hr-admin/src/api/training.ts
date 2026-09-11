import type { ApiResult, PageResult } from '@/api/employee';
import request from '@/lib/request';

/** 培训计划状态码：对齐后端 TrainingPlanStatusEnum */
export type TrainingPlanStatus = 0 | 1 | 2 | 3; // 0草稿 1已發佈 2進行中 3已結束

/** 适用对象类型 code：对齐后端 TrainingTargetTypeEnum */
export type TrainingTargetType = 'all_new' | 'department' | 'manual' | 'position';

/** 培训计划（对齐后端 TrainingPlanVO） */
export interface TrainingPlan {
  completedCount: number;
  createTime: string;
  creatorName: string;
  description: string;
  estimatedHours: number | null;
  id: string;
  mandatory: boolean;
  name: string;
  participantCount: number;
  planStatus: TrainingPlanStatus;
  planStatusText: string;
  publishedTime: string | null;
  targetDepartmentIds: number[];
  targetNames: string[];
  targetPositionIds: number[];
  targetScope: string;
  targetType: TrainingTargetType;
  targetTypeText: string;
  totalModules: number;
  type: string;
  updateTime: string;
}

/** 分页查询参数 */
export interface TrainingPlanPageParams {
  current?: number;
  keyword?: string;
  planStatus?: number;
  size?: number;
  type?: string;
}

/** 新建/编辑入参（对齐后端 TrainingPlanSaveDTO） */
export interface TrainingPlanSavePayload {
  description?: string;
  estimatedHours?: number;
  id?: number;
  mandatory?: boolean;
  name: string;
  targetDepartmentIds?: number[];
  targetNames?: string[];
  targetPositionIds?: number[];
  targetType: TrainingTargetType;
  type?: string;
}

/** 培训计划分页 */
export function getTrainingPlanPage(params: TrainingPlanPageParams) {
  return request.get<any, ApiResult<PageResult<TrainingPlan>>>('training/plan/page', { params });
}

/** 培训计划下拉选项（仅 id + 名称，供筛选下拉用） */
export interface TrainingPlanOption {
  id: string;
  name: string;
}
export function getTrainingPlanOptions() {
  return request.get<any, ApiResult<TrainingPlanOption[]>>('training/plan/options');
}

/** 培训计划详情 */
export function getTrainingPlanDetail(id: number | string) {
  return request.get<any, ApiResult<TrainingPlan>>('training/plan/detail', { params: { id } });
}

/** 新建/编辑草稿，返回 id */
export function saveTrainingPlan(data: TrainingPlanSavePayload) {
  return request.post<any, ApiResult<string>>('training/plan/save', data);
}

/** 发布计划 */
export function publishTrainingPlan(id: number | string) {
  return request.post<any, ApiResult<boolean>>('training/plan/publish', null, { params: { id } });
}

/** 删除计划 */
export function deleteTrainingPlan(id: number | string) {
  return request.post<any, ApiResult<boolean>>('training/plan/delete', null, { params: { id } });
}

// ==================== 课程模组 ====================

/** 模组内容类型 */
export type ModuleContentType = 'image' | 'mixed' | 'ppt' | 'text' | 'video' | 'word';

/** 模组附件（对齐后端 AttachVO） */
export interface ModuleFile {
  fileSize?: number;
  id: number;
  name: string;
  uploaderName?: string;
  uploadTime?: string;
  url: string;
}

/** 课程模组（对齐后端 TrainingModuleVO） */
export interface TrainingModule {
  content: string;
  contentType: ModuleContentType;
  duration: number;
  files: ModuleFile[];
  id: string;
  imageUrl: string | null;
  planId: string;
  required: boolean;
  sortOrder: number;
  title: string;
  videoUrl: string | null;
}

/** 新建/编辑模组入参（对齐后端 TrainingModuleSaveDTO） */
export interface TrainingModuleSavePayload {
  content?: string;
  contentType?: ModuleContentType;
  duration?: number;
  id?: number;
  imageUrl?: string;
  planId: number | string;
  required?: boolean;
  title: string;
  videoUrl?: string;
}

/** 某计划下的模组列表（含附件） */
export function getTrainingModules(planId: number | string) {
  return request.get<any, ApiResult<TrainingModule[]>>('training/module/list', { params: { planId } });
}

/** 新建/编辑模组，返回 id */
export function saveTrainingModule(data: TrainingModuleSavePayload) {
  return request.post<any, ApiResult<string>>('training/module/save', data);
}

/** 删除模组（连同附件） */
export function deleteTrainingModule(id: number | string) {
  return request.post<any, ApiResult<boolean>>('training/module/delete', null, { params: { id } });
}

/** 上传模组附件，返回该模组最新附件列表 */
export function uploadModuleFile(moduleId: number | string, file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return request.post<any, ApiResult<ModuleFile[]>>('training/module/uploadFile', formData, {
    params: { moduleId },
    timeout: 60000
  });
}

/** 删除模组附件，返回该模组最新附件列表 */
export function deleteModuleFile(attachId: number | string) {
  return request.post<any, ApiResult<ModuleFile[]>>('training/module/deleteFile', null, { params: { attachId } });
}

// ==================== 参训人 ====================

/** 参训人状态码：0未開始 1進行中 2已完成 3未通過 */
export type ParticipantStatus = 0 | 1 | 2 | 3;

/** 参训人（对齐后端 TrainingParticipantVO） */
export interface TrainingParticipant {
  certificate: number;
  certificateText: string;
  completedAt: string | null;
  completedModules: number;
  departmentName: string;
  employeeId: string;
  employeeName: string;
  id: string;
  position: string;
  progress: number;
  pStatus: ParticipantStatus;
  pStatusText: string;
  score: number | null;
  totalModules: number;
}

/** 分配参训人入参（对齐后端 ParticipantAddDTO） */
export interface ParticipantAddPayload {
  assignType: 'manual' | 'department' | 'position' | 'all';
  departmentIds?: number[];
  employeeIds?: number[];
  planId: number | string;
  positionIds?: number[];
}

/** 某计划下的参训人列表 */
export function getPlanParticipants(planId: number | string) {
  return request.get<any, ApiResult<TrainingParticipant[]>>('training/participant/list', { params: { planId } });
}

/** 分配参训人，返回新增人数 */
export function addParticipants(data: ParticipantAddPayload) {
  return request.post<any, ApiResult<number>>('training/participant/add', data);
}

/** 移除参训人 */
export function removeParticipant(id: number | string) {
  return request.post<any, ApiResult<boolean>>('training/participant/remove', null, { params: { id } });
}

/** 发放证书 */
export function issueCertificate(id: number | string) {
  return request.post<any, ApiResult<boolean>>('training/participant/issueCertificate', null, { params: { id } });
}

// ==================== 培训记录 ====================

/** 培训记录（对齐后端 TrainingRecordVO） */
export interface TrainingRecord {
  certificateText: string;
  completedAt: string | null;
  completedModules: number;
  departmentName: string;
  employeeId: string;
  employeeName: string;
  id: string;
  planId: string;
  planName: string;
  planType: string;
  position: string;
  progress: number;
  pStatus: ParticipantStatus;
  pStatusText: string;
  score: number | null;
  startDate: string | null;
  totalModules: number;
}

export interface TrainingRecordPageParams {
  current?: number;
  departmentName?: string;
  keyword?: string;
  planId?: number | string;
  pStatus?: number;
  size?: number;
}

/** 培训记录分页 */
export function getTrainingRecordPage(params: TrainingRecordPageParams) {
  return request.get<any, ApiResult<PageResult<TrainingRecord>>>('training/record/page', { params });
}

/** 导出培训记录（返回 blob） */
export function exportTrainingRecords(params: Omit<TrainingRecordPageParams, 'current' | 'size'>) {
  return request.get<any, { data: Blob; headers: Record<string, string> }>('training/record/export', {
    params,
    responseType: 'blob'
  });
}

// ==================== 我的培训（员工自助） ====================

/** 我的培训列表项（对齐后端 MyTrainingVO） */
export interface MyTraining {
  completedModules: number;
  description: string | null;
  mandatory: boolean;
  participantId: string;
  planId: string;
  planName: string;
  progress: number;
  pStatus: ParticipantStatus;
  pStatusText: string;
  totalModules: number;
  type: string | null;
}

/** 我的培训详情（对齐后端 MyTrainingDetailVO） */
export interface MyTrainingDetail {
  modules: (TrainingModule & { done: boolean })[];
  summary: MyTraining;
}

/** 我的培训列表 */
export function getMyTrainings() {
  return request.get<any, ApiResult<MyTraining[]>>('training/my/list');
}

/** 我的某培训详情 */
export function getMyTrainingDetail(planId: number | string) {
  return request.get<any, ApiResult<MyTrainingDetail>>('training/my/detail', { params: { planId } });
}

/** 标记模组完成/取消，返回重算后的概要 */
export function toggleMyModule(data: { done: boolean; moduleId: number | string; planId: number | string }) {
  return request.post<any, ApiResult<MyTraining>>('training/my/toggleModule', data);
}
