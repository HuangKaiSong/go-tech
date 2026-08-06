import { ChatOpenAI } from '@langchain/openai';

import { getChatConfig } from './config';

export function createChatModel() {
  const config = getChatConfig();

  return new ChatOpenAI({
    model: config.model,
    apiKey: config.apiKey,
    temperature: 0,
    streamUsage: false,
    configuration: {
      baseURL: 'https://api.deepseek.com'
    }
  });
}
