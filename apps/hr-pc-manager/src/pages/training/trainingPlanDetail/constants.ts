import { BookOpen, File, FileText, Image, Presentation, Video } from 'lucide-react';

export const moduleTypeIcons: Record<string, React.ElementType> = {
  text: FileText,
  video: Video,
  image: Image,
  mixed: BookOpen,
  ppt: Presentation,
  word: File
};

export const moduleTypeLabels: Record<string, string> = {
  text: '文字',
  video: '視頻',
  image: '圖片',
  mixed: '圖文+視頻',
  ppt: 'PPT 簡報',
  word: 'Word 文件'
};

export const statusColors: Record<string, string> = {
  草稿: 'bg-muted text-muted-foreground border-border',
  已發佈: 'bg-primary/10 text-primary border-primary/20',
  進行中: 'bg-warning/10 text-warning border-warning/20',
  已結束: 'bg-success/10 text-success border-success/20'
};

export const participantStatusColors: Record<string, string> = {
  未開始: 'bg-muted text-muted-foreground border-border',
  進行中: 'bg-warning/10 text-warning border-warning/20',
  已完成: 'bg-success/10 text-success border-success/20'
};

export const typeColors: Record<string, string> = {
  入職培訓: 'bg-primary/10 text-primary border-primary/20',
  職位培訓: 'bg-accent/10 text-accent-foreground border-accent/20',
  技能培訓: 'bg-warning/10 text-warning border-warning/20',
  管理培訓: 'bg-success/10 text-success border-success/20',
  合規培訓: 'bg-destructive/10 text-destructive border-destructive/20'
};

export const targetTypeLabels: Record<string, string> = {
  all_new: '所有新員工',
  position: '指定職位',
  department: '指定部門',
  manual: '手動指定'
};
