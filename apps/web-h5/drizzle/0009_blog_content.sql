CREATE TABLE `blog_article` (
	`id` int unsigned AUTO_INCREMENT NOT NULL COMMENT '记录主键，自增编号；页面设置固定为 1',
	`version` int unsigned NOT NULL DEFAULT 1 COMMENT '并发版本，每次保存、发布或下架递增',
	`draft` json NOT NULL COMMENT '可编辑草稿 JSON，修改不影响前台',
	`published` json COMMENT '已发布快照 JSON；NULL 表示不公开',
	`published_version` int unsigned COMMENT '当前发布快照对应的版本号',
	`published_at` datetime COMMENT '最近一次发布时间，UTC；下架时清空',
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '最近一次写入时间，UTC',
	`updated_by` int unsigned NOT NULL COMMENT '最近修改的管理员 ID；初始化使用 0',
	`locked_slug` varchar(120) COMMENT '首次发布时锁定的 URL 标识；下架后仍保留',
	`publication_state` enum('draft','published','offline') NOT NULL DEFAULT 'draft' COMMENT '管理状态：draft 草稿、published 已发布、offline 已下架',
	`is_published` boolean NOT NULL DEFAULT false COMMENT '是否已发布，供公开查询及索引使用',
	`slug` varchar(120) NOT NULL COMMENT '文章唯一 URL 标识，首次发布后不可修改',
	`category_id` int unsigned NOT NULL COMMENT '草稿分类外键，删除分类时检查引用',
	`published_category_id` int unsigned COMMENT '发布版分类外键，仅发布时同步，下架时清空',
	`title` varchar(200) COMMENT '发布版标题，供关键词搜索使用',
	`excerpt` varchar(2000) COMMENT '发布版摘要，供关键词搜索使用',
	`is_featured` boolean NOT NULL DEFAULT false COMMENT '发布版精选标记，仅发布时同步',
	`sort_order` int unsigned NOT NULL DEFAULT 0 COMMENT '发布版排序值，越小越靠前',
	`display_date` date COMMENT '发布版展示日期，按日期降序展示',
	CONSTRAINT `blog_article_id` PRIMARY KEY(`id`),
	CONSTRAINT `uk_blog_article_slug` UNIQUE(`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_bin COMMENT='博客文章草稿与发布快照';
--> statement-breakpoint
CREATE TABLE `blog_article_tag` (
	`article_id` int unsigned NOT NULL COMMENT '已发布文章外键，文章删除时级联删除关联',
	`tag_id` int unsigned NOT NULL COMMENT '发布标签外键，按标签查询文章的关联键',
	CONSTRAINT `blog_article_tag_article_id_tag_id_pk` PRIMARY KEY(`article_id`,`tag_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_bin COMMENT='博客已发布文章标签关联';
--> statement-breakpoint
CREATE TABLE `blog_category` (
	`id` int unsigned AUTO_INCREMENT NOT NULL COMMENT '记录主键，自增编号；页面设置固定为 1',
	`version` int unsigned NOT NULL DEFAULT 1 COMMENT '并发版本，每次保存、发布或下架递增',
	`draft` json NOT NULL COMMENT '可编辑草稿 JSON，修改不影响前台',
	`published` json COMMENT '已发布快照 JSON；NULL 表示不公开',
	`published_version` int unsigned COMMENT '当前发布快照对应的版本号',
	`published_at` datetime COMMENT '最近一次发布时间，UTC；下架时清空',
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '最近一次写入时间，UTC',
	`updated_by` int unsigned NOT NULL COMMENT '最近修改的管理员 ID；初始化使用 0',
	`locked_slug` varchar(120) COMMENT '首次发布时锁定的 URL 标识；下架后仍保留',
	`publication_state` enum('draft','published','offline') NOT NULL DEFAULT 'draft' COMMENT '管理状态：draft 草稿、published 已发布、offline 已下架',
	`is_published` boolean NOT NULL DEFAULT false COMMENT '是否已发布，供公开查询及索引使用',
	CONSTRAINT `blog_category_id` PRIMARY KEY(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_bin COMMENT='博客分类草稿与发布快照';
--> statement-breakpoint
CREATE TABLE `blog_settings` (
	`id` int unsigned AUTO_INCREMENT NOT NULL COMMENT '记录主键，自增编号；页面设置固定为 1',
	`version` int unsigned NOT NULL DEFAULT 1 COMMENT '并发版本，每次保存、发布或下架递增',
	`draft` json NOT NULL COMMENT '可编辑草稿 JSON，修改不影响前台',
	`published` json COMMENT '已发布快照 JSON；NULL 表示不公开',
	`published_version` int unsigned COMMENT '当前发布快照对应的版本号',
	`published_at` datetime COMMENT '最近一次发布时间，UTC；下架时清空',
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '最近一次写入时间，UTC',
	`updated_by` int unsigned NOT NULL COMMENT '最近修改的管理员 ID；初始化使用 0',
	`locked_slug` varchar(120) COMMENT '首次发布时锁定的 URL 标识；下架后仍保留',
	`publication_state` enum('draft','published','offline') NOT NULL DEFAULT 'draft' COMMENT '管理状态：draft 草稿、published 已发布、offline 已下架',
	`is_published` boolean NOT NULL DEFAULT false COMMENT '是否已发布，供公开查询及索引使用',
	CONSTRAINT `blog_settings_id` PRIMARY KEY(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_bin COMMENT='博客页面文案单例';
--> statement-breakpoint
CREATE TABLE `blog_tag` (
	`id` int unsigned AUTO_INCREMENT NOT NULL COMMENT '记录主键，自增编号；页面设置固定为 1',
	`name` varchar(80) NOT NULL COMMENT '首次建立时的标签展示名称',
	`normalized_name` varchar(160) NOT NULL COMMENT 'NFKC 规范化、去首尾空白及小写后的标签去重键',
	CONSTRAINT `blog_tag_id` PRIMARY KEY(`id`),
	CONSTRAINT `uk_blog_tag_name` UNIQUE(`normalized_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_bin COMMENT='博客发布标签字典';
--> statement-breakpoint
ALTER TABLE `blog_article` ADD CONSTRAINT `blog_article_category_id_blog_category_id_fk` FOREIGN KEY (`category_id`) REFERENCES `blog_category`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `blog_article` ADD CONSTRAINT `blog_article_published_category_id_blog_category_id_fk` FOREIGN KEY (`published_category_id`) REFERENCES `blog_category`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `blog_article_tag` ADD CONSTRAINT `blog_article_tag_article_id_blog_article_id_fk` FOREIGN KEY (`article_id`) REFERENCES `blog_article`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `blog_article_tag` ADD CONSTRAINT `blog_article_tag_tag_id_blog_tag_id_fk` FOREIGN KEY (`tag_id`) REFERENCES `blog_tag`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_blog_public_order` ON `blog_article` (`is_published`,is_featured desc,`sort_order`,display_date desc,id desc);--> statement-breakpoint
CREATE INDEX `idx_blog_category_order` ON `blog_article` (`published_category_id`,`is_published`,is_featured desc,`sort_order`,display_date desc,id desc);--> statement-breakpoint
CREATE INDEX `idx_blog_admin_state` ON `blog_article` (`publication_state`,`updated_at`,`id`);--> statement-breakpoint
CREATE INDEX `idx_blog_tag_article` ON `blog_article_tag` (`tag_id`,`article_id`);
