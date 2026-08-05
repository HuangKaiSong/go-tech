export type FeedbackStatus = 'developing' | 'pending' | 'shipped';
export type FeedbackView = 'active' | 'completed' | 'trash';

export interface FeedbackPost {
  author: string;
  commentCount: number;
  createdAt: string;
  deletedAt: string | null;
  description: string;
  email: string;
  id: string;
  status: FeedbackStatus;
  title: string;
}

export interface OfficialReply {
  author: string;
  content: string;
  createdAt: string;
  deletedAt: string | null;
  id: string;
  isOfficial: true;
}

export interface FeedbackComment {
  author: string;
  content: string;
  createdAt: string;
  deletedAt: string | null;
  id: string;
  isVisible: boolean;
  reply: OfficialReply | null;
}

export interface FeedbackDetail {
  comments: FeedbackComment[];
  featureReply: OfficialReply | null;
}

export interface TrashedComment {
  author: string;
  content: string;
  createdAt: string;
  deletedAt: string | null;
  featureId: string;
  featureTitle: string;
  id: string;
  isOfficial: boolean;
  parentId: string | null;
}

export interface PageData<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export interface FeedbackCounts {
  completed: number;
  deletedComments: number;
  deletedFeatures: number;
  trash: number;
}
