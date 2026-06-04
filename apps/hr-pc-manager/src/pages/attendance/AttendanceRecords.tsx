import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
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
import { Search, Plus, Download, Filter } from "lucide-react";

const allData = [
  { name: "張小明", department: "技術部", date: "2026-01-05", clockIn: "08:55", clockOut: "18:05", status: "正常" },
  { name: "李文華", department: "銷售部", date: "2026-01-06", clockIn: "09:15", clockOut: "18:30", status: "遲到" },
  { name: "王美玲", department: "人事部", date: "2026-01-07", clockIn: "08:50", clockOut: "18:00", status: "正常" },
  { name: "陳大偉", department: "市場部", date: "2026-01-08", clockIn: "-", clockOut: "-", status: "請假" },
  { name: "林佳蓉", department: "財務部", date: "2026-01-10", clockIn: "08:45", clockOut: "17:55", status: "正常" },
  { name: "張小明", department: "技術部", date: "2026-02-03", clockIn: "08:50", clockOut: "18:10", status: "正常" },
  { name: "李文華", department: "銷售部", date: "2026-02-04", clockIn: "09:20", clockOut: "18:25", status: "遲到" },
  { name: "王美玲", department: "人事部", date: "2026-02-05", clockIn: "08:45", clockOut: "18:00", status: "正常" },
  { name: "陳大偉", department: "市場部", date: "2026-02-06", clockIn: "-", clockOut: "-", status: "曠工" },
  { name: "林佳蓉", department: "財務部", date: "2026-02-07", clockIn: "08:40", clockOut: "17:50", status: "正常" },
  // 3月份完整記錄
  { name: "張小明", department: "技術部", date: "2026-03-02", clockIn: "08:55", clockOut: "18:05", status: "正常" },
  { name: "李文華", department: "銷售部", date: "2026-03-02", clockIn: "09:10", clockOut: "18:30", status: "遲到" },
  { name: "王美玲", department: "人事部", date: "2026-03-02", clockIn: "08:50", clockOut: "18:00", status: "正常" },
  { name: "陳大偉", department: "市場部", date: "2026-03-02", clockIn: "-", clockOut: "-", status: "請假" },
  { name: "林佳蓉", department: "財務部", date: "2026-03-02", clockIn: "08:45", clockOut: "17:55", status: "正常" },
  { name: "趙志強", department: "技術部", date: "2026-03-03", clockIn: "09:05", clockOut: "18:15", status: "遲到" },
  { name: "黃雅琪", department: "銷售部", date: "2026-03-03", clockIn: "08:30", clockOut: "17:30", status: "正常" },
  { name: "周建國", department: "運營部", date: "2026-03-03", clockIn: "-", clockOut: "-", status: "曠工" },
  { name: "張小明", department: "技術部", date: "2026-03-04", clockIn: "08:50", clockOut: "17:20", status: "早退" },
  { name: "李文華", department: "銷售部", date: "2026-03-04", clockIn: "-", clockOut: "-", status: "休息" },
  { name: "王美玲", department: "人事部", date: "2026-03-04", clockIn: "08:45", clockOut: "18:00", status: "正常" },
  { name: "陳大偉", department: "市場部", date: "2026-03-05", clockIn: "-", clockOut: "-", status: "請假" },
  { name: "林佳蓉", department: "財務部", date: "2026-03-05", clockIn: "08:40", clockOut: "17:10", status: "早退" },
  { name: "趙志強", department: "技術部", date: "2026-03-05", clockIn: "08:55", clockOut: "18:05", status: "正常" },
  { name: "黃雅琪", department: "銷售部", date: "2026-03-06", clockIn: "-", clockOut: "-", status: "休息" },
  { name: "周建國", department: "運營部", date: "2026-03-06", clockIn: "08:30", clockOut: "18:00", status: "正常" },
  { name: "張小明", department: "技術部", date: "2026-03-06", clockIn: "08:55", clockOut: "18:05", status: "正常" },
  { name: "李文華", department: "銷售部", date: "2026-03-07", clockIn: "09:25", clockOut: "18:30", status: "遲到" },
  { name: "王美玲", department: "人事部", date: "2026-03-07", clockIn: "-", clockOut: "-", status: "請假" },
  { name: "陳大偉", department: "市場部", date: "2026-03-08", clockIn: "-", clockOut: "-", status: "休息" },
  { name: "林佳蓉", department: "財務部", date: "2026-03-08", clockIn: "08:45", clockOut: "17:55", status: "正常" },
  { name: "趙志強", department: "技術部", date: "2026-03-09", clockIn: "08:50", clockOut: "18:10", status: "正常" },
];

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
  const [viewMode, setViewMode] = useState<"table" | "chart">("table");
  const [year, setYear] = useState("2026");
  const [month, setMonth] = useState("03");
  const [search, setSearch] = useState("");

  const filteredData = useMemo(() => {
    return allData.filter((row) => {
      const [y, m] = row.date.split("-");
      const yearMatch = y === year;
      const monthMatch = month === "all" || m === month;
      const searchMatch = !search || row.name.includes(search) || row.department.includes(search);
      return yearMatch && monthMatch && searchMatch;
    });
  }, [year, month, search]);

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
            打卡記錄
          </h1>
          <p className="page-description">查看與管理員工每日打卡記錄</p>
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "table" | "chart")}>
            <TabsList>
              <TabsTrigger value="table" className="gap-1"><Table2 className="h-4 w-4" />列表</TabsTrigger>
              <TabsTrigger value="chart" className="gap-1"><BarChart3 className="h-4 w-4" />報表</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button size="sm"><Plus className="h-4 w-4 mr-1" />補卡申請</Button>
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
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              {s.clickable && <p className="text-xs text-muted-foreground mt-1">點擊查看詳情 →</p>}
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
                  {["2024", "2025", "2026"].map((y) => (
                    <SelectItem key={y} value={y}>{y}年</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger className="w-[100px] h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {months.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="relative flex-1 min-w-[180px] max-w-sm">
              <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="搜尋姓名或部門..." className="pl-9 h-8" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" size="sm"><Filter className="h-4 w-4 mr-1" />篩選</Button>
              <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1" />匯出</Button>
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
                  <TableHead>姓名</TableHead>
                  <TableHead>部門</TableHead>
                  <TableHead>日期</TableHead>
                  <TableHead>上班打卡</TableHead>
                  <TableHead>下班打卡</TableHead>
                  <TableHead>狀態</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">暫無記錄</TableCell></TableRow>
                ) : (
                  filteredData.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{row.name}</TableCell>
                      <TableCell>{row.department}</TableCell>
                      <TableCell>{row.date}</TableCell>
                      <TableCell>{row.clockIn}</TableCell>
                      <TableCell>{row.clockOut}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={statusColors[row.status] || ""}>{row.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">出勤狀態分布</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={statusDistribution} cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={3} dataKey="value">
                    {statusDistribution.map((_, i) => (
                      <Cell key={i} fill={pieColors[i % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">各部門出勤統計</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={deptDistribution}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="dept" tick={{ fill: 'hsl(215, 15%, 50%)' }} />
                  <YAxis tick={{ fill: 'hsl(215, 15%, 50%)' }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="正常" stackId="a" fill="hsl(142, 60%, 40%)" />
                  <Bar dataKey="遲到" stackId="a" fill="hsl(38, 92%, 50%)" />
                  <Bar dataKey="早退" stackId="a" fill="hsl(24, 90%, 50%)" />
                  <Bar dataKey="請假" stackId="a" fill="hsl(215, 70%, 55%)" />
                  <Bar dataKey="休息" stackId="a" fill="hsl(220, 10%, 70%)" />
                  <Bar dataKey="曠工" stackId="a" fill="hsl(0, 72%, 51%)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader className="pb-2"><CardTitle className="text-base">每日出勤率趨勢</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={dailyTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fill: 'hsl(215, 15%, 50%)' }} />
                  <YAxis domain={[0, 100]} tick={{ fill: 'hsl(215, 15%, 50%)' }} unit="%" />
                  <Tooltip />
                  <Line type="monotone" dataKey="出勤率" stroke="hsl(142, 60%, 40%)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
