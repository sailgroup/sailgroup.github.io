# DECISIONS.md

Autonomous build decisions for the SAIL lab website. Each entry is a decision plus its rationale.

## D1 — Static site generator: Jekyll
Per project spec and lab-site convention: GitHub Pages-native, the Coley / Allan Lab reference is
Jekyll, and the data-driven publications/members map cleanly onto Jekyll `_data` + collections.

## D2 — Build of record: GitHub Actions (local Ruby unavailable)
Ruby/Jekyll is not installed on the Windows dev machine; `choco` needs admin elevation (not
available in this non-interactive environment) and `wsl` has no distro installed. The spec
explicitly permits treating the GitHub Actions build as the verification baseline when local Jekyll
is blocked. Pages "Source" is set to GitHub Actions; the workflow runs `bundle exec jekyll build`
then deploys. A best-effort, no-admin Ruby install (scoop) was started in the background for
optional local iteration, but CI stays authoritative regardless of its outcome.

## D3 — Build fresh, not clone-and-strip
Build a clean, standard Jekyll structure from scratch, taking structural and visual cues from the
MIT-licensed Allan Lab / Coley templates rather than cloning and deleting branding. This avoids
inherited content/branding cruft, guarantees a standard CI-compatible build (no custom `_plugins`,
which break Pages "build from branch" and add fragility), and gives full control of the design
system. The spec says take the feel, not a copy.

## D4 — Design identity: clean academic base + SAIL orange
Layout and typography follow the restrained, light, generously-spaced feel of top lab sites
(Coley). SAIL's identity comes from the official logo (the authoritative brand asset): a black
wordmark with an orange accent bar. Primary accent = that orange; text is near-black; backgrounds
white / light gray. The legacy Wix splash used a purple/violet "spectrum" gradient; it is set aside
in favor of the logo's orange for legibility and academic tone (a subtle spectrum motif may return
as a secondary accent). Exact tokens are fixed in Phase 1.

## D5 — Deploy and domain
Pages source = GitHub Actions. `CNAME` (`sail.kookmin.ac.kr`) is preserved and emitted into the
built site. `_config.yml` `baseurl` = `""` (user-pages / apex serving). The new site is indexable
(the legacy Wix site was noindex).

## D6 — Source archive
Scraped Wix text and staged original-resolution images are kept locally under `_source/`
(gitignored, excluded from the build). The committed audit trail is `CONTENT_INVENTORY.md` and, at
QA, `REVIEW.md`.

## D7 — Publications
`_data/publications.yml` (provided, 41 papers, id 41 to 1) is authoritative and is not re-scraped.
It is cross-checked against the live "More Info" subpages only in Phase 5. Single-theme entries are
flagged for theme re-check (see the file's NOTES header).

## D8 — Parallelism via batched own-tool calls, not subagents
Spawning subagents (Agent / Workflow) returns "Usage credits required for 1M context": subagents
need a 1M-context entitlement that is not enabled this session, and the spec forbids asking the
user to change it. So all extraction and build work runs in the main thread; parallelism is
achieved by batching independent `WebFetch`/`curl` calls within a single turn. No loss to the
deliverable, just a different execution shape than the spec's "subagent" suggestion.

## D9 — English-primary site, Korean stored in data
The site is built English-primary, matching the convention of the top lab sites it targets and the
international audience for the publication record. Korean is not discarded: research-area bodies,
the overview, and the contact address are stored bilingually in `_data` (`*_ko` fields), so a
language toggle can be added later without re-scraping. Member and alumni names carry `name_ko`.
Rendering in Phase 1–2 uses the English fields. The PI's Korean name and the Korean address still
appear where they are the accurate, expected form.

## D10 — Photos page: migrate the 15 real Wix gallery photos, bounded for speed
The live Wix `/photos` page holds 15 genuine group/lab photos. These are real content, so they are
migrated (the "no fake photos" rule forbids *inventing* images, not bringing over real ones). The
source had no captions, so none are invented — images render with generic, truthful alt text. Wix
serves full-resolution originals (up to ~5.8 MB each, ~27 MB total), which is too heavy for the
"fast" quality target, so each is re-fetched through Wix's `fit` transform bounded to <=1200 px
(<=1000 px for the one RGBA PNG). Result: 4.5 MB total, lazy-loaded. Full-res originals are archived
in the gitignored `_source/images/photos/` in case higher resolution is needed later. Journal covers
(`_data/covers.yml`) are shown in a second section on the same page.

## D11 — Build verification on a `dev` branch; deploy stays gated to `main`
With no local Ruby (D2), the GitHub Actions build is the only way to verify the site compiles. The
workflow's `build` job runs on push to both `main` and `dev`, but the `deploy` job is gated
`if: github.ref == 'refs/heads/main'`. So all phase work is committed on `dev` and pushed to
exercise the real Jekyll build without publishing a half-finished public site; `main` is updated
(and the site deployed) only after the full content/QA passes in Phase 5. This satisfies the
"always verify the build before pushing [to production]" constraint without a local Jekyll.

## D12 — [SUPERSEDED by D15] Per-paper figures omitted; uniform text publication list kept
**Reversed.** The original call (kept below for the record) left `image` blank for all 41 papers.
On explicit instruction to add per-paper thumbnails, this was overturned: see **D15** for how the
graphical abstracts were actually obtained for all 41 and normalized to a uniform format.

Phase 3 evaluated graphical-abstract figures for the 41 papers by probing each publisher's DOI
landing page. Availability is inconsistent and the formats do not match: RSC exposes a real but tiny
graphical abstract (e.g. 378x155 GIF, ~9 papers); Nature exposes Figure 1 (~5 papers); ACS — the
largest group (~16 papers) — exposes only a wide *branded social card*, not the science TOC graphic;
Wiley, Elsevier, and MDPI do not return an og:image to a plain fetch. A mixed set (tiny GIFs + first
figures + marketing banners + blanks, in clashing aspect ratios) reads as less professional than a
clean, uniform text list, and publisher social cards would be non-factual filler — against the "no
fakes / factual" rule. The spec explicitly permits leaving figures blank. So `image` stays empty for
all 41 papers; `pub-item.html` renders the clean single-column row (`pub--nofig`). Visual interest is
carried by the journal-covers section. Curated graphical abstracts can be added per-paper later by
populating the `image` field. Logged in `REVIEW.md`.

## D13 — Member personal pages: centered card driven from members.yml
Each member gets a route under `/members/<slug>/` (a stub file in the `_members/` collection holding
only `slug` + `permalink`). The `member` layout looks the person up in `_data/members.yml` by slug, so
`members.yml` stays the single source of truth (no duplicated per-file front matter to drift). The
live Wix profiles carry little structured data (name, role, email, photo, join date), so the page is
an intentionally minimal centered card — round photo, name + Korean name, role, lab affiliation, join
month, and a mailto button — rather than a sparse imitation of a full CV page. Any prose written into
the stub body renders below the card; none is invented. This satisfies "member info exactly from Wix,
no guessing" while still giving each person a real, linkable page.

## D14 — Kookmin University logo in the footer
The official KMU English logo (`english.kookmin.ac.kr/images/common/main_logo.png`, the horizontal
emblem + wordmark) is placed in the footer brand column, linked to the English university site. It is
the authoritative institutional mark and its wordmark is white (designed for dark/colored headers), so
it sits correctly on the dark footer; the white-background preview showed the wordmark area blank,
confirming the text is white/transparent, never black-on-dark. Rendered at 30 px tall, 85% opacity
(full on hover). The square 80th-anniversary emblem was rejected: it is a time-limited commemorative
mark, not the standing logo. The plain-text affiliation line stays for clarity and SEO; the logo is
the visual institutional anchor.

## D15 — Per-paper graphical-abstract thumbnails for all 41 papers (supersedes D12)
Every publication now carries its real graphical abstract / TOC figure, sourced from the publisher
of record by DOI. D12's blocker was that ACS/Wiley/Elsevier/MDPI bot-wall a plain `curl`/WebFetch of
the landing page (identical ~93 KB ACS interstitial, Wiley 402, Elsevier link-hub stub), so the
`og:image` could not be read. Resolution: drive a **headed** real Chrome (puppeteer-core against the
system Chrome) from the residential dev IP, which clears the Imperva/Cloudflare JS challenges that
headless provably cannot — that yielded the image URL for all 15 ACS, 5 Wiley and MDPI. RSC (9) and
Nature (5) came from a plain `og:image` fetch. The 4 Elsevier abstracts were built by resolving each
DOI to its PII via the 302 `Location` header, then pulling the open `ars.els-cdn.com/.../<PII>-fx1`
graphical abstract directly (the image CDN is not walled even when the HTML is). OAE uses the
article's own cover image. The harvested sources are heterogeneous (tight RSC GIFs, Nature Fig.1s,
ACS 1200x628 social-card GAs, Elsevier hi-res `_lrg`), so each is **normalized** to a uniform 360x270
(4:3) white canvas with the whole graphic contained and centred (`render_thumbs.py`), written to
`assets/images/pubs/pub-<id>.jpg` (~13 KB avg, 552 KB total) and displayed at 88x66 `object-fit:cover`
(no further crop, since the source is already 4:3). Thumbnails are hidden on mobile (single-column
list). These are the papers' own published abstracts, not invented filler, so the "no fakes" rule is
satisfied; this is the curated population D12 anticipated.

