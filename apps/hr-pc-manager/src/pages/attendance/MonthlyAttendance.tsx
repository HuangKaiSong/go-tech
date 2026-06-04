import { useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, Download, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";

const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
  "正常": { label: "正", bg: "bg-success/20", text: "text-success" },
  "遲到": { label: "遲", bg: "bg-warning/20", text: "text-warning" },
  "早退": { label: "早", bg: "bg-orange-500/20", text: "text-orange-500" },
  "請假": { label: "假", bg: "bg-primary/20", text: "text-primary" },
  "休息": { label: "休", bg: "bg-muted", text: "text-muted-foreground" },
  "曠工": { label: "曠", bg: "bg-destructive/20", text: "text-destructive" },
};

const employees = [
  { name: "張小明", department: "技術部" },
  { name: "李文華", department: "銷售部" },
  { name: "王美玲", department: "人事部" },
  { name: "陳大偉", department: "市場部" },
  { name: "林佳蓉", department: "財務部" },
  { name: "趙志強", department: "技術部" },
  { name: "黃雅琪", department: "銷售部" },
  { name: "周建國", department: "運營部" },
];

const statuses = ["正常", "遲到", "早退", "請假", "休息", "曠工"];

function generateMonthGrid(year: string, month: string) {
  const y = parseInt(year);
  const m = parseInt(month);
  const daysInMonth = new Date(y, m, 0).getDate();

  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const d = i + 1;
    const date = new Date(y, m - 1, d);
    const dayNames = ["日", "一", "二", "三", "四", "五", "六"];
    return { day: d, dayOfWeek: date.getDay(), dayName: dayNames[date.getDay()] };
  });

  const grid: Record<string, { department: string; days: Record<number, string> }> = {};

  employees.forEach((emp) => {
    grid[emp.name] = { department: emp.department, days: {} };
    for (let d = 1; d <= daysInMonth; d++) {
      const dayOfWeek = new Date(y, m - 1, d).getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        grid[emp.name].days[d] = "休息";
        continue;
      }
      const seed = (emp.name.charCodeAt(0) * 31 + d * 7 + m) % 100;
      if (seed < 65) grid[emp.name].days[d] = "正常";
      else if (seed < 80) grid[emp.name].days[d] = "遲到";
      else if (seed < 88) grid[emp.name].days[d] = "早退";
      else if (seed < 95) grid[emp.name].days[d] = "請假";
      else grid[emp.name].days[d] = "曠工";
    }
  });

  return { days, grid };
}

export default function MonthlyAttendance() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paramYear = searchParams.get("year") || "2026";
  const paramMonth = searchParams.get("month") || "03";

  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");

  const { days, grid } = useMemo(() => generateMonthGrid(paramYear, paramMonth), [paramYear, paramMonth]);

  const filteredEmployees = useMemo(() => {
    return Object.entries(grid).filter(([name, info]) => {
      const searchMatch = !search || name.includes(search) || info.department.includes(search);
      const deptMatch = deptFilter === "all" || info.department === deptFilter;
      return searchMatch && deptMatch;
    });
  }, [grid, search, deptFilter]);

  const departments = useMemo(() => [...new Set(Object.values(grid).map((v) => v.department))], [grid]);
  const monthLabel = `${paramYear}年${parseInt(paramMonth)}月`;

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center gap-3 mb-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/attendance/records")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="page-title flex items-center gap-2">
              <Clock className="h-6 w-6 text-primary" />
              {monthLabel} 考勤總覽
            </h1>
            <p className="page-description">查看 {monthLabel} 全部員工每日考勤狀態</p>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-4">
        {Object.entries(statusConfig).map(([status, cfg]) => (
          <div key={status} className="flex items-center gap-1.5 text-xs">
            <span className={`inline-flex items-center justify-center w-6 h-6 rounded text-[10px] font-bold ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
            <span className="text-muted-foreground">{status}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <Card className="mb-4">
        <CardContent className="p-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[180px] max-w-sm">
              <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="搜尋姓名或部門..." className="pl-9 h-8" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={deptFilter} onValueChange={setDeptFilter}>
              <SelectTrigger className="w-[110px] h-8"><SelectValue placeholder="部門" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部部門</SelectItem>
                {departments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="ml-auto"><Download className="h-4 w-4 mr-1" />匯出</Button>
          </div>
        </CardContent>
      </Card>

      {/* Grid Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <TooltipProvider delayDuration={100}>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="sticky left-0 z-10 bg-muted/80 backdrop-blur px-3 py-2 text-left font-medium text-muted-foreground min-w-[100px]">員工</th>
                    {days.map((d) => (
                      <th key={d.day} className={`px-0.5 py-2 text-center font-medium min-w-[32px] ${d.dayOfWeek === 0 || d.dayOfWeek === 6 ? "text-muted-foreground/50" : "text-muted-foreground"}`}>
                        <div className="text-[10px] leading-tight">{d.dayName}</div>
                        <div className="text-xs">{d.day}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.length === 0 ? (
                    <tr><td colSpan={days.length + 1} className="text-center py-8 text-muted-foreground">暫無記錄</td></tr>
                  ) : (
                    filteredEmployees.map(([name, info]) => (
                      <tr key={name} className="border-b hover:bg-muted/30">
                        <td className="sticky left-0 z-10 bg-background px-3 py-2">
                          <div className="font-medium text-xs">{name}</div>
                          <div className="text-[10px] text-muted-foreground">{info.department}</div>
                        </td>
                        {days.map((d) => {
                          const status = info.days[d.day];
                          const cfg = statusConfig[status] || statusConfig["正常"];
                          return (
                            <td key={d.day} className="px-0.5 py-1.5 text-center">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className={`inline-flex items-center justify-center w-7 h-7 rounded text-[10px] font-bold cursor-default ${cfg.bg} ${cfg.text}`}>
                                    {cfg.label}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="text-xs">
                                  {paramMonth}/{d.day} {d.dayName} - {status}
                                </TooltipContent>
                              </Tooltip>
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </TooltipProvider>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
