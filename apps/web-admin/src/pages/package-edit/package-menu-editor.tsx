import { Badge, Button, Checkbox, Label, badgeVariants } from '@go-tech-frontend/ui';
import { cn } from '@go-tech/utils';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useId, useState } from 'react';
import type { PackageMenuItem } from '@/mocks/packages';
import { flattenMenu, getMenuChecked, toggleMenuSelection } from './package-model';
import type { MenuNode } from './package-model';

interface MenuNodeProps {
  idPrefix: string;
  node: MenuNode;
  onToggle: (node: MenuNode, checked: boolean) => void;
  selected: Set<number>;
}

function MenuItemRow({ idPrefix, node, onToggle, selected }: MenuNodeProps) {
  const checked = getMenuChecked(node, selected);
  const actions = flattenMenu(node.children);
  const actionCount = actions.filter(action => selected.has(action.id)).length;

  return (
    <li className={`space-y-2 px-3 py-3 transition-colors ${checked !== false ? 'bg-primary/[0.03]' : ''}`}>
      <div className="flex flex-wrap items-center gap-2">
        <Checkbox
          id={`${idPrefix}-menu-${node.id}`}
          checked={checked}
          onCheckedChange={value => onToggle(node, value === true)}
        />
        <Label
          htmlFor={`${idPrefix}-menu-${node.id}`}
          className={`cursor-pointer text-sm ${checked !== false ? 'font-medium text-foreground' : 'font-normal text-muted-foreground'}`}
        >
          {node.title}
        </Label>
        {actions.length > 0 && (
          <>
            <Badge variant="outline" className="text-[11px] font-normal">
              按鈕 {actionCount}/{actions.length}
            </Badge>
            <div className="ml-auto flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-primary"
                aria-label={`全選${node.title}的功能`}
                onClick={() => onToggle(node, true)}
              >
                全選
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-muted-foreground"
                aria-label={`取消${node.title}的全部功能`}
                onClick={() => onToggle(node, false)}
              >
                全不選
              </Button>
            </div>
          </>
        )}
      </div>
      {actions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pl-6">
          {actions.map(action => {
            const actionChecked = getMenuChecked(action, selected);
            return (
              <button
                key={action.id}
                type="button"
                aria-pressed={actionChecked === 'indeterminate' ? 'mixed' : actionChecked}
                onClick={() => onToggle(action, actionChecked !== true)}
                className={cn(
                  badgeVariants({ variant: 'outline' }),
                  'cursor-pointer py-1 font-normal',
                  actionChecked !== false
                    ? 'border-primary bg-primary/5 text-primary hover:bg-primary/10'
                    : 'border-border bg-background text-muted-foreground hover:bg-muted/60'
                )}
              >
                {action.title}
              </button>
            );
          })}
        </div>
      )}
    </li>
  );
}

function MenuGroup({ idPrefix, node, onToggle, selected }: MenuNodeProps) {
  const [expanded, setExpanded] = useState(true);
  const items = node.children.length ? node.children : [node];
  const selectedCount = items.filter(item => getMenuChecked(item, selected) !== false).length;
  const allChecked = items.every(item => getMenuChecked(item, selected) === true);
  const contentId = `${idPrefix}-menu-group-${node.id}`;

  return (
    <div className="overflow-hidden rounded-md border border-border">
      <div className="flex items-center justify-between gap-2 bg-muted/40 px-3 py-2">
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={contentId}
          onClick={() => setExpanded(previous => !previous)}
          className="flex min-w-0 flex-1 items-center gap-2 rounded-sm text-left text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {expanded ? (
            <ChevronDown className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          )}
          <span>{node.title}</span>
          <Badge variant="secondary" className="font-normal">
            {selectedCount}/{items.length}
          </Badge>
        </button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 shrink-0 px-2 text-xs text-primary"
          aria-label={allChecked ? `取消${node.title}的全部功能` : `全選${node.title}的功能`}
          onClick={() => onToggle(node, !allChecked)}
        >
          {allChecked ? '全部取消' : '全選'}
        </Button>
      </div>
      <ul id={contentId} hidden={!expanded} className="divide-y divide-border">
        {items.map(item => (
          <MenuItemRow key={item.id} idPrefix={idPrefix} node={item} onToggle={onToggle} selected={selected} />
        ))}
      </ul>
    </div>
  );
}

export function PackageMenuEditor({
  menu,
  onChange,
  tree
}: {
  menu: PackageMenuItem[];
  onChange: (menu: PackageMenuItem[]) => void;
  tree: MenuNode[];
}) {
  const idPrefix = useId();
  const selected = new Set(menu.map(item => item.menuId));
  const onToggle = (node: MenuNode, checked: boolean) =>
    onChange(toggleMenuSelection({ checked, current: menu, target: node, tree }));

  return (
    <div className="space-y-3">
      {tree.map(group => (
        <MenuGroup key={group.id} idPrefix={idPrefix} node={group} selected={selected} onToggle={onToggle} />
      ))}
    </div>
  );
}
