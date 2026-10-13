(function () {
  "use strict";
  var bar = document.querySelector(".pub-toolbar");
  if (!bar) return;
  var allBtn = bar.querySelector('.pub-filter[data-theme=""]');
  var buttons = Array.prototype.slice.call(bar.querySelectorAll(".pub-filter"));
  var pubs = document.querySelectorAll(".pub");
  var groups = document.querySelectorAll(".year-group");
  var count = document.querySelector(".pubs-count"); // role="status": "28 of 47 papers"
  var empty = document.querySelector(".pubs-empty"); // "Show all papers", when nothing matches
  var active = Object.create(null); // selected theme strings (multi-select, AND)

  function apply() {
    var selected = Object.keys(active);
    var none = selected.length === 0;
    var shownCount = 0;

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
      if (show) shownCount++;
    });

    groups.forEach(function (g) {
      g.classList.toggle("is-hidden", !g.querySelector(".pub:not(.is-hidden)"));
    });
    // One text change per filter change, so a screen reader reads the line once.
    if (count) {
      count.textContent = shownCount === 0 ? "No paper has all the selected topics."
        : none ? pubs.length + " papers" : shownCount + " of " + pubs.length + " papers";
    }
    if (empty) empty.hidden = shownCount > 0;
    saveToUrl();
  }

  // The selection lives in the address as ?topic=<slug>,<slug> (in chip order), so a
  // reload, a shared link or Back from a paper shows the same list. replaceState keeps
  // one history entry for the page instead of one per click.
  function saveToUrl() {
    var slugs = buttons.filter(function (b) { return active[b.getAttribute("data-theme")]; })
      .map(function (b) { return b.getAttribute("data-theme-slug"); });
    var params = new URLSearchParams(location.search);
    params.delete("topic");
    var q = params.toString();
    // Joined by hand: URLSearchParams would write each comma as %2C.
    if (slugs.length) q += (q ? "&" : "") + "topic=" + slugs.join(",");
    var url = location.pathname + (q ? "?" + q : "") + location.hash;
    if (url !== location.pathname + location.search + location.hash) history.replaceState(history.state, "", url);
  }

  // On load, select the topics the address names; a slug no chip has is ignored (and
  // dropped from the address). On phones the chips scroll sideways, so the row is
  // scrolled to the first selected chip (sideways only: the page itself does not move).
  var query = new URLSearchParams(location.search);
  if (query.has("topic")) {
    var wanted = query.get("topic").toLowerCase().split(",").map(function (s) { return s.trim(); });
    buttons.forEach(function (b) {
      if (wanted.indexOf(b.getAttribute("data-theme-slug")) !== -1) active[b.getAttribute("data-theme")] = true;
    });
    apply();
    var first = bar.querySelector('.pub-filter.is-active:not([data-theme=""])');
    if (first && bar.scrollWidth > bar.clientWidth) {
      var fr = first.getBoundingClientRect(), br = bar.getBoundingClientRect();
      if (fr.right > br.right) bar.scrollLeft += fr.left - br.left - parseFloat(getComputedStyle(bar).paddingLeft);
    }
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

  // On phones the chips are one row that scrolls sideways (main.scss). Chrome scrolls a
  // focused chip into view only when none of it shows, so a chip cut at the edge would
  // keep its focus ring half hidden: bring the whole chip into the row.
  bar.addEventListener("focusin", function (e) {
    var b = e.target.closest(".pub-filter");
    if (b && bar.scrollWidth > bar.clientWidth) b.scrollIntoView({ block: "nearest", inline: "nearest" });
  });
})();
