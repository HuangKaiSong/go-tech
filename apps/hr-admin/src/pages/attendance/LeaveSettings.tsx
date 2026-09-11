import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { hasPerm } from "@/lib/auth";
import { LEAVE_PERM } from "@/lib/perms";
import {
  CalendarDays, Plus, Pencil, Trash2, Palmtree, HeartPulse, Baby, Cake,
  Scale, Info, Clock, Loader2, Save,
} from "lucide-react";
import {
  getLeaveTypes, saveLeaveType, toggleLeaveType, deleteLeaveType,
  getAnnualPolicy, saveAnnualPolicy,
  type LeaveType, type AnnualPolicy,
} from "@/api/leaveSettings";
import { LeaveBalanceTab } from "@/components/attendance/LeaveBalanceTab";

const unitLabel = (u: LeaveType["unit"]) => ({ day: "天", half: "半天", hour: "小時" }[u]);
const iconMap: Record<string, any> = { palmtree: Palmtree, heart: HeartPulse, baby: Baby, cake: Cake, clock: Clock, info: Info, scale: Scale };
const iconOptions = [
  { value: "palmtree", label: "🌴 年假" },
  { value: "heart", label: "❤️ 病假" },
  { value: "info", label: "ℹ️ 事假" },
  { value: "cake", label: "🎂 婚/慶假" },
  { value: "baby", label: "👶 產/陪產假" },
  { value: "clock", label: "⏰ 補休" },
  { value: "scale", label: "⚖️ 其他" },
];

const emptyType: LeaveType = {
  code: "", name: "", icon: "info", unit: "day", paid: true,
  deductFromAnnual: false, requireProof: false, proofThresholdDays: 0,
  maxPerYear: null, maxPerRequest: null, advanceApplyDays: 1,
  color: "#3b82f6", enabled: true, description: "",
};

