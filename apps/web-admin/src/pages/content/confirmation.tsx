import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@go-tech-frontend/ui';
import { useRef, useState } from 'react';

/** 将发布、删除及丢弃修改等确认操作包装为 Promise，交互结果由统一对话框返回。 */
export function useContentConfirmation() {
  const [dialog, setDialog] = useState<{ message: string; resolve: (result: boolean) => void } | null>(null);
  const ask = useRef(
    (message: string) =>
      new Promise<boolean>(resolve => {
        setDialog({ message, resolve });
      })
  ).current;
  const finish = (result: boolean) => {
    dialog?.resolve(result);
    setDialog(null);
  };
  const confirmation = (
    <AlertDialog
      open={dialog !== null}
      onOpenChange={open => {
        if (!open) finish(false);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>確認操作</AlertDialogTitle>
          <AlertDialogDescription>{dialog?.message}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => finish(false)}>取消</AlertDialogCancel>
          <AlertDialogAction onClick={() => finish(true)}>確定</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
  return { ask, confirmation };
}
