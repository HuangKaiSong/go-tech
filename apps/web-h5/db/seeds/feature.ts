import { db } from '../index';
import { type NewFbFeature, fbCategory, fbComment, fbFeature, fbSubCategory } from '../scheam';
import { platformCustomer } from '../scheam/external/platform_customer';

/* ========== 数据定义（对应 app/feedback/data.ts 的 seed + shippedHistory） ========== */

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
  // ---- seed ----
  {
    title: '支援批量匯出租客合同 PDF',
    description: '希望在合同列表中可以一次選多個租客,批量匯出成 PDF 壓縮包,方便存檔。',
    category: '租務部',
    subCategory: '報表匯出',
    author: 'CHI',
    createdAt: '2026-06-12',
    likes: 42,
    status: 'developing',
    comments: [
      { author: 'cheung123', content: '非常需要,現在一個個下載太費時了。', createdAt: '2026-06-14' },
      {
        author: 'GO-TECH Manager',
        content: '已收到你的建議,目前排入 Q3 開發,敬請期待。',
        isOfficial: true,
        createdAt: '2026-06-15'
      }
    ]
  },
  {
    title: '跟進單支援手機拍照上傳',
    description: '現場人員在做跟進單時,希望能直接用手機拍照上傳現場照片。',
    category: '場務部',
    subCategory: '現場拍照',
    author: '王大花',
    createdAt: '2026-06-20',
    likes: 68,
    status: 'pending',
    comments: [
      {
        author: 'GO-TECH Manager',
        content: '感謝提議,我們正在評估拍照壓縮與離線暫存方案。',
        isOfficial: true,
        createdAt: '2026-06-22'
      }
    ]
  },
  {
    title: '會計報表增加年度對比圖',
    description: '希望會計 Dashboard 可以看到年對年的收入/支出對比。',
    category: '會計部',
    subCategory: '收支報表',
    author: 'Winnie',
    createdAt: '2026-07-01',
    likes: 15,
    status: 'pending',
    comments: []
  },
  {
    title: '發票可自訂編號規則與抬頭',
    description: '希望發票編號可按公司自訂前綴,並記住常用抬頭資料。',
    category: '會計部',
    subCategory: '發票與收據',
    author: 'Helen_P',
    createdAt: '2026-07-08',
    likes: 37,
    status: 'pending',
    comments: [
      {
        author: 'GO-TECH Manager',
        content: '已納入發票模組的改版範圍,會再與你確認格式需求。',
        isOfficial: true,
        createdAt: '2026-07-09'
      }
    ]
  },
  {
    title: '銀行月結單自動對帳',
    description: '上傳銀行 CSV 後自動比對已收租金,標示差異項目。',
    category: '會計部',
    subCategory: '銀行對帳',
    author: 'Leo_Mars',
    createdAt: '2026-07-11',
    likes: 54,
    status: 'pending',
    comments: []
  },
  {
    title: 'Xero 同步支援多幣別',
    description: '同步至 Xero 時可保留原始幣別與匯率資料。',
    category: '會計部',
    subCategory: 'Xero 整合',
    author: 'Tracy_L',
    createdAt: '2026-06-28',
    likes: 22,
    status: 'pending',
    comments: []
  },
  {
    title: '租客 Portal 支援線上繳費',
    description: '租客希望不用轉數快,直接在 Portal 內用信用卡繳交月租。',
    category: '客服',
    subCategory: '線上繳費',
    author: 'Steve_Jobs',
    createdAt: '2026-07-05',
    likes: 89,
    status: 'pending',
    comments: [{ author: 'Amelia_Hall', content: '+1,租客一直問。', createdAt: '2026-07-06' }]
  },
  {
    title: '合同到期前自動提醒',
    description: '希望系統可在合同到期前 90/60/30 天自動發送提醒給負責同事及租客。',
    category: '租務部',
    subCategory: '合同管理',
    author: 'Scarlett_Baker',
    createdAt: '2026-07-14',
    likes: 76,
    status: 'pending',
    comments: [
      { author: 'Steve_Jobs', content: '提醒最好可以自訂天數。', createdAt: '2026-07-15' },
      {
        author: 'GO-TECH Manager',
        content: '已規劃可自訂提醒節點,預計下個版本推出。',
        isOfficial: true,
        createdAt: '2026-07-16'
      }
    ]
  },
  {
    title: '合同範本支援自訂條款區塊',
    description: '不同物業條款差異大,希望能建立多套範本並插入自訂條款。',
    category: '租務部',
    subCategory: '合同管理',
    author: 'Grace_Turner',
    createdAt: '2026-06-30',
    likes: 41,
    status: 'pending',
    comments: []
  },
  {
    title: '租客資料可上傳身份證明文件',
    description: '希望租客檔案內可附上身份證/商業登記掃描件,並設定查看權限。',
    category: '租務部',
    subCategory: '租客資料',
    author: 'Sofia_Hall',
    createdAt: '2026-07-03',
    likes: 33,
    status: 'pending',
    comments: [{ author: '李小姐', content: '要注意個人資料存取權限。', createdAt: '2026-07-04' }]
  },
  {
    title: '租客標籤與黑名單管理',
    description: '可為租客加上標籤(如準時繳租/多次逾期),並支援黑名單提示。',
    category: '租務部',
    subCategory: '租客資料',
    author: 'Layla_Evans',
    createdAt: '2026-06-18',
    likes: 58,
    status: 'developing',
    comments: []
  },
  {
    title: '續租一鍵沿用舊合同條件',
    description: '續租時自動帶入上一份合同資料,只需修改租金與年期。',
    category: '租務部',
    subCategory: '續租與退租',
    author: 'David_Nelson',
    createdAt: '2026-07-09',
    likes: 62,
    status: 'developing',
    comments: [
      {
        author: 'GO-TECH Manager',
        content: '此功能已在開發中,預計 8 月上線。',
        isOfficial: true,
        createdAt: '2026-07-10'
      }
    ]
  },
  {
    title: '退租流程加入按金結算表',
    description: '退租時自動計算按金扣減項目並輸出結算表給租客簽署。',
    category: '租務部',
    subCategory: '續租與退租',
    author: 'Emily_Clark',
    createdAt: '2026-06-25',
    likes: 47,
    status: 'pending',
    comments: []
  },
  {
    title: '報表可自訂欄位並儲存範本',
    description: '匯出 Excel 時可自選欄位,並把常用組合存成報表範本。',
    category: '租務部',
    subCategory: '報表匯出',
    author: 'Christopher_Peterson',
    createdAt: '2026-07-12',
    likes: 29,
    status: 'pending',
    comments: []
  },
  {
    title: '跟進單支援語音輸入備註',
    description: '師傅在現場雙手忙碌,希望可用語音直接輸入跟進內容。',
    category: '場務部',
    subCategory: '跟進單',
    author: '強哥',
    createdAt: '2026-07-07',
    likes: 51,
    status: 'pending',
    comments: [{ author: '黃師傅', content: '非常實用,現場打字很不方便。', createdAt: '2026-07-08' }]
  },
  {
    title: '跟進單可指派多位負責人',
    description: '大型維修需要多人協作,希望一張單可指派多人並各自更新進度。',
    category: '場務部',
    subCategory: '跟進單',
    author: 'Peter',
    createdAt: '2026-06-22',
    likes: 38,
    status: 'pending',
    comments: []
  },
  {
    title: '現場照片自動加上時間與地點水印',
    description: '拍照上傳時自動加註拍攝時間與地址,方便日後舉證。',
    category: '場務部',
    subCategory: '現場拍照',
    author: '阿龍',
    createdAt: '2026-07-02',
    likes: 44,
    status: 'pending',
    comments: []
  },
  {
    title: '維修排程日曆檢視',
    description: '希望有月曆/週曆檢視,一眼看出每位師傅的工作安排。',
    category: '場務部',
    subCategory: '維修排程',
    author: 'Cathy',
    createdAt: '2026-07-13',
    likes: 72,
    status: 'pending',
    comments: [
      {
        author: 'GO-TECH Manager',
        content: '排程日曆已進入設計階段,會支援拖拉改期。',
        isOfficial: true,
        createdAt: '2026-07-14'
      }
    ]
  },
  {
    title: '維修供應商評分與紀錄',
    description: '記錄每個供應商的完成時間與評分,方便下次派單參考。',
    category: '場務部',
    subCategory: '維修排程',
    author: 'Roy',
    createdAt: '2026-06-16',
    likes: 26,
    status: 'pending',
    comments: []
  },
  {
    title: '手機版支援離線暫存',
    description: '地庫或村屋常常無訊號,希望可離線填寫,回到網路後自動同步。',
    category: '場務部',
    subCategory: '手機版操作',
    author: '阿俊',
    createdAt: '2026-07-15',
    likes: 83,
    status: 'developing',
    comments: [
      { author: '黃師傅', content: '這個最重要!', createdAt: '2026-07-16' },
      {
        author: 'GO-TECH Manager',
        content: '離線暫存已列為本季重點,正在開發中。',
        isOfficial: true,
        createdAt: '2026-07-17'
      }
    ]
  },
  {
    title: '收據支援分期付款紀錄',
    description: '租客分期繳交按金時,希望能逐筆開立收據並自動累計。',
    category: '會計部',
    subCategory: '發票與收據',
    author: 'Nancy',
    createdAt: '2026-07-06',
    likes: 31,
    status: 'pending',
    comments: []
  },
  {
    title: '現金流預測報表',
    description: '根據合同租金與到期日,預測未來 12 個月的現金流。',
    category: '會計部',
    subCategory: '收支報表',
    author: 'David',
    createdAt: '2026-07-10',
    likes: 66,
    status: 'pending',
    comments: [{ author: 'Winnie', content: '老闆最想看這個。', createdAt: '2026-07-11' }]
  },
  {
    title: '對帳差異可加註說明',
    description: '對帳結果有差異時,可直接在該筆加註原因並標示已處理。',
    category: '會計部',
    subCategory: '銀行對帳',
    author: 'Elaine',
    createdAt: '2026-06-27',
    likes: 19,
    status: 'pending',
    comments: []
  },
  {
    title: 'Xero 同步失敗自動重試與通知',
    description: '同步失敗時系統自動重試三次,仍失敗則發郵件通知會計。',
    category: '會計部',
    subCategory: 'Xero 整合',
    author: 'Karen',
    createdAt: '2026-07-04',
    likes: 35,
    status: 'pending',
    comments: []
  },
  {
    title: '租客 Portal 支援報修上傳照片',
    description: '租客可在 Portal 直接提交報修並附上照片,自動生成跟進單。',
    category: '客服',
    subCategory: '租客 Portal',
    author: 'Amy',
    createdAt: '2026-07-11',
    likes: 91,
    status: 'developing',
    comments: [
      { author: 'Tommy', content: '省下好多電話溝通。', createdAt: '2026-07-12' },
      { author: 'GO-TECH Manager', content: '已與場務模組打通,開發中。', isOfficial: true, createdAt: '2026-07-13' }
    ]
  },
  {
    title: '租客 Portal 多語言(中/英)切換',
    description: '外籍租客較多,希望 Portal 可切換繁中與英文介面。',
    category: '客服',
    subCategory: '租客 Portal',
    author: 'Vivian',
    createdAt: '2026-06-19',
    likes: 48,
    status: 'pending',
    comments: []
  },
  {
    title: '繳費成功自動發送電子收據',
    description: '線上繳費完成後,系統自動寄出 PDF 收據給租客。',
    category: '客服',
    subCategory: '線上繳費',
    author: 'Jason',
    createdAt: '2026-07-08',
    likes: 57,
    status: 'pending',
    comments: []
  },
  {
    title: 'WhatsApp 通知渠道',
    description: '除了電郵及 SMS,希望可透過 WhatsApp 發送催租與維修通知。',
    category: '客服',
    subCategory: '通知與提醒',
    author: '阿May',
    createdAt: '2026-07-16',
    likes: 104,
    status: 'pending',
    comments: [
      { author: 'Amy', content: '香港租客基本只看 WhatsApp。', createdAt: '2026-07-17' },
      {
        author: 'GO-TECH Manager',
        content: '正在評估官方 API 成本,感謝大家投票。',
        isOfficial: true,
        createdAt: '2026-07-18'
      }
    ]
  },
  {
    title: '客服工單 SLA 計時與逾時提示',
    description: '工單依優先級設定回覆時限,逾時自動升級並提示主管。',
    category: '客服',
    subCategory: '客服工單',
    author: 'Queenie',
    createdAt: '2026-06-24',
    likes: 27,
    status: 'pending',
    comments: []
  },
  {
    title: '自訂角色權限至欄位層級',
    description: '希望可細緻設定某角色只能看到合同金額以外的欄位。',
    category: '系統設定',
    subCategory: '帳戶與權限',
    author: 'IT Peter',
    createdAt: '2026-07-05',
    likes: 39,
    status: 'pending',
    comments: []
  },
  {
    title: '多公司資料統一總覽儀表板',
    description: '管理多間公司時,希望有一個總覽頁彙總所有公司的關鍵指標。',
    category: '系統設定',
    subCategory: '多公司管理',
    author: '陳生',
    createdAt: '2026-07-14',
    likes: 69,
    status: 'pending',
    comments: [{ author: 'Fiona', content: '集團客戶必備。', createdAt: '2026-07-15' }]
  },
  {
    title: '操作紀錄(Audit Log)查詢',
    description: '可查詢誰在何時修改了哪筆資料,方便內部稽核。',
    category: '系統設定',
    subCategory: '通用設定',
    author: 'Alan',
    createdAt: '2026-06-21',
    likes: 45,
    status: 'developing',
    comments: []
  },
  {
    title: 'Excel 批量匯入租客與合同',
    description: '新客戶上線時可用範本 Excel 一次匯入全部資料。',
    category: '系統設定',
    subCategory: '資料匯入匯出',
    author: 'Kelly',
    createdAt: '2026-07-01',
    likes: 74,
    status: 'developing',
    comments: [
      {
        author: 'GO-TECH Manager',
        content: '匯入範本已完成,正在做錯誤檢查介面。',
        isOfficial: true,
        createdAt: '2026-07-02'
      }
    ]
  },
  {
    title: '介面支援深色模式',
    description: '夜晚使用系統時希望有深色模式減少眼睛疲勞。',
    category: '其他',
    subCategory: '使用體驗',
    author: 'Zoe',
    createdAt: '2026-07-09',
    likes: 53,
    status: 'pending',
    comments: []
  },
  {
    title: '列表載入速度優化',
    description: '合同超過 2000 筆時列表載入較慢,希望加入分頁或虛擬滾動。',
    category: '其他',
    subCategory: '效能',
    author: 'Marco',
    createdAt: '2026-06-29',
    likes: 61,
    status: 'developing',
    comments: [
      {
        author: 'GO-TECH Manager',
        content: '已完成後端索引優化,前端虛擬滾動開發中。',
        isOfficial: true,
        createdAt: '2026-06-30'
      }
    ]
  },
  {
    title: '提供 Open API 與 Webhook',
    description: '希望能將資料串接到公司自家的 BI 系統。',
    category: '其他',
    subCategory: '其他建議',
    author: 'Officer_B',
    createdAt: '2026-07-17',
    likes: 36,
    status: 'pending',
    comments: []
  },
  // ---- shippedHistory ----
  {
    title: '多公司帳戶切換',
    description: '使用者可在同一登入下切換管理多間公司。',
    category: '系統設定',
    subCategory: '多公司管理',
    author: '纸飞机',
    createdAt: '2026-04-10',
    likes: 120,
    status: 'shipped',
    shippedAt: '2026-05-28',
    version: 'v2.32.0',
    comments: []
  },
  {
    title: '電子授權書簽名',
    description: '入伙/退租授權書支援電子簽名。',
    category: '租務部',
    subCategory: '合同管理',
    author: '纸飞机',
    createdAt: '2026-03-15',
    likes: 95,
    status: 'shipped',
    shippedAt: '2026-05-10',
    version: 'v2.30.0',
    comments: []
  },
  {
    title: '使用者角色與邀請系統',
    description: '支援 Token 邀請、席位限制、角色權限管理。',
    category: '系統設定',
    subCategory: '帳戶與權限',
    author: '纸飞机',
    createdAt: '2026-02-20',
    likes: 78,
    status: 'shipped',
    shippedAt: '2026-04-18',
    version: 'v2.28.0',
    comments: []
  },
  {
    title: '發票 PDF 一鍵下載',
    description: '確認付款後即可下載正式發票 PDF。',
    category: '會計部',
    subCategory: '發票與收據',
    author: '纸飞机',
    createdAt: '2026-02-02',
    likes: 64,
    status: 'shipped',
    shippedAt: '2026-03-20',
    version: 'v2.26.0',
    comments: []
  },
  {
    title: '跟進單手機版介面',
    description: '場務人員可用手機直接開單、更新進度並上傳照片。',
    category: '場務部',
    subCategory: '手機版操作',
    author: '纸飞机',
    createdAt: '2026-01-18',
    likes: 88,
    status: 'shipped',
    shippedAt: '2026-03-05',
    version: 'v2.24.0',
    comments: []
  },
  {
    title: 'Xero 會計模組整合',
    description: '收支資料可一鍵同步至 Xero 帳套。',
    category: '會計部',
    subCategory: 'Xero 整合',
    author: '纸飞机',
    createdAt: '2025-12-08',
    likes: 71,
    status: 'shipped',
    shippedAt: '2026-02-14',
    version: 'v2.22.0',
    comments: []
  },
  {
    title: '租客 Portal 上線',
    description: '租客可自助查看合同、繳費紀錄與通知。',
    category: '客服',
    subCategory: '租客 Portal',
    author: '纸飞机',
    createdAt: '2025-11-20',
    likes: 132,
    status: 'shipped',
    shippedAt: '2026-01-22',
    version: 'v2.20.0',
    comments: []
  },
  {
    title: '續租一鍵生成新合同',
    description: '由現有合同快速產生續租合同並沿用條款。',
    category: '租務部',
    subCategory: '續租與退租',
    author: '纸飞机',
    createdAt: '2025-11-02',
    likes: 59,
    status: 'shipped',
    shippedAt: '2025-12-30',
    version: 'v2.18.0',
    comments: []
  },
  {
    title: '自訂報表欄位匯出 Excel',
    description: '報表匯出可選擇欄位並保留篩選條件。',
    category: '租務部',
    subCategory: '報表匯出',
    author: '王大花',
    createdAt: '2025-10-12',
    likes: 43,
    status: 'shipped',
    shippedAt: '2025-12-05',
    version: 'v2.16.0',
    comments: []
  },
  {
    title: '系統操作紀錄基礎版',
    description: '記錄登入與關鍵資料異動紀錄。',
    category: '系統設定',
    subCategory: '通用設定',
    author: '纸飞机',
    createdAt: '2025-09-25',
    likes: 37,
    status: 'shipped',
    shippedAt: '2025-11-10',
    version: 'v2.14.0',
    comments: []
  }
];

// 隨機選取輔助函數
const randomPick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
/* ========== 导入逻辑 ========== */

export async function seedFeatures() {
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
  const featureComments: { authorId: number; content: string; featureIdx: number; isOfficial: boolean }[] = [];

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
    featureId: firstId + c.featureIdx,
    isOfficial: c.isOfficial
  }));

  // 一次性插入所有留言
  if (featureCommentValues.length > 0) {
    await db.insert(fbComment).values(featureCommentValues);
  }

  console.log(`Seed features done. (${featureValues.length} features, ${featureCommentValues.length} comments)`);
}
