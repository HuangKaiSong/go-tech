import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Textarea
} from '@go-tech-frontend/ui';
import { ArrowLeft, FileImage, Trash2, Upload } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const mockContentData: Record<
  string,
  {
    content: string;
    description: string;
    id: string;
    imageUrl: string;
    lastUpdated: string;
    title: string;
    type: 'image' | 'text';
  }
> = {
  '1': {
    id: '1',
    title: '首頁橫幅',
    type: 'image',
    description: '網站首頁輪播橫幅圖片',
    content: '',
    imageUrl: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=800',
    lastUpdated: '2024-01-08'
  },
  '2': {
    id: '2',
    title: '關於我們',
    type: 'text',
    description: '公司介紹與服務說明文字',
    content:
      '我們是一家專業的服務公司，致力於為客戶提供最優質的產品與服務。我們的團隊由經驗豐富的專業人員組成，能夠滿足您的各種需求。',
    imageUrl: '',
    lastUpdated: '2024-01-05'
  },
  '3': {
    id: '3',
    title: '服務條款',
    type: 'text',
    description: '用戶服務條款與隱私政策',
    content:
      '歡迎使用我們的服務。使用本服務即表示您同意遵守以下條款與條件。請仔細閱讀這些條款，因為它們會影響您的法律權利。',
    imageUrl: '',
    lastUpdated: '2024-01-02'
  },
  '4': {
    id: '4',
    title: '產品圖片',
    type: 'image',
    description: '產品展示圖片庫',
    content: '',
    imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800',
    lastUpdated: '2024-01-10'
  }
};

const ContentEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const contentData = mockContentData[id || '1'];

  const [formData, setFormData] = useState({
    title: contentData?.title || '',
    description: contentData?.description || '',
    content: contentData?.content || '',
    imageUrl: contentData?.imageUrl || ''
  });

  if (!contentData) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">找不到該內容</p>
        <Link to="/settings/content">
          <Button variant="link">返回列表</Button>
        </Link>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: '更新成功',
      description: '內容已成功更新'
    });
    navigate('/settings/content');
  };

  const handleDelete = () => {
    toast({
      title: '刪除成功',
      description: '內容已成功刪除'
    });
    navigate('/settings/content');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/settings/content">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <FileImage className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">
              編輯{contentData.type === 'image' ? '圖片' : '文字'}內容
            </h1>
          </div>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">
              <Trash2 className="w-4 h-4 mr-2" />
              刪除
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>確定要刪除嗎？</AlertDialogTitle>
              <AlertDialogDescription>此操作無法撤銷，將永久刪除此內容。</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>確定刪除</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>內容資訊</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">標題</Label>
              <Input
                id="title"
                placeholder="請輸入標題"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">描述</Label>
              <Input
                id="description"
                placeholder="請輸入描述"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            {contentData.type === 'image' ? (
              <div className="space-y-4">
                <Label>目前圖片</Label>
                {formData.imageUrl && (
                  <div className="relative">
                    <img
                      src={formData.imageUrl}
                      alt={formData.title}
                      className="w-full max-w-md rounded-lg border border-border"
                    />
                  </div>
                )}
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                  <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground mb-2">拖拽圖片到此處或點擊上傳替換</p>
                  <Button type="button" variant="outline">
                    選擇圖片
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="imageUrl">或輸入圖片網址</Label>
                  <Input
                    id="imageUrl"
                    placeholder="https://example.com/image.jpg"
                    value={formData.imageUrl}
                    onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="content">內容</Label>
                <Textarea
                  id="content"
                  placeholder="請輸入文字內容"
                  value={formData.content}
                  onChange={e => setFormData({ ...formData, content: e.target.value })}
                  rows={10}
                />
              </div>
            )}

            <div className="text-sm text-muted-foreground">最後更新：{contentData.lastUpdated}</div>

            <div className="flex gap-4">
              <Button type="submit">儲存變更</Button>
              <Link to="/settings/content">
                <Button type="button" variant="outline">
                  取消
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContentEditPage;
