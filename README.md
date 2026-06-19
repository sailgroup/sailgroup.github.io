# SAIL — Spectroscopy and AI Lab

국민대학교 화학부 **정준영 교수 연구실** 웹사이트.
Live: https://sail.kookmin.ac.kr

---

## 콘텐츠 추가 / 수정

모든 콘텐츠는 `_data/` 폴더의 YAML 파일에 있습니다. GitHub에서 해당 파일을 편집해 커밋하면 약
1분 뒤 사이트에 반영됩니다. 입력 형식이 잘못된 경우(필수 항목 누락, 존재하지 않는 이미지 경로,
날짜 형식 오류 등)에는 빌드 단계에서 검증되어 무엇을 고쳐야 하는지 알려주며, 잘못된 페이지가
게시되지 않습니다.

| 대상 | 파일 |
| --- | --- |
| 논문 | `_data/publications.yml` |
| 멤버·동문 | `_data/people.yml` (`status: current` 또는 `alumni`) |
| 뉴스 | `_data/news.yml` |
| 사진 | `assets/images/photos/` 에 이미지 업로드 후 `_data/photos.yml` |
| 주제(테마) | `_data/themes.yml` — 필터 칩의 개수·색·이름·순서를 한 곳에서 편집 |
| 모집(Positions) | `_data/positions.yml` — 박사후연구원·대학원생·학부 연구생 안내, 학부 모집 프로젝트 |

저자 목록의 PI 이름 `Joonyoung F. Joung` 은 자동으로 굵게 표시됩니다.

### 논문 — `_data/publications.yml` (최신 항목을 위에)
```yaml
- id: 42                       # 필수: 겹치지 않는 새 번호
  title: "논문 제목"            # 필수
  authors: "Joonyoung F. Joung*, Jihwan Kim"   # 필수
  journal: "Nature"            # 필수
  year: 2026                   # 필수 (따옴표 없는 숫자)
  ref: "47, 317-327"           # 선택: 권·페이지를 자유 텍스트로 (예: "Advance Article"). 현재 모든 논문이 이 방식
  doi: "https://doi.org/10.1038/..."           # 선택
  preprint_url: "https://arxiv.org/abs/..."    # 선택 (arXiv/ChemRxiv 자동 판별)
  themes: ["Reaction pathway prediction"]      # 선택: _data/themes.yml 에 있는 이름만
  image: "pub-42.jpg"          # 선택: assets/images/pubs/ 에 업로드
  abstract: "English abstract."                # 선택
  abstract_ko: "한국어 초록."                   # 선택 (초록으로 표시)
```
목록과 상세 페이지(`/publications/42/`)가 자동 생성됩니다. 저자 목록에 멤버 이름이 포함되면 해당
멤버 페이지에도 자동으로 표시됩니다(논문의 저자 표기가 멤버의 `name` 과 정확히 일치해야 함. 다르게
표기됐으면 그 멤버의 `people.yml` 항목에 `author_aliases: ["다른 표기"]` 를 추가).

> **권·호·페이지 자동 서식(선택):** `ref` 대신 `vol:`/`issue:`/`pages:` 를 쓰면 자동으로
> *권* (호), 페이지 형태로 조판됩니다 — 예: `vol: 47`, `issue: 3`, `pages: "317-327"` → *47* (3), 317-327.
> `vol` 이 있으면 `ref` 는 무시되므로 둘 중 하나만 쓰세요.

### 사람 (멤버·동문) — `_data/people.yml`
멤버와 동문을 한 파일에서 관리합니다. `status` 가 **어느 페이지에 뜰지만** 결정합니다.
```yaml
- name: Gildong Hong           # 필수
  status: current              # 필수: current(현재 멤버) 또는 alumni(동문)
  role: M.S. Student           # 필수
  department: School of Artificial Intelligence   # 선택: 본인 소속 학부/학과 (랩 학과와 다를 때 표기)
  name_ko: 홍길동               # 선택
  email: hong@kookmin.ac.kr    # 선택
  photo: gildong-hong.jpg      # 선택: assets/images/ 에 업로드 (정사각형 권장)
  slug: gildong-hong           # 선택: 영문 소문자, 개인 페이지 주소가 됨
  joined: "2026-03-01"         # 선택: YYYY-MM-DD
```
개인 페이지(`/people/gildong-hong/`)와, `status` 에 맞는 그리드(Members 또는 Alumni)에 자동 등록됩니다.
소셜 링크는 실제 URL이 있을 때만: `linkedin:` `github:` `scholar:` `orcid:` `website:`. 논문 저자명이
`name` 과 다르면 `author_aliases: ["다른 표기"]`. 동문은 `note:` 로 한 줄 비고 추가 가능.

> **졸업 처리**: 그 사람의 `status` 를 `current` → `alumni` 로 바꾸기만 하면 됩니다. 개인 페이지
> 주소(`/people/<slug>/`)는 그대로라 **뉴스 등 어디서 건 링크가 절대 안 깨집니다** (기존
> `/members/<slug>/`·`/alumni/<slug>/` 주소도 자동으로 이 페이지로 연결).

