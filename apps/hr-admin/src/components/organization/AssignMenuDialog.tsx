import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { assignPositionMenus, getMenuTree, getPositionMenuIds, type MenuTreeNode } from '@/api/menu';
import { collectAllIds, countNodes, MenuTreePicker } from '@/components/organization/MenuTreePicker';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';

export function AssignMenuDialog({
  onAssigned,
  onClose,
  open,
  positionId,
  positionTitle
}: {
  onAssigned?: () => void;
  onClose: () => void;
  open: boolean;
  positionId: number | null;
  positionTitle?: string;
}) {
  const { t } = useTranslation();
  const [tree, setTree] = useState<MenuTreeNode[]>([]);
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || positionId == null) return;
    setLoading(true);
    Promise.all([getMenuTree(), getPositionMenuIds(positionId)])
      .then(([treeRes, idsRes]) => {
        setTree(treeRes.data ?? []);
        setChecked(new Set(idsRes.data ?? []));
      })
      .catch(e => toast.error(e.message || t('載入菜單失敗')))
      .finally(() => setLoading(false));
  }, [open, positionId, t]);

  const total = countNodes(tree);

  const handleSave = async () => {
    if (positionId == null) return;
    setSaving(true);
    try {
      await assignPositionMenus(positionId, Array.from(checked));
      toast.success(t('菜單權限已保存'));
      onAssigned?.();
      onClose();
    } catch (e: any) {
      toast.error(e.message || t('保存失敗'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {t('分配菜單')}
            {positionTitle ? ` — ${positionTitle}` : ''}
          </DialogTitle>
          <DialogDescription>
            {t('勾選該職位可存取的菜單與按鈕。勾選目錄會級聯選中其下全部子項。已選 {{checked}} / {{total}}。', {
              checked: checked.size,
              total
            })}
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="text-xs text-primary hover:underline"
            onClick={() => setChecked(new Set(collectAllIds(tree)))}
          >
            {t('全選')}
          </button>
          <button
            type="button"
            className="text-xs text-primary hover:underline"
            onClick={() => setChecked(new Set())}
          >
            {t('全不選')}
          </button>
        </div>
        <div className="flex-1 overflow-y-auto border rounded p-2">
          <MenuTreePicker tree={tree} checked={checked} onChange={setChecked} loading={loading} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t('取消')}
          </Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving ? t('保存中…') : t('保存')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
