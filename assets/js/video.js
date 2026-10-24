/*! SAIL, Spectroscopy and AI Lab (sail.kookmin.ac.kr). Designed and built by Chanjoong Kim (김찬중, github.com/chanjoongx), https://chanjoongx.com, cj@chanjoongx.com */
// The interview on the home page (index.html, D60). Its poster is a link to the video on
// YouTube, followed as usual without JS and on a modified click (Ctrl, Cmd, Shift, Alt,
// middle button). A plain click plays the video in the poster's place, in a frame from
// youtube-nocookie.com: the one frame the page's CSP allows (head.html), added only now, so
// the page loads nothing from YouTube until the video is played.
(function () {
  "use strict";
  var ID = /^[A-Za-z0-9_-]{11}$/; // a YouTube video id, as validate_data.rb checks it

  Array.prototype.forEach.call(document.querySelectorAll("a[data-youtube]"), function (a) {
    var id = a.getAttribute("data-youtube");
    if (!ID.test(id)) return;
    // It plays here now, not in a new tab: the name says so. (index.html ends the name with
    // " (opens in a new tab)", as new-tab.html asks of a link named by aria-label.)
    a.removeAttribute("target");
    var name = a.getAttribute("aria-label");
    if (name) a.setAttribute("aria-label", name.replace(/ \(opens in a new tab\)$/, ""));

    a.addEventListener("click", function (e) {
      if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      var frame = document.createElement("iframe");
      frame.className = "video__frame";
      frame.src = "https://www.youtube-nocookie.com/embed/" + id + "?autoplay=1&rel=0";
      frame.title = a.getAttribute("data-title") || "Video";
      frame.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
      frame.allowFullscreen = true;
      // YouTube refuses to play in a frame that sends no referrer.
      frame.referrerPolicy = "strict-origin-when-cross-origin";
      a.replaceWith(frame);
      frame.focus();
    });
  });
})();
