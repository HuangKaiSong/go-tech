import { Building2, Calculator, Headphones, SlidersHorizontal, Sparkles, Wrench } from 'lucide-react';

export const CURRENT_USER = '王小明';
export const STORAGE_KEY = 'feedback_features_v5';
export const SERIF = { fontFamily: "'Instrument Serif', serif" };

export const categoryMeta = [
  {
    name: '租務部',
    desc: '合同、租客、續租與租務流程相關的想法',
    icon: Building2,
    subs: ['合同管理', '租客資料', '續租與退租', '報表匯出']
  },
  {
    name: '場務部',
    desc: '跟進單、現場維修、巡查與場地管理',
    icon: Wrench,
    subs: ['跟進單', '現場拍照', '維修排程', '手機版操作']
  },
  {
    name: '會計部',
    desc: '收支報表、發票、對帳與會計整合',
    icon: Calculator,
    subs: ['發票與收據', '收支報表', '銀行對帳', 'Xero 整合']
  },
  {
    name: '客服',
    desc: '租客 Portal、通知、客服工單與溝通',
    icon: Headphones,
    subs: ['租客 Portal', '線上繳費', '通知與提醒', '客服工單']
  },
  {
    name: '系統設定',
    desc: '帳戶、權限、多公司與系統偏好設定',
    icon: SlidersHorizontal,
    subs: ['帳戶與權限', '多公司管理', '通用設定', '資料匯入匯出']
  },
  {
    name: '其他',
    desc: '其他任何你想到的產品建議',
    icon: Sparkles,
    subs: ['使用體驗', '效能', '其他建議']
  }
];

export const categories = categoryMeta.map(c => c.name);
export const subsOf = (cat: string | null) => categoryMeta.find(c => c.name === cat)?.subs ?? [];

