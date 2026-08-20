import { create } from 'zustand'

/**
 * 이 단말은 여러 역할이 함께 쓰는 공용 단말이다.
 * **로그인 수단이 곧 역할**이다 — 카카오 = 반장, 이메일(Google) = 사무직.
 * 서버 권한 헤더(X-Role)도 이 값에서 나온다: FOREMAN → MANAGER, OFFICE → OFFICE.
 *
 * 2026-08-20 추가 — **MEMBER(반원용, 자재반)**.
 * 자재반 반원은 재고실사·입고검수·소모품 불출 **3개만** 쓴다. 전용 단말이 아직 없어
 * 사무직 여분 기기를 돌려쓰기로 했고(신규 구매 보류), 그래서 같은 앱에 역할만 하나 더 뒀다.
 */
export type UserRole = 'FOREMAN' | 'OFFICE' | 'MEMBER'

/** 서버 권한 헤더(X-Role)로 보낼 값 */
export const serverRoleOf = (role: UserRole | undefined): 'MANAGER' | 'OFFICE' =>
  role === 'OFFICE' ? 'OFFICE' : 'MANAGER'

export const isOffice = (role: UserRole | undefined) => role === 'OFFICE'

/** 반원용(자재반) — 메뉴가 3개로 제한된다 */
export const isMember = (role: UserRole | undefined) => role === 'MEMBER'

/**
 * 폐기 대장의 반 — 폐기 화면 축이 품목 유형에서 **반** 으로 바뀌면서 필요해졌다 (2026-08-20).
 * 반장·반원은 **자기 반만** 보고, 사무직은 전체를 본다.
 */
export type WasteTeam = '자재반' | '전처리반' | '조리반' | '내포장반'
export const WASTE_TEAMS: WasteTeam[] = ['자재반', '전처리반', '조리반', '내포장반']

/** 이 사용자가 볼 수 있는 폐기 반. 사무직은 전체. */
export const visibleWasteTeams = (user: { role: UserRole; wasteTeam?: WasteTeam } | null): WasteTeam[] => {
  if (!user) return []
  if (user.role === 'OFFICE') return WASTE_TEAMS
  return user.wasteTeam ? [user.wasteTeam] : WASTE_TEAMS
}

interface User {
  id: string
  name: string
  team: string
  /** 로그인 수단으로 정해지는 역할. 화면 분기와 서버 권한의 기준이다. */
  role: UserRole
  /** 로그인 수단 (표시용) */
  loginMethod?: '카카오' | '이메일'
  /** 소속 부서. 헤더에 "부서 | 직책" 으로 표시된다. */
  department?: string
  /** 직책(반장·매니저 …). 헤더에 "부서 | 직책" 으로 표시된다. */
  position?: string
  /** 이름 옆 배지로 붙는 등급. 없으면 배지를 그리지 않는다. */
  grade?: string
  /** 프로필 사진. 없으면 이름 첫 글자 원형 아바타로 폴백한다. */
  avatarUrl?: string
  /** 폐기 화면에서 이 사람이 담당하는 반. 반장·반원은 이 반만 보인다. */
  wasteTeam?: WasteTeam
  googleLinked?: boolean // 카카오 로그인 후 구글 챗 사용을 위한 구글 계정 연동 여부
}

export type { User }

interface AuthStore {
  user: User | null
  isLoggedIn: boolean
  login: (user: User) => void
  logout: () => void
}

// 세션을 저장하지 않는다(메모리 전용).
// 앱을 열 때마다 항상 로그인 화면부터 노출되어야 하기 때문이다.
export const useAuthStore = create<AuthStore>()((set) => ({
  user: null,
  isLoggedIn: false,
  login: (user) => set({ user, isLoggedIn: true }),
  logout: () => set({ user: null, isLoggedIn: false }),
}))
