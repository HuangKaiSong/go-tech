import type { Document } from '@langchain/core/documents';

import { getRagConfig } from './config';
import type { LongTermMemory } from './memory';
import type { VectorStores } from './vector-store';

function formatDocuments(title: string, documents: Document[]) {
  if (documents.length === 0) return `${title}：无`;

  const items = documents.map((document, index) => {
    const featureId = document.metadata.feature_id;
    const source = featureId ? `feature_id=${String(featureId)}` : String(document.metadata.source ?? 'unknown');
    return `[${index + 1}] (${source})\n${document.pageContent}`;
  });

  return `${title}：\n${items.join('\n\n')}`;
}

function extractLikeFilter(question: string) {
  const match = question.match(
    /(?:like_count|点赞|點讚|赞数|讚數|讚好數)[^\d<>]{0,10}(大于|大於|超过|超過|高于|高於|至少|不低于|不低於|>=|>)\s*(\d+)/i
  );
  if (!match) return undefined;

  const operator = match[1];
  const minimum = Number.parseInt(match[2], 10);
  return {
    minimum,
    inclusive: operator === '至少' || operator === '不低于' || operator === '不低於' || operator === '>='
  };
}

function extractCommentFilter(question: string) {
  const match = question.match(
    /(?:comment_count|评论数|評論數|评论|評論)[^\d<>]{0,10}(大于|大於|超过|超過|高于|高於|至少|不低于|不低於|>=|>)\s*(\d+)/i
  );
  if (!match) return undefined;

  const operator = match[1];
  const minimum = Number.parseInt(match[2], 10);
  return {
    minimum,
    inclusive: operator === '至少' || operator === '不低于' || operator === '不低於' || operator === '>='
  };
}

function asksAboutTrash(question: string) {
  return /回收站|垃圾桶|已刪除|已删除|被刪除|被删除|軟刪除|软删除|deleted|trash|recycle\s*bin/i.test(question);
}

// oxlint-disable-next-line max-params
export async function buildContext(
  question: string,
  userId: string,
  stores: VectorStores,
  longTermMemory: LongTermMemory
) {
  const config = getRagConfig();
  const likeFilter = extractLikeFilter(question);
  const commentFilter = extractCommentFilter(question);
  const trashIntent = asksAboutTrash(question);
  const [knowledge, memories, filteredByLikes, filteredByComments, trash] = await Promise.all([
    trashIntent
      ? Promise.resolve([])
      : stores.knowledge.similaritySearch(question, config.knowledgeLimit, { is_deleted: false }),
    longTermMemory.recall(userId, question, config.memoryLimit),
    likeFilter ? stores.findKnowledgeByLikes(likeFilter.minimum, likeFilter.inclusive) : Promise.resolve([]),
    commentFilter
      ? stores.findKnowledgeByComments(commentFilter.minimum, commentFilter.inclusive)
      : Promise.resolve([]),
    trashIntent ? stores.findTrashKnowledge() : Promise.resolve(undefined)
  ]);

  return [
    formatDocuments('知识库语义检索结果', knowledge),
    likeFilter
      ? formatDocuments(
          `按点赞数精确过滤结果（like_count ${likeFilter.inclusive ? '>=' : '>'} ${likeFilter.minimum}）`,
          filteredByLikes
        )
      : '',
    commentFilter
      ? formatDocuments(
          `按评论数精确过滤结果（comment_count ${commentFilter.inclusive ? '>=' : '>'} ${commentFilter.minimum}）`,
          filteredByComments
        )
      : '',
    trash
      ? formatDocuments(
          `回收站精确结果（共 ${trash.total} 条：被删除需求 ${trash.deletedFeatures} 条、被删除评论 ${trash.deletedComments} 条）`,
          trash.documents
        )
      : '',
    formatDocuments('与当前用户相关的长期记忆', memories)
  ]
    .filter(Boolean)
    .join('\n\n');
}

export function augmentQuestion(question: string, context: string) {
  return `<retrieved-context>\n${context}\n</retrieved-context>\n\n<user-question>\n${question}\n</user-question>`;
}
