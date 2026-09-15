import request from '@/lib/request';

/** 員工資料分頁查詢參數 */
export interface EmployeePageParams {
  current?: number;
  department?: string;
  keyword?: string;
  size?: number;
  /** 狀態碼，對齊後端 EmployeeStatusEnum：0已邀請待填 1待HR完善 2在職 3休假中 4離職 */
  status?: number;
}

/** 員工資料 */
export interface Employee {
  department?: string;
  employeeNo?: string;
  id?: number;
  joinDate?: string;
  name?: string;
  phone?: string;
  position?: string;
  status?: string;
}

/** 員工新增/修改入參（對齊後端 EmployeeSaveDTO） */
export interface EmployeeSavePayload {
  address?: string;
  adwOvertime?: number;
  alias?: string;
  bankAccount?: string;
  bankAccountHolder?: string;
  bankName?: string;
  /** 银行户口比例(%) */
  bankRatio?: number;
  baseSalary?: number;
  birthday?: string;
  contributionType?: string;
  dailyHours?: number;
  department?: string;
  departmentId?: number;
  education?: string;
  email?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  employerMpf?: string;
  employerOrso?: string;
  employmentType?: string;
  empMpfType?: string;
  englishName?: string;
  /** 是否弹性上班 0.否 1.是 */
  flexibleHours?: number;
  /** 性別 1男 2女 3其他 */
  gender?: number;
  idNumber?: string;
  joinDate?: string;
  major?: string;
  /** 婚姻狀況 1未婚 2已婚 3離婚 4喪偶 */
  maritalStatus?: number;
  monthlyHours?: number;
  mpfType?: string;
  name: string;
  nationality?: string;
  orsoEmployerRatio?: number;
  orsoEmpRatio?: number;
  orsoType?: string;
  /** 加班换销假 0.否 1.是 */
  overtimeLeave?: number;
  /** 是否兼职 0.否 1.是 */
  partTime?: number;
  paymentType?: string;
  payrollGroup?: string;
  phone?: string;
  position?: string;
  positionId?: number;
  probation?: number;
  probationPassDate?: string;
  /** 薪資方案id（關聯 payroll_plan） */
  salaryPlanId?: number;
  salaryType?: string;
  /** 打卡班次id（关联 attendance_schedule） */
  scheduleId?: number;
  school?: string;
  shiftCode?: string;
  shiftType?: string;
  storeCategory?: string;
  weeklyDays?: number;
}

/** 分頁返回結構 */
export interface PageResult<T> {
  current: number;
  pages: number;
  records: T[];
  size: number;
  total: number;
}

/** API 返回結構 */
export interface ApiResult<T> {
  code: number;
  data: T;
  message: string;
}

/** 登錄返回（含當前登入用戶信息，前端登入後緩存） */
export interface LoginResult {
  employeeNo?: string;
  /** 當前用戶擁有的權限碼集合（hr_menu.perms），前端據此控制頁簽可見與欄位編輯/脫敏 */
  perms?: string[];
  /** 可存取的菜單路由(path)集合，前端據此過濾靜態側邊欄 */
  routes?: string[];
  token: string;
  tokenHead: string;
  userId: number;
  userName: string;
}

/** 員工登錄（手機號 + 密碼） */
export function login(data: { password: string; phone: string }) {
  return request.post<any, ApiResult<LoginResult>>('employee/login', data);
}

/** 平台免密登錄：憑平台寫入 Redis 的一次性 code 換取登入態 */
export function loginByCode(code: string) {
  return request.get<any, ApiResult<LoginResult>>("employee/loginByCode", { params: { code } });
}

/** 分頁查詢員工列表 */
export function getEmployeeList(params: EmployeePageParams) {
  return request.get<any, ApiResult<PageResult<Employee>>>('employee/list', { params });
}

/** 員工狀態統計行（對齊後端 EmployeeStatusCountVO） */
export interface EmployeeStatusCount {
  /** 該狀態的員工數量 */
  cnt: number;
  /** 狀態碼 0~6 */
  status: number;
}

