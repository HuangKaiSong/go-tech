CREATE TABLE `manual_article` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`version` int NOT NULL DEFAULT 1,
	`draft` json NOT NULL,
	`published` json,
	`published_version` int,
	`published_at` datetime,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_by` int unsigned NOT NULL,
	`locked_slug` varchar(120),
	`slug` varchar(120) NOT NULL,
	`category_id` int unsigned NOT NULL,
	`published_category_id` int unsigned,
	CONSTRAINT `manual_article_id` PRIMARY KEY(`id`),
	CONSTRAINT `manual_article_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `manual_category` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`version` int NOT NULL DEFAULT 1,
	`draft` json NOT NULL,
	`published` json,
	`published_version` int,
	`published_at` datetime,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_by` int unsigned NOT NULL,
	`locked_slug` varchar(120),
	CONSTRAINT `manual_category_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `manual_settings` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`version` int NOT NULL DEFAULT 1,
	`draft` json NOT NULL,
	`published` json,
	`published_version` int,
	`published_at` datetime,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_by` int unsigned NOT NULL,
	`locked_slug` varchar(120),
	CONSTRAINT `manual_settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `manual_article` ADD CONSTRAINT `manual_article_category_id_manual_category_id_fk` FOREIGN KEY (`category_id`) REFERENCES `manual_category`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `manual_article` ADD CONSTRAINT `manual_article_published_category_id_manual_category_id_fk` FOREIGN KEY (`published_category_id`) REFERENCES `manual_category`(`id`) ON DELETE restrict ON UPDATE no action;