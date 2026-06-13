# PROGRESS.md

Status: live. Phase 8 (mobile / SEO / security polish) complete; site deployed to
`https://sail.kookmin.ac.kr`.

- [x] **Phase 0** — Content extraction & audit (parallel scrape of Wix pages + members + images;
  `_data/*.yml`; `CONTENT_INVENTORY.md`)
- [x] **Phase 1** — Scaffold (Jekyll structure, design system, includes/layouts, CI build + deploy)
- [x] **Phase 2** — Content (home, research, PI, members, alumni, publications, photos, group guide)
- [x] **Phase 3** — Custom features (per-paper figures evaluated & omitted [D12]; member
  personal-page collection [D13])
- [x] **Phase 4** — Polish / identity (Kookmin logo in footer [D14], favicon, OG/meta, Scholar/ORCID,
  responsive, image optimization)
- [x] **Phase 5** — QA & deploy (content cross-check, link/image audit, build/deploy verify,
  accessibility, `REVIEW.md`, push)
- [x] **Phase 6** — Refinement (per-paper graphical-abstract thumbnails for all 41 [D15];
  25-photo lightbox gallery with captions [D16]; header Kookmin emblem + circular favicon,
  three-per-row people grid, alumni image cards, home FlowER architecture figure [D17];
  live-site visual QA, deploy)
- [x] **Phase 7** — Second refinement (people grid fills from the left like coley.mit.edu/people;
  6 real alumni portraits harvested from Wix /alumni-1; alumni personal pages via `_alumni`
  collection + `alumnus` layout; a real research-area figure per area from the lab's own papers
  [D18]; full-codebase review pass: em-dash-free output, footer KMU link consistency, nav
  section-highlighting, defensive member card, orphaned root logo removed; live-site QA, deploy)
- [x] **Phase 8** — Mobile / SEO / security polish (publication thumbnails restored on mobile;
  auto-updating footer year via client JS with the build year as fallback; transparent header
  wordmark to remove the white box over the dark footer; `og:image` social card + SVG favicon +
  PWA manifest + referrer policy; intrinsic image dimensions for CLS; static-site security review;
  multi-width live QA [D19])

### Log
- **Phase 0 start** — git connected to `origin/main` (splash-page history preserved); Wix scraping
  confirmed (WebFetch returns clean text). Launched parallel extraction agents: research, PI,
  alumni, journal covers, Kookmin logo, and 5 member subpages. Background scoop/Ruby install
  attempted for optional local builds.
- **Phase 0 done** — all content extracted. `_data/{publications,pi,members,alumni,research,covers,home}.yml`
  written; `CONTENT_INVENTORY.md` records migrated items, normalizations, and open flags. Ruby
  install did not persist (not on PATH) so CI is confirmed as the build of record. Kookmin logo
  deferred to Phase 4 (Wikimedia file-URL resolve failed); affiliation shown as text meanwhile.
  Research-area bodies recovered verbatim (EN + KO). Next: Phase 1 scaffold.
- **Phase 1 done** — Jekyll scaffold complete: `_includes/{head,header,footer,icon,pub-item}.html`,
  `_layouts/{default,page,member}.html`, `assets/css/main.scss` (full design system),
  `assets/js/{nav,pubs}.js`, `assets/images/favicon.svg`. CI workflow builds on push to
  `main`/`dev`; deploy job gated to `main` so `dev` verifies the build without publishing.
- **Phase 2 done** — content pages built: `index.html` (hero, research preview, covers, recent
  pubs, contact), `research.html` (4 areas, full text), `pi.html` (profile + CV + Scholar/ORCID),
  `members.html` (grid), `alumni.html` (list), `publications.html` (year groups + topic filter +
  PI highlight + DOI/preprint buttons), `photos.html`, `404.html`. Real images copied into
  `assets/images/`. **Photos:** the live Wix gallery had 15 genuine group photos — migrated all 15
  (bounded to <=1200px via Wix `fit` transform: 27 MB -> 4.5 MB), no captions invented. Pushing to
  `dev` to verify CI build is green before any merge to `main`. Next: confirm build, then Phase 3.
