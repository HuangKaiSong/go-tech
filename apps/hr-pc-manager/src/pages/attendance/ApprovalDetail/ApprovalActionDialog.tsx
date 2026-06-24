import { AlertTriangle, ArrowRight, CheckCircle2, RotateCcw, Send, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { ActionType, ApprovalData } from './types';

export interface ActionConfig {
  btnClass: string;
  btnLabel: string;
  desc: string;
  handler: () => void;
  title: string;
}

const titleIconMap: Record<Exclude<ActionType, null>, { className: string; Icon: typeof CheckCircle2 }> = {
  approve: { Icon: CheckCircle2, className: 'text-success' },
  reject: { Icon: XCircle, className: 'text-destructive' },
  transfer: { Icon: Send, className: 'text-primary' },
  withdraw: { Icon: RotateCcw, className: 'text-muted-foreground' },
  returnModify: { Icon: AlertTriangle, className: 'text-warning' }
};

const commentPlaceholderMap: Record<string, string> = {
  reject: '請說明駁回原因...',
  returnModify: '請說明需修改的內容...'
};

const TRANSFER_TARGETS = [
  { value: '趙總監', label: '趙總監 · 技術總監' },
  { value: '劉美君', label: '劉美君 · 人事專員' },
  { value: '林會計', label: '林會計 · 財務專員' },
  { value: '陳經理', label: '陳經理 · 銷售部主管' },
  { value: '吳總監', label: '吳總監 · 市場部總監' }
];

const isReasonAction = (action: ActionType) => action === 'reject' || action === 'returnModify';
const isPreviewAction = (action: ActionType) => action === 'approve' || action === 'reject';

interface ApprovalActionDialogProps {
  actionConfigs: Record<string, ActionConfig>;
  approvalComment: string;
  currentStepIndex: number;
  data: ApprovalData;
  dialog: ActionType;
  onClose: () => void;
  onCommentChange: (v: string) => void;
  onTransferToChange: (v: string) => void;
  transferTo: string;
}

export const ApprovalActionDialog = ({
  actionConfigs,
  approvalComment,
  currentStepIndex,
  data,
  dialog,
  onClose,
  onCommentChange,
  onTransferToChange,
  transferTo
}: ApprovalActionDialogProps) => {
  if (!dialog || !actionConfigs[dialog]) return null;
  const cfg = actionConfigs[dialog];
  const { className: iconClass, Icon } = titleIconMap[dialog];
  const commentLabel = isReasonAction(dialog) ? '駁回/退回原因' : '備註（選填）';
  const commentPlaceholder = commentPlaceholderMap[dialog] ?? '請輸入備註...';
  const showPreview = isPreviewAction(dialog);
  const reachesFinal = dialog === 'approve' && currentStepIndex >= data.steps.length - 2;
  const nextNode = data.steps[currentStepIndex + 1];

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${iconClass}`} />
            {cfg.title}
          </DialogTitle>
          <DialogDescription>{cfg.desc}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-muted/50 border border-border">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{data.code}</span>
              <Badge variant="outline">{data.type}</Badge>
            </div>
            <p className="text-sm font-medium text-foreground mt-1">
              {data.applicant} — {data.summary}
            </p>
          </div>

          {dialog === 'transfer' && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">轉簽對象</p>
              <Select value={transferTo} onValueChange={onTransferToChange}>
                <SelectTrigger>
                  <SelectValue placeholder="請選擇轉簽對象" />
                </SelectTrigger>
                <SelectContent>
                  {TRANSFER_TARGETS.map(t => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{commentLabel}</p>
            <Textarea
              placeholder={commentPlaceholder}
              value={approvalComment}
              onChange={e => onCommentChange(e.target.value)}
              rows={3}
            />
          </div>

          {showPreview && (
            <div className="p-3 rounded-lg border border-border bg-muted/30">
              <p className="text-xs font-medium text-muted-foreground mb-2">狀態流轉預覽</p>
              <div className="flex items-center gap-2 text-sm">
                <Badge className="bg-warning/10 text-warning border border-warning/20">待審</Badge>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                {dialog === 'reject' && (
                  <Badge className="bg-destructive/10 text-destructive border border-destructive/20">駁回</Badge>
                )}
                {dialog === 'approve' && !reachesFinal && (
                  <Badge className="bg-warning/10 text-warning border border-warning/20">{nextNode?.nodeName}</Badge>
                )}
                {dialog === 'approve' && reachesFinal && (
                  <Badge className="bg-success/10 text-success border border-success/20">通過</Badge>
                )}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button className={cfg.btnClass} onClick={cfg.handler}>
            {cfg.btnLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
