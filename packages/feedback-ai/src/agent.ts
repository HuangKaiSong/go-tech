import { createDeepAgent } from 'deepagents';
import { tool } from 'langchain';
import { z } from 'zod';

import type { LongTermMemory } from './memory';
import { createChatModel } from './model';
import { SYSTEM_PROMPT } from './prompt';
import type { VectorStores } from './vector-store';

function formatSearchResults(documents: Awaited<ReturnType<VectorStores['knowledge']['similaritySearch']>>) {
  if (documents.length === 0) return '没有找到相关内容。';

  return documents
    .map(
      (document, index) =>
        `[${index + 1}] feature_id=${String(document.metadata.feature_id ?? 'unknown')}, like_count=${String(document.metadata.like_count ?? 'unknown')}, comment_count=${String(document.metadata.comment_count ?? 'unknown')}\n${document.pageContent}`
    )
    .join('\n\n');
}

export function createAideAgent(userId: string, stores: VectorStores, longTermMemory: LongTermMemory) {
  const searchKnowledge = tool(
    async ({ limit, query }) => {
      const documents = await stores.knowledge.similaritySearch(query, limit);
      return formatSearchResults(documents);
    },
    {
      name: 'search_knowledge',
      description: '在产品反馈知识库中进行语义检索。当前上下文不足以回答时使用。',
      schema: z.object({
        query: z.string().min(1).describe('检索问题或关键词'),
        limit: z.number().int().min(1).max(10).default(4).describe('最多返回的结果数')
      })
    }
  );
  const filterByLikes = tool(
    async ({ inclusive, limit, minimum }) => {
      const documents = await stores.findKnowledgeByLikes(minimum, inclusive, limit);
      return formatSearchResults(documents);
    },
    {
      name: 'filter_by_likes',
      description: '按产品反馈的 like_count 做精确数值过滤。用户询问点赞数范围时使用，不要用语义搜索代替。',
      schema: z.object({
        minimum: z.number().int().min(0).describe('点赞数下限'),
        inclusive: z.boolean().default(false).describe('true 表示大于等于，false 表示严格大于'),
        limit: z.number().int().min(1).max(100).default(100)
      })
    }
  );
  const filterByComments = tool(
    async ({ inclusive, limit, minimum }) => {
      const documents = await stores.findKnowledgeByComments(minimum, inclusive, limit);
      return formatSearchResults(documents);
    },
    {
      name: 'filter_by_comments',
      description:
        '按产品反馈的 comment_count 做精确数值过滤并按评论数降序返回。用户询问评论数范围或排行时使用；仅排行时设置 minimum=0。不要用语义搜索代替。',
      schema: z.object({
        minimum: z.number().int().min(0).describe('评论数下限'),
        inclusive: z.boolean().default(false).describe('true 表示大于等于，false 表示严格大于'),
        limit: z.number().int().min(1).max(100).default(100)
      })
    }
  );
  const recallMemory = tool(
    async ({ limit, query }) => {
      const documents = await longTermMemory.recall(userId, query, limit);
      return documents.length > 0 ? documents.map(item => item.pageContent).join('\n') : '没有相关长期记忆。';
    },
    {
      name: 'recall_memory',
      description: '召回当前用户的长期偏好或长期信息。',
      schema: z.object({
        query: z.string().min(1),
        limit: z.number().int().min(1).max(10).default(3)
      })
    }
  );
  const saveMemory = tool(
    async ({ content }) => {
      const id = await longTermMemory.remember(userId, content);
      return `长期记忆已保存，id=${id}`;
    },
    {
      name: 'save_memory',
      description: '保存用户明确要求记住的、非敏感且长期有效的信息。',
      schema: z.object({
        content: z.string().min(1).max(2000).describe('独立、清晰且可长期复用的记忆内容')
      })
    }
  );

  return createDeepAgent({
    model: createChatModel(),
    tools: [searchKnowledge, filterByLikes, filterByComments, recallMemory, saveMemory],
    systemPrompt: SYSTEM_PROMPT
  });
}
