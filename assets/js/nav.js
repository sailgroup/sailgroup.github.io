(function () {
  "use strict";
  var btn = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".site-nav");
  if (!btn || !nav) return;

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
    if (e.target.closest("a") && window.matchMedia("(max-width: 720px)").matches) {
      close();
    }
  });

  // Reset when leaving the mobile breakpoint.
  window.addEventListener("resize", function () {
    if (!window.matchMedia("(max-width: 720px)").matches) close();
  });
})();

/* Footer copyright year: keep it current even if the site is not rebuilt across a
   year boundary. The server-rendered build-time year is the no-JS fallback. */
(function () {
  var yr = document.getElementById("footer-year");
  if (yr) yr.textContent = String(new Date().getFullYear());
})();
