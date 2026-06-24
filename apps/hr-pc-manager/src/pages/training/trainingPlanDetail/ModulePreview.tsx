import { BookOpen, Download, File, FileText, Image, type LucideProps, Play, Presentation, Trash2 } from 'lucide-react';

import type { ForwardRefExoticComponent, RefAttributes } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { moduleTypeIcons, moduleTypeLabels } from './constants';

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getFileIcon = (
  fileName: string
): ForwardRefExoticComponent<Omit<LucideProps, 'ref'> & RefAttributes<SVGSVGElement>> => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext === 'ppt' || ext === 'pptx') return Presentation;
  if (ext === 'doc' || ext === 'docx') return File;
  if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext || '')) return Image;
  return FileText;
};

const renderContentLine = (line: string, i: number) => {
  if (line.startsWith('### '))
    return (
      <h3 key={i} className="text-base font-semibold mt-4 mb-2">
        {line.replace('### ', '')}
      </h3>
    );
  if (line.startsWith('- '))
    return (
      <li key={i} className="text-sm text-foreground ml-4 mb-1">
        {line.replace('- ', '')}
      </li>
    );
  if (line.trim() === '') return <br key={i} />;
  return (
    <p key={i} className="text-sm text-foreground leading-relaxed mb-2">
      {line}
    </p>
  );
};

const ModulePreview = ({ module, onDelete }) => {
  if (!module) {
    return (
      <Card>
        <CardContent className="p-12 text-center text-muted-foreground">
          <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p>選擇左側課程模組查看內容</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="lg:col-span-2">
      <Card className="sticky top-6">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-xs gap-1">
                  {(() => {
                    const Icon = moduleTypeIcons[module.type];
                    return <Icon className="h-3 w-3" />;
                  })()}
                  {moduleTypeLabels[module.type]}
                </Badge>
                <span className="text-xs text-muted-foreground">{module.duration} 分鐘</span>
                {module.required && (
                  <Badge variant="outline" className="text-xs bg-destructive/10 text-destructive border-destructive/20">
                    必修
                  </Badge>
                )}
              </div>
              <CardTitle className="text-lg">{module.title}</CardTitle>
            </div>
            <Button variant="ghost" size="sm" className="text-destructive h-7" onClick={() => onDelete(module.id)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Video */}
          {module.videoUrl && (
            <div className="rounded-lg bg-muted/50 border overflow-hidden">
              <div className="aspect-video flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                <div className="text-center">
                  <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3">
                    <Play className="h-8 w-8 text-primary ml-1" />
                  </div>
                  <p className="text-sm text-muted-foreground">培訓視頻</p>
                  <p className="text-xs text-muted-foreground mt-1">{module.videoUrl}</p>
                </div>
              </div>
            </div>
          )}

          {/* Image */}
          {module.imageUrl && (
            <div className="rounded-lg overflow-hidden border">
              <img
                src={module.imageUrl}
                alt={module.title}
                className="w-full h-48 object-cover"
                onError={e => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}

          {/* Uploaded Files Preview */}
          {module.uploadedFiles && module.uploadedFiles.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">附件檔案</p>
              <div className="space-y-2">
                {module.uploadedFiles.map((file, idx) => {
                  const FileIcon = getFileIcon(file.name);
                  const isImage = file.type.startsWith('image/');
                  return (
                    <div key={idx}>
                      {isImage && file.url !== '#' && (
                        <div className="rounded-lg overflow-hidden border mb-2">
                          <img
                            src={file.url}
                            alt={file.name}
                            className="w-full h-48 object-cover"
                            onError={e => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <FileIcon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{file.name}</p>
                          <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                        </div>
                        <Button variant="outline" size="sm" className="gap-1 shrink-0">
                          <Download className="h-3.5 w-3.5" /> 下載
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* PPT/Word placeholder preview */}
          {(module.type === 'ppt' || module.type === 'word') && !module.uploadedFiles?.length && (
            <div className="rounded-lg border bg-muted/30 p-8 text-center">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                {module.type === 'ppt' ? (
                  <Presentation className="h-8 w-8 text-muted-foreground" />
                ) : (
                  <File className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {module.type === 'ppt' ? '尚未上傳 PPT 簡報' : '尚未上傳 Word 文件'}
              </p>
            </div>
          )}

          {/* Text Content */}
          <div className="prose prose-sm max-w-none">{module.content.split('\n').map(renderContentLine)}</div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ModulePreview;
