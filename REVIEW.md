# REVIEW.md — QA report and items for the lab to confirm

This is the Phase 5 quality-assurance record for the SAIL website rebuild. It documents what was
verified, the content decisions that affect what appears on the site, and a short list of items a
human at the lab may want to confirm or change. Nothing here blocks the site from going live; these
are accuracy and editorial notes.

Generated 2026-06-13; updated 2026-06-14 after the Phase 6 refinement round (per-paper thumbnails,
25-photo lightbox gallery, header/favicon/grid/home-figure polish), the Phase 7 round (left-filling
people grid, real alumni photos + personal pages, research-area figures, review-pass fixes), and the
Phase 8 round (publication thumbnails on mobile, auto-updating footer year, transparent header logo,
og:image social card + favicon/manifest, intrinsic image dimensions for CLS, security review). Build of
record: GitHub Actions (see `DECISIONS.md` D2). Live-site visual QA is in section 7.

---

## 1. Build and technical QA

| Check | Result |
| --- | --- |
| Jekyll build on CI (`dev`) | Pass (green) |
| `CNAME` preserved in output | `sail.kookmin.ac.kr` present |
| Internal links resolving | 13 pages, 0 broken |
| Image `src` resolving | 0 broken (incl. 41 publication thumbnails + 25 gallery photos, verified loading on the live site, section 7) |
| `<img>` missing `alt` | 0 |
| `<html lang>` | `en` on every page |
| One `<h1>` per page, no heading-level skips | Pass (pi page h1→h3 skip found and fixed to h2) |
| Skip-to-content link | Present |
| Filter buttons expose `aria-pressed` | Yes |
| `<title>` / meta description / viewport | Present on every page |
| External link spot-checks (DOIs, ORCID, Scholar, Group Guide, related labs) | All HTTP 200 |

Each of the 41 publications renders with its real graphical-abstract thumbnail beside the citation, at
88×66 on desktop and 64×48 on phones (the thumbnail was hidden on mobile through Phase 7 and was
restored on explicit request in Phase 8, D19; the earlier empty figure-box bug from Liquid treating
`""` as truthy is fixed). The PI name (`Joonyoung F. Joung` / `Joonyoung Francis Joung`) is
bold-highlighted in all 41 author lists.

---

## 2. Content cross-check against the live Wix site

Source of truth: `sailabjfjoung.wixsite.com/sail` (PI, Members, Alumni pages), re-fetched in Phase 5.

**People — current members (5/5 match the live site):**

| Name | Korean | Role |
| --- | --- | --- |
| Heejeong Kim | 김희정 | Postdoctoral Researcher |
| Jihwan Kim | 김지환 | M.S. Student (live: "Master course") |
| Seonbin Kim | 김선빈 | M.S. Student (live: "Master course") |
| Hyejeong Jeon | 전혜정 | Undergraduate Researcher (UROP) |
| Siyeol In | 인시열 | Undergraduate Researcher (UROP) |

The live site lists no member emails or join dates publicly. Emails and join months were carried
over from the Phase 0 extraction of the individual member entries; they are not invented. If any are
stale, edit `_data/members.yml`.

**PI — verified against the live PI page:** name (Joonyoung F. Joung / Joonyoung Francis Joung /
정준영), title (Assistant Professor, from March 2025), department (Applied Chemistry), college
(Science and Technology), email, phone, and **office "Rm 229, College of Law" (법학관 229호)** all
match verbatim. The Law-building office for a Chemistry appointment is unusual but is exactly what the
site states — kept as-is. The B.S. (Inha University) is shown without a city, so no city is asserted.

**Alumni — all 6 real entries match the live site:** Chanjoong Kim (김찬중, note: Global PBL program,
Irvine, CA), Yongpyo Cho (조용표), Jinwoo Lee (이진우), Hanbyul Baik (백한별), Hyojin Lee (이효진),
Yumin Kim (김유민) — all Undergraduate Researchers (UROP). The live site's repeated note
"Undergrad. at Kookmin Univ." duplicates the role and was not carried as a separate field. The live
`/alumni-1` page does carry an ID photo for each of the 6 (the earlier "no alumni photos" note was
wrong): all 6 were harvested and now appear on the alumni cards, and each alumnus has a personal page
like the members (DECISIONS D18). No portrait is invented for anyone (the "no fake photos" rule holds).

---

## 3. Items for the lab to confirm  ⟵ please review

1. **Two joke alumni entries are intentionally excluded.** The live Alumni page contains two
   non-personnel/pet entries:
   - *Rosua Chung (정개념)* — role "PhDog Graduate", "House of Treats University"
   - *Camus Chung (정까뮈)* — role "PostDOGtoral Fellow", "School of Existential Barking"

   These read as an inside joke (likely lab dogs) rather than real alumni, so they are **not** on the
   new site. If they should appear (e.g., on a fun "lab life" section), add them to `_data/alumni.yml`.
   This is the one content decision most worth a human call.

2. **PI appointment without a date.** The live PI page lists a fourth role, "Research Professor,
   Research Institute for Natural Science, Korea University", with no period. It is included on the
   PI page with an empty date, placed alongside the 2020–2022 Korea University postdoc (the formal
   Korean title 연구교수 most likely covers that same period). If you have exact dates, add them in
   `_data/pi.yml`; if it duplicates the postdoc line, delete it.

3. **Member emails / join dates.** Not shown publicly on Wix; verify the values in
   `_data/members.yml` are current before relying on them.

---

## 4. Editorial / design decisions that affect content

- **Per-paper figures are now included** (DECISIONS D15, superseding D12). Every one of the 41 papers
  carries its real graphical abstract / TOC figure from the publisher of record, normalized to a
  uniform 360×270 white thumbnail (`assets/images/pubs/pub-<id>.jpg`) shown at 88×66 beside the
  citation on desktop and 64×48 on phones (the mobile thumbnail was restored in Phase 8, D19). The
  earlier blocker (ACS/Wiley/Elsevier/MDPI bot-wall a
  plain fetch so the `og:image` could not be read) was cleared with a headed real Chrome for the
  JS-challenged publishers and by resolving Elsevier DOIs to their PII for the open image CDN. These
  are the papers' own published abstracts, not invented filler, so the "no fakes" rule holds.
