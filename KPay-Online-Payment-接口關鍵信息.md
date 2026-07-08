# KPay Online Payment Gateway 接口通訊規範 — 關鍵信息摘要

> 來源：https://online.payment.docs.kpay-group.com/ （v4，繁體中文版）
> 整理日期：2026-06-30

---

## 1. 概覽

KPay Online Payment Gateway 提供統一的線上收款接口。API 採用 REST 風格，JSON 數據格式，基於非對稱 **SHA256-RSA** 數字簽名，HTTP 報文頭統一為 `application/json;charset=UTF-8`。

### 服務地址
| 環境 | 地址 |
| --- | --- |
| 生產 (PROD) | `https://payment.kpay-group.com` |
| 測試 (UAT) | `https://payment.uat.kpay-group.com` |

### 接入模式
- **商戶模式**：商戶自行開發系統對接，資金直接結算到商戶結算賬戶。簽名使用**商戶私鑰**。
- **服務商模式**：由系統開發商/方案商協助中小商戶接入。簽名使用**應用私鑰**，且請求頭需額外帶 `K-App-Id`。

---

## 2. 認證與請求頭

| 請求頭 | 含義 |
| --- | --- |
| `K-Nonce-Str` | 32 位隨機字符串 |
| `K-Merchant-Code` | 商戶號（MID） |
| `K-Signature` | API 數字簽名字段 |
| `K-Timestamp` | 當前時間戳（毫秒） |
| `K-Language` | 語言（`zh_CN` / `zh_HK` / `en_US`） |
| `K-App-Id` | 應用 APPID（**僅服務商模式**） |

請求方式：`GET` / `POST`。

**符號約定**：M = 必須；O = 條件必須；C = 可選。

### RSA 密鑰（均 PKCS8 格式，由 KPay 提供）
- **商戶/開發者平台公鑰**：商戶用其校驗 KPay 回調簽名；加密上送的敏感字段（KPay 用平台私鑰解密）。
- **商戶/應用公鑰**：KPay 用其校驗商戶上送請求的簽名；加密下行敏感字段。
- **商戶/應用私鑰**：商戶用其對請求簽名；解密下行敏感字段。

> 注意：KPay ID 為 snowflake ID，無長整型語言（如 JavaScript）會有精度丟失問題。所有 BigDecimal 均保留兩位小數。

---

## 3. 數字簽名（SHA256withRSA）

### 構建簽名串（每行以 `\n` 結尾，包含最後一行）
**商戶模式：**
```
HTTP請求方法\n
URL\n
請求時間戳\n
請求隨機串\n
商戶編號\n
請求報文主體\n
```
**服務商模式**（在商戶編號後多一行 APPID）：
```
HTTP請求方法\n
URL\n
請求時間戳\n
請求隨機串\n
商戶編號\n
應用APPID\n
請求報文主體\n
```

要點：
- URL 為去除域名的絕對路徑；GET 帶參時末尾附 `?` + 查詢字符串。
- GET 報文主體為空；POST/PUT 用真實發送的 JSON。
- 簽名值 = 用私鑰對待簽名串做 SHA256withRSA，再 Base64 編碼。
- KPay 會拒絕時間戳過舊的請求 → 需保持系統時間準確。
- KPay 回調也會簽名（`K-Signature` / `K-Nonce-Str` / `K-Timestamp` 於回調 HTTP 頭），商戶**必須驗簽**。

---

## 4. 敏感信息加解密（RSA / OAEP）

- 算法：RSA 公鑰加密，填充方案 **RSAES-OAEP**。
- Java：`Cipher.getInstance("RSA/ECB/OAEPWithSHA-1AndMGF1Padding")`
- 其他：OpenSSL `RSA_PKCS1_OAEP_PADDING`；PHP `OPENSSL_PKCS1_OAEP_PADDING`；.NET `fOAEP=true`；Node.js `crypto.constants.RSA_PKCS1_OAEP_PADDING`；Go `EncryptOAEP`。
- 上送加密用**平台公鑰**（僅 KPay 私鑰可解）；下行密文用**商戶/應用私鑰**解密。
- 單次加密原文長度不能超過 **214 字節**。

