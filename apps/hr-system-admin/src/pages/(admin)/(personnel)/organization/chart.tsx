import { Avatar, AvatarFallback } from '@go-tech/web-ui';
import { SvgIcon } from '@go-tech/web-ui-compose';
import { createFileRoute } from '@tanstack/react-router';
import { Badge } from './modules/Badge';

export const Route = createFileRoute('/(admin)/(personnel)/organization/chart')({
  component: RouteComponent,
  staticData: {
    title: '职位架构',
    menu: {
      icon: 'lucide:git-branch'
    }
  }
});

interface OrgNode {
  children?: OrgNode[];
  department: string;
  headcount?: number;
  id: string;
  level: string;
  name: string;
  title: string;
}

const orgData: OrgNode = {
  id: '1',
  name: '王董事長',
  title: '董事長',
  department: '董事會',
  level: 'C-Level',
  children: [
    {
      id: '2',
      name: '張執行長',
      title: '執行長 (CEO)',
      department: '總經理室',
      level: 'C-Level',
      children: [
        {
          id: '3',
          name: '李技術長',
          title: '技術長 (CTO)',
          department: '研發中心',
          level: 'C-Level',
          children: [
            {
              id: '31',
              name: '張技術總監',
              title: '技術總監',
              department: '技術部',
              level: 'M3',
              headcount: 320,
              children: [
                {
                  id: '311',
                  name: '周前端主管',
                  title: '前端開發主管',
                  department: '前端組',
                  level: 'M2',
                  headcount: 45,
                  children: [
                    { id: '3111', name: '劉資深工程師', title: '高級前端工程師', department: '前端組', level: 'P3' },
                    { id: '3112', name: '陳工程師', title: '前端工程師', department: '前端組', level: 'P2' }
                  ]
                },
                {
                  id: '312',
                  name: '吳後端主管',
                  title: '後端開發主管',
                  department: '後端組',
                  level: 'M2',
                  headcount: 60,
                  children: [
                    { id: '3121', name: '林資深工程師', title: '高級後端工程師', department: '後端組', level: 'P3' }
                  ]
                },
                { id: '313', name: '鄭QA主管', title: '測試主管', department: '測試組', level: 'M2', headcount: 20 }
              ]
            },
            {
              id: '32',
              name: '黃產品總監',
              title: '產品總監',
              department: '產品部',
              level: 'M3',
              headcount: 50,
              children: [{ id: '321', name: '趙產品經理', title: '產品經理', department: '產品部', level: 'P3' }]
            }
          ]
        },
        {
          id: '4',
          name: '趙營運長',
          title: '營運長 (COO)',
          department: '營運中心',
          level: 'C-Level',
          children: [
            {
              id: '41',
              name: '李銷售總監',
              title: '銷售總監',
              department: '銷售部',
              level: 'M3',
              headcount: 240,
              children: [
                {
                  id: '411',
                  name: '馬區域經理',
                  title: '銷售經理',
                  department: '銷售一部',
                  level: 'M2',
                  headcount: 90
                },
                { id: '412', name: '楊區域經理', title: '銷售經理', department: '銷售二部', level: 'M2', headcount: 80 }
              ]
            },
            { id: '42', name: '陳市場主管', title: '市場總監', department: '市場部', level: 'M3', headcount: 180 },
            {
              id: '43',
              name: '趙運營總監',
              title: '運營總監',
              department: '運營部',
              level: 'M3',
              headcount: 200,
              children: [
                { id: '431', name: '孫產品運營', title: '產品經理', department: '運營部', level: 'P3', headcount: 12 }
              ]
            }
          ]
        },
        {
          id: '5',
          name: '錢財務長',
          title: '財務長 (CFO)',
          department: '管理中心',
          level: 'C-Level',
          children: [
            {
              id: '51',
              name: '王人事主管',
              title: '人事總監',
              department: '人事部',
              level: 'M3',
              headcount: 80,
              children: [
                { id: '511', name: '何招聘主管', title: '招聘主管', department: '人事部', level: 'M2' },
                { id: '512', name: '方薪酬主管', title: '薪酬主管', department: '人事部', level: 'M2' }
              ]
            },
            { id: '52', name: '林財務主管', title: '財務總監', department: '財務部', level: 'M3', headcount: 120 }
          ]
        }
      ]
    }
  ]
};

const levelColors: Record<string, string> = {
  'C-Level': 'border-primary/40 bg-primary/5',
  M3: 'border-accent/40 bg-accent/5',
  M2: 'border-success/40 bg-success/5',
  P3: 'border-warning/40 bg-warning/5',
  P2: 'border-border bg-muted/30',
  P1: 'border-border bg-muted/30'
};

const levelBadge: Record<string, string> = {
  'C-Level': 'bg-primary/10 text-primary border-primary/20',
  M3: 'bg-accent/10 text-accent border-accent/20',
  M2: 'bg-success/10 text-success border-success/20',
  P3: 'bg-warning/10 text-warning border-warning/20',
  P2: 'bg-muted text-muted-foreground',
  P1: 'bg-muted text-muted-foreground'
};

