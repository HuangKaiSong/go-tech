import {
  Button,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@go-tech-frontend/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RotateCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getTrashedComments, restoreComment } from './api';
import Posts from './Posts';
import type { FeedbackStatus } from './types';

interface TrashProps {
  q: string;
  status: FeedbackStatus | 'all';
}

const formatDate = (value: string | null) => (value ? new Date(value).toLocaleString('zh-HK') : '');

const Trash = ({ q, status }: TrashProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  useEffect(() => setPage(1), [q, status]);

  const commentsQuery = useQuery({
    queryKey: ['feedback-admin', 'trashed-comments', status, q, page, pageSize],
    queryFn: () => getTrashedComments({ page, pageSize, q, status })
  });
  const restoreMutation = useMutation({
    mutationFn: restoreComment,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['feedback-admin'] });
      toast({ title: '已還原', description: '評論已重新顯示' });
    },
    onError: error => toast({ title: '還原失敗', description: error.message, variant: 'destructive' })
  });

  const data = commentsQuery.data;
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground">已移除的帖子</h2>
        <Posts view="trash" q={q} status={status} />
      </div>
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground">已移除的評論與回覆</h2>
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-center">移除時間</TableHead>
                <TableHead className="text-center">作者</TableHead>
                <TableHead className="text-center">所屬帖子</TableHead>
                <TableHead className="text-center">內容</TableHead>
                <TableHead className="text-center">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {commentsQuery.isPending && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    載入中...
                  </TableCell>
                </TableRow>
              )}
              {commentsQuery.isError && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-destructive">
                    {commentsQuery.error.message}
                  </TableCell>
                </TableRow>
              )}
              {!commentsQuery.isPending && !commentsQuery.isError && data?.items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    暫無資料
                  </TableCell>
                </TableRow>
              )}
              {data?.items.map(comment => (
                <TableRow key={comment.id}>
                  <TableCell className="text-center">{formatDate(comment.deletedAt)}</TableCell>
                  <TableCell className="text-center">{comment.author}</TableCell>
                  <TableCell className="text-center">{comment.featureTitle}</TableCell>
                  <TableCell className="text-center max-w-[280px] truncate" title={comment.content}>
                    {comment.content}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      loading={restoreMutation.isPending}
                      onClick={() => restoreMutation.mutate(comment.id)}
                    >
                      <RotateCcw className="w-4 h-4" />
                      還原
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex justify-end p-4 border-t border-border">
            <Pagination
              current={page}
              pageSize={pageSize}
              total={data?.total || 0}
              onChange={(nextPage, size) => {
                setPage(nextPage);
                setPageSize(size);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Trash;
