(function () {
  "use strict";
  var bar = document.querySelector(".pub-toolbar");
  if (!bar) return;
  var allBtn = bar.querySelector('.pub-filter[data-theme=""]');
  var buttons = Array.prototype.slice.call(bar.querySelectorAll(".pub-filter"));
  var pubs = document.querySelectorAll(".pub");
  var groups = document.querySelectorAll(".year-group");
  var empty = document.querySelector(".pubs-empty"); // "no paper has all the selected topics"
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

    var anyShown = false;
    groups.forEach(function (g) {
      var shown = !!g.querySelector(".pub:not(.is-hidden)");
      g.classList.toggle("is-hidden", !shown);
      if (shown) anyShown = true;
    });
    if (empty) empty.hidden = anyShown;
  }

  // "Show all papers" in the empty message: same as "All", then focus moves to "All"
  // (the button itself disappears with the message).
  if (empty) {
    empty.querySelector(".pubs-empty__reset").addEventListener("click", function () {
      active = Object.create(null);
      apply();
      allBtn.focus();
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
