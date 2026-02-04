# Contact form – database logging

Contact form events are written to MySQL instead of a log file.

The **contact_log** table is created automatically the first time the form logs an event (CREATE TABLE IF NOT EXISTS). You can still run **contact_log.sql** manually if you prefer.

## Set the password in contact-form.php

In `contact-form.php` at the top, set your database password:

```php
$db_pass = 'YOUR_ACTUAL_PASSWORD';
```

Keep `$db_host`, `$db_name`, and `$db_user` as they are (or change if your host/database name differs). No need to create the table manually; it is created if it does not exist.

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
