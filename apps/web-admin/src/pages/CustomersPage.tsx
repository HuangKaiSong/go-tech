import {
  Badge,
  Button,
  Input,
  Pagination,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@go-tech-frontend/ui';
import { getFileNameFromHeaders } from '@go-tech/utils/web';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Download, RotateCcw, Search, Users } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { getStoredToken } from '@/hooks/use-auth';

interface Customer {
  companyName: string;
  custCode: string;
  custName: string;
  /** 有效套餐數量 */
  effectiveCount: number;
  email: string;
  /** 過期套餐數量 */
  expiredCount: number;
  id: number;
  phone: string;
  registerTime: string;
  sysType: string;
  /** 試用套餐數量 */
  trailCount: number;
  type: string;

  [k: string]: any;
}

interface Reponse {
  records: Customer[];
  total: number;
}

interface SearchParams {
  custName: string;
  email: string;
  phone: string;
  registerDateEnd: string;
  registerDateStart: string;
  type?: string;
}

const defaultSize = 10;

function getCustomerSystems(sysType: unknown): string[] {
  if (typeof sysType !== 'string') {
    return [];
  }

  return [
    ...new Set(
      sysType
        .split(/[,/]/)
        .map(system => system.trim().toLowerCase())
        .filter(Boolean)
    )
  ];
}

