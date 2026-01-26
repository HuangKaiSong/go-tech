"use client";

import Footer from "@/app/components/Footer";
import Header from "@/app/components/Header";
import { Button, Input } from "@go-tech-frontend/ui";
import { CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const FreeTrial = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle trial registration
    router.push("/");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const trialBenefits = [
    "14天完整功能體驗",
    "無需信用卡",
    "專人客服支援",
    "數據安全保障",
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 pt-32 pb-16 bg-linear-to-b from-primary/10 to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h1 className="text-3xl md:text-4xl font-bold text-primary mb-4">
                立即開始14天免費試用
              </h1>
              <p className="text-muted-foreground text-lg">
                體驗完整功能，無需任何付款
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Benefits */}
              <div className="bg-primary/5 rounded-lg p-8">
                <h2 className="text-xl font-bold text-foreground mb-6">
                  試用包含
                </h2>
                <ul className="space-y-4">
                  {trialBenefits.map((benefit, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-primary shrink-0" />
                      <span className="text-foreground">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Form */}
              <div className="bg-white rounded-lg shadow-lg p-8">
                <h2 className="text-xl font-bold text-foreground mb-6">
                  填寫資料
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      姓名 <span className="text-primary">*</span>
                    </label>
                    <Input
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="請輸入您的姓名"
                      required
                      className="h-11"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      電子郵箱 <span className="text-primary">*</span>
                    </label>
                    <Input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="請輸入您的電子郵箱"
                      required
                      className="h-11"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      聯繫電話 <span className="text-primary">*</span>
                    </label>
                    <Input
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="請輸入您的聯繫電話"
                      required
                      className="h-11"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      公司名稱
                    </label>
                    <Input
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                      placeholder="請輸入您的公司名稱（選填）"
                      className="h-11"
                    />
                  </div>

                  <div className="pt-4">
                    <Button type="submit" className="w-full h-12 text-lg">
                      開始免費試用
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default FreeTrial;
