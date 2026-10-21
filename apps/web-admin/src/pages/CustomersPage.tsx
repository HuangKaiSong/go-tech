import {
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
  email: string;
  id: number;
  phone: string;
  registerTime: string;
}

interface Reponse {
  records: Customer[];
  total: number;
}

const defaultSize = 10;

function downloadCustomerWorkbook(blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = '客戶資料.xlsx';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

const CustomersPage = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultSize);
  const [searchParams, setSearchParams] = useState({
    custName: '',
    phone: '',
    email: '',
    vipLevel: '',
    registerDateStart: '',
    registerDateEnd: ''
  });

  const { data, refetch: _refetch } = useQuery<Reponse>({
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

      const response = await fetch(`/h5-hook/api/admin/customers/export`, {
        method: 'POST',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token ?? ''}` },
        body: JSON.stringify(searchParams)
      });
      if (!response.ok) {
        const error: unknown = await response.json().catch(() => null);
        const message =
          error && typeof error === 'object' && 'message' in error && typeof error.message === 'string'
            ? error.message
            : '客戶資料匯出失敗，請稍後重試';
        throw new Error(message);
      }

      return response.blob();
    },
    onSuccess: downloadCustomerWorkbook,
    onError: error => toast.error(error.message || '客戶資料匯出失敗，請稍後重試')
  });

  const handleReset = () => {
    setSearchParams({
      custName: '',
      phone: '',
      email: '',
      vipLevel: '',
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
          onClick={() => exportExcel.mutate()}
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
              value={searchParams.vipLevel}
              onValueChange={e => {
                setSearchParams({
                  ...searchParams,
                  vipLevel: e
                });
              }}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="請選擇" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">註冊會員</SelectItem>
                <SelectItem value="2">黃金會員</SelectItem>
                <SelectItem value="3">白金會員</SelectItem>
                <SelectItem value="4">鑽石會員</SelectItem>
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
            <Button className="gap-2">
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
                <TableCell className="text-center">註冊會員</TableCell>
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
