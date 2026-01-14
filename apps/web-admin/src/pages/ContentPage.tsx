import { FileImage, Plus, Image, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const mockImageContent = [
  {
    id: "1",
    title: "首頁橫幅",
    description: "網站首頁輪播橫幅圖片",
    lastUpdated: "2024-01-08",
  },
  {
    id: "4",
    title: "產品圖片",
    description: "產品展示圖片庫",
    lastUpdated: "2024-01-10",
  },
];

const mockTextContent = [
  {
    id: "2",
    title: "關於我們",
    description: "公司介紹與服務說明文字",
    lastUpdated: "2024-01-05",
  },
  {
    id: "3",
    title: "服務條款",
    description: "用戶服務條款與隱私政策",
    lastUpdated: "2024-01-02",
  },
];

const ContentPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <FileImage className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">圖文管理</h1>
      </div>

      <Tabs defaultValue="image" className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="image" className="flex items-center gap-2">
              <Image className="w-4 h-4" />
              圖片管理
            </TabsTrigger>
            <TabsTrigger value="text" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              文字管理
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="image" className="space-y-4">
          <div className="flex justify-end">
            <Link to="/settings/content/add?type=image">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                新增圖片
              </Button>
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {mockImageContent.map((item) => (
              <Link key={item.id} to={`/settings/content/${item.id}/edit`}>
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
                  <CardHeader className="flex flex-row items-center gap-4 pb-2">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Image className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-base">{item.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-2">
                      {item.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      最後更新：{item.lastUpdated}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="text" className="space-y-4">
          <div className="flex justify-end">
            <Link to="/settings/content/add?type=text">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                新增文字
              </Button>
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {mockTextContent.map((item) => (
              <Link key={item.id} to={`/settings/content/${item.id}/edit`}>
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
                  <CardHeader className="flex flex-row items-center gap-4 pb-2">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-base">{item.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-2">
                      {item.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      最後更新：{item.lastUpdated}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ContentPage;
