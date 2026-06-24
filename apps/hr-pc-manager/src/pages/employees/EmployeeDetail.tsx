import {
  AlertTriangle,
  ArrowLeft,
  Briefcase,
  Building2,
  Calendar,
  Check,
  Clock,
  Edit,
  Eye,
  EyeOff,
  GraduationCap,
  Landmark,
  Lock,
  Phone,
  Shield,
  User,
  Wallet,
  X
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';

const employeesDetail: Record<string, any> = {
  EMP001: {
    id: 'EMP001',
    name: '張小明',
    englishName: 'Ming Zhang',
    gender: '男',
    birthday: '1990-05-15',
    idNumber: 'A123456789',
    nationality: '台灣',
    maritalStatus: '已婚',
    phone: '0912-345-678',
    email: 'ming.zhang@company.com',
    address: '台北市信義區信義路五段7號',
    emergencyName: '張太太',
    emergencyPhone: '0922-111-222',
    emergencyRelation: '配偶',
    education: '碩士',
    school: '台灣大學',
    major: '資訊工程',
    bankName: '中國信託',
    bankAccount: '1234-5678-9012-3456',
    department: '技術部',
    position: '高級工程師',
    positionCode: 'P001',
    positionGroup: 'PG-TECH',
    departmentCode: 'D01',
    departmentSub: 'D01-BE',
    joinDate: '2022-03-15',
    probation: 3,
    probationPassDate: '2022-06-15',
    employmentType: '全職',
    partTime: false,
    flexibleHours: true,
    dailyHours: 8,
    weeklyDays: 5,
    annualHours: 2080,
    shiftType: '固定班',
    shiftCode: 'A班',
    salaryType: '月薪',
    baseSalary: 85000,
    paymentType: '銀行轉帳',
    payrollGroup: '月結A組',
    leaveCategory: '年假A類',
    leaveGroup: 'LG-01',
    contributionType: '標準供款',
    mpfType: '僱員強制',
    empMpfType: '標準',
    orsoType: '雙方供款',
    orsoEmpRatio: 5,
    orsoEmployerRatio: 5,
    employerMpf: '3,000',
    employerOrso: '4,250',
    overtimeLeave: false,
    adwOvertime: 1,
    storeCategory: '總部',
    bankRatio: 100,
    status: '在職'
  },
  EMP002: {
    id: 'EMP002',
    name: '李文華',
    englishName: 'Wenhua Li',
    gender: '男',
    birthday: '1988-11-20',
    idNumber: 'B987654321',
    nationality: '台灣',
    maritalStatus: '未婚',
    phone: '0923-456-789',
    email: 'wenhua.li@company.com',
    address: '台北市大安區敦化南路一段100號',
    emergencyName: '李先生',
    emergencyPhone: '0933-222-333',
    emergencyRelation: '父母',
    education: '學士',
    school: '政治大學',
    major: '企業管理',
    bankName: '台北富邦',
    bankAccount: '9876-5432-1098-7654',
    department: '銷售部',
    position: '銷售經理',
    positionCode: 'P002',
    positionGroup: 'PG-SALES',
    departmentCode: 'D02',
    departmentSub: '',
    joinDate: '2021-07-01',
    probation: 3,
    probationPassDate: '2021-10-01',
    employmentType: '全職',
    partTime: false,
    flexibleHours: false,
    dailyHours: 8,
    weeklyDays: 5,
    annualHours: 2080,
    shiftType: '固定班',
    shiftCode: 'A班',
    salaryType: '月薪',
    baseSalary: 72000,
    paymentType: '銀行轉帳',
    payrollGroup: '月結A組',
    leaveCategory: '年假A類',
    leaveGroup: 'LG-01',
    contributionType: '標準供款',
    mpfType: '僱員強制',
    empMpfType: '標準',
    orsoType: '僱主供款',
    orsoEmpRatio: 0,
    orsoEmployerRatio: 5,
    employerMpf: '2,500',
    employerOrso: '3,600',
    overtimeLeave: true,
    adwOvertime: 0,
    storeCategory: '總部',
    bankRatio: 100,
    status: '在職'
  }
};

const defaultEmployee: any = {
  id: '—',
  name: '未知',
  englishName: '',
  gender: '—',
  birthday: '—',
  idNumber: '—',
  nationality: '—',
  maritalStatus: '—',
  phone: '—',
  email: '—',
  address: '—',
  emergencyName: '—',
  emergencyPhone: '—',
  emergencyRelation: '—',
  education: '—',
  school: '—',
  major: '—',
  bankName: '—',
  bankAccount: '—',
  department: '—',
  position: '—',
  positionCode: '—',
  positionGroup: '—',
  departmentCode: '—',
  departmentSub: '—',
  joinDate: '—',
  probation: 0,
  probationPassDate: '—',
  employmentType: '—',
  partTime: false,
  flexibleHours: false,
  dailyHours: 0,
  weeklyDays: 0,
  annualHours: 0,
  shiftType: '—',
  shiftCode: '—',
  salaryType: '—',
  baseSalary: 0,
  paymentType: '—',
  payrollGroup: '—',
  leaveCategory: '—',
  leaveGroup: '—',
  contributionType: '—',
  mpfType: '—',
  empMpfType: '—',
  orsoType: '—',
  orsoEmpRatio: 0,
  orsoEmployerRatio: 0,
  employerMpf: '—',
  employerOrso: '—',
  overtimeLeave: false,
  adwOvertime: 0,
  storeCategory: '—',
  bankRatio: 100,
  status: '在職'
};

type UserRole = 'admin' | 'employee' | 'hr' | 'manager';

/*
 * 編輯權限矩陣
 * - readonly: 任何人都不能改（系統生成）
 * - hr_only: 僅 admin/hr 可改（組織、薪資、福利）
 * - self_or_hr: 員工本人或 admin/hr 可改（個人聯絡、緊急聯絡人、銀行）
 * - view_restricted: 查看需權限，編輯需 admin/hr
 */
type EditPerm = 'hr_only' | 'readonly' | 'self_or_hr' | 'view_restricted';

const FIELD_EDIT_PERM: Record<string, EditPerm> = {
  // Readonly — system
  id: 'readonly',
  joinDate: 'readonly',
  // Personal — self or HR
  name: 'self_or_hr',
  englishName: 'self_or_hr',
  gender: 'self_or_hr',
  birthday: 'self_or_hr',
  nationality: 'self_or_hr',
  maritalStatus: 'self_or_hr',
  phone: 'self_or_hr',
  email: 'self_or_hr',
  address: 'self_or_hr',
  emergencyName: 'self_or_hr',
  emergencyPhone: 'self_or_hr',
  emergencyRelation: 'self_or_hr',
  education: 'self_or_hr',
  school: 'self_or_hr',
  major: 'self_or_hr',
  bankName: 'self_or_hr',
  bankAccount: 'self_or_hr',
  // View restricted + HR edit
  idNumber: 'view_restricted',
  // HR only — org & salary
  department: 'hr_only',
  position: 'hr_only',
  positionCode: 'hr_only',
  positionGroup: 'hr_only',
  departmentCode: 'hr_only',
  departmentSub: 'hr_only',
  employmentType: 'hr_only',
  storeCategory: 'hr_only',
  probation: 'hr_only',
  probationPassDate: 'hr_only',
  shiftType: 'hr_only',
  shiftCode: 'hr_only',
  dailyHours: 'hr_only',
  weeklyDays: 'hr_only',
  annualHours: 'hr_only',
  partTime: 'hr_only',
  flexibleHours: 'hr_only',
  overtimeLeave: 'hr_only',
  leaveCategory: 'hr_only',
  leaveGroup: 'hr_only',
  salaryType: 'hr_only',
  baseSalary: 'hr_only',
  paymentType: 'hr_only',
  payrollGroup: 'hr_only',
  adwOvertime: 'hr_only',
  bankRatio: 'hr_only',
  contributionType: 'hr_only',
  mpfType: 'hr_only',
  empMpfType: 'hr_only',
  employerMpf: 'hr_only',
  orsoType: 'hr_only',
  orsoEmpRatio: 'hr_only',
  orsoEmployerRatio: 'hr_only',
  employerOrso: 'hr_only',
  status: 'hr_only'
};

const VIEW_PERM: Record<string, UserRole[]> = {
  salary: ['admin', 'hr'],
  mpf: ['admin', 'hr'],
  bank: ['admin', 'hr', 'employee'],
  idNumber: ['admin', 'hr']
};

function canView(field: string, role: UserRole) {
  const allowed = VIEW_PERM[field];
  return !allowed || allowed.includes(role);
}

function canEdit(fieldKey: string, role: UserRole): boolean {
  const perm = FIELD_EDIT_PERM[fieldKey] || 'hr_only';
  if (perm === 'readonly') return false;
  if (perm === 'hr_only' || perm === 'view_restricted') return role === 'admin' || role === 'hr';
  if (perm === 'self_or_hr') return role === 'admin' || role === 'hr' || role === 'employee';
  return false;
}

// Select options map
const SELECT_OPTIONS: Record<string, string[]> = {
  gender: ['男', '女', '其他'],
  maritalStatus: ['未婚', '已婚', '離婚', '喪偶'],
  nationality: ['台灣', '香港', '中國大陸', '其他'],
  emergencyRelation: ['配偶', '父母', '兄弟姐妹', '子女', '朋友', '其他'],
  education: ['高中/職', '大專', '學士', '碩士', '博士'],
  department: ['技術部', '銷售部', '人事部', '市場部', '財務部', '運營部'],
  employmentType: ['全職', '兼職', '合約', '實習'],
  shiftType: ['固定班', '輪班', '彈性班'],
  shiftCode: ['A班', 'B班', 'C班'],
  salaryType: ['月薪', '日薪', '時薪'],
  paymentType: ['銀行轉帳', '現金', '支票'],
  payrollGroup: ['月結A組', '月結B組', '半月結'],
  leaveCategory: ['年假A類', '年假B類', '特殊假期'],
  contributionType: ['標準供款', '自願供款', '豁免'],
  mpfType: ['僱員強制', '僱主自願', '行業計劃'],
  empMpfType: ['標準', '特別'],
  orsoType: ['僱員供款', '僱主供款', '雙方供款'],
  storeCategory: ['總部', '分店A', '分店B'],
  status: ['在職', '休假中', '離職']
};

/* ===== Primitives ===== */

function EditableField({
  colSpan,
  editing,
  fieldKey,
  formData,
  label,
  onChange,
  role,
  type,
  value
}: {
  colSpan?: number;
  editing: boolean;
  fieldKey: string;
  formData: Record<string, any>;
  label: string;
  onChange: (key: string, val: any) => void;
  role: UserRole;
  type?: 'boolean' | 'date' | 'number' | 'select' | 'text';
  value: string | number | boolean;
}) {
  const editable = canEdit(fieldKey, role);
  const isEditing = editing && editable;
  let display: string;
  if (typeof value === 'boolean') {
    display = value ? '是' : '否';
  } else {
    display = String(value || '—');
  }
  const selectOpts = SELECT_OPTIONS[fieldKey];
  const inferredType =
    type ||
    (() => {
      if (selectOpts) return 'select';
      if (typeof value === 'boolean') return 'boolean';
      if (typeof value === 'number') return 'number';
      return 'text';
    })();

  return (
    <div className={`min-w-0 ${colSpan ? `col-span-${colSpan}` : ''}`}>
      <div className="flex items-center gap-1 mb-0.5">
        <p className="text-xs text-muted-foreground truncate">{label}</p>
        {editing && !editable && fieldKey !== 'id' && <Lock className="h-2.5 w-2.5 text-muted-foreground/50" />}
      </div>
      {isEditing ? (
        (() => {
          if (inferredType === 'select' && selectOpts) {
            return (
              <Select value={String(formData[fieldKey] ?? value)} onValueChange={v => onChange(fieldKey, v)}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {selectOpts.map(o => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            );
          }
          if (inferredType === 'boolean') {
            return (
              <Switch
                checked={formData[fieldKey] !== undefined ? Boolean(formData[fieldKey]) : Boolean(value)}
                onCheckedChange={v => onChange(fieldKey, v)}
              />
            );
          }
          return (
            <Input
              className="h-8 text-sm"
              type={inferredType}
              value={formData[fieldKey] ?? value}
              onChange={e => onChange(fieldKey, inferredType === 'number' ? Number(e.target.value) : e.target.value)}
            />
          );
        })()
      ) : (
        <p className="text-sm font-medium truncate">{display}</p>
      )}
    </div>
  );
}

function SecureField({
  editing,
  fieldKey,
  formData,
  label,
  onChange,
  role,
  value
}: {
  editing: boolean;
  fieldKey: string;
  formData: Record<string, any>;
  label: string;
  onChange: (key: string, val: any) => void;
  role: UserRole;
  value: string | number;
}) {
  const [show, setShow] = useState(false);
  const viewField = fieldKey === 'idNumber' ? 'idNumber' : 'bank';
  if (!canView(viewField, role)) {
    return (
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Lock className="h-3 w-3" />
          需要權限
        </span>
      </div>
    );
  }
  const editable = canEdit(fieldKey, role);
  if (editing && editable) {
    return (
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        <Input
          className="h-8 text-sm"
          value={formData[fieldKey] ?? value}
          onChange={e => onChange(fieldKey, e.target.value)}
        />
      </div>
    );
  }
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <div className="flex items-center gap-1.5">
        <p className="text-sm font-medium">{show ? String(value) : '••••••••'}</p>
        <button
          onClick={() => setShow(!show)}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        </button>
      </div>
    </div>
  );
}

function Section({
  children,
  editing,
  icon: Icon,
  locked,
  sectionEditable,
  title
}: {
  children: React.ReactNode;
  editing?: boolean;
  icon: any;
  locked?: boolean;
  sectionEditable?: boolean;
  title: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center">
          <Icon className="h-3.5 w-3.5 text-primary" />
        </div>
        <h3 className="text-sm font-semibold tracking-wide">{title}</h3>
        {locked && <Lock className="h-3 w-3 text-muted-foreground" />}
        {editing && sectionEditable && (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-primary/20">
            可編輯
          </Badge>
        )}
        {editing && !sectionEditable && (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            僅限查看
          </Badge>
        )}
      </div>
      {children}
    </div>
  );
}

function FieldGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-4">{children}</div>;
}

const STATUS_MAP: Record<string, { color: string; dot: string }> = {
  在職: { color: 'bg-success/10 text-success border-success/20', dot: 'bg-success' },
  休假中: { color: 'bg-warning/10 text-warning border-warning/20', dot: 'bg-warning' },
  離職: { color: 'bg-destructive/10 text-destructive border-destructive/20', dot: 'bg-destructive' }
};

const PersonalSection = ({ currentRole, editing, emp, formData, fp, handleChange }) => {
  return (
    <div className="space-y-8">
      <Section
        icon={User}
        title="基本資料"
        editing={editing}
        sectionEditable={currentRole === 'admin' || currentRole === 'hr' || currentRole === 'employee'}
      >
        <FieldGrid>
          <EditableField {...fp('name', '姓名')} />
          <EditableField {...fp('englishName', '英文姓名')} />
          <EditableField {...fp('gender', '性別')} />
          <EditableField {...fp('birthday', '出生日期', { type: 'date' })} />
          <SecureField
            label="身份證號碼"
            value={emp.idNumber}
            fieldKey="idNumber"
            role={currentRole}
            editing={editing}
            formData={formData}
            onChange={handleChange}
          />
          <EditableField {...fp('nationality', '國籍')} />
          <EditableField {...fp('maritalStatus', '婚姻狀況')} />
        </FieldGrid>
      </Section>

      <Separator />

      <Section
        icon={Phone}
        title="聯絡資訊"
        editing={editing}
        sectionEditable={currentRole === 'admin' || currentRole === 'hr' || currentRole === 'employee'}
      >
        <FieldGrid>
          <EditableField {...fp('phone', '聯絡電話')} />
          <EditableField {...fp('email', '電子郵箱')} />
          <div className="col-span-2">
            <EditableField {...fp('address', '通訊地址')} />
          </div>
        </FieldGrid>
      </Section>

      <Separator />

      <Section
        icon={AlertTriangle}
        title="緊急聯絡人"
        editing={editing}
        sectionEditable={currentRole === 'admin' || currentRole === 'hr' || currentRole === 'employee'}
      >
        <FieldGrid>
          <EditableField {...fp('emergencyName', '姓名')} />
          <EditableField {...fp('emergencyRelation', '關係')} />
          <EditableField {...fp('emergencyPhone', '聯絡電話')} />
        </FieldGrid>
      </Section>

      <Separator />

      <Section
        icon={GraduationCap}
        title="學歷資訊"
        editing={editing}
        sectionEditable={currentRole === 'admin' || currentRole === 'hr' || currentRole === 'employee'}
      >
        <FieldGrid>
          <EditableField {...fp('education', '最高學歷')} />
          <EditableField {...fp('school', '畢業學校')} />
          <EditableField {...fp('major', '主修科系')} />
        </FieldGrid>
      </Section>
    </div>
  );
};

const OrganizationSection = ({ currentRole, editing, fp }) => {
  return (
    <div className="space-y-8">
      <Section
        icon={Building2}
        title="職位資訊"
        editing={editing}
        sectionEditable={currentRole === 'admin' || currentRole === 'hr'}
      >
        <FieldGrid>
          <EditableField {...fp('department', '部門')} />
          <EditableField {...fp('position', '職位')} />
          <EditableField {...fp('positionCode', '職位編號')} />
          <EditableField {...fp('positionGroup', '職位群組')} />
          <EditableField {...fp('departmentCode', '部門編號')} />
          <EditableField {...fp('departmentSub', '部門細分')} />
          <EditableField {...fp('employmentType', '僱用類型')} />
          <EditableField {...fp('storeCategory', '門市分類')} />
        </FieldGrid>
      </Section>

      <Separator />

      <Section
        icon={Clock}
        title="工作安排"
        editing={editing}
        sectionEditable={currentRole === 'admin' || currentRole === 'hr'}
      >
        <FieldGrid>
          <EditableField {...fp('joinDate', '入職日期', { type: 'date' })} />
          <EditableField {...fp('probation', '試用期（月）', { type: 'number' })} />
          <EditableField {...fp('probationPassDate', '通過試用日期', { type: 'date' })} />
          <EditableField {...fp('shiftType', '班次類型')} />
          <EditableField {...fp('shiftCode', '班次代號')} />
          <EditableField {...fp('dailyHours', '每日工作時數', { type: 'number' })} />
          <EditableField {...fp('weeklyDays', '每週工作日數', { type: 'number' })} />
          <EditableField {...fp('annualHours', '每年工作時數', { type: 'number' })} />
        </FieldGrid>
      </Section>

      <Separator />

      <Section
        icon={Calendar}
        title="出勤與假期"
        editing={editing}
        sectionEditable={currentRole === 'admin' || currentRole === 'hr'}
      >
        <FieldGrid>
          <EditableField {...fp('partTime', '兼職員工', { type: 'boolean' })} />
          <EditableField {...fp('flexibleHours', '彈性上班', { type: 'boolean' })} />
          <EditableField {...fp('overtimeLeave', '加班換銷假', { type: 'boolean' })} />
          <EditableField {...fp('leaveCategory', '假期分類')} />
          <EditableField {...fp('leaveGroup', '假期群組')} />
        </FieldGrid>
      </Section>
    </div>
  );
};

const SalarySection = ({ currentRole, editing, emp, formData, fp, handleChange }) => {
  return (
    <>
      {!canView('salary', currentRole) ? (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
          <div className="h-16 w-16 rounded-full bg-muted/60 flex items-center justify-center mb-4">
            <Lock className="h-7 w-7" />
          </div>
          <p className="font-medium text-base">無權限查看</p>
          <p className="text-sm mt-1">薪資與福利資訊僅限管理員及 HR 查看</p>
        </div>
      ) : (
        <div className="space-y-8">
          <Section
            icon={Wallet}
            title="薪資設定"
            editing={editing}
            sectionEditable={currentRole === 'admin' || currentRole === 'hr'}
          >
            <FieldGrid>
              <EditableField {...fp('salaryType', '薪資類型')} />
              <EditableField {...fp('baseSalary', '基本薪金', { type: 'number' })} />
              <EditableField {...fp('paymentType', '支付類型')} />
              <EditableField {...fp('payrollGroup', '工資發放群組')} />
              <EditableField {...fp('adwOvertime', 'ADW 加班費倍數', { type: 'number' })} />
            </FieldGrid>
          </Section>

          <Separator />

          <Section
            icon={Landmark}
            title="銀行帳戶"
            locked
            editing={editing}
            sectionEditable={currentRole === 'admin' || currentRole === 'hr' || currentRole === 'employee'}
          >
            <FieldGrid>
              <SecureField
                label="銀行名稱"
                value={emp.bankName}
                fieldKey="bankName"
                role={currentRole}
                editing={editing}
                formData={formData}
                onChange={handleChange}
              />
              <SecureField
                label="銀行帳號"
                value={emp.bankAccount}
                fieldKey="bankAccount"
                role={currentRole}
                editing={editing}
                formData={formData}
                onChange={handleChange}
              />
              <EditableField {...fp('bankRatio', '銀行戶口比例（%）', { type: 'number' })} />
            </FieldGrid>
          </Section>

          <Separator />

          <Section
            icon={Shield}
            title="強積金 / 退休計劃"
            editing={editing}
            sectionEditable={currentRole === 'admin' || currentRole === 'hr'}
          >
            <FieldGrid>
              <EditableField {...fp('contributionType', '供款類型')} />
              <EditableField {...fp('mpfType', '強積金類型')} />
              <EditableField {...fp('empMpfType', '員工強積金類型')} />
              <EditableField {...fp('employerMpf', '僱主的強積金')} />
              <EditableField {...fp('orsoType', '退休計劃供款類型')} />
              <EditableField {...fp('orsoEmpRatio', '員工供款比例（%）', { type: 'number' })} />
              <EditableField {...fp('orsoEmployerRatio', '僱主供款比例（%）', { type: 'number' })} />
              <EditableField {...fp('employerOrso', '僱主的退休計劃')} />
            </FieldGrid>
          </Section>
        </div>
      )}
    </>
  );
};

const SECTION_COMPONENTS = {
  personal: PersonalSection,
  organization: OrganizationSection,
  salary: SalarySection
};

/* ===== Page ===== */
export default function EmployeeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [currentRole, setCurrentRole] = useState<UserRole>('hr');
  const [activeSection, setActiveSection] = useState('personal');
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});

  const emp = employeesDetail[id || ''] || { ...defaultEmployee, id, name: id };

  const handleChange = (key: string, val: any) => {
    setFormData(prev => ({ ...prev, [key]: val }));
  };

  const handleSave = () => {
    // Merge changes
    const changedKeys = Object.keys(formData);
    if (changedKeys.length === 0) {
      setEditing(false);
      return;
    }
    // In real app, call API here
    Object.assign(emp, formData);
    toast.success(`已成功更新 ${changedKeys.length} 個欄位`);
    setFormData({});
    setEditing(false);
  };

  const handleCancel = () => {
    setFormData({});
    setEditing(false);
  };

  const tenure =
    emp.joinDate && emp.joinDate !== '—'
      ? `${Math.floor((Date.now() - new Date(emp.joinDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} 年 ${Math.floor(((Date.now() - new Date(emp.joinDate).getTime()) / (30.44 * 24 * 60 * 60 * 1000)) % 12)} 個月`
      : '—';

  const sections = [
    { id: 'personal', label: '個人資料', icon: User },
    { id: 'organization', label: '組織與工作', icon: Building2 },
    { id: 'salary', label: '薪資福利', icon: Wallet }
  ];

  // Helper for field props
  const fp = (
    fieldKey: string,
    label: string,
    opts?: { colSpan?: number; type?: 'boolean' | 'date' | 'number' | 'select' | 'text' }
  ) => ({
    label,
    fieldKey,
    value: emp[fieldKey],
    editing,
    role: currentRole,
    formData,
    onChange: handleChange,
    ...opts
  });

  const ActiveSection = SECTION_COMPONENTS[activeSection as keyof typeof SECTION_COMPONENTS];

  return (
    <div className="space-y-0">
      {/* ===== Profile Header ===== */}
      <div className="rounded-xl bg-card border p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-5">
            <Button variant="ghost" size="icon" className="shrink-0 -ml-2" onClick={() => navigate('/employees')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Avatar className="h-16 w-16 text-lg">
              <AvatarFallback className="bg-primary/10 text-primary font-bold">{emp.name?.slice(-2)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-xl font-bold tracking-tight">{emp.name}</h1>
                <span className="text-sm text-muted-foreground">{emp.englishName}</span>
                <Badge variant="secondary" className={STATUS_MAP[emp.status]?.color || ''}>
                  <span
                    className={`inline-block h-1.5 w-1.5 rounded-full mr-1.5 ${STATUS_MAP[emp.status]?.dot || ''}`}
                  />
                  {emp.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {emp.department} · {emp.position}
              </p>
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Briefcase className="h-3 w-3" />
                  {emp.id}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  入職 {emp.joinDate}
                </span>
                <span>在職 {tenure}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs bg-muted/60 rounded-lg px-3 py-1.5 border">
              <Shield className="h-3 w-3 text-muted-foreground" />
              <select
                className="bg-transparent text-xs font-medium outline-none cursor-pointer"
                value={currentRole}
                onChange={e => setCurrentRole(e.target.value as UserRole)}
              >
                <option value="admin">管理員</option>
                <option value="hr">HR</option>
                <option value="manager">主管</option>
                <option value="employee">員工</option>
              </select>
            </div>
            {editing ? (
              <>
                <Button variant="outline" size="sm" onClick={handleCancel}>
                  <X className="h-3.5 w-3.5 mr-1.5" />
                  取消
                </Button>
                <Button size="sm" onClick={handleSave}>
                  <Check className="h-3.5 w-3.5 mr-1.5" />
                  儲存
                </Button>
              </>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                <Edit className="h-3.5 w-3.5 mr-1.5" />
                編輯
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Editing hint */}
      {editing && (
        <div className="rounded-lg bg-primary/5 border border-primary/15 px-4 py-2.5 mb-6 flex items-center gap-2 text-sm">
          <Edit className="h-4 w-4 text-primary shrink-0" />
          <span className="text-muted-foreground">
            編輯模式 — 標示
            <Badge
              variant="secondary"
              className="text-[10px] px-1.5 py-0 mx-1 bg-primary/10 text-primary border-primary/20"
            >
              可編輯
            </Badge>
            的區塊可進行修改，帶 <Lock className="h-3 w-3 inline" /> 的欄位需要更高權限
          </span>
        </div>
      )}

      {/* ===== Nav + Content ===== */}
      <div className="flex gap-6">
        <nav className="w-44 shrink-0 space-y-1 sticky top-6 self-start">
          {sections.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                activeSection === s.id
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
              }`}
            >
              <s.icon className="h-4 w-4" />
              {s.label}
            </button>
          ))}
        </nav>

        <div className="flex-1 min-w-0">
          <ActiveSection
            editing={editing}
            emp={emp}
            formData={formData}
            fp={fp}
            handleChange={handleChange}
            currentRole={currentRole}
          />
        </div>
      </div>
    </div>
  );
}
