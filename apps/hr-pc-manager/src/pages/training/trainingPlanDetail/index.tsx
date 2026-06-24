import {
  ArrowLeft,
  BookOpen,
  ChevronDown,
  ChevronRight,
  File,
  FileText,
  Image,
  Layers,
  Plus,
  Presentation,
  Target,
  Upload,
  UserPlus,
  Users,
  X
} from 'lucide-react';
import { useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { mockTrainingPlans } from '../TrainingPlans';
import { moduleTypeIcons, moduleTypeLabels } from './constants';
import ModulePreview from './ModulePreview';
import ParticipantsTable from './ParticipantsTable';
import TrainingHeader from './TrainingHeader';
import TrainingInfoCards from './TrainingInfoCards';

interface UploadedFile {
  name: string;
  size: number;
  type: string;
  url: string; // object URL for preview
}

interface TrainingModule {
  content: string;
  duration: number;
  id: string;
  imageUrl?: string;
  order: number;
  required: boolean;
  title: string;
  type: 'image' | 'mixed' | 'ppt' | 'text' | 'video' | 'word';
  uploadedFiles?: UploadedFile[];
  videoUrl?: string;
}

interface TrainingParticipant {
  completedAt?: string;
  completedModules: number;
  department: string;
  employeeId: string;
  id: string;
  joinDate: string;
  name: string;
  position: string;
  progress: number;
  status: '已完成' | '未開始' | '進行中';
  totalModules: number;
}

const mockModules: Record<string, TrainingModule[]> = {
  'TP-001': [
    {
      id: 'M1',
      title: '公司介紹與企業文化',
      type: 'mixed',
      content:
        '了解公司的發展歷程、核心價值觀、願景使命。透過視頻深入了解公司文化，建立歸屬感。\n\n### 核心內容\n- 公司成立背景與發展里程碑\n- 企業文化核心價值：誠信、創新、合作\n- 組織架構與業務範疇\n- 員工行為準則',
      videoUrl: 'https://example.com/video/company-intro.mp4',
      duration: 60,
      order: 1,
      required: true
    },
    {
      id: 'M2',
      title: '規章制度與員工手冊',
      type: 'word',
      content: '詳細介紹公司各項規章制度，包括考勤管理、請假流程、薪資福利等。',
      uploadedFiles: [
        {
          name: '員工手冊_v3.2.docx',
          size: 2456000,
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          url: '#'
        }
      ],
      duration: 45,
      order: 2,
      required: true
    },
    {
      id: 'M3',
      title: '辦公環境與設備操作',
      type: 'image',
      content: '認識辦公區域分佈，學習基本辦公設備的操作方式。',
      imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800',
      uploadedFiles: [
        {
          name: '辦公區域導覽圖.png',
          size: 1280000,
          type: 'image/png',
          url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800'
        }
      ],
      duration: 30,
      order: 3,
      required: true
    },
    {
      id: 'M4',
      title: '系統操作培訓',
      type: 'ppt',
      content: '學習公司內部系統的基本操作，包括 HR 系統、郵件系統、協作工具等。',
      uploadedFiles: [
        {
          name: '系統操作指南.pptx',
          size: 5120000,
          type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          url: '#'
        }
      ],
      duration: 90,
      order: 4,
      required: true
    },
    {
      id: 'M5',
      title: '安全與合規須知',
      type: 'text',
      content:
        '了解公司資訊安全政策、數據保護要求以及合規注意事項。\n\n### 關鍵事項\n- 密碼管理規範（定期更換、複雜度要求）\n- 資料分類與保密等級\n- 網路使用規範\n- 個人資料保護法遵循\n- 舉報與申訴管道',
      duration: 45,
      order: 5,
      required: true
    }
  ],
  'TP-002': [
    {
      id: 'M1',
      title: '技術棧總覽',
      type: 'text',
      content: '介紹公司前端技術棧：React + TypeScript + Tailwind CSS，以及相關工具鏈。',
      duration: 60,
      order: 1,
      required: true
    },
    {
      id: 'M2',
      title: '代碼規範與最佳實踐',
      type: 'mixed',
      content: '公司代碼規範文件解讀，包含命名規則、文件結構、組件設計原則等。',
      videoUrl: 'https://example.com/video/code-standards.mp4',
      duration: 90,
      order: 2,
      required: true
    },
    {
      id: 'M3',
      title: 'Git 工作流程',
      type: 'video',
      content: '學習公司的 Git 分支管理策略與 Code Review 流程。',
      videoUrl: 'https://example.com/video/git-workflow.mp4',
      duration: 60,
      order: 3,
      required: true
    },
    {
      id: 'M4',
      title: 'UI 組件庫使用',
      type: 'mixed',
      content: '學習公司內部 UI 組件庫的使用方式與設計系統。',
      imageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800',
      duration: 45,
      order: 4,
      required: true
    },
    {
      id: 'M5',
      title: '測試與 CI/CD',
      type: 'text',
      content: '了解公司的測試策略與持續集成/部署流程。',
      duration: 60,
      order: 5,
      required: true
    },
    {
      id: 'M6',
      title: '效能優化技巧',
      type: 'video',
      content: '學習前端效能分析與優化的實踐方法。',
      videoUrl: 'https://example.com/video/performance.mp4',
      duration: 75,
      order: 6,
      required: false
    },
    {
      id: 'M7',
      title: '無障礙設計',
      type: 'text',
      content: '了解 Web 無障礙標準（WCAG）與實作方式。',
      duration: 45,
      order: 7,
      required: false
    },
    {
      id: 'M8',
      title: '專案實作練習',
      type: 'text',
      content: '完成一個小型專案作為培訓考核，涵蓋以上所學內容。',
      duration: 180,
      order: 8,
      required: true
    }
  ]
};

const mockParticipants: Record<string, TrainingParticipant[]> = {
  'TP-001': [
    {
      id: 'P1',
      employeeId: 'EMP-020',
      name: '劉曉東',
      department: '技術部',
      position: '工程師',
      joinDate: '2026-03-01',
      progress: 100,
      completedModules: 5,
      totalModules: 5,
      status: '已完成',
      completedAt: '2026-03-05'
    },
    {
      id: 'P2',
      employeeId: 'EMP-021',
      name: '陳怡君',
      department: '銷售部',
      position: '業務代表',
      joinDate: '2026-03-01',
      progress: 100,
      completedModules: 5,
      totalModules: 5,
      status: '已完成',
      completedAt: '2026-03-06'
    },
    {
      id: 'P3',
      employeeId: 'EMP-022',
      name: '林志偉',
      department: '技術部',
      position: '測試工程師',
      joinDate: '2026-03-03',
      progress: 80,
      completedModules: 4,
      totalModules: 5,
      status: '進行中'
    },
    {
      id: 'P4',
      employeeId: 'EMP-023',
      name: '許雅文',
      department: '人事部',
      position: '人事專員',
      joinDate: '2026-03-05',
      progress: 60,
      completedModules: 3,
      totalModules: 5,
      status: '進行中'
    },
    {
      id: 'P5',
      employeeId: 'EMP-024',
      name: '蔡明哲',
      department: '行政部',
      position: '行政助理',
      joinDate: '2026-03-07',
      progress: 40,
      completedModules: 2,
      totalModules: 5,
      status: '進行中'
    },
    {
      id: 'P6',
      employeeId: 'EMP-025',
      name: '楊淑惠',
      department: '會計部',
      position: '會計專員',
      joinDate: '2026-03-08',
      progress: 20,
      completedModules: 1,
      totalModules: 5,
      status: '進行中'
    },
    {
      id: 'P7',
      employeeId: 'EMP-026',
      name: '鄭家豪',
      department: '技術部',
      position: '前端工程師',
      joinDate: '2026-03-10',
      progress: 0,
      completedModules: 0,
      totalModules: 5,
      status: '未開始'
    }
  ],
  'TP-002': [
    {
      id: 'P1',
      employeeId: 'EMP-026',
      name: '鄭家豪',
      department: '技術部',
      position: '前端工程師',
      joinDate: '2026-03-10',
      progress: 25,
      completedModules: 2,
      totalModules: 8,
      status: '進行中'
    },
    {
      id: 'P2',
      employeeId: 'EMP-027',
      name: '吳佳琳',
      department: '技術部',
      position: '前端工程師',
      joinDate: '2026-02-15',
      progress: 100,
      completedModules: 8,
      totalModules: 8,
      status: '已完成',
      completedAt: '2026-03-05'
    },
    {
      id: 'P3',
      employeeId: 'EMP-028',
      name: '謝志豪',
      department: '技術部',
      position: '高級前端工程師',
      joinDate: '2026-02-20',
      progress: 88,
      completedModules: 7,
      totalModules: 8,
      status: '進行中'
    }
  ]
};

interface ModuleFormData {
  content: string;
  duration: string;
  imageUrl: string;
  required: boolean;
  title: string;
  type: TrainingModule['type'];
  uploadedFiles: UploadedFile[];
  videoUrl: string;
}

const emptyModuleForm: ModuleFormData = {
  title: '',
  type: 'text',
  content: '',
  videoUrl: '',
  imageUrl: '',
  duration: '',
  required: true,
  uploadedFiles: []
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getFileAccept = (type: string) => {
  switch (type) {
    case 'image':
      return 'image/png,image/jpeg,image/gif,image/webp';
    case 'ppt':
      return '.ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation';
    case 'word':
      return '.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    default:
      return '';
  }
};

const getFileTypeLabel = (type: string) => {
  switch (type) {
    case 'image':
      return '圖片檔案 (PNG, JPG, GIF, WebP)';
    case 'ppt':
      return 'PPT 簡報檔案 (.ppt, .pptx)';
    case 'word':
      return 'Word 文件 (.doc, .docx)';
    default:
      return '檔案';
  }
};

const getFileIcon = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext === 'ppt' || ext === 'pptx') return Presentation;
  if (ext === 'doc' || ext === 'docx') return File;
  if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext || '')) return Image;
  return FileText;
};

