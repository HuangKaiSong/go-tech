import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
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
  Textarea
} from '@go-tech-frontend/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, MessageSquare, Reply, RotateCcw, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  getFeedbackDetail,
  getFeedbackPosts,
  restoreComment,
  restoreFeedback,
  saveOfficialReply,
  trashComment,
  trashFeedback,
  updateFeedbackStatus
} from './api';
import { statusOptions } from './contrans';
import StatusBadge from './StatusBadge';
import type { FeedbackPost, FeedbackStatus, FeedbackView, OfficialReply } from './types';

interface PostsProps {
  q: string;
  status: FeedbackStatus | 'all';
  view: FeedbackView;
}

type TrashTarget = { id: string; kind: 'comment' | 'feature'; label: string };
type ReplyTarget = { current?: string; label: string; parentId?: string };

const formatDate = (value: string | null) => (value ? new Date(value).toLocaleString('zh-HK') : '');

const OfficialReplyCard = ({
  onRestore,
  onTrash,
  reply
}: {
  onRestore: () => void;
  onTrash: () => void;
  reply: OfficialReply;
}) => (
  <div className="rounded-lg border border-border bg-background p-3">
    <div className="flex items-center gap-2">
      <span className="text-sm font-semibold text-primary">GO-TECH Manager</span>
      <Badge className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0 h-4">官方回覆</Badge>
      {reply.deletedAt && <Badge variant="secondary">已移至回收站</Badge>}
      <span className="text-xs text-muted-foreground">{formatDate(reply.createdAt)}</span>
      <Button variant="ghost" size="sm" className="ml-auto h-7 gap-1" onClick={reply.deletedAt ? onRestore : onTrash}>
        {reply.deletedAt ? <RotateCcw className="w-3.5 h-3.5" /> : <Trash2 className="w-3.5 h-3.5" />}
        {reply.deletedAt ? '還原回覆' : '移至回收站'}
      </Button>
    </div>
    <p className="mt-2 text-sm">{reply.content}</p>
  </div>
);

