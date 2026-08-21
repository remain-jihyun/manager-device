import { useNavigate } from 'react-router-dom'
import { ClipboardCheck, ShieldCheck, MapPin, UserPlus, Trash2, Package, Truck, Bug, Magnet, Scale, Boxes, Waves } from 'lucide-react'
import { useBadgeStore } from '@/store/badgeStore'
import { isMember, useAuthStore } from '@/store/authStore'
import { MEMBER_PATHS } from '@/constants/deviceMenu'
import TopBar from '@/components/TopBar'

/**
 * 메뉴 화면 — MenuSheet 와 같은 4그룹 구성을 쓴다 (2026-08-20).
 *   ① 점검  ② 등록·설정  ③ 자재  ④ 폐기·안돈
 * 채팅은 하단 탭에 이미 있어 뺐다. 반원용(자재반)은 ③ 3개만 본다.
 */
const MENU_GROUPS: { title: string; items: { path: string; icon: typeof ClipboardCheck; label: string }[] }[] = [
  {
    title: '점검',
    items: [
      { path: '/inspection', icon: ClipboardCheck, label: '검수' },
      { path: '/ccp', icon: ShieldCheck, label: 'CCP' },
      { path: '/closing', icon: MapPin, label: '현장 점검' },
    ],
  },
  {
    title: '등록 · 설정',
    items: [{ path: '/register', icon: UserPlus, label: '등록' }],
  },
  {
    title: '자재',
    items: [
      { path: '/inventory', icon: Package, label: '재고실사' },
      { path: '/receiving', icon: Truck, label: '입고검수' },
      { path: '/consumables', icon: Boxes, label: '소모품' },
    ],
  },
  {
    title: '폐기 · 안돈',
    items: [
      { path: '/disposal', icon: Trash2, label: '폐기' },
      { path: '/andon/foreign', icon: Bug, label: '이물 안돈' },
      { path: '/andon/metal', icon: Magnet, label: '금속검출기 안돈' },
      { path: '/andon/weight', icon: Scale, label: '중량 선별기 안돈' },
      { path: '/andon/spiral', icon: Waves, label: '스파이럴 안돈' },
    ],
  },
]


export default function MenuPage() {
  const navigate = useNavigate()
  const counts = useBadgeStore((s) => s.counts)
  const member = isMember(useAuthStore((s) => s.user?.role))
  const groups = member
    ? [{ title: '자재', items: MENU_GROUPS.flatMap(g => g.items).filter(i => MEMBER_PATHS.includes(i.path)) }]
    : MENU_GROUPS

  return (
    <div className="flex flex-col bg-gray-50 min-h-full">
      <TopBar title={member ? '자재반 메뉴' : '메뉴'} />
      <div className="screen-x py-4 space-y-6">
        {groups.map((group) => (
          <div key={group.title}>
            {!member && <p className="mb-2.5 text-sm font-bold text-gray-400">{group.title}</p>}
            <div className="grid grid-cols-3 gap-3">
              {group.items.map(({ path, icon: Icon, label }) => {
                const badge = counts[path] ?? 0
                return (
                  <button
                    key={path}
                    onClick={() => navigate(path)}
                    className={`relative flex flex-col items-center justify-center gap-2.5 rounded-2xl border py-7 transition-colors ${
                      badge > 0
                        ? 'border-red-200 bg-red-50 active:bg-red-100'
                        : 'border-gray-200 bg-white active:bg-gray-50'
                    }`}
                  >
                    {badge > 0 && (
                      <span className="absolute top-2 right-2 flex h-[20px] min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
                        {badge > 99 ? '99+' : badge}
                      </span>
                    )}
                    <Icon size={30} className={badge > 0 ? 'text-red-500' : 'text-gray-600'} />
                    <span className="px-1 text-center text-sm font-bold leading-tight text-gray-700">
                      {label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
