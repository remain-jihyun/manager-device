# manager-device

## 최상위 규칙 (TOP RULE)
- 이 프로젝트에서 사용자가 무언가를 요청하면 **되묻지 말고 바로 완료**한다. 모든 작업은 사전 승인된 것으로 간주한다.
- 확인/선택 질문(AskUserQuestion 등)을 하지 않는다. 합리적 기본값을 선택해 진행하고, 결과만 보고한다.
- 예외: 되돌릴 수 없는 외부 발행(배포, 푸시, 외부 전송 등)은 사용자가 명시적으로 요청했을 때만 수행한다.

## 실행 방법
- 스택: Vite + React 19 + TypeScript + Tailwind v4 + zustand + react-router
- Node는 `~/.local/bin`에 설치됨 (v22.14.0). 명령 실행 시 `export PATH="$HOME/.local/bin:$PATH"` 필요.
- 개발 서버: `npm run dev` (보통 http://localhost:5175/), 브라우저로 띄워서 확인.
- node_modules를 다른 머신에서 복사하면 macOS 보안 정책에 막히므로, 그럴 경우 `rm -rf node_modules package-lock.json && npm install`로 재설치.
- **로그인 세션은 저장하지 않는다**(`authStore` 메모리 전용). 앱을 열면 항상 `/login` 이 첫 화면이다.

## 디자인시스템 (2026-08-03 적용)

- 색·서체·라운드는 **`src/index.css` 의 `@theme` 블록이 단일 출처**다.
  화면에서 새 색을 하드코딩하지 말고 기존 유틸리티 클래스(`bg-green-800`, `text-gray-500` …)를 쓴다.
  램프 값 자체가 디자인시스템 값으로 치환돼 있다.
- primary = `green-800`(#0D5611), pressed = `green-900`(#0A420D), 라인 = `green-300`(#CADACB).
- 카드 `rounded-2xl`(12) · 컨트롤 `rounded-xl`(10) · 소형 `rounded-lg`(8) 3단 체계.
- 서체는 Pretendard(`index.html` CDN). 매핑표·근거는 `docs/디자인시스템-적용.md`.
- Figma 원본: 리뉴얼 `640AQgEweSAaKFEvY9ws2B` / 디자인시스템 `JaaZot08P8yzSpt8yp5Otq`.

### 다른 프로젝트 디자인시스템과의 관계 (2026-08-06 정리)

- 집반찬연구소는 **폼팩터마다 디자인 시스템이 다르다.** 이 프로젝트는 **[AI] 앱 디자인시스템**만 따른다.
  - 관리 웹 `mes-v2` → Z-MIS 디자인시스템 (`ffI4wgzbNrnhqt05a47SUe`)
  - 현장 단말 `field-device` → zpps 디자인시스템 (`kfvJPr0tTodqQry5TGT9DZ`)
- **공유하는 것**: primary green `#0D5611`, 서체 Pretendard, 오류색 `#C91B1B` 계열.
- **공유하지 않는 것**: 컨트롤 높이·라운드 체계·타입 스케일·컴포넌트 규격.
  mes-v2 의 컴포넌트(버튼 40px, 카드 radius 12 …)를 여기로 가져오지 않는다. 반대도 마찬가지다.
- 값을 바꿔야 하면 **Figma 를 먼저 고치고** `src/index.css` 에 반영한다. 화면에서 색을 하드코딩하지 않는다.
- 전체 지도는 상위 `../CLAUDE.md` 의 "디자인 시스템" 절 참고.

## 다른 프로젝트와의 관계 (시스템 경계)

> 전체 시스템 지도는 상위 폴더의 `../CLAUDE.md` 참고.

- 이 프로젝트는 **실행 단말 A**다. 관리직/현장직이 로그인해 업무를 실행하는 화면을 담당한다.
- **중앙 관리는 `mes-v2`(Source of Truth)** 다. 업무 유형·기준정보·관리 로직·작업지시·간반 발행은 전부 mes-v2 소관이다.
- 이 프로젝트에서는 **유형/기준정보를 새로 정의하거나 관리 화면을 만들지 않는다.** mes-v2가 발행한 데이터를 소비·실행·표시만 한다.
- 데이터는 mes-v2의 REST/WebSocket API를 통해 주고받는다. DB에 직접 붙지 않는다.
- 필요한 데이터·필드가 API에 없으면 여기서 임시로 만들지 말고 **mes-v2에 추가**한다.
- `field-device`는 이 프로젝트와 **다른 업무**를 하는 별도의 실행 단말이다. 서로의 코드를 섞지 않는다.

## 생산 지시·실적 (2026-08-03 화면 제거)

- **`/work-orders`(작업지시 배포)와 `/approvals`(실적 승인)는 화면에서 내렸다.**
  홈 바로가기·메뉴 타일·라우트를 모두 제거했다. 되살릴 때는 `App.tsx` 라우트와
  `MenuPage.MENU_ITEMS`, `HomePage` 바로가기 블록을 복구하면 된다.
  페이지 소스(`src/pages/WorkOrderPage.tsx`, `ApprovalPage.tsx`)와
  API(`src/api/mes.ts`)는 남겨뒀다 — 지우지 말 것.
- API 클라이언트: `src/api/mes.ts`. 이 단말은 `X-Role: MANAGER` 로 호출한다.
- **간반 상태값은 `준비|대기|작업|완료` 4종**이다. 예전에 쓰던 `'done'`·`'in-progress'` 는
  폐기됐다. 화면에서 자체 상태 체계를 만들지 않는다.
- `HomePage`·`TeamDetailPage` 는 하드코딩 mock 을 버리고 mes-v2 집계·간반 API를 읽는다.

## CCP 점검 항목의 주인은 mes-v2 다

- `/ccp` 화면의 점검 입력 항목은 **유형(가열·소독헹굼·금속검출 …)마다 다르다.**
  `src/constants/ccpData.ts` 의 `getCCPCheckItems(유형명)` 으로 가져온다.
- 이 상수는 **mes-v2 `/system/ccp`(CCP 설정)의 미러**다. 항목을 여기서 새로 정의하지 않는다.
  원본: `../mes-v2/frontend-next/src/lib/ccp-settings-store.ts` 의 `SEED_TYPES`.
  바꿔야 하면 mes-v2 를 먼저 고치고 이 파일을 맞춘다. (반대 방향 금지)
- API 연동 전까지의 임시 미러다. 연동되면 이 상수는 사라진다.

## 로그인 수단 = 역할 (2026-08-10)

- 이 단말은 **반장과 사무관리자가 함께 쓰는 공용 단말**이다. 로그인 수단이 곧 역할이다.
  - **카카오 로그인 → 반장(`FOREMAN`)**, 서버 헤더 `X-Role: MANAGER`
  - **이메일(Google) 로그인 → 사무관리자(`OFFICE`)**, 서버 헤더 `X-Role: OFFICE`
- 단일 출처는 `src/store/authStore.ts` 의 `UserRole` · `serverRoleOf()` · `isOffice()` 다.
  화면에서 이름·부서 문자열로 역할을 추측하지 않는다.

## 안돈 — 반장 보고 → 사무관리자 확인 (2026-08-10 정책 변경)

- **확인 완료 처리는 사무관리자만** 한다. 반장은 이슈를 올리는 것까지다.
- **반장 화면에 발생 내역을 늘어놓지 않는다.** 안돈은 현장에서 눈으로 본다. 단말에는
  **[이슈 올리기] 버튼 하나**만 두고, 눌러서 **바코드 스캔 → 사진 → 내용**을 넣고 저장한다.
  (발생 위치·설비·로트·관리기준 같은 카드를 반장 화면에 두지 말 것 — 2026-08-10 지적사항)
  - 서버는 같은 유형의 미확인(`OPEN`) 발생 건이 있으면 거기에 붙이고, 없으면 새 건을 만든다
    → `REPORTED` (`POST /api/andon/issues`)
  - 사무관리자: 올라온 이슈를 **확인(`NO_ISSUE`) / 이슈 있음(`ISSUE`, 메모 필수)** 으로 종결
    → `CONFIRMED`
  - 품질 대시보드에는 어느 쪽 처리 수단도 없다(표시 전용).
- 메뉴 배지는 **사무관리자에게만** 뜬다(확인 대기 = `REPORTED`). 반장은 처리 대기가 없다.
- 관련 파일: `src/api/andon.ts`, `src/store/andonStore.ts`, `src/hooks/useAndonPoller.ts`,
  `src/pages/AndonPage.tsx`(`IssueSheet` / `ConfirmSheet`), 라우트 `/andon/:slug`
  (`foreign` | `metal` | `weight`)
- `/menu` 상단 "안돈 현황"(`src/pages/MenuPage.tsx`)에서 3종의 미확인 건수·최근 발생을 바로 본다.
  라벨·반·설비 문구는 API(`GET /api/andon/types`)에서 오고, 화면은 아이콘/순서만 갖는다.
- 데이터 계약: `../mes-v2/docs/계약/API_계약_안돈.md` (mes-v2 소유). 유형·필드는 여기서 정의하지 않는다.
- API 주소는 `VITE_MES_API_BASE` 로 바꿀 수 있다 (기본 `http://localhost:4000`).