- **Phase 3 done** — Per-paper figures evaluated empirically across publishers and omitted as
  non-uniform / non-factual filler (D12); the publication list renders as a clean single-column row.
  Fixed a Liquid truthiness bug where empty `image: ""` is truthy, which had drawn an empty figure
  box on all 41 rows — now guarded with computed `hasimg`/`hasdoi`/`haspre` booleans in
  `pub-item.html`. Member personal pages added: `_members/<slug>.md` stubs + `member` layout that
  looks each person up in `members.yml` by slug and renders a centered card (D13).
- **Phase 4 done** — Official Kookmin University English logo placed in the footer brand column,
  linked to the English university site, 30px / 85% opacity, correct on the dark background (D14).
  Favicon (SVG), OpenGraph/Twitter meta, JSON-LD, and Scholar/ORCID links were already in place from
  Phase 1-2; responsive layout and bounded image sizes verified. Pushing the combined Phase 3-4 work
  to `dev` to confirm the CI build stays green. Next: Phase 5 QA, then merge `dev` -> `main` to deploy.
- **Phase 5 done** — Full QA pass. Content cross-checked against the live Wix site: members 5/5,
  alumni 6 real (the 2 joke "PhDog/PostDOGtoral" entries confirmed and excluded), PI office
  "Rm 229, College of Law" confirmed; added the "Research Professor, Research Institute for Natural
  Science" appointment the live PI page lists. Link/image/alt audit clean (13 pages, 0 broken, 0
  missing alt). Accessibility audit clean after fixing a pi-page heading skip (h1->h3 to h1->h2->h3).
  External links (DOIs, ORCID, Scholar, Group Guide, related labs) spot-checked 200. `REVIEW.md`
  written with items flagged for the lab. Pages "Source" switched to GitHub Actions (`build_type`
  workflow) with the `sail.kookmin.ac.kr` CNAME preserved. Merging `dev` -> `main` (fast-forward) and
  pushing to run the gated deploy job, which publishes to https://sail.kookmin.ac.kr.
- **Phase 6 done** — Refinement round on explicit instruction. (1) Every one of the 41 papers now
  carries its real graphical abstract / TOC figure, harvested from the publisher of record by DOI
  (headed Chrome clears the ACS/Wiley bot-walls headless cannot; Elsevier via PII-from-redirect; RSC
  and Nature via plain `og:image`) and normalized to a uniform 360x270 white thumbnail
  (`assets/images/pubs/pub-<id>.jpg`), reversing D12 (see D15). (2) The photos gallery was corrected
  from 15 to the full 25 Wix photos, each with its verbatim bilingual caption, behind an accessible
  lightbox (D16). (3) Production polish: the SAIL header wordmark is enlarged and the Kookmin emblem
  added beside it, the favicon/PWA icons became the circular Kookmin mark, the members and alumni
  grids are three-per-row (alumni use the same photo-or-initials card; no photos invented), and the
  home hero gained the FlowER model-architecture figure from the lab's Nature 2025 paper (D17).
  Verified on `dev` (build green, run 27469987391), fast-forwarded to `main`, deployed (run
  27470002969, build + deploy green). Live-site QA with headless Chrome across all pages at desktop
  and mobile widths: 14/14 page-views HTTP 200, 0 JS errors, 0 broken images (41/41 thumbnails and
  25/25 photos decode), 0 em dashes, members 3-per-row, lightbox open/caption/arrow/Esc all working,
  header logo 56px, member back-link arrow removed. Results in `REVIEW.md` section 7. A root
  `/favicon.ico` was added so the browser's implicit probe no longer 404s.
