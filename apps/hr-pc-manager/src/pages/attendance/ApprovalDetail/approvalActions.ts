import type { ApprovalData, ApprovalStep } from './types';

const pad = (n: number) => String(n).padStart(2, '0');
const now = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const isFinalNode = (steps: ApprovalStep[], idx: number) => idx === steps.length - 1;

export function approveApproval(data: ApprovalData, currentStepIndex: number, comment: string): ApprovalData {
  const steps = [...data.steps];
  steps[currentStepIndex] = {
    ...steps[currentStepIndex],
    status: 'completed',
    action: '通過',
    time: now(),
    comment: comment || '同意'
  };

  const nextIndex = currentStepIndex + 1;
  if (nextIndex >= steps.length) {
    return { ...data, steps };
  }

  if (isFinalNode(steps, nextIndex)) {
    steps[nextIndex] = { ...steps[nextIndex], status: 'completed', action: '完成', time: now() };
    return { ...data, steps, status: '通過' };
  }

  steps[nextIndex] = { ...steps[nextIndex], status: 'current' };
  return { ...data, steps };
}

export function rejectApproval(data: ApprovalData, currentStepIndex: number, comment: string): ApprovalData {
  const steps = [...data.steps];
  steps[currentStepIndex] = {
    ...steps[currentStepIndex],
    status: 'rejected',
    action: '駁回',
    time: now(),
    comment: comment || '不同意'
  };
  return { ...data, steps, status: '駁回' };
}

// oxlint-disable-next-line eslint/max-params
export function transferApproval(
  data: ApprovalData,
  currentStepIndex: number,
  transferTo: string,
  comment: string
): ApprovalData {
  const steps = [...data.steps];
  const noteSuffix = `轉簽至 ${transferTo}`;
  steps[currentStepIndex] = {
    ...steps[currentStepIndex],
    status: 'completed',
    action: '轉簽',
    time: now(),
    comment: comment ? `${comment} — ${noteSuffix}` : noteSuffix
  };
  const transferStep: ApprovalStep = {
    id: Date.now(),
    nodeName: `${transferTo} 審批`,
    approver: transferTo,
    role: '轉簽審批人',
    status: 'current'
  };
  steps.splice(currentStepIndex + 1, 0, transferStep);
  return { ...data, steps };
}

export function withdrawApproval(data: ApprovalData, comment: string): ApprovalData {
  const steps = data.steps.map(s =>
    s.status === 'current' || s.status === 'pending' ? { ...s, status: 'pending' as const } : s
  );
  steps.push({
    id: Date.now(),
    nodeName: '申請人撤回',
    approver: data.applicant,
    role: '申請人',
    status: 'completed',
    action: '撤回',
    time: now(),
    comment: comment || '申請人主動撤回'
  });
  return { ...data, steps, status: '撤回' };
}

export function returnModifyApproval(data: ApprovalData, currentStepIndex: number, comment: string): ApprovalData {
  const steps = [...data.steps];
  steps[currentStepIndex] = {
    ...steps[currentStepIndex],
    status: 'completed',
    action: '退回修改',
    time: now(),
    comment: comment || '請修改後重新提交'
  };
  steps.push({
    id: Date.now(),
    nodeName: '退回修改',
    approver: data.applicant,
    role: '申請人',
    status: 'current'
  });
  return { ...data, steps };
}
