import {
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  Filter,
  RotateCcw,
  Search,
  Settings2,
  XCircle
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  type Approval,
  APPROVAL_STATUS_TEXT,
  APPROVAL_TYPE_TEXT,
  getApprovalList,
  getApprovalStatusCount,
  getMyPending
} from '@/api/approval';
import ApprovalRulesTab from '@/components/attendance/ApprovalRulesTab';
import PendingApprovalTab from '@/components/attendance/PendingApprovalTab';
import { DataPagination } from '@/components/common/DataPagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

/** 单据状态码 → 展示配置 */
const statusConfig: Record<number, { color: string; icon: React.ElementType }> = {
  1: { color: 'bg-warning/10 text-warning border-warning/20', icon: Clock },
  2: { color: 'bg-primary/10 text-primary border-primary/20', icon: Clock },
  3: { color: 'bg-success/10 text-success border-success/20', icon: CheckCircle2 },
  4: { color: 'bg-destructive/10 text-destructive border-destructive/20', icon: XCircle },
  5: { color: 'bg-muted text-muted-foreground', icon: RotateCcw }
};

export default function ApprovalManagement() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [records, setRecords] = useState<Approval[]>([]);
  const [total, setTotal] = useState(0);
  const [current, setCurrent] = useState(1);
  const [size, setSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [statusCount, setStatusCount] = useState<Record<number, number>>({});

  // 搜尋防抖，避免逐字打字都打一次後端
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // 篩選條件變動時回到第一頁，否則會停在超出範圍的頁碼上
  useEffect(() => {
    setCurrent(1);
  }, [debouncedSearch, typeFilter, statusFilter]);

  useEffect(() => {
    setLoading(true);
    getApprovalList({
      current,
      size,
      type: typeFilter === 'all' ? undefined : Number(typeFilter),
      status: statusFilter === 'all' ? undefined : Number(statusFilter),
      keyword: debouncedSearch || undefined
    })
      .then(res => {
        setRecords(res.data?.records ?? []);
        setTotal(res.data?.total ?? 0);
      })
      .catch(() => {
        setRecords([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [current, size, typeFilter, statusFilter, debouncedSearch]);

  useEffect(() => {
    getMyPending()
      .then(res => setPendingCount((res.data ?? []).length))
      .catch(() => setPendingCount(0));
    // 統計走獨立接口：分頁後前端只有當前頁資料，自行 count 會失真
    getApprovalStatusCount()
      .then(res => setStatusCount(Object.fromEntries((res.data ?? []).map(s => [s.status, s.cnt]))))
      .catch(() => setStatusCount({}));
  }, []);

  // 重置搜尋與類型/狀態篩選（頁碼由篩選變動的 effect 自動歸 1）
  const handleReset = () => {
    setSearch('');
    setTypeFilter('all');
    setStatusFilter('all');
  };

  const stats = [
    { label: '待我審批', value: pendingCount, icon: Clock, color: 'text-warning' },
    { label: '已通過', value: statusCount[3] ?? 0, icon: CheckCircle2, color: 'text-success' },
    { label: '已駁回', value: statusCount[4] ?? 0, icon: XCircle, color: 'text-destructive' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('審批管理')}</h1>
        <p className="text-muted-foreground mt-1">{t('管理各類審批申請與審批流程')}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {stats.map(s => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{t(s.label)}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="all">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <TabsList>
            <TabsTrigger value="all">{t('全部記錄')}</TabsTrigger>
            <TabsTrigger value="pending" className="gap-1">
              <Clock className="h-3.5 w-3.5" />
              {t('待我審批')}
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                {pendingCount}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="rules" className="gap-1">
              <Settings2 className="h-3.5 w-3.5" />
              {t('審批規則')}
            </TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('搜尋編號/申請人...')}
                className="pl-9 w-56"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-32">
                <Filter className="h-4 w-4 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('全部類型')}</SelectItem>
                {Object.entries(APPROVAL_TYPE_TEXT).map(([code, label]) => (
                  <SelectItem key={code} value={code}>
                    {t(label)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('全部狀態')}</SelectItem>
                {Object.entries(APPROVAL_STATUS_TEXT).map(([code, label]) => (
                  <SelectItem key={code} value={code}>
                    {t(label)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-1" />
              {t('重置')}
            </Button>
          </div>
        </div>

        <TabsContent value="all" className="mt-0">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('申請編號')}</TableHead>
                    <TableHead>{t('申請人')}</TableHead>
                    <TableHead>{t('部門')}</TableHead>
                    <TableHead>{t('申請類型')}</TableHead>
                    <TableHead>{t('摘要')}</TableHead>
                    <TableHead>{t('提交時間')}</TableHead>
                    <TableHead>{t('當前節點')}</TableHead>
                    <TableHead>{t('狀態')}</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map(r => {
                    const sc = statusConfig[r.statusCode] ?? statusConfig[1];
                    return (
                      <TableRow
                        key={r.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/attendance/approval/${r.id}`)}
                      >
                        <TableCell className="font-mono text-sm">{r.code}</TableCell>
                        <TableCell className="font-medium">{r.applicantName}</TableCell>
                        <TableCell>{r.departmentName}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-normal">
                            {t(APPROVAL_TYPE_TEXT[r.type] ?? r.typeName ?? '')}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-48 truncate">{r.summary}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{r.submittedAt}</TableCell>
                        <TableCell className="text-sm">{r.currentNode}</TableCell>
                        <TableCell>
                          <Badge className={`${sc.color} border`}>
                            {t(APPROVAL_STATUS_TEXT[r.statusCode] ?? r.status ?? '')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {records.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        {loading ? t('載入中...') : t('暫無符合條件的審批記錄')}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending" className="mt-0">
          <PendingApprovalTab />
        </TabsContent>

        <TabsContent value="rules" className="mt-0">
          <ApprovalRulesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
