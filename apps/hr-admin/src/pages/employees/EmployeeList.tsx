import {
  AlertCircle,
  CheckCircle2,
  Download,
  Eye,
  Loader2,
  Mail,
  Plus,
  RotateCcw,
  Search,
  Upload,
  UserCheck,
  UserPlus,
  Users
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  type Employee,
  exportEmployee,
  getEmployeeList,
  getEmployeeStatusCount,
  resendInvite,
  submitEmployee
} from '@/api/employee';
import { DataPagination } from '@/components/common/DataPagination';
import { AddEmployeeDialog } from '@/components/employees/AddEmployeeDialog';
import { ExcelImportDialog } from '@/components/employees/ExcelImportDialog';
import { HRCompleteDialog } from '@/components/employees/HRCompleteDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { hasPerm } from '@/lib/auth';
import { EMP_PERM } from '@/lib/perms';

const columns = [
  { key: 'employeeNo', label: '工號' },
  { key: 'name', label: '姓名' },
  { key: 'department', label: '部門' },
  { key: 'position', label: '職位' },
  { key: 'phone', label: '聯絡電話' },
  { key: 'joinDate', label: '入職日期' },
  { key: 'status', label: '狀態' },
  { key: 'actions', label: '操作' }
];

const statusColors: Record<string, string> = {
  已邀請待填: 'bg-muted text-muted-foreground border-border',
  待HR完善: 'bg-warning/10 text-warning border-warning/20',
  待入職: 'bg-primary/10 text-primary border-primary/20',
  在職: 'bg-success/10 text-success border-success/20',
  休假中: 'bg-warning/10 text-warning border-warning/20',
  待離職: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  已離職: 'bg-muted text-muted-foreground border-border'
};

/** 需要「辦理」流程的狀態 → 對應操作按鈕配置 */
const ACTION_STATUS = {
  WAIT_HR: '待HR完善',
  INVITED: '已邀請待填',
  PENDING_ENTRY: '待入職',
  PENDING_LEAVE: '待離職'
};

const ALL_STATUS = 'all';

// 狀態碼（與後端 EmployeeStatusEnum 一致：0~6）
const STATUS_INVITED = '0'; // 已邀請待填
const STATUS_WAIT_HR = '1'; // 待HR完善

// 狀態下拉選項：value 為數字碼（對齊後端 Integer），label 為顯示文案
const statusOptions = [
  { value: ALL_STATUS, label: '全部狀態' },
  { value: STATUS_INVITED, label: '已邀請待填' },
  { value: STATUS_WAIT_HR, label: '待HR完善' },
  { value: '2', label: '待入職' },
  { value: '3', label: '在職' },
  { value: '4', label: '休假中' },
  { value: '5', label: '待離職' },
  { value: '6', label: '已離職' }
];