function downloadCustomerWorkbook(blob: Blob, name?: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name ?? '客戶資料.xlsx';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

const CustomersPage = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultSize);
  const [searchParams, setSearchParams] = useState<SearchParams>({
    custName: '',
    phone: '',
    email: '',
    registerDateStart: '',
    registerDateEnd: ''
  });

  const { data, refetch } = useQuery<Reponse>({
    queryKey: ['platform/platformPackage/page', currentPage.toString(), pageSize.toString(), searchParams],
    queryFn: async () => {
      try {
        const url = new URL(
          `${import.meta.env.VITE_PROXY_PREFIX}/go-tech/platform/platformCustomer/page`,
          location.origin
        );
        url.searchParams.append('current', currentPage.toString());
        url.searchParams.append('size', pageSize.toString());
        Object.entries(searchParams).map(([key, value]) => {
          if (value) {
            url.searchParams.append(key, value);
          }
          return null;
        });

        const res = await fetch(url.toString());
        const response = await res.json();
        if (!response || !response.code || response.code !== 200) {
          throw new Error('Failed to fetch data');
        }

        return response.data;
      } catch (error) {
        console.log(error);
        return {
          records: [],
          total: 0
        };
      }
    },
    initialData: () => {
      return {
        records: [],
        total: 0
      };
    }
  });

  const exportExcel = useMutation({
    mutationFn: async () => {
      const token = getStoredToken()?.replace(/^Bearer\s+/i, '');

      const url = new URL(
        `${import.meta.env.VITE_PROXY_PREFIX}/go-tech/platform/platformCustomer/export`,
        location.origin
      );
      Object.entries(searchParams).map(([key, value]) => {
        if (value) {
          url.searchParams.append(key, value);
        }
        return null;
      });

      const response = await fetch(url.toString(), {
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token ?? ''}` }
      });
      if (!response.ok) {
        const error: unknown = await response.json().catch(() => null);
        const message =
          error && typeof error === 'object' && 'message' in error && typeof error.message === 'string'
            ? error.message
            : '客戶資料匯出失敗，請稍後重試';
        throw new Error(message);
      }

      return {
        blob: await response.blob(),
        name: getFileNameFromHeaders(response.headers) ?? undefined
      };
    },
    onSuccess: ({ blob, name }) => {
      downloadCustomerWorkbook(blob, name);
    },
    onError: error => toast.error(error.message || '客戶資料匯出失敗，請稍後重試')
  });

  const handleReset = () => {
    setSearchParams({
      custName: '',
      phone: '',
      email: '',
      type: '',
      registerDateStart: '',
      registerDateEnd: ''
    });
  };

  const handleView = (customerId: number) => {
    navigate(`/customers/${customerId}`);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-row justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">客戶列表</h1>
        </div>
        <Button
          variant="outline"
          className="ml-auto gap-2"
          loading={exportExcel.isPending}
          onClick={() => exportExcel.mutateAsync()}
        >
          <Download className="w-4 h-4" />
          導出全部客戶 Excel
        </Button>
      </div>

      {/* Search Filters */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground whitespace-nowrap">客戶名稱</label>
            <Input
              placeholder="請輸入文字"
              value={searchParams.custName}
              onChange={e => {
                setSearchParams({
                  ...searchParams,
                  custName: e.target.value
                });
              }}
              className="w-40"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground whitespace-nowrap">電話號碼</label>
            <Input
              placeholder="請輸入文字"
              value={searchParams.phone}
              onChange={e => {
                setSearchParams({
                  ...searchParams,
                  phone: e.target.value
                });
              }}
              className="w-40"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground whitespace-nowrap">電子郵箱</label>
            <Input
              placeholder="請輸入文字"
              value={searchParams.email}
              onChange={e => {
                setSearchParams({
                  ...searchParams,
                  email: e.target.value
                });
              }}
              className="w-40"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground whitespace-nowrap">客戶類型</label>
            <Select
              value={searchParams.type}
              onValueChange={e => {
                setSearchParams({
                  ...searchParams,
                  type: e
                });
              }}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="請選擇" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="正式客戶">正式客戶</SelectItem>
                <SelectItem value="過期客戶">過期客戶</SelectItem>
                <SelectItem value="試用客戶">試用客戶</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="text-sm text-muted-foreground">註冊時間</span>
            <Input
              type="date"
              aria-label="註冊開始日期"
              value={searchParams.registerDateStart}
              max={searchParams.registerDateEnd || undefined}
              onChange={event =>
                setSearchParams({
                  ...searchParams,
                  registerDateStart: event.target.value
                })
              }
              className="w-44"
            />
            <span className="text-sm text-muted-foreground">至</span>
            <Input
              type="date"
              aria-label="註冊結束日期"
              value={searchParams.registerDateEnd}
              min={searchParams.registerDateStart || undefined}
              onChange={event =>
                setSearchParams({
                  ...searchParams,
                  registerDateEnd: event.target.value
                })
              }
              className="w-44"
            />
          </div>
          <div className="flex gap-3 ml-auto">
            <Button className="gap-2" onClick={() => refetch()}>
              <Search className="w-4 h-4" />
              搜索
            </Button>
            <Button variant="outline" onClick={handleReset} className="gap-2">
              <RotateCcw className="w-4 h-4" />
              重置
            </Button>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-table-header hover:bg-table-header">
              <TableHead className="text-center font-medium">註冊時間</TableHead>
              <TableHead className="text-center font-medium">客戶編號</TableHead>
              <TableHead className="text-center font-medium">客戶名稱</TableHead>
              <TableHead className="text-center font-medium">電話號碼</TableHead>
              <TableHead className="text-center font-medium">電子郵箱</TableHead>
              <TableHead className="text-center font-medium">公司名稱</TableHead>
              <TableHead className="text-center font-medium">客戶類型</TableHead>
              <TableHead className="text-center font-medium">系統</TableHead>
              <TableHead className="text-center font-medium">訂閱狀態統計</TableHead>
              <TableHead className="text-center font-medium">試用數目</TableHead>
              <TableHead className="text-center font-medium">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.records.map((customer, index) => (
              <TableRow key={index} className="hover:bg-table-hover">
                <TableCell className="text-center">{customer.registerTime}</TableCell>
                <TableCell className="text-center">{customer.custCode}</TableCell>
                <TableCell className="text-center">{customer.custName}</TableCell>
                <TableCell className="text-center">{customer.phone}</TableCell>
                <TableCell className="text-center">{customer.email}</TableCell>
                <TableCell className="text-center">{customer.companyName}</TableCell>
                <TableCell className="text-center">{customer.type}</TableCell>
                <TableCell className="text-center">
                  <div className="flex flex-wrap justify-center gap-2">
                    {getCustomerSystems(customer.sysType).map(system => (
                      <Badge
                        key={system}
                        variant="outline"
                        className={
                          system === 'pms'
                            ? 'rounded-md border-primary/30 bg-primary/10 text-primary'
                            : 'rounded-md border-info/30 bg-info/10 text-info'
                        }
                      >
                        {system.toUpperCase()}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex justify-center gap-2">
                    <div className="text-success">
                      有效 <strong className="tabular-nums">{customer.effectiveCount || 0}</strong>
                    </div>
                    <div className="text-destructive">
                      無效 <strong className="tabular-nums">{customer.expiredCount || 0}</strong>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-center font-medium tabular-nums">{customer.trailCount || 0}</TableCell>
                <TableCell className="text-center">
                  <Button variant="link" className="text-primary p-0 h-auto" onClick={() => handleView(customer.id)}>
                    查看
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Pagination */}
        <div className="flex items-center justify-center p-4 border-t border-border">
          <Pagination
            pageSize={pageSize}
            current={currentPage}
            total={data?.total || 0}
            onChange={(page, size) => {
              setCurrentPage(page);
              setPageSize(size);
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default CustomersPage;
