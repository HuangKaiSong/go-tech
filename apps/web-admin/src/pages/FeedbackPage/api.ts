import type {
  FeedbackComment,
  FeedbackCounts,
  FeedbackDetail,
  FeedbackPost,
  FeedbackStatus,
  FeedbackView,
  OfficialReply,
  PageData,
  TrashedComment
} from './types';

const API_BASE = '/h5-hook/api/feedback/features/admin';

interface ApiResponse<T> {
  data?: T;
  message?: string;
  success: boolean;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, init);
  const result = (await response.json().catch(() => null)) as ApiResponse<T> | null;
  if (!response.ok || !result?.success || result.data === undefined) {
    throw new Error(result?.message || '請求失敗');
  }
  return result.data;
}

export function getFeedbackCounts() {
  return request<FeedbackCounts>('/counts');
}

export function getFeedbackPosts(params: {
  page: number;
  pageSize: number;
  q: string;
  status: FeedbackStatus | 'all';
  view: FeedbackView;
}) {
  const search = new URLSearchParams({
    page: String(params.page),
    pageSize: String(params.pageSize),
    view: params.view
  });
  if (params.q) search.set('q', params.q);
  if (params.status !== 'all') search.set('status', params.status);
  return request<PageData<FeedbackPost>>(`?${search}`);
}

export function getTrashedComments(params: {
  page: number;
  pageSize: number;
  q: string;
  status: FeedbackStatus | 'all';
}) {
  const search = new URLSearchParams({ page: String(params.page), pageSize: String(params.pageSize), scope: 'trash' });
  if (params.q) search.set('q', params.q);
  if (params.status !== 'all') search.set('status', params.status);
  return request<PageData<TrashedComment>>(`/comments?${search}`);
}

export function getFeedbackDetail(id: string) {
  return request<FeedbackDetail>(`/${id}/comments`);
}

export function updateFeedbackStatus(id: string, status: FeedbackStatus) {
  return request<{ id: string; status: FeedbackStatus }>(`/${id}/status`, {
    body: JSON.stringify({ status }),
    headers: { 'Content-Type': 'application/json' },
    method: 'PATCH'
  });
}

export function saveOfficialReply(featureId: string, content: string, parentId?: string) {
  return request<OfficialReply>(`/${featureId}/reply`, {
    body: JSON.stringify({ content, parentId }),
    headers: { 'Content-Type': 'application/json' },
    method: 'PUT'
  });
}

export function trashFeedback(id: string) {
  return request<{ deleted: boolean; id: string }>(`/${id}`, { method: 'DELETE' });
}

export function restoreFeedback(id: string) {
  return request<{ deleted: boolean; id: string }>(`/${id}/restore`, { method: 'POST' });
}

export function trashComment(id: string) {
  return request<{ deleted: boolean; id: string }>(`/comments/${id}`, { method: 'DELETE' });
}

export function restoreComment(id: string) {
  return request<{ deleted: boolean; id: string }>(`/comments/${id}/restore`, { method: 'POST' });
}

export type { FeedbackComment };
