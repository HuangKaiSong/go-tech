CREATE TABLE `fb_aide_sync_job` (
	`feature_id` bigint unsigned NOT NULL,
	`revision` int unsigned NOT NULL DEFAULT 1,
	`attempts` int unsigned NOT NULL DEFAULT 0,
	`available_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`locked_at` datetime,
	`last_error` text,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `fb_aide_sync_job_feature_id` PRIMARY KEY(`feature_id`)
);
--> statement-breakpoint
CREATE INDEX `idx_aide_sync_available` ON `fb_aide_sync_job` (`available_at`,`locked_at`);