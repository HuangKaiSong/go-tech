import {
  Button,
  Pagination,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  toast
} from '@go-tech-frontend/ui';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Package, Plus } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { type PackageItem } from '@/mocks/packages';

interface Reponse {
  records: PackageItem[];
  total: number;
}

const defaultSize = 10;

const PackagesPage = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultSize);

  const { data, refetch } = useQuery<Reponse>({
    queryKey: ['platform/platformPackage/page', currentPage.toString(), pageSize.toString()],
    queryFn: async () => {
      try {
        const url = new URL(
          `${import.meta.env.VITE_PROXY_PREFIX}/go-tech/platform/platformPackage/page`,
          location.origin
        );
        url.searchParams.append('current', currentPage.toString());
        url.searchParams.append('size', pageSize.toString());

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

  /** 启用/禁用 */
  const stateMutation = useMutation({
    mutationFn: async (_data: { id: number; status: number }) => {
      const response = await fetch(`${import.meta.env.VITE_PROXY_PREFIX}/go-tech/platform/platformPackage/enable`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(_data)
      });
      const result = await response.json();
      return result;
    },
    onSuccess: result => {
      if (result && result.code === 200) {
        refetch();
        return;
      }
      toast.error(result.message || '更新失败');
    },
    onError: error => {
      toast.error(error.message || '更新失败');
    }
  });

  const handleEdit = (id: number) => {
    navigate(`/packages/${id}/edit`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Package className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">套餐內容設定</h1>
        </div>
        <Button variant="outline" onClick={() => navigate('/packages/new')}>
          <Plus className="w-4 h-4" />
          新增
        </Button>
      </div>

      {/* Table */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="text-center font-medium">套餐名稱</TableHead>
              <TableHead className="text-center font-medium">最大單位數量</TableHead>
              <TableHead className="text-center font-medium">套餐價格</TableHead>
              <TableHead className="text-center font-medium">增加單位價格</TableHead>
              <TableHead className="text-center font-medium">附加租務系統價格</TableHead>
              <TableHead className="text-center font-medium">附加場務系統價格</TableHead>
              <TableHead className="text-center font-medium">附加會計系統價格</TableHead>
              <TableHead className="text-center font-medium">附加客服系統價格</TableHead>
              <TableHead className="text-center font-medium">套餐狀態</TableHead>
              <TableHead className="text-center font-medium">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.records.map(pkg => (
              <TableRow key={pkg.id}>
                <TableCell className="text-center">{pkg.packageName}</TableCell>
                <TableCell className="text-center">{pkg.unitCount}</TableCell>
                <TableCell className="text-center">{pkg.price}</TableCell>
                <TableCell className="text-center">{pkg.addUnitPrice}</TableCell>
                <TableCell className="text-center">{pkg.rentSysPrice}</TableCell>
                <TableCell className="text-center">{pkg.venueSysPrice}</TableCell>
                <TableCell className="text-center">{pkg.accountingSysPrice}</TableCell>
                <TableCell className="text-center">{pkg.custServiceSysPrice}</TableCell>
                <TableCell className="text-center">
                  <div className="flex justify-center">
                    <Switch
                      checked={pkg.status === 1}
                      onCheckedChange={_checked => {
                        stateMutation.mutate({
                          id: pkg.id!,
                          status: pkg.status === 1 ? 0 : 1
                        });
                      }}
                    />
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <Button
                    variant="link"
                    className="text-primary hover:text-primary/80 p-0 h-auto"
                    onClick={() => handleEdit(pkg.id!)}
                  >
                    編輯
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Pagination */}
        <div className="flex justify-end p-4 border-t border-border">
          <Pagination
            pageSize={pageSize}
            current={currentPage}
            total={data?.total || 0}
            onChange={(page, size) => {
              setPageSize(size);
              setCurrentPage(page);
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default PackagesPage;
