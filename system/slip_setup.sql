-- ============================================
-- SQL สำหรับระบบ Slip Verification (PHP Only)
-- ============================================

-- เพิ่ม columns สำหรับตั้งค่า Slip API ในตาราง setting
ALTER TABLE `setting` 
ADD COLUMN IF NOT EXISTS `slip_api_type` VARCHAR(50) DEFAULT 'easyslip' COMMENT 'easyslip, slipok, rdcw',
ADD COLUMN IF NOT EXISTS `slip_api_key` VARCHAR(255) DEFAULT '' COMMENT 'API Key for slip verification',
ADD COLUMN IF NOT EXISTS `slip_api_branch` VARCHAR(100) DEFAULT '' COMMENT 'Branch ID for SlipOk';

-- ตารางเก็บ Transaction ที่ใช้แล้ว (ถ้ายังไม่มี)
CREATE TABLE IF NOT EXISTS `kbank_trans` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `qr` TEXT NOT NULL,
    `ref` VARCHAR(100) NOT NULL,
    `sender` VARCHAR(255) DEFAULT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `unique_ref` (`ref`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ตารางเก็บประวัติเติมเงิน (ถ้ายังไม่มี)
CREATE TABLE IF NOT EXISTS `topup_his` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `link` TEXT,
    `amount` DECIMAL(10,2) NOT NULL DEFAULT 0,
    `date` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `uid` INT(11) NOT NULL,
    `uname` VARCHAR(100) DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `idx_uid` (`uid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ตารางข้อมูลธนาคาร (ถ้ายังไม่มี)
CREATE TABLE IF NOT EXISTS `bank` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `tname` VARCHAR(100) DEFAULT 'PromptPay' COMMENT 'ชื่อธนาคาร',
    `fname` VARCHAR(100) DEFAULT '' COMMENT 'ชื่อจริง',
    `lname` VARCHAR(100) DEFAULT '' COMMENT 'นามสกุล',
    `bnum` VARCHAR(50) DEFAULT '' COMMENT 'เลขบัญชี/PromptPay ID',
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- ข้อมูลเริ่มต้น
-- ============================================

-- ใส่ข้อมูลธนาคารเริ่มต้น (ถ้ายังไม่มี)
INSERT IGNORE INTO `bank` (`id`, `tname`, `fname`, `lname`, `bnum`) 
VALUES (1, 'PromptPay', 'ชื่อ', 'สกุน', 'เลข');

-- ============================================
-- วิธีตั้งค่า API Key
-- ============================================

-- EasySlip (ฟรี): https://easyslip.com
-- UPDATE setting SET slip_api_type = 'easyslip', slip_api_key = 'YOUR_API_KEY' WHERE 1;

-- SlipOk: https://slipok.com
-- UPDATE setting SET slip_api_type = 'slipok', slip_api_key = 'YOUR_API_KEY', slip_api_branch = 'YOUR_BRANCH_ID' WHERE 1;

-- RDCW (Free): 
-- UPDATE setting SET slip_api_type = 'rdcw', slip_api_key = 'YOUR_BASIC_AUTH' WHERE 1;
