import MobileLayout from "@/components/MobileLayout";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlarmClock,
  ArrowLeft,
  Bell,
  BellOff,
  Check,
  CheckCheck,
  ChevronRight,
  Crown,
  DollarSign,
  FileCheck,
  Image,
  Info,
  LogOut,
  MessageCircle,
  Mic,
  MoreVertical,
  Phone,
  Plus,
  Search,
  Send,
  Smile,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  Video,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

// ── Notifications Data ──
const notifications = [
  {
    icon: AlarmClock,
    title: "忘記打卡提醒",
    desc: "您今日尚未進行上班打卡，請盡快完成打卡或提交補卡申請",
    time: "剛剛",
    read: false,
    color: "bg-warning",
  },
  {
    icon: FileCheck,
    title: "年假申請已通過",
    desc: "您的 3/12-3/14 年假申請已獲主管批准",
    time: "2小時前",
    read: false,
    color: "bg-success",
  },
  {
    icon: DollarSign,
    title: "三月份薪資已發布",
    desc: "請查看並確認您的薪資明細",
    time: "今天 10:00",
    read: false,
    color: "bg-primary",
  },
  {
    icon: AlarmClock,
    title: "忘記打卡提醒",
    desc: "您昨日（03/09）未完成下班打卡，請提交補卡申請",
    time: "昨天 22:00",
    read: true,
    color: "bg-warning",
  },
  {
    icon: UserCheck,
    title: "新員工入職提醒",
    desc: "林志明將於 3/15 加入您的團隊",
    time: "昨天",
    read: true,
    color: "bg-info",
  },
  {
    icon: Info,
    title: "系統維護通知",
    desc: "系統將於 3/13 凌晨 2:00-4:00 進行升級",
    time: "2天前",
    read: true,
    color: "bg-muted-foreground",
  },
  {
    icon: FileCheck,
    title: "加班申請已通過",
    desc: "3/1 加班 3 小時申請已通過",
    time: "3天前",
    read: true,
    color: "bg-success",
  },
];

// ── Chat Data Types ──
type Message = {
  id: string;
  text: string;
  sender: string;
  time: string;
  isMe: boolean;
};
type Chat = {
  id: string;
  name: string;
  avatar: string;
  type: "individual" | "department" | "group";
  lastMessage: string;
  lastTime: string;
  unread: number;
  members?: string[];
  messages: Message[];
  online?: boolean;
  owner?: string; // group creator
  muted?: boolean;
};

const initialChats: Chat[] = [
  {
    id: "1",
    name: "王小明",
    avatar: "王",
    type: "individual",
    lastMessage: "好的，明天見！",
    lastTime: "10:30",
    unread: 2,
    online: true,
    messages: [
      {
        id: "m1",
        text: "你好，明天的會議幾點開始？",
        sender: "王小明",
        time: "10:25",
        isMe: false,
      },
      {
        id: "m2",
        text: "下午兩點，在三樓會議室",
        sender: "我",
        time: "10:28",
        isMe: true,
      },
      {
        id: "m3",
        text: "好的，明天見！",
        sender: "王小明",
        time: "10:30",
        isMe: false,
      },
    ],
  },
  {
    id: "2",
    name: "李美玲",
    avatar: "李",
    type: "individual",
    lastMessage: "報告已經發送到你的郵箱了",
    lastTime: "09:15",
    unread: 0,
    online: false,
    messages: [
      {
        id: "m4",
        text: "上季度的報告準備好了嗎？",
        sender: "我",
        time: "09:00",
        isMe: true,
      },
      {
        id: "m5",
        text: "報告已經發送到你的郵箱了",
        sender: "李美玲",
        time: "09:15",
        isMe: false,
      },
    ],
  },
  {
    id: "3",
    name: "人力資源部",
    avatar: "HR",
    type: "department",
    lastMessage: "[張經理] 本月團建活動改為週五",
    lastTime: "昨天",
    unread: 5,
    members: ["張經理", "王小明", "李美玲", "陳大華", "林志明"],
    owner: "張經理",
    messages: [
      {
        id: "m6",
        text: "大家好，本月團建活動時間有變更",
        sender: "張經理",
        time: "昨天 14:00",
        isMe: false,
      },
      {
        id: "m7",
        text: "本月團建活動改為週五",
        sender: "張經理",
        time: "昨天 14:01",
        isMe: false,
      },
      {
        id: "m8",
        text: "收到，謝謝通知",
        sender: "我",
        time: "昨天 14:30",
        isMe: true,
      },
    ],
  },
  {
    id: "4",
    name: "技術開發部",
    avatar: "技",
    type: "department",
    lastMessage: "[陳大華] 新版本已部署到測試環境",
    lastTime: "昨天",
    unread: 0,
    members: ["陳大華", "王小明", "劉工", "趙博"],
    owner: "陳大華",
    messages: [
      {
        id: "m9",
        text: "新版本已部署到測試環境",
        sender: "陳大華",
        time: "昨天 16:00",
        isMe: false,
      },
      {
        id: "m10",
        text: "大家幫忙測試一下",
        sender: "陳大華",
        time: "昨天 16:01",
        isMe: false,
      },
    ],
  },
  {
    id: "5",
    name: "項目A討論組",
    avatar: "A",
    type: "group",
    lastMessage: "[林志明] 客戶反饋已整理完畢",
    lastTime: "週一",
    unread: 0,
    members: ["林志明", "王小明", "李美玲"],
    owner: "我",
    messages: [
      {
        id: "m11",
        text: "客戶反饋已整理完畢",
        sender: "林志明",
        time: "週一 11:00",
        isMe: false,
      },
      {
        id: "m12",
        text: "我來看看",
        sender: "我",
        time: "週一 11:30",
        isMe: true,
      },
    ],
  },
];