const Posts = ({ q, status, view }: PostsProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [detailPost, setDetailPost] = useState<FeedbackPost | null>(null);
  const [trashTarget, setTrashTarget] = useState<TrashTarget | null>(null);
  const [replyTarget, setReplyTarget] = useState<ReplyTarget | null>(null);
  const [replyContent, setReplyContent] = useState('');

  useEffect(() => setPage(1), [q, status, view]);

  const listQuery = useQuery({
    queryKey: ['feedback-admin', 'posts', view, status, q, page, pageSize],
    queryFn: () => getFeedbackPosts({ page, pageSize, q, status, view })
  });
  const detailQuery = useQuery({
    queryKey: ['feedback-admin', 'detail', detailPost?.id],
    queryFn: () => getFeedbackDetail(detailPost!.id),
    enabled: Boolean(detailPost)
  });

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['feedback-admin'] });
  };
  const action = useMutation({
    mutationFn: (operation: () => Promise<unknown>) => operation(),
    onSuccess: async () => {
      await refresh();
      toast({ title: '操作成功', description: '資料已更新' });
    },
    onError: error => toast({ title: '操作失敗', description: error.message, variant: 'destructive' })
  });

  const changeStatus = (id: string, nextStatus: FeedbackStatus) => {
    action.mutate(() => updateFeedbackStatus(id, nextStatus));
  };
  const restoreItem = (id: string, kind: TrashTarget['kind']) => {
    action.mutate(() => (kind === 'feature' ? restoreFeedback(id) : restoreComment(id)));
  };
  const confirmTrash = () => {
    if (!trashTarget) return;
    const target = trashTarget;
    action.mutate(() => (target.kind === 'feature' ? trashFeedback(target.id) : trashComment(target.id)));
    setTrashTarget(null);
  };
  const submitReply = () => {
    if (!detailPost || !replyTarget || !replyContent.trim()) {
      toast({ title: '請輸入回覆內容', variant: 'destructive' });
      return;
    }
    const target = replyTarget;
    action.mutate(() => saveOfficialReply(detailPost.id, replyContent.trim(), target.parentId));
    setReplyTarget(null);
    setReplyContent('');
  };

  const openReply = (target: ReplyTarget) => {
    setReplyTarget(target);
    setReplyContent(target.current || '');
  };

  const data = listQuery.data;
  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="text-center">發帖時間</TableHead>
            <TableHead className="text-center">客戶</TableHead>
            <TableHead className="text-center">標題</TableHead>
            <TableHead className="text-center">內容</TableHead>
            <TableHead className="text-center">評論數</TableHead>
            <TableHead className="text-center">狀態</TableHead>
            <TableHead className="text-center">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {listQuery.isPending && (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8">
                載入中...
              </TableCell>
            </TableRow>
          )}
          {listQuery.isError && (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-destructive">
                {listQuery.error.message}
              </TableCell>
            </TableRow>
          )}
          {!listQuery.isPending && !listQuery.isError && data?.items.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                暫無資料
              </TableCell>
            </TableRow>
          )}
          {data?.items.map(post => (
            <TableRow key={post.id}>
              <TableCell className="text-center">{formatDate(post.createdAt)}</TableCell>
              <TableCell className="text-center">{post.author}</TableCell>
              <TableCell className="text-center max-w-[180px] truncate" title={post.title}>
                {post.title}
              </TableCell>
              <TableCell className="text-center max-w-[220px] truncate" title={post.description}>
                {post.description}
              </TableCell>
              <TableCell className="text-center">{post.commentCount}</TableCell>
              <TableCell className="text-center">
                {view === 'trash' ? (
                  <StatusBadge status={post.status} />
                ) : (
                  <Select value={post.status} onValueChange={value => changeStatus(post.id, value as FeedbackStatus)}>
                    <SelectTrigger className="w-[110px] mx-auto">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </TableCell>
              <TableCell className="text-center">
                <div className="flex justify-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setDetailPost(post)}>
                    <Eye className="w-4 h-4" />
                    查看
                  </Button>
                  {view === 'trash' ? (
                    <Button variant="outline" size="sm" onClick={() => restoreItem(post.id, 'feature')}>
                      <RotateCcw className="w-4 h-4" />
                      還原
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive"
                      onClick={() => setTrashTarget({ id: post.id, kind: 'feature', label: `帖子「${post.title}」` })}
                    >
                      <Trash2 className="w-4 h-4" />
                      移至回收站
                    </Button>
                  )}
                </div>
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

      <Dialog open={Boolean(detailPost)} onOpenChange={open => !open && setDetailPost(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>需求詳情</DialogTitle>
          </DialogHeader>
          {detailPost && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-4 space-y-3">
                <div className="flex justify-between">
                  <h3 className="font-semibold">{detailPost.title}</h3>
                  <StatusBadge status={detailPost.status} />
                </div>
                <p className="text-sm text-muted-foreground">
                  {detailPost.author}（{detailPost.email}）· {formatDate(detailPost.createdAt)}
                </p>
                <p className="text-sm">{detailPost.description}</p>
                {detailQuery.data?.featureReply && (
                  <OfficialReplyCard
                    reply={detailQuery.data.featureReply}
                    onTrash={() =>
                      setTrashTarget({ id: detailQuery.data!.featureReply!.id, kind: 'comment', label: '官方回覆' })
                    }
                    onRestore={() => restoreItem(detailQuery.data!.featureReply!.id, 'comment')}
                  />
                )}
                {!detailPost.deletedAt && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      openReply({
                        label: `帖子「${detailPost.title}」`,
                        current: detailQuery.data?.featureReply?.content
                      })
                    }
                  >
                    <Reply className="w-4 h-4" />
                    回覆帖子
                  </Button>
                )}
              </div>
              <Label className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                評論
              </Label>
              {detailQuery.isPending && <p className="text-sm text-muted-foreground">載入評論中...</p>}
              {detailQuery.data?.comments.map(comment => (
                <div key={comment.id} className="rounded-lg border p-3 space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium text-sm">
                      {comment.author}
                      {comment.deletedAt && (
                        <Badge variant="secondary" className="ml-2">
                          已移至回收站
                        </Badge>
                      )}
                    </span>
                    <span className="text-xs text-muted-foreground">{formatDate(comment.createdAt)}</span>
                  </div>
                  <p className="text-sm">{comment.content}</p>
                  {comment.reply && (
                    <OfficialReplyCard
                      reply={comment.reply}
                      onTrash={() => setTrashTarget({ id: comment.reply!.id, kind: 'comment', label: '官方回覆' })}
                      onRestore={() => restoreItem(comment.reply!.id, 'comment')}
                    />
                  )}
                  <div className="flex gap-2">
                    {comment.deletedAt ? (
                      <Button variant="outline" size="sm" onClick={() => restoreItem(comment.id, 'comment')}>
                        <RotateCcw className="w-4 h-4" />
                        還原
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            openReply({
                              label: `${comment.author} 的評論`,
                              parentId: comment.id,
                              current: comment.reply?.content
                            })
                          }
                        >
                          <Reply className="w-4 h-4" />
                          回覆
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive"
                          onClick={() =>
                            setTrashTarget({ id: comment.id, kind: 'comment', label: `${comment.author} 的評論` })
                          }
                        >
                          <Trash2 className="w-4 h-4" />
                          移至回收站
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(replyTarget)} onOpenChange={open => !open && setReplyTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>回覆{replyTarget?.label}</DialogTitle>
          </DialogHeader>
          <Textarea
            value={replyContent}
            maxLength={1000}
            onChange={event => setReplyContent(event.target.value)}
            placeholder="輸入官方回覆內容"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setReplyTarget(null)}>
              取消
            </Button>
            <Button loading={action.isPending} onClick={submitReply}>
              確認發送
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(trashTarget)} onOpenChange={open => !open && setTrashTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>移至回收站</AlertDialogTitle>
            <AlertDialogDescription>
              確定要將 {trashTarget?.label} 移至回收站嗎？之後可從回收站還原。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={confirmTrash}>
              確認移除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Posts;
