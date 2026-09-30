# Contributing to the SAIL website

Every change below is a single edit to one file on **github.com** (use the pencil
✏️ on the file); no local setup is needed.
When you commit, GitHub rebuilds and publishes the site
(`https://sail.kookmin.ac.kr`) in about a minute.

If you make a mistake (a missing required field, a typo'd image name, a bad
date), the build **fails with a clear message naming the file and the fix**, and
the live site is left untouched, so you cannot break the site by editing data.

> Bold the PI name **Joonyoung F. Joung** in author lists. House style: no em
> dashes, plain factual wording. Never invent a photo, link, date, or fact;
> leave a field blank instead.

---

## Add a person (member or alumnus)  →  `_data/people.yml`

1. Add a photo (optional): upload `firstname-lastname.jpg` to
   `assets/images/people/`, the folder that holds every people photo (square
   looks best; any size is fine, see "Image sizes" below). Without a photo the card shows the person's initials; a generic
   `anonymous.png` in the same folder can be used instead of a real photo.
2. Add one block to `_data/people.yml`:

   ```yaml
   - name: Gil-dong Hong
     status: current            # current (a current member) OR alumni
     role: M.S. Student
     department: School of Artificial Intelligence  # optional; their own school/dept
     name_ko: 홍길동            # optional
     email: hong@kookmin.ac.kr  # optional
     photo: gil-dong-hong.jpg   # optional; must match the file in assets/images/people/
     photo_hover: gil-dong-hong-hover.jpg  # optional; a 2nd photo that fades in on hover
     slug: gil-dong-hong        # lowercase-with-hyphens; their personal-page address
     joined: "2026-03-01"       # optional, YYYY-MM-DD
     description: >             # optional; short intro shown on their personal page
       Gil-dong is an M.S. student working on machine learning for chemistry.
       Keep the indentation and it can run over several lines.
   ```

`status` decides which page lists them (`current` → Members, `alumni` → Alumni).
Everyone with a `slug` gets a personal page at `/people/<slug>/` (omit the slug and they still list on the grid, just without a page). Required: `name`, `role`,
`status`. Optional social links (real URL only): `linkedin:`, `github:`,
`scholar:`, `orcid:`, `website:`. An optional `department:` (e.g. `School of Artificial
Intelligence`) shows the person's own school/department on a line under the lab affiliation,
useful when their home department differs from the lab's. An optional `description:` (a short
intro paragraph, like the example above) appears on the personal page as an "About" section
(same heading style as the Publications section) above the person's publication list.
Alumni may add a one-line `note:`. If a lab paper
lists this person under a different spelling (e.g. "H Kim" vs "Heejeong Kim"), add
`author_aliases: ["H Kim"]` so the auto-link from the Publications page still finds them. Keep an alias distinctive (a surname plus an initial like `"H Kim"`, not a bare `"Kim"`): matching is by substring, so a too-common alias can pull unrelated papers onto their page.

**A second photo on hover** (optional): set `photo_hover:` to a second image in
`assets/images/people/` (e.g. `gil-dong-hong-hover.jpg`) and it cross-fades in when
someone hovers the card photo on the Members/Alumni grid (for example a headshot
and a candid photo). Leave it out for a single photo; on touch devices the
default photo always shows. This works for any person the same way.

**When someone graduates**, change only their `status` from `current` to
`alumni`. Their `/people/<slug>/` URL stays the same, so no link ever breaks (the
old `/members/<slug>/` and `/alumni/<slug>/` addresses keep redirecting to it), so
you never have to update news links.

**A person's own papers from elsewhere** (not on the lab Publications page, e.g.
a postdoc's prior work): add a `publications:` list to their entry. They show on
their page, merged with any lab papers that match their name, newest first; the
title links to the DOI and their own name is bold.

