import { useNavigate } from 'react-router-dom'
import { ClipboardCheck, ShieldCheck, MapPin, UserPlus, Trash2, Bug, Magnet, Scale, X, ClipboardList, PackageCheck, Boxes, Waves } from 'lucide-react'
import { useBadgeStore } from '@/store/badgeStore'
import { isMember, useAuthStore } from '@/store/authStore'
import { MEMBER_PATHS } from '@/constants/deviceMenu'

/**
 * 메뉴 구성 (2026-08-20 확정)
 *   ① 점검류   — 검수 · CCP · 현장 점검
 *   ② 등록/설정 — 등록
 *   ③ 자재류   — 재고실사 · 입고검수 · 소모품
 *   ④ 폐기·안돈 — 폐기 · 이물/금속검출기/중량 선별기 안돈
 * 채팅은 하단 탭에 이미 있어 이 메뉴에서 뺐다.
 *
 * 반원용(자재반, role=MEMBER)은 **③ 자재류 3개만** 본다.
 */
type MenuItem = {
  path: string
  icon: typeof ClipboardCheck
  label: string
  bg: string
  color: string
  border: string
}

type MenuGroup = { title: string; items: MenuItem[] }

const MENU_GROUPS: MenuGroup[] = [
  {
    title: '점검',
    items: [
      { path: '/inspection', icon: ClipboardCheck, label: '검수', bg: 'bg-blue-50', color: 'text-blue-600', border: 'border-blue-100' },
      { path: '/ccp', icon: ShieldCheck, label: 'CCP', bg: 'bg-green-50', color: 'text-green-600', border: 'border-green-100' },
      { path: '/closing', icon: MapPin, label: '현장 점검', bg: 'bg-orange-50', color: 'text-orange-500', border: 'border-orange-100' },
    ],
  },
  {
    title: '등록 · 설정',
    items: [
      { path: '/register', icon: UserPlus, label: '등록', bg: 'bg-purple-50', color: 'text-purple-600', border: 'border-purple-100' },
    ],
  },
  {
    title: '자재',
    items: [
      { path: '/inventory', icon: ClipboardList, label: '재고실사', bg: 'bg-emerald-50', color: 'text-emerald-600', border: 'border-emerald-100' },
      { path: '/receiving', icon: PackageCheck, label: '입고검수', bg: 'bg-emerald-50', color: 'text-emerald-600', border: 'border-emerald-100' },
      { path: '/consumables', icon: Boxes, label: '소모품', bg: 'bg-emerald-50', color: 'text-emerald-600', border: 'border-emerald-100' },
    ],
  },
  {
    title: '폐기 · 안돈',
    items: [
      { path: '/disposal', icon: Trash2, label: '폐기', bg: 'bg-red-50', color: 'text-red-500', border: 'border-red-100' },
      // 안돈 — 발생 건은 대시보드가 아니라 이 단말에서만 확인 완료 처리한다
      { path: '/andon/foreign', icon: Bug, label: '이물 안돈', bg: 'bg-rose-50', color: 'text-rose-600', border: 'border-rose-100' },
      { path: '/andon/metal', icon: Magnet, label: '금속검출기 안돈', bg: 'bg-rose-50', color: 'text-rose-600', border: 'border-rose-100' },
      { path: '/andon/weight', icon: Scale, label: '중량 선별기 안돈', bg: 'bg-rose-50', color: 'text-rose-600', border: 'border-rose-100' },
      { path: '/andon/spiral', icon: Waves, label: '스파이럴 안돈', bg: 'bg-rose-50', color: 'text-rose-600', border: 'border-rose-100' },
    ],
  },
]


interface Props {
  onClose: () => void
}

export default function MenuSheet({ onClose }: Props) {
  const navigate = useNavigate()
  const counts = useBadgeStore((s) => s.counts)
  const role = useAuthStore((s) => s.user?.role)
  // 반원용은 자재 3개만 — 그룹 머리도 감춘다
  const member = isMember(role)
  const groups: MenuGroup[] = member
    ? [{ title: '자재', items: MENU_GROUPS.flatMap(g => g.items).filter(i => MEMBER_PATHS.includes(i.path)) }]
    : MENU_GROUPS

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
          <p className="text-lg font-bold text-gray-800">{member ? '자재반 메뉴' : '메뉴'}</p>
          <button onClick={onClose} className="p-1 text-gray-400">
            <X size={20} />
          </button>
        </div>

        {/* 그룹별로 나눠 보여준다 — 현장에서 찾기 쉽게 */}
        <div className="max-h-[62vh] overflow-y-auto px-4 pb-2 space-y-5">
          {groups.map((group) => (
            <div key={group.title}>
              {!member && (
                <p className="mb-2 text-sm font-bold text-gray-400">{group.title}</p>
              )}
              <div className="grid grid-cols-3 gap-3">
                {group.items.map(({ path, icon: Icon, label, bg, color, border }) => {
                  const badge = counts[path] ?? 0
                  return (
                    <button
                      key={path}
                      onClick={() => go(path)}
                      className={`relative flex flex-col items-center justify-center gap-2 rounded-2xl border ${bg} ${border} py-6 active:scale-95 transition-transform`}
                    >
                      {badge > 0 && (
                        <span className="absolute top-2 right-2 min-w-[20px] h-[20px] bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1">
                          {badge > 99 ? '99+' : badge}
                        </span>
                      )}
                      <Icon size={30} className={color} />
                      <span className={`text-sm font-bold text-center leading-tight px-1 ${color}`}>
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
    </>
  )
}