- **Publication topics:** 19 of 41 papers carry a single topic tag (mostly early
  spectroscopy/optics papers tagged "Optical property analysis", and the retrosynthesis/reaction
  papers tagged "Reaction pathway prediction"). These were reviewed and are accurate; multi-tagging
  was not forced. Adjust `themes:` in `_data/publications.yml` if a paper should surface under more
  filters.
- **Photos:** the full 25 genuine photos from the live gallery were migrated (bounded to ≤1600 px),
  each with its verbatim bilingual title/caption from the Wix gallery data (the first pass's 15-photo,
  no-caption premise was corrected; DECISIONS D16). Selecting a photo opens an accessible lightbox
  (focus trap, Esc/arrow keys, overlay-click close) showing the full image with its caption.
- **Language:** English-primary, with Korean kept in `*_ko` data fields for a future toggle
  (DECISIONS D9).
- **Kookmin University marks** (DECISIONS D17): the official English wordmark is in the footer, the
  Kookmin emblem sits in the header beside the enlarged SAIL wordmark (divider-separated, dropped on
  narrow phones to protect the wordmark), and the favicon/PWA icon set is the emblem on a circular
  white disc. All link to the English university site.
- **People grid and home figure** (DECISIONS D17, refined in D18): members and alumni are laid out
  three per row; the row block is centred but the cards fill from the left, so an incomplete final row
  stays left-aligned (matching `coley.mit.edu/people`) rather than centering a lone pair. Card spacing
  was opened up. The home hero carries the FlowER model-architecture figure (panel c of Fig. 1) from the
  lab's Nature 2025 paper, framed and attributed.
- **Alumni photos and pages** (DECISIONS D18): the 6 alumni now show real ID portraits harvested from
  the live `/alumni-1` page, and each has a personal page (the `_alumni` collection) like the members.
- **Research-area figures** (DECISIONS D18): each of the four research areas shows a real figure from one
  of the lab's own papers (JACS Au 2021, Nature 2025/FlowER, ACS Cent. Sci. 2025, Sci. Data 2020),
  captioned with a link to the paper; the page is a single-column zigzag so each figure has room.

---

## 5. Accessibility

Static audit across all 13 pages: `lang` set, one `h1` per page, no heading-level skips (the single
pi-page skip was fixed), skip-link present, descriptive link text (no "click here"), content images
have `alt`, filter controls expose `aria-pressed`, nav toggle exposes `aria-expanded`. Brand orange
for body text uses the darkened accessible ink (`#b9560f`) rather than the lighter brand orange to
keep contrast on white.

Phase 6 additions kept the same bar: the publication thumbnails are decorative (the citation sits
immediately beside them) and carry an intentional empty `alt=""` so screen readers do not announce a
redundant image; the photo-gallery triggers are real `<button>`s whose `aria-label` carries the
photo's title and caption; the lightbox is a labelled `role="dialog"` `aria-modal` with a focus trap,
Escape-to-close, and arrow-key navigation, verified working on the live site (section 7). A full
screen-reader pass and an automated Lighthouse run on the live URL remain recommended as follow-ups
but no blocking issues were found.

---

## 6. Deployment

Pages "Source" is set to GitHub Actions. All phase work was verified on `dev` (build job runs, deploy
job gated to `main`); `main` is updated only after review passes. The Phase 6 work was verified green
on `dev` (run 27469987391), fast-forwarded to `main`, and deployed (run 27470002969, build + deploy
both green). The custom domain `https://sail.kookmin.ac.kr` serves the new build over HTTPS with the
`CNAME` preserved; all assets return 200 (root `/favicon.ico` added so the browser's implicit probe
no longer 404s). The live-site visual QA below (section 7) was run against this deployment.

---

## 7. Live-site visual QA (Phase 6)

Run against the deployed site at `https://sail.kookmin.ac.kr` with headless Chrome (Puppeteer) at
desktop (1280 px) and mobile (390 px) widths, after forcing every image to load and awaiting
`decode()` so `naturalWidth` is authoritative (the first pass's "broken" reports were lazy-load
timing artifacts; on the settled pass every image decodes). Pages covered: home, research, pi,
members, alumni, publications, photos, and one member personal page.

| Check | Result |
| --- | --- |
| HTTP status, all 14 page-views (7 pages × 2 widths) | All 200 |
| Uncaught JS / page errors | 0 across all pages |
| Broken images (after force-load + decode) | 0 — all 41 publication thumbnails and all 25 gallery photos decode; PI, member, cover, header and footer logos all load |
| Em dashes in rendered text | 0 on every page |
| Publication thumbnails | 41 present, 41 loaded (desktop); hidden on mobile for a clean list |
| Members grid | 5 people, three per row (`[3, 2]`) on desktop; 2-up on phone |
| Alumni grid | 6 people, three per row (`[3, 3]`) on desktop; initials avatars (no source photos) |
| Home architecture figure | Present and loaded (FlowER Fig. 1c, Nature 2025) |
| Photos lightbox | Opens on click; shows full image + title + bilingual caption + "1 / 25" counter; arrow key advances to "2 / 25"; Escape closes |
| Header SAIL wordmark height | 56 px desktop / 44 px mobile (enlarged from the prior ~28 px) |
| Header Kookmin emblem | Loads beside the wordmark on desktop |
| Member personal page back-link | Text is "Members" with no "←" arrow; no arrow character anywhere on the page |
| Favicon / PWA icons | `favicon.ico`, `favicon-16/32`, `apple-touch-icon`, `icon-192/512` all 200; circular Kookmin emblem |

No defects found. Screenshots were captured for each page at both widths during the audit (local QA
artifacts, not committed). Remaining recommended follow-ups are unchanged from section 5 (a manual
screen-reader pass and a Lighthouse run on the live URL).

### Phase 7 update (2026-06-14)

Re-run after the Phase 7 deploy (run 27478631803) across 9 pages at desktop (1280 px) and mobile
(390 px) — 18 page-views — with the same force-load + `decode()` method, plus geometry checks on the
people grids and the nav active-state.

