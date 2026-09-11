import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { DataPagination } from "@/components/common/DataPagination";
import { GraduationCap, Search, Download, Users, CheckCircle, Clock, Award, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { hasPerm } from "@/lib/auth";
import { TRAINING_PERM } from "@/lib/perms";
import {
  getTrainingRecordPage, exportTrainingRecords, getTrainingPlanOptions,
  type TrainingRecord,
} from "@/api/training";
import { getDepartmentOptions } from "@/api/department";

const statusColors: Record<string, string> = {
  "未開始": "bg-muted text-muted-foreground border-border",
  "進行中": "bg-primary/10 text-primary border-primary/20",
  "已完成": "bg-success/10 text-success border-success/20",
  "未通過": "bg-destructive/10 text-destructive border-destructive/20",
};

const certColors: Record<string, string> = {
  "已發放": "bg-success/10 text-success border-success/20",
  "未發放": "bg-warning/10 text-warning border-warning/20",
  "不適用": "bg-muted text-muted-foreground border-border",
};

const statusOptions = [
  { value: 0, label: "未開始" },
  { value: 1, label: "進行中" },
  { value: 2, label: "已完成" },
  { value: 3, label: "未通過" },
];

export default function TrainingRecords() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState("all");
  const [current, setCurrent] = useState(1);
  const [size, setSize] = useState(10);
  const [exporting, setExporting] = useState(false);

  const params = {
    current, size,
    keyword: search || undefined,
    planId: planFilter === "all" ? undefined : planFilter,
    pStatus: statusFilter === "all" ? undefined : Number(statusFilter),
    departmentName: deptFilter === "all" ? undefined : deptFilter,
  };

  const { data, isLoading } = useQuery({
    queryKey: ["training-records", params],
    queryFn: () => getTrainingRecordPage(params).then((r) => r.data),
  });
  const rows = data?.records ?? [];
  const total = data?.total ?? 0;

  const { data: plans = [] } = useQuery({
    queryKey: ["training-plan-options"],
    queryFn: () => getTrainingPlanOptions().then((r) => r.data),
  });

  const { data: departments = [] } = useQuery({
    queryKey: ["dept-options"],
    queryFn: () => getDepartmentOptions().then((r) => r.data),
  });

  const stats = useMemo(() => {
    const completed = rows.filter((r) => r.pStatus === 2).length;
    const inProgress = rows.filter((r) => r.pStatus === 1).length;
    const certed = rows.filter((r) => r.certificateText === "已發放").length;
    return [
      { label: "培訓記錄總數", value: `${total}`, icon: Users, color: "text-primary" },
      { label: "本頁已完成", value: `${completed}`, icon: CheckCircle, color: "text-success" },
      { label: "本頁進行中", value: `${inProgress}`, icon: Clock, color: "text-warning" },
      { label: "本頁已發證", value: `${certed}`, icon: Award, color: "text-accent-foreground" },
    ];
  }, [rows, total]);

  const resetPage = () => setCurrent(1);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await exportTrainingRecords({
        keyword: search || undefined,
        planId: planFilter === "all" ? undefined : planFilter,
        pStatus: statusFilter === "all" ? undefined : Number(statusFilter),
        departmentName: deptFilter === "all" ? undefined : deptFilter,
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = `${t("培訓記錄")}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success(t("匯出成功"));
    } catch {
      toast.error(t("匯出失敗"));
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" /> {t("培訓記錄")}
          </h1>
          <p className="text-muted-foreground mt-1">{t("員工培訓學習進度與完成情況記錄")}</p>
        </div>
        {hasPerm(TRAINING_PERM.RECORD_EXPORT) && (
          <Button className="gap-2" variant="outline" disabled={exporting} onClick={handleExport}>
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} {t("匯出")}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label}><CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
              <s.icon className={`h-5 w-5 ${s.color}`} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t(s.label)}</p>
              <p className="text-xl font-bold text-foreground">{s.value}</p>
            </div>
          </CardContent></Card>
        ))}
      </div>

      <Card><CardContent className="p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder={t("搜尋員工姓名...")} value={search} onChange={(e) => { setSearch(e.target.value); resetPage(); }} className="pl-9" />
          </div>
          <Select value={planFilter} onValueChange={(v) => { setPlanFilter(v); resetPage(); }}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder={t("培訓計劃")} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("全部計劃")}</SelectItem>
              {plans.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={deptFilter} onValueChange={(v) => { setDeptFilter(v); resetPage(); }}>
            <SelectTrigger className="w-[130px]"><SelectValue placeholder={t("部門")} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("全部部門")}</SelectItem>
              {departments.map((d) => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); resetPage(); }}>
            <SelectTrigger className="w-[120px]"><SelectValue placeholder={t("狀態")} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("全部狀態")}</SelectItem>
              {statusOptions.map((s) => <SelectItem key={s.value} value={String(s.value)}>{t(s.label)}</SelectItem>)}
            </SelectContent>
          </Select>
          {(search || planFilter !== "all" || statusFilter !== "all" || deptFilter !== "all") && (
            <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setPlanFilter("all"); setStatusFilter("all"); setDeptFilter("all"); resetPage(); }}>{t("清除篩選")}</Button>
          )}
        </div>
      </CardContent></Card>

      <Card><CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("員工")}</TableHead>
              <TableHead>{t("部門")}</TableHead>
              <TableHead>{t("培訓計劃")}</TableHead>
              <TableHead>{t("進度")}</TableHead>
              <TableHead>{t("成績")}</TableHead>
              <TableHead>{t("狀態")}</TableHead>
              <TableHead>{t("證書")}</TableHead>
              <TableHead>{t("完成時間")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r: TrainingRecord) => (
              <TableRow key={r.id}>
                <TableCell>
                  <div>
                    <p className="font-medium text-sm">{r.employeeName}</p>
                    <p className="text-xs text-muted-foreground">{r.position}</p>
                  </div>
                </TableCell>
                <TableCell className="text-sm">{r.departmentName}</TableCell>
                <TableCell>
                  <div>
                    <p className="text-sm">{r.planName}</p>
                    {r.planType && <p className="text-xs text-muted-foreground">{r.planType}</p>}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress value={r.progress} className="w-16 h-1.5" />
                    <span className="text-xs text-muted-foreground">{r.completedModules}/{r.totalModules}</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm">{r.score ?? "-"}</TableCell>
                <TableCell><Badge variant="outline" className={statusColors[r.pStatusText]}>{t(r.pStatusText)}</Badge></TableCell>
                <TableCell><Badge variant="outline" className={certColors[r.certificateText]}>{t(r.certificateText)}</Badge></TableCell>
                <TableCell className="text-sm text-muted-foreground">{r.completedAt || "-"}</TableCell>
              </TableRow>
            ))}
            {!isLoading && rows.length === 0 && (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-12">{t("沒有符合條件的培訓記錄")}</TableCell></TableRow>
            )}
            {isLoading && (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                <Loader2 className="h-5 w-5 animate-spin inline mr-2" />{t("載入中...")}
              </TableCell></TableRow>
            )}
          </TableBody>
        </Table>
        {total > 0 && (
          <div className="p-4">
            <DataPagination current={current} pageSize={size} total={total}
              onChange={setCurrent} onPageSizeChange={(s) => { setSize(s); setCurrent(1); }} />
          </div>
        )}
      </CardContent></Card>
    </div>
  );
}
