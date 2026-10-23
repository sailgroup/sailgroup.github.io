/*! SAIL, Spectroscopy and AI Lab (sail.kookmin.ac.kr). Designed and built by Chanjoong Kim (김찬중, github.com/chanjoongx), https://chanjoongx.com, cj@chanjoongx.com */
/* Opens the people document (D57, _includes/people-page.html) at the right part in a
   browser that does not do it from the stylesheet (scroll-initial-target in main.scss:
   Chrome and Edge do; Safari and Firefox did not in 2026-10): /members/ and /alumni/ at
   their own part, and any of the three addresses with #pi, #members or #alumni at that part
   (Safari's own scroll to a #part is smooth and can stop short while the page loads).
   Loaded in <head> and not deferred, so the page is hidden (people-pending in main.scss)
   before it is first drawn and shown once the part is at the top: it never shows the PI
   first and then jumps. Nothing is done on a reload or Back and Forward (the browser
   returns to where the reader was) or when the address names another place. */
(function () {
  "use strict";
  var root = document.documentElement;
  var id = root.getAttribute("data-people-start");
  if (!id) return;
  if (window.CSS && CSS.supports && CSS.supports("scroll-initial-target", "nearest")) return;
  var hash = location.hash.slice(1);
  if (hash) {
    if (["pi", "members", "alumni"].indexOf(hash) === -1) return;
    id = hash;
  } else if (id === "pi") {
    return; // /pi/ opens at the top
  }
  var entry = window.performance && performance.getEntriesByType ? performance.getEntriesByType("navigation")[0] : null;
  if (entry && entry.type !== "navigate") return;

  var touched = false;
  // Instantly, past the page's smooth scrolling (people-jump in main.scss).
  function align() {
    var part = document.getElementById(id);
    if (!part || touched) return;
    root.classList.add("people-jump");
    part.scrollIntoView({ block: "start" });
    if (!hash) root.classList.remove("people-jump");
  }
  function show() { root.classList.remove("people-pending"); }

  root.classList.add("people-pending");
  document.addEventListener("DOMContentLoaded", function () {
    align();
    show();
    // Pretendard arriving can move the part by a few pixels; put it back at the top
    // unless the reader has begun to scroll.
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(align);
    window.addEventListener("load", function () {
      align();
      // With a #part the browser scrolls to it once more after loading; smooth scrolling
      // stays off until then.
      if (hash) setTimeout(function () { root.classList.remove("people-jump"); }, 1000);
    });
  });
  ["wheel", "touchstart", "keydown", "pointerdown"].forEach(function (type) {
    window.addEventListener(type, function () {
      touched = true;
      root.classList.remove("people-jump");
    }, { passive: true, once: true });
  });
  // Never leave the page hidden, whatever happens to the script above.
  setTimeout(show, 3000);
})();
