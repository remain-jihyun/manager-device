import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronLeft, RefreshCw, Send, XCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  MesApiError,
  cancelWorkOrder,
  fetchKanbans,
  fetchWorkOrders,
  issueWorkOrder,
  type Kanban,
  type WorkOrder,
} from '@/api/mes'

// ============================================================================
// 작업지시 배포(발행)
//
// 다이어그램의 D1 기능 중 유일하게 화면이 없던 항목이다(QA D-01).
// '준비' 상태 간반을 골라 작업지시로 발행하면 상태가 '대기'로 바뀌고,
// 해당 디바이스의 현장 단말에 카드가 즉시 나타난다.
// 취소하면 현장 카드가 회수된다.
// ============================================================================

const TEAMS = ['자재반', '전처리반', '조리반', '내포장반', '외포장반']

export default function WorkOrderPage() {
  const navigate = useNavigate()
  const [team, setTeam] = useState<string>('')
  const [line, setLine] = useState('라인A')
  const [ready, setReady] = useState<Kanban[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [orders, setOrders] = useState<WorkOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [kanbanRes, orderRes] = await Promise.all([
        fetchKanbans({ status: '준비', size: 300, ...(team ? { team } : {}) }),
        fetchWorkOrders(),
      ])
      setReady(kanbanRes.items)
      setOrders(orderRes.workOrders)
      setMessage(null)
    } catch (err) {
      setMessage({
        kind: 'err',
        text:
          err instanceof MesApiError
            ? err.message
            : 'MES 서버에 연결할 수 없습니다. 네트워크를 확인해 주세요.',
      })
    } finally {
      setLoading(false)
    }
  }, [team])

  useEffect(() => {
    void load()
  }, [load])

  // 반 필터가 바뀌면 이전 선택은 무효다.
  useEffect(() => {
    setSelected(new Set())
  }, [team])

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const allSelected = ready.length > 0 && selected.size === ready.length
  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(ready.map((k) => k.id)))

  const grouped = useMemo(() => {
    return ready.reduce<Record<string, Kanban[]>>((acc, k) => {
      const key = `${k.team} · ${k.processSection}`
      ;(acc[key] ??= []).push(k)
      return acc
    }, {})
  }, [ready])

  const handleIssue = async () => {
    if (selected.size === 0) return
    setBusy(true)
    try {
      const res = await issueWorkOrder({
        line,
        ...(team ? { team } : {}),
        kanbanIds: [...selected],
      })
      setMessage({
        kind: 'ok',
        text: `${res.workOrder.id} 발행 완료 — 간반 ${res.issuedCount}건이 현장에 내려갔습니다.`,
      })
      setSelected(new Set())
      await load()
    } catch (err) {
      setMessage({
        kind: 'err',
        text: err instanceof MesApiError ? err.message : '작업지시를 발행하지 못했습니다.',
      })
    } finally {
      setBusy(false)
    }
  }

  const handleCancel = async (order: WorkOrder) => {
    const reason = window.prompt(`${order.id} 취소 사유를 입력하세요.`, '주문 취소')
    if (reason === null) return
    setBusy(true)
    try {
      const res = await cancelWorkOrder(order.id, reason)
      setMessage({
        kind: 'ok',
        text: `${order.id} 취소 — 현장 카드 ${res.recalledKanbans}건 회수, 실적 ${res.rejectedResults}건 반려`,
      })
      await load()
    } catch (err) {
      if (err instanceof MesApiError && err.status === 409) {
        const force = window.confirm(`${err.message}\n\n그래도 취소하시겠습니까?`)
        if (force) {
          try {
            const res = await cancelWorkOrder(order.id, reason, true)
            setMessage({
              kind: 'ok',
              text: `${order.id} 강제 취소 — 현장 카드 ${res.recalledKanbans}건 회수`,
            })
            await load()
          } catch (e) {
            setMessage({
              kind: 'err',
              text: e instanceof MesApiError ? e.message : '취소하지 못했습니다.',
            })
          }
        }
      } else {
        setMessage({
          kind: 'err',
          text: err instanceof MesApiError ? err.message : '취소하지 못했습니다.',
        })
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col bg-gray-50 min-h-full">
      {/* 헤더 */}
      <div className="bg-green-900 text-white px-4 py-4 flex items-center gap-2 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="p-1 active:opacity-60">
          <ChevronLeft size={22} />
        </button>
        <h1 className="text-lg font-bold flex-1">작업지시 배포</h1>
        <button
          onClick={() => void load()}
          className="p-2 bg-white/15 rounded-xl active:bg-white/25"
          aria-label="새로고침"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {message && (
        <div
          role="status"
          className={`mx-4 mt-3 rounded-xl px-4 py-3 text-sm font-semibold ${
            message.kind === 'ok'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* 필터 */}
      <div className="px-4 pt-4 space-y-3">
        <div>
          <p className="text-xs font-bold text-gray-400 mb-2">반</p>
          <div className="flex flex-wrap gap-2">
            <FilterChip active={team === ''} onClick={() => setTeam('')} label="전체" />
            {TEAMS.map((t) => (
              <FilterChip key={t} active={team === t} onClick={() => setTeam(t)} label={t} />
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-bold text-gray-400 mb-2">라인</p>
          <input
            value={line}
            onChange={(e) => setLine(e.target.value)}
            className="input-ds"
            placeholder="라인명"
          />
        </div>
      </div>

      {/* 발행 대상 */}
      <div className="px-4 pt-5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold text-gray-400">
            발행 대기 간반 ({ready.length}건)
          </p>
          {ready.length > 0 && (
            <button
              onClick={toggleAll}
              className="text-xs font-bold text-green-800 active:opacity-60"
            >
              {allSelected ? '전체 해제' : '전체 선택'}
            </button>
          )}
        </div>

        {loading ? (
          <p className="text-sm text-gray-400 py-8 text-center">불러오는 중…</p>
        ) : ready.length === 0 ? (
          <p className="text-sm text-gray-400 py-8 text-center">
            발행할 수 있는 간반이 없습니다.
          </p>
        ) : (
          <div className="space-y-4">
            {Object.entries(grouped).map(([group, items]) => (
              <div key={group}>
                <p className="text-[16px] font-bold text-gray-400 mb-1.5">{group}</p>
                <div className="space-y-1.5">
                  {items.map((k) => {
                    const on = selected.has(k.id)
                    return (
                      <button
                        key={k.id}
                        onClick={() => toggle(k.id)}
                        className={`w-full flex items-center gap-3 rounded-2xl px-4 py-3.5 border text-left transition-colors ${
                          on
                            ? 'bg-green-50 border-green-300'
                            : 'bg-white border-gray-200 active:bg-gray-50'
                        }`}
                      >
                        <span
                          className={`w-5 h-5 rounded-md flex items-center justify-center text-[16px] font-bold shrink-0 ${
                            on ? 'bg-green-800 text-white' : 'border-2 border-gray-300'
                          }`}
                        >
                          {on ? '✓' : ''}
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block text-sm font-bold text-gray-900 truncate">
                            {k.productName}
                          </span>
                          <span className="block text-[16px] text-gray-400 mt-0.5">
                            {k.kanbanNumber} · {k.deviceId ?? '단말 미배정'}
                          </span>
                        </span>
                        <span className="text-sm font-bold text-gray-700 shrink-0">
                          {k.plannedQty}
                          <span className="text-[16px] text-gray-400 ml-0.5">{k.unit}</span>
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 발행 이력 */}
      <div className="px-4 pt-6 pb-32">
        <p className="text-xs font-bold text-gray-400 mb-2">오늘 발행한 작업지시</p>
        {orders.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">발행 이력이 없습니다.</p>
        ) : (
          <div className="space-y-1.5">
            {orders.map((o) => (
              <div
                key={o.id}
                className="bg-white rounded-2xl px-4 py-3.5 border border-gray-200"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-900 flex-1 truncate">
                    {o.title}
                  </span>
                  <span
                    className={`text-[14px] font-bold px-2 py-0.5 rounded-full ${
                      o.status === '발행'
                        ? 'bg-green-100 text-green-800'
                        : o.status === '취소'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {o.status}
                  </span>
                </div>
                <p className="text-[16px] text-gray-400 mt-1">
                  {o.id} · 간반 {o.kanbanIds.length}건
                  {o.cancelReason ? ` · 취소사유: ${o.cancelReason}` : ''}
                </p>
                {o.status === '발행' && (
                  <button
                    onClick={() => void handleCancel(o)}
                    disabled={busy}
                    className="mt-2.5 flex items-center gap-1.5 text-xs font-bold text-red-600 active:opacity-60 disabled:opacity-40"
                  >
                    <XCircle size={14} /> 지시 취소 (현장 카드 회수)
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 발행 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 max-w-[420px] mx-auto p-4 bg-gradient-to-t from-white via-white to-transparent">
        <button
          onClick={() => void handleIssue()}
          disabled={busy || selected.size === 0}
          className="w-full flex items-center justify-center gap-2 rounded-2xl py-4 text-base font-bold text-white bg-green-800 disabled:bg-gray-300 active:bg-green-900"
        >
          <Send size={18} />
          {busy ? '발행 중…' : `작업지시 발행 (${selected.size}건)`}
        </button>
      </div>
    </div>
  )
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${
        active ? 'bg-green-800 text-white' : 'bg-white text-gray-600 border border-gray-200'
      }`}
    >
      {label}
    </button>
  )
}
