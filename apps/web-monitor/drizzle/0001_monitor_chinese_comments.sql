-- 为现有表补充中文注释；保留字段类型、可空性、自增与索引，不重建或清空数据。
ALTER TABLE `monitor_reports`
  COMMENT = '监控报告索引与脱敏摘要',
  MODIFY COLUMN `id` char(36) NOT NULL COMMENT '报告唯一标识（UUID，重复上传不覆盖原记录）',
  MODIFY COLUMN `schema_version` int NOT NULL COMMENT '监控报告协议版本号',
  MODIFY COLUMN `report_kind` varchar(16) NOT NULL COMMENT '报告大类：error 错误或 performance 性能',
  MODIFY COLUMN `error_kind` varchar(32) COMMENT '错误来源分类，性能报告为空',
  MODIFY COLUMN `occurred_at_ms` bigint NOT NULL COMMENT '报告原始发生时间（Unix 毫秒）',
  MODIFY COLUMN `received_at_ms` bigint NOT NULL COMMENT '监控服务首次接收时间（Unix 毫秒）',
  MODIFY COLUMN `expires_at_ms` bigint NOT NULL COMMENT '报告过期时间（Unix 毫秒，查询时直接排除过期记录）',
  MODIFY COLUMN `time_source` varchar(16) COMMENT '发生时间来源：client 客户端或 server 服务端',
  MODIFY COLUMN `session_id` char(36) NOT NULL COMMENT '客户端会话唯一标识（UUID）',
  MODIFY COLUMN `page_id` char(36) NOT NULL COMMENT '页面文档唯一标识（UUID）',
  MODIFY COLUMN `path` text NOT NULL COMMENT '页面完整路径，不含查询参数与片段',
  MODIFY COLUMN `path_hash` char(64) NOT NULL COMMENT '完整页面路径的 SHA-256 哈希，用于精确路径筛选索引',
  MODIFY COLUMN `release` varchar(100) NOT NULL COMMENT '应用发布版本标识',
  MODIFY COLUMN `user_id` varchar(100) COMMENT '认证上下文中的用户标识，匿名报告可为空',
  MODIFY COLUMN `summary_json` json NOT NULL COMMENT '脱敏摘要的 JSON 文本字符串，不含回放事件、Token 或认证 Cookie',
  MODIFY COLUMN `replay_event_count` int NOT NULL COMMENT '浏览器回放事件数量，无回放时为零',
  MODIFY COLUMN `payload_sha256` char(64) NOT NULL COMMENT '完整规范报告及原接收时间的 SHA-256 校验值';
--> statement-breakpoint
ALTER TABLE `monitor_report_payloads`
  COMMENT = '监控报告详情与独立加密的认证凭证',
  MODIFY COLUMN `report_id` char(36) NOT NULL COMMENT '关联报告唯一标识（UUID，随报告级联删除）',
  MODIFY COLUMN `payload_json` json NOT NULL COMMENT '移除回放事件和明文凭证后的报告 JSON 文本字符串，保留数值精度',
  MODIFY COLUMN `auth_ciphertext` mediumtext COMMENT '认证 Token 与 Cookie 的 AES-256-GCM 密文，包含随机数及认证标签',
  MODIFY COLUMN `auth_key_version` varchar(32) COMMENT '认证凭证加密密钥版本，密钥本身不入库';
--> statement-breakpoint
ALTER TABLE `monitor_replays`
  COMMENT = '浏览器回放事件压缩存储，无回放的报告不创建记录',
  MODIFY COLUMN `report_id` char(36) NOT NULL COMMENT '关联报告唯一标识（UUID，随报告级联删除）',
  MODIFY COLUMN `codec` varchar(16) NOT NULL COMMENT '回放编码格式，当前为 gzip-json',
  MODIFY COLUMN `events_blob` mediumblob NOT NULL COMMENT '按原顺序保存的回放事件 JSON 数组压缩二进制内容',
  MODIFY COLUMN `uncompressed_bytes` int NOT NULL COMMENT '事件 JSON 解压后的字节数，用于容量及完整性校验',
  MODIFY COLUMN `sha256` char(64) NOT NULL COMMENT '未压缩事件 JSON 内容的 SHA-256 校验值';
--> statement-breakpoint
ALTER TABLE `monitor_import_runs`
  COMMENT = '历史文件迁移任务审计记录，文件存储停用后保留用于追溯',
  MODIFY COLUMN `id` char(36) NOT NULL COMMENT '历史导入任务唯一标识（UUID）',
  MODIFY COLUMN `source_hash` char(64) NOT NULL COMMENT '历史源目录绝对路径的 SHA-256 哈希，不保存明文路径',
  MODIFY COLUMN `started_at_ms` bigint NOT NULL COMMENT '历史导入任务开始时间（Unix 毫秒）',
  MODIFY COLUMN `completed_at_ms` bigint COMMENT '历史导入任务结束时间（Unix 毫秒），未结束时为空',
  MODIFY COLUMN `status` varchar(16) NOT NULL COMMENT '历史导入任务状态：running、complete 或 blocked';
--> statement-breakpoint
ALTER TABLE `monitor_import_items`
  COMMENT = '历史报告迁移结果与校验检查点，不保存凭证明文',
  MODIFY COLUMN `source_hash` char(64) NOT NULL COMMENT '历史源目录标识哈希，与源报告标识组成联合主键',
  MODIFY COLUMN `file_id` char(36) NOT NULL COMMENT '历史源报告文件对应的报告唯一标识（UUID）',
  MODIFY COLUMN `content_hash` char(64) COMMENT '历史源报告及原接收时间的规范内容 SHA-256 校验值',
  MODIFY COLUMN `run_id` char(36) NOT NULL COMMENT '最近一次核验该报告的历史导入任务标识（UUID）',
  MODIFY COLUMN `status` varchar(32) NOT NULL COMMENT '历史迁移结果：imported、duplicate、expired、conflict 或 invalid',
  MODIFY COLUMN `error_class` varchar(32) COMMENT '迁移异常分类，不包含凭证值或原始报告内容',
  MODIFY COLUMN `checked_at_ms` bigint NOT NULL COMMENT '最近一次迁移核验时间（Unix 毫秒）';
--> statement-breakpoint
ALTER TABLE `monitor_schema_migrations`
  COMMENT = '监控服务专用结构迁移记录，与业务应用迁移记录独立',
  MODIFY COLUMN `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '结构迁移记录自增主键',
  MODIFY COLUMN `hash` text NOT NULL COMMENT '已执行 SQL 迁移文件的 SHA-256 校验值',
  MODIFY COLUMN `created_at` bigint COMMENT '迁移文件生成时间戳（Unix 毫秒），用于版本顺序判断';
