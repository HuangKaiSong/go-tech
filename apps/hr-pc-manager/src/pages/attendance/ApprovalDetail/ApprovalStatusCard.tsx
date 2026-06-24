import { Card, CardContent } from '@/components/ui/card';
import type { ApprovalStatus } from './types';

const statusCopy: Partial<Record<ApprovalStatus, { desc: string; title: string }>> = {
  通過: { title: '此申請已通過所有審批節點', desc: '審批流程已結束' },
  駁回: { title: '此申請已被駁回', desc: '申請人可修改後重新提交' },
  撤回: { title: '此申請已被申請人撤回', desc: '申請人可重新發起申請' }
};

const iconBgMap: Partial<Record<ApprovalStatus, string>> = {
  通過: 'bg-success/10',
  駁回: 'bg-destructive/10'
};

const iconColorMap: Partial<Record<ApprovalStatus, string>> = {
  通過: 'text-success',
  駁回: 'text-destructive'
};

interface ApprovalStatusCardProps {
  status: ApprovalStatus;
  StatusIcon: React.ElementType;
}

export const ApprovalStatusCard = ({ status, StatusIcon }: ApprovalStatusCardProps) => {
  const copy = statusCopy[status];
  if (!copy) return null;
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${iconBgMap[status] ?? 'bg-muted'}`}>
            <StatusIcon className={`h-5 w-5 ${iconColorMap[status] ?? 'text-muted-foreground'}`} />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{copy.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{copy.desc}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
