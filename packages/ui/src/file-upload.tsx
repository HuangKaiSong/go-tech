import { cn } from '@go-tech/utils';
import { AlertCircle, Download, FileImage, Upload, X, ZoomIn } from 'lucide-react';
import * as React from 'react';
import { useCallback, useRef, useState } from 'react';
import { Button } from './button';
import { Dialog, DialogContent, DialogTitle } from './dialog';
import { toast } from './sonner';

export interface UploadedFile {
  errorMessage?: string;
  file: File;
  id: string;
  previewUrl: string;
  progress: number;
  status: 'error' | 'success' | 'uploading';
  url?: string;
}

export interface FileUploadProps {
  /** Accepted file types, e.g. ["image/png", "image/jpeg"] */
  acceptTypes?: string[];
  /** Additional class names */
  className?: string;
  /** Whether the component is disabled */
  disabled?: boolean;
  headers?: Record<string, string>;
  list?: UploadedFile[];
  /** Maximum number of files allowed */
  maxCount?: number;
  /** Maximum file size in MB */
  maxSizeMB?: number;

  /** Callback when files change */
  onChange?: (files: UploadedFile[]) => void;
  /** Custom upload endpoint URL */
  uploadUrl?: string;
}

const simulateUpload = (uploadFile: UploadedFile): Promise<UploadedFile> => {
  return new Promise(resolve => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 30 + 10;
      if (progress >= 100) {
        clearInterval(interval);
        resolve({ ...uploadFile, status: 'success', progress: 100 });
      }
    }, 200);
  });
};

const handleDownload = (file: UploadedFile) => {
  const a = document.createElement('a');
  a.href = file.previewUrl;
  a.download = file.file.name;
  a.click();
};

