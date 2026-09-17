import { ChevronDown, ChevronRight, KeyRound } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type MenuTreeNode } from '@/api/menu';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

const TYPE_LABEL: Record<number, string> = { 0: '目錄', 1: '菜單', 2: '按鈕' };
const TYPE_VARIANT: Record<number, 'default' | 'outline' | 'secondary'> = {
  0: 'outline',
  1: 'default',
  2: 'secondary'
};

/** 收集节点自身 + 所有子孙 id */
export function collectIds(node: MenuTreeNode, acc: number[] = []): number[] {
  acc.push(node.id);
  (node.children ?? []).forEach(c => collectIds(c, acc));
  return acc;
}

/** 收集整棵树所有节点 id（用于全选） */
export function collectAllIds(tree: MenuTreeNode[]): number[] {
  const acc: number[] = [];
  tree.forEach(n => collectIds(n, acc));
  return acc;
}

/** 统计整棵树的节点总数 */
export function countNodes(tree: MenuTreeNode[]): number {
  let n = 0;
  const walk = (list: MenuTreeNode[]) =>
    list.forEach(x => {
      n++;
      walk(x.children ?? []);
    });
  walk(tree);
  return n;
}

/** 菜单树勾选器（受控）：勾选目录级联自身 + 全部子孙，支持半选态。 */
export function MenuTreePicker({
  checked,
  emptyHint,
  loading,
  onChange,
  tree
}: {
  checked: Set<number>;
  emptyHint?: string;
  loading?: boolean;
  onChange: (next: Set<number>) => void;
  tree: MenuTreeNode[];
}) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  const toggleExpand = (id: number) => setExpanded(s => ({ ...s, [id]: !s[id] }));

  const toggleCheck = (node: MenuTreeNode) => {
    const ids = collectIds(node);
    const next = new Set(checked);
    const willCheck = !checked.has(node.id);
    ids.forEach(id => (willCheck ? next.add(id) : next.delete(id)));
    onChange(next);
  };

  const nodeState = (node: MenuTreeNode): boolean | 'indeterminate' => {
    const ids = collectIds(node);
    const checkedCount = ids.filter(id => checked.has(id)).length;
    if (checkedCount === 0) return false;
    if (checkedCount === ids.length) return true;
    return 'indeterminate';
  };

  const renderNode = (node: MenuTreeNode, depth = 0) => {
    const hasChildren = Boolean(node.children?.length);
    const isOpen = expanded[node.id] ?? true;
    return (
      <div key={node.id}>
        <div className="flex items-center gap-2 py-1.5 rounded hover:bg-muted/40" style={{ paddingLeft: depth * 20 }}>
          <button
            type="button"
            onClick={() => hasChildren && toggleExpand(node.id)}
            className="w-5 flex-shrink-0 text-muted-foreground"
          >
            {hasChildren ? isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" /> : null}
          </button>
          <Checkbox checked={nodeState(node)} onCheckedChange={() => toggleCheck(node)} />
          <span className="text-sm">{t(node.title)}</span>
          <Badge variant={TYPE_VARIANT[node.menuType]} className="text-[10px] py-0 px-1.5 h-4">
            {t(TYPE_LABEL[node.menuType])}
          </Badge>
          {node.path && <code className="text-xs text-muted-foreground truncate">{node.path}</code>}
          {node.perms && (
            <span className="inline-flex items-center text-[10px] text-muted-foreground">
              <KeyRound className="h-2.5 w-2.5 mr-0.5" />
              {node.perms}
            </span>
          )}
        </div>
        {hasChildren && isOpen && <div>{node.children!.map(c => renderNode(c, depth + 1))}</div>}
      </div>
    );
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground text-center py-10">{t('載入中…')}</div>;
  }
  if (tree.length === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center py-10">
        {emptyHint ?? t('尚無菜單資料，請先於「菜單管理」建立菜單。')}
      </div>
    );
  }
  return <>{tree.map(n => renderNode(n, 0))}</>;
}
