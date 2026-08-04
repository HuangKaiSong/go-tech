import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import MobileLayout from "@/components/MobileLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  AlarmClock, ArrowLeft, Bell, BellOff, Check,
  CheckCheck, ChevronRight, Crown, DollarSign, FileCheck, Image,
  Info, Loader2, LogOut, MessageCircle, Mic, MoreVertical,
  Plus, Search, Send, Smile, Trash2, UserCheck, UserPlus, Users, X,
} from "lucide-react";
import {
  type AppNotification, getMyNotifications, markAllNotificationsRead,
  markNotificationRead,
} from "@/api/notification";
import {
  type ChatMember, type Conversation, addGroupMembers, createGroup,
  dissolveGroup, getChatMembers, getConversations, getMessages, leaveConversation,
  markConversationRead, muteConversation, removeGroupMember,
  sendMessage, startDirect,
} from "@/api/chat";
import { type DirectoryEmployee, getEmployeeDirectory } from "@/api/employee";

// ── Notification type → icon / color ──
const NOTIF_META: Record<string, { color: string; icon: typeof Info }> = {
  APPROVAL: { icon: FileCheck, color: "bg-success" },
  PAYROLL: { icon: DollarSign, color: "bg-primary" },
  ATTENDANCE: { icon: AlarmClock, color: "bg-warning" },
  ONBOARDING: { icon: UserCheck, color: "bg-info" },
  SYSTEM: { icon: Info, color: "bg-muted-foreground" },
};
const notifMeta = (type: string) => NOTIF_META[type] ?? NOTIF_META.SYSTEM;

/** ISO → 相对时间 */
const timeAgo = (iso?: string) => {
  if (!iso) return "";
  const t = new Date(iso.replace(" ", "T")).getTime();
  if (Number.isNaN(t)) return iso;
  const min = Math.floor((Date.now() - t) / 60000);
  if (min < 1) return "剛剛";
  if (min < 60) return `${min}分鐘前`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}小時前`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}天前`;
  return iso.slice(0, 10);
};

/** ISO → 会话/消息短时间：今天 HH:mm，本周内昨天/星期，更早 MM/DD */
const shortTime = (iso?: string | null) => {
  if (!iso) return "";
  const d = new Date(iso.replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return d.toTimeString().slice(0, 5);
  const diffDay = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDay <= 1) return "昨天";
  return `${d.getMonth() + 1}/${d.getDate()}`;
};

