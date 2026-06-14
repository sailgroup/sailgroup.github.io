(function () {
  "use strict";
  var bar = document.querySelector(".pub-toolbar");
  if (!bar) return;
  var allBtn = bar.querySelector('.pub-filter[data-theme=""]');
  var buttons = Array.prototype.slice.call(bar.querySelectorAll(".pub-filter"));
  var pubs = document.querySelectorAll(".pub");
  var groups = document.querySelectorAll(".year-group");
  var active = Object.create(null); // selected theme strings (multi-select, OR)

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
      var show = none || themes.some(function (t) { return active[t]; });
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
