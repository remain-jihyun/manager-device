import { useNavigate } from 'react-router-dom'
import { ClipboardCheck, ShieldCheck, MapPin, UserPlus, MessageCircle, Trash2, Package, Truck, Bug, Magnet, Scale } from 'lucide-react'
import { useBadgeStore } from '@/store/badgeStore'
import TopBar from '@/components/TopBar'

const MENU_ITEMS = [
  { path: '/inspection', icon: ClipboardCheck, label: '검수' },
  { path: '/ccp', icon: ShieldCheck, label: 'CCP' },
  { path: '/closing', icon: MapPin, label: '현장 점검' },
  { path: '/register', icon: UserPlus, label: '등록' },
  { path: '/chat', icon: MessageCircle, label: '채팅' },
  { path: '/disposal', icon: Trash2, label: '폐기' },
  { path: '/inventory', icon: Package, label: '재고실사' },
  { path: '/receiving', icon: Truck, label: '입고검수' },
  // 안돈 3종 — 각각 독립 메뉴. 발생 데이터는 메뉴를 눌러 들어간 화면에서 본다.
  { path: '/andon/foreign', icon: Bug, label: '이물 안돈' },
  { path: '/andon/metal', icon: Magnet, label: '금속검출기 안돈' },
  { path: '/andon/weight', icon: Scale, label: '중량 선별기 안돈' },
]

export default function MenuPage() {
  const navigate = useNavigate()
  const counts = useBadgeStore((s) => s.counts)

  return (
    <div className="flex flex-col bg-gray-50 min-h-full">
      <TopBar title="메뉴" />
      <div className="px-4 py-4 grid grid-cols-3 gap-3">
        {MENU_ITEMS.map(({ path, icon: Icon, label }) => {
          const badge = counts[path] ?? 0
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`relative flex flex-col items-center justify-center gap-2.5 rounded-2xl border py-6 transition-colors ${
                badge > 0
                  ? 'border-red-200 bg-red-50 active:bg-red-100'
                  : 'border-gray-200 bg-white active:bg-gray-50'
              }`}
            >
              {badge > 0 && (
                <span className="absolute top-2 right-2 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
              <Icon size={26} className={badge > 0 ? 'text-red-500' : 'text-green-900'} />
              <span className="text-xs font-bold text-gray-800 text-center leading-tight px-1">
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
