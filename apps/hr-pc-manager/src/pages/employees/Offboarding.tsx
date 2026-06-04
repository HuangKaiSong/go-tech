import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserMinus, Plus, Search, Download, Eye, Clock, CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

/* ===== 模擬資料 ===== */
interface OffboardingRecord {
  id: string;
  name: string;
  department: string;
  position: string;
  resignDate: string;
  lastDay: string;
  hrOwner: string;
  reason: string;
  status: "待審批" | "交接中" | "待結算" | "已完成" | "已取消";
  progress: number;
  phone: string;
  email: string;
}

const offboardingData: OffboardingRecord[] = [
  {
    id: "OFF-2026001", name: "周建華", department: "銷售部", position: "業務經理",
    resignDate: "2026-02-01", lastDay: "2026-02-28", hrOwner: "王美玲",
    reason: "個人因素", status: "交接中", progress: 55,
    phone: "0912-222-333", email: "jh.zhou@email.com",
  },
  {
    id: "OFF-2026002", name: "蔡佩琪", department: "客服部", position: "客服主管",
    resignDate: "2026-02-15", lastDay: "2026-03-15", hrOwner: "王美玲",
    reason: "職涯發展", status: "待審批", progress: 10,
    phone: "0923-444-555", email: "pq.tsai@email.com",
  },
  {
    id: "OFF-2026003", name: "黃俊傑", department: "技術部", position: "前端工程師",
    resignDate: "2026-01-10", lastDay: "2026-02-10", hrOwner: "王美玲",
    reason: "轉職", status: "已完成", progress: 100,
    phone: "0934-666-777", email: "jj.huang@email.com",
  },
  {
    id: "OFF-2026004", name: "張雅琳", department: "市場部", position: "行銷企劃",
    resignDate: "2026-02-20", lastDay: "2026-03-20", hrOwner: "李文華",
    reason: "家庭因素", status: "待結算", progress: 80,
    phone: "0945-888-999", email: "yl.zhang@email.com",
  },
];

const statusConfig: Record<string, { color: string; dot: string }> = {
  "待審批": { color: "bg-primary/10 text-primary border-primary/20", dot: "bg-primary" },
  "交接中": { color: "bg-warning/10 text-warning border-warning/20", dot: "bg-warning" },
  "待結算": { color: "bg-info/10 text-info border-info/20", dot: "bg-info" },
  "已完成": { color: "bg-success/10 text-success border-success/20", dot: "bg-success" },
  "已取消": { color: "bg-muted text-muted-foreground border-muted", dot: "bg-muted-foreground" },
};

