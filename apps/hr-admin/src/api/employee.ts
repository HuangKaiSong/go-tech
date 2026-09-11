import request from "@/lib/request";

/** 員工資料分頁查詢參數 */
export interface EmployeePageParams {
  current?: number;
  size?: number;
  keyword?: string;
  department?: string;
  /** 狀態碼，對齊後端 EmployeeStatusEnum：0已邀請待填 1待HR完善 2在職 3休假中 4離職 */
  status?: number;
}

/** 員工資料 */
export interface Employee {
  id?: number;
  employeeNo?: string;
  name?: string;
  department?: string;
  position?: string;
  phone?: string;
  joinDate?: string;
  status?: string;
}

/** 員工新增/修改入參（對齊後端 EmployeeSaveDTO） */
export interface EmployeeSavePayload {
  name: string;
  englishName?: string;
  alias?: string;
  /** 性別 1男 2女 3其他 */
  gender?: number;
  birthday?: string;
  idNumber?: string;
  nationality?: string;
  /** 婚姻狀況 1未婚 2已婚 3離婚 4喪偶 */
  maritalStatus?: number;
  phone?: string;
  email?: string;
  address?: string;
  education?: string;
  school?: string;
  major?: string;
  emergencyContactName?: string;
  emergencyContactRelation?: string;
  emergencyContactPhone?: string;
  departmentId?: number;
  department?: string;
  positionId?: number;
  position?: string;
  employmentType?: string;
  joinDate?: string;
  probation?: number;
  probationPassDate?: string;
  /** 打卡班次id（关联 attendance_schedule） */
  scheduleId?: number;
  shiftType?: string;
  shiftCode?: string;
  salaryType?: string;
  baseSalary?: number;
  /** 薪資方案id（關聯 payroll_plan） */
  salaryPlanId?: number;
  paymentType?: string;
  payrollGroup?: string;
  storeCategory?: string;
  mpfType?: string;
  empMpfType?: string;
  contributionType?: string;
  orsoType?: string;
  adwOvertime?: number;
  /** 是否兼职 0.否 1.是 */
  partTime?: number;
  /** 是否弹性上班 0.否 1.是 */
  flexibleHours?: number;
  /** 加班换销假 0.否 1.是 */
  overtimeLeave?: number;
  /** 银行户口比例(%) */
  bankRatio?: number;
  dailyHours?: number;
  weeklyDays?: number;
  monthlyHours?: number;
  orsoEmpRatio?: number;
  orsoEmployerRatio?: number;
  employerMpf?: string;
  employerOrso?: string;
  bankName?: string;
  bankAccount?: string;
  bankAccountHolder?: string;
}

/** 分頁返回結構 */
export interface PageResult<T> {
  records: T[];
  total: number;
  size: number;
  current: number;
  pages: number;
}

/** API 返回結構 */
export interface ApiResult<T> {
  code: number;
  message: string;
  data: T;
}

/** 登錄返回（含當前登入用戶信息，前端登入後緩存） */
export interface LoginResult {
  token: string;
  tokenHead: string;
  userId: number;
  userName: string;
  employeeNo?: string;
  /** 可存取的菜單路由(path)集合，前端據此過濾靜態側邊欄 */
  routes?: string[];
  /** 當前用戶擁有的權限碼集合（hr_menu.perms），前端據此控制頁簽可見與欄位編輯/脫敏 */
  perms?: string[];
}

/** 員工登錄（手機號 + 密碼） */
export function login(data: { phone: string; password: string }) {
  return request.post<any, ApiResult<LoginResult>>("employee/login", data);
}

/** 分頁查詢員工列表 */
export function getEmployeeList(params: EmployeePageParams) {
  return request.get<any, ApiResult<PageResult<Employee>>>("employee/list", { params });
}

/** 員工狀態統計行（對齊後端 EmployeeStatusCountVO） */
export interface EmployeeStatusCount {
  /** 狀態碼 0~6 */
  status: number;
  /** 該狀態的員工數量 */
  cnt: number;
}

