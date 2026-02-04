# Contact form – database logging

Contact form events are written to MySQL instead of a log file.

The script tries to create the **contact_log** table automatically (CREATE TABLE IF NOT EXISTS) before each insert.

**If the table was not created** (e.g. no rows in contact_log after sending the form): your database user may not have CREATE TABLE permission (common on GoDaddy). Create the table once manually:

1. In **Plesk → Databases → phpMyAdmin** (or your host’s MySQL tool), open the database (e.g. `Drazzing123_`).
2. Run the SQL in **contact_log.sql** (copy and paste, then Execute).

After that, the form will insert rows into the existing table.

## Set the password in contact-form-config.php

In `contact-form.php` at the top, set your database password:

```php
$db_pass = 'YOUR_ACTUAL_PASSWORD';
```

Keep `$db_host`, `$db_name`, and `$db_user` as they are (or change if your host/database name differs).

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
