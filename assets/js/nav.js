(function () {
  "use strict";
  var btn = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".site-nav");
  if (!btn || !nav) return;
  var MENU = "(max-width: 68.75em)"; // the menu breakpoint in main.scss

  function close() {
    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-label", "Open menu");
    nav.classList.remove("is-open");
  }

  btn.addEventListener("click", function () {
    var open = btn.getAttribute("aria-expanded") === "true";
    if (open) {
      close();
    } else {
      btn.setAttribute("aria-expanded", "true");
      btn.setAttribute("aria-label", "Close menu");
      nav.classList.add("is-open");
    }
  });

  // Tapping a link on mobile closes the menu.
  nav.addEventListener("click", function (e) {
    if (e.target.closest("a") && window.matchMedia(MENU).matches) {
      close();
    }
  });

  // Escape closes the open menu and returns focus to the menu button.
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && btn.getAttribute("aria-expanded") === "true") {
      close();
      btn.focus();
    }
  });

  // Reset when leaving the mobile breakpoint.
  window.addEventListener("resize", function () {
    if (!window.matchMedia(MENU).matches) close();
  });
})();

/* Printing: open every folded <details> (e.g. the English abstract under a Korean one),
   so the printout has the whole text, and fold them again afterwards. */
(function () {
  var opened = [];
  window.addEventListener("beforeprint", function () {
    Array.prototype.forEach.call(document.querySelectorAll("details:not([open])"), function (d) {
      d.open = true;
      opened.push(d);
    });
  });
  window.addEventListener("afterprint", function () {
    opened.forEach(function (d) { d.open = false; });
    opened = [];
  });
})();

/* Footer copyright year: keep it current even if the site is not rebuilt across a
   year boundary. The server-rendered build-time year is the no-JS fallback. */
(function () {
  var yr = document.getElementById("footer-year");
  if (yr) yr.textContent = String(new Date().getFullYear());
})();

/* Mild deterrent against casual saving of the lab's photos/portraits/covers:
   suppress the right-click menu and drag on <img>. This is NOT a security control
   -- the image URLs are public and reachable via DevTools, a direct request, or a
   screenshot -- just a small nudge against one-click "Save/Open image". */
(function () {
  function block(e) { if (e.target && e.target.tagName === "IMG") e.preventDefault(); }
  document.addEventListener("contextmenu", block);
  document.addEventListener("dragstart", block);
})();