/** 導出員工列表（Excel），返回二進位 Blob */
export function exportEmployee(params: { keyword?: string; department?: string; status?: number }) {
  return request.get<any, { data: Blob; headers: Record<string, string> }>("employee/export", {
    params,
    responseType: "blob",
  });
}

/** 統計各狀態員工數量（返回每個狀態一行） */
export function getEmployeeStatusCount() {
  return request.get<any, ApiResult<EmployeeStatusCount[]>>("employee/statusCount");
}

/** 員工詳情（對齊後端 EmployeeDetailVO，欄位多，鬆散定義） */
export interface EmployeeDetail {
  id?: string;
  employeeNo?: string;
  name?: string;
  englishName?: string;
  gender?: string;
  birthday?: string;
  idNumber?: string;
  /** 證件影本地址（員工自助填寫時上傳） */
  idCardUrl?: string;
  nationality?: string;
  maritalStatus?: string;
  phone?: string;
  email?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactRelation?: string;
  emergencyContactPhone?: string;
  education?: string;
  school?: string;
  major?: string;
  departmentId?: number;
  department?: string;
  positionId?: number;
  position?: string;
  positionCode?: string;
  positionGroup?: string;
  departmentCode?: string;
  departmentSub?: string;
  employmentType?: string;
  storeCategory?: string;
  joinDate?: string;
  probation?: number;
  probationPassDate?: string;
  scheduleId?: number;
  shiftType?: string;
  shiftCode?: string;
  dailyHours?: number;
  weeklyDays?: number;
  monthlyHours?: number;
  partTime?: boolean;
  flexibleHours?: boolean;
  overtimeLeave?: boolean;
  leaveCategory?: string;
  leaveGroup?: string;
  salaryType?: string;
  baseSalary?: number;
  salaryPlanId?: number;
  paymentType?: string;
  payrollGroup?: string;
  adwOvertime?: number;
  bankName?: string;
  bankAccount?: string;
  bankAccountHolder?: string;
  bankRatio?: number;
  contributionType?: string;
  mpfType?: string;
  empMpfType?: string;
  employerMpf?: string;
  orsoType?: string;
  orsoEmpRatio?: number;
  orsoEmployerRatio?: number;
  employerOrso?: string;
  managerId?: number;
  managerName?: string;
  hrOwnerId?: number;
  hrOwnerName?: string;
  completeRemark?: string;
  statusCode?: number;
  status?: string;
}

/** 根據 id 查詢員工詳情 */
export function getEmployeeById(id: number) {
  return request.get<any, ApiResult<EmployeeDetail>>("employee/getById", { params: { id } });
}

/** 新增或修改員工 */
export function submitEmployee(data: EmployeeSavePayload) {
  return request.post<any, ApiResult<boolean>>("employee/submit", data);
}

/** 員工編輯入參（對齊後端 EmployeeUpdateDTO，id 必填，僅傳需要修改的欄位） */
export interface EmployeeUpdatePayload {
  id: number;
  name?: string;
  englishName?: string;
  gender?: number;
  birthday?: string;
  idNumber?: string;
  nationality?: string;
  maritalStatus?: number;
  phone?: string;
  email?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactRelation?: string;
  emergencyContactPhone?: string;
  education?: string;
  school?: string;
  major?: string;
  departmentId?: number;
  department?: string;
  positionId?: number;
  position?: string;
  employmentType?: string;
  storeCategory?: string;
  joinDate?: string;
  probation?: number;
  probationPassDate?: string;
  scheduleId?: number;
  shiftType?: string;
  shiftCode?: string;
  dailyHours?: number;
  weeklyDays?: number;
  monthlyHours?: number;
  partTime?: number;
  flexibleHours?: number;
  overtimeLeave?: number;
  leaveCategory?: string;
  salaryType?: string;
  baseSalary?: number;
  salaryPlanId?: number;
  paymentType?: string;
  payrollGroup?: string;
  adwOvertime?: number;
  bankName?: string;
  bankAccount?: string;
  bankAccountHolder?: string;
  bankRatio?: number;
  contributionType?: string;
  mpfType?: string;
  empMpfType?: string;
  employerMpf?: string;
  orsoType?: string;
  orsoEmpRatio?: number;
  orsoEmployerRatio?: number;
  employerOrso?: string;
  managerId?: number;
  managerName?: string;
  hrOwnerId?: number;
  hrOwnerName?: string;
  completeRemark?: string;
  status?: number;
}

