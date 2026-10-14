CREATE TABLE `monitor_upload_chunks` (
  `upload_id` char(36) NOT NULL COMMENT '分片上传任务唯一标识（UUID，重试沿用）',
  `chunk_index` int NOT NULL COMMENT '从零开始的分片序号，与任务标识组成主键',
  `report_id` char(36) NOT NULL COMMENT '待组装报告唯一标识（UUID，最终报告幂等入库）',
  `total_chunks` int NOT NULL COMMENT '本次上传分片总数，最多三百四十二片',
  `chunk_data` mediumblob NOT NULL COMMENT '脱敏报告的 UTF-8 字节分片，不含认证凭证，单片最多十二 KiB',
  `expires_at_ms` bigint NOT NULL COMMENT '未完成上传的过期时间（Unix 毫秒，首次分片接收后二十四小时）',
  PRIMARY KEY (`upload_id`, `chunk_index`),
  KEY `upload_chunks_expiry` (`expires_at_ms`)
) ENGINE=InnoDB COMMENT='弱网断点续传临时分片，报告完整入库后删除，过期自动清理';
