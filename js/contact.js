/**
 * Contact page: thanks/error states and submit UX.
 */
(function () {
  "use strict";

  var params = new URLSearchParams(window.location.search);
  var thanksEl = document.getElementById("form-thanks");
  var errorEl = document.getElementById("form-error");
  var formEl = document.getElementById("contact-form");
  var heroEl = document.querySelector(".contact-hero");
  var layoutEl = document.getElementById("contact-layout");
  var pageEl = document.querySelector(".contact-page");
  var submitBtn = document.getElementById("contact-submit-btn");
  var submitText = submitBtn && submitBtn.querySelector(".cta__text");
  var submitSpinner = submitBtn && submitBtn.querySelector(".cta__spinner");

  if (params.get("thanks") === "1") {
    if (pageEl) pageEl.classList.add("is-success");
    if (thanksEl) thanksEl.hidden = false;
    if (errorEl) errorEl.hidden = true;
    if (heroEl) heroEl.hidden = true;
    if (layoutEl) layoutEl.hidden = true;
  } else if (params.get("thanks") === "0") {
    if (errorEl) errorEl.hidden = false;
    if (thanksEl) thanksEl.hidden = true;
    var reason = params.get("reason");
    var msgEl = document.getElementById("form-error-msg");
    if (msgEl && reason === "send") {
      msgEl.textContent =
        "We couldn't send your message. Please try again later or email us directly.";
    } else if (msgEl && reason === "phone") {
      msgEl.textContent =
        "Please enter a valid phone number, or leave the phone field blank.";
    } else if (msgEl) {
      msgEl.textContent =
        "Please check the required fields (name, email, message) and try again.";
    }
  }

  if (params.has("thanks") && window.history.replaceState) {
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  if (formEl && submitBtn) {
    formEl.addEventListener("submit", function () {
      submitBtn.disabled = true;
      submitBtn.setAttribute("aria-busy", "true");
      if (submitText) submitText.textContent = "Sending…";
      if (submitSpinner) submitSpinner.hidden = false;
      formEl.classList.add("is-sending");
    });
  }
})();
