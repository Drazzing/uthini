<%@ Page Language="C#" AutoEventWireup="true" %>
<%@ Import Namespace="System.Net.Mail" %>
<script runat="server">
  const string ToAddresses = "shawn.rosewarne@gmail.com, garyrosewarne8@gmail.com";
  const string FromEmail = "noreply@uthini123.com";
  const string FromName = "Uthini Contact";

  string Message = "";

  void Page_Load(object sender, EventArgs e)
  {
    if (Request.HttpMethod != "POST") return;

    if (!string.IsNullOrWhiteSpace(Request.Form["website"]))
    {
      Message = "Validation failed (honeypot).";
      return;
    }

    string name = (Request.Form["name"] ?? "").Trim();
    string email = (Request.Form["email"] ?? "").Trim();
    string subject = (Request.Form["subject"] ?? "").Trim();
    string body = (Request.Form["message"] ?? "").Trim();

    if (string.IsNullOrEmpty(name) || string.IsNullOrEmpty(email) || string.IsNullOrEmpty(body))
    {
      Message = "Please fill in name, email and message.";
      return;
    }

    try { new MailAddress(email); }
    catch
    {
      Message = "Invalid email address.";
      return;
    }

    string subjectLine = "Uthini Solutions: " + (string.IsNullOrEmpty(subject) ? "Enquiry" : subject);
    string bodyText = "Name: " + name + "\r\nEmail: " + email + "\r\n\r\nMessage:\r\n" + body;

    try
    {
      using (var client = new SmtpClient("localhost", 25))
      {
        client.DeliveryMethod = SmtpDeliveryMethod.Network;
        client.EnableSsl = false;
        using (var mail = new MailMessage())
        {
          mail.From = new MailAddress(FromEmail, FromName);
          mail.ReplyToList.Add(new MailAddress(email, name));
          mail.Subject = subjectLine;
          mail.Body = bodyText;
          mail.IsBodyHtml = false;
          mail.BodyEncoding = System.Text.Encoding.UTF8;
          foreach (string to in ToAddresses.Split(','))
          {
            string a = to.Trim();
            if (!string.IsNullOrEmpty(a)) mail.To.Add(a);
          }
          client.Send(mail);
        }
      }
      Message = "Message sent successfully.";
    }
    catch (Exception ex)
    {
      Message = "Send failed: " + ex.Message;
    }
  }
</script>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Contact form test</title>
  <style>
    body { font-family: sans-serif; max-width: 32rem; margin: 2rem auto; padding: 0 1rem; }
    label { display: block; margin-top: 0.75rem; }
    input, textarea { width: 100%; box-sizing: border-box; padding: 0.25rem; }
    button { margin-top: 1rem; padding: 0.5rem 1rem; }
    .msg { margin-top: 1rem; padding: 0.5rem; background: #eee; }
    .msg.ok { background: #cfc; }
    .msg.err { background: #fcc; }
  </style>
</head>
<body>
  <h1>Contact form test</h1>
  <form method="post">
    <div style="position:absolute;left:-9999px;"><label>Leave empty</label><input type="text" name="website" /></div>
    <label>Name *</label><input type="text" name="name" required />
    <label>Email *</label><input type="email" name="email" required />
    <label>Subject</label><input type="text" name="subject" />
    <label>Message *</label><textarea name="message" rows="4" required></textarea>
    <button type="submit">Send</button>
  </form>
  <% if (!string.IsNullOrEmpty(Message)) { %>
  <p class="msg <%= Message.StartsWith("Message sent") ? "ok" : "err" %>"><%= Server.HtmlEncode(Message) %></p>
  <% } %>
</body>
</html>
