import request from "@/lib/request";
import type { ApiResult, PageResult } from "@/api/employee";

/** 申请类型码 → 文案（后端 ApprovalTypeEnum） */
export const APPROVAL_TYPE_TEXT: Record<number, string> = {
  1: "請假申請",
  2: "報銷申請",
  3: "加班申請",
  4: "出差申請",
  5: "離職申請",
  6: "其他",
  7: "補卡申請",
  8: "薪資發放",
};

/** 审批人类型码 → 文案（后端 ApproverTypeEnum） */
export const APPROVER_TYPE_TEXT: Record<number, string> = {
  1: "直屬主管",
  2: "部門主管",
  3: "指定職位",
  4: "指定人員",
};

/** 超时处理码 → 文案 */
export const TIMEOUT_ACTION_TEXT: Record<number, string> = {
  1: "自動提醒",
  2: "自動通過",
  3: "自動轉簽",
  4: "自動駁回",
};

/** 适用范围 */
export const SCOPE_ALL = 1;
export const SCOPE_DEPARTMENT = 2;

/** 条件（层级触发条件 / 提交校验规则 共用） */
export interface Condition {
  /** days.天數 / hours.時數 / amount.金額 / subType.子類型 */
  field: string;
  /** gt/gte/lt/lte/eq/ne */
  op: string;
  value: number | string;
}

/** 审批层级（对齐后端 ApprovalRuleLevelVO） */
export interface ApprovalRuleLevel {
  id?: number;
  levelNo?: number;
  name: string;
  approverType: number;
  approverTypeName?: string;
  positionId?: number;
  employeeId?: number;
  /** 审批人展示文案：自動匹配 / 職位名 / 員工名 */
  approver?: string;
  conditions?: Condition | null;
  conditionText?: string;
  signType?: number;
}

/** 审批规则（对齐后端 ApprovalRuleVO；levels 仅详情返回） */
export interface ApprovalRule {
  id: number;
  name: string;
  type: number;
  typeName?: string;
  scopeType: number;
  departmentId?: number;
  applyScope?: string;
  description?: string;
  levelCount?: number;
  conditionsText?: string;
  slaHours?: number;
  timeoutAction?: number;
  allowWithdraw?: boolean;
  notifyApplicant?: boolean;
  notifyNextApprover?: boolean;
  statusCode?: number;
  enabled?: boolean;
  creator?: string;
  createdAt?: string;
  updatedAt?: string;
  levels?: ApprovalRuleLevel[];
}

/** 规则新增/编辑入参（levels 全量覆盖，数组顺序即第1..N级） */
export interface ApprovalRuleSaveParams {
  id?: number;
  name: string;
  type: number;
  scopeType: number;
  departmentId?: number;
  description?: string;
  slaHours?: number;
  timeoutAction?: number;
  allowWithdraw?: boolean;
  notifyApplicant?: boolean;
  notifyNextApprover?: boolean;
  status?: number;
  levels: {
    name: string;
    approverType: number;
    positionId?: number;
    employeeId?: number;
    conditions?: Condition | null;
    signType?: number;
  }[];
}

/** 规则查询参数 */
export interface ApprovalRuleQuery {
  keyword?: string;
  type?: number;
  scopeType?: number;
  status?: number;
}

/** 查询审批规则列表 */
export function getRuleList(params?: ApprovalRuleQuery) {
  return request.get<any, ApiResult<ApprovalRule[]>>("approval/rule/list", { params });
}

/** 查询审批规则详情（含层级） */
export function getRuleById(id: number) {
  return request.get<any, ApiResult<ApprovalRule>>("approval/rule/getById", { params: { id } });
}

/** 新增/编辑审批规则 */
export function saveRule(data: ApprovalRuleSaveParams) {
  return request.post<any, ApiResult<boolean>>("approval/rule/submit", data);
}

/** 删除审批规则 */
export function deleteRule(id: number) {
  return request.post<any, ApiResult<boolean>>("approval/rule/delete", null, { params: { id } });
}

/** 启用/停用审批规则（status 1启用 2停用） */
export function changeRuleStatus(id: number, status: number) {
  return request.post<any, ApiResult<boolean>>("approval/rule/status", null, { params: { id, status } });
}

/* ===================== 申请单（提交/审批/查询） ===================== */

