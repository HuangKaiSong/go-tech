import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { DataPagination } from "@/components/common/DataPagination";
import { useNavigate } from "react-router-dom";
import { getRecordList, exportRecords, ATTENDANCE_STATUS_TEXT, SOURCE_SUPPLEMENT } from "@/api/attendance";
import { toast } from "sonner";
import { hasPerm } from "@/lib/auth";
import { ATTENDANCE_PERM } from "@/lib/perms";
import { Clock, BarChart3, Table2, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from "recharts";
import { Search, Download, RotateCcw, Loader2 } from "lucide-react";

/** 表格/图表统一使用的行结构 */
type RecordRow = { id: number; name: string; department: string; date: string; clockIn: string; clockOut: string; status: string; source?: number; remark?: string; clockInPhoto?: string; clockOutPhoto?: string };

const statusColors: Record<string, string> = {
  "正常": "bg-success/10 text-success border-success/20",
  "遲到": "bg-warning/10 text-warning border-warning/20",
  "早退": "bg-orange-500/10 text-orange-500 border-orange-500/20",
  "請假": "bg-primary/10 text-primary border-primary/20",
  "休息": "bg-muted text-muted-foreground border-border",
  "曠工": "bg-destructive/10 text-destructive border-destructive/20",
};

const pieColors = [
  "hsl(142, 60%, 40%)",
  "hsl(38, 92%, 50%)",
  "hsl(24, 90%, 50%)",
  "hsl(215, 70%, 55%)",
  "hsl(220, 10%, 70%)",
  "hsl(0, 72%, 51%)",
];

const months = [
  { value: "all", label: "全部月份" },
  { value: "01", label: "1月" }, { value: "02", label: "2月" }, { value: "03", label: "3月" },
  { value: "04", label: "4月" }, { value: "05", label: "5月" }, { value: "06", label: "6月" },
  { value: "07", label: "7月" }, { value: "08", label: "8月" }, { value: "09", label: "9月" },
  { value: "10", label: "10月" }, { value: "11", label: "11月" }, { value: "12", label: "12月" },
];

export default function AttendanceRecords() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<"table" | "chart">("table");
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [month, setMonth] = useState(String(new Date().getMonth() + 1).padStart(2, "0"));
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<RecordRow[]>([]);
  const [current, setCurrent] = useState(1);
  const [size, setSize] = useState(10);

  // 年份选项：当前年及往前两年，动态生成；若已选年份不在其中(翻页到更早/更晚)则并入
  const yearOptions = useMemo(() => {
    const cy = new Date().getFullYear();
    const base = [cy - 2, cy - 1, cy].map(String);
    return base.includes(year) ? base : [...base, year].sort();
  }, [year]);

  // 按年/月从后端拉取全员记录（搜索仍在前端过滤，保证图表随搜索联动）
  useEffect(() => {
    getRecordList({ year: Number(year), month: month === "all" ? undefined : Number(month) })
      .then((res) => {
        const list = (res.data ?? []).map((r) => ({
          id: r.id,
          name: r.name ?? "",
          department: r.department ?? "",
          date: r.date,
          clockIn: r.clockIn ?? "-",
          clockOut: r.clockOut ?? "-",
          status: ATTENDANCE_STATUS_TEXT[r.statusCode] ?? (r.status ?? "-"),
          source: r.source,
          remark: r.remark,
          clockInPhoto: r.clockInPhoto,
          clockOutPhoto: r.clockOutPhoto,
        }));
        setRows(list);
      })
      .catch(() => setRows([]));
  }, [year, month]);

  const filteredData = useMemo(() => {
    return rows.filter((row) =>
      !search || row.name.includes(search) || row.department.includes(search),
    );
  }, [rows, search]);

  // 分頁只切表格；圖表與統計仍取 filteredData 全量，否則會變成「本頁的分布」
  const pagedData = useMemo(
    () => filteredData.slice((current - 1) * size, current * size),
    [filteredData, current, size],
  );

  // 篩選變動後回到第一頁，避免停在超出範圍的頁碼上導致空白表格
  useEffect(() => {
    setCurrent(1);
  }, [search, year, month]);

  // Chart data
  const statusDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredData.forEach((r) => { counts[r.status] = (counts[r.status] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredData]);

  const deptDistribution = useMemo(() => {
    const depts: Record<string, Record<string, number>> = {};
    filteredData.forEach((r) => {
      if (!depts[r.department]) depts[r.department] = {};
      depts[r.department][r.status] = (depts[r.department][r.status] || 0) + 1;
    });
    return Object.entries(depts).map(([dept, statuses]) => ({
      dept,
      正常: statuses["正常"] || 0,
      遲到: statuses["遲到"] || 0,
      早退: statuses["早退"] || 0,
      請假: statuses["請假"] || 0,
      休息: statuses["休息"] || 0,
      曠工: statuses["曠工"] || 0,
    }));
  }, [filteredData]);

  const dailyTrend = useMemo(() => {
    const days: Record<string, { total: number; normal: number }> = {};
    filteredData.forEach((r) => {
      const d = r.date.slice(5);
      if (!days[d]) days[d] = { total: 0, normal: 0 };
      days[d].total++;
      if (r.status === "正常") days[d].normal++;
    });
    return Object.entries(days)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({
        date,
        出勤率: v.total > 0 ? Math.round((v.normal / v.total) * 100) : 0,
      }));
  }, [filteredData]);

  const [exporting, setExporting] = useState(false);
  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await exportRecords({
        year: Number(year),
        month: month === "all" ? undefined : Number(month),
        keyword: search.trim() || undefined,
      });
      let fileName = "打卡記錄.xlsx";
      const disposition = res.headers?.["content-disposition"];
      const match = disposition && /filename\*?=(?:utf-8'')?([^;]+)/i.exec(disposition);
      if (match && match[1]) {
        fileName = decodeURIComponent(match[1].replace(/["']/g, ""));
      }
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(t("匯出成功"));
    } catch (err: any) {
      toast.error(err.message || t("匯出失敗"));
    } finally {
      setExporting(false);
    }
  };

  const handlePrevMonth = () => {
    const m = parseInt(month === "all" ? "01" : month);
    if (m <= 1) { setYear(String(parseInt(year) - 1)); setMonth("12"); }
    else setMonth(String(m - 1).padStart(2, "0"));
  };
  const handleNextMonth = () => {
    const m = parseInt(month === "all" ? "12" : month);
    if (m >= 12) { setYear(String(parseInt(year) + 1)); setMonth("01"); }
    else setMonth(String(m + 1).padStart(2, "0"));
  };

  // 重置年月與搜尋，回到當月（頁碼由篩選變動的 effect 自動歸 1）
  const handleReset = () => {
    setYear(String(new Date().getFullYear()));
    setMonth(String(new Date().getMonth() + 1).padStart(2, "0"));
    setSearch("");
  };

  const stats = useMemo(() => {
    const total = filteredData.length;
    const normal = filteredData.filter((r) => r.status === "正常").length;
    const late = filteredData.filter((r) => r.status === "遲到").length;
    const earlyLeave = filteredData.filter((r) => r.status === "早退").length;
    const leave = filteredData.filter((r) => r.status === "請假").length;
    const rest = filteredData.filter((r) => r.status === "休息").length;
    const absent = filteredData.filter((r) => r.status === "曠工").length;
    return { total, normal, late, earlyLeave, leave, rest, absent, rate: total > 0 ? ((normal / total) * 100).toFixed(1) : "0" };
  }, [filteredData]);

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Clock className="h-6 w-6 text-primary" />
            {t("打卡記錄")}
          </h1>
          <p className="page-description">{t("查看與管理員工每日打卡記錄")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "table" | "chart")}>
            <TabsList>
              <TabsTrigger value="table" className="gap-1"><Table2 className="h-4 w-4" />{t("列表")}</TabsTrigger>
              <TabsTrigger value="chart" className="gap-1"><BarChart3 className="h-4 w-4" />{t("報表")}</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-4 mb-4">
        {[
          { label: "總記錄", value: stats.total, color: "text-foreground", clickable: true },
          { label: "正常出勤", value: stats.normal, color: "text-success", clickable: false },
          { label: "遲到", value: stats.late, color: "text-warning", clickable: false },
          { label: "早退", value: stats.earlyLeave, color: "text-orange-500", clickable: false },
          { label: "請假", value: stats.leave, color: "text-primary", clickable: false },
          { label: "休息", value: stats.rest, color: "text-muted-foreground", clickable: false },
        ].map((s) => (
          <Card
            key={s.label}
            className={s.clickable ? "cursor-pointer transition-shadow hover:shadow-md hover:border-primary/40" : ""}
            onClick={s.clickable ? () => navigate(`/attendance/records/monthly?year=${year}&month=${month}`) : undefined}
          >
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">{t(s.label)}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              {s.clickable && <p className="text-xs text-muted-foreground mt-1">{t("點擊查看詳情 →")}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="mb-4">
        <CardContent className="p-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handlePrevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger className="w-[90px] h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {yearOptions.map((y) => (
                    <SelectItem key={y} value={y}>{t("{{y}}年", { y })}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger className="w-[100px] h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {months.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{t(m.label)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="relative flex-1 min-w-[180px] max-w-sm">
              <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
              <Input placeholder={t("搜尋姓名或部門...")} className="pl-9 h-8" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" size="sm" onClick={handleReset}><RotateCcw className="h-4 w-4 mr-1" />{t("重置")}</Button>
              {hasPerm(ATTENDANCE_PERM.EXPORT) && (
                <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting}>
                  {exporting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Download className="h-4 w-4 mr-1" />}{t("匯出")}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {viewMode === "table" ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("姓名")}</TableHead>
                  <TableHead>{t("部門")}</TableHead>
                  <TableHead>{t("日期")}</TableHead>
                  <TableHead>{t("上班打卡")}</TableHead>
                  <TableHead>{t("下班打卡")}</TableHead>
                  <TableHead>{t("打卡照片")}</TableHead>
                  <TableHead>{t("狀態")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagedData.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">{t("暫無記錄")}</TableCell></TableRow>
                ) : (
                  pagedData.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{row.name}</TableCell>
                      <TableCell>{row.department}</TableCell>
                      <TableCell>{row.date}</TableCell>
                      <TableCell>{row.clockIn}</TableCell>
                      <TableCell>{row.clockOut}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {[
                            { url: row.clockInPhoto, label: t("上班") },
                            { url: row.clockOutPhoto, label: t("下班") },
                          ].filter((p) => p.url).map((p, i) => (
                            <a key={i} href={p.url} target="_blank" rel="noreferrer" title={p.label} className="block">
                              <img src={p.url} alt={p.label} className="h-9 w-9 rounded object-cover border hover:opacity-80 transition-opacity" />
                            </a>
                          ))}
                          {!row.clockInPhoto && !row.clockOutPhoto && (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Badge variant="secondary" className={statusColors[row.status] || ""}>{t(row.status)}</Badge>
                          {row.source === SOURCE_SUPPLEMENT && (
                            <Badge variant="outline" className="font-normal text-primary border-primary/30" title={row.remark}>
                              {t("補卡")}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            <DataPagination
              current={current}
              pageSize={size}
              total={filteredData.length}
              onChange={setCurrent}
              onPageSizeChange={(s) => { setSize(s); setCurrent(1); }}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">{t("出勤狀態分布")}</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={statusDistribution} cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={3} dataKey="value">
                    {statusDistribution.map((_, i) => (
                      <Cell key={i} fill={pieColors[i % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any, name: any) => [value, t(name)]} />
                  <Legend formatter={(value: any) => t(value)} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">{t("各部門出勤統計")}</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={deptDistribution}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="dept" tick={{ fill: 'hsl(215, 15%, 50%)' }} />
                  <YAxis tick={{ fill: 'hsl(215, 15%, 50%)' }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="正常" name={t("正常")} stackId="a" fill="hsl(142, 60%, 40%)" />
                  <Bar dataKey="遲到" name={t("遲到")} stackId="a" fill="hsl(38, 92%, 50%)" />
                  <Bar dataKey="早退" name={t("早退")} stackId="a" fill="hsl(24, 90%, 50%)" />
                  <Bar dataKey="請假" name={t("請假")} stackId="a" fill="hsl(215, 70%, 55%)" />
                  <Bar dataKey="休息" name={t("休息")} stackId="a" fill="hsl(220, 10%, 70%)" />
                  <Bar dataKey="曠工" name={t("曠工")} stackId="a" fill="hsl(0, 72%, 51%)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader className="pb-2"><CardTitle className="text-base">{t("每日出勤率趨勢")}</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={dailyTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fill: 'hsl(215, 15%, 50%)' }} />
                  <YAxis domain={[0, 100]} tick={{ fill: 'hsl(215, 15%, 50%)' }} unit="%" />
                  <Tooltip />
                  <Line type="monotone" dataKey="出勤率" name={t("出勤率")} stroke="hsl(142, 60%, 40%)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
