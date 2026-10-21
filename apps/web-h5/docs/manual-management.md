# 操作手冊內容管理

前台 `/manual` 和 `/manual/:slug` 從 MySQL 讀取已發佈快照。後台 `web-admin` 的「操作手冊」選單（`/manual`）管理主題、指南、首頁文案，提供可視化富文本、草稿預覽及發佈。

## 部署與初始化

在應用所在環境，從倉庫根目錄按順序執行：

```bash
pnpm --filter web-h5 exec tsx migrate.ts --check
pnpm --filter web-h5 db:migrate
pnpm --filter web-h5 db:seed:manual
pnpm --filter @go-tech/manual-content build
pnpm --filter web-h5 build
pnpm --filter web-admin build
```

遷移 `0007_manual_content` 新增 `manual_category`、`manual_article`、`manual_settings`，不更改其他業務表。
後續 `0008_manual_comments` 為這 3 張表及全部 30 個欄位補齊資料庫註解，已執行建表遷移的環境也可直接追加執行。
目前 Drizzle MySQL 不支援在 schema 宣告持久化註解，因此實際註解由該 SQL 遷移維護，schema 原始碼同步提供欄位說明。初始化使用事務建立現有 6 個主題、8 篇指南及首頁文案，保留原 URL 和步驟內容。首頁設定單例作為初始化標記；再次執行不覆蓋編輯結果，也不復原已刪除的指南。`updatedBy = 0` 表示初始化內容。

必須先完成遷移、初始化，再發布新版應用。資料庫未配置、未遷移或未初始化時，前台顯示載入失敗及重試入口，不會顯示舊靜態指南。不要以刪除初始化標記的方式重置內容。

管理 API 復用既有管理員 HS512 JWT 驗證，需配置 `PLATFORM_JWT_SECRET` 並能查詢有效的管理員。圖片沿用後台 `/api/pms-resource/web-back/minio/upload` 代理。生產環境需要保留 `/h5-hook` 到 H5 服務的代理，以及既有資源服務代理。

## 編輯與發佈

- 儲存草稿不改變已發佈版本；預覽會重新讀取經管理員認證的草稿。
- 「發佈」以事務將已儲存草稿複製為公開快照。新指南必須先發佈其所屬主題。
- 排序按 `sortOrder` 由小至大，再按 ID 排序；調整排序也需要儲存並發佈。
- 主題下架會隱藏其所有指南，重新發佈主題後仍已發佈的指南重新可見。
- 主題刪除會檢查指南草稿及公開版本的關聯；遷移指南後須再次發佈，才能解除原公開版本的關聯。
- 指南首次發佈後永久鎖定該記錄的 URL 標識，下架後仍不能更改。
- 刪除指南會同時移除草稿和公開版本；此功能不提供歷史版本或回收站。
- 每次寫入帶目前版本；版本衝突回傳 409，不覆蓋其他管理員的修改。重新載入前可保留本地文字另存。

## API 與內容契約

`GET /api/admin/manual` 回傳 `{ code: 200, data: { categories, articles, settings } }`，每筆記錄包含草稿、公開快照、版本、修改人和時間。

`POST /api/admin/manual` 接收：

```json
{
  "kind": "article",
  "action": "save",
  "id": 1,
  "version": 3,
  "draft": {}
}
```

`kind` 為 `article | category | settings`，`action` 為 `create | save | publish | unpublish | delete`。`create` 不需 ID/版本；`create` 和 `save` 需要相應類型的完整 `draft`。首頁設定僅允許 `save | publish`。成功回傳新的管理資料，以及操作記錄的 `savedId`（刪除除外）。後台透過 `/h5-hook/api/admin/manual` 呼叫。

`GET /api/manual` 和 `GET /api/manual/:slug` 僅回傳公開內容，均禁用 HTTP 快取。草稿、未發佈或已隱藏指南的詳情回傳 404。頁面使用請求內查詢去重，不使用跨請求資料快取；發佈同時使手冊路由失效，新請求可讀到最新版本。

富文本契約及渲染共用 `@go-tech/manual-content`。正文為 `{ version: 1, doc: ... }`，服務端檢查節點種類、結構、大小、連結及圖片替代文字；不接收任意 HTML。圖片只允許 HTTP(S) 或站內路徑，不能使用 Base64、腳本或協定相對網址。前台不載入編輯器。目錄以正文二/三級標題建立獨立編號錨點，即使標題重複也可正確跳轉。

## 驗證

```bash
pnpm --filter @go-tech/manual-content test
pnpm --filter @go-tech/manual-content typecheck
pnpm --filter web-h5 exec vitest run lib/manual app/api/admin/manual/route.test.ts
pnpm --filter web-admin exec vitest run src/pages/manual
pnpm --filter web-h5 type-check
pnpm --filter web-admin type-check
```

自動化測試覆蓋內容安全、發佈隔離、認證、版本衝突、URL 鎖定、主題刪除限制、初始化重跑與後台草稿/預覽/發佈流程。資料庫執行使用測試替身；部署環境另需驗證遷移、重啟後持久化和實際 MinIO 圖片上傳。
