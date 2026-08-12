CREATE TABLE `fb_captcha_challenge` (
	`nonce` varchar(64) NOT NULL,
	`expires_at` datetime(3) NOT NULL,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `fb_captcha_challenge_nonce` PRIMARY KEY(`nonce`)
);
--> statement-breakpoint
CREATE INDEX `idx_captcha_challenge_expires` ON `fb_captcha_challenge` (`expires_at`);