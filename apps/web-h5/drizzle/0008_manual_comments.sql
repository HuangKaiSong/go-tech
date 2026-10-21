-- Drizzle 的 MySQL schema 暂不支持注释，通过独立迁移补齐，兼容已执行 0007 的环境。
-- MODIFY COLUMN 保留原类型、默认值、可空性及自增设置，不修改业务数据。
ALTER TABLE `manual_category`
  MODIFY COLUMN `id` int unsigned AUTO_INCREMENT NOT NULL COMMENT '操作手册主题主键',
  MODIFY COLUMN `version` int NOT NULL DEFAULT 1 COMMENT '记录版本号，每次写入递增，用于乐观并发控制',
  MODIFY COLUMN `draft` json NOT NULL COMMENT '主题草稿：名称、说明、图标及排序，保存不影响公开版本',
  MODIFY COLUMN `published` json COMMENT '已发布主题快照，NULL 表示未发布或已下架',
  MODIFY COLUMN `published_version` int COMMENT '发布快照对应的记录版本，下架时置 NULL',
  MODIFY COLUMN `published_at` datetime COMMENT '最近一次发布时间，UTC，下架时置 NULL',
  MODIFY COLUMN `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '最近修改时间，应用写入 UTC 时间',
  MODIFY COLUMN `updated_by` int unsigned NOT NULL COMMENT '最近修改的管理员 ID，0 表示初始化脚本',
  MODIFY COLUMN `locked_slug` varchar(120) COMMENT '共用记录结构的预留字段，主题固定为 NULL',
  COMMENT = '操作手册主题：分别保存草稿与发布快照，下架后隐藏关联指南';
--> statement-breakpoint
ALTER TABLE `manual_article`
  MODIFY COLUMN `id` int unsigned AUTO_INCREMENT NOT NULL COMMENT '操作手册指南主键',
  MODIFY COLUMN `version` int NOT NULL DEFAULT 1 COMMENT '记录版本号，每次写入递增，用于乐观并发控制',
  MODIFY COLUMN `draft` json NOT NULL COMMENT '指南草稿：标题、摘要、主题、排序、URL 标识及带版本的富文本正文',
  MODIFY COLUMN `published` json COMMENT '已发布指南的完整快照，NULL 表示未发布或已下架',
  MODIFY COLUMN `published_version` int COMMENT '发布快照对应的记录版本，下架时置 NULL',
  MODIFY COLUMN `published_at` datetime COMMENT '最近一次发布时间，UTC，下架时置 NULL',
  MODIFY COLUMN `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '最近修改时间，应用写入 UTC 时间',
  MODIFY COLUMN `updated_by` int unsigned NOT NULL COMMENT '最近修改的管理员 ID，0 表示初始化脚本',
  MODIFY COLUMN `locked_slug` varchar(120) COMMENT '首次发布时锁定的 URL 标识，下架后仍保留，未发布为 NULL',
  MODIFY COLUMN `slug` varchar(120) NOT NULL COMMENT '指南唯一 URL 标识，与草稿同步，首次发布后禁止修改',
  MODIFY COLUMN `category_id` int unsigned NOT NULL COMMENT '草稿所属主题 ID，引用 manual_category.id，阻止删除仍被草稿引用的主题',
  MODIFY COLUMN `published_category_id` int unsigned COMMENT '公开快照所属主题 ID，下架时置 NULL，与草稿主题独立维护',
  COMMENT = '操作手册指南：草稿与发布版本隔离，保留首次发布的 URL 标识';
--> statement-breakpoint
ALTER TABLE `manual_settings`
  MODIFY COLUMN `id` int unsigned AUTO_INCREMENT NOT NULL COMMENT '首页设置单例 ID，固定为 1，同时作为初始化标记和全局写入锁',
  MODIFY COLUMN `version` int NOT NULL DEFAULT 1 COMMENT '记录版本号，每次写入递增，用于乐观并发控制',
  MODIFY COLUMN `draft` json NOT NULL COMMENT '首页文案草稿：主副标题、搜索占位文案及支援区文案',
  MODIFY COLUMN `published` json COMMENT '已发布的首页文案快照，初始化后不允许下架或删除',
  MODIFY COLUMN `published_version` int COMMENT '发布快照对应的记录版本，用于识别发布状态',
  MODIFY COLUMN `published_at` datetime COMMENT '最近一次发布时间，UTC',
  MODIFY COLUMN `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '最近修改时间，应用写入 UTC 时间',
  MODIFY COLUMN `updated_by` int unsigned NOT NULL COMMENT '最近修改的管理员 ID，0 表示初始化脚本',
  MODIFY COLUMN `locked_slug` varchar(120) COMMENT '共用记录结构的预留字段，首页设置固定为 NULL',
  COMMENT = '操作手册首页设置：ID 为 1 的单例，兼作幂等初始化标记和写入串行化锁';
