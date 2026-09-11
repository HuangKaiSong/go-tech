import request from "@/lib/request";
import type { ApiResult, PageResult } from "@/api/employee";

/** 方案状态：对齐后端 PerfPlanStatusEnum 0草稿 1进行中 2已完成 */
export type PerfPlanStatus = 0 | 1 | 2;
/** 周期类型：0月度 1季度 2半年 3年度 */
export type PerfCycle = 0 | 1 | 2 | 3;
/** 考核范围类型：1全公司 2部门 3职位 4手动 */
export type PerfScopeType = 1 | 2 | 3 | 4;
/** 指标分类：1业绩 2能力 3态度 */
export type PerfCategory = 1 | 2 | 3;
/** 评分方式：1打分 2是否 3量表 */
export type PerfScoringType = 1 | 2 | 3;

/** 考核方案列表项（对齐后端 PerfPlanVO） */
export interface PerfPlan {
  id: string;
  name: string;
  period: string | null;
  cycle: PerfCycle | null;
  cycleText: string;
  scopeType: PerfScopeType | null;
  scopeText: string;
  weightConfig: string;
  planStatus: PerfPlanStatus;
  planStatusText: string;
  indicatorCount: number;
  employeeCount: number;
  creatorName: string | null;
  createTime: string | null;
  publishedTime: string | null;
}

/** 指标（对齐后端 PerfIndicatorVO） */
export interface PerfIndicator {
  id?: string;
  name: string;
  category: PerfCategory;
  categoryText?: string;
  weight: number;
  maxScore: number;
  scoringType: PerfScoringType;
  scoringTypeText?: string;
  sort?: number;
}

/** 评级规则（对齐后端 PerfGradeRuleVO） */
export interface PerfGradeRule {
  id?: string;
  grade: string;
  minScore: number;
  maxScore: number;
  description?: string;
  sort?: number;
}

/** 方案详情（对齐后端 PerfPlanDetailVO） */
export interface PerfPlanDetail {
  id: string;
  name: string;
  period: string | null;
  cycle: PerfCycle | null;
  cycleText: string;
  scopeType: PerfScopeType | null;
  scopeTypeText: string;
  scopeRef: number[];
  scopeNames: string[];
  scopeText: string;
  selfWeight: number;
  peerWeight: number;
  managerWeight: number;
  peerCount: number;
  planStatus: PerfPlanStatus;
  planStatusText: string;
  remark: string | null;
  creatorName: string | null;
  createTime: string | null;
  publishedTime: string | null;
  indicators: PerfIndicator[];
  gradeRules: PerfGradeRule[];
}

/** 分页查询参数 */
export interface PerfPlanPageParams {
  current?: number;
  size?: number;
  keyword?: string;
  cycle?: number;
  planStatus?: number;
}

/** 保存入参（对齐后端 PerfPlanSaveDTO） */
export interface PerfPlanSavePayload {
  id?: number;
  name: string;
  period?: string;
  cycle: number;
  scopeType: number;
  scopeRef?: number[];
  scopeNames?: string[];
  selfWeight: number;
  peerWeight: number;
  managerWeight: number;
  peerCount?: number;
  remark?: string;
  indicators: Array<Omit<PerfIndicator, "categoryText" | "scoringTypeText">>;
  gradeRules: PerfGradeRule[];
}

/** 状态文案表 */
export const PERF_STATUS_TEXT: Record<PerfPlanStatus, string> = {
  0: "草稿",
  1: "進行中",
  2: "已完成",
};

/** 考核方案分页 */
export function getPerfPlanPage(params: PerfPlanPageParams) {
  return request.get<any, ApiResult<PageResult<PerfPlan>>>("performance/plan/page", { params });
}

/** 考核方案详情（含指标与评级规则） */
export function getPerfPlanDetail(id: number | string) {
  return request.get<any, ApiResult<PerfPlanDetail>>("performance/plan/detail", { params: { id } });
}

/** 新建/编辑草稿，返回 id */
export function savePerfPlan(data: PerfPlanSavePayload) {
  return request.post<any, ApiResult<string>>("performance/plan/save", data);
}

/** 删除方案（仅草稿） */
export function deletePerfPlan(id: number | string) {
  return request.post<any, ApiResult<boolean>>("performance/plan/delete", null, { params: { id } });
}

/** 发布方案（草稿→进行中，生成考核任务）。data 为互评凑不满提示，空串表示无提示 */
export function publishPerfPlan(id: number | string) {
  return request.post<any, ApiResult<string>>("performance/plan/publish", null, { params: { id } });
}

// ==================== Phase2：考核任务 / 三方评分 ====================

/** 任务状态：0待自评 1互评中 2待主管评 3待校准 4已完成 */
export type PerfTaskStatus = 0 | 1 | 2 | 3 | 4;
/** 评价者类型：1自评 2互评 3主管评 */
export type PerfReviewerType = 1 | 2 | 3;

/** 考核任务列表项（对齐后端 PerfTaskVO） */
export interface PerfTask {
  id: string;
  planId: string;
  planName: string;
  employeeId: string;
  employeeName: string;
  departmentName: string | null;
  position: string | null;
  selfTotal: number | null;
  peerTotal: number | null;
  managerTotal: number | null;
  finalScore: number | null;
  grade: string | null;
  taskStatus: PerfTaskStatus;
  taskStatusText: string;
  peerProgress: string;
}