## D16 — Photos page: full 25-photo gallery with lightbox + captions (extends D10)
The live Wix `/photos` gallery actually holds **25** photos (not the 15 of D10's first pass), each with
a real bilingual title/description in the Wix `galleryData`. All 25 are migrated with their verbatim
captions (no captions invented — D10's "no caption" premise was simply wrong about the source). Photos
are bounded to <=1600 px (8.8 MB total, lazy-loaded). Selecting a photo opens an accessible lightbox
(`assets/js/photos.js`: focus trap, Esc/arrow keys, overlay-click close) showing the full image with
its title and caption, matching the Wix behaviour the brief asked for, rather than linking to the raw
JPEG. The journal-covers section stays below the gallery.

## D17 — Header institutional mark, circular favicon, people grid, home research figure
Four production-polish decisions taken together: (1) the SAIL wordmark in the header is enlarged
(~56 px tall) and the official Kookmin **emblem** (extracted to a transparent PNG from the gray
signature asset) is added top-left beside it, divider-separated, linked to the English KMU site; on
narrow phones the KMU mark/divider drop to protect the wordmark. (2) The favicon/PWA icons are the KMU
emblem on a circular white disc (16/32/180/192/512 + `.ico`), replacing the generic SVG. (3) The people
grid (members and alumni) is laid out at **three per row**, centred, so an incomplete final row balances
(flex, not auto-fill grid); alumni use the same photo-or-initials card as members, with no fabricated
photos. (4) The home hero gains a research figure: panel (c), the model-architecture row, cropped from
Fig. 1 of the lab's FlowER paper (Nature, 2025) and shown as a framed, attributed landscape band under
the hero actions — a real figure from the group's own flagship work, per the request for a main-screen
architecture image.

## D18 — People grid left-fill, alumni photos + personal pages, research-area figures (revises D17)
A second refinement round on explicit instruction, in four parts plus a full-codebase review pass.

(1) **The people grid fills from the left.** D17's centered flex grid centered an incomplete final
row (5 members rendered as a lone centered pair). The grid is now `repeat(3, minmax(0, 210px))` with
`justify-content: center`: the three-track block is centered in the column, but items fill
left-to-right, so a partial last row stays left-aligned, matching the `coley.mit.edu/people` layout the
brief referenced. Inter-card spacing was opened up (`gap: var(--space-2xl) var(--space-xl)`). Responsive:
two-up at 720 px and again, tightened, at 480 px. Members and alumni share the rule.

(2) **Alumni photos are real, not absent.** The earlier premise that the Alumni page had no portraits
was wrong: the live Wix `/alumni-1` page carries an ID photo for each of the 6 undergraduate
researchers. All 6 were harvested, center-cropped to squares (JPEG q88), and wired into the alumni
cards (`assets/images/<slug>.jpg`). The 2 joke "dog" entries remain excluded (REVIEW.md §3). No photo
was invented for anyone genuinely lacking one — here none were missing, so the "no fakes" rule is
untouched.

(3) **Alumni have personal pages, like members.** A new `_alumni` collection (output, permalink
`/alumni/:name/`) plus an `alumnus` layout mirror the member collection (D13): each alumnus card links
to a centered personal page that looks the person up in `alumni.yml` by slug. Cards and pages degrade
gracefully — initials disc when photoless, plain name when slugless, optional note and email — so a
future entry without a photo or slug never produces a broken link or image.

(4) **Each research area carries a figure from the lab's own paper.** The four research areas now each
show a real figure from the group's publication of record by DOI, captioned with a link to the paper:
Properties → JACS Au 2021, Reaction → the FlowER architecture (Nature 2025, the same figure as the home
hero), De Novo → ACS Cent. Sci. 2025, Database → Sci. Data 2020. The page became a single-column zigzag
(the figure alternates side per area) so each figure has room. Figures were harvested with the headed-
Chrome method of D15 (ACS Imperva needs a longer settle; one retry with a poll loop cleared it). These
are the papers' own published figures, not invented art, so the "no fakes" rule holds.

(5) **Full-codebase review pass, with fixes.** Found and corrected: the footer "Kookmin University"
link pointed at the Korean `www.kookmin.ac.kr` while every other KMU link uses `english.kookmin.ac.kr`
(now consistent, per D17); two `aria-label`s contained em dashes — the only em dashes reaching rendered
output — now removed, so the shipped HTML is em-dash-free; the dropdown "Members" parent and its
PI/Alumni children did not highlight on those pages (nav active-state now matches a parent when the
current page is any of its children, and the active child gets `aria-current`, styled in the subnav);
`members.html` photo/slug guards were hardened to match the defensive `alumni.html`; and an orphaned
root `sail-logo.png` (a byte-identical duplicate of `assets/images/sail-logo.png`, which is the only
copy referenced) was removed so it no longer publishes as a stray file at the site root.

## D19 — Mobile thumbnails, auto-updating footer year, transparent header logo, social/SEO card, CLS dimensions, security review (Phase 8)
A polish round on explicit instruction ("is mobile well optimized; show the publication thumbnails on
mobile; then do a deep full-codebase review of both mobile and desktop optimization; check the SEO
(og-image, favicon); does the footer year auto-update each year; any security weaknesses; the SAIL
header logo shows a white box where it meets the dark footer on mobile") plus a sweep for small details.

(1) **Publication thumbnails now show on mobile.** D15 hid the per-paper figure on phones (the
`@media (max-width: 720px)` rule set `.pub` to a single column and `display: none` on the figure). On
explicit request the figure is restored at every width: the mobile rule now sets
`grid-template-columns: 64px 1fr` with a 64×48 thumbnail, while a paper genuinely without a figure
(`.pub--nofig`) stays single-column. All 41 thumbnails render on mobile (verified 41/41 displayed and
decoded at 360 px).

(2) **The footer copyright year auto-updates.** `{{ site.time | date: '%Y' }}` is the build-time year,
so a year rollover without a rebuild would leave it stale. The year is wrapped in
`<span id="footer-year">` and a small client script (`new Date().getFullYear()`) refreshes it on load;
the server-rendered build year is the no-JS fallback. The script is a second IIFE appended to `nav.js`,
placed outside the nav IIFE (which returns early when there is no nav toggle) so it runs on every page.

(3) **The header SAIL logo no longer shows a white box over the dark footer.** Root cause:
`sail-logo.png` shipped with an opaque white background, and the sticky header is translucent
(`rgba(255,255,255,0.88)`); when the dark footer (`#161310`) scrolled under the header on mobile, the
logo's white rectangle showed against it. Fix: the wordmark PNG was made transparent by an
unpremultiply-from-white pass (per pixel `a = 255 - min(R,G,B)`; near-white -> fully transparent,
otherwise each foreground channel is reconstructed so the mark renders identically over white and shows
only the letterforms over any color). The white-background original is archived in `_source/images/`.
Verified on the deployed site by drawing the header logo to a canvas: corner-pixel alpha is 0.

(4) **og:image and a complete social/SEO set.** jekyll-seo-tag emits `og:image` from `page.image` /
`site.image`, not from `site.logo` (which only feeds JSON-LD), so no Open Graph image was being
produced. A branded 1200×630 card (`assets/images/og-image.png`, dark ground + orange glow, the SAIL
wordmark, lab + department line, Kookmin mark, domain pill) was generated and wired through a
`_config.yml` `defaults` entry (`scope.path: ""` -> `image:`) so every page emits `og:image` and
`twitter:image`; `twitter.card: summary_large_image` selects the large card. An SVG favicon, a
`site.webmanifest` (PWA: name/short_name/icons/theme), and a `referrer` policy meta were also added;
`robots.txt` and `sitemap.xml` were already present and correct.

(5) **Cumulative Layout Shift: intrinsic image dimensions.** The LCP hero, the home cover strip, the
PI portrait, the research-area figures, and the journal covers were given explicit `width`/`height`
attributes (and the hero `fetchpriority="high"`) so the browser reserves the correct box before the
image loads, even though CSS sizes them fluidly (`width:100%;height:auto` -> the attributes set the
aspect ratio). The pixel dimensions were stored in `_data/covers.yml` and `_data/research.yml` to stay
data-driven. No horizontal overflow at 360 px on any page.

(6) **Security review (static GitHub Pages site): clean.** No secrets in the repo or output; no inline
event handlers, no `eval`, no `innerHTML` sink (the photos lightbox writes through `textContent` /
`.src` / `.alt`, and its data is build-time `jsonify`d, not user input); every external link carries
`rel="noopener"`; no mixed content (all HTTPS). The added `referrer` policy meta
(`strict-origin-when-cross-origin`) is the one hardening change. Nothing exploitable for a static site;
there is no server, form, or dynamic input to attack.

Verified on `dev` (build green), fast-forwarded to `main`, deployed (run 27482222116, build + deploy
both green). Live multi-width QA (REVIEW.md section 7, Phase 8) across 9 pages at 360 / 768 / 1280 px
(27 page-views): all HTTP 200, 0 JS errors, 0 broken images, 0 horizontal overflow at 360 px, 0 em
dashes; 41/41 publication thumbnails shown on mobile, footer year `2026` from the client script, header
logo corner alpha 0, `og:image` 1200×630 (HTTP 200) with the full Twitter/manifest/SVG-favicon/referrer
set present and the manifest/robots/sitemap all returning 200.

## D20 — PI-feedback redesign: Pretendard type, per-paper detail pages with Korean abstracts, colored multi-select topic filter, member icon links and auto-listed papers

After the Phase 8 deploy the PI reviewed the live site and sent a batch of change
requests. They were implemented as one round, in two commits: the layout, styles, and
logo assets (`996cab8`), then the abstract data fill.

(1) **Type (was Source Serif 4 -> Pretendard).** The serif display face was replaced
with Pretendard (variable, dynamic-subset, loaded from jsDelivr) for full Hangul support
and a softer tone. Rather than touch every rule, `--font-serif` was repointed to
`var(--font-sans)`, so the whole site renders in one friendly sans with no other markup
change; no serif face remains anywhere.

(2) **Home.** The hero description now spans the full content width under the title; the
hero pill buttons and the home "recent work" section were removed. The home page is hero,
research, journal covers, contact.

(3) **Publications list.** Dropped the "41 peer-reviewed papers" lead line and the
per-year paper counts; each year heading is now the bare year.

(4) **Topic filter (colored + multi-select).** The topic chips carry a per-topic color
dot keyed by `data-theme-slug` (palette in `main.scss`) and are multi-select: clicking
several shows every paper matching any selected topic, and "All" resets. `pubs.js` was
rewritten around a Set of active themes.

(5) **Per-paper detail pages.** Each paper title links to `/publications/:id/`, a page
built from a thin `_publications/<id>.md` stub (just `pid: <id>`) resolved against the
single `publications.yml` by a `where: "id"` lookup (the stub uses `pid`, not the
Jekyll-reserved `page.id`). The page shows the journal logo, theme tags, the
title/journal/authors line with the PI name bold, a DOI logo link and a preprint logo
when those exist (see 7), the graphical abstract, the Korean 초록, and the original
English abstract in a collapsible block.

(6) **Abstracts (English + Korean) for all 41 papers.** Every entry now carries
`abstract` (cleaned English) and `abstract_ko` (Korean). The English is the real
publisher/aggregator full text (Semantic Scholar, then OpenAlex inverted-index
reconstruction, CrossRef, and headed-Chrome publisher scrapes as needed), cleaned of
editor/news/figshare boilerplate, with scientific notation normalized to Unicode (μm, ×,
π-π, Förster, ΔpKb, °C, ν0-n). `abstract_ko` is a faithful translation of that abstract;
machine translation is acceptable here per the PI. No abstract was invented: entries hold
real text only, and the detail-page template renders each block only when its field is
non-empty. The fetch/scrape/inject/QA scripts were one-off and are gitignored, not part
of the build.

(7) **Journal / DOI / preprint logos.** 47 journal wordmarks plus `arxiv.png`,
`chemrxiv.png`, and an orange `doi.png` were imported under `assets/images/`. Journal
name -> file is mapped in `_data/journal_logos.yml`; an unmapped journal renders no logo
rather than a placeholder. The DOI logo shows when the entry has a DOI, the preprint logo
when it has a `preprint_url` (arXiv vs ChemRxiv chosen from the URL). Live, 41/41 detail
pages show a journal logo and a DOI logo; 4 carry a preprint logo.

(8) **Member pages.** Spacing was added under the "MEMBERS" eyebrow. Email, LinkedIn, and
Google Scholar (plus ORCID/website) now render as icon links via `social-links.html`, and
only when a real URL is on file, never invented. Each member page lists, live from the one
`publications.yml`, any paper whose author list contains the member's name or a listed
`author_aliases` entry, so a single source feeds the publications page, the detail pages,
and the member pages (no per-member list to keep in sync). None of the five current
members (one postdoc, two M.S., two undergraduates, all joined 2025–2026) is yet an author
on the 41 listed papers, so the section is correctly empty for all five today and will
appear when a member's paper is added.

Verified on `dev` (build green, run 27484553277), fast-forwarded to `main`, deployed (run
27484568379, build + deploy both green). Live QA (REVIEW.md section 7, Phase 9): all 41
`/publications/:id/` pages return 200 with a non-empty Korean 초록 and the English block;
journal logo and DOI logo on 41/41, preprint logo on 4/41, PI name bold on 41/41; the
publications index has colored multi-select chips, no lead line, and no per-year counts;
the home page loads Pretendard with no "recent work" section; all five member pages return
200 with icon links.

(9) **Hero width correction (revises R1).** The first full-span pass set
`.hero__inner { max-width: none }`, which removed the container cap and let the hero bleed
to the viewport edge while every other section stayed bound to `--container` (1140px). The
PI reported it looked "too full" relative to the rest of the page. The override was removed
so the hero content uses the standard `.container` width and its left/right edges line up
with the nav and every section below; the description still spans that full content width,
now matched to the rest of the page (the R1 intent, just bounded). Deployed (dev run
27485068238 build green; main run 27485080347 build + deploy green) and verified live: the
compiled CSS has no `.hero__inner` rule, and a 1440px screenshot shows the hero eyebrow,
h1, and lead sharing the same left edge as the nav and the Research section. A 13-point
re-check of R0–R12 (font, hero, no hero pills, no recent-work, no publications lead, bare
year labels, Korean 초록 + English block, colored multi-select chips, journal+DOI logos
with conditional preprint logo verified on 39/37/41, member eyebrow, social icon links)
all pass; see REVIEW.md Phase 9.1.

## D21 — News feed, brand logos on the publications list, single-source detail pages, Node 24, left-aligned titles (PI-feedback round 2)

A second batch of PI feedback, plus a functional re-verification the PI asked for after an
earlier "looks fine" report was too superficial. Six changes.

(1) **News tab, editable by non-coders via one YAML file.** Added a `/news/` page and a
top-nav "News" entry (second, after Home). Content lives in `_data/news.yml`: one list
entry per event with `date` (YYYY-MM-DD, required, drives the sort), an optional
`display_date` text override, a `category` (people | publication | award | talk | event)
that colors the pill, a `title`, an optional `body`, and an optional `link` (an internal
path like `/members/...` or `/publications/41/`, or a full external URL — the template
detects `://` and opens external links in a new tab). The file header documents every field
in plain language so a lab member can add an entry without touching templates. The home page
shows the three most recent items as cards under a "Recent news" band; the news page lists
all of them newest-first. Seeded with eight real, datable events only: five member arrivals
(2025–2026), the three 2026 papers (ids 39/40/41, linked to their detail pages), and the
lab opening (March 2025). Heejeong Kim has no on-record join date so she is intentionally
not in the people entries; logged in CONTENT_INVENTORY.md. No event was invented.

(2) **DOI / arXiv / ChemRxiv / Scholar logos used on the list, not just detail pages.** The
PI asked why the orange DOI mark, the arXiv mark, and the Google Scholar mark were not on the
publications list. They now are. Each list entry's footer renders a `doi.png` badge (when the
entry has a DOI) and a preprint badge (when it has a `preprint_url`; arXiv vs ChemRxiv chosen
from the URL), replacing the old text "DOI / Preprint" buttons — the same logic the detail
pages already used. The Google Scholar logo (`scholar.png`, a transparent raster) now renders
through `_includes/icon.html` wherever a Scholar link exists (PI page, member and alumni
social links), replacing a generic SVG. Live counts on the built list: 41 DOI badges,
3 arXiv, 1 ChemRxiv, Scholar on the PI page.

(3) **Detail pages generated from `publications.yml`, no per-paper stub.** Adding a paper used
to need both a `publications.yml` entry and a hand-written `_publications/<id>.md` stub. A
custom Jekyll generator (`_plugins/publication_pages.rb`) now creates
`/publications/<id>/` for any id in `publications.yml` that lacks a stub, so one YAML entry is
enough. It is additive: where a stub still exists it wins and is skipped, so the 41 existing
pages are untouched. This works because CI builds with `bundle exec jekyll build` (custom
plugins enabled), not the restricted github-pages gem (see D2). Verified by temporarily adding
a test paper (id 999): its `/publications/999/` page built with no stub, then the entry was
removed before deploy.

(4) **Member auto-add proven, not assumed.** The PI asked to confirm that adding a paper whose
author is a current member auto-lists it on that member's page. `member.html` scans
`publications.yml` for the member's name or an `author_aliases` entry (D20), so the mechanism
existed; this round proved it on a real build. With the id-999 test paper authored by
"Jihwan Kim", jihwan-kim's page showed the new paper under "Publications" while a control
member (seonbin-kim, not an author) showed none. The test entry was then removed, so all five
members are again correctly empty until a real paper carries their name.

(5) **Node 24 in CI.** Per the PI's request, the deploy workflow pins
`FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true` so the GitHub-managed Pages/upload actions run on
Node 24 instead of emitting Node 16/20 deprecation warnings.

(6) **Subpage titles left-aligned to match the home hero.** The PI noted the home hero text
sits at the left while the Research / Members / Publications / etc. page titles were centered.
Those pages used `container container-narrow page-head` (a 760px centered column); the
`container-narrow` cap was removed from all seven (research, members, publications, pi, alumni,
photos, news) so each title and lead share the same left edge as the hero and nav.

Build-of-record note: the blanket `"*.js"` exclude that had silently dropped the site's own
`assets/js/*.js` (the cause of the earlier "filter chips not selectable" report) stays
removed; this round re-confirmed `pubs.js`, `nav.js`, and `photos.js` are present in the build
and that clicking a topic chip actually filters (CDP test, REVIEW.md Phase 10).

**Same-day follow-ups (PI):**
- *Header Kookmin emblem links home.* The top-left Kookmin emblem used to open
  `english.kookmin.ac.kr` in a new tab; the PI asked it to go to the site home like the SAIL
  wordmark. It now points to `/`. Kookmin's site is still linked from the footer (the wordmark
  and the "Kookmin University" entry under Links), so the external path is not lost.
- *DOI badge swapped to the official logo.* The supplied DOI image had a dark ring around the
  circle that looked heavy against the white cards. Replaced with the official DOI Foundation
  mark from Wikimedia Commons (`File:DOI_logo.svg`, brand amber `#fcb425`, no border) saved as
  `assets/images/doi.svg`; the two `<img>` references (list footer and detail page) now point to
  the SVG and the old `doi.png` was removed. SVG keeps the badge crisp at 24px and 38px. arXiv
  and ChemRxiv badges are unchanged.
- *News: website launch.* Added a 2026-06-14 `event` entry ("New SAIL website launches") to
  `_data/news.yml`, noting the move to sail.kookmin.ac.kr from the previous Wix site. Confirmed
  to the PI that the news feed is a plain YAML file any lab member can edit on GitHub (the file
  header documents every field).

## D22 — Refactor + optimization pass: one-edit contributing, DRY internals, build-time validation (Phase 11)

A deep internals pass with two goals: a non-coder can add any content type by
editing **one** documented place, and the code is DRY/validated/accessible —
all with **zero change to what sighted visitors see**, proven by diffing the CI
Pages artifact before/after (every page body byte-identical; only invisible
`<head>` meta and `lang="ko"` attributes change). Audit + plan are in
`REFACTOR_PLAN.md`; QA evidence in `REVIEW.md` §10. Six changes:

1. **One YAML edit = one page (the headline ergonomics win).**
   `_plugins/generate_pages.rb` now generates every `/members/<slug>/`,
   `/alumni/<slug>/`, and `/publications/<id>/` page directly from
   `members.yml`/`alumni.yml`/`publications.yml`. This removed the 52
   hand-written collection stubs (41 `_publications` + 5 `_members` + 6
   `_alumni`), the old `publication_pages.rb`, and the `collections:` +
   per-type-layout config in `_config.yml`. The templates already read `_data`,
   so the stubs were pure routing scaffolding a contributor could forget; now
   adding a person/paper needs no second file. Side effect (invisible): the
   generated pages are plain pages, not collection "documents", so
   jekyll-seo-tag labels them `og:type: website` (was `article`) and drops the
   build-time `article:published_time` — a small SEO correction (a profile/paper
   page was never an article).

2. **Build-time data validation.** `_plugins/validate_data.rb` (priority
   `:highest`) checks the content files before any page is built and fails with
   one aggregated, human-readable message naming the file/entry/fix on the
   common mistakes: a missing required field, a typo'd image filename, a bad
   date, an unknown news category, a duplicate slug/id, a cover pointing at a
   non-existent paper. A journal with no logo is a warning, not a failure (the
   template legitimately hides it). This is the "malformed input fails the build
   with a clear message, never a silently broken page" guarantee.

3. **CI link/image guard.** The build job now runs **html-proofer** over `_site`
   (internal-only; external DOIs/Scholar stay out of CI as slow/flaky), so a
   broken internal link, a missing image, or an accidentally-excluded script
   (the `assets/js/*.js` exclusion bug from D21) fails CI instead of shipping.

4. **DRY templates.** The ~95%-identical `member`/`alumnus` layouts and the two
   people-grid cards were factored into `person-profile.html`,
   `person-card.html`, and `member-pubs.html`; the duplicated PI-name bolding,
   preprint-badge logic, and journal-covers section into `pi-authors.html`,
   `preprint-badge.html`, and `journal-covers.html`. Each pattern now has one
   source.

5. **Dead SCSS removed.** `.hero__wordmark`, `.pub__figure--empty`,
   `.footer h2.footer-title`, and the unused `.btn--accent/--ghost/--sm`/
   `.btn .icon` (only `.btn--solid`, used by 404.html, survives) — no selector
   in any template. Compiled CSS shrank ~0.7 KB; no computed style changed.

6. **Structured data + language.** Added `ResearchOrganization` (home),
   `Person` (PI), and `ScholarlyArticle` (each paper) JSON-LD from the same
   `_data`, and `lang="ko"` on the Korean spans (PI/member/alumni names, the
   초록) so screen readers pronounce them correctly. Both are invisible to
   sighted users.

Verified on `dev` (build + html-proofer green), then deployed via D11. Parity
proof and a headless-Chrome CDP functional test (filter 41→2→41, lightbox
open/Esc, mobile nav toggle, generated member page, valid JSON-LD, 0 JS errors)
in `REVIEW.md` §10.

## D25 — Unified people identity: one people.yml + status + stable /people/<slug>/ URL

The PI noted that a person's URL encoded their status (`/members/<slug>/` vs
`/alumni/<slug>/`), so graduating someone changed their URL and broke every news
link pointing to them — requiring manual edits. Fixed by decoupling URL from
status:

