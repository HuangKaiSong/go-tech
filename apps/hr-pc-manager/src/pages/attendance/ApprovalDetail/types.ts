export type ApprovalStatus = '待審' | '撤回' | '草稿' | '通過' | '駁回';

export type StepStatus = 'completed' | 'current' | 'pending' | 'rejected';

export type ActionType = 'approve' | 'reject' | 'transfer' | 'withdraw' | 'returnModify' | null;

export interface ApprovalStep {
  action?: string;
  approver: string;
  comment?: string;
  id: number;
  nodeName: string;
  role: string;
  status: StepStatus;
  time?: string;
}

export interface ApprovalData {
  applicant: string;
  attachments: string[];
  code: string;
  department: string;
  details: Record<string, string>;
  position: string;
  status: ApprovalStatus;
  steps: ApprovalStep[];
  submitTime: string;
  subType?: string;
  summary: string;
  type: string;
}
