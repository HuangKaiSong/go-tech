import {
  Building2,
  Clock,
  Loader2,
  MapPin,
  Navigation,
  Pencil,
  Plus,
  Search,
  Settings2,
  Shield,
  Smartphone,
  Trash2,
  Wifi
} from 'lucide-react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import useWifiInfo from '@/hooks/use-wifi-info';

// ── Types ──
interface ClockLocation {
  address: string;
  enabled: boolean;
  id: string;
  lat: string;
  lng: string;
  name: string;
  radius: number;
  ruleId: string;
  wifiSSID: string;
}

interface ClockSchedule {
  breakEnd: string;
  breakStart: string;
  earlyLeaveGrace: number;
  enabled: boolean;
  id: string;
  lateGrace: number;
  name: string;
  type: 'fixed' | 'flexible' | 'shift';
  workDays: number[];
  workEnd: string;
  workStart: string;
}

interface ClockRule {
  allowMethods: string[];
  allowRemote: boolean;
  appealDeadlineDays: number;
  enabled: boolean;
  id: string;
  missedClockAllowAppeal: boolean;
  name: string;
  overtimeAuto: boolean;
  overtimeMinMinutes: number;
  remoteApproval: boolean;
  requireLocation: boolean;
  requirePhoto: boolean;
}

// ── Mock Data ──
const defaultLocations: ClockLocation[] = [
  {
    id: 'L1',
    name: '總部大樓',
    address: '台北市信義區信義路五段7號',
    lat: '25.0330',
    lng: '121.5654',
    radius: 200,
    wifiSSID: 'HQ-Office',
    ruleId: 'R1',
    enabled: true
  },
  {
    id: 'L2',
    name: '新竹研發中心',
    address: '新竹市東區光復路二段101號',
    lat: '24.8015',
    lng: '120.9718',
    radius: 150,
    wifiSSID: 'RD-Center',
    ruleId: 'R1',
    enabled: true
  },
  {
    id: 'L3',
    name: '台中分公司',
    address: '台中市西屯區台灣大道三段99號',
    lat: '24.1627',
    lng: '120.6466',
    radius: 300,
    wifiSSID: '',
    ruleId: 'R2',
    enabled: false
  }
];

const defaultSchedules: ClockSchedule[] = [
  {
    id: 'S1',
    name: '標準班',
    type: 'fixed',
    workStart: '09:00',
    workEnd: '18:00',
    lateGrace: 5,
    earlyLeaveGrace: 5,
    breakStart: '12:00',
    breakEnd: '13:00',
    workDays: [1, 2, 3, 4, 5],
    enabled: true
  },
  {
    id: 'S2',
    name: '彈性班',
    type: 'flexible',
    workStart: '08:00',
    workEnd: '17:00',
    lateGrace: 30,
    earlyLeaveGrace: 0,
    breakStart: '12:00',
    breakEnd: '13:00',
    workDays: [1, 2, 3, 4, 5],
    enabled: true
  },
  {
    id: 'S3',
    name: '輪班制 A',
    type: 'shift',
    workStart: '07:00',
    workEnd: '15:00',
    lateGrace: 5,
    earlyLeaveGrace: 5,
    breakStart: '11:00',
    breakEnd: '11:30',
    workDays: [1, 2, 3, 4, 5, 6],
    enabled: true
  }
];

const defaultRules: ClockRule[] = [
  {
    id: 'R1',
    name: '預設打卡規則',
    allowMethods: ['gps', 'wifi', 'face'],
    requirePhoto: false,
    requireLocation: true,
    allowRemote: true,
    remoteApproval: true,
    overtimeAuto: true,
    overtimeMinMinutes: 30,
    missedClockAllowAppeal: true,
    appealDeadlineDays: 3,
    enabled: true
  },
  {
    id: 'R2',
    name: '嚴格模式',
    allowMethods: ['gps', 'face'],
    requirePhoto: true,
    requireLocation: true,
    allowRemote: false,
    remoteApproval: false,
    overtimeAuto: false,
    overtimeMinMinutes: 60,
    missedClockAllowAppeal: true,
    appealDeadlineDays: 1,
    enabled: false
  }
];

interface GeoResult {
  display_name: string;
  lat: string;
  lon: string;
}

