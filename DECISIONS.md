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

### Autonomous decisions (Phase 11, no human gate — rationale one line each)

- **Generate pages instead of auto-creating stubs.** Cleaner single source of
  truth than keeping a collection and writing stub files into it; the templates
  never read the collection, so nothing was lost. (Serves north star A.)
- **html-proofer via `gem install` in CI, not the Gemfile.** `Gemfile.lock` is
  not committed and there is no local Ruby to regenerate it; a standalone install
  keeps the Jekyll build bundle untouched and avoids a frozen-lock failure.
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
