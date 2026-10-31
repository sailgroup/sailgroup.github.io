# Contributing to the SAIL website

Every change below is a single edit to one file on **github.com** (use the pencil
✏️ on the file); no local setup is needed.
When you commit, GitHub rebuilds and publishes the site
(`https://sail.kookmin.ac.kr`) in about a minute.

If you make a mistake (a missing required field, a typo'd image name, an empty
or broken image file, a bad date, a YAML slip), the build **fails with a clear
message naming the file and the fix**, and the live site is left untouched, so
you cannot break the site by editing data.

**Checking a change.** Open the repository's **Actions** tab; the top run is your
commit (yellow dot: running, green check: live, red X: failed). On a red X, open
the run: **Annotations** lists each problem, `Data check` for content (a missing
field, a wrong file name, an image that is not an image) and `YAML` for the
file's form, with the file and line. Fix it and commit again. If the run is green
but a page looks old, your browser kept the old file: reload with Ctrl+Shift+R
(⌘+Shift+R). An image opened in the viewer can stay old even then; wait about ten
minutes or use a private window (GitHub Pages lets browsers keep a file that long).

**Writing YAML.** Indent with spaces, in line with the entries above and below;
one space off stops the build. Put a value in double quotes when it holds `: `
(the build stops otherwise) or ` #` (the rest is read as a comment and dropped
without a word). Quote a date with a dot, `"2026.10"`, or it is read as the
number 2026.1; leave fields marked "plain number" (a paper's `year`) unquoted.

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
`author_aliases: ["H Kim"]` so the auto-link from the Publications page still finds them and that spelling in the paper's author list links to their page (D67). Keep an alias distinctive (a surname plus an initial like `"H Kim"`, not a bare `"Kim"`): matching is by substring, so a too-common alias can pull unrelated papers onto their page.

**A second photo on hover** (optional): set `photo_hover:` to a second image in
`assets/images/people/` (e.g. `gil-dong-hong-hover.jpg`) and it cross-fades in when
someone hovers the card photo on the Members/Alumni grid (for example a headshot
and a candid photo). Leave it out for a single photo; on touch devices the
default photo always shows. This works for any person the same way.

**When someone graduates**, change only their `status` from `current` to
`alumni`. Their `/people/<slug>/` URL stays the same, so no link ever breaks (the
old `/members/<slug>/` and `/alumni/<slug>/` addresses keep redirecting to it), so
you never have to update news links.

**The rows of the Alumni page.** Alumni are shown in a row per group, in this order:
postdoctoral researchers, Ph.D. students, M.S. students, undergraduates (smaller photos). The
`role` decides the row: a role with "Postdoc" goes to the first, "Ph.D." to the second,
"M.S." to the third, "Undergraduate" or "UROP" to the last, and "M.S./Ph.D. Integrated
Course" to Ph.D. A word counts at the start of a word of the role ("Postdoc" fits
"Postdoctoral", "UROP" does not fit inside "European"). When the role does not fit (someone who left the integrated course with an
M.S.), add `group: ms` to the person (or `postdoc`, `phd`, `undergrad`). The headings, the
order and the words are in `_data/people_groups.yml`. A row with nobody in it yet still
shows its name, with "None yet." beside it, and an alumnus who fits no row stops the build
with a message that says what to add.

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
      dataset: ""                               # optional; the dataset (Figshare icon)
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
  authors: "Joonyoung F. Joung*, A. Other"  # required; PI name is auto-bolded, lab people's names link to their pages
  journal: "Nature"            # required; map a logo in _data/journal_logos.yml
  ref: "12, 345"               # optional volume/page
  year: 2026                   # required
  doi: "https://doi.org/10.1038/..."   # optional; shows the DOI badge
  preprint_url: "https://arxiv.org/abs/..."  # optional; shows arXiv/ChemRxiv badge
  code: ""                     # optional; the code repository (see "Link a paper's code and data")
  dataset: ""                  # optional; the dataset, e.g. on Figshare (same section)
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

