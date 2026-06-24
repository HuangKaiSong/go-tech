import PageClient from './page';

const pricingData = {
  plans: [
    // { name: "普通版", price: "$1,000", units: "25", extra: "$150/5個" },
    // { name: "升級版", price: "$3,200", units: "100", extra: "$130/5個" },
    // { name: "豪華版", price: "$12,000", units: "400", extra: "$100/5個" },
  ] as {
    extra: string;
    id?: number;
    name: string;
    price: string;
    units: string;
  }[],
  categories: [] as {
    features: {
      icon?: string;
      name: string;
      plans: boolean[];
      type: string;
    }[];
    name: string;
  }[],
  addons: [
    {
      name: '升級營舖模組',
      features: ['商舖列表', '營銷列表'],
      key: 'rentSysPrice',
      prices: ['+$20 each', '+$15 each', '0']
    },
    {
      name: '升級場地管理',
      features: ['手機版', '列印跟進單'],
      key: 'venueSysPrice',
      prices: ['+$20 each', '+$15 each', '0']
    },
    {
      name: '升級會計',
      features: [],
      key: 'accountingSysPrice',
      prices: ['+$50 each', '+$25 each', '+$15 each']
    },
    {
      name: '客服',
      key: 'custServiceSysPrice',
      features: ['客服列表', '租客portal'],
      prices: ['+$20 each', '+$20 each', '0']
    }
  ]
};

export type PricingPlanData = typeof pricingData;

// 定义addon key的联合类型
type AddonKey = 'accountingSysPrice' | 'custServiceSysPrice' | 'rentSysPrice' | 'venueSysPrice';

function getBaseUrl(): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!apiUrl) {
    throw new Error('NEXT_PUBLIC_API_URL is not defined');
  }

  return apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
}

export default async function Page() {
  const baseUrl = getBaseUrl();
  let packages: Packages[] = [];

  try {
    const menus = (await fetch(`${baseUrl}/go-tech/platform/platformPackage/menuTree`).then(res =>
      res.json()
    )) as HttpBaseResponse<MenuType[]>;

    const packagesData = (await fetch(`${baseUrl}/go-tech/platform/platformPackage/enabledList`).then(res =>
      res.json()
    )) as HttpBaseResponse<Packages[]>;

    if (packagesData?.data && Array.isArray(packagesData?.data)) {
      packages = (packagesData?.data || [])?.slice(0, 3) || [];
    } else {
      packages = [];
    }

    if (packages.length) {
      pricingData.plans = packages.map(pack => ({
        id: pack.id,
        name: pack.packageName,
        price: pack.price ? `$${pack.price.toLocaleString('zh-Hans-CN')}` : '敬請期待',
        units: pack.unitCount.toLocaleString('zh-Hans-CN'),
        extra: '無'
      }));

      pricingData.addons = pricingData.addons.map(addon => {
        const prices = pricingData.plans.map(plan => {
          const packageItem = packages.find(p => p.id === plan.id);
          if (packageItem) {
            // 使用类型断言确保类型安全
            const addonKey = addon.key as AddonKey;
            const priceValue = packageItem[addonKey];
            if (priceValue && priceValue !== undefined) {
              return `$${priceValue.toLocaleString('zh-Hans-CN')} each`;
            }
          }
          return '0';
        });

        return {
          ...addon,
          prices
        };
      });

      if (menus.data?.length) {
        pricingData.categories = menus.data.map(menu => {
          const features =
            menu.children?.map(child => {
              // 根据每个套餐的 packageItemList 动态设置 plans
              const plans = pricingData.plans.map(plan => {
                const packageItem = packages.find(p => p.id === plan.id);
                return packageItem?.packageItemList.some(item => item.menuId === child.id) || false;
              });
              return {
                name: child.title,
                type: child.desc,
                icon: child.icon,
                plans
              };
            }) || [];
          return {
            name: menu.title,
            features
          };
        });
      }
    }
  } catch (error) {
    console.log(error);
  }
  // 在缓存函数外部获取认证token

  return <PageClient pricingData={pricingData} />;
}
