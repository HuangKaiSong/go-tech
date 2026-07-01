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
  TableRow,
  toast
} from '@go-tech-frontend/ui';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Image, Modal, Space } from 'antd';
import { Eye, FileText, Plus, Receipt, RotateCcw, Search } from 'lucide-react';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OrderStatusEnum, OrderStatusLabel, OrderTypeLabel } from '@/constants/order';
import { PayTypelabel } from '@/constants/payment';
import { type Order } from '@/mocks/orders';

interface Reponse {
  records: Order[];
  total: number;
}

const defaultSize = 10;

const getStatusBadge = (status: OrderStatusEnum) => {
  switch (status) {
    case OrderStatusEnum.COMPLETED:
      return (
        <Badge variant="outline" className="text-success border-success">
          已支付
        </Badge>
      );
    case OrderStatusEnum.PROCESSING:
      return (
        <Badge variant="outline" className="text-warning border-warning">
          待確認
        </Badge>
      );
    case OrderStatusEnum.CANCELED:
      return (
        <Badge variant="outline" className="text-destructive border-destructive">
          已取消
        </Badge>
      );
    case OrderStatusEnum.REJECT:
      return (
        <Badge variant="outline" className="text-destructive border-destructive">
          已拒絕
        </Badge>
      );
    case OrderStatusEnum.ACTIVATION:
      return (
        <Badge variant="outline" className="text-primary border-primary">
          待開通
        </Badge>
      );
    case OrderStatusEnum.WAIT_PAY:
      return (
        <Badge variant="outline" className="text-primary border-primary">
          待支付
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="text-primary border-primary">
          未支付
        </Badge>
      );
  }
};

