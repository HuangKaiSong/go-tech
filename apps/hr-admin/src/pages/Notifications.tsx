import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bell, Plus, Search, Eye, Trash2, Send, Users, Building2, Clock, CheckCircle, AlertCircle, Info, Megaphone, Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import {
  getNoticeList, saveNotice, saveAndSendNotice, sendNotice, deleteNotice,
  type NoticeBroadcast,
} from "@/api/noticeBroadcast";
import { getDepartmentOptions } from "@/api/department";
import { getActiveEmployeeOptions } from "@/api/employee";
import { hasPerm } from "@/lib/auth";
import { NOTICE_PERM } from "@/lib/perms";
import { DataPagination } from "@/components/common/DataPagination";

const TARGET_COMPANY = "COMPANY";
const TARGET_DEPT = "DEPT";
const TARGET_USER = "USER";
const SENT = 1;

const statusColors: Record<string, string> = {
  "已發送": "bg-success/10 text-success border-success/20",
  "草稿": "bg-muted text-muted-foreground",
};
const priorityColors: Record<string, string> = {
  "高": "bg-destructive/10 text-destructive border-destructive/20",
  "一般": "bg-muted text-muted-foreground",
  "低": "bg-muted text-muted-foreground",
};
const typeIcons: Record<string, React.ElementType> = {
  "考核通知": AlertCircle,
  "活動通知": Megaphone,
  "公告": Info,
  "培訓通知": Info,
  "系統通知": Bell,
  "獎勵通知": CheckCircle,
};

/** yyyy-MM-dd HH:mm:ss → yyyy-MM-dd */
const fmtDate = (s?: string | null) => (s ? s.slice(0, 10) : "-");

