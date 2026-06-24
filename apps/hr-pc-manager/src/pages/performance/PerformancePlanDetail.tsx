import { ArrowLeft, CheckCircle, Copy, Edit2, Play, Target, Users } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';

interface Criterion {
  category: string;
  description: string;
  id: string;
  name: string;
  scoringMethod: string;
  weight: number;
}

const mockPlan = {
  id: 'PLN001',
  name: '2026 Q1 績效考核',
  period: '2026-01-01 至 2026-03-31',
  cycle: '季度',
  scope: '全公司',
  status: '進行中',
  createdAt: '2025-12-15',
  updatedAt: '2026-01-02',
  createdBy: '王美玲',
  description:
    '2026年第一季度全公司績效考核方案，涵蓋工作業績、工作能力和工作態度三大維度，採用自評、同事互評和主管評價相結合的方式進行綜合評估。',
  weightConfig: { self: 20, peer: 30, manager: 50 },
  gradeRules: [
    { grade: 'A+', min: 95, max: 100, description: '卓越表現' },
    { grade: 'A', min: 90, max: 94, description: '優秀' },
    { grade: 'B+', min: 85, max: 89, description: '良好' },
    { grade: 'B', min: 80, max: 84, description: '合格' },
    { grade: 'C', min: 70, max: 79, description: '需改進' },
    { grade: 'D', min: 0, max: 69, description: '不合格' }
  ],
  selfDeadline: '2026-03-25',
  peerDeadline: '2026-03-28',
  managerDeadline: '2026-03-31',
  employeeCount: 45,
  completedCount: 28
};

const mockCriteria: Criterion[] = [
  {
    id: 'C1',
    category: '工作業績',
    name: '專案交付達成率',
    weight: 25,
    description: '按時按質完成所負責專案的比率',
    scoringMethod: '目標達成率計算'
  },
  {
    id: 'C2',
    category: '工作業績',
    name: '代碼品質與技術債務',
    weight: 20,
    description: '代碼審查通過率、bug 修復速度及技術債務清理',
    scoringMethod: '量化指標評分'
  },
  {
    id: 'C3',
    category: '工作能力',
    name: '團隊協作與溝通',
    weight: 20,
    description: '跨部門協作效率、知識分享及溝通能力',
    scoringMethod: '360度回饋評分'
  },
  {
    id: 'C4',
    category: '工作能力',
    name: '問題解決與創新',
    weight: 15,
    description: '面對技術難題的解決能力及創新貢獻',
    scoringMethod: '案例評估'
  },
  {
    id: 'C5',
    category: '工作態度',
    name: '工作積極性與責任感',
    weight: 10,
    description: '工作主動性、責任心及對團隊目標的貢獻',
    scoringMethod: '行為觀察評分'
  },
  {
    id: 'C6',
    category: '工作態度',
    name: '學習成長與自我提升',
    weight: 10,
    description: '專業技能提升、學習計畫執行及職業發展',
    scoringMethod: '成果記錄評估'
  }
];

const statusColors: Record<string, string> = {
  進行中: 'bg-primary/10 text-primary border-primary/20',
  已完成: 'bg-success/10 text-success border-success/20',
  草稿: 'bg-muted text-muted-foreground'
};

