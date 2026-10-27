import { Button, Input, Label } from '@go-tech-frontend/ui';
import { imageDimension, manualImageSizeLimit } from '@go-tech/manual-content/model';
import type { Editor } from '@tiptap/core';
import { NodeSelection } from '@tiptap/pm/state';
import { useEditorState } from '@tiptap/react';
import { X } from 'lucide-react';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { setImageAttributes } from './image-attributes';
import { useImageControlsPosition } from './use-image-controls-position';

function selectedImageElement(editor: Editor, position: number): HTMLImageElement | null {
  const dom = editor.view.nodeDOM(position);
  if (dom instanceof HTMLImageElement) return dom;
  return dom instanceof HTMLElement ? dom.querySelector('img') : null;
}

/** 以实际图片比例调整一边并同步另一边；不调用 focus，输入尺寸时不会把光标抢回正文。 */
function updateSize(editor: Editor, dimension: 'height' | 'width', value: number) {
  const selection = editor.state.selection;
  if (!(selection instanceof NodeSelection) || selection.node.type.name !== 'image') return;
  const image = selectedImageElement(editor, selection.from);
  const width = image?.naturalWidth || imageDimension(selection.node.attrs.width);
  const height = image?.naturalHeight || imageDimension(selection.node.attrs.height);
  const ratio = width && height ? width / height : null;
  let nextWidth = dimension === 'width' ? value : null;
  let nextHeight = dimension === 'height' ? value : null;
  if (ratio) {
    if (dimension === 'width') nextHeight = Math.max(1, Math.round(value / ratio));
    else nextWidth = Math.max(1, Math.round(value * ratio));
  }
  if (nextWidth && nextHeight && Math.max(nextWidth, nextHeight) > manualImageSizeLimit) {
    const factor = manualImageSizeLimit / Math.max(nextWidth, nextHeight);
    nextWidth = Math.max(1, Math.round(nextWidth * factor));
    nextHeight = Math.max(1, Math.round(nextHeight * factor));
  }
  setImageAttributes(editor, { width: nextWidth, height: nextHeight });
}

/** 数值编辑允许暂时清空，离开或回车后再校验提交，避免逐字输入时被编辑器重绘打断。 */
function DimensionInput({
  dimension,
  editor,
  value
}: {
  dimension: 'height' | 'width';
  editor: Editor;
  value: number | null;
}) {
  const [input, setInput] = useState<string | null>(null);
  const displayed = input ?? (value === null ? '' : String(value));
  function apply() {
    const next = imageDimension(Number(displayed));
    if (next) updateSize(editor, dimension, next);
    setInput(null);
  }
  return (
    <label className="flex items-center gap-2 text-sm">
      {dimension === 'width' ? '寬（px）' : '高（px）'}
      <Input
        aria-label={dimension === 'width' ? '圖片寬度' : '圖片高度'}
        className="w-20"
        type="number"
        min={1}
        max={manualImageSizeLimit}
        value={displayed}
        placeholder="自動"
        onChange={event => setInput(event.target.value)}
        onBlur={apply}
        onKeyDown={event => {
          if (event.key === 'Enter') {
            event.preventDefault();
            apply();
          }
        }}
      />
    </label>
  );
}

/** 选中正文图片后才展示尺寸和说明，常规上传不再要求额外填写表单。 */
export function ImageControls({ disabled, editor }: { disabled: boolean; editor: Editor }) {
  const image = useEditorState({
    editor,
    selector: ({ editor: current }) => {
      const selection = current.state.selection;
      if (!(selection instanceof NodeSelection) || selection.node.type.name !== 'image') return null;
      return {
        position: selection.from,
        src: String(selection.node.attrs.src),
        alt: String(selection.node.attrs.alt ?? ''),
        width: imageDimension(selection.node.attrs.width) ?? null,
        height: imageDimension(selection.node.attrs.height) ?? null
      };
    }
  });
  const anchor = image ? selectedImageElement(editor, image.position) : null;
  const { panel, position } = useImageControlsPosition(anchor);
  if (!image) return null;
  return createPortal(
    <fieldset
      ref={panel}
      disabled={disabled}
      className="fixed z-50 max-h-[calc(100dvh-24px)] space-y-2 overflow-y-auto rounded-lg border border-border bg-background p-3 text-foreground shadow-xl"
      style={{
        left: position.left,
        top: position.top,
        width: position.width,
        maxHeight: position.maxHeight,
        visibility: position.visible ? 'visible' : 'hidden'
      }}
      aria-label="圖片設定"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium">圖片設定</span>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          aria-label="關閉圖片設定"
          onClick={() => editor.commands.setTextSelection(image.position)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <DimensionInput key={`${image.position}:w`} editor={editor} dimension="width" value={image.width} />
        <DimensionInput key={`${image.position}:h`} editor={editor} dimension="height" value={image.height} />
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setImageAttributes(editor, { width: null, height: null })}
        >
          原始尺寸
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">正文寬度</span>
        {[25, 50, 75, 100].map(percent => (
          <Button
            key={percent}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const style = getComputedStyle(editor.view.dom);
              const available =
                editor.view.dom.clientWidth -
                Number.parseFloat(style.paddingLeft || '0') -
                Number.parseFloat(style.paddingRight || '0');
              if (available > 0) updateSize(editor, 'width', Math.max(1, Math.round((available * percent) / 100)));
            }}
          >
            {percent}%
          </Button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Label htmlFor="manual-image-description">圖片說明</Label>
        <Input
          key={`${image.position}:${image.src}:${image.alt}`}
          id="manual-image-description"
          className="min-w-0 flex-1"
          defaultValue={image.alt}
          maxLength={500}
          onBlur={event => setImageAttributes(editor, { alt: event.target.value.trim() || '圖片' })}
        />
      </div>
    </fieldset>,
    document.body
  );
}
