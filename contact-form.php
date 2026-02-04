<?php
/**
 * Contact form handler – runs on your server. No third-party signup.
 * Set $to and $from_email below. Your email is never published on the site.
 *
 * If you don't receive emails: (1) Check spam/junk. (2) From is now a fixed address so servers don't reject. (3) On GoDaddy Windows, mail() can be unreliable – if it still fails, use SMTP (e.g. PHPMailer with Gmail or GoDaddy SMTP).
 *
 * Security: input sanitization (header injection), rate limiting, honeypot, length limits.
 */
$to = 'shawn.rosewarne@gmail.com, garyrosewarne8@gmail.com'; // Recipients
$from_email = 'shawn.rosewarne@gmail.com'; // Use a known sender so mail isn't rejected (same domain or your address)

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  header('Location: /contact.html');
  exit;
}

// --- Rate limit: max 5 submissions per 15 minutes per IP ---
$rate_limit_file = sys_get_temp_dir() . '/uthini_contact_' . md5($_SERVER['REMOTE_ADDR'] ?? '');
$rate_limit_window = 900;   // 15 minutes
$rate_limit_max     = 5;
$now = time();
$timestamps = [];
if (is_file($rate_limit_file)) {
  $timestamps = array_filter(array_map('intval', explode("\n", (string) file_get_contents($rate_limit_file))), function ($t) use ($rate_limit_window, $now) {
    return ($now - $t) < $rate_limit_window;
  });
}
if (count($timestamps) >= $rate_limit_max) {
  header('Location: /contact.html?thanks=0');
  exit;
}

// --- Honeypot: bots often fill this; humans leave it empty ---
if (isset($_POST['website']) && trim((string) $_POST['website']) !== '') {
  header('Location: /contact.html?thanks=0');
  exit;
}

// --- Sanitize: strip newlines to prevent header / injection ---
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

if ($ok) {
  $subject_line = 'Uthini Solutions: ' . ($subject !== '' ? $subject : 'Enquiry');
  $body = "Name: $name\nEmail: $email\n\nMessage:\n$message";
  // From: use a fixed sender. On GoDaddy, using an @yourdomain.com address (e.g. info@uthini.com) often works better – set $from_email above.
  // Reply-To: visitor so you can reply. X-Mailer: some GoDaddy servers expect it.
  $headers = "From: Uthini Contact <$from_email>\r\nReply-To: $email\r\nContent-Type: text/plain; charset=UTF-8\r\nX-Mailer: PHP/" . PHP_VERSION;
  $sent = @mail($to, $subject_line, $body, $headers);
  if (!$sent && function_exists('error_log')) {
    error_log('Uthini contact form: mail() returned false. To=' . $to . ' From=' . $from_email);
  }

  $timestamps[] = $now;
  @file_put_contents($rate_limit_file, implode("\n", $timestamps));
}

header('Location: /contact.html?thanks=' . ($ok ? '1' : '0'));
exit;
