import { useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft, Play, Plus, Trash2, Download,
  BookOpen, Video, Image, FileText, Clock, Users, Target,
  UserPlus, Layers, GraduationCap, ChevronDown, ChevronRight,
  User, Send, Upload, File, Presentation, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import {
  getTrainingPlanDetail, publishTrainingPlan,
  getTrainingModules, saveTrainingModule, deleteTrainingModule,
  uploadModuleFile, deleteModuleFile,
  getPlanParticipants, addParticipants, removeParticipant, issueCertificate,
  type TrainingModule, type ModuleContentType, type TrainingParticipant,
} from "@/api/training";
import { getDepartmentOptions } from "@/api/department";
import { getPositionOptions } from "@/api/position";
import { getActiveEmployeeOptions } from "@/api/employee";
import { Checkbox } from "@/components/ui/checkbox";
import { Award, Search } from "lucide-react";

const certColors: Record<string, string> = {
  "已發放": "bg-success/10 text-success border-success/20",
  "未發放": "bg-warning/10 text-warning border-warning/20",
  "不適用": "bg-muted text-muted-foreground border-border",
};

type AssignType = "all" | "department" | "position" | "manual";

const moduleTypeIcons: Record<string, React.ElementType> = {
  text: FileText, video: Video, image: Image, mixed: BookOpen, ppt: Presentation, word: File,
};

const moduleTypeLabels: Record<string, string> = {
  text: "文字", video: "視頻", image: "圖片", mixed: "圖文+視頻", ppt: "PPT 簡報", word: "Word 文件",
};

const statusColors: Record<string, string> = {
  "草稿": "bg-muted text-muted-foreground border-border",
  "已發佈": "bg-primary/10 text-primary border-primary/20",
  "進行中": "bg-warning/10 text-warning border-warning/20",
  "已結束": "bg-success/10 text-success border-success/20",
};

const participantStatusColors: Record<string, string> = {
  "未開始": "bg-muted text-muted-foreground border-border",
  "進行中": "bg-warning/10 text-warning border-warning/20",
  "已完成": "bg-success/10 text-success border-success/20",
  "未通過": "bg-destructive/10 text-destructive border-destructive/20",
};

const typeColors: Record<string, string> = {
  "入職培訓": "bg-primary/10 text-primary border-primary/20",
  "職位培訓": "bg-accent/10 text-accent-foreground border-accent/20",
  "技能培訓": "bg-warning/10 text-warning border-warning/20",
  "管理培訓": "bg-success/10 text-success border-success/20",
  "合規培訓": "bg-destructive/10 text-destructive border-destructive/20",
};

const formatFileSize = (bytes?: number) => {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getFileIcon = (fileName: string) => {
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (ext === "ppt" || ext === "pptx") return Presentation;
  if (ext === "doc" || ext === "docx") return File;
  if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext || "")) return Image;
  return FileText;
};

interface ModuleFormData {
  title: string;
  contentType: ModuleContentType;
  content: string;
  videoUrl: string;
  imageUrl: string;
  duration: string;
  required: boolean;
}

const emptyModuleForm: ModuleFormData = {
  title: "", contentType: "text", content: "", videoUrl: "", imageUrl: "", duration: "", required: true,
};

