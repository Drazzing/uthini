/**
 * Contact form — Pages Function. Email via EMAIL_WORKER → uthini-contact-email.
 * Setup: docs/contact-form-email.md
 * Env: CONTACT_TO, CONTACT_FROM, CONTACT_FROM_NAME
 */

const LIMITS = {
  name: 200,
  email: 254,
  subject: 300,
  message: 10000,
  company: 200,
  phone: 30,
};
const ENQUIRY_VALUES = new Set(["", "general", "consulting", "development", "design", "software", "ai"]);
const CONTACT_PREF_VALUES = new Set(["", "email", "phone", "either"]);
const ENQUIRY_LABELS = {
  general: "General enquiry",
  consulting: "Consulting",
  development: "Development",
  design: "Design",
  software: "Software / Orchestrator",
  ai: "AI & technology",
};
const CONTACT_PREF_LABELS = {
  email: "Email",
  phone: "Phone",
  either: "Email or phone",
};
const RATE_LIMIT = { max: 5, windowSeconds: 900 };
const MAX_BODY_BYTES = 32768;
const SITE_ORIGINS = new Set(["https://uthini.com", "https://www.uthini.com"]);
const SITE_HOSTS = new Set(["uthini.com", "www.uthini.com"]);

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

function isValidPhone(phone) {
  if (!phone) return true;
  if (phone.length > LIMITS.phone) return false;
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 6 && /^[\d\s()+.\-]+$/.test(phone);
}

function readOptional(formData, name, maxLen, allowed) {
  const value = sanitize(formData.get(name));
  if (!value) return "";
  if (allowed && !allowed.has(value)) return "";
  return value.slice(0, maxLen);
}

function buildEmailBody({ name, email, company, phone, enquiry, contactPref, message }) {
  const lines = [`Name: ${name}`, `Email: ${email}`];
  if (company) lines.push(`Company: ${company}`);
  if (phone) lines.push(`Phone: ${phone}`);
  if (enquiry) lines.push(`Enquiry type: ${ENQUIRY_LABELS[enquiry] || enquiry}`);
  if (contactPref) lines.push(`Preferred contact: ${CONTACT_PREF_LABELS[contactPref] || contactPref}`);
  lines.push("", "Message:", message);
  return lines.join("\n");
}

function isPreviewHost(hostname) {
  return hostname === "pages.dev" || hostname.endsWith(".pages.dev");
}

function isAllowedRequest(request) {
  if (request.headers.get("Sec-Fetch-Site") === "same-origin") {
    return true;
  }

  const host = (request.headers.get("Host") || "").split(":")[0].toLowerCase();
  if (SITE_HOSTS.has(host) && request.headers.get("Sec-Fetch-Site") !== "cross-site") {
    return true;
  }

  for (const header of ["Origin", "Referer"]) {
    const value = request.headers.get(header);
    if (!value) continue;
    try {
      const url = new URL(value);
      if (SITE_ORIGINS.has(url.origin)) return true;
      if (url.protocol === "https:" && isPreviewHost(url.hostname)) return true;
    } catch {
      if (header === "Referer") return false;
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

async function sendEmail(worker, payload) {
  const response = await worker.fetch(
    new Request("https://email-worker.internal/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
  );
  if (!response.ok) {
    console.error("[contact-form] email worker:", response.status, await response.text());
  }
  return response.ok;
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
  const company = readOptional(formData, "company", LIMITS.company);
  const phone = readOptional(formData, "phone", LIMITS.phone);
  const enquiry = readOptional(formData, "enquiry", 32, ENQUIRY_VALUES);
  const contactPref = readOptional(formData, "contact_pref", 16, CONTACT_PREF_VALUES);

  if (!name || !email || !message || !isValidEmail(email)) {
    return rejectValidation("fields");
  }

  if (!isValidPhone(phone)) {
    return rejectValidation("phone");
  }

  const subjectLine = `Uthini Solutions: ${subject || "Enquiry"}`.slice(0, 400);
  const body = buildEmailBody({ name, email, company, phone, enquiry, contactPref, message });

  let sent = false;
  if (!env.EMAIL_WORKER) {
    console.error("[contact-form] EMAIL_WORKER binding missing");
  } else {
    try {
      sent = await sendEmail(env.EMAIL_WORKER, {
        from,
        fromName,
        to,
        replyTo: email,
        replyName: name,
        subject: subjectLine,
        body,
      });
    } catch (err) {
      console.error("[contact-form] send failed:", err);
    }
  }

  if (sent) {
    return redirectToContact({ thanks: "1" });
  }
  return redirectToContact({ thanks: "0", reason: "send" });
}
