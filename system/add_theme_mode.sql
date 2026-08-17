-- Add theme_mode column to setting table
ALTER TABLE `setting` ADD COLUMN IF NOT EXISTS `theme_mode` VARCHAR(10) DEFAULT 'light';

-- Update existing row if needed
UPDATE `setting` SET `theme_mode` = 'light' WHERE `theme_mode` IS NULL OR `theme_mode` = '';
