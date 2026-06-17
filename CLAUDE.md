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
- `_data/` — all content lives here: `publications.yml` (authoritative, 41 papers), `people.yml`
  (members + alumni in one file; `status:` picks the page), `pi.yml`, `news.yml`, `research.yml`,
  `covers.yml`, `photos.yml`, `themes.yml` (topic-tag chips), `journal_logos.yml`, `home.yml`,
  `navigation.yml`, and `member_pubs/<slug>.yml` (a person's long external-paper list)
- `_plugins/` — `generate_pages.rb` builds every publication/person page (and the legacy
  `/members|/alumni/<slug>/` redirects) from `_data`, so adding one is a single YAML edit;
  `validate_data.rb` checks the data at build time and fails with a readable message;
  `pub_sort.rb` orders a person's merged publication list
- `_layouts/` (`default`, `page`, `person`, `publication`), `_includes/` (shared markup),
  `assets/` — templates, partials, styles (`assets/css/main.scss`), JS, images
- top-level pages — `index.html`, `research`, `pi`/`members`/`alumni`, `publications`, `news`,
  `photos` (member/alumni/publication detail pages are generated, not files)
- `_source/` — local archive of scraped Wix content + staged original images (gitignored, excluded
  from the build)
- `.github/workflows/` — CI build (Jekyll + html-proofer) + deploy

## Build / deploy
- CI runs `bundle exec jekyll build`, then html-proofer over the built site, then deploys to Pages.
  Push to `dev` builds only; `main` builds and deploys (D11). Confirm the Actions run is green
  before treating anything as done.

## SEO / GEO
- jekyll-seo-tag emits the core meta; `_plugins/generate_pages.rb` sets a unique `title`/
  `description` per generated page (else all 52 share the site title). `_includes/structured-data.html`
  emits JSON-LD (Organization, Person, ScholarlyArticle, BreadcrumbList, CollectionPage). `/llms.txt`
  is a generated summary for AI answer engines; the sitemap excludes the noindex redirects.
  Registering in Google Search Console / Naver Search Advisor is a manual (account-based) step.
- Journal covers open a fullscreen viewer (`assets/js/covers.js`); each cover needs a high-res
  `<base>-full.jpg` beside its thumbnail (the validator warns when it is missing).

## Conventions
- Site copy: **no em dashes, no marketing tone, factual and specific.**
- Publications: bold the PI name **Joonyoung F. Joung** (alias **Joonyoung Francis Joung**) in
  author lists.
- Member/alumni/publication facts are content: never invent a photo, link, date, or fact — leave a
  field blank instead, and record gaps in `CONTENT_INVENTORY.md`.

## Tracking files
`DECISIONS.md` (decisions + rationale) · `PROGRESS.md` (phase status) · `CONTENT_INVENTORY.md`
(migrated items + gaps) · `REVIEW.md` (final QA).
