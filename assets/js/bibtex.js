/*! SAIL, Spectroscopy and AI Lab (sail.kookmin.ac.kr). Designed and built by Chanjoong Kim (김찬중, github.com/chanjoongx), https://chanjoongx.com, cj@chanjoongx.com */
// Copy button for the BibTeX entry on a paper page (_layouts/publication.html). The button
// is hidden in the HTML and shown here, only where the Clipboard API is available; without
// it the entry can still be selected and copied by hand.
(function () {
  "use strict";
  var btn = document.querySelector(".paper__cite-copy");
  if (!btn || !navigator.clipboard || !window.isSecureContext) return;
  var entry = document.getElementById(btn.getAttribute("data-copy"));
  var status = document.querySelector(".paper__cite-status"); // role="status"
  var timer;
  if (!entry || !status) return;
  btn.hidden = false;

  // The status line is emptied first and filled a moment later, so a second copy is read
  // out again; it empties itself after a few seconds.
  function say(text) {
    clearTimeout(timer);
    status.textContent = "";
    timer = setTimeout(function () {
      status.textContent = text;
      timer = setTimeout(function () { status.textContent = ""; }, 4000);
    }, 100);
  }

  btn.addEventListener("click", function () {
    navigator.clipboard.writeText(entry.textContent).then(function () {
      say("Copied");
    }, function () {
      // The browser refused (a setting or permission): select the entry for a manual copy.
      var range = document.createRange();
      range.selectNodeContents(entry);
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      say("Selected: press Ctrl+C (Cmd+C on a Mac) to copy");
    });
  });
})();
