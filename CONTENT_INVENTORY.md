# CONTENT_INVENTORY.md

Audit trail for content migrated from the live lab site
(`sailabjfjoung.wixsite.com/sail`) into this repository. Extraction done in
Phase 0 on 2026-06-13. Raw scrapes and original-resolution images are archived
locally under `_source/` (gitignored); this file is the committed record of what
was taken, what was normalized, and what is still open.

## Migrated into `_data/`

| File | Content | Notes |
|------|---------|-------|
| `publications.yml` | 41 papers (id 1–41), newest first | Provided list, authoritative. Fields are display-ready; `themes` are SAIL tags; `image` set for all 41 to the paper's own graphical abstract (`pub-<id>.jpg`, see D15); `abstract` (cleaned English) and `abstract_ko` (Korean) set for all 41 (D20), shown on the per-paper detail pages. |
| `pi.yml` | PI profile, CV, links | Joonyoung F. Joung. Education, appointments, Scholar, ORCID. |
| `members.yml` | 5 current members | Name, role, email, photo, slug only. No bios/links on source. Each entry's `/members/<slug>/` page is generated from this file (Phase 11, D22) — no stub file. |
| `alumni.yml` | 6 alumni | All UROP undergraduates at Kookmin. Real ID photo + slug for each (harvested from the live `/alumni-1` page, Phase 7); each `/alumni/<slug>/` page is generated from this file (Phase 11, D22). |
| `research.yml` | Overview + 4 areas | Area bodies verbatim (EN + KO); overview factualized. |
| `covers.yml` | 4 journal covers | Mapped to publication ids 17, 25, 30, 35. |
| `home.yml` | Hero + contact block | Factual hero copy; KR + EN address. |

## Images staged (`_source/images/`, copied to `assets/images/` during build)

- PI portrait: `pi.jpg` (real). Decorative banner: `pi-alt.png`.
- Member portraits (real): `heejeong-kim.jpg`, `hyejeong-jeon.jpg`,
  `jihwan-kim.jpg`, `siyeol-in.jpg`, `seonbin-kim.jpg`.
- Journal covers (original resolution): `cover-17-njc-2020.jpg`,
  `cover-25-jacsau-2021.jpg`, `cover-30-jcim-2022.jpg`,
  `cover-35-acscentsci-2025.jpg`.
- `home-1.jpg` / `home-6.jpg` are an identical Wix stock teal hero graphic; not
  reused. A custom hero is designed instead.
- **Publication thumbnails** (`assets/images/pubs/pub-1.jpg … pub-41.jpg`): each
  paper's real graphical abstract / TOC figure from the publisher of record by
  DOI, normalized to a uniform 360×270 white thumbnail (D15). ~552 KB total.
- **Photos** (`assets/images/photos/photo-01.jpg … photo-25.jpg`): the full 25
  genuine Wix gallery photos, bounded to ≤1600 px, with their verbatim bilingual
  captions stored in `_data/photos.yml` (D16). Full-res originals archived under
  `_source/images/photos/`.
