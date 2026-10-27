import type { Editor } from '@tiptap/core';
import { useEffect, useRef, useState } from 'react';
import { imageDescription, uploadManualImage, validateImageFile } from './image-upload';
import { imageUploadKey, uploadPosition } from './image-upload-placeholder';

interface ImageUploadTask {
  controller: AbortController;
  error?: string;
  file: File;
  id: string;
  status: 'error' | 'queued' | 'uploading';
}

/** 串行处理图片以保持选图顺序；失败项保留插入位置，重试或取消后继续后续图片。 */
export function useImageUploads(editor: Editor | null, onPendingChange?: (count: number) => void) {
  const tasks = useRef(new Map<string, ImageUploadTask>());
  const running = useRef(false);
  const live = useRef(true);
  const [queue, setQueue] = useState<ImageUploadTask[]>([]);
  const [notice, setNotice] = useState('');
  useEffect(() => {
    live.current = true;
    const pending = tasks.current;
    return () => {
      live.current = false;
      pending.forEach(task => task.controller.abort());
      pending.clear();
      running.current = false;
      onPendingChange?.(0);
    };
  }, [editor, onPendingChange]);

  const notify = () => {
    if (!live.current) return;
    setQueue(Array.from(tasks.current.values()).map(task => ({ ...task })));
    onPendingChange?.(tasks.current.size);
  };
  function processNext() {
    if (!editor || editor.isDestroyed || !live.current || running.current) return;
    const task = tasks.current.values().next().value;
    if (!task || task.status === 'error') return;
    running.current = true;
    task.status = 'uploading';
    notify();
    uploadManualImage(task.file, task.controller.signal)
      .then(src => {
        if (!live.current || editor.isDestroyed || !tasks.current.has(task.id)) return;
        const position = uploadPosition(editor.state, task.id);
        if (position !== undefined) {
          // 不夺取焦点：上传期间输入的文字和移动后的光标都保留，图片落在映射后的原位置。
          const inserted = editor
            .chain()
            .insertContentAt(
              position,
              { type: 'image', attrs: { src, alt: imageDescription(task.file) } },
              { updateSelection: false }
            )
            .setMeta(imageUploadKey, { remove: task.id })
            .run();
          if (!inserted) throw new Error('此處無法插入圖片，請取消後在正文段落重試');
        }
        tasks.current.delete(task.id);
      })
      .catch((reason: unknown) => {
        if (!live.current || editor.isDestroyed || !tasks.current.has(task.id)) return;
        task.status = 'error';
        task.error = reason instanceof Error ? reason.message : '圖片上傳失敗，請重試';
        const position = uploadPosition(editor.state, task.id);
        if (position !== undefined)
          editor.view.dispatch(
            editor.state.tr
              .setMeta(imageUploadKey, { remove: task.id, add: { id: task.id, position, failed: true } })
              .setMeta('addToHistory', false)
          );
      })
      .finally(() => {
        running.current = false;
        notify();
        processNext();
      });
  }
  function enqueue(files: File[], position?: number) {
    if (!editor || !editor.isEditable || editor.isDestroyed) return;
    setNotice('');
    const at = position ?? editor.state.selection.from;
    files.forEach(file => {
      const error = validateImageFile(file);
      if (error) {
        setNotice(`${file.name || '圖片'}：${error}`);
        return;
      }
      const id = crypto.randomUUID();
      tasks.current.set(id, { id, file, controller: new AbortController(), status: 'queued' });
      editor.view.dispatch(
        editor.state.tr.setMeta(imageUploadKey, { add: { id, position: at } }).setMeta('addToHistory', false)
      );
    });
    notify();
    processNext();
  }
  function retry(id: string) {
    const task = tasks.current.get(id);
    if (!task) return;
    task.status = 'queued';
    task.error = undefined;
    task.controller = new AbortController();
    notify();
    processNext();
  }
  function cancel(id: string) {
    const task = tasks.current.get(id);
    if (!task || !editor || editor.isDestroyed) return;
    tasks.current.delete(id);
    task.controller.abort();
    editor.view.dispatch(editor.state.tr.setMeta(imageUploadKey, { remove: id }).setMeta('addToHistory', false));
    notify();
    processNext();
  }
  return { queue, notice, enqueue, retry, cancel };
}
