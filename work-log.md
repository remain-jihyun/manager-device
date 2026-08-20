# work-log.md

작업 지시: A(Figma 리뉴얼 파일) 분석 → B(Figma 디자인시스템 파일) 생성 → C(manager-device) 적용

## 2026-08-03

### 차단 발생: Figma 접근 경로 전무

STEP 1(A 파일 읽기) 착수 불가. 세 경로 모두 확인 후 실패.

| # | 경로 | 확인 방법 | 결과 |
|---|------|-----------|------|
| 1 | Figma MCP 툴 | ToolSearch `+figma`, `get_variable_defs / get_metadata / get_screenshot`, `design file node code connect` — 3회 질의 | 0건. `mcp__figma__*` 툴 세션에 미노출 |
| 2 | Chrome 브라우저 자동화 | `tabs_context_mcp{createIfEmpty:true}` | `Browser extension is not connected` |
| 3 | Figma REST API | `env \| grep -i figma`, `~/.zshrc`·`~/.zprofile`·`.env` 내 `FIGMA_TOKEN\|PAT\|ACCESS` 검색 | 토큰 없음 |

참고: `claude mcp list` 는 `claude.ai Figma: https://mcp.figma.com/mcp - ✔ Connected` 를 보고하지만,
계정 레벨 커넥터가 이 CLI 세션의 툴 목록으로 내려오지 않음. 세션 재시작 후에도 동일.

### 판단

- A를 한 글자도 읽지 못한 상태 → `design-analysis.md` 작성 시 100% 추측이 됨.
- 지시서 "추측 금지. 실제로 읽은 값만" 위반이므로 **작성하지 않음**.
- STEP 1 미통과 → STEP 2·3 진행 조건 불충족. 중단.
- A 파일은 열지도 못했으므로 수정 위험 0. (규칙 4 자동 준수)

### 차단과 무관하게 수행한 것

C(manager-device)의 현재 스타일 전수 인벤토리를 작성. A/B 없이도 확정 가능하며,
STEP 3 재개 시 "교체 대상 목록"과 "적용률 산출의 분모"로 그대로 사용 가능.
→ `c-style-inventory.md`

### 재개 조건

1. Claude Code 완전 종료 후 재시작 → `/mcp` 에서 Figma 툴 노출 확인
2. 또는 로컬 등록: `claude mcp add --transport http figma https://mcp.figma.com/mcp`
   (+ Figma 데스크톱 앱 실행, Preferences → Dev Mode MCP Server ON)
3. 또는 Figma Personal Access Token 발급 후 `FIGMA_TOKEN` 환경변수 설정 (REST 폴백)

위 중 하나 충족되면 STEP 1부터 그대로 재개.
