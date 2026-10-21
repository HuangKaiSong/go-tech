export type ManualArticle = {
  category: string;
  slug: string;
  steps: { body: string; tip?: string; title: string }[];
  summary: string;
  title: string;
};

export const manualCategories = [
  { id: 'start', name: '開始使用', desc: '註冊、登入、選擇公司及系統基本設定', icon: 'Rocket' },
  { id: 'property', name: '物業與租約', desc: '新增物業、租戶檔案、電子租約管理', icon: 'Building2' },
  { id: 'billing', name: '帳務與收租', desc: '帳單、自動收租、按金及差餉紀錄', icon: 'Wallet' },
  { id: 'maintenance', name: '維修與跟進', desc: '維修工單、跟進清單、電子授權', icon: 'Wrench' },
  { id: 'hr', name: 'GO-HRM 人事系統', desc: '員工、考勤打卡、出糧與 KPI', icon: 'Users' },
  { id: 'account', name: '帳戶與訂閱', desc: '套餐、續費、用戶權限與發票', icon: 'CreditCard' }
] as const;

export const manualArticles: ManualArticle[] = [
  {
    slug: 'getting-started',
    category: 'start',
    title: '首次登入及設定公司資料',
    summary: '完成註冊後，按以下步驟設定公司資料，即可開始使用 Go Techs。',
    steps: [
      { title: '登入帳戶', body: '前往登入頁，輸入註冊電郵及密碼。如擁有多個公司帳戶，系統會顯示「選擇帳戶」頁面。' },
      { title: '選擇公司及系統', body: '在公司卡片上點擊進入，卡片會標明 PMS（租務）或 HRM（人事）系統。' },
      {
        title: '填寫公司資料',
        body: '進入「設定」，填寫公司名稱、地址、聯絡電話及商業登記號碼，用於帳單及發票。',
        tip: '公司標誌建議使用正方形 PNG 圖片。'
      },
      { title: '邀請團隊成員', body: '前往「用戶管理」發送邀請，並為成員分配角色及權限。' }
    ]
  },
  {
    slug: 'add-property',
    category: 'property',
    title: '新增物業及單位',
    summary: '集中管理住宅、商舖、工廈等全部物業。',
    steps: [
      { title: '打開物業列表', body: '在左側選單點擊「物業管理」>「物業列表」。' },
      { title: '點擊「新增物業」', body: '輸入物業名稱、地址、類型（住宅／商舖／工廈）及面積。' },
      { title: '新增單位', body: '在物業詳情頁新增單位，設定房號、租金及狀態（空置／已租）。' }
    ]
  },
  {
    slug: 'create-lease',
    category: 'property',
    title: '建立電子租約',
    summary: '建立租約後，系統會自動產生租金帳單及到期提醒。',
    steps: [
      { title: '選擇租戶及單位', body: '於「租約管理」點擊「新增租約」，選擇租戶檔案及單位。' },
      { title: '設定租期及租金', body: '輸入起租日、租期、月租、按金及繳租日。' },
      { title: '上載及簽署', body: '上載租約文件，或使用電子簽名完成簽署。', tip: '租約到期前 60 日，系統會自動提醒。' }
    ]
  },
  {
    slug: 'auto-rent',
    category: 'billing',
    title: '設定自動收租及帳單提醒',
    summary: '每月自動產生帳單，並透過批量通知提醒租戶繳租。',
    steps: [
      { title: '開啟自動帳單', body: '於「帳務設定」開啟「自動產生月租帳單」，選擇產生日期。' },
      { title: '設定提醒', body: '設定到期前及逾期後的提醒天數，系統會發送通知。' },
      { title: '確認收款', body: '收款後在帳單上點擊「確認收款」，可附上入數紙作紀錄。' }
    ]
  },
  {
    slug: 'deposit-rates',
    category: 'billing',
    title: '按金及差餉紀錄',
    summary: '清晰紀錄按金收取、退還及差餉分攤。',
    steps: [
      { title: '紀錄按金', body: '在租約內輸入按金金額及收取日期。' },
      { title: '差餉分攤', body: '於「雜費列表」新增差餉，並按單位分配。' },
      { title: '退還按金', body: '退租時在租約點擊「退還按金」，可扣除維修或欠款。' }
    ]
  },
  {
    slug: 'work-order',
    category: 'maintenance',
    title: '建立及跟進維修工單',
    summary: '由報修到完工，全程追蹤進度。',
    steps: [
      { title: '新增工單', body: '於「跟進清單」點擊「新增」，選擇單位並描述問題，可上載相片。' },
      { title: '指派負責人', body: '指派同事或外判商，並設定預計完成日期。' },
      { title: '完成及授權', body: '完工後由租戶或業主透過電子授權確認。' }
    ]
  },
  {
    slug: 'hr-clock',
    category: 'hr',
    title: '員工考勤打卡設定',
    summary: '員工可使用手機打卡，管理員即時查看出勤。',
    steps: [
      { title: '新增員工', body: '於 GO-HRM「員工管理」新增員工資料。' },
      { title: '設定班次', body: '設定上下班時間、打卡範圍及遲到規則。' },
      { title: '手機打卡', body: '員工登入手機版，於「打卡」頁完成上下班打卡。' }
    ]
  },
  {
    slug: 'renew-plan',
    category: 'account',
    title: '續費及升級套餐',
    summary: '查看訂單、續費或升級至升級版／豪華版。',
    steps: [
      { title: '打開我的訂單', body: '點擊右上角頭像 >「我的訂單」。' },
      { title: '選擇續費或升級', body: '升級費用會按剩餘日數按比例計算。' },
      { title: '完成付款', body: '選擇付款方式並填寫發票資料，付款後即時生效。' }
    ]
  }
];
