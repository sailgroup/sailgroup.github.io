(function () {
  "use strict";
  var bar = document.querySelector(".pub-toolbar");
  if (!bar) return;
  var buttons = bar.querySelectorAll(".pub-filter");
  var pubs = document.querySelectorAll(".pub");
  var groups = document.querySelectorAll(".year-group");

  bar.addEventListener("click", function (e) {
    var b = e.target.closest(".pub-filter");
    if (!b) return;
    var theme = b.getAttribute("data-theme") || "";

    buttons.forEach(function (x) {
      var on = x === b;
      x.classList.toggle("is-active", on);
      x.setAttribute("aria-pressed", on ? "true" : "false");
    });

    pubs.forEach(function (p) {
      var themes = (p.getAttribute("data-themes") || "").split("|");
      var show = !theme || themes.indexOf(theme) !== -1;
      p.classList.toggle("is-hidden", !show);
    });

    groups.forEach(function (g) {
      g.classList.toggle("is-hidden", !g.querySelector(".pub:not(.is-hidden)"));
    });
  });
})();
