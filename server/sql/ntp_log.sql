-- 创建 NTP 日志表
CREATE TABLE IF NOT EXISTS ntp_log (
    id INT PRIMARY KEY AUTO_INCREMENT,
    date_time DATETIME,
    ip_address VARCHAR(20),
    `offset` DECIMAL(20, 10),  -- 使用反引号包裹 offset 关键字
    root_delay DECIMAL(20, 10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_date_time (date_time),
    INDEX idx_ip_address (ip_address)
); 
