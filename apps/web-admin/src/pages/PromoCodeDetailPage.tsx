import { Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@go-tech-frontend/ui';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from 'antd';
import { ArrowLeft, Percent } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

const PromoCodeDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  /** 优惠详情 */
  const { data: detail, isPending: detailPending } = useQuery({
    queryKey: ['/go-tech/platform/promotion/detail/{id}', id],
    retry: false,
    queryFn: async () => {
      try {
        const url = new URL(
          `${import.meta.env.VITE_PROXY_PREFIX}/go-tech/platform/promotion/detail/${id}`,
          location.origin
        );
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch promotions');
        const response = await res.json();
        return response.data;
      } catch {
        return null;
      }
    },
    placeholderData: prev => prev
  });

  /** 使用记录 */
  const { data: useRecord } = useQuery({
    queryKey: ['/go-tech/platform/promotion/useRecordList', id],
    retry: false,
    queryFn: async () => {
      try {
        const url = new URL(
          `${import.meta.env.VITE_PROXY_PREFIX}/go-tech/platform/promotion/useRecordList`,
          location.origin
        );
        if (id) {
          url.searchParams.append('id', id.toString());
        }
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch promotions');
        const response = await res.json();
        return response.data;
      } catch {
        return [];
      }
    },
    placeholderData: prev => prev
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Percent className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">
            優惠管理/<span className="text-primary">優惠碼詳情</span>
          </h1>
        </div>
        <Button variant="outline" onClick={() => navigate('/promo-codes')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回
        </Button>
      </div>

      <div className="bg-card rounded-lg border border-border p-6 space-y-3">
        <h2 className="text-lg font-semibold text-foreground">優惠碼信息</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">優惠碼編號：</span>
            <Skeleton loading={detailPending} active style={{ width: 60 }}>
              {detail?.promotionNo}
            </Skeleton>
          </div>
          <div>
            <span className="text-muted-foreground">優惠碼名稱：</span>
            <Skeleton loading={detailPending} active style={{ width: 60 }}>
              {detail?.promotionName}
            </Skeleton>
          </div>
          {/* <div>
            <span className="text-muted-foreground">優惠對象：</span>黃金會員
          </div> */}
          <div>
            <span className="text-muted-foreground">已使用數量：</span>
            {useRecord?.length ?? 0}
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">使用記錄</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-center font-medium">用戶姓名</TableHead>
              <TableHead className="text-center font-medium">電話</TableHead>
              <TableHead className="text-center font-medium">郵箱</TableHead>
              <TableHead className="text-center font-medium">會員等級</TableHead>
              <TableHead className="text-center font-medium">購買套餐</TableHead>
              <TableHead className="text-center font-medium">訂單金額</TableHead>
              <TableHead className="text-center font-medium">優惠金額</TableHead>
              <TableHead className="text-center font-medium">使用時間</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {useRecord?.map((u: any, k: number) => (
              <TableRow key={k} className="hover:bg-muted/30">
                <TableCell className="text-center">{u.custName}</TableCell>
                <TableCell className="text-center">{u.phone}</TableCell>
                <TableCell className="text-center">{u.email || '-'}</TableCell>
                <TableCell className="text-center">{u.member || '-'}</TableCell>
                <TableCell className="text-center">{u.packageName}</TableCell>
                <TableCell className="text-center">${u.orderAmount}</TableCell>
                <TableCell className="text-center text-primary">-${u.discountAmount}</TableCell>
                <TableCell className="text-center">{u.useTime}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default PromoCodeDetailPage;
