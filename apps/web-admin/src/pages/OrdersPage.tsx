import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Search, RotateCcw, Eye, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Order {
  id: string;
  customer: string;
  phone: string;
  email: string;
  package: string;
  addons: string;
  amount: string;
  paymentMethod: string;
  paymentTime: string;
  status: string;
  paymentProof?: string;
}

// Mock data
const initialOrders: Order[] = [
  {
    id: "TC000001",
    customer: "張先生",
    phone: "9825 3973",
    email: "XXXXX@126.com",
    package: "黃金套餐",
    addons: "租務系統 | 會計系統",
    amount: "$1080",
    paymentMethod: "轉賬",
    paymentTime: "12/08/2025 10:00:23",
    status: "已支付",
  },
  {
    id: "TC000002",
    customer: "李先生",
    phone: "9825 3973",
    email: "XXXXX@126.com",
    package: "黃金套餐",
    addons: "租務系統 | 會計系統",
    amount: "$1080",
    paymentMethod: "轉賬",
    paymentTime: "12/08/2025 10:00:23",
    status: "待確認",
    paymentProof: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400",
  },
  {
    id: "TC000003",
    customer: "王先生",
    phone: "9825 3973",
    email: "XXXXX@126.com",
    package: "白金套餐",
    addons: "租務系統 | 會計系統",
    amount: "$1080",
    paymentMethod: "轉賬",
    paymentTime: "12/08/2025 10:00:23",
    status: "已支付",
  },
  {
    id: "TC000004",
    customer: "劉先生",
    phone: "9825 3973",
    email: "XXXXX@126.com",
    package: "鑽石套餐",
    addons: "租務系統 | 會計系統",
    amount: "$12080",
    paymentMethod: "",
    paymentTime: "",
    status: "未支付",
  },
  {
    id: "TC000005",
    customer: "陳先生",
    phone: "9825 3973",
    email: "XXXXX@126.com",
    package: "黃金套餐",
    addons: "租務系統 | 會計系統",
    amount: "$2080",
    paymentMethod: "轉賬",
    paymentTime: "12/08/2025 10:00:23",
    status: "待確認",
    paymentProof: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400",
  },
  {
    id: "TC000006",
    customer: "張先生",
    phone: "9825 3973",
    email: "XXXXX@126.com",
    package: "黃金套餐",
    addons: "租務系統 | 會計系統",
    amount: "$1080",
    paymentMethod: "轉賬",
    paymentTime: "12/08/2025 10:00:23",
    status: "已取消",
  },
  {
    id: "TC000007",
    customer: "張先生",
    phone: "9825 3973",
    email: "XXXXX@126.com",
    package: "黃金套餐",
    addons: "租務系統 | 會計系統",
    amount: "$1080",
    paymentMethod: "轉賬",
    paymentTime: "12/08/2025 10:00:23",
    status: "已支付",
  },
  {
    id: "TC000008",
    customer: "張先生",
    phone: "9825 3973",
    email: "XXXXX@126.com",
    package: "黃金套餐",
    addons: "租務系統 | 會計系統",
    amount: "$1080",
    paymentMethod: "轉賬",
    paymentTime: "12/08/2025 10:00:23",
    status: "已支付",
  },
  {
    id: "TC000009",
    customer: "張先生",
    phone: "9825 3973",
    email: "XXXXX@126.com",
    package: "黃金套餐",
    addons: "租務系統 | 會計系統",
    amount: "$1080",
    paymentMethod: "轉賬",
    paymentTime: "12/08/2025 10:00:23",
    status: "已支付",
  },
  {
    id: "TC000010",
    customer: "張先生",
    phone: "9825 3973",
    email: "XXXXX@126.com",
    package: "黃金套餐",
    addons: "租務系統 | 會計系統",
    amount: "$1080",
    paymentMethod: "轉賬",
    paymentTime: "12/08/2025 10:00:23",
    status: "已支付",
  },
];