const OrdersPage = () => {
  const navigate = useNavigate();
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [orderType, setOrderType] = useState('');
  const [orderStatus, setOrderStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultSize);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const toastId = useRef<string | number>(null);

  /** 预览图片 */

  const { data, refetch } = useQuery<Reponse>({
    queryKey: ['platform/packageOrder/page', currentPage.toString(), pageSize.toString()],
    queryFn: async () => {
      try {
        const url = new URL(`${import.meta.env.VITE_PROXY_PREFIX}/go-tech/platform/packageOrder/page`, location.origin);
        url.searchParams.append('current', currentPage.toString());
        url.searchParams.append('size', pageSize.toString());
        url.searchParams.append('orderStatus', orderStatus.toString());

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

  const confirmOrder = useMutation({
    mutationFn: async (orderId: number) => {
      try {
        toast.dismiss();
        toastId.current = toast.loading('處理中...');
        const url = `${import.meta.env.VITE_PROXY_PREFIX}/go-tech/platform/packageOrder/confirm?id=${orderId.toString()}`;
        const res = await fetch(url, {
          method: 'POST'
        });
        const response = await res.json();
        if (!response || !response.code || response.code !== 200) {
          throw new Error('Failed to fetch data');
        }

        return response;
      } catch (error) {
        console.log(error);
        throw error;
      }
    },
    onSuccess: () => {
      toast.success('订单确认成功', {
        id: toastId.current!,
        onDismiss() {
          toastId.current = null;
        }
      });
      refetch();
      setConfirmDialogOpen(false);
      setSelectedOrder(null);
    },
    onError: error => {
      toast.error('订单确认失败', {
        id: toastId.current!,
        description: error.message,
        onDismiss() {
          toastId.current = null;
        }
      });
      console.log(error);
    }
  });
  const rejectpayment = useMutation({
    mutationFn: async (orderId: number) => {
      try {
        toast.dismiss();
        toastId.current = toast.loading('處理中...');
        const url = `${import.meta.env.VITE_PROXY_PREFIX}/go-tech/platform/packageOrder/reject?id=${orderId.toString()}`;
        const res = await fetch(url, {
          method: 'POST'
        });
        const response = await res.json();
        if (!response || !response.code || response.code !== 200) {
          throw new Error('Failed to fetch data');
        }

        return response;
      } catch (error) {
        console.log(error);
        throw error;
      }
    },
    onSuccess: () => {
      toast.success('拒絕成功', {
        id: toastId.current!,
        onDismiss() {
          toastId.current = null;
        }
      });
      refetch();
      setConfirmDialogOpen(false);
      setSelectedOrder(null);
    },
    onError: error => {
      toast.error('拒絕失敗', {
        id: toastId.current!,
        description: error.message,
        onDismiss() {
          toastId.current = null;
        }
      });
      console.log(error);
    }
  });

  const handleView = (orderId: number) => {
    navigate(`/orders/${orderId}`);
  };

  const handleReset = () => {
    setCustomerName('');
    setPhone('');
    setOrderType('');
    setOrderStatus('');
  };

  const handleOpenConfirmDialog = (order: Order) => {
    setSelectedOrder(order);
    setConfirmDialogOpen(true);
  };

  const handleConfirmPayment = () => {
    if (selectedOrder) {
      confirmOrder.mutateAsync(selectedOrder.id);
    }
  };

  const handleRejectPayment = () => {
    if (selectedOrder) {
      // refetch();
      // setConfirmDialogOpen(false);
      // setSelectedOrder(null);
      rejectpayment.mutateAsync(selectedOrder.id);
    }
  };

  const handleCreate = () => {
    navigate('/orders/create');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <FileText className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">訂單列表</h1>
      </div>

      {/* Search Filters */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground whitespace-nowrap">客戶名稱</label>
            <Input
              placeholder="請輸入文字"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              className="w-40"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground whitespace-nowrap">電話號碼</label>
            <Input placeholder="請輸入文字" value={phone} onChange={e => setPhone(e.target.value)} className="w-40" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground whitespace-nowrap">訂單類型</label>
            <Select value={orderType} onValueChange={setOrderType}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="請選擇" />
              </SelectTrigger>
              <SelectContent />
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground whitespace-nowrap">訂單狀態</label>
            <Select value={orderStatus} onValueChange={setOrderStatus}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="請選擇" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(OrderStatusLabel).map(([key, value]) => (
                  <SelectItem key={key} value={key}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            <Button variant="outline" onClick={handleCreate} className="gap-2">
              <Plus className="w-4 h-4" />
              创建
            </Button>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-table-header hover:bg-table-header">
              <TableHead className="text-center font-medium">訂單編號</TableHead>
              <TableHead className="text-center font-medium">客戶名稱</TableHead>
              <TableHead className="text-center font-medium">電話號碼</TableHead>
              <TableHead className="text-center font-medium">電子郵箱</TableHead>
              <TableHead className="text-center font-medium">套餐類型</TableHead>
              <TableHead className="text-center font-medium">訂單金額</TableHead>
              <TableHead className="text-center font-medium">支付方式</TableHead>
              <TableHead className="text-center font-medium">支付時間</TableHead>
              <TableHead className="text-center font-medium">訂單狀態</TableHead>
              <TableHead className="text-center font-medium">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.records.map(order => (
              <TableRow key={order.id} className="hover:bg-table-hover">
                <TableCell className="text-center">{order.orderNo}</TableCell>
                <TableCell className="text-center">{order.custName}</TableCell>
                <TableCell className="text-center">{order.custPhone}</TableCell>
                <TableCell className="text-center">{order.custEmail}</TableCell>
                <TableCell className="text-center">{order.packageName}</TableCell>
                <TableCell className="text-center">{order.finalAmount}</TableCell>
                <TableCell className="text-center">{PayTypelabel[order.payType]}</TableCell>
                <TableCell className="text-center">{order.payTime}</TableCell>
                <TableCell className="text-center">{getStatusBadge(order.orderStatus)}</TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    {order.orderStatus === OrderStatusEnum.PROCESSING && (
                      <Button
                        variant="link"
                        className="text-warning p-0 h-auto gap-1"
                        onClick={() => handleOpenConfirmDialog(order)}
                      >
                        <Receipt className="w-4 h-4" />
                        確認
                      </Button>
                    )}
                    <Button
                      variant="link"
                      className="text-primary p-0 h-auto gap-1"
                      onClick={() => handleView(order.id)}
                    >
                      <Eye className="w-4 h-4" />
                      查看
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Pagination */}
        <div className="flex justify-end p-4 border-t border-table-border">
          <Pagination
            total={data.total}
            pageSize={pageSize}
            current={currentPage}
            onChange={(page, size) => {
              setCurrentPage(page);
              setPageSize(size);
            }}
          />
        </div>
      </div>

      {/* 支付憑證 */}
      <Modal
        open={confirmDialogOpen}
        title={
          <div className="flex flex-col space-y-1.5 text-center sm:text-left">
            <h2 className="text-lg font-semibold leading-none tracking-tight">確認支付憑證</h2>
            <p className="text-sm text-muted-foreground">請核實以下訂單資訊及支付憑證</p>
          </div>
        }
        onOk={() => setConfirmDialogOpen(false)}
        onCancel={() => setConfirmDialogOpen(false)}
        // oxlint-disable-next-line react/no-unstable-nested-components
        footer={() => (
          <Space>
            <Button
              variant="outline"
              onClick={handleRejectPayment}
              loading={rejectpayment.isPending}
              className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              拒絕
            </Button>
            <Button loading={confirmOrder.isPending} onClick={handleConfirmPayment}>
              確認支付
            </Button>
          </Space>
        )}
      >
        {selectedOrder && (
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">訂單編號：</span>
                <span className="font-medium">{selectedOrder.id}</span>
              </div>
              <div>
                <span className="text-muted-foreground">客戶名稱：</span>
                <span className="font-medium">{selectedOrder.custName}</span>
              </div>
              <div>
                <span className="text-muted-foreground">套餐類型：</span>
                <span className="font-medium">{OrderTypeLabel[selectedOrder.orderType]}</span>
              </div>
              <div>
                <span className="text-muted-foreground">訂單金額：</span>
                <span className="font-medium text-primary">{selectedOrder.orderAmount}</span>
              </div>
              <div>
                <span className="text-muted-foreground">支付方式：</span>
                <span className="font-medium">{PayTypelabel[selectedOrder.payType]}</span>
              </div>
              <div>
                <span className="text-muted-foreground">提交時間：</span>
                <span className="font-medium">{selectedOrder.payTime}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">支付憑證：</div>
              <Image
                src={selectedOrder.payEvidence || 'https://via.placeholder.com/400x300'}
                alt="支付憑證"
                height={250}
                className="rounded-lg"
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default OrdersPage;
