# Contact form email (Cloudflare only)

Pages **cannot** send email directly. This project uses:

1. **`uthini-contact-email` Worker** — has the `send_email` binding (Workers support this)
2. **Pages Function** — calls the Worker via `EMAIL_WORKER` service binding in `wrangler.toml`

No Resend. No third parties. All Cloudflare free tier.

Docs: [Send emails from Workers](https://developers.cloudflare.com/email-routing/email-workers/send-email-workers/)

---

## Step 1 — Enable Email Routing

1. Cloudflare → **uthini.com** → **Email** → **Email Routing** → **Enable**

---

## Step 2 — Verify Gmail inboxes

**Email Routing → Destination addresses → Add**

- `shawn.rosewarne@gmail.com` → verify
- `garyrosewarne8@gmail.com` → verify

---

## Step 3 — Deploy (automatic via GitHub Actions)

Each push to `main` deploys:

1. **`uthini-contact-email`** worker (`workers/contact-email/`)
2. **Pages site** with service binding to that worker

You do **not** add Bindings in the dashboard — `wrangler.toml` handles it:

```toml
[[services]]
binding = "EMAIL_WORKER"
service = "uthini-contact-email"
```

---

## Step 4 — Pages environment variables

**Workers & Pages → uthini → Settings → Variables and Secrets → Production**

| Variable | Example |
|----------|---------|
| `CONTACT_TO` | `shawn.rosewarne@gmail.com, garyrosewarne8@gmail.com` |
| `CONTACT_FROM` | `noreply@uthini.com` |
| `CONTACT_FROM_NAME` | `Uthini Contact` |

---

## Step 5 — Test

1. https://uthini.com/contact.html
2. Submit the form
3. Check Gmail

---

## Troubleshooting (Real-time Logs)

| Log | Fix |
|-----|-----|
| `EMAIL_WORKER binding missing` | Redeploy — worker must exist before Pages binding works |
| `email worker error: 500` | Gmail not verified in Email Routing (Step 2) |
| `send_email` wrangler error on deploy | Should only be in `workers/contact-email/wrangler.toml`, not Pages root |

---

## Why two parts?

| Component | Role |
|-----------|------|
| Pages Function | Form validation, spam checks |
| Email Worker | Actually sends email (Cloudflare limitation) |

This is the standard Cloudflare pattern when using Pages + email.
