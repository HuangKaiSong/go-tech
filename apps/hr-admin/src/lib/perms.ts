/**
 * 員工模組權限碼（對應 hr_menu.perms）。職位即權限單元，登入時隨 EmployeeLoginVO.perms 返回並緩存，經 auth.ts 的 hasPerm() 判定。未提供權限集合（舊 session /
 * 未接權限後端） 時 hasPerm 一律放行，保證功能不被鎖死。
 *
 * 對應種子 SQL：F:\HR系统\员工详情页签职位权限_hr_menu种子.sql
 */
export const EMP_PERM = {
  // ===== 頁簽可見（員工詳情）=====
  TAB_PERSONAL: 'hr:emp:tab:personal', // 個人資料 頁簽
  TAB_ORG: 'hr:emp:tab:org', // 組織與工作 頁簽
  TAB_SALARY: 'hr:emp:tab:salary', // 薪資福利 頁簽
  // ===== 操作按鈕 =====
  EDIT: 'hr:emp:edit', // 員工詳情「編輯」按鈕
  ADD: 'hr:emp:add', // 員工列表「新增員工」按鈕
  IMPORT: 'hr:emp:import', // 員工列表「Excel 匯入」按鈕
  EXPORT: 'hr:emp:export', // 員工列表「匯出」按鈕
  ONBOARDING: 'hr:emp:onboarding', // 員工列表「辦理入職」按鈕
  OFFBOARDING: 'hr:emp:offboarding' // 員工列表「辦理離職」按鈕
} as const;

/**
 * 其餘功能菜單的操作按鈕權限碼（對應 hr_menu.perms，menu_type=2）。 種子
 * SQL：E:\javaProject\GithubProject\claude-code-pms\其余模块按钮_hr_menu种子.sql 用法：頁面 import 對應常量，用 hasPerm(X) 包住按鈕；未授權時
 * hasPerm 放行全部。
 */

/** 組織架構 > 部門管理 */
export const DEPT_PERM = {
  ADD: 'hr:dept:add',
  EDIT: 'hr:dept:edit',
  DELETE: 'hr:dept:delete'
} as const;

/** 組織架構 > 職位管理 */
export const POSITION_PERM = {
  ADD: 'hr:position:add',
  EDIT: 'hr:position:edit',
  DELETE: 'hr:position:delete',
  ASSIGN_MENU: 'hr:position:assignMenu'
} as const;

/** 行政管理 > 打卡管理（班次/規則/地點） */
export const CLOCKIN_PERM = {
  ADD: 'hr:clockin:add',
  EDIT: 'hr:clockin:edit',
  DELETE: 'hr:clockin:delete',
  TOGGLE: 'hr:clockin:toggle'
} as const;

/** 行政管理 > 打卡記錄 */
export const ATTENDANCE_PERM = {
  EXPORT: 'hr:attendance:export',
  SUPPLEMENT: 'hr:attendance:supplement'
} as const;

/** 行政管理 > 假期設定 */
export const LEAVE_PERM = {
  ADD: 'hr:leave:add',
  EDIT: 'hr:leave:edit',
  DELETE: 'hr:leave:delete',
  ADJUST: 'hr:leave:adjust'
} as const;

/** 行政管理 > 審批管理 */
export const APPROVAL_PERM = {
  APPROVE: 'hr:approval:approve',
  REJECT: 'hr:approval:reject',
  CONFIG: 'hr:approval:config'
} as const;

/** 薪資管理 */
export const PAYROLL_PERM = {
  PLAN_ADD: 'hr:payroll:plan:add',
  PLAN_EDIT: 'hr:payroll:plan:edit',
  PLAN_DELETE: 'hr:payroll:plan:delete',
  PLAN_TOGGLE: 'hr:payroll:plan:toggle',
  CALC_RUN: 'hr:payroll:calc:run',
  CALC_EDIT: 'hr:payroll:calc:edit',
  CALC_SUBMIT: 'hr:payroll:calc:submit',
  CALC_DELETE: 'hr:payroll:calc:delete',
  BONUS_ADD: 'hr:payroll:bonus:add',
  BONUS_EDIT: 'hr:payroll:bonus:edit',
  BONUS_DELETE: 'hr:payroll:bonus:delete',
  DIST_GENERATE: 'hr:payroll:distribute:generate',
  DIST_APPROVE: 'hr:payroll:distribute:approve',
  DIST_REJECT: 'hr:payroll:distribute:reject',
  DIST_EXECUTE: 'hr:payroll:distribute:execute',
  DIST_DELETE: 'hr:payroll:distribute:delete',
  SETTING_SAVE: 'hr:payroll:setting:save'
} as const;

/** 發展與績效 */
export const PERF_PERM = {
  PLAN_ADD: 'hr:perf:plan:add',
  PLAN_EDIT: 'hr:perf:plan:edit',
  PLAN_DELETE: 'hr:perf:plan:delete',
  PLAN_PUBLISH: 'hr:perf:plan:publish',
  EVAL_SUBMIT: 'hr:perf:eval:submit',
  EVAL_EXPORT: 'hr:perf:eval:export'
} as const;

/** 培訓管理 */
export const TRAINING_PERM = {
  PLAN_ADD: 'hr:training:plan:add',
  PLAN_EDIT: 'hr:training:plan:edit',
  PLAN_PUBLISH: 'hr:training:plan:publish',
  PLAN_DELETE: 'hr:training:plan:delete',
  PLAN_ASSIGN: 'hr:training:plan:assign',
  RECORD_ADD: 'hr:training:record:add',
  RECORD_EXPORT: 'hr:training:record:export'
} as const;

/** 分析與設定 > 消息通知（HR 群發管理台） */
export const NOTICE_PERM = {
  CREATE: 'hr:notice:create',
  SEND: 'hr:notice:send',
  DELETE: 'hr:notice:delete'
} as const;

/** 分析與設定 > 報表分析 */
export const REPORT_PERM = {
  EXPORT: 'hr:report:export'
} as const;

/** 分析與設定 > 菜單管理 */
export const MENU_PERM = {
  ADD: 'hr:menu:add',
  EDIT: 'hr:menu:edit',
  DELETE: 'hr:menu:delete'
} as const;

/** 分析與設定 > 系統管理 */
export const SYSTEM_PERM = {
  SAVE: 'hr:system:save'
} as const;
