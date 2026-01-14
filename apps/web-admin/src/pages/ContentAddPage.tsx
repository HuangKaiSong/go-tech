import { FileImage, ArrowLeft, Upload } from "lucide-react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const ContentAddPage = () => {
  const [searchParams] = useSearchParams();
  const type = searchParams.get("type") || "image";
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    content: "",
    imageUrl: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "新增成功",
      description: `${type === "image" ? "圖片" : "文字"}內容已成功新增`,
    });
    navigate("/settings/content");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/settings/content">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <FileImage className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">
            新增{type === "image" ? "圖片" : "文字"}內容
          </h1>
        </div>
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
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">描述</Label>
              <Input
                id="description"
                placeholder="請輸入描述"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>

            {type === "image" ? (
              <div className="space-y-2">
                <Label>圖片上傳</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                  <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground mb-2">
                    拖拽圖片到此處或點擊上傳
                  </p>
                  <Button type="button" variant="outline">
                    選擇圖片
                  </Button>
                </div>
                <div className="space-y-2 mt-4">
                  <Label htmlFor="imageUrl">或輸入圖片網址</Label>
                  <Input
                    id="imageUrl"
                    placeholder="https://example.com/image.jpg"
                    value={formData.imageUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, imageUrl: e.target.value })
                    }
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
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  rows={10}
                />
              </div>
            )}

            <div className="flex gap-4">
              <Button type="submit">儲存</Button>
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

export default ContentAddPage;
