CREATE TABLE IF NOT EXISTS `fb_category` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`name` varchar(32) NOT NULL COMMENT '租務部/場務部/會計部/客服/系統設定/其他',
	`description` varchar(255) NOT NULL DEFAULT '',
	`icon` varchar(32) NOT NULL DEFAULT '',
	`sort_order` int NOT NULL DEFAULT 0,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `fb_category_id` PRIMARY KEY(`id`),
	CONSTRAINT `uk_category_name` UNIQUE(`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='主題分類';
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `fb_sub_category` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`category_id` int unsigned NOT NULL,
	`name` varchar(32) NOT NULL,
	`sort_order` int NOT NULL DEFAULT 0,
	CONSTRAINT `fb_sub_category_id` PRIMARY KEY(`id`),
	CONSTRAINT `uk_sub_cat_name` UNIQUE(`category_id`,`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='子分類';
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `fb_comment` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`feature_id` bigint unsigned NOT NULL,
	`parent_id` bigint unsigned COMMENT '回复的留言 null 表示一级留言',
	`author_id` bigint NOT NULL,
	`content` text NOT NULL,
	`is_official` boolean NOT NULL DEFAULT false COMMENT '官方回覆（深色氣泡）',
	`is_visible` boolean NOT NULL DEFAULT true,
	`hidden_at` datetime,
	`hidden_by` bigint unsigned,
	`hidden_reason` varchar(255),
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	`deleted_at` datetime,
	`deleted_by` bigint unsigned,
	CONSTRAINT `fb_comment_id` PRIMARY KEY(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='留言/官方回覆';
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `fb_feature` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`title` varchar(160) NOT NULL,
	`description` text NOT NULL,
	`category_id` int unsigned NOT NULL,
	`sub_category_id` int unsigned,
	`author_id` bigint NOT NULL,
	`status` enum('pending','developing','shipped') NOT NULL DEFAULT 'pending' COMMENT '待評估/開發中/已完成',
	`like_count` int unsigned NOT NULL DEFAULT 0 COMMENT '点赞計數，來源 fb_vote',
	`comment_count` int unsigned NOT NULL DEFAULT 0 COMMENT '评论計數，來源 fb_comment',
	`shipped_at` date,
	`version` varchar(24),
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	`deleted_at` datetime,
	CONSTRAINT `fb_feature_id` PRIMARY KEY(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='需求建議';
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `fb_vote` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`feature_id` bigint unsigned NOT NULL comment '需求建议ID',
	`user_id` bigint NOT NULL comment '用户ID',
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `fb_vote_id` PRIMARY KEY(`id`),
	CONSTRAINT `uk_vote` UNIQUE(`feature_id`,`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='需求建议点赞表';
--> statement-breakpoint
ALTER TABLE `fb_sub_category` ADD CONSTRAINT `fb_sub_category_category_id_fb_category_id_fk` FOREIGN KEY (`category_id`) REFERENCES `fb_category`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fb_comment` ADD CONSTRAINT `fb_comment_feature_id_fb_feature_id_fk` FOREIGN KEY (`feature_id`) REFERENCES `fb_feature`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fb_comment` ADD CONSTRAINT `fb_comment_author_id_platform_customer_id_fk` FOREIGN KEY (`author_id`) REFERENCES `platform_customer`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fb_comment` ADD CONSTRAINT `fk_comment_parent` FOREIGN KEY (`parent_id`) REFERENCES `fb_comment`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fb_feature` ADD CONSTRAINT `fb_feature_category_id_fb_category_id_fk` FOREIGN KEY (`category_id`) REFERENCES `fb_category`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fb_feature` ADD CONSTRAINT `fb_feature_sub_category_id_fb_sub_category_id_fk` FOREIGN KEY (`sub_category_id`) REFERENCES `fb_sub_category`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fb_feature` ADD CONSTRAINT `fb_feature_author_id_platform_customer_id_fk` FOREIGN KEY (`author_id`) REFERENCES `platform_customer`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fb_vote` ADD CONSTRAINT `fb_vote_feature_id_fb_feature_id_fk` FOREIGN KEY (`feature_id`) REFERENCES `fb_feature`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fb_vote` ADD CONSTRAINT `fb_vote_user_id_platform_customer_id_fk` FOREIGN KEY (`user_id`) REFERENCES `platform_customer`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_comment_feature` ON `fb_comment` (`feature_id`,`deleted_at`,`is_visible`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_comment_parent` ON `fb_comment` (`parent_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_feature_cat_status` ON `fb_feature` (`category_id`,`status`,`like_count`);--> statement-breakpoint
CREATE INDEX `idx_feature_sub` ON `fb_feature` (`sub_category_id`);--> statement-breakpoint
CREATE INDEX `idx_feature_created` ON `fb_feature` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_feature_author` ON `fb_feature` (`author_id`);--> statement-breakpoint
CREATE INDEX `idx_vote_user` ON `fb_vote` (`user_id`);
