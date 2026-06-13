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
