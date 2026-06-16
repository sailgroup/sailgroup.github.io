(function () {
  "use strict";
  var bar = document.querySelector(".pub-toolbar");
  if (!bar) return;
  var allBtn = bar.querySelector('.pub-filter[data-theme=""]');
  var buttons = Array.prototype.slice.call(bar.querySelectorAll(".pub-filter"));
  var pubs = document.querySelectorAll(".pub");
  var groups = document.querySelectorAll(".year-group");
  var active = Object.create(null); // selected theme strings (multi-select, AND)

  function apply() {
    var selected = Object.keys(active);
    var none = selected.length === 0;

    allBtn.classList.toggle("is-active", none);
    allBtn.setAttribute("aria-pressed", none ? "true" : "false");

    buttons.forEach(function (x) {
      var t = x.getAttribute("data-theme");
      if (t === "") return;
      var on = !!active[t];
      x.classList.toggle("is-active", on);
      x.setAttribute("aria-pressed", on ? "true" : "false");
    });

    pubs.forEach(function (p) {
      var themes = (p.getAttribute("data-themes") || "").split("|");
      // AND: a paper shows only if it carries every selected theme.
      var show = none || selected.every(function (t) { return themes.indexOf(t) !== -1; });
      p.classList.toggle("is-hidden", !show);
    });

    groups.forEach(function (g) {
      g.classList.toggle("is-hidden", !g.querySelector(".pub:not(.is-hidden)"));
    });
  }

  bar.addEventListener("click", function (e) {
    var b = e.target.closest(".pub-filter");
    if (!b) return;
    var theme = b.getAttribute("data-theme") || "";
    if (theme === "") {
      active = Object.create(null); // "All" clears every selection
    } else if (active[theme]) {
      delete active[theme];
    } else {
      active[theme] = true;
    }
    apply();
  });
})();
