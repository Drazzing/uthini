# Contact form: "mail() returned false" – fix it

If your error log shows **Uthini contact form: mail() returned false**, the server is using PHP `mail()` and GoDaddy is blocking it. Use one of these:

---

## Option 1: Formspree (fastest – no server install)

1. Go to **[formspree.io](https://formspree.io)** → Sign up → **New form**.
2. Copy your form URL (e.g. `https://formspree.io/f/xxxxxxxx`).
3. In **contact.html** change the form to:
   - **action:** your Formspree URL (replace the current `action="/contact-form.php"`).
   - Add **inside** the `<form>`, right after the opening `<form ...>` tag:
     ```html
     <input type="hidden" name="_next" value="https://uthini.com/contact.html?thanks=1">
     ```
4. In Formspree dashboard, set **Email** to `shawn.rosewarne@gmail.com` (or both addresses in Formspree settings if they allow it).
5. Upload the updated **contact.html** and test. You’ll get emails and users will still see your thanks page.

No PHP mail, no Composer, no server config.

---

## Option 2: PHPMailer on GoDaddy (use your PHP script)

The script uses PHPMailer when it finds **vendor/autoload.php** (Composer) or a **phpmailer/src/** folder (manual install). You only need one.

### Option 2a: Manual install (no Composer – recommended)

1. Download PHPMailer from [github.com/PHPMailer/PHPMailer/releases](https://github.com/PHPMailer/PHPMailer/releases) (Source code zip).
2. Unzip and copy the **src** folder from inside the PHPMailer folder into your project’s **phpmailer** folder so you have **phpmailer/src/PHPMailer.php**, **Exception.php**, **SMTP.php** (see **phpmailer/README.md** in this repo).
3. Upload the **phpmailer** folder (with src and all files) to your server in the **same directory** as contact-form.php.
4. In **contact-form.php** set `$from_email = 'info@uthini.com';` (or another @uthini.com address from GoDaddy Workspace Email).
5. Submit a test. “mail() returned false” should stop.

### Option 2b: Install via Composer

### Step 1: Install Composer and PHPMailer on the server

**If you have SSH or terminal on GoDaddy:**

1. SSH into your hosting (or use **cPanel → Terminal** if available).
2. Go to the folder that contains `contact-form.php` (often `public_html` or your domain folder):
   ```bash
   cd public_html
   ```
   (or `cd domains/uthini.com/public_html` – path may vary)
3. Install Composer (if not installed):
   ```bash
   curl -sS https://getcomposer.org/installer | php
   php composer.phar require phpmailer/phpmailer
   ```
   This creates a `vendor` folder and `vendor/autoload.php` next to `contact-form.php`.
4. Upload or deploy so `contact-form.php` and the `vendor` folder (with all its contents) are in the **same directory** on the server.

**If you don’t have SSH:**

1. On your **local** machine, in the same folder as `contact-form.php`, run:
   ```bash
   composer require phpmailer/phpmailer
   ```
2. Upload the whole project (including the new `vendor` folder) to GoDaddy via FTP or File Manager. Make sure `vendor/` and `contact-form.php` end up in the same directory on the server.

### Step 2: Use an @uthini.com From address (recommended)

GoDaddy’s relay often requires sending **from** an address on your domain.

1. In GoDaddy, create a **Workspace Email** (or use an existing one) for your domain, e.g. `info@uthini.com` or `contact@uthini.com`.
2. In **contact-form.php** at the top, set:
   ```php
   $from_email = 'info@uthini.com';  // use your @uthini.com address
   ```
3. Leave `$to` as your Gmail addresses – you’ll still receive there; Reply-To will be the visitor’s email.

### Step 3: Test

Submit the form once. Check:
- Your inbox (and spam).
- **contact-log.txt** on the server – you should see `SUBMIT sent` instead of errors.
- PHP error log – "mail() returned false" should stop once PHPMailer is used.

---

## Summary

| You see in log              | Meaning                    | Fix                                      |
|----------------------------|----------------------------|------------------------------------------|
| mail() returned false      | PHP mail() is blocked      | Use **Formspree** (Option 1) or **PHPMailer** (Option 2) |
| SUBMIT send_failed         | PHPMailer used but failed  | Use `$from_email = 'info@uthini.com'` and check SPF (see CONTACT-FORM-GODADDY.md) |
| SUBMIT sent                | Email sent                 | Check spam if you don’t see it            |