const OrdersPage = () => {
  const navigate = useNavigate();
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [orderType, setOrderType] = useState("");
  const [orderStatus, setOrderStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const handleView = (orderId: string) => {
    navigate(`/orders/${orderId}`);
  };

  const handleReset = () => {
    setCustomerName("");
    setPhone("");
    setOrderType("");
    setOrderStatus("");
  };

  const handleOpenConfirmDialog = (order: Order) => {
    setSelectedOrder(order);
    setConfirmDialogOpen(true);
  };

  const handleConfirmPayment = () => {
    if (selectedOrder) {
      setOrders(orders.map(order => 
        order.id === selectedOrder.id 
          ? { ...order, status: "已支付" }
          : order
      ));
      setConfirmDialogOpen(false);
      setSelectedOrder(null);
    }
  };

  const handleRejectPayment = () => {
    if (selectedOrder) {
      setOrders(orders.map(order => 
        order.id === selectedOrder.id 
          ? { ...order, status: "已取消" }
          : order
      ));
      setConfirmDialogOpen(false);
      setSelectedOrder(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "已支付":
        return <Badge variant="outline" className="text-success border-success">已支付</Badge>;
      case "待確認":
        return <Badge variant="outline" className="text-warning border-warning">待確認</Badge>;
      case "已取消":
        return <Badge variant="outline" className="text-destructive border-destructive">已取消</Badge>;
      default:
        return <Badge variant="outline" className="text-primary border-primary">未支付</Badge>;
    }
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
            <label className="text-sm text-muted-foreground whitespace-nowrap">
              客戶名稱
            </label>
            <Input
              placeholder="請輸入文字"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-40"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground whitespace-nowrap">
              電話號碼
            </label>
            <Input
              placeholder="請輸入文字"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-40"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground whitespace-nowrap">
              訂單類型
            </label>
            <Select value={orderType} onValueChange={setOrderType}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="請選擇" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gold">黃金套餐</SelectItem>
                <SelectItem value="platinum">白金套餐</SelectItem>
                <SelectItem value="diamond">鑽石套餐</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground whitespace-nowrap">
              訂單狀態
            </label>
            <Select value={orderStatus} onValueChange={setOrderStatus}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="請選擇" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="paid">已支付</SelectItem>
                <SelectItem value="unpaid">未支付</SelectItem>
                <SelectItem value="pending">待確認</SelectItem>
                <SelectItem value="cancelled">已取消</SelectItem>
              </SelectContent>
            </Select>
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
              <TableHead className="text-center font-medium">附加內容</TableHead>
              <TableHead className="text-center font-medium">訂單金額</TableHead>
              <TableHead className="text-center font-medium">支付方式</TableHead>
              <TableHead className="text-center font-medium">支付時間</TableHead>
              <TableHead className="text-center font-medium">訂單狀態</TableHead>
              <TableHead className="text-center font-medium">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id} className="hover:bg-table-hover">
                <TableCell className="text-center">{order.id}</TableCell>
                <TableCell className="text-center">{order.customer}</TableCell>
                <TableCell className="text-center">{order.phone}</TableCell>
                <TableCell className="text-center">{order.email}</TableCell>
                <TableCell className="text-center">{order.package}</TableCell>
                <TableCell className="text-center">{order.addons}</TableCell>
                <TableCell className="text-center">{order.amount}</TableCell>
                <TableCell className="text-center">{order.paymentMethod}</TableCell>
                <TableCell className="text-center">{order.paymentTime}</TableCell>
                <TableCell className="text-center">{getStatusBadge(order.status)}</TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    {order.status === "待確認" && (
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
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious href="#" />
              </PaginationItem>
              {[1, 2, 3].map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    href="#"
                    isActive={currentPage === page}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <span className="px-2">...</span>
              </PaginationItem>
              {[8, 9, 10].map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    href="#"
                    isActive={currentPage === page}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext href="#" />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>

      {/* Confirm Payment Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>確認支付憑證</DialogTitle>
            <DialogDescription>
              請核實以下訂單資訊及支付憑證
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">訂單編號：</span>
                  <span className="font-medium">{selectedOrder.id}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">客戶名稱：</span>
                  <span className="font-medium">{selectedOrder.customer}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">套餐類型：</span>
                  <span className="font-medium">{selectedOrder.package}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">訂單金額：</span>
                  <span className="font-medium text-primary">{selectedOrder.amount}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">支付方式：</span>
                  <span className="font-medium">{selectedOrder.paymentMethod}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">提交時間：</span>
                  <span className="font-medium">{selectedOrder.paymentTime}</span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-sm text-muted-foreground">支付憑證：</span>
                <div className="border border-border rounded-lg overflow-hidden">
                  <img 
                    src={selectedOrder.paymentProof || "https://via.placeholder.com/400x300"} 
                    alt="支付憑證" 
                    className="w-full h-48 object-cover"
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleRejectPayment} className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground">
              拒絕
            </Button>
            <Button onClick={handleConfirmPayment}>
              確認支付
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrdersPage;
