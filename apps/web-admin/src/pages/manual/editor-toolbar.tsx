import { Button, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@go-tech-frontend/ui';
import type { Editor } from '@tiptap/core';
import { useEditorState } from '@tiptap/react';
import {
  Bold,
  Columns3,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Lightbulb,
  Link2,
  List,
  ListOrdered,
  type LucideIcon,
  Minus,
  Pilcrow,
  Plus,
  Quote,
  Redo2,
  Rows3,
  Table2,
  TableProperties,
  Undo2,
  Unlink
} from 'lucide-react';
import { createPortal } from 'react-dom';

interface ToolbarAction {
  active?: boolean;
  icon: LucideIcon;
  label: string;
  modifier?: 'add' | 'remove';
  run: () => void;
}

/** 图标保持可访问名称和浮层说明；表格行/列操作用加减徽标区分，防止仅凭形状猜测。 */
function ActionButton({ action, disabled }: { action: ToolbarAction; disabled: boolean }) {
  const Icon = action.icon;
  const Modifier = action.modifier === 'add' ? Plus : Minus;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 rounded-md text-muted-foreground hover:text-foreground aria-pressed:bg-primary/10 aria-pressed:text-primary"
          aria-label={action.label}
          aria-pressed={action.active}
          disabled={disabled}
          onMouseDown={event => event.preventDefault()}
          onClick={action.run}
        >
          <span className="relative inline-flex" aria-hidden="true">
            <Icon className="h-4 w-4" />
            {action.modifier && (
              <Modifier className="absolute -bottom-1 -right-1 h-3 w-3 rounded-sm bg-muted stroke-[3]" />
            )}
          </span>
        </Button>
      </TooltipTrigger>
      {/* 编辑器外框裁剪溢出内容，提示需通过 Portal 避免被工具栏边界截断。 */}
      {createPortal(
        <TooltipContent side="bottom" sideOffset={8}>
          {action.label}
        </TooltipContent>,
        document.body
      )}
    </Tooltip>
  );
}

/** 工具栏仅负责命令展示；沿用现有编辑器和插入面板，不改变正文存储格式。 */
export function EditorToolbar({
  disabled,
  editor,
  onInsert
}: {
  disabled: boolean;
  editor: Editor;
  onInsert: (kind: 'image' | 'link') => void;
}) {
  // 订阅选择区和事务，确保光标移动、撤销等操作后图标选中态与真实文档一致。
  const state = useEditorState({
    editor,
    selector: ({ editor: current }) => ({
      paragraph: current.isActive('paragraph'),
      heading2: current.isActive('heading', { level: 2 }),
      heading3: current.isActive('heading', { level: 3 }),
      bold: current.isActive('bold'),
      italic: current.isActive('italic'),
      bulletList: current.isActive('bulletList'),
      orderedList: current.isActive('orderedList'),
      blockquote: current.isActive('blockquote'),
      tip: current.isActive('tip')
    })
  });
  const groups: { actions: ToolbarAction[]; label: string }[] = [
    {
      label: '文字格式',
      actions: [
        {
          label: '正文',
          icon: Pilcrow,
          active: state.paragraph,
          run: () => {
            editor.chain().focus().setParagraph().run();
          }
        },
        {
          label: '二級標題',
          icon: Heading2,
          active: state.heading2,
          run: () => {
            editor.chain().focus().toggleHeading({ level: 2 }).run();
          }
        },
        {
          label: '三級標題',
          icon: Heading3,
          active: state.heading3,
          run: () => {
            editor.chain().focus().toggleHeading({ level: 3 }).run();
          }
        },
        {
          label: '粗體',
          icon: Bold,
          active: state.bold,
          run: () => {
            editor.chain().focus().toggleBold().run();
          }
        },
        {
          label: '斜體',
          icon: Italic,
          active: state.italic,
          run: () => {
            editor.chain().focus().toggleItalic().run();
          }
        }
      ]
    },
    {
      label: '段落與列表',
      actions: [
        {
          label: '項目列表',
          icon: List,
          active: state.bulletList,
          run: () => {
            editor.chain().focus().toggleBulletList().run();
          }
        },
        {
          label: '編號列表',
          icon: ListOrdered,
          active: state.orderedList,
          run: () => {
            editor.chain().focus().toggleOrderedList().run();
          }
        },
        {
          label: '引用',
          icon: Quote,
          active: state.blockquote,
          run: () => {
            editor.chain().focus().toggleBlockquote().run();
          }
        },
        {
          label: '提示塊',
          icon: Lightbulb,
          active: state.tip,
          run: () => {
            editor.chain().focus().toggleWrap('tip').run();
          }
        }
      ]
    },
    {
      label: '插入內容',
      actions: [
        { label: '插入連結', icon: Link2, run: () => onInsert('link') },
        {
          label: '取消連結',
          icon: Unlink,
          run: () => {
            editor.chain().focus().unsetLink().run();
          }
        },
        { label: '插入圖片', icon: ImagePlus, run: () => onInsert('image') },
        {
          label: '插入表格',
          icon: Table2,
          run: () => {
            editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
          }
        }
      ]
    },
    {
      label: '表格操作',
      actions: [
        {
          label: '新增表格行',
          icon: Rows3,
          modifier: 'add',
          run: () => {
            editor.chain().focus().addRowAfter().run();
          }
        },
        {
          label: '刪除表格行',
          icon: Rows3,
          modifier: 'remove',
          run: () => {
            editor.chain().focus().deleteRow().run();
          }
        },
        {
          label: '新增表格列',
          icon: Columns3,
          modifier: 'add',
          run: () => {
            editor.chain().focus().addColumnAfter().run();
          }
        },
        {
          label: '刪除表格列',
          icon: Columns3,
          modifier: 'remove',
          run: () => {
            editor.chain().focus().deleteColumn().run();
          }
        },
        {
          label: '刪除表格',
          icon: TableProperties,
          modifier: 'remove',
          run: () => {
            editor.chain().focus().deleteTable().run();
          }
        }
      ]
    },
    {
      label: '編輯歷史',
      actions: [
        {
          label: '撤銷',
          icon: Undo2,
          run: () => {
            editor.chain().focus().undo().run();
          }
        },
        {
          label: '重做',
          icon: Redo2,
          run: () => {
            editor.chain().focus().redo().run();
          }
        }
      ]
    }
  ];
  return (
    <TooltipProvider delayDuration={300}>
      <div
        className="flex flex-wrap items-center gap-y-1 border-b border-border bg-muted p-2"
        role="toolbar"
        aria-label="正文格式"
      >
        {groups.map(group => (
          <div
            key={group.label}
            role="group"
            aria-label={group.label}
            className="mr-1 flex shrink-0 items-center gap-0.5 border-r border-border pr-1 last:mr-0 last:border-r-0 last:pr-0"
          >
            {group.actions.map(action => (
              <ActionButton key={action.label} action={action} disabled={disabled} />
            ))}
          </div>
        ))}
      </div>
    </TooltipProvider>
  );
}
