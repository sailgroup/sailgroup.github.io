# SAIL — Spectroscopy and AI Lab

국민대학교 응용화학부 **정준영 교수 연구실** 웹사이트
🔗 **Live:** https://sail.kookmin.ac.kr

---

## ✏️ 콘텐츠 추가하기 (코딩 필요 없음)

GitHub에서 아래 파일을 연필(✏️) 아이콘으로 열어 한 곳만 수정하고 **Commit** 하면,
약 1분 뒤 사이트에 자동 반영됩니다. 실수(필수 항목 누락·오타난 이미지 이름·잘못된
날짜)가 있으면 **빌드가 막히고 어디를 고치라고 알려주므로, 사이트가 깨지지 않습니다.**

| 추가할 것 | 수정할 파일 |
| --- | --- |
| 논문 | `_data/publications.yml` |
| 멤버 | `_data/members.yml` |
| 동문 | `_data/alumni.yml` |
| 뉴스 | `_data/news.yml` |
| 사진 | 이미지 업로드 + `_data/photos.yml` |

규칙: 저자 목록의 PI 이름 **Joonyoung F. Joung** 은 자동으로 굵게 표시됨 · 사진·링크·날짜는
지어내지 말고 모르면 비워두기.

### 논문 추가 → `_data/publications.yml` (맨 위에 추가)
```yaml
- id: 42                       # 필수: 겹치지 않는 새 번호
  title: "논문 제목"            # 필수
  authors: "Joonyoung F. Joung*, Jihwan Kim"   # 필수
  journal: "Nature"            # 필수
  year: 2026                   # 필수
  ref: "12, 345"               # 선택: 권/페이지
  doi: "https://doi.org/10.1038/..."           # 선택
  preprint_url: "https://arxiv.org/abs/..."    # 선택 (arXiv/ChemRxiv 자동 판별)
  themes: ["Reaction pathway prediction"]      # 선택: 필터 태그
  image: "pub-42.jpg"          # 선택: assets/images/pubs/ 에 업로드
  abstract: "English abstract."                # 선택
  abstract_ko: "한국어 초록."                   # 선택 (초록으로 표시)
```
→ 목록·상세페이지(`/publications/42/`)에 자동 추가됩니다. **저자에 멤버 이름이 들어 있으면
그 멤버 페이지에도 자동으로 뜹니다** (이름이 멤버의 `name`과 똑같아야 함).

### 멤버 추가 → `_data/members.yml`
```yaml
- name: Gildong Hong           # 필수
  role: M.S. Student           # 필수
  name_ko: 홍길동               # 선택
  email: hong@kookmin.ac.kr    # 선택
  photo: gildong-hong.jpg      # 선택: assets/images/ 에 업로드 (정사각형 추천)
  slug: gildong-hong           # 선택: 영문-소문자, 개인 페이지가 생김
  joined: "2026-03-01"         # 선택: YYYY-MM-DD
```
→ 멤버 그리드와 개인 페이지(`/members/gildong-hong/`)가 자동 생성됩니다.
선택 링크(실제 URL 있을 때만): `linkedin:` `scholar:` `orcid:` `website:`.
논문 저자명이 멤버 `name`과 다르게 적혀 있으면 `author_aliases: ["다른 표기"]` 추가.

**개인 논문 추가** (랩 논문 목록에 없는, 예전 소속에서 쓴 논문 등): 그 멤버 항목 안에
`publications:` 를 넣으면 개인 페이지에 표시됩니다. 랩 논문(이름이 일치하는)과 합쳐서
최신순으로 정렬되고, 제목은 DOI로 연결되며 본인 이름이 굵게 표시됩니다.
```yaml
- name: Heejeong Kim
  role: Postdoctoral Researcher
  slug: heejeong-kim
  publications:                 # 선택: 본인 논문 목록
    - title:   "Paper from her PhD"
      authors: "Heejeong Kim, A. Advisor"
      journal: "J. Phys. Chem. A"
      year:    2023             # 따옴표 없는 숫자
      doi:     "https://doi.org/10.1021/..."   # 선택: 제목이 여기로 연결됨
```

### 동문 추가 → `_data/alumni.yml`
멤버와 동일. 한 줄 비고가 필요하면 `note:` 추가. `/alumni/<slug>/` 페이지가 생깁니다.

### 뉴스 추가 → `_data/news.yml`
```yaml
- date: "2026-06-20"           # 필수: YYYY-MM-DD (정렬 기준, 최신순)
  category: award              # people | publication | award | talk | event
  title: "최우수 포스터상 수상"  # 필수
  body: "한두 문장 설명."        # 선택
  link: "/publications/41/"    # 선택: 내부 경로 또는 https 주소
```
→ 최신 3개는 홈에도 표시됩니다.

### 사진 추가 → 이미지 업로드 + `_data/photos.yml` (맨 위에 추가)
```yaml
- image: photos/photo-26.jpg   # 필수: assets/images/photos/ 에 업로드 (≤1600px)
  title: "2026.06.20. 회식"     # 선택
  caption: "식당에서"           # 선택
```

---

## 유지보수 (개발자용)
- **Jekyll** + **GitHub Actions** 빌드/배포 (Pages source = Actions). 로컬 Ruby 없음 →
  **CI가 빌드의 기준**. `dev`는 빌드만, `main`은 빌드+배포.
- 모든 콘텐츠는 `_data/*.yml`. `_plugins/generate_pages.rb`가 데이터에서 페이지를 생성하고,
  `_plugins/validate_data.rb`가 빌드 시점에 데이터를 검사합니다. 공용 마크업은 `_includes/`.
- ⚠️ `CNAME`(커스텀 도메인) 삭제 금지 · `baseurl`은 `""` 유지.
- 더 자세한 안내: [`CONTRIBUTING.md`](CONTRIBUTING.md) · 설계 결정: [`DECISIONS.md`](DECISIONS.md)