| Check | Result |
| --- | --- |
| HTTP status, all 18 page-views | All 200 |
| Uncaught JS / page errors | 0 across all pages |
| Broken images (after force-load + decode) | 0 (the photos lightbox placeholder was changed from an empty `src=""` to a 1×1 transparent data-URI, so it no longer reads as a broken image and the HTML is valid) |
| Em dashes in rendered text | 0 on every page |
| Members grid fills from the left | 5 people in rows of **[3, 2]** on desktop, both rows starting at the **same left edge** (the leftover pair fills from the left, not centered); 2-up and left-aligned on phone |
| Alumni grid | 6 people in rows of **[3, 3]** on desktop, all showing **real harvested ID photos** (0 initials avatars); 2-up on phone |
| Alumni personal pages | `/alumni/<slug>/` returns 200 with the portrait loaded and the name (e.g. "Chanjoong Kim 김찬중"); every alumni card links to its page |
| Research-area figures | 4 present, 4 loaded; single-column zigzag |
| Nav section highlight | /pi/ (and its deep pages) mark **Members + Principal Investigator** current; /alumni/ and /alumni/<slug>/ mark **Members + Alumni**; one current item per other top-level page |
| Kookmin University links | every KMU link resolves to `english.kookmin.ac.kr` (the footer "Links" entry was corrected from the Korean `www.` host); no `www.kookmin.ac.kr` anywhere |
| Member personal page | portrait loads, name renders, "Members" back-link present |

No defects found.

### Phase 8 update (2026-06-14)

Re-run after the Phase 8 deploy (run 27482222116) across 9 pages at three widths — mobile 360 px,
tablet 768 px, desktop 1280 px (27 page-views) — with the same force-load + `decode()` method, plus
targeted checks for each Phase 8 item: mobile publication thumbnails, the footer year, the header-logo
transparency (drawn to a canvas and read), the SEO/social meta, and horizontal overflow at 360 px.

| Check | Result |
| --- | --- |
| HTTP status, all 27 page-views (9 pages × 3 widths) | All 200 |
| Uncaught JS / page errors | 0 across all pages and widths |
| Broken images (after force-load + decode) | 0 at every width |
| Horizontal overflow at 360 px (`scrollWidth − clientWidth`) | 0 on every page (no page scrolls sideways on a phone) |
| Em dashes in rendered text | 0 on every page |
| **Publication thumbnails on mobile (360 px)** | **41 of 41 displayed and decoded**, each 64×48 (`grid-template-columns: 64px 1fr`); the earlier `display:none` on phones is gone |
| **Footer year** | `#footer-year` reads **2026** from the client script (`new Date().getFullYear()`); the build-time year is the no-JS fallback |
| **Header SAIL logo over the dark footer** | the wordmark's corner-pixel alpha is **0** (transparent) on the live PNG — no white box; natural width 224 px as expected |
| **og:image** | present on the home page, `https://sail.kookmin.ac.kr/assets/images/og-image.png`, the image itself returns **HTTP 200** and decodes at **1200×630** |
| Twitter card | `summary_large_image`; `twitter:image` set to the same card |
| Canonical / description / JSON-LD | all present |
| SVG favicon / PWA manifest / referrer policy | `favicon.svg`, `/site.webmanifest`, and `referrer = strict-origin-when-cross-origin` all present in `<head>` |
| `site.webmanifest` / `robots.txt` / `sitemap.xml` reachable | all **200** |
| LCP hero intrinsic dimensions | `width="1244" height="560"` with `fetchpriority="high"` (covers, PI portrait, and research figures likewise carry explicit dimensions, for CLS) |

No defects found across mobile, tablet, and desktop. The recommended manual follow-ups are unchanged
from section 5 (a screen-reader pass and a Lighthouse run on the live URL).

### Phase 9 update (2026-06-14)

Re-run after the Phase 9 deploy (run 27484568379) for the PI-feedback redesign round (D20): Pretendard
type, per-paper detail pages with Korean abstracts, a colored multi-select topic filter,
journal/DOI/preprint logos, and member icon links plus auto-listed papers. Live checks were run against
`https://sail.kookmin.ac.kr` over the home page, the publications index, all 41 detail pages, and all 5
member pages.

