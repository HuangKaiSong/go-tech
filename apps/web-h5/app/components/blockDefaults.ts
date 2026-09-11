import { type AudienceProduct, type PageBlock } from '@/app/components/PageBlocks';
// import audienceIndividual from "@/assets/audience-individual.jpg";
// import audienceInvestor from "@/assets/audience-investor.jpg";
// import audienceOverseas from "@/assets/audience-overseas.jpg";
// import audienceBanner from "@/assets/audience-banner.jpg";
// import heroBackground from "https://go-techs.com/go-tech/2026/02/11/background.webp";
// import coreHero from "https://go-techs.com/go-tech/2026/02/11/core-hero.jpg";
// import SystemFeaturesHero from "https://go-techs.com/go-tech/2026/02/11/system-features.webp";

export const defaultHomeBlocks: PageBlock[] = [
  {
    id: 'home-hero',
    type: 'hero',
    variant: 'product-switcher',
    defaultProduct: 'pms',
    overlayGradient: 'linear-gradient(to right, rgba(41, 48, 61, 0.8), rgba(41, 48, 61, 0.5), transparent)',
    products: [
      {
        key: 'pms',
        label: 'PMS 租務系統',
        backgroundImage: '/images/hero-house.jpg',
        backgroundImageAlt: '夕陽下的物業',
        title: '越多物業，\n越易管理！',
        titleSecondary: 'GO-TECH租務系統',
        subtitle: '繳費·分配差餉·查帳·維修確認·租期通知',
        detailButtonText: '了解 PMS 系統',
        detailButtonLink: '/system-features?product=pms',
        trialButtonText: '立即開始14天免費試用',
        trialButtonLink: '/free-trial'
      },
      {
        key: 'hr',
        label: 'HR 人力資源系統',
        backgroundImage: '/images/hero-hr.jpg',
        backgroundImageAlt: '現代化辦公室團隊協作',
        title: '越多員工，\n越要高效管理！',
        titleSecondary: 'GO-TECH HR 人力資源管理系統',
        subtitle: '一站式處理員工資料、入職離職、考勤假期、薪資績效及培訓管理，讓 HR 工作更簡單、更準確、更高效。',
        detailButtonText: '了解 HR 系統',
        detailButtonLink: '/system-features?product=hr',
        trialButtonText: '立即開始14天免費試用',
        trialButtonLink: '/free-trial'
      }
    ],
    title: '越多物業，\n越易管理！',
    titleSecondary: 'GO-TECH租務系統',
    subtitle: '專注 分間單位、套房、簡樸房 租務系統。',
    titleStyle: {
      fontSize: '3rem',
      color: 'white',
      lineHeight: 1.25
    },
    titleSecondaryStyle: {
      fontSize: '3rem',
      color: 'white'
    },
    subtitleStyle: {
      fontSize: '1.25rem',
      color: 'var(--color-white)'
    },
    sectionStyle: {
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      minHeight: '37.5rem',
      paddingTop: '6.25rem'
    },
    contentStyle: {
      width: '100%'
    },
    backgroundImage: 'https://go-techs.com/go-tech/2026/02/11/background.webp'
  },
  {
    id: 'home-section',
    type: 'section',
    products: [
      {
        key: 'pms',
        title: '租務管理系統，一站式解決方案！',
        intro: '簡化繳費、帳單及收款，通過分類輕鬆管理查詢、自動提醒及批量通知到期，省心管理、協心合作。'
      },
      {
        key: 'hr',
        title: '人力資源管理系統，一站式 SaaS 解決方案！',
        intro: '覆蓋人事、考勤、薪資、審批、績效、培訓與報表分析，助企業建立標準化、數碼化的人力資源管理流程。'
      }
    ],
    title: '租務管理系統，一站式解決方案！',
    intro: '簡化繳費、帳單及收款，通過分類輕鬆管理查詢、自動提醒及批量通知到期，省心管理、協心合作。'
  }
];

