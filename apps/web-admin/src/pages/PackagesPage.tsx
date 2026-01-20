import { Package } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Switch,
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
  PaginationEllipsis,
} from "@go-tech-frontend/ui";
import { mockPackages } from "@/mocks/packages";

const PackagesPage = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);

  const handleEdit = (id: string) => {
    navigate(`/packages/${id}/edit`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Package className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">套餐內容設定</h1>
      </div>

      {/* Table */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="text-center font-medium">訂單編號</TableHead>
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
            {mockPackages.map((pkg) => (
              <TableRow key={pkg.id}>
                <TableCell className="text-center">{pkg.orderNo}</TableCell>
                <TableCell className="text-center">{pkg.packageName}</TableCell>
                <TableCell className="text-center">{pkg.maxUnits}</TableCell>
                <TableCell className="text-center">{pkg.packagePrice}</TableCell>
                <TableCell className="text-center">{pkg.extraUnitPrice}</TableCell>
                <TableCell className="text-center">{pkg.rentalSystemPrice}</TableCell>
                <TableCell className="text-center">{pkg.facilitySystemPrice}</TableCell>
                <TableCell className="text-center">{pkg.accountingSystemPrice}</TableCell>
                <TableCell className="text-center">{pkg.customerServicePrice}</TableCell>
                <TableCell className="text-center">
                  <div className="flex justify-center">
                    <Switch checked={pkg.status} />
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <Button
                    variant="link"
                    className="text-primary hover:text-primary/80 p-0 h-auto"
                    onClick={() => handleEdit(pkg.id)}
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
                <PaginationEllipsis />
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

export default PackagesPage;
