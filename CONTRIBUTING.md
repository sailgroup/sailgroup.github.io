# Contributing to the SAIL website

You do **not** need to install anything or know how to code. Every change below
is a single edit to one file on **github.com** (use the pencil ✏️ on the file).
When you commit, GitHub rebuilds and publishes the site
(`https://sail.kookmin.ac.kr`) in about a minute.

If you make a mistake (a missing required field, a typo'd image name, a bad
date), the build **fails with a clear message naming the file and the fix**, and
the live site is left untouched — so you cannot break the site by editing data.

> Bold the PI name **Joonyoung F. Joung** in author lists. House style: no em
> dashes, plain factual wording. Never invent a photo, link, date, or fact —
> leave a field blank instead.

---

## Add a member  →  `_data/members.yml`

1. Add a photo: upload `firstname-lastname.jpg` to `assets/images/` (a square
   photo looks best). This step is optional — without a photo the card shows the
   person's initials.
2. Add one block to `_data/members.yml`:

   ```yaml
   - name: Gil-dong Hong
     name_ko: 홍길동            # optional
     role: M.S. Student
     email: hong@kookmin.ac.kr  # optional
     photo: gil-dong-hong.jpg   # optional; must match the uploaded file
     slug: gil-dong-hong        # lowercase-with-hyphens; gives them a personal page
     joined: "2026-03-01"       # optional, YYYY-MM-DD
   ```

That's it. The member appears on the Members grid **and** gets a personal page
at `/members/gil-dong-hong/` automatically. Optional social links (only with a
real URL): `linkedin:`, `scholar:`, `orcid:`, `website:`.

Required: `name`, `role`. Everything else is optional.

**A member's own papers from elsewhere** (not on the lab Publications page — e.g.
a postdoc's papers from a previous position): add a `publications:` list to that
member's entry. They show on the member's page, merged with any lab papers that
match their name, newest first; the title links to the DOI and the member's own
name is bold.

```yaml
- name: Heejeong Kim
  role: Postdoctoral Researcher
  slug: heejeong-kim
  publications:
    - title:   "A paper from her PhD"
      authors: "Heejeong Kim, A. Advisor"
      journal: "J. Phys. Chem. A"
      year:    2023                 # plain number, no quotes
      doi:     "https://doi.org/10.1021/..."   # optional; the title links here
      preprint_url: "https://arxiv.org/abs/..." # optional
```

`title`, `authors`, `journal`, `year` are required per entry. List only papers
that are **not** already on the lab Publications page (lab papers auto-appear by
author name).

## Add an alumnus  →  `_data/alumni.yml`

Identical to a member. Same fields; add an optional `note:` for a one-line note
(e.g. an exchange program). They appear on the Alumni grid and get a page at
`/alumni/<slug>/`.

## Add a publication  →  `_data/publications.yml`

Add one block (newest go at the top). The paper appears on the Publications
list, gets a detail page at `/publications/<id>/`, and — if an author matches a
current member's name — shows up on that member's page too, all automatically.

```yaml
- id: 42                       # required, a new unique number
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

## Add a news item  →  `_data/news.yml`

Copy any block in the file and edit it. The file's header documents every field.
Minimum:

```yaml
- date: "2026-06-20"           # required, YYYY-MM-DD (controls the order)
  category: award              # people | publication | award | talk | event
  title: "Best poster award"   # required
  body: "One or two sentences." # optional
  link: "/publications/41/"    # optional; internal path or full https URL
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
  `social-links`, `icon`, `structured-data`). Edit a pattern in one place.
- Never delete `CNAME` (the custom domain). `baseurl` stays `""`.