A larger copy of the paper's figure can sit beside its thumbnail, named after it
with `-full` (for `pub-42.jpg`, `assets/images/pubs/pub-42-full.jpg`). The paper
page then shows it under the title, and a click or tap opens it in the viewer;
without one, the page shows the thumbnail. Like the thumbnail, it must be the
paper's own published graphical abstract or figure (D15, D50). A paper with a DOI
also gets a BibTeX entry, on its page and in `/publications.bib`, made from these
fields when the site is built (`_plugins/bibtex.rb`). A paper without a DOI gets one
for its preprint when `preprint_url` is an arXiv link or a ChemRxiv DOI link (D64);
once `doi` is filled in, the entry is the journal's.

A formula in a title or an abstract is written with `<sub>` and `<sup>`, as publishers
write it: `CO<sub>2</sub>`, `Mg<sup>2+</sup>`. The page sets the figures small below or
above the line; the tab title, search results and llms.txt get plain `CO2`, and BibTeX
`CO\textsubscript{2}`. These are the only two tags allowed, and one left open stops the
build with the paper's id.

### Link a paper's code and data (GitHub, Figshare icons)

Every paper has two slots, `code: ""` for its code repository and `dataset: ""` for
its dataset. Put the full address between the quotes, one per slot, e.g.
`code: "https://github.com/FongMunHong/FlowER"` and
`dataset: "https://doi.org/10.6084/m9.figshare.32513667"` (paper 37). The GitHub mark
and then the Figshare mark show after the DOI and preprint logos (just before the topic
tags) on the Publications list, the paper's page and its authors' member pages. The icon follows the address: `code` on github.com gets the
GitHub mark, any other host (GitLab) a plain grey code icon; `dataset` on Figshare
(figshare.com, a *.figshare.com portal, or a Figshare DOI, `https://doi.org/10.6084/...`)
gets the Figshare mark, any other host (Zenodo) a plain grey dataset icon. Empty quotes
show nothing. README ("논문에 코드와 데이터 링크 달기") walks through the edit on
github.com.

The build stops and names the paper when an address:

- does not start with `http`;
- still has the example's `...`;
- is given twice in one paper (YAML silently keeps the last one, so a filled-in line
  above the empty slot would vanish);
- is indented like the abstract's text, which makes it part of the abstract.

On GitHub the failed run's page lists each problem under **Annotations**, titled "Data
check" (this holds for every data check, not only these).

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
  links_label: "In the press"  # optional; shown before `links` (the colon is added)
  links:                       # optional; more links on the same line (a news story, press)
    - text: "JoongAng Ilbo"
      url: "https://www.joongang.co.kr/article/..."
```

The three newest items also show on the home page.

## Add an award to the PI page  →  `_data/pi.yml`

The `awards` list shows on /pi/ under Career Summary, in the file's order (newest first):

```yaml
awards:
  - name: Pioneering Award                                     # required
    org: College of Science and Technology, Kookmin University # optional
    date: "2025.09"                                            # shown at the right as written
