import type { ApiResult } from '@/api/auth';
import request from '@/lib/request';

/** 会话（后端 ConversationVO；id 等为字符串化的 Long） */
export interface Conversation {
  avatar: string;
  id: string; lastMessage?: string | null;
  lastTime?: string | null;
  memberCount?: number | null;
  muted?: boolean;
  // 1单聊 2群聊
  name: string;
  ownerId?: string | null;
  type: 1 | 2;
  unread: number;
}

/** 消息（后端 MessageVO） */
export interface ChatMessage {
  content: string;
  createTime: string;
  id: string;
  /** 图片URL（msgType=2 时有值） */
  imageUrl?: string | null;
  mine: boolean;
  /** 消息类型 1文本 2图片 */
  msgType?: number;
  /** 对方是否已读（仅单聊本人消息有值，群聊/对方消息为 null） */
  read?: boolean | null;
  /** 已读人数（仅群聊本人消息有值，不含本人） */
  readCount?: number | null;
  senderId: string;
  senderName?: string;
  /** 应读人数（仅群聊本人消息有值，群成员数减本人） */
  totalReaders?: number | null;
}

/** 会话成员（后端 ChatMemberVO） */
export interface ChatMember {
  department?: string;
  mine: boolean;
  name?: string;
  owner: boolean;
  position?: string;
  userId: string;
}

export function getConversations() {
  return request.get<any, ApiResult<Conversation[]>>('chat/conversations');
}

export function getMessages(conversationId: string | number, afterId?: string | number) {
  return request.get<any, ApiResult<ChatMessage[]>>('chat/messages', {
    params: { conversationId, afterId }
  });
}

export function sendMessage(conversationId: string | number, content: string) {
  return request.post<any, ApiResult<ChatMessage>>('chat/send', { conversationId, content });
}

/** 发送图片消息（multipart 上传） */
export function sendImageMessage(conversationId: string | number, file: File) {
  const fd = new FormData();
  fd.append('file', file);
  // 不手动设 Content-Type：axios 传 FormData 会自动带上正确的 multipart boundary
  return request.post<any, ApiResult<ChatMessage>>('chat/sendImage', fd, {
    params: { conversationId }
  });
}

export function markConversationRead(conversationId: string | number) {
  return request.post<any, ApiResult<boolean>>('chat/read', null, { params: { conversationId } });
}

export function startDirect(targetUserId: string | number) {
  return request.post<any, ApiResult<number>>('chat/startDirect', null, { params: { targetUserId } });
}

export function createGroup(name: string, memberIds: number[]) {
  return request.post<any, ApiResult<number>>('chat/createGroup', { name, memberIds });
}

export function getChatMembers(conversationId: string | number) {
  return request.get<any, ApiResult<ChatMember[]>>('chat/members', { params: { conversationId } });
}

export function leaveConversation(conversationId: string | number) {
  return request.post<any, ApiResult<boolean>>('chat/leave', null, { params: { conversationId } });
}

export function dissolveGroup(conversationId: string | number) {
  return request.post<any, ApiResult<boolean>>('chat/dissolve', null, { params: { conversationId } });
}

export function addGroupMembers(conversationId: string | number, memberIds: number[]) {
  return request.post<any, ApiResult<boolean>>('chat/addMembers', { conversationId, memberIds });
}

export function removeGroupMember(conversationId: string | number, memberId: string | number) {
  return request.post<any, ApiResult<boolean>>('chat/removeMember', null, { params: { conversationId, memberId } });
}

export function muteConversation(conversationId: string | number, muted: boolean) {
  return request.post<any, ApiResult<boolean>>('chat/mute', null, { params: { conversationId, muted } });
}
