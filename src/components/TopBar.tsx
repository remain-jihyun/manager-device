import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

interface TopBarProps {
  title: string
  showBack?: boolean
  /**
   * 뒤로가기가 갈 곳. 지정하면 히스토리 대신 이 경로로 이동한다.
   * 메뉴에서 진입하는 첫 화면은 항상 `/menu` 로 돌아가야 해서
   * `navigate(-1)`(직전 화면)에 맡기지 않는다 — 홈이나 외부에서 들어와도 동작이 같아야 한다.
   */
  backTo?: string
}

export default function TopBar({ title, showBack, backTo }: TopBarProps) {
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 bg-white z-40 border-b border-gray-100">
      {/* Figma header (1:3889): padding 16 · 아이콘 20 · 타이틀 Bold 15 / lh 1 중앙 */}
      <div className="flex items-center p-4 gap-2" style={{ height: '52px' }}>
        {showBack ? (
          <button
            onClick={() => (backTo ? navigate(backTo) : navigate(-1))}
            className="text-gray-800 shrink-0"
            aria-label="뒤로"
          >
            <ChevronLeft size={20} strokeWidth={2} />
          </button>
        ) : (
          <div className="w-5 shrink-0" />
        )}
        <h1 className="flex-1 text-center text-lg font-bold leading-none text-gray-950">{title}</h1>
        <div className="w-5 shrink-0" />
      </div>
    </header>
  )
}
