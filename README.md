# Uthini website

Static site for uthini.com. Built for GoDaddy Windows Economy hosting: plain HTML, CSS, and minimal JS. Fast, secure, and SEO-friendly.

**Repo:** [github.com/Drazzing/uthini](https://github.com/Drazzing/uthini)

## Structure

- `index.html` – Home
- `about.html` – About
- `services.html` – Services
- `contact.html` – Contact (form only; no email published)
- `contact-form.php` – Form handler on your server (set your email in this file)
- `css/variables.css` – Design tokens (colours, fonts)
- `css/style.css` – Base styles, hero, section reveal
- `js/main.js` – Footer year, mobile nav, scroll reveal
- `js/contact.js` – Contact thanks message after submit
- `images/` – Logo and other assets
- `robots.txt`, `sitemap.xml` – SEO

## Branding

### Logo

- Add your logo as **`images/logo.svg`** or **`images/logo.png`**.
- You can also keep source files in **`branding/`** and copy the final logo into `images/`.
- The header uses `images/logo.svg`; if the file is missing, the word “Uthini” is shown instead.

### Colours and fonts

Edit **`css/variables.css`**. Replace the placeholder values with your brand:

| Variable | Use |
|----------|-----|
| `--color-primary` | Headings, dark accents |
| `--color-secondary` | Secondary backgrounds |
| `--color-accent` | Links, buttons (hover) |
| `--color-highlight` | Primary CTA buttons |
| `--color-background` | Page background |
| `--color-surface` | Cards, header |
| `--color-text` | Body text |
| `--color-text-muted` | Secondary text |
| `--font-heading` | Headings |
| `--font-body` | Body text |

Load your webfont in the `<head>` of each HTML file (e.g. Google Fonts link), then set the font variable names in `variables.css`.

### Open Graph image

For social sharing, add **`images/og-image.png`** (recommended 1200×630 px). Each page references `https://uthini.com/images/og-image.png` in its Open Graph meta tags.

## Contact form (self-hosted, no signup)

The contact form posts to **`contact-form.php`** on your server. Your email is only in that file, never in the HTML.

**1. Set your email** – Edit **`contact-form.php`** and replace `YOUR_EMAIL@example.com` with your real address (line 7).

**2. Hosting** – GoDaddy Windows Economy often supports PHP. Upload `contact-form.php` with the rest of the site. If PHP is not available, use your host form tool.

**3. After submit** – The script redirects to `contact.html?thanks=1` and the thanks message is shown. No third-party services.

## Security

The site and form are hardened to reduce abuse and common attacks:

| Measure | Purpose |
|--------|--------|
| **No email in HTML** | Your address lives only in `contact-form.php` on the server, so scrapers and bots cannot harvest it from the page. |
| **Input sanitization** | All form inputs are trimmed and stripped of newlines (`\r`, `\n`) before use, so attackers cannot inject extra email headers or new lines. |
| **Length limits** | Name (200), email (254), subject (300), message (10,000 chars) to limit huge or malicious payloads. |
| **Rate limiting** | Up to 5 submissions per 15 minutes per IP (stored in temp files). Reduces spam and automated abuse. |
| **Honeypot field** | A hidden “website” field is ignored by humans; bots that fill it are rejected. |
| **Credentials not in repo** | FTP details are in `.gitignore`; deploy uses GitHub Actions secrets. |

**You:** Keep `contact-form.php` updated, use a strong FTP password, and turn on HTTPS for the domain in GoDaddy so all traffic is encrypted.

## Branding review

Your **`branding/`** folder is used as follows (deploy does not upload `branding/`; only `images/` goes live):

| Source | Use on site |
|--------|-------------|
| **branding/SVG Vector Files/Transparent Logo.svg** | Copied to **images/logo.svg** – header logo |
| **branding/Favicon/** | Copy Favicon Original.ico to **images/favicon.ico** and add a favicon link in each page head |
| **branding/PNG Logo Files/** | Use for **images/og-image.png** (1200×630) for social sharing |
| **branding/PDF Guideline.pdf**, logo guide PDFs | Use for colours/fonts: set **css/variables.css** to match (e.g. purple, cyan, orange from the logo) |
| **branding/Social Media Kit/** | Reference for LinkedIn, Facebook, Instagram; not deployed |

Logo colours from your SVG: orange #FFC577, purple #9900CC / #8503B0, cyan #73ECFF / #BFFFF6, magenta #E600E2. Align **css/variables.css** to these if you want the site palette to match.

## Deploy

### Push from GitHub to GoDaddy (automatic)

When you push to the `main` branch, GitHub Actions deploys the site to GoDaddy via FTP.

**1. Add repository secrets**

In your GitHub repo: **Settings → Secrets and variables → Actions → New repository secret**. Create:

| Secret          | Value                    | Example / notes                          |
|-----------------|--------------------------|------------------------------------------|
| `FTP_SERVER`    | GoDaddy FTP host         | `50.63.8.217` or `ftp.yourdomain.com`    |
| `FTP_USERNAME`  | FTP username             | Your GoDaddy FTP user                    |
| `FTP_PASSWORD`  | FTP password             | Your GoDaddy FTP password               |

**2. Set the web root path (if needed)**

The workflow uploads to `/httpdocs`. On GoDaddy Windows this is usually correct. If your site lives elsewhere (e.g. `/wwwroot` or the FTP user’s root), edit [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) and change `server-dir`:

```yaml
server-dir: /httpdocs   # or /wwwroot or / depending on your host
```

**3. Push to `main`**

From your local project folder (with Git initialised):

```bash
git remote add origin https://github.com/Drazzing/uthini.git
git branch -M main
git push -u origin main
```

After that, any push or merge to `main` will trigger the deploy. The **Actions** tab on [github.com/Drazzing/uthini](https://github.com/Drazzing/uthini) will show each run. The workflow excludes `.git`, `.github`, `uthini.com`, `README.md`, and `branding/` so they are not uploaded.

### Manual deploy (FTP)

1. Upload the contents of this folder to your GoDaddy web root (`httpdocs` or `wwwroot`) via FTP.
2. Do **not** upload the `uthini.com` credentials file; it is listed in `.gitignore`.
3. Ensure the domain uses HTTPS in GoDaddy so all links and assets load over SSL.

## Growth ideas

Add client testimonials or case studies when you have them; add a short portfolio or “Selected work” section; keep the “Why choose us” and services copy aligned with how you position (product-first, consulting + dev + design, Sydney-based).
