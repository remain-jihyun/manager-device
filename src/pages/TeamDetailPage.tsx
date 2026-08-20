import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, RefreshCw } from 'lucide-react'
import {
  KANBAN_STATUSES,
  MesApiError,
  fetchKanbans,
  type Kanban,
  type KanbanStatus,
} from '@/api/mes'

// 반별 간반 현황
//
// 이전에는 이 화면이 하드코딩 mock 배열과 자체 영문 상태값('done'·'in-progress' 등)을
// 갖고 있어 시스템 전체 상태 체계와 어긋났다(QA F-02·D-01).
// 지금은 mes-v2 가 발행한 간반을 그대로 받아 계약 상태값('준비'|'대기'|'작업'|'완료')으로 쓴다.

const STATUS_META: Record<KanbanStatus, { cls: string; dot: string }> = {
  완료: { cls: 'bg-green-100 text-green-800', dot: 'bg-green-700' },
  작업: { cls: 'bg-blue-100 text-blue-700', dot: 'bg-blue-400' },
  대기: { cls: 'bg-orange-100 text-orange-600', dot: 'bg-orange-400' },
  준비: { cls: 'bg-gray-100 text-gray-500', dot: 'bg-gray-300' },
}

const TAB_ORDER: KanbanStatus[] = ['준비', '대기', '작업', '완료']
const POLL_MS = 15_000

export default function TeamDetailPage() {
  const navigate = useNavigate()
  const { teamId } = useParams<{ teamId: string }>()
  const team = decodeURIComponent(teamId ?? '')

  const [kanbans, setKanbans] = useState<Kanban[]>([])
  const [activeTab, setActiveTab] = useState<KanbanStatus>('작업')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetchKanbans({ team, size: 500 })
      setKanbans(res.items)
      setError(null)
    } catch (err) {
      setError(
        err instanceof MesApiError
          ? err.message
          : 'MES 서버에 연결할 수 없습니다. 네트워크를 확인해 주세요.',
      )
    } finally {
      setLoading(false)
    }
  }, [team])

  useEffect(() => {
    void load()
    const timer = setInterval(() => void load(), POLL_MS)
    return () => clearInterval(timer)
  }, [load])

  const counts = KANBAN_STATUSES.reduce<Record<KanbanStatus, number>>(
    (acc, s) => {
      acc[s] = kanbans.filter((k) => k.status === s).length
      return acc
    },
    { 준비: 0, 대기: 0, 작업: 0, 완료: 0 },
  )

  const total = kanbans.length
  const pct = total > 0 ? Math.round((counts.완료 / total) * 100) : 0
  const displayed = kanbans.filter((k) => k.status === activeTab)

  return (
    <div className="flex flex-col bg-gray-50 min-h-full">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="flex items-center px-3 gap-2" style={{ height: '52px' }}>
          <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-gray-800">
            <ChevronLeft size={24} strokeWidth={2} />
          </button>
          <h1 className="flex-1 text-center text-[21px] font-bold text-gray-900">
            {team} 간반 현황
          </h1>
          <button
            onClick={() => void load()}
            className="p-1 text-gray-400 active:text-gray-800"
            aria-label="새로고침"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      <div className="px-4 py-4 space-y-3">
        {error && (
          <div
            role="status"
            className="bg-red-50 border border-red-200 text-red-700 rounded-2xl px-4 py-3 text-sm font-semibold"
          >
            {error}
          </div>
        )}

        {/* 요약 카드 */}
        <div className="bg-white rounded-2xl px-4 py-4 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-bold text-gray-900">{team} 전체 진행률</p>
            <span className="text-sm font-bold text-green-900">{pct}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
            <div
              className="h-full rounded-full bg-green-800 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex gap-4 flex-wrap">
            {TAB_ORDER.map((s) => (
              <div key={s} className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${STATUS_META[s].dot}`} />
                <span className="text-xs text-gray-500">
                  {s} {counts[s]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 상태 탭 */}
        <div className="flex bg-gray-100 rounded-2xl p-1 gap-1">
          {TAB_ORDER.map((s) => (
            <button
              key={s}
              onClick={() => setActiveTab(s)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors ${
                activeTab === s ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'
              }`}
            >
              {s}
              {counts[s] > 0 && (
                <span className={`ml-1 ${activeTab === s ? 'text-green-800' : 'text-gray-400'}`}>
                  {counts[s]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* 간반 목록 */}
        {loading ? (
          <p className="text-center text-gray-400 text-sm py-10">불러오는 중…</p>
        ) : displayed.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-10">해당 상태의 간반이 없습니다</p>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-50 overflow-hidden">
            {displayed.map((item) => {
              const meta = STATUS_META[item.status]
              return (
                <div key={item.id} className="flex items-center justify-between px-4 py-3.5 gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{item.productName}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {item.kanbanNumber} · {item.processSection} · {item.assignee}
                    </p>
                    {item.holdReason && (
                      <p className="text-[16px] text-orange-600 mt-0.5">보류: {item.holdReason}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`text-[16px] font-bold px-2.5 py-1 rounded-full ${meta.cls}`}>
                      {item.status}
                    </span>
                    <p className="text-[16px] text-gray-400 mt-1">
                      {item.goodQty} / {item.plannedQty} {item.unit}
                      {item.defectQty > 0 && (
                        <span className="text-red-500 ml-1">불량 {item.defectQty}</span>
                      )}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