export const statusMeta: Record<Status, { badge: string; label: string }> = {
  pending: { label: '待評估', badge: 'bg-stone-100 text-stone-600 border-stone-200' },
  developing: { label: '開發中', badge: 'bg-amber-50 text-amber-700 border-amber-100' },
  shipped: { label: '已完成', badge: 'bg-emerald-50 text-emerald-700 border-emerald-100' }
};
export const seed: Feature[] = [
  {
    id: 'f1',
    title: '支援批量匯出租客合同 PDF',
    description: '希望在合同列表中可以一次選多個租客,批量匯出成 PDF 壓縮包,方便存檔。',
    category: '租務部',
    subCategory: '報表匯出',
    author: '陳經理',
    createdAt: '2026-06-12',
    likes: 42,
    likedBy: [],
    comments: [
      { id: 'c1', author: '李小姐', content: '非常需要,現在一個個下載太費時了。', createdAt: '2026-06-14' },
      {
        id: 'c1b',
        author: 'GO-TECH Manager',
        isOfficial: true,
        content: '已收到你的建議,目前排入 Q3 開發,敬請期待。',
        createdAt: '2026-06-15'
      }
    ],
    status: 'developing'
  },
  {
    id: 'f2',
    title: '跟進單支援手機拍照上傳',
    description: '現場人員在做跟進單時,希望能直接用手機拍照上傳現場照片。',
    category: '場務部',
    subCategory: '現場拍照',
    author: '黃師傅',
    createdAt: '2026-06-20',
    likes: 68,
    likedBy: [],
    comments: [
      {
        id: 'c2a',
        author: 'GO-TECH Manager',
        isOfficial: true,
        content: '感謝提議,我們正在評估拍照壓縮與離線暫存方案。',
        createdAt: '2026-06-22'
      }
    ],
    status: 'pending'
  },
  {
    id: 'f3',
    title: '會計報表增加年度對比圖',
    description: '希望會計 Dashboard 可以看到年對年的收入/支出對比。',
    category: '會計部',
    subCategory: '收支報表',
    author: 'Winnie',
    createdAt: '2026-07-01',
    likes: 15,
    likedBy: [],
    comments: [],
    status: 'pending'
  },
  {
    id: 'f5',
    title: '發票可自訂編號規則與抬頭',
    description: '希望發票編號可按公司自訂前綴,並記住常用抬頭資料。',
    category: '會計部',
    subCategory: '發票與收據',
    author: '李會計',
    createdAt: '2026-07-08',
    likes: 37,
    likedBy: [],
    comments: [
      {
        id: 'c5',
        author: 'GO-TECH Manager',
        isOfficial: true,
        content: '已納入發票模組的改版範圍,會再與你確認格式需求。',
        createdAt: '2026-07-09'
      }
    ],
    status: 'pending'
  },
  {
    id: 'f6',
    title: '銀行月結單自動對帳',
    description: '上傳銀行 CSV 後自動比對已收租金,標示差異項目。',
    category: '會計部',
    subCategory: '銀行對帳',
    author: '張生',
    createdAt: '2026-07-11',
    likes: 54,
    likedBy: [],
    comments: [],
    status: 'pending'
  },
  {
    id: 'f7',
    title: 'Xero 同步支援多幣別',
    description: '同步至 Xero 時可保留原始幣別與匯率資料。',
    category: '會計部',
    subCategory: 'Xero 整合',
    author: 'Karen',
    createdAt: '2026-06-28',
    likes: 22,
    likedBy: [],
    comments: [],
    status: 'pending'
  },
  {
    id: 'f4',
    title: '租客 Portal 支援線上繳費',
    description: '租客希望不用轉數快,直接在 Portal 內用信用卡繳交月租。',
    category: '客服',
    subCategory: '線上繳費',
    author: 'Tommy',
    createdAt: '2026-07-05',
    likes: 89,
    likedBy: [],
    comments: [{ id: 'c4', author: 'Amy', content: '+1,租客一直問。', createdAt: '2026-07-06' }],
    status: 'pending'
  },
  // ---- 租務部 ----
  {
    id: 'f8',
    title: '合同到期前自動提醒',
    description: '希望系統可在合同到期前 90/60/30 天自動發送提醒給負責同事及租客。',
    category: '租務部',
    subCategory: '合同管理',
    author: 'Fiona',
    createdAt: '2026-07-14',
    likes: 76,
    likedBy: [],
    comments: [
      { id: 'c8a', author: '陳經理', content: '提醒最好可以自訂天數。', createdAt: '2026-07-15' },
      {
        id: 'c8b',
        author: 'GO-TECH Manager',
        isOfficial: true,
        content: '已規劃可自訂提醒節點,預計下個版本推出。',
        createdAt: '2026-07-16'
      }
    ],
    status: 'pending'
  },
  {
    id: 'f9',
    title: '合同範本支援自訂條款區塊',
    description: '不同物業條款差異大,希望能建立多套範本並插入自訂條款。',
    category: '租務部',
    subCategory: '合同管理',
    author: 'Ken',
    createdAt: '2026-06-30',
    likes: 41,
    likedBy: [],
    comments: [],
    status: 'pending'
  },
  {
    id: 'f10',
    title: '租客資料可上傳身份證明文件',
    description: '希望租客檔案內可附上身份證/商業登記掃描件,並設定查看權限。',
    category: '租務部',
    subCategory: '租客資料',
    author: 'Mandy',
    createdAt: '2026-07-03',
    likes: 33,
    likedBy: [],
    comments: [{ id: 'c10', author: '李小姐', content: '要注意個人資料存取權限。', createdAt: '2026-07-04' }],
    status: 'pending'
  },
  {
    id: 'f11',
    title: '租客標籤與黑名單管理',
    description: '可為租客加上標籤(如準時繳租/多次逾期),並支援黑名單提示。',
    category: '租務部',
    subCategory: '租客資料',
    author: '阿邦',
    createdAt: '2026-06-18',
    likes: 58,
    likedBy: [],
    comments: [],
    status: 'developing'
  },
  {
    id: 'f12',
    title: '續租一鍵沿用舊合同條件',
    description: '續租時自動帶入上一份合同資料,只需修改租金與年期。',
    category: '租務部',
    subCategory: '續租與退租',
    author: 'Joyce',
    createdAt: '2026-07-09',
    likes: 62,
    likedBy: [],
    comments: [
      {
        id: 'c12',
        author: 'GO-TECH Manager',
        isOfficial: true,
        content: '此功能已在開發中,預計 8 月上線。',
        createdAt: '2026-07-10'
      }
    ],
    status: 'developing'
  },
  {
    id: 'f13',
    title: '退租流程加入按金結算表',
    description: '退租時自動計算按金扣減項目並輸出結算表給租客簽署。',
    category: '租務部',
    subCategory: '續租與退租',
    author: 'Sam',
    createdAt: '2026-06-25',
    likes: 47,
    likedBy: [],
    comments: [],
    status: 'pending'
  },
  {
    id: 'f14',
    title: '報表可自訂欄位並儲存範本',
    description: '匯出 Excel 時可自選欄位,並把常用組合存成報表範本。',
    category: '租務部',
    subCategory: '報表匯出',
    author: 'Ivy',
    createdAt: '2026-07-12',
    likes: 29,
    likedBy: [],
    comments: [],
    status: 'pending'
  },
  // ---- 場務部 ----
  {
    id: 'f15',
    title: '跟進單支援語音輸入備註',
    description: '師傅在現場雙手忙碌,希望可用語音直接輸入跟進內容。',
    category: '場務部',
    subCategory: '跟進單',
    author: '強哥',
    createdAt: '2026-07-07',
    likes: 51,
    likedBy: [],
    comments: [{ id: 'c15', author: '黃師傅', content: '非常實用,現場打字很不方便。', createdAt: '2026-07-08' }],
    status: 'pending'
  },
  {
    id: 'f16',
    title: '跟進單可指派多位負責人',
    description: '大型維修需要多人協作,希望一張單可指派多人並各自更新進度。',
    category: '場務部',
    subCategory: '跟進單',
    author: 'Peter',
    createdAt: '2026-06-22',
    likes: 38,
    likedBy: [],
    comments: [],
    status: 'pending'
  },
  {
    id: 'f17',
    title: '現場照片自動加上時間與地點水印',
    description: '拍照上傳時自動加註拍攝時間與地址,方便日後舉證。',
    category: '場務部',
    subCategory: '現場拍照',
    author: '阿龍',
    createdAt: '2026-07-02',
    likes: 44,
    likedBy: [],
    comments: [],
    status: 'pending'
  },
  {
    id: 'f18',
    title: '維修排程日曆檢視',
    description: '希望有月曆/週曆檢視,一眼看出每位師傅的工作安排。',
    category: '場務部',
    subCategory: '維修排程',
    author: 'Cathy',
    createdAt: '2026-07-13',
    likes: 72,
    likedBy: [],
    comments: [
      {
        id: 'c18',
        author: 'GO-TECH Manager',
        isOfficial: true,
        content: '排程日曆已進入設計階段,會支援拖拉改期。',
        createdAt: '2026-07-14'
      }
    ],
    status: 'pending'
  },
  {
    id: 'f19',
    title: '維修供應商評分與紀錄',
    description: '記錄每個供應商的完成時間與評分,方便下次派單參考。',
    category: '場務部',
    subCategory: '維修排程',
    author: 'Roy',
    createdAt: '2026-06-16',
    likes: 26,
    likedBy: [],
    comments: [],
    status: 'pending'
  },
  {
    id: 'f20',
    title: '手機版支援離線暫存',
    description: '地庫或村屋常常無訊號,希望可離線填寫,回到網路後自動同步。',
    category: '場務部',
    subCategory: '手機版操作',
    author: '阿俊',
    createdAt: '2026-07-15',
    likes: 83,
    likedBy: [],
    comments: [
      { id: 'c20a', author: '黃師傅', content: '這個最重要!', createdAt: '2026-07-16' },
      {
        id: 'c20b',
        author: 'GO-TECH Manager',
        isOfficial: true,
        content: '離線暫存已列為本季重點,正在開發中。',
        createdAt: '2026-07-17'
      }
    ],
    status: 'developing'
  },
  // ---- 會計部 ----
  {
    id: 'f21',
    title: '收據支援分期付款紀錄',
    description: '租客分期繳交按金時,希望能逐筆開立收據並自動累計。',
    category: '會計部',
    subCategory: '發票與收據',
    author: 'Nancy',
    createdAt: '2026-07-06',
    likes: 31,
    likedBy: [],
    comments: [],
    status: 'pending'
  },
  {
    id: 'f22',
    title: '現金流預測報表',
    description: '根據合同租金與到期日,預測未來 12 個月的現金流。',
    category: '會計部',
    subCategory: '收支報表',
    author: 'David',
    createdAt: '2026-07-10',
    likes: 66,
    likedBy: [],
    comments: [{ id: 'c22', author: 'Winnie', content: '老闆最想看這個。', createdAt: '2026-07-11' }],
    status: 'pending'
  },
  {
    id: 'f23',
    title: '對帳差異可加註說明',
    description: '對帳結果有差異時,可直接在該筆加註原因並標示已處理。',
    category: '會計部',
    subCategory: '銀行對帳',
    author: 'Elaine',
    createdAt: '2026-06-27',
    likes: 19,
    likedBy: [],
    comments: [],
    status: 'pending'
  },
  {
    id: 'f24',
    title: 'Xero 同步失敗自動重試與通知',
    description: '同步失敗時系統自動重試三次,仍失敗則發郵件通知會計。',
    category: '會計部',
    subCategory: 'Xero 整合',
    author: 'Karen',
    createdAt: '2026-07-04',
    likes: 35,
    likedBy: [],
    comments: [],
    status: 'pending'
  },
  // ---- 客服 ----
  {
    id: 'f25',
    title: '租客 Portal 支援報修上傳照片',
    description: '租客可在 Portal 直接提交報修並附上照片,自動生成跟進單。',
    category: '客服',
    subCategory: '租客 Portal',
    author: 'Amy',
    createdAt: '2026-07-11',
    likes: 91,
    likedBy: [],
    comments: [
      { id: 'c25a', author: 'Tommy', content: '省下好多電話溝通。', createdAt: '2026-07-12' },
      {
        id: 'c25b',
        author: 'GO-TECH Manager',
        isOfficial: true,
        content: '已與場務模組打通,開發中。',
        createdAt: '2026-07-13'
      }
    ],
    status: 'developing'
  },
  {
    id: 'f26',
    title: '租客 Portal 多語言(中/英)切換',
    description: '外籍租客較多,希望 Portal 可切換繁中與英文介面。',
    category: '客服',
    subCategory: '租客 Portal',
    author: 'Vivian',
    createdAt: '2026-06-19',
    likes: 48,
    likedBy: [],
    comments: [],
    status: 'pending'
  },
  {
    id: 'f27',
    title: '繳費成功自動發送電子收據',
    description: '線上繳費完成後,系統自動寄出 PDF 收據給租客。',
    category: '客服',
    subCategory: '線上繳費',
    author: 'Jason',
    createdAt: '2026-07-08',
    likes: 57,
    likedBy: [],
    comments: [],
    status: 'pending'
  },
  {
    id: 'f28',
    title: 'WhatsApp 通知渠道',
    description: '除了電郵及 SMS,希望可透過 WhatsApp 發送催租與維修通知。',
    category: '客服',
    subCategory: '通知與提醒',
    author: '阿May',
    createdAt: '2026-07-16',
    likes: 104,
    likedBy: [],
    comments: [
      { id: 'c28a', author: 'Amy', content: '香港租客基本只看 WhatsApp。', createdAt: '2026-07-17' },
      {
        id: 'c28b',
        author: 'GO-TECH Manager',
        isOfficial: true,
        content: '正在評估官方 API 成本,感謝大家投票。',
        createdAt: '2026-07-18'
      }
    ],
    status: 'pending'
  },
  {
    id: 'f29',
    title: '客服工單 SLA 計時與逾時提示',
    description: '工單依優先級設定回覆時限,逾時自動升級並提示主管。',
    category: '客服',
    subCategory: '客服工單',
    author: 'Queenie',
    createdAt: '2026-06-24',
    likes: 27,
    likedBy: [],
    comments: [],
    status: 'pending'
  },
  // ---- 系統設定 ----
  {
    id: 'f30',
    title: '自訂角色權限至欄位層級',
    description: '希望可細緻設定某角色只能看到合同金額以外的欄位。',
    category: '系統設定',
    subCategory: '帳戶與權限',
    author: 'IT Peter',
    createdAt: '2026-07-05',
    likes: 39,
    likedBy: [],
    comments: [],
    status: 'pending'
  },
  {
    id: 'f31',
    title: '多公司資料統一總覽儀表板',
    description: '管理多間公司時,希望有一個總覽頁彙總所有公司的關鍵指標。',
    category: '系統設定',
    subCategory: '多公司管理',
    author: '陳生',
    createdAt: '2026-07-14',
    likes: 69,
    likedBy: [],
    comments: [{ id: 'c31', author: 'Fiona', content: '集團客戶必備。', createdAt: '2026-07-15' }],
    status: 'pending'
  },
  {
    id: 'f32',
    title: '操作紀錄(Audit Log)查詢',
    description: '可查詢誰在何時修改了哪筆資料,方便內部稽核。',
    category: '系統設定',
    subCategory: '通用設定',
    author: 'Alan',
    createdAt: '2026-06-21',
    likes: 45,
    likedBy: [],
    comments: [],
    status: 'developing'
  },
  {
    id: 'f33',
    title: 'Excel 批量匯入租客與合同',
    description: '新客戶上線時可用範本 Excel 一次匯入全部資料。',
    category: '系統設定',
    subCategory: '資料匯入匯出',
    author: 'Kelly',
    createdAt: '2026-07-01',
    likes: 74,
    likedBy: [],
    comments: [
      {
        id: 'c33',
        author: 'GO-TECH Manager',
        isOfficial: true,
        content: '匯入範本已完成,正在做錯誤檢查介面。',
        createdAt: '2026-07-02'
      }
    ],
    status: 'developing'
  },
  // ---- 其他 ----
  {
    id: 'f34',
    title: '介面支援深色模式',
    description: '夜晚使用系統時希望有深色模式減少眼睛疲勞。',
    category: '其他',
    subCategory: '使用體驗',
    author: 'Zoe',
    createdAt: '2026-07-09',
    likes: 53,
    likedBy: [],
    comments: [],
    status: 'pending'
  },
  {
    id: 'f35',
    title: '列表載入速度優化',
    description: '合同超過 2000 筆時列表載入較慢,希望加入分頁或虛擬滾動。',
    category: '其他',
    subCategory: '效能',
    author: 'Marco',
    createdAt: '2026-06-29',
    likes: 61,
    likedBy: [],
    comments: [
      {
        id: 'c35',
        author: 'GO-TECH Manager',
        isOfficial: true,
        content: '已完成後端索引優化,前端虛擬滾動開發中。',
        createdAt: '2026-06-30'
      }
    ],
    status: 'developing'
  },
  {
    id: 'f36',
    title: '提供 Open API 與 Webhook',
    description: '希望能將資料串接到公司自家的 BI 系統。',
    category: '其他',
    subCategory: '其他建議',
    author: 'Wilson',
    createdAt: '2026-07-17',
    likes: 36,
    likedBy: [],
    comments: [],
    status: 'pending'
  }
];

