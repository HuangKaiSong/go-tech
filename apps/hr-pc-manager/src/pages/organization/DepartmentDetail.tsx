import {
  ArrowLeft,
  Briefcase,
  Building2,
  Calendar,
  ChevronRight,
  Edit,
  Eye,
  Mail,
  MapPin,
  Phone,
  Save,
  Search,
  Target,
  TrendingUp,
  UserCheck,
  Users,
  X
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';

interface Employee {
  department: string;
  email: string;
  id: string;
  joinDate: string;
  level: string;
  name: string;
  phone: string;
  status: string;
  title: string;
}

interface SubDept {
  code: string;
  headcount: number;
  id: string;
  manager: string;
  name: string;
  status: string;
}

interface DeptKPI {
  actual: string;
  label: string;
  status: string;
  target: string;
}

const deptMap: Record<
  string,
  {
    budget: string;
    code: string;
    createdAt: string;
    description: string;
    email: string;
    employees: Employee[];
    headcount: number;
    kpis: DeptKPI[];
    location: string;
    manager: string;
    name: string;
    parent: string;
    phone: string;
    status: string;
    subDepts: SubDept[];
  }
> = {
  '1': {
    name: '技術部',
    code: 'TECH',
    manager: '張技術總監',
    headcount: 320,
    parent: '研發中心',
    status: '啟用',
    createdAt: '2020-01-15',
    phone: '分機 1001',
    email: 'tech@company.com',
    location: '總部大樓 8F',
    description: '負責公司所有技術研發、系統架構設計、基礎設施維護及技術創新。',
    budget: 'NT$ 45,000,000',
    employees: [
      {
        id: 'e1',
        name: '張技術總監',
        title: '技術總監',
        level: 'M3',
        joinDate: '2019-03-15',
        status: '在職',
        email: 'zhang@company.com',
        phone: '分機 1001',
        department: '技術部'
      },
      {
        id: 'e2',
        name: '周前端主管',
        title: '前端開發主管',
        level: 'M2',
        joinDate: '2020-06-01',
        status: '在職',
        email: 'zhou@company.com',
        phone: '分機 1002',
        department: '前端組'
      },
      {
        id: 'e3',
        name: '吳後端主管',
        title: '後端開發主管',
        level: 'M2',
        joinDate: '2020-04-15',
        status: '在職',
        email: 'wu@company.com',
        phone: '分機 1003',
        department: '後端組'
      },
      {
        id: 'e4',
        name: '鄭QA主管',
        title: '測試主管',
        level: 'M2',
        joinDate: '2020-08-01',
        status: '在職',
        email: 'zheng@company.com',
        phone: '分機 1004',
        department: '測試組'
      },
      {
        id: 'e5',
        name: '劉資深工程師',
        title: '高級前端工程師',
        level: 'P3',
        joinDate: '2021-01-10',
        status: '在職',
        email: 'liu@company.com',
        phone: '分機 1005',
        department: '前端組'
      },
      {
        id: 'e6',
        name: '林資深工程師',
        title: '高級後端工程師',
        level: 'P3',
        joinDate: '2020-11-20',
        status: '在職',
        email: 'lin@company.com',
        phone: '分機 1006',
        department: '後端組'
      },
      {
        id: 'e7',
        name: '陳工程師',
        title: '前端工程師',
        level: 'P2',
        joinDate: '2022-03-01',
        status: '在職',
        email: 'chen@company.com',
        phone: '分機 1007',
        department: '前端組'
      },
      {
        id: 'e8',
        name: '黃工程師',
        title: '後端工程師',
        level: 'P2',
        joinDate: '2023-07-15',
        status: '試用期',
        email: 'huang@company.com',
        phone: '分機 1008',
        department: '後端組'
      }
    ],
    subDepts: [
      { id: 's1', name: '前端組', code: 'TECH-FE', manager: '周前端主管', headcount: 45, status: '啟用' },
      { id: 's2', name: '後端組', code: 'TECH-BE', manager: '吳後端主管', headcount: 60, status: '啟用' },
      { id: 's3', name: '測試組', code: 'TECH-QA', manager: '鄭QA主管', headcount: 20, status: '啟用' },
      { id: 's4', name: 'DevOps 組', code: 'TECH-OPS', manager: '何基礎架構主管', headcount: 15, status: '啟用' },
      { id: 's5', name: '架構組', code: 'TECH-ARCH', manager: '孫架構師', headcount: 8, status: '停用' }
    ],
    kpis: [
      { label: '系統可用率', target: '99.9%', actual: '99.95%', status: '達標' },
      { label: '需求交付週期', target: '≤ 14 天', actual: '12 天', status: '達標' },
      { label: '線上 Bug 率', target: '≤ 0.5%', actual: '0.3%', status: '達標' },
      { label: '員工留任率', target: '≥ 90%', actual: '88%', status: '未達標' }
    ]
  },
  '2': {
    name: '銷售部',
    code: 'SALES',
    manager: '李銷售總監',
    headcount: 240,
    parent: '營運中心',
    status: '啟用',
    createdAt: '2020-01-15',
    phone: '分機 2001',
    email: 'sales@company.com',
    location: '總部大樓 5F',
    description: '負責公司產品銷售、客戶關係維護及業績達成。',
    budget: 'NT$ 30,000,000',
    employees: [
      {
        id: 'e1',
        name: '李銷售總監',
        title: '銷售總監',
        level: 'M3',
        joinDate: '2019-05-01',
        status: '在職',
        email: 'li@company.com',
        phone: '分機 2001',
        department: '銷售部'
      },
      {
        id: 'e2',
        name: '馬區域經理',
        title: '銷售經理',
        level: 'M2',
        joinDate: '2020-02-15',
        status: '在職',
        email: 'ma@company.com',
        phone: '分機 2002',
        department: '銷售一部'
      },
      {
        id: 'e3',
        name: '楊區域經理',
        title: '銷售經理',
        level: 'M2',
        joinDate: '2020-07-01',
        status: '在職',
        email: 'yang@company.com',
        phone: '分機 2003',
        department: '銷售二部'
      }
    ],
    subDepts: [
      { id: 's1', name: '銷售一部', code: 'SALES-1', manager: '馬區域經理', headcount: 90, status: '啟用' },
      { id: 's2', name: '銷售二部', code: 'SALES-2', manager: '楊區域經理', headcount: 80, status: '啟用' },
      { id: 's3', name: '大客戶部', code: 'SALES-VIP', manager: '蔡大客戶主管', headcount: 30, status: '啟用' }
    ],
    kpis: [
      { label: '季度營收', target: 'NT$ 5,000 萬', actual: 'NT$ 5,200 萬', status: '達標' },
      { label: '新客戶數', target: '≥ 50', actual: '42', status: '未達標' },
      { label: '客戶續約率', target: '≥ 85%', actual: '88%', status: '達標' }
    ]
  }
};

function getDept(id: string) {
  if (deptMap[id]) return deptMap[id];
  return {
    name: '市場部',
    code: 'MKT',
    manager: '陳市場主管',
    headcount: 180,
    parent: '營運中心',
    status: '啟用',
    createdAt: '2020-03-01',
    phone: '分機 3001',
    email: 'mkt@company.com',
    location: '總部大樓 6F',
    description: '負責品牌推廣、市場調研、廣告投放及活動策劃。',
    budget: 'NT$ 20,000,000',
    employees: [
      {
        id: 'e1',
        name: '陳市場主管',
        title: '市場總監',
        level: 'M3',
        joinDate: '2020-03-01',
        status: '在職',
        email: 'chen.mkt@company.com',
        phone: '分機 3001',
        department: '市場部'
      }
    ],
    subDepts: [{ id: 's1', name: '品牌組', code: 'MKT-BR', manager: '趙品牌主管', headcount: 40, status: '啟用' }],
    kpis: [{ label: '品牌知名度', target: '≥ 60%', actual: '58%', status: '未達標' }]
  };
}

const empStatusColors: Record<string, string> = {
  在職: 'bg-success/10 text-success border-success/20',
  試用期: 'bg-warning/10 text-warning border-warning/20',
  離職: 'bg-destructive/10 text-destructive border-destructive/20'
};

const kpiStatusColors: Record<string, string> = {
  達標: 'bg-success/10 text-success border-success/20',
  未達標: 'bg-destructive/10 text-destructive border-destructive/20'
};

const subDeptStatusColors: Record<string, string> = {
  啟用: 'bg-success/10 text-success border-success/20',
  停用: 'bg-muted text-muted-foreground'
};

const sideNav = [
  { id: 'basic', label: '基本資訊', icon: Building2 },
  { id: 'members', label: '部門成員', icon: Users },
  { id: 'sub', label: '下級部門', icon: Briefcase },
  { id: 'kpi', label: '部門 KPI', icon: Target }
];

type DeptData = ReturnType<typeof getDept>;

function BasicInfoTab({
  dept,
  editing,
  form,
  setForm
}: {
  dept: DeptData;
  editing: boolean;
  form: DeptData;
  setForm: (value: DeptData) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">基本資訊</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
          <div className="space-y-1.5">
            <Label className="text-muted-foreground text-xs">部門名稱</Label>
            {editing ? (
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            ) : (
              <p className="text-sm font-medium text-foreground">{dept.name}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label className="text-muted-foreground text-xs">部門代碼</Label>
            {editing ? (
              <Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} />
            ) : (
              <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                {dept.code}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label className="text-muted-foreground text-xs">上級部門</Label>
            {editing ? (
              <Select value={form.parent} onValueChange={v => setForm({ ...form, parent: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['董事會', '總經理室', '研發中心', '營運中心', '管理中心'].map(p => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm font-medium text-foreground">{dept.parent}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label className="text-muted-foreground text-xs">部門主管</Label>
            {editing ? (
              <Input value={form.manager} onChange={e => setForm({ ...form, manager: e.target.value })} />
            ) : (
              <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <UserCheck className="h-3.5 w-3.5 text-muted-foreground" />
                {dept.manager}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label className="text-muted-foreground text-xs">部門狀態</Label>
            {editing ? (
              <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="啟用">啟用</SelectItem>
                  <SelectItem value="停用">停用</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Badge
                variant="secondary"
                className={
                  dept.status === '啟用'
                    ? 'bg-success/10 text-success border-success/20'
                    : 'bg-muted text-muted-foreground'
                }
              >
                {dept.status}
              </Badge>
            )}
          </div>
          <div className="space-y-1.5">
            <Label className="text-muted-foreground text-xs">年度預算</Label>
            {editing ? (
              <Input value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })} />
            ) : (
              <p className="text-sm font-medium text-foreground">{dept.budget}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label className="text-muted-foreground text-xs">聯絡電話</Label>
            {editing ? (
              <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            ) : (
              <p className="text-sm text-foreground flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                {dept.phone}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label className="text-muted-foreground text-xs">部門信箱</Label>
            {editing ? (
              <Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            ) : (
              <p className="text-sm text-foreground flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                {dept.email}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label className="text-muted-foreground text-xs">辦公地點</Label>
            {editing ? (
              <Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
            ) : (
              <p className="text-sm text-foreground flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                {dept.location}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label className="text-muted-foreground text-xs">建立日期</Label>
            <p className="text-sm text-foreground flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              {dept.createdAt}
            </p>
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label className="text-muted-foreground text-xs">部門職責說明</Label>
            {editing ? (
              <Textarea
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                rows={3}
              />
            ) : (
              <p className="text-sm text-foreground">{dept.description}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DepartmentDetail() {
  const { deptId } = useParams();
  const navigate = useNavigate();
  const dept = getDept(deptId || '1');
  const [activeTab, setActiveTab] = useState('basic');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(dept);
  const [memberSearch, setMemberSearch] = useState('');
  const [memberFilter, setMemberFilter] = useState('all');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedSubDept, setSelectedSubDept] = useState<SubDept | null>(null);

  const handleSave = () => {
    toast.success('部門資料已更新');
    setEditing(false);
  };

  const filteredEmployees = dept.employees.filter(emp => {
    const matchSearch = emp.name.includes(memberSearch) || emp.title.includes(memberSearch);
    const matchFilter = memberFilter === 'all' || emp.status === memberFilter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/organization/departments')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-lg">
              {dept.code.slice(0, 2)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{dept.name}</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>代碼：{dept.code}</span>
                <span>·</span>
                <Badge
                  variant="secondary"
                  className={
                    dept.status === '啟用'
                      ? 'bg-success/10 text-success border-success/20'
                      : 'bg-muted text-muted-foreground'
                  }
                >
                  {dept.status}
                </Badge>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {editing ? (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setEditing(false);
                  setForm(dept);
                }}
              >
                <X className="h-4 w-4 mr-1" />
                取消
              </Button>
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-1" />
                儲存
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => setEditing(true)}>
              <Edit className="h-4 w-4 mr-1" />
              編輯
            </Button>
          )}
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{dept.headcount}</p>
              <p className="text-xs text-muted-foreground">部門人數</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <Briefcase className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{dept.subDepts.length}</p>
              <p className="text-xs text-muted-foreground">下級部門</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <Target className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {dept.kpis.filter(k => k.status === '達標').length}/{dept.kpis.length}
              </p>
              <p className="text-xs text-muted-foreground">KPI 達標</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <TrendingUp className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">{dept.budget}</p>
              <p className="text-xs text-muted-foreground">年度預算</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content */}
      <div className="flex gap-6">
        {/* Side nav */}
        <div className="w-48 shrink-0 space-y-1 hidden md:block">
          {sideNav.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                activeTab === item.id
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Basic Info Tab */}
          {activeTab === 'basic' && <BasicInfoTab dept={dept} editing={editing} form={form} setForm={setForm} />}

          {/* Members Tab */}
          {activeTab === 'members' && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">部門成員（{dept.employees.length}）</CardTitle>
                </div>
                <div className="flex items-center gap-3 mt-3">
                  <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="搜尋姓名、職位..."
                      className="pl-9 h-9"
                      value={memberSearch}
                      onChange={e => setMemberSearch(e.target.value)}
                    />
                  </div>
                  <Select value={memberFilter} onValueChange={setMemberFilter}>
                    <SelectTrigger className="w-28 h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部</SelectItem>
                      <SelectItem value="在職">在職</SelectItem>
                      <SelectItem value="試用期">試用期</SelectItem>
                      <SelectItem value="離職">離職</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>姓名</TableHead>
                      <TableHead>職位</TableHead>
                      <TableHead>所屬組別</TableHead>
                      <TableHead>職等</TableHead>
                      <TableHead>入職日期</TableHead>
                      <TableHead>狀態</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEmployees.map(emp => (
                      <TableRow
                        key={emp.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setSelectedEmployee(emp)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7">
                              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                {emp.name.slice(-2)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{emp.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{emp.title}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{emp.department}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {emp.level}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">{emp.joinDate}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={empStatusColors[emp.status] || ''}>
                            {emp.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={e => {
                              e.stopPropagation();
                              setSelectedEmployee(emp);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredEmployees.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          無符合條件的成員
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Sub-departments Tab */}
          {activeTab === 'sub' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">下級部門（{dept.subDepts.length}）</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>部門名稱</TableHead>
                      <TableHead>部門代碼</TableHead>
                      <TableHead>負責人</TableHead>
                      <TableHead className="text-right">人數</TableHead>
                      <TableHead>狀態</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dept.subDepts.map(sub => (
                      <TableRow
                        key={sub.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setSelectedSubDept(sub)}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            {sub.name}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm text-muted-foreground">{sub.code}</TableCell>
                        <TableCell>{sub.manager}</TableCell>
                        <TableCell className="text-right">{sub.headcount}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={subDeptStatusColors[sub.status] || ''}>
                            {sub.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={e => {
                              e.stopPropagation();
                              setSelectedSubDept(sub);
                            }}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* KPI Tab */}
          {activeTab === 'kpi' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">部門 KPI</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>指標</TableHead>
                      <TableHead>目標</TableHead>
                      <TableHead>實際</TableHead>
                      <TableHead>狀態</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dept.kpis.map((kpi, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{kpi.label}</TableCell>
                        <TableCell>{kpi.target}</TableCell>
                        <TableCell>{kpi.actual}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={kpiStatusColors[kpi.status] || ''}>
                            {kpi.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Employee Detail Dialog */}
      <Dialog open={Boolean(selectedEmployee)} onOpenChange={open => !open && setSelectedEmployee(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>成員詳情</DialogTitle>
          </DialogHeader>
          {selectedEmployee && (
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14">
                  <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">
                    {selectedEmployee.name.slice(-2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{selectedEmployee.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedEmployee.title}</p>
                  <Badge variant="secondary" className={`mt-1 ${empStatusColors[selectedEmployee.status] || ''}`}>
                    {selectedEmployee.status}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">職等</Label>
                  <p className="text-sm font-medium text-foreground">{selectedEmployee.level}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">所屬組別</Label>
                  <p className="text-sm font-medium text-foreground">{selectedEmployee.department}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">入職日期</Label>
                  <p className="text-sm text-foreground flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    {selectedEmployee.joinDate}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">聯絡電話</Label>
                  <p className="text-sm text-foreground flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    {selectedEmployee.phone}
                  </p>
                </div>
                <div className="space-y-1 col-span-2">
                  <Label className="text-muted-foreground text-xs">電子信箱</Label>
                  <p className="text-sm text-foreground flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    {selectedEmployee.email}
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedEmployee(null)}>
              關閉
            </Button>
            <Button
              onClick={() => {
                navigate(`/employees/${selectedEmployee?.id}`);
              }}
            >
              查看完整資料
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sub-department Detail Dialog */}
      <Dialog open={Boolean(selectedSubDept)} onOpenChange={open => !open && setSelectedSubDept(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>下級部門詳情</DialogTitle>
          </DialogHeader>
          {selectedSubDept && (
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold">
                  {selectedSubDept.code.split('-')[1]?.slice(0, 2) || selectedSubDept.name.slice(0, 2)}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{selectedSubDept.name}</h3>
                  <p className="text-sm text-muted-foreground font-mono">{selectedSubDept.code}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">負責人</Label>
                  <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                    <UserCheck className="h-3.5 w-3.5 text-muted-foreground" />
                    {selectedSubDept.manager}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">部門人數</Label>
                  <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                    {selectedSubDept.headcount} 人
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">上級部門</Label>
                  <p className="text-sm font-medium text-foreground">{dept.name}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">狀態</Label>
                  <Badge variant="secondary" className={subDeptStatusColors[selectedSubDept.status] || ''}>
                    {selectedSubDept.status}
                  </Badge>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs">所屬成員</Label>
                <div className="flex flex-wrap gap-2">
                  {dept.employees
                    .filter(e => e.department === selectedSubDept.name)
                    .map(e => (
                      <div key={e.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted text-sm">
                        <Avatar className="h-5 w-5">
                          <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
                            {e.name.slice(-2)}
                          </AvatarFallback>
                        </Avatar>
                        {e.name}
                      </div>
                    ))}
                  {dept.employees.filter(e => e.department === selectedSubDept.name).length === 0 && (
                    <p className="text-sm text-muted-foreground">暫無資料</p>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedSubDept(null)}>
              關閉
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
