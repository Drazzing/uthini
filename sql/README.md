# Contact log table (SQL Server)

**contact_log.sql** creates the `contact_log` table for Microsoft SQL Server. Use it if you add database logging to the contact form.

The current **contact-form.php** does not write to a database; it only sends email (PHPMailer or PHP `mail()`).

## How to run

1. Open the script in SSMS or your SQL Server tool.
2. Select your database (e.g. your GoDaddy SQL Server database).
3. Execute the script once.

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
