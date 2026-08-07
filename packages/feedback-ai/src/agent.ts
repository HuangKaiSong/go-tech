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
        `[${index + 1}] feature_id=${String(document.metadata.feature_id ?? 'unknown')}, like_count=${String(document.metadata.like_count ?? 'unknown')}, comment_count=${String(document.metadata.comment_count ?? 'unknown')}, is_deleted=${String(document.metadata.is_deleted ?? false)}, deleted_comment_count=${String(document.metadata.deleted_comment_count ?? 0)}\n${document.pageContent}`
    )
    .join('\n\n');
}

export function createAideAgent(userId: string, stores: VectorStores, longTermMemory: LongTermMemory) {
  const searchKnowledge = tool(
    async ({ limit, query, scope }) => {
      const filter = scope === 'all' ? undefined : { is_deleted: scope === 'trash' };
      const documents = await stores.knowledge.similaritySearch(query, limit, filter);
      return formatSearchResults(documents);
    },
    {
      name: 'search_knowledge',
      description: '在产品反馈知识库中进行语义检索。当前上下文不足以回答时使用。',
      schema: z.object({
        query: z.string().min(1).describe('检索问题或关键词'),
        limit: z.number().int().min(1).max(10).default(4).describe('最多返回的结果数'),
        scope: z.enum(['active', 'trash', 'all']).default('active').describe('active 为有效需求，trash 为被删除需求')
      })
    }
  );
  const filterTrash = tool(
    async ({ limit }) => {
      const result = await stores.findTrashKnowledge(limit);
      const summary = `回收站共有 ${result.total} 条数据：被删除需求 ${result.deletedFeatures} 条、被删除评论 ${result.deletedComments} 条。`;
      return result.documents.length > 0 ? `${summary}\n\n${formatSearchResults(result.documents)}` : summary;
    },
    {
      name: 'filter_trash',
      description: '精确查询回收站（软删除）数据，并分别统计被删除需求和被删除评论。涉及回收站或删除状态时必须使用。',
      schema: z.object({
        limit: z.number().int().min(1).max(100).default(100).describe('最多返回的关联需求数')
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
    tools: [searchKnowledge, filterByLikes, filterByComments, filterTrash, recallMemory, saveMemory],
    systemPrompt: SYSTEM_PROMPT
  });
}
