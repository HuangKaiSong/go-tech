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
  ArrowLeft, UserMinus, Calendar, Phone, Mail, Briefcase,
  CheckCircle2, Circle, Clock, FileText, Monitor, Building2,
  User, Upload, ExternalLink, Paperclip, X, File, Send, Link2,
  Shield, MessageSquare, DollarSign, Package,
} from "lucide-react";

/* ===== Data ===== */
interface TaskAction {
  type: "upload" | "link" | "send";
  label: string;
  route?: string;
  accept?: string;
}

interface Task {
  name: string; category: string; done: boolean; dueDate: string; assignee: string;
  action?: TaskAction;
  files?: { name: string; size: string; uploadedAt: string }[];
}

interface OffboardingDetail {
  id: string; name: string; department: string; position: string;
  resignDate: string; lastDay: string; hrOwner: string; reason: string;
  reasonType: string; status: string; progress: number;
  phone: string; email: string; handoverTo: string;
  manager: string; nonCompete: boolean; notes: string;
  tasks: Task[];
}

const detailData: Record<string, OffboardingDetail> = {
  "OFF-2026001": {
    id: "OFF-2026001", name: "周建華", department: "銷售部", position: "業務經理",
    resignDate: "2026-02-01", lastDay: "2026-02-28", hrOwner: "王美玲",
    reason: "個人因素", reasonType: "主動離職", status: "交接中", progress: 55,
    phone: "0912-222-333", email: "jh.zhou@email.com",
    handoverTo: "陳志豪", manager: "林佳蓉", nonCompete: true,
    notes: "重要客戶需特別交接",
    tasks: [
      { name: "離職申請審批", category: "審批流程", done: true, dueDate: "2026-02-03", assignee: "林佳蓉", action: { type: "upload", label: "上傳審批單", accept: ".pdf,.doc,.docx" }, files: [{ name: "離職申請_周建華.pdf", size: "180 KB", uploadedAt: "2026-02-03" }] },
      { name: "部門主管確認", category: "審批流程", done: true, dueDate: "2026-02-05", assignee: "林佳蓉", action: { type: "upload", label: "上傳確認函", accept: ".pdf" }, files: [{ name: "主管確認函.pdf", size: "120 KB", uploadedAt: "2026-02-05" }] },
      { name: "HR 審核", category: "審批流程", done: true, dueDate: "2026-02-07", assignee: "王美玲", action: { type: "link", label: "查看員工檔案", route: "/employees" } },
      { name: "工作內容交接文件", category: "工作交接", done: true, dueDate: "2026-02-15", assignee: "周建華", action: { type: "upload", label: "上傳交接文件", accept: ".pdf,.doc,.docx,.xlsx" }, files: [{ name: "工作交接清單_周建華.xlsx", size: "450 KB", uploadedAt: "2026-02-14" }] },
      { name: "客戶/專案交接", category: "工作交接", done: true, dueDate: "2026-02-20", assignee: "周建華", action: { type: "upload", label: "上傳客戶清單", accept: ".xlsx,.pdf" }, files: [{ name: "客戶交接清單.xlsx", size: "680 KB", uploadedAt: "2026-02-18" }] },
      { name: "未完成工作確認", category: "工作交接", done: false, dueDate: "2026-02-25", assignee: "陳志豪", action: { type: "upload", label: "上傳確認單", accept: ".pdf" } },
      { name: "電腦設備歸還", category: "資產歸還", done: false, dueDate: "2026-02-26", assignee: "黃志偉", action: { type: "upload", label: "上傳歸還單", accept: ".pdf,.jpg,.png" } },
      { name: "門禁卡歸還", category: "資產歸還", done: false, dueDate: "2026-02-28", assignee: "王美玲", action: { type: "upload", label: "上傳歸還記錄", accept: ".pdf,.jpg" } },
      { name: "辦公用品歸還", category: "資產歸還", done: false, dueDate: "2026-02-28", assignee: "王美玲", action: { type: "upload", label: "上傳歸還清單", accept: ".pdf" } },
      { name: "公司資料清理", category: "資產歸還", done: false, dueDate: "2026-02-27", assignee: "黃志偉", action: { type: "link", label: "前往系統設定", route: "/settings" } },
      { name: "系統帳號停用", category: "帳號權限", done: false, dueDate: "2026-02-28", assignee: "黃志偉", action: { type: "link", label: "前往系統設定", route: "/settings" } },
      { name: "郵箱設定轉發", category: "帳號權限", done: false, dueDate: "2026-02-28", assignee: "黃志偉", action: { type: "link", label: "前往系統設定", route: "/settings" } },
      { name: "VPN/遠端權限關閉", category: "帳號權限", done: false, dueDate: "2026-02-28", assignee: "黃志偉", action: { type: "link", label: "前往系統設定", route: "/settings" } },
      { name: "剩餘年假結算", category: "薪資結算", done: true, dueDate: "2026-02-20", assignee: "林佳蓉", action: { type: "link", label: "前往薪資計算", route: "/payroll/calculate" } },
      { name: "最後薪資計算", category: "薪資結算", done: false, dueDate: "2026-02-28", assignee: "林佳蓉", action: { type: "link", label: "前往薪資計算", route: "/payroll/calculate" } },
      { name: "社保公積金停繳", category: "薪資結算", done: false, dueDate: "2026-03-01", assignee: "林佳蓉", action: { type: "link", label: "前往薪資設定", route: "/payroll/structure" } },
      { name: "離職證明開立", category: "薪資結算", done: false, dueDate: "2026-03-01", assignee: "王美玲", action: { type: "upload", label: "上傳離職證明", accept: ".pdf" } },
      { name: "離職面談安排", category: "離職面談", done: true, dueDate: "2026-02-22", assignee: "王美玲", action: { type: "upload", label: "上傳面談紀錄", accept: ".pdf,.doc,.docx" }, files: [{ name: "離職面談紀錄_周建華.pdf", size: "220 KB", uploadedAt: "2026-02-22" }] },
      { name: "離職問卷填寫", category: "離職面談", done: false, dueDate: "2026-02-25", assignee: "周建華", action: { type: "send", label: "發送問卷連結" } },
    ],
  },
  "OFF-2026002": {
    id: "OFF-2026002", name: "蔡佩琪", department: "客服部", position: "客服主管",
    resignDate: "2026-02-15", lastDay: "2026-03-15", hrOwner: "王美玲",
    reason: "職涯發展", reasonType: "主動離職", status: "待審批", progress: 10,
    phone: "0923-444-555", email: "pq.tsai@email.com",
    handoverTo: "待指定", manager: "陳大偉", nonCompete: false,
    notes: "",
    tasks: [
      { name: "離職申請審批", category: "審批流程", done: false, dueDate: "2026-02-18", assignee: "陳大偉", action: { type: "upload", label: "上傳審批單", accept: ".pdf" } },
      { name: "部門主管確認", category: "審批流程", done: false, dueDate: "2026-02-20", assignee: "陳大偉", action: { type: "upload", label: "上傳確認函", accept: ".pdf" } },
      { name: "HR 審核", category: "審批流程", done: true, dueDate: "2026-02-22", assignee: "王美玲", action: { type: "link", label: "查看員工檔案", route: "/employees" } },
      { name: "工作內容交接文件", category: "工作交接", done: false, dueDate: "2026-03-05", assignee: "蔡佩琪", action: { type: "upload", label: "上傳交接文件", accept: ".pdf,.doc,.docx,.xlsx" } },
      { name: "客戶/專案交接", category: "工作交接", done: false, dueDate: "2026-03-08", assignee: "蔡佩琪", action: { type: "upload", label: "上傳客戶清單", accept: ".xlsx,.pdf" } },
      { name: "未完成工作確認", category: "工作交接", done: false, dueDate: "2026-03-10", assignee: "待指定", action: { type: "upload", label: "上傳確認單", accept: ".pdf" } },
      { name: "電腦設備歸還", category: "資產歸還", done: false, dueDate: "2026-03-13", assignee: "黃志偉", action: { type: "upload", label: "上傳歸還單", accept: ".pdf,.jpg,.png" } },
      { name: "門禁卡歸還", category: "資產歸還", done: false, dueDate: "2026-03-15", assignee: "王美玲", action: { type: "upload", label: "上傳歸還記錄", accept: ".pdf,.jpg" } },
      { name: "系統帳號停用", category: "帳號權限", done: false, dueDate: "2026-03-15", assignee: "黃志偉", action: { type: "link", label: "前往系統設定", route: "/settings" } },
      { name: "最後薪資計算", category: "薪資結算", done: false, dueDate: "2026-03-15", assignee: "林佳蓉", action: { type: "link", label: "前往薪資計算", route: "/payroll/calculate" } },
      { name: "離職證明開立", category: "薪資結算", done: false, dueDate: "2026-03-16", assignee: "王美玲", action: { type: "upload", label: "上傳離職證明", accept: ".pdf" } },
      { name: "離職面談安排", category: "離職面談", done: false, dueDate: "2026-03-12", assignee: "王美玲", action: { type: "upload", label: "上傳面談紀錄", accept: ".pdf,.doc" } },
    ],
  },
  "OFF-2026003": {
    id: "OFF-2026003", name: "黃俊傑", department: "技術部", position: "前端工程師",
    resignDate: "2026-01-10", lastDay: "2026-02-10", hrOwner: "王美玲",
    reason: "轉職", reasonType: "主動離職", status: "已完成", progress: 100,
    phone: "0934-666-777", email: "jj.huang@email.com",
    handoverTo: "趙明軒", manager: "李文華", nonCompete: false,
    notes: "",
    tasks: [
      { name: "離職申請審批", category: "審批流程", done: true, dueDate: "2026-01-12", assignee: "李文華", action: { type: "upload", label: "上傳審批單", accept: ".pdf" }, files: [{ name: "離職申請_黃俊傑.pdf", size: "150 KB", uploadedAt: "2026-01-12" }] },
      { name: "部門主管確認", category: "審批流程", done: true, dueDate: "2026-01-14", assignee: "李文華", action: { type: "upload", label: "上傳確認函", accept: ".pdf" }, files: [{ name: "主管確認函.pdf", size: "110 KB", uploadedAt: "2026-01-14" }] },
      { name: "HR 審核", category: "審批流程", done: true, dueDate: "2026-01-15", assignee: "王美玲", action: { type: "link", label: "查看員工檔案", route: "/employees" } },
      { name: "工作內容交接文件", category: "工作交接", done: true, dueDate: "2026-01-25", assignee: "黃俊傑", action: { type: "upload", label: "上傳交接文件", accept: ".pdf,.doc" }, files: [{ name: "前端專案交接文件.pdf", size: "1.2 MB", uploadedAt: "2026-01-24" }] },
      { name: "電腦設備歸還", category: "資產歸還", done: true, dueDate: "2026-02-10", assignee: "黃志偉", action: { type: "upload", label: "上傳歸還單", accept: ".pdf" }, files: [{ name: "設備歸還單.pdf", size: "95 KB", uploadedAt: "2026-02-10" }] },
      { name: "門禁卡歸還", category: "資產歸還", done: true, dueDate: "2026-02-10", assignee: "王美玲", action: { type: "upload", label: "上傳歸還記錄", accept: ".pdf" }, files: [{ name: "門禁卡歸還記錄.pdf", size: "80 KB", uploadedAt: "2026-02-10" }] },
      { name: "系統帳號停用", category: "帳號權限", done: true, dueDate: "2026-02-10", assignee: "黃志偉", action: { type: "link", label: "前往系統設定", route: "/settings" } },
      { name: "最後薪資計算", category: "薪資結算", done: true, dueDate: "2026-02-10", assignee: "林佳蓉", action: { type: "link", label: "前往薪資計算", route: "/payroll/calculate" } },
      { name: "離職證明開立", category: "薪資結算", done: true, dueDate: "2026-02-11", assignee: "王美玲", action: { type: "upload", label: "上傳離職證明", accept: ".pdf" }, files: [{ name: "離職證明_黃俊傑.pdf", size: "160 KB", uploadedAt: "2026-02-11" }] },
      { name: "離職面談安排", category: "離職面談", done: true, dueDate: "2026-02-08", assignee: "王美玲", action: { type: "upload", label: "上傳面談紀錄", accept: ".pdf" }, files: [{ name: "離職面談紀錄.pdf", size: "200 KB", uploadedAt: "2026-02-08" }] },
    ],
  },
  "OFF-2026004": {
    id: "OFF-2026004", name: "張雅琳", department: "市場部", position: "行銷企劃",
    resignDate: "2026-02-20", lastDay: "2026-03-20", hrOwner: "李文華",
    reason: "家庭因素", reasonType: "主動離職", status: "待結算", progress: 80,
    phone: "0945-888-999", email: "yl.zhang@email.com",
    handoverTo: "吳雅婷", manager: "陳大偉", nonCompete: false,
    notes: "希望保持良好關係，未來可能回聘",
    tasks: [
      { name: "離職申請審批", category: "審批流程", done: true, dueDate: "2026-02-22", assignee: "陳大偉", action: { type: "upload", label: "上傳審批單", accept: ".pdf" }, files: [{ name: "離職申請_張雅琳.pdf", size: "170 KB", uploadedAt: "2026-02-22" }] },
      { name: "部門主管確認", category: "審批流程", done: true, dueDate: "2026-02-24", assignee: "陳大偉", action: { type: "upload", label: "上傳確認函", accept: ".pdf" }, files: [{ name: "主管確認函.pdf", size: "115 KB", uploadedAt: "2026-02-24" }] },
      { name: "HR 審核", category: "審批流程", done: true, dueDate: "2026-02-25", assignee: "李文華", action: { type: "link", label: "查看員工檔案", route: "/employees" } },
      { name: "工作內容交接文件", category: "工作交接", done: true, dueDate: "2026-03-05", assignee: "張雅琳", action: { type: "upload", label: "上傳交接文件", accept: ".pdf,.doc,.xlsx" }, files: [{ name: "行銷專案交接.xlsx", size: "520 KB", uploadedAt: "2026-03-04" }] },
      { name: "客戶/專案交接", category: "工作交接", done: true, dueDate: "2026-03-08", assignee: "張雅琳", action: { type: "upload", label: "上傳客戶清單", accept: ".xlsx,.pdf" }, files: [{ name: "廠商合作清單.xlsx", size: "380 KB", uploadedAt: "2026-03-07" }] },
      { name: "未完成工作確認", category: "工作交接", done: true, dueDate: "2026-03-10", assignee: "吳雅婷", action: { type: "upload", label: "上傳確認單", accept: ".pdf" }, files: [{ name: "工作確認單.pdf", size: "90 KB", uploadedAt: "2026-03-10" }] },
      { name: "電腦設備歸還", category: "資產歸還", done: true, dueDate: "2026-03-18", assignee: "黃志偉", action: { type: "upload", label: "上傳歸還單", accept: ".pdf,.jpg" }, files: [{ name: "設備歸還單.pdf", size: "100 KB", uploadedAt: "2026-03-17" }] },
      { name: "門禁卡歸還", category: "資產歸還", done: true, dueDate: "2026-03-20", assignee: "李文華", action: { type: "upload", label: "上傳歸還記錄", accept: ".pdf,.jpg" }, files: [{ name: "門禁卡歸還.jpg", size: "75 KB", uploadedAt: "2026-03-19" }] },
      { name: "系統帳號停用", category: "帳號權限", done: true, dueDate: "2026-03-20", assignee: "黃志偉", action: { type: "link", label: "前往系統設定", route: "/settings" } },
      { name: "最後薪資計算", category: "薪資結算", done: false, dueDate: "2026-03-20", assignee: "林佳蓉", action: { type: "link", label: "前往薪資計算", route: "/payroll/calculate" } },
      { name: "離職證明開立", category: "薪資結算", done: false, dueDate: "2026-03-21", assignee: "李文華", action: { type: "upload", label: "上傳離職證明", accept: ".pdf" } },
      { name: "離職面談安排", category: "離職面談", done: true, dueDate: "2026-03-15", assignee: "李文華", action: { type: "upload", label: "上傳面談紀錄", accept: ".pdf,.doc" }, files: [{ name: "離職面談紀錄_張雅琳.pdf", size: "210 KB", uploadedAt: "2026-03-15" }] },
      { name: "離職問卷填寫", category: "離職面談", done: true, dueDate: "2026-03-18", assignee: "張雅琳", action: { type: "send", label: "發送問卷連結" } },
    ],
  },
};

