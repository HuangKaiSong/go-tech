import { randomUUID } from 'node:crypto';

import { Document } from '@langchain/core/documents';
import { AIMessage, BaseMessage, HumanMessage } from '@langchain/core/messages';

import { getRagConfig } from './config';
import type { VectorStores } from './vector-store';

export type ConversationMessage = BaseMessage;

export class ShortTermMemory {
  private readonly conversations = new Map<string, ConversationMessage[]>();
  private readonly maxMessages: number;

  constructor(maxTurns = getRagConfig().shortTermMaxTurns) {
    this.maxMessages = maxTurns * 2;
  }

  get(threadId: string) {
    return [...(this.conversations.get(threadId) ?? [])];
  }

  addTurn(threadId: string, userMessage: string, assistantMessage: string) {
    const messages = this.conversations.get(threadId) ?? [];
    messages.push(new HumanMessage(userMessage), new AIMessage(assistantMessage));
    this.conversations.set(threadId, messages.slice(-this.maxMessages));
  }

  clear(threadId: string) {
    this.conversations.delete(threadId);
  }
}

export class LongTermMemory {
  private readonly store: VectorStores['longTermMemory'];

  constructor(store: VectorStores['longTermMemory']) {
    this.store = store;
  }

  async remember(userId: string, content: string) {
    const normalizedContent = content.trim();
    if (!normalizedContent) throw new Error('长期记忆内容不能为空');

    const id = randomUUID();
    await this.store.addDocuments(
      [
        new Document({
          pageContent: normalizedContent,
          metadata: {
            source: 'long_term_memory',
            user_id: userId,
            created_at: new Date().toISOString()
          }
        })
      ],
      { ids: [id] }
    );

    return id;
  }

  recall(userId: string, query: string, limit = getRagConfig().memoryLimit) {
    return this.store.similaritySearch(query, limit, { user_id: userId });
  }
}
