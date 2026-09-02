ALTER TABLE `fb_category` ADD `system` enum('pms','hr') DEFAULT 'pms' NOT NULL;
--> statement-breakpoint
INSERT INTO `fb_category` (`system`, `name`, `description`, `icon`, `sort_order`)
VALUES
	('hr', '人事管理', '員工資料、入職與離職流程相關建議', 'users', 1),
	('hr', '組織架構', '部門、職位與匯報關係的管理', 'network', 2),
	('hr', '考勤假期', '打卡、排班、假期設定與審批流程', 'calendar-clock', 3),
	('hr', '薪資管理', '薪資方案、計算、獎罰與發薪', 'wallet', 4),
	('hr', '績效培訓', '考核方案、績效評估與培訓管理', 'trending-up', 5),
	('hr', '報表與通知', '人力報表分析、消息通知與系統設定', 'chart-column', 6)
ON DUPLICATE KEY UPDATE
	`system` = VALUES(`system`),
	`description` = VALUES(`description`),
	`icon` = VALUES(`icon`),
	`sort_order` = VALUES(`sort_order`);
--> statement-breakpoint
INSERT INTO `fb_sub_category` (`category_id`, `name`, `sort_order`)
SELECT `category`.`id`, `subcategory`.`name`, `subcategory`.`sort_order`
FROM `fb_category` AS `category`
INNER JOIN (
	SELECT '人事管理' AS `category_name`, '員工資料' AS `name`, 1 AS `sort_order`
	UNION ALL SELECT '人事管理', '入職管理', 2
	UNION ALL SELECT '人事管理', '離職管理', 3
	UNION ALL SELECT '人事管理', '電子檔案', 4
	UNION ALL SELECT '組織架構', '部門管理', 1
	UNION ALL SELECT '組織架構', '職位管理', 2
	UNION ALL SELECT '組織架構', '職位架構', 3
	UNION ALL SELECT '組織架構', '權限分配', 4
	UNION ALL SELECT '考勤假期', '打卡管理', 1
	UNION ALL SELECT '考勤假期', '打卡記錄', 2
	UNION ALL SELECT '考勤假期', '假期設定', 3
	UNION ALL SELECT '考勤假期', '審批管理', 4
	UNION ALL SELECT '薪資管理', '薪資方案', 1
	UNION ALL SELECT '薪資管理', '薪資計算', 2
	UNION ALL SELECT '薪資管理', '獎金/罰款', 3
	UNION ALL SELECT '薪資管理', '發薪管理', 4
	UNION ALL SELECT '績效培訓', '考核方案', 1
	UNION ALL SELECT '績效培訓', '績效評估', 2
	UNION ALL SELECT '績效培訓', '培訓計劃', 3
	UNION ALL SELECT '績效培訓', '培訓記錄', 4
	UNION ALL SELECT '報表與通知', '報表分析', 1
	UNION ALL SELECT '報表與通知', '消息通知', 2
	UNION ALL SELECT '報表與通知', '系統設定', 3
	UNION ALL SELECT '報表與通知', '其他建議', 4
) AS `subcategory` ON `subcategory`.`category_name` = `category`.`name`
ON DUPLICATE KEY UPDATE `sort_order` = VALUES(`sort_order`);
