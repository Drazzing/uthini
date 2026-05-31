# Contact form email (Cloudflare only — no Resend)

Send form submissions using **Cloudflare Email Routing** — free, no third-party signup.

Docs: [Send emails from Workers](https://developers.cloudflare.com/email-routing/email-workers/send-email-workers/)

---

## Step 1 — Enable Email Routing (~2 min)

1. Cloudflare dashboard → **uthini.com**
2. **Email** → **Email Routing** → **Get started** / **Enable**
3. Cloudflare may add MX records — that's normal (needed for the email product)

You do **not** need custom addresses like `hello@uthini.com` unless you want inbound mail. For the contact form, you only need **verified destination addresses** (step 2).

---

## Step 2 — Verify your Gmail inboxes (~2 min)

1. **Email Routing** → **Destination addresses** → **Add destination address**
2. Add `shawn.rosewarne@gmail.com` → verify via the email Cloudflare sends
3. Repeat for `garyrosewarne8@gmail.com`

Recipients in `CONTACT_TO` must be verified here.

---

## Step 3 — Add Send Email binding (~1 min)

This is the **Bindings** section (not Variables and Secrets):

1. **Workers & Pages** → **uthini** → **Settings**
2. **Bindings** → **Add** → **Send Email**
3. **Variable name:** `EMAIL` (must match exactly)
4. Leave destination unrestricted, or set **Allowed destination addresses** to your Gmail addresses
5. **Save**

Also in repo: `wrangler.toml` declares the same binding for deploys.

---

## Step 4 — Environment variables

**Settings → Variables and Secrets → Production:**

| Variable | Example |
|----------|---------|
| `CONTACT_TO` | `shawn.rosewarne@gmail.com, garyrosewarne8@gmail.com` |
| `CONTACT_FROM` | `noreply@uthini.com` |
| `CONTACT_FROM_NAME` | `Uthini Contact` |

Remove `RESEND_API_KEY` if you added it — not needed.

`CONTACT_FROM` must use `@uthini.com` (domain with Email Routing enabled).

---

## Step 5 — Redeploy

**Deployments → latest → Retry deployment**

Or push to `main`.

---

## Test

1. https://uthini.com/contact.html
2. Submit the form
3. Check Gmail inboxes

---

## Troubleshooting

**Real-time Logs** (Workers & Pages → uthini → Logs):

| Log | Fix |
|-----|-----|
| `EMAIL binding missing` | Add Send Email binding named `EMAIL` (Step 3) |
| `Cloudflare Email error` | Destination not verified in Email Routing (Step 2) |
| `CONTACT_FROM misconfigured` | Use `noreply@uthini.com` format |

---

## What you don't need

- Resend account
- Mailchannels DNS records
- Paid Cloudflare plan (Email Routing send from Workers is free)
