import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@go-tech-frontend/ui";
import { useMutation, useQuery } from "@tanstack/react-query";
import { MessageSquareText } from "lucide-react";
import { useState } from "react";

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  message: string;
  createTime: string;
}

interface Reponse {
  records: Customer[];
  total: number;
}

const defaultSize = 10;

const MessageBoard = () => {
  const [currentPage, setCurrentPage] = useState(1);

  const { data, refetch } = useQuery<Reponse>({
    queryKey: [
      "platform/leaveMessage/page",
      currentPage.toString(),
      defaultSize.toString(),
    ],
    queryFn: async () => {
      try {
        const url = new URL(
          `${import.meta.env.VITE_PROXY_PREFIX}/go-tech/platform/leaveMessage/page`,
          location.origin,
        );
        url.searchParams.append("current", currentPage.toString());
        url.searchParams.append("size", defaultSize.toString());

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

  const readMu = useMutation({
    mutationFn: async (id: string) => {
      try {
        const url = new URL(
          `${import.meta.env.VITE_PROXY_PREFIX}/go-tech/platform/leaveMessage/read`,
          location.origin,
        );
        url.searchParams.append("id", id);

        const res = await fetch(url.toString());
        const response = await res.json();
        if (!response || !response.code || response.code !== 200) {
          throw new Error("Failed to fetch data");
        }
      } catch (error) {
        console.log(error);
      }
    },
    onSuccess: () => {
      refetch();
    },
  });

  const totalPages = Math.ceil(data.total / 10);

  const generatePaginationItems = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <MessageSquareText className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">留言板</h1>
      </div>

      {/* Table */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-table-header hover:bg-table-header">
              <TableHead className="text-center font-medium">
                留言時間
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
              <TableHead className="text-center font-medium">内容</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.records.map((customer, index) => (
              <TableRow key={index} className="hover:bg-table-hover">
                <TableCell className="text-center">
                  {customer.createTime}
                </TableCell>
                <TableCell className="text-center">{customer.name}</TableCell>
                <TableCell className="text-center">{customer.phone}</TableCell>
                <TableCell className="text-center">{customer.email}</TableCell>
                <TableCell className="text-center w-100 overflow-hidden text-ellipsis">
                  {customer.message}
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
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage > 1) {
                      setCurrentPage(currentPage - 1);
                    }
                  }}
                />
              </PaginationItem>

              {generatePaginationItems().map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    href="#"
                    isActive={currentPage === page}
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentPage(page);
                    }}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage < totalPages) {
                      setCurrentPage(currentPage + 1);
                    }
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </div>
  );
};

export default MessageBoard;
