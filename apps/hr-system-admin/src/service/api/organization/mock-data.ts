/** Organization 模块迁移期 Mock 数据（来源：hr-pc-manager 原页面） */

export const MOCK_DEPARTMENTS: Api.Organization.Department[] = [
  {
    code: 'TECH',
    createdAt: '2023-01-15',
    description: '负责公司技术研发与平台架构',
    id: 'D001',
    managerName: '李技術長',
    memberCount: 320,
    name: '技術部',
    status: '1'
  },
  {
    code: 'SALES',
    createdAt: '2023-01-20',
    description: '负责市场拓展与客户销售',
    id: 'D002',
    managerName: '陳銷售總監',
    memberCount: 98,
    name: '銷售部',
    status: '1'
  },
  {
    code: 'OPS',
    createdAt: '2023-02-10',
    description: '负责产品运营与用户增长',
    id: 'D003',
    managerName: '林運營總監',
    memberCount: 45,
    name: '運營部',
    status: '1'
  },
  {
    code: 'HR',
    createdAt: '2023-01-05',
    description: '负责人力资源与组织发展',
    id: 'D004',
    managerName: '王人資經理',
    memberCount: 12,
    name: '人力資源部',
    status: '1'
  },
  {
    code: 'FIN',
    createdAt: '2023-01-05',
    description: '负责财务核算与预算管理',
    id: 'D005',
    managerName: '趙財務經理',
    memberCount: 8,
    name: '財務部',
    status: '1'
  },
  {
    code: 'ADMIN',
    createdAt: '2024-06-01',
    description: '负责行政后勤与办公支持',
    id: 'D006',
    managerName: null,
    memberCount: 0,
    name: '行政部',
    status: '2'
  }
];

export const MOCK_ROLES: Api.Organization.Role[] = [
  {
    createdAt: '2023-01-15',
    department: '技術部',
    headcount: 1,
    id: 'R001',
    level: 'M3',
    salaryRange: '80K-120K',
    status: '1',
    title: '技術總監'
  },
  {
    createdAt: '2023-01-15',
    department: '技術部',
    headcount: 45,
    id: 'R002',
    level: 'P3',
    salaryRange: '40K-65K',
    status: '1',
    title: '高級工程師'
  },
  {
    createdAt: '2023-02-01',
    department: '技術部',
    headcount: 120,
    id: 'R003',
    level: 'P2',
    salaryRange: '25K-40K',
    status: '1',
    title: '工程師'
  },
  {
    createdAt: '2023-01-20',
    department: '銷售部',
    headcount: 8,
    id: 'R004',
    level: 'M2',
    salaryRange: '35K-55K',
    status: '1',
    title: '銷售經理'
  },
  {
    createdAt: '2023-03-01',
    department: '銷售部',
    headcount: 90,
    id: 'R005',
    level: 'P1',
    salaryRange: '15K-25K',
    status: '1',
    title: '銷售專員'
  },
  {
    createdAt: '2023-02-10',
    department: '運營部',
    headcount: 12,
    id: 'R006',
    level: 'P3',
    salaryRange: '40K-60K',
    status: '1',
    title: '產品經理'
  },
  {
    createdAt: '2024-06-01',
    department: '行政部',
    headcount: 0,
    id: 'R007',
    level: 'P0',
    salaryRange: '8K-12K',
    status: '2',
    title: '實習助理'
  }
];