/** 編輯員工（對應詳情頁可編輯欄位） */
export function updateEmployee(data: EmployeeUpdatePayload) {
  return request.post<any, ApiResult<boolean>>("employee/update", data);
}

/** 員工下拉選項（直屬主管選擇用） */
export interface EmployeeOption {
  id: number;
  name: string;
  employeeNo?: string;
}

/** 查詢在職員工下拉選項 */
export function getActiveEmployeeOptions() {
  return request.get<any, ApiResult<EmployeeOption[]>>("employee/activeOptions");
}


/** 發送入職邀請入參（HR 僅填姓名/聯絡方式/預定入職日） */
export interface EmployeeInvitePayload {
  name: string;
  email?: string;
  phone?: string;
  joinDate?: string;
}

/** 發送入職邀請返回（含一次性填寫連結 token 與相對路徑） */
export interface EmployeeInviteResult {
  employeeId: number;
  token: string;
  /** 填寫頁相對路徑，前端拼接 window.location.origin 得到完整連結 */
  invitePath: string;
}

/** 發送入職邀請（HR 登入態） */
export function inviteEmployee(data: EmployeeInvitePayload) {
  return request.post<any, ApiResult<EmployeeInviteResult>>("employee/invite", data);
}

/** 重發入職邀請（HR 登入態）：對已邀請待填員工重新生成填寫連結 */
export function resendInvite(id: number) {
  return request.post<any, ApiResult<EmployeeInviteResult>>("employee/invite/resend", null, { params: { id } });
}

/** 自助填寫頁回顯信息（免登入） */
export interface EmployeeInviteInfo {
  name?: string;
  phone?: string;
  email?: string;
  joinDate?: string;
  statusCode?: number;
  /** 是否可填寫（僅狀態0可填） */
  fillable?: boolean;
}

/** 根據邀請 token 取回顯信息（免登入，白名單接口） */
export function getInviteInfo(token: string) {
  return request.get<any, ApiResult<EmployeeInviteInfo>>("employee/invite/info", { params: { token } });
}

/** 員工自助填寫提交入參（免登入，含 token） */
export interface EmployeeInviteSubmitPayload {
  token: string;
  name: string;
  englishName?: string;
  alias?: string;
  gender?: number;
  birthday?: string;
  idNumber?: string;
  /** 證件影本地址（先調 uploadInviteFile 上傳得到 URL） */
  idCardUrl?: string;
  nationality?: string;
  maritalStatus?: number;
  phone?: string;
  email?: string;
  address?: string;
  education?: string;
  school?: string;
  major?: string;
  emergencyContactName?: string;
  emergencyContactRelation?: string;
  emergencyContactPhone?: string;
  bankName?: string;
  bankAccount?: string;
  bankAccountHolder?: string;
}

/** 員工自助填寫提交（免登入，白名單接口） */
export function submitInvite(data: EmployeeInviteSubmitPayload) {
  return request.post<any, ApiResult<boolean>>("employee/invite/submit", data);
}

/** 自助填寫頁上傳證件影本（免登入，憑 token 校驗後上傳，返回文件 URL） */
export function uploadInviteFile(token: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return request.post<any, ApiResult<{ url: string; objectName: string; originalFilename: string }>>(
    "employee/invite/upload",
    formData,
    { params: { token }, headers: { "Content-Type": "multipart/form-data" } },
  );
}

/** 刪除員工 */
export function removeEmployee(id: number) {
  return request.post<any, ApiResult<boolean>>("employee/remove", null, { params: { id } });
}