import { db } from '../index';
import { type NewFbFeature, fbCategory, fbComment, fbFeature, fbSubCategory } from '../scheam';
import { platformCustomer } from '../scheam/external/platform_customer';

/* ========== 数据定义（GO-PMS + GO-HR 需求及已完成历史） ========== */

interface FeatureSeed {
  author: string;
  category: string;
  comments: { author: string; content: string; createdAt: string; isOfficial?: boolean }[];
  createdAt: string;
  description: string;
  likes: number;
  shippedAt?: string;
  status: 'developing' | 'pending' | 'shipped';
  subCategory: string;
  title: string;
  version?: string;
}

const features: FeatureSeed[] = [
  // ---- GO-HR ----
  {
    title: '入職流程電子簽署合約',
    description: '新員工可線上填寫個人資料並電子簽署僱傭合約,免除紙本往返。',
    category: '人事管理',
    subCategory: '入職管理',
    author: 'Christopher_Peterson',
    createdAt: '2026-07-15',
    likes: 87,
    status: 'pending',
    comments: [{ author: 'Helen_P', content: '連同 I.D. 上傳一起做就完美。', createdAt: '2026-07-16' }]
  },
  {
    title: '離職結算自動計算年假餘額',
    description: '離職時自動計算未休年假、代通知金與最後糧期金額。',
    category: '人事管理',
    subCategory: '離職管理',
    author: 'Marco',
    createdAt: '2026-06-30',
    likes: 64,
    status: 'pending',
    comments: []
  },
  {
    title: '員工資料支援自訂欄位',
    description: '不同行業需要記錄的員工資料不同,希望可自行增加欄位(如牌照編號、體檢日期)。',
    category: '人事管理',
    subCategory: '員工資料',
    author: 'Helen_P',
    createdAt: '2026-07-12',
    likes: 58,
    status: 'developing',
    comments: [
      {
        author: 'GO-TECH Manager',
        content: '自訂欄位已納入人事模組改版,會支援必填與權限控制。',
        createdAt: '2026-07-13',
        isOfficial: true
      }
    ]
  },
  {
    title: '分店/部門獨立管理權限',
    description: '連鎖店希望店長只看到自己分店員工的資料與考勤。',
    category: '組織架構',
    subCategory: '權限分配',
    author: '陳生',
    createdAt: '2026-07-03',
    likes: 73,
    status: 'developing',
    comments: [
      {
        author: 'GO-TECH Manager',
        content: '分店層級權限開發中,預計下版本推出。',
        createdAt: '2026-07-05',
        isOfficial: true
      }
    ]
  },
  {
    title: '組織架構圖可拖拉調整',
    description: '希望在架構圖上直接拖拉員工調整部門與匯報關係。',
    category: '組織架構',
    subCategory: '職位架構',
    author: 'Leo_Mars',
    createdAt: '2026-07-08',
    likes: 49,
    status: 'pending',
    comments: []
  },
  {
    title: '手機 GPS 定位打卡',
    description: '外勤同事希望可用手機打卡並記錄 GPS 位置,限制打卡範圍。',
    category: '考勤假期',
    subCategory: '打卡管理',
    author: '阿龍',
    createdAt: '2026-07-16',
    likes: 112,
    status: 'developing',
    comments: [
      { author: 'Christopher_Peterson', content: '最好可設定多個允許地點。', createdAt: '2026-07-17' },
      {
        author: 'GO-TECH Manager',
        content: '圍欄打卡已在開發中,支援多地點設定。',
        createdAt: '2026-07-18',
        isOfficial: true
      }
    ]
  },
  {
    title: '輪班排更表與自動更表提醒',
    description: '服務業需要排更,希望可製作月度更表並自動通知員工。',
    category: '考勤假期',
    subCategory: '打卡記錄',
    author: 'Kelly',
    createdAt: '2026-07-09',
    likes: 95,
    status: 'pending',
    comments: []
  },
  {
    title: '假期規則可按年資自動累積',
    description: '年假天數依入職年資自動遞增,並支援結轉上限設定。',
    category: '考勤假期',
    subCategory: '假期設定',
    author: 'Helen_P',
    createdAt: '2026-06-26',
    likes: 68,
    status: 'pending',
    comments: []
  },
  {
    title: '多層審批流程與代理人',
    description: '請假可設定多級審批,主管放假時可指定代理審批人。',
    category: '考勤假期',
    subCategory: '審批管理',
    author: 'Peter',
    createdAt: '2026-07-11',
    likes: 54,
    status: 'pending',
    comments: []
  },
  {
    title: '強積金(MPF)供款自動計算',
    description: '薪資計算時自動帶出僱主及僱員 MPF 供款,並可匯出受託人格式。',
    category: '薪資管理',
    subCategory: '薪資計算',
    author: '李小姐',
    createdAt: '2026-07-14',
    likes: 121,
    status: 'developing',
    comments: [
      {
        author: 'GO-TECH Manager',
        content: 'MPF 自動計算與匯出格式正在開發,感謝支持。',
        createdAt: '2026-07-15',
        isOfficial: true
      }
    ]
  },
  {
    title: '電子糧單自動發送給員工',
    description: '發薪後自動以電郵或員工 APP 發送加密糧單。',
    category: '薪資管理',
    subCategory: '發薪管理',
    author: 'Nancy',
    createdAt: '2026-06-22',
    likes: 83,
    status: 'pending',
    comments: []
  },
  {
    title: '支援時薪、日薪與佣金制薪資方案',
    description: '不同崗位計薪方式不同,希望可設定多套薪資方案並綁定職位。',
    category: '薪資管理',
    subCategory: '薪資方案',
    author: 'Winnie',
    createdAt: '2026-07-02',
    likes: 77,
    status: 'pending',
    comments: []
  },
  {
    title: '獎金與罰款可批量匯入',
    description: '月結時以 Excel 批量匯入銷售獎金與遲到罰款。',
    category: '薪資管理',
    subCategory: '獎金/罰款',
    author: 'IT Peter',
    createdAt: '2026-06-18',
    likes: 32,
    status: 'pending',
    comments: []
  },
  {
    title: '360 度績效評估',
    description: '希望支援上級、同事與自評的多方評分模式。',
    category: '績效培訓',
    subCategory: '績效評估',
    author: 'Vivian',
    createdAt: '2026-07-13',
    likes: 61,
    status: 'pending',
    comments: [{ author: 'Leo_Mars', content: '評分要可以匿名。', createdAt: '2026-07-14' }]
  },
  {
    title: '培訓記錄與證書到期提醒',
    description: '記錄員工培訓與牌照證書,到期前自動提醒續期。',
    category: '績效培訓',
    subCategory: '培訓記錄',
    author: 'Queenie',
    createdAt: '2026-06-28',
    likes: 55,
    status: 'pending',
    comments: []
  },
  {
    title: 'KPI 考核方案支援權重設定',
    description: '考核項目可設定不同權重,系統自動計算總分與等級。',
    category: '績效培訓',
    subCategory: '考核方案',
    author: 'Roy',
    createdAt: '2026-07-07',
    likes: 46,
    status: 'pending',
    comments: []
  },
  {
    title: '人力成本與流失率分析報表',
    description: '希望有部門人力成本佔比、入離職與流失率趨勢圖。',
    category: '報表與通知',
    subCategory: '報表分析',
    author: 'David',
    createdAt: '2026-07-17',
    likes: 90,
    status: 'pending',
    comments: [
      {
        author: 'GO-TECH Manager',
        content: '報表分析模組已進入設計階段,會提供匯出功能。',
        createdAt: '2026-07-18',
        isOfficial: true
      }
    ]
  },
  {
    title: 'WhatsApp 推送考勤與審批通知',
    description: '審批結果與異常打卡即時以 WhatsApp 通知相關同事。',
    category: '報表與通知',
    subCategory: '消息通知',
    author: '阿May',
    createdAt: '2026-07-10',
    likes: 78,
    status: 'pending',
    comments: []
  },
  // ---- shippedHistory ----
  {
    title: '員工電子檔案管理',
    description: '集中儲存員工合約、證件與入職文件並設定查看權限。',
    category: '人事管理',
    subCategory: '電子檔案',
    author: '纸飞机',
    createdAt: '2026-04-02',
    likes: 82,
    status: 'shipped',
    shippedAt: '2026-05-02',
    version: 'v1.2.0',
    comments: []
  },
  {
    title: '組織架構圖檢視',
    description: '以樹狀圖檢視公司部門、職位與匯報關係。',
    category: '組織架構',
    subCategory: '部門管理',
    author: '纸飞机',
    createdAt: '2026-01-01',
    likes: 67,
    status: 'shipped',
    shippedAt: '2026-01-15',
    version: 'v1.0.0',
    comments: []
  },
  {
    title: '手機 APP 打卡上線',
    description: '員工可用手機 APP 完成上下班打卡並查看紀錄。',
    category: '考勤假期',
    subCategory: '打卡管理',
    author: '纸飞机',
    createdAt: '2026-03-20',
    likes: 108,
    status: 'shipped',
    shippedAt: '2026-04-20',
    version: 'v1.8.0',
    comments: []
  },
  {
    title: '假期申請與審批流程',
    description: '支援線上請假申請、主管審批與假期餘額自動扣減。',
    category: '考勤假期',
    subCategory: '審批管理',
    author: '纸飞机',
    createdAt: '2026-03-08',
    likes: 96,
    status: 'shipped',
    shippedAt: '2026-04-20',
    version: 'v1.6.0',
    comments: []
  },
  {
    title: '薪資自動計算與糧單匯出',
    description: '依薪資方案與考勤自動計算薪金,可批量匯出糧單 PDF。',
    category: '薪資管理',
    subCategory: '薪資計算',
    author: '纸飞机',
    createdAt: '2026-03-08',
    likes: 114,
    status: 'shipped',
    shippedAt: '2026-03-18',
    version: 'v1.4.0',
    comments: []
  }
];

