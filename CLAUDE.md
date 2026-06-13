# CLAUDE.md — SAIL Lab Website

Project guide for Claude / maintainers working on this repository.

## What this is
GitHub Pages site for **SAIL — Spectroscopy & Artificial Intelligence Lab** (Joonyoung F. Joung
Lab, Dept. of Applied Chemistry, Kookmin University). It replaces the legacy Wix site
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
- `_data/` — content data: `publications.yml` (authoritative, 41 papers), `pi.yml`, `members.yml`,
  `alumni.yml`, `research.yml`, `covers.yml`
- `_members/` — Jekyll collection, one file per current member (personal pages)
- `_layouts/`, `_includes/`, `_sass/`, `assets/` — templates, partials, styles, images
- top-level pages — `index.html`, `research`, `people`/`pi`/`members`/`alumni`, `publications`,
  `photos`
- `_source/` — local archive of scraped Wix content + staged original images (gitignored, excluded
  from the build)
- `.github/workflows/` — CI build + deploy

## Build / deploy
- CI runs `bundle exec jekyll build` then deploys to Pages. Confirm the Actions run is green before
  treating anything as done.

## Conventions
- Site copy: **no em dashes, no marketing tone, factual and specific.**
- Publications: bold the PI name **Joonyoung F. Joung** (alias **Joonyoung Francis Joung**) in
  author lists.
- Member/alumni facts must match the live Wix source exactly. Never invent photos or facts; leave
  blanks and record gaps in `CONTENT_INVENTORY.md`.

## Tracking files
`DECISIONS.md` (decisions + rationale) · `PROGRESS.md` (phase status) · `CONTENT_INVENTORY.md`
(migrated items + gaps) · `REVIEW.md` (final QA).
