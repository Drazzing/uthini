/**
 * Contact form handler for Cloudflare Pages Functions.
 *
 * Set environment variables in Cloudflare Pages → Settings → Environment variables:
 *   CONTACT_TO          – comma-separated recipient addresses (required)
 *   CONTACT_FROM        – sender address on your domain, e.g. noreply@uthini.com (required)
 *   CONTACT_FROM_NAME   – optional display name (default: "Uthini Contact")
 *   RESEND_API_KEY      – optional; if set, email is sent via Resend instead of Mailchannels
 */

const LIMITS = { name: 200, email: 254, subject: 300, message: 10000 };
const RATE_LIMIT = { max: 5, windowSeconds: 900 };

function redirectToContact(params) {
  const qs = new URLSearchParams(params).toString();
  return new Response(null, {
    status: 302,
    headers: { Location: `/contact.html?${qs}` },
  });
}

function sanitize(value) {
  return String(value ?? "")
    .trim()
    .replace(/[\r\n]+/g, " ")
    .replace(/<[^>]*>/g, "");
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= LIMITS.email;
}

function getClientIp(request) {
  return (
    request.headers.get("CF-Connecting-IP") ||
    request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

async function isRateLimited(ip) {
  const cache = caches.default;
  const cacheKey = new Request(`https://rate-limit.internal/${encodeURIComponent(ip)}`);
  const existing = await cache.match(cacheKey);
  const count = existing ? parseInt(await existing.text(), 10) || 0 : 0;

  if (count >= RATE_LIMIT.max) {
    return true;
  }

  await cache.put(cacheKey, new Response(String(count + 1)), {
    expirationTtl: RATE_LIMIT.windowSeconds,
  });
  return false;
}

async function sendViaResend(apiKey, { from, fromName, to, replyTo, replyName, subject, body }) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `${fromName} <${from}>`,
      to: to.split(",").map((addr) => addr.trim()).filter(Boolean),
      reply_to: `${replyName} <${replyTo}>`,
      subject,
      text: body,
    }),
  });
  return response.ok;
}

async function sendViaMailchannels({ from, fromName, to, replyTo, replyName, subject, body }) {
  const recipients = to
    .split(",")
    .map((addr) => addr.trim())
    .filter(Boolean)
    .map((email) => ({ email }));

  const response = await fetch("https://api.mailchannels.net/tx/v1/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      personalizations: [{ to: recipients }],
      from: { email: from, name: fromName },
      reply_to: { email: replyTo, name: replyName },
      subject,
      content: [{ type: "text/plain", value: body }],
    }),
  });
  return response.ok;
}

export async function onRequestGet() {
  return new Response(null, {
    status: 302,
    headers: { Location: "/contact.html" },
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  const to = env.CONTACT_TO;
  const from = env.CONTACT_FROM;
  const fromName = env.CONTACT_FROM_NAME || "Uthini Contact";

  if (!to || !from) {
    console.error("[contact-form] CONTACT_TO or CONTACT_FROM not configured");
    return redirectToContact({ thanks: "0", reason: "send" });
  }

  let formData;
  try {
    formData = await request.formData();
  } catch {
    return redirectToContact({ thanks: "0", reason: "validation" });
  }

  if (sanitize(formData.get("website"))) {
    return redirectToContact({ thanks: "0", reason: "validation" });
  }

  const name = sanitize(formData.get("name")).slice(0, LIMITS.name);
  const email = sanitize(formData.get("email")).slice(0, LIMITS.email);
  const subject = sanitize(formData.get("subject")).slice(0, LIMITS.subject);
  const message = sanitize(formData.get("message")).slice(0, LIMITS.message);

  if (!name || !email || !message || !isValidEmail(email)) {
    return redirectToContact({ thanks: "0", reason: "validation" });
  }

  const ip = getClientIp(request);
  if (await isRateLimited(ip)) {
    return redirectToContact({ thanks: "0", reason: "send" });
  }

  const subjectLine = `Uthini Solutions: ${subject || "Enquiry"}`;
  const body = `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`;

  let sent = false;
  try {
    if (env.RESEND_API_KEY) {
      sent = await sendViaResend(env.RESEND_API_KEY, {
        from,
        fromName,
        to,
        replyTo: email,
        replyName: name,
        subject: subjectLine,
        body,
      });
    } else {
      sent = await sendViaMailchannels({
        from,
        fromName,
        to,
        replyTo: email,
        replyName: name,
        subject: subjectLine,
        body,
      });
    }
  } catch (err) {
    console.error("[contact-form] send failed:", err);
    sent = false;
  }

  if (sent) {
    return redirectToContact({ thanks: "1" });
  }
  return redirectToContact({ thanks: "0", reason: "send" });
}
