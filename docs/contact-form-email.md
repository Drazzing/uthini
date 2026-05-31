# Contact form email (5-minute setup with Resend)

Mailchannels DNS is fiddly. **Resend** is the easy path for Cloudflare Pages — free tier includes **3,000 emails/month**, and because `uthini.com` is already on Cloudflare, domain verification is one click.

Official guides:
- [Resend + Cloudflare Workers](https://resend.com/docs/send-with-cloudflare-workers)
- [Resend + Cloudflare DNS (auto setup)](https://resend.com/docs/knowledge-base/cloudflare)

---

## Step 1 — Resend account + domain (≈2 min)

1. Sign up at [resend.com](https://resend.com)
2. **Domains → Add domain** → enter `uthini.com`
3. Click **Sign in to Cloudflare** — Resend adds DKIM/SPF records automatically via Domain Connect
4. Wait until domain status is **Verified** (usually a few minutes)

Do **not** enable “Receiving” unless you want Resend to receive inbound mail at `@uthini.com`.

---

## Step 2 — API key (≈1 min)

1. Resend → **API Keys → Create API Key**
2. Name: `uthini-contact-form`
3. Permission: **Sending access** (full access is fine)
4. Copy the key (starts with `re_`)

---

## Step 3 — Cloudflare Pages secrets (≈2 min)

**Workers & Pages → uthini → Settings → Variables and Secrets → Production**

| Variable | Example value |
|----------|----------------|
| `RESEND_API_KEY` | `re_xxxxxxxx` (Secret) |
| `CONTACT_TO` | `shawn.rosewarne@gmail.com, garyrosewarne8@gmail.com` |
| `CONTACT_FROM` | `noreply@uthini.com` (must use your verified domain) |
| `CONTACT_FROM_NAME` | `Uthini Contact` |

`CONTACT_FROM` must be an address on `uthini.com` (e.g. `noreply@uthini.com`). It does not need a real mailbox — Resend sends on your behalf.

---

## Step 4 — Redeploy

**Deployments → latest → ⋯ → Retry deployment**

Or push any change to `main`.

---

## Test

1. Open https://uthini.com/contact.html
2. Fill name, email, message → **Send message**
3. You should see **Thanks for getting in touch**
4. Check the Gmail inboxes in `CONTACT_TO`

---

## Still failing?

**Workers & Pages → uthini → Logs → Real-time logs**, submit the form, look for:

| Log | Fix |
|-----|-----|
| `RESEND_API_KEY not set` | Add secret in Step 3, redeploy |
| `Resend error: 403` | Domain not verified in Resend |
| `Resend error: 422` | `CONTACT_FROM` not on verified domain |
| `validation failed` | Form fields or Turnstile — remove `TURNSTILE_SECRET_KEY` if Turnstile not configured |

---

## Even easier alternative (no code)

If you want zero backend maintenance, use a hosted form service:

| Service | Free tier | Setup |
|---------|-----------|--------|
| [Formspree](https://formspree.io) | 50/month | Change form `action` to their URL |
| [StaticForms](https://staticforms.dev) | Generous free tier | Form `action` + API key |

Trade-off: submissions go through a third party; our self-hosted Resend path keeps everything on your domain and CSP.
