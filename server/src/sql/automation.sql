CREATE TABLE IF NOT EXISTS automation_tasks (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(30) NOT NULL,
  device_ips TEXT NOT NULL,
  change_script TEXT NOT NULL,
  rollback_script TEXT NOT NULL,
  verify_script TEXT NOT NULL,
  change_status ENUM('未变更', '变更中', '变更异常', '变更完成') NOT NULL DEFAULT '未变更',
  change_log TEXT,
  verify_status ENUM('未校验', '校验中', '校验异常', '校验完成') NOT NULL DEFAULT '未校验',
  verify_log TEXT,
  rollback_status ENUM('未回退', '回退中', '回退异常', '回退完成') NOT NULL DEFAULT '未回退',
  rollback_log TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4; 
