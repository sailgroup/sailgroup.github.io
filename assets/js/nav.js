(function () {
  "use strict";
  var btn = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".site-nav");
  var header = document.querySelector(".site-header");
  if (!btn || !nav || !header) return;
  var MENU = "(max-width: 68.75em)"; // the menu breakpoint in main.scss

  // --header-h follows the header bar, which grows past --header-min when the menu wraps
  // to a second row (a large default text size, wider letter spacing), so the sticky menus
  // and the scroll offsets in main.scss still clear it.
  var inner = header.querySelector(".header-inner");
  if (inner && window.ResizeObserver) {
    new ResizeObserver(function () {
      document.documentElement.style.setProperty("--header-h", inner.offsetHeight + "px");
    }).observe(inner);
  }

  function isOpen() { return btn.getAttribute("aria-expanded") === "true"; }

  // While the menu is open the page behind it does not scroll (the menu scrolls on its own);
  // the photo and cover viewers use the same no-scroll class.
  function setOpen(open) {
    btn.setAttribute("aria-expanded", String(open));
    btn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    nav.classList.toggle("is-open", open);
    document.body.classList.toggle("no-scroll", open);
  }

  // Only when open, so a resize never clears a viewer's no-scroll.
  function close() { if (isOpen()) setOpen(false); }

  btn.addEventListener("click", function () { setOpen(!isOpen()); });

  // Tapping a link on mobile closes the menu.
  nav.addEventListener("click", function (e) {
    if (e.target.closest("a") && window.matchMedia(MENU).matches) {
      close();
    }
  });

  // Escape closes the open menu and returns focus to the menu button.
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && isOpen()) {
      close();
      btn.focus();
    }
  });

  // A tap or click outside the header closes the menu; focus stays where the tap put it.
  document.addEventListener("pointerdown", function (e) {
    if (isOpen() && !header.contains(e.target)) close();
  });

  // So does focus leaving the header (Tab past the last link), so the next stop is never
  // hidden under the open menu. A tap on plain text in the menu sends focus nowhere
  // (relatedTarget is null); that keeps it open.
  header.addEventListener("focusout", function (e) {
    if (isOpen() && e.relatedTarget && !header.contains(e.relatedTarget)) close();
  });

  // Reset when leaving the mobile breakpoint.
  window.addEventListener("resize", function () {
    if (!window.matchMedia(MENU).matches) close();
  });

  // A script that follows a menu link within the page (people.js) closes the menus as a
  // new page would, leaving focus to it.
  document.addEventListener("sail:closemenus", close);

  // Dropdowns above the menu breakpoint (disclosure pattern): the button beside a parent
  // link opens its sub-pages. A mouse opens them on hover as well and closes them on
  // leaving, unless the button was clicked, which keeps them open until a second click.
  // Escape, a click outside and focus leaving close them. (In the phone menu the button
  // is hidden and the sub-pages are always listed.)
  Array.prototype.forEach.call(nav.querySelectorAll(".subnav-toggle"), function (sub) {
    var item = sub.parentNode;
    var byHover = false;
    function expanded() { return sub.getAttribute("aria-expanded") === "true"; }
    function set(open) { sub.setAttribute("aria-expanded", String(open)); byHover = false; }
    function mouse(e) { return e.pointerType === "mouse" && !window.matchMedia(MENU).matches; }

    sub.addEventListener("click", function () {
      if (byHover) byHover = false; // opened by hover: the click keeps it open
      else set(!expanded());
    });
    item.addEventListener("pointerenter", function (e) {
      if (mouse(e) && !expanded()) { set(true); byHover = true; }
    });
    item.addEventListener("pointerleave", function (e) {
      if (mouse(e) && byHover) set(false);
    });
    // Escape also dismisses a panel opened by hover (WCAG 1.4.13); focus goes back to the
    // button only if it was inside.
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape" || !expanded()) return;
      var inside = item.contains(document.activeElement);
      set(false);
      if (inside) sub.focus();
    });
    document.addEventListener("pointerdown", function (e) {
      if (expanded() && !item.contains(e.target)) set(false);
    });
    item.addEventListener("focusout", function (e) {
      if (expanded() && e.relatedTarget && !item.contains(e.relatedTarget)) set(false);
    });
    window.addEventListener("resize", function () {
      if (expanded() && window.matchMedia(MENU).matches) set(false);
    });
    document.addEventListener("sail:closemenus", function () {
      if (expanded()) set(false);
    });
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
   screenshot -- just a small nudge against one-click "Save/Open image". An image inside
   a link keeps its menu and drag, so "Open link in new tab" works on paper thumbnails
   and covers. */
(function () {
  function block(e) {
    var t = e.target;
    if (t && t.tagName === "IMG" && !t.closest("a")) e.preventDefault();
  }
  document.addEventListener("contextmenu", block);
  document.addEventListener("dragstart", block);
})();
