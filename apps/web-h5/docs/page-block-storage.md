# 页面区块持久化

首页等页面与 `/api/page-blocks` 统一读写 `H5_PAGE_BLOCKS_DIR`。该变量仅供服务端使用，必须是绝对路径。

## PM2 / standalone

通过 `scripts/start-standalone.cjs` 启动时，默认目录是 `apps/web-h5/data/page-blocks`，位于 `.next` 之外。
首次启动按以下顺序补齐缺失的 JSON，不覆盖持久目录中已有的文件：

1. 旧 `.next/standalone/apps/web-h5/public/page-blocks`，保留后台编辑结果。
2. 源码 `public/page-blocks`，作为新页面的初始模板。

应用 build 脚本会在 Next.js 清理 `.next` 之前执行同样的迁移，根目录 `pnpm build:h5` 还会在 Turbo 恢复缓存前迁移。
首次升级前仍应备份旧运行目录的
`public/page-blocks`；若部署工具在 build 之前就删除旧发布目录，应先将备份迁移到持久目录。
PM2 重启和后续构建不会覆盖持久目录。部署工具也需要保留该目录；使用每次新建的发布目录时，设置
`H5_PAGE_BLOCKS_DIR` 指向所有版本共用的绝对路径。

首次迁移时使用 `pnpm build:h5`，或在自定义构建命令前执行 `node apps/web-h5/scripts/prepare-page-blocks.cjs`。

若要采用源码中的某次内容修改，应有选择地更新持久目录里的对应 JSON。不要再手工同步到 `.next`。
运行期间替换 JSON 建议先写同目录临时文件，再重命名，避免请求读到未写完的内容。

## Docker

`compose.h5.test.yaml` 使用 `h5_page_blocks` 命名卷挂载 `/app/data/page-blocks`。
首次请求从容器的 `public/page-blocks` 补齐缺失配置，之后读写持久卷。保留原有 public 挂载用于初始化迁移。
不要删除该数据卷；单独运行镜像时也应配置 `H5_PAGE_BLOCKS_DIR` 和可写持久卷，卷目录需允许 node 用户写入。

## 开发与后台保存

开发环境默认使用应用当前目录下的 `data/page-blocks`，首次读取时从 `public/page-blocks` 初始化。
该目录不参与 Git 提交与镜像构建。初始化后修改 public 模板不会覆盖已保存内容。

后台继续向 `/h5-hook/api/page-blocks` 发送保存请求，无需修改代理地址。保存成功后刷新页面即可读取新内容；
失败时显示错误提示。页面读取与保存接口均使用持久目录，接口成功响应中的 path 指向读取 API。
`public/page-blocks/*.json` 静态地址仅代表发布模板或历史副本，不作为实时配置接口使用。
