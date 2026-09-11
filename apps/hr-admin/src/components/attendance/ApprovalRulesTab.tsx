import { ChevronRight, GitBranch, Layers, Plus, Search, Settings2, Users } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { APPROVAL_TYPE_TEXT, type ApprovalRule, changeRuleStatus, getRuleList } from '@/api/approval';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const typeColors: Record<string, string> = {
  請假申請: 'bg-primary/10 text-primary border-primary/20',
  報銷申請: 'bg-warning/10 text-warning border-warning/20',
  加班申請: 'bg-accent/10 text-accent border-accent/20',
  出差申請: 'bg-success/10 text-success border-success/20',
  離職申請: 'bg-destructive/10 text-destructive border-destructive/20'
};

export default function ApprovalRulesTab() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [rules, setRules] = useState<ApprovalRule[]>([]);

  const load = useCallback(() => {
    getRuleList()
      .then(res => setRules(res.data ?? []))
      .catch(() => setRules([]));
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const typeText = (r: ApprovalRule) => APPROVAL_TYPE_TEXT[r.type] ?? r.typeName ?? '';

  const filtered = rules.filter(
    r => !search || r.name.includes(search) || typeText(r).includes(search) || (r.applyScope ?? '').includes(search)
  );

  const handleToggle = async (id: number, enabled: boolean) => {
    try {
      await changeRuleStatus(id, enabled ? 1 : 2);
      setRules(prev => prev.map(r => (r.id === id ? { ...r, enabled } : r)));
      toast.success(enabled ? t('規則已啟用') : t('規則已停用'));
    } catch (err: any) {
      toast.error(err.message || t('操作失敗'));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('搜尋規則名稱/類型...')}
            className="pl-9 w-64"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Button onClick={() => navigate('/attendance/approval/rules/new')}>
          <Plus className="h-4 w-4 mr-2" />
          {t('新增審批規則')}
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
              <p className="text-xs text-muted-foreground">{t('規則總數')}</p>
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
              <p className="text-xs text-muted-foreground">{t('已啟用')}</p>
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
              <p className="text-xs text-muted-foreground">{t('涵蓋類型')}</p>
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
              <p className="text-xs text-muted-foreground">{t('適用範圍')}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('規則名稱')}</TableHead>
                <TableHead>{t('申請類型')}</TableHead>
                <TableHead>{t('適用範圍')}</TableHead>
                <TableHead>{t('審批層級')}</TableHead>
                <TableHead>{t('條件摘要')}</TableHead>
                <TableHead>{t('更新時間')}</TableHead>
                <TableHead>{t('狀態')}</TableHead>
                <TableHead className="w-12" />
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
                    <Badge className={`${typeColors[typeText(r)] || 'bg-muted text-muted-foreground'} border`}>
                      {t(typeText(r))}
                    </Badge>
                  </TableCell>
                  <TableCell>{r.applyScope}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{t('{{n}} 級', { n: r.levelCount ?? 0 })}</Badge>
                  </TableCell>
                  <TableCell className="max-w-64 truncate text-sm text-muted-foreground">{r.conditionsText}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.updatedAt}</TableCell>
                  <TableCell>
                    <Switch
                      checked={Boolean(r.enabled)}
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
                    {t('暫無符合條件的審批規則')}
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
