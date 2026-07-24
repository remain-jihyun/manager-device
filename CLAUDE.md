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

## 다른 프로젝트와의 관계 (시스템 경계)

> 전체 시스템 지도는 상위 폴더의 `../CLAUDE.md` 참고.

- 이 프로젝트는 **실행 단말 A**다. 관리직/현장직이 로그인해 업무를 실행하는 화면을 담당한다.
- **중앙 관리는 `mes-v2`(Source of Truth)** 다. 업무 유형·기준정보·관리 로직·작업지시·간반 발행은 전부 mes-v2 소관이다.
- 이 프로젝트에서는 **유형/기준정보를 새로 정의하거나 관리 화면을 만들지 않는다.** mes-v2가 발행한 데이터를 소비·실행·표시만 한다.
- 데이터는 mes-v2의 REST/WebSocket API를 통해 주고받는다. DB에 직접 붙지 않는다.
- 필요한 데이터·필드가 API에 없으면 여기서 임시로 만들지 말고 **mes-v2에 추가**한다.
- `field-device`는 이 프로젝트와 **다른 업무**를 하는 별도의 실행 단말이다. 서로의 코드를 섞지 않는다.
