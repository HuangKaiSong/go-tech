-- MySQL 监控表完整结构参考：全部字段及表均附中文注释。
-- 本文件不包含报告数据、认证凭证或迁移记录。
-- 初始化与升级统一运行 pnpm --filter web-monitor db:migrate；不要在已有库重复建表。

CREATE TABLE `monitor_reports` (
  `id` char(36) COLLATE utf8mb4_bin NOT NULL COMMENT '报告唯一标识（UUID，重复上传不覆盖原记录）',
  `schema_version` int NOT NULL COMMENT '监控报告协议版本号',
  `report_kind` varchar(16) COLLATE utf8mb4_bin NOT NULL COMMENT '报告大类：error 错误或 performance 性能',
  `error_kind` varchar(32) COLLATE utf8mb4_bin DEFAULT NULL COMMENT '错误来源分类，性能报告为空',
  `occurred_at_ms` bigint NOT NULL COMMENT '报告原始发生时间（Unix 毫秒）',
  `received_at_ms` bigint NOT NULL COMMENT '监控服务首次接收时间（Unix 毫秒）',
  `expires_at_ms` bigint NOT NULL COMMENT '报告过期时间（Unix 毫秒，查询时直接排除过期记录）',
  `time_source` varchar(16) COLLATE utf8mb4_bin DEFAULT NULL COMMENT '发生时间来源：client 客户端或 server 服务端',
  `session_id` char(36) COLLATE utf8mb4_bin NOT NULL COMMENT '客户端会话唯一标识（UUID）',
  `page_id` char(36) COLLATE utf8mb4_bin NOT NULL COMMENT '页面文档唯一标识（UUID）',
  `path` text COLLATE utf8mb4_bin NOT NULL COMMENT '页面完整路径，不含查询参数与片段',
  `path_hash` char(64) COLLATE utf8mb4_bin NOT NULL COMMENT '完整页面路径的 SHA-256 哈希，用于精确路径筛选索引',
  `release` varchar(100) COLLATE utf8mb4_bin NOT NULL COMMENT '应用发布版本标识',
  `user_id` varchar(100) COLLATE utf8mb4_bin DEFAULT NULL COMMENT '认证上下文中的用户标识，匿名报告可为空',
  `summary_json` json NOT NULL COMMENT '脱敏摘要的 JSON 文本字符串，不含回放事件、Token 或认证 Cookie',
  `replay_event_count` int NOT NULL COMMENT '浏览器回放事件数量，无回放时为零',
  `payload_sha256` char(64) COLLATE utf8mb4_bin NOT NULL COMMENT '完整规范报告及原接收时间的 SHA-256 校验值',
  PRIMARY KEY (`id`),
  KEY `reports_received` (`received_at_ms`,`id`),
  KEY `reports_kind` (`report_kind`,`received_at_ms`,`id`),
  KEY `reports_session` (`session_id`,`received_at_ms`,`id`),
  KEY `reports_path` (`path_hash`,`received_at_ms`,`id`),
  KEY `reports_expiry` (`expires_at_ms`,`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin COMMENT='监控报告索引与脱敏摘要';

CREATE TABLE `monitor_report_payloads` (
  `report_id` char(36) COLLATE utf8mb4_bin NOT NULL COMMENT '关联报告唯一标识（UUID，随报告级联删除）',
  `payload_json` json NOT NULL COMMENT '移除回放事件和明文凭证后的报告 JSON 文本字符串，保留数值精度',
  `auth_ciphertext` mediumtext COLLATE utf8mb4_bin COMMENT '认证 Token 与 Cookie 的 AES-256-GCM 密文，包含随机数及认证标签',
  `auth_key_version` varchar(32) COLLATE utf8mb4_bin DEFAULT NULL COMMENT '认证凭证加密密钥版本，密钥本身不入库',
  PRIMARY KEY (`report_id`),
  CONSTRAINT `monitor_report_payloads_report_id_monitor_reports_id_fk` FOREIGN KEY (`report_id`) REFERENCES `monitor_reports` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin COMMENT='监控报告详情与独立加密的认证凭证';

CREATE TABLE `monitor_replays` (
  `report_id` char(36) COLLATE utf8mb4_bin NOT NULL COMMENT '关联报告唯一标识（UUID，随报告级联删除）',
  `codec` varchar(16) COLLATE utf8mb4_bin NOT NULL COMMENT '回放编码格式，当前为 gzip-json',
  `events_blob` mediumblob NOT NULL COMMENT '按原顺序保存的回放事件 JSON 数组压缩二进制内容',
  `uncompressed_bytes` int NOT NULL COMMENT '事件 JSON 解压后的字节数，用于容量及完整性校验',
  `sha256` char(64) COLLATE utf8mb4_bin NOT NULL COMMENT '未压缩事件 JSON 内容的 SHA-256 校验值',
  PRIMARY KEY (`report_id`),
  CONSTRAINT `monitor_replays_report_id_monitor_reports_id_fk` FOREIGN KEY (`report_id`) REFERENCES `monitor_reports` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin COMMENT='浏览器回放事件压缩存储，无回放的报告不创建记录';

CREATE TABLE `monitor_import_runs` (
  `id` char(36) COLLATE utf8mb4_bin NOT NULL COMMENT '历史导入任务唯一标识（UUID）',
  `source_hash` char(64) COLLATE utf8mb4_bin NOT NULL COMMENT '历史源目录绝对路径的 SHA-256 哈希，不保存明文路径',
  `started_at_ms` bigint NOT NULL COMMENT '历史导入任务开始时间（Unix 毫秒）',
  `completed_at_ms` bigint DEFAULT NULL COMMENT '历史导入任务结束时间（Unix 毫秒），未结束时为空',
  `status` varchar(16) COLLATE utf8mb4_bin NOT NULL COMMENT '历史导入任务状态：running、complete 或 blocked',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin COMMENT='历史文件迁移任务审计记录，文件存储停用后保留用于追溯';

CREATE TABLE `monitor_import_items` (
  `source_hash` char(64) COLLATE utf8mb4_bin NOT NULL COMMENT '历史源目录标识哈希，与源报告标识组成联合主键',
  `file_id` char(36) COLLATE utf8mb4_bin NOT NULL COMMENT '历史源报告文件对应的报告唯一标识（UUID）',
  `content_hash` char(64) COLLATE utf8mb4_bin DEFAULT NULL COMMENT '历史源报告及原接收时间的规范内容 SHA-256 校验值',
  `run_id` char(36) COLLATE utf8mb4_bin NOT NULL COMMENT '最近一次核验该报告的历史导入任务标识（UUID）',
  `status` varchar(32) COLLATE utf8mb4_bin NOT NULL COMMENT '历史迁移结果：imported、duplicate、expired、conflict 或 invalid',
  `error_class` varchar(32) COLLATE utf8mb4_bin DEFAULT NULL COMMENT '迁移异常分类，不包含凭证值或原始报告内容',
  `checked_at_ms` bigint NOT NULL COMMENT '最近一次迁移核验时间（Unix 毫秒）',
  PRIMARY KEY (`source_hash`,`file_id`),
  KEY `monitor_import_items_run_id_monitor_import_runs_id_fk` (`run_id`),
  CONSTRAINT `monitor_import_items_run_id_monitor_import_runs_id_fk` FOREIGN KEY (`run_id`) REFERENCES `monitor_import_runs` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin COMMENT='历史报告迁移结果与校验检查点，不保存凭证明文';

CREATE TABLE `monitor_schema_migrations` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '结构迁移记录自增主键',
  `hash` text COLLATE utf8mb4_general_ci NOT NULL COMMENT '已执行 SQL 迁移文件的 SHA-256 校验值',
  `created_at` bigint DEFAULT NULL COMMENT '迁移文件生成时间戳（Unix 毫秒），用于版本顺序判断',
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='监控服务专用结构迁移记录，与业务应用迁移记录独立';

