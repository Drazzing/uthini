/**
 * Uthini – footer year, mobile nav, scroll reveal
 */
(function () {
  "use strict";

  var yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".main-nav");
  var backdrop = document.querySelector(".nav-backdrop");
  var menu = document.getElementById("main-menu");

  function closeMobileNav() {
    if (!toggle || !nav) return;
    var expanded = toggle.getAttribute("aria-expanded") === "true";
    if (!expanded) return;
    toggle.setAttribute("aria-expanded", "false");
    nav.setAttribute("aria-hidden", "true");
    document.body.classList.remove("nav-open");
    if (backdrop) backdrop.setAttribute("aria-hidden", "true");
  }

  function openMobileNav() {
    if (!toggle || !nav) return;
    toggle.setAttribute("aria-expanded", "true");
    nav.setAttribute("aria-hidden", "false");
    document.body.classList.add("nav-open");
    if (backdrop) backdrop.setAttribute("aria-hidden", "false");
  }

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var expanded = toggle.getAttribute("aria-expanded") === "true";
      if (expanded) {
        closeMobileNav();
      } else {
        openMobileNav();
      }
    });
  }

  if (backdrop) {
    backdrop.addEventListener("click", closeMobileNav);
  }

  if (menu) {
    menu.addEventListener("click", function (e) {
      if (e.target && e.target.nodeName === "A") {
        closeMobileNav();
      }
    });
  }

  /* Scroll reveal – sections fade/slide in when in view */
  var revealEls = document.querySelectorAll(".section--reveal");
  if (revealEls.length && "IntersectionObserver" in window) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          }
        });
      },
      { rootMargin: "0px 0px -60px 0px", threshold: 0.1 }
    );
    revealEls.forEach(function (el) {
      observer.observe(el);
    });
  } else if (revealEls.length) {
    revealEls.forEach(function (el) {
      el.classList.add("is-visible");
    });
  }
})();
