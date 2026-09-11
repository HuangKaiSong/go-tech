import { ArrowLeft, Clock, Loader2, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CELL_REST, getMonthlyOverview, type MonthlyAttendanceRow } from '@/api/attendance';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

/** 狀態碼 → 格子樣式與文案（0休息 1正常 2遲到 3早退 4曠工 5請假 6出差） */
const CELL_CONFIG: Record<number, { bg: string; label: string; name: string; text: string }> = {
  [CELL_REST]: { label: '休', name: '休息', bg: 'bg-muted', text: 'text-muted-foreground' },
  1: { label: '正', name: '正常', bg: 'bg-success/20', text: 'text-success' },
  2: { label: '遲', name: '遲到', bg: 'bg-warning/20', text: 'text-warning' },
  3: { label: '早', name: '早退', bg: 'bg-orange-500/20', text: 'text-orange-500' },
  4: { label: '曠', name: '曠工', bg: 'bg-destructive/20', text: 'text-destructive' },
  5: { label: '假', name: '請假', bg: 'bg-primary/20', text: 'text-primary' },
  6: { label: '差', name: '出差', bg: 'bg-cyan-500/20', text: 'text-cyan-600' }
};

/** 當月每日的表頭（日 + 星期），星期由真實日期推導 */
function buildDays(year: number, month: number) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const dayNames = ['日', '一', '二', '三', '四', '五', '六'];
  return Array.from({ length: daysInMonth }, (_, i) => {
    const d = i + 1;
    const dow = new Date(year, month - 1, d).getDay();
    return { day: d, dayOfWeek: dow, dayName: dayNames[dow] };
  });
}

export default function MonthlyAttendance() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const now = new Date();
  const year = Number(searchParams.get('year')) || now.getFullYear();
  const monthParam = searchParams.get('month');
  const month = monthParam && monthParam !== 'all' ? Number(monthParam) : now.getMonth() + 1;

  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [rows, setRows] = useState<MonthlyAttendanceRow[]>([]);
  const [loading, setLoading] = useState(false);

  // 按年/月拉全員矩陣；姓名搜尋在前端過濾，避免每次輸入都打後端
  useEffect(() => {
    setLoading(true);
    getMonthlyOverview({ year, month })
      .then(res => setRows(res.data ?? []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [year, month]);

  const days = useMemo(() => buildDays(year, month), [year, month]);

  // 部門選項：從當月全員矩陣去重
  const departments = useMemo(() => [...new Set(rows.map(r => r.department).filter(Boolean) as string[])], [rows]);

  // 員工姓名模糊 + 部門精確
  const filteredRows = useMemo(() => {
    const kw = search.trim();
    return rows.filter(r => {
      const nameMatch = !kw || r.name?.includes(kw);
      const deptMatch = deptFilter === 'all' || r.department === deptFilter;
      return nameMatch && deptMatch;
    });
  }, [rows, search, deptFilter]);

  const monthLabel = t('{{year}}年{{month}}月', { year, month });

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center gap-3 mb-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/attendance/records')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="page-title flex items-center gap-2">
              <Clock className="h-6 w-6 text-primary" />
              {monthLabel} {t('考勤總覽')}
            </h1>
            <p className="page-description">{t('查看 {{month}} 全部員工每日考勤狀態', { month: monthLabel })}</p>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-4">
        {Object.values(CELL_CONFIG).map(cfg => (
          <div key={cfg.name} className="flex items-center gap-1.5 text-xs">
            <span
              className={`inline-flex items-center justify-center w-6 h-6 rounded text-[10px] font-bold ${cfg.bg} ${cfg.text}`}
            >
              {cfg.label}
            </span>
            <span className="text-muted-foreground">{t(cfg.name)}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <Card className="mb-4">
        <CardContent className="p-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[180px] max-w-sm">
              <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('搜尋員工姓名...')}
                className="pl-9 h-8"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <Select value={deptFilter} onValueChange={setDeptFilter}>
              <SelectTrigger className="w-[130px] h-8">
                <SelectValue placeholder={t('部門')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('全部部門')}</SelectItem>
                {departments.map(d => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                    <th className="sticky left-0 z-10 bg-muted/80 backdrop-blur px-3 py-2 text-left font-medium text-muted-foreground min-w-[100px]">
                      {t('員工')}
                    </th>
                    {days.map(d => (
                      <th
                        key={d.day}
                        className={`px-0.5 py-2 text-center font-medium min-w-[32px] ${d.dayOfWeek === 0 || d.dayOfWeek === 6 ? 'text-muted-foreground/50' : 'text-muted-foreground'}`}
                      >
                        <div className="text-[10px] leading-tight">{d.dayName}</div>
                        <div className="text-xs">{d.day}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={days.length + 1} className="text-center py-8 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                        {t('載入中...')}
                      </td>
                    </tr>
                  ) : filteredRows.length === 0 ? (
                    <tr>
                      <td colSpan={days.length + 1} className="text-center py-8 text-muted-foreground">
                        {t('暫無記錄')}
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map(row => (
                      <tr key={row.employeeId} className="border-b hover:bg-muted/30">
                        <td className="sticky left-0 z-10 bg-background px-3 py-2">
                          <div className="font-medium text-xs">{row.name}</div>
                          <div className="text-[10px] text-muted-foreground">{row.department || '-'}</div>
                        </td>
                        {days.map(d => {
                          const status = row.days?.[d.day];
                          // 無該日鍵：應出勤卻無記錄（日結未跑）或未在職，留空
                          if (status === undefined || status === null) {
                            return (
                              <td key={d.day} className="px-0.5 py-1.5 text-center">
                                <span className="text-muted-foreground/30">·</span>
                              </td>
                            );
                          }
                          const cfg = CELL_CONFIG[status] || CELL_CONFIG[1];
                          return (
                            <td key={d.day} className="px-0.5 py-1.5 text-center">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span
                                    className={`inline-flex items-center justify-center w-7 h-7 rounded text-[10px] font-bold cursor-default ${cfg.bg} ${cfg.text}`}
                                  >
                                    {cfg.label}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="text-xs">
                                  {month}/{d.day} {d.dayName} - {t(cfg.name)}
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
