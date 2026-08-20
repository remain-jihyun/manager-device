import { useMemo, useState } from 'react'
import { Boxes, Check, Clock, PackageCheck, Send, ShieldCheck } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

/**
 * 소모품 — 반장(FOREMAN)과 자재반 반원(MEMBER)이 함께 쓰는 화면.
 *
 * 정책 (2026-08-21 개정)
 *   · 소모품은 간반(BOM) 체계에 넣지 않고 별도로 다룬다.
 *   · **신청은 반장만** 한다. 자재반도 자기 반에 필요한 것은 직접 신청한다.
 *   · **승인은 사무직이 mes-v2(`소모품 > 신청`)에서만** 한다.
 *     이 단말에는 승인 수단이 없다 — 반장 화면에는 불출 탭도 두지 않는다.
 *   · **불출은 자재반**이 한다. 그래서 불출 탭은 자재반(MEMBER)에게만 보인다.
 *   · 반장은 자기가 올린 건이 지금 어디까지 갔는지를 **이력** 탭에서 본다
 *     (신청 → 승인 → 불출 완료).
 *   · 수령 사인·검수 절차는 두지 않는다.
 */

type Tab = '불출' | '신청' | '이력'

/** 서버(mes-v2)가 정하는 상태값과 같은 축이다. 여기서 새로 정의하지 않는다. */
type Status = '신청' | '승인' | '부분승인' | '반려' | '불출완료'

type Request = {
  id: string
  team: string
  requester: string
  requestedAt: string
  items: { name: string; requested: number; approved: number | null; unit: string }[]
  status: Status
  /** 승인·불출을 누가 언제 했는지 — 이력 탭의 진행 표시에 쓴다 */
  approvedAt?: string
  issuedAt?: string
}

const SEED: Request[] = [
  {
    id: 'CS-2026-043',
    team: '조리반',
    requester: '홍길동',
    requestedAt: '08-21 08:05',
    items: [{ name: '위생모', requested: 5, approved: null, unit: '개' }],
    status: '신청',
  },
  {
    id: 'CS-2026-042',
    team: '조리반',
    requester: '홍길동',
    requestedAt: '08-20 13:20',
    items: [
      { name: '위생장갑(L)', requested: 8, approved: 8, unit: '박스' },
      { name: '락스', requested: 2, approved: 1, unit: '통' },
    ],
    status: '부분승인',
    approvedAt: '08-20 15:02',
  },
  {
    id: 'CS-2026-041',
    team: '조리반',
    requester: '이영희',
    requestedAt: '08-20 09:12',
    items: [
      { name: '위생장갑(M)', requested: 10, approved: 10, unit: '박스' },
      { name: '주방세제', requested: 4, approved: 2, unit: '통' },
    ],
    status: '불출완료',
    approvedAt: '08-20 10:30',
    issuedAt: '08-20 11:15',
  },
  {
    id: 'CS-2026-040',
    team: '내포장반',
    requester: '임나경',
    requestedAt: '08-20 08:40',
    items: [{ name: '포장 테이프', requested: 6, approved: 6, unit: '개' }],
    status: '승인',
    approvedAt: '08-20 09:05',
  },
  {
    id: 'CS-2026-039',
    team: '전처리반',
    requester: '박민준',
    requestedAt: '08-19 17:05',
    items: [{ name: '앞치마', requested: 3, approved: 3, unit: '개' }],
    status: '불출완료',
    approvedAt: '08-19 17:40',
    issuedAt: '08-19 18:02',
  },
]

const CATALOG = ['위생장갑(M)', '위생장갑(L)', '주방세제', '포장 테이프', '앞치마', '위생모', '락스', '수세미']

const STATUS_STYLE: Record<Status, string> = {
  신청: 'bg-gray-100 text-gray-600',
  승인: 'bg-blue-50 text-blue-700',
  부분승인: 'bg-amber-50 text-amber-700',
  반려: 'bg-red-50 text-red-700',
  불출완료: 'bg-green-50 text-green-700',
}

/** 진행 단계 — 신청 → 승인 → 불출 완료. 반려는 승인 단계에서 멈춘다. */
const STEPS = ['신청', '승인', '불출 완료'] as const
const stepIndexOf = (s: Status) => (s === '신청' ? 0 : s === '불출완료' ? 2 : 1)

