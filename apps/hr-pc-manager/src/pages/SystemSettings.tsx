import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSettings } from "@/contexts/SettingsContext";
import { Bell, Database, Settings, Shield } from "lucide-react";
import { useState } from "react";

export default function SystemSettings() {
  const {
    settings,
    updateGeneralSettings,
    updateSecuritySettings,
    updateNotificationSettings,
  } = useSettings();
  const [saved, setSaved] = useState(false);

  const handleSaveGeneral = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      console.log("此浏览器不支持通知");
      return;
    }

    if (Notification.permission === "granted") {
      return;
    }

    if (Notification.permission !== "denied") {
      await Notification.requestPermission();
    }
  };

  const handleNotificationChange = (
    key: keyof typeof settings.notification,
    checked: boolean,
  ) => {
    const newSettings = {
      ...settings.notification,
      [key]: checked,
    };

    if (checked || Object.values(newSettings).some(Boolean)) {
      requestNotificationPermission();
    }

    updateNotificationSettings(newSettings);
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <Settings className="h-6 w-6 text-primary" />
          系統管理
        </h1>
        <p className="page-description">系統設定與管理功能</p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList>
          <TabsTrigger value="general">一般設定</TabsTrigger>
          <TabsTrigger value="security">安全設定</TabsTrigger>
          <TabsTrigger value="notification">通知設定</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Database className="h-4 w-4" />
                基本設定
              </CardTitle>
              <CardDescription>設定公司基本資訊</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>公司名稱</Label>
                  <Input
                    value={settings.general.companyName}
                    onChange={(e) =>
                      updateGeneralSettings({
                        ...settings.general,
                        companyName: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>統一編號</Label>
                  <Input
                    value={settings.general.taxId}
                    onChange={(e) =>
                      updateGeneralSettings({
                        ...settings.general,
                        taxId: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>公司地址</Label>
                  <Input
                    value={settings.general.address}
                    onChange={(e) =>
                      updateGeneralSettings({
                        ...settings.general,
                        address: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>聯絡電話</Label>
                  <Input
                    value={settings.general.phone}
                    onChange={(e) =>
                      updateGeneralSettings({
                        ...settings.general,
                        phone: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline">取消</Button>
                <Button onClick={handleSaveGeneral}>
                  {saved ? "已儲存" : "儲存變更"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4" />
                安全設定
              </CardTitle>
              <CardDescription>管理系統安全選項</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">雙重驗證</p>
                  <p className="text-xs text-muted-foreground">
                    啟用雙重身份驗證以增強安全性
                  </p>
                </div>
                <Switch
                  checked={settings.security.twoFactorAuth}
                  onCheckedChange={(checked) =>
                    updateSecuritySettings({
                      ...settings.security,
                      twoFactorAuth: checked,
                    })
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">密碼強度要求</p>
                  <p className="text-xs text-muted-foreground">
                    要求使用者設定強密碼
                  </p>
                </div>
                <Switch
                  checked={settings.security.passwordStrength}
                  onCheckedChange={(checked) =>
                    updateSecuritySettings({
                      ...settings.security,
                      passwordStrength: checked,
                    })
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">自動登出</p>
                  <p className="text-xs text-muted-foreground">
                    閒置 30 分鐘後自動登出
                  </p>
                </div>
                <Switch
                  checked={settings.security.autoLogout}
                  onCheckedChange={(checked) =>
                    updateSecuritySettings({
                      ...settings.security,
                      autoLogout: checked,
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notification" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="h-4 w-4" />
                通知設定
              </CardTitle>
              <CardDescription>管理系統通知偏好</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">請假審批通知</p>
                  <p className="text-xs text-muted-foreground">
                    收到新的請假申請時通知
                  </p>
                </div>
                <Switch
                  checked={settings.notification.leaveApproval}
                  onCheckedChange={(checked) =>
                    handleNotificationChange("leaveApproval", checked)
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">入職提醒</p>
                  <p className="text-xs text-muted-foreground">
                    新員工入職前一天提醒
                  </p>
                </div>
                <Switch
                  checked={settings.notification.onboardingReminder}
                  onCheckedChange={(checked) =>
                    handleNotificationChange("onboardingReminder", checked)
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">薪資發放通知</p>
                  <p className="text-xs text-muted-foreground">
                    薪資發放完成時通知
                  </p>
                </div>
                <Switch
                  checked={settings.notification.salaryNotification}
                  onCheckedChange={(checked) =>
                    handleNotificationChange("salaryNotification", checked)
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

