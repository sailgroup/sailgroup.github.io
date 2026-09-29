# CLAUDE.md — SAIL Lab Website

Project guide for Claude / maintainers working on this repository.

## What this is
GitHub Pages site for **SAIL — Spectroscopy & Artificial Intelligence Lab** (Joonyoung F. Joung
Lab, Dept. of Chemistry, Kookmin University). It replaces the legacy Wix site
(`sailabjfjoung.wixsite.com/sail`). Served at `https://sailgroup.github.io` and the custom
domain `https://sail.kookmin.ac.kr`.

## Stack
- **Jekyll** static site, deployed via **GitHub Actions** (Pages "Source" = GitHub Actions, not
  "build from branch"). See `DECISIONS.md` D1, D2, D5.
- Ruby/Jekyll is **not installed** on the Windows dev machine — the **CI build is the build of
  record**. Local visual QA is done with Puppeteer (Node) against the built/deployed site.
- Custom domain via `CNAME` (`sail.kookmin.ac.kr`) — **never delete CNAME**. `baseurl` is `""`.

## Layout
- `_config.yml` — site configuration
- `_data/` — all content lives here: `publications.yml` (authoritative, one entry per paper), `people.yml`
  (members + alumni in one file; `status:` picks the page), `pi.yml`, `news.yml`, `research.yml`,
  `covers.yml`, `photos.yml`, `themes.yml` (topic-tag chips), `journal_logos.yml`, `home.yml`,
  `navigation.yml`, `positions.yml` (Positions page copy, Korean-only; each role
  section may carry an optional `projects` card list), and
  `member_pubs/<slug>.yml` (a person's long external-paper list)
- `_plugins/` — `generate_pages.rb` builds every publication/person page (and the legacy
  `/members|/alumni/<slug>/` redirects) from `_data`, so adding one is a single YAML edit;
  `validate_data.rb` checks the data at build time and fails with a readable message;
  `pub_sort.rb` orders a person's merged publication list
- `_layouts/` (`default`, `page`, `person`, `publication`), `_includes/` (shared markup),
  `assets/` — templates, partials, styles (`assets/css/main.scss`), JS, images
- top-level pages — `index.html`, `research`, `pi`/`members`/`alumni`, `publications`, `news`,
  `photos`, `positions` (member/alumni/publication detail pages are generated, not files)
- `_source/` — local archive of scraped Wix content + staged original images (gitignored, excluded
  from the build)
- `.github/workflows/` — CI build (Jekyll + html-proofer) + deploy; `.github/scripts/` — the CI
  image step (`prepare-images.mjs`, its `sharp` version pinned by `package-lock.json`)

## Build / deploy
- CI first runs `.github/scripts/prepare-images.mjs` on the checkout (shrinks oversized uploads,
  strips photo metadata, writes smaller renditions for `srcset` and lists them with image sizes in
  `_data/generated_images.json`; D40), then `bundle exec jekyll build`, then html-proofer over the
  built site, then deploys to Pages. On `main` the image step may fail without failing the build
  (pages then use the plain image files); on `dev` and pull requests it is strict (`IMAGES_STRICT`):
  a failure, or an image that errors while being processed, fails the run (a HEIC, TIFF or DNG
  upload only warns; D42). Push to `dev` builds only; `main` builds and deploys (D11). Confirm the
  Actions run is green before treating anything as done.
- `Gemfile.lock` and `.github/scripts/package-lock.json` are committed and CI installs exactly
  what they pin; update them as `CONTRIBUTING.md` ("Build tools") describes. A local build can
  run in Docker (`ruby:3.3`) with the same commands as CI.

## SEO / GEO
- jekyll-seo-tag emits the core meta; `_plugins/generate_pages.rb` sets a unique `title`/
  `description` per generated page (else every generated page shares the site title). `_includes/structured-data.html`
  emits JSON-LD (Organization, Person, ScholarlyArticle, BreadcrumbList, CollectionPage). `/llms.txt`
  is a generated summary for AI answer engines (`/llms-full.txt` the full text); the sitemap
  excludes the noindex redirects. `/.well-known/security.txt` writes its `Expires` at build time.
  Registering in Google Search Console / Naver Search Advisor is a manual (account-based) step.
- Journal covers open a fullscreen viewer (`assets/js/covers.js`); each cover needs a high-res
  `<base>-full.jpg` beside its thumbnail (the validator fails the build when it is missing).

## Conventions
- Site copy: **no em dashes, no marketing tone, factual and specific.**
- Visual style (D38): understated, in the spirit of coley.mit.edu. No tracked ALL-CAPS labels
  or "eyebrow" lines above headings (a plain muted `.kicker` line stays only where it adds what
  the heading lacks: the lab name on the home page, "Error 404"), no decorative accent bars or
  glows; neutral (untinted) greys plus the brand orange; other colour comes only from information
  (figures, topic tags, news categories, which stay coloured). Hover lifts are kept (maintainer's
  choice). Never shorten or hide PI-written text to fit a layout; balance a text-heavy block with
  the lab's own figures. The header switches to the menu button at 68.75em (1100px at the
  default font size; `main.scss` and `nav.js` hold the width, keep them in sync).
- Publications: bold the PI name **Joonyoung F. Joung** (alias **Joonyoung Francis Joung**) in
  author lists.
- Member/alumni/publication facts are content: never invent a photo, link, date, or fact — leave a
  field blank instead, and record gaps in `CONTENT_INVENTORY.md`.

## Tracking files
`DECISIONS.md` (decisions + rationale) · `PROGRESS.md` (phase status) · `CONTENT_INVENTORY.md`
(migrated items + gaps) · `REVIEW.md` (final QA).