export default function Notifications() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [detail, setDetail] = useState<NoticeBroadcast | null>(null);
  const [toDelete, setToDelete] = useState<NoticeBroadcast | null>(null);
  const [current, setCurrent] = useState(1);
  const [size, setSize] = useState(10);

  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["noticeList"] });

  const { data: list = [], isLoading } = useQuery({
    queryKey: ["noticeList"],
    queryFn: async () => (await getNoticeList()).data ?? [],
  });

  const sendM = useMutation({
    mutationFn: (id: number) => sendNotice(id),
    onSuccess: () => { toast({ title: "通知已發送" }); invalidate(); },
    onError: (e: Error) => toast({ title: "發送失敗", description: e.message, variant: "destructive" }),
  });
  const deleteM = useMutation({
    mutationFn: (id: number) => deleteNotice(id),
    onSuccess: () => { toast({ title: "已刪除" }); setToDelete(null); invalidate(); },
    onError: (e: Error) => toast({ title: "刪除失敗", description: e.message, variant: "destructive" }),
  });

  const rows = useMemo(() => list.filter((row) => {
    const matchSearch = !search || (row.title ?? "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || row.sendStatusText === statusFilter;
    return matchSearch && matchStatus;
  }), [list, search, statusFilter]);

  // 分页只切当前页；统计卡片仍取全量 list，保持准确
  const pagedRows = useMemo(
    () => rows.slice((current - 1) * size, current * size),
    [rows, current, size],
  );
  // 搜索/状态筛选变动后回到第一页，避免停在超出范围的页码上
  useEffect(() => { setCurrent(1); }, [search, statusFilter]);

  const sentList = list.filter((d) => d.sendStatus === SENT);
  const totalRead = sentList.reduce((s, d) => s + (d.readCount || 0), 0);
  const totalTarget = sentList.reduce((s, d) => s + (d.totalCount || 0), 0);
  const summaryCards = [
    { label: "通知總數", value: list.length, icon: Bell, color: "text-primary" },
    { label: "已發送", value: sentList.length, icon: Send, color: "text-success" },
    { label: "草稿", value: list.length - sentList.length, icon: Clock, color: "text-muted-foreground" },
    { label: "已讀率", value: totalTarget > 0 ? `${Math.round((totalRead / totalTarget) * 100)}%` : "-", icon: Eye, color: "text-primary" },
  ];

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary" />
            消息通知
          </h1>
          <p className="page-description">管理系統通知、公告與消息推送</p>
        </div>
        {hasPerm(NOTICE_PERM.CREATE) && (
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />建立通知
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {summaryCards.map((card) => (
          <Card key={card.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted"><card.icon className={`h-5 w-5 ${card.color}`} /></div>
              <div>
                <p className="text-sm text-muted-foreground">{card.label}</p>
                <p className="text-2xl font-bold">{card.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="搜尋通知標題..." className="pl-9 h-9" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[130px] h-9"><SelectValue placeholder="狀態" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部狀態</SelectItem>
                <SelectItem value="已發送">已發送</SelectItem>
                <SelectItem value="草稿">草稿</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>標題</TableHead>
                <TableHead>類型</TableHead>
                <TableHead>優先級</TableHead>
                <TableHead>通知對象</TableHead>
                <TableHead className="text-center">已讀/總數</TableHead>
                <TableHead>建立者</TableHead>
                <TableHead>發送時間</TableHead>
                <TableHead>狀態</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={9} className="text-center py-10">
                  <Loader2 className="h-5 w-5 animate-spin inline text-muted-foreground" />
                </TableCell></TableRow>
              ) : rows.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center py-10 text-muted-foreground">暫無通知記錄</TableCell></TableRow>
              ) : pagedRows.map((row) => (
                <TableRow key={row.id} className="cursor-pointer" onClick={() => setDetail(row)}>
                  <TableCell className="font-medium max-w-[200px] truncate">{row.title}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{row.noticeType || "-"}</Badge></TableCell>
                  <TableCell><Badge variant="secondary" className={priorityColors[row.priority] || ""}>{row.priority || "-"}</Badge></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      {row.targetType === TARGET_DEPT ? <Building2 className="h-3.5 w-3.5 text-muted-foreground" /> : <Users className="h-3.5 w-3.5 text-muted-foreground" />}
                      <span className="text-sm max-w-[160px] truncate">{(row.targetNames || []).join("、") || row.targetTypeText}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {row.sendStatus === SENT ? <span className="text-sm">{row.readCount}/{row.totalCount}</span> : "-"}
                  </TableCell>
                  <TableCell>{row.createdBy || "-"}</TableCell>
                  <TableCell>{fmtDate(row.sentTime)}</TableCell>
                  <TableCell><Badge variant="secondary" className={statusColors[row.sendStatusText] || ""}>{row.sendStatusText}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="sm" onClick={() => setDetail(row)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      {row.sendStatus !== SENT && hasPerm(NOTICE_PERM.SEND) && (
                        <Button variant="ghost" size="sm" className="text-success"
                          disabled={sendM.isPending}
                          onClick={() => sendM.mutate(Number(row.id))}>
                          <Send className="h-4 w-4" />
                        </Button>
                      )}
                      {hasPerm(NOTICE_PERM.DELETE) && (
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setToDelete(row)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <DataPagination
            current={current}
            pageSize={size}
            total={rows.length}
            onChange={setCurrent}
            onPageSizeChange={(s) => { setSize(s); setCurrent(1); }}
          />
        </CardContent>
      </Card>

      <CreateNotificationDialog open={createOpen} onOpenChange={setCreateOpen} onDone={invalidate} />
      <NotificationDetailDialog
        notification={detail}
        onClose={() => setDetail(null)}
        onSend={(id) => { sendM.mutate(id); setDetail(null); }}
      />

      <AlertDialog open={!!toDelete} onOpenChange={(v) => !v && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認刪除通知？</AlertDialogTitle>
            <AlertDialogDescription>
              將刪除「{toDelete?.title}」。已發送的通知刪除後不會回收已下發給員工的站內信。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => toDelete && deleteM.mutate(Number(toDelete.id))}>
              刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Create Dialog ───────────────────────────────────────────

function CreateNotificationDialog({ open, onOpenChange, onDone }: {
  open: boolean; onOpenChange: (v: boolean) => void; onDone: () => void;
}) {
  const [form, setForm] = useState({ title: "", content: "", type: "公告", priority: "一般", targetType: TARGET_COMPANY });
  const [selectedDeptIds, setSelectedDeptIds] = useState<number[]>([]);
  const [selectedEmpIds, setSelectedEmpIds] = useState<number[]>([]);
  const [empSearch, setEmpSearch] = useState("");

  const { data: departments = [] } = useQuery({
    queryKey: ["deptOptions"],
    queryFn: async () => (await getDepartmentOptions()).data ?? [],
    enabled: open,
  });
  const { data: employees = [] } = useQuery({
    queryKey: ["activeEmpOptions"],
    queryFn: async () => (await getActiveEmployeeOptions()).data ?? [],
    enabled: open,
  });

  const reset = () => {
    setForm({ title: "", content: "", type: "公告", priority: "一般", targetType: TARGET_COMPANY });
    setSelectedDeptIds([]); setSelectedEmpIds([]); setEmpSearch("");
  };

  const buildPayload = () => {
    let targetIds: number[] | undefined;
    let targetNames: string[];
    if (form.targetType === TARGET_COMPANY) {
      targetIds = undefined;
      targetNames = [TARGET_COMPANY];
    } else if (form.targetType === TARGET_DEPT) {
      targetIds = selectedDeptIds;
      targetNames = departments.filter((d) => selectedDeptIds.includes(d.id)).map((d) => d.name);
    } else {
      targetIds = selectedEmpIds;
      targetNames = employees.filter((e) => selectedEmpIds.includes(e.id)).map((e) => e.name);
    }
    return {
      title: form.title.trim(), content: form.content.trim(),
      noticeType: form.type, priority: form.priority, targetType: form.targetType,
      targetIds, targetNames,
    };
  };

  const validate = () => {
    if (!form.title.trim() || !form.content.trim()) { toast({ title: "請填寫標題和內容", variant: "destructive" }); return false; }
    if (form.targetType === TARGET_DEPT && selectedDeptIds.length === 0) { toast({ title: "請選擇至少一個部門", variant: "destructive" }); return false; }
    if (form.targetType === TARGET_USER && selectedEmpIds.length === 0) { toast({ title: "請選擇至少一位員工", variant: "destructive" }); return false; }
    return true;
  };

  const saveM = useMutation({
    mutationFn: (send: boolean) => (send ? saveAndSendNotice(buildPayload()) : saveNotice(buildPayload())),
    onSuccess: (_res, send) => {
      toast({ title: send ? "通知已發送" : "已儲存為草稿" });
      onOpenChange(false); reset(); onDone();
    },
    onError: (e: Error) => toast({ title: "操作失敗", description: e.message, variant: "destructive" }),
  });

  const submit = (send: boolean) => { if (validate()) saveM.mutate(send); };

  const filteredEmps = employees.filter((e) => !empSearch || e.name.toLowerCase().includes(empSearch.toLowerCase()));
  const toggle = (arr: number[], id: number) => arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id];

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>建立通知</DialogTitle>
          <DialogDescription>填寫通知內容並選擇通知對象</DialogDescription>
        </DialogHeader>
        <div className="grid gap-5 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label>通知標題 *</Label>
              <Input placeholder="輸入通知標題" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>通知類型</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="公告">公告</SelectItem>
                  <SelectItem value="考核通知">考核通知</SelectItem>
                  <SelectItem value="培訓通知">培訓通知</SelectItem>
                  <SelectItem value="活動通知">活動通知</SelectItem>
                  <SelectItem value="系統通知">系統通知</SelectItem>
                  <SelectItem value="獎勵通知">獎勵通知</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>優先級</Label>
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="高">高</SelectItem>
                  <SelectItem value="一般">一般</SelectItem>
                  <SelectItem value="低">低</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>通知內容 *</Label>
            <Textarea rows={5} placeholder="輸入通知內容..." value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
          </div>

          <Separator />

          <div className="space-y-3">
            <Label className="text-base font-semibold">通知對象</Label>
            <Select value={form.targetType} onValueChange={(v) => { setForm({ ...form, targetType: v }); setSelectedDeptIds([]); setSelectedEmpIds([]); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={TARGET_COMPANY}>全公司</SelectItem>
                <SelectItem value={TARGET_DEPT}>指定部門</SelectItem>
                <SelectItem value={TARGET_USER}>指定人員</SelectItem>
              </SelectContent>
            </Select>

            {form.targetType === TARGET_COMPANY && (
              <div className="rounded-lg border p-4 bg-muted/30">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />通知將發送給全公司所有在職員工
                </div>
              </div>
            )}

            {form.targetType === TARGET_DEPT && (
              <div className="rounded-lg border p-4 space-y-3">
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <Building2 className="h-4 w-4" /> 選擇要通知的部門（可多選）
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[200px] overflow-y-auto">
                  {departments.length === 0 ? (
                    <p className="text-sm text-muted-foreground col-span-full text-center py-3">無部門</p>
                  ) : departments.map((dept) => (
                    <label key={dept.id} className="flex items-center gap-2 rounded-md border p-3 cursor-pointer hover:bg-muted/50 transition-colors">
                      <Checkbox checked={selectedDeptIds.includes(dept.id)} onCheckedChange={() => setSelectedDeptIds((p) => toggle(p, dept.id))} />
                      <span className="text-sm">{dept.name}</span>
                    </label>
                  ))}
                </div>
                {selectedDeptIds.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="text-xs text-muted-foreground">已選：</span>
                    {departments.filter((d) => selectedDeptIds.includes(d.id)).map((d) => <Badge key={d.id} variant="secondary" className="text-xs">{d.name}</Badge>)}
                  </div>
                )}
              </div>
            )}

            {form.targetType === TARGET_USER && (
              <div className="rounded-lg border p-4 space-y-3">
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <Users className="h-4 w-4" /> 選擇要通知的員工（可多選）
                </p>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="搜尋員工姓名..." className="pl-9 h-9" value={empSearch} onChange={(e) => setEmpSearch(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[200px] overflow-y-auto">
                  {filteredEmps.length === 0 ? (
                    <p className="text-sm text-muted-foreground col-span-full text-center py-3">無匹配結果</p>
                  ) : filteredEmps.map((emp) => (
                    <label key={emp.id} className="flex items-center gap-2 rounded-md border p-3 cursor-pointer hover:bg-muted/50 transition-colors">
                      <Checkbox checked={selectedEmpIds.includes(emp.id)} onCheckedChange={() => setSelectedEmpIds((p) => toggle(p, emp.id))} />
                      <span className="text-sm">{emp.name}</span>
                    </label>
                  ))}
                </div>
                {selectedEmpIds.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="text-xs text-muted-foreground">已選：</span>
                    {employees.filter((e) => selectedEmpIds.includes(e.id)).map((e) => <Badge key={e.id} variant="secondary" className="text-xs">{e.name}</Badge>)}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => { onOpenChange(false); reset(); }}>取消</Button>
          <Button variant="outline" disabled={saveM.isPending} onClick={() => submit(false)}>儲存草稿</Button>
          {hasPerm(NOTICE_PERM.SEND) && (
            <Button disabled={saveM.isPending} onClick={() => submit(true)}>
              {saveM.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}立即發送
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Detail Dialog ───────────────────────────────────────────

function NotificationDetailDialog({ notification, onClose, onSend }: {
  notification: NoticeBroadcast | null; onClose: () => void; onSend: (id: number) => void;
}) {
  if (!notification) return null;
  const Icon = typeIcons[notification.noticeType] || Bell;
  const isSent = notification.sendStatus === SENT;

  return (
    <Dialog open={!!notification} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10"><Icon className="h-5 w-5 text-primary" /></div>
            <div>
              <DialogTitle>{notification.title}</DialogTitle>
              <DialogDescription>{notification.noticeType || "通知"} · {notification.createdBy || "-"} · {fmtDate(notification.createTime)}</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className={statusColors[notification.sendStatusText] || ""}>{notification.sendStatusText}</Badge>
            <Badge variant="secondary" className={priorityColors[notification.priority] || ""}>優先級：{notification.priority || "-"}</Badge>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">通知內容</p>
            <p className="text-sm leading-relaxed bg-muted/30 rounded-lg p-3 whitespace-pre-wrap">{notification.content}</p>
          </div>
          <Separator />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-0.5">通知對象</p>
              <div className="flex items-center gap-1.5">
                {notification.targetType === TARGET_DEPT ? <Building2 className="h-4 w-4 text-muted-foreground" /> : <Users className="h-4 w-4 text-muted-foreground" />}
                <span className="text-sm font-medium">{(notification.targetNames || []).join("、") || notification.targetTypeText}</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-0.5">發送時間</p>
              <p className="text-sm font-medium">{isSent ? fmtDate(notification.sentTime) : "未發送"}</p>
            </div>
            {isSent && (
              <>
                <div>
                  <p className="text-sm text-muted-foreground mb-0.5">已讀人數</p>
                  <p className="text-sm font-medium">{notification.readCount} / {notification.totalCount}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-0.5">已讀率</p>
                  <p className="text-sm font-medium">{notification.totalCount > 0 ? Math.round((notification.readCount / notification.totalCount) * 100) : 0}%</p>
                </div>
              </>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>關閉</Button>
          {!isSent && hasPerm(NOTICE_PERM.SEND) && (
            <Button onClick={() => onSend(Number(notification.id))}>
              <Send className="h-4 w-4 mr-1" />立即發送
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
