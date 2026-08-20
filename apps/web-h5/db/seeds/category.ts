import { db } from '../index';
import { type NewFbCategory, type NewFbSubCategory, fbCategory, fbSubCategory } from '../scheam';

const categories: Omit<NewFbCategory, 'id'>[] = [
  { name: '租務部', description: '合同、租客、續租與租務流程相關的想法', icon: 'building-2', sortOrder: 1 },
  { name: '場務部', description: '跟進單、現場維修、巡查與場地管理', icon: 'wrench', sortOrder: 2 },
  { name: '會計部', description: '收支報表、發票、對帳與會計整合', icon: 'calculator', sortOrder: 3 },
  { name: '客服', description: '租客 Portal、通知、客服工單與溝通', icon: 'headphones', sortOrder: 4 },
  { name: '系統設定', description: '帳戶、權限、多公司與系統偏好設定', icon: 'sliders-horizontal', sortOrder: 5 },
  { name: '其他', description: '其他任何你想到的產品建議', icon: 'sparkles', sortOrder: 6 }
];

const subCategoryNames: Record<string, string[]> = {
  租務部: ['合同管理', '租客資料', '續租與退租', '報表匯出'],
  場務部: ['跟進單', '現場拍照', '維修排程', '手機版操作'],
  會計部: ['發票與收據', '收支報表', '銀行對帳', 'Xero 整合'],
  客服: ['租客 Portal', '線上繳費', '通知與提醒', '客服工單'],
  系統設定: ['帳戶與權限', '多公司管理', '通用設定', '資料匯入匯出'],
  其他: ['使用體驗', '效能', '其他建議']
};

export async function seedCategories() {
  // 插入分類並記錄實際 ID（自增 ID 不一定是 1-6）
  const catResults = await Promise.all(categories.map(c => db.insert(fbCategory).values(c)));
  const catIds = catResults.map(r => Number(r[0].insertId));

  // 用實際 ID 構建子分類數據
  const subValues: Omit<NewFbSubCategory, 'id'>[] = [];
  categories.forEach((cat, i) => {
    const names = subCategoryNames[cat.name] ?? [];
    names.forEach((name, j) => {
      subValues.push({ categoryId: catIds[i], name, sortOrder: j + 1 });
    });
  });

  if (subValues.length > 0) {
    await db.insert(fbSubCategory).values(subValues);
  }

  console.log(`Seed categories done. (${catIds.length} categories, ${subValues.length} subcategories)`);
}
