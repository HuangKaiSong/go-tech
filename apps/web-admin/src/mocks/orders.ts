import { OrderTypeEnum } from "@/constants/order"
import { PayTypeEnum } from "@/constants/payment"

export interface Order {
  "id": 1
  "orderNo": string
  "custCode": string
  "custName": string
  "custPhone": string
  "custEmail": string
  "orderType": OrderTypeEnum
  "originalOrder"?: any
  "orderAmount": number
  "discountRate": number
  "discountAmount": number
  "finalAmount": number
  "payType": PayTypeEnum
  "payEvidence": string
  "payTime"?: string
  "orderStatus": number
  "createUser": number
  "createTime": string
  "orderItems"?: any
  packageName: string
}

export interface OrderDetail {
  "id": number
  "orderNo": string
  "custCode": string
  "custName": string
  "custPhone": string
  "custEmail": string
  "orderType": OrderTypeEnum
  "originalOrder": null
  "orderAmount": number
  "discountRate": number
  "discountAmount": number
  "finalAmount": number
  "payType": number
  "payEvidence": string
  "payTime": PayTypeEnum
  "orderStatus": number
  "createUser": number
  "createTime": string
  "orderItems": {
    "id": number
    "orderId": number
    "packageId": number
    "itemType": number
    "itemName": string
    "price": number
    "count": number
    "amount": number
  }[]
  platformPackageDto: {
    "id": number
    "packageName": string
    "unitCount": number
    "price": number
    "addUnitPrice": number
    "rentSysPrice": number
    "venueSysPrice": number
    "accountingSysPrice": number
    "custServiceSysPrice": number
    "status": number
    packageItemList: {
      "id": number
      "packageId": number
      "menuId": number
      "menuTitle": string
      "menuIcon": string
      level: number
    }[]
  }
}