```yaml
  publications:                    # inside the person's entry
    - title:   "Paper title"
      authors: "Gil-dong Hong, A. Coauthor"
      journal: "Journal Name"
      year:    2023                 # plain number, no quotes
      doi:     "https://doi.org/10.xxxx/yyyy"   # optional; the title links here
      preprint_url: "https://arxiv.org/abs/..." # optional
      code:    ""                               # optional; the code repository (GitHub icon)
```

`title`, `authors`, `journal`, `year` are required per entry. List only papers
**not** already on the lab Publications page (lab papers auto-appear by author name).

For a long external list (e.g. a postdoc with many prior papers), put the same
list in `_data/member_pubs/<slug>.yml` instead of inline, to keep `people.yml`
readable; the person's page reads it by `slug` and merges it the same way.

## Add a publication  →  `_data/publications.yml`

Add one block (newest go at the top). The paper appears on the Publications
list, gets a detail page at `/publications/<id>/`, and, if an author matches a
current member's name, shows up on that member's page too, all automatically.

```yaml
- id: 42                       # required, a new unique number; shown on the list
  title: "Paper title"         # required
  authors: "Joonyoung F. Joung*, A. Other"  # required; PI name is auto-bolded
  journal: "Nature"            # required; map a logo in _data/journal_logos.yml
  ref: "12, 345"               # optional volume/page
  year: 2026                   # required
  doi: "https://doi.org/10.1038/..."   # optional; shows the DOI badge
  preprint_url: "https://arxiv.org/abs/..."  # optional; shows arXiv/ChemRxiv badge
  code: ""                     # optional; the code repository (see "Link a paper's code")
  themes: ["Reaction pathway prediction"]    # optional topic tags (filter chips)
  image: "pub-42.jpg"          # optional; upload to assets/images/pubs/
  abstract: "English abstract."        # optional; shown in full on the detail page
  abstract_ko: "한국어 초록."           # optional; shown as 초록, with the English folded below it
```

Only `id`, `title`, `authors`, `journal`, `year` are required. A journal with no
logo in `_data/journal_logos.yml` simply shows no logo (add a line there to fix).

`ref` is free text for the volume/pages (e.g. `"47, 317-327"` or `"Advance
Article"`). Most papers instead use the structured `vol:` / `issue:` / `pages:`,
which gives an auto-formatted *vol* (issue), pages line; `vol` takes precedence
over `ref` when both are present.

### Link a paper's code (GitHub icon)

Every paper has a `code: ""` slot. Put the repository's full address between the
quotes, one per paper, e.g. `code: "https://github.com/sailgroup/MEMo"` (paper 47).
The GitHub mark then shows at the right end of the DOI and preprint logos (just before
the topic tags) on the Publications list, the paper's page and its authors' member
pages. Any other host (GitLab, Zenodo) gets a plain grey code icon. Empty quotes show
nothing. README ("논문에 코드 링크 달기") walks through the edit on github.com.

The build stops and names the paper when an address:

- does not start with `http`;
- still has the example's `...`;
- is given twice in one paper (YAML silently keeps the last one, so a filled-in line
  above the empty slot would vanish);
- is indented like the abstract's text, which makes it part of the abstract.

## Add a news item  →  `_data/news.yml`

Copy any block in the file and edit it. The file's header documents every field.
Minimum:

```yaml
- date: "2026-06-20"           # required, YYYY-MM-DD (controls the order)
  display_date: ""             # optional; shown instead of date, e.g. "March 2025" or "2026"
  category: award              # people | publication | award | talk | event
  title: "Best poster award"   # required
  body: "One or two sentences." # optional
  link: "/publications/41/"    # optional; internal path or full https URL
  link_text: "Read more"       # optional; link label (defaults to "Details")
```

The three newest items also show on the home page.

## Add a photo  →  upload an image + add one line to `_data/photos.yml`

