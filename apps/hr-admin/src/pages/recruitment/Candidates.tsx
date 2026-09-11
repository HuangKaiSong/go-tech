import { UserPlus } from 'lucide-react';
import { PagePlaceholder } from '@/components/PagePlaceholder';

const columns = [
  { key: 'name', label: '姓名' },
  { key: 'position', label: '應聘職位' },
  { key: 'education', label: '學歷' },
  { key: 'experience', label: '工作經驗' },
  { key: 'applyDate', label: '應聘日期' },
  { key: 'status', label: '狀態' }
];

const data = [
  {
    name: '劉書豪',
    position: '高級前端工程師',
    education: '碩士',
    experience: '5年',
    applyDate: '2026-02-20',
    status: '待篩選'
  },
  {
    name: '許芳華',
    position: '產品經理',
    education: '學士',
    experience: '3年',
    applyDate: '2026-02-18',
    status: '已面試'
  },
  {
    name: '楊志剛',
    position: '高級前端工程師',
    education: '學士',
    experience: '7年',
    applyDate: '2026-02-15',
    status: '已錄取'
  },
  {
    name: '謝雅文',
    position: '行銷專員',
    education: '碩士',
    experience: '2年',
    applyDate: '2026-02-22',
    status: '待篩選'
  }
];

const statusColors: Record<string, string> = {
  待篩選: 'bg-primary/10 text-primary border-primary/20',
  已面試: 'bg-warning/10 text-warning border-warning/20',
  已錄取: 'bg-success/10 text-success border-success/20',
  已拒絕: 'bg-destructive/10 text-destructive border-destructive/20'
};

export default function Candidates() {
  return (
    <PagePlaceholder
      title="應聘管理"
      description="管理應聘者資料與篩選流程"
      icon={UserPlus}
      columns={columns}
      data={data}
      statusKey="status"
      statusColors={statusColors}
      addLabel="新增應聘者"
    />
  );
}
