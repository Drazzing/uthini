/**
 * Contact page: show thanks message when redirected after form submit (Formspree _next)
 */
(function () {
  "use strict";
  var params = new URLSearchParams(window.location.search);
  if (params.get("thanks") === "1") {
    var thanksEl = document.getElementById("form-thanks");
    var formEl = document.getElementById("contact-form");
    var metaEl = document.querySelector(".section__meta");
    var backLink = document.querySelector(".section--form .cta--secondary");
    if (thanksEl) thanksEl.hidden = false;
    if (formEl) formEl.hidden = true;
    if (metaEl) metaEl.hidden = true;
    if (backLink) backLink.hidden = true;
  }
})();
