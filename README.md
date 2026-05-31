# Uthini website

Static site for uthini.com. Hosted on **Cloudflare Pages** (free tier): HTML, CSS, minimal JS, and a serverless contact form.

**Repo:** [github.com/Drazzing/uthini](https://github.com/Drazzing/uthini)

## Structure

| Path | Purpose |
|------|---------|
| `*.html` | Site pages |
| `functions/contact-form.js` | Contact form handler (Pages Function) |
| `css/`, `js/`, `images/` | Styles, scripts, assets |
| `robots.txt`, `sitemap.xml` | SEO |
| `_redirects`, `_headers` | Cloudflare routing and security headers |
| `scripts/prepare-deploy.sh` | Builds `dist/` for publish |
| `branding/` | Source logo files (not published) |
| `docs/` | Migration notes |

## Publish (GitHub Actions)

Every push to `main` runs **Publish site** (`.github/workflows/deploy.yml`). You can also trigger it manually from the **Actions** tab.

**1. Create a Cloudflare API token**

Dashboard → **My Profile** → **API Tokens** → create token with **Cloudflare Pages: Edit**.

**2. Add GitHub secrets**

Repo → **Settings → Secrets and variables → Actions**:

| Secret | Value |
|--------|-------|
| `CLOUDFLARE_API_TOKEN` | Token from step 1 |
| `CLOUDFLARE_ACCOUNT_ID` | Workers & Pages → sidebar → Account ID |

**3. Push to `main`**

The workflow builds `dist/` and deploys to the Cloudflare Pages project `uthini`.

### Deploy failed?

| Error / cause | Fix |
|---------------|-----|
| Missing secret | Add both `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` in GitHub → Settings → Secrets → Actions |
| Project does not exist | Workflow auto-creates `uthini`; or create manually in Workers & Pages → Create → Pages |
| Authentication error | Token needs **Account → Cloudflare Pages → Edit**; revoke and create a new token if exposed |
| Wrong Account ID | Copy from Cloudflare **Workers & Pages** sidebar (32-character hex string) |

Re-run from **Actions → Publish site → Run workflow** after fixing.

**Alternative:** connect the repo directly in Cloudflare Pages (build command `bash scripts/prepare-deploy.sh`, output `dist`). Use one method, not both.

### Contact form email (Cloudflare only — free)

Full guide: **`docs/contact-form-email.md`**

1. **uthini.com → Email → Email Routing** → Enable  
2. **Destination addresses** → verify your Gmail inboxes  
3. **Pages → uthini → Settings → Bindings** → Add **Send Email** → name: `EMAIL`  
4. Keep env vars: `CONTACT_TO`, `CONTACT_FROM`, `CONTACT_FROM_NAME`  
5. **Retry deployment**

No Resend, no Mailchannels, no extra signup.

### Custom domain

Pages project → **Custom domains** → add `uthini.com` and `www.uthini.com`.

See `docs/cloudflare-migration.txt` for full DNS migration from GoDaddy.

## Local preview

```bash
bash scripts/prepare-deploy.sh
npx wrangler pages dev dist
```

Create `.dev.vars` (gitignored) for local form testing:

```
CONTACT_TO=you@example.com
CONTACT_FROM=noreply@uthini.com
```

Local dev also needs the Send Email binding in `wrangler.toml` and Email Routing enabled on your domain.

## Branding

- Live logo: **`images/logo.svg`**
- Source files: **`branding/`** — copy finals into `images/`
- Colours/fonts: **`css/variables.css`**
- Social image: **`images/og-image.png`** (1200×630)

## Security

### HTTP headers (all pages)

Set in `_headers` and enforced on function responses via `functions/_middleware.js`:

- **Strict-Transport-Security** — HTTPS only
- **Content-Security-Policy** — restricts scripts, styles, frames, and form targets to trusted sources
- **X-Frame-Options / frame-ancestors** — clickjacking protection
- **X-Content-Type-Options** — blocks MIME sniffing
- **Referrer-Policy**, **COOP**, **CORP**, **Permissions-Policy**

### Contact form

| Measure | Purpose |
|--------|--------|
| No email in HTML | Recipients only in Cloudflare env vars |
| Origin / Referer check | Rejects cross-site form posts |
| Content-Type validation | Only accepts standard form submissions |
| Body size limit | 32 KB max payload |
| Input sanitization | Strips control chars, HTML, newlines |
| Header injection guard | Sanitizes name/subject used in email headers |
| Length limits | Enforced client- and server-side |
| Rate limiting | 5 POSTs per 15 min per IP |
| Honeypot fields | Hidden `website` and `url` trap bots |
| Timing check | Rejects submissions faster than 3 s or older than 1 h |
| Optional Turnstile | Set site key in `contact.html` meta + `TURNSTILE_SECRET_KEY` env |

### Enable Turnstile (recommended)

1. Cloudflare dashboard → **Turnstile** → Add widget for `uthini.com`
2. In `contact.html`, set `<meta name="turnstile-site-key" content="YOUR_SITE_KEY">`
3. In Pages env vars, set `TURNSTILE_SECRET_KEY`

### Cloudflare dashboard settings

- **SSL/TLS** → Full (strict)
- **Always Use HTTPS** → On
- **Automatic HTTPS Rewrites** → On
- **Security** → Bot Fight Mode → On (free tier)
