import request from "@/lib/request";
import type { ApiResult } from "@/api/auth";

/** 会话（后端 ConversationVO；id 等为字符串化的 Long） */
export interface Conversation {
  id: string;
  type: 1 | 2; // 1单聊 2群聊
  name: string;
  avatar: string;
  lastMessage?: string | null;
  lastTime?: string | null;
  unread: number;
  memberCount?: number | null;
  muted?: boolean;
  ownerId?: string | null;
}

/** 消息（后端 MessageVO） */
export interface ChatMessage {
  id: string;
  senderId: string;
  senderName?: string;
  content: string;
  mine: boolean;
  createTime: string;
  /** 对方是否已读（仅单聊本人消息有值，群聊/对方消息为 null） */
  read?: boolean | null;
  /** 已读人数（仅群聊本人消息有值，不含本人） */
  readCount?: number | null;
  /** 应读人数（仅群聊本人消息有值，群成员数减本人） */
  totalReaders?: number | null;
}

/** 会话成员（后端 ChatMemberVO） */
export interface ChatMember {
  userId: string;
  name?: string;
  department?: string;
  position?: string;
  owner: boolean;
  mine: boolean;
}

export function getConversations() {
  return request.get<any, ApiResult<Conversation[]>>("chat/conversations");
}

export function getMessages(conversationId: string | number, afterId?: string | number) {
  return request.get<any, ApiResult<ChatMessage[]>>("chat/messages", {
    params: { conversationId, afterId },
  });
}

export function sendMessage(conversationId: string | number, content: string) {
  return request.post<any, ApiResult<ChatMessage>>("chat/send", { conversationId, content });
}

export function markConversationRead(conversationId: string | number) {
  return request.post<any, ApiResult<boolean>>("chat/read", null, { params: { conversationId } });
}

export function startDirect(targetUserId: string | number) {
  return request.post<any, ApiResult<number>>("chat/startDirect", null, { params: { targetUserId } });
}

export function createGroup(name: string, memberIds: number[]) {
  return request.post<any, ApiResult<number>>("chat/createGroup", { name, memberIds });
}

export function getChatMembers(conversationId: string | number) {
  return request.get<any, ApiResult<ChatMember[]>>("chat/members", { params: { conversationId } });
}

export function leaveConversation(conversationId: string | number) {
  return request.post<any, ApiResult<boolean>>("chat/leave", null, { params: { conversationId } });
}

export function dissolveGroup(conversationId: string | number) {
  return request.post<any, ApiResult<boolean>>("chat/dissolve", null, { params: { conversationId } });
}

export function addGroupMembers(conversationId: string | number, memberIds: number[]) {
  return request.post<any, ApiResult<boolean>>("chat/addMembers", { conversationId, memberIds });
}

export function removeGroupMember(conversationId: string | number, memberId: string | number) {
  return request.post<any, ApiResult<boolean>>("chat/removeMember", null, { params: { conversationId, memberId } });
}

export function muteConversation(conversationId: string | number, muted: boolean) {
  return request.post<any, ApiResult<boolean>>("chat/mute", null, { params: { conversationId, muted } });
}
