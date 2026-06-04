import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Building2, Search, Plus, Download, Users, TrendingUp, Eye, MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Department {
  id: string;
  code: string | null;
  name: string;
  manager_name: string | null;
  member_count: number | null;
  description: string | null;
  created_at: string;
}

export default function Departments() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", code: "", manager_name: "", description: "" });

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("departments")
      .select("id,code,name,manager_name,member_count,description,created_at")
      .order("created_at", { ascending: true });
    if (error) toast.error("載入部門失敗：" + error.message);
    else setDepartments((data ?? []) as Department[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = departments.filter(
    (d) => !search || d.name.includes(search) || (d.code ?? "").includes(search) || (d.manager_name ?? "").includes(search)
  );

  const handleAdd = async () => {
    if (!form.name || !form.code) {
      toast.error("請填寫必填欄位");
      return;
    }
    const { error } = await supabase.from("departments").insert({
      name: form.name, code: form.code, manager_name: form.manager_name, description: form.description,
    });
    if (error) { toast.error("新增失敗：" + error.message); return; }
    toast.success(`部門「${form.name}」已新增`);
    setAddOpen(false);
    setForm({ name: "", code: "", manager_name: "", description: "" });
    load();
  };

  const stats = [
    { label: "部門總數", value: departments.length, icon: Building2, color: "text-primary" },
    { label: "啟用中", value: departments.length, icon: TrendingUp, color: "text-success" },
    { label: "總人數", value: departments.reduce((s, d) => s + (d.member_count ?? 0), 0), icon: Users, color: "text-accent" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />部門管理
          </h1>
          <p className="text-muted-foreground mt-1">管理公司部門架構與人員配置（資料來源：Lovable Cloud）</p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />新增部門</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>新增部門</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>部門名稱 <span className="text-destructive">*</span></Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>部門代碼 <span className="text-destructive">*</span></Label>
                  <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>部門主管</Label>
                <Input value={form.manager_name} onChange={(e) => setForm({ ...form, manager_name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>部門職責說明</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddOpen(false)}>取消</Button>
              <Button onClick={handleAdd}>確認新增</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted"><s.icon className={`h-5 w-5 ${s.color}`} /></div>
              <div>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="搜尋部門名稱、代碼、主管..." className="pl-9 h-9" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1" />匯出</Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>部門代碼</TableHead>
                <TableHead>部門名稱</TableHead>
                <TableHead>部門主管</TableHead>
                <TableHead className="text-right">人數</TableHead>
                <TableHead>說明</TableHead>
                <TableHead>建立日期</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">載入中...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">暫無部門資料</TableCell></TableRow>
              ) : filtered.map((d) => (
                <TableRow key={d.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/organization/departments/${d.id}`)}>
                  <TableCell className="font-mono text-sm">{d.code}</TableCell>
                  <TableCell className="font-medium">{d.name}</TableCell>
                  <TableCell>{d.manager_name ?? "-"}</TableCell>
                  <TableCell className="text-right">{d.member_count ?? 0}</TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground text-sm">{d.description ?? "-"}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{new Date(d.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/organization/departments/${d.id}`); }}>
                          <Eye className="h-4 w-4 mr-2" />查看詳情
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