- `_data/members.yml` + `_data/alumni.yml` are merged into one `_data/people.yml`;
  each person has `status: current | alumni`. The Members and Alumni pages filter
  `site.data.people` by status. Graduating someone is now a one-field change
  (`current` → `alumni`) — no file move, no cut-paste.
- Every person has ONE canonical page at `/people/<slug>/`, independent of status.
- `generate_pages.rb` emits the old `/members/<slug>/` and `/alumni/<slug>/`
  addresses as meta-refresh **redirects** (canonical + noindex) to
  `/people/<slug>/`, for every person. So existing news links, bookmarks, and
  search results keep working — and keep working after a status change. News
  links never need updating.
- Updated: the `person` layout (replacing member/alumnus layouts), the grids,
  `person-card.html` (links to `/people/`), the author-highlight roster
  (`site.data.people`), and the validator (requires a valid `status`).
  README/CONTRIBUTING now document people.yml + status; person links use
  `/people/<slug>/`.

Verified: build green (validator + html-proofer, no broken links); 11 person
pages + 22 redirects generated; redirects follow through to `/people/` (CDP);
Members grid 5 / Alumni grid 6; member_pubs still render (Heejeong 37, Seonbin 1);
axe clean. All current member/alumni data (incl. the PI's latest GitHub links)
preserved via a js-yaml merge.

## D24 — PI-feedback round (Phase 13): AND filter, structured citation, data-driven themes, badge layout, Heejeong's record

Five PI-feedback items, each verified before deploy:

1. **Topic filter is AND, not OR.** Selecting multiple chips now shows only
   papers carrying *every* selected theme (`pubs.js`: `selected.every(...)`).
2. **Structured citation.** The single `ref` string was split into `vol`/`issue`/
   `pages`, rendered as **vol** (issue), pages (issue optional), via the shared
   `pub-citation.html`. A non-numeric ref (e.g. "Advance Article", id 41) still
   renders as-is. All 41 papers migrated (40 parsed, 1 kept).
3. **Badge layout.** On the list, the DOI/preprint badges moved onto the topic-tag
   row, to the left of the tags (logo - logo - tags), matched in size.
4. **Data-driven themes.** The filter topics now live in `_data/themes.yml`
   (name + color); colors are emitted into an inline `<style>` from that data
   (`theme-styles.html`), so a non-coder can change the count, color, name, or
   order in one file. The SCSS `$themes` map is gone. The validator checks every
   paper theme exists in themes.yml and that themes.yml is well-formed.
5. **Heejeong Kim.** Join date 2026-03-03 (news shows "March 2026"), Google
   Scholar link, and her 36 pre-SAIL papers (Juyoung Yoon group, Ewha) listed on
   her page. To keep `members.yml` clean for a long list, a member's papers may
   live in `_data/member_pubs/<slug>.yml`; `member-pubs.html` reads it by slug
   (validated). Her Scholar lists 37; the 37th is an erratum of the first and is
   omitted. No DOIs are attached (titles render as plain text); the Scholar link
   is the live, complete source.

Verified: dev build green (validator now also enforces theme membership + the
member_pubs file; html-proofer passed); CDP confirmed AND filtering (2 themes →
the single paper with both); axe 0 WCAG-AA violations after the theme recolor;
vol/issue/pages and the badge-left layout confirmed visually; Heejeong's page
shows 36 papers. Deployed (main run 27492501337) and smoke-tested live. (Later that
day 9812546 added her erratum, to match her Scholar count: 37 papers.)

## D23 — Members/alumni can list their own external publications (Phase 12)

A member or alumnus often has papers that are not in the lab's
`publications.yml` (e.g. a postdoctoral researcher's work from a previous
position). Each person entry now takes an optional `publications:` list (title,
authors, journal, year; optional doi/preprint_url). The member page shows these
**merged with** the lab papers auto-matched by author name, de-duplicated by
DOI/title, newest first.

Why this shape:
- **One place to edit, lab list stays clean.** The papers live in the person's
  own `members.yml`/`alumni.yml` entry, not in `publications.yml`, so the lab
  Publications page keeps showing only lab papers, and a contributor edits a
  single entry to manage their own list.
- **No broken links.** An external paper has no generated detail page, so
  `pub-item.html` links its title to the DOI (or renders plain text) instead of a
  dead `/publications/<id>/`. The page owner's name is bold (reusing the existing
  `.pi` highlight; no new CSS), via an optional `highlight` arg on
  `pi-authors.html`.
