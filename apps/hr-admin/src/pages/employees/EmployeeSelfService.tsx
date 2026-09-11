import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  GraduationCap,
  Landmark,
  Loader2,
  Paperclip,
  Phone,
  Upload,
  User,
  X,
  XCircle
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { type EmployeeInviteSubmitPayload, getInviteInfo, submitInvite, uploadInviteFile } from '@/api/employee';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

function FieldRow({ children, label, required }: { children: React.ReactNode; label: string; required?: boolean }) {
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

/** 文案 -> 後端編碼 */
const GENDER_MAP: Record<string, number> = { 男: 1, 女: 2, 其他: 3 };
const MARITAL_MAP: Record<string, number> = { 未婚: 1, 已婚: 2, 離婚: 3, 喪偶: 4 };

interface SelfForm {
  address: string;
  alias: string;
  bankAccount: string;
  bankAccountHolder: string;
  bankName: string;
  birthday: string;
  education: string;
  email: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
  englishName: string;
  gender: string;
  idCardUrl: string;
  idNumber: string;
  major: string;
  maritalStatus: string;
  name: string;
  nationality: string;
  phone: string;
  school: string;
}

const initialForm: SelfForm = {
  name: '',
  englishName: '',
  alias: '',
  gender: '男',
  birthday: '',
  nationality: '',
  maritalStatus: '',
  idNumber: '',
  idCardUrl: '',
  phone: '',
  email: '',
  address: '',
  emergencyContactName: '',
  emergencyContactRelation: '',
  emergencyContactPhone: '',
  education: '',
  school: '',
  major: '',
  bankName: '',
  bankAccount: '',
  bankAccountHolder: ''
};

function SectionCard({
  children,
  description,
  icon: Icon,
  title
}: {
  children: React.ReactNode;
  description?: string;
  icon: any;
  title: string;
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

/** 居中提示卡片（加載中/失效/成功） */
function CenterCard({
  desc,
  icon: Icon,
  iconClass,
  title
}: {
  desc: React.ReactNode;
  icon: any;
  iconClass: string;
  title: string;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full text-center">
        <CardContent className="pt-10 pb-10 space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <Icon className={`h-8 w-8 ${iconClass}`} />
          </div>
          <h2 className="text-xl font-bold">{title}</h2>
          <p className="text-sm text-muted-foreground">{desc}</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function EmployeeSelfService() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [loading, setLoading] = useState(true);
  const [invalid, setInvalid] = useState(''); // 非空表示連結失效原因
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<SelfForm>(initialForm);
  const set = <K extends keyof SelfForm>(k: K, v: SelfForm[K]) => setForm(p => ({ ...p, [k]: v }));

  const [uploading, setUploading] = useState(false);
  const [idFileName, setIdFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleIdFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // 允許重新選擇同一檔案
    if (!file) return;
    // 限制：僅圖片或 PDF，單檔 ≤ 10MB（與後端 max-file-size 一致）
    const okType = file.type.startsWith('image/') || file.type === 'application/pdf';
    if (!okType) {
      toast.error('僅支援圖片或 PDF 檔案');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('檔案大小不可超過 10MB');
      return;
    }
    setUploading(true);
    try {
      const res = await uploadInviteFile(token, file);
      set('idCardUrl', res.data.url);
      setIdFileName(res.data.originalFilename || file.name);
      toast.success('證件影本上傳成功');
    } catch (err: any) {
      toast.error(err?.message || '上傳失敗，請稍後重試');
    } finally {
      setUploading(false);
    }
  };

  const removeIdFile = () => {
    set('idCardUrl', '');
    setIdFileName('');
  };

  // 載入邀請信息：校驗 token、回顯姓名/手機/郵箱
  useEffect(() => {
    if (!token) {
      setInvalid('缺少邀請憑證，請使用 HR 提供的完整連結打開。');
      setLoading(false);
      return;
    }
    getInviteInfo(token)
      .then(res => {
        const info = res.data;
        if (!info?.fillable) {
          setInvalid('該邀請連結已失效或已提交，如有疑問請聯繫人事部門。');
          return;
        }
        setForm(p => ({
          ...p,
          name: info.name || '',
          phone: info.phone || '',
          email: info.email || ''
        }));
      })
      .catch((err: any) => setInvalid(err?.message || '邀請連結無效或已過期。'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleSubmit = async () => {
    // 必填校驗（按頁面順序逐項提示第一個缺失）
    const required: { msg: string; v: string }[] = [
      { v: form.name, msg: '請填寫中文姓名' },
      { v: form.nationality, msg: '請選擇國籍' },
      { v: form.idNumber, msg: '請填寫證件號碼' },
      { v: form.phone, msg: '請填寫手機號碼' },
      { v: form.email, msg: '請填寫電子郵箱' },
      { v: form.bankName, msg: '請填寫銀行名稱' },
      { v: form.bankAccount, msg: '請填寫帳戶號碼' },
      { v: form.bankAccountHolder, msg: '請填寫帳戶持有人姓名' }
    ];
    for (const r of required) {
      if (!r.v.trim()) {
        toast.error(r.msg);
        return;
      }
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      toast.error('電子郵箱格式不正確');
      return;
    }
    setSubmitting(true);
    try {
      const s = (v: string) => (v.trim() ? v.trim() : undefined);
      const payload: EmployeeInviteSubmitPayload = {
        token,
        name: form.name.trim(),
        englishName: s(form.englishName),
        alias: s(form.alias),
        gender: form.gender ? GENDER_MAP[form.gender] : undefined,
        birthday: s(form.birthday),
        idNumber: s(form.idNumber),
        idCardUrl: s(form.idCardUrl),
        nationality: s(form.nationality),
        maritalStatus: form.maritalStatus ? MARITAL_MAP[form.maritalStatus] : undefined,
        phone: s(form.phone),
        email: s(form.email),
        address: s(form.address),
        education: s(form.education),
        school: s(form.school),
        major: s(form.major),
        emergencyContactName: s(form.emergencyContactName),
        emergencyContactRelation: s(form.emergencyContactRelation),
        emergencyContactPhone: s(form.emergencyContactPhone),
        bankName: s(form.bankName),
        bankAccount: s(form.bankAccount),
        bankAccountHolder: s(form.bankAccountHolder)
      };
      await submitInvite(payload);
      setSubmitted(true);
    } catch (err: any) {
      toast.error(err?.message || '提交失敗，請稍後重試');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <CenterCard
        icon={Loader2}
        iconClass="text-primary animate-spin"
        title="載入中…"
        desc="正在校驗邀請連結，請稍候。"
      />
    );
  }
  if (invalid) {
    return <CenterCard icon={XCircle} iconClass="text-destructive" title="連結無法使用" desc={invalid} />;
  }
  if (submitted) {
    return (
      <CenterCard
        icon={CheckCircle2}
        iconClass="text-success"
        title="資料提交成功！"
        desc={
          <>
            感謝您填寫個人資料，HR 團隊將會審核您的資訊。
            <br />
            如有疑問，請聯繫人事部門。
          </>
        }
      />
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Top Bar */}
      <div className="bg-primary text-primary-foreground py-4 px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-lg font-bold">新員工資料填寫</h1>
          <p className="text-sm opacity-80">
            {form.name ? `歡迎 ${form.name}！` : '歡迎！'}請填寫以下個人資料，帶{' '}
            <span className="text-destructive-foreground font-medium">*</span> 為必填項目
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
        {/* 1. 基本資料 */}
        <SectionCard icon={User} title="基本資料" description="請填寫您的個人基本資訊">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FieldRow label="中文姓名" required>
              <Input placeholder="請輸入中文全名" value={form.name} onChange={e => set('name', e.target.value)} />
            </FieldRow>
            <FieldRow label="英文姓名">
              <Input
                placeholder="請輸入英文姓名（與證件一致）"
                value={form.englishName}
                onChange={e => set('englishName', e.target.value)}
              />
            </FieldRow>
            <FieldRow label="暱稱">
              <Input placeholder="請輸入暱稱" value={form.alias} onChange={e => set('alias', e.target.value)} />
            </FieldRow>
            <FieldRow label="性別">
              <Select value={form.gender} onValueChange={v => set('gender', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="請選擇" />
                </SelectTrigger>
                <SelectContent>
                  {['男', '女', '其他'].map(o => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldRow>
            <FieldRow label="出生日期">
              <Input
                type="date"
                value={form.birthday}
                onChange={e => set('birthday', e.target.value)}
                onClick={e => e.currentTarget.showPicker?.()}
              />
            </FieldRow>
            <FieldRow label="國籍" required>
              <Select value={form.nationality || undefined} onValueChange={v => set('nationality', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="請選擇" />
                </SelectTrigger>
                <SelectContent>
                  {['香港', '中國', '台灣', '新加坡', '澳洲', '其他'].map(o => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldRow>
            <FieldRow label="婚姻狀況">
              <Select value={form.maritalStatus} onValueChange={v => set('maritalStatus', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="請選擇" />
                </SelectTrigger>
                <SelectContent>
                  {['未婚', '已婚', '離婚', '喪偶'].map(o => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldRow>
          </div>
        </SectionCard>

        {/* 2. 身份證明 */}
        <SectionCard icon={FileText} title="身份證明文件" description="用於勞動合約及社保登記">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FieldRow label="證件號碼" required>
              <Input
                placeholder="請輸入證件號碼"
                value={form.idNumber}
                onChange={e => set('idNumber', e.target.value)}
              />
            </FieldRow>
          </div>
          <div className="mt-4">
            <FieldRow label="上傳證件影本">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={handleIdFile}
              />
              {form.idCardUrl ? (
                <div className="flex items-center gap-3 border rounded-lg p-3 bg-muted/30">
                  <Paperclip className="h-4 w-4 text-primary shrink-0" />
                  <a
                    href={form.idCardUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-primary underline truncate flex-1"
                  >
                    {idFileName || '已上傳證件影本'}
                  </a>
                  <Button type="button" variant="ghost" size="sm" onClick={removeIdFile} className="shrink-0">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed rounded-lg p-6 text-center text-muted-foreground hover:border-primary hover:text-primary transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {uploading ? (
                    <Loader2 className="h-6 w-6 mx-auto mb-2 animate-spin" />
                  ) : (
                    <Upload className="h-6 w-6 mx-auto mb-2" />
                  )}
                  <p className="text-sm">{uploading ? '上傳中…' : '點擊上傳證件影本（圖片或 PDF，≤10MB）'}</p>
                </button>
              )}
            </FieldRow>
          </div>
        </SectionCard>

        {/* 3. 聯絡資訊 */}
        <SectionCard icon={Phone} title="聯絡資訊">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FieldRow label="手機號碼" required>
              <Input placeholder="09xx-xxx-xxx" value={form.phone} onChange={e => set('phone', e.target.value)} />
            </FieldRow>
            <FieldRow label="電子郵箱" required>
              <Input
                type="email"
                placeholder="name@example.com"
                value={form.email}
                onChange={e => set('email', e.target.value)}
              />
            </FieldRow>
            <div className="md:col-span-2">
              <FieldRow label="通訊地址">
                <Input
                  placeholder="請輸入完整地址"
                  value={form.address}
                  onChange={e => set('address', e.target.value)}
                />
              </FieldRow>
            </div>
          </div>
        </SectionCard>

        {/* 4. 緊急聯絡人 */}
        <SectionCard icon={AlertTriangle} title="緊急聯絡人">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FieldRow label="姓名">
              <Input value={form.emergencyContactName} onChange={e => set('emergencyContactName', e.target.value)} />
            </FieldRow>
            <FieldRow label="關係">
              <Select value={form.emergencyContactRelation} onValueChange={v => set('emergencyContactRelation', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="請選擇" />
                </SelectTrigger>
                <SelectContent>
                  {['配偶', '父母', '兄弟姐妹', '子女', '朋友', '其他'].map(o => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldRow>
            <FieldRow label="聯絡電話">
              <Input value={form.emergencyContactPhone} onChange={e => set('emergencyContactPhone', e.target.value)} />
            </FieldRow>
          </div>
        </SectionCard>

        {/* 5. 學歷 */}
        <SectionCard icon={GraduationCap} title="學歷資訊">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FieldRow label="最高學歷">
              <Select value={form.education} onValueChange={v => set('education', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="請選擇" />
                </SelectTrigger>
                <SelectContent>
                  {['高中/職', '大專', '學士', '碩士', '博士'].map(o => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldRow>
            <FieldRow label="畢業學校">
              <Input value={form.school} onChange={e => set('school', e.target.value)} />
            </FieldRow>
            <FieldRow label="主修科系">
              <Input value={form.major} onChange={e => set('major', e.target.value)} />
            </FieldRow>
          </div>
        </SectionCard>

        {/* 6. 銀行帳戶 */}
        <SectionCard icon={Landmark} title="銀行帳戶資訊" description="用於薪資發放">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FieldRow label="銀行名稱" required>
              <Input placeholder="例：滙豐銀行" value={form.bankName} onChange={e => set('bankName', e.target.value)} />
            </FieldRow>
            <FieldRow label="帳戶號碼" required>
              <Input value={form.bankAccount} onChange={e => set('bankAccount', e.target.value)} />
            </FieldRow>
            <FieldRow label="帳戶持有人姓名" required>
              <Input
                placeholder="需與本人姓名一致"
                value={form.bankAccountHolder}
                onChange={e => set('bankAccountHolder', e.target.value)}
              />
            </FieldRow>
          </div>
        </SectionCard>

        {/* 提交 */}
        <div className="flex items-center justify-between pt-2 pb-8">
          <p className="text-xs text-muted-foreground">提交即表示您確認以上資料真實無誤</p>
          <Button size="lg" onClick={handleSubmit} disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            確認提交
          </Button>
        </div>
      </div>
    </div>
  );
}
