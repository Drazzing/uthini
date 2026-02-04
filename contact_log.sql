-- Contact form log table (Microsoft SQL Server). Run once in your database.
-- Open in SSMS or your SQL Server tool, select database (e.g. Drazzing123_), then run.

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'contact_log')
BEGIN
  CREATE TABLE contact_log (
    id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    status VARCHAR(32) NOT NULL,
    detail VARCHAR(128) NULL,
    name VARCHAR(200) NULL,
    email VARCHAR(254) NULL,
    subject VARCHAR(300) NULL,
    message NVARCHAR(MAX) NULL,
    ip VARCHAR(45) NULL,
    error_reason VARCHAR(500) NULL
  );

  CREATE INDEX idx_created ON contact_log (created_at);
  CREATE INDEX idx_status ON contact_log (status);
  CREATE INDEX idx_ip ON contact_log (ip);
END;