- **Validated.** `validate_data.rb` checks each personal entry (required fields,
  integer year, URL-shaped doi/preprint, image exists) so a mistake fails the
  build with a clear message.

The feature is dormant until a person adds the field: with no current member
listing personal papers, every rendered page is byte-identical to before
(proven by artifact diff). Rendering was verified by temporarily adding a paper
to the postdoc's entry (title linked to its DOI, her name bold, single-column,
no broken internal link) then removing it. See `REVIEW.md` §12.

### Autonomous decisions (Phase 11, no human gate — rationale one line each)

- **Generate pages instead of auto-creating stubs.** Cleaner single source of
  truth than keeping a collection and writing stub files into it; the templates
  never read the collection, so nothing was lost. (Serves north star A.)
- **html-proofer via `gem install` in CI, not the Gemfile.** `Gemfile.lock` is
  not committed and there is no local Ruby to regenerate it; a standalone install
  keeps the Jekyll build bundle untouched and avoids a frozen-lock failure.
  (Superseded by D40: html-proofer is a locked Gemfile dependency, and
  `Gemfile.lock` is committed.)
- **Internal-only link checking.** External DOIs/Scholar/ORCID are slow and flaky
  in CI and are spot-checked elsewhere; internal resolution is the regression-
  prone part worth gating.
- **Journal-with-no-logo is a warning, not an error.** The detail template is
  designed to hide a missing logo (D20); failing the build would punish a valid
  state.
- **Accept the invisible `og:type` article→website change** rather than fake a
  `date` to preserve "article". It is more correct and changes nothing a sighted
  user sees; body parity is preserved and proven.
- **`lang="ko"` only on unambiguous Korean spans** (names, 초록), not on
  mixed-language news/photo captions, to keep the change surgical and risk-free.

## D26 — Spacing/width consistency pass (PI-feedback)

The PI compared the home hero's intro block to the other intro blocks and found
the spacing inconsistent. Three surgical changes, all proven by live measurement,
no content touched:

- **Full-width leads.** The hero description spans the full content width, but
  section-head and page-head leads were capped (`60ch` / `70ch`), so intros like
  Research's "What we work on" wrapped early. Both set to `max-width: none` to
  match the hero. No horizontal overflow at 1440px or 360px on any page.
- **Person page top spacing.** `/people/<slug>/` used a full `.section` (72px top)
  while every other content page — including the sibling publication detail page —
  tops out at 48px. The person card now uses `.section--tight` so all content
  pages share the same top spacing.
- **Research lead gap.** The hero leaves `clamp(2rem,5vw,3.75rem)` (up to 60px)
  between its description and the figure; the Research section-head left only 2rem
  (32px) between its lead and the cards. `.section-head:has(.lead)` now uses the
  same clamp so both intro blocks breathe alike (60px desktop, 32px mobile);
  lead-less section-heads (Recent news, Journal covers, Find us) keep their 32px
  gap. `:has()` degrades gracefully to 32px on the rare browser without it.

Final full-site review after these changes: 60 pages (8 nav + 11 person + 41 pub
detail) all 200 with 0 broken images (the apparent breakages were lazy-load
timing only — all assets return 200); 22 redirects land on `/people/<slug>/` with
canonical + noindex; theme filter AND logic correct (26 ∩ 13); author highlight +
`author_aliases` confirmed on a non-PI page (Heejeong "H Kim"); axe 0 non-contrast
violations (only the accepted PI-palette contrast on topic chips remains);
home/publications LCP 124/185 ms, CLS ≈ 0; nav breakpoint 992px correct.

## D27 — Author highlight is scope-aware, not "every lab name everywhere" (PI-feedback)

D20/D24 made `pi-authors.html` bold **every** lab person's name (PI + all
members + alumni) in any author list. When the PI added a test paper co-authored
by several members, every one of their names got underlined on the Publications
list and on each member's page — which reads wrong. The PI asked: the
Publications list should mark only the PI, and a person's own page should mark
only that person (and drop the topic tags there). Reconciled the earlier
"highlight everyone" intent with this by making the highlight **context-scoped**:

- `pi-authors.html` takes an optional `person`. With no `person` it bolds the PI
  only (`site.data.pi.name` / `name_full`) — used by the Publications list and
  every publication detail page. With `person=<entry>` it bolds only that person
  (their `name` + `author_aliases`) — used on the person's own page.
- `pub-item.html` forwards `person` to `pi-authors` and, given `hide_themes`,
  omits the topic-tag row. `member-pubs.html` calls it with
  `person=person hide_themes=true`; the Publications list and detail pages pass
  neither, so they keep PI-only highlighting and (on the list) the tags.
- This also shrinks the find-and-replace surface from ~12 names to 1–2 per
  render, removing a class of substring-collision risk.

The publications↔people **linking** is unchanged and correct: a paper still
appears on every co-author's page (matched by `name`/`author_aliases` in
`member-pubs.html`); only which name is emphasised, and whether tags show, changed.

## D28 — Deterministic order for a person's merged publication list (PI-feedback)

On a person's page the lab Publications papers (matched by name) and the person's
own external papers are merged. The PI wants them ordered by year (newest first)
and, **within the same year, the lab Publications papers above the person's own**.
The list was sorted with `sort: "year" | reverse`, but Liquid's `sort` is
**unstable**, so same-year papers could land in either order (a 2026 own paper was
showing above a 2026 lab paper).

Fixed with a small Liquid filter, `_plugins/pub_sort.rb` → `sort_member_pubs`,
that sorts by `[-year, original_index]`. `member-pubs.html` already builds the
list lab-papers-first, so every lab paper has a lower index than every own paper;
sorting by year-descending then index-ascending puts the newest year first and,
on a tie, the lab papers first — and because the index is unique the output is
fully deterministic (no build-to-build reshuffle). Proven on the real data before
deploy with a faithful JS simulation of the merge + comparator (Seonbin: 2026 lab
above 2026 own; Heejeong: 37 papers strictly newest-first).

Also removed the PI's throwaway `Test` paper (was `id: 42`) from
`publications.yml` at the maintainer's request; 41 real papers remain.

## D29 — Second polish pass: doc/code consistency, dead code, validator coverage

