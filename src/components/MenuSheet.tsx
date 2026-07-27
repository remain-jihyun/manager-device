import { useNavigate } from 'react-router-dom'
import { ClipboardCheck, ShieldCheck, MapPin, UserPlus, MessageCircle, Trash2, Bug, Magnet, Scale, X } from 'lucide-react'
import { useBadgeStore } from '@/store/badgeStore'

const MENU_ITEMS = [
  { path: '/inspection', icon: ClipboardCheck, label: '검수', bg: 'bg-blue-50', color: 'text-blue-600', border: 'border-blue-100' },
  { path: '/ccp', icon: ShieldCheck, label: 'CCP', bg: 'bg-green-50', color: 'text-green-600', border: 'border-green-100' },
  { path: '/closing', icon: MapPin, label: '현장 점검', bg: 'bg-orange-50', color: 'text-orange-500', border: 'border-orange-100' },
  { path: '/register', icon: UserPlus, label: '등록', bg: 'bg-purple-50', color: 'text-purple-600', border: 'border-purple-100' },
  { path: '/chat', icon: MessageCircle, label: '채팅', bg: 'bg-sky-50', color: 'text-sky-500', border: 'border-sky-100' },
  { path: '/disposal', icon: Trash2, label: '폐기', bg: 'bg-red-50', color: 'text-red-500', border: 'border-red-100' },
  // 안돈 — 발생 건은 대시보드가 아니라 이 단말에서만 확인 완료 처리한다
  { path: '/andon/foreign', icon: Bug, label: '이물 안돈', bg: 'bg-rose-50', color: 'text-rose-600', border: 'border-rose-100' },
  { path: '/andon/metal', icon: Magnet, label: '금속검출기 안돈', bg: 'bg-rose-50', color: 'text-rose-600', border: 'border-rose-100' },
  { path: '/andon/weight', icon: Scale, label: '중량 선별기 안돈', bg: 'bg-rose-50', color: 'text-rose-600', border: 'border-rose-100' },
]

interface Props {
  onClose: () => void
}

export default function MenuSheet({ onClose }: Props) {
  const navigate = useNavigate()
  const counts = useBadgeStore((s) => s.counts)

  const go = (path: string) => {
    navigate(path)
    onClose()
  }

  return (
    <>
      {/* 딤 배경 */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
      />

      {/* 시트 */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl pb-6 pt-2 shadow-xl">
        {/* 핸들 */}
        <div className="flex justify-center mb-3">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        <div className="flex items-center justify-between px-5 mb-4">
          <p className="text-base font-bold text-gray-800">메뉴</p>
          <button onClick={onClose} className="p-1 text-gray-400">
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 px-4">
          {MENU_ITEMS.map(({ path, icon: Icon, label, bg, color, border }) => {
            const badge = counts[path] ?? 0
            return (
              <button
                key={path}
                onClick={() => go(path)}
                className={`relative flex flex-col items-center justify-center gap-2 rounded-2xl border ${bg} ${border} py-5 active:scale-95 transition-transform`}
              >
                {badge > 0 && (
                  <span className="absolute top-2 right-2 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
                <Icon size={26} className={color} />
                <span className={`text-xs font-semibold text-center leading-tight px-1 ${color}`}>
                  {label}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </>
  )
}
