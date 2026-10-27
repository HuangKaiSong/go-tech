import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import type { EditorState } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

interface UploadMarker {
  failed?: boolean;
  id: string;
  position: number;
}
type UploadMeta = { add?: UploadMarker; remove?: string };
export const imageUploadKey = new PluginKey<DecorationSet>('manualImageUploads');

/** 占位只存在于编辑视图，不写入正文；编辑期间通过 transaction mapping 跟随原插入位置。 */
export const ImageUploadPlaceholders = Extension.create({
  name: 'manualImageUploads',
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: imageUploadKey,
        state: {
          init: () => DecorationSet.empty,
          apply(transaction, previous) {
            let markers = previous.map(transaction.mapping, transaction.doc);
            const meta: UploadMeta | undefined = transaction.getMeta(imageUploadKey);
            if (meta?.remove)
              markers = markers.remove(markers.find(undefined, undefined, spec => spec.id === meta.remove));
            if (meta?.add) {
              const marker = meta.add;
              const decoration = Decoration.widget(
                marker.position,
                () => {
                  const element = document.createElement('span');
                  element.className = 'manual-image-upload-placeholder';
                  element.contentEditable = 'false';
                  element.setAttribute('role', 'status');
                  element.textContent = marker.failed ? '圖片上傳失敗，可重試或取消' : '圖片等待上傳…';
                  return element;
                },
                { id: marker.id, side: 1 }
              );
              markers = markers.add(transaction.doc, [decoration]);
            }
            return markers;
          }
        },
        props: { decorations: state => imageUploadKey.getState(state) }
      })
    ];
  }
});

/** 找不到占位说明用户已经删掉了该位置；上传完成后不能再任意插入到新的光标处。 */
export function uploadPosition(state: EditorState, id: string): number | undefined {
  return imageUploadKey.getState(state)?.find(undefined, undefined, spec => spec.id === id)[0]?.from;
}
