import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, ChevronLeft, RefreshCw, Undo2 } from 'lucide-react'
import {
  MesApiError,
  approveResult,
  bulkApproveResults,
  fetchPendingResults,
  rejectResult,
  type ProductionResult,
} from '@/api/mes'

// ============================================================================
// 실적 승인 / 반려
//
// 현장이 올린 실적을 반장이 승인해야 집계에 확정된다.
// 반려하면 서버가 집계 수량을 되돌리고 간반을 다시 '작업'으로 내려 재입력을 받는다.
// ============================================================================

export default function ApprovalPage() {
  const navigate = useNavigate()
  const [results, setResults] = useState<ProductionResult[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetchPendingResults()
      setResults(res.results)
      setSelected(new Set())
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
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const act = async (fn: () => Promise<string>) => {
    setBusy(true)
    try {
      const text = await fn()
      setMessage({ kind: 'ok', text })
      await load()
    } catch (err) {
      setMessage({
        kind: 'err',
        text: err instanceof MesApiError ? err.message : '처리하지 못했습니다.',
      })
    } finally {
      setBusy(false)
    }
  }

  const handleReject = (r: ProductionResult) => {
    const reason = window.prompt(`${r.kanbanNumber} 반려 사유를 입력하세요.`, '')
    if (reason === null) return
    if (!reason.trim()) {
      setMessage({ kind: 'err', text: '반려 사유를 입력해 주세요.' })
      return
    }
    void act(async () => {
      await rejectResult(r.id, reason)
      return `${r.kanbanNumber} 반려 — 집계에서 차감되고 현장에 재입력 요청이 갔습니다.`
    })
  }

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  return (
    <div className="flex flex-col bg-gray-50 min-h-full">
      <div className="bg-green-900 text-white px-4 py-4 flex items-center gap-2 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="p-1 active:opacity-60">
          <ChevronLeft size={22} />
        </button>
        <h1 className="text-lg font-bold flex-1">실적 승인</h1>
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

      <div className="px-4 py-4 pb-32">
        <p className="text-xs font-bold text-gray-400 mb-2">
          승인 대기 ({results.length}건)
        </p>

        {loading ? (
          <p className="text-sm text-gray-400 py-8 text-center">불러오는 중…</p>
        ) : results.length === 0 ? (
          <p className="text-sm text-gray-400 py-8 text-center">승인할 실적이 없습니다.</p>
        ) : (
          <div className="space-y-1.5">
            {results.map((r) => {
              const on = selected.has(r.id)
              const loss = r.inputQty > 0 ? r.inputQty - (r.goodQty + r.defectQty) : 0
              return (
                <div
                  key={r.id}
                  className={`rounded-2xl px-4 py-3.5 border ${
                    on ? 'bg-green-50 border-green-300' : 'bg-white border-gray-200'
                  }`}
                >
                  <button
                    onClick={() => toggle(r.id)}
                    className="w-full flex items-center gap-3 text-left"
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
                        {r.kanbanNumber}
                      </span>
                      <span className="block text-[16px] text-gray-400 mt-0.5">
                        {r.reportedBy} · {new Date(r.reportedAt).toLocaleTimeString('ko-KR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </span>
                  </button>

                  <div className="grid grid-cols-4 gap-2 mt-3 text-center">
                    <Metric label="투입" value={r.inputQty} unit={r.unit} />
                    <Metric label="양품" value={r.goodQty} unit={r.unit} accent />
                    <Metric label="불량" value={r.defectQty} unit={r.unit} warn={r.defectQty > 0} />
                    <Metric label="손실" value={loss} unit={r.unit} warn={loss > 0} />
                  </div>
                  {r.weightKg !== null && (
                    <p className="text-[16px] text-gray-400 mt-2">중량 {r.weightKg} kg</p>
                  )}

                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() =>
                        void act(async () => {
                          await approveResult(r.id)
                          return `${r.kanbanNumber} 승인 완료`
                        })
                      }
                      disabled={busy}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-bold text-white bg-green-800 disabled:bg-gray-300"
                    >
                      <Check size={15} /> 승인
                    </button>
                    <button
                      onClick={() => handleReject(r)}
                      disabled={busy}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-bold text-red-600 bg-red-50 border border-red-200 disabled:opacity-40"
                    >
                      <Undo2 size={15} /> 반려
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {selected.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 max-w-[420px] mx-auto p-4 bg-gradient-to-t from-white via-white to-transparent">
          <button
            onClick={() =>
              void act(async () => {
                const res = await bulkApproveResults([...selected])
                return `일괄 승인 — 성공 ${res.approved.length}건${
                  res.failed.length > 0 ? ` / 실패 ${res.failed.length}건` : ''
                }`
              })
            }
            disabled={busy}
            className="w-full rounded-2xl py-4 text-base font-bold text-white bg-green-800 disabled:bg-gray-300"
          >
            선택 {selected.size}건 일괄 승인
          </button>
        </div>
      )}
    </div>
  )
}

function Metric({
  label,
  value,
  unit,
  accent,
  warn,
}: {
  label: string
  value: number
  unit: string
  accent?: boolean
  warn?: boolean
}) {
  return (
    <div className="bg-gray-50 rounded-xl py-2">
      <p className="text-[14px] text-gray-400 font-bold">{label}</p>
      <p
        className={`text-sm font-bold mt-0.5 ${
          warn ? 'text-red-600' : accent ? 'text-green-800' : 'text-gray-700'
        }`}
      >
        {value}
        <span className="text-[14px] text-gray-400 ml-0.5">{unit}</span>
      </p>
    </div>
  )
}