```

The build stops with a message if `awards` is not a list or an entry has no `name` (D68),
or if a date on the page (`education` and `awards` `date`, `career` `period`) has no
quotes and so would show as a number (D69). The same file holds the contact block's
`office` (pin icon) and `lab` (flask icon, D70).

## Add a photo  →  upload an image + add one line to `_data/photos.yml`

1. Upload your image to `assets/images/photos/` (e.g. `photo-26.jpg`; any size is fine)
   with **Add file → Upload files**, under the name it will keep. A photo renamed in
   GitHub's editor on 2026-10-31 kept two bytes and the Photos page showed a broken image.
   To rename, upload it again under the new name, point `photos.yml` to it and delete the
   old file. The build now stops on an image the data points to that is empty or not an
   image (D69).
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
are the Korean Research page, `/research/ko/` (D65); where one is empty that
page shows the English, and the build log says where. The figures keep their
English description and caption there. The Korean page's search description
(`research-ko.html`) names the areas by `title_ko`, and the build log says when
an area is renamed and that line is not.

## Image sizes

Upload photos as they are. When the site is deployed, the copies served to
visitors are scaled down automatically (people 800 px, photos 1600 px, paper
figures 1200 px and a paper's `-full` figure 1600 px on the longest side) and
recompressed, and camera metadata (such
as the GPS position a phone stores in a photo) is removed. The repository itself
is public and keeps the file exactly as uploaded, so share a phone photo without
its location (most phones and photo apps have that option); the build's summary
page warns when a JPG, PNG, WebP, or AVIF upload holds a GPS position. Save photos
as JPG: a HEIC file (the iPhone default) or a TIFF is not processed, so it is
published with its metadata, and most browsers cannot show it (the summary page
warns about these too). Gallery photos, paper
figures, and journal covers also get smaller copies, which the browser uses where
the image is shown small (the photo grid, the publication list); a paper's `-full`
figure gets none. The originals in
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
  the data at build time and fails with a readable message on a mistake, including
  an image the data points to whose first bytes are no image format (D69). On
  GitHub Actions it also names a YAML syntax error's file and line as an
  annotation, which Jekyll alone leaves deep in the log (D69). CI also
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
  `member-pubs`, `pub-item`, `pi-authors`, `preprint-badge`, `code-badge`,
  `dataset-badge`, `journal-covers`, `news-date`, `social-links`, `icon`,
  `structured-data`, `people-nav`, `new-tab`, `lightbox`). Edit a pattern in one
  place. Every image that opens larger (the journal covers, the photos, the home
  figure, a paper's figure) uses one viewer: `_includes/lightbox.html` with
  `assets/js/viewer.js`.
- **Page translation.** Many Korean visitors read the site through Chrome's page
  translation. In templates, a name or Korean text that stands on its own (an author
  list, a journal name, a person's name in a heading or card, a Korean name or the
  Korean abstract, a cover caption) carries `translate="no"`, so it stays as written:
  without it "Nature" became "자연", names were doubled, and the PI's Korean abstracts
  were re-translated into broken Korean. Prose (bios, research text, news) stays
  translatable: a name kept inside a sentence made the translator drop the Korean
  particle after it. Two lines of one entry (a role and its place) are two blocks, not
  one line broken by `<br>`, which the translator runs together.
- **Meta descriptions** stay within 160 characters (Bing's site scan reports longer
  ones, and Google cuts the snippet near there). A page's front-matter `description:`
  is written to fit; the generated ones (papers, people, the PI) are cut at a word.
- Never delete `CNAME` (the custom domain). `baseurl` stays `""`.
- Never delete `4fa521d6cc1d0212aa5696ee0a4b94a8.txt` at the root: it is the IndexNow
  key. On `main`, the build job lists the pages whose HTML differs from the live site
  (`.github/scripts/indexnow.mjs`), and the deploy job sends that list to IndexNow
  (api.indexnow.org, which shares it with Bing's partners, and Naver) once the pages are
  live, so those engines recrawl them soon. Neither step can fail a run. The key is
  public by design: an engine reads the file to check that the list came from the site.
- **What the site says stays as written (D52).** A change to the templates, styles or
  scripts may change how a page looks, not what it says: the text the PI wrote and the facts
  are never reworded, shortened, hidden or reordered, and the menu's labels and order, the
  footer's lines and page headings change only when the maintainer approves. A spelling error
  in the PI's text is fixed only once the maintainer approves that line, in its own commit,
  recorded in `CONTENT_INVENTORY.md`. Before deploying such a change, compare every page's
  text with the live site and show the maintainer each removed or changed line.

## Build tools

- **Versions are locked.** `Gemfile.lock` pins every Ruby gem (Jekyll, its
  plugins, html-proofer) and `.github/scripts/package-lock.json` pins `sharp` for
  the image step. CI installs exactly these (Bundler in deployment mode, `npm
  ci`), so a new release cannot change or break a build on its own.
- **Updates come from Dependabot**: once a month, one pull request each for the
  GitHub Actions, the gems, and `sharp`. Merge it when its CI run is green (the
  image step is strict on a pull request, so green includes it). Merging deploys
  `main`; then bring `dev` up to date (`git switch dev`, `git pull --no-rebase
  origin main`, `git push`), so work on `dev` starts from what is live. Every
  action in the workflow is pinned to a commit with its release in a comment;
  Dependabot's pull request changes both. A security fix for a gem or `sharp` can
  also arrive between the monthly ones (Dependabot security updates); handle it the
  same way.
- **Secrets are refused at push.** Secret scanning with push protection is on: a
  push that contains a token or key is rejected. Take the secret out of the commit
  instead of bypassing the block, and revoke it if it was ever pushed anywhere.
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
