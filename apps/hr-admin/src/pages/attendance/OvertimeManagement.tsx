import { Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PagePlaceholder } from "@/components/PagePlaceholder";

const data = [
  { name: "張小明", department: "技術部", date: "2026-02-25", hours: "3", reason: "專案上線", status: "已核准" },
  { name: "黃志偉", department: "技術部", date: "2026-02-24", hours: "2", reason: "Bug 修復", status: "已核准" },
  { name: "林佳蓉", department: "財務部", date: "2026-02-26", hours: "4", reason: "月結報告", status: "待審核" },
];

const statusColors: Record<string, string> = {
  "待審核": "bg-warning/10 text-warning border-warning/20",
  "已核准": "bg-success/10 text-success border-success/20",
  "已駁回": "bg-destructive/10 text-destructive border-destructive/20",
};

export default function OvertimeManagement() {
  const { t } = useTranslation();
  const columns = [
    { key: "name", label: t("申請人") },
    { key: "department", label: t("部門") },
    { key: "date", label: t("加班日期") },
    { key: "hours", label: t("加班時數") },
    { key: "reason", label: t("原因") },
    { key: "status", label: t("狀態") },
  ];
  return (
    <PagePlaceholder
      title={t("加班管理")}
      description={t("管理員工加班申請與審批")}
      icon={Clock}
      columns={columns}
      data={data}
      statusKey="status"
      statusColors={statusColors}
      addLabel={t("申請加班")}
    />
  );
}
