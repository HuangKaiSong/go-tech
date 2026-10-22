import { Button, FileUpload, Input, Label, type UploadedFile } from '@go-tech-frontend/ui';
import { type RichDocument, type RichNode, safeManualUrl } from '@go-tech/manual-content/model';
import { Node } from '@tiptap/core';
import { Image } from '@tiptap/extension-image';
import { Link } from '@tiptap/extension-link';
import { TableKit } from '@tiptap/extension-table';
import { EditorContent, useEditor } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { useState } from 'react';
import { EditorToolbar } from './editor-toolbar';

/** 提示块只包含段落，节点名称与共享 JSON 契约及前台渲染保持一致。 */
const Tip = Node.create({
  name: 'tip',
  group: 'block',
  content: 'paragraph+',
  defining: true,
  parseHTML: () => [{ tag: 'aside[data-manual-tip]' }],
  renderHTML: () => ['aside', { 'data-manual-tip': '', class: 'manual-tip' }, 0]
});

/** 受控扩展集合的可视化正文编辑器；图片沿用既有 MinIO 上传入口且必须填写替代文字。 */
export function RichEditor({
  disabled,
  onChange,
  value
}: {
  disabled: boolean;
  onChange: (value: RichDocument) => void;
  value: RichDocument;
}) {
  const [panel, setPanel] = useState<'link' | 'image' | null>(null);
  const [url, setUrl] = useState('');
  const [alt, setAlt] = useState('');
  const [files, setFiles] = useState<UploadedFile[]>([]);
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
      Image.configure({ allowBase64: false }),
      TableKit.configure({ table: { resizable: false } }),
      Tip
    ],
    content: value.doc,
    editable: !disabled,
    editorProps: { attributes: { 'aria-label': '指南正文', role: 'textbox', 'aria-multiline': 'true' } },
    onUpdate: ({ editor: current }) => {
      // 编辑器只注册契约支持的扩展；第三方 JSON 的最终结构仍由服务端校验。
      onChange({ version: 1, doc: current.getJSON() as RichNode });
    }
  });
  if (!editor) return <p>載入編輯器…</p>;
  return (
    <div className="manual-editor rounded-lg border border-border overflow-hidden">
      <EditorToolbar
        editor={editor}
        disabled={disabled}
        onInsert={kind => {
          setPanel(kind);
          setUrl('');
          if (kind === 'image') {
            setAlt('');
            setFiles([]);
          }
        }}
      />
      {panel && (
        <div className="p-4 space-y-3 border-b border-border">
          <Label htmlFor="manual-resource-url">{panel === 'image' ? '圖片網址' : '連結網址'}</Label>
          <Input
            id="manual-resource-url"
            value={url}
            onChange={event => setUrl(event.target.value)}
            placeholder="https://…"
          />
          {panel === 'image' && (
            <>
              <Label htmlFor="manual-image-alt">圖片說明（必填）</Label>
              <Input id="manual-image-alt" maxLength={500} value={alt} onChange={event => setAlt(event.target.value)} />
              <FileUpload
                acceptTypes={['image/png', 'image/jpeg', 'image/webp', 'image/gif']}
                maxCount={1}
                maxSizeMB={10}
                list={files}
                uploadUrl="/api/pms-resource/web-back/minio/upload"
                onChange={next => {
                  setFiles(next);
                  const uploaded = next.find(file => file.status === 'success' && file.url);
                  if (uploaded?.url) setUrl(uploaded.url);
                }}
              />
            </>
          )}
          <div className="flex gap-2">
            <Button
              type="button"
              disabled={disabled || !safeManualUrl(url, panel === 'image') || (panel === 'image' && !alt.trim())}
              onClick={() => {
                if (panel === 'image') editor.chain().focus().setImage({ src: url, alt: alt.trim() }).run();
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