export default function ConsumablesPage() {
  const user = useAuthStore((s) => s.user)
  const isMaterial = user?.team === '자재반'
  // 불출은 자재반만 한다. 반장 단말에는 불출 탭이 없다.
  const tabs: Tab[] = isMaterial ? ['불출', '신청', '이력'] : ['신청', '이력']

  const [tab, setTab] = useState<Tab>(tabs[0])
  const [rows, setRows] = useState<Request[]>(SEED)
  const [cart, setCart] = useState<Record<string, number>>({})
  const [sent, setSent] = useState<string | null>(null)

  const myTeam = user?.team ?? '조리반'
  /** 자재반은 전 반의 불출 대상을 본다 — 승인이 끝난 건만 온다 */
  const toIssue = useMemo(
    () => rows.filter((r) => r.status === '승인' || r.status === '부분승인'),
    [rows],
  )
  const issued = useMemo(() => rows.filter((r) => r.status === '불출완료'), [rows])
  /** 이력은 자기 반이 올린 건만 본다 */
  const myHistory = useMemo(
    () => rows.filter((r) => r.team === myTeam),
    [rows, myTeam],
  )

  const issue = (id: string) =>
    setRows((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, status: '불출완료', issuedAt: new Date().toISOString().slice(5, 16).replace('T', ' ') }
          : r,
      ),
    )

  const bump = (name: string, delta: number) =>
    setCart((c) => {
      const next = Math.max(0, (c[name] ?? 0) + delta)
      const copy = { ...c }
      if (next === 0) delete copy[name]
      else copy[name] = next
      return copy
    })

  const submit = () => {
    const items = Object.entries(cart)
    if (items.length === 0) return
    const id = `CS-2026-${String(44 + rows.length).padStart(3, '0')}`
    setRows((prev) => [
      {
        id,
        team: myTeam,
        requester: user?.name ?? '반장',
        requestedAt: new Date().toISOString().slice(5, 16).replace('T', ' '),
        // 승인 전이므로 승인 수량은 아직 없다(null). 승인은 사무직이 mes-v2 에서 한다.
        items: items.map(([name, qty]) => ({ name, requested: qty, approved: null, unit: '개' })),
        status: '신청',
      },
      ...prev,
    ])
    setCart({})
    setSent(`${id} 신청을 올렸습니다. 사무직 승인 뒤 자재반이 불출합니다.`)
    setTab('이력')
  }

  return (
    <div className="flex h-full flex-col bg-gray-50">
      {/* 탭 */}
      <div className="flex shrink-0 border-b bg-white">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-3 text-base font-bold transition-colors ${
              tab === t ? 'border-b-2 border-green-800 text-green-800' : 'text-gray-400'
            }`}
          >
            {t}
            {t === '불출' && toIssue.length > 0 && (
              <span className="ml-1.5 rounded-full bg-red-500 px-1.5 text-xs text-white">
                {toIssue.length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {/* ── 불출 (자재반 전용) ─────────────────────────────────────────── */}
        {tab === '불출' && (
          <div className="space-y-3">
            {toIssue.length === 0 && (
              <p className="py-10 text-center text-base text-gray-400">불출할 건이 없습니다.</p>
            )}
            {toIssue.map((r) => (
              <div key={r.id} className="rounded-2xl border bg-white p-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className="font-mono text-sm text-gray-500">{r.id}</span>
                  <span className={`rounded-full px-2 py-0.5 text-sm font-bold ${STATUS_STYLE[r.status]}`}>
                    {r.status}
                  </span>
                  <span className="ml-auto text-sm text-gray-400">{r.requestedAt}</span>
                </div>
                <p className="mb-2 text-lg font-bold text-gray-900">
                  {r.team} · {r.requester}
                </p>
                <ul className="mb-3 space-y-1">
                  {r.items.map((i) => (
                    <li key={i.name} className="flex items-baseline justify-between text-base">
                      <span className="text-gray-700">{i.name}</span>
                      <span className="tabular-nums text-gray-500">
                        요청 {i.requested} → <b className="text-gray-900">승인 {i.approved ?? 0}</b> {i.unit}
                      </span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => issue(r.id)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-800 py-3 text-base font-bold text-white active:scale-[0.99]"
                >
                  <PackageCheck size={20} />
                  불출 완료
                </button>
              </div>
            ))}

            {issued.length > 0 && (
              <div className="pt-2">
                <p className="mb-2 text-sm font-bold text-gray-400">오늘 불출 완료</p>
                {issued.map((r) => (
                  <div
                    key={r.id}
                    className="mb-2 flex items-center gap-2 rounded-xl border bg-white px-4 py-3"
                  >
                    <Check size={18} className="shrink-0 text-green-700" />
                    <span className="text-base text-gray-700">
                      {r.team} · {r.items.map((i) => i.name).join(', ')}
                    </span>
                    <span className="ml-auto shrink-0 font-mono text-sm text-gray-400">{r.id}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── 신청 ──────────────────────────────────────────────────────── */}
        {tab === '신청' && (
          <div className="space-y-3">
            {sent && (
              <p className="rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
                {sent}
              </p>
            )}
            <div className="space-y-2">
              {CATALOG.map((name) => (
                <div
                  key={name}
                  className="flex items-center gap-3 rounded-xl border bg-white px-4 py-3"
                >
                  <Boxes size={20} className="shrink-0 text-gray-300" />
                  <span className="flex-1 text-base font-medium text-gray-800">{name}</span>
                  <button
                    onClick={() => bump(name, -1)}
                    className="size-9 rounded-lg border text-xl font-bold text-gray-500 active:bg-gray-100"
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-lg font-bold tabular-nums">
                    {cart[name] ?? 0}
                  </span>
                  <button
                    onClick={() => bump(name, +1)}
                    className="size-9 rounded-lg border text-xl font-bold text-gray-500 active:bg-gray-100"
                  >
                    +
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={submit}
              disabled={Object.keys(cart).length === 0}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-800 py-3.5 text-base font-bold text-white disabled:bg-gray-200 disabled:text-gray-400"
            >
              <Send size={20} />
              신청 올리기 ({Object.keys(cart).length}종)
            </button>
          </div>
        )}

        {/* ── 이력 — 내가 올린 신청이 지금 어디까지 갔는지 ─────────────── */}
        {tab === '이력' && (
          <div className="space-y-3">
            {myHistory.length === 0 && (
              <p className="py-10 text-center text-base text-gray-400">신청한 건이 없습니다.</p>
            )}
            {myHistory.map((r) => {
              const step = stepIndexOf(r.status)
              const rejected = r.status === '반려'
              return (
                <div key={r.id} className="rounded-2xl border bg-white p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="font-mono text-sm text-gray-500">{r.id}</span>
                    <span className={`rounded-full px-2 py-0.5 text-sm font-bold ${STATUS_STYLE[r.status]}`}>
                      {r.status}
                    </span>
                    <span className="ml-auto text-sm text-gray-400">{r.requestedAt}</span>
                  </div>

                  <ul className="mb-3 space-y-1">
                    {r.items.map((i) => (
                      <li key={i.name} className="flex items-baseline justify-between text-base">
                        <span className="text-gray-700">{i.name}</span>
                        <span className="tabular-nums text-gray-500">
                          요청 {i.requested}
                          {i.approved !== null && (
                            <> → <b className="text-gray-900">승인 {i.approved}</b></>
                          )}{' '}
                          {i.unit}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* 진행 단계 — 신청 → 승인 → 불출 완료 */}
                  <div className="flex items-center gap-1">
                    {STEPS.map((label, idx) => {
                      const on = !rejected && idx <= step
                      const Icon = idx === 0 ? Send : idx === 1 ? ShieldCheck : PackageCheck
                      return (
                        <div key={label} className="flex flex-1 items-center gap-1">
                          <div
                            className={`flex flex-1 items-center justify-center gap-1 rounded-lg py-1.5 text-sm font-bold ${
                              on ? 'bg-green-50 text-green-800' : 'bg-gray-50 text-gray-300'
                            }`}
                          >
                            {on ? <Icon size={15} /> : <Clock size={15} />}
                            {label}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <p className="mt-2 text-sm text-gray-400 tabular-nums">
                    신청 {r.requestedAt}
                    {r.approvedAt && ` · 승인 ${r.approvedAt}`}
                    {r.issuedAt && ` · 불출 ${r.issuedAt}`}
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