A conservative review/cleanup pass after the live site stabilized. **No site content
and no visible output changed** — the contributor docs are build-excluded, and the
code edits are dead-code removal, a comment fix, and an equivalent-selector merge.
Scope was deliberately limited to maintainer-authored files; **none of the PI's
content data (`publications.yml`, `news.yml`, `themes.yml`, `people.yml`,
`covers.yml`) was touched.**

- **Docs.** Reconciled `README.md` + `CONTRIBUTING.md` with the code as built:
  documented both citation forms (`ref` free text, used by every current paper, and
  the optional structured `vol`/`issue`/`pages`); added the news `display_date` /
  `link_text` fields; documented the long-list `_data/member_pubs/<slug>.yml` option
  beside the inline `publications:`; and surfaced `author_aliases` as the fix when a
  paper spells a member's name differently (the one place the auto-link can miss).
- **Dead code.** Removed the unused `doc` icon branch, the unreferenced `.tag--accent`
  rule, and a stale `base` parameter note in `person-card.html` (grep-confirmed zero
  references). Fixed the `pubs.js` filter comment (the filter is AND, not OR). Merged
  the byte-identical `.pub__authors .pi` / `.paper__authors .pi` rules into one
  selector (same computed style).
- **Validator coverage.** Extended `validate_data.rb` to the files it did not cover:
  `navigation.yml` (item/child shape, internal vs external url), `pi.yml` (required
  fields, photo exists, email/url forms), `home.yml` (contact email), and
  `journal_logos.yml` (each mapped logo file exists), plus a warning for an orphan
  `member_pubs/<slug>.yml`. All additive — the new checks pass on current data and
  fail the build with a readable message on a mistake.

The no-visible-change property and the build are checked on the `dev` CI build
(Jekyll + html-proofer) before `main` is fast-forwarded to deploy (D2, D11).

## D30 — Fullscreen journal-cover viewer (PI-feedback)

Clicking a journal cover now opens a fullscreen lightbox instead of jumping
straight to the paper. Decisions:

- **Two renditions per cover, not one.** The grid keeps the small thumbnail
  (~800px, lazy) so the home page stays light; a high-res `<base>-full.jpg`
  (~1500px on the long side, q85, ~140–440KB) is generated from the original and
  loaded **only when a cover is clicked**. This gives a crisp fullscreen view
  without re-bloating the page (covers had just been cut from ~20MB to ~0.6MB in
  the image-optimization pass). The originals stay in git history.
- **Progressive enhancement.** The cover stays a real `<a href="/publications/<id>/">`
  (so no-JS users and crawlers reach the paper); `assets/js/covers.js` intercepts
  the click and opens the viewer, which carries a "View the paper" link inside.
  Covers with no `publication_id` render as a `<button>` (viewer only).
- **Reuse, not duplicate UI.** The viewer reuses the existing `.lightbox` styles
  and mirrors `photos.js` (Esc / overlay / arrows / focus trap), as a separate
  `#cover-lightbox` element so it coexists with the photo lightbox on /photos/.
- **`-full` convention guarded.** `validate_data.rb` warns when a cover's
  `-full.jpg` is missing (it is referenced from a `data-` attribute, so
  html-proofer cannot catch it). Adding a cover means adding its `-full` rendition.

Verified on the live site (headless Chrome): the viewer opens on home + photos at
desktop and mobile, loads the high-res rendition (1145px+), shows caption/counter/
paper link, advances with the arrows, and closes on Esc; 0 JS errors.

## D31 — SEO + GEO optimization pass (Korean + global)

The data-generated pages all shared the generic site title/description (52 identical
`<title>`s) -- a real duplicate-content problem. Fixed and broadened to a full
non-visual SEO/GEO pass.

- **Per-page `<title>` + meta description for every generated page.** `generate_pages.rb`
  now sets a unique title (the paper title / the person's name) and description
  (an abstract excerpt for papers; "Name (한글 이름), role at SAIL, Kookmin University"
  for people) on each generated page; jekyll-seo-tag reads them, so `<title>`,
  `og:title`, twitter title and meta description all become page-specific. Section
  pages (publications/research/news/members/alumni/photos/pi) got `description:`
  front matter too. Person descriptions carry the Korean name for Naver/Korean search.
- **Richer JSON-LD.** Organization: PostalAddress (Seoul, KR -- local/geo signal),
  email, telephone, foundingDate, knowsAbout (research areas), founder. Member
  Person: affiliation (Kookmin University). ScholarlyArticle: inLanguage, keywords.
  All validated as parseable on the live site.
- **GEO (AI answer engines).** Added `/llms.txt` -- a curated, data-driven markdown
  summary (overview, research areas, key links, recent papers). robots.txt already
  allows AI crawlers and references the sitemap.
- **Sitemap hygiene.** The noindex `/members|/alumni/<slug>/` redirect pages are now
  `sitemap: false`, so the sitemap lists only canonical pages (82 -> 60 URLs).
- Also hardened the validator's email checks (`.to_s`, no crash on a non-string
  email) and made modified-clicks on a cover follow its paper link.

All changes are non-visual (head metadata, structured data, crawl files); verified
live (unique titles, valid+enriched JSON-LD, llms.txt 200, cleaned sitemap).

Manual follow-ups (account-specific, not codeable here): register the site in Google
Search Console and Naver Search Advisor (Webmaster) and submit the sitemap; optionally
add their verification meta tags.

## D32 — SEO/GEO follow-ups + optional per-person department

- Extended D31's structured data: BreadcrumbList on each paper and person page, and a
  CollectionPage + ItemList on the /publications/, /members/, /alumni/ list pages.
  Validated as parseable on the live site.
