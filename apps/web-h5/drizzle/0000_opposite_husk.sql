-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE `cust_tenant_relation` (
  `cust_id` bigint NOT NULL COMMENT '客户ID',
  `user_id` bigint NOT NULL COMMENT '用户ID',
  `tenant_id` varchar(6) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '租户ID'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='用户租户关联';
--> statement-breakpoint
CREATE TABLE `leave_message` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT 'id',
  `name` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '姓名',
  `email` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '邮箱',
  `phone` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '电话',
  `message` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '消息',
  `is_read` int NOT NULL DEFAULT '0' COMMENT '是否已读（0-否，1-是）',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='留言';
--> statement-breakpoint
CREATE TABLE `package_order` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `order_no` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '订单编号',
  `cust_code` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '客户编号',
  `order_type` int NOT NULL DEFAULT '0' COMMENT '1-新买，2-续费，3-增值，4-升级',
  `biz_code` varchar(10) COLLATE utf8mb4_general_ci NOT NULL COMMENT '业务编码',
  `original_order` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '原订单',
  `order_amount` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '订单金额',
  `discount_rate` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '折扣比例',
  `discount_amount` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '折扣金额',
  `residual_amount` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '残余金额（升级）',
  `final_amount` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '最终金额',
  `pay_type` int DEFAULT NULL COMMENT '支付方式',
  `pay_evidence` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '支付凭证',
  `pay_time` datetime DEFAULT NULL COMMENT '支付时间',
  `order_status` int NOT NULL COMMENT '订单状态',
  `expire_date` date DEFAULT NULL COMMENT '过期日期',
  `activate_date` date DEFAULT NULL COMMENT '开通日期',
  `invoice_no` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '发票号码',
  `invoice_header` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '发票抬头（法人，公司）',
  `business_reg_no` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '商业登记证号码',
  `tenant_id` varchar(6) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '租户ID',
  `create_user` bigint NOT NULL COMMENT '创建人',
  `create_time` datetime NOT NULL COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=70 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='套餐订单';
--> statement-breakpoint
CREATE TABLE `package_order_item` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `order_id` bigint NOT NULL COMMENT '订单ID',
  `package_id` bigint NOT NULL COMMENT '套餐ID',
  `item_type` int NOT NULL COMMENT '1-套餐，2-增值服务',
  `item_code` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '项目编码',
  `item_name` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '项目名称',
  `price` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '价格',
  `count` int NOT NULL DEFAULT '0' COMMENT '数量',
  `days` int DEFAULT NULL COMMENT '天数',
  `amount` decimal(10,2) NOT NULL COMMENT '金额',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=106 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='套餐订单项';
--> statement-breakpoint
CREATE TABLE `pay_record` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `order_no` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '订单编号',
  `pay_order_no` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '支付订单号',
  `pay_amount` decimal(10,2) DEFAULT NULL COMMENT '支付金额',
  `request_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '请求路径',
  `request_data` json DEFAULT NULL COMMENT '请求数据',
  `request_time` datetime DEFAULT NULL COMMENT '请求时间',
  `notify_data` json DEFAULT NULL COMMENT '通知数据',
  `notify_time` datetime DEFAULT NULL COMMENT '通知时间',
  `status` int DEFAULT NULL COMMENT '状态（1-待付款，2-已付款）',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='支付记录';
--> statement-breakpoint
CREATE TABLE `platform_admin` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT 'id',
  `username` varchar(64) CHARACTER SET utf32 COLLATE utf32_general_ci NOT NULL COMMENT '用户名',
  `password` varchar(64) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL COMMENT '密码',
  `nick_name` varchar(200) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL COMMENT '昵称',
  `icon` varchar(500) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL COMMENT '头像',
  `email` varchar(80) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL COMMENT '邮箱',
  `phone` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '电话',
  `status` int DEFAULT '1' COMMENT '帐号启用状态：0->禁用；1->启用',
  `login_time` datetime DEFAULT NULL COMMENT '最后登录时间',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='平台管理员';
--> statement-breakpoint
CREATE TABLE `platform_customer` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT 'id',
  `cust_code` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '客户编号',
  `cust_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '客户名称',
  `password` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '密码',
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '电话号码',
  `email` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '邮箱',
  `company_name` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '公司名称',
  `register_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '注册时间',
  `vip_level` int NOT NULL DEFAULT '1' COMMENT '1-注册会员，2-黄金会员，3-白金会员，4-钻石会员',
  `status` int NOT NULL COMMENT '状态',
  `create_user` bigint DEFAULT NULL COMMENT '创建人',
  `create_time` datetime NOT NULL COMMENT '创建时间',
  `is_deleted` int NOT NULL COMMENT '是否删除 0.否1.是',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=152 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='平台客户';
--> statement-breakpoint
CREATE TABLE `platform_package` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT 'id',
  `package_name` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '套餐名称',
  `unit_count` int NOT NULL COMMENT '单位数量',
  `price` decimal(10,2) NOT NULL COMMENT '价格',
  `price_a` decimal(10,2) NOT NULL COMMENT '价格（3个月）',
  `price_b` decimal(10,2) NOT NULL COMMENT '价格（6个月）',
  `price_c` decimal(10,2) NOT NULL COMMENT '价格（12个月）',
  `add_unit_price` decimal(10,2) DEFAULT NULL COMMENT '增加单位价格',
  `rent_sys_price` decimal(10,2) DEFAULT NULL COMMENT '租务系统价格',
  `venue_sys_price` decimal(10,2) DEFAULT NULL COMMENT '场地系统价格',
  `accounting_sys_price` decimal(10,2) DEFAULT NULL COMMENT '会计系统价格',
  `cust_service_sys_price` decimal(10,2) DEFAULT NULL COMMENT '客服系统价格',
  `status` int NOT NULL COMMENT '状态',
  `create_user` bigint DEFAULT NULL COMMENT '创建人',
  `create_time` datetime NOT NULL COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='套餐';
--> statement-breakpoint
CREATE TABLE `platform_package_item` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT 'id',
  `package_id` bigint NOT NULL COMMENT '套餐ID',
  `menu_id` bigint NOT NULL COMMENT '菜单ID',
  `level` int DEFAULT NULL COMMENT '菜单层级',
  `menu_title` varchar(100) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL COMMENT '菜单名称',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=1623 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='套餐内容明细';
--> statement-breakpoint
CREATE TABLE `platform_promotion` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `promotion_no` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '优惠编码',
  `promotion_name` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '优惠名称',
  `promotion_desc` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '活动描述',
  `promotion_type` int NOT NULL COMMENT '优惠类型（1-优惠活动，2-优惠码，3优惠券）',
  `promotion_code` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '优惠口令码（优惠码活动）',
  `max_count` int DEFAULT NULL COMMENT '数量限制',
  `start_time` date NOT NULL COMMENT '开始时间',
  `end_time` date NOT NULL COMMENT '结束时间',
  `remark` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '备注',
  `status` int DEFAULT '0' COMMENT '0-未开始 1-进行中 2-暂停 3-已结束',
  `create_user` bigint DEFAULT NULL COMMENT '创建人',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='优惠活动';
--> statement-breakpoint
CREATE TABLE `platform_promotion_item` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `promotion_id` bigint NOT NULL COMMENT '优惠ID',
  `rule_type` int NOT NULL COMMENT '优惠方式（1-满减，2-百分比）',
  `package_id` bigint NOT NULL COMMENT '套餐ID',
  `package_name` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '套餐名称',
  `threshold_amount` decimal(10,2) DEFAULT NULL COMMENT '满多少金额',
  `discount_value` decimal(10,2) DEFAULT NULL COMMENT '优惠值（减免金额or折扣百分比）',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='优惠活动明细项';
--> statement-breakpoint
CREATE TABLE `platform_promotion_record` (
  `id` int NOT NULL AUTO_INCREMENT,
  `promotion_id` bigint NOT NULL COMMENT '优惠ID',
  `order_no` varchar(30) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL COMMENT '订单编号',
  `cust_code` varchar(30) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL COMMENT '客户编码',
  `discount_amount` decimal(10,2) NOT NULL COMMENT '优惠金额',
  `use_time` datetime DEFAULT NULL COMMENT '使用时间',
  `status` int DEFAULT NULL COMMENT '状态（1-未使用，2-已锁定，3-已使用，4-已过期）',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='优惠活动使用记录';
--> statement-breakpoint
CREATE TABLE `platform_tenant` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT 'id',
  `tenant_id` varchar(6) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '租户ID',
  `tenant_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '租户名称',
  `biz_code` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '业务编码',
  `unit_count` int NOT NULL DEFAULT '0' COMMENT '单位数量',
  `status` int NOT NULL COMMENT '状态',
  `expire_date` date NOT NULL COMMENT '过期日期',
  `relate_order` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '关联订单',
  `create_time` datetime NOT NULL COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=83 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='租户表';

*/
