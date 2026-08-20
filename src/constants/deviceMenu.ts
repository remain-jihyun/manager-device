/**
 * 단말 메뉴 상수 (2026-08-20).
 *
 * 반원용(자재반, role=MEMBER)이 볼 수 있는 화면은 **3개뿐**이다 —
 * 재고실사 · 입고검수 · 소모품 불출.
 * 전용 단말이 없어 사무직 여분 기기를 돌려쓰기로 했고(신규 구매 보류),
 * 같은 앱에서 역할로만 갈린다.
 *
 * 컴포넌트 파일이 아니라 여기 두는 이유: 화면 파일이 컴포넌트 외 값을 export 하면
 * Vite fast-refresh 가 깨진다.
 */
export const MEMBER_PATHS = ['/inventory', '/receiving', '/consumables']
