'use client';

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Separator,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  toast
} from '@go-tech-frontend/ui';
import { ArrowLeft, Eye, EyeOff, Lock, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Footer from '@/app/components/Footer';
import Header from '@/app/components/Header';
import { useAuth } from '@/contexts/AuthContext';

const Settings = ({ token, user }: any) => {
  const { setUser } = useAuth();
  const router = useRouter();

  // 個人資料狀態
  const [profileData, setProfileData] = useState({
    custName: user.custName,
    email: user.email,
    phone: user.phone,
    companyName: user.companyName
  });
  const [isProfileLoading, setIsProfileLoading] = useState(false);

  // 密碼修改狀態
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);

  const handleProfileChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handlePasswordChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profileData.custName.trim() || !profileData.email.trim() || !profileData.phone.trim()) {
      toast.error('請填寫所有必填欄位');
      return;
    }

    setIsProfileLoading(true);

    try {
      const response = await fetch('/go-tech/platform/platformCustomer/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Type': 'platform_customer',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      })
        .then(res => res.json())
        .catch(err => {
          toast.error(err.message);
        });
      if (response.code === 200) {
        fetch('/api/auth/signin', {
          method: 'POST',
          body: JSON.stringify(response.data)
        })
          .then(res => res.json())
          .then(res => {
            setUser(res.data);
            toast.success('個人資料已更新');
          });
      }
    } catch (error: any) {
      toast.error(error.message);
      console.log(error);
    } finally {
      setIsProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!passwordData.currentPassword.trim()) {
      toast.error('請輸入當前密碼');
      return;
    }

    if (!passwordData.newPassword.trim()) {
      toast.error('請輸入新密碼');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('新密碼長度至少為6個字符');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('兩次輸入的新密碼不一致');
      return;
    }

    setIsPasswordLoading(true);
    try {
      const response = await fetch('/go-tech/platform/platformCustomer/updatePwd', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Type': 'platform_customer',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          oldPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });
      if (!response.ok) {
        const statusCode = response.status;
        if (statusCode === 404) {
          toast.error(`接口 /go-tech/platform/platformCustomer/updatePwd 未定义`);
        } else {
          throw new Error(`API request failed: ${statusCode} ${response.statusText}`);
        }
        return;
      }

      const result = await response.json();

      if (result && result.code === 200) {
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        toast.success('密碼修改成功');
      }
    } catch (error: any) {
      toast.error(error.message);
      console.log(error);
    } finally {
      setIsPasswordLoading(false);
    }
    // 模擬修改密碼
    // setTimeout(() => {
    //   setIsPasswordLoading(false);
    //   setPasswordData({
    //     currentPassword: "",
    //     newPassword: "",
    //     confirmPassword: "",
    //   });
    //   toast.success("密碼修改成功");
    // }, 1000);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative py-6 bg-[#FFF8F5]">
        <div className="container mx-auto px-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            返回
          </button>
          <h1 className="text-3xl md:text-4xl font-bold text-primary">帳戶設定</h1>
          <p className="text-muted-foreground mt-2">管理您的個人資料與安全設定</p>
        </div>
      </section>

      {/* Settings Content */}
      <section className="py-8 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="profile" className="gap-2">
                  <User className="w-4 h-4" />
                  個人資料
                </TabsTrigger>
                <TabsTrigger value="password" className="gap-2">
                  <Lock className="w-4 h-4" />
                  修改密碼
                </TabsTrigger>
              </TabsList>

              {/* 個人資料 Tab */}
              <TabsContent value="profile">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5 text-primary" />
                      個人資料
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleProfileSubmit} className="space-y-5">
                      <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-1">
                          <span className="text-destructive">*</span>
                          姓名
                        </label>
                        <Input
                          type="text"
                          placeholder="請輸入您的姓名"
                          value={profileData.custName}
                          onChange={handleProfileChange('custName')}
                          className="h-12"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-1">
                          <span className="text-destructive">*</span>
                          電子郵箱
                        </label>
                        <Input
                          type="email"
                          placeholder="請輸入您的電子郵箱"
                          value={profileData.email}
                          onChange={handleProfileChange('email')}
                          className="h-12"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-1">
                          <span className="text-destructive">*</span>
                          聯繫電話
                        </label>
                        <Input
                          type="tel"
                          placeholder="請輸入您的聯繫電話"
                          value={profileData.phone}
                          onChange={handleProfileChange('phone')}
                          className="h-12"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">公司名稱</label>
                        <Input
                          type="text"
                          placeholder="請輸入您的公司名稱"
                          value={profileData.companyName}
                          onChange={handleProfileChange('companyName')}
                          className="h-12"
                        />
                      </div>

                      <Separator className="my-6" />

                      <Button type="submit" disabled={isProfileLoading} className="w-full h-12 text-base font-semibold">
                        {isProfileLoading ? '保存中...' : '保存修改'}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* 修改密碼 Tab */}
              <TabsContent value="password">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lock className="w-5 h-5 text-primary" />
                      修改密碼
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handlePasswordSubmit} className="space-y-5">
                      <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-1">
                          <span className="text-destructive">*</span>
                          當前密碼
                        </label>
                        <div className="relative">
                          <Input
                            type={showCurrentPassword ? 'text' : 'password'}
                            placeholder="請輸入當前密碼"
                            value={passwordData.currentPassword}
                            onChange={handlePasswordChange('currentPassword')}
                            className="h-12 pr-12"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-1">
                          <span className="text-destructive">*</span>
                          新密碼
                        </label>
                        <div className="relative">
                          <Input
                            type={showNewPassword ? 'text' : 'password'}
                            placeholder="請輸入新密碼（至少6個字符）"
                            value={passwordData.newPassword}
                            onChange={handlePasswordChange('newPassword')}
                            className="h-12 pr-12"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-1">
                          <span className="text-destructive">*</span>
                          確認新密碼
                        </label>
                        <div className="relative">
                          <Input
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder="請再次輸入新密碼"
                            value={passwordData.confirmPassword}
                            onChange={handlePasswordChange('confirmPassword')}
                            className="h-12 pr-12"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>

                      <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
                        <p className="font-medium mb-2">密碼要求：</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>至少6個字符</li>
                          <li>建議包含大小寫字母和數字</li>
                        </ul>
                      </div>

                      <Separator className="my-6" />

                      <Button
                        type="submit"
                        disabled={isPasswordLoading}
                        className="w-full h-12 text-base font-semibold"
                      >
                        {isPasswordLoading ? '修改中...' : '確認修改密碼'}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Settings;
