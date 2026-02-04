<?php
/**
 * Contact form handler – runs on your server. No third-party signup.
 * Set $to to your email below. Your email is never published on the site.
 *
 * Security: input sanitization (header injection), rate limiting, honeypot, length limits.
 */
$to = 'shawn.rosewarne@gmail.com, garyrosewarne8@gmail.com'; // You and Garry

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  header('Location: contact.html');
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
  header('Location: contact.html?thanks=0');
  exit;
}

// --- Honeypot: bots often fill this; humans leave it empty ---
if (isset($_POST['website']) && trim((string) $_POST['website']) !== '') {
  header('Location: contact.html?thanks=0');
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
  // Use only sanitized email in headers to prevent header injection
  $headers = "From: $email\r\nReply-To: $email\r\nContent-Type: text/plain; charset=UTF-8\r\n";
  @mail($to, $subject_line, $body, $headers);

  $timestamps[] = $now;
  @file_put_contents($rate_limit_file, implode("\n", $timestamps));
}

header('Location: contact.html?thanks=' . ($ok ? '1' : '0'));
exit;