const renderBadge = plan => {
  if (!plan) return null;
  // oxlint-disable-next-line default-case
  switch (plan.targetType) {
    case 'all_new':
      return (
        <>
          <UserPlus className="h-3 w-3 mr-1" />
          所有新員工自動分配
        </>
      );
    case 'position':
      return (
        <>
          <Target className="h-3 w-3 mr-1" />
          指定職位新員工自動分配
        </>
      );
    case 'department':
      return (
        <>
          <Layers className="h-3 w-3 mr-1" />
          指定部門員工
        </>
      );

    case 'manual':
      return (
        <>
          <Users className="h-3 w-3 mr-1" />
          手動指定人員
        </>
      );
  }
};

export default function TrainingPlanDetail() {
  const { planId } = useParams();
  const navigate = useNavigate();
  const plan = mockTrainingPlans.find(p => p.id === planId);
  const [modules, setModules] = useState<TrainingModule[]>(mockModules[planId || ''] || []);
  const participants = mockParticipants[planId || ''] || [];
  const [selectedModule, setSelectedModule] = useState<TrainingModule | null>(modules[0] || null);
  const [addModuleOpen, setAddModuleOpen] = useState(false);
  const [moduleForm, setModuleForm] = useState<ModuleFormData>(emptyModuleForm);
  const [participantsOpen, setParticipantsOpen] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!plan) {
    return (
      <div className="p-6">
        <Button variant="ghost" className="gap-2 mb-4" onClick={() => navigate('/training/plans')}>
          <ArrowLeft className="h-4 w-4" /> 返回列表
        </Button>
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">找不到該培訓計劃</CardContent>
        </Card>
      </div>
    );
  }

  const completionRate =
    plan.participantCount > 0 ? Math.round((plan.completedCount / plan.participantCount) * 100) : 0;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const maxSize = 20 * 1024 * 1024; // 20MB
    const newFiles: UploadedFile[] = [];

    for (const file of files) {
      if (file.size > maxSize) {
        toast.error(`檔案「${file.name}」超過 20MB 限制`);
      } else {
        newFiles.push({
          name: file.name,
          size: file.size,
          type: file.type,
          url: URL.createObjectURL(file)
        });
      }
    }

    if (newFiles.length > 0) {
      setModuleForm(prev => ({
        ...prev,
        uploadedFiles: [...prev.uploadedFiles, ...newFiles]
      }));
      toast.success(`已上傳 ${newFiles.length} 個檔案`);
    }

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeUploadedFile = (index: number) => {
    setModuleForm(prev => ({
      ...prev,
      uploadedFiles: prev.uploadedFiles.filter((_, i) => i !== index)
    }));
  };

  const handleAddModule = () => {
    if (!moduleForm.title || !moduleForm.content || !moduleForm.duration) {
      toast.error('請填寫所有必填欄位');
      return;
    }
    const newModule: TrainingModule = {
      id: `M${modules.length + 1}`,
      title: moduleForm.title,
      type: moduleForm.type,
      content: moduleForm.content,
      videoUrl: moduleForm.videoUrl || undefined,
      imageUrl: moduleForm.imageUrl || undefined,
      uploadedFiles: moduleForm.uploadedFiles.length > 0 ? moduleForm.uploadedFiles : undefined,
      duration: Number.parseInt(moduleForm.duration, 10),
      order: modules.length + 1,
      required: moduleForm.required
    };
    setModules(prev => [...prev, newModule]);
    setSelectedModule(newModule);
    setModuleForm(emptyModuleForm);
    setAddModuleOpen(false);
    toast.success(`課程模組「${moduleForm.title}」已新增`);
  };

  const handleDeleteModule = (moduleId: string) => {
    setModules(prev => prev.filter(m => m.id !== moduleId));
    if (selectedModule?.id === moduleId) {
      setSelectedModule(modules.find(m => m.id !== moduleId) || null);
    }
    toast.success('課程模組已刪除');
  };

  const showFileUpload = moduleForm.type === 'image' || moduleForm.type === 'ppt' || moduleForm.type === 'word';

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <TrainingHeader plan={plan} />

      {/* Info Cards */}
      <TrainingInfoCards plan={plan} modules={modules} participants={participants} />

      {/* Association Info */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">關聯方式：</span>
              <Badge variant="outline" className="bg-primary/5">
                {renderBadge(plan)}
              </Badge>
            </div>
            {plan.targetPositions.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">目標職位：</span>
                {plan.targetPositions.map(p => (
                  <Badge key={p} variant="outline" className="text-xs">
                    {p}
                  </Badge>
                ))}
              </div>
            )}
            {plan.targetDepartments.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">目標部門：</span>
                {plan.targetDepartments.map(d => (
                  <Badge key={d} variant="outline" className="text-xs">
                    {d}
                  </Badge>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">建立者：</span>
              <span className="text-sm font-medium">{plan.creator}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">更新於：</span>
              <span className="text-sm font-medium">{plan.updatedAt}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Course Modules */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Module List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">課程模組</h2>
            <Button
              size="sm"
              variant="outline"
              className="gap-1"
              onClick={() => {
                setModuleForm(emptyModuleForm);
                setAddModuleOpen(true);
              }}
            >
              <Plus className="h-3.5 w-3.5" /> 新增模組
            </Button>
          </div>
          <div className="space-y-2">
            {modules.map((m, idx) => {
              const Icon = moduleTypeIcons[m.type];
              const isSelected = selectedModule?.id === m.id;
              return (
                <Card
                  key={m.id}
                  className={`cursor-pointer transition-colors ${isSelected ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/50'}`}
                  onClick={() => setSelectedModule(m)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-muted shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-muted-foreground">{idx + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{m.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-0.5">
                            <Icon className="h-2.5 w-2.5" />
                            {moduleTypeLabels[m.type]}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">{m.duration} 分鐘</span>
                          {m.required && (
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1 py-0 bg-destructive/10 text-destructive border-destructive/20"
                            >
                              必修
                            </Badge>
                          )}
                        </div>
                        {m.uploadedFiles && m.uploadedFiles.length > 0 && (
                          <div className="flex items-center gap-1 mt-1">
                            <Upload className="h-2.5 w-2.5 text-muted-foreground" />
                            <span className="text-[10px] text-muted-foreground">{m.uploadedFiles.length} 個附件</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {modules.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">尚未添加課程模組</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3 gap-1"
                    onClick={() => {
                      setModuleForm(emptyModuleForm);
                      setAddModuleOpen(true);
                    }}
                  >
                    <Plus className="h-3.5 w-3.5" /> 新增第一個模組
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Module Content Preview */}
        <ModulePreview module={selectedModule} onDelete={handleDeleteModule} />
      </div>

      {/* Participants */}
      <Collapsible open={participantsOpen} onOpenChange={setParticipantsOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {participantsOpen ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                  <CardTitle className="text-base">參訓人員</CardTitle>
                  <Badge variant="outline" className="text-xs">
                    {participants.length} 人
                  </Badge>
                  <div className="flex items-center gap-2 ml-4">
                    <Progress value={completionRate} className="w-24 h-1.5" />
                    <span className="text-xs text-muted-foreground">完成 {completionRate}%</span>
                  </div>
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <ParticipantsTable participants={participants} completionRate={completionRate} />
        </Card>
      </Collapsible>

      {/* Add Module Dialog */}
      <Dialog open={addModuleOpen} onOpenChange={setAddModuleOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>新增課程模組</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>
                模組名稱 <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="例：公司介紹與企業文化"
                value={moduleForm.title}
                onChange={e => setModuleForm(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>內容類型</Label>
                <Select
                  value={moduleForm.type}
                  onValueChange={v =>
                    setModuleForm(prev => ({ ...prev, type: v as TrainingModule['type'], uploadedFiles: [] }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">純文字</SelectItem>
                    <SelectItem value="video">視頻</SelectItem>
                    <SelectItem value="image">圖片</SelectItem>
                    <SelectItem value="mixed">圖文+視頻</SelectItem>
                    <SelectItem value="ppt">PPT 簡報</SelectItem>
                    <SelectItem value="word">Word 文件</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>
                  預計時長 (分鐘) <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="number"
                  placeholder="例：60"
                  value={moduleForm.duration}
                  onChange={e => setModuleForm(prev => ({ ...prev, duration: e.target.value }))}
                />
              </div>
            </div>

            {(moduleForm.type === 'video' || moduleForm.type === 'mixed') && (
              <div className="space-y-2">
                <Label>視頻連結</Label>
                <Input
                  placeholder="https://..."
                  value={moduleForm.videoUrl}
                  onChange={e => setModuleForm(prev => ({ ...prev, videoUrl: e.target.value }))}
                />
              </div>
            )}

            {moduleForm.type === 'mixed' && (
              <div className="space-y-2">
                <Label>圖片連結</Label>
                <Input
                  placeholder="https://..."
                  value={moduleForm.imageUrl}
                  onChange={e => setModuleForm(prev => ({ ...prev, imageUrl: e.target.value }))}
                />
              </div>
            )}

            {/* File Upload Area */}
            {showFileUpload && (
              <div className="space-y-2">
                <Label>
                  上傳{({ image: '圖片', ppt: 'PPT 簡報' } as Record<string, string>)[moduleForm.type] ?? 'Word 文件'}
                </Label>
                <div
                  className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">點擊或拖曳檔案至此上傳</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {getFileTypeLabel(moduleForm.type)}，單檔上限 20MB
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept={getFileAccept(moduleForm.type)}
                    multiple={moduleForm.type === 'image'}
                    onChange={handleFileUpload}
                  />
                </div>

                {/* Uploaded files list */}
                {moduleForm.uploadedFiles.length > 0 && (
                  <div className="space-y-2 mt-3">
                    {moduleForm.uploadedFiles.map((file, idx) => {
                      const FileIcon = getFileIcon(file.name);
                      const isImage = file.type.startsWith('image/');
                      return (
                        <div key={idx} className="flex items-center gap-3 p-2 rounded-lg border bg-muted/30">
                          {isImage && file.url !== '#' ? (
                            <img src={file.url} alt={file.name} className="h-10 w-10 rounded object-cover shrink-0" />
                          ) : (
                            <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center shrink-0">
                              <FileIcon className="h-5 w-5 text-primary" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{file.name}</p>
                            <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                            onClick={() => removeUploadedFile(idx)}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label>
                內容說明 <span className="text-destructive">*</span>
              </Label>
              <Textarea
                placeholder="請輸入課程內容（支援 ### 標題與 - 列表格式）"
                value={moduleForm.content}
                onChange={e => setModuleForm(prev => ({ ...prev, content: e.target.value }))}
                rows={6}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={moduleForm.required}
                onChange={e => setModuleForm(prev => ({ ...prev, required: e.target.checked }))}
                className="rounded"
              />
              <Label className="cursor-pointer">設為必修模組</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddModuleOpen(false)}>
              取消
            </Button>
            <Button onClick={handleAddModule}>新增模組</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
