# C (manager-device) 현재 스타일 전수 인벤토리

STEP 3 재개 시 "교체 대상 목록" 및 "적용률 산출의 분모"로 사용.
전부 실제 소스에서 grep 으로 읽은 값. 추정치 없음.

- 스택: React 19 + Vite 8 + **Tailwind CSS v4** (`@tailwindcss/vite`), zustand, react-router-dom 7
- 소스 파일: `src/**` 중 `.ts/.tsx/.css` 50개
- 테마 정의 파일: **없음.** `src/index.css` 는 `@import "tailwindcss"` 한 줄 + 리셋/디바이스프레임만.
  → `@theme` 블록도, CSS 변수 토큰도 현재 0개. 모든 색이 유틸리티 클래스로 인라인 하드코딩.

---

## 1. 색상

### 1-1. Tailwind 색상 유틸리티 (하드코딩 본체)
- **총 출현 1,351회 / distinct 105종**

상위 40종:

| 클래스 | 횟수 | | 클래스 | 횟수 |
|---|---:|---|---|---:|
| text-gray-400 | 183 | | bg-green-100 | 14 |
| bg-white | 119 | | text-red-600 | 14 |
| border-gray-200 | 92 | | text-green-900 | 13 |
| text-white | 76 | | border-green-900 | 13 |
| bg-gray-50 | 73 | | text-green-600 | 12 |
| text-gray-900 | 69 | | bg-red-50 | 12 |
| text-gray-500 | 45 | | text-amber-600 | 10 |
| border-gray-100 | 44 | | bg-gray-200 | 9 |
| bg-green-900 | 40 | | bg-blue-50 | 9 |
| bg-gray-100 | 40 | | text-blue-700 | 8 |
| text-green-800 | 34 | | text-amber-700 | 8 |
| text-red-500 | 31 | | border-red-200 | 8 |
| bg-green-800 | 29 | | bg-red-500 | 8 |
| text-gray-600 | 25 | | bg-red-100 | 8 |
| text-gray-800 | 24 | | bg-amber-50 | 8 |
| text-gray-700 | 22 | | text-red-700 | 6 |
| bg-green-50 | 21 | | divide-gray-100 | 6 |
| text-green-700 | 20 | | border-green-200 | 6 |
| border-green-800 | 18 | | border-gray-300 | 6 |
| text-gray-300 | 16 | | (이하 65종 ≤5회) | |
| bg-black | 16 | | | |

**읽어낸 역할 분포 (실제 사용 패턴 기준)**
- 브랜드/포인트: `green-800 / green-900` 계열 (배경·보더·텍스트 총 147회) → C의 사실상 primary
- 중립 배경: `bg-white`(119), `bg-gray-50`(73), `bg-gray-100`(40)
- 본문/보조 텍스트: `text-gray-900`(69, 강조) / `text-gray-400`(183, 최다·플레이스홀더성) / `500·600·700·800`
- 보더: `border-gray-200`(92), `border-gray-100`(44), `border-gray-300`(6)
- 상태: red(경고/실패, ~90회), amber(주의, ~30회), blue(정보, ~25회)

### 1-2. HEX 리터럴 — 총 28회 / distinct 15종

| HEX | 횟수 | 위치·용도 (확인된 것) |
|---|---:|---|
| `#8900ff` | 10 | LoginPage 등 — 보라 포인트 |
| `#eee6ff` | 3 | 보라 연한 배경 |
| `#00c2ff` | 2 | 시안 포인트 |
| `#000` | 2 | — |
| `#fff` | 1 | — |
| `#fee500` | 1 | 카카오 브랜드 |
| `#fbbc05` `#ea4335` `#4285f4` `#34a853` | 각 1 | Google 브랜드 4색 |
| `#f0f0f0` | 1 | `index.css` body 배경 |
| `#9135ff` `#e8d000` `#00d8ff` `#1a1a1a` | 각 1 | — |

⚠️ **주의**: `#8900ff` 보라 계열(총 14회)과 Tailwind `green-800/900` 브랜드 계열이 **공존**함.
두 개가 서로 다른 브랜드 방향이라 B 토큰 매핑 시 어느 쪽이 primary 인지 결정 필요 → 사용자 판단 대상.
Google/카카오 6색은 **써드파티 브랜드 색이므로 토큰화 대상 아님** (원값 유지해야 함).

---

## 2. 타이포그래피

- 폰트 패밀리: `index.css` body 에 시스템 스택 1종만
  `-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans KR', sans-serif`
  → 웹폰트 로드 없음. Pretendard 등 커스텀 폰트 미적용.
