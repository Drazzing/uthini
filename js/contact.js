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
  var enquiryEl = document.getElementById("contact-enquiry");
  var contactPrefEl = document.getElementById("contact-pref");
  var submitBtn = document.getElementById("contact-submit-btn");
  var submitText = submitBtn && submitBtn.querySelector(".cta__text");
  var submitSpinner = submitBtn && submitBtn.querySelector(".cta__spinner");
  var enquiry = params.get("enquiry");
  var contactPref = params.get("contact_pref");

  function selectIfValid(selectEl, value) {
    if (!selectEl || !value) return;
    for (var i = 0; i < selectEl.options.length; i += 1) {
      if (selectEl.options[i].value === value) {
        selectEl.value = value;
        return;
      }
    }
  }

  selectIfValid(enquiryEl, enquiry);
  selectIfValid(contactPrefEl, contactPref);

  function setHidden(el, isHidden) {
    if (!el) return;
    el.hidden = isHidden;
    el.style.display = isHidden ? "none" : "";
  }

  if (params.get("thanks") === "1") {
    if (pageEl) pageEl.classList.add("is-success");
    setHidden(thanksEl, false);
    setHidden(errorEl, true);
    setHidden(heroEl, true);
    setHidden(layoutEl, true);
  } else if (params.get("thanks") === "0") {
    setHidden(errorEl, false);
    setHidden(thanksEl, true);
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
