import { useState, useEffect } from "react";
import {
  LayoutDashboard, Users, Building2, Clock, DollarSign, Target,
  GraduationCap, Bell, BarChart3, Settings, Menu as MenuIcon,
  Plus, Pencil, Trash2, ChevronRight, ChevronDown,
  ArrowUp, ArrowDown, KeyRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { hasPerm } from "@/lib/auth";
import { MENU_PERM } from "@/lib/perms";
import {
  getMenuTree, saveMenu, deleteMenu,
  type MenuTreeNode, type MenuType, type MenuSaveParams,
} from "@/api/menu";

/** 图标名 → 组件映射（与 hr_menu.icon 存的字符串一致） */
const ICON_MAP: Record<string, any> = {
  LayoutDashboard, Users, Building2, Clock, DollarSign, Target,
  GraduationCap, Bell, BarChart3, Settings, Menu: MenuIcon,
};
const ICON_OPTIONS = Object.keys(ICON_MAP);

const TYPE_LABEL: Record<number, string> = { 0: "目錄", 1: "菜單", 2: "按鈕" };
const TYPE_VARIANT: Record<number, "default" | "secondary" | "outline"> = { 0: "outline", 1: "default", 2: "secondary" };

/** 编辑上下文：编辑现有节点带 node；新增仅带所属父级 parentId（0=顶级） */
type EditCtx = { node?: MenuTreeNode; parentId: number };

/** node → 保存入参（带覆盖字段），用于 visible/sort 等局部更新时补齐必填项 */
function nodeToParams(node: MenuTreeNode, override: Partial<MenuSaveParams>): MenuSaveParams {
  return {
    id: node.id,
    parentId: node.parentId,
    title: node.title,
    icon: node.icon,
    path: node.path,
    perms: node.perms,
    menuType: node.menuType,
    sort: node.sort,
    visible: node.visible,
    ...override,
  };
}

export default function MenuManagement() {
  const [tree, setTree] = useState<MenuTreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [editCtx, setEditCtx] = useState<EditCtx | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<null | (() => void)>(null);

  const reload = () =>
    getMenuTree()
      .then((res) => setTree(res.data ?? []))
      .catch((e) => toast({ title: "菜單載入失敗", description: e.message, variant: "destructive" }));

  useEffect(() => {
    reload().finally(() => setLoading(false));
  }, []);

  const toggle = (id: number) => setExpanded((s) => ({ ...s, [id]: !s[id] }));

  // ==== 统计（拍平整棵树）====
  const flat: MenuTreeNode[] = [];
  const collect = (list: MenuTreeNode[]) =>
    list.forEach((n) => { flat.push(n); if (n.children) collect(n.children); });
  collect(tree);
  const countType = (t: number) => flat.filter((n) => n.menuType === t).length;
  const hiddenCount = flat.filter((n) => n.visible !== 1).length;

  // ==== 后端操作 ====
  const doSave = async (params: MenuSaveParams, okMsg: string) => {
    try {
      await saveMenu(params);
      await reload();
      toast({ title: okMsg });
    } catch (e: any) {
      toast({ title: "操作失敗", description: e.message, variant: "destructive" });
    }
  };

  const doDelete = (node: MenuTreeNode) =>
    setConfirmDelete(() => async () => {
      try {
        await deleteMenu(node.id);
        await reload();
        toast({ title: "已刪除" });
      } catch (e: any) {
        toast({ title: "刪除失敗", description: e.message, variant: "destructive" });
      }
    });

  const toggleVisible = (node: MenuTreeNode, v: boolean) =>
    doSave(nodeToParams(node, { visible: v ? 1 : 0 }), v ? "已顯示" : "已隱藏");

  // 同级上/下移：与相邻节点交换 sort 后两个节点各自落库
  const move = (node: MenuTreeNode, siblings: MenuTreeNode[], dir: -1 | 1) => {
    const idx = siblings.findIndex((n) => n.id === node.id);
    const j = idx + dir;
    if (j < 0 || j >= siblings.length) return;
    const other = siblings[j];
    const sortA = node.sort ?? idx;
    const sortB = other.sort ?? j;
    // sort 相同则用索引兜底，保证顺序确实变化
    const [newA, newB] = sortA === sortB ? [j, idx] : [sortB, sortA];
    Promise.all([
      saveMenu(nodeToParams(node, { sort: newA })),
      saveMenu(nodeToParams(other, { sort: newB })),
    ])
      .then(reload)
      .then(() => toast({ title: "排序已更新" }))
      .catch((e) => toast({ title: "排序失敗", description: e.message, variant: "destructive" }));
  };

  // ==== 渲染树 ====
  const renderNode = (node: MenuTreeNode, siblings: MenuTreeNode[], depth = 0) => {
    const Icon = node.icon ? ICON_MAP[node.icon] : null;
    const isOpen = expanded[node.id] ?? true;
    const hasChildren = !!node.children?.length;
    return (
      <div key={node.id}>
        <div
          className="flex items-center gap-2 py-2 px-2 rounded hover:bg-muted/40"
          style={{ paddingLeft: 8 + depth * 20 }}
        >
          <button
            onClick={() => hasChildren && toggle(node.id)}
            className="w-5 flex-shrink-0 text-muted-foreground"
          >
            {hasChildren ? (isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />) : null}
          </button>
          {Icon && <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium truncate">{node.title}</span>
              <Badge variant={TYPE_VARIANT[node.menuType]} className="text-[10px] py-0 px-1.5 h-4">
                {TYPE_LABEL[node.menuType]}
              </Badge>
              {node.path && <code className="text-xs text-muted-foreground truncate">{node.path}</code>}
              {node.perms && (
                <span className="inline-flex items-center text-[10px] text-muted-foreground">
                  <KeyRound className="h-2.5 w-2.5 mr-0.5" />{node.perms}
                </span>
              )}
            </div>
          </div>
          <Switch checked={node.visible === 1} onCheckedChange={(v) => toggleVisible(node, v)} disabled={!hasPerm(MENU_PERM.EDIT)} />
          {hasPerm(MENU_PERM.EDIT) && (
            <>
              <Button size="icon" variant="ghost" onClick={() => move(node, siblings, -1)}>
                <ArrowUp className="h-3.5 w-3.5" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => move(node, siblings, 1)}>
                <ArrowDown className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
          {node.menuType === 0 && hasPerm(MENU_PERM.ADD) && (
            <Button size="icon" variant="ghost" title="新增子項" onClick={() => setEditCtx({ parentId: node.id })}>
              <Plus className="h-3.5 w-3.5" />
            </Button>
          )}
          {hasPerm(MENU_PERM.EDIT) && (
            <Button size="icon" variant="ghost" onClick={() => setEditCtx({ node, parentId: node.parentId })}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          )}
          {hasPerm(MENU_PERM.DELETE) && (
            <Button size="icon" variant="ghost" className="text-destructive" onClick={() => doDelete(node)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
        {hasChildren && isOpen && (
          <div>{node.children!.map((c) => renderNode(c, node.children!, depth + 1))}</div>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">菜單管理</h1>
          <p className="text-sm text-muted-foreground mt-1">
            維護系統菜單樹（目錄 / 菜單 / 按鈕），設定圖示、路由、權限字串、排序與顯示。變更即時保存至後端。
          </p>
        </div>
        {hasPerm(MENU_PERM.ADD) && (
          <Button onClick={() => setEditCtx({ parentId: 0 })}>
            <Plus className="h-4 w-4 mr-1" /> 新增頂級目錄
          </Button>
        )}
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardDescription>目錄數</CardDescription></CardHeader>
          <CardContent><div className="text-2xl font-bold">{countType(0)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardDescription>菜單數</CardDescription></CardHeader>
          <CardContent><div className="text-2xl font-bold">{countType(1)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardDescription>按鈕數</CardDescription></CardHeader>
          <CardContent><div className="text-2xl font-bold">{countType(2)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardDescription>已隱藏</CardDescription></CardHeader>
          <CardContent><div className="text-2xl font-bold">{hiddenCount}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-4">
          {loading ? (
            <div className="text-sm text-muted-foreground py-10 text-center">菜單載入中…</div>
          ) : tree.length === 0 ? (
            <div className="text-sm text-muted-foreground py-10 text-center">
              尚無菜單資料，點擊「新增頂級目錄」開始建立。
            </div>
          ) : (
            tree.map((n) => renderNode(n, tree, 0))
          )}
        </CardContent>
      </Card>

      {editCtx && (
        <MenuEditDialog
          ctx={editCtx}
          onClose={() => setEditCtx(null)}
          onSave={(params) => {
            doSave(params, editCtx.node ? "菜單已更新" : "菜單已建立");
            setEditCtx(null);
          }}
        />
      )}

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認刪除此菜單？</AlertDialogTitle>
            <AlertDialogDescription>將連同其所有子項一併刪除，且不可撤銷。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={() => { confirmDelete?.(); setConfirmDelete(null); }}>
              確認刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function MenuEditDialog({ ctx, onClose, onSave }: {
  ctx: EditCtx;
  onClose: () => void;
  onSave: (p: MenuSaveParams) => void;
}) {
  const editing = ctx.node;
  const [menuType, setMenuType] = useState<MenuType>(editing?.menuType ?? 1);
  const [title, setTitle] = useState(editing?.title ?? "");
  const [icon, setIcon] = useState(editing?.icon ?? "");
  const [path, setPath] = useState(editing?.path ?? "");
  const [perms, setPerms] = useState(editing?.perms ?? "");
  const [sort, setSort] = useState<string>(editing?.sort != null ? String(editing.sort) : "0");
  const [visible, setVisible] = useState(editing ? editing.visible === 1 : true);

  const parentId = editing ? editing.parentId : ctx.parentId;

  const submit = () => {
    if (!title.trim()) {
      toast({ title: "請填寫名稱", variant: "destructive" });
      return;
    }
    if (menuType === 1 && !path.trim()) {
      toast({ title: "菜單類型需填寫路由 URL", variant: "destructive" });
      return;
    }
    onSave({
      id: editing?.id,
      parentId,
      title: title.trim(),
      icon: menuType === 2 ? undefined : (icon || undefined),
      path: menuType === 1 ? path.trim() : undefined,
      perms: menuType === 0 ? undefined : (perms.trim() || undefined),
      menuType,
      sort: Number(sort) || 0,
      visible: visible ? 1 : 0,
    });
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "編輯菜單" : "新增菜單"}</DialogTitle>
          <DialogDescription>
            {parentId === 0 ? "頂級節點" : "子節點"}｜目錄用於分組，菜單對應頁面路由，按鈕對應頁面操作權限。
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>類型</Label>
              <Select value={String(menuType)} onValueChange={(v) => setMenuType(Number(v) as MenuType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">目錄</SelectItem>
                  <SelectItem value="1">菜單</SelectItem>
                  <SelectItem value="2">按鈕</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>名稱</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="例如：員工資料" />
            </div>
          </div>

          {menuType === 1 && (
            <div className="space-y-2">
              <Label>路由 URL</Label>
              <Input value={path} onChange={(e) => setPath(e.target.value)} placeholder="/employees（須與前端路由完全一致）" />
            </div>
          )}

          {menuType !== 0 && (
            <div className="space-y-2">
              <Label>權限字串{menuType === 2 ? "" : "（可選）"}</Label>
              <Input value={perms} onChange={(e) => setPerms(e.target.value)} placeholder="例如：hr:employee:add" />
            </div>
          )}

          {menuType !== 2 && (
            <div className="space-y-2">
              <Label>圖示（可選）</Label>
              <Select value={icon} onValueChange={setIcon}>
                <SelectTrigger><SelectValue placeholder="選擇圖示" /></SelectTrigger>
                <SelectContent>
                  {ICON_OPTIONS.map((k) => {
                    const I = ICON_MAP[k];
                    return (
                      <SelectItem key={k} value={k}>
                        <span className="flex items-center gap-2"><I className="h-4 w-4" /> {k}</span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 items-end">
            <div className="space-y-2">
              <Label>排序（同級升序）</Label>
              <Input type="number" value={sort} onChange={(e) => setSort(e.target.value)} />
            </div>
            <div className="flex items-center justify-between">
              <Label>啟用顯示</Label>
              <Switch checked={visible} onCheckedChange={setVisible} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button onClick={submit}>儲存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