export const defaultSystemFeaturesBlocks: PageBlock[] = [
  {
    id: 'hero',
    type: 'hero',
    variant: 'product-switcher',
    defaultProduct: 'pms',
    overlayGradient: 'linear-gradient(to right, rgba(26, 32, 44, 0.82), rgba(26, 32, 44, 0.48), transparent)',
    products: [
      {
        key: 'pms',
        label: 'PMS 租務系統',
        backgroundImage: 'https://go-techs.com/go-tech/2026/02/11/system-features.webp',
        backgroundImageAlt: 'GO-PMS 系統功能',
        title: 'GO-PMS功能',
        titleSecondary: '',
        subtitle: '探索GO-PMS 的一系列功能，旨在簡化您的租務需求。',
        detailButtonText: '',
        detailButtonLink: '',
        trialButtonText: '立即開始14天免費試用',
        trialButtonLink: '/account/register'
      },
      {
        key: 'hr',
        label: 'HR 人力資源系統',
        backgroundImage: '/images/hero-hr.jpg',
        backgroundImageAlt: 'GO-HR 系統功能',
        title: 'GO-HR功能',
        titleSecondary: '',
        subtitle: '覆蓋人事、考勤、薪資、審批、績效、培訓與報表分析，助企業建立標準化、數碼化的人力資源管理流程。',
        detailButtonText: '',
        detailButtonLink: '',
        trialButtonText: '立即開始14天免費試用',
        trialButtonLink: '/account/register'
      }
    ],
    title: 'GO-PMS功能',
    titleSecondary: '',
    subtitle: '探索GO-PMS 的一系列功能，旨在簡化您的租務需求。',
    subtitleStyle: {
      fontSize: '1.125rem',
      color: 'var(--color-background)',
      marginBottom: '2rem'
    },
    buttonText: '立即開始14天免費試用',
    buttonLink: '/account/register',
    backgroundImage: 'https://go-techs.com/go-tech/2026/02/11/system-features.webp',
    sectionStyle: {
      display: 'flex',
      alignItems: 'center',
      minHeight: '37.5rem'
    },
    buttonStyle: {}
  },
  {
    id: 'features',
    type: 'featureGrid',
    title: '所有功能',
    subtitle: '更全面更完善的功能，能夠更快捷方便管理你的物業。',
    items: [
      { icon: 'Users', label: '人事管理' },
      { icon: 'Building2', label: '場地管理' },
      { icon: 'FileText', label: '租約管理' },
      { icon: 'DollarSign', label: '價格管理' },
      { icon: 'UserCog', label: '代理管理' },
      { icon: 'LayoutGrid', label: '單位管理' },
      { icon: 'Store', label: '營鋪模組' },
      { icon: 'Wallet', label: '租金管理' },
      { icon: 'Calculator', label: '會計功能' },
      { icon: 'Receipt', label: '收租發票' },
      { icon: 'RefreshCw', label: '快速續約功能' },
      { icon: 'PenTool', label: '線上簽約功能' }
    ]
  }
];

export const defaultCoreAdvantages: PageBlock[] = [
  {
    id: 'core-advantages-hero',
    type: 'hero',
    variant: 'product-switcher',
    defaultProduct: 'pms',
    overlayGradient: 'linear-gradient(to right, rgba(20, 26, 38, 0.78), rgba(20, 26, 38, 0.38), transparent)',
    products: [
      {
        key: 'pms',
        label: 'PMS 租務系統',
        backgroundImage: 'https://go-techs.com/go-tech/2026/02/11/core-hero.jpg',
        backgroundImageAlt: 'GO-PMS 核心優勢',
        title: 'GO - PMS',
        titleSecondary: '',
        subtitle: '',
        detailButtonText: '',
        detailButtonLink: '',
        trialButtonText: '',
        trialButtonLink: ''
      },
      {
        key: 'hr',
        label: 'HR 人力資源系統',
        backgroundImage: '/images/hero-hr.jpg',
        backgroundImageAlt: 'GO-HR 核心優勢',
        title: 'GO - HR',
        titleSecondary: '',
        subtitle: '',
        detailButtonText: '',
        detailButtonLink: '',
        trialButtonText: '',
        trialButtonLink: ''
      }
    ],
    title: 'GO - PMS',
    titleStyle: {
      fontSize: '3rem',
      fontWeight: 700,
      color: 'white',
      letterSpacing: '0.05em'
    },
    titleSecondary: '',
    subtitle: '',
    contentStyle: {
      width: '100%',
      height: '100%'
    },
    sectionStyle: {
      display: 'flex',
      alignItems: 'center',
      minHeight: '37.5rem'
    },
    backgroundImage: 'https://go-techs.com/go-tech/2026/02/11/core-hero.jpg'
  }
];

