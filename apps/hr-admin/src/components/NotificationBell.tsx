import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  Bell, AlertCircle, DollarSign, Clock, UserPlus, Info, CheckCheck, Loader2,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  getMyNotifications, getUnreadCount, markNotificationRead, markAllNotificationsRead,
  type AppNotification,
} from "@/api/notification";

/** 通知类型 → 图标与配色 */
const typeMeta: Record<string, { icon: React.ElementType; color: string }> = {
  APPROVAL: { icon: AlertCircle, color: "text-amber-500" },
  PAYROLL: { icon: DollarSign, color: "text-success" },
  ATTENDANCE: { icon: Clock, color: "text-blue-500" },
  ONBOARDING: { icon: UserPlus, color: "text-primary" },
  SYSTEM: { icon: Info, color: "text-muted-foreground" },
};

/** 相对时间：yyyy-MM-dd HH:mm:ss → 刚刚/几分钟前/几小时前/几天前/日期 */
function relativeTime(s?: string): string {
  if (!s) return "";
  const t = new Date(s.replace(" ", "T")).getTime();
  if (Number.isNaN(t)) return s.slice(0, 10);
  const diff = Date.now() - t;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "剛剛";
  if (min < 60) return `${min} 分鐘前`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} 小時前`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day} 天前`;
  return s.slice(0, 10);
}

export function NotificationBell() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: unread = 0 } = useQuery({
    queryKey: ["notifUnread"],
    queryFn: async () => (await getUnreadCount()).data ?? 0,
    refetchInterval: 30000,
  });

  const { data: list = [], isLoading } = useQuery({
    queryKey: ["notifList"],
    queryFn: async () => (await getMyNotifications()).data ?? [],
    enabled: open,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["notifList"] });
    queryClient.invalidateQueries({ queryKey: ["notifUnread"] });
  };
  const readOne = useMutation({ mutationFn: (id: number) => markNotificationRead(id), onSuccess: invalidate });
  const readAll = useMutation({ mutationFn: () => markAllNotificationsRead(), onSuccess: invalidate });

  const onItemClick = (n: AppNotification) => {
    if (!n.read) readOne.mutate(Number(n.id));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="relative p-2 rounded-md hover:bg-muted transition-colors" aria-label={t("消息通知")}>
          <Bell className="h-4.5 w-4.5 text-muted-foreground" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 flex items-center justify-center text-[10px] font-medium text-destructive-foreground bg-destructive rounded-full">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <span className="text-sm font-semibold">{t("消息通知")}</span>
          <button
            className="text-xs text-primary font-medium disabled:opacity-40 flex items-center gap-1"
            disabled={unread === 0 || readAll.isPending}
            onClick={() => readAll.mutate()}
          >
            <CheckCheck className="h-3.5 w-3.5" />{t("全部標為已讀")}
          </button>
        </div>

        <div className="max-h-[380px] overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : list.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
              <Bell className="h-8 w-8 opacity-30" />
              <span className="text-sm">{t("暫無通知")}</span>
            </div>
          ) : (
            <ul className="divide-y">
              {list.map((n) => {
                const meta = typeMeta[n.type] || typeMeta.SYSTEM;
                const Icon = meta.icon;
                return (
                  <li
                    key={n.id}
                    onClick={() => onItemClick(n)}
                    className={`flex gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors ${n.read ? "" : "bg-primary/[0.03]"}`}
                  >
                    <div className={`mt-0.5 shrink-0 ${meta.color}`}><Icon className="h-4 w-4" /></div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start gap-2">
                        <p className="text-sm font-medium leading-snug flex-1">{n.title}</p>
                        {!n.read && <span className="mt-1.5 h-2 w-2 rounded-full bg-destructive shrink-0" />}
                      </div>
                      {n.content && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.content}</p>}
                      <p className="text-[11px] text-muted-foreground/70 mt-1">{relativeTime(n.createTime)}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
