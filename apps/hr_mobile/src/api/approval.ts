import request from "@/lib/request";
import type { ApiResult } from "@/api/auth";

/** 表单类型键 → 后端申请类型码（后端 ApprovalTypeEnum） */
export const TYPE_CODE = {
  leave: 1,
  expense: 2,
  overtime: 3,
  trip: 4,
  resign: 5,
  supplement: 7,
} as const;

export type ApplicationTypeKey = keyof typeof TYPE_CODE;

/** 申请类型码 → 文案 */
export const APPROVAL_TYPE_TEXT: Record<number, string> = {
  1: "請假申請",
  2: "報銷申請",
  3: "加班申請",
  4: "出差申請",
  5: "離職申請",
  6: "其他",
  7: "補卡申請",
};

/** 单据状态码 → 文案（后端 ApprovalStatusEnum） */
export const APPROVAL_STATUS_TEXT: Record<number, string> = {
  1: "待審",
  2: "審批中",
  3: "已通過",
  4: "已拒絕",
  5: "已撤回",
};

/** 单据状态码 → 手机端徽章配色 */
export const APPROVAL_STATUS_COLOR: Record<number, string> = {
  1: "text-warning bg-warning/10",
  2: "text-warning bg-warning/10",
  3: "text-success bg-success/10",
  4: "text-destructive bg-destructive/10",
  5: "text-muted-foreground bg-muted",
};

/** 节点状态码 → 文案（后端 ApprovalNodeStatusEnum） */
export const NODE_STATUS_TEXT: Record<number, string> = {
  1: "待審",
  2: "已通過",
  3: "已拒絕",
  4: "已跳過",
};

/** 审批节点（对齐后端 ApprovalNodeVO） */
export interface ApprovalNode {
  approvedAt?: string;
  approverId?: number;
  approverName?: string;
  comment?: string;
  /** 是否为当前待处理节点 */
  current?: boolean;
  dueAt?: string;
  id: number;
  levelNo: number;
  name: string;
  status?: string;
  statusCode: number;
}

/** 审批操作流水（对齐后端 ApprovalHistoryVO） */
export interface ApprovalHistory {
  action: number;
  actionName?: string;
  approverId?: number;
  approverName?: string;
  comment?: string;
  createdAt?: string;
  id: number;
  node?: string;
}

/** 审批单（对齐后端 ApprovalVO；payload/attachments/nodes/history 仅详情返回） */
export interface Approval {
  applicantId?: number;
  applicantName?: string;
  attachments?: string[];
  canApprove?: boolean;
  canWithdraw?: boolean;
  code: string;
  currentLevel?: number;
  currentNode?: string;
  departmentName?: string;
  history?: ApprovalHistory[];
  id: number;
  nodes?: ApprovalNode[];
  payload?: Record<string, any>;
  status?: string;
  statusCode: number;
  submittedAt?: string;
  subType?: string;
  summary?: string;
  type: number;
  typeName?: string;
}

/** 提交申请单入参 */
export interface ApprovalSubmitParams {
  attachments?: string[];
  /** 表单数据：days/hours/amount 等键参与规则条件判定 */
  payload?: Record<string, any>;
  subType?: string;
  summary?: string;
  type: number;
}

/** 附件上传返回（对齐后端 MinioUploadVO） */
export interface UploadResult {
  objectName: string;
  originalFilename: string;
  url: string;
}

/** 上传申请单附件（单据尚未落库，先拿地址，提交时随 attachments 带上） */
export function uploadAttachment(file: File) {
  const form = new FormData();
  form.append("file", file);
  return request.post<any, ApiResult<UploadResult>>("approval/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
    // 附件走流量，比普通接口慢，放宽超时
    timeout: 60000,
  });
}

/** 提交申请单 */
export function submitApproval(data: ApprovalSubmitParams) {
  return request.post<any, ApiResult<Approval>>("approval/submit", data);
}

/** 我的申请（含 payload；可按类型/状态筛选） */
export function getMyApplications(params?: { status?: number; type?: number }) {
  return request.get<any, ApiResult<Approval[]>>("approval/my", { params });
}

/** 补卡时段（approvals.sub_type） */
export const SUPPLEMENT_CLOCK_IN = "上班打卡";
export const SUPPLEMENT_CLOCK_OUT = "下班打卡";
export const SUPPLEMENT_BOTH = "上下班皆漏";

/** 我的待审批 */
export function getMyPending() {
  return request.get<any, ApiResult<Approval[]>>("approval/pending");
}

/** 我已审核（我处理过的单据） */
export function getMyReviewed() {
  return request.get<any, ApiResult<Approval[]>>("approval/reviewed");
}

/** 单据详情（含审批链与流水） */
export function getApprovalById(id: number) {
  return request.get<any, ApiResult<Approval>>("approval/getById", { params: { id } });
}

/** 同意 */
export function approveApproval(approvalId: number, comment?: string) {
  return request.post<any, ApiResult<boolean>>("approval/approve", { approvalId, comment });
}

/** 拒绝 */
export function rejectApproval(approvalId: number, comment?: string) {
  return request.post<any, ApiResult<boolean>>("approval/reject", { approvalId, comment });
}

/** 撤回 */
export function withdrawApproval(id: number) {
  return request.post<any, ApiResult<boolean>>("approval/withdraw", null, { params: { id } });
}
