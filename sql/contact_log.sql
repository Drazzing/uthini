-- Contact form log table (MySQL). Run once in your database (e.g. phpMyAdmin or Plesk).
-- Database: Drazzing123_ (or your DB name). Create table:

CREATE TABLE IF NOT EXISTS contact_log (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(32) NOT NULL COMMENT 'blocked, validation_failed, sent, send_failed',
  detail VARCHAR(128) NULL COMMENT 'e.g. rate_limit, honeypot, name_empty',
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
