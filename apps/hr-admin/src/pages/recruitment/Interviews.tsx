import { CalendarDays } from "lucide-react";
import { PagePlaceholder } from "@/components/PagePlaceholder";

const columns = [
  { key: "candidate", label: "應聘者" },
  { key: "position", label: "面試職位" },
  { key: "interviewer", label: "面試官" },
  { key: "datetime", label: "面試時間" },
  { key: "type", label: "面試類型" },
  { key: "status", label: "狀態" },
];

const data = [
  { candidate: "劉書豪", position: "高級前端工程師", interviewer: "張技術總監", datetime: "2026-02-27 14:00", type: "技術面試", status: "待面試" },
  { candidate: "謝雅文", position: "行銷專員", interviewer: "陳市場主管", datetime: "2026-02-28 10:00", type: "初面", status: "待面試" },
  { candidate: "許芳華", position: "產品經理", interviewer: "王運營總監", datetime: "2026-02-25 15:00", type: "終面", status: "已完成" },
];

const statusColors: Record<string, string> = {
  "待面試": "bg-primary/10 text-primary border-primary/20",
  "已完成": "bg-success/10 text-success border-success/20",
  "已取消": "bg-muted text-muted-foreground",
};

export default function Interviews() {
  return (
    <PagePlaceholder
      title="面試管理"
      description="安排與追蹤面試流程"
      icon={CalendarDays}
      columns={columns}
      data={data}
      statusKey="status"
      statusColors={statusColors}
      addLabel="安排面試"
    />
  );
}