**개인 논문**(랩 논문 목록에 없는, 이전 소속 논문 등)은 그 사람 항목에 `publications:` 로 추가합니다.
랩 논문과 합쳐 최신순 정렬, 제목은 DOI로 연결, 본인 이름이 굵게 표시됩니다.
```yaml
  publications:                # 사람 항목 안에 추가
    - title:   "Paper title"
      authors: "Gildong Hong, A. Coauthor"
      journal: "Journal Name"
      year:    2023            # 따옴표 없는 숫자
      doi:     "https://doi.org/10.xxxx/yyyy"   # 선택: 제목이 이 주소로 연결됨
```

### 뉴스 — `_data/news.yml`
```yaml
- date: "2026-06-20"           # 필수: YYYY-MM-DD (최신순 정렬 기준)
  display_date: ""             # 선택: 날짜 대신 표시할 문구 (예: "March 2025", "2026")
  category: award              # people | publication | award | talk | event
  title: "최우수 포스터상 수상"  # 필수
  body: "한두 문장 설명."        # 선택
  link: "/publications/41/"    # 선택: 내부 경로 또는 https 주소
  link_text: "자세히"           # 선택: 링크 라벨 (기본값 "Details")
```
가장 최근 3개는 홈 화면에도 표시됩니다.

### 사진 — `_data/photos.yml` (최신 항목을 위에)
```yaml
- image: photos/photo-26.jpg   # 필수: assets/images/photos/ 에 업로드 (≤1600px)
  title: "2026.06.20. 워크숍"   # 선택
  caption: "한 줄 설명"         # 선택
```

### 모집 — `_data/positions.yml`
모집 안내 페이지(`/positions/`)의 모든 문구가 이 파일에 있습니다. 이 페이지는 **한국어/English 토글**
(헤더 오른쪽 위)이 있어 언어별로 한 블록씩 `langs:` 아래에 둡니다. 각 언어 블록에서 소개글(`intro`),
역할별 안내(`sections`), 학부 모집 프로젝트(`projects`)를 편집합니다. 프로젝트를 추가/삭제하려면
블록을 추가/삭제하면 됩니다. **한국어를 고치면 영어도 같이 고쳐 두 언어가 어긋나지 않게 하세요.**
```yaml
langs:
  - code: ko
    label: 한국어
    guide_phrase: 그룹 가이드        # 본문에서 이 문구가 자동으로 그룹 가이드로 링크됨
    guide_button: 그룹 가이드        # CTA 버튼 라벨
    requires_label: 필요 지식        # 프로젝트 카드의 '필요 지식:' 라벨
    projects_title: 학부 연구생 모집 프로젝트
    intro: "소개 문단."
    sections:
      - title: 대학원생              # 역할 제목
        paragraphs:
          - "문단 1."               # 한 항목이 한 문단
    projects:
      - title: "프로젝트 제목"
        body: "프로젝트 설명."
        requires: "유기화학"
  - code: en                        # 같은 구조의 English 블록
    label: English
    # ...
```
영어 번역본은 작성자가 만든 초안이므로 PI 검수 후 확정하는 것이 좋습니다.

---

## 디자인·서식 바꾸기 (어느 파일을 고치나)

내용(논문·멤버 등)이 아니라 **보이는 모양/서식**을 바꾸려면 아래 파일을 고칩니다. GitHub에서
파일을 열면 **맨 위 주석에 무엇을 하는지와 예시**가 적혀 있으니 그대로 수정 후 커밋하세요.

| 바꾸고 싶은 것 | 파일 |
| --- | --- |
| 논문 서지 형식 (저널·권·페이지 사이 콤마/괄호 등) | `_includes/pub-citation.html` |
| 주제 태그 색·이름·개수·순서 | `_data/themes.yml` |
| 상단 메뉴(네비) 항목 | `_data/navigation.yml` |
| 푸터 내용 | `_includes/footer.html` |
| 논문 목록 한 줄(제목·저자·배지·태그) | `_includes/pub-item.html` |
| 멤버/동문 개인 페이지 카드 | `_includes/person-profile.html` |
| PI 페이지 구성 | `pi.html` |
| 전체 색상·글꼴·간격(디자인 토큰) | `assets/css/main.scss` 맨 위 `:root` |

예) "저널명과 권 사이에 콤마" → `_includes/pub-citation.html` 을 열면 형식 예시와 함께 콤마
위치가 보입니다.

---

## 유지보수

- **Jekyll** + **GitHub Actions** 로 빌드·배포합니다(Pages source = GitHub Actions). 개발 머신에
  로컬 Ruby가 없어 **CI 빌드가 기준**입니다. `dev` 브랜치는 빌드만, `main` 브랜치는 빌드 후 배포.
- 콘텐츠는 전부 `_data/*.yml`. `_plugins/generate_pages.rb` 가 데이터로부터 멤버·동문·논문
  페이지를 생성하고, `_plugins/validate_data.rb` 가 빌드 시 데이터를 검증합니다. 공용 마크업은
  `_includes/` 에 있습니다.
- 주의: `CNAME`(커스텀 도메인) 파일을 삭제하지 마세요. `baseurl` 은 `""` 로 유지합니다.
- 상세 안내는 [`CONTRIBUTING.md`](CONTRIBUTING.md), 설계 결정 기록은 [`DECISIONS.md`](DECISIONS.md)
  를 참고하세요.

## 문의

사이트 관련 문의나 수정 요청은 관리자 **Chanjoong Kim** 에게 연락 주세요.
GitHub [@chanjoongx](https://github.com/chanjoongx) · cj@chanjoongx.com
