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
   looks best). Without a photo the card shows the person's initials; a generic
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
  themes: ["Reaction pathway prediction"]    # optional topic tags (filter chips)
  image: "pub-42.jpg"          # optional; upload to assets/images/pubs/
  abstract: "English abstract."        # optional; shown on the detail page
  abstract_ko: "한국어 초록."           # optional; shown as 초록
```

Only `id`, `title`, `authors`, `journal`, `year` are required. A journal with no
logo in `_data/journal_logos.yml` simply shows no logo (add a line there to fix).

`ref` is free text for the volume/pages (e.g. `"47, 317-327"` or `"Advance
Article"`), which is how every current paper is written. Alternatively use the
structured `vol:` / `issue:` / `pages:` to get an auto-formatted *vol* (issue),
pages line; `vol` takes precedence over `ref` when both are present.

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

1. Upload your image to `assets/images/photos/` (e.g. `photo-26.jpg`, ≤1600 px).
2. Add a block to `_data/photos.yml` (newest first):

   ```yaml
   - image: photos/photo-26.jpg
     title: "2026.06.20. Lab dinner"   # optional caption title
     caption: "At the restaurant"      # optional caption line
     alt: "Lab dinner, June 2026"      # optional; describes the image
   ```

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
- Shared rendering lives in `_includes/` (`person-card`, `person-profile`,
  `member-pubs`, `pub-item`, `pi-authors`, `preprint-badge`, `journal-covers`,
  `news-date`, `social-links`, `icon`, `structured-data`). Edit a pattern in one place.
- Never delete `CNAME` (the custom domain). `baseurl` stays `""`.
