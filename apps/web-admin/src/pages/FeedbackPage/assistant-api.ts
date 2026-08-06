import { API_BASE } from './api';

export interface AssistantHistoryMessage {
  content: string;
  role: 'assistant' | 'user';
}

interface AssistantStreamEvent {
  content?: string;
  message?: string;
  type: 'done' | 'error' | 'token';
}

interface StreamAssistantOptions {
  history: AssistantHistoryMessage[];
  onToken: (token: string) => void;
  question: string;
  signal: AbortSignal;
}

function readMessage(value: unknown) {
  if (!value || typeof value !== 'object' || !('message' in value)) return undefined;
  return typeof value.message === 'string' ? value.message : undefined;
}

export async function streamAssistantAnswer({ history, onToken, question, signal }: StreamAssistantOptions) {
  const response = await fetch(`${API_BASE}/assistant/chat`, {
    body: JSON.stringify({ history, question }),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
    signal
  });

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as unknown;
    throw new Error(readMessage(error) || 'AI 助手請求失敗');
  }
  if (!response.body) throw new Error('瀏覽器不支援串流回應');

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  const processBlock = (block: string) => {
    const data = block
      .split('\n')
      .filter(line => line.startsWith('data:'))
      .map(line => line.slice(5).trimStart())
      .join('\n');
    if (!data) return false;

    const event = JSON.parse(data) as AssistantStreamEvent;
    if (event.type === 'token' && event.content) onToken(event.content);
    if (event.type === 'error') throw new Error(event.message || 'AI 助手暫時無法回應');
    return event.type === 'done';
  };

  while (true) {
    // oxlint-disable-next-line no-await-in-loop
    const { done, value } = await reader.read();
    buffer += decoder.decode(value, { stream: !done }).replaceAll('\r\n', '\n');

    let boundary = buffer.indexOf('\n\n');
    while (boundary >= 0) {
      const block = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      if (processBlock(block)) return;
      boundary = buffer.indexOf('\n\n');
    }

    if (done) {
      if (buffer.trim()) processBlock(buffer);
      return;
    }
  }
}
