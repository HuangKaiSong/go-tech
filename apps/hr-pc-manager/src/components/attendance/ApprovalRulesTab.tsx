import { ChevronRight, GitBranch, Layers, Plus, Search as SearchIcon, Settings2, Users } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export interface ApprovalRule {
  applyScope: string;
  conditions: string;
  creator: string;
  enabled: boolean;
  id: string;
  levels: number;
  name: string;
  type: string;
  updatedAt: string;
}

const mockRules: ApprovalRule[] = [
  {
    id: '1',
    name: '請假審批流程',
    type: '請假申請',
    applyScope: '全公司',
    levels: 3,
    conditions: '請假天數 ≤ 3 天：部門主管 → 人事；> 3 天：加總經理',
    enabled: true,
    updatedAt: '2026-02-20',
    creator: '系統管理員'
  },
  {
    id: '2',
    name: '報銷審批流程',
    type: '報銷申請',
    applyScope: '全公司',
    levels: 4,
    conditions: '金額 ≤ 5,000：主管；≤ 30,000：加財務；> 30,000：加總經理',
    enabled: true,
    updatedAt: '2026-02-18',
    creator: '系統管理員'
  },
  {
    id: '3',
    name: '加班審批流程',
    type: '加班申請',
    applyScope: '全公司',
    levels: 2,
    conditions: '部門主管 → 人事備案',
    enabled: true,
    updatedAt: '2026-02-15',
    creator: '系統管理員'
  },
  {
    id: '4',
    name: '出差審批流程',
    type: '出差申請',
    applyScope: '全公司',
    levels: 3,
    conditions: '境內出差：主管 → 人事；境外出差：加總經理',
    enabled: true,
    updatedAt: '2026-02-10',
    creator: '系統管理員'
  },
  {
    id: '5',
    name: '技術部專屬請假流程',
    type: '請假申請',
    applyScope: '技術部',
    levels: 2,
    conditions: '部門主管 → 技術總監（跳過人事）',
    enabled: false,
    updatedAt: '2026-01-25',
    creator: '王大明'
  },
  {
    id: '6',
    name: '高額報銷特別審批',
    type: '報銷申請',
    applyScope: '全公司',
    levels: 5,
    conditions: '金額 > 50,000：主管 → 財務 → 財務總監 → CFO → CEO',
    enabled: true,
    updatedAt: '2026-01-20',
    creator: '系統管理員'
  },
  {
    id: '7',
    name: '離職審批流程',
    type: '離職申請',
    applyScope: '全公司',
    levels: 4,
    conditions: '部門主管 → 人事 → 總經理；試用期內：主管 → 人事',
    enabled: true,
    updatedAt: '2026-03-01',
    creator: '系統管理員'
  }
];

const typeColors: Record<string, string> = {
  請假申請: 'bg-primary/10 text-primary border-primary/20',
  報銷申請: 'bg-warning/10 text-warning border-warning/20',
  加班申請: 'bg-accent/10 text-accent border-accent/20',
  出差申請: 'bg-success/10 text-success border-success/20',
  離職申請: 'bg-destructive/10 text-destructive border-destructive/20'
};

export default function ApprovalRulesTab() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [rules, setRules] = useState(mockRules);

  const filtered = rules.filter(
    r => !search || r.name.includes(search) || r.type.includes(search) || r.applyScope.includes(search)
  );

  const handleToggle = (id: string, enabled: boolean) => {
    setRules(prev => prev.map(r => (r.id === id ? { ...r, enabled } : r)));
    toast.success(enabled ? '規則已啟用' : '規則已停用');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative">
          <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜尋規則名稱/類型..."
            className="pl-9 w-64"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Button onClick={() => navigate('/attendance/approval/rules/new')}>
          <Plus className="h-4 w-4 mr-2" />
          新增審批規則
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <Layers className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{rules.length}</p>
              <p className="text-xs text-muted-foreground">規則總數</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <Settings2 className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{rules.filter(r => r.enabled).length}</p>
              <p className="text-xs text-muted-foreground">已啟用</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <GitBranch className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{new Set(rules.map(r => r.type)).size}</p>
              <p className="text-xs text-muted-foreground">涵蓋類型</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <Users className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{new Set(rules.map(r => r.applyScope)).size}</p>
              <p className="text-xs text-muted-foreground">適用範圍</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>規則名稱</TableHead>
                <TableHead>申請類型</TableHead>
                <TableHead>適用範圍</TableHead>
                <TableHead>審批層級</TableHead>
                <TableHead>條件摘要</TableHead>
                <TableHead>更新時間</TableHead>
                <TableHead>狀態</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(r => (
                <TableRow
                  key={r.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/attendance/approval/rules/${r.id}`)}
                >
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell>
                    <Badge className={`${typeColors[r.type] || 'bg-muted text-muted-foreground'} border`}>
                      {r.type}
                    </Badge>
                  </TableCell>
                  <TableCell>{r.applyScope}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{r.levels} 級</Badge>
                  </TableCell>
                  <TableCell className="max-w-64 truncate text-sm text-muted-foreground">{r.conditions}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.updatedAt}</TableCell>
                  <TableCell>
                    <Switch
                      checked={r.enabled}
                      onCheckedChange={v => {
                        handleToggle(r.id, v);
                      }}
                      onClick={e => e.stopPropagation()}
                    />
                  </TableCell>
                  <TableCell>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    暫無符合條件的審批規則
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
