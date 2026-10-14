CREATE TABLE `monitor_import_items` (
	`source_hash` char(64) NOT NULL,
	`file_id` char(36) NOT NULL,
	`content_hash` char(64),
	`run_id` char(36) NOT NULL,
	`status` varchar(32) NOT NULL,
	`error_class` varchar(32),
	`checked_at_ms` bigint NOT NULL,
	CONSTRAINT `monitor_import_items_source_hash_file_id_pk` PRIMARY KEY(`source_hash`,`file_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
--> statement-breakpoint
CREATE TABLE `monitor_import_runs` (
	`id` char(36) NOT NULL,
	`source_hash` char(64) NOT NULL,
	`started_at_ms` bigint NOT NULL,
	`completed_at_ms` bigint,
	`status` varchar(16) NOT NULL,
	CONSTRAINT `monitor_import_runs_id` PRIMARY KEY(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
--> statement-breakpoint
CREATE TABLE `monitor_report_payloads` (
	`report_id` char(36) NOT NULL,
	`payload_json` json NOT NULL,
	`auth_ciphertext` mediumtext,
	`auth_key_version` varchar(32),
	CONSTRAINT `monitor_report_payloads_report_id` PRIMARY KEY(`report_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
--> statement-breakpoint
CREATE TABLE `monitor_replays` (
	`report_id` char(36) NOT NULL,
	`codec` varchar(16) NOT NULL,
	`events_blob` mediumblob NOT NULL,
	`uncompressed_bytes` int NOT NULL,
	`sha256` char(64) NOT NULL,
	CONSTRAINT `monitor_replays_report_id` PRIMARY KEY(`report_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
--> statement-breakpoint
CREATE TABLE `monitor_reports` (
	`id` char(36) NOT NULL,
	`schema_version` int NOT NULL,
	`report_kind` varchar(16) NOT NULL,
	`error_kind` varchar(32),
	`occurred_at_ms` bigint NOT NULL,
	`received_at_ms` bigint NOT NULL,
	`expires_at_ms` bigint NOT NULL,
	`time_source` varchar(16),
	`session_id` char(36) NOT NULL,
	`page_id` char(36) NOT NULL,
	`path` text NOT NULL,
	`path_hash` char(64) NOT NULL,
	`release` varchar(100) NOT NULL,
	`user_id` varchar(100),
	`summary_json` json NOT NULL,
	`replay_event_count` int NOT NULL,
	`payload_sha256` char(64) NOT NULL,
	CONSTRAINT `monitor_reports_id` PRIMARY KEY(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
--> statement-breakpoint
ALTER TABLE `monitor_import_items` ADD CONSTRAINT `monitor_import_items_run_id_monitor_import_runs_id_fk` FOREIGN KEY (`run_id`) REFERENCES `monitor_import_runs`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `monitor_report_payloads` ADD CONSTRAINT `monitor_report_payloads_report_id_monitor_reports_id_fk` FOREIGN KEY (`report_id`) REFERENCES `monitor_reports`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `monitor_replays` ADD CONSTRAINT `monitor_replays_report_id_monitor_reports_id_fk` FOREIGN KEY (`report_id`) REFERENCES `monitor_reports`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `reports_received` ON `monitor_reports` (`received_at_ms`,`id`);--> statement-breakpoint
CREATE INDEX `reports_kind` ON `monitor_reports` (`report_kind`,`received_at_ms`,`id`);--> statement-breakpoint
CREATE INDEX `reports_session` ON `monitor_reports` (`session_id`,`received_at_ms`,`id`);--> statement-breakpoint
CREATE INDEX `reports_path` ON `monitor_reports` (`path_hash`,`received_at_ms`,`id`);--> statement-breakpoint
CREATE INDEX `reports_expiry` ON `monitor_reports` (`expires_at_ms`,`id`);