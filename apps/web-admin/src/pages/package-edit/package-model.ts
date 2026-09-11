import type { PackageCardPlan } from '@go-tech/package-ui/model';
import { z } from 'zod';
import type { PackageItem, PackageMenuItem } from '@/mocks/packages';

type PriceKey = 'price' | 'priceA' | 'priceB' | 'priceC';

export type PackageDraft = Omit<PackageItem, 'id' | PriceKey> & {
  id?: number;
} & Partial<Pick<PackageItem, PriceKey>>;

export interface MenuNode {
  children: MenuNode[];
  icon?: string;
  id: number;
  level: number;
  title: string;
}

const numericValue = z.union([z.number(), z.string().trim().min(1).transform(Number)]).pipe(z.number().finite());
const identifier = numericValue.pipe(z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER));
const priceValue = numericValue.pipe(z.number().nonnegative());
const optionalNumber = z.preprocess(value => (value === null ? undefined : value), priceValue.optional());
const optionalText = z
  .string()
  .nullish()
  .transform(value => value ?? undefined);
const descriptionText = z
  .string()
  .max(120)
  .nullish()
  .transform(value => value ?? '');

const menuItemSchema = z
  .object({
    isHighlight: z.boolean().optional(),
    level: numericValue.pipe(z.number().int()).default(0),
    menuIcon: optionalText,
    menuId: identifier,
    menuTitle: z.string(),
    parentId: identifier.nullish(),
    sortOrder: numericValue.optional()
  })
  .passthrough();

const addonErrorMessages: Record<string, string> = {
  dataCount: '數量必須為有效的非負整數',
  features: '展示賣點必須為文字列表',
  id: '附加功能標識不正確',
  menu: '請檢查綁定功能的格式',
  itemName: '請輸入不超過 30 字的功能名稱',
  itemType: '請選擇有效的功能類型',
  price: '單價必須為有效的非負金額，最多兩位小數，且金額不可超出計算範圍',
  summary: '摘要必須為不超過 120 字的文字'
};

const detailSchema = z
  .object({
    applyTo: descriptionText,
    badge: optionalText,
    billingLabel: optionalText,
    billingMode: z.enum(['employee_month', 'month', 'unit_month', 'year']).optional(),
    capacityLabel: optionalText,
    dataCount: z.preprocess(value => (value === null ? undefined : value), identifier.optional()),
    features: z.array(z.string()).optional(),
    isRecommended: z.boolean().optional(),
    menu: z.array(menuItemSchema).optional(),
    originalPrice: optionalNumber,
    packageKind: z.enum(['addon', 'plan']).optional(),
    remind: descriptionText,
    summary: descriptionText
  })
  .passthrough();

const detailErrorMessages: Record<string, string> = {
  additionalItems: '請檢查附加功能設定，每項標識必須唯一',
  applyTo: '適用人群必須為不超過 120 字的文字',
  badge: '請檢查套餐標籤的格式',
  billingLabel: '請檢查自訂計費說明的格式',
  billingMode: '請選擇有效的計費方式',
  capacityLabel: '請檢查自訂容量說明的格式',
  dataCount: '數量必須為有效的非負整數',
  features: '展示賣點必須為文字列表',
  isRecommended: '請檢查推薦套餐的設定',
  menu: '請檢查套餐功能內容的格式',
  originalPrice: '劃線原價必須為有效的非負金額',
  packageKind: '請選擇有效的展示類型',
  remind: '溫馨提示必須為不超過 120 字的文字',
  summary: '套餐摘要必須為不超過 120 字的文字'
};

const addonDetailSchema = detailSchema.extend({
  dataCount: identifier.optional().default(0),
  menu: z.array(menuItemSchema).default([])
});

// Keep the existing add-on payload shape; unknown backend fields survive edits.
const addonItemSchema = z
  .object({
    bizCode: z.enum(['hr', 'pms']).optional(),
    detail: addonDetailSchema,
    id: identifier.optional(),
    itemName: z.string().trim().min(1).max(30),
    itemType: identifier,
    packageCode: z.string().max(20).optional(),
    packageName: z.string().max(30).optional(),
    price: priceValue,
    status: z.union([z.literal(0), z.literal(1)]).optional()
  })
  .loose()
  .superRefine((addon, context) => {
    if (addon.itemType !== 1 && addon.itemType !== 2 && addon.itemType !== 3) {
      context.addIssue({ code: 'custom', message: 'Invalid item type', path: ['itemType'] });
    }
    if ((addon.itemType === 1 || addon.itemType === 3) && addon.detail.menu.length === 0) {
      context.addIssue({ code: 'custom', message: 'Menu is required', path: ['detail', 'menu'] });
    }
  });

const packageSchema = z.object({
  bizCode: z.enum(['hr', 'pms']),
  detail: detailSchema,
  itemName: z.string().max(30).optional(),
  itemType: identifier.optional(),
  packageCode: z.string().max(20),
  packageName: z.string().trim().min(1, '請輸入套餐名稱').max(30),
  price: priceValue,
  priceA: priceValue,
  priceB: priceValue,
  priceC: priceValue,
  status: z.union([z.literal(0), z.literal(1)]),
  additionalItems: z.array(addonItemSchema).default([])
});

const menuNodeSchema: z.ZodType<MenuNode> = z.lazy(() =>
  z.object({
    children: z
      .array(menuNodeSchema)
      .nullish()
      .transform(value => value ?? []),
    icon: optionalText,
    id: identifier,
    level: numericValue.pipe(z.number().int()).default(0),
    title: z.string()
  })
);

export const menuTreeSchema = z.array(menuNodeSchema);

