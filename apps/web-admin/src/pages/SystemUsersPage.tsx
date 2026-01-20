import { UserCog, Search, RotateCcw } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Input,
  Button,
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
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@go-tech-frontend/ui";

const mockSystemUsers = [
  { id: "TC000001", name: "張先生", phone: "9825 3973", email: "XXXXX@126.com", packageType: "黃金套餐", addon: "租務系統｜會計系統", packageExpiry: "2025/12/31", packageStatus: "有效", isRenewal: true },
  { id: "TC000002", name: "李先生", phone: "9825 3973", email: "XXXXX@126.com", packageType: "黃金套餐", addon: "租務系統｜會計系統", packageExpiry: "2025/06/15", packageStatus: "即將到期", isRenewal: false },
  { id: "TC000003", name: "王先生", phone: "9825 3973", email: "XXXXX@126.com", packageType: "白金套餐", addon: "租務系統｜會計系統", packageExpiry: "2024/12/31", packageStatus: "無效", isRenewal: false },
  { id: "TC000004", name: "劉先生", phone: "9825 3973", email: "XXXXX@126.com", packageType: "鑽石套餐", addon: "租務系統｜會計系統", packageExpiry: "2026/03/20", packageStatus: "有效", isRenewal: true },
  { id: "TC000005", name: "張先生", phone: "9825 3973", email: "XXXXX@126.com", packageType: "黃金套餐", addon: "租務系統｜會計系統", packageExpiry: "2025/08/10", packageStatus: "有效", isRenewal: true },
  { id: "TC000006", name: "張先生", phone: "9825 3973", email: "XXXXX@126.com", packageType: "黃金套餐", addon: "租務系統｜會計系統", packageExpiry: "2025/02/28", packageStatus: "即將到期", isRenewal: true },
  { id: "TC000007", name: "張先生", phone: "9825 3973", email: "XXXXX@126.com", packageType: "黃金套餐", addon: "租務系統｜會計系統", packageExpiry: "2024/11/30", packageStatus: "無效", isRenewal: false },
  { id: "TC000008", name: "張先生", phone: "9825 3973", email: "XXXXX@126.com", packageType: "黃金套餐", addon: "租務系統｜會計系統", packageExpiry: "2025/10/15", packageStatus: "有效", isRenewal: false },
  { id: "TC000009", name: "張先生", phone: "9825 3973", email: "XXXXX@126.com", packageType: "黃金套餐", addon: "租務系統｜會計系統", packageExpiry: "2025/09/01", packageStatus: "有效", isRenewal: true },
  { id: "TC000010", name: "張先生", phone: "9825 3973", email: "XXXXX@126.com", packageType: "黃金套餐", addon: "租務系統｜會計系統", packageExpiry: "2025/07/20", packageStatus: "有效", isRenewal: true },
];

const SystemUsersPage = () => {
  const navigate = useNavigate();
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [orderType, setOrderType] = useState("");
  const [orderStatus, setOrderStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const handleView = (userId: string) => {
    navigate(`/system-users/${userId}`);
  };

  const handleReset = () => {
    setCustomerName("");
    setPhone("");
    setOrderType("");
    setOrderStatus("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <UserCog className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">系統用戶列表</h1>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">客戶名稱</span>
            <Input 
              placeholder="請輸入文字" 
              className="w-40"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">電話號碼</span>
            <Input 
              placeholder="請輸入文字" 
              className="w-40"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">訂單類型</span>
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
            <span className="text-sm text-muted-foreground whitespace-nowrap">套餐狀態</span>
            <Select value={orderStatus} onValueChange={setOrderStatus}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="請選擇" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="valid">有效</SelectItem>
                <SelectItem value="invalid">無效</SelectItem>
                <SelectItem value="expiring">即將到期</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button className="bg-primary hover:bg-primary/90">
            <Search className="w-4 h-4 mr-2" />
            搜索
          </Button>
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="w-4 h-4 mr-2" />
            重置
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-center font-medium">訂單編號</TableHead>
              <TableHead className="text-center font-medium">客戶名稱</TableHead>
              <TableHead className="text-center font-medium">電話號碼</TableHead>
              <TableHead className="text-center font-medium">電子郵箱</TableHead>
              <TableHead className="text-center font-medium">套餐類型</TableHead>
              <TableHead className="text-center font-medium">附加內容</TableHead>
              <TableHead className="text-center font-medium">套餐有效期</TableHead>
              <TableHead className="text-center font-medium">套餐狀態</TableHead>
              <TableHead className="text-center font-medium">是否續費</TableHead>
              <TableHead className="text-center font-medium">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockSystemUsers.map((user) => (
              <TableRow key={user.id} className="hover:bg-muted/30">
                <TableCell className="text-center">{user.id}</TableCell>
                <TableCell className="text-center">{user.name}</TableCell>
                <TableCell className="text-center">{user.phone}</TableCell>
                <TableCell className="text-center">{user.email}</TableCell>
                <TableCell className="text-center">{user.packageType}</TableCell>
                <TableCell className="text-center">{user.addon}</TableCell>
                <TableCell className="text-center">{user.packageExpiry}</TableCell>
                <TableCell className="text-center">
                  <span className={
                    user.packageStatus === "有效" ? "text-green-600" : 
                    user.packageStatus === "即將到期" ? "text-amber-500" : 
                    "text-destructive"
                  }>
                    {user.packageStatus}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <span className={user.isRenewal ? "text-green-600" : "text-muted-foreground"}>
                    {user.isRenewal ? "是" : "否"}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <Button variant="link" className="text-primary p-0 h-auto" onClick={() => handleView(user.id)}>
                    查看
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex justify-end">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious href="#" className="text-muted-foreground" />
            </PaginationItem>
            {[1, 2, 3].map((page) => (
              <PaginationItem key={page}>
                <PaginationLink 
                  href="#" 
                  isActive={currentPage === page}
                  onClick={() => setCurrentPage(page)}
                  className={currentPage === page ? "bg-primary text-primary-foreground" : ""}
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
                  className={currentPage === page ? "bg-primary text-primary-foreground" : ""}
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext href="#" className="text-muted-foreground" />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
};

export default SystemUsersPage;
