<?php
/**
 * Contact form handler – secure, best-practice implementation.
 *
 * Security: POST only, Referer check (same-origin), rate limit, honeypot,
 * input validation/sanitization, header injection prevention, PDO prepared statements,
 * config outside repo (contact-form-config.php), no sensitive data in responses.
 *
 * Sending: PHPMailer with GoDaddy relay (relay-hosting.secureserver.net:25, no auth);
 * then PHP mail() fallback. From address must be a valid email on your domain (GoDaddy).
 * Logging: MySQL contact_log (created if not exists). Set config in contact-form-config.php.
 */
declare(strict_types=1);

// Defaults; override in contact-form-config.php (do not commit that file).
// GoDaddy: From must be a valid email on your domain (e.g. noreply@uthini123.com).
$contact_to          = 'shawn.rosewarne@gmail.com, garyrosewarne8@gmail.com';
$contact_from_email  = 'noreply@uthini123.com';
$contact_from_name   = 'Uthini Contact';
$contact_db_host     = 'P3NWPLSK12SQL-v11.shr.prod.phx3.secureserver.net';
$contact_db_name     = 'Drazzing123_';
$contact_db_user     = 'uthini';
$contact_db_pass     = (function () {
  $p = getenv('CONTACT_DB_PASS');
  return $p !== false && $p !== '' ? $p : 'YOUR_PASSWORD';
})();

// Optional: create contact-form-config.php (gitignored) with $contact_to, $contact_from_email,
// $contact_from_name, $contact_db_host, $contact_db_name, $contact_db_user, $contact_db_pass.
$configFile = __DIR__ . '/contact-form-config.php';
if (is_file($configFile)) {
  require $configFile;
}

// Constants – single source of truth
const CONTACT_REDIRECT_PATH = '/contact.html';
const CONTACT_RATE_WINDOW   = 900;
const CONTACT_RATE_MAX      = 5;
const CONTACT_MAX_NAME      = 200;
const CONTACT_MAX_EMAIL     = 254;
const CONTACT_MAX_SUBJECT   = 300;
const CONTACT_MAX_MESSAGE   = 10000;
const CONTACT_MAX_ERROR_LEN = 500;
const CONTACT_STATUS_BLOCKED = 'blocked';
const CONTACT_STATUS_VALIDATION_FAILED = 'validation_failed';
const CONTACT_STATUS_SENT   = 'sent';
const CONTACT_STATUS_SEND_FAILED = 'send_failed';
const CONTACT_STATUS_ERROR  = 'error';

/**
 * Safe redirect – 303 See Other, no cache, no content before headers.
 */
function contact_redirect(string $path, string $query = ''): void {
  $url = $path . ($query !== '' ? '?' . $query : '');
  header('Cache-Control: no-store, no-cache, must-revalidate');
  header('Pragma: no-cache');
  header('Location: ' . $url, true, 303);
  exit;
}

/**
 * Same-origin Referer check to reduce CSRF risk.
 */
function contact_referer_ok(): bool {
  $referer = $_SERVER['HTTP_REFERER'] ?? '';
  if ($referer === '') {
    return true;
  }
  $host = $_SERVER['HTTP_HOST'] ?? '';
  if ($host === '') {
    return true;
  }
  $parsed = parse_url($referer);
  $refHost = $parsed['host'] ?? '';
  return strtolower($refHost) === strtolower($host);
}

/**
 * Sanitize string: trim, strip tags, normalize whitespace, enforce max length.
 */
function contact_sanitize(string $value, int $maxLen = CONTACT_MAX_MESSAGE): string {
  $value = trim($value);
  $value = strip_tags($value);
  $value = str_replace(["\r", "\n"], ' ', $value);
  $value = preg_replace('/\s+/', ' ', $value);
  return mb_substr($value, 0, $maxLen, 'UTF-8');
}

/**
 * Check for CRLF / header injection in mail headers.
 */
function contact_safe_header_value(string $value): bool {
  return strpos($value, "\r") === false && strpos($value, "\n") === false;
}

/**
 * PDO connection (lazy). Returns null if config missing or connection fails.
 */
