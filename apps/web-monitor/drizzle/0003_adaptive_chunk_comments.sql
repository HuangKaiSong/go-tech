ALTER TABLE `monitor_upload_chunks`
  MODIFY COLUMN `chunk_data` mediumblob NOT NULL COMMENT '脱敏报告的 UTF-8 字节分片，不含认证凭证，兼容十二 KiB 固定分片，智能分片最大二百五十六 KiB';
