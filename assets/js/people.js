/* The people document (D57, _includes/people-page.html): /pi/, /members/ and /alumni/ are
   one page in three parts, the PI, the members and the alumni.
   - The part in view sets the address (replaceState, no new history entry), the tab's
     title and aria-current in the three-part menu and the header's dropdown, so a copied
     address or a reload opens where the reader is.
   - A link to one of the three addresses (the three-part menu, the header, the footer)
     scrolls to its part instead of loading the page again, as a new history entry, so
     Back returns to where the reader was. Focus moves to the part's heading.
   - The three-part menu is drawn as floating glass while it is held at the top
     (is-stuck in main.scss). */
(function () {
  "use strict";
  var bar = document.querySelector(".people-bar");
  var parts = ["pi", "members", "alumni"].map(function (id) { return document.getElementById(id); });
  if (!bar || parts.indexOf(null) !== -1 || !window.history || !history.pushState) return;

  var paths = parts.map(function (p) { return p.getAttribute("data-path"); });
  var titles = parts.map(function (p) { return p.getAttribute("data-title"); });
  var headings = [document.getElementById("pi-title"), document.getElementById("members-title"), document.getElementById("alumni-title")];
  var links = Array.prototype.slice.call(document.querySelectorAll(".people-nav a, .subnav a"));

  function partOf(path) { return paths.indexOf(path.replace(/\/?$/, "/")); }

  var current = Math.max(0, partOf(location.pathname));
  var paused = false; // while a link's scroll runs
  // Until the page has loaded and stopped moving the address stays as it came: Safari
  // scrolls smoothly to an address's #part and stops when the address changes.
  var loading = document.readyState !== "complete";
  var pauseTimer = 0;
  var ticking = false;

  function mark(i) {
    links.forEach(function (a) {
      var k = partOf(a.pathname);
      if (k === -1) return;
      if (k === i) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
  }

  function show(i, how) {
    var url = paths[i] + location.search;
    // The entry left by a push keeps its scroll position, which the browser restores on
    // Back.
    if (how === "push" && partOf(location.pathname) !== i) history.pushState(null, "", url);
    else if (partOf(location.pathname) !== i || location.hash) history.replaceState(history.state, "", url);
    document.title = titles[i];
    mark(i);
    current = i;
  }

  // The part in view: the last whose top has passed a line a quarter of the way down the
  // screen below the menu; at the foot of the page, the last part.
  function inView() {
    var line = bar.getBoundingClientRect().bottom + (window.innerHeight - bar.getBoundingClientRect().bottom) / 4;
    var doc = document.documentElement;
    if (window.scrollY + window.innerHeight >= doc.scrollHeight - 2) return parts.length - 1;
    for (var i = parts.length - 1; i > 0; i--) {
      if (parts[i].getBoundingClientRect().top <= line) return i;
    }
    return 0;
  }

  function update() {
    ticking = false;
    var top = parseFloat(getComputedStyle(bar).top) || 0;
    bar.classList.toggle("is-stuck", window.scrollY > 0 && bar.getBoundingClientRect().top <= top + 1);
    if (paused || loading) return;
    var i = inView();
    if (i !== current) show(i, "replace");
  }
  function request() {
    if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
  }

  // A link's scroll pauses the part-following until the page has stopped moving for a
  // moment (scrollend is not in every browser).
  function pause() {
    paused = true;
    clearTimeout(pauseTimer);
    pauseTimer = setTimeout(function () { paused = false; request(); }, 160);
  }

  window.addEventListener("scroll", function () {
    if (paused) pause();
    request();
  }, { passive: true });
  window.addEventListener("resize", request);
  window.addEventListener("load", function () { loading = false; pause(); });
  // Back and Forward between parts: the browser restores the scroll position; the title
  // and the menus follow.
  window.addEventListener("popstate", function () {
    current = -1;
    request();
  });

  document.addEventListener("click", function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest ? e.target.closest("a[href]") : null;
    if (!a || a.target || a.origin !== location.origin || a.hash) return;
    var i = partOf(a.pathname);
    if (i === -1) return;
    e.preventDefault();
    // A dropdown left open by the click closes as it would on a new page (nav.js listens
    // for Escape); the phone menu has already closed itself.
    if (a.closest(".site-header")) document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    show(i, "push");
    pause();
    // Smooth, unless the reader asks for less motion (main.scss turns smooth scrolling off).
    if (i === 0) window.scrollTo({ top: 0 });
    else parts[i].scrollIntoView({ block: "start" });
    var h = headings[i];
    if (h) {
      h.setAttribute("tabindex", "-1");
      h.focus({ preventScroll: true });
    }
  });

  // Opened at the members or the alumni, the keyboard starts there too, as it does after an
  // address with #members: focus rests on the part's heading (no ring, main.scss), so the
  // next Tab goes into that part, not to the PI's links above it, and a screen reader
  // starts there. Moving focus away again leaves the starting point there in Chrome but
  // not in Firefox. It waits for DOMContentLoaded, after people-start.js has shown the page
  // (a hidden element takes no focus).
  var entry = window.performance && performance.getEntriesByType ? performance.getEntriesByType("navigation")[0] : null;
  if (current > 0 && !location.hash && (!entry || entry.type === "navigate") && headings[current]) {
    document.addEventListener("DOMContentLoaded", function () {
      if (document.activeElement !== document.body) return;
      headings[current].setAttribute("tabindex", "-1");
      headings[current].focus({ preventScroll: true });
    });
  }

  mark(current);
  update();
})();
