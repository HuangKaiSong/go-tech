ALTER TABLE `fb_aide_sync_job`
	MODIFY COLUMN `feature_id` bigint unsigned NOT NULL COMMENT '需求建議 ID',
	MODIFY COLUMN `revision` int unsigned NOT NULL DEFAULT 1 COMMENT '同步任務版本號，每次需求變更時遞增',
	MODIFY COLUMN `attempts` int unsigned NOT NULL DEFAULT 0 COMMENT '同步失敗重試次數',
	MODIFY COLUMN `available_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '下次可執行同步的時間',
	MODIFY COLUMN `locked_at` datetime COMMENT '任務鎖定時間，NULL 表示未鎖定',
	MODIFY COLUMN `last_error` text COMMENT '最近一次同步錯誤',
	MODIFY COLUMN `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
		COMMENT '任務更新時間',
	COMMENT = '需求建議 AI 向量增量同步任務 Outbox',
	ALGORITHM = INPLACE,
	LOCK = NONE;
--> statement-breakpoint
ALTER TABLE `fb_captcha_challenge`
	MODIFY COLUMN `nonce` varchar(64) NOT NULL COMMENT '一次性消费凭证隨機值',
	MODIFY COLUMN `expires_at` datetime(3) NOT NULL COMMENT '凭证失效時間',
	MODIFY COLUMN `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '凭证建立時間',
	COMMENT = '一次性消费凭证表, 作用与 Turnstile 未配置、加载失败、超过 8 秒或用户主动切换',
	ALGORITHM = INPLACE,
	LOCK = NONE;
