import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getMenuTree, getPositionMenuIds, assignPositionMenus, type MenuTreeNode } from "@/api/menu";
import { MenuTreePicker, countNodes } from "@/components/organization/MenuTreePicker";

export function AssignMenuDialog({
  positionId, positionTitle, open, onClose, onAssigned,
}: {
  positionId: number | null;
  positionTitle?: string;
  open: boolean;
  onClose: () => void;
  onAssigned?: () => void;
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
      .catch((e) => toast.error(e.message || t("載入菜單失敗")))
      .finally(() => setLoading(false));
  }, [open, positionId, t]);

  const total = countNodes(tree);

  const handleSave = async () => {
    if (positionId == null) return;
    setSaving(true);
    try {
      await assignPositionMenus(positionId, Array.from(checked));
      toast.success(t("菜單權限已保存"));
      onAssigned?.();
      onClose();
    } catch (e: any) {
      toast.error(e.message || t("保存失敗"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{t("分配菜單")}{positionTitle ? ` — ${positionTitle}` : ""}</DialogTitle>
          <DialogDescription>
            {t("勾選該職位可存取的菜單與按鈕。勾選目錄會級聯選中其下全部子項。已選 {{checked}} / {{total}}。", { checked: checked.size, total })}
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto border rounded p-2">
          <MenuTreePicker tree={tree} checked={checked} onChange={setChecked} loading={loading} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t("取消")}</Button>
          <Button onClick={handleSave} disabled={saving || loading}>{saving ? t("保存中…") : t("保存")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
