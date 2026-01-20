import { ArrowLeft, UserCog } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@go-tech-frontend/ui";

const mockSystemUsers = [
  { id: "TC000001", name: "張先生", phone: "9825 3973", email: "XXXXX@126.com", packageType: "黃金套餐", addon: "租務系統｜會計系統", amount: "$1080", paymentMethod: "轉賬", paymentTime: "12/08/2025 10:00:23", status: "已支付" },
  { id: "TC000002", name: "李先生", phone: "9825 3973", email: "XXXXX@126.com", packageType: "黃金套餐", addon: "租務系統｜會計系統", amount: "$1080", paymentMethod: "轉賬", paymentTime: "12/08/2025 10:00:23", status: "已支付" },
  { id: "TC000003", name: "王先生", phone: "9825 3973", email: "XXXXX@126.com", packageType: "白金套餐", addon: "租務系統｜會計系統", amount: "$1080", paymentMethod: "轉賬", paymentTime: "12/08/2025 10:00:23", status: "已支付" },
  { id: "TC000004", name: "劉先生", phone: "9825 3973", email: "XXXXX@126.com", packageType: "鑽石套餐", addon: "租務系統｜會計系統", amount: "$12080", paymentMethod: "", paymentTime: "", status: "未支付" },
  { id: "TC000005", name: "張先生", phone: "9825 3973", email: "XXXXX@126.com", packageType: "黃金套餐", addon: "租務系統｜會計系統", amount: "$1080", paymentMethod: "轉賬", paymentTime: "12/08/2025 10:00:23", status: "已支付" },
];

// Mock order history for users
const mockOrderHistory = [
  { id: "ORD001", packageType: "黃金套餐", addon: "租務系統｜會計系統", amount: "$1080", paymentMethod: "轉賬", paymentTime: "12/08/2025 10:00:23", status: "已支付" },
  { id: "ORD002", packageType: "白金套餐", addon: "會計系統", amount: "$2080", paymentMethod: "信用卡", paymentTime: "10/07/2025 14:30:00", status: "已支付" },
  { id: "ORD003", packageType: "黃金套餐", addon: "租務系統", amount: "$880", paymentMethod: "轉賬", paymentTime: "05/06/2025 09:15:45", status: "已支付" },
];

const SystemUserDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const user = mockSystemUsers.find((u) => u.id === id) || mockSystemUsers[0];

  const handleBack = () => {
    navigate("/system-users");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <UserCog className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">系統用戶詳情</h1>
        </div>
      </div>

      {/* User Info Card */}
      <div className="bg-card rounded-lg border border-border p-6">
        <h2 className="text-lg font-semibold mb-4 text-foreground">基本資料</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-sm text-muted-foreground">用戶編號</p>
            <p className="text-foreground font-medium">{user.id}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">客戶名稱</p>
            <p className="text-foreground font-medium">{user.name}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">電話號碼</p>
            <p className="text-foreground font-medium">{user.phone}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">電子郵箱</p>
            <p className="text-foreground font-medium">{user.email}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">當前套餐</p>
            <p className="text-foreground font-medium">{user.packageType}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">附加內容</p>
            <p className="text-foreground font-medium">{user.addon}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">訂單狀態</p>
            <span className={user.status === "已支付" ? "text-foreground font-medium" : "text-primary font-medium"}>
              {user.status}
            </span>
          </div>
        </div>
      </div>

      {/* Order History */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">訂單記錄</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-center font-medium">訂單編號</TableHead>
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
            {mockOrderHistory.map((order) => (
              <TableRow key={order.id} className="hover:bg-muted/30">
                <TableCell className="text-center">{order.id}</TableCell>
                <TableCell className="text-center">{order.packageType}</TableCell>
                <TableCell className="text-center">{order.addon}</TableCell>
                <TableCell className="text-center">{order.amount}</TableCell>
                <TableCell className="text-center">{order.paymentMethod}</TableCell>
                <TableCell className="text-center">{order.paymentTime}</TableCell>
                <TableCell className="text-center">
                  <span className={order.status === "已支付" ? "text-foreground" : "text-primary"}>
                    {order.status}
                  </span>
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
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default SystemUserDetailPage;
