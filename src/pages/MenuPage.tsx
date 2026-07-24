import { useNavigate } from 'react-router-dom'
import { ClipboardCheck, ShieldCheck, MapPin, UserPlus, MessageCircle, Trash2, Package, Truck } from 'lucide-react'
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
              className="relative flex flex-col items-center justify-center gap-2.5 rounded-2xl border border-gray-200 bg-white py-6 active:bg-gray-50 transition-colors"
            >
              {badge > 0 && (
                <span className="absolute top-2 right-2 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
              <Icon size={26} className="text-green-900" />
              <span className="text-xs font-bold text-gray-800">{label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
