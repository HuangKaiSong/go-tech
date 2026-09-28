import { Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@go-tech-frontend/ui';
import { useQuery } from '@tanstack/react-query';
import { Result, Skeleton } from 'antd';
import { ArrowLeft, ExternalLink, Users } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';
import { OrderStatusEnum, OrderStatusLabel } from '@/constants/order';
import { PayTypeEnum, PayTypelabel } from '@/constants/payment';

const OrderSch = z
  .object({
    id: z.int(),
    orderNo: z.string(),
    packageName: z.string(),
    finalAmount: z.string(),
    payType: z.enum(PayTypeEnum),
    orderStatus: z.enum(OrderStatusEnum),
    additionalInfo: z.string(),
    payTime: z.iso.datetime().nullable()
  })
  .array();

const Detailresponse = z.object({
  id: z.number(),
  custCode: z.string(),
  custName: z.string(),
  phone: z.string(),
  email: z.email(),
  companyName: z.string(),
  registerTime: z.iso.datetime(),
  orders: OrderSch
});

type DetailType = z.infer<typeof Detailresponse>;

const getStatusClass = (status: OrderStatusEnum) => {
  if (status === OrderStatusEnum.COMPLETED) {
    return 'text-success';
  }
  return 'text-primary';
};

const CustomerDetailPage = () => {
  const navigate = useNavigate();
  const { id: _id } = useParams();

  const { data, error, isError, isLoading } = useQuery<DetailType>({
    queryKey: ['platform/platformPackage', _id?.toString()],
    queryFn: async () => {
      try {
        const url = new URL(
          `${import.meta.env.VITE_PROXY_PREFIX}/go-tech/platform/platformCustomer/detail/${_id}`,
          location.origin
        );
        const res = await fetch(url.toString());
        const response = await res.json();
        if (!response || !response.code || response.code !== 200) {
          throw new Error('Failed to fetch data');
        }

        return response.data;
      } catch (err) {
        console.log(err);
      }
    },
    enabled: Boolean(_id)
  });

  const handleBack = () => {
    navigate('/customers');
  };

  if (isError) {
    return <Result status="error" title="查詢會員資料失敗" subTitle={error?.message} />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header with Breadcrumb */}
      <div className="flex items-center gap-3">
        <Users className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">
          會員列表/<span className="text-muted-foreground">客戶詳情</span>
        </h1>
      </div>

      {/* Customer Info Card */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        {/* Card Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <Button variant="link" className="text-muted-foreground gap-2 p-0 h-auto" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4" />
            返回
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-lg font-medium">客戶資料</span>
            <Button variant="ghost" size="icon" className="text-primary h-8 w-8">
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
          <div className="w-16" /> {/* Spacer for centering */}
        </div>

        {/* Customer Info */}
        <div className="px-6 py-4 flex flex-wrap items-center gap-x-12 gap-y-2 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">客戶編號：</span>
            <Skeleton loading={isLoading} active>
              <span className="font-medium">{data?.custCode}</span>
            </Skeleton>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">客人名稱：</span>
            <Skeleton loading={isLoading} active>
              <span className="font-medium">{data?.custName}</span>
            </Skeleton>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">聯絡電話：</span>
            <Skeleton loading={isLoading} active>
              <span className="font-medium">{data?.phone}</span>
            </Skeleton>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">郵箱</span>
            <Skeleton loading={isLoading} active>
              <span className="font-medium">{data?.email}</span>
            </Skeleton>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">公司：</span>
            <Skeleton loading={isLoading} active>
              <span className="font-medium">{data?.companyName}</span>
            </Skeleton>
          </div>
        </div>

        {/* Orders Table */}
        <Table>
          <TableHeader>
            <TableRow className="bg-table-header hover:bg-table-header">
              <TableHead className="text-center font-medium">訂單編號</TableHead>
              <TableHead className="text-center font-medium">套餐名稱</TableHead>
              <TableHead className="text-center font-medium">訂單金額</TableHead>
              <TableHead className="text-center font-medium">支付方式</TableHead>
              <TableHead className="text-center font-medium">支付時間</TableHead>
              <TableHead className="text-center font-medium">訂單狀態</TableHead>
              <TableHead className="text-center font-medium">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <Skeleton loading={isLoading} paragraph={{ rows: 4 }}>
              {(data?.orders || []).map((order, index) => (
                <TableRow key={index} className="hover:bg-table-hover">
                  <TableCell className="text-center">{order.orderNo}</TableCell>
                  <TableCell className="text-center">{order.packageName}</TableCell>
                  <TableCell className="text-center">{order.finalAmount}</TableCell>
                  <TableCell className="text-center">{PayTypelabel[order.payType]}</TableCell>
                  <TableCell className="text-center">{order.payTime}</TableCell>
                  <TableCell className={`text-center ${getStatusClass(order.orderStatus)}`}>
                    {OrderStatusLabel[order.orderStatus]}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="link"
                      className="text-primary p-0 h-auto"
                      onClick={() => navigate(`/orders/${order.id}`)}
                    >
                      查看
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </Skeleton>
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default CustomerDetailPage;
