import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MessageSquare, Check, Boxes } from 'lucide-react'
import { useAuthStore, type User } from '@/store/authStore'

// 로그인 성공 후 넘겨줄 임시 유저 (실서비스: 카카오/구글 OAuth 응답 + mes-v2 사원정보)
// 부서·직책·등급·사진은 실제 계정에서 채워질 자리다. 여기서 기준정보를 정의하는 게 아니다.
//
// 이 단말은 공용이다. **로그인 수단이 곧 역할**이다.
//   카카오 로그인      → 반장(FOREMAN)   : 안돈 현장 확인 보고까지만
//   이메일(Google) 로그인 → 사무직(OFFICE) : 안돈 최종 확인 완료 / 이슈 등록
const KAKAO_USER: User = {
  id: 'kakao_123',
  name: '홍길동',
  team: '조리반',
  role: 'FOREMAN',
  loginMethod: '카카오',
  department: '조리반',
  position: '반장',
  grade: '현장',
  // 폐기는 반 기준이라 담당 반을 함께 들고 간다 — 반장은 자기 반만 본다
  wasteTeam: '조리반',
}

// 2026-08-20 — 자재반 반원용. 재고실사·입고검수·소모품 불출 3개만 쓴다.
const MEMBER_USER: User = {
  id: 'member_789',
  name: '박자재',
  team: '자재반',
  role: 'MEMBER',
  loginMethod: '카카오',
  department: '자재반',
  position: '반원',
  grade: '현장',
  wasteTeam: '자재반',
}

const GOOGLE_USER: User = {
  id: 'google_456',
  name: '김사무',
  team: '사무직',
  role: 'OFFICE',
  loginMethod: '이메일',
  department: '경영지원팀',
  position: '사무관리자',
  grade: '마스터',
}

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  // 카카오 로그인 → 구글 챗 사용을 위한 구글 계정 연동 단계
  const [linkStep, setLinkStep] = useState(false)
  const [linking, setLinking] = useState(false)

  const handleKakaoLogin = () => {
    // 카카오 인증 성공 → 바로 진입하지 않고 구글 계정 연동 안내
    setLinkStep(true)
  }

  const handleGoogleLogin = () => {
    login({ ...GOOGLE_USER, googleLinked: true })
    navigate('/', { replace: true })
  }

  /** 반원용(자재반) — 다른 역할과 같이 홈으로 들어간다. 메뉴만 3개로 제한된다. */
  const handleMemberLogin = () => {
    login({ ...MEMBER_USER, googleLinked: false })
    navigate('/', { replace: true })
  }

  // 구글 계정 연동 진행 (구글 챗 사용 목적)
  const linkGoogle = () => {
    setLinking(true)
    setTimeout(() => {
      login({ ...KAKAO_USER, googleLinked: true })
      navigate('/', { replace: true })
    }, 1200)
  }

  const skipLink = () => {
    login({ ...KAKAO_USER, googleLinked: false })
    navigate('/', { replace: true })
  }

  // ── 구글 계정 연동 단계 ──────────────────────────────
  if (linkStep) {
    return (
      <div className="h-full flex flex-col bg-white screen-x">
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="w-full max-w-sm">
            <div className="flex items-center gap-2 mb-6 text-green-800">
              <Check size={18} />
              <span className="text-sm font-bold">카카오 로그인 완료 · {KAKAO_USER.name}님</span>
            </div>

            <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-50 rounded-2xl mb-5">
              <MessageSquare size={26} className="text-blue-600" />
            </div>
            <h1 className="text-[30px] font-bold text-gray-900 leading-tight">구글 계정 연동</h1>
            <button
              onClick={linkGoogle}
              disabled={linking}
              className="btn-ds btn-ds-outline gap-3 mt-8 disabled:opacity-60"
            >
              <GoogleIcon />
              {linking ? '연동 중...' : 'Google 계정 연동하기'}
            </button>

            <button
              onClick={skipLink}
              disabled={linking}
              className="mt-3 w-full text-center text-sm text-gray-400 py-2 active:text-gray-600"
            >
              나중에 하기
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-white screen-x">
      <div className="flex-1 flex flex-col items-center justify-center gap-0">
        <div className="w-full max-w-sm">
          <div className="mb-12">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-green-900 rounded-2xl mb-5">
              <span className="text-white text-xl font-bold">M</span>
            </div>
            <h1 className="text-[34px] font-bold text-gray-900 leading-tight">관리자 디바이스</h1>
            <p className="text-gray-400 mt-1.5">집반찬연구소 MES</p>
          </div>

          <button
            onClick={handleKakaoLogin}
            className="btn-ds gap-3 bg-[#FEE500] active:bg-[#E8D000] text-[#1A1A1A]"
          >
            <KakaoIcon />
            카카오 로그인
          </button>

          {/* 구분선 */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400">사무직</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          <button
            onClick={handleGoogleLogin}
            className="btn-ds btn-ds-outline gap-3"
          >
            <GoogleIcon />
            Google로 로그인
          </button>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400">반원용</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          <button onClick={handleMemberLogin} className="btn-ds btn-ds-outline gap-3">
            <Boxes size={20} className="text-green-800" />
            자재반 반원으로 시작
          </button>
        </div>
      </div>
    </div>
  )
}

function KakaoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 3C6.477 3 2 6.477 2 10.5c0 2.636 1.607 4.948 4.02 6.332L5 21l4.635-2.838C10.4 18.37 11.19 18.5 12 18.5c5.523 0 10-3.582 10-8S17.523 3 12 3z" />
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  )
}
