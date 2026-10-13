/* Image viewer for gallery photos, journal covers and single figures. Each dialog
   (_includes/lightbox.html) shows the triggers that name it in data-viewer, in page order:
   a link or button with data-full (the image), and optionally data-title, data-desc,
   data-alt and data-paper. A link trigger stays a real link: without JS, and on a modified
   click (Ctrl, Cmd, Shift, Alt, middle button), it is followed as usual. */
(function () {
  "use strict";

  var SWIPE = 50; // px of horizontal travel that turns a touch into previous or next

  // A text whose first letter is Hangul is Korean, the rule of _plugins/hangul.rb (which
  // marks the gallery's captions): digits before it do not count, and an English caption
  // that ends with Korean names stays English.
  var LETTER = /[A-Za-zÀ-ɏͰ-Ͽᄀ-ᇿ㄰-㆏가-힣]/;
  var HANGUL = /[ᄀ-ᇿ㄰-㆏가-힣]/;
  function korean(s) {
    var m = LETTER.exec(s || "");
    return !!m && HANGUL.test(m[0]);
  }

  function setup(lb) {
    var triggers = Array.prototype.filter.call(document.querySelectorAll("[data-viewer][data-full]"), function (el) {
      return el.getAttribute("data-viewer") === lb.id;
    });
    var n = triggers.length;
    if (!n) return;
    var items = triggers.map(function (el) {
      return {
        full: el.getAttribute("data-full"),
        title: el.getAttribute("data-title") || "",
        desc: el.getAttribute("data-desc") || "",
        alt: el.getAttribute("data-alt") || el.getAttribute("data-title") || "",
        paper: el.getAttribute("data-paper") || ""
      };
    });

    var img = lb.querySelector(".lightbox__img");
    var fig = img.parentNode;
    var title = lb.querySelector(".lightbox__title");
    var desc = lb.querySelector(".lightbox__desc");
    var count = lb.querySelector(".lightbox__count");
    var paper = lb.querySelector(".lightbox__paper");
    var closeBtn = lb.querySelector(".lightbox__close");
    var cur = 0, lastFocus = null;
    var down = {}, start = null; // touch or pen pointers on the dialog, and where a swipe began

    // Korean alt text, title or description gets lang="ko" and translate="no" (as the site's
    // other Korean text); any other text gets back the element's own translate value.
    var marked = [img, title, desc];
    var own = marked.map(function (el) { return el.getAttribute("translate"); });
    function mark(i, text) {
      var el = marked[i];
      if (korean(text)) {
        el.setAttribute("lang", "ko");
        el.setAttribute("translate", "no");
        return;
      }
      el.removeAttribute("lang");
      if (own[i] === null) el.removeAttribute("translate");
      else el.setAttribute("translate", own[i]);
    }

    // One image (a figure): no previous, next or count.
    if (n < 2) {
      lb.classList.add("lightbox--single");
      Array.prototype.forEach.call(lb.querySelectorAll("[data-prev], [data-next]"), function (b) { b.hidden = true; });
    }

    function show(i) {
      cur = (i % n + n) % n;
      var d = items[cur];
      img.src = d.full;
      img.alt = d.alt;
      fig.scrollLeft = 0; // a figure wider than a phone starts at its left edge
      title.textContent = d.title;
      title.hidden = !d.title;
      desc.textContent = d.desc;
      desc.hidden = !d.desc;
      mark(0, d.alt);
      mark(1, d.title);
      mark(2, d.desc);
      count.textContent = n > 1 ? (cur + 1) + " / " + n : "";
      count.hidden = n < 2;
      if (paper) {
        paper.hidden = !d.paper;
        if (d.paper) paper.querySelector("a").href = d.paper;
      }
    }

    // On a phone a single figure keeps a readable height and scrolls sideways in its box
    // (main.scss); while it does, the box takes focus, so the arrow keys can move it too.
    function fit() {
      if (n > 1) return;
      if (fig.scrollWidth > fig.clientWidth + 1) fig.tabIndex = 0;
      else fig.removeAttribute("tabindex");
    }
    img.addEventListener("load", fit);
    window.addEventListener("resize", function () { if (!lb.hidden) fit(); });

    function open(i, trigger) {
      lastFocus = trigger;
      down = {};
      start = null;
      show(i);
      lb.hidden = false;
      fit();
      document.body.classList.add("no-scroll");
      document.addEventListener("keydown", onKey);
      closeBtn.focus();
    }

    function close() {
      lb.hidden = true;
      document.body.classList.remove("no-scroll");
      document.removeEventListener("keydown", onKey);
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    function onKey(e) {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft" && n > 1) show(cur - 1);
      else if (e.key === "ArrowRight" && n > 1) show(cur + 1);
      else if (e.key === "Tab") trap(e);
    }

    // Keep Tab inside the dialog, over the controls that are shown (and a scrolling figure).
    function trap(e) {
      var f = Array.prototype.filter.call(lb.querySelectorAll("button, a[href], [tabindex='0']"), function (x) {
        return x.getClientRects().length > 0;
      });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1], at = document.activeElement;
      if (e.shiftKey && (at === first || !lb.contains(at))) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && (at === last || !lb.contains(at))) { e.preventDefault(); first.focus(); }
    }

    triggers.forEach(function (el, i) {
      el.addEventListener("click", function (e) {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        e.preventDefault();
        open(i, el);
      });
    });

    // A control acts; a click anywhere else but the image or its caption (the dark backdrop
    // around them) closes the viewer. The paper link is a normal link.
    lb.addEventListener("click", function (e) {
      var t = e.target;
      if (t.closest("[data-prev]")) show(cur - 1);
      else if (t.closest("[data-next]")) show(cur + 1);
      else if (t.closest("[data-close]") || !t.closest(".lightbox__img, .lightbox__cap, a, button")) close();
    });

    // Swipe (touch or pen): a mostly horizontal move of more than SWIPE px goes to the previous
    // or next image. Vertical moves (the CSS leaves them to the browser, which then cancels the
    // pointer) and two-finger pinch zoom are ignored, and so is any move on a zoomed-in page,
    // where one finger pans.
    function zoomed() { return window.visualViewport && window.visualViewport.scale > 1.01; }
    function lift(e) { delete down[e.pointerId]; if (start && start.id === e.pointerId) start = null; }
    lb.addEventListener("pointerdown", function (e) {
      if (e.pointerType === "mouse" || n < 2) return;
      down[e.pointerId] = true;
      start = Object.keys(down).length === 1 ? { id: e.pointerId, x: e.clientX, y: e.clientY } : null;
    });
    lb.addEventListener("pointerup", function (e) {
      var s = start && start.id === e.pointerId ? start : null;
      lift(e);
      if (!s || zoomed()) return;
      var dx = e.clientX - s.x, dy = e.clientY - s.y;
      if (Math.abs(dx) > SWIPE && Math.abs(dx) > Math.abs(dy)) show(dx < 0 ? cur + 1 : cur - 1);
    });
    lb.addEventListener("pointercancel", lift);
  }

  Array.prototype.forEach.call(document.querySelectorAll(".lightbox[id]"), setup);
})();
