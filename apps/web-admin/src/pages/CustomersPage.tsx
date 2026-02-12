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
  TableRow,
} from "@go-tech-frontend/ui";
import { useQuery } from "@tanstack/react-query";
import { RotateCcw, Search, Users } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface Customer {
  id: number;
  custName: string;
  email: string;
  phone: string;
  custCode: string;
  companyName: string;
  registerTime: string;
}

interface Reponse {
  records: Customer[];
  total: number;
}

const defaultSize = 10;

const CustomersPage = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultSize);
  const [searchParams, setSearchParams] = useState({
    custName: "",
    phone: "",
    email: "",
    vipLevel: "",
  });

  const { data, refetch } = useQuery<Reponse>({
    queryKey: [
      "platform/platformPackage/page",
      currentPage.toString(),
      pageSize.toString(),
      searchParams,
    ],
    queryFn: async () => {
      try {
        const url = new URL(
          `${import.meta.env.VITE_PROXY_PREFIX}/go-tech/platform/platformCustomer/page`,
          location.origin,
        );
        url.searchParams.append("current", currentPage.toString());
        url.searchParams.append("size", pageSize.toString());
        Object.entries(searchParams).map(([key, value]) => {
          if (value) {
            url.searchParams.append(key, value);
          }
        });

        const res = await fetch(url.toString());
        const response = await res.json();
        if (!response || !response.code || response.code !== 200) {
          throw new Error("Failed to fetch data");
        }

        return response.data;
      } catch (error) {
        console.log(error);
        return {
          records: [],
          total: 0,
        };
      }
    },
    initialData: () => {
      return {
        records: [],
        total: 0,
      };
    },
  });

  const handleReset = () => {
    setSearchParams({
      custName: "",
      phone: "",
      email: "",
      vipLevel: "",
    });
  };

  const handleView = (customerId: number) => {
    navigate(`/customers/${customerId}`);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <Users className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">客戶列表</h1>
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
              value={searchParams.custName}
              onChange={(e) => {
                setSearchParams({
                  ...searchParams,
                  custName: e.target.value,
                });
              }}
              className="w-40"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground whitespace-nowrap">
              電話號碼
            </label>
            <Input
              placeholder="請輸入文字"
              value={searchParams.phone}
              onChange={(e) => {
                setSearchParams({
                  ...searchParams,
                  phone: e.target.value,
                });
              }}
              className="w-40"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground whitespace-nowrap">
              電子郵箱
            </label>
            <Input
              placeholder="請輸入文字"
              value={searchParams.email}
              onChange={(e) => {
                setSearchParams({
                  ...searchParams,
                  email: e.target.value,
                });
              }}
              className="w-40"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground whitespace-nowrap">
              客戶類型
            </label>
            <Select
              value={searchParams.vipLevel}
              onValueChange={(e) => {
                setSearchParams({
                  ...searchParams,
                  vipLevel: e,
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
              <TableHead className="text-center font-medium">
                註冊時間
              </TableHead>
              <TableHead className="text-center font-medium">
                客戶編號
              </TableHead>
              <TableHead className="text-center font-medium">
                客戶名稱
              </TableHead>
              <TableHead className="text-center font-medium">
                電話號碼
              </TableHead>
              <TableHead className="text-center font-medium">
                電子郵箱
              </TableHead>
              <TableHead className="text-center font-medium">
                公司名稱
              </TableHead>
              <TableHead className="text-center font-medium">
                客戶類型
              </TableHead>
              <TableHead className="text-center font-medium">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.records.map((customer, index) => (
              <TableRow key={index} className="hover:bg-table-hover">
                <TableCell className="text-center">
                  {customer.registerTime}
                </TableCell>
                <TableCell className="text-center">
                  {customer.custCode}
                </TableCell>
                <TableCell className="text-center">
                  {customer.custName}
                </TableCell>
                <TableCell className="text-center">{customer.phone}</TableCell>
                <TableCell className="text-center">{customer.email}</TableCell>
                <TableCell className="text-center">
                  {customer.companyName}
                </TableCell>
                <TableCell className="text-center">註冊會員</TableCell>
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
