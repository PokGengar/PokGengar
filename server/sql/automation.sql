CREATE TABLE IF NOT EXISTS automation_tasks (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(30) NOT NULL,
  device_ips TEXT NOT NULL,
  change_script TEXT NOT NULL,
  rollback_script TEXT NOT NULL,
  verify_script TEXT NOT NULL,
  change_status ENUM('未变更', '变更中', '变更异常', '变更完成') NOT NULL DEFAULT '未变更',
  change_log LONGTEXT,
  verify_status ENUM('未校验', '校验中', '校验异常', '校验完成') NOT NULL DEFAULT '未校验',
  verify_log LONGTEXT,
  rollback_status ENUM('未回退', '回退中', '回退异常', '回退完成') NOT NULL DEFAULT '未回退',
  rollback_log LONGTEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS network_modules (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL,
  description TEXT,
  status TINYINT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 插入默认分区数据
INSERT INTO network_modules (name, description) VALUES 
('总部园区', '总部园区网络设备'),
('海外大区办公室', '海外大区办公室网络设备'),
('国内大区办公室', '国内大区办公室网络设备'),
('国内仓库', '国内仓库网络设备');

CREATE TABLE IF NOT EXISTS network_devices (
  id INT PRIMARY KEY AUTO_INCREMENT,
  module_id INT NOT NULL,
  hostname VARCHAR(100) NOT NULL,
  ip_address VARCHAR(15) NOT NULL,
  username VARCHAR(50),
  password VARCHAR(100),
  region VARCHAR(50),
  description TEXT,
  status ENUM('online', 'offline') DEFAULT 'offline',
  last_online TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (module_id) REFERENCES network_modules(id),
  UNIQUE KEY unique_ip (ip_address)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS servers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  ip VARCHAR(15) NOT NULL,
  region VARCHAR(50) NOT NULL,
  username VARCHAR(50) NOT NULL,
  password VARCHAR(255) NOT NULL,
  status ENUM('online', 'offline') DEFAULT 'offline',
  last_online TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_ip (ip)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
