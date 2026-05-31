# Uthini website

Static site for [uthini.com](https://uthini.com) on **Cloudflare Pages** (free tier) with a serverless contact form.

## Publish

Push to `main` runs **Publish site** (`.github/workflows/deploy.yml`).

**GitHub secrets** (Settings → Secrets → Actions):

| Secret | Value |
|--------|-------|
| `CLOUDFLARE_API_TOKEN` | My Profile → API Tokens — **Workers Scripts** + **Cloudflare Pages** → Edit |
| `CLOUDFLARE_ACCOUNT_ID` | Workers & Pages sidebar |

**Contact form:** onboard `uthini.com` in [Email Sending](https://developers.cloudflare.com/email-service/get-started/send-emails/), set Pages env vars — see `docs/contact-form-email.md`.

### Deploy failed?

| Error | Fix |
|-------|-----|
| `Invalid API Token` | Re-save full token in `CLOUDFLARE_API_TOKEN` |
| Auth on Worker deploy | Add **Workers Scripts → Edit** |
| Auth on Pages deploy | Add **Cloudflare Pages → Edit** |
| Wrong account | Match `CLOUDFLARE_ACCOUNT_ID` to the token’s account |

## Local preview

```bash
bash scripts/prepare-deploy.sh
npx wrangler pages dev dist
```

`.dev.vars` (gitignored): `CONTACT_TO`, `CONTACT_FROM`.

## Layout

| Path | Purpose |
|------|---------|
| `*.html`, `css/`, `js/`, `images/` | Site |
| `functions/` | Contact form + security headers |
| `workers/contact-email/` | Email Worker (`send_email`) |
| `wrangler.toml` | Pages `EMAIL_WORKER` binding |
| `scripts/prepare-deploy.sh` | Build `dist/` |
| `scripts/cloudflare-preflight.sh` | CI token + project checks |
| `docs/` | Email + DNS migration notes |

## Security

Headers in `_headers` (static) and `functions/_middleware.js` (form responses) — keep CSP in sync.

Contact form: origin check, rate limit, honeypots, sanitization. Recipients only in Cloudflare env vars.
