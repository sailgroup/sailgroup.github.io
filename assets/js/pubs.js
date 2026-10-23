/*! SAIL, Spectroscopy and AI Lab (sail.kookmin.ac.kr). Designed and built by Chanjoong Kim (김찬중, github.com/chanjoongx), https://chanjoongx.com, cj@chanjoongx.com */
(function () {
  "use strict";
  var bar = document.querySelector(".pub-toolbar");
  if (!bar) return;
  var main = document.querySelector(".pubs__main");
  var rail = document.querySelector(".pubs__rail");
  var allBtn = bar.querySelector('.pub-filter[data-theme=""]');
  var buttons = Array.prototype.slice.call(bar.querySelectorAll(".pub-filter"));
  var groups = Array.prototype.slice.call(main.querySelectorAll(".year-group"));
  var tags = Array.prototype.slice.call(main.querySelectorAll(".tag[data-theme]"));
  var yearLinks = Array.prototype.slice.call(document.querySelectorAll(".pub-years a"));
  var count = document.querySelector(".pubs-count"); // role="status": "28 of 47 papers"
  var empty = document.querySelector(".pubs-empty"); // "Show all papers", when nothing matches
  var search = document.querySelector(".pub-search");
  var input = document.getElementById("pub-q");
  var pill = document.querySelector(".pubs-pill"); // the floating count below 68.75em
  var active = Object.create(null); // selected theme strings (multi-select, AND)
  var terms = []; // the search, folded and split at spaces (every word must match)
  var NARROW = window.matchMedia("(max-width: 68.75em)"); // one column (main.scss)

  // Lower case without accents, one UTF-16 unit for one, so a match's place in the folded
  // text is its place in the page's text (the search highlight needs it). "Jöung" is found
  // by "joung". Only the accents go: a Hangul syllable, which also comes apart, stays whole.
  function fold(s) {
    var out = "";
    for (var i = 0; i < s.length; i++) {
      var c = s.charAt(i);
      var f = c.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
      out += f.length === 1 ? f : c;
    }
    return out;
  }

  // What the search reads on each paper: its title, authors and venue line.
  var papers = Array.prototype.slice.call(main.querySelectorAll(".pub")).map(function (el) {
    var fields = [".pub__title", ".pub__authors", ".pub__meta"]
      .map(function (s) { return el.querySelector(s); }).filter(Boolean);
    return {
      el: el,
      themes: (el.getAttribute("data-themes") || "").split("|").filter(Boolean),
      fields: fields,
      text: fold(fields.map(function (f) { return f.textContent; }).join("\n"))
    };
  });
  var total = papers.length;

  function found(p) {
    for (var i = 0; i < terms.length; i++) if (p.text.indexOf(terms[i]) === -1) return false;
    return true;
  }

  function apply() {
    var selected = Object.keys(active);
    var none = selected.length === 0;
    var shown = 0, searched = 0;
    var per = Object.create(null); // shown papers that carry each topic

    papers.forEach(function (p) {
      var hit = found(p);
      if (hit) searched++;
      // AND: a paper shows only if it carries every selected theme.
      var show = hit && selected.every(function (t) { return p.themes.indexOf(t) !== -1; });
      p.el.classList.toggle("is-hidden", !show);
      if (show) {
        shown++;
        p.themes.forEach(function (t) { per[t] = (per[t] || 0) + 1; });
      }
    });

    // Each topic's number is how many papers would show with it added: the shown papers that
    // carry it. "All" counts the papers the search alone leaves.
    buttons.forEach(function (b) {
      var t = b.getAttribute("data-theme");
      var on = t === "" ? none : !!active[t];
      var n = t === "" ? searched : (per[t] || 0);
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
      b.classList.toggle("is-zero", n === 0 && !on);
      var slot = b.querySelector("[data-n]");
      if (slot) slot.textContent = n;
    });
    tags.forEach(function (a) { a.classList.toggle("is-on", !!active[a.getAttribute("data-theme")]); });

    groups.forEach(function (g) {
      var hide = !g.querySelector(".pub:not(.is-hidden)");
      g.classList.toggle("is-hidden", hide);
      var link = document.querySelector('.pub-years a[href="#' + g.id + '"]');
      if (link) link.parentNode.classList.toggle("is-hidden", hide);
    });

    // One text change per filter change, so a screen reader reads the line once.
    var line;
    if (shown === 0) {
      line = !terms.length ? "No paper has all the selected topics."
        : none ? "No paper matches the search." : "No paper matches the search and the selected topics.";
    } else {
      line = shown === total ? total + " papers" : shown + " of " + total + " papers";
    }
    if (count && count.textContent !== line) count.textContent = line;
    if (empty) empty.hidden = shown > 0;
    if (pill) pill.querySelector("[data-pill-count]").textContent = shown === 0 ? "No papers" : line;

    mark();
    saveToUrl();
    updatePill();
    spy();
  }

  // The searched words are marked in the shown papers with the CSS Custom Highlight API
  // (::highlight(pub-search) in main.scss): ranges over the page's own text, so nothing in
  // the page changes. A browser without it filters the same, unmarked.
  var canMark = !!(window.CSS && CSS.highlights && typeof window.Highlight === "function");
  function mark() {
    if (!canMark) return;
    if (!terms.length) { CSS.highlights.delete("pub-search"); return; }
    var hl = new Highlight();
    papers.forEach(function (p) {
      if (p.el.classList.contains("is-hidden")) return;
      p.fields.forEach(function (f) {
        var walk = document.createTreeWalker(f, NodeFilter.SHOW_TEXT);
        for (var node = walk.nextNode(); node; node = walk.nextNode()) {
          var text = fold(node.nodeValue);
          terms.forEach(function (t) {
            for (var at = text.indexOf(t); at !== -1; at = text.indexOf(t, at + t.length)) {
              var r = new Range();
              r.setStart(node, at);
              r.setEnd(node, at + t.length);
              hl.add(r);
            }
          });
        }
      });
    });
    CSS.highlights.set("pub-search", hl);
  }

  // The selection lives in the address as ?topic=<slug>,<slug> (in button order) and
  // &q=<search>, so a reload, a shared link or Back from a paper shows the same list.
  // replaceState keeps one history entry for the page instead of one per click.
  function saveToUrl() {
    var slugs = buttons.filter(function (b) { return active[b.getAttribute("data-theme")]; })
      .map(function (b) { return b.getAttribute("data-theme-slug"); });
    var params = new URLSearchParams(location.search);
    params.delete("topic");
    params.delete("q");
    var q = params.toString();
    // Joined by hand: URLSearchParams would write each comma as %2C.
    if (slugs.length) q += (q ? "&" : "") + "topic=" + slugs.join(",");
    if (input && input.value.trim()) q += (q ? "&" : "") + "q=" + encodeURIComponent(input.value.trim());
    var url = location.pathname + (q ? "?" + q : "") + location.hash;
    if (url !== location.pathname + location.search + location.hash) history.replaceState(history.state, "", url);
  }

  function readSearch() {
    terms = fold(input.value).split(/\s+/).filter(Boolean);
  }

  function clearAll() {
    active = Object.create(null);
    if (input) { input.value = ""; terms = []; }
    apply();
  }

  // After a change made in the finder, a reader far down the list goes back to its top, so
  // the first result is in view (the finder stays where it is beside it).
  function toListTop() {
    if (main.getBoundingClientRect().top < 0) main.scrollIntoView({ block: "start" });
  }

  // --- The finder's topic buttons -------------------------------------------------
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
    toListTop();
  });

  // Below 68.75em the topics are one row that scrolls sideways (main.scss). Chrome scrolls a
  // focused button into view only when none of it shows, so a button cut at the edge would
  // keep its focus ring half hidden: bring the whole button into the row.
  bar.addEventListener("focusin", function (e) {
    var b = e.target.closest(".pub-filter");
    if (b && bar.scrollWidth > bar.clientWidth) b.scrollIntoView({ block: "nearest", inline: "nearest" });
  });

  // --- A topic on a paper ---------------------------------------------------------
  // Selects (or drops) that topic in place. The paper clicked stays where it was on the
  // screen while the list changes around it. A click that opens a new tab keeps the link's
  // own address, the list filtered by that topic.
  main.addEventListener("click", function (e) {
    var a = e.target.closest(".tag[data-theme]");
    if (!a || e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    var paper = a.closest(".pub");
    var before = paper.getBoundingClientRect().top;
    var t = a.getAttribute("data-theme");
    if (active[t]) delete active[t]; else active[t] = true;
    apply();
    var after = paper.getBoundingClientRect().top;
    if (after !== before) window.scrollBy({ top: after - before, behavior: "instant" });
  });

  // --- Search ---------------------------------------------------------------------
  if (search && input) {
    search.hidden = false;
    input.addEventListener("input", function () {
      readSearch();
      apply();
    });
    input.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && input.value) {
        e.preventDefault();
        input.value = "";
        readSearch();
        apply();
      } else if (e.key === "Enter") {
        // Enter on a phone's keyboard closes it, so the results are in view.
        if (NARROW.matches) input.blur();
      }
    });
    // "/" anywhere outside a text field goes to the search (as on GitHub and in docs).
    document.addEventListener("keydown", function (e) {
      if (e.key !== "/" || e.ctrlKey || e.metaKey || e.altKey) return;
      var t = e.target;
      if (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
      e.preventDefault();
      input.focus();
      input.select();
    });
  }

  // --- Years ----------------------------------------------------------------------
  // The year whose papers are at the top of the screen is marked in the finder.
  var header = document.querySelector(".site-header");
  var spyQueued = false;
  function spy() {
    if (!yearLinks.length) return;
    var line = (header ? header.getBoundingClientRect().bottom : 0) + 24;
    var current = null;
    groups.forEach(function (g) {
      if (g.classList.contains("is-hidden")) return;
      if (!current || g.getBoundingClientRect().top <= line) current = g;
    });
    yearLinks.forEach(function (a) {
      var on = !!current && a.getAttribute("href") === "#" + current.id;
      a.classList.toggle("is-current", on);
      if (on) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current");
    });
  }
  window.addEventListener("scroll", function () {
    if (spyQueued) return;
    spyQueued = true;
    requestAnimationFrame(function () { spyQueued = false; spy(); });
  }, { passive: true });

  // --- The floating count (below 68.75em) ---------------------------------------------
  var railSeen = true;
  function updatePill() {
    if (!pill) return;
    var show = NARROW.matches && !railSeen && (Object.keys(active).length > 0 || terms.length > 0);
    pill.classList.toggle("is-shown", show);
    if (show) pill.removeAttribute("inert"); else pill.setAttribute("inert", "");
  }
  if (pill && rail && "IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      railSeen = entries[entries.length - 1].isIntersecting;
      updatePill();
    }).observe(rail);
    if (NARROW.addEventListener) NARROW.addEventListener("change", updatePill);
    pill.querySelector(".pubs-pill__count").addEventListener("click", function () {
      rail.scrollIntoView({ block: "start" });
      if (input && !search.hidden) input.focus({ preventScroll: true });
    });
    pill.querySelector(".pubs-pill__clear").addEventListener("click", function () {
      clearAll();
      toListTop();
    });
  }

  // "Show all papers" in the empty message: clears the topics and the search, then focus
  // moves to "All" (the button itself disappears with the message).
  if (empty) {
    empty.querySelector(".pubs-empty__reset").addEventListener("click", function () {
      clearAll();
      allBtn.focus();
    });
  }

  // On load, select the topics the address names (a slug no button has is ignored and
  // dropped from the address) and fill in its search. Below 68.75em the topics scroll
  // sideways, so the row is scrolled to the first selected one (sideways only: the page
  // itself does not move).
  var query = new URLSearchParams(location.search);
  if (query.has("topic")) {
    var wanted = query.get("topic").toLowerCase().split(",").map(function (s) { return s.trim(); });
    buttons.forEach(function (b) {
      if (wanted.indexOf(b.getAttribute("data-theme-slug")) !== -1) active[b.getAttribute("data-theme")] = true;
    });
  }
  if (input && query.get("q")) {
    input.value = query.get("q");
    readSearch();
  }
  apply();
  var first = bar.querySelector('.pub-filter.is-active:not([data-theme=""])');
  if (first && bar.scrollWidth > bar.clientWidth) {
    var fr = first.getBoundingClientRect(), br = bar.getBoundingClientRect();
    if (fr.right > br.right) bar.scrollLeft += fr.left - br.left - parseFloat(getComputedStyle(bar).paddingLeft);
  }
})();