export const defaultTargetAudience: PageBlock[] = [
  {
    id: 'target-audience-hero',
    type: 'hero',
    variant: 'product-switcher',
    productSwitcherPlacement: 'below-hero',
    defaultProduct: 'pms',
    overlayGradient: 'linear-gradient(to right, rgba(35, 39, 48, 0.76), rgba(35, 39, 48, 0.45), transparent)',
    products: [
      {
        key: 'pms',
        label: 'GO-PMS 物業系統',
        backgroundImage: 'https://go-techs.com/go-tech/2026/02/11/audience-banner.jpg',
        backgroundImageAlt: 'GO-PMS 適合人群',
        title: '適合人群',
        titleSecondary: '',
        subtitle: 'Target audience',
        detailButtonText: '',
        detailButtonLink: '',
        trialButtonText: '',
        trialButtonLink: ''
      },
      {
        key: 'hr',
        label: 'GO-HR 人力資源',
        backgroundImage: '/images/hero-hr.jpg',
        backgroundImageAlt: 'GO-HR 適合人群',
        title: '適合人群',
        titleSecondary: '',
        subtitle: 'Target audience',
        detailButtonText: '',
        detailButtonLink: '',
        trialButtonText: '',
        trialButtonLink: ''
      }
    ],
    title: '適合人群',
    titleSecondary: '',
    titleStyle: {
      fontSize: '3rem',
      fontWeight: 700,
      color: 'white',
      letterSpacing: '0.05em',
      textAlign: 'center'
    },
    subtitle: 'Target audience',
    subtitleStyle: {
      fontSize: '1.5rem',
      fontWeight: 400,
      color: 'white',
      letterSpacing: '0.05em',
      textAlign: 'center'
    },
    contentStyle: {
      width: '100%',
      height: '100%'
    },
    sectionStyle: {
      display: 'flex',
      alignItems: 'center',
      minHeight: '37.5rem'
    },
    backgroundImage: 'https://go-techs.com/go-tech/2026/02/11/audience-banner.jpg'
  }
];

export const audienceProducts: AudienceProduct[] = [
  {
    key: 'pms',
    audiences: [
      {
        title: '擁有出租物業的個人業主',
        description: '管理一至數個出租單位，需要處理租戶溝通、租金收取和維修訴求。',
        image: '/images/audience-individual.jpg',
        sort: 9
      },
      {
        title: '擁有多元物業組合的投資型業主',
        description: '管理多個物業（住宅、商業或混合用途），需要追蹤不同物業的收入、支出和租賃狀況。',
        image: '/images/audience-investor.jpg',
        sort: 8
      },
      {
        title: '地產物管集團',
        description:
          '專為物業集團設計的智能管理平臺，打通從決策到服務的全鏈條，讓數據驅動運營、系統賦能團隊，實現降本增效與品質提升的一體化管理。',
        image: '/images/audience-overseas.jpg',
        sort: 7
      }
    ]
  },
  {
    key: 'hr',
    audiences: [
      {
        title: '中小企業',
        description: '沒有專職 HR 團隊？由入職、考勤到出糧一站完成，一人也能管好全公司人事。',
        image: '/images/hero-hr.jpg',
        sort: 9
      },
      {
        title: '連鎖店及服務業',
        description: '多分店、多更表？支援排班輪更、外勤打卡與跨店調配，考勤薪資自動核算。',
        image: '/images/home-office.jpg',
        sort: 8
      },
      {
        title: '多部門企業',
        description: '架構複雜、審批層級多？部門權限分明，假期審批與績效考核流程標準化。',
        image: '/images/core-office.jpg',
        sort: 7
      }
    ]
  }
];

export const audiences = audienceProducts[0].audiences;
