import { Briefcase, Building2, ChevronDown, ChevronRight, Maximize2, Users, ZoomIn, ZoomOut } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { getOrgTree, type OrgDeptNode } from '@/api/department';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const levelBadge: Record<string, string> = {
  M3: 'bg-primary/10 text-primary border-primary/20',
  M2: 'bg-accent/10 text-accent border-accent/20',
  M1: 'bg-accent/10 text-accent border-accent/20',
  P3: 'bg-success/10 text-success border-success/20',
  P2: 'bg-warning/10 text-warning border-warning/20',
  P1: 'bg-muted text-muted-foreground',
  P0: 'bg-muted text-muted-foreground'
};

function countDepts(node: OrgDeptNode): number {
  return 1 + (node.children ?? []).reduce((s, c) => s + countDepts(c), 0);
}
function countPositions(node: OrgDeptNode): number {
  return (node.positions?.length ?? 0) + (node.children ?? []).reduce((s, c) => s + countPositions(c), 0);
}
function maxDepth(node: OrgDeptNode): number {
  const kids = node.children ?? [];
  return kids.length ? 1 + Math.max(...kids.map(maxDepth)) : 1;
}

function DeptNode({ navigate, node }: { navigate: (to: string) => void; node: OrgDeptNode }) {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);
  const children = node.children ?? [];
  const positions = node.positions ?? [];
  const hasChildren = children.length > 0;

  return (
    <div className="flex flex-col items-center">
      {/* Dept card */}
      <div className="relative rounded-xl border-2 border-border bg-card w-[220px] shadow-sm hover:shadow-md transition-all">
        {/* Header */}
        <div
          className="flex items-center gap-2 px-3 py-2 border-b bg-muted/40 rounded-t-[10px] cursor-pointer"
          onClick={() => navigate(`/organization/departments/${node.id}`)}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-[11px] shrink-0">
            {node.code.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground leading-tight truncate">{node.name}</p>
            <p className="text-[10px] text-muted-foreground leading-tight flex items-center gap-1">
              <Users className="h-2.5 w-2.5" />
              {t('{{count}} 人', { count: node.memberCount })}
              {node.statusCode !== 1 && <span className="text-destructive">· {t('停用')}</span>}
            </p>
          </div>
        </div>

        {/* Positions */}
        <div className="p-2 space-y-1">
          {positions.length === 0 ? (
            <p className="text-[11px] text-muted-foreground text-center py-1">{t('暫無職位')}</p>
          ) : (
            positions.map(p => (
              <div
                key={p.id}
                className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-muted/60 cursor-pointer"
                onClick={() => navigate(`/organization/roles/${p.id}`)}
              >
                <Briefcase className="h-3 w-3 text-muted-foreground shrink-0" />
                <span className="text-xs text-foreground truncate flex-1">{p.title}</span>
                {p.level && (
                  <Badge variant="outline" className={`text-[9px] px-1 py-0 ${levelBadge[p.level] || ''}`}>
                    {p.level}
                  </Badge>
                )}
                <span className="text-[10px] text-muted-foreground shrink-0">{p.memberCount}</span>
              </div>
            ))
          )}
        </div>

        {/* Collapse toggle */}
        {hasChildren && (
          <button
            type="button"
            onClick={() => setCollapsed(c => !c)}
            className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-card border border-border rounded-full h-6 w-6 flex items-center justify-center text-muted-foreground shadow-sm hover:bg-muted"
            title={collapsed ? t('展開下級部門') : t('收合下級部門')}
          >
            {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        )}
      </div>

      {/* Children */}
      {hasChildren && !collapsed && (
        <>
          <div className="w-px h-6 bg-border" />
          <div className="relative flex items-start">
            {children.length > 1 && (
              <div
                className="absolute top-0 h-px bg-border"
                style={{
                  left: `calc(${100 / (children.length * 2)}%)`,
                  right: `calc(${100 / (children.length * 2)}%)`
                }}
              />
            )}
            {children.map(child => (
              <div key={child.id} className="flex flex-col items-center px-3">
                <div className="w-px h-6 bg-border" />
                <DeptNode node={child} navigate={navigate} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function OrgChart() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [scale, setScale] = useState(0.9);
  const [loading, setLoading] = useState(true);
  const [roots, setRoots] = useState<OrgDeptNode[]>([]);

  useEffect(() => {
    getOrgTree()
      .then(res => setRoots(res.data ?? []))
      .catch(e => toast.error(e.message || t('組織架構載入失敗')))
      .finally(() => setLoading(false));
  }, [t]);

  const totalDepts = roots.reduce((s, n) => s + countDepts(n), 0);
  const totalPositions = roots.reduce((s, n) => s + countPositions(n), 0);
  const depth = roots.length ? Math.max(...roots.map(maxDepth)) : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('職位架構')}</h1>
          <p className="text-muted-foreground mt-1">{t('以部門層級為骨架，展示各部門下的職位與實時在職人數')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <Building2 className="h-3 w-3" />
            {t('{{count}} 個部門', { count: totalDepts })}
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Briefcase className="h-3 w-3" />
            {t('{{count}} 個職位', { count: totalPositions })}
          </Badge>
          <Badge variant="outline" className="gap-1">
            {t('{{count}} 層級', { count: depth })}
          </Badge>
        </div>
      </div>

      {/* Legend + Zoom */}
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-muted-foreground">{t('職等：')}</span>
          {Object.entries(levelBadge).map(([level, color]) => (
            <Badge key={level} variant="outline" className={`${color} text-[10px]`}>
              {level}
            </Badge>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => setScale(s => Math.max(0.3, s - 0.1))}
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>
          <span className="text-xs text-muted-foreground w-10 text-center">{Math.round(scale * 100)}%</span>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => setScale(s => Math.min(1.5, s + 0.1))}
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </Button>
          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setScale(0.9)}>
            <Maximize2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Tree */}
      <Card>
        <CardContent className="p-6 overflow-auto">
          {loading ? (
            <div className="text-center py-16 text-muted-foreground">{t('載入中…')}</div>
          ) : roots.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Building2 className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">{t('尚無部門資料，請先於「部門管理」建立部門與職位。')}</p>
            </div>
          ) : (
            <div
              className="flex justify-center gap-10 min-w-max py-4"
              style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}
            >
              {roots.map(root => (
                <DeptNode key={root.id} node={root} navigate={navigate} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground text-center">
        {t('點擊部門名進入部門詳情、點擊職位進入職位詳情；圓圈按鈕可展開/收合下級部門')}
      </p>
    </div>
  );
}