// 隨機選取輔助函數
const randomPick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
/* ========== 导入逻辑 ========== */

export async function seedHRFeatures() {
  // 查詢所有用戶
  const allUsers = await db.select().from(platformCustomer);
  const userByName = new Map(allUsers.map(u => [u.custName, u.id]));

  // 查詢所有分類與子分類
  const allCats = await db.select().from(fbCategory);
  const catByName = new Map(allCats.map(c => [c.name, c.id]));

  const allSubs = await db.select().from(fbSubCategory);
  const subByCatIdName = new Map(allSubs.map(s => [`${s.categoryId}:${s.name}`, s.id]));

  const catIds = allCats.map(c => c.id);
  const userIds = allUsers.map(u => u.id);

  // 批次插入 features（無效分類/用戶隨機替換為存在的）
  const featureValues: Omit<NewFbFeature, 'id'>[] = [];
  const featureComments: {
    authorId: number;
    content: string;
    createdAt: Date;
    featureIdx: number;
    isOfficial: boolean;
  }[] = [];

  for (let i = 0; i < features.length; i += 1) {
    const f = features[i];

    // 分類不存在 → 隨機選一個存在的
    let categoryId = catByName.get(f.category);
    if (categoryId === undefined) {
      categoryId = randomPick(catIds);
      console.warn(`Feature "${f.title}" category "${f.category}" not found → replaced with categoryId=${categoryId}`);
    }

    // 作者不存在 → 隨機選一個存在的
    let authorId = userByName.get(f.author);
    if (authorId === undefined) {
      authorId = randomPick(userIds);
      console.warn(`Feature "${f.title}" author "${f.author}" not found → replaced with userId=${authorId}`);
    }

    // 子分類基於（可能被替換後的）categoryId 查找
    const subCategoryId = f.subCategory ? subByCatIdName.get(`${categoryId}:${f.subCategory}`) : undefined;

    featureValues.push({
      authorId,
      categoryId,
      commentCount: f.comments.length,
      createdAt: new Date(f.createdAt),
      description: f.description,
      likeCount: f.likes,
      shippedAt: f.shippedAt ? new Date(f.shippedAt) : null,
      status: f.status,
      subCategoryId: subCategoryId ?? null,
      title: f.title,
      version: f.version ?? null
    });

    // 收集留言（留言作者不存在也隨機替換）
    for (const c of f.comments) {
      let cAuthorId = userByName.get(c.author);
      if (cAuthorId === undefined) {
        cAuthorId = randomPick(userIds);
        console.warn(`Comment author "${c.author}" not found → replaced with userId=${cAuthorId}`);
      }
      featureComments.push({
        authorId: cAuthorId,
        content: c.content,
        createdAt: new Date(c.createdAt),
        featureIdx: i,
        isOfficial: c.isOfficial ?? false
      });
    }
  }

  // 一次性插入所有 features
  const result = await db.insert(fbFeature).values(featureValues);
  const firstId = Number(result[0].insertId);

  // 計算 featureId → featureIdx 映射
  const featureCommentValues = featureComments.map(c => ({
    authorId: c.authorId,
    content: c.content,
    createdAt: c.createdAt,
    featureId: firstId + c.featureIdx,
    isOfficial: c.isOfficial
  }));

  // 一次性插入所有留言
  if (featureCommentValues.length > 0) {
    await db.insert(fbComment).values(featureCommentValues);
  }

  console.log(`Seed features done. (${featureValues.length} features, ${featureCommentValues.length} comments)`);
}