function LocationDialog({
  editing,
  form,
  onOpenChange,
  onSave,
  open,
  rules,
  setForm
}: {
  editing: ClockLocation | null;
  form: ClockLocation;
  onOpenChange: (v: boolean) => void;
  onSave: () => void;
  open: boolean;
  rules: ClockRule[];
  setForm: React.Dispatch<React.SetStateAction<ClockLocation>>;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<GeoResult[]>([]);
  const [showResults, setShowResults] = useState(false);

  const searchAddress = useCallback(async () => {
    if (!searchQuery.trim()) {
      toast.error('請輸入搜索地址');
      return;
    }
    setSearching(true);
    setShowResults(false);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&accept-language=zh-TW`
      );
      const data: GeoResult[] = await res.json();
      if (data.length === 0) {
        toast.info('未找到匹配的地址，請嘗試其他關鍵字');
      }
      setResults(data);
      setShowResults(true);
    } catch {
      toast.error('地址搜索失敗，請稍後再試');
    } finally {
      setSearching(false);
    }
  }, [searchQuery]);

  const selectResult = (r: GeoResult) => {
    setForm(p => ({
      ...p,
      address: r.display_name,
      lat: Number.parseFloat(r.lat).toFixed(6),
      lng: Number.parseFloat(r.lon).toFixed(6)
    }));
    setShowResults(false);
    setSearchQuery('');
    toast.success('已自動填入地址與座標');
  };

  const mapUrl =
    form.lat && form.lng
      ? `https://www.openstreetmap.org/export/embed.html?bbox=${Number.parseFloat(form.lng) - 0.005},${Number.parseFloat(form.lat) - 0.003},${Number.parseFloat(form.lng) + 0.005},${Number.parseFloat(form.lat) + 0.003}&layer=mapnik&marker=${form.lat},${form.lng}`
      : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? '編輯打卡地點' : '新增打卡地點'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Address Search */}
          <div>
            <Label className="mb-1.5 block">搜索地址</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="輸入地址或地點名稱搜索..."
                  onKeyDown={e => e.key === 'Enter' && searchAddress()}
                />
              </div>
              <Button onClick={searchAddress} disabled={searching} size="default">
                {searching ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Search className="h-4 w-4 mr-1" />}
                搜索
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
              <Label>地點名稱 *</Label>
              <Input
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="例：總部大樓"
              />
            </div>
            <div className="col-span-2">
              <Label>地址 *</Label>
              <Input
                value={form.address}
                onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                placeholder="詳細地址"
              />
            </div>
            <div>
              <Label>緯度</Label>
              <Input
                value={form.lat}
                onChange={e => setForm(p => ({ ...p, lat: e.target.value }))}
                placeholder="25.0330"
              />
            </div>
            <div>
              <Label>經度</Label>
              <Input
                value={form.lng}
                onChange={e => setForm(p => ({ ...p, lng: e.target.value }))}
                placeholder="121.5654"
              />
            </div>
            <div>
              <Label>有效範圍（公尺）</Label>
              <Input
                type="number"
                value={form.radius}
                onChange={e => setForm(p => ({ ...p, radius: Number(e.target.value) }))}
              />
            </div>
            <div>
              <Label>Wi-Fi SSID（選填）</Label>
              <Input
                value={form.wifiSSID}
                onChange={e => setForm(p => ({ ...p, wifiSSID: e.target.value }))}
                placeholder="辦公室 Wi-Fi 名稱"
              />
            </div>
          </div>

          {/* Map Preview */}
          {mapUrl && (
            <div>
              <Label className="mb-1.5 block flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-primary" />
                地圖預覽
              </Label>
              <div className="rounded-lg overflow-hidden border bg-muted">
                <iframe src={mapUrl} width="100%" height="220" className="border-0" title="地圖預覽" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                座標：{form.lat}, {form.lng}（有效範圍 {form.radius} 公尺）
              </p>
            </div>
          )}

          {/* Rule Association */}
          <div>
            <Label className="mb-1.5 block">關聯打卡規則</Label>
            <Select value={form.ruleId} onValueChange={v => setForm(p => ({ ...p, ruleId: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="選擇打卡規則（選填）" />
              </SelectTrigger>
              <SelectContent>
                {rules.map(r => (
                  <SelectItem key={r.id} value={r.id}>
                    <span className="flex items-center gap-2">
                      {r.name}
                      <Badge variant={r.enabled ? 'default' : 'secondary'} className="text-xs">
                        {r.enabled ? '啟用' : '停用'}
                      </Badge>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Switch checked={form.enabled} onCheckedChange={v => setForm(p => ({ ...p, enabled: v }))} />
            <Label>啟用此地點</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={onSave}>儲存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

export default function ClockInManagement() {
  const [locations, setLocations] = useState<ClockLocation[]>(defaultLocations);
  const [schedules, setSchedules] = useState<ClockSchedule[]>(defaultSchedules);
  const [rules, setRules] = useState<ClockRule[]>(defaultRules);

  // Dialog states
  const [locDialog, setLocDialog] = useState(false);
  const [schedDialog, setSchedDialog] = useState(false);
  const [ruleDialog, setRuleDialog] = useState(false);
  const [editingLoc, setEditingLoc] = useState<ClockLocation | null>(null);
  const [editingSched, setEditingSched] = useState<ClockSchedule | null>(null);
  const [editingRule, setEditingRule] = useState<ClockRule | null>(null);

  // ── Location form ──
  const emptyLoc: ClockLocation = {
    id: '',
    name: '',
    address: '',
    lat: '',
    lng: '',
    radius: 200,
    wifiSSID: '',
    ruleId: '',
    enabled: true
  };
  const [locForm, setLocForm] = useState<ClockLocation>(emptyLoc);
  const { getRouterLogin } = useWifiInfo();

  const openLocDialog = (loc?: ClockLocation) => {
    getRouterLogin();
    if (loc) {
      setEditingLoc(loc);
      setLocForm({ ...loc });
    } else {
      setEditingLoc(null);
      setLocForm({ ...emptyLoc, id: `L${Date.now()}` });
    }
    setLocDialog(true);
  };
  const saveLoc = () => {
    if (!locForm.name || !locForm.address) {
      toast.error('請填寫名稱與地址');
      return;
    }
    if (editingLoc) setLocations(prev => prev.map(l => (l.id === editingLoc.id ? locForm : l)));
    else setLocations(prev => [...prev, locForm]);
    setLocDialog(false);
    toast.success(editingLoc ? '已更新打卡地點' : '已新增打卡地點');
  };
  const deleteLoc = (id: string) => {
    setLocations(prev => prev.filter(l => l.id !== id));
    toast.success('已刪除打卡地點');
  };

  // ── Schedule form ──
  const emptySched: ClockSchedule = {
    id: '',
    name: '',
    type: 'fixed',
    workStart: '09:00',
    workEnd: '18:00',
    lateGrace: 5,
    earlyLeaveGrace: 5,
    breakStart: '12:00',
    breakEnd: '13:00',
    workDays: [1, 2, 3, 4, 5],
    enabled: true
  };
  const [schedForm, setSchedForm] = useState<ClockSchedule>(emptySched);

  const openSchedDialog = (s?: ClockSchedule) => {
    if (s) {
      setEditingSched(s);
      setSchedForm({ ...s });
    } else {
      setEditingSched(null);
      setSchedForm({ ...emptySched, id: `S${Date.now()}` });
    }
    setSchedDialog(true);
  };
  const saveSched = () => {
    if (!schedForm.name) {
      toast.error('請填寫班次名稱');
      return;
    }
    if (editingSched) setSchedules(prev => prev.map(s => (s.id === editingSched.id ? schedForm : s)));
    else setSchedules(prev => [...prev, schedForm]);
    setSchedDialog(false);
    toast.success(editingSched ? '已更新班次' : '已新增班次');
  };
  const deleteSched = (id: string) => {
    setSchedules(prev => prev.filter(s => s.id !== id));
    toast.success('已刪除班次');
  };

  // ── Rule form ──
  const emptyRule: ClockRule = {
    id: '',
    name: '',
    allowMethods: ['gps'],
    requirePhoto: false,
    requireLocation: true,
    allowRemote: false,
    remoteApproval: false,
    overtimeAuto: true,
    overtimeMinMinutes: 30,
    missedClockAllowAppeal: true,
    appealDeadlineDays: 3,
    enabled: true
  };
  const [ruleForm, setRuleForm] = useState<ClockRule>(emptyRule);

  const openRuleDialog = (r?: ClockRule) => {
    if (r) {
      setEditingRule(r);
      setRuleForm({ ...r });
    } else {
      setEditingRule(null);
      setRuleForm({ ...emptyRule, id: `R${Date.now()}` });
    }
    setRuleDialog(true);
  };
  const saveRule = () => {
    if (!ruleForm.name) {
      toast.error('請填寫規則名稱');
      return;
    }
    if (editingRule) setRules(prev => prev.map(r => (r.id === editingRule.id ? ruleForm : r)));
    else setRules(prev => [...prev, ruleForm]);
    setRuleDialog(false);
    toast.success(editingRule ? '已更新規則' : '已新增規則');
  };
  const deleteRule = (id: string) => {
    setRules(prev => prev.filter(r => r.id !== id));
    toast.success('已刪除規則');
  };

  const toggleMethod = (method: string) => {
    setRuleForm(prev => ({
      ...prev,
      allowMethods: prev.allowMethods.includes(method)
        ? prev.allowMethods.filter(m => m !== method)
        : [...prev.allowMethods, method]
    }));
  };

  const toggleWorkDay = (day: number) => {
    setSchedForm(prev => ({
      ...prev,
      workDays: prev.workDays.includes(day) ? prev.workDays.filter(d => d !== day) : [...prev.workDays, day].toSorted()
    }));
  };

  const stats = [
    {
      label: '打卡地點',
      value: locations.filter(l => l.enabled).length,
      total: locations.length,
      icon: MapPin,
      color: 'text-primary'
    },
    {
      label: '班次設定',
      value: schedules.filter(s => s.enabled).length,
      total: schedules.length,
      icon: Clock,
      color: 'text-accent'
    },
    {
      label: '打卡規則',
      value: rules.filter(r => r.enabled).length,
      total: rules.length,
      icon: Shield,
      color: 'text-[hsl(var(--success))]'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">打卡管理</h1>
          <p className="text-muted-foreground text-sm mt-1">管理打卡地點、班次時間與打卡規則</p>
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
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="text-2xl font-bold text-foreground">
                  {s.value} <span className="text-sm font-normal text-muted-foreground">/ {s.total}</span>
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="locations">
        <TabsList>
          <TabsTrigger value="locations" className="gap-1.5">
            <MapPin className="h-4 w-4" />
            打卡地點
          </TabsTrigger>
          <TabsTrigger value="schedules" className="gap-1.5">
            <Clock className="h-4 w-4" />
            班次時間
          </TabsTrigger>
          <TabsTrigger value="rules" className="gap-1.5">
            <Shield className="h-4 w-4" />
            打卡規則
          </TabsTrigger>
        </TabsList>

        {/* ── Locations Tab ── */}
        <TabsContent value="locations">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">打卡地點列表</CardTitle>
              <Button size="sm" onClick={() => openLocDialog()}>
                <Plus className="h-4 w-4 mr-1" />
                新增地點
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>地點名稱</TableHead>
                    <TableHead>地址</TableHead>
                    <TableHead>座標</TableHead>
                    <TableHead>有效範圍</TableHead>
                    <TableHead>Wi-Fi SSID</TableHead>
                    <TableHead>關聯規則</TableHead>
                    <TableHead>狀態</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {locations.map(loc => {
                    const associatedRule = rules.find(r => r.id === loc.ruleId);
                    return (
                      <TableRow key={loc.id}>
                        <TableCell className="font-medium">{loc.name}</TableCell>
                        <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                          {loc.address}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {loc.lat}, {loc.lng}
                        </TableCell>
                        <TableCell>{loc.radius} 公尺</TableCell>
                        <TableCell>
                          {loc.wifiSSID ? (
                            <Badge variant="outline" className="gap-1">
                              <Wifi className="h-3 w-3" />
                              {loc.wifiSSID}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {associatedRule ? (
                            <Badge variant="outline" className="gap-1">
                              <Shield className="h-3 w-3" />
                              {associatedRule.name}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={loc.enabled ? 'default' : 'secondary'}>{loc.enabled ? '啟用' : '停用'}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openLocDialog(loc)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => deleteLoc(loc.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Schedules Tab ── */}
        <TabsContent value="schedules">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">班次時間列表</CardTitle>
              <Button size="sm" onClick={() => openSchedDialog()}>
                <Plus className="h-4 w-4 mr-1" />
                新增班次
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>班次名稱</TableHead>
                    <TableHead>類型</TableHead>
                    <TableHead>上班時間</TableHead>
                    <TableHead>下班時間</TableHead>
                    <TableHead>午休時間</TableHead>
                    <TableHead>遲到寬限</TableHead>
                    <TableHead>工作日</TableHead>
                    <TableHead>狀態</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedules.map(s => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {({ fixed: '固定班', flexible: '彈性班' } as Record<string, string>)[s.type] ?? '輪班制'}
                        </Badge>
                      </TableCell>
                      <TableCell>{s.workStart}</TableCell>
                      <TableCell>{s.workEnd}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {s.breakStart}–{s.breakEnd}
                      </TableCell>
                      <TableCell>{s.lateGrace} 分鐘</TableCell>
                      <TableCell>
                        <div className="flex gap-0.5">
                          {[0, 1, 2, 3, 4, 5, 6].map(d => (
                            <span
                              key={d}
                              className={`text-xs w-5 h-5 flex items-center justify-center rounded ${s.workDays.includes(d) ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
                            >
                              {weekDays[d]}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={s.enabled ? 'default' : 'secondary'}>{s.enabled ? '啟用' : '停用'}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openSchedDialog(s)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteSched(s.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Rules Tab ── */}
        <TabsContent value="rules">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">打卡規則列表</CardTitle>
              <Button size="sm" onClick={() => openRuleDialog()}>
                <Plus className="h-4 w-4 mr-1" />
                新增規則
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {rules.map(r => (
                  <Card key={r.id} className="border">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground">{r.name}</h3>
                          <Badge variant={r.enabled ? 'default' : 'secondary'}>{r.enabled ? '啟用' : '停用'}</Badge>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openRuleDialog(r)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteRule(r.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <p className="text-muted-foreground mb-1">打卡方式</p>
                          <div className="flex gap-1 flex-wrap">
                            {r.allowMethods.map(m => (
                              <Badge key={m} variant="outline" className="text-xs">
                                {(
                                  { gps: 'GPS定位', wifi: 'Wi-Fi', face: '人臉辨識', bluetooth: '藍牙' } as Record<
                                    string,
                                    string
                                  >
                                )[m] ?? m}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1">拍照/定位要求</p>
                          <p className="text-foreground">
                            {r.requirePhoto ? '需拍照' : '免拍照'} / {r.requireLocation ? '需定位' : '免定位'}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1">遠端打卡</p>
                          <p className="text-foreground">
                            {!r.allowRemote && '不允許'}
                            {r.allowRemote && r.remoteApproval && '允許（需審批）'}
                            {r.allowRemote && !r.remoteApproval && '允許（免審批）'}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1">加班 / 補卡</p>
                          <p className="text-foreground">
                            {r.overtimeAuto ? `自動計算（≥${r.overtimeMinMinutes}分）` : '手動申請'}
                            {' / '}
                            {r.missedClockAllowAppeal ? `可補卡（${r.appealDeadlineDays}天內）` : '不可補卡'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
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
        rules={rules}
      />

      {/* ── Schedule Dialog ── */}
      <Dialog open={schedDialog} onOpenChange={setSchedDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingSched ? '編輯班次' : '新增班次'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>班次名稱 *</Label>
              <Input
                value={schedForm.name}
                onChange={e => setSchedForm(p => ({ ...p, name: e.target.value }))}
                placeholder="例：標準班"
              />
            </div>
            <div>
              <Label>班次類型</Label>
              <Select
                value={schedForm.type}
                onValueChange={(v: 'fixed' | 'flexible' | 'shift') => setSchedForm(p => ({ ...p, type: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">固定班</SelectItem>
                  <SelectItem value="flexible">彈性班</SelectItem>
                  <SelectItem value="shift">輪班制</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>上班時間</Label>
                <Input
                  type="time"
                  value={schedForm.workStart}
                  onChange={e => setSchedForm(p => ({ ...p, workStart: e.target.value }))}
                />
              </div>
              <div>
                <Label>下班時間</Label>
                <Input
                  type="time"
                  value={schedForm.workEnd}
                  onChange={e => setSchedForm(p => ({ ...p, workEnd: e.target.value }))}
                />
              </div>
              <div>
                <Label>午休開始</Label>
                <Input
                  type="time"
                  value={schedForm.breakStart}
                  onChange={e => setSchedForm(p => ({ ...p, breakStart: e.target.value }))}
                />
              </div>
              <div>
                <Label>午休結束</Label>
                <Input
                  type="time"
                  value={schedForm.breakEnd}
                  onChange={e => setSchedForm(p => ({ ...p, breakEnd: e.target.value }))}
                />
              </div>
              <div>
                <Label>遲到寬限（分鐘）</Label>
                <Input
                  type="number"
                  value={schedForm.lateGrace}
                  onChange={e =>
                    setSchedForm(p => ({
                      ...p,
                      lateGrace: Number(e.target.value)
                    }))
                  }
                />
              </div>
              <div>
                <Label>早退寬限（分鐘）</Label>
                <Input
                  type="number"
                  value={schedForm.earlyLeaveGrace}
                  onChange={e =>
                    setSchedForm(p => ({
                      ...p,
                      earlyLeaveGrace: Number(e.target.value)
                    }))
                  }
                />
              </div>
            </div>
            <div>
              <Label className="mb-2 block">工作日</Label>
              <div className="flex gap-2">
                {[0, 1, 2, 3, 4, 5, 6].map(d => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleWorkDay(d)}
                    className={`w-9 h-9 rounded-md text-sm font-medium border transition-colors ${schedForm.workDays.includes(d) ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-muted-foreground border-input hover:bg-muted'}`}
                  >
                    {weekDays[d]}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={schedForm.enabled} onCheckedChange={v => setSchedForm(p => ({ ...p, enabled: v }))} />
              <Label>啟用此班次</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSchedDialog(false)}>
              取消
            </Button>
            <Button onClick={saveSched}>儲存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Rule Dialog ── */}
      <Dialog open={ruleDialog} onOpenChange={setRuleDialog}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRule ? '編輯打卡規則' : '新增打卡規則'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            <div>
              <Label>規則名稱 *</Label>
              <Input
                value={ruleForm.name}
                onChange={e => setRuleForm(p => ({ ...p, name: e.target.value }))}
                placeholder="例：預設打卡規則"
              />
            </div>

            <Separator />
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Smartphone className="h-4 w-4" />
              打卡方式
            </h4>
            <div className="flex gap-3 flex-wrap">
              {[
                { key: 'gps', label: 'GPS 定位' },
                { key: 'wifi', label: 'Wi-Fi 驗證' },
                { key: 'face', label: '人臉辨識' },
                { key: 'bluetooth', label: '藍牙信標' }
              ].map(m => (
                <label key={m.key} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={ruleForm.allowMethods.includes(m.key)}
                    onCheckedChange={() => toggleMethod(m.key)}
                  />
                  <span className="text-sm">{m.label}</span>
                </label>
              ))}
            </div>

            <Separator />
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Settings2 className="h-4 w-4" />
              驗證要求
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>打卡時需拍照</Label>
                <Switch
                  checked={ruleForm.requirePhoto}
                  onCheckedChange={v => setRuleForm(p => ({ ...p, requirePhoto: v }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>打卡時需定位</Label>
                <Switch
                  checked={ruleForm.requireLocation}
                  onCheckedChange={v => setRuleForm(p => ({ ...p, requireLocation: v }))}
                />
              </div>
            </div>

            <Separator />
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Building2 className="h-4 w-4" />
              遠端打卡
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>允許遠端打卡</Label>
                <Switch
                  checked={ruleForm.allowRemote}
                  onCheckedChange={v => setRuleForm(p => ({ ...p, allowRemote: v }))}
                />
              </div>
              {ruleForm.allowRemote && (
                <div className="flex items-center justify-between">
                  <Label>遠端打卡需審批</Label>
                  <Switch
                    checked={ruleForm.remoteApproval}
                    onCheckedChange={v => setRuleForm(p => ({ ...p, remoteApproval: v }))}
                  />
                </div>
              )}
            </div>

            <Separator />
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              加班與補卡
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>自動計算加班</Label>
                <Switch
                  checked={ruleForm.overtimeAuto}
                  onCheckedChange={v => setRuleForm(p => ({ ...p, overtimeAuto: v }))}
                />
              </div>
              {ruleForm.overtimeAuto && (
                <div>
                  <Label>最低加班時長（分鐘）</Label>
                  <Input
                    type="number"
                    value={ruleForm.overtimeMinMinutes}
                    onChange={e =>
                      setRuleForm(p => ({
                        ...p,
                        overtimeMinMinutes: Number(e.target.value)
                      }))
                    }
                  />
                </div>
              )}
              <div className="flex items-center justify-between">
                <Label>允許補卡申請</Label>
                <Switch
                  checked={ruleForm.missedClockAllowAppeal}
                  onCheckedChange={v => setRuleForm(p => ({ ...p, missedClockAllowAppeal: v }))}
                />
              </div>
              {ruleForm.missedClockAllowAppeal && (
                <div>
                  <Label>補卡申請期限（天）</Label>
                  <Input
                    type="number"
                    value={ruleForm.appealDeadlineDays}
                    onChange={e =>
                      setRuleForm(p => ({
                        ...p,
                        appealDeadlineDays: Number(e.target.value)
                      }))
                    }
                  />
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Switch checked={ruleForm.enabled} onCheckedChange={v => setRuleForm(p => ({ ...p, enabled: v }))} />
              <Label>啟用此規則</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRuleDialog(false)}>
              取消
            </Button>
            <Button onClick={saveRule}>儲存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
