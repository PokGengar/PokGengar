-- 检查 ip_address 列是否存在
SET @column_exists = (
  SELECT COUNT(*) 
  FROM information_schema.columns 
  WHERE table_schema = 'netdevops' 
    AND table_name = 'servers' 
    AND column_name = 'ip_address'
);

-- 如果 ip_address 列存在，则重命名为 ip
SET @sql = IF(@column_exists > 0,
  'ALTER TABLE servers CHANGE COLUMN ip_address ip VARCHAR(15) NOT NULL;',
  'SELECT "Column ip_address not found or already renamed" AS message;'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt; 
