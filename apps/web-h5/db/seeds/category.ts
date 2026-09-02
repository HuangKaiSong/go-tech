import { db } from '../index';
import { type NewFbCategory, type NewFbSubCategory, fbCategory, fbSubCategory } from '../scheam';

const categories: Omit<NewFbCategory, 'id'>[] = [
  {
    system: 'pms',
    name: '租務部',
    description: '合同、租客、續租與租務流程相關的想法',
    icon: 'building-2',
    sortOrder: 1
  },
  { system: 'pms', name: '場務部', description: '跟進單、現場維修、巡查與場地管理', icon: 'wrench', sortOrder: 2 },
  { system: 'pms', name: '會計部', description: '收支報表、發票、對帳與會計整合', icon: 'calculator', sortOrder: 3 },
  { system: 'pms', name: '客服', description: '租客 Portal、通知、客服工單與溝通', icon: 'headphones', sortOrder: 4 },
  {
    system: 'pms',
    name: '系統設定',
    description: '帳戶、權限、多公司與系統偏好設定',
    icon: 'sliders-horizontal',
    sortOrder: 5
  },
  { system: 'pms', name: '其他', description: '其他任何你想到的產品建議', icon: 'sparkles', sortOrder: 6 },
  {
    system: 'hr',
    name: '人事管理',
    description: '員工資料、入職與離職流程相關建議',
    icon: 'users',
    sortOrder: 1
  },
  { system: 'hr', name: '組織架構', description: '部門、職位與匯報關係的管理', icon: 'network', sortOrder: 2 },
  {
    system: 'hr',
    name: '考勤假期',
    description: '打卡、排班、假期設定與審批流程',
    icon: 'calendar-clock',
    sortOrder: 3
  },
  { system: 'hr', name: '薪資管理', description: '薪資方案、計算、獎罰與發薪', icon: 'wallet', sortOrder: 4 },
  {
    system: 'hr',
    name: '績效培訓',
    description: '考核方案、績效評估與培訓管理',
    icon: 'trending-up',
    sortOrder: 5
  },
  {
    system: 'hr',
    name: '報表與通知',
    description: '人力報表分析、消息通知與系統設定',
    icon: 'chart-column',
    sortOrder: 6
  }
];

const subCategoryNames: Record<string, string[]> = {
  租務部: ['合同管理', '租客資料', '續租與退租', '報表匯出'],
  場務部: ['跟進單', '現場拍照', '維修排程', '手機版操作'],
  會計部: ['發票與收據', '收支報表', '銀行對帳', 'Xero 整合'],
  客服: ['租客 Portal', '線上繳費', '通知與提醒', '客服工單'],
  系統設定: ['帳戶與權限', '多公司管理', '通用設定', '資料匯入匯出'],
  其他: ['使用體驗', '效能', '其他建議'],
  人事管理: ['員工資料', '入職管理', '離職管理', '電子檔案'],
  組織架構: ['部門管理', '職位管理', '職位架構', '權限分配'],
  考勤假期: ['打卡管理', '打卡記錄', '假期設定', '審批管理'],
  薪資管理: ['薪資方案', '薪資計算', '獎金/罰款', '發薪管理'],
  績效培訓: ['考核方案', '績效評估', '培訓計劃', '培訓記錄'],
  報表與通知: ['報表分析', '消息通知', '系統設定', '其他建議']
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
