# Contact form not receiving email – what to check (GoDaddy)

Your form posts to `contact-form.php`. On GoDaddy, PHP `mail()` is often restricted or unreliable. Options below.

---

## Option A: Formspree (no server mail – works in minutes)

Use a third-party form backend so you don’t rely on GoDaddy mail at all.

1. Go to **[formspree.io](https://formspree.io)** and sign up (free tier is fine).
2. Create a new form; Formspree gives you a URL like `https://formspree.io/f/xxxxxx`.
3. In **contact.html**, change the form to:
   - **action:** `https://formspree.io/f/YOUR_FORM_ID` (replace `YOUR_FORM_ID` with your ID).
   - **method:** `post` (keep as is).
   - Add this hidden input **inside** the `<form>`, before the first form group:
     ```html
     <input type="hidden" name="_next" value="https://uthini.com/contact.html?thanks=1">
     <input type="hidden" name="_replyto" value="" id="contact-email-replyto">
     ```
     (Optional: use JavaScript to set `contact-email-replyto` from the email field so Formspree uses it as Reply-To.)
   - You can leave the rest of the form (name, email, subject, message) as is; Formspree forwards all fields to your email.
4. In Formspree dashboard, set the email address where you want to receive submissions.
5. Submit a test. You should get the email and be redirected to `contact.html?thanks=1`.

**Pros:** No server config, no spam from your server, works immediately.  
**Cons:** Formspree branding on free tier; for heavy use check their limits.

---

## 1. Check the obvious

- **Spam / Junk** – Look in spam for both `shawn.rosewarne@gmail.com` and `garyrosewarne8@gmail.com`.
- **Correct URL** – Form must submit to your live site (e.g. `https://uthini.com/contact.html`). Submitting from `file://` or localhost won’t hit your GoDaddy PHP.
- **PHP errors** – In GoDaddy **cPanel → Errors** (or **PHP Error Log**), check for messages like `Uthini contact form: mail() returned false` (we log that when `mail()` fails).

---

## 2. Use a “From” address on your domain (recommended on GoDaddy)

GoDaddy often accepts mail more reliably when **From** is an address at your domain (e.g. `info@uthini.com`), not Gmail.

1. In GoDaddy, create or use an existing **Workspace Email** (or “Email & Office”) mailbox for your domain, e.g. `info@uthini.com` or `contact@uthini.com`.
2. In `contact-form.php`, set:
   - `$from_email = 'info@uthini.com';` (or whatever address you created).
3. Leave `$to` as your real inboxes; you’ll still receive the messages there. `Reply-To` stays the visitor’s email so you can reply normally.

---

## 3. DNS: SPF record for GoDaddy

So receiving servers don’t treat your mail as spam:

1. In GoDaddy: **My Products → DNS** for `uthini.com`.
2. Add (or update) an **SPF** (TXT) record so it includes GoDaddy’s mail:
   - **Type:** TXT  
   - **Name:** `@` (or your root domain)  
   - **Value:** `v=spf1 include:secureserver.net -all`  
   If you already have an SPF record, add `include:secureserver.net` and keep a single `v=spf1 ... -all` record.

---

## 4. GoDaddy hosting / PHP mail

- **Linux vs Windows** – PHP `mail()` is usually more reliable on **Linux** hosting. If you’re on Windows, consider switching the site to Linux or using SMTP (below).
- In **cPanel** (Linux): **Email → Email Deliverability** – fix any issues it reports.
- Ensure the domain’s **nameservers** point to GoDaddy so mail and DNS are consistent.

---

## 5. If mail() still doesn’t work: use SMTP (PHPMailer + GoDaddy relay)

GoDaddy often blocks sending via external SMTP (e.g. Gmail’s SMTP). Use **their** relay instead:

1. Install **PHPMailer** (e.g. via Composer or a single download) on your GoDaddy account.
2. Configure it to use **GoDaddy’s relay**:
   - **Host:** `relay-hosting.secureserver.net`
   - **Port:** 25
   - **Encryption:** none
   - **Authentication:** off (for this relay)

3. Send from an address on your domain (e.g. `info@uthini.com`).  
4. Keep the same `$to` and `Reply-To` logic so you still get messages in your Gmail (and Gary’s) and can reply to the visitor.

If you want, we can rewrite `contact-form.php` to use PHPMailer with these settings so you don’t rely on `mail()`.

---

## 6. Quick test

After changing `$from_email` or SMTP:

1. Submit the form once from your phone (using a different network than your office) so you’re not blocked by rate limiting.
2. Check inbox and spam for both recipient addresses.
3. Check GoDaddy’s error log again for any new PHP or mail errors.

---

**Summary:** Prefer **From = @uthini.com** and **SPF with secureserver.net**. If mail still doesn’t arrive, install PHPMailer (Composer) so the script can use GoDaddy's relay; `contact-form.php` already uses it when `vendor/autoload.php` exists.
