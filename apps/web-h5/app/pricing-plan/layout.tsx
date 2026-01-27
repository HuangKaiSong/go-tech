import { HttpBaseResponse, httpClient } from "@/lib/http";
import { unstable_cache } from "next/cache";
import { cookies } from "next/headers";
import PageClient from "./page";

const pricingData = {
  plans: [
    // { name: "普通版", price: "$1,000", units: "25", extra: "$150/5個" },
    // { name: "升級版", price: "$3,200", units: "100", extra: "$130/5個" },
    // { name: "豪華版", price: "$12,000", units: "400", extra: "$100/5個" },
  ] as {
    id?: number;
    name: string;
    price: string;
    units: string;
    extra: string;
  }[],
  categories: [] as {
    name: string;
    features: {
      name: string;
      type: string;
      plans: boolean[];
    }[];
  }[],
  addons: [
    {
      name: "升級營舖模組",
      features: ["商舖列表", "營銷列表"],
      key: "rentSysPrice",
      prices: ["+$20 each", "+$15 each", "0"],
    },
    {
      name: "升級場地管理",
      features: ["手機版", "列印跟進單"],
      key: "venueSysPrice",
      prices: ["+$20 each", "+$15 each", "0"],
    },
    {
      name: "升級會計",
      features: [],
      key: "accountingSysPrice",
      prices: ["+$50 each", "+$25 each", "+$15 each"],
    },
    {
      name: "客服",
      key: "custServiceSysPrice",
      features: ["客服列表", "租客portal"],
      prices: ["+$20 each", "+$20 each", "0"],
    },
  ],
};

export type PricingPlanData = typeof pricingData;

export type MenuType = {
  id: number;
  title: string;
  parentId: number;
  children?: MenuType[];
};

export type Packages = {
  id: number;
  packageName: string;
  unitCount: number;
  price: number;
  addUnitPrice: number;
  rentSysPrice: number;
  venueSysPrice: number;
  accountingSysPrice: number;
  custServiceSysPrice: number;
  packageItemList: { menuId: number; menuTitle: string }[];
};

// 定义addon key的联合类型
type AddonKey =
  | "rentSysPrice"
  | "venueSysPrice"
  | "accountingSysPrice"
  | "custServiceSysPrice";

const getCachedMenus = unstable_cache<(...args: any[]) => Promise<HttpBaseResponse<MenuType[]>>>(
  async (authToken: string) => {
    // 直接使用fetch而不是httpClient，避免使用cookies
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      throw new Error("NEXT_PUBLIC_API_URL is not defined");
    }

    const baseUrl = apiUrl.endsWith("/") ? apiUrl.slice(0, -1) : apiUrl;
    const url = `${baseUrl}/go-tech/platform/platformPackage/menuTree`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      next: {
        tags: ["menu-tree-cache"],
        revalidate: 300
      }
    });

    if (!response.ok) {
      throw new Error(
        `API request failed: ${response.status} ${response.statusText}`
      );
    }

    return await response.json();
  },
  ["menu-tree-cache"],
  {
    tags: ["menu-tree-cache"],
    revalidate: 300
  }
);
async function getAuthToken() {
  const cookieStore = await cookies();
  return cookieStore.get("GO_TECH_AUTH_TOKEN")?.value || "";
}

export default async function Page() {
  // 在缓存函数外部获取认证token
  const authToken = await getAuthToken();
  const menus = await getCachedMenus(authToken);

  const packages = await httpClient.get<Packages[]>(
    "/go-tech/platform/platformPackage/enabledList"
  );

  if (packages.data?.length) {
    pricingData.plans = packages.data.map(pack => ({
      id: pack.id,
      name: pack.packageName,
      price: `$${pack.price.toLocaleString("zh-CN")}`,
      units: pack.unitCount.toLocaleString("zh-CN"),
      extra: "無",
    }));

    pricingData.addons = pricingData.addons.map(addon => {
      const prices = pricingData.plans.map(plan => {
        const packageItem = packages.data?.find(p => p.id === plan.id);
        if (packageItem) {
          // 使用类型断言确保类型安全
          const addonKey = addon.key as AddonKey;
          const priceValue = packageItem[addonKey];
          if (priceValue !== undefined) {
            return `$${priceValue.toLocaleString("zh-CN")} each`;
          }
        }
        return "0";
      });

      return {
        ...addon,
        prices,
      };
    });

    if (menus.data?.length) {
      pricingData.categories = menus.data.map(menu => {
        const features =
          menu.children?.map(child => {
            // 根据每个套餐的 packageItemList 动态设置 plans
            const plans = pricingData.plans.map(plan => {
              const packageItem = packages.data?.find(p => p.id === plan.id);
              return (
                packageItem?.packageItemList.some(
                  item => item.menuId === child.id
                ) || false
              );
            });
            return {
              name: child.title,
              type: "",
              plans,
            };
          }) || [];
        return {
          name: menu.title,
          features,
        };
      });
    }
  }

  return <PageClient pricingData={pricingData} />;
}