function contact_db(): ?PDO {
  global $contact_db_host, $contact_db_name, $contact_db_user, $contact_db_pass;
  static $pdo = null;
  if ($pdo !== null) {
    return $pdo;
  }
  if ($contact_db_pass === '' || $contact_db_pass === 'YOUR_PASSWORD') {
    return null;
  }
  try {
    $dsn = 'mysql:host=' . $contact_db_host . ';dbname=' . $contact_db_name . ';charset=utf8mb4';
    $pdo = new PDO($dsn, $contact_db_user, $contact_db_pass, [
      PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
      PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
  } catch (PDOException $e) {
    if (function_exists('error_log')) {
      error_log('Uthini contact: DB connect failed: ' . $e->getMessage());
    }
    return null;
  }
  return $pdo;
}

/**
 * Create contact_log table if it does not exist.
 */
function contact_ensure_table(PDO $pdo): void {
  static $done = false;
  if ($done) {
    return;
  }
  $sql = "CREATE TABLE IF NOT EXISTS contact_log (
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
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
  try {
    $pdo->exec($sql);
    $done = true;
  } catch (PDOException $e) {
    if (function_exists('error_log')) {
      error_log('Uthini contact: create table failed: ' . $e->getMessage());
    }
  }
}

/**
 * Log one event to contact_log. Bounds string lengths; never throws.
 */
function contact_log_db(array $data): void {
  $pdo = contact_db();
  if (!$pdo) {
    if (function_exists('error_log')) {
      error_log('Uthini contact: ' . json_encode(array_intersect_key($data, array_flip(['status', 'detail', 'ip']))));
    }
    return;
  }
  contact_ensure_table($pdo);
  $defaults = [
    'status'       => '',
    'detail'       => null,
    'name'         => null,
    'email'        => null,
    'subject'      => null,
    'message'      => null,
    'ip'           => null,
    'error_reason' => null,
  ];
  $row = array_merge($defaults, $data);
  $row['status']       = mb_substr((string) $row['status'], 0, 32, 'UTF-8');
  $row['detail']       = $row['detail'] !== null ? mb_substr((string) $row['detail'], 0, 128, 'UTF-8') : null;
  $row['name']         = $row['name'] !== null ? mb_substr((string) $row['name'], 0, CONTACT_MAX_NAME, 'UTF-8') : null;
  $row['email']        = $row['email'] !== null ? mb_substr((string) $row['email'], 0, CONTACT_MAX_EMAIL, 'UTF-8') : null;
  $row['subject']      = $row['subject'] !== null ? mb_substr((string) $row['subject'], 0, CONTACT_MAX_SUBJECT, 'UTF-8') : null;
  $row['message']      = $row['message'] !== null ? mb_substr((string) $row['message'], 0, CONTACT_MAX_MESSAGE, 'UTF-8') : null;
  $row['ip']           = $row['ip'] !== null ? mb_substr((string) $row['ip'], 0, 45, 'UTF-8') : null;
  $row['error_reason'] = $row['error_reason'] !== null ? mb_substr((string) $row['error_reason'], 0, CONTACT_MAX_ERROR_LEN, 'UTF-8') : null;

  try {
    $stmt = $pdo->prepare('INSERT INTO contact_log (status, detail, name, email, subject, message, ip, error_reason) VALUES (:status, :detail, :name, :email, :subject, :message, :ip, :error_reason)');
    $stmt->execute([
      'status'       => $row['status'],
      'detail'       => $row['detail'],
      'name'         => $row['name'],
      'email'        => $row['email'],
      'subject'      => $row['subject'],
      'message'      => $row['message'],
      'ip'           => $row['ip'],
      'error_reason' => $row['error_reason'],
    ]);
  } catch (PDOException $e) {
    if (function_exists('error_log')) {
      error_log('Uthini contact: DB insert failed: ' . $e->getMessage());
    }
  }
}

// ——— Request handling ———

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  contact_redirect(CONTACT_REDIRECT_PATH);
}

if (!contact_referer_ok()) {
  contact_redirect(CONTACT_REDIRECT_PATH, 'thanks=0');
}

$ip = $_SERVER['REMOTE_ADDR'] ?? '';

// Rate limit (file-based per IP)
$rateFile = sys_get_temp_dir() . '/uthini_contact_' . md5($ip);
$now      = time();
$timestamps = [];
if (is_file($rateFile)) {
  $content = (string) file_get_contents($rateFile);
  $timestamps = array_filter(
    array_map('intval', explode("\n", $content)),
    fn(int $t): bool => ($now - $t) < CONTACT_RATE_WINDOW
  );
}
if (count($timestamps) >= CONTACT_RATE_MAX) {
  contact_log_db(['status' => CONTACT_STATUS_BLOCKED, 'detail' => 'rate_limit', 'ip' => $ip]);
  contact_redirect(CONTACT_REDIRECT_PATH, 'thanks=0');
}

// Honeypot
if (isset($_POST['website']) && trim((string) $_POST['website']) !== '') {
  contact_log_db(['status' => CONTACT_STATUS_BLOCKED, 'detail' => 'honeypot', 'ip' => $ip]);
  contact_redirect(CONTACT_REDIRECT_PATH, 'thanks=0');
}

$name    = contact_sanitize($_POST['name'] ?? '', CONTACT_MAX_NAME);
$email   = contact_sanitize($_POST['email'] ?? '', CONTACT_MAX_EMAIL);
$subject = contact_sanitize($_POST['subject'] ?? 'Uthini Solutions Enquiry', CONTACT_MAX_SUBJECT);
$message = contact_sanitize($_POST['message'] ?? '', CONTACT_MAX_MESSAGE);

$emailValid = filter_var($email, FILTER_VALIDATE_EMAIL);
$ok = $name !== '' && $email !== '' && $message !== '' && $emailValid;

if (!$ok) {
  $reason = !$name ? 'name_empty' : (!$email ? 'email_empty' : (!$message ? 'message_empty' : 'email_invalid'));
  contact_log_db(['status' => CONTACT_STATUS_VALIDATION_FAILED, 'detail' => $reason, 'ip' => $ip, 'email' => $email]);
  contact_redirect(CONTACT_REDIRECT_PATH, 'thanks=0');
}

// Header injection check for mail()
if (!contact_safe_header_value($name) || !contact_safe_header_value($email)) {
  contact_log_db(['status' => CONTACT_STATUS_BLOCKED, 'detail' => 'header_injection', 'ip' => $ip]);
  contact_redirect(CONTACT_REDIRECT_PATH, 'thanks=0');
}

global $contact_to, $contact_from_email, $contact_from_name;

$subjectLine = 'Uthini Solutions: ' . ($subject !== '' ? $subject : 'Enquiry');
$bodyPlain   = "Name: $name\r\nEmail: $email\r\n\r\nMessage:\r\n$message";

$nameEsc    = htmlspecialchars($name, ENT_QUOTES, 'UTF-8');
$emailEsc   = htmlspecialchars($email, ENT_QUOTES, 'UTF-8');
$subjectEsc = htmlspecialchars($subject !== '' ? $subject : 'Enquiry', ENT_QUOTES, 'UTF-8');
$messageEsc = htmlspecialchars($message, ENT_QUOTES, 'UTF-8');
$messageBr  = nl2br($messageEsc, false);

$bodyHtml = <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Contact form submission</title>
</head>
<body style="font-family: system-ui, -apple-system, sans-serif; line-height: 1.5; color: #1a1a1a; max-width: 36rem; margin: 0 auto; padding: 1.5rem;">
  <h2 style="margin: 0 0 1rem; font-size: 1.25rem; color: #8503B0;">New contact form message</h2>
  <table style="width: 100%; border-collapse: collapse;">
    <tr><td style="padding: 0.35rem 0.5rem 0.35rem 0; font-weight: 600; color: #555;">Name</td><td style="padding: 0.35rem 0;">{$nameEsc}</td></tr>
    <tr><td style="padding: 0.35rem 0.5rem 0.35rem 0; font-weight: 600; color: #555;">Email</td><td style="padding: 0.35rem 0;"><a href="mailto:{$emailEsc}" style="color: #8503B0;">{$emailEsc}</a></td></tr>
    <tr><td style="padding: 0.35rem 0.5rem 0.35rem 0; font-weight: 600; color: #555;">Subject</td><td style="padding: 0.35rem 0;">{$subjectEsc}</td></tr>
  </table>
  <p style="margin: 1rem 0 0; font-weight: 600; color: #555;">Message</p>
  <div style="margin-top: 0.35rem; padding: 0.75rem; background: #f5f5f5; border-radius: 0.25rem; border-left: 3px solid #8503B0;">{$messageBr}</div>
  <p style="margin-top: 1.5rem; font-size: 0.875rem; color: #888;">Sent via Uthini Solutions contact form.</p>
</body>
</html>
HTML;

$sent           = false;
$sendFailReason = '';

// Try PHPMailer
$phpmailerLoaded = false;
if (is_file(__DIR__ . '/vendor/autoload.php')) {
  try {
    require_once __DIR__ . '/vendor/autoload.php';
    $phpmailerLoaded = true;
  } catch (Throwable $e) {
    contact_log_db(['status' => CONTACT_STATUS_ERROR, 'detail' => 'phpmailer_autoload', 'error_reason' => $e->getMessage(), 'ip' => $ip]);
  }
}
if (!$phpmailerLoaded && is_file(__DIR__ . '/phpmailer/src/PHPMailer.php')) {
  try {
    require_once __DIR__ . '/phpmailer/src/Exception.php';
    require_once __DIR__ . '/phpmailer/src/PHPMailer.php';
    require_once __DIR__ . '/phpmailer/src/SMTP.php';
    $phpmailerLoaded = true;
  } catch (Throwable $e) {
    contact_log_db(['status' => CONTACT_STATUS_ERROR, 'detail' => 'phpmailer_manual', 'error_reason' => $e->getMessage(), 'ip' => $ip]);
  }
}

if ($phpmailerLoaded && class_exists('PHPMailer\PHPMailer\PHPMailer')) {
  try {
    $mail = new \PHPMailer\PHPMailer\PHPMailer(true);
    $mail->isSMTP();
    $mail->Host       = 'relay-hosting.secureserver.net';
    $mail->Port       = 25;
    $mail->SMTPAuth   = false;
    $mail->SMTPAutoTLS = false;
    $mail->setFrom($contact_from_email, $contact_from_name);
    $mail->addReplyTo($email, $name);
    foreach (array_filter(array_map('trim', explode(',', $contact_to))) as $addr) {
      if ($addr !== '') {
        $mail->addAddress($addr);
      }
    }
    $mail->Subject = $subjectLine;
    $mail->isHTML(true);
    $mail->Body    = $bodyHtml;
    $mail->AltBody = $bodyPlain;
    $mail->CharSet = 'UTF-8';
    $mail->Encoding = 'base64';
    $sent = $mail->send();
  } catch (Throwable $e) {
    $sendFailReason = 'phpmailer_send: ' . $e->getMessage();
  }
}

if (!$sent) {
  @ini_set('sendmail_from', $contact_from_email);
  $headers = "From: " . $contact_from_name . " <" . $contact_from_email . ">\r\n"
    . "Reply-To: " . $email . "\r\n"
    . "Content-Type: text/plain; charset=UTF-8\r\n"
    . "X-Mailer: PHP/" . PHP_VERSION;
  $sent = @mail($contact_to, $subjectLine, $bodyPlain, $headers);
  if (!$sent) {
    $sendFailReason = 'mail() returned false';
  }
}

$logSubject = str_replace(["\t", "\n", "\r"], ' ', $subject);
$logSubject = mb_substr($logSubject, 0, CONTACT_MAX_SUBJECT, 'UTF-8');
$status = $sent ? CONTACT_STATUS_SENT : CONTACT_STATUS_SEND_FAILED;

contact_log_db([
  'status'       => $status,
  'name'         => $name,
  'email'        => $email,
  'subject'      => $logSubject,
  'message'      => $message,
  'ip'           => $ip,
  'error_reason' => $sendFailReason !== '' ? $sendFailReason : null,
]);

$timestamps[] = $now;
@file_put_contents($rateFile, implode("\n", $timestamps));

contact_redirect(CONTACT_REDIRECT_PATH, 'thanks=1');
