(function () {
  "use strict";
  var btn = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".site-nav");
  var header = document.querySelector(".site-header");
  if (!btn || !nav || !header) return;
  var MENU = "(max-width: 55em)"; // the menu breakpoint in main.scss

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

  // An entry with sub-pages is a button that opens them (disclosure pattern). In the bar
  // they open as a dropdown: a mouse opens it on hover as well and closes it on leaving,
  // unless the button was clicked, which keeps it open until a second click; Escape, a
  // click outside and focus leaving close it. In the phone menu they open in place, and
  // only the button and Escape close them: closing on a tap elsewhere in the menu would
  // move the rows under the finger before the tap lands.
  Array.prototype.forEach.call(nav.querySelectorAll(".subnav-toggle"), function (sub) {
    var item = sub.parentNode;
    var byHover = false;
    function expanded() { return sub.getAttribute("aria-expanded") === "true"; }
    function set(open) { sub.setAttribute("aria-expanded", String(open)); byHover = false; }
    function inBar() { return !window.matchMedia(MENU).matches; }
    function mouse(e) { return e.pointerType === "mouse" && inBar(); }

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
      if (expanded() && inBar() && !item.contains(e.target)) set(false);
    });
    item.addEventListener("focusout", function (e) {
      if (expanded() && inBar() && e.relatedTarget && !item.contains(e.relatedTarget)) set(false);
    });
    // Close on crossing the breakpoint, not on every resize: a phone's toolbars resize the
    // window while the menu is in use.
    var wasBar = inBar();
    window.addEventListener("resize", function () {
      if (inBar() !== wasBar && expanded()) set(false);
      wasBar = inBar();
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
