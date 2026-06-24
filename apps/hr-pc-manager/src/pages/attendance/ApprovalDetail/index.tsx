import { ArrowLeft, ArrowRight, CheckCircle2, FileText, MessageSquare, RotateCcw, Send, XCircle } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { type ActionConfig, ApprovalActionDialog } from './ApprovalActionDialog';
import {
  approveApproval,
  rejectApproval,
  returnModifyApproval,
  transferApproval,
  withdrawApproval
} from './approvalActions';
import { ApprovalInfoCard } from './ApprovalInfoCard';
import { ApprovalProgress } from './ApprovalProgress';
import { ApprovalStatusCard } from './ApprovalStatusCard';
import { ApprovalTimeline } from './ApprovalTimeline';
import { mockApprovalData, statusConfig, typeIcons } from './constants';
import type { ActionType, ApprovalData } from './types';

interface ApprovalActionButtonsProps {
  approvalComment: string;
  onCommentChange: (v: string) => void;
  onTrigger: (action: ActionType) => void;
}

const ApprovalActionButtons = ({ approvalComment, onCommentChange, onTrigger }: ApprovalActionButtonsProps) => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-base flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-primary" />
        審批操作
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">審批意見</p>
        <Textarea
          placeholder="請輸入審批意見（選填）..."
          value={approvalComment}
          onChange={e => onCommentChange(e.target.value)}
          rows={3}
        />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button className="bg-success hover:bg-success/90 text-success-foreground" onClick={() => onTrigger('approve')}>
          <CheckCircle2 className="h-4 w-4 mr-1" />
          核准
        </Button>
        <Button variant="destructive" onClick={() => onTrigger('reject')}>
          <XCircle className="h-4 w-4 mr-1" />
          駁回
        </Button>
        <Button variant="outline" onClick={() => onTrigger('transfer')}>
          <Send className="h-4 w-4 mr-1" />
          轉簽
        </Button>
        <Button
          variant="outline"
          className="text-warning border-warning/30 hover:bg-warning/5"
          onClick={() => onTrigger('returnModify')}
        >
          <ArrowRight className="h-4 w-4 mr-1" />
          退回修改
        </Button>
      </div>
    </CardContent>
  </Card>
);

const NotFoundView = ({ onBack }: { onBack: () => void }) => (
  <div className="flex flex-col items-center justify-center py-20">
    <FileText className="h-12 w-12 text-muted-foreground mb-4" />
    <p className="text-muted-foreground">找不到該審批記錄</p>
    <Button variant="outline" className="mt-4" onClick={onBack}>
      <ArrowLeft className="h-4 w-4 mr-2" />
      返回審批管理
    </Button>
  </div>
);

const buildActionConfigs = (
  data: ApprovalData,
  handlers: Record<Exclude<ActionType, null>, () => void>
): Record<string, ActionConfig> => ({
  approve: {
    title: '確認核准',
    desc: `確定要核准 ${data.applicant} 的${data.type}嗎？`,
    btnLabel: '確認核准',
    btnClass: 'bg-success hover:bg-success/90 text-success-foreground',
    handler: handlers.approve
  },
  reject: {
    title: '確認駁回',
    desc: `確定要駁回 ${data.applicant} 的${data.type}嗎？駁回後申請流程將終止。`,
    btnLabel: '確認駁回',
    btnClass: 'bg-destructive hover:bg-destructive/90 text-destructive-foreground',
    handler: handlers.reject
  },
  transfer: {
    title: '轉簽審批',
    desc: '將此申請轉交給其他審批人處理。',
    btnLabel: '確認轉簽',
    btnClass: '',
    handler: handlers.transfer
  },
  withdraw: {
    title: '確認撤回',
    desc: `確定要撤回申請 ${data.code}？撤回後需重新提交。`,
    btnLabel: '確認撤回',
    btnClass: 'bg-destructive hover:bg-destructive/90 text-destructive-foreground',
    handler: handlers.withdraw
  },
  returnModify: {
    title: '退回修改',
    desc: '將申請退回給申請人修改，修改後可重新提交。',
    btnLabel: '確認退回',
    btnClass: 'bg-warning hover:bg-warning/90 text-warning-foreground',
    handler: handlers.returnModify
  }
});

