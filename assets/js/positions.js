// Positions page: 한국어 / English toggle. Shows the .lang-pane elements whose
// data-lang matches the chosen language and hides the rest. The choice is
// remembered in localStorage so a returning visitor keeps their language.
(function () {
  'use strict';
  var KEY = 'sail-positions-lang';
  var toggle = document.querySelector('.lang-toggle');
  if (!toggle) return;

  var btns = Array.prototype.slice.call(toggle.querySelectorAll('.lang-toggle__btn'));
  var panes = Array.prototype.slice.call(document.querySelectorAll('.lang-pane'));
  var langs = btns.map(function (b) { return b.getAttribute('data-lang'); });

  function apply(lang) {
    if (langs.indexOf(lang) === -1) return;
    panes.forEach(function (pane) {
      pane.hidden = pane.getAttribute('data-lang') !== lang;
    });
    btns.forEach(function (b) {
      var on = b.getAttribute('data-lang') === lang;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    try { localStorage.setItem(KEY, lang); } catch (e) {}
  }

  var saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) {}
  if (saved && saved !== langs[0]) apply(saved); // markup already renders langs[0]

  btns.forEach(function (b) {
    b.addEventListener('click', function () { apply(b.getAttribute('data-lang')); });
  });
})();
