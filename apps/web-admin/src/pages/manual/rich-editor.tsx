import { Button, Input, Label } from '@go-tech-frontend/ui';
import { type RichDocument, type RichNode, safeManualUrl } from '@go-tech/manual-content/model';
import { Node } from '@tiptap/core';
import { Link } from '@tiptap/extension-link';
import { TableKit } from '@tiptap/extension-table';
import { EditorContent, useEditor } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { useEffect, useRef, useState } from 'react';
import { EditorToolbar } from './editor-toolbar';
import { ImageControls } from './image-controls';
import { clipboardImages, manualImageTypes } from './image-upload';
import { ImageUploadPlaceholders } from './image-upload-placeholder';
import { ManualImage } from './manual-image';
import { useImageUploads } from './use-image-uploads';

/** 提示块只包含段落，节点名称与共享 JSON 契约及前台渲染保持一致。 */
const Tip = Node.create({
  name: 'tip',
  group: 'block',
  content: 'paragraph+',
  defining: true,
  parseHTML: () => [{ tag: 'aside[data-manual-tip]' }],
  renderHTML: () => ['aside', { 'data-manual-tip': '', class: 'manual-tip' }, 0]
});

function uploadMessage(task: { error?: string; status: string }): string {
  if (task.status === 'error') return task.error ?? '上傳失敗';
  return task.status === 'uploading' ? '上傳中…' : '等待上傳…';
}

/** 选图、粘贴、拖拽共用异步上传队列；占位与插入位置都不依赖上传完成时的光标。 */
export function RichEditor({
  disabled,
  onChange,
  onPendingChange,
  value
}: {
  disabled: boolean;
  onChange: (value: RichDocument) => void;
  onPendingChange?: (count: number) => void;
  value: RichDocument;
}) {
  const [panel, setPanel] = useState<'link' | 'image-url' | null>(null);
  const [url, setUrl] = useState('');
  const [alt, setAlt] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);
  const insertPosition = useRef<number | undefined>(undefined);
  const uploadHandler = useRef<(files: File[], position?: number) => void>(() => {});
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        code: false,
        codeBlock: false,
        link: false,
        trailingNode: false
      }),
      Link.configure({ openOnClick: false, isAllowedUri: href => safeManualUrl(href) }),
      ManualImage,
      TableKit.configure({ table: { resizable: false } }),
      Tip,
      ImageUploadPlaceholders
    ],
    content: value.doc,
    editable: !disabled,
    editorProps: {
      attributes: { 'aria-label': '指南正文', role: 'textbox', 'aria-multiline': 'true' },
      handlePaste(view, event) {
        const images = clipboardImages(event.clipboardData);
        if (!view.editable || !images.length) return false;
        event.preventDefault();
        uploadHandler.current(images, view.state.selection.from);
        return true;
      },
      handleDrop(view, event) {
        // 编辑器内部拖动已有图片仍交给原生节点移动，只有外部文件走上传流程。
        if (!view.editable) return false;
        const images = Array.from(event.dataTransfer?.files ?? []).filter(file => file.type.startsWith('image/'));
        if (!images.length) return false;
        event.preventDefault();
        const position = view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos;
        uploadHandler.current(images, position);
        return true;
      }
    },
    onUpdate: ({ editor: current }) => {
      // 视图占位不进入文档 JSON；第三方节点属性仍由共享契约在保存时最终校验。
      onChange({ version: 1, doc: current.getJSON() as RichNode });
    }
  });
  const uploads = useImageUploads(editor, onPendingChange);
  useEffect(() => {
    uploadHandler.current = uploads.enqueue;
  }, [uploads.enqueue]);
  if (!editor) return <p>載入編輯器…</p>;
  return (
    <div className="manual-editor rounded-lg border border-border overflow-hidden">
      <input
        ref={fileInput}
        type="file"
        multiple
        accept={manualImageTypes.join(',')}
        hidden
        aria-label="選擇圖片"
        disabled={disabled}
        onChange={event => {
          const files = Array.from(event.target.files ?? []);
          if (files.length) uploads.enqueue(files, insertPosition.current);
          event.target.value = '';
        }}
      />
      <EditorToolbar
        editor={editor}
        disabled={disabled}
        onInsert={kind => {
          if (kind === 'image') {
            insertPosition.current = editor.state.selection.from;
            fileInput.current?.click();
          } else {
            setPanel('link');
            setUrl('');
          }
        }}
      />
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2 text-xs text-muted-foreground">
        <span>選圖後自動插入，也可直接貼上或拖曳圖片。</span>
        <Button
          type="button"
          variant="link"
          size="sm"
          className="h-auto p-0 text-xs"
          disabled={disabled}
          onClick={() => {
            setPanel('image-url');
            setUrl('');
            setAlt('');
          }}
        >
          使用圖片網址
        </Button>
      </div>
      {uploads.notice && (
        <p role="alert" className="px-3 py-2 text-sm text-destructive">
          {uploads.notice}
        </p>
      )}
      {uploads.queue.length > 0 && (
        <div className="space-y-2 border-b border-border p-3" aria-label="圖片上傳佇列">
          <p role="status" className="text-sm text-muted-foreground">
            尚有 {uploads.queue.length} 張圖片未完成，完成或取消後即可儲存。
          </p>
          {uploads.queue.map(task => (
            <div key={task.id} className="flex flex-wrap items-center gap-2 text-sm">
              <span className="min-w-0 flex-1 break-all">
                {task.file.name || '貼上的圖片'}：{uploadMessage(task)}
              </span>
              {task.status === 'error' && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={disabled}
                  onClick={() => uploads.retry(task.id)}
                >
                  重試
                </Button>
              )}
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={disabled}
                onClick={() => uploads.cancel(task.id)}
              >
                取消上傳
              </Button>
            </div>
          ))}
        </div>
      )}
      <ImageControls editor={editor} disabled={disabled} />
      {panel && (
        <div className="p-4 space-y-3 border-b border-border">
          <Label htmlFor="manual-resource-url">{panel === 'image-url' ? '圖片網址' : '連結網址'}</Label>
          <Input
            id="manual-resource-url"
            value={url}
            onChange={event => setUrl(event.target.value)}
            placeholder="https://…"
          />
          {panel === 'image-url' && (
            <>
              <Label htmlFor="manual-image-alt">圖片說明（選填）</Label>
              <Input
                id="manual-image-alt"
                maxLength={500}
                value={alt}
                onChange={event => setAlt(event.target.value)}
                placeholder="留空時自動使用「圖片」"
              />
            </>
          )}
          <div className="flex gap-2">
            <Button
              type="button"
              disabled={disabled || !safeManualUrl(url, panel === 'image-url')}
              onClick={() => {
                if (panel === 'image-url')
                  editor
                    .chain()
                    .focus()
                    .setImage({ src: url, alt: alt.trim() || '圖片' })
                    .run();
                else if (editor.state.selection.empty)
                  editor
                    .chain()
                    .focus()
                    .insertContent({ type: 'text', text: url, marks: [{ type: 'link', attrs: { href: url } }] })
                    .run();
                else editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
                setPanel(null);
              }}
            >
              插入
            </Button>
            <Button type="button" variant="outline" onClick={() => setPanel(null)}>
              取消
            </Button>
          </div>
        </div>
      )}
      <div className="manual-rich-text">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
