<%@ Page Language="C#" %>
<script runat="server">
  void Page_Load(object sender, EventArgs e)
  {
    if (Request.HttpMethod != "POST")
    {
      Response.Redirect("/contact.html");
      return;
    }
    Response.Redirect("/contact.html?thanks=1");
  }
</script>
