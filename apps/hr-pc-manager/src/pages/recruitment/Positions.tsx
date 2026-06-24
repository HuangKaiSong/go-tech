import { Briefcase } from 'lucide-react';
import { PagePlaceholder } from '@/components/PagePlaceholder';

const columns = [
  { key: 'title', label: '職位名稱' },
  { key: 'department', label: '部門' },
  { key: 'count', label: '招聘人數' },
  { key: 'applied', label: '已應聘' },
  { key: 'deadline', label: '截止日期' },
  { key: 'status', label: '狀態' }
];

const data = [
  { title: '高級前端工程師', department: '技術部', count: 2, applied: 15, deadline: '2026-03-31', status: '招聘中' },
  { title: '產品經理', department: '運營部', count: 1, applied: 8, deadline: '2026-04-15', status: '招聘中' },
  { title: '行銷專員', department: '市場部', count: 3, applied: 22, deadline: '2026-03-20', status: '即將截止' },
  { title: '財務分析師', department: '財務部', count: 1, applied: 5, deadline: '2026-02-28', status: '已關閉' }
];

const statusColors: Record<string, string> = {
  招聘中: 'bg-success/10 text-success border-success/20',
  即將截止: 'bg-warning/10 text-warning border-warning/20',
  已關閉: 'bg-muted text-muted-foreground'
};

export default function Positions() {
  return (
    <PagePlaceholder
      title="職位管理"
      description="管理招聘職位的發布與需求"
      icon={Briefcase}
      columns={columns}
      data={data}
      statusKey="status"
      statusColors={statusColors}
      addLabel="發布職位"
    />
  );
}
