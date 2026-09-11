import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Textarea,
  toast
} from '@go-tech-frontend/ui';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bot, History, MessageSquarePlus, Send, Sparkles, Square, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import {
  deleteAssistantConversation,
  getAssistantConversation,
  getAssistantConversations,
  streamAssistantAnswer
} from './assistant-api';
import type { AssistantConversation, AssistantHistoryMessage } from './assistant-api';
import { AssistantMarkdown } from './AssistantMarkdown';

interface ChatMessage extends AssistantHistoryMessage {
  id: string;
}

const quickQuestions = ['找出點讚大於 50 的需求', '按評論數列出前 10 筆需求', '最近有哪些值得優先處理的反饋？'];

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function createMessage(role: ChatMessage['role'], content: string): ChatMessage {
  return { id: uid(), role, content };
}

function LoadingLine({ className }: { className: string }) {
  return (
    <span className={`relative block h-3.5 overflow-hidden rounded-full bg-muted ${className}`}>
      <span className="absolute inset-0 -translate-x-[120%] animate-[feedback-assistant-shimmer_1.35s_ease-in-out_infinite] bg-linear-to-r from-transparent via-primary/20 to-transparent motion-reduce:animate-none" />
    </span>
  );
}

function MessageLoading() {
  return (
    <span className="block w-full max-w-md space-y-2.5 py-1" role="status" aria-live="polite">
      <span className="sr-only">正在查詢知識庫...</span>
      <LoadingLine className="w-full" />
      <LoadingLine className="w-[86%]" />
      <LoadingLine className="w-[62%]" />
    </span>
  );
}

function MessageContent({ message }: { message: ChatMessage }) {
  if (!message.content) return <MessageLoading />;
  if (message.role === 'assistant') return <AssistantMarkdown content={message.content} />;
  return message.content;
}