/** 導出員工列表（Excel），返回二進位 Blob */
export function exportEmployee(params: { department?: string; keyword?: string; status?: number }) {
  return request.get<any, { data: Blob; headers: Record<string, string> }>('employee/export', {
    params,
    responseType: 'blob'
  });
}

/** 統計各狀態員工數量（返回每個狀態一行） */
export function getEmployeeStatusCount() {
  return request.get<any, ApiResult<EmployeeStatusCount[]>>('employee/statusCount');
}

/** 員工詳情（對齊後端 EmployeeDetailVO，欄位多，鬆散定義） */
export interface EmployeeDetail {
  address?: string;
  adwOvertime?: number;
  bankAccount?: string;
  bankAccountHolder?: string;
  bankName?: string;
  bankRatio?: number;
  baseSalary?: number;
  birthday?: string;
  completeRemark?: string;
  contributionType?: string;
  dailyHours?: number;
  department?: string;
  departmentCode?: string;
  departmentId?: number;
  departmentSub?: string;
  education?: string;
  email?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  employeeNo?: string;
  employerMpf?: string;
  employerOrso?: string;
  employmentType?: string;
  empMpfType?: string;
  englishName?: string;
  flexibleHours?: boolean;
  gender?: string;
  hrOwnerId?: number;
  hrOwnerName?: string;
  id?: string;
  /** 證件影本地址（員工自助填寫時上傳） */
  idCardUrl?: string;
  idNumber?: string;
  joinDate?: string;
  leaveCategory?: string;
  leaveGroup?: string;
  major?: string;
  managerId?: number;
  managerName?: string;
  maritalStatus?: string;
  monthlyHours?: number;
  mpfType?: string;
  name?: string;
  nationality?: string;
  orsoEmployerRatio?: number;
  orsoEmpRatio?: number;
  orsoType?: string;
  overtimeLeave?: boolean;
  partTime?: boolean;
  paymentType?: string;
  payrollGroup?: string;
  phone?: string;
  position?: string;
  positionCode?: string;
  positionGroup?: string;
  positionId?: number;
  probation?: number;
  probationPassDate?: string;
  salaryPlanId?: number;
  salaryType?: string;
  scheduleId?: number;
  school?: string;
  shiftCode?: string;
  shiftType?: string;
  status?: string;
  statusCode?: number;
  storeCategory?: string;
  weeklyDays?: number;
}

/** 根據 id 查詢員工詳情 */
export function getEmployeeById(id: number) {
  return request.get<any, ApiResult<EmployeeDetail>>('employee/getById', { params: { id } });
}

/** 新增或修改員工 */
export function submitEmployee(data: EmployeeSavePayload) {
  return request.post<any, ApiResult<boolean>>('employee/submit', data);
}

/** 員工編輯入參（對齊後端 EmployeeUpdateDTO，id 必填，僅傳需要修改的欄位） */
export interface EmployeeUpdatePayload {
  address?: string;
  adwOvertime?: number;
  bankAccount?: string;
  bankAccountHolder?: string;
  bankName?: string;
  bankRatio?: number;
  baseSalary?: number;
  birthday?: string;
  completeRemark?: string;
  contributionType?: string;
  dailyHours?: number;
  department?: string;
  departmentId?: number;
  education?: string;
  email?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  employerMpf?: string;
  employerOrso?: string;
  employmentType?: string;
  empMpfType?: string;
  englishName?: string;
  flexibleHours?: number;
  gender?: number;
  hrOwnerId?: number;
  hrOwnerName?: string;
  id: number;
  idNumber?: string;
  joinDate?: string;
  leaveCategory?: string;
  major?: string;
  managerId?: number;
  managerName?: string;
  maritalStatus?: number;
  monthlyHours?: number;
  mpfType?: string;
  name?: string;
  nationality?: string;
  orsoEmployerRatio?: number;
  orsoEmpRatio?: number;
  orsoType?: string;
  overtimeLeave?: number;
  partTime?: number;
  paymentType?: string;
  payrollGroup?: string;
  phone?: string;
  position?: string;
  positionId?: number;
  probation?: number;
  probationPassDate?: string;
  salaryPlanId?: number;
  salaryType?: string;
  scheduleId?: number;
  school?: string;
  shiftCode?: string;
  shiftType?: string;
  status?: number;
  storeCategory?: string;
  weeklyDays?: number;
}

