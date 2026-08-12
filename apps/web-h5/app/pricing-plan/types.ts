export interface PricingPlanData {
  addons: {
    features: string[];
    key: string;
    name: string;
    prices: string[];
  }[];
  categories: {
    features: {
      icon?: string;
      name: string;
      plans: boolean[];
      type: string;
    }[];
    name: string;
  }[];
  plans: {
    extra: string;
    id?: number;
    name: string;
    price: string;
    units: string;
  }[];
}