---

## 5. 支付方式與接口端點

所有支付方式共用：下單 `POST /v1/order/add`、查詢 `GET /v1/order/sales/result`、關單 `POST /v1/order/close`、退款 `POST /v1/refund`。各方式喚起/掃碼端點如下。

### 全托管收銀台 (managed)
聚合收銀台，一個頁面展示多種已開通支付方式。
| 功能 | 端點 |
| --- | --- |
| 創建全託管訂單 | `POST /v1/managed/order/add` |
| Web 收銀台 | `GET /v1/web/managed/order` |
| H5 收銀台 | `GET /v1/h5/managed/order` |
| 查詢全託管訂單 | `GET /v1/managed/order/result` |
| 查詢交易訂單 | `GET /v1/order/sales/result` |
| 退貨 | `POST /v1/refund` |

### 微信支付 (wxpay)
| 場景 | 端點 |
| --- | --- |
| Web 收銀台 | `GET /v1/web/wxpay` |
| 二維碼（正掃） | `POST /v1/qr/sales/scan/wxpay` |
| H5 | `POST /v1/qr/sales/h5/wxpay` |
| App | `POST /v1/qr/sales/app/wxpay` |
| 小程序 | `POST /v1/qr/sales/minapp/wxpay` |
| 公眾號 | `POST /v1/qr/sales/public/wxpay` |

### 支付寶 (alipay)
Web `GET /v1/web/alipay`；掃碼 `POST /v1/qr/sales/scan/alipay`；H5 `POST /v1/qr/sales/h5/alipay`；App `POST /v1/qr/sales/app/alipay`。

### PayMe
Web `GET /v1/web/payme`；掃碼 `POST /v1/qr/sales/scan/payme`；H5 `POST /v1/qr/sales/h5/payme`；App `POST /v1/qr/sales/app/payme`。

### 銀聯雲閃付 (unionpay)
Web `GET /v1/web/unionpay`；掃碼 `POST /v1/qr/sales/scan/unionpay`。

### FPS
Web `GET /v1/web/fps`；掃碼 `POST /v1/qr/sales/scan/fps`；H5 `POST /v1/qr/sales/h5/fps`；App `POST /v1/qr/sales/app/fps`。

### 八達通 Online (octopus)
Web `GET /v1/web/octopus`；掃碼 `POST /v1/qr/sales/scan/octopus`；H5 `POST /v1/qr/sales/h5/octopus`；App `POST /v1/qr/sales/app/octopus`。（注意：八達通端點列表中未列退款。）

### Apple Pay
直連消費 `POST /v1/applepay/decrypt/sales/direct`；直連預授權 `POST /v1/applepay/decrypt/pre/auth/direct`；預授權調整/撤銷/完成同卡類預授權端點。

### 收款連結 (payment link)
`GET /v1/payment/link/info/page`。

### 對賬文件 (report)
`GET /v1/transaction/bill/download`（見第 7 節）。

---

## 6. 卡類（預授權 / CNP）

CNP = Card Not Present。涉及卡密信息需 **PCI 認證**；無 PCI 資質可走 KPay 託管收銀台（KPay CNP Hosted），由 KPay 頁面收集卡信息；有 PCI 資質可走 API 直連。

| 功能 | 端點 |
| --- | --- |
| 創建預授權訂單 | `POST /v1/order/add`（`orderType=CNP_PRE_AUTH`） |
| Web 預授權收銀台 | `GET /v1/web/pre/auth` |
| H5 預授權收銀台 | `GET /v1/h5/pre/auth` |
| 標記化（預授權）直連 | `POST /v1/cnp/token/pre/auth/direct` |
| 查詢交易訂單 | `GET /v1/order/sales/result` |
| 預授權調整 | `POST /v1/pre/auth/adjust` |
| 預授權撤銷 | `POST /v1/pre/auth/cancel` |
| 預授權完成（不支持部分完成） | `POST /v1/pre/auth/capture` |
| 預授權完成退貨 | `POST /v1/refund` |

