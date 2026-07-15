/** 审批状态流转逻辑（严格移植 hr-pc-manager ApprovalDetail/approvalActions.ts） */

type ApprovalDetail = Api.Attendance.ApprovalDetail;
type ApprovalStep = Api.Attendance.ApprovalStep;

const pad = (n: number) => String(n).padStart(2, '0');

const now = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const isFinalNode = (steps: ApprovalStep[], idx: number) => idx === steps.length - 1;

export function approveApproval(data: ApprovalDetail, currentStepIndex: number, comment: string): ApprovalDetail {
  const steps = [...data.steps];
  steps[currentStepIndex] = {
    ...steps[currentStepIndex],
    action: 'approve',
    comment: comment || '同意',
    status: 'completed',
    time: now()
  };

  const nextIndex = currentStepIndex + 1;
  if (nextIndex >= steps.length) {
    return { ...data, steps };
  }

  if (isFinalNode(steps, nextIndex)) {
    steps[nextIndex] = { ...steps[nextIndex], action: 'complete', status: 'completed', time: now() };
    return { ...data, status: 'approved', steps };
  }

  steps[nextIndex] = { ...steps[nextIndex], status: 'current' };
  return { ...data, steps };
}

export function rejectApproval(data: ApprovalDetail, currentStepIndex: number, comment: string): ApprovalDetail {
  const steps = [...data.steps];
  steps[currentStepIndex] = {
    ...steps[currentStepIndex],
    action: 'reject',
    comment: comment || '不同意',
    status: 'rejected',
    time: now()
  };
  return { ...data, status: 'rejected', steps };
}

// oxlint-disable-next-line max-params
export function transferApproval(
  data: ApprovalDetail,
  currentStepIndex: number,
  transferTo: string,
  comment: string
): ApprovalDetail {
  const steps = [...data.steps];
  const noteSuffix = `轉簽至 ${transferTo}`;
  steps[currentStepIndex] = {
    ...steps[currentStepIndex],
    action: 'transfer',
    comment: comment ? `${comment} — ${noteSuffix}` : noteSuffix,
    status: 'completed',
    time: now()
  };
  const transferStep: ApprovalStep = {
    approver: transferTo,
    id: Date.now(),
    nodeName: `${transferTo} 審批`,
    role: '轉簽審批人',
    status: 'current'
  };
  steps.splice(currentStepIndex + 1, 0, transferStep);
  return { ...data, steps };
}

export function withdrawApproval(data: ApprovalDetail, comment: string): ApprovalDetail {
  const steps = data.steps.map(step =>
    step.status === 'current' || step.status === 'pending' ? { ...step, status: 'pending' as const } : step
  );
  steps.push({
    action: 'withdraw',
    approver: data.applicant,
    comment: comment || '申請人主動撤回',
    id: Date.now(),
    nodeName: '申請人撤回',
    role: '申請人',
    status: 'completed',
    time: now()
  });
  return { ...data, status: 'withdrawn', steps };
}

export function returnModifyApproval(data: ApprovalDetail, currentStepIndex: number, comment: string): ApprovalDetail {
  const steps = [...data.steps];
  steps[currentStepIndex] = {
    ...steps[currentStepIndex],
    action: 'returnModify',
    comment: comment || '請修改後重新提交',
    status: 'completed',
    time: now()
  };
  steps.push({
    approver: data.applicant,
    id: Date.now(),
    nodeName: '退回修改',
    role: '申請人',
    status: 'current'
  });
  return { ...data, steps };
}