- 사이즈 (총 318회): `text-sm` 167 · `text-xs` 114 · `text-base` 13 · `text-lg` 8 · `text-xl` 6 · `text-2xl` 6 · `text-4xl` 3 · `text-3xl` 1
- 웨이트 (총 296회): `font-bold` 265 · `font-semibold` 13 · `font-normal` 11 · `font-medium` 6 · `font-extrabold` 1
- 행간(leading-*): 별도 지정 거의 없음 — Tailwind 기본값에 의존
- **관찰**: sm/xs 두 사이즈가 전체의 88%, bold 가 웨이트의 89%. 위계가 사이즈보다 **굵기 대비**로 표현되고 있음.

---

## 3. 라운드

| 클래스 | 횟수 |
|---|---:|
| rounded-2xl | 113 |
| rounded-xl | 59 |
| rounded-full | 46 |
| rounded-lg | 11 |
| rounded-md | 7 |
| rounded-3xl | 4 |
| rounded / rounded-bl / rounded-t | 5 |

→ 카드류 `2xl`, 버튼·인풋류 `xl`, 뱃지·아바타 `full` 로 사실상 3단 체계.

## 4. 섀도우

- `index.css` `#root` 에 `box-shadow: 0 12px 40px rgba(0,0,0,0.14)` — 디바이스 프레임 전용 1건
- 컴포넌트 레벨 `shadow-*` 유틸리티는 색상 grep 에서 분리 미집계 → STEP 3 재개 시 별도 확인 필요 (**확인 불가**)

## 5. 레이아웃 제약

- 앱 프레임 고정: `#root` = **360 × 780px** (6인치 디바이스 목업), `overflow: hidden`
- 반응형: `max-height:800px` / `max-width:360px` 2개 미디어쿼리만

---

## 6. 화면별 하드코딩 밀도 (STEP 3 처리 순서 = 이 순서)

| # | 화면 | 색상 클래스 | HEX |
|---|---|---:|---:|
| 1 | pages/InventoryPage.tsx | 210 | 0 |
| 2 | pages/ReceivingPage.tsx | 142 | 0 |
| 3 | pages/InspectionPage.tsx | 132 | 0 |
| 4 | pages/CCPPage.tsx | 107 | 0 |
| 5 | pages/ClosingPage.tsx | 104 | 0 |
| 6 | pages/RegisterPage.tsx | 102 | 0 |
| 7 | pages/DisposalPage.tsx | 98 | 0 |
| 8 | pages/AndonPage.tsx | 78 | 0 |
| 9 | pages/WorkOrderPage.tsx | 55 | 0 |
| 10 | pages/HomePage.tsx | 46 | 0 |
| 11 | pages/TeamDetailPage.tsx | 45 | 0 |
| 12 | pages/ApprovalPage.tsx | 41 | 0 |
| 13 | pages/LoginPage.tsx | 27 | **7** |
| 14 | pages/MenuPage.tsx | 12 | 0 |
| 15 | pages/ChatPage.tsx | 7 | 0 |
| 16 | pages/CCPSettingsPage.tsx | 7 | 0 |

공용 컴포넌트:

| 파일 | 색상 클래스 |
|---|---:|
| components/MenuSheet.tsx | 34 |
| components/closing/HaccpChecklists.tsx | 25 |
| components/closing/CategorySection.tsx | 15 |
| components/closing/CheckItemRow.tsx | 13 |
| components/closing/OXToggle.tsx | 12 |
| components/closing/PhotoInput.tsx | 9 |
| components/BottomNav.tsx | 6 |
| components/closing/NumberInput.tsx | 4 |
| components/closing/MultiNumberInput.tsx | 4 |
| components/TopBar.tsx | 4 |
| components/closing/TimeInput.tsx | 3 |
| layouts/AppLayout.tsx | 1 |

**적용률 분모 = 1,351 (색상 클래스) + 22 (써드파티 브랜드색 6건 제외한 HEX)**

---

## 7. STEP 3 재개 시 권장 방식

Tailwind v4 이므로 Figma Variable → `src/index.css` 의 `@theme` 블록으로 매핑하는 것이 정석:

```css
@import "tailwindcss";
@theme {
  --color-primary-500: <B의 color/primary/500>;
  --radius-card: <B값>;
}
```

그 후 각 화면의 `bg-green-800` → `bg-primary-800` 식으로 치환.
단, **B가 아직 비어 있어 매핑 대상 토큰이 존재하지 않으므로 현재 착수 불가.**