export const shippedHistory: Feature[] = [
  {
    id: 'h1',
    title: '多公司帳戶切換',
    description: '使用者可在同一登入下切換管理多間公司。',
    category: '系統設定',
    subCategory: '多公司管理',
    author: '產品團隊',
    createdAt: '2026-04-10',
    likes: 120,
    likedBy: [],
    comments: [],
    status: 'shipped',
    shippedAt: '2026-05-28',
    version: 'v2.32.0'
  },
  {
    id: 'h2',
    title: '電子授權書簽名',
    description: '入伙/退租授權書支援電子簽名。',
    category: '租務部',
    subCategory: '合同管理',
    author: '產品團隊',
    createdAt: '2026-03-15',
    likes: 95,
    likedBy: [],
    comments: [],
    status: 'shipped',
    shippedAt: '2026-05-10',
    version: 'v2.30.0'
  },
  {
    id: 'h3',
    title: '使用者角色與邀請系統',
    description: '支援 Token 邀請、席位限制、角色權限管理。',
    category: '系統設定',
    subCategory: '帳戶與權限',
    author: '產品團隊',
    createdAt: '2026-02-20',
    likes: 78,
    likedBy: [],
    comments: [],
    status: 'shipped',
    shippedAt: '2026-04-18',
    version: 'v2.28.0'
  },
  {
    id: 'h4',
    title: '發票 PDF 一鍵下載',
    description: '確認付款後即可下載正式發票 PDF。',
    category: '會計部',
    subCategory: '發票與收據',
    author: '產品團隊',
    createdAt: '2026-02-02',
    likes: 64,
    likedBy: [],
    comments: [],
    status: 'shipped',
    shippedAt: '2026-03-20',
    version: 'v2.26.0'
  },
  {
    id: 'h5',
    title: '跟進單手機版介面',
    description: '場務人員可用手機直接開單、更新進度並上傳照片。',
    category: '場務部',
    subCategory: '手機版操作',
    author: '產品團隊',
    createdAt: '2026-01-18',
    likes: 88,
    likedBy: [],
    comments: [],
    status: 'shipped',
    shippedAt: '2026-03-05',
    version: 'v2.24.0'
  },
  {
    id: 'h6',
    title: 'Xero 會計模組整合',
    description: '收支資料可一鍵同步至 Xero 帳套。',
    category: '會計部',
    subCategory: 'Xero 整合',
    author: '產品團隊',
    createdAt: '2025-12-08',
    likes: 71,
    likedBy: [],
    comments: [],
    status: 'shipped',
    shippedAt: '2026-02-14',
    version: 'v2.22.0'
  },
  {
    id: 'h7',
    title: '租客 Portal 上線',
    description: '租客可自助查看合同、繳費紀錄與通知。',
    category: '客服',
    subCategory: '租客 Portal',
    author: '產品團隊',
    createdAt: '2025-11-20',
    likes: 132,
    likedBy: [],
    comments: [],
    status: 'shipped',
    shippedAt: '2026-01-22',
    version: 'v2.20.0'
  },
  {
    id: 'h8',
    title: '續租一鍵生成新合同',
    description: '由現有合同快速產生續租合同並沿用條款。',
    category: '租務部',
    subCategory: '續租與退租',
    author: '產品團隊',
    createdAt: '2025-11-02',
    likes: 59,
    likedBy: [],
    comments: [],
    status: 'shipped',
    shippedAt: '2025-12-30',
    version: 'v2.18.0'
  },
  {
    id: 'h9',
    title: '自訂報表欄位匯出 Excel',
    description: '報表匯出可選擇欄位並保留篩選條件。',
    category: '租務部',
    subCategory: '報表匯出',
    author: '產品團隊',
    createdAt: '2025-10-12',
    likes: 43,
    likedBy: [],
    comments: [],
    status: 'shipped',
    shippedAt: '2025-12-05',
    version: 'v2.16.0'
  },
  {
    id: 'h10',
    title: '系統操作紀錄基礎版',
    description: '記錄登入與關鍵資料異動紀錄。',
    category: '系統設定',
    subCategory: '通用設定',
    author: '產品團隊',
    createdAt: '2025-09-25',
    likes: 37,
    likedBy: [],
    comments: [],
    status: 'shipped',
    shippedAt: '2025-11-10',
    version: 'v2.14.0'
  }
];
