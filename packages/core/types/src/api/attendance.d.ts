// oxlint-disable unicorn/require-module-specifiers
/**
 * 命名空间 Api.Attendance
 *
 * 后端 API 模块：考勤（打卡记录 / 打卡管理 / 审批）
 */
declare global {
  namespace Api.Attendance {
    /** 将查询表单字段转成可选且允许为空的接口查询参数。 */
    type NullableSearchRecord<T> = {
      [K in keyof T]?: T[K] | null;
    };

    /** 通用搜索参数 */
    type CommonSearchParams = Pick<Api.Common.PaginatingCommonParams, 'current' | 'size'>;

    /**
     * 考勤状态
     *
     * - normal: 正常
     * - late: 迟到
     * - early: 早退
     * - leave: 请假
     * - rest: 休息
     * - absent: 旷工
     */
    type AttendanceStatus = 'absent' | 'early' | 'late' | 'leave' | 'normal' | 'rest';

    /** 考勤记录 */
    interface AttendanceRecord {
      /** 上班打卡时间 */
      clockIn: string;
      /** 下班打卡时间 */
      clockOut: string;
      /** 考勤日期 */
      date: string;
      /** 所属部门 */
      department: string;
      /** 记录 ID */
      id: string;
      /** 员工姓名 */
      name: string;
      /** 考勤状态 */
      status: AttendanceStatus;
    }

    /** 考勤记录搜索参数 */
    type AttendanceRecordSearchParams = NullableSearchRecord<
      Pick<AttendanceRecord, 'department' | 'name' | 'status'> & { month?: string, year?: string } & CommonSearchParams
    >;

    /** 考勤记录列表 */
    type AttendanceRecordList = Api.Common.PaginatingQueryRecord<AttendanceRecord>;

    /**
     * 审批状态
     *
     * - pending: 待审
     * - approved: 通过
     * - rejected: 驳回
     * - withdrawn: 撤回
     * - draft: 草稿
     */
    type ApprovalStatus = 'approved' | 'draft' | 'pending' | 'rejected' | 'withdrawn';

    /**
     * 审批申请类型
     *
     * - leave: 请假申请
     * - expense: 报销申请
     * - overtime: 加班申请
     * - travel: 出差申请
     * - resignation: 离职申请
     */
    type ApprovalType = 'expense' | 'leave' | 'overtime' | 'resignation' | 'travel';

    /** 审批记录 */
    interface ApprovalRecord {
      /** 申请人 */
      applicant: string;
      /** 附件数量 */
      attachments: number;
      /** 申请编号 */
      code: string;
      /** 当前节点 */
      currentNode: string;
      /** 所属部门 */
      department: string;
      /** 记录 ID */
      id: string;
      /** 审批状态 */
      status: ApprovalStatus;
      /** 提交时间 */
      submitTime: string;
      /** 申请子类型 */
      subType?: string;
      /** 摘要 */
      summary: string;
      /** 申请类型 */
      type: ApprovalType;
    }

    /** 审批记录搜索参数 */
    type ApprovalSearchParams = NullableSearchRecord<
      Pick<ApprovalRecord, 'applicant' | 'status' | 'type'> & CommonSearchParams
    >;

    /** 审批记录列表 */
    type ApprovalRecordList = Api.Common.PaginatingQueryRecord<ApprovalRecord>;

    /**
     * 审批节点状态
     *
     * - completed: 已完成
     * - current: 进行中
     * - pending: 待处理
     * - rejected: 已驳回
     */
    type ApprovalStepStatus = 'completed' | 'current' | 'pending' | 'rejected';

    /**
     * 审批节点动作
     *
     * submit 提交 / approve 通过 / autoApprove 自动通过 / complete 完成 / reject 驳回 / withdraw 撤回 / transfer 转签 /
     * returnModify 退回修改
     */
    type ApprovalStepAction =
      | 'approve'
      | 'autoApprove'
      | 'complete'
      | 'reject'
      | 'returnModify'
      | 'submit'
      | 'transfer'
      | 'withdraw';

    /** 审批流程节点 */
    interface ApprovalStep {
      /** 节点动作 */
      action?: ApprovalStepAction;
      /** 审批人 */
      approver: string;
      /** 审批意见 */
      comment?: string;
      /** 节点 ID */
      id: number;
      /** 节点名称 */
      nodeName: string;
      /** 审批人角色 */
      role: string;
      /** 节点状态 */
      status: ApprovalStepStatus;
      /** 处理时间 */
      time?: string;
    }

    /** 审批详情 */
    interface ApprovalDetail {
      /** 申请人 */
      applicant: string;
      /** 附件列表 */
      attachments: string[];
      /** 申请编号 */
      code: string;
      /** 所属部门 */
      department: string;
      /** 明细字段（键值对） */
      details: Record<string, string>;
      /** 职位 */
      position: string;
      /** 审批状态 */
      status: ApprovalStatus;
      /** 审批流程节点 */
      steps: ApprovalStep[];
      /** 提交时间 */
      submitTime: string;
      /** 申请子类型 */
      subType?: string;
      /** 摘要 */
      summary: string;
      /** 申请类型 */
      type: ApprovalType;
    }

    /**
     * 待审紧急度
     *
     * - normal: 正常（<24h）
     * - urgent: 紧急（24-48h）
     * - overdue: 超时（>48h）
     */
    type ApprovalUrgency = 'normal' | 'overdue' | 'urgent';

    /** 待我审批记录 */
    interface PendingApproval {
      /** 申请人 */
      applicant: string;
      /** 申请编号 */
      code: string;
      /** 当前节点 */
      currentNode: string;
      /** 所属部门 */
      department: string;
      /** 记录 ID */
      id: string;
      /** 提交时间 */
      submitTime: string;
      /** 申请子类型 */
      subType?: string;
      /** 摘要 */
      summary: string;
      /** 申请类型 */
      type: ApprovalType;
      /** 紧急度 */
      urgency: ApprovalUrgency;
      /** 已等待小时数 */
      waitingHours: number;
    }

    /** 待我审批列表 */
    type PendingApprovalList = Api.Common.PaginatingQueryRecord<PendingApproval>;

    /** 审批规则 */
    interface ApprovalRule {
      /** 适用范围 */
      applyScope: string;
      /** 条件摘要 */
      conditions: string;
      /** 创建人 */
      creator: string;
      /** 是否启用 */
      enabled: boolean;
      /** 规则 ID */
      id: string;
      /** 审批层级 */
      levels: number;
      /** 规则名称 */
      name: string;
      /** 申请类型 */
      type: ApprovalType;
      /** 更新时间 */
      updatedAt: string;
    }

    /** 审批规则列表 */
    type ApprovalRuleList = Api.Common.PaginatingQueryRecord<ApprovalRule>;

    /**
     * 审批人类型
     *
     * directManager 直属主管 / role 指定角色 / person 指定人员 / departmentHead 部门主管
     */
    type ApproverType = 'departmentHead' | 'directManager' | 'person' | 'role';

    /**
     * 超时处理方式
     *
     * remind 自动提醒 / autoApprove 自动通过 / autoTransfer 自动转签 / autoReject 自动驳回 / remindEscalate 自动提醒并升级
     */
    type OvertimeHandling = 'autoApprove' | 'autoReject' | 'autoTransfer' | 'remind' | 'remindEscalate';

    /** 审批规则层级 */
    interface ApprovalRuleLevel {
      /** 审批人 */
      approver: string;
      /** 审批人类型 */
      approverType: ApproverType;
      /** 触发条件（选填） */
      condition?: string;
      /** 层级序号 */
      level: number;
      /** 节点名称 */
      name: string;
    }

    /** 审批规则条件 */
    interface ApprovalRuleCondition {
      /** 触发动作 */
      action: string;
      /** 条件字段 */
      label: string;
      /** 运算符 */
      operator: string;
      /** 条件值 */
      value: string;
    }

    /** 审批规则流程设置 */
    interface ApprovalRuleSettings {
      /** 允许撤回 */
      allowWithdraw: boolean;
      /** 自动审批 */
      autoApprove: boolean;
      /** 自动审批条件 */
      autoApproveCondition: string;
      /** 通知申请人 */
      notifyApplicant: boolean;
      /** 通知下一审批人 */
      notifyNextApprover: boolean;
      /** 超时处理 */
      overtimeAction: OvertimeHandling;
      /** 审批时限（小时） */
      timeLimit: number;
    }

    /** 审批规则详情 */
    interface ApprovalRuleDetail {
      /** 适用范围 */
      applyScope: string;
      /** 条件规则 */
      conditions: ApprovalRuleCondition[];
      /** 建立时间 */
      createdAt: string;
      /** 建立者 */
      creator: string;
      /** 规则描述 */
      description: string;
      /** 是否启用 */
      enabled: boolean;
      /** 规则 ID */
      id: string;
      /** 审批层级 */
      levels: ApprovalRuleLevel[];
      /** 规则名称 */
      name: string;
      /** 流程设置 */
      settings: ApprovalRuleSettings;
      /** 申请类型 */
      type: ApprovalType;
      /** 最后更新 */
      updatedAt: string;
    }

    /** 打卡地点 */
    interface ClockLocation {
      /** 详细地址 */
      address: string;
      /** 是否启用 */
      enabled: boolean;
      /** 地点 ID */
      id: string;
      /** 纬度 */
      lat: string;
      /** 经度 */
      lng: string;
      /** 地点名称 */
      name: string;
      /** 有效范围（公尺） */
      radius: number;
      /** 关联打卡规则 ID */
      ruleId: string;
      /** Wi-Fi SSID */
      wifiSSID: string;
    }

    /** 打卡地点列表 */
    type ClockLocationList = Api.Common.PaginatingQueryRecord<ClockLocation>;

    /**
     * 班次类型
     *
     * - fixed: 固定班
     * - flexible: 弹性班
     * - shift: 轮班制
     */
    type ScheduleType = 'fixed' | 'flexible' | 'shift';

    /** 班次时间 */
    interface ClockSchedule {
      /** 午休结束 */
      breakEnd: string;
      /** 午休开始 */
      breakStart: string;
      /** 早退宽限（分钟） */
      earlyLeaveGrace: number;
      /** 是否启用 */
      enabled: boolean;
      /** 班次 ID */
      id: string;
      /** 迟到宽限（分钟） */
      lateGrace: number;
      /** 班次名称 */
      name: string;
      /** 班次类型 */
      type: ScheduleType;
      /** 工作日（0=周日 … 6=周六） */
      workDays: number[];
      /** 下班时间 */
      workEnd: string;
      /** 上班时间 */
      workStart: string;
    }

    /** 班次时间列表 */
    type ClockScheduleList = Api.Common.PaginatingQueryRecord<ClockSchedule>;

    /** 打卡规则 */
    interface ClockRule {
      /** 允许的打卡方式 */
      allowMethods: string[];
      /** 是否允许远端打卡 */
      allowRemote: boolean;
      /** 补卡申请期限（天） */
      appealDeadlineDays: number;
      /** 是否启用 */
      enabled: boolean;
      /** 规则 ID */
      id: string;
      /** 是否允许补卡申请 */
      missedClockAllowAppeal: boolean;
      /** 规则名称 */
      name: string;
      /** 是否自动计算加班 */
      overtimeAuto: boolean;
      /** 最低加班时长（分钟） */
      overtimeMinMinutes: number;
      /** 远端打卡是否需审批 */
      remoteApproval: boolean;
      /** 打卡时是否需定位 */
      requireLocation: boolean;
      /** 打卡时是否需拍照 */
      requirePhoto: boolean;
    }

    /** 打卡规则列表 */
    type ClockRuleList = Api.Common.PaginatingQueryRecord<ClockRule>;

    /**
     * 加班审批状态
     *
     * - pending: 待审核
     * - approved: 已核准
     * - rejected: 已驳回
     */
    type OvertimeStatus = 'approved' | 'pending' | 'rejected';

    /** 加班记录 */
    interface OvertimeRecord {
      /** 加班日期 */
      date: string;
      /** 所属部门 */
      department: string;
      /** 加班时数 */
      hours: number;
      /** 记录 ID */
      id: string;
      /** 申请人 */
      name: string;
      /** 加班原因 */
      reason: string;
      /** 审批状态 */
      status: OvertimeStatus;
    }

    /** 加班记录搜索参数 */
    type OvertimeSearchParams = NullableSearchRecord<
      Pick<OvertimeRecord, 'department' | 'name' | 'status'> & CommonSearchParams
    >;

    /** 加班记录列表 */
    type OvertimeRecordList = Api.Common.PaginatingQueryRecord<OvertimeRecord>;

    /**
     * 请假审批状态
     *
     * - draft: 草稿
     * - pending: 待审核
     * - reviewing: 审核中
     * - approved: 已核准
     * - rejected: 已驳回
     * - withdrawn: 已撤回
     */
    type LeaveStatus = 'approved' | 'draft' | 'pending' | 'rejected' | 'reviewing' | 'withdrawn';

    /**
     * 请假类型
     *
     * annual 年假 / sick 病假 / personal 事假 / marriage 婚假 / maternity 产假 / paternity 陪产假 / bereavement 丧假 /
     * official 公假 / compensatory 补休
     */
    type LeaveType =
      | 'annual'
      | 'bereavement'
      | 'compensatory'
      | 'marriage'
      | 'maternity'
      | 'official'
      | 'paternity'
      | 'personal'
      | 'sick';

    /** 请假记录 */
    interface LeaveRecord {
      /** 申请人 */
      applicant: string;
      /** 申请编号 */
      code: string;
      /** 当前节点 */
      currentNode: string;
      /** 请假天数 */
      days: number;
      /** 所属部门 */
      department: string;
      /** 结束日期 */
      endDate: string;
      /** 记录 ID */
      id: string;
      /** 请假类型 */
      leaveType: LeaveType;
      /** 请假事由 */
      reason: string;
      /** 开始日期 */
      startDate: string;
      /** 审批状态 */
      status: LeaveStatus;
      /** 提交时间 */
      submitTime: string;
    }

    /** 请假记录搜索参数 */
    type LeaveSearchParams = NullableSearchRecord<
      Pick<LeaveRecord, 'applicant' | 'leaveType' | 'status'> & CommonSearchParams
    >;

    /** 请假记录列表 */
    type LeaveRecordList = Api.Common.PaginatingQueryRecord<LeaveRecord>;

    /** 请假详情 */
    interface LeaveDetail {
      /** 申请人 */
      applicant: string;
      /** 附件列表 */
      attachments: string[];
      /** 申请编号 */
      code: string;
      /** 请假天数 */
      days: number;
      /** 所属部门 */
      department: string;
      /** 结束日期 */
      endDate: string;
      /** 请假类型 */
      leaveType: LeaveType;
      /** 职位 */
      position: string;
      /** 请假事由 */
      reason: string;
      /** 开始日期 */
      startDate: string;
      /** 审批状态 */
      status: LeaveStatus;
      /** 审批流程节点 */
      steps: ApprovalStep[];
      /** 提交时间 */
      submitTime: string;
    }
  }
}

export { };