// ── Notification Tab ──
const NotificationTab = () => {
  const queryClient = useQueryClient();
  const { data: list = [], isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => (await getMyNotifications()).data ?? [],
  });
  const unread = list.filter((n) => !n.read).length;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
    queryClient.invalidateQueries({ queryKey: ["notificationsUnread"] });
  };
  const readOne = useMutation({ mutationFn: (id: number) => markNotificationRead(id), onSuccess: invalidate });
  const readAll = useMutation({ mutationFn: () => markAllNotificationsRead(), onSuccess: invalidate });

  if (isLoading) {
    return <div className="flex justify-center py-16 text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  }

  return (
    <div className="px-5 pt-4">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs text-muted-foreground">共 {unread} 條未讀</span>
        <button className="text-xs text-primary font-medium disabled:opacity-40" disabled={unread === 0 || readAll.isPending} onClick={() => readAll.mutate()}>全部標為已讀</button>
      </div>
      {list.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
          <Bell className="w-10 h-10 opacity-30" /><p className="text-sm">暫無通知</p>
        </div>
      ) : (
        <div className="space-y-2">
          {list.map((notif: AppNotification) => {
            const meta = notifMeta(notif.type);
            const Icon = meta.icon;
            return (
              <div key={notif.id} onClick={() => !notif.read && readOne.mutate(notif.id)}
                className={`bg-card rounded-xl border p-4 flex gap-3 ${notif.read ? "border-border" : "border-primary/30 bg-primary/[0.02] cursor-pointer"}`}>
                <div className={`w-11 h-11 rounded-lg ${meta.color} flex items-center justify-center shrink-0`}>
                  <Icon className="w-5 h-5 text-primary-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-foreground">{notif.title}</p>
                    {!notif.read && <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />}
                  </div>
                  {notif.content && <p className="text-xs text-muted-foreground mt-0.5">{notif.content}</p>}
                  <p className="text-[10px] text-muted-foreground/70 mt-1">{timeAgo(notif.createTime)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ── Chat List ──
const ChatList = ({ conversations, loading, onCreateGroup, onOpen }: {
  conversations: Conversation[];
  loading: boolean;
  onCreateGroup: () => void;
  onOpen: (c: Conversation) => void;
}) => {
  const [search, setSearch] = useState("");
  const filtered = conversations.filter((c) => c.name.includes(search));

  return (
    <div className="px-5 pt-4">
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="搜索聊天..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-sm rounded-lg" />
        </div>
        <Button size="sm" className="h-9 gap-1" onClick={onCreateGroup}><Plus className="w-4 h-4" /><span className="text-xs">建群</span></Button>
      </div>
      {loading ? (
        <div className="flex justify-center py-12 text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : (
        <div className="space-y-1">
          {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">暫無聊天記錄</p>}
          {filtered.map((chat) => (
            <div key={chat.id} onClick={() => onOpen(chat)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 cursor-pointer transition-colors">
              <div className="relative">
                <Avatar className="w-12 h-12">
                  <AvatarFallback className={`text-sm font-medium ${chat.type === 2 ? "bg-secondary text-secondary-foreground" : "bg-primary/10 text-primary"}`}>{chat.avatar}</AvatarFallback>
                </Avatar>
                {chat.type === 2 && <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-muted flex items-center justify-center"><Users className="w-2.5 h-2.5 text-muted-foreground" /></div>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground truncate">{chat.name}</p>
                  <span className="text-[10px] text-muted-foreground shrink-0">{shortTime(chat.lastTime)}</span>
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{chat.lastMessage || "暫無消息"}</p>
              </div>
              {chat.unread > 0 && <div className="w-5 h-5 rounded-full bg-destructive flex items-center justify-center shrink-0"><span className="text-[10px] text-destructive-foreground font-medium">{chat.unread}</span></div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Member Info Panel ──
const MemberInfoPanel = ({ member, onBack, onChat }: { member: ChatMember; onBack: () => void; onChat: () => void }) => (
  <div className="px-5 pt-4">
    <div className="flex items-center gap-3 mb-6">
      <button onClick={onBack} className="p-1"><ArrowLeft className="w-5 h-5 text-foreground" /></button>
      <h2 className="text-base font-semibold text-foreground">個人資料</h2>
    </div>
    <div className="flex flex-col items-center mb-6">
      <Avatar className="w-20 h-20 mb-3"><AvatarFallback className="text-2xl bg-primary/10 text-primary">{(member.name ?? "?").slice(0, 1)}</AvatarFallback></Avatar>
      <p className="text-lg font-semibold text-foreground">{member.name ?? "—"}</p>
      {member.position && <p className="text-sm text-muted-foreground">{member.position}</p>}
    </div>
    <div className="bg-card rounded-xl border p-4 space-y-3 mb-4">
      <div className="flex justify-between"><span className="text-xs text-muted-foreground">部門</span><span className="text-sm text-foreground">{member.department || "—"}</span></div>
      <Separator />
      <div className="flex justify-between"><span className="text-xs text-muted-foreground">職位</span><span className="text-sm text-foreground">{member.position || "—"}</span></div>
    </div>
    {!member.mine && <Button className="w-full gap-2" onClick={onChat}><MessageCircle className="w-4 h-4" />發送訊息</Button>}
  </div>
);

// ── Group Info Panel ──
const GroupInfoPanel = ({ conv, members, onAddMember, onBack, onDissolve, onLeave, onMemberClick, onRemoveMember, onToggleMute }: {
  conv: Conversation;
  members: ChatMember[];
  onAddMember: () => void;
  onBack: () => void;
  onDissolve: () => void;
  onLeave: () => void;
  onMemberClick: (m: ChatMember) => void;
  onRemoveMember: (m: ChatMember) => void;
  onToggleMute: () => void;
}) => {
  const isOwner = members.some((m) => m.mine && m.owner);
  const [confirmAction, setConfirmAction] = useState<"leave" | "dissolve" | null>(null);

  return (
    <div className="px-5 pt-4">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={onBack} className="p-1"><ArrowLeft className="w-5 h-5 text-foreground" /></button>
        <h2 className="text-base font-semibold text-foreground">群組資訊</h2>
      </div>

      <div className="flex flex-col items-center mb-5">
        <Avatar className="w-16 h-16 mb-2"><AvatarFallback className="text-xl font-medium bg-secondary text-secondary-foreground">{conv.avatar}</AvatarFallback></Avatar>
        <p className="text-lg font-semibold text-foreground">{conv.name}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{members.length} 位成員</p>
      </div>

      <div className="flex justify-center gap-6 mb-5">
        <button onClick={onAddMember} className="flex flex-col items-center gap-1">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"><UserPlus className="w-5 h-5 text-primary" /></div>
          <span className="text-[10px] text-muted-foreground">邀請</span>
        </button>
        <button onClick={onToggleMute} className="flex flex-col items-center gap-1">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            {conv.muted ? <BellOff className="w-5 h-5 text-muted-foreground" /> : <Bell className="w-5 h-5 text-muted-foreground" />}
          </div>
          <span className="text-[10px] text-muted-foreground">{conv.muted ? "已靜音" : "靜音"}</span>
        </button>
      </div>

      <div className="bg-card rounded-xl border mb-4">
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-sm font-medium text-foreground">成員列表</span>
          <span className="text-xs text-muted-foreground">{members.length} 人</span>
        </div>
        <Separator />
        <div className="max-h-64 overflow-y-auto">
          {members.map((m) => (
            <div key={m.userId} className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30 cursor-pointer transition-colors">
              <div className="flex-1 flex items-center gap-3" onClick={() => onMemberClick(m)}>
                <Avatar className="w-9 h-9"><AvatarFallback className="text-xs bg-primary/10 text-primary">{(m.name ?? "?").slice(0, 1)}</AvatarFallback></Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm text-foreground">{m.name}{m.mine && "（我）"}</p>
                    {m.owner && <Crown className="w-3 h-3 text-warning" />}
                  </div>
                  <p className="text-[10px] text-muted-foreground">{m.department || "—"} · {m.position || "—"}</p>
                </div>
              </div>
              {isOwner && !m.mine && !m.owner && (
                <button onClick={(e) => { e.stopPropagation(); onRemoveMember(m); }} className="p-1.5 rounded-md hover:bg-destructive/10 transition-colors" title="移除成員">
                  <X className="w-3.5 h-3.5 text-destructive" />
                </button>
              )}
              <ChevronRight className="w-4 h-4 text-muted-foreground/50 shrink-0" />
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2 pb-4">
        {!isOwner && (
          <Button variant="outline" className="w-full gap-2 text-destructive hover:text-destructive hover:bg-destructive/5 border-destructive/20" onClick={() => setConfirmAction("leave")}>
            <LogOut className="w-4 h-4" />退出群組
          </Button>
        )}
        {isOwner && (
          <Button variant="destructive" className="w-full gap-2" onClick={() => setConfirmAction("dissolve")}>
            <Trash2 className="w-4 h-4" />解散群組
          </Button>
        )}
      </div>

      <Dialog open={Boolean(confirmAction)} onOpenChange={() => setConfirmAction(null)}>
        <DialogContent className="max-w-xs mx-auto">
          <DialogHeader>
            <DialogTitle className="text-base">{confirmAction === "leave" ? "確認退出" : "確認解散"}</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {confirmAction === "leave"
                ? `確定要退出「${conv.name}」嗎？退出後將不再接收該群組的訊息。`
                : `確定要解散「${conv.name}」嗎？解散後所有成員將被移除，聊天記錄將被清除，此操作不可恢復。`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setConfirmAction(null)}>取消</Button>
            <Button variant="destructive" size="sm" onClick={() => { if (confirmAction === "leave") onLeave(); else onDissolve(); setConfirmAction(null); }}>
              {confirmAction === "leave" ? "退出" : "解散"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ── Chat Room ──
const ChatRoom = ({ conv, messages, onBack, onOpenInfo, onSend, sending }: {
  conv: Conversation;
  messages: import("@/api/chat").ChatMessage[];
  onBack: () => void;
  onOpenInfo: () => void;
  onSend: (text: string) => void;
  sending: boolean;
}) => {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // 键盘弹出时用 VisualViewport 把聊天区钉在可视区域（键盘上方），webview 里 100dvh 不生效才需要
  const [vv, setVv] = useState<{ height: number; top: number } | null>(null);
  useEffect(() => {
    const view = window.visualViewport;
    if (!view) return;
    const update = () => setVv({ height: view.height, top: view.offsetTop });
    update();
    view.addEventListener("resize", update);
    view.addEventListener("scroll", update);
    return () => {
      view.removeEventListener("resize", update);
      view.removeEventListener("scroll", update);
    };
  }, []);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages.length, vv?.height]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSend(input.trim());
    setInput("");
    // 发送后保持焦点，键盘不收起
    inputRef.current?.focus();
  };

  return (
    <div
      className="fixed left-0 right-0 z-50 mx-auto max-w-lg flex flex-col bg-background"
      style={vv ? { height: `${vv.height}px`, top: `${vv.top}px` } : { height: "100dvh", top: 0 }}
    >
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card shrink-0">
        <button onClick={onBack} className="p-1"><ArrowLeft className="w-5 h-5 text-foreground" /></button>
        <button onClick={onOpenInfo} className="flex items-center gap-3 flex-1 min-w-0">
          <Avatar className="w-9 h-9"><AvatarFallback className="text-xs bg-primary/10 text-primary">{conv.avatar}</AvatarFallback></Avatar>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-semibold text-foreground truncate">{conv.name}</p>
            <p className="text-[10px] text-muted-foreground">{conv.type === 2 ? `${conv.memberCount ?? 0} 位成員` : "單聊"}</p>
          </div>
        </button>
        <button className="p-2 rounded-lg hover:bg-muted" onClick={onOpenInfo}><MoreVertical className="w-4 h-4 text-muted-foreground" /></button>
      </div>

      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-3 bg-muted/30">
        {messages.length === 0 && <p className="text-center text-xs text-muted-foreground py-8">開始你們的對話吧</p>}
        {messages.map((msg) => {
          let groupReadBadge: ReactNode = null;
          if (msg.mine && conv.type === 2) {
            const total = msg.totalReaders ?? 0;
            const readCount = msg.readCount ?? 0;
            if (total === 0) {
              groupReadBadge = <span className="text-[9px] text-muted-foreground/50">—</span>;
            } else if (readCount >= total) {
              groupReadBadge = <span className="flex items-center gap-0.5 text-[9px] text-primary/70"><CheckCheck className="w-3 h-3" />全部已讀</span>;
            } else if (readCount === 0) {
              groupReadBadge = <span className="flex items-center gap-0.5 text-[9px] text-muted-foreground/50"><Check className="w-3 h-3" />未讀</span>;
            } else {
              groupReadBadge = <span className="text-[9px] text-primary/70">{msg.readCount}/{msg.totalReaders} 已讀</span>;
            }
          }
          return (
          <div key={msg.id} className={`flex ${msg.mine ? "justify-end" : "justify-start"}`}>
            <div className={`flex gap-2 max-w-[75%] ${msg.mine ? "flex-row-reverse" : ""}`}>
              {!msg.mine && <Avatar className="w-8 h-8 shrink-0 mt-1"><AvatarFallback className="text-[10px] bg-accent text-accent-foreground">{(msg.senderName ?? "?").slice(0, 1)}</AvatarFallback></Avatar>}
              <div>
                {!msg.mine && conv.type === 2 && <p className="text-[10px] text-muted-foreground mb-1 ml-1">{msg.senderName}</p>}
                <div className={`px-3 py-2 rounded-2xl text-sm ${msg.mine ? "bg-primary text-primary-foreground rounded-tr-md" : "bg-card text-foreground border border-border rounded-tl-md"}`}>{msg.content}</div>
                <div className={`flex items-center gap-1 mt-0.5 ${msg.mine ? "justify-end" : ""}`}>
                  <span className="text-[9px] text-muted-foreground/60">{shortTime(msg.createTime)}</span>
                  {msg.mine && conv.type === 1 && (
                    msg.read
                      ? <span className="flex items-center gap-0.5 text-[9px] text-primary/70"><CheckCheck className="w-3 h-3" />已讀</span>
                      : <span className="flex items-center gap-0.5 text-[9px] text-muted-foreground/50"><Check className="w-3 h-3" />未讀</span>
                  )}
                  {groupReadBadge}
                </div>
              </div>
            </div>
          </div>
          );
        })}
      </div>

      <div className="px-3 py-2 border-t border-border bg-card flex items-end gap-2 shrink-0">
        <button className="p-2 rounded-lg hover:bg-muted shrink-0"><Smile className="w-5 h-5 text-muted-foreground" /></button>
        <button className="p-2 rounded-lg hover:bg-muted shrink-0"><Image className="w-5 h-5 text-muted-foreground" /></button>
        <Input ref={inputRef} placeholder="輸入訊息..." value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())}
          className="flex-1 h-9 text-base rounded-full" />
        {input.trim() ? (
          <Button size="icon" className="w-9 h-9 rounded-full shrink-0" disabled={sending}
            onMouseDown={(e) => e.preventDefault()} onClick={handleSend}><Send className="w-4 h-4" /></Button>
        ) : (
          <button className="p-2 rounded-lg hover:bg-muted shrink-0"><Mic className="w-5 h-5 text-muted-foreground" /></button>
        )}
      </div>
    </div>
  );
};

// ── Member Picker（建群 / 邀请 共用） ──
const MemberPicker = ({ directory, excludeIds, onToggle, selected }: {
  directory: DirectoryEmployee[];
  excludeIds: Set<number>;
  onToggle: (id: number) => void;
  selected: number[];
}) => {
  const [search, setSearch] = useState("");
  const available = directory.filter((e) => !excludeIds.has(e.id));
  const filtered = available.filter((e) => (e.name ?? "").includes(search) || (e.department ?? "").includes(search));
  const nameOf = (id: number) => directory.find((e) => e.id === id)?.name ?? "";
  return (
    <>
      <Input placeholder="搜索同事..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 text-sm mb-2" />
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selected.map((id) => (
            <span key={id} onClick={() => onToggle(id)} className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full cursor-pointer hover:bg-primary/20">{nameOf(id)} ✕</span>
          ))}
        </div>
      )}
      <ScrollArea className="h-56">
        <div className="space-y-1">
          {filtered.map((c) => (
            <div key={c.id} onClick={() => onToggle(c.id)} className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors ${selected.includes(c.id) ? "bg-primary/5" : "hover:bg-muted/50"}`}>
              <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${selected.includes(c.id) ? "bg-primary border-primary" : "border-border"}`}>
                {selected.includes(c.id) && <Check className="w-3 h-3 text-primary-foreground" />}
              </div>
              <Avatar className="w-8 h-8"><AvatarFallback className="text-[10px] bg-muted text-muted-foreground">{(c.name ?? "?").slice(0, 1)}</AvatarFallback></Avatar>
              <div><p className="text-sm text-foreground">{c.name}</p><p className="text-[10px] text-muted-foreground">{c.department || "—"}</p></div>
            </div>
          ))}
          {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">沒有可選的同事</p>}
        </div>
      </ScrollArea>
    </>
  );
};

// ── Main Component ──
type ChatView = "addMember" | "chat" | "groupInfo" | "list" | "memberInfo";

const onErr = (e: any) => toast.error(e?.message || "操作失敗");

// oxlint-disable-next-line complexity
const Notifications = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<string>(searchParams.get("tab") === "chat" ? "chat" : "notifications");
  const [view, setView] = useState<ChatView>("list");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<ChatMember | null>(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [pickIds, setPickIds] = useState<number[]>([]);

  const inChat = view === "chat";
  const inGroupInfo = view === "groupInfo";
  const inAddMember = view === "addMember";

  // ── Queries（轮询） ──
  const { data: conversations = [], isLoading: convLoading } = useQuery({
    queryKey: ["chatConvs"],
    queryFn: async () => (await getConversations()).data ?? [],
    refetchInterval: tab === "chat" ? 4000 : false,
  });
  const activeConv: Conversation | undefined = useMemo(
    () => conversations.find((c) => c.id === activeId),
    [conversations, activeId],
  );
  const { data: messages = [] } = useQuery({
    queryKey: ["chatMsgs", activeId],
    queryFn: async () => (await getMessages(activeId!)).data ?? [],
    enabled: Boolean(activeId) && inChat,
    refetchInterval: inChat ? 3000 : false,
  });
  const { data: members = [] } = useQuery({
    queryKey: ["chatMembers", activeId],
    queryFn: async () => (await getChatMembers(activeId!)).data ?? [],
    enabled: Boolean(activeId) && (inGroupInfo || inAddMember),
  });
  const { data: directory = [] } = useQuery({
    queryKey: ["empDirectory"],
    queryFn: async () => (await getEmployeeDirectory()).data?.records ?? [],
    enabled: showCreateGroup || inAddMember,
  });

  const invalidateConvs = () => queryClient.invalidateQueries({ queryKey: ["chatConvs"] });
  const invalidateMsgs = () => queryClient.invalidateQueries({ queryKey: ["chatMsgs", activeId] });
  const invalidateMembers = () => queryClient.invalidateQueries({ queryKey: ["chatMembers", activeId] });
  const backToList = () => { setActiveId(null); setSelectedMember(null); setView("list"); };

  // ── Mutations ──
  const readM = useMutation({ mutationFn: (id: string) => markConversationRead(id), onSuccess: invalidateConvs });
  const openConversation = (id: string) => { setActiveId(id); setView("chat"); readM.mutate(id); };

  const sendM = useMutation({
    mutationFn: (text: string) => sendMessage(activeId!, text),
    onSuccess: () => { invalidateMsgs(); invalidateConvs(); },
    onError: onErr,
  });
  const startM = useMutation({
    mutationFn: (targetUserId: number) => startDirect(targetUserId),
    onSuccess: (res) => { const id = String(res.data); invalidateConvs(); openConversation(id); },
    onError: onErr,
  });
  const createM = useMutation({
    mutationFn: () => createGroup(groupName.trim(), pickIds),
    onSuccess: (res) => {
      setShowCreateGroup(false); setGroupName(""); setPickIds([]);
      invalidateConvs(); openConversation(String(res.data));
    },
    onError: onErr,
  });
  const leaveM = useMutation({
    mutationFn: () => leaveConversation(activeId!),
    onSuccess: () => { toast.success("已退出"); backToList(); invalidateConvs(); },
    onError: onErr,
  });
  const dissolveM = useMutation({
    mutationFn: () => dissolveGroup(activeId!),
    onSuccess: () => { toast.success("已解散"); backToList(); invalidateConvs(); },
    onError: onErr,
  });
  const addM = useMutation({
    mutationFn: () => addGroupMembers(activeId!, pickIds),
    onSuccess: () => { setPickIds([]); setView("groupInfo"); invalidateMembers(); invalidateConvs(); },
    onError: onErr,
  });
  const removeM = useMutation({
    mutationFn: (memberId: string) => removeGroupMember(activeId!, memberId),
    onSuccess: () => { invalidateMembers(); invalidateConvs(); },
    onError: onErr,
  });
  const muteM = useMutation({
    mutationFn: (muted: boolean) => muteConversation(activeId!, muted),
    onSuccess: invalidateConvs,
    onError: onErr,
  });

  const togglePick = (id: number) => setPickIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  // 深链：通讯录「發訊息」→ ?tab=chat&contactId=<id>
  useEffect(() => {
    const contactId = searchParams.get("contactId");
    if (!contactId) return;
    setSearchParams({}, { replace: true });
    setTab("chat");
    startM.mutate(Number(contactId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const totalUnread = conversations.reduce((s, c) => s + (c.unread || 0), 0);

  // ── Views ──
  if (tab === "chat" && view === "memberInfo" && selectedMember) {
    return (
      <MobileLayout title="">
        <MemberInfoPanel
          member={selectedMember}
          onBack={() => { setSelectedMember(null); setView(activeConv?.type === 2 ? "groupInfo" : "list"); }}
          onChat={() => { const uid = Number(selectedMember.userId); setSelectedMember(null); startM.mutate(uid); }}
        />
      </MobileLayout>
    );
  }

  if (tab === "chat" && inAddMember && activeConv) {
    const existing = new Set(members.map((m) => Number(m.userId)));
    return (
      <MobileLayout title="">
        <div className="px-5 pt-4">
          <div className="flex items-center gap-3 mb-5">
            <button onClick={() => { setPickIds([]); setView("groupInfo"); }} className="p-1"><ArrowLeft className="w-5 h-5 text-foreground" /></button>
            <h2 className="text-base font-semibold text-foreground">邀請成員</h2>
          </div>
          <MemberPicker directory={directory} excludeIds={existing} selected={pickIds} onToggle={togglePick} />
          <Button className="w-full mt-4" disabled={pickIds.length === 0 || addM.isPending} onClick={() => addM.mutate()}>確認邀請 ({pickIds.length})</Button>
        </div>
      </MobileLayout>
    );
  }

  if (tab === "chat" && inGroupInfo && activeConv && activeConv.type === 2) {
    return (
      <MobileLayout title="">
        <GroupInfoPanel
          conv={activeConv}
          members={members}
          onBack={() => setView("chat")}
          onLeave={() => leaveM.mutate()}
          onDissolve={() => dissolveM.mutate()}
          onMemberClick={(m) => { setSelectedMember(m); setView("memberInfo"); }}
          onAddMember={() => { setPickIds([]); setView("addMember"); }}
          onToggleMute={() => muteM.mutate(!activeConv.muted)}
          onRemoveMember={(m) => removeM.mutate(m.userId)}
        />
      </MobileLayout>
    );
  }

  if (tab === "chat" && inChat && activeConv) {
    return (
      <ChatRoom
        conv={activeConv}
        messages={messages}
        sending={sendM.isPending}
        onBack={backToList}
        onSend={(text) => sendM.mutate(text)}
        onOpenInfo={() => {
          if (activeConv.type === 2) setView("groupInfo");
          else {
            const other = members.find((m) => !m.mine);
            if (other) { setSelectedMember(other); setView("memberInfo"); }
            else setView("chat");
          }
        }}
      />
    );
  }

  // ── Main（列表 + Tabs） ──
  return (
    <MobileLayout title="消息中心">
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="w-full rounded-none border-b border-border bg-transparent h-11 p-0">
          <TabsTrigger value="notifications" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none gap-1.5">
            <Info className="w-4 h-4" /><span className="text-sm">通知</span>
          </TabsTrigger>
          <TabsTrigger value="chat" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none gap-1.5">
            <MessageCircle className="w-4 h-4" /><span className="text-sm">聊天</span>
            {totalUnread > 0 && <div className="w-4 h-4 rounded-full bg-destructive flex items-center justify-center"><span className="text-[9px] text-destructive-foreground">{totalUnread}</span></div>}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="notifications" className="mt-0"><NotificationTab /></TabsContent>
        <TabsContent value="chat" className="mt-0">
          <ChatList conversations={conversations} loading={convLoading} onOpen={(c) => openConversation(c.id)} onCreateGroup={() => { setPickIds([]); setGroupName(""); setShowCreateGroup(true); }} />
        </TabsContent>
      </Tabs>

      <Dialog open={showCreateGroup} onOpenChange={setShowCreateGroup}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader><DialogTitle className="text-base">創建聊天群組</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">群組名稱</label>
              <Input placeholder="輸入群組名稱..." value={groupName} onChange={(e) => setGroupName(e.target.value)} className="h-9 text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">選擇成員 {pickIds.length > 0 && `(已選 ${pickIds.length})`}</label>
              <MemberPicker directory={directory} excludeIds={new Set()} selected={pickIds} onToggle={togglePick} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowCreateGroup(false)}>取消</Button>
            <Button size="sm" onClick={() => createM.mutate()} disabled={!groupName.trim() || pickIds.length === 0 || createM.isPending}>創建 ({pickIds.length})</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MobileLayout>
  );
};

export default Notifications;