- **Phase 7 done** — Second refinement on explicit instruction. (1) The members and alumni grid now
  fills from the left: a centered three-track CSS grid (`repeat(3, minmax(0,210px))`,
  `justify-content:center`) whose items flow left-to-right, so an incomplete final row stays
  left-aligned (5 members render as rows of 3 + 2, both starting at the same left edge) rather than
  centering the leftover pair, matching the coley.mit.edu/people layout the brief referenced; spacing
  was opened up and the responsive 2-up steps kept (D18). (2) The earlier "no alumni photos" premise
  was wrong: the live /alumni-1 page carries an ID photo for each of the 6 undergraduate researchers,
  all harvested, square-cropped, and wired into the cards (no faces invented). (3) Alumni now have
  personal pages like members via a new `_alumni` collection + `alumnus` layout. (4) Each of the four
  research areas carries a real figure from one of the lab's own papers (JACS Au 2021, FlowER Nature
  2025, ACS Cent. Sci. 2025, Sci. Data 2020), the page laid out as a single-column zigzag (D18).
  (5) A full-codebase review pass fixed the two aria-label em dashes (shipped HTML is now em-dash-free),
  the footer Kookmin link (now english.kookmin.ac.kr), nav section-highlighting (the Members parent and
  the active PI/Alumni child now get `aria-current`), the defensive members.html photo/slug guards, an
  orphaned root sail-logo.png, and the photos lightbox placeholder `<img src="">` (now a transparent
  data-URI, valid HTML). Verified on `dev` (build green, run 27478611069), fast-forwarded to `main`,
  deployed (run 27478631803, build + deploy green). Live-site QA with headless Chrome across 9 pages at
  desktop and mobile (18 page-views): all 200, 0 JS errors, 0 broken images, 0 em dashes; members grid
  [3,2] left-aligned (rows share a left edge), alumni grid [3,3] with 6 real photos, all 4 research
  figures load, alumni/member personal pages render with photo, nav highlights the right section on
  every page, every Kookmin link resolves to english.kookmin.ac.kr. Results in `REVIEW.md` section 7.
- **Phase 8 done** — Mobile, SEO, and security polish on explicit instruction. (1) The publication
  thumbnails, hidden on phones since D15, now show on mobile: the `<=720px` rule went from a single
  column to `grid-template-columns: 64px 1fr` with a 64×48 figure (papers with no figure stay
  single-column via `.pub--nofig`); all 41 render at 360px. (2) The footer year is now wrapped in
  `#footer-year` and refreshed client-side with `new Date().getFullYear()` (a second IIFE in
  `nav.js`), so it stays current across a year boundary without a rebuild; the build-time year is the
  no-JS fallback. (3) The header SAIL wordmark showed a white box where the translucent sticky header
  met the dark footer on mobile, because `sail-logo.png` had an opaque white background — the PNG was
  made transparent by an unpremultiply-from-white pass (corner alpha now 0 on the live site), original
  archived in `_source/`. (4) SEO/social: no `og:image` was being emitted (jekyll-seo-tag reads
  `page.image`, not `site.logo`), so a branded 1200×630 card was generated and wired via a `_config.yml`
  `image` default, with `twitter.card: summary_large_image`, an SVG favicon, a `site.webmanifest`, and
  a referrer policy added. (5) CLS: explicit `width`/`height` on the hero (plus `fetchpriority="high"`),
  covers, PI portrait, and research figures, dimensions stored in `_data`. (6) Static-site security
  review: no secrets, no `eval`/inline handlers/`innerHTML`, `rel="noopener"` throughout, no mixed
  content; referrer meta added as hardening. Verified on `dev` (build green), fast-forwarded to `main`,
  deployed (run 27482222116, build + deploy green). Live multi-width QA across 9 pages at 360/768/1280px
  (27 page-views): all 200, 0 JS errors, 0 broken images, 0 horizontal overflow at 360px, 0 em dashes;
  41/41 mobile thumbnails, footer year 2026 from JS, logo corner alpha 0, og:image 1200×630 (HTTP 200)
  with the full meta/manifest/favicon set present. Results in `REVIEW.md` section 7 (Phase 8 update).
