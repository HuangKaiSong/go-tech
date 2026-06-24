import { Pagination, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@go-tech-frontend/ui';
import { useQuery } from '@tanstack/react-query';
import { MessageSquareText } from 'lucide-react';
import { useState } from 'react';

interface Customer {
  createTime: string;
  email: string;
  id: number;
  message: string;
  name: string;
  phone: string;
}

interface Reponse {
  records: Customer[];
  total: number;
}

const defaultSize = 10;

const MessageBoard = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultSize);

  const { data, refetch: _refetch } = useQuery<Reponse>({
    queryKey: ['platform/leaveMessage/page', currentPage.toString(), pageSize.toString()],
    queryFn: async () => {
      try {
        const url = new URL(`${import.meta.env.VITE_PROXY_PREFIX}/go-tech/platform/leaveMessage/page`, location.origin);
        url.searchParams.append('current', currentPage.toString());
        url.searchParams.append('size', pageSize.toString());

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

  // const readMu = useMutation({
  //   mutationFn: async (id: string) => {
  //     try {
  //       const url = new URL(`${import.meta.env.VITE_PROXY_PREFIX}/go-tech/platform/leaveMessage/read`, location.origin);
  //       url.searchParams.append('id', id);

  //       const res = await fetch(url.toString());
  //       const response = await res.json();
  //       if (!response || !response.code || response.code !== 200) {
  //         throw new Error('Failed to fetch data');
  //       }
  //     } catch (error) {
  //       console.log(error);
  //     }
  //   },
  //   onSuccess: () => {
  //     refetch();
  //   }
  // });

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
              <TableHead className="text-center font-medium">留言時間</TableHead>
              <TableHead className="text-center font-medium">客戶名稱</TableHead>
              <TableHead className="text-center font-medium">電話號碼</TableHead>
              <TableHead className="text-center font-medium">電子郵箱</TableHead>
              <TableHead className="text-center font-medium">内容</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.records.map((customer, index) => (
              <TableRow key={index} className="hover:bg-table-hover">
                <TableCell className="text-center">{customer.createTime}</TableCell>
                <TableCell className="text-center">{customer.name}</TableCell>
                <TableCell className="text-center">{customer.phone}</TableCell>
                <TableCell className="text-center">{customer.email}</TableCell>
                <TableCell className="text-center w-100 overflow-hidden text-ellipsis">{customer.message}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Pagination */}
        <div className="flex justify-end p-4 border-t border-border">
          <Pagination
            pageSize={pageSize}
            current={currentPage}
            total={data?.total || 0}
            onChange={(page, size) => {
              setPageSize(size);
              setCurrentPage(page);
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default MessageBoard;
