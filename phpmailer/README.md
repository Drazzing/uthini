# PHPMailer – manual install (no Composer)

The contact form uses PHPMailer to send via GoDaddy’s SMTP when PHP `mail()` fails. You can install it **without Composer** by putting the PHPMailer source here.

## Steps

1. **Download PHPMailer**  
   Go to [github.com/PHPMailer/PHPMailer/releases](https://github.com/PHPMailer/PHPMailer/releases) and download the latest **Source code (zip)**.

2. **Extract the `src` folder**  
   Unzip the download. Inside you’ll see a folder named `PHPMailer-*` with a `src` subfolder. Copy that **`src`** folder (and its contents) into this `phpmailer` folder.

3. **Resulting structure**  
   You should have:
   ```
   phpmailer/
     README.md
     src/
       Exception.php
       PHPMailer.php
       SMTP.php
       (and any other .php files in src)
   ```

4. **Upload**  
   Upload the whole `phpmailer` folder (including `src` and all files) to your server in the **same directory** as `contact-form.php`.

5. **Set From address**  
   In `contact-form.php` at the top, set:
   ```php
   $from_email = 'info@uthini.com';  // or another @uthini.com address from GoDaddy Workspace Email
   ```

After that, the contact form will use PHPMailer with GoDaddy’s relay instead of `mail()`, and “mail() returned false” should stop.
