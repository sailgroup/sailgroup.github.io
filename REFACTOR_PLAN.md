# REFACTOR_PLAN.md — autonomous refactor + optimization pass (2026-06-14)

Goal: same rendered output for sighted users, better internals, and a site a
non-coder can contribute to by editing **one** documented place. Build of record
is GitHub Actions (no local Ruby, D2); parity is proven by diffing the CI Pages
artifact before/after (`.qa/baseline` vs `.qa/after`, both gitignored).

North stars: (A) contributor ergonomics — add a member/alumnus/paper/news/photo
in one step, malformed input fails the build with a clear message; (B) code
quality — DRY, accessible, performant, maintainable.

## Audit findings (7 axes), with severity and fix

### Axis 1 — Data model + contributor friction
- **F1.1 [HIGH]** Adding a member/alumnus needs **two** edits: a `_data/*.yml`
  entry *and* a hand-written stub in `_members/`/`_alumni/` (`slug` + `permalink`
  only). Templates read `site.data.*`, never the collection. Fix: generate the
  pages from data (extend the publication generator). → Commit D.
- **F1.2 [MED]** The 41 `_publications/<id>.md` stubs are redundant since
  `publication_pages.rb` already generates stub-less ids; they are a
  contributor-confusion trap ("do I add a stub?"). Fix: delete, generator owns
  all detail pages. → Commit D.
- **F1.3 [HIGH]** No build-time validation. A missing required field, bad date,
  typo'd image filename, or broken internal news link yields a silently broken
  page, not a clear human message (north star A). Fix: a validator plugin. →
  Commit A.

### Axis 2 — Template / include duplication
- **F2.1 [HIGH]** `_layouts/member.html` and `_layouts/alumnus.html` are ~95%
  identical (lookup, card, social links, body, auto-pubs). Fix: shared include. →
  Commit B.
- **F2.2 [MED]** `members.html` and `alumni.html` grid cards are near-identical.
  Fix: shared `person-card.html`. → Commit B.
- **F2.3 [MED]** The "scan publications.yml by name/alias" loop is duplicated
  verbatim in both person layouts. Fix: shared `member-pubs.html`. → Commit B.
- **F2.4 [MED]** PI-name bolding `replace` runs in both `pub-item.html` and
  `publication.html`; preprint file/alt selection duplicated too. Fix:
  `pi-authors.html` + `preprint-badge.html` includes. → Commit C.
- **F2.5 [LOW]** Journal-covers section duplicated in `index.html` + `photos.html`.
  Fix: `journal-covers.html` include. → Commit C.

### Axis 3 — SCSS health
- **F3.1 [LOW]** Dead rules: `.pub__figure--empty`, `.hero__wordmark`,
  `.footer h2.footer-title` (footer uses `<p>`), `.btn--accent/--ghost/--sm`,
  `.btn .icon` (only `.btn--solid` survives, in 404.html). Remove. → Commit C.

### Axis 4 — JS robustness + keyboard a11y
- Already solid: every IIFE early-returns on missing elements; filter chips and
  lightbox are real `<button>`s with `aria-pressed`/focus-trap/Esc/arrows. No
  blocking findings. Minor hardening only (guarded `parseInt`). → no change.

### Axis 5 — Image / asset performance
- **F5.1 [LOW]** Member/alumni portraits lack intrinsic `width`/`height` attrs;
  CLS is already contained by fixed CSS boxes (`person__photo` aspect-ratio:1,
  `member-card__photo` 180×180), so impact is negligible. Add attrs for
  correctness. → Commit C (person-card include).
- **F5.2 [LOW]** Responsive `srcset` for photos/thumbnails — would need new image
  derivatives (heavy, regression risk against a "no visual change" mandate). →
  RECOMMENDATION, not executed.

### Axis 6 — A11y / SEO / structured data
- **F6.1 [MED]** Only the seo-tag default JSON-LD ships. Missing Organization
  (lab), Person (PI), and ScholarlyArticle (per paper). In-scope, non-visible,
  high SEO value. → Commit E.
- **F6.2 [LOW]** Korean text (초록, `name_ko`, captions) is inside an `lang=en`
  document with no `lang="ko"`, so screen readers mispronounce it. Mark the
  high-value spans. Non-visible. → Commit E.
- **F6.3 [LOW]** Grid card has two adjacent links (photo + name) to the same URL.
  Cosmetic a11y nit; leave to avoid visible/markup risk.

### Axis 7 — CI / build validation gaps
- **F7.1 [HIGH]** CI builds but never checks the output. Fix: (a) the validator
  plugin fails fast on bad data (Commit A); (b) html-proofer checks internal
  links/images offline so a broken `<a>`/`<img>` fails CI (Commit F).

## Execution order (quick wins → structural; each verified on dev CI)

- **A.** `_plugins/validate_data.rb` — additive guard, no output change.
- **B.** Shared person includes (`person-card.html`, `member-pubs.html`) + unify
  the two person layouts. Output identical.
- **C.** Dead SCSS removal + `pi-authors.html`/`preprint-badge.html`/
  `journal-covers.html` includes + portrait dimensions. Output identical.
- **D.** Unified data-driven page generator; delete the 3 collections + 52 stubs.
  **Prove byte-parity** via artifact diff.
- **E.** JSON-LD (Organization/Person/ScholarlyArticle) + `lang="ko"`. Non-visible.
- **F.** html-proofer CI step (internal-only).
- **G.** Deploy via D11 (dev green → ff main → deploy → live smoke), then docs.

## RECOMMENDATIONS (visible / human-judgment — DEFERRED, see REVIEW.md §10)
Not executed here because they would change what sighted visitors see or need a
human fact/decision; logged for sign-off.