const avatarColors: Record<string, string> = {
  'C-Level': 'bg-primary text-primary-foreground',
  M3: 'bg-accent text-accent-foreground',
  M2: 'bg-success text-success-foreground',
  P3: 'bg-warning text-warning-foreground',
  P2: 'bg-secondary text-secondary-foreground',
  P1: 'bg-secondary text-secondary-foreground'
};

function TreeNode({ node }: { isLast?: boolean; node: OrgNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="flex flex-col items-center">
      {/* Node card */}
      <div
        className={`relative rounded-xl border-2 px-4 py-3 min-w-[150px] max-w-[180px] cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5 ${levelColors[node.level] || 'border-border'}`}
        onClick={() => hasChildren && setCollapsed(!collapsed)}
      >
        <div className="flex flex-col items-center text-center gap-1.5">
          <Avatar className="h-10 w-10">
            <AvatarFallback className={`text-xs font-bold ${avatarColors[node.level] || ''}`}>
              {node.name.slice(-2)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-semibold text-foreground leading-tight">{node.name}</p>
            <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">{node.title}</p>
          </div>
          <div className="flex items-center gap-1 flex-wrap justify-center">
            <Badge variant="outline" className={`text-[9px] px-1 py-0 ${levelBadge[node.level] || ''}`}>
              {node.level}
            </Badge>
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
              <SvgIcon icon="lucide:building-2" className="h-2.5 w-2.5" />
              {node.department}
            </span>
          </div>
          {node.headcount && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
              <SvgIcon icon="lucide:users" className="h-2.5 w-2.5" />
              {node.headcount} 人
            </span>
          )}
        </div>
        {/* Collapse indicator */}
        {hasChildren && collapsed && (
          <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-card border border-border rounded-full h-5 w-5 flex items-center justify-center text-[10px] text-muted-foreground font-medium shadow-sm">
            {node.children!.length}
          </div>
        )}
      </div>

      {/* Connector down */}
      {hasChildren && !collapsed && (
        <>
          <div className="w-px h-5 bg-border" />

          {/* Children row */}
          <div className="relative flex items-start">
            {/* Horizontal connector line across children */}
            {node.children!.length > 1 && (
              <div
                className="absolute top-0 h-px bg-border"
                style={{
                  left: `calc(${100 / (node.children!.length * 2)}% )`,
                  right: `calc(${100 / (node.children!.length * 2)}% )`
                }}
              />
            )}

            {node.children!.map((child, i) => (
              <div key={child.id} className="flex flex-col items-center px-2">
                {/* Vertical connector from horizontal line to child */}
                <div className="w-px h-5 bg-border" />
                <TreeNode node={child} isLast={i === node.children!.length - 1} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function countNodes(node: OrgNode): number {
  let c = 1;
  if (node.children) node.children.forEach(ch => (c += countNodes(ch)));
  return c;
}
function maxDepth(node: OrgNode): number {
  if (!node.children || !node.children.length) return 1;
  return 1 + Math.max(...node.children.map(maxDepth));
}

function RouteComponent() {
  const [scale, setScale] = useState(0.85);
  const totalNodes = countNodes(orgData);
  const depth = maxDepth(orgData);
  return (
    <ACard
      title="職位架構"
      extra={
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-muted-foreground">職等：</span>
            {Object.entries(levelBadge).map(([level, color]) => (
              <Badge key={level} variant="outline" className={`${color} text-[10px]`}>
                {level}
              </Badge>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <AButton
              icon={<SvgIcon icon="lucide:zoom-out" className="h-3.5 w-3.5" />}
              className="h-7 w-7"
              onClick={() => setScale(s => Math.max(0.3, s - 0.1))}
            />
            <span className="text-xs text-muted-foreground w-10 text-center">{Math.round(scale * 100)}%</span>
            <AButton
              className="h-7 w-7"
              icon={<SvgIcon icon="lucide:zoom-in" className="h-3.5 w-3.5" />}
              onClick={() => setScale(s => Math.min(1.5, s + 0.1))}
            />
            <AButton
              icon={<SvgIcon icon="lucide:maximize-2" className="h-3.5 w-3.5" />}
              className="h-7 w-7"
              onClick={() => setScale(0.85)}
            />
          </div>
        </div>
      }
    >
      <ACard.Meta
        title="查看組織從最高層級到基層的完整職位與人員關係"
        classNames={{ description: 'pb-4' }}
        description={
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1">
                <SvgIcon icon="lucide:users" className="h-3 w-3" />
                {totalNodes} 個職位
              </Badge>
              <Badge variant="outline" className="gap-1">
                {depth} 層級
              </Badge>
            </div>
          </div>
        }
      />

      {/* Legend + Zoom */}

      {/* Tree container */}
      <ACard>
        <div className="p-6 overflow-auto">
          <div
            className="flex justify-center min-w-max py-4"
            style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}
          >
            <TreeNode node={orgData} />
          </div>
        </div>
      </ACard>

      <p className="text-xs text-muted-foreground text-center">點擊節點可展開/收合下級，滾動可左右瀏覽</p>
    </ACard>
  );
}
