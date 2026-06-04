import { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  ArrowLeft, UserPlus, Calendar, Phone, Mail, MapPin, Briefcase,
  CheckCircle2, Circle, Clock, FileText, Monitor, Building2, GraduationCap,
  User, ChevronRight, Upload, ExternalLink, Paperclip, X, Eye, File,
  Send, Link2,
} from "lucide-react";

/* ===== Data ===== */
interface TaskAction {
  type: "upload" | "link" | "send";
  label: string;
  route?: string; // for link type
  accept?: string; // for upload type
}

interface Task {
  name: string; category: string; done: boolean; dueDate: string; assignee: string;
  action?: TaskAction;
  files?: { name: string; size: string; uploadedAt: string }[];
}

interface OnboardingDetail {
  id: string; name: string; department: string; position: string;
  planDate: string; hrOwner: string; status: string; progress: number;
  phone: string; email: string; source: string; mentor: string;
  manager: string; probation: number; salaryType: string; notes: string;
  tasks: Task[];
}

const detailData: Record<string, OnboardingDetail> = {
  "OB-2026001": {
    id: "OB-2026001", name: "趙明軒", department: "技術部", position: "後端工程師",
    planDate: "2026-03-10", hrOwner: "王美玲", status: "進行中", progress: 65,
    phone: "0912-111-222", email: "mx.zhao@email.com", source: "獵頭推薦",
    mentor: "張小明", manager: "李文華", probation: 3, salaryType: "月薪",
    notes: "候選人技術能力優秀，需提前準備開發環境",
    tasks: [
      { name: "發送 Offer Letter", category: "文件簽署", done: true, dueDate: "2026-02-20", assignee: "王美玲", action: { type: "upload", label: "上傳 Offer Letter", accept: ".pdf,.doc,.docx" }, files: [{ name: "Offer_趙明軒.pdf", size: "245 KB", uploadedAt: "2026-02-20" }] },
      { name: "勞動合約簽署", category: "文件簽署", done: true, dueDate: "2026-02-25", assignee: "王美玲", action: { type: "upload", label: "上傳已簽合約", accept: ".pdf,.jpg,.png" }, files: [{ name: "合約_趙明軒_signed.pdf", size: "1.2 MB", uploadedAt: "2026-02-25" }] },
      { name: "個人資料收集", category: "文件簽署", done: true, dueDate: "2026-02-28", assignee: "趙明軒", action: { type: "link", label: "前往員工資料", route: "/employee-form" } },
      { name: "體檢報告", category: "文件簽署", done: false, dueDate: "2026-03-05", assignee: "趙明軒", action: { type: "upload", label: "上傳體檢報告", accept: ".pdf,.jpg,.png" } },
      { name: "銀行帳戶開設", category: "薪資社保", done: true, dueDate: "2026-03-01", assignee: "趙明軒", action: { type: "upload", label: "上傳銀行證明", accept: ".pdf,.jpg,.png" }, files: [{ name: "銀行帳戶證明.jpg", size: "520 KB", uploadedAt: "2026-03-01" }] },
      { name: "社保公積金登記", category: "薪資社保", done: false, dueDate: "2026-03-08", assignee: "林佳蓉", action: { type: "link", label: "前往薪資設定", route: "/payroll/structure" } },
      { name: "電腦設備申請", category: "IT 設備", done: true, dueDate: "2026-03-03", assignee: "黃志偉", action: { type: "upload", label: "上傳設備領取單", accept: ".pdf,.jpg,.png" }, files: [{ name: "設備領取單_趙明軒.pdf", size: "180 KB", uploadedAt: "2026-03-03" }] },
      { name: "帳號權限開通", category: "IT 設備", done: false, dueDate: "2026-03-08", assignee: "黃志偉", action: { type: "link", label: "前往系統設定", route: "/settings" } },
      { name: "工位安排", category: "行政準備", done: true, dueDate: "2026-03-05", assignee: "王美玲", action: { type: "upload", label: "上傳工位平面圖", accept: ".pdf,.jpg,.png" }, files: [{ name: "座位圖_3F-A12.png", size: "340 KB", uploadedAt: "2026-03-05" }] },
      { name: "門禁卡製作", category: "行政準備", done: false, dueDate: "2026-03-08", assignee: "王美玲", action: { type: "upload", label: "上傳證件照", accept: ".jpg,.png" } },
      { name: "部門介紹與導師分配", category: "入職培訓", done: false, dueDate: "2026-03-10", assignee: "張小明", action: { type: "link", label: "前往組織架構", route: "/organization/departments" } },
      { name: "新人培訓排程", category: "入職培訓", done: false, dueDate: "2026-03-10", assignee: "王美玲", action: { type: "link", label: "前往培訓計劃", route: "/training/plans" } },
    ],
  },
  "OB-2026002": {
    id: "OB-2026002", name: "吳雅婷", department: "市場部", position: "行銷專員",
    planDate: "2026-03-15", hrOwner: "王美玲", status: "資料待補", progress: 30,
    phone: "0923-333-444", email: "yt.wu@email.com", source: "校園招聘",
    mentor: "", manager: "陳大偉", probation: 3, salaryType: "月薪",
    notes: "應屆畢業生，需安排較完整的入職培訓",
    tasks: [
      { name: "發送 Offer Letter", category: "文件簽署", done: true, dueDate: "2026-02-28", assignee: "王美玲", action: { type: "upload", label: "上傳 Offer Letter", accept: ".pdf,.doc,.docx" }, files: [{ name: "Offer_吳雅婷.pdf", size: "230 KB", uploadedAt: "2026-02-28" }] },
      { name: "勞動合約簽署", category: "文件簽署", done: true, dueDate: "2026-03-05", assignee: "王美玲", action: { type: "upload", label: "上傳已簽合約", accept: ".pdf,.jpg,.png" }, files: [{ name: "合約_吳雅婷_signed.pdf", size: "1.1 MB", uploadedAt: "2026-03-05" }] },
      { name: "個人資料收集", category: "文件簽署", done: false, dueDate: "2026-03-08", assignee: "吳雅婷", action: { type: "send", label: "發送填寫連結", route: "/employee-form" } },
      { name: "體檢報告", category: "文件簽署", done: false, dueDate: "2026-03-10", assignee: "吳雅婷", action: { type: "upload", label: "上傳體檢報告", accept: ".pdf,.jpg,.png" } },
      { name: "銀行帳戶開設", category: "薪資社保", done: false, dueDate: "2026-03-10", assignee: "吳雅婷", action: { type: "upload", label: "上傳銀行證明", accept: ".pdf,.jpg,.png" } },
      { name: "社保公積金登記", category: "薪資社保", done: false, dueDate: "2026-03-12", assignee: "林佳蓉", action: { type: "link", label: "前往薪資設定", route: "/payroll/structure" } },
      { name: "電腦設備申請", category: "IT 設備", done: true, dueDate: "2026-03-10", assignee: "黃志偉", action: { type: "upload", label: "上傳設備領取單", accept: ".pdf,.jpg,.png" }, files: [{ name: "設備申請單_吳雅婷.pdf", size: "150 KB", uploadedAt: "2026-03-10" }] },
      { name: "帳號權限開通", category: "IT 設備", done: false, dueDate: "2026-03-13", assignee: "黃志偉", action: { type: "link", label: "前往系統設定", route: "/settings" } },
      { name: "工位安排", category: "行政準備", done: false, dueDate: "2026-03-12", assignee: "王美玲", action: { type: "upload", label: "上傳工位平面圖", accept: ".pdf,.jpg,.png" } },
      { name: "門禁卡製作", category: "行政準備", done: false, dueDate: "2026-03-13", assignee: "王美玲", action: { type: "upload", label: "上傳證件照", accept: ".jpg,.png" } },
    ],
  },
  "OB-2026003": {
    id: "OB-2026003", name: "鄭家豪", department: "運營部", position: "產品經理",
    planDate: "2026-02-20", hrOwner: "王美玲", status: "已完成", progress: 100,
    phone: "0934-555-666", email: "jh.zheng@email.com", source: "內部推薦",
    mentor: "陳大偉", manager: "陳大偉", probation: 3, salaryType: "月薪",
    notes: "",
    tasks: [
      { name: "發送 Offer Letter", category: "文件簽署", done: true, dueDate: "2026-02-01", assignee: "王美玲", action: { type: "upload", label: "上傳 Offer Letter", accept: ".pdf" }, files: [{ name: "Offer_鄭家豪.pdf", size: "240 KB", uploadedAt: "2026-02-01" }] },
      { name: "勞動合約簽署", category: "文件簽署", done: true, dueDate: "2026-02-05", assignee: "王美玲", action: { type: "upload", label: "上傳已簽合約", accept: ".pdf" }, files: [{ name: "合約_鄭家豪_signed.pdf", size: "1.3 MB", uploadedAt: "2026-02-05" }] },
      { name: "個人資料收集", category: "文件簽署", done: true, dueDate: "2026-02-08", assignee: "鄭家豪", action: { type: "link", label: "查看員工資料", route: "/employee-form" } },
      { name: "體檢報告", category: "文件簽署", done: true, dueDate: "2026-02-10", assignee: "鄭家豪", action: { type: "upload", label: "上傳體檢報告", accept: ".pdf" }, files: [{ name: "體檢報告_鄭家豪.pdf", size: "890 KB", uploadedAt: "2026-02-10" }] },
      { name: "銀行帳戶開設", category: "薪資社保", done: true, dueDate: "2026-02-10", assignee: "鄭家豪", action: { type: "upload", label: "上傳銀行證明", accept: ".pdf,.jpg" }, files: [{ name: "銀行證明.pdf", size: "320 KB", uploadedAt: "2026-02-10" }] },
      { name: "社保公積金登記", category: "薪資社保", done: true, dueDate: "2026-02-15", assignee: "林佳蓉", action: { type: "link", label: "前往薪資設定", route: "/payroll/structure" } },
      { name: "電腦設備申請", category: "IT 設備", done: true, dueDate: "2026-02-12", assignee: "黃志偉", action: { type: "upload", label: "上傳設備領取單", accept: ".pdf" }, files: [{ name: "設備領取單.pdf", size: "160 KB", uploadedAt: "2026-02-12" }] },
      { name: "帳號權限開通", category: "IT 設備", done: true, dueDate: "2026-02-15", assignee: "黃志偉", action: { type: "link", label: "前往系統設定", route: "/settings" } },
      { name: "工位安排", category: "行政準備", done: true, dueDate: "2026-02-15", assignee: "王美玲", action: { type: "upload", label: "上傳工位平面圖", accept: ".pdf,.jpg,.png" }, files: [{ name: "座位圖_2F-B05.png", size: "280 KB", uploadedAt: "2026-02-15" }] },
      { name: "門禁卡製作", category: "行政準備", done: true, dueDate: "2026-02-18", assignee: "王美玲", action: { type: "upload", label: "上傳證件照", accept: ".jpg,.png" }, files: [{ name: "證件照_鄭家豪.jpg", size: "95 KB", uploadedAt: "2026-02-18" }] },
      { name: "部門介紹與導師分配", category: "入職培訓", done: true, dueDate: "2026-02-20", assignee: "陳大偉", action: { type: "link", label: "前往組織架構", route: "/organization/departments" } },
      { name: "新人培訓排程", category: "入職培訓", done: true, dueDate: "2026-02-20", assignee: "王美玲", action: { type: "link", label: "前往培訓計劃", route: "/training/plans" } },
    ],
  },
  "OB-2026004": {
    id: "OB-2026004", name: "林詩涵", department: "財務部", position: "會計師",
    planDate: "2026-03-20", hrOwner: "王美玲", status: "待入職", progress: 10,
    phone: "0945-777-888", email: "sh.lin@email.com", source: "求職平台",
    mentor: "", manager: "林佳蓉", probation: 3, salaryType: "月薪",
    notes: "CPA 證照持有者",
    tasks: [
      { name: "發送 Offer Letter", category: "文件簽署", done: true, dueDate: "2026-03-05", assignee: "王美玲", action: { type: "upload", label: "上傳 Offer Letter", accept: ".pdf,.doc,.docx" }, files: [{ name: "Offer_林詩涵.pdf", size: "235 KB", uploadedAt: "2026-03-05" }] },
      { name: "勞動合約簽署", category: "文件簽署", done: false, dueDate: "2026-03-10", assignee: "王美玲", action: { type: "upload", label: "上傳已簽合約", accept: ".pdf,.jpg,.png" } },
      { name: "個人資料收集", category: "文件簽署", done: false, dueDate: "2026-03-12", assignee: "林詩涵", action: { type: "send", label: "發送填寫連結", route: "/employee-form" } },
      { name: "體檢報告", category: "文件簽署", done: false, dueDate: "2026-03-15", assignee: "林詩涵", action: { type: "upload", label: "上傳體檢報告", accept: ".pdf,.jpg,.png" } },
      { name: "銀行帳戶開設", category: "薪資社保", done: false, dueDate: "2026-03-15", assignee: "林詩涵", action: { type: "upload", label: "上傳銀行證明", accept: ".pdf,.jpg,.png" } },
      { name: "社保公積金登記", category: "薪資社保", done: false, dueDate: "2026-03-18", assignee: "林佳蓉", action: { type: "link", label: "前往薪資設定", route: "/payroll/structure" } },
      { name: "電腦設備申請", category: "IT 設備", done: false, dueDate: "2026-03-15", assignee: "黃志偉", action: { type: "upload", label: "上傳設備領取單", accept: ".pdf,.jpg,.png" } },
      { name: "帳號權限開通", category: "IT 設備", done: false, dueDate: "2026-03-18", assignee: "黃志偉", action: { type: "link", label: "前往系統設定", route: "/settings" } },
      { name: "工位安排", category: "行政準備", done: false, dueDate: "2026-03-18", assignee: "王美玲", action: { type: "upload", label: "上傳工位平面圖", accept: ".pdf,.jpg,.png" } },
      { name: "門禁卡製作", category: "行政準備", done: false, dueDate: "2026-03-18", assignee: "王美玲", action: { type: "upload", label: "上傳證件照", accept: ".jpg,.png" } },
    ],
  },
};

