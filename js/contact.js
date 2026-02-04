/**
 * Contact page: show thanks or error message when redirected after form submit
 */
(function () {
  "use strict";
  var params = new URLSearchParams(window.location.search);
  var thanksEl = document.getElementById("form-thanks");
  var errorEl = document.getElementById("form-error");
  var formEl = document.getElementById("contact-form");
  var metaEl = document.querySelector(".section__meta");
  var backLink = document.querySelector(".section--form .cta--secondary");

  if (params.get("thanks") === "1") {
    if (thanksEl) thanksEl.hidden = false;
    if (errorEl) errorEl.hidden = true;
    if (formEl) formEl.hidden = true;
    if (metaEl) metaEl.hidden = true;
    if (backLink) backLink.hidden = true;
  } else if (params.get("thanks") === "0") {
    if (errorEl) errorEl.hidden = false;
    if (thanksEl) thanksEl.hidden = true;
  }
})();
