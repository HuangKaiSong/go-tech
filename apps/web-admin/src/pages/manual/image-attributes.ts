import type { Editor } from '@tiptap/core';
import { closeHistory } from '@tiptap/pm/history';

/** 一次尺寸调整对应一次撤销；相同值的失焦事件不创建额外历史记录。 */
export function setImageAttributes(editor: Editor, attrs: Record<string, number | string | null>) {
  const current = editor.getAttributes('image');
  if (!Object.entries(attrs).some(([key, value]) => current[key] !== value)) return;
  editor.view.dispatch(closeHistory(editor.state.tr));
  editor.commands.updateAttributes('image', attrs);
  editor.view.dispatch(closeHistory(editor.state.tr));
}