const categoryIcon: Record<string, any> = {
  "審批流程": Shield,
  "工作交接": FileText,
  "資產歸還": Package,
  "帳號權限": Monitor,
  "薪資結算": DollarSign,
  "離職面談": MessageSquare,
};

const statusConfig: Record<string, { color: string; dot: string }> = {
  "待審批": { color: "bg-primary/10 text-primary border-primary/20", dot: "bg-primary" },
  "交接中": { color: "bg-warning/10 text-warning border-warning/20", dot: "bg-warning" },
  "待結算": { color: "bg-info/10 text-info border-info/20", dot: "bg-info" },
  "已完成": { color: "bg-success/10 text-success border-success/20", dot: "bg-success" },
};

/* ===== Page ===== */
export default function OffboardingDetail() {
  const { offId } = useParams<{ offId: string }>();
  const navigate = useNavigate();
  const detail = detailData[offId || ""];

  const [tasks, setTasks] = useState<Task[]>(detail?.tasks || []);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [uploadDialog, setUploadDialog] = useState<{ open: boolean; taskIdx: number; label: string; accept: string }>({ open: false, taskIdx: -1, label: "", accept: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!detail) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
        <p className="text-lg font-medium">找不到此離職記錄</p>
        <Button variant="link" onClick={() => navigate("/employees/offboarding")}>返回列表</Button>
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
      toast.success("已發送問卷連結至員工信箱");
    }
  };

  const sc = statusConfig[detail.status] || statusConfig["待審批"];
  const daysLeft = Math.ceil((new Date(detail.lastDay).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl bg-card border p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-5">
            <Button variant="ghost" size="icon" className="-ml-2" onClick={() => navigate("/employees/offboarding")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Avatar className="h-16 w-16 text-lg">
              <AvatarFallback className="bg-destructive/10 text-destructive font-bold">{detail.name.slice(-2)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-xl font-bold">{detail.name}</h1>
                <Badge variant="secondary" className={sc.color}>
                  <span className={`inline-block h-1.5 w-1.5 rounded-full mr-1.5 ${sc.dot}`} />
                  {detail.status}
                </Badge>
                {daysLeft > 0 && detail.status !== "已完成" && (
                  <span className="text-xs text-muted-foreground bg-muted/60 px-2 py-0.5 rounded">
                    距離職 {daysLeft} 天
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{detail.department} · {detail.position}</p>
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" />{detail.id}</span>
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />最後工作日 {detail.lastDay}</span>
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
          <Card>
            <CardContent className="pt-5 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">離職進度</p>
                <span className="text-lg font-bold text-primary">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground">{doneCount} / {tasks.length} 項任務已完成</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5 space-y-3">
              <p className="text-sm font-semibold mb-2">離職資訊</p>
              <InfoLine label="離職類型" value={detail.reasonType} />
              <InfoLine label="離職原因" value={detail.reason} />
              <InfoLine label="提出日期" value={detail.resignDate} />
              <InfoLine label="最後工作日" value={detail.lastDay} />
              <Separator />
              <InfoLine label="負責 HR" value={detail.hrOwner} />
              <InfoLine label="直屬主管" value={detail.manager} />
              <InfoLine label="交接人" value={detail.handoverTo} />
              <InfoLine label="競業禁止" value={detail.nonCompete ? "是" : "否"} />
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
              const ActionIcon = task.action?.type === "upload" ? Upload : task.action?.type === "send" ? Send : ExternalLink;
              return (
                <div
                  key={`${task.name}-${idx}`}
                  className={`group rounded-lg border p-4 transition-colors ${
                    task.done ? "bg-muted/30 border-border/50" : "bg-card hover:border-primary/30"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox checked={task.done} onCheckedChange={() => toggleTask(idx)} className="mt-0.5" />
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
