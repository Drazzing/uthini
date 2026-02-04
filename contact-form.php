<?php
/**
 * Contact form handler – runs on your server.
 * Set $to and $from_email below. Your email is never published on the site.
 *
 * Sending: tries PHPMailer + GoDaddy SMTP if vendor/autoload.php exists (install with: composer require phpmailer/phpmailer). Otherwise uses PHP mail().
 *
 * Logging: submissions and errors are appended to contact-log.txt in the same folder as this script.
 *
 * Security: sanitization, rate limiting, honeypot, length limits.
 */
$to = 'shawn.rosewarne@gmail.com, garyrosewarne8@gmail.com';
$from_email = 'shawn.rosewarne@gmail.com'; // Prefer @uthini.com on GoDaddy
$from_name = 'Uthini Contact';

$contact_log_file = __DIR__ . '/contact-log.txt';

function uthini_contact_log($message, $log_file) {
  if (!$log_file) {
    return;
  }
  $line = '[' . date('Y-m-d H:i:s') . '] ' . $message . "\n";
  @file_put_contents($log_file, $line, FILE_APPEND | LOCK_EX);
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
  uthini_contact_log("BLOCKED rate_limit ip=$ip", $contact_log_file);
  header('Location: /contact.html?thanks=0');
  exit;
}

if (isset($_POST['website']) && trim((string) $_POST['website']) !== '') {
  uthini_contact_log("BLOCKED honeypot ip=$ip", $contact_log_file);
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
  uthini_contact_log("VALIDATION_FAILED $reason ip=$ip email=" . substr($email, 0, 50), $contact_log_file);
} else {
  $subject_line = 'Uthini Solutions: ' . ($subject !== '' ? $subject : 'Enquiry');
  $body = "Name: $name\nEmail: $email\n\nMessage:\n$message";

  $sent = false;
  $phpmailer_loaded = false;
  if (is_file(__DIR__ . '/vendor/autoload.php')) {
    try {
      require_once __DIR__ . '/vendor/autoload.php';
      $phpmailer_loaded = true;
    } catch (Throwable $e) {
      uthini_contact_log("ERROR phpmailer_autoload " . $e->getMessage(), $contact_log_file);
      if (function_exists('error_log')) {
        error_log('Uthini contact: PHPMailer autoload failed: ' . $e->getMessage());
      }
    }
  }

  if ($phpmailer_loaded && class_exists('PHPMailer\PHPMailer\PHPMailer')) {
    try {
      $mail = new \PHPMailer\PHPMailer\PHPMailer(true);
      $mail->isSMTP();
      $mail->Host = 'relay-hosting.secureserver.net';
      $mail->Port = 25;
      $mail->SMTPAuth = false;
      $mail->SMTPSecure = false;
      $mail->setFrom($from_email, $from_name);
      $mail->addReplyTo($email, $name);
      foreach (array_map('trim', explode(',', $to)) as $addr) {
        if ($addr !== '') {
          $mail->addAddress($addr);
        }
      }
      $mail->Subject = $subject_line;
      $mail->Body = $body;
      $mail->CharSet = 'UTF-8';
      $mail->Encoding = 'base64';
      $sent = $mail->send();
    } catch (Throwable $e) {
      uthini_contact_log("ERROR phpmailer_send " . $e->getMessage(), $contact_log_file);
      if (function_exists('error_log')) {
        error_log('Uthini contact: PHPMailer send failed: ' . $e->getMessage());
      }
    }
  }

  if (!$sent) {
    $headers = "From: $from_name <$from_email>\r\nReply-To: $email\r\nContent-Type: text/plain; charset=UTF-8\r\nX-Mailer: PHP/" . PHP_VERSION;
    $sent = @mail($to, $subject_line, $body, $headers);
    if (!$sent) {
      uthini_contact_log("ERROR mail_failed To=$to From=$from_email", $contact_log_file);
      if (function_exists('error_log')) {
        error_log('Uthini contact form: mail() returned false. To=' . $to . ' From=' . $from_email);
      }
    }
  }

  $log_subject = str_replace(["\t", "\n", "\r"], ' ', $subject);
  $log_subject = mb_substr($log_subject, 0, 60, 'UTF-8');
  $status = $sent ? 'sent' : 'send_failed';
  uthini_contact_log("SUBMIT $status name=" . $name . " email=" . $email . " subject=" . $log_subject . " ip=$ip", $contact_log_file);

  $timestamps[] = $now;
  @file_put_contents($rate_limit_file, implode("\n", $timestamps));
}

header('Location: /contact.html?thanks=' . ($ok ? '1' : '0'));
exit;