1. Upload your image to `assets/images/photos/` (e.g. `photo-26.jpg`; any size is fine).
2. Add a block to `_data/photos.yml` (newest first):

   ```yaml
   - image: photos/photo-26.jpg
     title: "2026.06.20. Lab dinner"   # optional caption title
     caption: "At the restaurant"      # optional caption line
     alt: "Lab dinner, June 2026"      # optional; describes the image
   ```

## Update the research areas  →  `_data/research.yml`

Each area has a `title` and a `body` (both required) and an optional figure from
one of the lab's papers (`figure:` a file in `assets/images/`, `figure_w` /
`figure_h` its pixel size, `figure_alt`, and `figure_journal` / `figure_year` /
`figure_doi` for the caption link). Every area is shown in full on the Research
page and on the home page, where the figure sits beside the text; the home page
links each area to its section on `/research/` by title, so renaming an area
keeps the link working. An area without a figure is shown as text only. The
Korean texts in the file (`overview.ko`, each area's `title_ko` and `body_ko`)
are kept from the old site but are not shown anywhere, so editing them does not
change the site.

## Image sizes

Upload photos as they are. When the site is deployed, the copies served to
visitors are scaled down automatically (people 800 px, photos 1600 px, paper
figures 1200 px on the longest side) and recompressed, and camera metadata (such
as the GPS position a phone stores in a photo) is removed. The repository itself
is public and keeps the file exactly as uploaded, so share a phone photo without
its location (most phones and photo apps have that option); the build's summary
page warns when a JPG, PNG, WebP, or AVIF upload holds a GPS position. Save photos
as JPG: a HEIC file (the iPhone default) or a TIFF is not processed, so it is
published with its metadata, and most browsers cannot show it (the summary page
warns about these too). Gallery photos, paper
figures, and journal covers also get smaller copies, which the browser uses where
the image is shown small (the photo grid, the publication list). The originals in
the repository are never changed. Only uploads to `people/`, `photos/`, and
`pubs/` are scaled down, cleaned, and checked for a GPS position: journal covers
(apart from their smaller copies), logos, and research figures are served as
uploaded, metadata included, so remove a photo's location before using it as one
of those. A file name with a space or a comma gets no smaller copies (the page
still shows the image), so name files like `photo-26.jpg`.

## Update the Positions page  →  `_data/positions.yml`

All of the text on the Positions page (`/positions/`) lives here (Korean). It is
an `intro` plus a list of `sections` (one per role). Each role has a `title` and
`paragraphs`:

```yaml
sections:
  - title: 대학원생                 # the role heading
    paragraphs:
      - "First paragraph."          # one list item = one paragraph
      - "Second paragraph."
```

`paragraphs` (and `projects` below) must be a **list**: each item begins with `-`.
If you write `paragraphs:` as one value instead, the build stops with a clear
message (it used to render nothing silently).

**Project cards (the boxes):** today the "학부 연구생" role shows four cards. The
same cards can be attached to **any** role (Graduate students, Postdoc, etc.):
inside that role, add `projects_title` (an optional sub-heading) and a `projects`
list. To advertise or retire a project, add or remove one block.

```yaml
  - title: 대학원생
    paragraphs:
      - "..."
    projects_title: 대학원생 모집 프로젝트   # optional sub-heading above the cards
    projects:
      - title: 프로젝트 제목               # card title (auto-numbered 1, 2, 3…)
        body: 프로젝트 설명.
        requires: 유기화학                 # optional; shown as a '필요 지식:' line
      - title: 다른 프로젝트
        body: 설명.
```

The "대학원생" entry in `_data/positions.yml` has a ready-to-uncomment example.
Writing `그룹 가이드` anywhere in the text auto-links to the group guide document.
This page is in Korean by request; keep new copy in Korean to match.

---

## How it works (for maintainers)

- The site is **Jekyll**, built and deployed by GitHub Actions (Pages source =
  GitHub Actions). There is no local Ruby on the dev machine; **CI is the build
  of record** (`DECISIONS.md` D2). Work on `dev`, which builds but does not
  deploy; `main` deploys (D11).
- All content lives in `_data/*.yml`. `_plugins/generate_pages.rb` turns each
  member/alumnus/paper entry into its page; `_plugins/validate_data.rb` checks
  the data at build time and fails with a readable message on a mistake. CI also
  runs html-proofer over the built site to catch a broken internal link/image.
  Before the build, `.github/scripts/prepare-images.mjs` works on CI's copy of
  the images (never the repository): it shrinks oversized uploads, removes camera
  metadata, and makes the smaller copies above, listing them in
  `_data/generated_images.json`, which the templates turn into `srcset` (D40). On
  `main` it is optional: if it fails, the site is built and deployed with the
  plain image files. On `dev` and on pull requests it is strict: a failure, or an
  image that errors while being processed, fails the run, so a problem shows
  before `main` (a HEIC, TIFF or DNG upload only gets its warning).
- Shared rendering lives in `_includes/` (`person-card`, `person-profile`,
  `member-pubs`, `pub-item`, `pi-authors`, `preprint-badge`, `code-badge`, `journal-covers`,
  `news-date`, `social-links`, `icon`, `structured-data`). Edit a pattern in one place.
- Never delete `CNAME` (the custom domain). `baseurl` stays `""`.

## Build tools

- **Versions are locked.** `Gemfile.lock` pins every Ruby gem (Jekyll, its
  plugins, html-proofer) and `.github/scripts/package-lock.json` pins `sharp` for
  the image step. CI installs exactly these (Bundler in deployment mode, `npm
  ci`), so a new release cannot change or break a build on its own.
- **Updates come from Dependabot**: once a month, one pull request each for the
  GitHub Actions, the gems, and `sharp`. Merge it when its CI run is green (the
  image step is strict on a pull request, so green includes it). Merging deploys
  `main`; then bring `dev` up to date (`git switch dev`, `git pull --no-rebase
  origin main`, `git push`), so work on `dev` starts from what is live.
- **Docker runs Ruby here** (there is no local Ruby). The commands below work in
  PowerShell and in a Unix shell; in Git Bash on Windows, put `MSYS_NO_PATHCONV=1`
  in front of `docker`.
- **After editing the `Gemfile`**, regenerate `Gemfile.lock` in the same commit,
  or CI stops with a frozen-lockfile error:

  ```sh
  docker run --rm -v "${PWD}:/site" -w /site ruby:3.3 bundle lock
  ```

  (`bundle lock --update` moves every gem to its newest allowed version.)
- **To change the `sharp` version**, in `.github/scripts/`:
  `npm install --save-exact --package-lock-only sharp@<version>`.
- **A full local build**, the same commands as CI (`BUNDLE_FROZEN` makes Bundler
  refuse a `Gemfile.lock` that does not match the `Gemfile`, as CI does):

  ```sh
  docker run --rm -e BUNDLE_FROZEN=true -v "${PWD}:/site" -w /site ruby:3.3 bash -c "bundle install && JEKYLL_ENV=production bundle exec jekyll build && bundle exec htmlproofer _site --disable-external --ignore-empty-alt --allow-hash-href --no-enforce-https"
  ```

  The image step is optional (without it pages use the plain image files). It
  rewrites images in place, so it runs only in CI unless given `--local`, and then
  only on a copy of the repository: `npm ci --prefix .github/scripts`, then
  `node .github/scripts/prepare-images.mjs assets/images _data/generated_images.json --local`.

- `/.well-known/security.txt` gets its `Expires` date (330 days ahead) at build
  time, so the live file is renewed each time `main` is deployed. If `main` has
  not been deployed for about ten months, re-run the workflow on `main` (Actions,
  "Build and deploy site", Run workflow) so it does not lapse. There is no monthly
  scheduled run on purpose: GitHub turns off a workflow that has a schedule after
  60 days without activity in a public repository, and a turned-off workflow no
  longer runs on a push either, so the site would stop deploying.
