-- Contact form log table (MySQL). For Windows hosting when using MySQL database.
-- Run once in phpMyAdmin / Plesk: select database (e.g. Drazzing123_), SQL tab, paste and run.
-- In contact-form-config.php set: $contact_db_driver = 'mysql';

CREATE TABLE IF NOT EXISTS contact_log (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(32) NOT NULL,
  detail VARCHAR(128) NULL,
  name VARCHAR(200) NULL,
  email VARCHAR(254) NULL,
  subject VARCHAR(300) NULL,
  message TEXT NULL,
  ip VARCHAR(45) NULL,
  error_reason VARCHAR(500) NULL,
  INDEX idx_created (created_at),
  INDEX idx_status (status),
  INDEX idx_ip (ip)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