export default function EmployeeList() {
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(ALL_STATUS);
  const [data, setData] = useState<Employee[]>([]);
  const [total, setTotal] = useState(0);
  const [current, setCurrent] = useState(1);
  const [size, setSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusCount, setStatusCount] = useState<Record<string, number>>({});
  const [completeEmp, setCompleteEmp] = useState<Employee | null>(null);
  const [exporting, setExporting] = useState(false);
  const [resendingId, setResendingId] = useState<number | null>(null);
  // 搜尋框未聚焦時設為只讀，阻止瀏覽器自動填充把聯絡資料灌進來（聚焦時解鎖）
  const [searchFocused, setSearchFocused] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  // 重發邀請：重新生成連結並複製到剪貼簿
  const handleResend = async (row: Employee) => {
    if (!row.id) return;
    setResendingId(row.id);
    try {
      const res = await resendInvite(row.id);
      const link = `${window.location.origin}${res.data.invitePath}`;
      try {
        await navigator.clipboard.writeText(link);
        toast.success(t('已重新生成 {{name}} 的邀請連結並複製到剪貼簿', { name: row.name }));
      } catch {
        toast.success(t('已重新生成邀請連結'), { description: link });
      }
    } catch (err: any) {
      toast.error(err.message || t('重發失敗'));
    } finally {
      setResendingId(null);
    }
  };

  // 重置搜尋與狀態篩選，回到第一頁
  const handleReset = () => {
    setSearch('');
    setStatusFilter(ALL_STATUS);
    setCurrent(1);
  };

  // 匯出 Excel（沿用當前的搜尋與狀態篩選條件）
  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await exportEmployee({
        keyword: debouncedSearch || undefined,
        status: statusFilter === ALL_STATUS ? undefined : Number(statusFilter)
      });
      // 從響應頭解析後端設定的檔名，失敗則用預設名
      let fileName = '員工列表.xlsx';
      const disposition = res.headers?.['content-disposition'];
      const match = disposition && /filename\*?=(?:utf-8'')?([^;]+)/i.exec(disposition);
      if (match && match[1]) {
        fileName = decodeURIComponent(match[1].replace(/["']/g, ''));
      }
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(t('匯出成功'));
    } catch (err: any) {
      toast.error(err.message || t('匯出失敗'));
    } finally {
      setExporting(false);
    }
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrent(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getEmployeeList({
        current,
        size,
        keyword: debouncedSearch || undefined,
        status: statusFilter === ALL_STATUS ? undefined : Number(statusFilter)
      });
      setData(res.data.records);
      setTotal(res.data.total);
    } catch (err: any) {
      setError(err.message || t('獲取員工資料失敗'));
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [current, size, debouncedSearch, statusFilter]);

  // 切換狀態篩選時回到第一頁
  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setCurrent(1);
  };

  // 各狀態數量統計（從後端 statusCount 接口取得）
  const fetchStatusCount = useCallback(async () => {
    try {
      const res = await getEmployeeStatusCount();
      // 後端返回 [{status, cnt}]，轉成以狀態碼字串為 key 的對象供頁面查詢
      const map: Record<string, number> = {};
      (res.data || []).forEach(row => {
        map[String(row.status)] = row.cnt;
      });
      setStatusCount(map);
    } catch {
      setStatusCount({});
    }
  }, []);

  const pendingHrCount = statusCount[STATUS_WAIT_HR] ?? 0;
  const pendingInviteCount = statusCount[STATUS_INVITED] ?? 0;

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 統計數量在進入頁面時載入一次（翻頁/搜尋不重複請求）
  useEffect(() => {
    fetchStatusCount();
  }, [fetchStatusCount]);

  const handleImport = useCallback(async (rows: Record<string, string>[]) => {
    let success = 0;
    let fail = 0;
    for (const row of rows) {
      try {
        await submitEmployee({
          name: row['姓名'],
          department: row['部門'],
          position: row['職位'],
          phone: row['聯絡電話'],
          joinDate: row['入職日期']
        });
        success++;
      } catch {
        fail++;
      }
    }
    return { success, fail };
  }, []);

  // 依狀態渲染操作列按鈕
  const renderActions = (row: Employee) => {
    const stop = (fn: () => void) => (e: React.MouseEvent) => {
      e.stopPropagation();
      fn();
    };
    const viewBtn = (
      <Button variant="ghost" size="sm" onClick={stop(() => navigate(`/employees/${row.id}`))}>
        <Eye className="h-4 w-4 mr-1" />
        {t('查看')}
      </Button>
    );
    switch (row.status) {
      case ACTION_STATUS.WAIT_HR:
        return (
          <Button size="sm" onClick={stop(() => setCompleteEmp(row))}>
            <UserCheck className="h-4 w-4 mr-1" />
            {t('完善')}
          </Button>
        );
      case ACTION_STATUS.INVITED:
        return (
          <Button variant="outline" size="sm" disabled={resendingId === row.id} onClick={stop(() => handleResend(row))}>
            {resendingId === row.id ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Mail className="h-4 w-4 mr-1" />
            )}
            {t('重發')}
          </Button>
        );
      case ACTION_STATUS.PENDING_ENTRY:
        return (
          <div className="flex items-center gap-1">
            {hasPerm(EMP_PERM.ONBOARDING) && (
              <Button
                size="sm"
                onClick={stop(() =>
                  navigate('/employees/onboarding', { state: { openAdd: true, employeeId: row.id } })
                )}
              >
                <UserPlus className="h-4 w-4 mr-1" />
                {t('辦理入職')}
              </Button>
            )}
            {viewBtn}
          </div>
        );
      case ACTION_STATUS.PENDING_LEAVE:
        return (
          <div className="flex items-center gap-1">
            {hasPerm(EMP_PERM.OFFBOARDING) && (
              <Button
                size="sm"
                onClick={stop(() =>
                  navigate('/employees/offboarding', { state: { openAdd: true, employeeId: row.id } })
                )}
              >
                <CheckCircle2 className="h-4 w-4 mr-1" />
                {t('辦理離職')}
              </Button>
            )}
            {viewBtn}
          </div>
        );
      default:
        return viewBtn;
    }
  };

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            {t('員工資料')}
          </h1>
          <p className="page-description">{t('管理所有員工的基本資料與檔案')}</p>
        </div>
        <div className="flex gap-2">
          {hasPerm(EMP_PERM.IMPORT) && (
            <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
              <Upload className="h-4 w-4 mr-1" />
              {t('Excel 匯入')}
            </Button>
          )}
          {hasPerm(EMP_PERM.ADD) && (
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              {t('新增員工')}
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-1 items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('搜尋姓名/部門/職位/電話...')}
                  className="pl-9 h-9"
                  name="employee-keyword-search"
                  autoComplete="off"
                  readOnly={!searchFocused}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={handleStatusChange}>
                <SelectTrigger className="h-9 w-[140px]">
                  <SelectValue placeholder={t('全部狀態')} />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.value !== ALL_STATUS && (statusCount[opt.value] ?? 0) > 0
                        ? `${t(opt.label)} (${statusCount[opt.value]})`
                        : t(opt.label)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Badge
                variant="secondary"
                className="cursor-pointer gap-1 bg-warning/10 text-warning border-warning/20"
                onClick={() => handleStatusChange(STATUS_WAIT_HR)}
              >
                <UserCheck className="h-3.5 w-3.5" />
                {t('{{n}} 筆待 HR 完善', { n: pendingHrCount })}
              </Badge>
              <Badge
                variant="secondary"
                className="cursor-pointer gap-1 bg-muted text-muted-foreground border-border"
                onClick={() => handleStatusChange(STATUS_INVITED)}
              >
                <Mail className="h-3.5 w-3.5" />
                {t('{{n}} 筆已邀請待填', { n: pendingInviteCount })}
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleReset}>
                <RotateCcw className="h-4 w-4 mr-1" />
                {t('重置')}
              </Button>
              {hasPerm(EMP_PERM.EXPORT) && (
                <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting}>
                  {exporting ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-1" />
                  )}
                  {t('匯出')}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* Loading state (first load) */}
          {loading && data.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mb-3" />
              <p className="text-sm">{t('載入中...')}</p>
            </div>
          )}

          {/* Error state */}
          {error && !loading && (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mb-3">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <p className="text-sm text-destructive font-medium mb-1">{t('載入失敗')}</p>
              <p className="text-xs text-muted-foreground mb-4">{error}</p>
              <Button variant="outline" size="sm" onClick={fetchData}>
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                {t('重新載入')}
              </Button>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && data.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Users className="h-10 w-10 mb-3 text-muted-foreground/50" />
              <p className="text-sm font-medium mb-1">{t('暫無員工資料')}</p>
              <p className="text-xs text-muted-foreground mb-4">
                {debouncedSearch ? t('沒有符合搜尋條件的員工') : t('尚未新增任何員工')}
              </p>
              {!debouncedSearch && hasPerm(EMP_PERM.ADD) && (
                <Button size="sm" onClick={() => setAddOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  {t('新增員工')}
                </Button>
              )}
            </div>
          )}

          {/* Data table */}
          {!error && data.length > 0 && (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    {columns.map(col => (
                      <TableHead key={col.key}>{t(col.label)}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map(row => (
                    <TableRow key={row.id} className="cursor-pointer" onClick={() => navigate(`/employees/${row.id}`)}>
                      {columns.map(col => (
                        <TableCell key={col.key}>
                          {col.key === 'status' ? (
                            <Badge
                              variant="secondary"
                              className={`rounded-full px-2.5 font-normal ${statusColors[row.status || ''] || ''}`}
                            >
                              {row.status ? t(row.status) : '—'}
                            </Badge>
                          ) : col.key === 'actions' ? (
                            renderActions(row)
                          ) : (
                            (row[col.key as keyof Employee] ?? '—')
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Loading overlay when fetching next pages */}
              {loading && data.length > 0 && (
                <div className="flex items-center justify-center py-3 border-t">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span className="text-xs text-muted-foreground">{t('載入中...')}</span>
                </div>
              )}

              {/* Pagination */}
              <DataPagination
                current={current}
                pageSize={size}
                total={total}
                onChange={setCurrent}
                onPageSizeChange={s => {
                  setSize(s);
                  setCurrent(1);
                }}
              />
            </>
          )}
        </CardContent>
      </Card>

      <AddEmployeeDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSuccess={() => {
          fetchData();
          fetchStatusCount();
        }}
      />
      <ExcelImportDialog open={importOpen} onOpenChange={setImportOpen} onImport={handleImport} />
      <HRCompleteDialog
        open={completeEmp !== null}
        onOpenChange={v => {
          if (!v) setCompleteEmp(null);
        }}
        employee={completeEmp}
        onSuccess={() => {
          fetchData();
          fetchStatusCount();
        }}
      />
    </div>
  );
}
