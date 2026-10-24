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
  (members + alumni in one file; `status:` picks the page), `people_groups.yml` (the Alumni
  page's rows: postdoc, Ph.D., M.S., undergraduate), `pi.yml`, `news.yml`, `research.yml`,
  `covers.yml`, `photos.yml`, `themes.yml` (topic-tag chips), `journal_logos.yml`, `home.yml`,
  `navigation.yml`, `positions.yml` (Positions page copy, Korean-only; each role
  section may carry an optional `projects` card list), and
  `member_pubs/<slug>.yml` (a person's long external-paper list)
- `_plugins/` — `generate_pages.rb` builds every publication/person page (and the legacy
  `/members|/alumni/<slug>/` redirects) from `_data`, so adding one is a single YAML edit;
  `validate_data.rb` checks the data at build time and fails with a readable message;
  `pub_sort.rb` orders a person's merged publication list; `people_groups.rb` (the `in_group`
  filter) puts each alumnus in a row by `group:` or else `role`
- `_layouts/` (`default`, `page`, `person`, `publication`), `_includes/` (shared markup),
  `assets/` — templates, partials, styles (`assets/css/main.scss`), JS, images
- top-level pages — `index.html`, `research`, `pi`/`members`/`alumni`, `publications`, `news`,
  `photos`, `positions` (member/alumni/publication detail pages are generated, not files).
  `pi`, `members` and `alumni` are separate pages (D60, which takes back D57's one document);
  Alumni shows a row per group of `_data/people_groups.yml`, the undergraduates' photos smaller
- `_source/` — local archive of scraped Wix content + staged original images (gitignored, excluded
  from the build)
- `.github/workflows/`: the CI build (Jekyll, html-proofer) and deploy; `.github/scripts/`: the
  scripts it runs (`prepare-images.mjs`, `indexnow.mjs`), `sharp`'s version pinned by
  `package-lock.json`

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
- Every action in the workflow is pinned to a commit with its release in a comment (Dependabot
  updates both); a new step names a commit, not a tag. Secret scanning with push protection is
  on (D48).

## SEO / GEO
- jekyll-seo-tag emits the core meta; `_plugins/generate_pages.rb` sets a unique `title`/
  `description` per generated page (else every generated page shares the site title). `_includes/structured-data.html`
  emits JSON-LD (Organization, WebSite, Person, ScholarlyArticle, BreadcrumbList, CollectionPage,
  WebPage); jekyll-seo-tag's own JSON-LD is cut off in `head.html` (D58). `/llms.txt`
  is a generated summary for AI answer engines (`/llms-full.txt` the full text); the sitemap
  excludes the noindex redirects. `/.well-known/security.txt` writes its `Expires` at build time.
  Registering in Google Search Console / Naver Search Advisor is a manual (account-based) step;
  their "HTML tag" codes go in `_config.yml` `webmaster_verifications` (google, naver).
- Titles carry Korean names ("Jihwan Kim (김지환)") and a published paper's venue ("(Nature, 2025)");
  meta descriptions stay within 160 characters. The lab's other names (`alternate_names` in
  `_config.yml`, e.g. 인공지능화학연구실 from Kookmin's faculty directory) go into the JSON-LD and
  llms.txt. Korean for Naver and Korean searches lives in the head only, never on the page (D9):
  the home title's tagline, a Korean lead in the main pages' descriptions ("국민대학교 화학부
  정준영 교수 연구실 ..."), Positions' title, the research areas' Korean names in the lab's
  knowsAbout (D58). After each `main` deploy, IndexNow tells Bing and Naver which pages changed
  (`.github/scripts/indexnow.mjs` and the workflow; never delete the root key file
  `4fa521d6cc1d0212aa5696ee0a4b94a8.txt`). D47.
- Chrome's page translation: names and Korean text that stand alone (author lists, journal names,
  people's names, Korean abstracts and names, cover captions) carry `translate="no"`; prose does not
  (CONTRIBUTING, "Page translation").
- Journal covers open a fullscreen viewer (`assets/js/viewer.js`); each cover needs a high-res
  `<base>-full.jpg` beside its thumbnail (the validator fails the build when it is missing).

## Conventions
- Site copy: **no em dashes, no marketing tone, factual and specific.**
- Visual style (D38): understated, in the spirit of coley.mit.edu. No tracked ALL-CAPS labels
  or "eyebrow" lines above headings (a plain muted `.kicker` line stays only where it adds what
  the heading lacks: the lab name on the home page, "Error 404"), no decorative accent bars or
  glows; neutral (untinted) greys plus the brand orange; other colour comes only from information
  (figures; topic tags and news categories as a dot in their colour inside a neutral capsule,
  D56). Glass (D56) only on what floats over the page: the header, its dropdown, the phone
  menu, the figures' zoom mark and the Publications capsule on phones (the `glass` mixin,
  white or light grey, plain where the browser or the reader turns transparency off), and
  the viewer's buttons (dark); never on content or on other glass. Hover lifts are kept
  (maintainer's choice). Never shorten or hide PI-written text to fit a layout; balance a
  text-heavy block with the lab's own figures. The header switches to the menu button at
  68.75em (1100px at the default font size; `main.scss`, `nav.js` and `pubs.js` hold the
  width, keep them in sync); at the same width the footer's links and Contact go from three
  columns to two, and the Publications finder moves from beside the list to above it. The
  footer's links follow `navigation.yml`; the home page has no Contact section (the footer
  carries it, D43). Under
  the footer's Contact address the email, the phone and the GitHub mark (`github_org`, D55)
  sit in a row as round icons, the email or number shown under its icon on hover or focus
  (D58).
- Large monitors (D58): the root font size grows from 100% at 1920px wide to 125% at 3200px
  (`html` in `main.scss`), so desktop sizes are in rem (logos, figures, grid tracks, the
  container) and scale with it; phone-only sizes may stay in px. Floating glass other than the
  header bar and the phone menu takes a light grey base (`glass(…, #f6f6f6)`).
- Credit (D58): the HTML comment in `_layouts/default.html`, `/humans.txt`, the `/*! */`
  first line of `main.scss` and each JS file (ASCII only in the CSS one: a non-ASCII character
  makes Sass write a byte order mark), and the WebSite's `creator` (`site_creator`).
- Text colour by role (D49): running text `--ink-2`; headings, names and titles `--ink`;
  `--muted` only for dates, venues, captions and counts. Prose is capped at 55ch, which keeps a
  line within about 75 characters in this font; put the cap on the element whose size the `ch`
  should be measured in (the paper abstracts carry their own). The header logo is
  `assets/images/sail-logo.svg`, `sail-logo.png` redrawn in outlines (no larger original
  exists).
- Publications: bold the PI name **Joonyoung F. Joung** (alias **Joonyoung Francis Joung**) in
  author lists.
- A paper's larger figure `assets/images/pubs/<image base>-full.jpg` is optional: the paper page
  shows it under the title and opens it in the viewer (`assets/js/viewer.js`), else it shows the
  thumbnail. Like the thumbnail, it must be the paper's own published graphical abstract or
  figure (D15, D50). BibTeX (each paper page and `/publications.bib`) is generated from
  `publications.yml` for every paper with a DOI (`_plugins/bibtex.rb`).
- Member/alumni/publication facts are content: never invent a photo, link, date, or fact — leave a
  field blank instead, and record gaps in `CONTENT_INVENTORY.md`.
- What the site says stays as written (D52): never reword, shorten, hide or reorder what the
  PI wrote or the site's facts; fix a spelling error only after the maintainer approves that
  line, in its own commit, recorded in `CONTENT_INVENTORY.md`. The menu's labels and order,
  the footer's lines and page headings change only on the maintainer's approval, and text no
  page shows is shown only when the PI asks. Design may change. Before a deploy, compare
  every page's text with the live site and show the maintainer each removed or changed line.

## Tracking files
`DECISIONS.md` (decisions + rationale) · `PROGRESS.md` (phase status) · `CONTENT_INVENTORY.md`
(migrated items + gaps) · `REVIEW.md` (final QA).