/** 編輯員工（對應詳情頁可編輯欄位） */
export function updateEmployee(data: EmployeeUpdatePayload) {
  return request.post<any, ApiResult<boolean>>('employee/update', data);
}

/** 員工下拉選項（直屬主管選擇用） */
export interface EmployeeOption {
  employeeNo?: string;
  id: number;
  name: string;
}

/** 查詢在職員工下拉選項 */
export function getActiveEmployeeOptions() {
  return request.get<any, ApiResult<EmployeeOption[]>>('employee/activeOptions');
}

/** 發送入職邀請入參（HR 僅填姓名/聯絡方式/預定入職日） */
export interface EmployeeInvitePayload {
  email?: string;
  joinDate?: string;
  name: string;
  phone?: string;
}

/** 發送入職邀請返回（含一次性填寫連結 token 與相對路徑） */
export interface EmployeeInviteResult {
  employeeId: number;
  /** 填寫頁相對路徑，前端拼接 window.location.origin 得到完整連結 */
  invitePath: string;
  token: string;
}

/** 發送入職邀請（HR 登入態） */
export function inviteEmployee(data: EmployeeInvitePayload) {
  return request.post<any, ApiResult<EmployeeInviteResult>>('employee/invite', data);
}

/** 重發入職邀請（HR 登入態）：對已邀請待填員工重新生成填寫連結 */
export function resendInvite(id: number) {
  return request.post<any, ApiResult<EmployeeInviteResult>>('employee/invite/resend', null, { params: { id } });
}

/** 自助填寫頁回顯信息（免登入） */
export interface EmployeeInviteInfo {
  email?: string;
  /** 是否可填寫（僅狀態0可填） */
  fillable?: boolean;
  joinDate?: string;
  name?: string;
  phone?: string;
  statusCode?: number;
}

/** 根據邀請 token 取回顯信息（免登入，白名單接口） */
export function getInviteInfo(token: string) {
  return request.get<any, ApiResult<EmployeeInviteInfo>>('employee/invite/info', { params: { token } });
}

/** 員工自助填寫提交入參（免登入，含 token） */
export interface EmployeeInviteSubmitPayload {
  address?: string;
  alias?: string;
  bankAccount?: string;
  bankAccountHolder?: string;
  bankName?: string;
  birthday?: string;
  education?: string;
  email?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  englishName?: string;
  gender?: number;
  /** 證件影本地址（先調 uploadInviteFile 上傳得到 URL） */
  idCardUrl?: string;
  idNumber?: string;
  major?: string;
  maritalStatus?: number;
  name: string;
  nationality?: string;
  phone?: string;
  school?: string;
  token: string;
}

/** 員工自助填寫提交（免登入，白名單接口） */
export function submitInvite(data: EmployeeInviteSubmitPayload) {
  return request.post<any, ApiResult<boolean>>('employee/invite/submit', data);
}

/** 自助填寫頁上傳證件影本（免登入，憑 token 校驗後上傳，返回文件 URL） */
export function uploadInviteFile(token: string, file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return request.post<any, ApiResult<{ objectName: string; originalFilename: string; url: string }>>(
    'employee/invite/upload',
    formData,
    { params: { token }, headers: { 'Content-Type': 'multipart/form-data' } }
  );
}

/** 刪除員工 */
export function removeEmployee(id: number) {
  return request.post<any, ApiResult<boolean>>('employee/remove', null, { params: { id } });
}