/* ===== 新增離職 Dialog ===== */
function AddOffboardingDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [step, setStep] = useState(1);
  const reset = () => setStep(1);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserMinus className="h-5 w-5 text-destructive" />
            新增離職
          </DialogTitle>
          <DialogDescription>建立員工的離職流程</DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2 py-2">
          {["離職資訊", "交接安排", "任務清單"].map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-medium shrink-0 ${
                step > i + 1 ? "bg-success text-success-foreground" : step === i + 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>
                {step > i + 1 ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
              </div>
              <span className={`text-xs ${step === i + 1 ? "font-medium text-foreground" : "text-muted-foreground"}`}>{s}</span>
              {i < 2 && <div className="flex-1 h-px bg-border" />}
            </div>
          ))}
        </div>

        <Separator />

        {step === 1 && (
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm">員工姓名 <span className="text-destructive">*</span></Label>
                <Input placeholder="請輸入或搜尋員工" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">所屬部門</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="選擇員工後自動帶入" /></SelectTrigger>
                  <SelectContent>
                    {["技術部", "銷售部", "人事部", "市場部", "財務部", "客服部", "運營部"].map((o) => (
                      <SelectItem key={o} value={o}>{o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">離職類型 <span className="text-destructive">*</span></Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="請選擇" /></SelectTrigger>
                  <SelectContent>
                    {["主動離職", "協商解除", "合同到期", "辭退", "退休"].map((o) => (
                      <SelectItem key={o} value={o}>{o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">離職原因 <span className="text-destructive">*</span></Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="請選擇" /></SelectTrigger>
                  <SelectContent>
                    {["個人因素", "職涯發展", "薪資待遇", "工作環境", "家庭因素", "健康因素", "轉職", "其他"].map((o) => (
                      <SelectItem key={o} value={o}>{o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">提出離職日期 <span className="text-destructive">*</span></Label>
                <Input type="date" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">預定最後工作日 <span className="text-destructive">*</span></Label>
                <Input type="date" />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm">負責 HR</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="請選擇" /></SelectTrigger>
                  <SelectContent>
                    {["王美玲", "李文華"].map((o) => (
                      <SelectItem key={o} value={o}>{o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">交接人</Label>
                <Input placeholder="請輸入交接人姓名" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">直屬主管</Label>
                <Input placeholder="請輸入主管姓名" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">是否需要競業禁止</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="請選擇" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">是</SelectItem>
                    <SelectItem value="no">否</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">備註</Label>
              <Textarea placeholder="其他需要注意的事項..." rows={3} />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">系統將自動建立以下離職任務清單，您可在建立後調整：</p>
            <div className="space-y-3">
              {[
                { cat: "審批流程", items: ["離職申請審批", "部門主管確認", "HR 審核"] },
                { cat: "工作交接", items: ["工作內容交接文件", "客戶/專案交接", "未完成工作確認"] },
                { cat: "資產歸還", items: ["電腦設備歸還", "門禁卡歸還", "辦公用品歸還", "公司資料清理"] },
                { cat: "帳號權限", items: ["系統帳號停用", "郵箱設定轉發", "VPN/遠端權限關閉"] },
                { cat: "薪資結算", items: ["剩餘年假結算", "最後薪資計算", "社保公積金停繳", "離職證明開立"] },
                { cat: "離職面談", items: ["離職面談安排", "離職問卷填寫"] },
              ].map((g) => (
                <div key={g.cat} className="rounded-lg border p-3">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">{g.cat}</p>
                  <div className="space-y-1.5">
                    {g.items.map((item) => (
                      <div key={item} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          {step > 1 && <Button variant="outline" onClick={() => setStep(step - 1)}>上一步</Button>}
          {step < 3 ? (
            <Button onClick={() => setStep(step + 1)}>下一步</Button>
          ) : (
            <Button onClick={() => { toast.success("離職流程已建立"); reset(); onOpenChange(false); }}>確認建立</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ===== 統計卡片 ===== */
function StatCard({ label, value, icon: Icon, accent }: { label: string; value: number; icon: any; accent: string }) {
  return (
    <div className="rounded-xl border bg-card p-4 flex items-center gap-4">
      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${accent}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

/* ===== 主頁面 ===== */
export default function Offboarding() {
  const [addOpen, setAddOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const navigate = useNavigate();

  const filtered = offboardingData.filter((r) => {
    if (filterStatus !== "all" && r.status !== filterStatus) return false;
    if (search && !Object.values(r).some((v) => String(v).toLowerCase().includes(search.toLowerCase()))) return false;
    return true;
  });

  const stats = {
    total: offboardingData.length,
    pending: offboardingData.filter((r) => r.status === "待審批").length,
    inProgress: offboardingData.filter((r) => r.status === "交接中" || r.status === "待結算").length,
    completed: offboardingData.filter((r) => r.status === "已完成").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <UserMinus className="h-6 w-6 text-destructive" />
            離職管理
          </h1>
          <p className="page-description">管理員工離職流程、工作交接與薪資結算</p>
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          新增離職
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="離職總數" value={stats.total} icon={UserMinus} accent="bg-destructive/10 text-destructive" />
        <StatCard label="待審批" value={stats.pending} icon={Clock} accent="bg-primary/10 text-primary" />
        <StatCard label="處理中" value={stats.inProgress} icon={AlertCircle} accent="bg-warning/10 text-warning" />
        <StatCard label="已完成" value={stats.completed} icon={CheckCircle2} accent="bg-success/10 text-success" />
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="搜尋姓名、部門、原因..." className="pl-9 h-9" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-28 h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部狀態</SelectItem>
                  <SelectItem value="待審批">待審批</SelectItem>
                  <SelectItem value="交接中">交接中</SelectItem>
                  <SelectItem value="待結算">待結算</SelectItem>
                  <SelectItem value="已完成">已完成</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1" />匯出</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>員工</TableHead>
                <TableHead>部門 / 職位</TableHead>
                <TableHead>離職原因</TableHead>
                <TableHead>最後工作日</TableHead>
                <TableHead>負責 HR</TableHead>
                <TableHead>進度</TableHead>
                <TableHead>狀態</TableHead>
                <TableHead className="w-20">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => {
                const sc = statusConfig[r.status];
                return (
                  <TableRow key={r.id} className="cursor-pointer" onClick={() => navigate(`/employees/offboarding/${r.id}`)}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-destructive/10 text-destructive text-xs font-medium">{r.name.slice(-2)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{r.name}</p>
                          <p className="text-xs text-muted-foreground">{r.id}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{r.department}</p>
                      <p className="text-xs text-muted-foreground">{r.position}</p>
                    </TableCell>
                    <TableCell className="text-sm">{r.reason}</TableCell>
                    <TableCell className="text-sm">{r.lastDay}</TableCell>
                    <TableCell className="text-sm">{r.hrOwner}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 w-28">
                        <Progress value={r.progress} className="h-1.5 flex-1" />
                        <span className="text-xs text-muted-foreground w-8">{r.progress}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={sc?.color || ""}>
                        <span className={`inline-block h-1.5 w-1.5 rounded-full mr-1.5 ${sc?.dot || ""}`} />
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); navigate(`/employees/offboarding/${r.id}`); }}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AddOffboardingDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}