export default function LeaveSettings() {
  const { t: tr } = useTranslation();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<LeaveType | null>(null);
  const [policy, setPolicy] = useState<AnnualPolicy | null>(null);

  // ── 假別類型 ──
  const { data: types = [], isLoading: typesLoading } = useQuery({
    queryKey: ["leaveTypes"],
    queryFn: async () => (await getLeaveTypes()).data ?? [],
  });

  // ── 年假政策 ──
  const { data: policyData } = useQuery({
    queryKey: ["annualPolicy"],
    queryFn: async () => (await getAnnualPolicy()).data,
  });
  useEffect(() => { if (policyData) setPolicy(policyData); }, [policyData]);

  const invalidateTypes = () => qc.invalidateQueries({ queryKey: ["leaveTypes"] });

  const saveTypeMut = useMutation({
    mutationFn: saveLeaveType,
    onSuccess: () => { toast.success(tr("已儲存假別設定")); setDialogOpen(false); invalidateTypes(); },
  });
  const toggleMut = useMutation({
    mutationFn: ({ id, enabled }: { id: number; enabled: boolean }) => toggleLeaveType(id, enabled),
    onSuccess: invalidateTypes,
  });
  const deleteMut = useMutation({
    mutationFn: deleteLeaveType,
    onSuccess: () => { toast.success(tr("已刪除假別")); invalidateTypes(); },
  });
  const savePolicyMut = useMutation({
    mutationFn: saveAnnualPolicy,
    onSuccess: () => { toast.success(tr("已儲存年假規則")); qc.invalidateQueries({ queryKey: ["annualPolicy"] }); },
  });

  const openAdd = () => { setEditing({ ...emptyType }); setDialogOpen(true); };
  const openEdit = (t: LeaveType) => { setEditing({ ...t }); setDialogOpen(true); };

  const saveType = () => {
    if (!editing) return;
    if (!editing.name.trim() || !editing.code.trim()) {
      toast.error(tr("請填寫假別名稱與代碼"));
      return;
    }
    saveTypeMut.mutate(editing);
  };

  // ── Annual Tier handlers（改本地 policy，儲存時整批提交）──
  const addTier = () => {
    if (!policy) return;
    const last = policy.tiers[policy.tiers.length - 1];
    const start = last ? (last.maxYears ?? last.minYears + 1) : 0;
    setPolicy({ ...policy, tiers: [...policy.tiers, { minYears: start, maxYears: start + 1, days: 7 }] });
  };
  const updateTier = (idx: number, patch: Partial<AnnualPolicy["tiers"][number]>) => {
    if (!policy) return;
    setPolicy({ ...policy, tiers: policy.tiers.map((t, i) => (i === idx ? { ...t, ...patch } : t)) });
  };
  const removeTier = (idx: number) => {
    if (!policy) return;
    setPolicy({ ...policy, tiers: policy.tiers.filter((_, i) => i !== idx) });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <CalendarDays className="h-6 w-6 text-primary" />
            {tr("假期設定")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {tr("管理假別類型、年假規則與請假政策")}
          </p>
        </div>
      </div>

      <Tabs defaultValue="types" className="w-full">
        <TabsList>
          <TabsTrigger value="types">{tr("假別類型")}</TabsTrigger>
          <TabsTrigger value="annual">{tr("年假規則")}</TabsTrigger>
          <TabsTrigger value="balance">{tr("年假額度")}</TabsTrigger>
        </TabsList>

        {/* ── Tab 1: Leave Types ── */}
        <TabsContent value="types" className="space-y-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-base">{tr("假別列表")}</CardTitle>
                <CardDescription>{tr("設定各類假期的計算單位、上限與申請規則")}</CardDescription>
              </div>
              {hasPerm(LEAVE_PERM.ADD) && <Button onClick={openAdd}><Plus className="h-4 w-4 mr-1" /> {tr("新增假別")}</Button>}
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{tr("假別")}</TableHead>
                    <TableHead>{tr("代碼")}</TableHead>
                    <TableHead>{tr("單位")}</TableHead>
                    <TableHead>{tr("帶薪")}</TableHead>
                    <TableHead>{tr("年度上限")}</TableHead>
                    <TableHead>{tr("單次上限")}</TableHead>
                    <TableHead>{tr("需證明")}</TableHead>
                    <TableHead>{tr("提前申請")}</TableHead>
                    <TableHead>{tr("啟用")}</TableHead>
                    <TableHead className="text-right">{tr("操作")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {typesLoading ? (
                    <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin inline mr-2" />{tr("載入中...")}
                    </TableCell></TableRow>
                  ) : types.length === 0 ? (
                    <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">{tr("暫無假別，點擊右上角新增")}</TableCell></TableRow>
                  ) : types.map((t) => {
                    const Icon = iconMap[t.icon] ?? Info;
                    return (
                      <TableRow key={t.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded" style={{ backgroundColor: `${t.color}20`, color: t.color }}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="font-medium">{t.name}</div>
                              <div className="text-xs text-muted-foreground line-clamp-1">{t.description}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{t.code}</TableCell>
                        <TableCell>{tr(unitLabel(t.unit))}</TableCell>
                        <TableCell>
                          {t.paid ? <Badge variant="default">{tr("帶薪")}</Badge> : <Badge variant="outline">{tr("無薪")}</Badge>}
                        </TableCell>
                        <TableCell>{t.maxPerYear == null ? tr("不限") : tr("{{n}} 天", { n: t.maxPerYear })}</TableCell>
                        <TableCell>{t.maxPerRequest == null ? tr("不限") : tr("{{n}} 天", { n: t.maxPerRequest })}</TableCell>
                        <TableCell>
                          {t.requireProof ? <Badge variant="secondary">{tr("≥ {{n}} 天", { n: t.proofThresholdDays })}</Badge> : "—"}
                        </TableCell>
                        <TableCell>{tr("{{n}} 天前", { n: t.advanceApplyDays })}</TableCell>
                        <TableCell>
                          <Switch checked={t.enabled} onCheckedChange={() => t.id && toggleMut.mutate({ id: t.id, enabled: !t.enabled })} />
                        </TableCell>
                        <TableCell className="text-right">
                          {hasPerm(LEAVE_PERM.EDIT) && (
                            <Button variant="ghost" size="icon" onClick={() => openEdit(t)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          {hasPerm(LEAVE_PERM.DELETE) && (
                            <Button variant="ghost" size="icon" onClick={() => t.id && deleteMut.mutate(t.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 2: Annual Leave Rules ── */}
        <TabsContent value="annual" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => policy && savePolicyMut.mutate(policy)} disabled={!policy || savePolicyMut.isPending}>
              {savePolicyMut.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
              {tr("儲存年假規則")}
            </Button>
          </div>

          {!policy ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin inline mr-2" />{tr("載入中...")}
            </CardContent></Card>
          ) : (
          <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Palmtree className="h-4 w-4 text-primary" /> {tr("年假天數階梯")}
              </CardTitle>
              <CardDescription>{tr("依員工年資自動計算應享年假天數")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{tr("年資（滿）")}</TableHead>
                    <TableHead>{tr("年資（未滿）")}</TableHead>
                    <TableHead>{tr("年假天數")}</TableHead>
                    <TableHead className="text-right">{tr("操作")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {policy.tiers.map((t, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Input type="number" className="w-24" value={t.minYears}
                            onChange={(e) => updateTier(idx, { minYears: Number(e.target.value) })} />
                          <span className="text-sm text-muted-foreground">{tr("年")}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Input type="number" className="w-24"
                            value={t.maxYears ?? ""}
                            placeholder={tr("不限")}
                            onChange={(e) => updateTier(idx, { maxYears: e.target.value === "" ? null : Number(e.target.value) })} />
                          <span className="text-sm text-muted-foreground">{tr("年")}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Input type="number" className="w-24" value={t.days}
                            onChange={(e) => updateTier(idx, { days: Number(e.target.value) })} />
                          <span className="text-sm text-muted-foreground">{tr("天 / 年")}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => removeTier(idx)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Button variant="outline" size="sm" onClick={addTier}>
                <Plus className="h-4 w-4 mr-1" /> {tr("新增階梯")}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{tr("年假計算方式")}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>{tr("發放週期")}</Label>
                <Select value={policy.accrualMode}
                  onValueChange={(v: any) => setPolicy({ ...policy, accrualMode: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="anniversary">{tr("依入職週年一次發放")}</SelectItem>
                    <SelectItem value="calendar">{tr("依自然年（1/1）一次發放")}</SelectItem>
                    <SelectItem value="monthly">{tr("按月累積")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-md">
                <div>
                  <Label>{tr("首年按比例發放")}</Label>
                  <p className="text-xs text-muted-foreground">{tr("未滿一年按實際在職天數比例計算")}</p>
                </div>
                <Switch checked={policy.proRateFirstYear}
                  onCheckedChange={(v) => setPolicy({ ...policy, proRateFirstYear: v })} />
              </div>
              <div className="flex items-center justify-between p-3 border rounded-md">
                <div>
                  <Label>{tr("試用期可休年假")}</Label>
                  <p className="text-xs text-muted-foreground">{tr("若關閉，需通過試用期後才能申請")}</p>
                </div>
                <Switch checked={policy.probationEligible}
                  onCheckedChange={(v) => setPolicy({ ...policy, probationEligible: v })} />
              </div>
              <div className="space-y-2">
                <Label>{tr("試用期月數")}</Label>
                <Input type="number" value={policy.probationMonths}
                  onChange={(e) => setPolicy({ ...policy, probationMonths: Number(e.target.value) })} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{tr("年假結轉與折現")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-md">
                <div>
                  <Label>{tr("允許結轉至次年")}</Label>
                  <p className="text-xs text-muted-foreground">{tr("未休完的年假可保留到下一年度")}</p>
                </div>
                <Switch checked={policy.carryOverEnabled}
                  onCheckedChange={(v) => setPolicy({ ...policy, carryOverEnabled: v })} />
              </div>
              {policy.carryOverEnabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-3 border-l-2 border-primary/30">
                  <div className="space-y-2">
                    <Label>{tr("最多可結轉天數")}</Label>
                    <Input type="number" value={policy.carryOverMaxDays}
                      onChange={(e) => setPolicy({ ...policy, carryOverMaxDays: Number(e.target.value) })} />
                  </div>
                  <div className="space-y-2">
                    <Label>{tr("結轉後有效月數")}</Label>
                    <Input type="number" value={policy.carryOverExpireMonths}
                      onChange={(e) => setPolicy({ ...policy, carryOverExpireMonths: Number(e.target.value) })} />
                  </div>
                </div>
              )}
              <Separator />
              <div className="flex items-center justify-between p-3 border rounded-md">
                <div>
                  <Label>{tr("允許未休年假折現")}</Label>
                  <p className="text-xs text-muted-foreground">{tr("離職或年底可將剩餘年假折算為薪資")}</p>
                </div>
                <Switch checked={policy.cashOutEnabled}
                  onCheckedChange={(v) => setPolicy({ ...policy, cashOutEnabled: v })} />
              </div>
              {policy.cashOutEnabled && (
                <div className="pl-3 border-l-2 border-primary/30">
                  <div className="space-y-2 max-w-xs">
                    <Label>{tr("最多可折現天數")}</Label>
                    <Input type="number" value={policy.cashOutMaxDays}
                      onChange={(e) => setPolicy({ ...policy, cashOutMaxDays: Number(e.target.value) })} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          </>
          )}
        </TabsContent>

        {/* ── Tab 3: Annual Leave Balance (账本) ── */}
        <TabsContent value="balance">
          <LeaveBalanceTab />
        </TabsContent>

      </Tabs>

      {/* ── Edit Type Dialog ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing?.id ? tr("編輯假別") : tr("新增假別")}</DialogTitle>
            <DialogDescription>{tr("設定該假別的計算方式與申請限制")}</DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="grid grid-cols-2 gap-4 py-2">
              <div className="space-y-2">
                <Label>{tr("假別名稱 *")}</Label>
                <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>{tr("代碼 *")}</Label>
                <Input value={editing.code} onChange={(e) => setEditing({ ...editing, code: e.target.value })} placeholder={tr("如 annual, sick")} />
              </div>
              <div className="space-y-2">
                <Label>{tr("圖示")}</Label>
                <Select value={editing.icon} onValueChange={(v) => setEditing({ ...editing, icon: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {iconOptions.map((o) => <SelectItem key={o.value} value={o.value}>{tr(o.label)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{tr("計算單位")}</Label>
                <Select value={editing.unit} onValueChange={(v: any) => setEditing({ ...editing, unit: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">{tr("按天")}</SelectItem>
                    <SelectItem value="half">{tr("按半天")}</SelectItem>
                    <SelectItem value="hour">{tr("按小時")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{tr("年度上限（天，留空為不限）")}</Label>
                <Input type="number" value={editing.maxPerYear ?? ""}
                  onChange={(e) => setEditing({ ...editing, maxPerYear: e.target.value === "" ? null : Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>{tr("單次上限（天，留空為不限）")}</Label>
                <Input type="number" value={editing.maxPerRequest ?? ""}
                  onChange={(e) => setEditing({ ...editing, maxPerRequest: e.target.value === "" ? null : Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>{tr("提前申請天數")}</Label>
                <Input type="number" value={editing.advanceApplyDays}
                  onChange={(e) => setEditing({ ...editing, advanceApplyDays: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>{tr("顏色")}</Label>
                <Input type="color" value={editing.color}
                  onChange={(e) => setEditing({ ...editing, color: e.target.value })} />
              </div>
              <div className="flex items-center justify-between p-3 border rounded-md">
                <Label>{tr("帶薪")}</Label>
                <Switch checked={editing.paid} onCheckedChange={(v) => setEditing({ ...editing, paid: v })} />
              </div>
              <div className="flex items-center justify-between p-3 border rounded-md">
                <Label>{tr("需上傳證明")}</Label>
                <Switch checked={editing.requireProof} onCheckedChange={(v) => setEditing({ ...editing, requireProof: v })} />
              </div>
              <div className="space-y-2">
                <Label>{tr("證明門檻（超過 X 天需附）")}</Label>
                <Input type="number" disabled={!editing.requireProof} value={editing.proofThresholdDays}
                  onChange={(e) => setEditing({ ...editing, proofThresholdDays: Number(e.target.value) })} />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>{tr("說明")}</Label>
                <Textarea rows={2} value={editing.description}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{tr("取消")}</Button>
            <Button onClick={saveType} disabled={saveTypeMut.isPending}>
              {saveTypeMut.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}{tr("儲存")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
