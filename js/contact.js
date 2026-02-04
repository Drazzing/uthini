/**
 * Contact page: show thanks or error message when redirected after form submit;
 * show "Sending..." and disable button while form is submitting.
 */
(function () {
  "use strict";
  var params = new URLSearchParams(window.location.search);
  var thanksEl = document.getElementById("form-thanks");
  var errorEl = document.getElementById("form-error");
  var formEl = document.getElementById("contact-form");
  var metaEl = document.querySelector(".section__meta");
  var introEl = document.getElementById("contact-intro");
  var backLink = document.getElementById("contact-back-link");
  var submitBtn = document.getElementById("contact-submit-btn");
  var submitText = submitBtn && submitBtn.querySelector(".cta__text");
  var submitSpinner = submitBtn && submitBtn.querySelector(".cta__spinner");

  if (params.get("thanks") === "1") {
    if (thanksEl) thanksEl.hidden = false;
    if (errorEl) errorEl.hidden = true;
    if (formEl) formEl.hidden = true;
    if (metaEl) metaEl.hidden = true;
    if (introEl) introEl.hidden = true;
    if (backLink) backLink.hidden = true;
  } else if (params.get("thanks") === "0") {
    if (errorEl) errorEl.hidden = false;
    if (thanksEl) thanksEl.hidden = true;
    var reason = params.get("reason");
    var msgEl = document.getElementById("form-error-msg");
    if (msgEl && reason === "send") {
      msgEl.textContent = "We couldn't send your message. Please try again later or email us directly.";
    } else if (msgEl) {
      msgEl.textContent = "Please check the required fields (name, email, message) and try again.";
    }
  }

  if (formEl && submitBtn) {
    formEl.addEventListener("submit", function () {
      submitBtn.disabled = true;
      submitBtn.setAttribute("aria-busy", "true");
      if (submitText) submitText.textContent = "Sending…";
      if (submitSpinner) {
        submitSpinner.hidden = false;
      }
      formEl.classList.add("is-sending");
    });
  }
})();
