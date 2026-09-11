// oxlint-disable-next-line import/no-unassigned-import
import 'server-only';

import type { PackageBizCode } from '@go-tech/types';
import {
  BadgeDollarSign,
  BarChart3,
  Bell,
  BookOpen,
  Briefcase,
  Building2,
  Calculator,
  CalendarClock,
  CalendarDays,
  CheckSquare,
  ClipboardList,
  Cloud,
  Coins,
  DollarSign,
  FileText,
  Fingerprint,
  Gift,
  GitBranch,
  GraduationCap,
  History,
  IdCard,
  LayoutGrid,
  Network,
  PenTool,
  Percent,
  Receipt,
  RefreshCw,
  Settings2,
  ShieldCheck,
  Smartphone,
  Star,
  Store,
  Target,
  TrendingUp,
  UserCog,
  UserMinus,
  UserPlus,
  Users,
  Wallet
} from 'lucide-react';
import type { PageBlock } from '@/app/components/PageBlocks';

export const systemFeaturesContent = {
  pms: {
    overviewTitle: '系統功能簡介',
    overviewDesc:
      '從物業建檔、租約簽署、租金收支到客戶跟進，GO-PMS 以四大核心模組串連日常租務流程，一套系統管理所有物業資產。',
    modules: [
      {
        icon: Building2,
        tag: 'Property',
        title: '物業與單位管理',
        desc: '住宅、商廈、工廈、車位、倉庫、廣告位等各類資產統一建檔，樓層、面積、間隔、出租狀態一目瞭然。',
        points: ['多類型物業建檔', '單位空置狀態追蹤', '圖則與文件附件']
      },
      {
        icon: FileText,
        tag: 'Leasing',
        title: '租約與續約管理',
        desc: '由議價、簽約、加租到退租全流程記錄，到期自動提醒，並支援快速續約與線上電子簽署。',
        points: ['租約全生命週期', '到期自動提醒', '線上簽約與續約']
      },
      {
        icon: Wallet,
        tag: 'Finance',
        title: '租金與會計財務',
        desc: '自動產生每月賬單與收據，追蹤欠租與按金，支援管理費、水電雜費分攤，並可對接會計系統。',
        points: ['自動出單收據', '欠租催繳追蹤', 'Xero 會計對接']
      },
      {
        icon: Users,
        tag: 'CRM',
        title: '客戶與客服跟進',
        desc: '業主、租客、代理資料集中管理，問盤、維修、投訴等跟進紀錄清晰可查，租客可透過 Portal 自助提交。',
        points: ['客戶檔案集中', '問盤與維修跟進', '租客自助 Portal']
      }
    ],
    metrics: [
      { value: '12+', label: '核心功能模組全覆蓋' },
      { value: '10+', label: '營運指標一頁看盡' },
      { value: '24/7', label: '雲端數據即時同步' },
      { value: '14 天', label: '免費試用，無需信用卡' }
    ],
    featuresTitle: '所有功能',
    featuresDesc: '更全面更完善的功能，能夠更快捷方便管理你的物業。',
    featureGroups: [
      {
        title: '核心功能',
        desc: '覆蓋租務日常所需的完整模組',
        items: [
          { icon: Users, label: '人事管理' },
          { icon: Building2, label: '場地管理' },
          { icon: FileText, label: '租約管理' },
          { icon: DollarSign, label: '價格管理' },
          { icon: UserCog, label: '代理管理' },
          { icon: LayoutGrid, label: '單位管理' },
          { icon: Store, label: '營鋪模組' },
          { icon: Wallet, label: '租金管理' },
          { icon: Calculator, label: '會計功能' },
          { icon: Receipt, label: '收租發票' },
          { icon: RefreshCw, label: '快速續約功能' },
          { icon: PenTool, label: '線上簽約功能' }
        ]
      }
    ],
    benefits: [
      { icon: Cloud, title: '雲端多租戶架構', desc: '支援多公司切換管理，數據獨立安全隔離。' },
      { icon: ShieldCheck, title: '銀行級數據安全', desc: '全程加密傳輸，權限分層管控敏感資料。' },
      { icon: Smartphone, title: '跨裝置無縫協作', desc: '電腦、平板、手機隨時登入，資訊同步不間斷。' }
    ],
    showPreviews: true
  },
  hr: {
    overviewTitle: '系統功能簡介',
    overviewDesc: '由入職到離職、由打卡到出糧，GO-HR 以六大核心模組串連整個員工生命周期，讓人事行政一站完成。',
    modules: [
      {
        icon: IdCard,
        tag: 'People',
        title: '人事與組織架構',
        desc: '員工資料、入職離職、部門與職位架構統一管理，人員異動與檔案變更全程留痕。',
        points: ['員工資料檔案', '入職離職流程', '部門職位架構']
      },
      {
        icon: Fingerprint,
        tag: 'Attendance',
        title: '日常與考勤審批',
        desc: '支援排班輪更、手機定位打卡與補卡申請，假期規則自訂，請假加班一鍵送審。',
        points: ['打卡與打卡記錄', '假期設定與結餘', '多層審批流程']
      },
      {
        icon: Coins,
        tag: 'Payroll',
        title: '薪資與發薪管理',
        desc: '薪資方案彈性設定，考勤與獎金罰款自動帶入計算，一鍵生成薪資單與發薪記錄。',
        points: ['薪資方案設定', '自動薪資計算', '獎金罰款與發薪']
      },
      {
        icon: TrendingUp,
        tag: 'Growth',
        title: '績效與培訓發展',
        desc: '自訂考核方案與週期，員工自評主管覆核，培訓計劃與記錄完整存檔，助人才持續成長。',
        points: ['考核方案設定', '績效評估流程', '培訓計劃與記錄']
      },
      {
        icon: Bell,
        tag: 'Notice',
        title: '消息通知',
        desc: '入職提醒、合約到期、生日祝賀、審批待辦即時推送，重要事項不遺漏。',
        points: ['待辦審批提醒', '到期事項通知', '全員公告發佈']
      },
      {
        icon: BarChart3,
        tag: 'Analytics',
        title: '報表分析',
        desc: '人力結構、離職率、出勤異常與薪酬成本多維報表，支援匯出，為決策提供依據。',
        points: ['人力結構分析', '考勤異常統計', '薪酬成本報表']
      }
    ],
    metrics: [
      { value: '30+', label: '人事功能模組全覆蓋' },
      { value: '80%', label: '人事行政工時減省' },
      { value: '24/7', label: '雲端數據即時同步' },
      { value: '14 天', label: '免費試用，無需信用卡' }
    ],
    featuresTitle: '所有功能',
    featuresDesc: '由人事檔案到報表分析，覆蓋員工完整生命周期的管理需求。',
    featureGroups: [
      {
        title: '人事管理',
        desc: '員工檔案與人員異動全程數碼化',
        items: [
          { icon: Users, label: '員工管理' },
          { icon: IdCard, label: '員工資料' },
          { icon: UserPlus, label: '入職管理' },
          { icon: UserMinus, label: '離職管理' }
        ]
      },
      {
        title: '組織架構',
        desc: '部門、職位與匯報關係清晰可視',
        items: [
          { icon: Network, label: '組織架構' },
          { icon: Building2, label: '部門管理' },
          { icon: Briefcase, label: '職位管理' },
          { icon: GitBranch, label: '職位架構' }
        ]
      },
      {
        title: '日常管理',
        desc: '考勤、假期與審批一站處理',
        items: [
          { icon: ClipboardList, label: '行政管理' },
          { icon: Fingerprint, label: '打卡管理' },
          { icon: CalendarClock, label: '打卡記錄' },
          { icon: CalendarDays, label: '假期設定' },
          { icon: CheckSquare, label: '審批管理' }
        ]
      },
      {
        title: '薪資管理',
        desc: '由計糧到發薪自動化、可追溯',
        items: [
          { icon: Settings2, label: '薪資方案' },
          { icon: Calculator, label: '薪資計算' },
          { icon: Gift, label: '獎金/罰款' },
          { icon: BadgeDollarSign, label: '發薪管理' }
        ]
      },
      {
        title: '發展與績效',
        desc: '考核與培訓推動人才持續成長',
        items: [
          { icon: Target, label: '績效管理' },
          { icon: Percent, label: '考核方案' },
          { icon: Star, label: '績效評估' },
          { icon: GraduationCap, label: '培訓管理' },
          { icon: BookOpen, label: '培訓計劃' },
          { icon: History, label: '培訓記錄' }
        ]
      },
      {
        title: '分析與設定',
        desc: '數據驅動的人力資源決策',
        items: [
          { icon: Bell, label: '消息通知' },
          { icon: BarChart3, label: '報表分析' }
        ]
      }
    ],
    benefits: [
      { icon: Cloud, title: '按員工人數開通', desc: '彈性訂閱，人數增減隨時調整，成本可控。' },
      { icon: ShieldCheck, title: '薪酬資料嚴格保密', desc: '分層權限管控，敏感薪資只有授權人可見。' },
      { icon: Smartphone, title: '手機自助服務', desc: '員工可自助打卡、請假、查看薪資單與假期結餘。' }
    ],
    showPreviews: false
  }
} as const;

const pmsFeatureIcons = {
  Users,
  Building2,
  FileText,
  DollarSign,
  UserCog,
  LayoutGrid,
  Store,
  Wallet,
  Calculator,
  Receipt,
  RefreshCw,
  PenTool
};

export function getSystemFeaturesContent(product: PackageBizCode, blocks: PageBlock[]) {
  const content = systemFeaturesContent[product];
  const configuredFeatures = blocks.find(block => block.type === 'featureGrid');

  // 旧版 featureGrid 只描述 PMS，保留已保存的配置，不把它套用到 HR。
  if (product !== 'pms' || !configuredFeatures) return content;

  return {
    ...content,
    featuresTitle: configuredFeatures.title,
    featuresDesc: configuredFeatures.subtitle,
    featureGroups: [
      {
        ...systemFeaturesContent.pms.featureGroups[0],
        items: configuredFeatures.items.map(item => ({
          icon: pmsFeatureIcons[item.icon] ?? LayoutGrid,
          label: item.label
        }))
      }
    ]
  };
}
