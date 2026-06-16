import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@go-tech-frontend/ui";
import { ArrowLeft, Percent } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

const mockUsages = [
  {
    id: 1,
    name: "陳小明",
    phone: "98765432",
    email: "ming@example.com",
    member: "黃金會員",
    package: "黃金套餐",
    amount: "900",
    discount: "100",
    usedAt: "12/08/2025 14:23",
  },
  {
    id: 2,
    name: "李大華",
    phone: "92345678",
    email: "hua@example.com",
    member: "白金會員",
    package: "白金套餐",
    amount: "1800",
    discount: "200",
    usedAt: "12/08/2025 15:10",
  },
  {
    id: 3,
    name: "王美麗",
    phone: "93456789",
    email: "mei@example.com",
    member: "鑽石會員",
    package: "鑽石套餐",
    amount: "2700",
    discount: "300",
    usedAt: "12/09/2025 09:45",
  },
  {
    id: 4,
    name: "張志強",
    phone: "94567890",
    email: "zhi@example.com",
    member: "黃金會員",
    package: "黃金套餐",
    amount: "900",
    discount: "100",
    usedAt: "12/09/2025 11:20",
  },
  {
    id: 5,
    name: "劉雅婷",
    phone: "95678901",
    email: "ya@example.com",
    member: "白金會員",
    package: "白金套餐",
    amount: "1800",
    discount: "200",
    usedAt: "12/10/2025 16:05",
  },
];

const PromoCodeDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Percent className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">
            優惠管理/<span className="text-primary">優惠碼詳情</span>
          </h1>
        </div>
        <Button variant="outline" onClick={() => navigate("/promo-codes")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回
        </Button>
      </div>

      <div className="bg-card rounded-lg border border-border p-6 space-y-3">
        <h2 className="text-lg font-semibold text-foreground">優惠碼信息</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">優惠碼編號：</span>
            {id}
          </div>
          <div>
            <span className="text-muted-foreground">優惠碼名稱：</span>春季優惠
          </div>
          <div>
            <span className="text-muted-foreground">優惠對象：</span>黃金會員
          </div>
          <div>
            <span className="text-muted-foreground">已使用數量：</span>
            {mockUsages.length}
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
              <TableHead className="text-center font-medium">
                用戶姓名
              </TableHead>
              <TableHead className="text-center font-medium">電話</TableHead>
              <TableHead className="text-center font-medium">郵箱</TableHead>
              <TableHead className="text-center font-medium">
                會員等級
              </TableHead>
              <TableHead className="text-center font-medium">
                購買套餐
              </TableHead>
              <TableHead className="text-center font-medium">
                訂單金額
              </TableHead>
              <TableHead className="text-center font-medium">
                優惠金額
              </TableHead>
              <TableHead className="text-center font-medium">
                使用時間
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockUsages.map((u) => (
              <TableRow key={u.id} className="hover:bg-muted/30">
                <TableCell className="text-center">{u.name}</TableCell>
                <TableCell className="text-center">{u.phone}</TableCell>
                <TableCell className="text-center">{u.email}</TableCell>
                <TableCell className="text-center">{u.member}</TableCell>
                <TableCell className="text-center">{u.package}</TableCell>
                <TableCell className="text-center">${u.amount}</TableCell>
                <TableCell className="text-center text-primary">
                  -${u.discount}
                </TableCell>
                <TableCell className="text-center">{u.usedAt}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default PromoCodeDetailPage;

