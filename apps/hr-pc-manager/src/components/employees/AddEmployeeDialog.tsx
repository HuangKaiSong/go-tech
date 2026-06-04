import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserPlus, Send, Minus, Plus } from "lucide-react";
import { toast } from "sonner";

interface AddEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddEmployeeDialog({ open, onOpenChange }: AddEmployeeDialogProps) {
  const [mode, setMode] = useState<"manual" | "invite">("invite");
  const [step, setStep] = useState(1);
  const [probation, setProbation] = useState(3);
  const [adwOvertime, setAdwOvertime] = useState(0);
  const [bankRatio, setBankRatio] = useState(100);

  const reset = () => { setStep(1); setMode("invite"); setProbation(3); setAdwOvertime(0); setBankRatio(100); };

  const handleSubmit = () => {
    if (mode === "invite") {
      toast.success("已發送填寫連結至員工信箱");
    } else {
      toast.success("員工資料已新增成功");
    }
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            新增員工
          </DialogTitle>
          <DialogDescription>選擇新增方式：HR 手動填寫或發送連結由員工自行填寫</DialogDescription>
        </DialogHeader>

        <Tabs value={mode} onValueChange={(v) => { setMode(v as "manual" | "invite"); setStep(1); }}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual">HR 手動新增</TabsTrigger>
            <TabsTrigger value="invite">發送連結邀請員工填寫</TabsTrigger>
          </TabsList>

          {/* ===== 邀請模式 ===== */}
          <TabsContent value="invite" className="space-y-6 pt-4">
            <p className="text-sm text-muted-foreground">
              輸入員工的手機或郵箱，系統將發送個人資料填寫連結，員工提交後 HR 再補充組織與薪資相關欄位。
            </p>
            <div className="grid grid-cols-2 gap-4">
              <FieldRow label="員工姓名"><Input placeholder="請輸入姓名" /></FieldRow>
              <FieldRow label="電子郵箱"><Input type="email" placeholder="name@example.com" /></FieldRow>
              <FieldRow label="手機號碼"><Input placeholder="09xx-xxx-xxx" /></FieldRow>
              <FieldRow label="預定入職日期"><Input type="date" /></FieldRow>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium">員工將自行填寫以下資料：</p>
              <ul className="text-xs text-muted-foreground grid grid-cols-2 gap-1 list-disc list-inside">
                <li>個人基本資料（姓名、性別、出生日期）</li>
                <li>身份證/護照資訊</li>
                <li>聯絡地址</li>
                <li>緊急聯絡人</li>
                <li>銀行帳戶資訊</li>
                <li>學歷與工作經歷</li>
              </ul>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>關閉</Button>
              <Button onClick={handleSubmit}>
                <Send className="h-4 w-4 mr-1" />發送邀請連結
              </Button>
            </DialogFooter>
          </TabsContent>

          {/* ===== 手動模式 ===== */}
          <TabsContent value="manual" className="pt-4">
            {step === 1 && <StepOneHR probation={probation} setProbation={setProbation} adwOvertime={adwOvertime} setAdwOvertime={setAdwOvertime} bankRatio={bankRatio} setBankRatio={setBankRatio} />}
            {step === 2 && <StepTwoEmployee />}

            <DialogFooter className="mt-6 gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>關閉</Button>
              {step === 2 && <Button variant="outline" onClick={() => setStep(1)}>上一步</Button>}
              {step === 1 ? (
                <Button onClick={() => setStep(2)}>下一步</Button>
              ) : (
                <Button onClick={handleSubmit}>確定</Button>
              )}
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

/* ===== Step 1: HR 填寫 - 組織與薪資 ===== */
function StepOneHR({ probation, setProbation, adwOvertime, setAdwOvertime, bankRatio, setBankRatio }: {
  probation: number; setProbation: (n: number) => void;
  adwOvertime: number; setAdwOvertime: (n: number) => void;
  bankRatio: number; setBankRatio: (n: number) => void;
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-muted-foreground border-b pb-2">第一步：HR 填寫 — 組織與薪資設定</h3>
      <div className="grid grid-cols-2 gap-x-8 gap-y-4">
        <FieldRow label="員工別名"><Input placeholder="" /></FieldRow>
        <FieldRow label="假期分類列表"><SelectField options={["年假A類", "年假B類", "特殊假期"]} /></FieldRow>

        <FieldRow label="職位編號"><SelectField options={["P001 高級工程師", "P002 銷售經理", "P003 HR專員", "P004 市場總監"]} /></FieldRow>
        <FieldRow label="班次類型"><SelectField options={["固定班", "輪班", "彈性班"]} /></FieldRow>

        <FieldRow label="職位群組編號"><Input placeholder="" /></FieldRow>
        <FieldRow label="班次代號"><SelectField options={["A班", "B班", "C班"]} /></FieldRow>

        <FieldRow label="假期群組編號"><Input placeholder="" /></FieldRow>
        <FieldRow label="僱用類型"><SelectField options={["全職", "兼職", "合約", "實習"]} /></FieldRow>

        <FieldRow label="部門編號"><SelectField options={["D01 技術部", "D02 銷售部", "D03 人事部", "D04 市場部", "D05 財務部"]} /></FieldRow>
        <FieldRow label="薪資類型"><SelectField options={["月薪", "日薪", "時薪"]} /></FieldRow>

        <FieldRow label="部門細分編號"><Input placeholder="" /></FieldRow>
        <FieldRow label="基本薪金"><Input type="number" placeholder="" /></FieldRow>

        <FieldRow label="試用期">
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => setProbation(Math.max(0, probation - 1))}><Minus className="h-3 w-3" /></Button>
            <Input className="w-16 text-center" value={probation} readOnly />
            <span className="text-sm text-muted-foreground">月</span>
            <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => setProbation(probation + 1)}><Plus className="h-3 w-3" /></Button>
          </div>
        </FieldRow>
        <FieldRow label="支付類型"><SelectField options={["銀行轉帳", "現金", "支票"]} /></FieldRow>

        <FieldRow label="通過試用日期"><Input type="date" /></FieldRow>
        <FieldRow label="工資發放群組"><SelectField options={["月結A組", "月結B組", "半月結"]} /></FieldRow>

        <FieldRow label="入職日期"><Input type="date" /></FieldRow>
        <FieldRow label="供款類型"><SelectField options={["標準供款", "自願供款", "豁免"]} /></FieldRow>

        <FieldRow label="每日工作時數"><Input type="number" placeholder="" /></FieldRow>
        <FieldRow label="強積金類型"><SelectField options={["僱員強制", "僱主自願", "行業計劃"]} /></FieldRow>

        <FieldRow label="每週工作日數"><Input type="number" placeholder="" /></FieldRow>
        <FieldRow label="員工強積金類型"><SelectField options={["標準", "特別"]} /></FieldRow>

        <FieldRow label="每年工作時數"><Input type="number" placeholder="" /></FieldRow>
        <FieldRow label="職業退休計劃供款類型"><SelectField options={["僱員供款", "僱主供款", "雙方供款"]} /></FieldRow>

        <FieldRow label="兼職員工">
          <RadioGroup defaultValue="no" className="flex gap-4">
            <div className="flex items-center gap-1.5"><RadioGroupItem value="yes" id="pt-y" /><Label htmlFor="pt-y" className="text-sm">是</Label></div>
            <div className="flex items-center gap-1.5"><RadioGroupItem value="no" id="pt-n" /><Label htmlFor="pt-n" className="text-sm">否</Label></div>
          </RadioGroup>
        </FieldRow>
        <FieldRow label="職業退休計劃員工供款比例"><Input type="number" placeholder="" /></FieldRow>

        <FieldRow label="彈性上班時間">
          <RadioGroup defaultValue="no" className="flex gap-4">
            <div className="flex items-center gap-1.5"><RadioGroupItem value="yes" id="flex-y" /><Label htmlFor="flex-y" className="text-sm">是</Label></div>
            <div className="flex items-center gap-1.5"><RadioGroupItem value="no" id="flex-n" /><Label htmlFor="flex-n" className="text-sm">否</Label></div>
          </RadioGroup>
        </FieldRow>
        <FieldRow label="職業退休計劃僱主供款比例"><Input type="number" placeholder="" /></FieldRow>

        <FieldRow label="加班換銷假"><Switch /></FieldRow>
        <FieldRow label="僱主的強積金"><Input placeholder="" /></FieldRow>

        <FieldRow label="適用於每日平均工資(ADW)的加班費">
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => setAdwOvertime(Math.max(0, adwOvertime - 1))}><Minus className="h-3 w-3" /></Button>
            <Input className="w-16 text-center" value={adwOvertime} readOnly />
            <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => setAdwOvertime(adwOvertime + 1)}><Plus className="h-3 w-3" /></Button>
          </div>
        </FieldRow>
        <FieldRow label="僱主的職業退休計劃"><Input placeholder="" /></FieldRow>

        <FieldRow label="門市分類列表"><SelectField options={["總部", "分店A", "分店B"]} /></FieldRow>
        <FieldRow label="銀行戶口比例">
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => setBankRatio(Math.max(0, bankRatio - 5))}><Minus className="h-3 w-3" /></Button>
            <Input className="w-16 text-center" value={bankRatio} readOnly />
            <span className="text-sm text-muted-foreground">%</span>
            <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => setBankRatio(Math.min(100, bankRatio + 5))}><Plus className="h-3 w-3" /></Button>
          </div>
        </FieldRow>
      </div>
    </div>
  );
}

