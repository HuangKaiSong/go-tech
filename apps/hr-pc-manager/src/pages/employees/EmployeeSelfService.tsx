import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  User, Phone, MapPin, AlertTriangle, GraduationCap, Landmark,
  FileText, CheckCircle2, Upload, Briefcase,
} from "lucide-react";

function FieldRow({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  );
}

function SelectField({ options, placeholder = "請選擇" }: { options: string[]; placeholder?: string }) {
  return (
    <Select>
      <SelectTrigger><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent>
        {options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

function SectionCard({ icon: Icon, title, description, children }: {
  icon: any; title: string; description?: string; children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base flex items-center gap-2">
          <Icon className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export default function EmployeeSelfService() {
  const [searchParams] = useSearchParams();
  const employeeName = searchParams.get("name") || "";
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-10 pb-10 space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
            <h2 className="text-xl font-bold">資料提交成功！</h2>
            <p className="text-sm text-muted-foreground">
              感謝您填寫個人資料，HR 團隊將會審核您的資訊。<br />
              如有疑問，請聯繫人事部門。
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Top Bar */}
      <div className="bg-primary text-primary-foreground py-4 px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-lg font-bold">新員工資料填寫</h1>
          <p className="text-sm opacity-80">
            {employeeName ? `歡迎 ${employeeName}！` : "歡迎！"}請填寫以下個人資料，帶 <span className="text-destructive-foreground font-medium">*</span> 為必填項目
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
        {/* 1. 基本資料 */}
        <SectionCard icon={User} title="基本資料" description="請填寫您的個人基本資訊">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FieldRow label="中文姓名" required>
              <Input placeholder="請輸入中文全名" defaultValue={employeeName} />
            </FieldRow>
            <FieldRow label="英文姓名" required>
              <Input placeholder="請輸入英文全名" />
            </FieldRow>
            <FieldRow label="性別" required>
              <SelectField options={["男", "女", "其他"]} />
            </FieldRow>
            <FieldRow label="出生日期" required>
              <Input type="date" />
            </FieldRow>
            <FieldRow label="國籍" required>
              <Input placeholder="請輸入國籍" />
            </FieldRow>
            <FieldRow label="婚姻狀況">
              <SelectField options={["未婚", "已婚", "離婚", "喪偶"]} />
            </FieldRow>
          </div>
        </SectionCard>

        {/* 2. 身份證明 */}
        <SectionCard icon={FileText} title="身份證明文件" description="用於勞動合約及社保登記">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FieldRow label="證件類型" required>
              <SelectField options={["身份證", "護照", "居留證"]} />
            </FieldRow>
            <FieldRow label="證件號碼" required>
              <Input placeholder="請輸入證件號碼" />
            </FieldRow>
            <FieldRow label="簽發日期">
              <Input type="date" />
            </FieldRow>
            <FieldRow label="有效期限">
              <Input type="date" />
            </FieldRow>
          </div>
          <div className="mt-4">
            <FieldRow label="上傳證件影本">
              <div className="border-2 border-dashed rounded-lg p-6 text-center text-muted-foreground hover:border-primary/50 cursor-pointer transition-colors">
                <Upload className="h-6 w-6 mx-auto mb-2" />
                <p className="text-sm">點擊或拖放上傳（正反面）</p>
                <p className="text-xs mt-1">支援 JPG、PNG、PDF，最大 5MB</p>
              </div>
            </FieldRow>
          </div>
        </SectionCard>

        {/* 3. 聯絡資訊 */}
        <SectionCard icon={Phone} title="聯絡資訊">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FieldRow label="手機號碼" required>
              <Input placeholder="09xx-xxx-xxx" />
            </FieldRow>
            <FieldRow label="電子郵箱" required>
              <Input type="email" placeholder="name@example.com" />
            </FieldRow>
            <div className="md:col-span-2">
              <FieldRow label="通訊地址" required>
                <Input placeholder="請輸入完整地址" />
              </FieldRow>
            </div>
            <div className="md:col-span-2">
              <FieldRow label="戶籍地址">
                <Input placeholder="如與通訊地址相同可不填" />
              </FieldRow>
            </div>
          </div>
        </SectionCard>

        {/* 4. 緊急聯絡人 */}
        <SectionCard icon={AlertTriangle} title="緊急聯絡人" description="至少填寫一位緊急聯絡人">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FieldRow label="姓名" required>
              <Input placeholder="" />
            </FieldRow>
            <FieldRow label="關係" required>
              <SelectField options={["配偶", "父母", "兄弟姐妹", "子女", "朋友", "其他"]} />
            </FieldRow>
            <FieldRow label="聯絡電話" required>
              <Input placeholder="" />
            </FieldRow>
          </div>
          <Separator className="my-4" />
          <p className="text-xs text-muted-foreground mb-3">第二位緊急聯絡人（選填）</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FieldRow label="姓名"><Input placeholder="" /></FieldRow>
            <FieldRow label="關係"><SelectField options={["配偶", "父母", "兄弟姐妹", "子女", "朋友", "其他"]} /></FieldRow>
            <FieldRow label="聯絡電話"><Input placeholder="" /></FieldRow>
          </div>
        </SectionCard>

        {/* 5. 學歷 */}
        <SectionCard icon={GraduationCap} title="學歷資訊">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FieldRow label="最高學歷" required>
              <SelectField options={["高中/職", "大專", "學士", "碩士", "博士"]} />
            </FieldRow>
            <FieldRow label="畢業學校" required>
              <Input placeholder="" />
            </FieldRow>
            <FieldRow label="主修科系">
              <Input placeholder="" />
            </FieldRow>
            <FieldRow label="畢業年份">
              <Input type="number" placeholder="例：2020" />
            </FieldRow>
          </div>
        </SectionCard>

        {/* 6. 工作經歷 */}
        <SectionCard icon={Briefcase} title="工作經歷" description="請填寫最近一份工作經歷（選填）">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FieldRow label="公司名稱"><Input placeholder="" /></FieldRow>
            <FieldRow label="職位"><Input placeholder="" /></FieldRow>
            <FieldRow label="在職時間（起）"><Input type="date" /></FieldRow>
            <FieldRow label="在職時間（迄）"><Input type="date" /></FieldRow>
            <div className="md:col-span-2">
              <FieldRow label="工作內容描述">
                <Textarea placeholder="簡要描述您的工作職責" rows={3} />
              </FieldRow>
            </div>
            <div className="md:col-span-2">
              <FieldRow label="離職原因">
                <Input placeholder="" />
              </FieldRow>
            </div>
          </div>
        </SectionCard>

        {/* 7. 銀行帳戶 */}
        <SectionCard icon={Landmark} title="銀行帳戶資訊" description="用於薪資發放">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FieldRow label="銀行名稱" required>
              <Input placeholder="例：中國信託" />
            </FieldRow>
            <FieldRow label="分行名稱">
              <Input placeholder="" />
            </FieldRow>
            <FieldRow label="帳戶號碼" required>
              <Input placeholder="" />
            </FieldRow>
            <FieldRow label="帳戶持有人姓名" required>
              <Input placeholder="需與本人姓名一致" />
            </FieldRow>
          </div>
        </SectionCard>

        {/* 提交 */}
        <div className="flex items-center justify-between pt-2 pb-8">
          <p className="text-xs text-muted-foreground">
            提交即表示您確認以上資料真實無誤
          </p>
          <Button size="lg" onClick={() => { toast.success("資料提交成功"); setSubmitted(true); }}>
            確認提交
          </Button>
        </div>
      </div>
    </div>
  );
}