- **Kookmin marks**: `kmu-emblem.png` (transparent emblem extracted from the gray
  signature asset, used in the header beside the SAIL wordmark) and
  `kookmin-logo.png` (footer wordmark). Favicon/PWA set built from the emblem on a
  circular white disc: `favicon.ico` (+ root copy), `favicon-16.png`,
  `favicon-32.png`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png` (D17).
- **Home architecture figure** (`assets/images/home-architecture.png`): panel (c),
  the model-architecture row, cropped from Fig. 1 of the lab's FlowER paper
  (Nature, 2025, DOI 10.1038/s41586-025-09426-9) for the hero band (D17). Reused on
  the research page for the Chemical Reaction Prediction area.
- **Alumni portraits** (real): `chanjoong-kim.jpg`, `yongpyo-cho.jpg`,
  `jinwoo-lee.jpg`, `hanbyul-baik.jpg`, `hyojin-lee.jpg`, `yumin-kim.jpg` — the ID
  photos from the live `/alumni-1` page, center-cropped to squares (JPEG q88),
  Phase 7 (D18).
- **Research-area figures** (`assets/images/research-properties.jpg`,
  `research-denovo.jpg`, `research-database.jpg`): a real figure from one of the
  lab's own papers per area (JACS Au 2021, ACS Cent. Sci. 2025, Sci. Data 2020; the
  reaction area reuses `home-architecture.png`), harvested by DOI, Phase 7 (D18).
- **Social card** (`assets/images/og-image.png`): a generated 1200×630 Open Graph /
  Twitter card (dark ground, orange glow, SAIL wordmark, "Joonyoung F. Joung Lab ·
  Department of Applied Chemistry", Kookmin mark, domain pill), wired site-wide via a
  `_config.yml` `image` default so every page emits `og:image`/`twitter:image`,
  Phase 8 (D19). Not lab content; a branded link-preview asset.
- **Header wordmark transparency** (`assets/images/sail-logo.png`): the SAIL wordmark
  shipped with an opaque white background, which showed as a white box where the
  translucent sticky header met the dark footer on mobile. It was made transparent by
  an unpremultiply-from-white pass (it renders identically over white, letterforms
  only over dark), Phase 8 (D19). The white-background original is archived as
  `_source/images/sail-logo-white-bg.png`.

## Normalizations and corrections (no source facts invented)

- **Department**: used "Department of Applied Chemistry" (official). One RSC
  footnote on the source said "Department of Chemistry"; not used.
- **Inha University city**: the live PI page reads "Inha University, Seoul".
  Inha University is in Incheon, not Seoul. Stored as "Inha University" with no
  city to avoid propagating the error.
- **Roles**: source labels "Master course" -> "M.S. Student"; "UROP" ->
  "Undergraduate Researcher (UROP)". Meaning unchanged.
- **Overview copy**: source marketing phrasing ("pioneering", "complex
  problems") dropped; factual wording with the same meaning. Research-area
  bodies kept verbatim.

## Open items / flags (carried to later phases)

- **Per-paper figures**: ~~all 41 papers have `image: ""`~~ **RESOLVED (Phase 6,
  D15).** All 41 now carry their real graphical abstract from the publisher of
  record (`assets/images/pubs/pub-<id>.jpg`). No placeholder/fake figures: every
  thumbnail is the paper's own published abstract/TOC graphic. The thumbnails were
  hidden on phones through Phase 7 and are now shown on mobile as well (64×48),
  Phase 8 (D19).
- **Single-theme publications**: entries tagged with one theme are flagged
  "verify" in `publications.yml` NOTES; re-check against "More Info" subpages in
  Phase 5.
- **PI office**: "Rm 229, College of Law" kept verbatim from the live site;
  unusual for an Applied Chemistry appointment. Verify in Phase 5.
- **Joke alumni excluded**: "Rosua Chung / 정개념" (PhDog Graduate) and
  "Camus Chung / 정까뮈" (PostDOGtoral Fellow) are on the source Alumni list as
  jokes. Excluded from `alumni.yml`; logged for a human decision in REVIEW.md.
- **Members sparse**: no bios, interests, or external links on source. Personal
  pages (members, Phase 3; alumni, Phase 7) are intentionally minimal — a centered
  card with photo, name, role, and contact — until more is provided.
- **Alumni photos**: ~~none on source~~ **RESOLVED (Phase 7, D18).** The live
  `/alumni-1` page does carry an ID photo for each of the 6; all were harvested and
  wired into the cards and personal pages. No faces invented.
- **Kookmin logo**: ~~official dark mark not yet staged~~ **RESOLVED.** The footer
  uses the official Kookmin English wordmark (D14); Phase 6 additionally extracted
  the Kookmin emblem to a transparent PNG for the header and built the circular
  favicon/PWA icon set from it (D17).
- **Paper abstracts**: ~~not migrated~~ **RESOLVED (Phase 9, D20).** All 41 papers
  now carry a cleaned-English `abstract` and a Korean `abstract_ko`, sourced from
  publisher/aggregator full text (Semantic Scholar, OpenAlex, CrossRef, publisher
  pages) and shown on `/publications/:id/`. No abstract invented; the Korean is a
  faithful translation (machine translation acceptable per the PI). Scientific
  notation normalized to Unicode (μm, ×, π-π, Förster, ΔpKb, °C, ν0-n).
- **Member publications auto-list**: each member page lists papers from
  `publications.yml` whose author list contains the member's name or an
  `author_aliases` entry (D20). None of the 5 current members is yet an author on
  the 41 listed papers, so every member's list is empty today; it populates
  automatically when a member's paper is added (set `author_aliases` if they
  published under a name variant).
- **News feed seed (Phase 10, D21)**: `_data/news.yml` is seeded only from real,
  datable events — 5 member arrivals, the 3 2026 papers, and the March 2025 lab
  opening. **Gap:** Heejeong Kim (postdoctoral researcher) has no join date on the
  source, so she has no "joins the lab" news entry; add one if a date is provided.
  Award and talk categories exist in the template but have no entries yet (none on
  record). Nothing in the feed was invented.
- **Positions page (D33; Korean-only again per D35)**: new content (not migrated from
  Wix). The Korean copy in `_data/positions.yml` was supplied verbatim by the PI; shown
  at `/positions/`. The English toggle added in D34 was removed at the PI's request. The
  advertised-project cards are now an optional `projects` list on any role section
  (PI-maintained, changes over time). The contact CTA reuses the PI email from `pi.yml`;
  nothing on the page was invented.