export default function ApprovalDetail() {
  const { approvalId } = useParams();
  const navigate = useNavigate();
  const [approvalComment, setApprovalComment] = useState('');
  const [actionDialog, setActionDialog] = useState<ActionType>(null);
  const [transferTo, setTransferTo] = useState('');
  const [data, setData] = useState<ApprovalData | null>(() =>
    approvalId ? mockApprovalData[approvalId] || null : null
  );

  if (!data) {
    return <NotFoundView onBack={() => navigate('/attendance/approval')} />;
  }

  const sc = statusConfig[data.status];
  const StatusIcon = sc.icon;
  const TypeIcon = typeIcons[data.type] || FileText;
  const isActionable = data.status === '待審';
  const currentStepIndex = data.steps.findIndex(s => s.status === 'current');

  const closeDialog = () => {
    setActionDialog(null);
    setTransferTo('');
    setApprovalComment('');
  };

  const handleApprove = () => {
    if (currentStepIndex < 0) return;
    setData(approveApproval(data, currentStepIndex, approvalComment));
    toast.success(`已核准申請 ${data.code}，流程已推進至下一節點`);
    closeDialog();
  };

  const handleReject = () => {
    if (currentStepIndex < 0) return;
    setData(rejectApproval(data, currentStepIndex, approvalComment));
    toast.error(`已駁回申請 ${data.code}`);
    closeDialog();
  };

  const handleTransfer = () => {
    if (!transferTo.trim()) {
      toast.error('請選擇轉簽對象');
      return;
    }
    if (currentStepIndex < 0) return;
    setData(transferApproval(data, currentStepIndex, transferTo, approvalComment));
    toast.success(`已轉簽至 ${transferTo}`);
    closeDialog();
  };

  const handleWithdraw = () => {
    setData(withdrawApproval(data, approvalComment));
    toast.success(`已撤回申請 ${data.code}`);
    closeDialog();
  };

  const handleReturnModify = () => {
    if (currentStepIndex < 0) return;
    setData(returnModifyApproval(data, currentStepIndex, approvalComment));
    toast.info(`已退回 ${data.applicant} 修改`);
    closeDialog();
  };

  const actionConfigs = buildActionConfigs(data, {
    approve: handleApprove,
    reject: handleReject,
    transfer: handleTransfer,
    withdraw: handleWithdraw,
    returnModify: handleReturnModify
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/attendance/approval')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              審批詳情
              <span className="text-lg font-mono text-muted-foreground">{data.code}</span>
            </h1>
            <p className="text-muted-foreground mt-0.5 text-sm">提交於 {data.submitTime}</p>
          </div>
        </div>
        <Badge className={`${sc.color} border text-sm px-3 py-1`}>
          <StatusIcon className="h-4 w-4 mr-1" />
          {sc.label}
        </Badge>
      </div>

      <ApprovalProgress data={data} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ApprovalInfoCard data={data} TypeIcon={TypeIcon} />

          {isActionable && (
            <ApprovalActionButtons
              approvalComment={approvalComment}
              onCommentChange={setApprovalComment}
              onTrigger={setActionDialog}
            />
          )}

          {isActionable && (
            <div className="flex justify-end">
              <Button
                variant="outline"
                className="text-destructive border-destructive/30 hover:bg-destructive/5"
                onClick={() => setActionDialog('withdraw')}
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                撤回申請
              </Button>
            </div>
          )}

          {!isActionable && data.status !== '草稿' && (
            <ApprovalStatusCard status={data.status} StatusIcon={StatusIcon} />
          )}
        </div>

        <div className="space-y-6">
          <ApprovalTimeline steps={data.steps} />
        </div>
      </div>

      <ApprovalActionDialog
        data={data}
        dialog={actionDialog}
        actionConfigs={actionConfigs}
        currentStepIndex={currentStepIndex}
        transferTo={transferTo}
        approvalComment={approvalComment}
        onClose={closeDialog}
        onCommentChange={setApprovalComment}
        onTransferToChange={setTransferTo}
      />
    </div>
  );
}