| Check | Result |
| --- | --- |
| HTTP status (home, index, 41 detail pages, 5 member pages) | All 200 |
| **Korean abstract on every paper** | **41 of 41** `/publications/:id/` pages render a non-empty `초록` (Korean lengths 474–693 chars on the sampled set) |
| **English abstract block** | present on 41/41, in a collapsible "Original abstract (English)" `<details>` |
| Unicode in abstracts (encoding) | μm, ×, π-π, Förster, ΔpKb, °C, ν0-n all render correctly (UTF-8, no mojibake) on the sampled pages |
| Journal logo / DOI logo | **41/41** detail pages show a journal logo and a DOI logo |
| Preprint logo | 4/41 (arXiv/ChemRxiv), correctly only where the entry has a `preprint_url` |
| **PI name bold** | `<strong class="pi">` on **41/41** detail pages (Joonyoung F. Joung / Joonyoung Francis Joung) |
| Topic filter | color dots (`pub-filter__dot`) + per-topic `data-theme-slug` present; multi-select wired in `pubs.js` |
| Publications list cleanup | no "peer-reviewed" lead line; every year heading is a bare 4-digit year (0 with counts), years 2026 down to 2015 |
| Home | loads Pretendard; no "recent work" section; full-width hero lead present |
| Member pages | 5/5 show icon links (`icon-links`); the auto-list publications section is empty on all 5 because no current member is yet an author on the 41 listed papers (the list is wired and will populate when a member's paper is added) |
| Font | site renders in Pretendard (`--font-serif` aliases the sans); no serif face remains |

No defects found. The recommended manual follow-ups are unchanged from section 5 (a screen-reader pass
and a Lighthouse run on the live URL).

## 8. Phase 9.1 update (2026-06-14) — hero width fix + R0–R12 re-verification

The hero was bleeding to the viewport edge (`.hero__inner { max-width: none }`) while every
other section stayed at `--container` (1140px), so on wide screens it looked wider than the
rest of the page. The override was removed; the hero now uses the standard container, its
edges line up with the nav and all sections below, and the description still spans the full
content width. This supersedes the "full-width hero lead present" note in section 7.
Deployed (main run 27485080347, build + deploy green) and re-verified live with a fresh
13-point check:

| Req | Check | Result |
| --- | --- | --- |
| R0 | Pretendard in CSS; `--font-serif` aliases the sans (no serif face) | PASS |
| R1 | hero uses `.container` (no `.hero__inner` override); 1440px screenshot edges align with nav + sections | PASS |
| R2 | home hero has no research/publications/people pill buttons | PASS |
| R3 | home has no "recent work" section | PASS |
| R4 | publications page has no "peer-reviewed papers, newest first" lead | PASS |
| R5 | year headings are bare 4-digit years (no per-year count) | PASS |
| R6 | `/publications/39/` renders a Korean 초록 + English collapsible | PASS |
| R7 | colored chips (dot + `data-theme-slug`); multi-select OR logic in `pubs.js` | PASS |
| R8 | member page renders the MEMBERS eyebrow above the photo | PASS |
| R9 | member social links render as `icon-link` with svg/img, not text | PASS |
| R10/R12 | `member.html` lists papers from the one `publications.yml` by name/alias; 0 current members are authors, so the section is correctly empty | PASS |
| R11 | detail 39 = journal logo + DOI image + ChemRxiv preprint; 37 = arXiv preprint; 41 = no preprint (conditional hides it), still logo + DOI | PASS |

All 13 checks pass. No defects found.

## 9. Phase 10 update (2026-06-14) — functional verification (PI round 2)

The PI pushed back on a prior superficial "looks fine" report and asked for each feature to be
checked for actual function, not markup presence. Everything below was verified against the
real CI artifact (the build of record), not the local source — with a headless-Chrome CDP
click test for the filter, and positive/negative controls for the member auto-add.

| # | What was verified | How | Result |
| --- | --- | --- | --- |
| 1 | Site JS ships in the build | `pubs.js`, `nav.js`, `photos.js` present in the artifact (1644 / 1300 / 2397 B) | PASS |
| 2 | Topic filter actually filters | CDP: load publications, click "Quantum chemical modeling" → visible papers 42 → 15, every one of the 15 carries that theme; click "All" → back to 42 | PASS |
| 3 | Filter chips select | CDP: 9 chips found, clicked chip gains `active` class | PASS |
| 4 | Member auto-add (R10) — positive | id-999 test paper authored by "Jihwan Kim" → jihwan-kim page shows it under one "Publications" heading | PASS |
| 5 | Member auto-add (R10) — negative | seonbin-kim (not an author) shows 0 member-pubs | PASS |
| 6 | Detail-page generator | `/publications/999/` built from the YAML entry with no `_publications` stub (42 detail dirs total) | PASS |
| 7 | DOI/preprint badges on the list | 46 `pub-badge` total: 42 `doi.png`, 3 `arxiv.png`, 1 `chemrxiv.png`; 0 leftover `btn--ghost` text buttons | PASS |
| 8 | Scholar logo | 1 `scholar.png` on the PI page, 0 leftover generic SVGs | PASS |
| 9 | News feed | 8 items render (1 event, 4 people, 3 publication); home teaser shows 3 cards | PASS |
| 10 | Left-aligned titles | all 7 pages use `container page-head` (no `container-narrow`) | PASS |

The id-999 test paper (checks 4–6) was a throwaway entry added only to exercise the live
mechanisms; it was removed before deploy, so jihwan-kim is correctly empty again. The design
review the PI asked for was done from full-page screenshots at 1440px and 390px across home,
news, publications, members, and research: spacing and positioning are clean at both widths;
the only blank regions in the captures are `loading="lazy"` journal covers, a headless-capture
artifact, not a site defect. No outstanding defects.

## 10. Phase 11 update (2026-06-14) — refactor + optimization pass (D22), parity-proven

A deep internals refactor (contributor ergonomics + code quality) with the hard
requirement of **zero change to what sighted visitors see**. Proven by building
the site on CI before and after and diffing the Pages artifact.

**Parity method.** Baseline = the deployed `_site` (CI Pages artifact of the
pre-refactor `main`). After each change, the `dev` artifact was downloaded and
compared with a script that normalizes whitespace and the build-time timestamp.

| Evidence | Result |
| --- | --- |
| Pages present before vs after | 61 HTML both; 41 publication detail + 5 member + 6 alumni pages all generated from `_data`, none lost |
| **Page body** (everything a visitor sees), every page | **byte-identical** to baseline after whitespace normalization (DRY includes + generator produce the same DOM) |
| `<head>` changes | only invisible meta: `og:type` article→website on the 52 generated pages (seo-tag), added JSON-LD, and `lang="ko"` attributes — no visible text/layout |
| Compiled CSS | shrank 28158→27421 B (dead rules removed); no computed style changed (selectors had no element) |
| `REFACTOR_PLAN.md`/`CONTRIBUTING.md` leaking into the build | fixed (added to `_config.yml` exclude); not published |
| Build-time validator | green on current data; fails with a readable message on a planted bad entry |
| CI html-proofer | runs 3 checks (Images, Links, Scripts), 68 internal links across 61 files, **0 failures** |

**Functional verification (headless-Chrome CDP, against the refactored CI
artifact).** Not markup-eyeballing — real clicks:

| # | Check | Result |
| --- | --- | --- |
| 1 | Topic filter narrows | click a chip → visible papers 41 → 2, every visible one carries that theme | PASS |
| 2 | "All" resets | → back to 41 | PASS |
| 3 | Photos lightbox | click a thumbnail → lightbox opens, title set, counter "1 / 25" | PASS |
| 4 | Esc closes lightbox | → `hidden` | PASS |
| 5 | Mobile nav toggle (390px) | click → `.site-nav.is-open`, `aria-expanded=true` | PASS |
| 6 | Generated member page | `/members/jihwan-kim/` renders "Jihwan Kim 김지환" from data (no stub) | PASS |
| 7 | Detail-page JSON-LD | `/publications/41/` has a valid `ScholarlyArticle` block | PASS |
| 8 | JS / page errors | 0 across the tested pages | PASS |

8/8 functional checks pass; the live post-deploy smoke re-confirmed the same on
`https://sail.kookmin.ac.kr` (see the deploy note below).

---

## RECOMMENDATIONS (needs human sign-off) — deferred, not executed

These would change what sighted visitors see, need a human fact/decision, or
carry regression risk against the "no visual change" mandate, so they were
logged rather than done.

1. **Responsive `srcset` for photos and publication thumbnails.** Would cut
   mobile bandwidth, but needs newly generated image derivatives (and re-checking
   every gallery/thumb visually). Deferred to avoid a visual-regression risk;
   worth doing as a dedicated image-pipeline task. *(2026-09-29: done in D40, the
   CI image step's smaller copies; layout checked identical, section 16.)*
2. **Self-host / preload Pretendard.** The font CSS loads render-blocking from
   jsDelivr. Self-hosting or `preload`+`font-display: swap` would improve first
   paint but changes font loading behavior — wants a human perf/QA check.
3. **Lighthouse + screen-reader pass on the live URL.** Recommended since Phase 5;
   still outstanding. The `lang="ko"` and JSON-LD added in D22 should help the SEO/
   a11y scores; verify with a real run. *(2026-09-29: Lighthouse run on the live URL
   before and after D40, section 16. The screen-reader pass is still outstanding.)*
4. **`Person` JSON-LD on member/alumni pages** (only the PI has it). Minor SEO
   upside; optional. *(Done on 2026-06-17, 8f9994f.)*
5. **Merge the duplicate adjacent links** (photo + name → same URL) in the people
   grid cards into one link, for slightly cleaner screen-reader output. Left as-is
   to avoid a markup change with no visible benefit.
6. Pre-existing human items still open from §3 are unchanged: the two joke "dog"
   alumni (kept excluded), the dateless PI "Research Professor" appointment, and
   verifying member emails/join dates.

## 11. README-path verification (2026-06-14) — adding content end-to-end

Confirmed on real CI builds that following `README.md`/`CONTRIBUTING.md` to add
content works and that mistakes are caught, not shipped.

**Happy path (build green, artifact checked).** Added a test member, a paper
(id 999) authored by them, and a news item — one entry each. Result: the paper's
`/publications/999/` detail page and the member's `/members/zzz-testperson/` page
were both generated from data with no stub; the paper auto-listed on the member's
page under a "Publications" heading (the `publications.yml` → member-page link,
matched on author name); the news item appeared on `/news/` and the home teaser;
the paper appeared on the list under its year. All test entries were then removed.

**Failure path (build red, as intended).** Planting three mistakes — a member
with no `role`, a paper `image:` pointing at an un-uploaded file, and a news
`category: awrd` typo — failed the build at the validator with one message:

```
SAIL data validation failed (3 problem(s)). Fix the _data/*.yml entries below...
 - members.yml "Zzz Testperson": missing required field `role`.
 - publications.yml id 999: `image: pub-999.jpg` not found in assets/images/pubs/.
 - news.yml "...test news": `category: awrd` is not one of people, publication, award, talk, event.
```

The site was never touched (the build aborts before deploy). The logic review
also hardened the validator to reject a quoted `year` and an unquoted news `date`
with a clear message — both would otherwise mix value types and crash the year-
group / date sort rather than fail cleanly.

## 12. Per-member external publications (2026-06-14, D23)

Members/alumni can now list their own papers (not on the lab Publications page)
via an optional `publications:` field. Verified on real CI builds:

| Check | Result |
| --- | --- |
| Existing pages unchanged (feature dormant) | all 61 page bodies byte-identical to the deployed site (artifact diff) |
| Renders when data added (temp paper on the postdoc) | "Publications" section shows the paper; title links to its **DOI** (`target=_blank`), not a dead `/publications/` link; owner's name **bold**; single-column `pub--nofig`; journal as text |
| Merge + order | personal papers merge with name-matched lab papers, de-duped by DOI/title, newest first |
| Validation | required fields / integer year / URL doi / image existence checked per entry; build fails clearly on a mistake |

The test entry was removed before deploy.

## 13. Production-readiness audit (2026-06-14)

A measured, evidence-based pass over the live site (headless Chrome), beyond the
functional crawl.

**Crawl (all 60 sitemap pages, desktop + mobile):** every page HTTP 200, exactly
one `<h1>`, `alt` on every image, 0 broken images, 0 uncaught JS errors, and no
horizontal overflow at 390 px.

**Core Web Vitals (desktop):** home LCP 117 ms / CLS 0; publications LCP 139 ms /
CLS 0.083; photos LCP 327 ms / CLS 0 — all within Google's "good" thresholds.
DOM sizes 200–765 nodes; home loads in ~9 requests.

**Accessibility (axe-core 4.10, WCAG 2 A/AA):** the first pass found borderline
issues (ratios 3.85–4.49 vs the 4.5 AA threshold) — `--orange-ink` on tinted
backgrounds (eyebrows, the "More news" link, the Publication news tag), the green
topic tag on its tint, color-only figure-caption links, an `<aside>` nested in
`<main>` on the PI page, and redundant gallery `alt`. All were fixed (darkened
`--orange-ink` to `#ad4f0a` and the green topic to `#1f7a33`, underlined the
caption links, changed the PI card to a `<div>`, made the gallery image
decorative). A re-run is **0 violations across all 11 audited page types**.

Remaining items are unchanged from §10 RECOMMENDATIONS (responsive `srcset`,
self-hosting Pretendard, a manual screen-reader pass) and the content notes in
§3 — none blocking.

---

## 14. Final production audit (2026-07-13, commit 8fcf379)

Run after the July 2026 changes (people photo folder and About section, D36; branch
ruleset; em dash sweep, D37). Everything below was verified against the deployed
build and the live site.

- **Repo state:** dev == main == origin at `8fcf379`, working tree clean; the latest
  Actions runs on both branches are green (build, validator, html-proofer, deploy).
  `main` is now covered by the `protect-main` ruleset (force pushes and branch
  deletion blocked; normal pushes unaffected).
- **Deployed build audit (artifact of 8fcf379):** 65 pages plus 24 legacy redirect
  stubs. Every page has a unique `<title>`, a unique meta description, and a
  canonical link; all 180 JSON-LD blocks parse as valid JSON; the sitemap (64 URLs)
  matches the built file set exactly and excludes the noindex redirects; all 5
  journal covers ship with their `-full.jpg` counterpart. The only duplicate
  description is 404.html sharing the site default with the home page, which is
  harmless because 404 responses are not indexed.
- **Live sweep:** all 64 sitemap URLs return 200; `/llms.txt`, `/llms-full.txt`,
  `/feed.xml`, `/robots.txt`, `/favicon.ico`, `/site.webmanifest`, and the CSS
  return 200; the legacy `/members|alumni/<slug>/` stubs serve their meta-refresh
  redirect; a bogus URL returns 404; `sailgroup.github.io` 301s to the custom
  domain and plain http 301s to https.
- **Browser sweep (live, headless Chrome):** 15 representative pages (all 9
  top-level pages plus 3 person and 3 publication pages) at 1440 px and 390 px,
  30 loads in total: zero console errors, zero page errors, zero failed requests.

---

## 15. Visual pass and fixes (2026-09-28, D38)

Verified on the CI artifact of `dev` commit b01a4dc (run 36406300276: build, validator,
html-proofer, image step, upload all green), served locally and driven with headless
Chrome, before publishing.

- **Pages:** all 69 sitemap URLs plus 404, at 1440 px and 390 px, and 12 representative
  pages also at 768 px (152 loads): zero console errors or warnings (so no CSP
  violation), zero page errors, zero failed requests, zero horizontal overflow, zero
  broken images, no `.eyebrow` element and no uppercase-transformed text anywhere.
  `<html lang>` is `ko` on `/positions/` only, `en` elsewhere.
- **Home:** section headings read Recent news, Research, Journal covers, Contact. The
  four research rows match `research.yml` title and body word for word (no
  truncation); each figure sits left of its text (208 px wide, 88 px on phones);
  title and figure link to the same `/research/#<slug>`, and all four ids exist on
  the Research page, landing below the sticky header. Hero has no glow or figure
  shadow, the header is solid white without blur, the footer address is upright.
- **Papers:** 1-41 still show 초록 with the English abstract folded; 42-45 (English
  only) now show it in full under "Abstract"; 46-47 have no abstract and show none.
  Every paper page has the plain "Publications" back link and a bold PI name without
  the highlighter.
- **Topic tags (text on tint):** Quantum 4.53, Representation 4.71, Property 5.79,
  Generative 7.31, Spectroscopic 7.81, Dataset 9.95, Reaction 10.50 (was 2.12-6.80).
  Active filter, white on fill: 4.91-12.14. Clicking every chip on and off returns
  the list to all 47 papers.
- **Fixes:** PI contact icons are inline with their text (all 6 rows); person pages
  show a centred Members/Alumni back link; Positions card titles have an 8 px gap;
  Korean text wraps between words.
- **axe-core (WCAG 2 A/AA)** on 12 page types: one finding, the "Award" news pill
  (4.27:1, a colour predating this pass and first used in June), fixed in D38.
- **Images:** the CI step reduced 2 of 90 uploads in the built copy
  (people/YOOYEONJU.jpg 978 KB to 40 KB at 640x800; pubs/pub-44.png 172 KB to
  145 KB); the repository files are unchanged. `/.well-known/security.txt` is present
  in the v5 artifact.
- **Content:** no file under `_data/` changed in D38. The data corrections requested
  afterwards (D39) are verified in section 16.

## 16. Data corrections and review follow-up (2026-09-29, D39 and D40)

Verified on a local build of the working tree made the way CI makes it (the image step
in `node:24` with the locked `sharp`, then `jekyll build` in `ruby:3.3` with Bundler in
deployment mode against the committed `Gemfile.lock`, then html-proofer: passed on 96
files), compared with a build of d098025, served locally and driven with headless
Chrome.

- **D39 in the build:** paper 44 shows "Early View" and links
  `https://doi.org/10.1002/bkcs.70213`; paper 42's title ends "Quantum Dots for
  Photovoltaics" and marks "Hyung Min Kim*"; paper 43 lists "Betar M. Gallant" and
  "T. Alan Hatton"; the Members grid shows "M.S./Ph.D. Integrated Course" twice; papers
  43 and 45 show the ChemRxiv and J. Alloys Compd. logos; the Alumni intro reads
  "Former members of the Spectroscopy and AI Lab at Kookmin University."
- **Content (D40):** `_data/` byte-identical to d098025. Visible text (`innerText`,
  `textContent`, `<html lang>`) identical on all 70 pages at 1350 and 390 px; the 26
  redirect stubs byte-identical. With the intended changes normalised out (D40), no
  other difference remains in any page's HTML.
- **Layout:** every element's box, after fonts and images load, identical on all 70
  pages at 1350, 1024, 700, 600 and 390 px, except paper 42's `<img>` at 600 and 700 px
  (469 to 500 px wide, same centre; the box differs from about 545 to 720 px);
  screenshots of that figure from 540 to 736 px are byte-identical.
- **Metadata:** all 193 JSON-LD blocks parse. 45 ScholarlyArticles, none with a
  `publisher` or a "..." author, each with the PI's author entry carrying
  `<site>/pi/#person`; none for papers 46 and 47, which also have no `citation_*`
  tags. The 8 alumni carry `alumniOf` only. The PI page's title is the PI's name and
  its description is byte-identical. `og:locale` is `en_US`, `ko_KR` on Positions.
  `/feed.xml` and its `<link>` are gone. `security.txt` `Expires` is the build time
  plus 330 days. `robots.txt`, `sitemap.xml` and `site.webmanifest` are unchanged.
- **llms.txt / llms-full.txt:** the ten entries match the Publications page order (47
  down to 38) and link each paper's page; the alumni URLs, the PI's biography,
  education and career, and all 20 news items (order, date, body, link) match the data
  and the pages. No em dashes.
- **Site sweep** (`.qa/tools/qa-site.js`: all 70 pages at 1440 and 390 px, 12
  representative pages also at 768 px): no console errors or CSP violations, no failed
  requests, no horizontal overflow, no broken images; axe-core (WCAG 2 A/AA, the 12
  pages at 1440 px) finds nothing.
- **srcset:** `sizes` against the drawn width at every viewport width from 320 to
  1600 px: gallery 1.000 to 1.034, covers 0.989 to 1.087, publication thumbnails
  1.000. Image bytes for the whole /photos/ page: 7,178 KB before; after, 1,438 KB on
  a desktop at 1x, 3,178 KB at 2x, 3,647 KB on a 375 px phone at 2x, 6,090 KB on a
  390 px phone at 3x.
- **Font swap** (Pretendard held back 1.5 s): /positions/ layout shift 0.26 to 0.0002
  on a phone and 0.06 to 0.26 (it varies run to run) to 0.0005 on a desktop; other
  pages unchanged (at most 0.003).
- **Lighthouse** (local, base to new, before the review fixes, which touch only
  metadata and text): Positions performance 65 to 82 on mobile and 84 to 99 on desktop,
  CLS 0.29 to 0; paper 1 mobile CLS 0.12 to 0.013; bytes on /photos/ 7,533 to 1,807
  KiB (desktop), home 933 to 562 KiB (desktop).
- **Image step on the repository** (90 images): 3 rewritten in the build copy
  (people/YOOYEONJU.jpg 978 KB to 40 KB, its EXIF removed; pubs/pub-44.png 172 KB to
  145 KB; people/anonymous.png drops a 25-byte text chunk, pixels identical); 85
  renditions for 80 images. On synthetic uploads (Linux filesystem): EXIF orientations
  3, 6 and 8 end up the right way round; PNG metadata removed with identical pixels;
  JPG and WebP metadata removed; GPS, HEIC and TIFF uploads warned; truncated and
  corrupt files left as uploaded with a warning; `x.jpg` and `x.JPG` do not share
  renditions; no temporary files left; a second run changes nothing; without CI or
  `--local` it exits without touching anything.
- **Header emblem:** the 160 px file drawn at 30, 36 and 46 px at 1x to 3x is
  visually identical to the 1024 px original.
- **Build tools:** the CONTRIBUTING commands work as written (`bundle lock` makes no
  change; the full local build passes html-proofer; the `docker` volume syntax works in
  PowerShell and, with `MSYS_NO_PATHCONV=1`, in Git Bash).
- **README path, end to end** (a scratch copy, edited only as the README describes: a
  new paper 48 with a figure, a new member with a photo, a news item linking to
  `/members/<slug>/`, a gallery photo, a journal cover pointing at paper 48, and one
  member moved to alumni; the gallery photo and paper 48's figure carried a GPS
  position, the cover none, as the step does not check covers): the build, the data
  check and html-proofer pass, and 34 checks hold. The paper page is generated (PI in
  bold, citation tags, the PI linked in its JSON-LD, figure sized); it heads the
  Publications list with a smaller thumbnail; it is listed on the pages of the new
  member, a current member and an alumnus who co-authored it. The new member has a page,
  a card on Members, and `/members/` and `/alumni/` redirects; the graduated member moved
  from Members to Alumni under the same address, with `alumniOf`. The news item shows on
  the home page and News with the link printed as `/people/<slug>/`; the photo leads the
  gallery with its smaller copies; the cover opens the full-size viewer and links to
  paper 48. `llms.txt` counts 48 papers and lists paper 48 first; `llms-full.txt`, the
  sitemap (without the redirects) and the image list include the new entries. The GPS
  warnings appear, and the served copies have no EXIF and are 1600, 1200 and 800 px.
- **Reviews:** four separate reviews (templates and SEO, CI and images, content and
  docs, and a last pass over the fixes) found nothing above low severity. Their fixes
  are in D40; one suggestion, a scheduled monthly rebuild for `security.txt`, was
  declined for the reason given there.
- **Deployed and verified live** (dev run 36474295882 and main run 36474498473, both
  green; `main` fast-forwarded to 9b3af2c with no PI commits in between): the CI
  artifact matches the local build file for file (445 files; only `security.txt`'s
  `Expires` differs). On https://sail.kookmin.ac.kr the 95 HTML pages, `llms.txt`,
  `llms-full.txt`, `sitemap.xml`, `robots.txt`, `site.webmanifest` and `main.css` are
  byte-identical to that build; all 175 image URLs (`src` and `srcset`) load; the 13
  people pages, their 26 `/members/` and `/alumni/` addresses and the 47 paper pages
  return 200; a missing address returns the 404 page and `/feed.xml` is gone.
- **Lighthouse on the live URL** (d098025 on 2026-09-28 against 9b3af2c, one run
  each): /photos/ on mobile, performance 87 to 96, LCP 4.1 to 2.7 s, 2,501 to 1,435 KiB
  (desktop 7,451 to 1,710 KiB); home 683 to 442 KiB on mobile and 861 to 489 KiB on
  desktop; /publications/ 480 to 328 KiB on mobile; /positions/ on desktop, performance
  87 to 100, CLS 0.267 to 0; papers 1 and 44 on mobile, CLS 0.060 and 0.015 to 0. The
  single mobile runs after the deploy also showed a later first paint on four pages
  (/publications/ 1.04 to 1.89 s), which three repeat runs each on /publications/,
  /positions/ and home did not (1.09 to 1.53 s). A local A/B of the two builds in ABBA
  order (four mobile runs per page, served without compression) finds no slowdown:
  first paint the same or earlier on /publications/, /positions/, home and /pi/; largest
  paint earlier on /publications/ and home and the same within run-to-run noise on the
  other two.
- **Live browser checks** (after the deploy): the full sweep (`.qa/tools/qa-site.js`
  against https://sail.kookmin.ac.kr: all 70 pages at 1440 and 390 px, 12 also at 768,
  axe-core on 12) finds no problems. The interactive parts work: on Publications each
  of the 7 topic chips shows exactly the papers that carry it, two chips show the papers
  with both, a year heading hides when it has none, and "All" shows all 47 again; the
  cover viewer on the home page and Photos opens the full-size cover, links to its
  paper, moves with the arrow keys and closes with Escape, returning focus; the photo
  viewer opens the 1600 px photo and moves and closes the same way; the member hover
  photo loads; the phone menu opens and closes; a missing address gets the 404 page;
  and no console error occurs. Every person page lists exactly the lab papers whose
  author list names the person (by name or `author_aliases`), as before. `http://` and
  `sailgroup.github.io` addresses redirect to https://sail.kookmin.ac.kr.

## 17. Review fixes and data corrections (2026-09-29, D41 and D42)

Verified on the CI builds of the two commits (dev runs 36554022773 for the fixes and
36554778179 for the data, both green, the image step strict: 90 images checked, 3
rewritten, 85 renditions, no failures), served locally and driven with headless Chrome;
the live site (9774b2e) is the "before".

- **D41 in the build:** the 14 corrected papers show the new titles, names, marks and
  issues; on each page the heading, the JSON-LD `headline` and `citation_title` agree;
  `citation_issue` is 36, 4 and 3 for 27, 38 and 39. Every changed value matches the
  publisher's page (paper 9: Crossref); the evidence was read from the pages, not only
  from Crossref.
- **Header** (default font size): the menu button shows at 992, 1024, 1080 and 1100 px
  and not at 1101, 1180, 1280 and 1440 px; at every width both logos keep their
  proportions (220.1x56 and 46x46), no nav label wraps where the nav shows, and nothing
  overflows. With a 20 px default font (a Chrome profile setting) the menu shows up to
  1375 px; from 1376 px "Group Guide" takes two lines (header 84 px instead of 82) and
  nothing overflows. The open menu's rows span the menu at 390 and 1024 px; Escape
  closes it and focus returns to the menu button.
- **Footer:** "SAIL" is 24 px white with no top margin at 1440, 768 and 390 px, and
  level with the column titles at 1440 px.
- **Publications:** the empty-result line is hidden at load; two topics with no common
  paper (Quantum chemical modeling and Representation learning) show it and no year
  group; "Show all papers" brings back all 47 and focuses "All". The ChemRxiv badges are
  the 136x40 file drawn 24 px tall.
- **Paper pages:** paper 44's figure sits below its title at 768 and 999 px (4 and 3
  title lines) and beside it at 1000 and 1440 px, with no overflow. Paper 43 shows the
  ChemRxiv logo 44 px and the badge 38 px tall, `citation_doi`
  `10.26434/chemrxiv.15005144/v1`, and that DOI as the article's `sameAs`.
- **PI page:** the contact list sits beside the 240 px photo at 561, 768 and 860 px, and
  below it at 560 px (320 px photo) and 861 px (280 px), with no overflow.
- **Metadata:** on 10 pages `color-scheme` is "only light", there is no robots meta, and
  every JSON-LD block parses; `/404.html` and a missing address (status 404) carry
  `noindex`. On Positions the page is `ko` and the skip link, header, footer and heading
  `en`; on the home page the header and footer carry no `lang` of their own. Both JSON-LD
  logos are the square file, which is served. The PI page's `og:image` and
  `twitter:image` are the portrait, and its Person has the image and the university's
  URL; paper 44's article has its figure as `image` and its DOI as `sameAs`. A
  `/members/<slug>/` redirect has an absolute canonical. `llms.txt`'s four research
  lines are whole (215 to 646 characters).
- **Print:** on paper 1 the folded English abstract opens on `beforeprint` and folds
  again on `afterprint`.
- **Before and after** (screenshots, live site against the build): the header at 1024,
  1080 and 1101 px; the footer; the PI page at 768 px; paper 44 at 768 and 1000 px (the
  same at 1000); the home research rows at 390 px; paper 43's head; and the home page at
  390 px under Chrome's forced dark mode (before: a dark page, the logo and the menu
  icon nearly invisible; after: the light design unchanged).
