/** Sends contact form email via Cloudflare Email Service (send_email binding). */
export default {
  async fetch(request, env) {
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    let payload;
    try {
      payload = await request.json();
    } catch {
      return new Response(JSON.stringify({ ok: false, error: "Invalid JSON" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { from, fromName, to, replyTo, replyName, subject, body } = payload;
    const recipients = String(to || "")
      .split(",")
      .map((addr) => addr.trim())
      .filter(Boolean);

    if (!from || !recipients.length || !subject || !body) {
      return new Response(JSON.stringify({ ok: false, error: "Missing fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      await env.EMAIL.send({
        from: { name: fromName || "Uthini Contact", email: from },
        to: recipients.length === 1 ? recipients[0] : recipients,
        replyTo: replyTo ? (replyName ? { name: replyName, email: replyTo } : replyTo) : undefined,
        subject,
        text: body,
      });
      return new Response(JSON.stringify({ ok: true }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      console.error("[contact-email-worker]", err);
      return new Response(JSON.stringify({ ok: false, error: String(err) }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};
