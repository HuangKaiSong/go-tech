import Footer from "@/app/components/Footer";
import Header from "@/app/components/Header";
import servicePlanBg from "@/assets/service-plan-bg.jpg";
import { getBaseUrl } from "@/lib/http";
import PricingCard from './_renderPackage';

type ExtendedPackages = Packages & {
  upgradeNote: string | null;
  newFeatures: { icon?: any; label: string }[];
  newPackageItemList: { menuId: number; menuIcon: string; menuTitle: string }[];
};

const ServicePlan = async () => {
  const baseUrl = getBaseUrl();
  const packagesData = await fetch(`${baseUrl}/go-tech/platform/platformPackage/enabledList`, { next: { revalidate: 300 } }).then(res => res.json()) as HttpBaseResponse<Packages[]>;

  const packages = (packagesData?.data || []).slice(0, 3).reduce((acc, cur, index, arr) => {
    // 第一个套餐没有upgradeNote和newFeatures
    if (index === 0) {
      acc.push({
        ...cur,
        upgradeNote: null,
        newFeatures: [],
        newPackageItemList: cur.packageItemList,
      });
    } else {
      // 与前一个套餐比较，获取新增功能
      const prevPackage = arr[index - 1];
      
      const priceDiff = cur.price - prevPackage.price;

      const unitDiff = cur.unitCount - prevPackage.unitCount;

      // 获取当前套餐相对于前一个套餐的新功能
      const prevMenuItems = new Set(prevPackage.packageItemList.map(item => item.menuId));
      const newFeatureItems = cur.packageItemList.filter(
        item => !prevMenuItems.has(item.menuId)
      ).map(item => ({
        label: item.menuTitle,
        icon: item.menuIcon,
      }));

      const newPackageItemList = cur.packageItemList.filter(
        item => prevMenuItems.has(item.menuId)
      )

      let upgradeNote: string | null = null;
      if (priceDiff > 0) {
        upgradeNote = `(加$${priceDiff}從${prevPackage.packageName}升級，增加${unitDiff}個單位)`;
      }

      acc.push({
        ...cur,
        upgradeNote,
        newPackageItemList: newPackageItemList.length > 0 ? newPackageItemList : cur.packageItemList,
        newFeatures: newFeatureItems
      });
    }
    return acc;
  }, [] as ExtendedPackages[])

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section
        className="relative pt-32 pb-16 bg-cover bg-center"
        style={{ backgroundImage: `url(${servicePlanBg})` }}
      >
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-2">
            服務計劃
          </h1>
          <p className="text-lg text-primary/80">Service plan</p>
        </div>
      </section>

      {/* Pricing Cards Section */}
      <PricingCard packages={packages} />

      <Footer />
    </div>
  );
};

export default ServicePlan;