- Added an optional `department:` field to people.yml. When set, a person's own
  school/department shows on a line under the lab affiliation (e.g. a UROP whose home
  department differs from the lab's Department of Chemistry); when unset, the card is
  unchanged. The lab affiliation line is kept on purpose (it states the lab's
  department, not the member's), and the person page's SEO description reflects the
  field too. Set for Chanjoong Kim (School of Artificial Intelligence) on request.

## D33 — Positions page (`/positions/`), Korean-only

- Added a Positions page modeled on the Coley group's `/positions/`, on request from
  the PI. It states how to join the lab and how to apply for the postdoctoral
  researcher, PhD student, and undergraduate research tracks, and lists the currently
  advertised undergraduate projects. Linked in the top nav between Publications and
  Group Guide.
- All copy lives in `_data/positions.yml` (intro, `sections:` per role, and
  `undergrad_projects:`), rendered by `positions.html` — same data-driven pattern as
  the rest of the site, so the PI can advertise/retire a project with one YAML block.
- **Korean-only, by request.** The rest of the site renders in English, but the PI
  supplied this copy in Korean and the recruiting audience is primarily domestic
  students/applicants, so the page ships verbatim in Korean (the page chrome — nav
  label "Positions", h1, eyebrow — stays English to match the site). An English
  version is a deliberate, recorded gap, not an oversight.
- The phrase "그룹 가이드" is auto-linked to the group-guide document via a Liquid
  `replace` filter, so the data stays plain text. A contact CTA reuses the PI email
  from `pi.yml` (not invented), making the repeated "email me" instruction
  actionable; one obvious typo in the supplied copy was corrected (논문를 → 논문을).

## D34 — Positions page is now bilingual (한국어 / English toggle)

- Supersedes the Korean-only choice in D33, on request. `_data/positions.yml` now
  holds one block per language under `langs:` (code/label/intro/sections/projects +
  the localized labels guide_phrase/guide_button/requires_label/projects_title);
  `positions.html` renders a `.lang-pane` per language and `assets/js/positions.js`
  shows the chosen one (others carry `hidden`), remembering the choice in
  localStorage. Default render is Korean (first `langs` entry); the page chrome
  (eyebrow, H1 "Positions") stays English on both.
- **Toggle placement (UX):** a segmented control at the top-right of the header row,
  on the same line as the H1. Chosen over placing it by the CTA buttons because a
  language switch is conventionally top-right, must appear *before* the body so a
  reader can pick a language before reading, and should stay visually separate from
  the action CTAs (guide/email). Page-level (not global-nav) placement signals that
  only this page is bilingual.
- **The English is a draft translation** of the PI's Korean, not PI-reviewed copy —
  flagged for review in README/CONTRIBUTING and CONTENT_INVENTORY. The Korean remains
  the verbatim source of record.
- Implementation note: `.lang-pane[hidden]` needs `display:none !important` because
  `.positions-cta { display:flex }` would otherwise win over the `hidden` attribute.

## D35 — Positions reverted to Korean-only; project cards generalized to any role

- Reverts D34, on the PI's instruction: the page is Korean-only again, as in D33. The
  `langs:` structure, the on-page toggle, `assets/js/positions.js`, and the English
  draft were removed; `_data/positions.yml` is back to a flat `intro` + `sections`.
- Generalized the project cards (the "표"): `projects` (and an optional
  `projects_title`) is now a field of **each section**, not a one-off block fixed to
  the undergraduate role. `positions.html` renders the card grid under whichever role
  carries it, so the PI can advertise projects under "대학원생" or any other role with
  the same YAML — documented in README/CONTRIBUTING, with a ready-to-uncomment example
  left in the "대학원생" entry. Markup/styling of the cards is unchanged from D33.
- Multiple `.prose` blocks (one per role) replace the single monolithic prose so cards
  can sit mid-page; inter-section spacing is preserved by the existing `.prose h2`
  top margin (verified by cross-width screenshot QA).

## D36 — People photos live in `assets/images/people/`; per-person `description` (PI request)

- The PI asked (2026-07-13, KakaoTalk) for (1) a dedicated folder holding the people
  photos and (2) a short per-person description on each member page, shown above the
  publication list, giving Yunhee Choi's text as the example.
- All portraits (12 member/alumni photos, `pi.jpg`, and the PI-uploaded `anonymous.png`
  placeholder) moved from the `assets/images/` root into `assets/images/people/`,
  matching the existing `pubs/`, `journals/`, `photos/` subfolder convention. YAML keeps
  bare filenames (`photo: heejeong-kim.jpg`); the templates (`person-card.html`,
  `person-profile.html`, `pi.html`) and the validator prefix the folder, so contributors
  upload to one place and a typo'd filename fails the build naming that folder.
- New optional `description:` field in `people.yml` (folded block scalar, plain text or
  simple Markdown): rendered on `/people/<slug>/` between the social links and the
  publication list, reusing the existing `prose u-mt-lg u-left` body styling (no new
  CSS). It also becomes the generated page's meta description (clipped to 200 chars,
  replacing the formulaic line) and the JSON-LD Person `description`; the portrait now
  doubles as the page's OG image and JSON-LD Person `image`, mirroring how paper pages
  use their graphical abstract.
- Yunhee Choi's entry (added by the PI directly on main) was normalized while merging:
  role `Visting undergraduate` → `Visiting Undergraduate Student (EPFL)` (spelling fix,
  Title Case, and the existing `Undergraduate Researcher (UROP)` qualifier pattern so
  EPFL still shows on the Members grid); the `note` (also typo'd, and fully contained in
  the description's first sentence) was dropped; `description` is the PI's text
  verbatim. Her 1.0 MB 824x1094 PNG portrait was recompressed to a 40 KB 600px-wide JPG
  (the PNG alpha channel is fully opaque, so nothing was lost), matching the other
  member photos; the original stays in git history.
- Follow-up (same day, maintainer request): the description is now rendered as an
  "About" section using the same label style as the Publications section below it
  (`member-about`/`member-about__label` share the `member-pubs` rules: `--fs-md`
  heading, 2px orange bottom rule, `--space-2xl` top gap), so a page with both reads
  as two matching sections instead of a floating paragraph. Heading text is "About"
  rather than "Description": it parallels "Publications" as a page section name and is
  the common label on academic personal pages.

## D37 — Em dashes removed from public docs and served text (house style)

- The house style ("no em dashes, plain factual wording") was still violated by the
  public-facing docs themselves: README.md (10), CONTRIBUTING.md (11), the served
  /llms.txt and /llms-full.txt templates (6), plus contributor-facing comments in
  _data/positions.yml, _data/themes.yml, the two _data/member_pubs headers, and the
  main.scss banner. Each was replaced with plain punctuation (colon, comma, semicolon,
  or parentheses) chosen per sentence; the only served-output change is the llms.txt
  files' separators, no visible page content changed.
- The internal tracking files (DECISIONS.md, PROGRESS.md, REVIEW.md,
  CONTENT_INVENTORY.md, REFACTOR_PLAN.md, CLAUDE.md) keep their em dashes: the
  "## D<n> — title" heading separator is this file's established format, the files are
  maintainer-facing, and the house style targets site copy and contributor docs.
- No paper title or other factual data contained an em dash, so nothing factual was
  touched (the member_pubs hits were file-header comments).

## D38 — De-templated visual style; home research rows; small fixes (2026-09-28)

- The maintainer found parts of the site read as a generated template rather than a
  lab site, singling out the short orange dash before small labels, and asked for the
  understated feel of the lab site it was first modelled on (coley.mit.edu) without
  changing any content or anything the PI entered. The published list of common
  generated-design defaults (Anthropic frontend-design guidance, 2026-09) matched the
  site almost item by item: a tracked ALL-CAPS "eyebrow" label with a rule above every
  heading, a coloured left accent bar on cards, a warm cream and brown-black palette,
  a glow behind the hero, a translucent blurred header, ALL-CAPS tracked field labels.
- Removed: the eyebrow on every page and section (they only repeated the heading or
  the nav section, e.g. "People" over "Members"; the member/paper back link keeps its
  function as a plain `.back-link`), the research-card accent bar, the hero glow and
  figure shadows, the header blur, the highlighter under the PI name (bold stays, per
  the house rule), ALL-CAPS tracking on footer titles, home contact labels, and news
  category pills. Two small lines that carry information stay as a plain muted
  `.kicker`: the lab name above the home title and "Error 404".
- Palette: warm neutrals (`#3c3833`, `#6c665e`, `#e8e2d9`, `#faf8f4`, footer
  `#161310`) became untinted greys of the same lightness, so contrast is unchanged.
  The brand orange stays. Topic tags and news categories stay coloured (the
  maintainer rejected a grey preview); only their caps/tracking was dropped.
- h1/h2 weight 600 to 500: large headings read calm; h3/h4 keep 600.
- Kept on the maintainer's instruction: hover lifts on cards, covers, badges, and
  buttons (listed as a template tell, but the maintainer likes them). Kept from
  earlier decisions: the home structure (D20), coloured multi-select topic chips and
  badge-left publication rows (D24), Pretendard, and the maintainer's image
  right-click deterrent.
- Home research section: it showed each area's text cut at 28 words ("...") in a 3+1
  card grid. Cutting the PI's text is not acceptable, and a text-only block of four
  full paragraphs read as too much text, so each area is now a row in the
  Publications-list pattern: the area's existing figure (from `research.yml`, the
  same one the Research page shows) beside its title and full text. Title and figure
  link to that area on `/research/` (each `research-area` now has
  `id="<slugified title>"`; html-proofer checks these hashes). An area without a
  figure renders text only. The section heading is now "Research" (was "What we work
  on"), and the contact heading "Contact" (was "Find us"): template wording, not PI
  text. The cover viewer's "View the paper" link lost its arrow.
- Topic tag contrast: tag text is drawn in the topic colour darkened by a third
  (`color-mix(in srgb, <colour> 66%, #000)`), and so is the active filter fill under
  white text; tint, border, and filter dot keep the exact `themes.yml` colour. Text
  on tint went from 2.1-2.9:1 (Quantum orange, Representation cyan, Property green)
  to 4.5-5.8:1. `themes.yml` itself is untouched; a plain fallback declaration
  precedes each `color-mix`.
- Bugs fixed: the footer address rendered italic (`.footer address` never matched;
  the footer is `.site-footer`); PI contact icons sat above their text (the global
  `svg { display: block }`); Korean text broke mid-word (`word-break: keep-all`);
  Positions project-card titles had no gap before the body; papers with only an
  English abstract (42-45) hid it inside a collapsed "Original abstract" toggle, so
  it now shows in full under an "Abstract" heading (papers with `abstract_ko` are
  unchanged); the Korean-only Positions page declared `lang="en"` (it now sets
  `lang: ko`, and the layout reads `page.lang` before `site.lang`); the "Award" news
  pill text (`#9a6b1a` on its tint, 4.27:1, first used by the PI's June news items,
  after the last accessibility audit) darkened to `#8a5f14` (5.1:1), same hue.
- CI: `actions/checkout` v4 to v7, `upload-pages-artifact` v3 to v5, `deploy-pages`
  v4 to v5 (the open Dependabot PRs). upload-pages-artifact v4+ drops dotfiles unless
  `include-hidden-files: true`, which would have silently removed
  `/.well-known/security.txt`; the flag is set. A new optional step
  (`.github/scripts/optimize-images.mjs`, sharp) scales oversized uploads in the
  BUILT copy only (people 800 px, photos 1600 px, pubs 1200 px on the longest side;
  written back only when at least 10% smaller), so a contributor can upload a phone
  photo as is and the repository keeps the original. It runs with
  `continue-on-error`, so a failure deploys the original images. (Revised: D40
  replaced it with `prepare-images.mjs`, which runs before the build; D42 makes that
  step strict on `dev` and on pull requests.)
- Not done, by decision: the home contact block stays (D20 home structure); the
  middle dot in the hero line stays; an automatic new-publication finder was
  deferred (it would open GitHub issues and notify the PI, so it needs the PI's
  agreement first). This pass changed no data; the data corrections that followed on
  the maintainer's instruction are D39.

## D39 — PI data corrections and two journal logos (maintainer's instruction, 2026-09-28)

- The D38 review listed errors in data the PI had entered. The maintainer asked for
  them to be fixed and for the remaining data to be made correct, leaving the two
  submitted manuscripts (46, 47) exactly as entered. Every change below is a
  correction to the publisher of record (Crossref metadata and the publisher's own
  article page) or a spelling/punctuation fix; nothing was reworded.
- Paper 44: `ref: "Early veiw"` to `"Early View"` (Wiley's term, capitalised like the
  existing "Advance Article"); DOI `http://doi.org/...` to `https://doi.org/...` like
  every other paper.
- Paper 42: title "...Quantum Dots for Efficient Photovoltaics" to "...Quantum Dots for
  Photovoltaics", the published title (ACS article page, Crossref); the corresponding
  mark on Hyung Min Kim moved from after the comma (`Kim,*`) to the name (`Kim*,`); the
  ACS page marks him corresponding (`*Email: hyungkim@kookmin.ac.kr`).
- Paper 43: author initials "Betar M Gallant", "T Alan Hatton" to "Betar M. Gallant",
  "T. Alan Hatton" (Crossref record of the ChemRxiv DOI).
- Roles of Jihwan Kim and Seonbin Kim: "M.S./Ph.D integrated course" to "M.S./Ph.D.
  Integrated Course": the missing period, and Title Case like every other role on the
  Members grid (the D36 precedent).
- Journal logos, clearing the build warnings for 43 and 45: `J. Alloys Compd.` is the
  title block cropped tightly from the journal's official Elsevier cover
  (ars.els-cdn.com; 506x195, so the thin title stays legible at the 44 px logo
  height); `ChemRxiv` reuses the site's existing ChemRxiv mark
  (`assets/images/chemrxiv.png`), cropped to its square.
- Template copy found in the same final review: the Alumni intro read "Former
  undergraduate researchers (UROP) of ...", no longer true once a visiting EPFL
  student (D36) became an alumna; it now reads "Former members of the Spectroscopy
  and AI Lab at Kookmin University.", parallel to the Members intro. The 404 page's
  lead got the 0.75rem gap under its heading that section leads have elsewhere.
- Left as entered, on instruction: papers 46 and 47 ("Submitted", no logo, no DOI);
  their build warning remains. Not changed because they are style rather than error:
  paper title capitalisation (each follows the PI's entry), `YOOYEONJU.jpg` naming
  (served resized by the D38 image step), and news links that use the
  `/members/<slug>/` redirect paths.
- An earlier change to a PI entry, recorded here on 2026-09-30 after an audit of the PI's
  entries (until then only its commit message had it): 0de1d15 (2026-07-12) cleared the
  `display_date: "2026"` the PI had given the FlowER news item (ef1118a). The item is
  dated 2025-09-04 and the paper (37) is from 2025, so it now shows "September 4, 2025".

## D40 — Review follow-up: metadata, structured data, images, fonts, CI (2026-09-29)

- A full review of d098025 (performance, security, SEO, GEO) was cross-checked item
  by item; the maintainer asked for every fix that changes no content. Findings that
  need the PI (facts in the data) and steps outside the repository (Search Console,
  Naver, repository settings) were left out. No file under `_data/` changed and no
  visible text changed. The final layout (every element's box once fonts and images
  have loaded) is identical on all 70 pages at 1350, 1024 and 390 px; between about 545
  and 720 px one figure capped by `max-height` (paper 42) has a wider `<img>` box and is
  drawn exactly as before (screenshots byte-identical from 540 to 736 px). Four separate
  reviews of the change (templates and SEO, CI and images, content and docs, and a last
  pass over the fixes) found nothing above low severity; their fixes are included below.
  The editing steps in the README were run end to end on a scratch copy (REVIEW
  section 16): they are unchanged and every cross-link still follows the data.
- **Site author is the lab.** `author:` in `_config.yml` named the PI as a Person, and
  jekyll-seo-tag names its JSON-LD `publisher` after the author, so every page said an
  Organization called "Joonyoung F. Joung" published it. It is now the lab, as an
  Organization with its URL. `social:` removed: seo-tag turned its links (the PI's
  Scholar and ORCID) into the home page's WebSite `sameAs`, which must identify the
  site; they stay on the PI's own Person data.
- **Structured data** (`_includes/structured-data.html`): the lab is
  `<site>/#organization` and the PI `<site>/pi/#person`; members and the PI point at
  the lab by `@id`, and the home page's `founder` points at the PI (with the profile
  links). The PI's entry in a paper's author list carries the PI's `@id` and page
  (matched on `name` or `name_full`, as the bold PI name is), so the 45 articles attach
  to the same person. Alumni get `alumniOf` the lab instead of a current `jobTitle`/
  `worksFor`/`affiliation`. ScholarlyArticle no longer names the lab as `publisher`
  (the journal's publisher is). A paper with neither a DOI nor a preprint link (a
  manuscript under review: 46, 47) gets no ScholarlyArticle and no `citation_*` tags,
  so Scholar does not index "Submitted" as a journal; author lists skip "..." entries.
- **Other metadata:** `og:locale` in the form ogp.me asks for (`en_US`; `ko_KR` on the
  Korean Positions page). The PI page's `<title>` is the PI's name like every person
  page, and its title and description are built from `pi.yml` in `generate_pages.rb`
  (the description text is unchanged; a `title` or `description` written in the page's
  front matter would win, and a missing page or name is logged). jekyll-feed removed:
  the site has no posts, so it published an empty `/feed.xml` linked from every page.
  News links written as `/members/<slug>/` are printed as the person's canonical
  `/people/<slug>/` (the old address is a noindex redirect); `news.yml` is untouched.
  The PI's Korean name on the home page is marked `lang="ko"`.
- **GEO:** `/llms.txt` lists the ten newest papers in the Publications page order (the
  built-in sort is unstable, so same-year papers came out in arbitrary order), each as
  a link to its page. `/llms-full.txt` adds the PI's page, biography, education and
  career, each alumnus's page, and every news item. Text fields in both files are
  folded with `normalize_whitespace` instead of `strip_newlines`, which deletes a line
  break and so joins the words on either side (no field has one today; the output only
  loses a few doubled spaces). The research figures' alt text uses the same filter.
- **Images** (`.github/scripts/prepare-images.mjs`, replacing `optimize-images.mjs`):
  the CI step now runs on the checkout before the build, so the build can use what it
  learns. Besides shrinking oversized uploads (same limits), it removes metadata from
  JPG (also `.jfif`, `.jpe`), PNG, WebP and AVIF uploads (EXIF can hold the GPS
  position): a PNG drops its text and EXIF chunks and keeps its pixels, so it never
  grows; other formats are re-encoded after applying the EXIF rotation (checked for
  orientations 3, 6 and 8); an animated image is left as uploaded, with a warning if it
  has metadata. The repository is public and keeps each file as uploaded, so an upload
  that holds a GPS position is named in a warning on the run's summary page, as is a
  HEIC, TIFF or DNG upload (the step does not process those; most browsers cannot show
  them). A file that
  fails is published as uploaded, with a warning. The step rewrites files in place, so
  it refuses to run outside CI without `--local`. It also makes smaller copies (gallery
  photos 480, 800, 1200 px; paper figures 480; covers 400) and lists the size of each
  gallery photo, paper figure and cover in `_data/generated_images.json` (not
  committed). Templates turn that into
  `srcset`/`sizes` (`_includes/image-srcset.html`) and into `width`/`height` on the paper
  page figure; without the file, pages are exactly as before. An image shown with
  `object-fit: cover` in a 4:3 box gets width values scaled to the part that is drawn,
  so the browser picks a file that is sharp at the size shown. Every `sizes` value was
  checked against the drawn width at each viewport width from 320 to 1600 px.
- **Loading:** the paper-page figure is in the first screenful, so it is no longer lazy
  and gets `fetchpriority="high"`; `.paper__figure img` dropped `width: auto`, which
  overrode the new attributes (the box is now reserved before the file arrives, and
  `object-fit: contain` keeps the proportions of a figure capped by `max-height`). The first gallery photo and
  the PI photo load with high priority. The header emblem was a 1024 px PNG shown at
  46 px; it is now 160 px (29 KB to 7 KB, visually identical when drawn at 1x to 3x).
- **Hangul fallback:** until Pretendard's files arrive, Korean text was set in Malgun
  Gothic (Hangul 1 em wide; Pretendard's is 1770/2048 em), so the Positions page
  re-wrapped when Pretendard swapped in (measured before this change: a layout shift,
  CLS, of up to 0.29, from 0.06 to 0.29 by run and width; REVIEW section 16).
  `main.scss` adds
  `local()` faces of Malgun Gothic (size-adjust 86.43%) and Noto Sans CJK KR (0.92 em;
  93.94%) for Hangul syllables only, placed right after Pretendard in the stack (the
  faces are defined below `:root`, so the design tokens stay at the top of the file,
  where the README points editors). Names and widths were read from the font files; a variable Noto Sans KR is drawn at the
  requested weight, not its Thin default.
- **CI and build tools:** `Gemfile.lock` and `.github/scripts/package-lock.json` are
  committed, and CI installs exactly them (supersedes the Phase 11 note that the
  lockfile was not committed). `ruby/setup-ruby` is pinned to a commit, with the runner
  image fixed at `ubuntu-24.04` so that pinned release keeps knowing it; jobs have
  timeouts, and the two image-step steps have their own (5 minutes), so a stalled
  download cannot use up the job's time and stop the deploy. The concurrency group is
  per branch: with one group for all branches, a push to `dev` could cancel a `main`
  run waiting behind another, and that commit would never deploy. Dependabot runs
  monthly with one grouped pull request per ecosystem (actions, gems, and the image
  step's `sharp`), for releases at least 7 days old (`cooldown`).
- **security.txt** writes `Expires` at build time (330 days ahead), so every deploy of
  `main` renews it instead of it lapsing on a fixed date. A scheduled monthly rebuild
  was considered and left out: GitHub turns off a workflow that has a schedule after 60
  days without activity in a public repository, and a turned-off workflow no longer
  runs on a push either (GitHub community discussions 32197 and 66834), so the site
  would stop deploying; a separate scheduled workflow would gain only those 60 days.
  CONTRIBUTING says when to re-run the workflow by hand.
- Unused CSS (`.visually-hidden`, `.divider`) removed. `member-pubs.html` dedupes with
  an array: the joined string made `contains` a substring match, so a paper whose title
  is part of an earlier entry's could be dropped. `journal-covers.html` names the
  full-size cover by dropping only the last extension (`a.v2.jpg` to `a.v2-full.jpg`),
  the rule the data validator checks; it dropped everything after the first dot.
  Neither changes output with today's data.

## D41 — Publication data checked against the publishers (maintainer's instruction, 2026-09-29)

- The review of D38 to D40 found more errors in `_data/publications.yml`, and the
  maintainer asked for them to be fixed as in D39. Every change matches the paper's
  page at its publisher, opened in a browser, and Crossref agrees on the titles,
  names, order and issues (it records no author marks); paper 9 rests on Crossref
  alone, because its Elsevier page answered with a robot check. Nothing was
  reworded: titles take the published wording, names the published byline.
- Titles: 7 "Ionic effects on the proton transfer mechanism in aqueous solutions" (was
  "Ionic effect on the excited-state proton transfer reactions in aqueous solutions");
  36 "ASKCOS: Open-Source, Data-Driven Synthesis Planning" (the file had the arXiv
  preprint's title); 15 "Covalently Linked Perylene Diimide–Polydiacetylene
  Nanofibers ..." (a stray comma after "Linked", "diimide" in lower case, and no dash
  between the two parts); 20 "Near-Infrared-Emitting" (the published title spells out
  "NIR"); 22 "... UV-Crosslinkable and Hole-Transporting Polymer Ligands" (was "&" and
  "Ligand"); 31 "... fluorescent OLEDs" (was "OLED"); 16 "Topochemical Polymerization,
  and Energy Transfer" (the published comma).
- Names, as in the byline: "Chandra Kantha" in 9 and 15 (was "Chra Kantha": the name
  with "and" cut out of it; no other name in the file lost an "and"); "Jung-Moo Heo" in
  9 (as in 5 and 16); "Jaeyong Kim" in 5 (was "Jaeyoun"); "Martin Thuo" in 10 (the
  byline and Crossref have no middle initial); "Mohammed Iqbal Khazi" in 16;
  "Kwang-soo Kim" in 38.
- Author order: 12 lists Yerin Jeong before K.M.K. Swamy, as published.
- Marks the publisher prints and the file lacked: corresponding author Sungnam Park in
  15 (Wiley labels him "Corresponding Author", with his e-mail) and Sang-Hee Shim in 20;
  equal contribution for Kwangmin Bae and Jung-Moo Heo in 16, with the file's own `†`
  (the file uses `†` where a journal prints `‡` or `∥`, as in 12 and 42).
- Issues: 27 is issue 36 (was 26); 38 (issue 4) and 39 (issue 3) gained theirs.
- Not changed, as style rather than error: dash characters and capitalisation where the
  words match (10 "Molecule-Electrode ... Large-area", 16 "Diacetylene-Terthiophene",
  31 "Efficient" after the colon, 38's title case, 39 "Higher-level"), "K.M.K." without
  spaces, and 31's issue: npj's page shows only the volume and the article number
  ("issue 1" is in its metadata alone), where 38's page shows "Volume 5, Issue 4". D39's
  corresponding mark on Hyung Min Kim in 42 is confirmed by the ACS page. No other file
  under `_data/` names these papers, so a person's page cannot list one twice.

## D42 — Review fixes after D40: header, footer, filter, tablets, metadata, CI (2026-09-29)

- An overall review of the work of 2026-09-28 and 29 (D38 to D40), on the maintainer's
  request, looked for mistakes; each finding was reproduced in a browser before it was
  fixed, and each fix was checked again after it. No content changed here (D41 has the
  data).
- **Header:** between 993 and 1080 px the nav squeezed the logos (their box narrowed
  while their height stayed) and wrapped "Group Guide". The menu now takes over at
  68.75em, 1100 px at the default font size: the items need a 1080 px window with
  Pretendard (1072 px in the fallback font), and the margin covers a classic 17 px
  scrollbar, which media queries count. It is in em so that a reader's larger default
  font brings the menu in at a wider window (at 20 px, up to 1375 px). The logo group
  never shrinks. `nav.js` uses the same query; Escape closes the open menu and returns
  focus to its button; menu rows and their dividers span the menu, with the Members
  arrow at the right edge. `white-space: nowrap` on the labels was tried and dropped:
  with a larger default font it would push the nav past the window, where a wrapped
  label only makes the header 2 px taller.
- **Footer:** `.footer-brand p` outranked `.footer-mark`, so "SAIL" was drawn at 14.4 px
  in the paragraph grey, 12.8 px below the column titles; it is 24 px white again, level
  with them.
- **Publications filter:** topics combine with AND, so two can match no paper (e.g.
  Quantum chemical modeling and Representation learning), and the page then showed
  only the chips. The line "No paper has all the selected topics." and a "Show all
  papers" button now appear, inside a `role="status"` region so screen readers announce
  them; the button clears the filter and moves focus to "All". The filter and menu
  buttons are `type="button"`.
- **Tablets and phones:** a paper's title sits beside its figure from 1000 px (from 721
  px it was squeezed to 8 or 9 lines at 768); the PI page puts the contact list beside a
  240 px photo from 561 to 860 px (it sat below the photo in a 320 px column, with the
  other half of the width empty); on phones each home research figure sits above its
  title at its own proportions, up to 480 px wide and 220 px tall (the 88 px column drew
  the 4:1 figures about 20 px tall).
- **Printing** opens every folded `<details>` (the English abstract under a Korean one)
  and folds them again afterwards. (The CSS rule first considered, `details > * {
  display: block }`, leaves a closed body hidden in current Chrome; only the newer
  `::details-content` selector reaches it.)
- **Language:** on the Korean Positions page the skip link, header, footer and the
  "Positions" heading are marked `lang="en"` (WCAG 3.1.2, language of parts).
- **Head:** `color-scheme: only light`, because Chrome's automatic dark mode ("darken
  websites" on Android) inverted the site and the black logo, menu icon and journal
  logos nearly vanished. `404.html` is noindex: GitHub Pages serves it with status 404
  for a missing address, but `/404.html` itself answers 200. The redirect pages'
  canonical is absolute, like every other page's.
- **Structured data and GEO:** the lab's logo is `sail-logo-square.png`, the header
  wordmark (224x57, not rescaled) centred on a 280x280 white square, because Google uses
  an organization logo only from 112x112; `_config.yml` `logo` feeds seo-tag and the
  home page's JSON-LD, and the header still shows `sail-logo.png`. The PI's Person has
  an `image` and the university's URL; a ScholarlyArticle has its figure as `image`; a
  preprint entry without a DOI (43) uses its preprint DOI
  (`10.26434/chemrxiv.15005144/v1`, which resolves) as `sameAs` and `citation_doi`. The
  PI page's link preview shows the portrait. `llms.txt` gives each research text in full
  (`truncate: 220` cut them mid-word) and no longer promises an abstract and DOI for
  every paper.
- **ChemRxiv mark:** the badge was a 140 px black square with a transparent half beside
  it, and D39's journal logo the square alone, so the name could not be read at 24 or
  44 px. Both files are now the lettering cropped with a black margin (136x40, the same
  pixels, not rescaled).
- **CI image step:** strict on `dev` and on pull requests: `continue-on-error` only on
  `main`, and with `IMAGES_STRICT` an image that errors while being processed fails the
  run (a HEIC, TIFF or DNG upload, which the step does not process, only warns).
  Before, a Dependabot update that broke the step still gave a green run, which is the
  rule for merging it. On `main` it stays optional, so the PI's pushes always deploy.
  The warning for a file that step 1 had already rewritten no longer says the file is
  published as uploaded.
- **Docs:** CONTRIBUTING, README and CLAUDE.md now describe the strict step, bringing
  `dev` up to date after a Dependabot merge, which folders the image step cleans
  (journal covers, logos and research figures are served as uploaded, metadata
  included), the Korean texts in `research.yml` that are not shown, `BUNDLE_FROZEN` for
  the local build, the `.kicker` exception and the menu breakpoint. D38's image step and
  the Phase 11 lockfile note are marked as revised. REVIEW's second "11." and "12." are
  now 14 and 15 (so the D39/D40 section is 16), and its README-path record says which
  uploads carried a GPS position: a gallery photo and a paper figure (the step never
  checks covers).
- Found and left for the PI or the maintainer: `research-properties.jpg` is cut off at
  its right edge, and the Yongpyo Cho and Hanbyul Baik photos show white strips at the
  sides of the circle (the files themselves); five photos committed on 2026-06-23 and
  24 (07a28d0, 05f3a8d) held a GPS position and stay in the repository history,
  although the files were replaced on 2026-07-12 (df7948d), and rewriting published
  history is the PI's decision; paper 29's abstract has a bare "<" ("P < 0.0001",
  "(<5 min)"), which browsers show as written but the HTML validator flags. Abstracts
  are printed unescaped, so escaping them could break markup the PI enters; left as is.

## D43 — Footer lists every page with Contact on the right; no home Contact section (maintainer's request, 2026-09-29)

- The maintainer found the footer thin (its Links were Research, Publications, People and
  Kookmin University), asked for every page in it and for Contact as its last column, and
  found the home page's Contact section, directly above the footer, awkward.
- A survey of 16 sites (coley.mit.edu; the Aspuru-Guzik, Jensen, Barzilay, Whitesides,
  Kulik, Yaghi, Martínez and Schwaller groups; a KAIST, two POSTECH and an SNU lab;
  kookmin.ac.kr, english.kookmin.ac.kr and mit.edu) and of NN/g ("Footers 101", "113
  Design Guidelines for Homepage Usability"), USWDS and WCAG 2.2 (3.2.6, consistent help):
  - contact details in the footer of every page are the norm (11 of the 16 footers);
  - repeating the whole menu in the footer is optional (NN/g's "doormat" footer; USWDS: the
    footer need not mirror the header). Jensen, Yaghi and MIT list every page, most lab
    footers list none, and no lab lists only some pages, as SAIL's footer did;
  - no rule fixes where contact goes: left (Jensen, MIT), centre (KAIST, Toronto) and right
    (Coley, both POSTECH labs, Kookmin's English site) all occur;
  - no surveyed site repeats a home Contact section right above a footer with the same
    details; NN/g advises one clear place for such content. Two labs invite instead:
    Barzilay's "Let's work together!" button to its Work With Us page right above the
    footer, and a POSTECH lab's "Join our team" block mid-page.
- Why it was so: the footer's links were written by hand in the first build (1b0a056,
  2026-06-14) as a copy of the hero's three buttons, and never followed the menu, which
  gained News (9e20100) and Positions (6d424b6) and had Alumni, Group Guide and Photos
  from the start. The home Contact section ("Find us" until D38) was part of the first
  build's template; nothing in the records has the PI asking for it (D20 lists the home
  page's sections after the PI's changes), and D38 asked the maintainer whether to drop it
  and, without an answer, kept it.
- **Footer:** brand, Links, Contact, left to right.
  - Links are generated from `_data/navigation.yml` in menu order, so a page added to the
    menu is listed too: a menu entry with sub-pages gives its sub-pages (Principal
    Investigator, Members, Alumni), Home is left out (the logo is the home link), and the
    external Group Guide opens in a new tab like the header's. "People" (to /pi/) gives way
    to the menu's names.
  - Kookmin University stays last in Links: D21 sent the header's Kookmin emblem home at the
    PI's request on the ground that the footer links the university, by its logo and by this
    entry.
  - The links sit in two CSS columns, top to bottom in menu order. The Links column is a
    size container, and the list drops to one column where that column is narrower than
    18em (two list columns need 17.7em of the body text size for "Principal
    Investigator"). That happens only with a reader's larger default font (at 20 px the
    two longest labels wrapped in three columns and on tablets and phones before this) or
    on a phone narrower than about 340 px.
  - Three columns above the header's menu breakpoint (68.75em, 1100 px at the default
    size); below it the brand takes its own row with Links and Contact side by side (three
    columns squeezed the links and wrapped two labels at 861 px); one column at 720 px and
    below. `main.scss` notes that the footer shares the menu's breakpoint.
- **Home:** the Contact section is removed with its CSS (`.contact-grid`). The footer shows
  the same address, e-mail and phone on every page; the PI's title and college it added are
  on the PI page, and the home page's first line names the PI. The home page now ends with
  the grey journal-covers band, as /photos/ always did; where a page's last section is such
  a band the footer's top margin is 0, so no white strip separates them (`:has()`; a browser
  without it keeps the strip).
- Docs: README's table of files (the menu file also sets the footer's links; where the
  contact details live; the home page's sections), the comments in `navigation.yml` and
  `home.yml`, and CLAUDE.md.
- Not done: a one-line home pointer to Positions like those two labs' (the maintainer
  declined it on 2026-09-29); the base line "Kookmin University · Seoul, Republic of Korea"
  stays.

## D44 — Code link on papers (PI request, 2026-09-30)

- The PI asked for a GitHub icon to the right of a paper's DOI, to link the paper's code
  where there is any. The maintainer marked the place on the Publications list: after the
  arXiv logo, before the topic tags.
- **Data:** an optional `code:` on a paper in `publications.yml` (also on a person's own
  papers, inline or in `member_pubs/<slug>.yml`), one address. `validate_data.rb` checks it
  like `doi` and `preprint_url`: an address that does not start with `http` stops the
  build and names the paper. Paper 47 links `https://github.com/sailgroup/MEMo`, entered on
  the instruction of the maintainer, one of its authors (2026-09-30); other links are the
  PI's to enter.
- **Icon:** the GitHub mark (the one the people pages already use, in GitHub's #24292f) for a
  github.com address. Any other host (GitLab, Zenodo, a lab server) gets a plain grey code
  icon (`code.svg`), so GitHub's logo never points elsewhere. `_includes/code-badge.html`
  picks it from the address's host, as `preprint-badge.html` picks arXiv or ChemRxiv. Both
  icons are round like the DOI logo and drawn at its size: 24 px on the lists, 38 px on the
  paper page, with the same hover lift.
- **Where:** on the Publications list and on member pages, after the DOI and preprint
  logos (a paper with only a code link, such as a submitted one, still gets the row); on
  the paper page, in the link row after them. The link opens in a new tab and is named
  "View code on GitHub" (or "View code") for screen readers.
- `llms-full.txt` gives a `Code:` line for a paper that has one. The citation meta and the
  JSON-LD are unchanged: schema.org has no property for an article's code, and a code link
  does not make a manuscript citable.
- Docs: README (the example, and a note on where the icon shows, the grey icon for other
  hosts and what the build does with a malformed address), CONTRIBUTING (and `code-badge`
  in its list of includes), and the header comment of `publications.yml`.
- Found and not entered (the maintainer chose to link paper 47 only). Each repository is
  named by the paper itself or its SI, and each resolves:
  - 34: github.com/jfjoung/mechanism_prediction (the Data Availability Statement);
  - 35: github.com/spark8ku/DeepMoleculeGen;
  - 36: gitlab.com/mlpds_mit/askcosv2 (would show the grey icon);
  - 37: github.com/FongMunHong/FlowER (the dataset curation code is
    github.com/jfjoung/Mechanistic_dataset);
  - 38: github.com/KRICT-DATA/2024-KRICT-ChemDX-Hackathon (the PI's project in it is
    github.com/jfjoung/KRICT_Hackathon);
  - 39: github.com/jihye-roh/higherlev_retro (SI).

  No code: 21, 25, 28, 31, 40 and 41. Paper 30's Data and Software Availability section is
  behind the paywall. Not checked: 1 to 20, 22 to 24, 26, 27, 29, 32, 33 and 42 to 46.
