import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Textarea
} from '@go-tech-frontend/ui';
import { ArrowDown, ArrowUp, ArrowUpDown, MessageSquare, Reply, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface Message {
  assignee: string;
  content: string;
  email: string;
  id: string;
  name: string;
  phone: string;
  submitTime: string;
}

const initialMessages: Message[] = [
  {
    id: '1',
    submitTime: '2025/02/03 14:30:25',
    name: '張三',
    email: 'zhangsan@example.com',
    phone: '13800138001',
    content: '我想了解一下黃金套餐的詳細內容，是否包含技術支援？',
    assignee: '王經理'
  },
  {
    id: '2',
    submitTime: '2025/02/03 11:20:10',
    name: '李四',
    email: 'lisi@example.com',
    phone: '13800138002',
    content: '請問鑽石套餐可以支持多少用戶同時在線？',
    assignee: '陳主管'
  },
  {
    id: '3',
    submitTime: '2025/02/02 16:45:33',
    name: '王五',
    email: 'wangwu@example.com',
    phone: '13800138003',
    content: '我們公司有50人，請問有適合的套餐推薦嗎？',
    assignee: '-'
  },
  {
    id: '4',
    submitTime: '2025/02/02 09:15:42',
    name: '趙六',
    email: 'zhaoliu@example.com',
    phone: '13800138004',
    content: '付款後多久可以開通服務？',
    assignee: '王經理'
  },
  {
    id: '5',
    submitTime: '2025/02/01 18:30:00',
    name: '孫七',
    email: 'sunqi@example.com',
    phone: '13800138005',
    content: '請問是否支持按月付費？',
    assignee: '-'
  }
];

const MessagesPage = () => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [searchTerm, setSearchTerm] = useState('');
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [replyTitle, setReplyTitle] = useState('');
  const [replyContent, setReplyContent] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<Message | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>(null);
  const { toast } = useToast();

  const filteredMessages = messages
    .filter(
      message =>
        message.name.includes(searchTerm) ||
        message.email.includes(searchTerm) ||
        message.phone.includes(searchTerm) ||
        message.content.includes(searchTerm)
    )
    .toSorted((a, b) => {
      if (sortOrder === null) return 0;
      const dateA = new Date(a.submitTime.replace(/\//g, '-')).getTime();
      const dateB = new Date(b.submitTime.replace(/\//g, '-')).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

  const handleReplyClick = (message: Message) => {
    setSelectedMessage(message);
    setReplyTitle('');
    setReplyContent('');
    setReplyDialogOpen(true);
  };

  const handleSendReply = () => {
    if (!replyTitle.trim() || !replyContent.trim()) {
      toast({
        title: '錯誤',
        description: '請填寫標題和內容',
        variant: 'destructive'
      });
      return;
    }

    toast({
      title: '發送成功',
      description: `已成功向 ${selectedMessage?.name} 發送回復`
    });
    setReplyDialogOpen(false);
    setSelectedMessage(null);
    setReplyTitle('');
    setReplyContent('');
  };

  const handleCancel = () => {
    setReplyDialogOpen(false);
    setSelectedMessage(null);
    setReplyTitle('');
    setReplyContent('');
  };

  const handleDeleteClick = (message: Message) => {
    setMessageToDelete(message);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (messageToDelete) {
      setMessages(messages.filter(m => m.id !== messageToDelete.id));
      toast({
        title: '刪除成功',
        description: `已成功刪除 ${messageToDelete.name} 的留言`
      });
    }
    setDeleteDialogOpen(false);
    setMessageToDelete(null);
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setMessageToDelete(null);
  };

  const toggleSortOrder = () => {
    if (sortOrder === null) {
      setSortOrder('desc');
    } else if (sortOrder === 'desc') {
      setSortOrder('asc');
    } else {
      setSortOrder(null);
    }
  };

  const getSortIcon = () => {
    if (sortOrder === 'asc') return <ArrowUp className="w-4 h-4" />;
    if (sortOrder === 'desc') return <ArrowDown className="w-4 h-4" />;
    return <ArrowUpDown className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <MessageSquare className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">留言管理</h1>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="搜尋姓名、郵箱、電話或內容..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-center font-medium">
                <Button variant="ghost" size="sm" onClick={toggleSortOrder} className="gap-1 hover:bg-transparent">
                  提交時間
                  {getSortIcon()}
                </Button>
              </TableHead>
              <TableHead className="text-center font-medium">姓名</TableHead>
              <TableHead className="text-center font-medium">郵箱</TableHead>
              <TableHead className="text-center font-medium">電話</TableHead>
              <TableHead className="text-center font-medium">內容</TableHead>
              <TableHead className="text-center font-medium">跟進人</TableHead>
              <TableHead className="text-center font-medium">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMessages.map(message => (
              <TableRow key={message.id}>
                <TableCell className="text-center">{message.submitTime}</TableCell>
                <TableCell className="text-center">{message.name}</TableCell>
                <TableCell className="text-center">{message.email}</TableCell>
                <TableCell className="text-center">{message.phone}</TableCell>
                <TableCell className="text-center max-w-[200px] truncate" title={message.content}>
                  {message.content}
                </TableCell>
                <TableCell className="text-center">{message.assignee}</TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleReplyClick(message)} className="gap-1">
                      <Reply className="w-4 h-4" />
                      回復
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteClick(message)}
                      className="gap-1 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                      刪除
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Reply Dialog */}
      <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>回復留言</DialogTitle>
          </DialogHeader>
          {selectedMessage && (
            <div className="space-y-4">
              {/* Customer Info */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground text-sm">姓名</Label>
                    <p className="font-medium">{selectedMessage.name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm">電話</Label>
                    <p className="font-medium">{selectedMessage.phone}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm">郵箱</Label>
                  <p className="font-medium">{selectedMessage.email}</p>
                </div>
              </div>

              {/* Reply Form */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reply-title">標題</Label>
                  <Input
                    id="reply-title"
                    placeholder="請輸入回復標題"
                    value={replyTitle}
                    onChange={e => setReplyTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reply-content">內容</Label>
                  <Textarea
                    id="reply-content"
                    placeholder="請輸入回復內容"
                    value={replyContent}
                    onChange={e => setReplyContent(e.target.value)}
                    rows={5}
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={handleCancel}>
              取消
            </Button>
            <Button onClick={handleSendReply}>確認發送</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認刪除</AlertDialogTitle>
            <AlertDialogDescription>
              確定要刪除 {messageToDelete?.name} 的留言嗎？此操作無法撤銷。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelDelete}>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              確認刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MessagesPage;
