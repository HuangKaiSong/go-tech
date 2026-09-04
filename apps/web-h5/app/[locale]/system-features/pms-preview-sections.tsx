import { BarChart3, Eye, FileText, RefreshCw, Search, ShieldCheck, UserCheck, Users, Zap } from 'lucide-react';
import Image from 'next/image';
import { DynamicText } from '@/app/components/DynamicI18nText';
import contractListPreview from '@/assets/contract-list-preview.png';
import customerListPreview from '@/assets/customer-list-preview.png';
import dashboardPreview from '@/assets/dashboard-preview.png';

const previews = [
  {
    id: 'dashboard-preview',
    title: '強大的系統儀表板，一眼看懂全局',
    description: '所有物業數據、租務狀態、合約提醒與部門操作，全部集中在一個直觀的介面',
    image: dashboardPreview,
    imageAlt: 'GO-PMS 系統儀表板預覽',
    muted: true,
    highlights: [
      {
        icon: Eye,
        title: '一目瞭然',
        tag: 'Visual',
        description: '物業總數、出租率、每月收入、租金出租率，關鍵指標一屏盡覽'
      },
      {
        icon: Zap,
        title: '即時掌控',
        tag: 'Real-time',
        description: '當前可租狀態、合約到期提醒、最近活動動態，數據即時更新'
      },
      {
        icon: BarChart3,
        title: '化繁為簡',
        tag: 'Simplify',
        description: '多部門一站整合，租務、場務、會計，全部集中在同一儀表板'
      }
    ]
  },
  {
    id: 'contract-list-preview',
    title: '合同列表管理，租務流程一目瞭然',
    description: '從新增合同、租務確認到客戶簽署，完整的合同生命週期管理，讓每一份合同都清晰可追蹤',
    image: contractListPreview,
    imageAlt: 'GO-PMS 合同列表頁面預覽',
    muted: false,
    highlights: [
      {
        icon: FileText,
        title: '合同集中管理',
        tag: 'Centralized',
        description: '所有租戶合同一站式管理，建立日期、合同編號、單位用途、免租期一目瞭然'
      },
      {
        icon: Search,
        title: '快速搜尋篩選',
        tag: 'Search',
        description: '支援租戶編號、單位編號、合同編號、合同狀態多維度搜索，快速定位資料'
      },
      {
        icon: ShieldCheck,
        title: '全流程狀態追蹤',
        tag: 'Workflow',
        description: '從待租務確認、待管理層簽名到待客戶簽名，合同全生命週期清楚可控'
      }
    ]
  },
  {
    id: 'customer-list-preview',
    title: '客戶列表管理，客戶關係盡在掌握',
    description: '從臨時客戶到租客，全生命週期客戶檔案管理，讓每一位客戶都被妥善追蹤與服務',
    image: customerListPreview,
    imageAlt: 'GO-PMS 客戶列表頁面預覽',
    muted: true,
    highlights: [
      {
        icon: Users,
        title: '分類管理清晰',
        tag: 'Segmented',
        description: '租客、客戶、臨時客戶一鍵分類切換，客戶關係狀態一目瞭然'
      },
      {
        icon: RefreshCw,
        title: '同步客戶資料',
        tag: 'Sync',
        description: '支援一鍵同步客戶資料，減少重複輸入，資訊即時保持最新'
      },
      {
        icon: UserCheck,
        title: '完整客戶檔案',
        tag: 'Profile',
        description: '公司名稱、證件號碼、租賃單位、合同編號、梗約與生約日期，全方位追蹤'
      }
    ]
  }
];

export default function PmsPreviewSections() {
  return previews.map(preview => (
    <section
      key={preview.id}
      id={preview.id}
      aria-labelledby={`${preview.id}-title`}
      className={`py-16 ${preview.muted ? 'bg-muted/30' : ''}`}
    >
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 id={`${preview.id}-title`} className="text-2xl md:text-3xl font-bold text-foreground mb-3">
            <DynamicText text={preview.title} />
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            <DynamicText text={preview.description} />
          </p>
        </div>

        <div className="max-w-6xl mx-auto rounded-xl overflow-hidden shadow-2xl border border-border mb-10">
          <Image
            src={preview.image}
            alt={preview.imageAlt}
            className="w-full h-auto block"
            sizes="(max-width: 1152px) 100vw, 1152px"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {preview.highlights.map(highlight => (
            <article
              key={highlight.tag}
              className="bg-background rounded-lg p-6 border border-border hover:shadow-lg transition-shadow"
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <highlight.icon className="w-6 h-6 text-primary" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-bold text-foreground">
                <DynamicText text={highlight.title} />
                <span className="ml-2 text-sm font-normal text-muted-foreground">{highlight.tag}</span>
              </h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                <DynamicText text={highlight.description} />
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  ));
}
