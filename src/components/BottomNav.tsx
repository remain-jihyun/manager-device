import { useNavigate, useLocation } from 'react-router-dom'
import { Home, MessageCircle, LayoutGrid } from 'lucide-react'
import { useBadgeStore } from '@/store/badgeStore'
import { isMember, useAuthStore } from '@/store/authStore'

const MENU_PATHS = [
  '/inspection', '/ccp', '/closing', '/register', '/chat', '/disposal',
  '/inventory', '/receiving', '/consumables',
  '/andon/foreign', '/andon/metal', '/andon/weight',
  '/menu',
]

export default function BottomNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const counts = useBadgeStore((s) => s.counts)
  // 반원(자재반)은 구글 챗을 쓰지 않는다 — 하단 채팅 탭을 감춘다 (2026-08-21)
  const member = isMember(useAuthStore((s) => s.user?.role))

  const menuBadge = MENU_PATHS.reduce((sum, p) => sum + (counts[p] ?? 0), 0)
  const isMenuActive = MENU_PATHS.some((p) => pathname.startsWith(p))
  const isHomeActive = pathname === '/'
  const isChatActive = pathname === '/chat'

  return (
    // DS: Bottom navigation — top border gray-200(#E5E5E5), active = brand green
    <nav className="bg-white border-t border-gray-200 flex z-50 shrink-0">
      <NavItem
        label="홈"
        icon={<Home size={22} strokeWidth={isHomeActive ? 2.2 : 1.8} />}
        active={isHomeActive}
        onClick={() => navigate('/')}
      />
      <NavItem
        label="메뉴"
        icon={<LayoutGrid size={22} strokeWidth={isMenuActive ? 2.2 : 1.8} />}
        active={isMenuActive}
        badge={menuBadge}
        onClick={() => navigate('/menu')}
      />
      {!member && (
        <NavItem
          label="채팅"
          icon={<MessageCircle size={22} strokeWidth={isChatActive ? 2.2 : 1.8} />}
          active={isChatActive}
          onClick={() => navigate('/chat')}
        />
      )}
    </nav>
  )
}

function NavItem({
  label,
  icon,
  active,
  badge,
  onClick,
}: {
  label: string
  icon: React.ReactNode
  active: boolean
  badge?: number
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs font-semibold transition-colors ${
        active ? 'text-green-800' : 'text-gray-400'
      }`}
    >
      <div className="relative">
        {icon}
        {badge != null && badge > 0 && (
          <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 bg-red-500 text-white text-[13px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </div>
      {label}
    </button>
  )
}