/** 我的评价待办（对齐后端 MyPerfTaskVO） */
export interface MyPerfTask {
  reviewerRecordId: string;
  taskId: string;
  planId: string;
  planName: string;
  revieweeName: string;
  departmentName: string | null;
  position: string | null;
  reviewerType: PerfReviewerType;
  reviewerTypeText: string;
  submitStatus: 0 | 1;
}

/** 评价者进度（对齐后端 PerfReviewerVO） */
export interface PerfReviewerProgress {
  reviewerId: string;
  reviewerName: string;
  reviewerType: PerfReviewerType;
  reviewerTypeText: string;
  submitStatus: 0 | 1;
  submitTime: string | null;
}

/** 评分录入项（对齐后端 PerfScoreInputVO） */
export interface PerfScoreInput {
  indicatorId: string;
  name: string;
  category: PerfCategory;
  categoryText: string;
  weight: number;
  maxScore: number;
  scoringType: PerfScoringType;
  scoringTypeText: string;
  myScore: number | null;
  myComment: string | null;
}

/** 任务详情（对齐后端 PerfTaskDetailVO） */
export interface PerfTaskDetail {
  id: string;
  planId: string;
  planName: string;
  employeeName: string;
  departmentName: string | null;
  position: string | null;
  selfWeight: number;
  peerWeight: number;
  managerWeight: number;
  selfTotal: number | null;
  peerTotal: number | null;
  managerTotal: number | null;
  finalScore: number | null;
  grade: string | null;
  taskStatus: PerfTaskStatus;
  taskStatusText: string;
  reviewers: PerfReviewerProgress[];
  myReviewerType: PerfReviewerType | null;
  myReviewerTypeText: string | null;
  canSubmit: boolean;
  mySubmitted: boolean;
  scoreItems: PerfScoreInput[] | null;
}

/** 任务列表查询参数 */
export interface PerfTaskPageParams {
  current?: number;
  size?: number;
  planId?: number | string;
  keyword?: string;
  taskStatus?: number;
}

/** 任务状态文案表 */
export const PERF_TASK_STATUS_TEXT: Record<PerfTaskStatus, string> = {
  0: "待自評",
  1: "同事互評中",
  2: "待主管評",
  3: "待校准",
  4: "已完成",
};

/** 考核任务分页（HR/主管视角） */
export function getPerfTaskPage(params: PerfTaskPageParams) {
  return request.get<any, ApiResult<PageResult<PerfTask>>>("performance/task/page", { params });
}

/** 我的评价待办 */
export function getMyPerfTasks() {
  return request.get<any, ApiResult<MyPerfTask[]>>("performance/task/my");
}

/** 任务详情（含三方进度与我的评分录入） */
export function getPerfTaskDetail(taskId: number | string) {
  return request.get<any, ApiResult<PerfTaskDetail>>("performance/task/detail", { params: { taskId } });
}

/** 互评明细（单个互评人对某指标） */
export interface PerfPeerScore {
  reviewerName: string | null;
  department: string | null;
  score: number | null;
  comment: string | null;
}

/** 指标三方评分明细（对齐后端 PerfIndicatorBreakdownVO） */
export interface PerfIndicatorBreakdown {
  indicatorId: string;
  name: string;
  category: PerfCategory;
  categoryText: string;
  weight: number;
  maxScore: number;
  selfScore: number | null;
  selfComment: string | null;
  managerScore: number | null;
  managerComment: string | null;
  peerReviews: PerfPeerScore[];
}

/** 指标三方评分明细（供评估详情四 Tab） */
export function getPerfTaskBreakdown(taskId: number | string) {
  return request.get<any, ApiResult<PerfIndicatorBreakdown[]>>("performance/task/breakdown", { params: { taskId } });
}

/** 提交评分入参 */
export interface PerfScoreSubmitPayload {
  taskId: number | string;
  items: Array<{ indicatorId: number | string; score: number; comment?: string }>;
}

/** 提交评分 */
export function submitPerfScore(data: PerfScoreSubmitPayload) {
  return request.post<any, ApiResult<boolean>>("performance/task/submitScore", data);
}

// ==================== Phase3：校准 / 结果汇总 / 导出 ====================

/** 校准入参 */
export interface PerfCalibratePayload {
  taskId: number | string;
  finalScore: number;
  grade?: string;
  reason?: string;
}

/** HR 校准（确认/调整最终分与评级，任务→已完成） */
export function calibratePerfTask(data: PerfCalibratePayload) {
  return request.post<any, ApiResult<boolean>>("performance/task/calibrate", data);
}

/** 等级分布项 */
export interface PerfGradeCount {
  grade: string;
  count: number;
}

/** 方案结果汇总（对齐后端 PerfPlanResultVO） */
export interface PerfPlanResult {
  planId: string;
  planName: string;
  totalTasks: number;
  finishedTasks: number;
  completionRate: number;
  avgScore: number | null;
  grades: PerfGradeCount[];
}

/** 方案结果汇总 */
export function getPerfPlanResult(planId: number | string) {
  return request.get<any, ApiResult<PerfPlanResult>>("performance/task/result", { params: { planId } });
}

/** 导出方案结果（返回 blob） */
export function exportPerfResult(planId: number | string) {
  return request.get<any, { data: Blob; headers: Record<string, string> }>("performance/task/exportResult", {
    params: { planId },
    responseType: "blob",
  });
}