export function parsePackage(value: unknown): PackageItem {
  // The detail column may arrive as a JSON object or serialized JSON.
  const responseSchema = packageSchema.extend({
    detail: z.preprocess(raw => {
      if (typeof raw !== 'string') return raw ?? {};
      try {
        return JSON.parse(raw) as unknown;
      } catch {
        return raw;
      }
    }, detailSchema)
  });
  const result = responseSchema.safeParse(value);
  console.log(result);

  if (!result.success) throw new Error('套餐資料格式不正確，請檢查接口回傳的欄位');
  return {
    ...result.data,
    additionalItems: result.data.additionalItems.map(addon => ({ ...addon, bizCode: result.data.bizCode }))
  };
}

export function createPackageDraft(): PackageDraft {
  return {
    bizCode: 'pms',
    detail: { billingMode: 'month', menu: [], packageKind: 'plan', applyTo: '', remind: '', summary: '' },
    itemName: '',
    itemType: 1,
    packageCode: '',
    packageName: '',
    status: 0,
    additionalItems: []
  };
}

export function buildPackagePayload(draft: PackageDraft, menuTree: MenuNode[] = []) {
  const result = packageSchema.safeParse(draft);
  if (!result.success) {
    const issue = result.error.issues[0];
    if (issue?.path[0] === 'packageName') throw new Error('請輸入不超過 30 字的套餐名稱');
    if (issue?.path[0] === 'detail') {
      throw new Error(detailErrorMessages[String(issue.path[1])] ?? '請檢查展示設定的格式');
    }
    if (issue?.path[0] === 'additionalItems' && typeof issue.path[1] === 'number') {
      const field = issue.path[2] === 'detail' ? issue.path[3] : issue.path[2];
      throw new Error(`第 ${issue.path[1] + 1} 項附加功能：${addonErrorMessages[String(field)] ?? '請檢查設定'}`);
    }
    throw new Error('請填寫完整資料，所有價格必須為有效的非負金額');
  }

  const payload = result.data;
  if (payload.detail.menu) {
    payload.detail.menu = attachMenuParents(payload.detail.menu, menuTree);
  }
  payload.additionalItems = payload.additionalItems.map(addon => ({
    ...addon,
    bizCode: payload.bizCode,
    detail: {
      ...addon.detail,
      dataCount: addon.itemType === 1 ? 0 : addon.detail.dataCount,
      menu: addon.itemType === 2 ? [] : attachMenuParents(addon.detail.menu, menuTree)
    }
  }));

  return payload;
}

export const splitFeatures = (text: string) => [
  ...new Set(
    text
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)
  )
];

export function toPackageCardPlan(draft: PackageDraft): PackageCardPlan {
  return {
    badge: draft.detail.badge,
    billingLabel: draft.detail.billingLabel,
    billingMode: draft.detail.billingMode,
    capacityLabel: draft.detail.capacityLabel,
    count: draft.detail.dataCount,
    features: draft.detail.features,
    isRecommended: draft.detail.isRecommended,
    menu: draft.detail.menu,
    note: draft.detail.remind,
    originalPrice: draft.detail.originalPrice,
    packageKind: draft.detail.packageKind,
    packageName: draft.packageName || '套餐名稱',
    price: draft.price,
    subtitle: draft.detail.applyTo,
    summary: draft.detail.summary
  };
}

export const flattenMenu = (nodes: MenuNode[]): MenuNode[] =>
  nodes.flatMap(node => [node, ...flattenMenu(node.children)]);

/** Use tree edges, not level or array order, to identify each direct parent. */
function attachMenuParents<Item extends PackageMenuItem>(menu: Item[], tree: MenuNode[]): Item[] {
  const parents = new Map<number, number | null>();
  const visit = (nodes: MenuNode[], parentId: number | null) => {
    for (const node of nodes) {
      parents.set(node.id, parentId);
      visit(node.children, node.id);
    }
  };
  visit(tree, null);

  return menu.map(item => {
    const parentId = parents.get(item.menuId);
    // Historical menus absent from the current tree keep their saved relationship.
    return parentId === undefined ? item : { ...item, parentId };
  });
}

export function getMenuChecked(node: MenuNode, selected: Set<number>): boolean | 'indeterminate' {
  const nodes = flattenMenu([node]);
  const count = nodes.filter(item => selected.has(item.id)).length;
  if (count === nodes.length) return true;
  return count > 0 ? 'indeterminate' : false;
}

/** Update the whole subtree and its ancestors, retaining metadata and menus absent from the current tree. */
export function toggleMenuSelection({
  checked,
  current,
  target,
  tree
}: {
  checked: boolean;
  current: PackageMenuItem[];
  target: MenuNode;
  tree: MenuNode[];
}): PackageMenuItem[] {
  const selected = new Map(current.map(item => [item.menuId, item]));
  const add = (node: MenuNode) =>
    selected.set(node.id, {
      level: node.level,
      menuIcon: node.icon,
      menuId: node.id,
      menuTitle: node.title,
      ...selected.get(node.id)
    });

  flattenMenu([target]).forEach(node => {
    if (checked) add(node);
    else selected.delete(node.id);
  });

  const updateAncestors = (node: MenuNode): boolean => {
    if (node.id === target.id) return true;
    const containsTarget = node.children.map(updateAncestors).some(Boolean);
    if (containsTarget) {
      if (flattenMenu(node.children).some(child => selected.has(child.id))) add(node);
      else selected.delete(node.id);
    }
    return containsTarget;
  };
  tree.forEach(updateAncestors);
  return attachMenuParents([...selected.values()], tree);
}
