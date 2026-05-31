/**
 * Contact form handler for Cloudflare Pages Functions.
 *
 * Email via Cloudflare Email Routing (free):
 *   1. Enable Email Routing on uthini.com + verify destination Gmail addresses
 *   2. Deploy workers/contact-email (send_email binding — Workers only)
 *   3. Pages calls it via EMAIL_WORKER service binding in wrangler.toml
 *
 * Environment variables (Pages → Settings → Variables and Secrets):
 *   CONTACT_TO           – comma-separated recipient addresses (required)
 *   CONTACT_FROM         – sender on your domain, e.g. noreply@uthini.com (required)
 *   CONTACT_FROM_NAME    – optional display name (default: "Uthini Contact")
 *
 * Setup guide: docs/contact-form-email.md
 */

const LIMITS = { name: 200, email: 254, subject: 300, message: 10000 };
const RATE_LIMIT = { max: 5, windowSeconds: 900 };
const MAX_BODY_BYTES = 32768;
const ALLOWED_ORIGINS = ["https://uthini.com", "https://www.uthini.com"];

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

function rejectValidation(logReason, userReason = "validation") {
  console.error("[contact-form] validation failed:", logReason);
  return redirectToContact({ thanks: "0", reason: userReason });
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

function isPagesPreviewHost(hostname) {
  return hostname === "pages.dev" || hostname.endsWith(".pages.dev");
}

function isAllowedHost(hostname) {
  const host = hostname.toLowerCase();
  return host === "uthini.com" || host === "www.uthini.com" || isPagesPreviewHost(host);
}

function isAllowedRequest(request) {
  const secFetchSite = request.headers.get("Sec-Fetch-Site");
  if (secFetchSite === "same-origin") {
    return true;
  }

  const host = (request.headers.get("Host") || "").split(":")[0];
  if (isAllowedHost(host) && secFetchSite !== "cross-site") {
    return true;
  }

  const origin = request.headers.get("Origin");
  const referer = request.headers.get("Referer");

  if (origin) {
    if (ALLOWED_ORIGINS.includes(origin)) return true;
    try {
      if (isPagesPreviewHost(new URL(origin).hostname)) return true;
    } catch {
      /* ignore invalid origin */
    }
  }

  if (referer) {
    try {
      const ref = new URL(referer);
      if (ALLOWED_ORIGINS.includes(ref.origin)) return true;
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

async function sendViaEmailWorker(worker, { from, fromName, to, replyTo, replyName, subject, body }) {
  const response = await worker.fetch(
    new Request("https://email-worker.internal/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from, fromName, to, replyTo, replyName, subject, body }),
    })
  );

  if (!response.ok) {
    console.error("[contact-form] email worker error:", response.status, await response.text());
    return false;
  }
  return true;
}

export async function onRequestGet() {
  return new Response(null, {
    status: 302,
    headers: { Location: "/contact.html", "Cache-Control": "no-store" },
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!isAllowedRequest(request)) {
    return rejectValidation("origin");
  }

  const contentType = request.headers.get("Content-Type") || "";
  if (
    contentType &&
    !contentType.includes("application/x-www-form-urlencoded") &&
    !contentType.includes("multipart/form-data")
  ) {
    return rejectValidation("content-type");
  }

  const contentLength = parseInt(request.headers.get("Content-Length") || "0", 10);
  if (contentLength > MAX_BODY_BYTES) {
    return rejectValidation("body-size");
  }

  const ip = getClientIp(request);
  if (await isRateLimited(ip)) {
    return redirectToContact({ thanks: "0", reason: "send" });
  }

  const to = String(env.CONTACT_TO || "").trim();
  const from = String(env.CONTACT_FROM || "").trim();
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
    return rejectValidation("form-data");
  }

  if (sanitize(formData.get("_gotcha")) || sanitize(formData.get("_fax"))) {
    return rejectValidation("honeypot");
  }

  const name = sanitizeHeaderValue(formData.get("name")).slice(0, LIMITS.name);
  const email = sanitize(formData.get("email")).slice(0, LIMITS.email);
  const subject = sanitize(formData.get("subject")).slice(0, LIMITS.subject);
  const message = sanitize(formData.get("message")).slice(0, LIMITS.message);

  if (!name || !email || !message || !isValidEmail(email)) {
    return rejectValidation("fields");
  }

  const subjectLine = `Uthini Solutions: ${subject || "Enquiry"}`.slice(0, 400);
  const body = `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`;

  let sent = false;
  try {
    if (!env.EMAIL_WORKER) {
      console.error(
        "[contact-form] EMAIL_WORKER binding missing — deploy uthini-contact-email worker (see workers/contact-email/)"
      );
    } else {
      sent = await sendViaEmailWorker(env.EMAIL_WORKER, {
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
