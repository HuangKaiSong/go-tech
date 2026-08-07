import type { ApiResult } from '@/api/auth';
import request from '@/lib/request';

/** 参训人状态码：0未開始 1進行中 2已完成 3未通過 */
export type ParticipantStatus = 0 | 1 | 2 | 3;

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

/** 课程模组（对齐后端 TrainingModuleVO，含 done 标记与附件） */
export interface MyTrainingModule {
  content: string;
  contentType: 'image' | 'mixed' | 'ppt' | 'text' | 'video' | 'word';
  done: boolean;
  duration: number;
  files: { id: number; name: string; url: string; fileSize?: number }[];
  id: string;
  imageUrl: string | null;
  planId: string;
  required: boolean;
  sortOrder: number;
  title: string;
  videoUrl: string | null;
}

/** 我的培训详情（对齐后端 MyTrainingDetailVO） */
export interface MyTrainingDetail {
  modules: MyTrainingModule[];
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
