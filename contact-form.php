<?php
/**
 * Contact form – GoDaddy Windows Hosting.
 *
 * PHPMailer: uses GoDaddy relay (relay-hosting.secureserver.net, port 25, no auth).
 * From address must be a valid email on your domain. Install PHPMailer (Composer or phpmailer/src/).
 */
$to         = 'shawn.rosewarne@gmail.com, garyrosewarne8@gmail.com';
$from_email = 'noreply@uthini123.com';
$from_name  = 'Uthini Contact';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  header('Location: /contact.html');
  exit;
}

if (!empty(trim($_POST['website'] ?? ''))) {
  header('Location: /contact.html?thanks=0&reason=validation');
  exit;
}

$name    = trim(strip_tags($_POST['name'] ?? ''));
$email   = trim(strip_tags($_POST['email'] ?? ''));
$subject = trim(strip_tags($_POST['subject'] ?? ''));
$message = trim(strip_tags($_POST['message'] ?? ''));

$ok = $name !== '' && $email !== '' && $message !== '' && filter_var($email, FILTER_VALIDATE_EMAIL);

if (!$ok) {
  header('Location: /contact.html?thanks=0&reason=validation');
  exit;
}

$subject_line = 'Uthini Solutions: ' . ($subject !== '' ? $subject : 'Enquiry');
$body         = "Name: $name\r\nEmail: $email\r\n\r\nMessage:\r\n$message";

$sent = false;

if (is_file(__DIR__ . '/vendor/autoload.php')) {
  require_once __DIR__ . '/vendor/autoload.php';
}
if (!class_exists('PHPMailer\PHPMailer\PHPMailer') && is_file(__DIR__ . '/phpmailer/src/PHPMailer.php')) {
  require_once __DIR__ . '/phpmailer/src/Exception.php';
  require_once __DIR__ . '/phpmailer/src/PHPMailer.php';
  require_once __DIR__ . '/phpmailer/src/SMTP.php';
}

if (class_exists('PHPMailer\PHPMailer\PHPMailer')) {
  try {
    $mail = new \PHPMailer\PHPMailer\PHPMailer(true);
    $mail->isSMTP();
    $mail->Host       = 'localhost';
    $mail->Port       = 25;
    $mail->SMTPAuth   = false;
    $mail->SMTPAutoTLS = false;
    $mail->setFrom($from_email, $from_name);
    $mail->addReplyTo($email, $name);
    foreach (array_filter(array_map('trim', explode(',', $to))) as $addr) {
      if ($addr !== '') {
        $mail->addAddress($addr);
      }
    }
    $mail->Subject = $subject_line;
    $mail->Body    = $body;
    $mail->CharSet = 'UTF-8';
    $sent = $mail->send();
  } catch (Throwable $e) {
    error_log('[contact-form] PHPMailer: ' . $e->getMessage());
    $sent = false;
  }
}

if (!$sent) {
  ini_set('sendmail_from', $from_email);
  $to_list = implode(', ', array_filter(array_map('trim', explode(',', $to))));
  $headers = "From: $from_name <$from_email>\r\nReply-To: $name <$email>\r\nContent-Type: text/plain; charset=UTF-8\r\nX-Mailer: PHP/" . PHP_VERSION;
  $sent = @mail($to_list, $subject_line, $body, $headers);
  if (!$sent) {
    error_log('[contact-form] mail() returned false');
  }
}

if ($sent) {
  header('Location: /contact.html?thanks=1');
} else {
  header('Location: /contact.html?thanks=0&reason=send');
}
exit;
