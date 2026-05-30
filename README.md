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

**Alternative:** connect the repo directly in Cloudflare Pages (build command `bash scripts/prepare-deploy.sh`, output `dist`). Use one method, not both.

### Contact form environment variables

Pages project → **Settings → Environment variables** (Production):

| Variable | Example | Required |
|----------|---------|----------|
| `CONTACT_TO` | `you@example.com, colleague@example.com` | Yes |
| `CONTACT_FROM` | `noreply@uthini.com` | Yes |
| `CONTACT_FROM_NAME` | `Uthini Contact` | No |
| `RESEND_API_KEY` | `re_…` | No |

#### Email DNS (Mailchannels — free default)

| Type | Name | Content |
|------|------|---------|
| TXT | `_mailchannels` | `v=mc1 cf_id=<YOUR_CLOUDFLARE_ACCOUNT_ID>` |
| TXT | `@` | `v=spf1 include:relay.mailchannels.net ~all` |

Or use [Resend](https://resend.com) and set `RESEND_API_KEY` instead.

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

## Branding

- Live logo: **`images/logo.svg`**
- Source files: **`branding/`** — copy finals into `images/`
- Colours/fonts: **`css/variables.css`**
- Social image: **`images/og-image.png`** (1200×630)

## Contact form security

| Measure | Purpose |
|--------|--------|
| No email in HTML | Recipients only in Cloudflare env vars |
| Input sanitization | Trims input, strips newlines/tags |
| Length limits | Name 200, email 254, subject 300, message 10,000 |
| Rate limiting | 5 submissions per 15 min per IP |
| Honeypot | Hidden `website` field rejects bots |