要點：
- 預授權完成金額 `captureAmount`：若做過調整，須為最後一次調整金額，否則為下單金額。
- 提供 **iOS / Android SDK**（`KPayCore` + `CNP` 包），含 3DS 認證流程，依賴 Adyen 3ds2/redirect/action-core。
- 訂單有效期默認：`TOKEN_CREATE` 24 小時、`CNP_SALES_GATEWAY`/`CNP_PRE_AUTH` 30 分鐘、其他 10 分鐘。

---

## 7. 對賬文件

`GET /v1/transaction/bill/download`，參數 `billType`（`DAILY_BILL` / `MONTHLY_BILL`）+ `billDate`（日 `yyyyMMdd` / 月 `yyyyMM`）。

- 日賬單：每日 08:00 後可下載（前一日 00:00:00–23:59:59）。
- 月賬單：每月 1 日 08:00 後可下載。
- 每次下載間隔 ≥ 5 分鐘。
- 響應返回中/英文文件鏈接（`filePath` / `enFilePath`，**10 分鐘有效**），格式 `.xlsx`。
- 文件三部分：商戶基本信息、交易匯總信息、交易明細信息（含 KPay 交易號、訂單號、交易類型/狀態、金額、手續費、支付方式、錢包類型、清算日期等 26 個明細字段）。

---

## 8. 通知回調（Webhook）

兩類通知（`eventType`）：`SALES`（交易訂單結果）、`TOKEN`（標記化結果）。

規則與重試：
- `notifyUrl` 由下單時傳入，必須 **HTTPS**、可直接訪問、不可帶參數。
- 商戶須在 **4 秒**內返回 HTTP **200**（無需返回報文），否則視為失敗。
- 重試策略：失敗後立即連發 2 次；仍失敗按間隔重試 **1m、5m、10m、1h、2h、6h、6h、10h**；全部失敗則停止。
- **服務保護（自動降級）**：接入方持續通知失敗會觸發降級，KPay 關閉其 Webhook 重發，需聯繫 KPay 解除。
- 同一通知可能重複發送 → 接入方須**冪等處理**（先查狀態、加數據鎖）。
- 若最終未收到回調，應主動調用查詢訂單 API 確認狀態。

**安全提醒**：必須驗簽，並校驗回調訂單金額與本地一致，防止「假通知」造成資金損失。

`SALES` 通知關鍵字段：`eventType`、`merchantCode`、`outTradeNo`、`orderNo`、`transactionNo`、`payMethodId`、`transactionTypeId`、`payAmount`/`payCurrency`、`transactionState`（1 待處理 / 2 成功 / 3 失敗 / 4 已退貨 / 5 已撤銷）、`transactionFinishTime`，可選 `billInfo`/`deliveryInfo`/`cardInfo`。

---

## 9. 應答碼

### 通用
| 碼 | 含義 |
| --- | --- |
| 10000 | 成功 |
| 10001 | 參數無效 |
| 40001 | 認證失敗 |
| 40002 | 簽名無效 |
| 40003 | 訪問未授權 |
| 40005 | 客戶端版本過低 |
| 40007 | 請求標頭信息不完整 |
| 40009 | 請求標頭時間戳超出限制 |
| 50001 | 未知錯誤 |
| 50002 | 請求方式錯誤 |
| 50003 | HTTP 數據不能讀取異常 |
| 50004 | 媒體類型不支持 |
| 50113 | 數據解密失敗 |

### 業務（常見）
1003 訂單已關閉 · 1004 訂單已過期 · 1006 原訂單不存在 · 1021 支付失敗 · 1023 支付方式未開通 · 1031–1035 Token 不可用/過期/重複/金額不符/幣種不符 · 29522 退貨金額不能大於交易金額 · 29523 退貨金額不能大於商戶當日交易金額 · 29529 二維碼已過期 · 30006 商戶訂單號已存在 · 64033 應用開通狀態已失效 · 86037 開發者應用信息不存在。（完整 60+ 業務碼見原文檔 `extra/status_code`）

---

## 10. 屬性編碼（枚舉速查）

