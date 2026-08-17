CREATE DATABASE IF NOT EXISTS `CYGNUSXSTORE`;
USE `CYGNUSXSTORE`;

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

-- DROP TABLE IF EXISTS `bank`;
CREATE TABLE IF NOT EXISTS `bank` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tname` varchar(100) NOT NULL DEFAULT 'PromptPay',
  `fname` varchar(100) NOT NULL DEFAULT '',
  `lname` varchar(100) NOT NULL DEFAULT '',
  `bnum` varchar(50) NOT NULL DEFAULT '',
  `promptpay_id` varchar(50) NOT NULL DEFAULT '',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT IGNORE INTO `bank` (`id`, `tname`, `fname`, `lname`, `bnum`, `promptpay_id`, `created_at`, `updated_at`) VALUES
(1, 'ธนาคารกสิกร', 'ทนงศักดิ์', 'แซ่เติน', '111-1-31808-1', '111-1-31808-1', '2023-02-11 07:48:46', '2024-02-11 16:43:57');

-- DROP TABLE IF EXISTS `boxlog`;
CREATE TABLE IF NOT EXISTS `boxlog` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `date` datetime(2) NOT NULL,
  `username` varchar(255) NOT NULL,
  `category` varchar(255) NOT NULL,
  `price` int(11) NOT NULL,
  `prize_name` varchar(255) NOT NULL,
  `uid` varchar(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- DROP TABLE IF EXISTS `box_product`;
CREATE TABLE IF NOT EXISTS `box_product` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `price` int(11) NOT NULL,
  `des` varchar(1000) NOT NULL,
  `img` varchar(255) NOT NULL,
  `type` int(11) NOT NULL DEFAULT 0,
  `percent` int(3) NOT NULL DEFAULT 100,
  `salt_prize` varchar(255) NOT NULL DEFAULT 'ไม่ได้รับรางวัล',
  `c_type` varchar(225) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT IGNORE INTO `box_product` (`id`, `name`, `price`, `des`, `img`, `type`, `percent`, `salt_prize`, `c_type`) VALUES
(2, 'เทส', 0, 'เทส', 'https://cdn.discordapp.com/attachments/1178032838189260901/1178227379093651466/83_20231126135426.png?ex=657560c1&is=6562ebc1&hm=ddeadee70b33168d4371dc9af50278f8b0c61f37eefc01fbcc45f1c0dbd55119&', 1, 100, 'ไม่ได้รับรางวัล', '0'),
(3, 'เทส1', 0, 'เทส1', 'https://cdn.discordapp.com/attachments/1178032838189260901/1178227379093651466/83_20231126135426.png?ex=657560c1&is=6562ebc1&hm=ddeadee70b33168d4371dc9af50278f8b0c61f37eefc01fbcc45f1c0dbd55119&', 1, 100, 'ไม่ได้รับรางวัล', 'เทส2'),
(4, 'เทส2', 0, 'เทส2', 'https://cdn.discordapp.com/attachments/1178032838189260901/1178227379093651466/83_20231126135426.png?ex=657560c1&is=6562ebc1&hm=ddeadee70b33168d4371dc9af50278f8b0c61f37eefc01fbcc45f1c0dbd55119&', 1, 100, 'ไม่ได้รับรางวัล', 'เทส1'),
(5, 'เทส3', 0, 'เทส3', 'https://cdn.discordapp.com/attachments/1178032838189260901/1178227379093651466/83_20231126135426.png?ex=657560c1&is=6562ebc1&hm=ddeadee70b33168d4371dc9af50278f8b0c61f37eefc01fbcc45f1c0dbd55119&', 1, 100, 'ไม่ได้รับรางวัล', 'เทส2');

-- DROP TABLE IF EXISTS `box_stock`;
CREATE TABLE IF NOT EXISTS `box_stock` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(255) NOT NULL,
  `password` text NOT NULL,
  `p_id` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- DROP TABLE IF EXISTS `byshop`;
CREATE TABLE IF NOT EXISTS `byshop` (
  `status` varchar(255) NOT NULL,
  `apikey` varchar(255) NOT NULL,
  `cost` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

INSERT IGNORE INTO `byshop` (`status`, `apikey`, `cost`) VALUES
('on', '#', '10');

-- DROP TABLE IF EXISTS `carousel`;
CREATE TABLE IF NOT EXISTS `carousel` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `link` varchar(500) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT IGNORE INTO `carousel` (`id`, `link`) VALUES
(2, 'https://i.ibb.co/5YQCW25/New-Project-12.png');

-- DROP TABLE IF EXISTS `category`;
CREATE TABLE IF NOT EXISTS `category` (
  `c_id` int(11) NOT NULL AUTO_INCREMENT,
  `c_name` varchar(255) NOT NULL,
  `des` varchar(1000) NOT NULL,
  `img` varchar(255) NOT NULL,
  PRIMARY KEY (`c_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT IGNORE INTO `category` (`c_id`, `c_name`, `des`, `img`) VALUES