export function FeedbackAssistant() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pending, setPending] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string>();
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const conversationsQuery = useQuery({
    queryKey: ['feedback-assistant', 'conversations'],
    queryFn: getAssistantConversations,
    enabled: open && Boolean(token)
  });
  const conversationQuery = useQuery({
    queryKey: ['feedback-assistant', 'conversation', activeConversationId],
    queryFn: () => getAssistantConversation(activeConversationId!),
    enabled: open && !pending && Boolean(token && activeConversationId)
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  useEffect(() => () => abortControllerRef.current?.abort(), []);

  useEffect(() => {
    if (!conversationQuery.data || pending) return;
    setMessages(conversationQuery.data.messages.map(message => createMessage(message.role, message.content)));
  }, [conversationQuery.data, pending]);

  const updateAssistantMessage = (id: string, update: (content: string) => string) => {
    setMessages(current =>
      current.map(message => (message.id === id ? { ...message, content: update(message.content) } : message))
    );
  };

  const send = async (suggestion?: string) => {
    const question = (suggestion ?? draft).trim();
    if (!question || pending || !token) return;

    const history = messages.slice(-16).map(({ content, role }) => ({ content, role }));
    const assistantMessage = createMessage('assistant', '');
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setDraft('');
    setPending(true);
    setMessages(current => [...current, createMessage('user', question), assistantMessage]);

    try {
      let responseConversationId = activeConversationId;
      await streamAssistantAnswer({
        conversationId: activeConversationId,
        history,
        onConversation: conversation => {
          responseConversationId = conversation.id;
          setActiveConversationId(conversation.id);
          queryClient.setQueryData<AssistantConversation[]>(['feedback-assistant', 'conversations'], current => {
            if (current?.some(item => item.id === conversation.id)) return current;
            const timestamp = new Date().toISOString();
            return [
              {
                id: conversation.id,
                title: conversation.title,
                created_at: timestamp,
                updated_at: timestamp,
                message_count: 0
              },
              ...(current ?? [])
            ];
          });
        },
        onToken: chunk => updateAssistantMessage(assistantMessage.id, content => content + chunk),
        question,
        signal: controller.signal
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['feedback-assistant', 'conversations'] }),
        queryClient.invalidateQueries({ queryKey: ['feedback-assistant', 'conversation', responseConversationId] })
      ]);
    } catch (error) {
      const aborted = error instanceof DOMException && error.name === 'AbortError';
      updateAssistantMessage(assistantMessage.id, content => {
        if (content) return content;
        return aborted ? '已停止生成。' : `無法取得回答：${error instanceof Error ? error.message : '未知錯誤'}`;
      });
    } finally {
      if (abortControllerRef.current === controller) abortControllerRef.current = null;
      setPending(false);
    }
  };

  const startNewConversation = () => {
    abortControllerRef.current?.abort();
    setActiveConversationId(undefined);
    setMessages([]);
    setDraft('');
  };

  const removeConversation = async (id: string) => {
    if (!token || pending) return;
    try {
      await deleteAssistantConversation(id);
      if (activeConversationId === id) startNewConversation();
      await queryClient.invalidateQueries({ queryKey: ['feedback-assistant', 'conversations'] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '刪除歷史對話失敗');
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) abortControllerRef.current?.abort();
    setOpen(nextOpen);
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Sparkles />
        AI 助手
      </Button>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="grid h-[min(800px,90vh)] max-w-6xl grid-rows-[auto_minmax(0,1fr)] gap-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="text-primary" />
              需求反饋 AI 助手
            </DialogTitle>
            <DialogDescription>
              可以語義搜尋需求(暂时不能叫AI助手, 现在只能检索数据,现阶段只能叫RAG. 暂时不能处理文件)
            </DialogDescription>
          </DialogHeader>

          <div className="grid min-h-0 gap-4 md:grid-cols-[240px_minmax(0,1fr)]">
            <aside className="flex min-h-0 flex-col rounded-lg border bg-muted/20 p-2">
              <Button
                className="mb-2 justify-start"
                disabled={pending}
                variant="outline"
                onClick={startNewConversation}
              >
                <MessageSquarePlus />
                新對話
              </Button>
              <div className="mb-1 flex items-center gap-2 px-2 py-1 text-xs font-medium text-muted-foreground">
                <History className="size-3.5" />
                歷史對話
              </div>
              <div className="min-h-0 space-y-1 overflow-y-auto">
                {conversationsQuery.isPending && <p className="px-2 py-3 text-xs text-muted-foreground">載入中...</p>}
                {conversationsQuery.isError && <p className="px-2 py-3 text-xs text-destructive">歷史對話載入失敗</p>}
                {conversationsQuery.data?.map(conversation => (
                  <div
                    key={conversation.id}
                    className={`group flex items-center rounded-md ${
                      activeConversationId === conversation.id ? 'bg-accent' : 'hover:bg-accent/60'
                    }`}
                  >
                    <button
                      className="min-w-0 flex-1 px-2 py-2 text-left"
                      disabled={pending}
                      onClick={() => setActiveConversationId(conversation.id)}
                      type="button"
                    >
                      <span className="block truncate text-sm">{conversation.title}</span>
                      <span className="block text-xs text-muted-foreground">
                        {conversation.message_count / 2} 輪對話
                      </span>
                    </button>
                    <Button
                      aria-label={`刪除對話：${conversation.title}`}
                      className="mr-1 size-7 opacity-0 group-hover:opacity-100 focus:opacity-100"
                      size="icon"
                      variant="ghost"
                      onClick={() => removeConversation(conversation.id)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </aside>

            <section className="grid min-h-0 grid-rows-[minmax(0,1fr)_auto] gap-3">
              <div className="min-h-0 space-y-4 overflow-y-auto rounded-lg border bg-muted/20 p-4">
                {conversationQuery.isFetching && activeConversationId && <MessageLoading />}
                {messages.length === 0 && !conversationQuery.isFetching && (
                  <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                    <Sparkles className="size-9 text-primary" />
                    <div>
                      <p className="font-medium">詢問產品反饋知識庫</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        回答會使用已同步到 PostgreSQL 的最新知識切片。
                      </p>
                    </div>
                    <div className="flex max-w-xl flex-wrap justify-center gap-2">
                      {quickQuestions.map(question => (
                        <Button key={question} variant="outline" size="sm" onClick={() => send(question)}>
                          {question}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
                {messages.map(message => (
                  <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`break-words rounded-xl px-4 py-3 text-sm shadow-xs ${
                        message.role === 'user'
                          ? 'max-w-[82%] whitespace-pre-wrap bg-primary text-primary-foreground'
                          : 'w-full border bg-background text-foreground'
                      }`}
                    >
                      <MessageContent message={message} />
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div className="space-y-2">
                <Textarea
                  aria-label="向需求反饋 AI 助手提問"
                  className="min-h-24 resize-none"
                  disabled={pending}
                  maxLength={4000}
                  placeholder="例如：找出評論數大於 10 的需求，並摘要它們的問題..."
                  value={draft}
                  onChange={event => setDraft(event.target.value)}
                  onKeyDown={event => {
                    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                      event.preventDefault();
                      send();
                    }
                  }}
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Ctrl / ⌘ + Enter 發送</span>
                  {pending ? (
                    <Button variant="outline" onClick={() => abortControllerRef.current?.abort()}>
                      <Square />
                      停止
                    </Button>
                  ) : (
                    <Button disabled={!draft.trim() || !token} onClick={() => send()}>
                      <Send />
                      發送
                    </Button>
                  )}
                </div>
              </div>
            </section>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