/** 单据状态码 → 文案（后端 ApprovalStatusEnum） */
export const APPROVAL_STATUS_TEXT: Record<number, string> = {
  1: "待審",
  2: "審批中",
  3: "已通過",
  4: "已拒絕",
  5: "已撤回",
};

/** 节点状态码 → 文案（后端 ApprovalNodeStatusEnum） */
export const NODE_STATUS_TEXT: Record<number, string> = {
  1: "待審",
  2: "已通過",
  3: "已拒絕",
  4: "已跳過",
};

/** 操作码 → 文案（后端 ApprovalActionEnum） */
export const ACTION_TEXT: Record<number, string> = {
  1: "同意",
  2: "拒絕",
  3: "轉簽",
  4: "撤回",
  5: "加簽",
};

/** 审批节点（对齐后端 ApprovalNodeVO） */
export interface ApprovalNode {
  id: number;
  levelNo: number;
  name: string;
  approverId?: number;
  approverName?: string;
  statusCode: number;
  status?: string;
  /** 是否为当前待处理节点 */
  current?: boolean;
  approvedAt?: string;
  comment?: string;
  dueAt?: string;
}

/** 审批操作流水（对齐后端 ApprovalHistoryVO） */
export interface ApprovalHistory {
  id: number;
  node?: string;
  approverId?: number;
  approverName?: string;
  action: number;
  actionName?: string;
  comment?: string;
  createdAt?: string;
}

/** 审批单（对齐后端 ApprovalVO；payload/attachments/nodes/history 仅详情返回） */
export interface Approval {
  id: number;
  code: string;
  type: number;
  typeName?: string;
  subType?: string;
  applicantId?: number;
  applicantName?: string;
  departmentName?: string;
  summary?: string;
  currentNode?: string;
  currentLevel?: number;
  statusCode: number;
  status?: string;
  submittedAt?: string;
  /** 当前登录者是否可撤回此单 */
  canWithdraw?: boolean;
  /** 当前登录者是否可审批此单 */
  canApprove?: boolean;
  payload?: Record<string, any>;
  attachments?: string[];
  nodes?: ApprovalNode[];
  history?: ApprovalHistory[];
}

/** 提交申请单入参 */
export interface ApprovalSubmitParams {
  type: number;
  subType?: string;
  summary?: string;
  /** 表单数据：days/hours/amount 等键参与条件判定 */
  payload?: Record<string, any>;
  attachments?: string[];
}

/** 提交申请单 */
export function submitApproval(data: ApprovalSubmitParams) {
  return request.post<any, ApiResult<Approval>>("approval/submit", data);
}

/** 通用文件上传（返回可访问 URL），供审批附件/请假证明用 */
export function uploadAttachment(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return request.post<any, ApiResult<{ url: string; objectName: string; originalFilename: string }>>(
    "minio/upload", formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
}

/** 我的申请 */
export function getMyApplications(status?: number) {
  return request.get<any, ApiResult<Approval[]>>("approval/my", { params: { status } });
}

/** 我的待审批 */
export function getMyPending() {
  return request.get<any, ApiResult<Approval[]>>("approval/pending");
}

/** 全部申请单分页（HR 端） */
export function getApprovalList(params?: {
  current?: number;
  size?: number;
  type?: number;
  status?: number;
  keyword?: string;
}) {
  return request.get<any, ApiResult<PageResult<Approval>>>("approval/list", { params });
}

/** 单据状态统计行（对齐后端 ApprovalStatusCountVO） */
export interface ApprovalStatusCount {
  /** 状态码 1待審 2審批中 3已通過 4已拒絕 5已撤回 */
  status: number;
  cnt: number;
}

/** 单据状态统计（全量，不受列表分页/筛选影响） */
export function getApprovalStatusCount() {
  return request.get<any, ApiResult<ApprovalStatusCount[]>>("approval/statusCount");
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

/** 转签：把当前节点转交他人（节点仍停留在同级，仅换审批人） */
export function transferApproval(approvalId: number, toEmployeeId: number, comment?: string) {
  return request.post<any, ApiResult<boolean>>("approval/transfer", { approvalId, toEmployeeId, comment });
}

/** 撤回 */
export function withdrawApproval(id: number) {
  return request.post<any, ApiResult<boolean>>("approval/withdraw", null, { params: { id } });
}