const categoryIcon: Record<string, any> = {
  "文件簽署": FileText,
  "薪資社保": Building2,
  "IT 設備": Monitor,
  "行政準備": MapPin,
  "入職培訓": GraduationCap,
};

const statusConfig: Record<string, { color: string; dot: string }> = {
  "待入職": { color: "bg-primary/10 text-primary border-primary/20", dot: "bg-primary" },
  "進行中": { color: "bg-info/10 text-info border-info/20", dot: "bg-info" },
  "資料待補": { color: "bg-warning/10 text-warning border-warning/20", dot: "bg-warning" },
  "已完成": { color: "bg-success/10 text-success border-success/20", dot: "bg-success" },
};

/* ===== Page ===== */
export default function OnboardingDetail() {
  const { obId } = useParams<{ obId: string }>();
  const navigate = useNavigate();
  const detail = detailData[obId || ""];

  const [tasks, setTasks] = useState<Task[]>(detail?.tasks || []);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [uploadDialog, setUploadDialog] = useState<{ open: boolean; taskIdx: number; label: string; accept: string }>({ open: false, taskIdx: -1, label: "", accept: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!detail) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
        <p className="text-lg font-medium">找不到此入職記錄</p>
        <Button variant="link" onClick={() => navigate("/employees/onboarding")}>返回列表</Button>
      </div>
    );
  }

  const doneCount = tasks.filter((t) => t.done).length;
  const progress = Math.round((doneCount / tasks.length) * 100);
  const categories = Array.from(new Set(tasks.map((t) => t.category)));
  const filteredTasks = activeCategory === "all" ? tasks : tasks.filter((t) => t.category === activeCategory);

  const toggleTask = (index: number) => {
    const realIndex = activeCategory === "all" ? index : tasks.indexOf(filteredTasks[index]);
    setTasks((prev) => prev.map((t, i) => i === realIndex ? { ...t, done: !t.done } : t));
    toast.success(tasks[realIndex].done ? `已取消完成「${tasks[realIndex].name}」` : `已完成「${tasks[realIndex].name}」`);
  };

  const handleUploadClick = (taskIdx: number) => {
    const realIdx = activeCategory === "all" ? taskIdx : tasks.indexOf(filteredTasks[taskIdx]);
    const task = tasks[realIdx];
    if (task.action?.type === "upload") {
      setUploadDialog({ open: true, taskIdx: realIdx, label: task.action.label, accept: task.action.accept || "" });
    }
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const sizeStr = file.size > 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : `${Math.round(file.size / 1024)} KB`;
    setTasks((prev) => prev.map((t, i) => i === uploadDialog.taskIdx ? {
      ...t,
      files: [...(t.files || []), { name: file.name, size: sizeStr, uploadedAt: new Date().toISOString().split("T")[0] }],
    } : t));
    toast.success(`已上傳「${file.name}」`);
    setUploadDialog({ open: false, taskIdx: -1, label: "", accept: "" });
    e.target.value = "";
  };

  const handleRemoveFile = (taskIdx: number, fileIdx: number) => {
    const realIdx = activeCategory === "all" ? taskIdx : tasks.indexOf(filteredTasks[taskIdx]);
    setTasks((prev) => prev.map((t, i) => i === realIdx ? {
      ...t,
      files: (t.files || []).filter((_, fi) => fi !== fileIdx),
    } : t));
    toast.success("檔案已移除");
  };

  const handleAction = (taskIdx: number) => {
    const realIdx = activeCategory === "all" ? taskIdx : tasks.indexOf(filteredTasks[taskIdx]);
    const task = tasks[realIdx];
    if (!task.action) return;
    if (task.action.type === "upload") {
      handleUploadClick(taskIdx);
    } else if (task.action.type === "link" && task.action.route) {
      navigate(task.action.route);
    } else if (task.action.type === "send") {
      toast.success("已發送填寫連結至員工信箱");
    }
  };

  const sc = statusConfig[detail.status] || statusConfig["待入職"];

  const daysUntil = Math.ceil((new Date(detail.planDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl bg-card border p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-5">
            <Button variant="ghost" size="icon" className="-ml-2" onClick={() => navigate("/employees/onboarding")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Avatar className="h-16 w-16 text-lg">
              <AvatarFallback className="bg-primary/10 text-primary font-bold">{detail.name.slice(-2)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-xl font-bold">{detail.name}</h1>
                <Badge variant="secondary" className={sc.color}>
                  <span className={`inline-block h-1.5 w-1.5 rounded-full mr-1.5 ${sc.dot}`} />
                  {detail.status}
                </Badge>
                {daysUntil > 0 && detail.status !== "已完成" && (
                  <span className="text-xs text-muted-foreground bg-muted/60 px-2 py-0.5 rounded">
                    距入職 {daysUntil} 天
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{detail.department} · {detail.position}</p>
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" />{detail.id}</span>
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />入職 {detail.planDate}</span>
                <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{detail.phone}</span>
                <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{detail.email}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Left: Info */}
        <div className="w-72 shrink-0 space-y-4">
          {/* Progress */}
          <Card>
            <CardContent className="pt-5 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">入職進度</p>
                <span className="text-lg font-bold text-primary">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground">{doneCount} / {tasks.length} 項任務已完成</p>
            </CardContent>
          </Card>

          {/* Details */}
          <Card>
            <CardContent className="pt-5 space-y-3">
              <p className="text-sm font-semibold mb-2">入職資訊</p>
              <InfoLine label="招聘來源" value={detail.source} />
              <InfoLine label="負責 HR" value={detail.hrOwner} />
              <InfoLine label="直屬主管" value={detail.manager} />
              <InfoLine label="入職導師" value={detail.mentor || "待分配"} />
              <InfoLine label="試用期" value={`${detail.probation} 個月`} />
              <InfoLine label="薪資類型" value={detail.salaryType} />
              {detail.notes && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">備註</p>
                    <p className="text-sm">{detail.notes}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Category nav */}
          <Card>
            <CardContent className="pt-5">
              <p className="text-sm font-semibold mb-3">任務分類</p>
              <div className="space-y-1">
                <button
                  onClick={() => setActiveCategory("all")}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                    activeCategory === "all" ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted/60"
                  }`}
                >
                  <span>全部</span>
                  <span className="text-xs">{doneCount}/{tasks.length}</span>
                </button>
                {categories.map((cat) => {
                  const Icon = categoryIcon[cat] || Circle;
                  const catTasks = tasks.filter((t) => t.category === cat);
                  const catDone = catTasks.filter((t) => t.done).length;
                  return (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                        activeCategory === cat ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted/60"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Icon className="h-3.5 w-3.5" />
                        {cat}
                      </span>
                      <span className="text-xs">{catDone}/{catTasks.length}</span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Tasks */}
        <div className="flex-1 min-w-0 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">
              {activeCategory === "all" ? "全部任務" : activeCategory}
            </h2>
            <span className="text-xs text-muted-foreground">
              {filteredTasks.filter((t) => t.done).length}/{filteredTasks.length} 已完成
            </span>
          </div>

          <div className="space-y-2">
            {filteredTasks.map((task, idx) => {
              const isOverdue = !task.done && new Date(task.dueDate) < new Date();
              const actionIcon = task.action?.type === "upload" ? Upload : task.action?.type === "send" ? Send : ExternalLink;
              const ActionIcon = actionIcon;
              return (
                <div
                  key={`${task.name}-${idx}`}
                  className={`group rounded-lg border p-4 transition-colors ${
                    task.done ? "bg-muted/30 border-border/50" : "bg-card hover:border-primary/30"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={task.done}
                      onCheckedChange={() => toggleTask(idx)}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-sm font-medium ${task.done ? "line-through text-muted-foreground" : ""}`}>
                          {task.name}
                        </p>
                        <div className="flex items-center gap-2 shrink-0">
                          {activeCategory === "all" && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal">
                              {task.category}
                            </Badge>
                          )}
                          {task.action && (
                            <Button
                              variant={task.action.type === "upload" ? "outline" : "ghost"}
                              size="sm"
                              className="h-7 text-xs gap-1 px-2"
                              onClick={(e) => { e.stopPropagation(); handleAction(idx); }}
                            >
                              <ActionIcon className="h-3 w-3" />
                              {task.action.label}
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground">
                        <span className={`flex items-center gap-1 ${isOverdue ? "text-destructive font-medium" : ""}`}>
                          <Clock className="h-3 w-3" />
                          {isOverdue ? "已逾期 · " : ""}
                          {task.dueDate}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {task.assignee}
                        </span>
                        {task.files && task.files.length > 0 && (
                          <span className="flex items-center gap-1 text-primary">
                            <Paperclip className="h-3 w-3" />
                            {task.files.length} 個附件
                          </span>
                        )}
                      </div>

                      {/* Attached files */}
                      {task.files && task.files.length > 0 && (
                        <div className="mt-2.5 space-y-1.5">
                          {task.files.map((f, fi) => (
                            <div key={fi} className="flex items-center gap-2 bg-muted/40 rounded-md px-2.5 py-1.5 text-xs group/file">
                              <File className="h-3.5 w-3.5 text-primary shrink-0" />
                              <span className="font-medium truncate flex-1">{f.name}</span>
                              <span className="text-muted-foreground shrink-0">{f.size}</span>
                              <span className="text-muted-foreground shrink-0">{f.uploadedAt}</span>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleRemoveFile(idx, fi); }}
                                className="opacity-0 group-hover/file:opacity-100 text-muted-foreground hover:text-destructive transition-opacity shrink-0"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredTasks.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle2 className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm">此分類下暫無任務</p>
            </div>
          )}
        </div>
      </div>

      {/* Upload Dialog */}
      <Dialog open={uploadDialog.open} onOpenChange={(v) => !v && setUploadDialog({ open: false, taskIdx: -1, label: "", accept: "" })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              {uploadDialog.label}
            </DialogTitle>
            <DialogDescription>選擇要上傳的檔案</DialogDescription>
          </DialogHeader>
          <div
            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm font-medium">點擊選擇檔案</p>
            <p className="text-xs text-muted-foreground mt-1">支援格式：{uploadDialog.accept || "所有格式"}，最大 10MB</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept={uploadDialog.accept}
            className="hidden"
            onChange={handleFileSelected}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialog({ open: false, taskIdx: -1, label: "", accept: "" })}>取消</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
