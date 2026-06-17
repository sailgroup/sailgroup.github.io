(function () {
  "use strict";

  var lb = document.getElementById("cover-lightbox");
  var links = Array.prototype.slice.call(document.querySelectorAll(".cover__link[data-full]"));
  if (!lb || !links.length) return;

  var imgEl    = lb.querySelector(".lightbox__img");
  var titleEl  = lb.querySelector(".lightbox__title");
  var countEl  = lb.querySelector(".lightbox__count");
  var paperWrap = lb.querySelector(".cover-lightbox__paper");
  var paperLink = paperWrap ? paperWrap.querySelector("a") : null;
  var closeEl  = lb.querySelector(".lightbox__close");
  var cur = 0, lastFocus = null;

  var items = links.map(function (el) {
    return {
      full: el.getAttribute("data-full"),
      caption: el.getAttribute("data-caption") || "",
      paper: el.getAttribute("data-paper") || ""
    };
  });

  function render(i) {
    var n = items.length;
    cur = (i % n + n) % n;
    var d = items[cur];
    imgEl.src = d.full;
    imgEl.alt = d.caption;
    titleEl.textContent = d.caption;
    titleEl.style.display = d.caption ? "" : "none";
    countEl.textContent = (cur + 1) + " / " + n;
    if (paperWrap) {
      if (d.paper && paperLink) { paperLink.href = d.paper; paperWrap.style.display = ""; }
      else { paperWrap.style.display = "none"; }
    }
  }

  function open(i) {
    lastFocus = document.activeElement;
    render(i);
    lb.hidden = false;
    document.body.classList.add("no-scroll");
    document.addEventListener("keydown", onKey);
    if (closeEl) closeEl.focus();
  }

  function close() {
    lb.hidden = true;
    document.body.classList.remove("no-scroll");
    document.removeEventListener("keydown", onKey);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function onKey(e) {
    if (e.key === "Escape") close();
    else if (e.key === "ArrowLeft") render(cur - 1);
    else if (e.key === "ArrowRight") render(cur + 1);
    else if (e.key === "Tab") trap(e);
  }

  // Keep focus inside the dialog (only the visible controls).
  function trap(e) {
    var f = Array.prototype.slice.call(lb.querySelectorAll("button, a[href]"))
      .filter(function (x) { return x.offsetParent !== null; });
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  // Cover click opens the viewer. The cover stays a real <a href="paper"> for
  // no-JS users and crawlers; here we intercept and show the full cover instead
  // (the paper link lives inside the viewer).
  links.forEach(function (el, i) {
    el.addEventListener("click", function (e) {
      e.preventDefault();
      open(i);
    });
  });

  lb.addEventListener("click", function (e) {
    if (e.target.closest("[data-close]")) close();
    else if (e.target.closest("[data-prev]")) render(cur - 1);
    else if (e.target.closest("[data-next]")) render(cur + 1);
    // a click on the paper link is a normal navigation (not handled here)
  });
})();
