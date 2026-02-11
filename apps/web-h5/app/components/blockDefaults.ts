import { PageBlock } from "@/app/components/PageBlocks";
// import audienceBanner from "@/assets/audience-banner.jpg";
// import heroBackground from "https://go-techs.com/go-tech/2026/02/11/background.webp";
// import coreHero from "https://go-techs.com/go-tech/2026/02/11/core-hero.jpg";
// import SystemFeaturesHero from "https://go-techs.com/go-tech/2026/02/11/system-features.webp";



export const defaultHomeBlocks: PageBlock[] = [
  {
    id: "home-hero",
    type: "hero",
    title: "越多物業，\n越易管理！",
    titleSecondary: "GO-TECH租務系統",
    subtitle: "專注 分間單位、套房、簡樸房 租務系統。",
    titleStyle: {
      fontSize: '3rem',
      color: 'white',
      lineHeight: 1.25
    },
    titleSecondaryStyle: {
      fontSize: '3rem',
      color: 'white',
    },
    subtitleStyle: {
      fontSize: '1.25rem',
      color: 'var(--color-primary)',
    },
    sectionStyle: {
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      minHeight: '37.5rem',
      paddingTop: '6.25rem'
    },
    contentStyle: {
      width: '100%',
    },
    backgroundImage: "https://go-techs.com/go-tech/2026/02/11/background.webp",
  },
];

export const defaultSystemFeaturesBlocks: PageBlock[] = [
  {
    id: "hero",
    type: "hero",
    title: "GO-PMS功能",
    subtitle: "探索GO-PMS 的一系列功能，旨在簡化您的租務需求。",
    subtitleStyle: {
      fontSize: '1.125rem',
      color: 'var(--color-background)',
      marginBottom: '2rem'
    },
    buttonText: "立即開始14天免費試用",
    buttonLink: "/account/register",
    backgroundImage: "https://go-techs.com/go-tech/2026/02/11/system-features.webp",
    sectionStyle: {
      "display": "flex",
      "alignItems": "center",
      "minHeight": "37.5rem",
    },
    buttonStyle: {},
  },
  {
    id: "features",
    type: "featureGrid",
    title: "所有功能",
    subtitle: "更全面更完善的功能，能夠更快捷方便管理你的物業。",
    items: [
      { icon: "Users", label: "人事管理" },
      { icon: "Building2", label: "場地管理" },
      { icon: "FileText", label: "租約管理" },
      { icon: "DollarSign", label: "價格管理" },
      { icon: "UserCog", label: "代理管理" },
      { icon: "LayoutGrid", label: "單位管理" },
      { icon: "Store", label: "營鋪模組" },
      { icon: "Wallet", label: "租金管理" },
      { icon: "Calculator", label: "會計功能" },
      { icon: "Receipt", label: "收租發票" },
      { icon: "RefreshCw", label: "快速續約功能" },
      { icon: "PenTool", label: "線上簽約功能" },
    ],
  },
];

export const defaultCoreAdvantages: PageBlock[] = [
  {
    id: "core-advantages-hero",
    type: "hero",
    title: "GO - PMS",
    titleStyle: {
      fontSize: "3rem",
      fontWeight: 700,
      color: "white",
      letterSpacing: "0.05em"
    },
    subtitle: "",
    contentStyle: {
      width: '100%',
      height: '100%',
    },
    sectionStyle: {
      "display": "flex",
      "alignItems": "center",
      "minHeight": "37.5rem",
    },
    backgroundImage: "https://go-techs.com/go-tech/2026/02/11/core-hero.jpg"
  }
];

export const defaultTargetAudience: PageBlock[] = [
  {
    id: "target-audience-hero",
    type: "hero",
    title: "適合人群",
    titleStyle: {
      fontSize: "3rem",
      fontWeight: 700,
      color: "white",
      letterSpacing: "0.05em",
      textAlign: "center",
    },
    subtitle: "Target audience",
    subtitleStyle: {
      fontSize: "1.5rem",
      fontWeight: 400,
      color: "white",
      letterSpacing: "0.05em",
      textAlign: "center",
    },
    contentStyle: {
      width: '100%',
      height: '100%',
    },
    sectionStyle: {
      "display": "flex",
      "alignItems": "center",
      "minHeight": "37.5rem",
    },
    backgroundImage: "https://go-techs.com/go-tech/2026/02/11/audience-banner.jpg"
  }
]
