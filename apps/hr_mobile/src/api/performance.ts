import type { ApiResult } from '@/api/auth';
import request from '@/lib/request';

/** 任务状态：0待自评 1互评中 2待主管评 3待校准 4已完成 */
export type PerfTaskStatus = 0 | 1 | 2 | 3 | 4;
/** 评价者类型：1自评 2互评 3主管评 */
export type PerfReviewerType = 1 | 2 | 3;

/** 我的评价待办（对齐后端 MyPerfTaskVO） */
export interface MyPerfTask {
  departmentName: string | null;
  planId: string;
  planName: string;
  position: string | null;
  revieweeName: string;
  reviewerRecordId: string;
  reviewerType: PerfReviewerType;
  reviewerTypeText: string;
  submitStatus: 0 | 1;
  taskId: string;
}

/** 我的考核结果（对齐后端 PerfTaskVO，被考核视角） */
export interface MyPerfResult {
  departmentName: string | null;
  employeeId: string;
  employeeName: string;
  finalScore: number | null;
  grade: string | null;
  id: string;
  managerTotal: number | null;
  peerProgress: string;
  peerTotal: number | null;
  planId: string;
  planName: string;
  position: string | null;
  selfTotal: number | null;
  taskStatus: PerfTaskStatus;
  taskStatusText: string;
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
  category: number;
  categoryText: string;
  indicatorId: string;
  maxScore: number;
  myComment: string | null;
  myScore: number | null;
  name: string;
  scoringType: number;
  scoringTypeText: string;
  weight: number;
}

/** 任务详情（对齐后端 PerfTaskDetailVO） */
export interface PerfTaskDetail {
  canSubmit: boolean;
  departmentName: string | null;
  employeeName: string;
  finalScore: number | null;
  grade: string | null;
  id: string;
  managerTotal: number | null;
  managerWeight: number;
  myReviewerType: PerfReviewerType | null;
  myReviewerTypeText: string | null;
  mySubmitted: boolean;
  peerTotal: number | null;
  peerWeight: number;
  planId: string;
  planName: string;
  position: string | null;
  reviewers: PerfReviewerProgress[];
  scoreItems: PerfScoreInput[] | null;
  selfTotal: number | null;
  selfWeight: number;
  taskStatus: PerfTaskStatus;
  taskStatusText: string;
}

/** 提交评分入参 */
export interface PerfScoreSubmitPayload {
  items: { comment?: string; indicatorId: number | string; score: number }[];
  taskId: number | string;
}

/** 我的评价待办 */
export function getMyPerfTasks() {
  return request.get<any, ApiResult<MyPerfTask[]>>('performance/task/my');
}

/** 我的考核结果（被考核视角） */
export function getMyPerfResults() {
  return request.get<any, ApiResult<MyPerfResult[]>>('performance/task/mine');
}

/** 任务详情（含三方进度与我的评分录入） */
export function getPerfTaskDetail(taskId: number | string) {
  return request.get<any, ApiResult<PerfTaskDetail>>('performance/task/detail', { params: { taskId } });
}

/** 提交评分 */
export function submitPerfScore(data: PerfScoreSubmitPayload) {
  return request.post<any, ApiResult<boolean>>('performance/task/submitScore', data);
}
