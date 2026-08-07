import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Download,
  File as FileIcon,
  FileText,
  Image as ImageIcon,
  PlayCircle,
  Presentation
} from 'lucide-react';
import type { MyTrainingModule } from '@/api/training';
import MobileLayout from '@/components/MobileLayout';

interface LearningPageProps {
  courseTitle: string;
  module: MyTrainingModule;
  moduleIndex: number;
  onBack: () => void;
  onComplete: () => void;
  totalModules: number;
}

const contentTypeLabel: Record<string, string> = {
  text: '文字',
  video: '視頻',
  image: '圖片',
  mixed: '圖文+視頻',
  ppt: 'PPT 簡報',
  word: 'Word 文件'
};

const formatFileSize = (bytes?: number) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const fileIcon = (name: string) => {
  const ext = name.split('.').pop()?.toLowerCase();
  if (ext === 'ppt' || ext === 'pptx') return Presentation;
  if (ext === 'doc' || ext === 'docx') return FileIcon;
  if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext || '')) return ImageIcon;
  return FileText;
};

const LearningPage = ({ courseTitle, module, moduleIndex, onBack, onComplete, totalModules }: LearningPageProps) => {
  return (
    <MobileLayout title="學習中">
      <div className="px-5 pt-4 pb-40">
        {/* Top bar */}
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-primary mb-4">
          <ArrowLeft className="w-5 h-5" /> 返回課程
        </button>

        {/* Module info header */}
        <div className="bg-card rounded-2xl border border-border p-4 mb-4">
          <p className="text-xs text-muted-foreground mb-1">{courseTitle}</p>
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-base font-bold text-foreground">{module.title}</h2>
            {module.done && <CheckCircle2 className="w-4 h-4 text-[hsl(var(--success))]" />}
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {module.duration} 分鐘
            </span>
            <span className="flex items-center gap-1">
              <FileText className="w-4 h-4" />
              模組 {moduleIndex + 1}/{totalModules}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-muted text-[11px]">
              {contentTypeLabel[module.contentType] ?? module.contentType}
            </span>
          </div>
        </div>

        {/* Video */}
        {module.videoUrl && (
          <a
            href={module.videoUrl}
            target="_blank"
            rel="noreferrer"
            className="block bg-foreground/95 rounded-2xl overflow-hidden mb-4"
          >
            <div className="aspect-video flex flex-col items-center justify-center gap-3">
              <div className="w-16 h-16 bg-primary/90 rounded-full flex items-center justify-center shadow-lg">
                <PlayCircle className="w-9 h-9 text-primary-foreground" />
              </div>
              <span className="text-primary-foreground/80 text-sm">點擊播放課程影片</span>
              <span className="text-primary-foreground/40 text-xs px-6 text-center break-all">{module.videoUrl}</span>
            </div>
          </a>
        )}

        {/* Image */}
        {module.imageUrl && (
          <div className="rounded-2xl overflow-hidden border border-border mb-4">
            <img
              src={module.imageUrl}
              alt={module.title}
              className="w-full object-cover"
              onError={e => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}

        {/* Attachments */}
        {module.files && module.files.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-foreground mb-2">附件檔案</h3>
            <div className="space-y-2">
              {module.files.map(f => {
                const Icon = fileIcon(f.name);
                return (
                  <a
                    key={f.id}
                    href={f.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 bg-card rounded-xl border border-border p-3 active:bg-muted/50"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{f.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(f.fileSize)}</p>
                    </div>
                    <Download className="w-5 h-5 text-muted-foreground shrink-0" />
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {/* Text content */}
        {module.content && (
          <div className="bg-card rounded-2xl border border-border p-4 mb-4">
            {module.content.split('\n').map((line, i) => {
              if (line.startsWith('### '))
                return (
                  <h3 key={i} className="text-sm font-bold text-foreground mt-3 mb-1.5">
                    {line.replace('### ', '')}
                  </h3>
                );
              if (line.startsWith('- '))
                return (
                  <div key={i} className="flex items-start gap-2 text-sm text-foreground/80 mb-1">
                    <CheckCircle2 className="w-4 h-4 text-[hsl(var(--success))] mt-0.5 shrink-0" />
                    <span>{line.replace('- ', '')}</span>
                  </div>
                );
              if (line.trim() === '') return <div key={i} className="h-2" />;
              return (
                <p key={i} className="text-sm text-foreground/80 leading-relaxed mb-1.5">
                  {line}
                </p>
              );
            })}
          </div>
        )}

        {!module.videoUrl && !module.imageUrl && !module.content && (!module.files || module.files.length === 0) && (
          <div className="text-center text-sm text-muted-foreground py-10">此模組暫無學習內容</div>
        )}
      </div>

      {/* Complete button (fixed bottom) */}
      <div className="fixed bottom-16 left-0 right-0 max-w-lg mx-auto px-5 py-3 bg-background/95 backdrop-blur border-t border-border z-40">
        {module.done ? (
          <button
            disabled
            className="w-full bg-muted text-muted-foreground font-semibold text-sm py-3.5 rounded-xl flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5" /> 已完成本模組
          </button>
        ) : (
          <button
            onClick={onComplete}
            className="w-full bg-primary text-primary-foreground font-semibold text-sm py-3.5 rounded-xl active:scale-[0.98] transition-transform"
          >
            標記完成本模組
          </button>
        )}
      </div>
    </MobileLayout>
  );
};

export default LearningPage;
