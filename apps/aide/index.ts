// oxlint-disable-next-line import/no-unassigned-import
import 'dotenv/config';

import { createInterface } from 'node:readline/promises';

import { type FeedbackChatMessage, ingest, processPendingSyncJobs, streamFeedbackAnswer } from '@go-tech/feedback-ai';

function option(name: string, fallback: string) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

function positiveIntegerOption(name: string, fallback: number) {
  const value = Number.parseInt(option(name, String(fallback)), 10);
  if (!Number.isSafeInteger(value) || value <= 0) throw new Error(`--${name} 必须是正整数`);
  return value;
}

function delay(milliseconds: number) {
  return new Promise(resolve => {
    setTimeout(resolve, milliseconds);
  });
}

async function sync() {
  const watch = process.argv.includes('--watch');
  const limit = positiveIntegerOption('limit', 10);
  const interval = positiveIntegerOption('interval', 5_000);

  let keepRunning = true;
  while (keepRunning) {
    // oxlint-disable-next-line no-await-in-loop
    const result = await processPendingSyncJobs({ limit });
    if (result.processed > 0) {
      console.log(`增量同步完成：处理 ${result.processed}，成功 ${result.succeeded}，失败 ${result.failed}`);
    }
    keepRunning = watch;
    // oxlint-disable-next-line no-await-in-loop
    if (keepRunning) await delay(interval);
  }
}

async function chat() {
  const userId = option('user', 'local-user');
  const threadId = option('thread', 'default');
  const conversations = new Map<string, FeedbackChatMessage[]>();
  const readline = createInterface({ input: process.stdin, output: process.stdout });
  let inputClosed = false;
  readline.on('close', () => {
    inputClosed = true;
  });

  console.log(`Aide 已启动（user=${userId}, thread=${threadId}）。输入 /clear 清空短期记忆，/exit 退出。`);

  try {
    while (true) {
      if (inputClosed) break;
      // oxlint-disable-next-line no-await-in-loop
      const question = (await readline.question('\n你：')).trim();
      // oxlint-disable-next-line no-continue
      if (!question) continue;
      if (question === '/exit') break;
      if (question === '/clear') {
        conversations.delete(threadId);
        console.log('当前会话的短期记忆已清空。');
        // oxlint-disable-next-line no-continue
        continue;
      }

      let answer = '';
      process.stdout.write('Aide：');

      // oxlint-disable-next-line no-await-in-loop
      for await (const token of streamFeedbackAnswer({
        history: conversations.get(threadId),
        question,
        userId
      })) {
        answer += token;
        process.stdout.write(token);
      }
      process.stdout.write('\n');

      if (answer) {
        const messages = conversations.get(threadId) ?? [];
        const nextMessages: FeedbackChatMessage[] = [
          ...messages,
          { role: 'user', content: question },
          { role: 'assistant', content: answer }
        ];
        conversations.set(threadId, nextMessages.slice(-16));
      }
    }
  } finally {
    if (!inputClosed) readline.close();
  }
}

const command = process.argv[2] ?? 'chat';

if (command === 'ingest') {
  await ingest();
} else if (command === 'sync') {
  await sync();
} else if (command === 'chat') {
  await chat();
} else {
  throw new Error(`未知命令：${command}。可用命令：ingest、sync、chat`);
}