export default function TrainingPlanDetail() {
  const { t } = useTranslation();
  const { planId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: plan, isLoading } = useQuery({
    queryKey: ["training-plan-detail", planId],
    queryFn: () => getTrainingPlanDetail(planId!).then((r) => r.data),
    enabled: !!planId,
  });

  const { data: modules = [] } = useQuery({
    queryKey: ["training-modules", planId],
    queryFn: () => getTrainingModules(planId!).then((r) => r.data),
    enabled: !!planId,
  });

  const { data: participants = [] } = useQuery({
    queryKey: ["training-participants", planId],
    queryFn: () => getPlanParticipants(planId!).then((r) => r.data),
    enabled: !!planId,
  });

  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [addModuleOpen, setAddModuleOpen] = useState(false);
  const [moduleForm, setModuleForm] = useState<ModuleFormData>(emptyModuleForm);
  const [participantsOpen, setParticipantsOpen] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 分配学员弹窗
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignType, setAssignType] = useState<AssignType>("all");
  const [assignDeptIds, setAssignDeptIds] = useState<number[]>([]);
  const [assignPositionIds, setAssignPositionIds] = useState<number[]>([]);
  const [assignEmployeeIds, setAssignEmployeeIds] = useState<number[]>([]);
  const [empSearch, setEmpSearch] = useState("");
  const [removeTarget, setRemoveTarget] = useState<TrainingParticipant | null>(null);
  const [deleteModuleTarget, setDeleteModuleTarget] = useState<TrainingModule | null>(null);

  const { data: assignDepartments = [] } = useQuery({
    queryKey: ["dept-options"],
    queryFn: () => getDepartmentOptions().then((r) => r.data),
    enabled: assignOpen,
  });
  const { data: assignPositions = [] } = useQuery({
    queryKey: ["position-options"],
    queryFn: () => getPositionOptions().then((r) => r.data),
    enabled: assignOpen,
  });
  const { data: assignEmployees = [] } = useQuery({
    queryKey: ["active-employee-options"],
    queryFn: () => getActiveEmployeeOptions().then((r) => r.data),
    enabled: assignOpen,
  });

  const filteredEmployees = useMemo(
    () => assignEmployees.filter((e) => !empSearch
      || e.name.includes(empSearch) || (e.employeeNo ?? "").includes(empSearch)),
    [assignEmployees, empSearch],
  );

  const invalidateParticipants = () => {
    queryClient.invalidateQueries({ queryKey: ["training-participants", planId] });
    queryClient.invalidateQueries({ queryKey: ["training-plan-detail", planId] });
  };

  const assignMutation = useMutation({
    mutationFn: addParticipants,
    onSuccess: (r) => {
      toast.success(t("已分配 {{n}} 位學員", { n: r.data ?? 0 }));
      setAssignOpen(false);
      setAssignDeptIds([]); setAssignPositionIds([]); setAssignEmployeeIds([]); setEmpSearch("");
      invalidateParticipants();
    },
    onError: (e: any) => toast.error(e?.message || t("分配失敗")),
  });

  const removeParticipantMutation = useMutation({
    mutationFn: removeParticipant,
    onSuccess: () => { toast.success(t("已移除學員")); invalidateParticipants(); },
    onError: (e: any) => toast.error(e?.message || t("移除失敗")),
  });

  const issueCertMutation = useMutation({
    mutationFn: issueCertificate,
    onSuccess: () => { toast.success(t("證書已發放")); invalidateParticipants(); },
    onError: (e: any) => toast.error(e?.message || t("發放失敗")),
  });

  const handleAssign = () => {
    if (assignType === "department" && assignDeptIds.length === 0) { toast.error(t("請選擇部門")); return; }
    if (assignType === "position" && assignPositionIds.length === 0) { toast.error(t("請選擇職位")); return; }
    if (assignType === "manual" && assignEmployeeIds.length === 0) { toast.error(t("請選擇員工")); return; }
    assignMutation.mutate({
      planId: plan!.id,
      assignType,
      employeeIds: assignType === "manual" ? assignEmployeeIds : undefined,
      departmentIds: assignType === "department" ? assignDeptIds : undefined,
      positionIds: assignType === "position" ? assignPositionIds : undefined,
    });
  };

  const toggleId = (arr: number[], id: number, set: (v: number[]) => void) =>
    set(arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]);

  const selectedModule = useMemo(
    () => modules.find((m) => m.id === selectedModuleId) ?? modules[0] ?? null,
    [modules, selectedModuleId],
  );

  const invalidateModules = () => queryClient.invalidateQueries({ queryKey: ["training-modules", planId] });

  const saveModuleMutation = useMutation({
    mutationFn: saveTrainingModule,
    onSuccess: (r) => {
      toast.success(t("課程模組「{{title}}」已新增", { title: moduleForm.title }));
      setModuleForm(emptyModuleForm);
      setAddModuleOpen(false);
      invalidateModules();
      queryClient.invalidateQueries({ queryKey: ["training-plan-detail", planId] });
      if (r.data) setSelectedModuleId(String(r.data));
    },
    onError: (e: any) => toast.error(e?.message || t("新增失敗")),
  });

  const deleteModuleMutation = useMutation({
    mutationFn: deleteTrainingModule,
    onSuccess: () => {
      toast.success(t("課程模組已刪除"));
      setSelectedModuleId(null);
      invalidateModules();
      queryClient.invalidateQueries({ queryKey: ["training-plan-detail", planId] });
    },
    onError: (e: any) => toast.error(e?.message || t("刪除失敗")),
  });

  const uploadFileMutation = useMutation({
    mutationFn: ({ moduleId, file }: { moduleId: string; file: File }) => uploadModuleFile(moduleId, file),
    onSuccess: () => { toast.success(t("附件已上傳")); invalidateModules(); },
    onError: (e: any) => toast.error(e?.message || t("上傳失敗")),
  });

  const deleteFileMutation = useMutation({
    mutationFn: (attachId: number) => deleteModuleFile(attachId),
    onSuccess: () => { toast.success(t("附件已刪除")); invalidateModules(); },
    onError: (e: any) => toast.error(e?.message || t("刪除失敗")),
  });

  const publishMutation = useMutation({
    mutationFn: publishTrainingPlan,
    onSuccess: () => {
      toast.success(t("培訓計劃已發佈"));
      queryClient.invalidateQueries({ queryKey: ["training-plan-detail", planId] });
    },
    onError: (e: any) => toast.error(e?.message || t("發佈失敗")),
  });

  if (!plan) {
    return (
      <div className="p-6">
        <Button variant="ghost" className="gap-2 mb-4" onClick={() => navigate("/training/plans")}>
          <ArrowLeft className="h-4 w-4" /> {t("返回列表")}
        </Button>
        <Card><CardContent className="p-12 text-center text-muted-foreground">
          {isLoading ? t("載入中...") : t("找不到該培訓計劃")}
        </CardContent></Card>
      </div>
    );
  }

  const completionRate = plan.participantCount > 0 ? Math.round((plan.completedCount / plan.participantCount) * 100) : 0;
  const totalMinutes = modules.reduce((s, m) => s + (m.duration || 0), 0);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !selectedModule) return;
    const maxSize = 20 * 1024 * 1024;
    for (let i = 0; i < files.length; i++) {
      if (files[i].size > maxSize) { toast.error(t("檔案「{{name}}」超過 20MB 限制", { name: files[i].name })); continue; }
      uploadFileMutation.mutate({ moduleId: selectedModule.id, file: files[i] });
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAddModule = () => {
    if (!moduleForm.title.trim() || !moduleForm.content.trim()) {
      toast.error(t("請填寫模組名稱與內容說明"));
      return;
    }
    saveModuleMutation.mutate({
      planId: plan.id,
      title: moduleForm.title.trim(),
      contentType: moduleForm.contentType,
      content: moduleForm.content,
      videoUrl: moduleForm.videoUrl || undefined,
      imageUrl: moduleForm.imageUrl || undefined,
      duration: moduleForm.duration ? parseInt(moduleForm.duration) : 0,
      required: moduleForm.required,
    });
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/training/plans")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">{plan.name}</h1>
              {plan.type && <Badge variant="outline" className={typeColors[plan.type]}>{t(plan.type)}</Badge>}
              <Badge variant="outline" className={statusColors[plan.planStatusText]}>{t(plan.planStatusText)}</Badge>
              {plan.mandatory && <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">{t("必修")}</Badge>}
            </div>
            <p className="text-muted-foreground mt-1">{plan.description}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {plan.planStatus === 0 && (
            <Button
              className="gap-2"
              disabled={publishMutation.isPending || modules.length === 0 || participants.length === 0}
              title={
                modules.length === 0 ? t("請先新增課程模組再發佈")
                  : participants.length === 0 ? t("請先分配參訓人員再發佈")
                  : undefined
              }
              onClick={() => {
                if (modules.length === 0) { toast.error(t("請先新增課程模組再發佈")); return; }
                if (participants.length === 0) { toast.error(t("請先分配參訓人員再發佈")); return; }
                publishMutation.mutate(plan.id);
              }}
            >
              <Send className="h-4 w-4" /> {t("發佈計劃")}
            </Button>
          )}
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card><CardContent className="p-4 text-center">
          <BookOpen className="h-5 w-5 mx-auto mb-1 text-primary" />
          <p className="text-xs text-muted-foreground">{t("課程模組")}</p>
          <p className="text-lg font-bold">{t("{{n}} 個", { n: modules.length })}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <Clock className="h-5 w-5 mx-auto mb-1 text-warning" />
          <p className="text-xs text-muted-foreground">{t("預計時數")}</p>
          <p className="text-lg font-bold">{t("{{n}} 小時", { n: Math.round(totalMinutes / 60 * 10) / 10 })}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <Users className="h-5 w-5 mx-auto mb-1 text-success" />
          <p className="text-xs text-muted-foreground">{t("參訓人數")}</p>
          <p className="text-lg font-bold">{t("{{n}} 人", { n: plan.participantCount })}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <GraduationCap className="h-5 w-5 mx-auto mb-1 text-accent-foreground" />
          <p className="text-xs text-muted-foreground">{t("完成率")}</p>
          <p className="text-lg font-bold">{completionRate}%</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <Target className="h-5 w-5 mx-auto mb-1 text-destructive" />
          <p className="text-xs text-muted-foreground">{t("適用對象")}</p>
          <p className="text-sm font-bold truncate">{plan.targetScope}</p>
        </CardContent></Card>
      </div>

      {/* Association Info */}
      <Card><CardContent className="p-4">
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{t("關聯方式：")}</span>
            <Badge variant="outline" className="bg-primary/5">
              {plan.targetType === "all_new" && <><UserPlus className="h-3 w-3 mr-1" />{t("所有新員工自動分配")}</>}
              {plan.targetType === "position" && <><Target className="h-3 w-3 mr-1" />{t("指定職位新員工自動分配")}</>}
              {plan.targetType === "department" && <><Layers className="h-3 w-3 mr-1" />{t("指定部門員工")}</>}
              {plan.targetType === "manual" && <><Users className="h-3 w-3 mr-1" />{t("手動指定人員")}</>}
            </Badge>
          </div>
          {plan.targetNames && plan.targetNames.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {plan.targetType === "department" ? t("目標部門：") : t("目標職位：")}
              </span>
              {plan.targetNames.map((n) => <Badge key={n} variant="outline" className="text-xs">{n}</Badge>)}
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{t("建立者：")}</span>
            <span className="text-sm font-medium">{plan.creatorName}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{t("更新於：")}</span>
            <span className="text-sm font-medium">{plan.updateTime}</span>
          </div>
        </div>
      </CardContent></Card>

      {/* Course Modules */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Module List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{t("課程模組")}</h2>
            <Button size="sm" variant="outline" className="gap-1" onClick={() => { setModuleForm(emptyModuleForm); setAddModuleOpen(true); }}>
              <Plus className="h-3.5 w-3.5" /> {t("新增模組")}
            </Button>
          </div>
          <div className="space-y-2">
            {modules.map((m: TrainingModule, idx) => {
              const Icon = moduleTypeIcons[m.contentType];
              const isSelected = selectedModule?.id === m.id;
              return (
                <Card key={m.id}
                  className={`cursor-pointer transition-colors ${isSelected ? "ring-2 ring-primary bg-primary/5" : "hover:bg-muted/50"}`}
                  onClick={() => setSelectedModuleId(m.id)}>
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-muted shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-muted-foreground">{idx + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{m.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-0.5">
                            {Icon && <Icon className="h-2.5 w-2.5" />}{t(moduleTypeLabels[m.contentType])}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">{t("{{n}} 分鐘", { n: m.duration })}</span>
                          {m.required && <Badge variant="outline" className="text-[10px] px-1 py-0 bg-destructive/10 text-destructive border-destructive/20">{t("必修")}</Badge>}
                        </div>
                        {m.files && m.files.length > 0 && (
                          <div className="flex items-center gap-1 mt-1">
                            <Upload className="h-2.5 w-2.5 text-muted-foreground" />
                            <span className="text-[10px] text-muted-foreground">{t("{{n}} 個附件", { n: m.files.length })}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {modules.length === 0 && (
              <Card><CardContent className="p-8 text-center text-muted-foreground">
                <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">{t("尚未添加課程模組")}</p>
                <Button size="sm" variant="outline" className="mt-3 gap-1" onClick={() => { setModuleForm(emptyModuleForm); setAddModuleOpen(true); }}>
                  <Plus className="h-3.5 w-3.5" /> {t("新增第一個模組")}
                </Button>
              </CardContent></Card>
            )}
          </div>
        </div>

        {/* Module Content Preview */}
        <div className="lg:col-span-2">
          {selectedModule ? (
            <Card className="sticky top-6">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs gap-1">
                        {(() => { const Icon = moduleTypeIcons[selectedModule.contentType]; return Icon ? <Icon className="h-3 w-3" /> : null; })()}
                        {t(moduleTypeLabels[selectedModule.contentType])}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{t("{{n}} 分鐘", { n: selectedModule.duration })}</span>
                      {selectedModule.required && <Badge variant="outline" className="text-xs bg-destructive/10 text-destructive border-destructive/20">{t("必修")}</Badge>}
                    </div>
                    <CardTitle className="text-lg">{selectedModule.title}</CardTitle>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="sm" className="gap-1 h-7" disabled={uploadFileMutation.isPending} onClick={() => fileInputRef.current?.click()}>
                      {uploadFileMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />} {t("上傳附件")}
                    </Button>
                    <input ref={fileInputRef} type="file" className="hidden" multiple onChange={handleFileUpload} />
                    <Button variant="ghost" size="sm" className="text-destructive h-7"
                      onClick={() => setDeleteModuleTarget(selectedModule)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedModule.videoUrl && (
                  <div className="rounded-lg bg-muted/50 border overflow-hidden">
                    <div className="aspect-video flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                      <div className="text-center">
                        <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3">
                          <Play className="h-8 w-8 text-primary ml-1" />
                        </div>
                        <p className="text-sm text-muted-foreground">{t("培訓視頻")}</p>
                        <p className="text-xs text-muted-foreground mt-1">{selectedModule.videoUrl}</p>
                      </div>
                    </div>
                  </div>
                )}

                {selectedModule.imageUrl && (
                  <div className="rounded-lg overflow-hidden border">
                    <img src={selectedModule.imageUrl} alt={selectedModule.title} className="w-full h-48 object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  </div>
                )}

                {/* 附件 */}
                {selectedModule.files && selectedModule.files.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">{t("附件檔案")}</p>
                    <div className="space-y-2">
                      {selectedModule.files.map((file) => {
                        const FileIcon = getFileIcon(file.name);
                        const isImage = /\.(png|jpe?g|gif|webp)$/i.test(file.name);
                        return (
                          <div key={file.id}>
                            {isImage && (
                              <div className="rounded-lg overflow-hidden border mb-2">
                                <img src={file.url} alt={file.name} className="w-full h-48 object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                              </div>
                            )}
                            <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                <FileIcon className="h-5 w-5 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{file.name}</p>
                                <p className="text-xs text-muted-foreground">{formatFileSize(file.fileSize)}</p>
                              </div>
                              <a href={file.url} target="_blank" rel="noreferrer">
                                <Button variant="outline" size="sm" className="gap-1 shrink-0">
                                  <Download className="h-3.5 w-3.5" /> {t("下載")}
                                </Button>
                              </a>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive shrink-0"
                                onClick={() => deleteFileMutation.mutate(file.id)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Text Content */}
                <div className="prose prose-sm max-w-none">
                  {selectedModule.content.split("\n").map((line, i) => {
                    if (line.startsWith("### ")) return <h3 key={i} className="text-base font-semibold mt-4 mb-2">{line.replace("### ", "")}</h3>;
                    if (line.startsWith("- ")) return <li key={i} className="text-sm text-foreground ml-4 mb-1">{line.replace("- ", "")}</li>;
                    if (line.trim() === "") return <br key={i} />;
                    return <p key={i} className="text-sm text-foreground leading-relaxed mb-2">{line}</p>;
                  })}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card><CardContent className="p-12 text-center text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>{t("選擇左側課程模組查看內容")}</p>
            </CardContent></Card>
          )}
        </div>
      </div>

      {/* Participants (Phase 3 接真) */}
      <Collapsible open={participantsOpen} onOpenChange={setParticipantsOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {participantsOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                  <CardTitle className="text-base">{t("參訓人員")}</CardTitle>
                  <Badge variant="outline" className="text-xs">{t("{{n}} 人", { n: participants.length })}</Badge>
                </div>
                <Button size="sm" variant="outline" className="gap-1" onClick={(e) => { e.stopPropagation(); setAssignOpen(true); }}>
                  <UserPlus className="h-3.5 w-3.5" /> {t("分配學員")}
                </Button>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="p-0 pt-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>{t("員工")}</TableHead>
                    <TableHead>{t("部門")}</TableHead>
                    <TableHead>{t("職位")}</TableHead>
                    <TableHead>{t("培訓進度")}</TableHead>
                    <TableHead>{t("狀態")}</TableHead>
                    <TableHead>{t("證書")}</TableHead>
                    <TableHead>{t("完成日期")}</TableHead>
                    <TableHead className="text-right">{t("操作")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {participants.map((p: TrainingParticipant) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-3.5 w-3.5 text-primary" />
                          </div>
                          <p className="font-medium text-sm">{p.employeeName}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{p.departmentName}</TableCell>
                      <TableCell className="text-sm">{p.position}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={p.progress} className="w-20 h-1.5" />
                          <span className="text-xs text-muted-foreground">{p.completedModules}/{p.totalModules}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${participantStatusColors[p.pStatusText]}`}>{t(p.pStatusText)}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${certColors[p.certificateText]}`}>{t(p.certificateText)}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{p.completedAt || "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {p.pStatus === 2 && p.certificate === 1 && (
                            <Button variant="ghost" size="sm" className="h-7 gap-1 text-success" disabled={issueCertMutation.isPending}
                              onClick={() => issueCertMutation.mutate(p.id)}>
                              <Award className="h-3.5 w-3.5" /> {t("發證")}
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" className="h-7 text-destructive" disabled={removeParticipantMutation.isPending}
                            onClick={() => setRemoveTarget(p)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {participants.length === 0 && (
                    <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">{t("尚無參訓人員，點擊右上角「分配學員」添加")}</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Add Module Dialog */}
      <Dialog open={addModuleOpen} onOpenChange={setAddModuleOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("新增課程模組")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("模組名稱")} <span className="text-destructive">*</span></Label>
              <Input placeholder={t("例：公司介紹與企業文化")} value={moduleForm.title} onChange={(e) => setModuleForm((prev) => ({ ...prev, title: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("內容類型")}</Label>
                <Select value={moduleForm.contentType} onValueChange={(v) => setModuleForm((prev) => ({ ...prev, contentType: v as ModuleContentType }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">{t("純文字")}</SelectItem>
                    <SelectItem value="video">{t("視頻")}</SelectItem>
                    <SelectItem value="image">{t("圖片")}</SelectItem>
                    <SelectItem value="mixed">{t("圖文+視頻")}</SelectItem>
                    <SelectItem value="ppt">{t("PPT 簡報")}</SelectItem>
                    <SelectItem value="word">{t("Word 文件")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("預計時長 (分鐘)")}</Label>
                <Input type="number" placeholder={t("例：60")} value={moduleForm.duration} onChange={(e) => setModuleForm((prev) => ({ ...prev, duration: e.target.value }))} />
              </div>
            </div>

            {(moduleForm.contentType === "video" || moduleForm.contentType === "mixed") && (
              <div className="space-y-2">
                <Label>{t("視頻連結")}</Label>
                <Input placeholder="https://..." value={moduleForm.videoUrl} onChange={(e) => setModuleForm((prev) => ({ ...prev, videoUrl: e.target.value }))} />
              </div>
            )}

            {moduleForm.contentType === "mixed" && (
              <div className="space-y-2">
                <Label>{t("圖片連結")}</Label>
                <Input placeholder="https://..." value={moduleForm.imageUrl} onChange={(e) => setModuleForm((prev) => ({ ...prev, imageUrl: e.target.value }))} />
              </div>
            )}

            <div className="space-y-2">
              <Label>{t("內容說明")} <span className="text-destructive">*</span></Label>
              <Textarea placeholder={t("請輸入課程內容（支援 ### 標題與 - 列表格式）")} value={moduleForm.content} onChange={(e) => setModuleForm((prev) => ({ ...prev, content: e.target.value }))} rows={6} />
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" checked={moduleForm.required} onChange={(e) => setModuleForm((prev) => ({ ...prev, required: e.target.checked }))} className="rounded" />
              <Label className="cursor-pointer">{t("設為必修模組")}</Label>
            </div>
            <p className="text-xs text-muted-foreground">{t("附件（PPT/Word/圖片等）可在模組建立後，於右側預覽面板點「上傳附件」加入。")}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddModuleOpen(false)}>{t("取消")}</Button>
            <Button onClick={handleAddModule} disabled={saveModuleMutation.isPending}>
              {saveModuleMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}{t("新增模組")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Participants Dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("分配學員")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("分配方式")}</Label>
              <Select value={assignType} onValueChange={(v) => setAssignType(v as AssignType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("全體在職員工")}</SelectItem>
                  <SelectItem value="department">{t("指定部門")}</SelectItem>
                  <SelectItem value="position">{t("指定職位")}</SelectItem>
                  <SelectItem value="manual">{t("手動指定員工")}</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{t("已分配的員工會自動跳過，不會重複。")}</p>
            </div>

            {assignType === "manual" && (
              <div className="space-y-2">
                <Label>{t("選擇員工")} <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder={t("搜尋姓名/工號...")} value={empSearch} onChange={(e) => setEmpSearch(e.target.value)} className="pl-9" />
                </div>
                <div className="border rounded-lg p-3 max-h-60 overflow-y-auto space-y-1">
                  {filteredEmployees.map((emp) => (
                    <label key={emp.id} className="flex items-center gap-2 text-sm cursor-pointer py-0.5">
                      <Checkbox checked={assignEmployeeIds.includes(emp.id)} onCheckedChange={() => toggleId(assignEmployeeIds, emp.id, setAssignEmployeeIds)} />
                      <span>{emp.name}</span>
                      {emp.employeeNo && <span className="text-xs text-muted-foreground">({emp.employeeNo})</span>}
                    </label>
                  ))}
                  {filteredEmployees.length === 0 && <p className="text-xs text-muted-foreground">{t("無符合的員工")}</p>}
                </div>
                {assignEmployeeIds.length > 0 && <p className="text-xs text-muted-foreground">{t("已選 {{n}} 人", { n: assignEmployeeIds.length })}</p>}
              </div>
            )}

            {assignType === "department" && (
              <div className="space-y-2">
                <Label>{t("選擇部門")} <span className="text-destructive">*</span></Label>
                <div className="grid grid-cols-2 gap-2 border rounded-lg p-3 max-h-48 overflow-y-auto">
                  {assignDepartments.map((d) => (
                    <label key={d.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox checked={assignDeptIds.includes(d.id)} onCheckedChange={() => toggleId(assignDeptIds, d.id, setAssignDeptIds)} />
                      {d.name}
                    </label>
                  ))}
                  {assignDepartments.length === 0 && <p className="text-xs text-muted-foreground col-span-2">{t("暫無部門")}</p>}
                </div>
              </div>
            )}

            {assignType === "position" && (
              <div className="space-y-2">
                <Label>{t("選擇職位")} <span className="text-destructive">*</span></Label>
                <div className="grid grid-cols-2 gap-2 border rounded-lg p-3 max-h-48 overflow-y-auto">
                  {assignPositions.map((p) => (
                    <label key={p.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox checked={assignPositionIds.includes(p.id)} onCheckedChange={() => toggleId(assignPositionIds, p.id, setAssignPositionIds)} />
                      {p.title}
                    </label>
                  ))}
                  {assignPositions.length === 0 && <p className="text-xs text-muted-foreground col-span-2">{t("暫無職位")}</p>}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>{t("取消")}</Button>
            <Button onClick={handleAssign} disabled={assignMutation.isPending}>
              {assignMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}{t("確認分配")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除模组确认 */}
      <AlertDialog open={deleteModuleTarget != null} onOpenChange={(o) => !o && setDeleteModuleTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("確認刪除課程模組？")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("即將刪除模組「{{title}}」，其附件也將一併移除。此操作不可撤銷。", { title: deleteModuleTarget?.title })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("取消")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (deleteModuleTarget) deleteModuleMutation.mutate(deleteModuleTarget.id); setDeleteModuleTarget(null); }}>
              {t("確認刪除")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 移除学员确认 */}
      <AlertDialog open={removeTarget != null} onOpenChange={(o) => !o && setRemoveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("確認移除學員？")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("即將移除學員「{{name}}」，其在本培訓的學習進度也將一併清除。此操作不可撤銷。", { name: removeTarget?.employeeName })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("取消")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (removeTarget) removeParticipantMutation.mutate(removeTarget.id); setRemoveTarget(null); }}>
              {t("確認移除")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
