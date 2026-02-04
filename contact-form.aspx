<%@ Page Language="C#" %>
<%@ Import Namespace="System.Net" %>
<%@ Import Namespace="System.Net.Mail" %>
<script runat="server">
  // GoDaddy Windows Hosting: use localhost, port 25, no auth. From = valid email on your domain.
  const string ToAddresses = "shawn.rosewarne@gmail.com, garyrosewarne8@gmail.com";
  const string FromEmail = "noreply@uthini123.com";
  const string FromName = "Uthini Contact";

  void Page_Load(object sender, EventArgs e)
  {
    if (Request.RequestType != "POST")
    {
      Response.Redirect("/contact.html");
      return;
    }

    if (!string.IsNullOrWhiteSpace(Request.Form["website"]))
    {
      Response.Redirect("/contact.html?thanks=0&reason=validation");
      return;
    }

    string name = (Request.Form["name"] ?? "").Trim();
    string email = (Request.Form["email"] ?? "").Trim();
    string subject = (Request.Form["subject"] ?? "").Trim();
    string message = (Request.Form["message"] ?? "").Trim();

    if (string.IsNullOrEmpty(name) || string.IsNullOrEmpty(email) || string.IsNullOrEmpty(message))
    {
      Response.Redirect("/contact.html?thanks=0&reason=validation");
      return;
    }

    try
    {
      var addr = new System.Net.Mail.MailAddress(email);
    }
    catch
    {
      Response.Redirect("/contact.html?thanks=0&reason=validation");
      return;
    }

    string subjectLine = "Uthini Solutions: " + (string.IsNullOrEmpty(subject) ? "Enquiry" : subject);
    string body = "Name: " + name + "\r\nEmail: " + email + "\r\n\r\nMessage:\r\n" + message;

    bool sent = false;
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
          mail.Body = body;
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
      sent = true;
    }
    catch { }

    Response.Redirect(sent ? "/contact.html?thanks=1" : "/contact.html?thanks=0&reason=send");
  }
</script>