- **Site sweep** (`.qa/tools/qa-site.js`, its phone research-row check updated to the new
  layout; all 70 pages at 1440 and 390 px, 12 also at 768 px, axe-core on 12): no
  problems, on the build before and after the data commit. **Functional checks**
  (`.qa/tools/functional.js`, served locally): 22 of 22 pass. **HTML** (html-validate,
  standard rules, all 96 built pages): no errors except paper 29's bare "<" in its
  abstract, which the live site has too (D42).
- **Image step:** on a copy of the images, a corrupt JPG fails the run with
  `IMAGES_STRICT=true` (exit 1, the warning and a closing message) and without it passes
  with the warning (exit 0), as on `main`.
- **Deployed and verified live** (dev run 36558572454 and main run 36558704178, both
  green, the main run's image step with the same result as above; `main` fast-forwarded
  to a0fac09 with no PI commits in between): the build of a0fac09, whose changes are in
  the records and docs alone, matches the build checked above file for file (446 files;
  only `security.txt`'s `Expires` differs). On https://sail.kookmin.ac.kr all 96 HTML files
  (the 404 page included), `llms.txt`, `llms-full.txt`, `robots.txt`, `security.txt`,
  `sitemap.xml`, `site.webmanifest`, the three stylesheets and four scripts, the square
  logo and both ChemRxiv files are byte-identical to the deployed build, and all 227
  image URLs (`src` and `srcset`) load. Read from the live pages: the home page's square
  logo, the PI page's `og:image` and Person, `noindex` on `/404.html` and status 404 for
  a missing address, paper 43's preprint DOI, the `lang` marks on Positions, the hidden
  empty-result line, the titles of 7 and 36 and issue 36 of 27 (17 checks).
  `qa-site.js` on the live site: all 70 pages at 1440 and 390 px, 12 also at 768 px,
  axe-core on 12, no problems; `functional.js` on the live site: 22 of 22 pass.
