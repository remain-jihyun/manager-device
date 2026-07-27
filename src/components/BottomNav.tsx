import { useNavigate, useLocation } from 'react-router-dom'
import { Home, MessageCircle, LayoutGrid } from 'lucide-react'
import { useBadgeStore } from '@/store/badgeStore'

const MENU_PATHS = [
  '/inspection', '/ccp', '/closing', '/register', '/chat', '/disposal',
  '/inventory', '/receiving',
  '/andon/foreign', '/andon/metal', '/andon/weight',
  '/menu',
]

export default function BottomNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const counts = useBadgeStore((s) => s.counts)

  const menuBadge = MENU_PATHS.reduce((sum, p) => sum + (counts[p] ?? 0), 0)
  const isMenuActive = MENU_PATHS.some((p) => pathname.startsWith(p))
  const isHomeActive = pathname === '/'
  const isChatActive = pathname === '/chat'

  return (
    <nav className="bg-white border-t border-gray-100 flex z-50 shrink-0">
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
      <NavItem
        label="채팅"
        icon={<MessageCircle size={22} strokeWidth={isChatActive ? 2.2 : 1.8} />}
        active={isChatActive}
        onClick={() => navigate('/chat')}
      />
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
      className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold transition-colors ${
        active ? 'text-green-800' : 'text-gray-400'
      }`}
    >
      <div className="relative">
        {icon}
        {badge != null && badge > 0 && (
          <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </div>
      {label}
    </button>
  )
}