**訂單類型 (Order Type)**：`CNP_SALES_GATEWAY` 消費-網關託管、`CNP_PRE_AUTH` 預授權（及 `_ADJUST`/`_CANCEL`/`_COMPLETE`）、`CNP_APPLEPAY`、`CNP_GOOGLEPAY`、`TOKEN_CREATE` 標記化、`WXPAY_SALE_QR/H5/APP`、`ALIPAY_SALE_QR/H5/APP`、`UNIONPAY_SALE_QR`、`PAYME_SALE_QR/H5/APP`、`FPS_SALE_QR/H5/APP`、`OCTOPUS_SALE_QR/H5/APP` 等。

**交易狀態 (Transaction State)**：1 待處理 / 2 成功 / 3 失敗 / 4 已退貨 / 5 已撤銷 / 6 已關閉。

**支付方式 (Pay Method ID)**：1 Visa · 2 Mastercard · 3 中國銀聯 · 4 微信 · 5 支付寶 · 6 Amex · 7 Diners · 8 JCB · 9 銀聯雲閃付 · 11 八達通 · 12 PayMe · 14 FPS。

**錢包類型**：`ALIPAY_HK`/`ALIPAY_CN`/`WECHATPAY_HK`/`WECHATPAY_CN`。

**通知類型 (Event Type)**：`SALES` / `TOKEN`。

**語言**：`zh_CN` 簡體 / `zh_HK` 繁體 / `en_US` 英文。

**收銀台頁面功能控制 (Page Feature Controls)**：`HIDE_REMAINING_PAYMENT_TIME`、`HIDE_ORDER_ITEM_DETAILS_BUTTON`、`HIDE_BIND_CARD_PAY_BUTTON`、`HIDE_EMAIL_ADDRESS`、`HIDE_BILL_INFORMATION`。

**支付方式順序 (Pay Method Order)**：`CARD`、`ALIPAYCN`、`ALIPAYHK`、`WXPAY`、`UNIONPAY`、`PAYME`、`FPS`、`APPLEPAY`、`GOOGLEPAY`、`OCTOPUS`（按傳參順序展示，須已開通）。

**環境 (Environment, 用於 3DS)**：`TEST`、`LIVE_EU`、`LIVE_US`、`LIVE_AU`、`LIVE_APSE`、`LIVE_IN`。

**賬單類型**：`DAILY_BILL` / `MONTHLY_BILL`。

（電話區號、國家/地區 ID、省份 ID、卡組織等完整對照表見原文檔 `extra/properties`。）

---

## 11. 常見問題（FAQ 重點）

- **PayMe UAT 測試**：按金額小數位模擬 —— `xx.81` 成功、`xx.77` 失敗、`xx.82` 超時（生產用真實 PayMe app）。
- **40002 簽名無效**：多因密鑰與模式不符（服務商模式須用應用私鑰）、用錯商戶密鑰、簽名串遺漏參數（尤其服務商模式漏 APPID）。
- **403 錯誤**：UAT/生產均有防火牆白名單，需向 KPay 提供出口 IP 加白名單。
- **「開發者應用資訊不存在」**：需 KPay 在 KConnect 完成權限配置。
- **退貨失敗（金額超限）**：當日待結算金額 = 當日交易金額 − 當日手續費 − 本次退貨手續費；測試環境可先刷一筆大額交易。
- **無效金額**：金額低於閾值（如低於手續費）；UAT 建議 ≥ HKD 1.5，生產無此限制。

---

## 12. 版本記錄（摘要）

- **v4.0**：API 列表結構重整；CNP/標記化合併為銀行卡支付（立即支付/綁卡支付，分 KPay CNP Hosted 與 KPay CNP API）；各支付方式獨立展示；全部接口增加生產地址；新增**收款連結 API** 與**卡類（預授權）API**（收銀台/調整/撤銷/完成）。
- **v3.0**：新增 PayMe（掃碼/H5/App）、全託管訂單類、Apple Pay；新增 `orderState`、`discountAmount`、`managedOrderNo` 等字段。
- **v2.0**：新增服務商對接模式；優化回調重試；回調新增 `billInfo`/`deliveryInfo`/`cardInfo`。
- **v1.1**：新增支付寶/微信/銀聯掃碼類、對賬文件 API、收銀台多語言；下線交易撤銷功能。
- **v1.0**：通用類/託管/直連/通知回調基礎接口。
