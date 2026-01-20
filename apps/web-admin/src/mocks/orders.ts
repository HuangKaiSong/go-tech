export interface Order {
  id: string;
  customer: string;
  phone: string;
  email: string;
  package: string;
  addons: string;
  amount: string;
  paymentMethod: string;
  paymentTime: string;
  status: string;
  paymentProof?: string;
}

// Mock data
export const initialOrders: Order[] = [
  {
    id: "TC000001",
    customer: "張先生",
    phone: "9825 3973",
    email: "XXXXX@126.com",
    package: "黃金套餐",
    addons: "租務系統 | 會計系統",
    amount: "$1080",
    paymentMethod: "轉賬",
    paymentTime: "12/08/2025 10:00:23",
    status: "已支付",
  },
  {
    id: "TC000002",
    customer: "李先生",
    phone: "9825 3973",
    email: "XXXXX@126.com",
    package: "黃金套餐",
    addons: "租務系統 | 會計系統",
    amount: "$1080",
    paymentMethod: "轉賬",
    paymentTime: "12/08/2025 10:00:23",
    status: "待確認",
    paymentProof: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400",
  },
  {
    id: "TC000003",
    customer: "王先生",
    phone: "9825 3973",
    email: "XXXXX@126.com",
    package: "白金套餐",
    addons: "租務系統 | 會計系統",
    amount: "$1080",
    paymentMethod: "轉賬",
    paymentTime: "12/08/2025 10:00:23",
    status: "已支付",
  },
  {
    id: "TC000004",
    customer: "劉先生",
    phone: "9825 3973",
    email: "XXXXX@126.com",
    package: "鑽石套餐",
    addons: "租務系統 | 會計系統",
    amount: "$12080",
    paymentMethod: "",
    paymentTime: "",
    status: "未支付",
  },
  {
    id: "TC000005",
    customer: "陳先生",
    phone: "9825 3973",
    email: "XXXXX@126.com",
    package: "黃金套餐",
    addons: "租務系統 | 會計系統",
    amount: "$2080",
    paymentMethod: "轉賬",
    paymentTime: "12/08/2025 10:00:23",
    status: "待確認",
    paymentProof: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400",
  },
  {
    id: "TC000006",
    customer: "張先生",
    phone: "9825 3973",
    email: "XXXXX@126.com",
    package: "黃金套餐",
    addons: "租務系統 | 會計系統",
    amount: "$1080",
    paymentMethod: "轉賬",
    paymentTime: "12/08/2025 10:00:23",
    status: "已取消",
  },
  {
    id: "TC000007",
    customer: "張先生",
    phone: "9825 3973",
    email: "XXXXX@126.com",
    package: "黃金套餐",
    addons: "租務系統 | 會計系統",
    amount: "$1080",
    paymentMethod: "轉賬",
    paymentTime: "12/08/2025 10:00:23",
    status: "已支付",
  },
  {
    id: "TC000008",
    customer: "張先生",
    phone: "9825 3973",
    email: "XXXXX@126.com",
    package: "黃金套餐",
    addons: "租務系統 | 會計系統",
    amount: "$1080",
    paymentMethod: "轉賬",
    paymentTime: "12/08/2025 10:00:23",
    status: "已支付",
  },
  {
    id: "TC000009",
    customer: "張先生",
    phone: "9825 3973",
    email: "XXXXX@126.com",
    package: "黃金套餐",
    addons: "租務系統 | 會計系統",
    amount: "$1080",
    paymentMethod: "轉賬",
    paymentTime: "12/08/2025 10:00:23",
    status: "已支付",
  },
  {
    id: "TC000010",
    customer: "張先生",
    phone: "9825 3973",
    email: "XXXXX@126.com",
    package: "黃金套餐",
    addons: "租務系統 | 會計系統",
    amount: "$1080",
    paymentMethod: "轉賬",
    paymentTime: "12/08/2025 10:00:23",
    status: "已支付",
  },
];
