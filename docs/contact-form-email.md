# Contact form email

Pages cannot send email. This repo uses:

1. **`uthini-contact-email` Worker** — `[[send_email]]` in `workers/contact-email/wrangler.toml`
2. **Pages Function** — calls the Worker via `EMAIL_WORKER` in root `wrangler.toml`

Guide: [Send emails (Email Service)](https://developers.cloudflare.com/email-service/get-started/send-emails/)

## Setup

1. **Email Sending** — Cloudflare → **Email Sending** → onboard `uthini.com` (SPF/DKIM DNS)
2. **Deploy** — push to `main` (GitHub Actions deploys Worker + Pages)
3. **Pages env vars** (Workers & Pages → uthini → Settings → Variables → Production):

| Variable | Example |
|----------|---------|
| `CONTACT_TO` | `you@gmail.com, other@gmail.com` |
| `CONTACT_FROM` | `noreply@uthini.com` |
| `CONTACT_FROM_NAME` | `Uthini Contact` |

4. **Test** — https://uthini.com/contact.html

## Troubleshooting

| Log | Fix |
|-----|-----|
| `EMAIL_WORKER binding missing` | Redeploy; Worker must exist before Pages binding works |
| `email worker error: 500` | Domain not onboarded in Email Sending, or invalid `CONTACT_FROM` |
| Auth error in CI | API token needs **Workers Scripts** + **Cloudflare Pages** → Edit (see README) |