/* ===== Step 2: 員工個人資料（HR 代填或員工自填） ===== */
function StepTwoEmployee() {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-muted-foreground border-b pb-2">第二步：員工個人資料</h3>
      <div className="grid grid-cols-2 gap-x-8 gap-y-4">
        <FieldRow label="姓名"><Input placeholder="" /></FieldRow>
        <FieldRow label="英文姓名"><Input placeholder="" /></FieldRow>
        <FieldRow label="性別"><SelectField options={["男", "女", "其他"]} /></FieldRow>
        <FieldRow label="出生日期"><Input type="date" /></FieldRow>
        <FieldRow label="身份證號碼"><Input placeholder="" /></FieldRow>
        <FieldRow label="國籍"><Input placeholder="" /></FieldRow>
        <FieldRow label="婚姻狀況"><SelectField options={["未婚", "已婚", "離婚"]} /></FieldRow>
        <FieldRow label="聯絡電話"><Input placeholder="" /></FieldRow>
        <FieldRow label="電子郵箱"><Input type="email" placeholder="" /></FieldRow>
        <FieldRow label="通訊地址"><Input placeholder="" /></FieldRow>
        <FieldRow label="緊急聯絡人姓名"><Input placeholder="" /></FieldRow>
        <FieldRow label="緊急聯絡人電話"><Input placeholder="" /></FieldRow>
        <FieldRow label="緊急聯絡人關係"><SelectField options={["配偶", "父母", "兄弟姐妹", "朋友"]} /></FieldRow>
        <FieldRow label="最高學歷"><SelectField options={["高中", "大專", "學士", "碩士", "博士"]} /></FieldRow>
        <FieldRow label="畢業學校"><Input placeholder="" /></FieldRow>
        <FieldRow label="主修科系"><Input placeholder="" /></FieldRow>
        <FieldRow label="銀行名稱"><Input placeholder="" /></FieldRow>
        <FieldRow label="銀行帳號"><Input placeholder="" /></FieldRow>
      </div>
    </div>
  );
}

/* ===== 共用元件 ===== */
function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <Label className="w-[160px] text-right text-sm shrink-0 text-muted-foreground">{label}</Label>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function SelectField({ options }: { options: string[] }) {
  return (
    <Select>
      <SelectTrigger><SelectValue placeholder="請選擇" /></SelectTrigger>
      <SelectContent>
        {options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}
