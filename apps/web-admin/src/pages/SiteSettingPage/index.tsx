import { Tabs, TabsContent, TabsList, TabsTrigger } from "@go-tech-frontend/ui";
import { MonitorCog } from "lucide-react";
import HomeContent from "./HomeContent";
import CoreAdvantages from "./SystemFeatures";
import SystemFeatures from "./CoreAdvantages";
import TargetAudience from "./TargetAudience";

const SiteSettingPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MonitorCog className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">站點設置</h1>
        </div>
      </div>
      <Tabs defaultValue="home" className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="home" className="flex items-center gap-2">
              首頁
            </TabsTrigger>
            <TabsTrigger value="core-advantages" className="flex items-center gap-2">
              核心優勢
            </TabsTrigger>
            <TabsTrigger value="system-features" className="flex items-center gap-2">
              查看系統功能
            </TabsTrigger>
            <TabsTrigger value="target-audience" className="flex items-center gap-2">
              適合人群
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="home">
          <HomeContent />
        </TabsContent>
        <TabsContent value="system-features">
          <SystemFeatures />
        </TabsContent>
        <TabsContent value="target-audience">
          <TargetAudience />
        </TabsContent>
        <TabsContent value="core-advantages">
          <CoreAdvantages />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SiteSettingPage;