(1, 'เทส1', 'เทส1', 'https://cdn.discordapp.com/attachments/1178032838189260901/1178225138370625637/82_20231126134526.png?ex=65755eab&is=6562e9ab&hm=78b6da730beba327f9b41b9ed51c4c0470b7dae78b05d04ffce8caed09475e39&'),
(2, 'เทส2', 'เทส2', 'https://cdn.discordapp.com/attachments/1178032838189260901/1178225138370625637/82_20231126134526.png?ex=65755eab&is=6562e9ab&hm=78b6da730beba327f9b41b9ed51c4c0470b7dae78b05d04ffce8caed09475e39&');

-- DROP TABLE IF EXISTS `crecom`;
CREATE TABLE IF NOT EXISTS `crecom` (
  `recom_1` int(11) NOT NULL DEFAULT 0,
  `recom_2` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT IGNORE INTO `crecom` (`recom_1`, `recom_2`) VALUES
(0, 0);

-- DROP TABLE IF EXISTS `discount_usage`;
-- DROP TABLE IF EXISTS `discount_codes`;
CREATE TABLE IF NOT EXISTS `discount_codes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `code` varchar(50) NOT NULL,
  `discount_type` enum('percent','fixed') NOT NULL DEFAULT 'percent',
  `discount_value` decimal(10,2) NOT NULL DEFAULT 0.00,
  `min_purchase` decimal(10,2) DEFAULT 0.00,
  `max_discount` decimal(10,2) DEFAULT NULL,
  `usage_limit` int(11) DEFAULT NULL,
  `used_count` int(11) DEFAULT 0,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT IGNORE INTO `discount_codes` (`id`, `code`, `discount_type`, `discount_value`, `usage_limit`, `is_active`) VALUES
(1, 'WELCOME10', 'percent', 10.00, 100, 1);

CREATE TABLE IF NOT EXISTS `discount_usage` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `code_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `order_id` int(11) DEFAULT NULL,
  `discount_amount` decimal(10,2) NOT NULL,
  `used_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `code_id` (`code_id`),
  KEY `user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- DROP TABLE IF EXISTS `kbank_trans`;
CREATE TABLE IF NOT EXISTS `kbank_trans` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `qr` text NOT NULL,
  `ref` varchar(255) NOT NULL,
  `sender` varchar(100) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_ref` (`ref`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT IGNORE INTO `kbank_trans` (`id`, `qr`, `ref`, `sender`, `created_at`, `updated_at`) VALUES
(7, '004100060000010103004022001405190636BTF060015102TH9104DD4A', '01402590636BTF06001', NULL, '2024-01-25 19:09:39', '2024-01-25 12:26:30');

-- DROP TABLE IF EXISTS `popup_announcements`;
CREATE TABLE IF NOT EXISTS `popup_announcements` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `content` text DEFAULT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `button_text` varchar(100) DEFAULT 'ถัดไป',
  `button_link` varchar(500) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `show_order` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT IGNORE INTO `popup_announcements` (`id`, `title`, `content`, `button_text`, `is_active`) VALUES
(1, 'ยินดีต้อนรับ', 'ยินดีต้อนรับสู่ร้านค้าของเรา!', 'เข้าสู่ร้านค้า', 1);

-- DROP TABLE IF EXISTS `recom`;
CREATE TABLE IF NOT EXISTS `recom` (
  `recom_1` int(11) NOT NULL DEFAULT 0,
  `recom_2` int(11) NOT NULL DEFAULT 0,
  `recom_3` int(11) NOT NULL DEFAULT 0,
  `recom_4` int(11) NOT NULL DEFAULT 0,
  `recom_5` int(11) NOT NULL DEFAULT 0,
  `recom_6` int(11) NOT NULL DEFAULT 0,
  `recom_7` int(11) NOT NULL DEFAULT 0,
  `recom_8` int(11) NOT NULL DEFAULT 0,
  `recom_9` int(11) NOT NULL DEFAULT 0,
  `recom_10` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT IGNORE INTO `recom` (`recom_1`, `recom_2`, `recom_3`, `recom_4`, `recom_5`, `recom_6`, `recom_7`, `recom_8`, `recom_9`, `recom_10`) VALUES
(0, 0, 0, 0, 0, 0, 0, 0, 0, 0);

-- DROP TABLE IF EXISTS `redeem`;
CREATE TABLE IF NOT EXISTS `redeem` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `code` varchar(255) NOT NULL,
  `count` int(11) NOT NULL DEFAULT 0,
  `max_count` int(11) NOT NULL,
  `prize` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- DROP TABLE IF EXISTS `redeem_his`;
CREATE TABLE IF NOT EXISTS `redeem_his` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `uid` varchar(11) NOT NULL,
  `code` varchar(255) NOT NULL,
  `date` datetime(2) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- DROP TABLE IF EXISTS `setting`;
CREATE TABLE IF NOT EXISTS `setting` (
  `wallet` varchar(255) NOT NULL,
  `fee` enum('on','off') NOT NULL DEFAULT 'off',
  `bg` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `ann` varchar(255) NOT NULL,
  `main_color` varchar(255) NOT NULL,
  `sec_color` varchar(255) NOT NULL,
  `contact` varchar(255) NOT NULL,
  `des` varchar(255) NOT NULL,
  `date` datetime(2) NOT NULL,
  `ip` varchar(100) NOT NULL,
  `logo` varchar(255) NOT NULL,
  `webhook_dc` varchar(255) NOT NULL,
  `discord_server` varchar(100) DEFAULT '',
  `theme_mode` varchar(10) DEFAULT 'light',
  `slip_api_type` varchar(50) DEFAULT 'easyslip',
  `slip_api_key` varchar(255) DEFAULT '',
  `slip_api_branch` varchar(100) DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT IGNORE INTO `setting` (`wallet`, `fee`, `bg`, `name`, `ann`, `main_color`, `sec_color`, `contact`, `des`, `date`, `ip`, `logo`, `webhook_dc`, `discord_server`, `theme_mode`, `slip_api_type`, `slip_api_key`, `slip_api_branch`) VALUES
('0954417885', 'off', 'ไม่สามารถเปลี่ยนได้', 'CYGNUSXSTORE', 'บริการขายแอพพรีเมี่ยมราคาถูกเริ่มต้น 10 บาท', '#4dd2fe', '#4dd2fe', '#', 'บริการขายแอพพรีเมี่ยมราคาถูกเริ่มต้น 10 บาท', '2022-12-25 12:30:39.00', '::1', 'https://img2.pic.in.th/pic/1000048898.png', '#', '', 'light', 'easyslip', '', '');

-- DROP TABLE IF EXISTS `static`;
CREATE TABLE IF NOT EXISTS `static` (
  `s_count` int(11) NOT NULL DEFAULT 2575,
  `b_count` int(11) NOT NULL DEFAULT 3525,
  `m_count` int(11) NOT NULL DEFAULT 5468,
  `c_count` int(11) NOT NULL DEFAULT 0,
  `sold_count` int(11) NOT NULL DEFAULT 0,
  `last_change` datetime(2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT IGNORE INTO `static` (`s_count`, `b_count`, `m_count`, `c_count`, `sold_count`, `last_change`) VALUES
(0, 0, 0, 0, 0, '2023-01-04 19:06:16.00');

-- DROP TABLE IF EXISTS `topup_his`;
CREATE TABLE IF NOT EXISTS `topup_his` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `link` text DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `uid` int(11) NOT NULL,
  `uname` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_uid` (`uid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- DROP TABLE IF EXISTS `users`;
CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `date` date NOT NULL,
  `point` float NOT NULL DEFAULT 0,
  `total` float NOT NULL DEFAULT 0,
  `rank` int(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT IGNORE INTO `users` (`id`, `username`, `password`, `date`, `point`, `total`, `rank`) VALUES
(1, 'zzzzzz', '6939753e9d733d983d9ed1ac6a2b73c6', '2024-05-02', 0, 0, 1);

COMMIT;
