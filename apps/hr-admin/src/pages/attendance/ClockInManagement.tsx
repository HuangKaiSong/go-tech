import { useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { hasPerm } from "@/lib/auth";
import { CLOCKIN_PERM } from "@/lib/perms";
import {
  MapPin, Clock, Shield, Plus, Pencil, Trash2,
  Building2, Wifi, Settings2, Search, Loader2, Navigation
} from "lucide-react";
import {
  getScheduleList, saveSchedule, deleteSchedule,
  getRuleList, saveRule, deleteRule,
  getLocationList, saveLocation, deleteLocation,
  SCHEDULE_TYPE_TEXT,
  type AttendanceSchedule, type AttendanceRule, type AttendanceLocation,
} from "@/api/attendance";

// ── 表单类型（编辑态，enabled 布尔在提交时转 status 1/2） ──
interface LocForm {
  id?: number;
  name: string;
  address: string;
  lat: string;
  lng: string;
  radius: number;
  wifiSsid: string;
  ruleId: string;
  enabled: boolean;
}

interface SchedForm {
  id?: number;
  name: string;
  type: number;
  workStart: string;
  workEnd: string;
  lateGrace: number;
  earlyLeaveGrace: number;
  breakStart: string;
  breakEnd: string;
  workDays: number[];
  enabled: boolean;
}

interface RuleForm {
  id?: number;
  name: string;
  requirePhoto: boolean;
  requireLocation: boolean;
  allowRemote: boolean;
  missedClockAllowAppeal: boolean;
  appealDeadlineDays: number;
  enabled: boolean;
}

interface GeoResult {
  display_name: string;
  lat: string;
  lon: string;
}

function LocationDialog({
  open, onOpenChange, editing, form, setForm, onSave, saving, rules,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: boolean;
  form: LocForm;
  setForm: React.Dispatch<React.SetStateAction<LocForm>>;
  onSave: () => void;
  saving: boolean;
  rules: AttendanceRule[];
}) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<GeoResult[]>([]);
  const [showResults, setShowResults] = useState(false);

  const searchAddress = useCallback(async () => {
    if (!searchQuery.trim()) { toast.error(t("請輸入搜索地址")); return; }
    setSearching(true);
    setShowResults(false);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&accept-language=zh-TW`
      );
      const data: GeoResult[] = await res.json();
      if (data.length === 0) {
        toast.info(t("未找到匹配的地址，請嘗試其他關鍵字"));
      }
      setResults(data);
      setShowResults(true);
    } catch {
      toast.error(t("地址搜索失敗，請稍後再試"));
    } finally {
      setSearching(false);
    }
  }, [searchQuery]);

  const selectResult = (r: GeoResult) => {
    setForm(p => ({
      ...p,
      address: r.display_name,
      lat: parseFloat(r.lat).toFixed(6),
      lng: parseFloat(r.lon).toFixed(6),
    }));
    setShowResults(false);
    setSearchQuery("");
    toast.success(t("已自動填入地址與座標"));
  };

  const mapUrl = form.lat && form.lng
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${parseFloat(form.lng) - 0.005},${parseFloat(form.lat) - 0.003},${parseFloat(form.lng) + 0.005},${parseFloat(form.lat) + 0.003}&layer=mapnik&marker=${form.lat},${form.lng}`
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? t("編輯打卡地點") : t("新增打卡地點")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Address Search */}
          <div>
            <Label className="mb-1.5 block">{t("搜索地址")}</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={t("輸入地址或地點名稱搜索...")}
                  onKeyDown={e => e.key === "Enter" && searchAddress()}
                />
              </div>
              <Button onClick={searchAddress} disabled={searching} size="default">
                {searching ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Search className="h-4 w-4 mr-1" />}
                {t("搜索")}
              </Button>
            </div>
            {showResults && results.length > 0 && (
              <div className="mt-2 border rounded-md bg-popover shadow-md max-h-[200px] overflow-y-auto">
                {results.map((r, i) => (
                  <button
                    key={i}
                    type="button"
                    className="w-full text-left px-3 py-2.5 text-sm hover:bg-accent transition-colors flex items-start gap-2 border-b last:border-b-0"
                    onClick={() => selectResult(r)}
                  >
                    <Navigation className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                    <span className="text-foreground">{r.display_name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>{t("地點名稱 *")}</Label>
              <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder={t("例：總部大樓")} />
            </div>
            <div className="col-span-2">
              <Label>{t("地址 *")}</Label>
              <Input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} placeholder={t("詳細地址")} />
            </div>
            <div>
              <Label>{t("緯度")}</Label>
              <Input value={form.lat} onChange={e => setForm(p => ({ ...p, lat: e.target.value }))} placeholder="25.0330" />
            </div>
            <div>
              <Label>{t("經度")}</Label>
              <Input value={form.lng} onChange={e => setForm(p => ({ ...p, lng: e.target.value }))} placeholder="121.5654" />
            </div>
            <div>
              <Label>{t("有效範圍（公尺）")}</Label>
              <Input type="number" value={form.radius} onChange={e => setForm(p => ({ ...p, radius: Number(e.target.value) }))} />
            </div>
            <div>
              <Label>{t("Wi-Fi SSID（選填）")}</Label>
              <Input value={form.wifiSsid} onChange={e => setForm(p => ({ ...p, wifiSsid: e.target.value }))} placeholder={t("辦公室 Wi-Fi 名稱")} />
            </div>
          </div>

          {/* Map Preview */}
          {mapUrl && (
            <div>
              <Label className="mb-1.5 block flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-primary" />{t("地圖預覽")}
              </Label>
              <div className="rounded-lg overflow-hidden border bg-muted">
                <iframe
                  src={mapUrl}
                  width="100%"
                  height="220"
                  className="border-0"
                  title={t("地圖預覽")}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {t("座標：{{lat}}, {{lng}}（有效範圍 {{radius}} 公尺）", { lat: form.lat, lng: form.lng, radius: form.radius })}
              </p>
            </div>
          )}

          {/* Rule Association */}
          <div>
            <Label className="mb-1.5 block">{t("關聯打卡規則")}</Label>
            <Select value={form.ruleId} onValueChange={v => setForm(p => ({ ...p, ruleId: v }))}>
              <SelectTrigger>
                <SelectValue placeholder={t("選擇打卡規則（選填）")} />
              </SelectTrigger>
              <SelectContent>
                {rules.map(r => (
                  <SelectItem key={r.id} value={String(r.id)}>
                    <span className="flex items-center gap-2">
                      {r.name}
                      <Badge variant={r.enabled ? "default" : "secondary"} className="text-xs">{r.enabled ? t("啟用") : t("停用")}</Badge>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Switch checked={form.enabled} onCheckedChange={v => setForm(p => ({ ...p, enabled: v }))} />
            <Label>{t("啟用此地點")}</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("取消")}</Button>
          <Button onClick={onSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}{t("儲存")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const weekDays = ["日", "一", "二", "三", "四", "五", "六"];
/** 后端工作日 1=周一..7=周日；前端展示按 索引0=周日..6=周六 排列 */
const WEEK_ORDER = [7, 1, 2, 3, 4, 5, 6];

const emptyLoc: LocForm = { name: "", address: "", lat: "", lng: "", radius: 200, wifiSsid: "", ruleId: "", enabled: true };
const emptySched: SchedForm = { name: "", type: 1, workStart: "09:00", workEnd: "18:00", lateGrace: 5, earlyLeaveGrace: 5, breakStart: "12:00", breakEnd: "13:00", workDays: [1, 2, 3, 4, 5], enabled: true };
const emptyRule: RuleForm = { name: "", requirePhoto: false, requireLocation: true, allowRemote: false, missedClockAllowAppeal: true, appealDeadlineDays: 3, enabled: true };

export default function ClockInManagement() {
  const { t } = useTranslation();
  const [locations, setLocations] = useState<AttendanceLocation[]>([]);
  const [schedules, setSchedules] = useState<AttendanceSchedule[]>([]);
  const [rules, setRules] = useState<AttendanceRule[]>([]);

  const loadLocations = useCallback(() => {
    getLocationList().then(res => setLocations(res.data ?? [])).catch(() => setLocations([]));
  }, []);
  const loadSchedules = useCallback(() => {
    getScheduleList().then(res => setSchedules(res.data ?? [])).catch(() => setSchedules([]));
  }, []);
  const loadRules = useCallback(() => {
    getRuleList().then(res => setRules(res.data ?? [])).catch(() => setRules([]));
  }, []);

  useEffect(() => {
    loadLocations();
    loadSchedules();
    loadRules();
  }, [loadLocations, loadSchedules, loadRules]);

  // Dialog states
  const [locDialog, setLocDialog] = useState(false);
  const [schedDialog, setSchedDialog] = useState(false);
  const [ruleDialog, setRuleDialog] = useState(false);
  const [editingLoc, setEditingLoc] = useState(false);
  const [editingSched, setEditingSched] = useState(false);
  const [editingRule, setEditingRule] = useState(false);
  const [saving, setSaving] = useState(false);

  // ── Location ──
  const [locForm, setLocForm] = useState<LocForm>(emptyLoc);
  const openLocDialog = (loc?: AttendanceLocation) => {
    if (loc) {
      setEditingLoc(true);
      setLocForm({
        id: loc.id, name: loc.name, address: loc.address ?? "",
        lat: loc.lat != null ? String(loc.lat) : "", lng: loc.lng != null ? String(loc.lng) : "",
        radius: loc.radius ?? 200, wifiSsid: loc.wifiSsid ?? "",
        ruleId: loc.ruleId != null ? String(loc.ruleId) : "", enabled: loc.enabled,
      });
    } else { setEditingLoc(false); setLocForm({ ...emptyLoc }); }
    setLocDialog(true);
  };
  const saveLoc = async () => {
    if (!locForm.name || !locForm.address) { toast.error(t("請填寫名稱與地址")); return; }
    setSaving(true);
    try {
      await saveLocation({
        id: locForm.id,
        name: locForm.name.trim(),
        address: locForm.address.trim(),
        lat: locForm.lat.trim() ? Number(locForm.lat) : undefined,
        lng: locForm.lng.trim() ? Number(locForm.lng) : undefined,
        radius: locForm.radius,
        wifiSsid: locForm.wifiSsid.trim() || undefined,
        ruleId: locForm.ruleId ? Number(locForm.ruleId) : undefined,
        status: locForm.enabled ? 1 : 2,
      });
      toast.success(editingLoc ? t("已更新打卡地點") : t("已新增打卡地點"));
      setLocDialog(false);
      loadLocations();
    } catch (err: any) {
      toast.error(err.message || t("儲存失敗"));
    } finally { setSaving(false); }
  };
  const removeLoc = async (id: number) => {
    try { await deleteLocation(id); toast.success(t("已刪除打卡地點")); loadLocations(); }
    catch (err: any) { toast.error(err.message || t("刪除失敗")); }
  };

  // ── Schedule ──
  const [schedForm, setSchedForm] = useState<SchedForm>(emptySched);
  const openSchedDialog = (s?: AttendanceSchedule) => {
    if (s) {
      setEditingSched(true);
      setSchedForm({
        id: s.id, name: s.name, type: s.type,
        workStart: s.workStart ?? "09:00", workEnd: s.workEnd ?? "18:00",
        lateGrace: s.lateGrace ?? 0, earlyLeaveGrace: s.earlyLeaveGrace ?? 0,
        breakStart: s.breakStart ?? "", breakEnd: s.breakEnd ?? "",
        workDays: s.workDays ?? [], enabled: s.enabled,
      });
    } else { setEditingSched(false); setSchedForm({ ...emptySched }); }
    setSchedDialog(true);
  };
  const saveSched = async () => {
    if (!schedForm.name) { toast.error(t("請填寫班次名稱")); return; }
    setSaving(true);
    try {
      await saveSchedule({
        id: schedForm.id,
        name: schedForm.name.trim(),
        type: schedForm.type,
        workStart: schedForm.workStart,
        workEnd: schedForm.workEnd,
        breakStart: schedForm.breakStart || undefined,
        breakEnd: schedForm.breakEnd || undefined,
        lateGrace: schedForm.lateGrace,
        earlyLeaveGrace: schedForm.earlyLeaveGrace,
        workDays: schedForm.workDays,
        status: schedForm.enabled ? 1 : 2,
      });
      toast.success(editingSched ? t("已更新班次") : t("已新增班次"));
      setSchedDialog(false);
      loadSchedules();
    } catch (err: any) {
      toast.error(err.message || t("儲存失敗"));
    } finally { setSaving(false); }
  };
  const removeSched = async (id: number) => {
    try { await deleteSchedule(id); toast.success(t("已刪除班次")); loadSchedules(); }
    catch (err: any) { toast.error(err.message || t("刪除失敗")); }
  };

  // ── Rule ──
  const [ruleForm, setRuleForm] = useState<RuleForm>(emptyRule);
  const openRuleDialog = (r?: AttendanceRule) => {
    if (r) {
      setEditingRule(true);
      setRuleForm({
        id: r.id, name: r.name,
        requirePhoto: r.requirePhoto, requireLocation: r.requireLocation,
        allowRemote: r.allowRemote,
        missedClockAllowAppeal: r.missedClockAllowAppeal, appealDeadlineDays: r.appealDeadlineDays,
        enabled: r.enabled,
      });
    } else { setEditingRule(false); setRuleForm({ ...emptyRule }); }
    setRuleDialog(true);
  };
  const saveRuleFn = async () => {
    if (!ruleForm.name) { toast.error(t("請填寫規則名稱")); return; }
    setSaving(true);
    try {
      await saveRule({
        id: ruleForm.id,
        name: ruleForm.name.trim(),
        requirePhoto: ruleForm.requirePhoto,
        requireLocation: ruleForm.requireLocation,
        allowRemote: ruleForm.allowRemote,
        missedClockAllowAppeal: ruleForm.missedClockAllowAppeal,
        appealDeadlineDays: ruleForm.appealDeadlineDays,
        status: ruleForm.enabled ? 1 : 2,
      });
      toast.success(editingRule ? t("已更新規則") : t("已新增規則"));
      setRuleDialog(false);
      loadRules();
    } catch (err: any) {
      toast.error(err.message || t("儲存失敗"));
    } finally { setSaving(false); }
  };
  const removeRule = async (id: number) => {
    try { await deleteRule(id); toast.success(t("已刪除規則")); loadRules(); }
    catch (err: any) { toast.error(err.message || t("刪除失敗")); }
  };

  const toggleWorkDay = (day: number) => {
    setSchedForm(prev => ({
      ...prev,
      workDays: prev.workDays.includes(day)
        ? prev.workDays.filter(d => d !== day)
        : [...prev.workDays, day].sort((a, b) => a - b)
    }));
  };
  const stats = [
    { label: "打卡地點", value: locations.filter(l => l.enabled).length, total: locations.length, icon: MapPin, color: "text-primary" },
    { label: "班次設定", value: schedules.filter(s => s.enabled).length, total: schedules.length, icon: Clock, color: "text-accent" },
    { label: "打卡規則", value: rules.filter(r => r.enabled).length, total: rules.length, icon: Shield, color: "text-[hsl(var(--success))]" },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("打卡管理")}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t("管理打卡地點、班次時間與打卡規則")}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map(s => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`p-3 rounded-lg bg-muted ${s.color}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t(s.label)}</p>
                <p className="text-2xl font-bold text-foreground">{s.value} <span className="text-sm font-normal text-muted-foreground">/ {s.total}</span></p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="locations">
        <TabsList>
          <TabsTrigger value="locations" className="gap-1.5"><MapPin className="h-4 w-4" />{t("打卡地點")}</TabsTrigger>
          <TabsTrigger value="schedules" className="gap-1.5"><Clock className="h-4 w-4" />{t("班次時間")}</TabsTrigger>
          <TabsTrigger value="rules" className="gap-1.5"><Shield className="h-4 w-4" />{t("打卡規則")}</TabsTrigger>
        </TabsList>

        {/* ── Locations Tab ── */}
        <TabsContent value="locations">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">{t("打卡地點列表")}</CardTitle>
              {hasPerm(CLOCKIN_PERM.ADD) && <Button size="sm" onClick={() => openLocDialog()}><Plus className="h-4 w-4 mr-1" />{t("新增地點")}</Button>}
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("地點名稱")}</TableHead>
                    <TableHead>{t("地址")}</TableHead>
                    <TableHead>{t("座標")}</TableHead>
                    <TableHead>{t("有效範圍")}</TableHead>
                    <TableHead>Wi-Fi SSID</TableHead>
                    <TableHead>{t("關聯規則")}</TableHead>
                    <TableHead>{t("狀態")}</TableHead>
                    <TableHead className="text-right">{t("操作")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {locations.map(loc => (
                    <TableRow key={loc.id}>
                      <TableCell className="font-medium">{loc.name}</TableCell>
                      <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">{loc.address}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{loc.lat != null && loc.lng != null ? `${loc.lat}, ${loc.lng}` : "—"}</TableCell>
                      <TableCell>{t("{{n}} 公尺", { n: loc.radius })}</TableCell>
                      <TableCell>{loc.wifiSsid ? <Badge variant="outline" className="gap-1"><Wifi className="h-3 w-3" />{loc.wifiSsid}</Badge> : <span className="text-muted-foreground">—</span>}</TableCell>
                      <TableCell>
                        {loc.ruleName ? (
                          <Badge variant="outline" className="gap-1">
                            <Shield className="h-3 w-3" />{loc.ruleName}
                          </Badge>
                        ) : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell><Badge variant={loc.enabled ? "default" : "secondary"}>{loc.enabled ? t("啟用") : t("停用")}</Badge></TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {hasPerm(CLOCKIN_PERM.EDIT) && <Button variant="ghost" size="icon" onClick={() => openLocDialog(loc)}><Pencil className="h-4 w-4" /></Button>}
                          {hasPerm(CLOCKIN_PERM.DELETE) && <Button variant="ghost" size="icon" onClick={() => removeLoc(loc.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {locations.length === 0 && (
                    <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">{t("暫無打卡地點")}</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Schedules Tab ── */}
        <TabsContent value="schedules">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">{t("班次時間列表")}</CardTitle>
              {hasPerm(CLOCKIN_PERM.ADD) && <Button size="sm" onClick={() => openSchedDialog()}><Plus className="h-4 w-4 mr-1" />{t("新增班次")}</Button>}
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("班次名稱")}</TableHead>
                    <TableHead>{t("類型")}</TableHead>
                    <TableHead>{t("上班時間")}</TableHead>
                    <TableHead>{t("下班時間")}</TableHead>
                    <TableHead>{t("午休時間")}</TableHead>
                    <TableHead>{t("遲到寬限")}</TableHead>
                    <TableHead>{t("工作日")}</TableHead>
                    <TableHead>{t("狀態")}</TableHead>
                    <TableHead className="text-right">{t("操作")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedules.map(s => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{SCHEDULE_TYPE_TEXT[s.type] ? t(SCHEDULE_TYPE_TEXT[s.type]) : "—"}</Badge>
                      </TableCell>
                      <TableCell>{s.workStart}</TableCell>
                      <TableCell>{s.workEnd}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{s.breakStart && s.breakEnd ? `${s.breakStart}–${s.breakEnd}` : "—"}</TableCell>
                      <TableCell>{t("{{n}} 分鐘", { n: s.lateGrace })}</TableCell>
                      <TableCell>
                        <div className="flex gap-0.5">
                          {WEEK_ORDER.map((d, i) => (
                            <span key={d} className={`text-xs w-5 h-5 flex items-center justify-center rounded ${(s.workDays ?? []).includes(d) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                              {weekDays[i]}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell><Badge variant={s.enabled ? "default" : "secondary"}>{s.enabled ? t("啟用") : t("停用")}</Badge></TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {hasPerm(CLOCKIN_PERM.EDIT) && <Button variant="ghost" size="icon" onClick={() => openSchedDialog(s)}><Pencil className="h-4 w-4" /></Button>}
                          {hasPerm(CLOCKIN_PERM.DELETE) && <Button variant="ghost" size="icon" onClick={() => removeSched(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {schedules.length === 0 && (
                    <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">{t("暫無班次")}</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Rules Tab ── */}
        <TabsContent value="rules">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">{t("打卡規則列表")}</CardTitle>
              {hasPerm(CLOCKIN_PERM.ADD) && <Button size="sm" onClick={() => openRuleDialog()}><Plus className="h-4 w-4 mr-1" />{t("新增規則")}</Button>}
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {rules.map(r => (
                  <Card key={r.id} className="border">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground">{r.name}</h3>
                          <Badge variant={r.enabled ? "default" : "secondary"}>{r.enabled ? t("啟用") : t("停用")}</Badge>
                        </div>
                        <div className="flex gap-1">
                          {hasPerm(CLOCKIN_PERM.EDIT) && <Button variant="ghost" size="icon" onClick={() => openRuleDialog(r)}><Pencil className="h-4 w-4" /></Button>}
                          {hasPerm(CLOCKIN_PERM.DELETE) && <Button variant="ghost" size="icon" onClick={() => removeRule(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                        <div>
                          <p className="text-muted-foreground mb-1">{t("拍照/定位要求")}</p>
                          <p className="text-foreground">{r.requirePhoto ? t("需拍照") : t("免拍照")} / {r.requireLocation ? t("需定位") : t("免定位")}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1">{t("遠端打卡")}</p>
                          <p className="text-foreground">{r.allowRemote ? t("允許") : t("不允許")}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1">{t("補卡")}</p>
                          <p className="text-foreground">
                            {r.missedClockAllowAppeal ? t("可補卡（{{n}}天內）", { n: r.appealDeadlineDays }) : t("不可補卡")}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {rules.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">{t("暫無打卡規則")}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Location Dialog ── */}
      <LocationDialog
        open={locDialog}
        onOpenChange={setLocDialog}
        editing={editingLoc}
        form={locForm}
        setForm={setLocForm}
        onSave={saveLoc}
        saving={saving}
        rules={rules}
      />

      {/* ── Schedule Dialog ── */}
      <Dialog open={schedDialog} onOpenChange={setSchedDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingSched ? t("編輯班次") : t("新增班次")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t("班次名稱 *")}</Label>
              <Input value={schedForm.name} onChange={e => setSchedForm(p => ({ ...p, name: e.target.value }))} placeholder={t("例：標準班")} />
            </div>
            <div>
              <Label>{t("班次類型")}</Label>
              <Select value={String(schedForm.type)} onValueChange={(v) => setSchedForm(p => ({ ...p, type: Number(v) }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">{t("固定班")}</SelectItem>
                  <SelectItem value="2">{t("彈性班")}</SelectItem>
                  <SelectItem value="3">{t("輪班制")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>{t("上班時間")}</Label><Input type="time" value={schedForm.workStart} onChange={e => setSchedForm(p => ({ ...p, workStart: e.target.value }))} /></div>
              <div><Label>{t("下班時間")}</Label><Input type="time" value={schedForm.workEnd} onChange={e => setSchedForm(p => ({ ...p, workEnd: e.target.value }))} /></div>
              <div><Label>{t("午休開始")}</Label><Input type="time" value={schedForm.breakStart} onChange={e => setSchedForm(p => ({ ...p, breakStart: e.target.value }))} /></div>
              <div><Label>{t("午休結束")}</Label><Input type="time" value={schedForm.breakEnd} onChange={e => setSchedForm(p => ({ ...p, breakEnd: e.target.value }))} /></div>
              <div><Label>{t("遲到寬限（分鐘）")}</Label><Input type="number" value={schedForm.lateGrace} onChange={e => setSchedForm(p => ({ ...p, lateGrace: Number(e.target.value) }))} /></div>
              <div><Label>{t("早退寬限（分鐘）")}</Label><Input type="number" value={schedForm.earlyLeaveGrace} onChange={e => setSchedForm(p => ({ ...p, earlyLeaveGrace: Number(e.target.value) }))} /></div>
            </div>
            <div>
              <Label className="mb-2 block">{t("工作日")}</Label>
              <div className="flex gap-2">
                {WEEK_ORDER.map((d, i) => (
                  <button key={d} type="button" onClick={() => toggleWorkDay(d)}
                    className={`w-9 h-9 rounded-md text-sm font-medium border transition-colors ${schedForm.workDays.includes(d) ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-input hover:bg-muted"}`}>
                    {weekDays[i]}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={schedForm.enabled} onCheckedChange={v => setSchedForm(p => ({ ...p, enabled: v }))} />
              <Label>{t("啟用此班次")}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSchedDialog(false)}>{t("取消")}</Button>
            <Button onClick={saveSched} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}{t("儲存")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Rule Dialog ── */}
      <Dialog open={ruleDialog} onOpenChange={setRuleDialog}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRule ? t("編輯打卡規則") : t("新增打卡規則")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            <div>
              <Label>{t("規則名稱 *")}</Label>
              <Input value={ruleForm.name} onChange={e => setRuleForm(p => ({ ...p, name: e.target.value }))} placeholder={t("例：預設打卡規則")} />
            </div>

            <Separator />
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5"><Settings2 className="h-4 w-4" />{t("驗證要求")}</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>{t("打卡時需拍照")}</Label>
                <Switch checked={ruleForm.requirePhoto} onCheckedChange={v => setRuleForm(p => ({ ...p, requirePhoto: v }))} />
              </div>
              <div className="flex items-center justify-between">
                <Label>{t("打卡時需定位")}</Label>
                <Switch checked={ruleForm.requireLocation} onCheckedChange={v => setRuleForm(p => ({ ...p, requireLocation: v }))} />
              </div>
            </div>

            <Separator />
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5"><Building2 className="h-4 w-4" />{t("遠端打卡")}</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>{t("允許遠端打卡")}</Label>
                <Switch checked={ruleForm.allowRemote} onCheckedChange={v => setRuleForm(p => ({ ...p, allowRemote: v }))} />
              </div>
            </div>

            <Separator />
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5"><Clock className="h-4 w-4" />{t("補卡")}</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>{t("允許補卡申請")}</Label>
                <Switch checked={ruleForm.missedClockAllowAppeal} onCheckedChange={v => setRuleForm(p => ({ ...p, missedClockAllowAppeal: v }))} />
              </div>
              {ruleForm.missedClockAllowAppeal && (
                <div>
                  <Label>{t("補卡申請期限（天）")}</Label>
                  <Input type="number" value={ruleForm.appealDeadlineDays} onChange={e => setRuleForm(p => ({ ...p, appealDeadlineDays: Number(e.target.value) }))} />
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Switch checked={ruleForm.enabled} onCheckedChange={v => setRuleForm(p => ({ ...p, enabled: v }))} />
              <Label>{t("啟用此規則")}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRuleDialog(false)}>{t("取消")}</Button>
            <Button onClick={saveRuleFn} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}{t("儲存")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
