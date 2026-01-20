import { useState } from "react";
import { Users, Search, RotateCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Input,
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
import { mockCustomers } from "@/mocks/customers";

const CustomersPage = () => {
  const navigate = useNavigate();
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [customerType, setCustomerType] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const handleReset = () => {
    setCustomerName("");
    setPhone("");
    setEmail("");
    setCustomerType("");
  };

  const handleView = (customerId: string) => {
    navigate(`/customers/${customerId}`);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <Users className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">會員列表</h1>
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
              電子郵箱
            </label>
            <Input
              placeholder="請輸入文字"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-40"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground whitespace-nowrap">
              客戶類型
            </label>
            <Select value={customerType} onValueChange={setCustomerType}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="請選擇" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="registered">註冊會員</SelectItem>
                <SelectItem value="gold">黃金會員</SelectItem>
                <SelectItem value="platinum">白金會員</SelectItem>
                <SelectItem value="diamond">鑽石會員</SelectItem>
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
            {mockCustomers.map((customer, index) => (
              <TableRow key={index} className="hover:bg-table-hover">
                <TableCell className="text-center">{customer.registerDate}</TableCell>
                <TableCell className="text-center">{customer.id}</TableCell>
                <TableCell className="text-center">{customer.name}</TableCell>
                <TableCell className="text-center">{customer.phone}</TableCell>
                <TableCell className="text-center">{customer.email}</TableCell>
                <TableCell className="text-center">{customer.company}</TableCell>
                <TableCell className="text-center">{customer.type}</TableCell>
                <TableCell className="text-center">
                  <Button 
                    variant="link" 
                    className="text-primary p-0 h-auto"
                    onClick={() => handleView(customer.id)}
                  >
                    查看
                  </Button>
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
    </div>
  );
};

export default CustomersPage;
