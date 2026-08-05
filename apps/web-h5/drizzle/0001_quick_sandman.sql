ALTER TABLE `fb_comment` DROP FOREIGN KEY `fb_comment_author_id_platform_customer_id_fk`;
--> statement-breakpoint
CREATE INDEX `idx_comment_author_official` ON `fb_comment` (`author_id`,`is_official`);