CREATE TABLE `h5_runtime_config` (
	`id` int NOT NULL,
	`version` int NOT NULL DEFAULT 0,
	`payload` text NOT NULL,
	CONSTRAINT `h5_runtime_config_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `h5_runtime_config_audit` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`version` int NOT NULL,
	`actor` varchar(128) NOT NULL,
	`fields` text NOT NULL,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `h5_runtime_config_audit_id` PRIMARY KEY(`id`)
);

--> statement-breakpoint
INSERT INTO `h5_runtime_config` (`id`, `version`, `payload`) VALUES (1, 0, '{}');
