<?php
/**
 * Contact form handler – runs on your server.
 * Set $to and $from_email below. Your email is never published on the site.
 *
 * Uses PHP mail() only. Per GoDaddy: "If you use a PHP script and the mail() function,
 * you do not need to specify a relay server." The server handles delivery.
 * From = email on your domain. SPF: v=spf1 include:secureserver.net -all
 * https://www.godaddy.com/help/send-form-mail-using-an-smtp-relay-server-953
 *
 * Logging: contact-log.txt. Security: rate limit, honeypot.
 */
$to = 'shawn.rosewarne@gmail.com, garyrosewarne8@gmail.com';
$from_email = 'noreply@uthini123.com';
$from_name = 'Uthini Contact';

$contact_log_file = __DIR__ . '/contact-log.txt';
$contact_log_fallback = sys_get_temp_dir() . '/uthini_contact_log.txt';

function uthini_contact_log($message, $log_file, $fallback_file = '') {
  $line = '[' . date('Y-m-d H:i:s') . '] ' . $message . "\n";
  $prefixed = 'Uthini contact: ' . trim($message);
  if (function_exists('error_log')) {
    error_log($prefixed);
  }
  if ($log_file) {
    @file_put_contents($log_file, $line, FILE_APPEND | LOCK_EX);
  }
  if ($fallback_file) {
    @file_put_contents($fallback_file, $line, FILE_APPEND | LOCK_EX);
  }
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  header('Location: /contact.html');
  exit;
}

$ip = $_SERVER['REMOTE_ADDR'] ?? '';

$rate_limit_file = sys_get_temp_dir() . '/uthini_contact_' . md5($ip);
$rate_limit_window = 900;
$rate_limit_max = 5;
$now = time();
$timestamps = [];
if (is_file($rate_limit_file)) {
  $timestamps = array_filter(array_map('intval', explode("\n", (string) file_get_contents($rate_limit_file))), function ($t) use ($rate_limit_window, $now) {
    return ($now - $t) < $rate_limit_window;
  });
}
if (count($timestamps) >= $rate_limit_max) {
  uthini_contact_log("BLOCKED rate_limit ip=$ip", $contact_log_file, $contact_log_fallback);
  header('Location: /contact.html?thanks=0');
  exit;
}

if (isset($_POST['website']) && trim((string) $_POST['website']) !== '') {
  uthini_contact_log("BLOCKED honeypot ip=$ip", $contact_log_file, $contact_log_fallback);
  header('Location: /contact.html?thanks=0');
  exit;
}

$sanitize = function ($s, $max_len = 10000) {
  $s = trim((string) $s);
  $s = str_replace(["\r", "\n"], ' ', $s);
  return mb_substr($s, 0, $max_len, 'UTF-8');
};

$name    = $sanitize($_POST['name'] ?? '', 200);
$email   = $sanitize($_POST['email'] ?? '', 254);
$subject = $sanitize($_POST['subject'] ?? 'Uthini Solutions Enquiry', 300);
$message = $sanitize($_POST['message'] ?? '', 10000);

$ok = $name !== '' && $email !== '' && $message !== '' && filter_var($email, FILTER_VALIDATE_EMAIL);

if (!$ok) {
  $reason = !$name ? 'name_empty' : (!$email ? 'email_empty' : (!$message ? 'message_empty' : 'email_invalid'));
  uthini_contact_log("VALIDATION_FAILED $reason ip=$ip email=" . substr($email, 0, 50), $contact_log_file, $contact_log_fallback);
} else {
  $subject_line = 'Uthini Solutions: ' . ($subject !== '' ? $subject : 'Enquiry');
  $body = "Name: $name\r\nEmail: $email\r\n\r\nMessage:\r\n$message";

  $send_fail_reason = '';
  @ini_set('sendmail_from', $from_email);
  $headers = "From: $from_name <$from_email>\r\nReply-To: $email\r\nContent-Type: text/plain; charset=UTF-8\r\nX-Mailer: PHP/" . PHP_VERSION;
  $sent = @mail($to, $subject_line, $body, $headers);
  if (!$sent) {
    $send_fail_reason = 'mail() returned false';
    uthini_contact_log("ERROR mail_failed To=$to From=$from_email", $contact_log_file, $contact_log_fallback);
    if (function_exists('error_log')) {
      error_log('Uthini contact form: mail() returned false. To=' . $to . ' From=' . $from_email);
    }
  }

  $log_subject = str_replace(["\t", "\n", "\r"], ' ', $subject);
  $log_subject = mb_substr($log_subject, 0, 60, 'UTF-8');
  $status = $sent ? 'sent' : 'send_failed';
  $log_line = "SUBMIT $status name=" . $name . " email=" . $email . " subject=" . $log_subject . " ip=$ip";
  if (!$sent && $send_fail_reason !== '') {
    $log_line .= " reason=" . $send_fail_reason;
  }
  uthini_contact_log($log_line, $contact_log_file, $contact_log_fallback);

  $timestamps[] = $now;
  @file_put_contents($rate_limit_file, implode("\n", $timestamps));
}

header('Location: /contact.html?thanks=' . ($ok ? '1' : '0'));
exit;