const FileUpload: React.FC<FileUploadProps> = ({
  acceptTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
  className,
  disabled = false,
  headers,
  list,
  maxCount = 5,
  maxSizeMB = 10,
  onChange,
  uploadUrl
}) => {
  const isControlled = list !== undefined;
  const [internalFiles, setInternalFiles] = useState<UploadedFile[]>(list ?? []);
  const files = isControlled ? list : internalFiles;
  const [previewFile, setPreviewFile] = useState<UploadedFile | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const updateFiles = useCallback(
    (newFiles: UploadedFile[]) => {
      if (!isControlled) {
        setInternalFiles(newFiles);
      }
      onChange?.(newFiles);
    },
    [isControlled, onChange]
  );

  const validateFile = (file: File): string | null => {
    if (acceptTypes.length > 0 && !acceptTypes.includes(file.type)) {
      return `不支援的類型：${file.name}`;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      return `檔案 ${file.name} 超過 ${maxSizeMB}MB 限制`;
    }
    return null;
  };

  const uploadToServer = async (uploadFile: UploadedFile): Promise<UploadedFile> => {
    if (!uploadUrl) return simulateUpload(uploadFile);

    const formData = new FormData();
    formData.append('file', uploadFile.file);

    try {
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
        headers
      });
      if (!response.ok) throw new Error(`上傳失敗：${response.statusText}`);
      const result = await response.json();
      return {
        ...uploadFile,
        ...result.data,
        status: 'success',
        progress: 100
      };
    } catch (error) {
      return {
        ...uploadFile,
        status: 'error',
        progress: 0,
        errorMessage: error instanceof Error ? error.message : '上傳失敗'
      };
    }
  };

  const handleFiles = async (newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    const remaining = maxCount - files.length;

    if (remaining <= 0) {
      toast.warning('數量限制', {
        description: `最多只能上傳 ${maxCount} 個`
      });
      return;
    }

    const toProcess = fileArray.slice(0, remaining);
    if (fileArray.length > remaining) {
      toast.warning('部分檔案被忽略', {
        description: `已達到上限，僅處理前 ${remaining} 個檔案`
      });
    }

    const validFiles: UploadedFile[] = [];
    for (const file of toProcess) {
      const error = validateFile(file);
      if (error) {
        toast.error('檔案驗證失敗', {
          description: error
        });
        // oxlint-disable-next-line eslint/no-continue
        continue;
      }
      validFiles.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        previewUrl: URL.createObjectURL(file),
        status: 'uploading',
        progress: 0
      });
    }

    if (validFiles.length === 0) return;

    const updatedFiles = [...files, ...validFiles];
    updateFiles(updatedFiles);

    const results = await Promise.all(validFiles.map(f => uploadToServer(f)));
    const finalFiles = updatedFiles.map(f => {
      const result = results.find(r => r.id === f.id);
      return result || f;
    });
    updateFiles(finalFiles);
  };

  const handleRemove = (id: string) => {
    const file = files.find(f => f.id === id);
    if (file) URL.revokeObjectURL(file.previewUrl);
    updateFiles(files.filter(f => f.id !== id));
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!disabled) handleFiles(e.dataTransfer.files);
  };

  const acceptString = acceptTypes.join(',');

  return (
    <div className={cn('space-y-4', className)}>
      {/* Drop zone */}
      <div
        onDragOver={e => {
          e.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
          isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground mb-1">拖拽檔案到此處或點擊上傳</p>
        <p className="text-xs text-muted-foreground">
          支援 {acceptTypes.map(t => t.split('/')[1]?.toUpperCase()).join('、')} | 單檔最大 {maxSizeMB}MB | 最多{' '}
          {maxCount} 個
        </p>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={acceptString}
          multiple={maxCount > 1}
          onChange={e => e.target.files && handleFiles(e.target.files)}
          disabled={disabled}
        />
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {files.map(file => (
            <div key={file.id} className="group relative border border-border rounded-lg overflow-hidden bg-card">
              <div className="aspect-square relative">
                {file.file.type.startsWith('image/') ? (
                  <img src={file.previewUrl} alt={file.file.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <FileImage className="w-10 h-10 text-muted-foreground" />
                  </div>
                )}

                {/* Status overlay */}
                {file.status === 'uploading' && (
                  <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
                    <div className="w-3/4">
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all animate-pulse"
                          style={{ width: '60%' }}
                        />
                      </div>
                      <p className="text-xs text-center mt-1 text-muted-foreground">上傳中...</p>
                    </div>
                  </div>
                )}
                {file.status === 'error' && (
                  <div className="absolute inset-0 bg-destructive/20 flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-destructive" />
                  </div>
                )}

                {/* Action overlay */}
                {file.status === 'success' && (
                  <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => setPreviewFile(file)}>
                      <ZoomIn className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => handleDownload(file)}>
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Remove button */}
              <button
                onClick={() => handleRemove(file.id)}
                className="absolute top-1 right-1 bg-background/80 hover:bg-destructive hover:text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3.5 h-3.5" />
              </button>

              <div className="px-2 py-1.5">
                <p className="text-xs truncate text-foreground">{file.file.name}</p>
                <p className="text-[10px] text-muted-foreground">{(file.file.size / 1024).toFixed(0)} KB</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview dialog */}
      <Dialog open={Boolean(previewFile)} onOpenChange={() => setPreviewFile(null)}>
        <DialogContent className="max-w-4xl p-2">
          <DialogTitle className="sr-only">圖片預覽</DialogTitle>
          {previewFile && (
            <div className="space-y-2">
              <img
                src={previewFile.previewUrl}
                alt={previewFile.file.name}
                className="w-full max-h-[75vh] object-contain rounded"
              />
              <div className="flex items-center justify-between px-2 pb-1">
                <span className="text-sm text-muted-foreground truncate">{previewFile.file.name}</span>
                <Button size="sm" variant="outline" onClick={() => handleDownload(previewFile)}>
                  <Download className="w-4 h-4 mr-1" /> 下載
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export { FileUpload };
