/**
 * Contact form handler for Cloudflare Pages Functions.
 *
 * Environment variables (Cloudflare Pages → Settings → Environment variables):
 *   CONTACT_TO             – comma-separated recipient addresses (required)
 *   CONTACT_FROM           – sender on your domain, e.g. noreply@uthini.com (required)
 *   CONTACT_FROM_NAME      – optional display name (default: "Uthini Contact")
 *   ALLOWED_ORIGINS        – optional comma-separated origins (default: uthini.com + www)
 *   RESEND_API_KEY         – optional; sends via Resend instead of Mailchannels
 *   TURNSTILE_SECRET_KEY   – optional; requires Turnstile widget on contact.html
 */

const LIMITS = { name: 200, email: 254, subject: 300, message: 10000 };
const RATE_LIMIT = { max: 5, windowSeconds: 900 };
const MIN_SUBMIT_MS = 3000;
const MAX_SUBMIT_MS = 3600000;
const MAX_BODY_BYTES = 32768;

function redirectToContact(params) {
  const qs = new URLSearchParams(params).toString();
  return new Response(null, {
    status: 302,
    headers: {
      Location: `/contact.html?${qs}`,
      "Cache-Control": "no-store",
    },
  });
}

function sanitize(value) {
  return String(value ?? "")
    .trim()
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .replace(/[\r\n]+/g, " ")
    .replace(/<[^>]*>/g, "");
}

function sanitizeHeaderValue(value) {
  return sanitize(value).replace(/[<>"\\]/g, "");
}

function isValidEmail(email) {
  if (!email || email.length > LIMITS.email) return false;
  if (/[\r\n]/.test(email)) return false;
  return /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email);
}

function parseAllowedOrigins(env) {
  const defaults = ["https://uthini.com", "https://www.uthini.com"];
  const custom = (env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return custom.length ? custom : defaults;
}

function isPagesPreviewHost(hostname) {
  return hostname === "pages.dev" || hostname.endsWith(".pages.dev");
}

function isAllowedRequest(request, env) {
  const allowed = parseAllowedOrigins(env);
  const origin = request.headers.get("Origin");
  const referer = request.headers.get("Referer");

  if (origin) {
    if (allowed.includes(origin)) return true;
    try {
      if (isPagesPreviewHost(new URL(origin).hostname)) return true;
    } catch {
      /* ignore invalid origin */
    }
  }

  if (referer) {
    try {
      const ref = new URL(referer);
      if (allowed.includes(ref.origin)) return true;
      if (ref.protocol === "https:" && isPagesPreviewHost(ref.hostname)) return true;
    } catch {
      return false;
    }
  }

  return false;
}

function getClientIp(request) {
  return request.headers.get("CF-Connecting-IP") || "unknown";
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

async function verifyTurnstile(token, secret, ip) {
  const body = new URLSearchParams({
    secret,
    response: token,
    remoteip: ip,
  });

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) return false;
  const result = await response.json();
  return result.success === true;
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
      to: to
        .split(",")
        .map((addr) => addr.trim())
        .filter(Boolean),
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
  if (!response.ok) {
    const detail = await response.text();
    console.error("[contact-form] Mailchannels error:", response.status, detail);
  }
  return response.ok;
}

function isValidSubmissionTiming(rawTs) {
  const ts = parseInt(String(rawTs ?? ""), 10);
  if (!Number.isFinite(ts) || ts <= 0) return false;
  const elapsed = Date.now() - ts;
  return elapsed >= MIN_SUBMIT_MS && elapsed <= MAX_SUBMIT_MS;
}

export async function onRequestGet() {
  return new Response(null, {
    status: 302,
    headers: { Location: "/contact.html", "Cache-Control": "no-store" },
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!isAllowedRequest(request, env)) {
    return redirectToContact({ thanks: "0", reason: "validation" });
  }

  const contentType = request.headers.get("Content-Type") || "";
  if (
    !contentType.includes("application/x-www-form-urlencoded") &&
    !contentType.includes("multipart/form-data")
  ) {
    return redirectToContact({ thanks: "0", reason: "validation" });
  }

  const contentLength = parseInt(request.headers.get("Content-Length") || "0", 10);
  if (contentLength > MAX_BODY_BYTES) {
    return redirectToContact({ thanks: "0", reason: "validation" });
  }

  const ip = getClientIp(request);
  if (await isRateLimited(ip)) {
    return redirectToContact({ thanks: "0", reason: "send" });
  }

  const to = env.CONTACT_TO;
  const from = env.CONTACT_FROM;
  const fromName = sanitizeHeaderValue(env.CONTACT_FROM_NAME || "Uthini Contact");

  if (!to || !from || !isValidEmail(from)) {
    console.error("[contact-form] CONTACT_TO or CONTACT_FROM misconfigured");
    return redirectToContact({ thanks: "0", reason: "send" });
  }

  const recipients = to
    .split(",")
    .map((addr) => addr.trim())
    .filter(Boolean);
  if (!recipients.length || recipients.some((addr) => !isValidEmail(addr))) {
    console.error("[contact-form] CONTACT_TO contains invalid addresses");
    return redirectToContact({ thanks: "0", reason: "send" });
  }

  let formData;
  try {
    formData = await request.formData();
  } catch {
    return redirectToContact({ thanks: "0", reason: "validation" });
  }

  if (formData.get("_gotcha") || formData.get("_fax")) {
    return redirectToContact({ thanks: "0", reason: "validation" });
  }

  if (!isValidSubmissionTiming(formData.get("_ts"))) {
    return redirectToContact({ thanks: "0", reason: "validation" });
  }

  if (env.TURNSTILE_SECRET_KEY) {
    const token = String(formData.get("cf-turnstile-response") ?? "");
    const ip = getClientIp(request);
    const valid = token && (await verifyTurnstile(token, env.TURNSTILE_SECRET_KEY, ip));
    if (!valid) {
      return redirectToContact({ thanks: "0", reason: "validation" });
    }
  }

  const name = sanitizeHeaderValue(formData.get("name")).slice(0, LIMITS.name);
  const email = sanitize(formData.get("email")).slice(0, LIMITS.email);
  const subject = sanitizeHeaderValue(formData.get("subject")).slice(0, LIMITS.subject);
  const message = sanitize(formData.get("message")).slice(0, LIMITS.message);

  if (!name || !email || !message || !isValidEmail(email)) {
    return redirectToContact({ thanks: "0", reason: "validation" });
  }

  const subjectLine = `Uthini Solutions: ${subject || "Enquiry"}`.slice(0, 400);
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