const allContacts = [
  {
    name: "王小明",
    dept: "技術開發部",
    title: "前端工程師",
    phone: "9123-4567",
  },
  { name: "李美玲", dept: "人力資源部", title: "HR 專員", phone: "9234-5678" },
  { name: "陳大華", dept: "技術開發部", title: "技術主管", phone: "9345-6789" },
  { name: "林志明", dept: "市場營銷部", title: "市場經理", phone: "9456-7890" },
  { name: "張經理", dept: "人力資源部", title: "HR 經理", phone: "9567-8901" },
  { name: "劉工", dept: "技術開發部", title: "後端工程師", phone: "9678-9012" },
  { name: "趙博", dept: "技術開發部", title: "測試工程師", phone: "9789-0123" },
  { name: "黃麗", dept: "財務部", title: "財務專員", phone: "9890-1234" },
];

// ── Notification Tab ──
const NotificationTab = () => (
  <div className="px-5 pt-4">
    <div className="flex items-center justify-between mb-4">
      <span className="text-xs text-muted-foreground">
        共 {notifications.filter((n) => !n.read).length} 條未讀
      </span>
      <button className="text-xs text-primary font-medium">全部標為已讀</button>
    </div>
    <div className="space-y-2">
      {notifications.map((notif, i) => (
        <div
          key={i}
          className={`bg-card rounded-xl border p-4 flex gap-3 ${notif.read ? "border-border" : "border-primary/30 bg-primary/[0.02]"}`}
        >
          <div
            className={`w-11 h-11 rounded-lg ${notif.color} flex items-center justify-center shrink-0`}
          >
            <notif.icon className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-foreground">
                {notif.title}
              </p>
              {!notif.read && (
                <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{notif.desc}</p>
            <p className="text-[10px] text-muted-foreground/70 mt-1">
              {notif.time}
            </p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ── Chat List ──
const ChatList = ({
  chats,
  filter,
  onOpen,
  onCreateGroup,
}: {
  chats: Chat[];
  filter: "all" | "individual" | "department" | "group";
  onOpen: (chat: Chat) => void;
  onCreateGroup: () => void;
}) => {
  const [search, setSearch] = useState("");
  const filtered = chats
    .filter((c) => filter === "all" || c.type === filter)
    .filter((c) => c.name.includes(search));

  return (
    <div className="px-5 pt-4">
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="搜索聊天..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm rounded-lg"
          />
        </div>
        <Button size="sm" className="h-9 gap-1" onClick={onCreateGroup}>
          <Plus className="w-4 h-4" />
          <span className="text-xs">建群</span>
        </Button>
      </div>
      <div className="flex gap-2 mb-3">
        {(["all", "individual", "department", "group"] as const).map((f) => (
          <button
            key={f}
            className={`text-xs px-3 py-1.5 rounded-full transition-colors ${filter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
          >
            {
              {
                all: "全部",
                individual: "同事",
                department: "部門",
                group: "群組",
              }[f]
            }
          </button>
        ))}
      </div>
      <div className="space-y-1">
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            暫無聊天記錄
          </p>
        )}
        {filtered.map((chat) => (
          <div
            key={chat.id}
            onClick={() => onOpen(chat)}
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 cursor-pointer transition-colors"
          >
            <div className="relative">
              <Avatar className="w-12 h-12">
                <AvatarFallback
                  className={`text-sm font-medium ${chat.type === "department" ? "bg-accent text-accent-foreground" : chat.type === "group" ? "bg-secondary text-secondary-foreground" : "bg-primary/10 text-primary"}`}
                >
                  {chat.avatar}
                </AvatarFallback>
              </Avatar>
              {chat.type === "individual" && chat.online && (
                <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-success border-2 border-background" />
              )}
              {chat.type !== "individual" && (
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-muted flex items-center justify-center">
                  <Users className="w-2.5 h-2.5 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground truncate">
                  {chat.name}
                </p>
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {chat.lastTime}
                </span>
              </div>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {chat.lastMessage}
              </p>
            </div>
            {chat.unread > 0 && (
              <div className="w-5 h-5 rounded-full bg-destructive flex items-center justify-center shrink-0">
                <span className="text-[10px] text-destructive-foreground font-medium">
                  {chat.unread}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Member Info Panel ──
const MemberInfoPanel = ({
  name,
  onBack,
  onChat,
}: {
  name: string;
  onBack: () => void;
  onChat: () => void;
}) => {
  const contact = allContacts.find((c) => c.name === name);
  return (
    <div className="px-5 pt-4">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-1">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h2 className="text-base font-semibold text-foreground">個人資料</h2>
      </div>
      <div className="flex flex-col items-center mb-6">
        <Avatar className="w-20 h-20 mb-3">
          <AvatarFallback className="text-2xl bg-primary/10 text-primary">
            {name.slice(0, 1)}
          </AvatarFallback>
        </Avatar>
        <p className="text-lg font-semibold text-foreground">{name}</p>
        {contact && (
          <p className="text-sm text-muted-foreground">{contact.title}</p>
        )}
      </div>
      <div className="bg-card rounded-xl border p-4 space-y-3 mb-4">
        <div className="flex justify-between">
          <span className="text-xs text-muted-foreground">部門</span>
          <span className="text-sm text-foreground">
            {contact?.dept || "—"}
          </span>
        </div>
        <Separator />
        <div className="flex justify-between">
          <span className="text-xs text-muted-foreground">職位</span>
          <span className="text-sm text-foreground">
            {contact?.title || "—"}
          </span>
        </div>
        <Separator />
        <div className="flex justify-between">
          <span className="text-xs text-muted-foreground">電話</span>
          <span className="text-sm text-primary">{contact?.phone || "—"}</span>
        </div>
      </div>
      <Button className="w-full gap-2" onClick={onChat}>
        <MessageCircle className="w-4 h-4" />
        發送訊息
      </Button>
    </div>
  );
};

// ── Group Info Panel ──
const GroupInfoPanel = ({
  chat,
  onBack,
  onLeave,
  onDissolve,
  onMemberClick,
  onAddMember,
  onToggleMute,
  onRemoveMember,
}: {
  chat: Chat;
  onBack: () => void;
  onLeave: () => void;
  onDissolve: () => void;
  onMemberClick: (name: string) => void;
  onAddMember: () => void;
  onToggleMute: () => void;
  onRemoveMember: (name: string) => void;
}) => {
  const isOwner = chat.owner === "我";
  const [confirmAction, setConfirmAction] = useState<
    "leave" | "dissolve" | null
  >(null);

  return (
    <div className="px-5 pt-4">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={onBack} className="p-1">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h2 className="text-base font-semibold text-foreground">
          {chat.type === "department" ? "部門資訊" : "群組資訊"}
        </h2>
      </div>

      {/* Group header */}
      <div className="flex flex-col items-center mb-5">
        <Avatar className="w-16 h-16 mb-2">
          <AvatarFallback
            className={`text-xl font-medium ${chat.type === "department" ? "bg-accent text-accent-foreground" : "bg-secondary text-secondary-foreground"}`}
          >
            {chat.avatar}
          </AvatarFallback>
        </Avatar>
        <p className="text-lg font-semibold text-foreground">{chat.name}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {chat.members?.length || 0} 位成員
        </p>
        {chat.owner && (
          <div className="flex items-center gap-1 mt-1">
            <Crown className="w-3 h-3 text-warning" />
            <span className="text-[10px] text-muted-foreground">
              群主：{chat.owner}
            </span>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="flex justify-center gap-6 mb-5">
        <button
          onClick={onAddMember}
          className="flex flex-col items-center gap-1"
        >
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <UserPlus className="w-5 h-5 text-primary" />
          </div>
          <span className="text-[10px] text-muted-foreground">邀請</span>
        </button>
        <button
          onClick={onToggleMute}
          className="flex flex-col items-center gap-1"
        >
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            {chat.muted ? (
              <BellOff className="w-5 h-5 text-muted-foreground" />
            ) : (
              <Bell className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
          <span className="text-[10px] text-muted-foreground">
            {chat.muted ? "已靜音" : "靜音"}
          </span>
        </button>
        <button className="flex flex-col items-center gap-1">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <Search className="w-5 h-5 text-muted-foreground" />
          </div>
          <span className="text-[10px] text-muted-foreground">搜索</span>
        </button>
      </div>

      {/* Members */}
      <div className="bg-card rounded-xl border mb-4">
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-sm font-medium text-foreground">成員列表</span>
          <span className="text-xs text-muted-foreground">
            {chat.members?.length || 0} 人
          </span>
        </div>
        <Separator />
        <div className="max-h-64 overflow-y-auto">
          {chat.members?.map((member) => (
            <div
              key={member}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30 cursor-pointer transition-colors"
            >
              <div
                className="flex-1 flex items-center gap-3"
                onClick={() => onMemberClick(member)}
              >
                <Avatar className="w-9 h-9">
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                    {member.slice(0, 1)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm text-foreground">{member}</p>
                    {member === chat.owner && (
                      <Crown className="w-3 h-3 text-warning" />
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {allContacts.find((c) => c.name === member)?.dept || "—"} ·{" "}
                    {allContacts.find((c) => c.name === member)?.title || "—"}
                  </p>
                </div>
              </div>
              {isOwner && member !== "我" && member !== chat.owner && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveMember(member);
                  }}
                  className="p-1.5 rounded-md hover:bg-destructive/10 transition-colors"
                  title="移除成員"
                >
                  <X className="w-3.5 h-3.5 text-destructive" />
                </button>
              )}
              <ChevronRight className="w-4 h-4 text-muted-foreground/50 shrink-0" />
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-2 pb-4">
        <Button
          variant="outline"
          className="w-full gap-2 text-destructive hover:text-destructive hover:bg-destructive/5 border-destructive/20"
          onClick={() => setConfirmAction("leave")}
        >
          <LogOut className="w-4 h-4" />
          退出{chat.type === "department" ? "部門群" : "群組"}
        </Button>
        {isOwner && (
          <Button
            variant="destructive"
            className="w-full gap-2"
            onClick={() => setConfirmAction("dissolve")}
          >
            <Trash2 className="w-4 h-4" />
            解散群組
          </Button>
        )}
      </div>

      {/* Confirm Dialog */}
      <Dialog
        open={!!confirmAction}
        onOpenChange={() => setConfirmAction(null)}
      >
        <DialogContent className="max-w-xs mx-auto">
          <DialogHeader>
            <DialogTitle className="text-base">
              {confirmAction === "leave" ? "確認退出" : "確認解散"}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {confirmAction === "leave"
                ? `確定要退出「${chat.name}」嗎？退出後將不再接收該群組的訊息。`
                : `確定要解散「${chat.name}」嗎？解散後所有成員將被移除，聊天記錄將被清除，此操作不可恢復。`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmAction(null)}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (confirmAction === "leave") onLeave();
                else onDissolve();
                setConfirmAction(null);
              }}
            >
              {confirmAction === "leave" ? "退出" : "解散"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ── Chat Room ──
const ChatRoom = ({
  chat,
  onBack,
  onSend,
  onOpenInfo,
}: {
  chat: Chat;
  onBack: () => void;
  onSend: (chatId: string, text: string) => void;
  onOpenInfo: () => void;
}) => {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [chat.messages.length]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSend(chat.id, input.trim());
    setInput("");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem-5rem)]">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
        <button onClick={onBack} className="p-1">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <button
          onClick={chat.type !== "individual" ? onOpenInfo : undefined}
          className="flex items-center gap-3 flex-1 min-w-0"
        >
          <Avatar className="w-9 h-9">
            <AvatarFallback className="text-xs bg-primary/10 text-primary">
              {chat.avatar}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              {chat.name}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {chat.type === "individual"
                ? chat.online
                  ? "在線"
                  : "離線"
                : `${chat.members?.length || 0} 位成員`}
            </p>
          </div>
        </button>
        <div className="flex gap-1">
          {chat.type === "individual" && (
            <>
              <button className="p-2 rounded-lg hover:bg-muted">
                <Phone className="w-4 h-4 text-muted-foreground" />
              </button>
              <button className="p-2 rounded-lg hover:bg-muted">
                <Video className="w-4 h-4 text-muted-foreground" />
              </button>
            </>
          )}
          <button
            className="p-2 rounded-lg hover:bg-muted"
            onClick={onOpenInfo}
          >
            <MoreVertical className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-muted/30"
      >
        {chat.messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.isMe ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`flex gap-2 max-w-[75%] ${msg.isMe ? "flex-row-reverse" : ""}`}
            >
              {!msg.isMe && (
                <Avatar className="w-8 h-8 shrink-0 mt-1">
                  <AvatarFallback className="text-[10px] bg-accent text-accent-foreground">
                    {msg.sender.slice(0, 1)}
                  </AvatarFallback>
                </Avatar>
              )}
              <div>
                {!msg.isMe && chat.type !== "individual" && (
                  <p className="text-[10px] text-muted-foreground mb-1 ml-1">
                    {msg.sender}
                  </p>
                )}
                <div
                  className={`px-3 py-2 rounded-2xl text-sm ${msg.isMe ? "bg-primary text-primary-foreground rounded-tr-md" : "bg-card text-foreground border border-border rounded-tl-md"}`}
                >
                  {msg.text}
                </div>
                <div
                  className={`flex items-center gap-1 mt-0.5 ${msg.isMe ? "justify-end" : ""}`}
                >
                  <span className="text-[9px] text-muted-foreground/60">
                    {msg.time}
                  </span>
                  {msg.isMe && (
                    <CheckCheck className="w-3 h-3 text-primary/60" />
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="px-3 py-2 border-t border-border bg-card flex items-end gap-2">
        <button className="p-2 rounded-lg hover:bg-muted shrink-0">
          <Smile className="w-5 h-5 text-muted-foreground" />
        </button>
        <button className="p-2 rounded-lg hover:bg-muted shrink-0">
          <Image className="w-5 h-5 text-muted-foreground" />
        </button>
        <Input
          placeholder="輸入訊息..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) =>
            e.key === "Enter" &&
            !e.shiftKey &&
            (e.preventDefault(), handleSend())
          }
          className="flex-1 h-9 text-sm rounded-full"
        />
        {input.trim() ? (
          <Button
            size="icon"
            className="w-9 h-9 rounded-full shrink-0"
            onClick={handleSend}
          >
            <Send className="w-4 h-4" />
          </Button>
        ) : (
          <button className="p-2 rounded-lg hover:bg-muted shrink-0">
            <Mic className="w-5 h-5 text-muted-foreground" />
          </button>
        )}
      </div>
    </div>
  );
};

// ── Main Component ──
const Notifications = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [chats, setChats] = useState<Chat[]>(initialChats);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [chatFilter] = useState<"all" | "individual" | "department" | "group">(
    "all",
  );
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [memberSearch, setMemberSearch] = useState("");
  const [view, setView] = useState<
    "main" | "chat" | "groupInfo" | "memberInfo" | "addMember"
  >("main");
  const [selectedMember, setSelectedMember] = useState<string | null>(null);

  // Handle deep link from contacts: ?tab=chat&contact=Name
  useEffect(() => {
    const contactName = searchParams.get("contact");
    if (!contactName) return;

    // Clear params so it doesn't re-trigger
    setSearchParams({}, { replace: true });

    // Find existing chat or create new one
    const existingChat = chats.find(
      (c) => c.type === "individual" && c.name === contactName,
    );
    if (existingChat) {
      setActiveChat({ ...existingChat, unread: 0 });
      setChats((prev) =>
        prev.map((c) => (c.id === existingChat.id ? { ...c, unread: 0 } : c)),
      );
    } else {
      const contact = allContacts.find((c) => c.name === contactName);
      const newChat: Chat = {
        id: `chat-${Date.now()}`,
        name: contactName,
        avatar: contactName.slice(0, 1),
        type: "individual",
        lastMessage: "",
        lastTime: "剛剛",
        unread: 0,
        online: !!contact,
        messages: [],
      };
      setChats((prev) => [newChat, ...prev]);
      setActiveChat(newChat);
    }
    setView("chat");
  }, [searchParams]);

  const handleSend = (chatId: string, text: string) => {
    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      text,
      sender: "我",
      time: new Date().toLocaleTimeString("zh-TW", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      isMe: true,
    };
    setChats((prev) =>
      prev.map((c) =>
        c.id === chatId
          ? {
              ...c,
              messages: [...c.messages, newMsg],
              lastMessage: text,
              lastTime: newMsg.time,
            }
          : c,
      ),
    );
    setActiveChat((prev) =>
      prev && prev.id === chatId
        ? {
            ...prev,
            messages: [...prev.messages, newMsg],
            lastMessage: text,
            lastTime: newMsg.time,
          }
        : prev,
    );
  };

  const handleCreateGroup = () => {
    if (!groupName.trim() || selectedMembers.length === 0) return;
    const newChat: Chat = {
      id: `group-${Date.now()}`,
      name: groupName.trim(),
      avatar: groupName.trim().slice(0, 1),
      type: "group",
      lastMessage: "群組已創建",
      lastTime: "剛剛",
      unread: 0,
      members: selectedMembers,
      owner: "我",
      messages: [
        {
          id: `sys-${Date.now()}`,
          text: `群組「${groupName.trim()}」已創建，成員：${selectedMembers.join("、")}`,
          sender: "系統",
          time: new Date().toLocaleTimeString("zh-TW", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          isMe: false,
        },
      ],
    };
    setChats((prev) => [newChat, ...prev]);
    setShowCreateGroup(false);
    setGroupName("");
    setSelectedMembers([]);
    setMemberSearch("");
  };

  const handleLeaveGroup = () => {
    if (!activeChat) return;
    setChats((prev) => prev.filter((c) => c.id !== activeChat.id));
    setActiveChat(null);
    setView("main");
  };

  const handleDissolveGroup = () => {
    if (!activeChat) return;
    setChats((prev) => prev.filter((c) => c.id !== activeChat.id));
    setActiveChat(null);
    setView("main");
  };

  const handleRemoveMember = (name: string) => {
    if (!activeChat) return;
    const updated = {
      ...activeChat,
      members: activeChat.members?.filter((m) => m !== name),
    };
    setActiveChat(updated);
    setChats((prev) => prev.map((c) => (c.id === activeChat.id ? updated : c)));
  };

  const handleToggleMute = () => {
    if (!activeChat) return;
    const updated = { ...activeChat, muted: !activeChat.muted };
    setActiveChat(updated);
    setChats((prev) => prev.map((c) => (c.id === activeChat.id ? updated : c)));
  };

  const handleAddMembers = () => {
    if (!activeChat || selectedMembers.length === 0) return;
    const newMembers = selectedMembers.filter(
      (m) => !activeChat.members?.includes(m),
    );
    if (newMembers.length === 0) return;
    const updated = {
      ...activeChat,
      members: [...(activeChat.members || []), ...newMembers],
    };
    setActiveChat(updated);
    setChats((prev) => prev.map((c) => (c.id === activeChat.id ? updated : c)));
    setSelectedMembers([]);
    setMemberSearch("");
    setView("groupInfo");
  };

  const toggleMember = (name: string) => {
    setSelectedMembers((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name],
    );
  };

  // ── View: Member Info ──
  if (view === "memberInfo" && selectedMember) {
    return (
      <MobileLayout title="">
        <MemberInfoPanel
          name={selectedMember}
          onBack={() => {
            setSelectedMember(null);
            setView(activeChat ? "groupInfo" : "main");
          }}
          onChat={() => {
            const existing = chats.find(
              (c) => c.type === "individual" && c.name === selectedMember,
            );
            if (existing) {
              setActiveChat(existing);
            } else {
              const newChat: Chat = {
                id: `ind-${Date.now()}`,
                name: selectedMember,
                avatar: selectedMember.slice(0, 1),
                type: "individual",
                lastMessage: "",
                lastTime: "剛剛",
                unread: 0,
                online: false,
                messages: [],
              };
              setChats((prev) => [newChat, ...prev]);
              setActiveChat(newChat);
            }
            setSelectedMember(null);
            setView("chat");
          }}
        />
      </MobileLayout>
    );
  }

  // ── View: Add Member ──
  if (view === "addMember" && activeChat) {
    const existingMembers = activeChat.members || [];
    const available = allContacts.filter(
      (c) => !existingMembers.includes(c.name),
    );
    return (
      <MobileLayout title="">
        <div className="px-5 pt-4">
          <div className="flex items-center gap-3 mb-5">
            <button
              onClick={() => {
                setView("groupInfo");
                setSelectedMembers([]);
                setMemberSearch("");
              }}
              className="p-1"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <h2 className="text-base font-semibold text-foreground">
              邀請成員
            </h2>
          </div>
          <Input
            placeholder="搜索同事..."
            value={memberSearch}
            onChange={(e) => setMemberSearch(e.target.value)}
            className="h-9 text-sm mb-3"
          />
          {selectedMembers.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {selectedMembers.map((name) => (
                <span
                  key={name}
                  onClick={() => toggleMember(name)}
                  className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full cursor-pointer hover:bg-primary/20"
                >
                  {name} ✕
                </span>
              ))}
            </div>
          )}
          <ScrollArea className="h-72">
            <div className="space-y-1">
              {available
                .filter(
                  (c) =>
                    c.name.includes(memberSearch) ||
                    c.dept.includes(memberSearch),
                )
                .map((contact) => (
                  <div
                    key={contact.name}
                    onClick={() => toggleMember(contact.name)}
                    className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors ${selectedMembers.includes(contact.name) ? "bg-primary/5" : "hover:bg-muted/50"}`}
                  >
                    <div
                      className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${selectedMembers.includes(contact.name) ? "bg-primary border-primary" : "border-border"}`}
                    >
                      {selectedMembers.includes(contact.name) && (
                        <Check className="w-3 h-3 text-primary-foreground" />
                      )}
                    </div>
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="text-[10px] bg-muted text-muted-foreground">
                        {contact.name.slice(0, 1)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm text-foreground">{contact.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {contact.dept}
                      </p>
                    </div>
                  </div>
                ))}
              {available.filter(
                (c) =>
                  c.name.includes(memberSearch) ||
                  c.dept.includes(memberSearch),
              ).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">
                  沒有可邀請的同事
                </p>
              )}
            </div>
          </ScrollArea>
          <Button
            className="w-full mt-4"
            disabled={selectedMembers.length === 0}
            onClick={handleAddMembers}
          >
            確認邀請 ({selectedMembers.length})
          </Button>
        </div>
      </MobileLayout>
    );
  }

  // ── View: Group Info ──
  if (view === "groupInfo" && activeChat && activeChat.type !== "individual") {
    return (
      <MobileLayout title="">
        <GroupInfoPanel
          chat={activeChat}
          onBack={() => setView("chat")}
          onLeave={handleLeaveGroup}
          onDissolve={handleDissolveGroup}
          onMemberClick={(name) => {
            setSelectedMember(name);
            setView("memberInfo");
          }}
          onAddMember={() => {
            setSelectedMembers([]);
            setMemberSearch("");
            setView("addMember");
          }}
          onToggleMute={handleToggleMute}
          onRemoveMember={handleRemoveMember}
        />
      </MobileLayout>
    );
  }

  // ── View: Chat Room ──
  if (view === "chat" && activeChat) {
    return (
      <MobileLayout title="">
        <ChatRoom
          chat={activeChat}
          onBack={() => {
            setActiveChat(null);
            setView("main");
          }}
          onSend={handleSend}
          onOpenInfo={() => {
            if (activeChat.type === "individual") {
              setSelectedMember(activeChat.name);
              setView("memberInfo");
            } else {
              setView("groupInfo");
            }
          }}
        />
      </MobileLayout>
    );
  }

  // ── View: Main ──
  return (
    <MobileLayout title="消息中心">
      <Tabs defaultValue="notifications" className="w-full">
        <TabsList className="w-full rounded-none border-b border-border bg-transparent h-11 p-0">
          <TabsTrigger
            value="notifications"
            className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none gap-1.5"
          >
            <Info className="w-4 h-4" />
            <span className="text-sm">通知</span>
          </TabsTrigger>
          <TabsTrigger
            value="chat"
            className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none gap-1.5"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="text-sm">聊天</span>
            {chats.reduce((sum, c) => sum + c.unread, 0) > 0 && (
              <div className="w-4 h-4 rounded-full bg-destructive flex items-center justify-center">
                <span className="text-[9px] text-destructive-foreground">
                  {chats.reduce((sum, c) => sum + c.unread, 0)}
                </span>
              </div>
            )}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="notifications" className="mt-0">
          <NotificationTab />
        </TabsContent>
        <TabsContent value="chat" className="mt-0">
          <ChatList
            chats={chats}
            filter={chatFilter}
            onOpen={(chat) => {
              setChats((prev) =>
                prev.map((c) => (c.id === chat.id ? { ...c, unread: 0 } : c)),
              );
              setActiveChat({ ...chat, unread: 0 });
              setView("chat");
            }}
            onCreateGroup={() => setShowCreateGroup(true)}
          />
        </TabsContent>
      </Tabs>

      <Dialog open={showCreateGroup} onOpenChange={setShowCreateGroup}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="text-base">創建聊天群組</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">
                群組名稱
              </label>
              <Input
                placeholder="輸入群組名稱..."
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">
                選擇成員{" "}
                {selectedMembers.length > 0 &&
                  `(已選 ${selectedMembers.length})`}
              </label>
              <Input
                placeholder="搜索同事..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                className="h-9 text-sm mb-2"
              />
              {selectedMembers.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {selectedMembers.map((name) => (
                    <span
                      key={name}
                      onClick={() => toggleMember(name)}
                      className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full cursor-pointer hover:bg-primary/20"
                    >
                      {name} ✕
                    </span>
                  ))}
                </div>
              )}
              <ScrollArea className="h-48">
                <div className="space-y-1">
                  {allContacts
                    .filter(
                      (c) =>
                        c.name.includes(memberSearch) ||
                        c.dept.includes(memberSearch),
                    )
                    .map((contact) => (
                      <div
                        key={contact.name}
                        onClick={() => toggleMember(contact.name)}
                        className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors ${selectedMembers.includes(contact.name) ? "bg-primary/5" : "hover:bg-muted/50"}`}
                      >
                        <div
                          className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${selectedMembers.includes(contact.name) ? "bg-primary border-primary" : "border-border"}`}
                        >
                          {selectedMembers.includes(contact.name) && (
                            <Check className="w-3 h-3 text-primary-foreground" />
                          )}
                        </div>
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="text-[10px] bg-muted text-muted-foreground">
                            {contact.name.slice(0, 1)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm text-foreground">
                            {contact.name}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {contact.dept}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </ScrollArea>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCreateGroup(false)}
            >
              取消
            </Button>
            <Button
              size="sm"
              onClick={handleCreateGroup}
              disabled={!groupName.trim() || selectedMembers.length === 0}
            >
              創建 ({selectedMembers.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MobileLayout>
  );
};

export default Notifications;