export default function PerformancePlanDetail() {
  const { planId } = useParams();
  const navigate = useNavigate();

  // const categories = [...new Set(mockCriteria.map(c => c.category))];
  const totalWeight = mockCriteria.reduce((s, c) => s + c.weight, 0);
  const progressPct = Math.round((mockPlan.completedCount / mockPlan.employeeCount) * 100);

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <Button
          variant="ghost"
          size="sm"
          className="mb-2 -ml-2 text-muted-foreground"
          onClick={() => navigate('/performance/plans')}
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> 返回列表
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title flex items-center gap-2">
              <Target className="h-6 w-6 text-primary" />
              {mockPlan.name}
            </h1>
            <p className="page-description">查看考核方案的詳細設定與執行進度</p>
          </div>
          <div className="flex gap-2">
            {mockPlan.status === '草稿' && (
              <Button variant="outline" size="sm" onClick={() => toast({ title: '方案已啟動' })}>
                <Play className="h-4 w-4 mr-1" />
                啟動方案
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => toast({ title: '方案已複製為草稿' })}>
              <Copy className="h-4 w-4 mr-1" />
              複製方案
            </Button>
            <Button size="sm" onClick={() => navigate(`/performance/plans/${planId}/edit`)}>
              <Edit2 className="h-4 w-4 mr-1" />
              編輯方案
            </Button>
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">基本資訊</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-5 gap-x-8">
              <InfoField label="方案名稱" value={mockPlan.name} />
              <InfoField label="考核週期" value={mockPlan.period} />
              <InfoField label="週期類型" value={mockPlan.cycle} />
              <InfoField label="考核範圍" value={mockPlan.scope} />
              <InfoField label="建立者" value={mockPlan.createdBy} />
              <InfoField label="狀態">
                <Badge variant="secondary" className={statusColors[mockPlan.status] || ''}>
                  {mockPlan.status}
                </Badge>
              </InfoField>
              <InfoField label="建立時間" value={mockPlan.createdAt} />
              <InfoField label="更新時間" value={mockPlan.updatedAt} />
            </div>
            <Separator className="my-5" />
            <div>
              <p className="text-sm text-muted-foreground mb-1">方案說明</p>
              <p className="text-sm leading-relaxed">{mockPlan.description}</p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">執行進度</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">已完成 / 總人數</span>
                <span className="text-sm font-semibold">
                  {mockPlan.completedCount} / {mockPlan.employeeCount}
                </span>
              </div>
              <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progressPct}%` }} />
              </div>
              <p className="text-xs text-muted-foreground mt-1.5 text-right">{progressPct}%</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">時間節點</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <TimelineItem icon={Users} label="員工自評截止" date={mockPlan.selfDeadline} />
              <TimelineItem icon={Users} label="同事互評截止" date={mockPlan.peerDeadline} />
              <TimelineItem icon={CheckCircle} label="主管評價截止" date={mockPlan.managerDeadline} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Weight Config */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">評分權重配置</CardTitle>
          <CardDescription>各評估維度的權重佔比</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <WeightCard label="員工自評" percent={mockPlan.weightConfig.self} color="bg-primary" />
            <WeightCard label="同事互評" percent={mockPlan.weightConfig.peer} color="bg-warning" />
            <WeightCard label="主管評價" percent={mockPlan.weightConfig.manager} color="bg-success" />
          </div>
        </CardContent>
      </Card>

      {/* Grade Rules */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">等級評定規則</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>等級</TableHead>
                <TableHead>分數區間</TableHead>
                <TableHead>說明</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockPlan.gradeRules.map(rule => (
                <TableRow key={rule.grade}>
                  <TableCell>
                    <Badge variant="outline" className="font-semibold">
                      {rule.grade}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {rule.min} – {rule.max} 分
                  </TableCell>
                  <TableCell>{rule.description}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Criteria */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">
                考核指標（共 {mockCriteria.length} 項，總權重 {totalWeight}%）
              </CardTitle>
              <CardDescription>各分類考核指標的權重與評分方式</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>分類</TableHead>
                <TableHead>指標名稱</TableHead>
                <TableHead className="text-center">權重</TableHead>
                <TableHead>指標說明</TableHead>
                <TableHead>評分方式</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockCriteria.map(c => (
                <TableRow key={c.id}>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {c.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-center font-semibold">{c.weight}%</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[280px]">{c.description}</TableCell>
                  <TableCell className="text-sm">{c.scoringMethod}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────

function InfoField({ children, label, value }: { children?: React.ReactNode; label: string; value?: string }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground mb-0.5">{label}</p>
      {children || <p className="text-sm font-medium">{value}</p>}
    </div>
  );
}

function TimelineItem({ date, icon: Icon, label }: { date: string; icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{date}</p>
      </div>
    </div>
  );
}

function WeightCard({ color, label, percent }: { color: string; label: string; percent: number }) {
  return (
    <div className="rounded-lg border p-4 text-center">
      <p className="text-sm text-muted-foreground mb-2">{label}</p>
      <p className="text-3xl font-bold mb-2">{percent}%</p>
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
