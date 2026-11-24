# 翻译数据持久化

动态翻译词典 `dynamic.json` 和待审核文本 `pending.json` 由服务端写入。开发环境默认读写
`apps/web-h5/translations`；生产环境可用 `H5_TRANSLATIONS_DIR` 指定单独的可写目录。

`Dockerfile.h5` 将初始翻译文件复制到 `/app/data/translations` 并交给 `node` 用户管理。
`compose.h5.test.yaml` 将 `h5_translations` 命名卷挂载到该目录。首次创建卷时，Docker 会用镜像中的初始文件填充；
之后后台改动和自动翻译结果保存在卷内，容器重建时仍会保留。不要把宿主机源码目录直接挂到运行时写入路径，
否则宿主机文件权限可能阻止非 root 的 `node` 用户原子替换词典文件。
