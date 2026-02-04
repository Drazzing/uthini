# Contact form – database logging

Contact form events are written to the **contact_log** table. Create the table once manually (script does not create it).

## Windows hosting (GoDaddy Plesk)

GoDaddy Windows hosting can use **SQL Server** or **MySQL**. Choose one:

| Database   | Script to run        | In contact-form-config.php   |
|-----------|----------------------|------------------------------|
| SQL Server | **contact_log.sql** (repo root) | `$contact_db_driver = 'sqlsrv'` |
| MySQL      | **contact_log_mysql.sql**       | `$contact_db_driver = 'mysql'`  |

- **SQL Server:** Open in SSMS or your SQL Server tool, select database (e.g. `Drazzing123_`), run the script. PHP needs the **pdo_sqlsrv** extension (Microsoft Drivers for PHP for SQL Server).
- **MySQL:** In **Plesk → Databases → phpMyAdmin**, select database, SQL tab, paste and run **contact_log_mysql.sql**.

## Set config in contact-form-config.php

Set `$contact_db_pass` and, for Windows hosting, `$contact_db_driver` (`'sqlsrv'` or `'mysql'`). Keep `$contact_db_host`, `$contact_db_name`, `$contact_db_user` as needed.

## Table: contact_log

| Column       | Description                                      |
|-------------|---------------------------------------------------|
| id          | Auto-increment primary key                        |
| created_at  | When the event was logged                         |
| status      | `blocked`, `validation_failed`, `sent`, `send_failed`, `error` |
| detail      | e.g. `rate_limit`, `honeypot`, `name_empty`       |
| name        | Submitter name (for sent/send_failed)             |
| email       | Submitter email                                   |
| subject     | Subject line                                      |
| message     | Message body                                      |
| ip          | Client IP                                         |
| error_reason| Error message when status is send_failed or error  |

If the database connection fails, the script still runs and falls back to PHP `error_log()` for that request.
