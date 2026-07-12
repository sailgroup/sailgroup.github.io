(function () {
  "use strict";

  var node = document.getElementById("photos-data");
  var lb = document.getElementById("lightbox");
  if (!node || !lb) return;

  var data;
  try { data = JSON.parse(node.textContent); } catch (e) { return; }
  if (!data || !data.length) return;

  var imgEl   = lb.querySelector(".lightbox__img");
  var titleEl = lb.querySelector(".lightbox__title");
  var descEl  = lb.querySelector(".lightbox__desc");
  var countEl = lb.querySelector(".lightbox__count");
  var closeEl = lb.querySelector(".lightbox__close");
  var cur = 0;
  var lastFocus = null;

  function render(i) {
    var n = data.length;
    cur = (i % n + n) % n;
    var d = data[cur];
    imgEl.src = d.src;
    imgEl.alt = d.alt || d.title || "";
    titleEl.textContent = d.title || "";
    titleEl.style.display = d.title ? "" : "none";
    descEl.textContent = d.caption || "";
    descEl.style.display = d.caption ? "" : "none";
    countEl.textContent = (cur + 1) + " / " + n;
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

  function trap(e) {
    var f = lb.querySelectorAll("button");
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  document.querySelectorAll(".gallery__item").forEach(function (btn) {
    btn.addEventListener("click", function () {
      open(parseInt(btn.getAttribute("data-index"), 10) || 0);
    });
  });

  lb.addEventListener("click", function (e) {
    if (e.target.closest("[data-close]")) close();
    else if (e.target.closest("[data-prev]")) render(cur - 1);
    else if (e.target.closest("[data-next]")) render(cur + 1);
  });
})();
