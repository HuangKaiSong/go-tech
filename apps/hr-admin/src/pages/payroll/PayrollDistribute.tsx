import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  DollarSign, Plus, Search, MoreHorizontal, Eye, Send, CheckCircle,
  Users, Clock, Wallet, Ban,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { hasPerm } from "@/lib/auth";
import { PAYROLL_PERM } from "@/lib/perms";
import {
  getDistBatches, getPendingDistBatches, submitDist, executeDist, cancelDist,
  DIST_STATUS_TEXT, type DistBatch, type DistStatus,
} from "@/api/payrollDist";

const statusColors: Record<DistStatus, string> = {
  1: "bg-muted text-muted-foreground border-border",
  2: "bg-warning/10 text-warning border-warning/20",
  3: "bg-accent/10 text-accent-foreground border-accent/20",
  4: "bg-primary/10 text-primary border-primary/20",
  5: "bg-success/10 text-success border-success/20",
  6: "bg-destructive/10 text-destructive border-destructive/20",
};

const num = (v: number | null | undefined) => (v ?? 0).toLocaleString();

export default function PayrollDistribute() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [cancelTarget, setCancelTarget] = useState<DistBatch | null>(null);

  const { data: records = [] } = useQuery({
    queryKey: ["distBatches"],
    queryFn: async () => (await getDistBatches()).data ?? [],
  });

  // 「待我審核」數量：後端 /pending 已按當前用戶為當前級合法審批人過濾
  const { data: myPending = [] } = useQuery({
    queryKey: ["myPendingDist"],
    queryFn: async () => (await getPendingDistBatches()).data ?? [],
  });
  const myPendingCount = myPending.length;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["distBatches"] });

  const submitM = useMutation({ mutationFn: (id: number) => submitDist(id), onSuccess: () => { toast.success(t("已提交審核")); invalidate(); }, onError: (e: any) => toast.error(e?.message || t("操作失敗")) });
  const executeM = useMutation({ mutationFn: (id: number) => executeDist(id), onSuccess: () => { toast.success(t("薪資已發放")); invalidate(); }, onError: (e: any) => toast.error(e?.message || t("操作失敗")) });
  const cancelM = useMutation({ mutationFn: (id: number) => cancelDist(id), onSuccess: () => { toast.success(t("已取消")); invalidate(); setCancelTarget(null); }, onError: (e: any) => toast.error(e?.message || t("操作失敗")) });

  const filtered = records.filter(r => {
    const matchSearch = (r.period || "").includes(search) || (r.payrollGroup || "").includes(search);
    const matchStatus = statusFilter === "all" || String(r.status) === statusFilter;
    return matchSearch && matchStatus;
  });

  const paidRecords = records.filter(r => r.status === 5);
  const totalPaid = paidRecords.reduce((s, r) => s + (r.totalNet ?? 0), 0);
  const pendingCount = records.filter(r => [1, 2, 3].includes(r.status)).length;

  const stats = [
    { label: "累計已發放", value: `HK$ ${num(totalPaid)}`, icon: Wallet, color: "text-primary" },
    { label: "已發放批次", value: t("{{n}} 筆", { n: paidRecords.length }), icon: CheckCircle, color: "text-success" },
    { label: "待處理", value: t("{{n}} 筆", { n: pendingCount }), icon: Clock, color: "text-warning" },
    { label: "待審核", value: t("{{n}} 筆", { n: records.filter(r => r.status === 2).length }), icon: Users, color: "text-accent-foreground" },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("發薪管理")}</h1>
          <p className="text-muted-foreground mt-1">{t("由已確認核算批次生成發放批次，四級審核後執行發放")}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/payroll/distribute/approval")} className="gap-2">
            <CheckCircle className="h-4 w-4" /> {t("發薪審核")}
            {myPendingCount > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 min-w-5 px-1 text-xs">{myPendingCount}</Badge>
            )}
          </Button>
          {hasPerm(PAYROLL_PERM.DIST_GENERATE) && (
          <Button onClick={() => navigate("/payroll/distribute/new")} className="gap-2">
            <Plus className="h-4 w-4" /> {t("新增發薪批次")}
          </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map(s => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t(s.label)}</p>
                <p className="text-xl font-bold text-foreground">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder={t("搜尋期間或群組...")} value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder={t("狀態篩選")} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("全部狀態")}</SelectItem>
                {Object.entries(DIST_STATUS_TEXT).map(([k, v]) => <SelectItem key={k} value={k}>{t(v)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("薪資期間")}</TableHead>
                <TableHead>{t("發放群組")}</TableHead>
                <TableHead>{t("發薪人數")}</TableHead>
                <TableHead className="text-right">{t("應發總額")}</TableHead>
                <TableHead className="text-right">{t("扣款總額")}</TableHead>
                <TableHead className="text-right">{t("實發總額")}</TableHead>
                <TableHead className="text-right">{t("公司承擔")}</TableHead>
                <TableHead>{t("發薪日期")}</TableHead>
                <TableHead>{t("狀態")}</TableHead>
                <TableHead className="text-right">{t("操作")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(r => (
                <TableRow key={r.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/payroll/distribute/${r.id}`)}>
                  <TableCell className="font-medium">{r.period}</TableCell>
                  <TableCell><Badge variant="outline" className="bg-muted/50 text-muted-foreground border-border">{r.payrollGroup}</Badge></TableCell>
                  <TableCell>{t("{{n}} 人", { n: r.employeeCount })}</TableCell>
                  <TableCell className="text-right">{num(r.totalGross)}</TableCell>
                  <TableCell className="text-right text-destructive">{num(r.totalDeduction)}</TableCell>
                  <TableCell className="text-right font-semibold">{num(r.totalNet)}</TableCell>
                  <TableCell className="text-right text-accent-foreground">{num(r.totalEmployerContribution)}</TableCell>
                  <TableCell>{r.payDate ?? "—"}</TableCell>
                  <TableCell><Badge variant="outline" className={statusColors[r.status]}>{t(DIST_STATUS_TEXT[r.status])}</Badge></TableCell>
                  <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/payroll/distribute/${r.id}`)}>
                          <Eye className="mr-2 h-4 w-4" /> {t("查看詳情")}
                        </DropdownMenuItem>
                        {r.status === 1 && hasPerm(PAYROLL_PERM.DIST_GENERATE) && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => submitM.mutate(r.id)}>
                              <Send className="mr-2 h-4 w-4" /> {t("提交審核")}
                            </DropdownMenuItem>
                          </>
                        )}
                        {r.status === 3 && hasPerm(PAYROLL_PERM.DIST_EXECUTE) && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => executeM.mutate(r.id)}>
                              <DollarSign className="mr-2 h-4 w-4" /> {t("執行發放")}
                            </DropdownMenuItem>
                          </>
                        )}
                        {(r.status === 1 || r.status === 2) && hasPerm(PAYROLL_PERM.DIST_DELETE) && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => setCancelTarget(r)}>
                              <Ban className="mr-2 h-4 w-4" /> {t("取消")}
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground py-12">{t("沒有符合條件的記錄")}</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={!!cancelTarget} onOpenChange={() => setCancelTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("取消發薪")}</AlertDialogTitle>
            <AlertDialogDescription>{t("確定要取消 {{period}} 的發薪批次嗎？此操作無法恢復。", { period: cancelTarget?.period ?? "" })}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("返回")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => cancelTarget && cancelM.mutate(cancelTarget.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{t("取消發薪")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
