import { AIMessage, HumanMessage } from '@langchain/core/messages';

import { createAideAgent } from './agent';
import { augmentQuestion, buildContext } from './context';
import { LongTermMemory } from './memory';
import { createVectorStores } from './vector-store';

export interface FeedbackChatMessage {
  content: string;
  role: 'assistant' | 'user';
}

export interface StreamFeedbackAnswerInput {
  history?: FeedbackChatMessage[];
  question: string;
  userId: string;
}

function contentToText(content: unknown) {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';

  return content
    .filter(block => block && typeof block === 'object' && block.type === 'text' && typeof block.text === 'string')
    .map(block => block.text)
    .join('');
}

/**
 * Runs one RAG turn and yields only model text tokens. The caller owns chat-history persistence; long-term memory
 * remains isolated by userId in PostgreSQL.
 */
export async function* streamFeedbackAnswer({ history = [], question, userId }: StreamFeedbackAnswerInput) {
  const stores = await createVectorStores();

  try {
    const longTermMemory = new LongTermMemory(stores.longTermMemory);
    const context = await buildContext(question, userId, stores, longTermMemory);
    const messages = history.map(message =>
      message.role === 'user' ? new HumanMessage(message.content) : new AIMessage(message.content)
    );
    messages.push(new HumanMessage(augmentQuestion(question, context)));

    const agent = createAideAgent(userId, stores, longTermMemory);
    const stream = await agent.stream(
      { messages },
      {
        streamMode: 'messages'
      }
    );

    for await (const [message] of stream) {
      // oxlint-disable-next-line no-continue
      if (message.getType() !== 'ai') continue;

      const text = contentToText(message.content);
      if (text) yield text;
    }
  } finally {
    await stores.close();
  }
}
