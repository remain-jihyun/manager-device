import { useEffect, useState } from 'react'
import TopBar from '@/components/TopBar'
import {
  ChevronLeft,
  CheckCircle2,
  Search,
  QrCode,
  X,
  AlertTriangle,
  ScanLine,
  Lock,
} from 'lucide-react'
import {
  WAREHOUSES,
  TEMP_BADGE,
  WORKERS,
  workerInitial,
  itemUnitOf,
  unitPrice,
  auditKey,
  expectedQty,
  devFlow,
  type Warehouse,
  type InspectionItem,
} from '@/data/inventory'
import { loadAudit, saveAudit } from '@/data/auditStore'

type ViewType = 'list' | 'form'
type Mode = 'daily' | 'monthly' // 일·주간 / 월말
type Step = 1 | 2 | 'confirm' // 월말 단계
type Modal =
  | { kind: 'recheck'; actual: number; expected: number }
  | { kind: 'finalize' }
  | null

const won = (n: number) => n.toLocaleString('ko-KR')
const BIG_DIFF = 0.1 // 예상 대비 10% 이상 차이 시 재확인

export default function InventoryPage() {
  const [view, setView] = useState<ViewType>('list')
  const [mode, setMode] = useState<Mode>('daily')
  const [step, setStep] = useState<Step>(1) // 월말 단계 (일·주간은 무시)
  const [operator] = useState<string>(WORKERS[0])
  const [warehouseId, setWarehouseId] = useState<string>(
    WAREHOUSES.find(w => w.items.length > 0)?.id ?? WAREHOUSES[0].id
  )
  const [currentCode, setCurrentCode] = useState<string | null>(null)
  const [order, setOrder] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [scanning, setScanning] = useState(false)
  const [modal, setModal] = useState<Modal>(null)
  const [banner, setBanner] = useState<string>('')

  // 입력값: 박스 품목은 박스 수 + 낱개 수 / 일반·변동 품목은 단일 수량
  const [inputQty, setInputQty] = useState('')
  const [boxCount, setBoxCount] = useState('')
  const [looseCount, setLooseCount] = useState('')

  // 누적 저장소 로드 (MES 데이터 계약)
  const initial = loadAudit()
  const [round1, setRound1] = useState<Record<string, number>>(initial.round1)
  const [round2, setRound2] = useState<Record<string, number>>(initial.round2)
  const [confirmed, setConfirmed] = useState<Record<string, number>>(initial.confirmed)
  const [worker1, setWorker1] = useState<Record<string, string>>(initial.worker1)
  const [worker2, setWorker2] = useState<Record<string, string>>(initial.worker2)
  const [recheck, setRecheck] = useState<Record<string, boolean>>(initial.recheck)

  useEffect(() => {
    saveAudit({
      round1,
      round2,
      confirmed,
      worker1,
      worker2,
      recheck,
      updatedAt: new Date().toISOString(),
    })
  }, [round1, round2, confirmed, worker1, worker2, recheck])

  useEffect(() => {
    if (!banner) return
    const t = setTimeout(() => setBanner(''), 2400)
    return () => clearTimeout(t)
  }, [banner])

  const warehouse: Warehouse = WAREHOUSES.find(w => w.id === warehouseId) ?? WAREHOUSES[0]
  const items = warehouse.items

  // 현재 입력 회차: 일·주간 = 1, 월말 1단계 = 1, 월말 2단계 = 2
  const activeRound: 1 | 2 = mode === 'monthly' && step === 2 ? 2 : 1
  const roundMap = activeRound === 1 ? round1 : round2
  const setRoundMap = activeRound === 1 ? setRound1 : setRound2
  const setWorkerMap = activeRound === 1 ? setWorker1 : setWorker2

  const key = (code: string) => auditKey(warehouse.id, code)
  const isDone = (code: string) => roundMap[key(code)] !== undefined
  // 월말 2차: 1차 완료 품목만 활성 (실시간 반영)
  const isActive = (item: InspectionItem) =>
    !(mode === 'monthly' && step === 2) || round1[key(item.code)] !== undefined

  const doneCount1 = items.filter(i => round1[key(i.code)] !== undefined).length
  const doneCount2 = items.filter(i => round2[key(i.code)] !== undefined).length
  const confirmedCount = items.filter(i => confirmed[key(i.code)] !== undefined).length

  // 월말 차이 품목 (1차≠2차)
  const diffItems = items.filter(i => {
    const r1 = round1[key(i.code)]
    const r2 = round2[key(i.code)]
    return r1 !== undefined && r2 !== undefined && r1 !== r2
  })

  // ── 폼 탐색 순서 (미진행 → 진행 완료) ──
  const buildOrder = () => {
    const pool = items.filter(isActive)
    return [
      ...pool.filter(i => !isDone(i.code)).map(i => i.code),
      ...pool.filter(i => isDone(i.code)).map(i => i.code),
    ]
  }
  const seqFiltered = order.filter(c => items.some(i => i.code === c))
  const seq = seqFiltered.length ? seqFiltered : items.filter(isActive).map(i => i.code)

  // ── 입력값 프리필 (박스 품목은 박스/낱개로 분해) ──
  const prefill = (item: InspectionItem) => {
    const saved = roundMap[key(item.code)]
    if (item.boxQty && !item.isVariable) {
      if (saved !== undefined) {
        setBoxCount(String(Math.floor(saved / item.boxQty)))
        setLooseCount(String(saved % item.boxQty))
      } else {
        setBoxCount('')
        setLooseCount('')
      }
      setInputQty('')
    } else {
      setInputQty(saved !== undefined ? String(saved) : '')
      setBoxCount('')
      setLooseCount('')
    }
  }

  const openForm = (item: InspectionItem) => {
    setCurrentCode(item.code)
    prefill(item)
    setView('form')
  }

  const currentItem = currentCode ? items.find(i => i.code === currentCode) ?? null : null
  const currentIdx = currentItem ? seq.indexOf(currentItem.code) : -1

  // 현재 폼의 실사 수량 산출
  const formActual = (item: InspectionItem): number => {
    const expected = expectedQty(item)
    if (item.boxQty && !item.isVariable) {
      if (boxCount === '' && looseCount === '') return expected
      return (Number(boxCount) || 0) * item.boxQty + (Number(looseCount) || 0)
    }
    return inputQty === '' ? expected : Number(inputQty)
  }

  // 실사값 저장 + 작업자 태깅 + (월말 2차) 자동확정 + 다음 이동
  const commit = (item: InspectionItem, actual: number, needRecheck: boolean) => {
    const k = key(item.code)
    setRoundMap(prev => ({ ...prev, [k]: actual }))
    setWorkerMap(prev => ({ ...prev, [k]: operator }))
    setRecheck(prev => ({ ...prev, [k]: needRecheck }))

    if (mode === 'monthly' && step === 2) {
      // 1차=2차면 자동 확정, 다르면 차이 품목으로 남김(확정 보류)
      const r1 = round1[k]
      if (r1 !== undefined && r1 === actual) {
        setConfirmed(prev => ({ ...prev, [k]: actual }))
      } else {
        setConfirmed(prev => {
          const next = { ...prev }
          delete next[k]
          return next
        })
      }
    }

    const nextCode = seq[currentIdx + 1]
    const nextItem = nextCode ? items.find(i => i.code === nextCode) ?? null : null
    if (nextItem && isActive(nextItem)) {
      setCurrentCode(nextItem.code)
      prefill(nextItem)
    } else {
      setView('list')
    }
  }

  const handleConfirm = () => {
    if (!currentItem) return
    const expected = expectedQty(currentItem)
    const actual = formActual(currentItem)
    const big = expected > 0 && Math.abs(actual - expected) / expected >= BIG_DIFF
    if (big) {
      setModal({ kind: 'recheck', actual, expected })
      return
    }
    commit(currentItem, actual, false)
  }

  // ── 재고 확정 ──
  const finalizeDaily = () => {
    setConfirmed(prev => {
      const next = { ...prev }
      items.forEach(i => {
        const k = key(i.code)
        // 실사한 품목은 실사값, 안 한 품목은 예상재고로 확정
        next[k] = round1[k] !== undefined ? round1[k] : expectedQty(i)
      })
      return next
    })
    setBanner('재고 확정 완료 — 실사값/예상재고 반영')
    setModal(null)
  }

  const finalizeMonthly = () => {
    setConfirmed(prev => {
      const next = { ...prev }
      items.forEach(i => {
        const k = key(i.code)
        const r1 = round1[k]
        const r2 = round2[k]
        if (next[k] !== undefined) return // 회계 담당자가 선택한 값 유지
        if (r2 !== undefined) next[k] = r2
        else if (r1 !== undefined) next[k] = r1
        else next[k] = expectedQty(i)
      })
      return next
    })
    setBanner('월말 재고 확정 완료')
    setModal(null)
  }

  // 월말 차이 품목: 회계 담당자가 1차/2차 중 선택해 확정
  const pickConfirm = (item: InspectionItem, value: number) => {
    setConfirmed(prev => ({ ...prev, [key(item.code)]: value }))
  }

  // ── 스캔(기본 진입): 미실사 활성 품목 자동 선택 ──
  const runScan = () => {
    setScanning(true)
    setTimeout(() => {
      const pool = items.filter(i => isActive(i) && !isDone(i.code))
      const target = pool[0] ?? items.filter(isActive)[0]
      setScanning(false)
      if (target) {
        setOrder(buildOrder())
        openForm(target)
      }
    }, 850)
  }

  const filtered = search
    ? items.filter(i => i.name.includes(search) || i.code.includes(search))
    : items

  // ════════════════════════════════════════════════════════════════════
  // 실사 입력 폼
  // ════════════════════════════════════════════════════════════════════
  if (view === 'form' && currentItem) {
    const item = currentItem
    const expected = expectedQty(item)
    const { inbound, outflow } = devFlow(item.code)
    const savedVal = roundMap[key(item.code)]
    const actual = formActual(item)
    const isBox = !!item.boxQty && !item.isVariable
    const u = itemUnitOf(item)
    const doneCount = items.filter(i => isActive(i) && isDone(i.code)).length
    const totalActive = items.filter(isActive).length
    const w1 = worker1[key(item.code)]

    return (
      <div className="relative flex flex-col h-full bg-gray-50">
        {/* 헤더 (최소화) */}
        <div className="bg-white border-b border-gray-100 shrink-0">
          <div className="flex items-center px-3" style={{ height: '50px' }}>
            <button onClick={() => setView('list')} className="p-1 -ml-1 text-gray-800">
              <ChevronLeft size={24} strokeWidth={2} />
            </button>
            <div className="flex-1 text-center min-w-0">
              <p className="text-[22px] font-bold text-gray-900 truncate">
                {item.name}
                {item.seasonEnded && (
                  <span className="ml-1.5 align-middle px-1.5 py-0.5 rounded-md text-[14px] font-bold bg-amber-100 text-amber-700">
                    시즌종료
                  </span>
                )}
              </p>
              <p className="text-[16px] text-gray-400">
                {warehouse.name} · {item.code}
                {item.volume ? ` · 용량 ${item.volume}${item.volumeUnit ?? ''}` : ''}
              </p>
            </div>
            <span className="text-xs text-gray-400">{currentIdx + 1}/{totalActive}</span>
          </div>
          <div className="h-1 bg-gray-100">
            <div
              className="h-full bg-green-800 transition-all"
              style={{ width: `${totalActive ? (doneCount / totalActive) * 100 : 0}%` }}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {/* 회차 + 작업자 배지 */}
          <div className="flex items-center justify-between gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                activeRound === 1 ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
              }`}
            >
              {mode === 'daily' ? '일·주간 실사' : `${activeRound}차 실사`}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="w-6 h-6 rounded-full bg-green-900 text-white flex items-center justify-center text-[16px] font-bold">
                {workerInitial(operator)}
              </span>
              {operator}
            </span>
          </div>

          {/* 예상 재고 (크게) + 입고/불출 (작게) */}
          <div className="bg-white rounded-2xl border border-gray-200 px-5 py-4">
            <p className="text-center text-xs text-gray-400 mb-1">예상 재고</p>
            <p className="text-center text-5xl font-extrabold text-gray-900 tabular-nums leading-none">
              {expected}
              <span className="text-lg font-bold text-gray-400 ml-1">{item.unit}</span>
            </p>
            <div className="flex items-center justify-center gap-4 mt-3 text-xs">
              <span className="text-gray-400">어제 {item.bookQty}</span>
              <span className="text-green-600">입고 +{inbound}</span>
              <span className="text-red-500">불출 -{outflow}</span>
            </div>
          </div>

          {/* 2차일 때 1차 정보 */}
          {mode === 'monthly' && step === 2 && (
            <div className="bg-blue-50 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs">
              <span className="text-blue-700 font-bold">
                1차 실사값 {round1[key(item.code)]} {item.unit}
              </span>
              {w1 && (
                <span className="flex items-center gap-1 text-blue-500">
                  <span className="w-5 h-5 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center text-[14px] font-bold">
                    {workerInitial(w1)}
                  </span>
                  {w1} 담당
                </span>
              )}
            </div>
          )}

          {/* 실사 입력 */}
          <div className="bg-white rounded-2xl border border-gray-200 px-4 py-5">
            {isBox ? (
              <>
                <p className="text-center text-xs text-gray-400 mb-1">
                  실사 수량 입력 · 박스당 {item.boxQty} {u}
                </p>
                <div className="flex items-end justify-center gap-3 mt-2">
                  <div className="text-center">
                    <input
                      type="number"
                      value={boxCount}
                      onChange={e => setBoxCount(e.target.value)}
                      placeholder="0"
                      autoFocus
                      className="w-24 border-b-2 border-green-500 bg-transparent text-center text-4xl font-bold text-gray-900 focus:outline-none tabular-nums"
                    />
                    <p className="text-xs text-gray-500 mt-1 font-bold">박스</p>
                  </div>
                  <span className="text-2xl text-gray-300 pb-6">+</span>
                  <div className="text-center">
                    <input
                      type="number"
                      value={looseCount}
                      onChange={e => setLooseCount(e.target.value)}
                      placeholder="0"
                      className="w-24 border-b-2 border-green-500 bg-transparent text-center text-4xl font-bold text-gray-900 focus:outline-none tabular-nums"
                    />
                    <p className="text-xs text-gray-500 mt-1 font-bold">낱개 ({u})</p>
                  </div>
                </div>
                <p className="text-center text-sm font-bold text-green-800 mt-4">
                  합계 {actual} {item.unit}
                </p>
              </>
            ) : (
              <>
                <p className="text-center text-xs text-gray-400 mb-2">
                  실사 재고 <span className="text-gray-300">(예상 {expected})</span>
                  {item.isVariable && <span className="ml-1 text-amber-600">· 변동(낱개)</span>}
                </p>
                <div className="flex items-baseline justify-center gap-2">
                  <input
                    type="number"
                    value={inputQty}
                    onChange={e => setInputQty(e.target.value)}
                    placeholder={String(expected)}
                    autoFocus
                    className="w-36 border-b-2 border-green-500 bg-transparent text-center text-5xl font-bold text-gray-900 focus:outline-none tabular-nums"
                  />
                  <span className="text-base text-gray-400">{item.unit}</span>
                </div>
              </>
            )}
            {savedVal !== undefined && (
              <p className="text-center text-xs text-green-700 mt-3">
                저장된 값: {savedVal} {item.unit}
              </p>
            )}
          </div>
        </div>

        {/* 하단 고정 버튼 */}
        <div className="shrink-0 px-4 pt-3 pb-5 bg-white border-t border-gray-100 space-y-2">
          <button
            onClick={handleConfirm}
            className="w-full py-4 bg-green-900 text-white rounded-2xl text-[21px] font-bold active:bg-green-800 flex items-center justify-center gap-2"
          >
            <CheckCircle2 size={20} />
            확정 ({actual} {item.unit})
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => { const p = items.find(i => i.code === seq[currentIdx - 1]); if (p) openForm(p) }}
              disabled={currentIdx <= 0}
              className="flex-1 py-3 border border-gray-200 rounded-2xl text-sm text-gray-500 disabled:text-gray-200 active:bg-gray-50"
            >
              ‹ 이전
            </button>
            <button
              onClick={() => { const n = items.find(i => i.code === seq[currentIdx + 1]); if (n) openForm(n); else setView('list') }}
              className="flex-1 py-3 border border-gray-200 rounded-2xl text-sm text-gray-500 active:bg-gray-50"
            >
              {currentIdx < seq.length - 1 ? '다음 ›' : '목록으로'}
            </button>
          </div>
        </div>

        {/* 재확인 얼럿 (강제 차단 X) */}
        {modal?.kind === 'recheck' && (
          <div className="absolute inset-0 z-[100] bg-black/40 flex items-center justify-center px-6">
            <div className="bg-white rounded-2xl w-full max-w-xs p-5 text-center">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3">
                <AlertTriangle size={26} className="text-amber-600" />
              </div>
              <p className="text-base font-bold text-gray-900">재확인하세요</p>
              <p className="text-sm text-gray-500 mt-1.5">
                예상 {modal.expected}와 차이가 큽니다
                <br />
                입력값 <b className="text-gray-800">{modal.actual} {item.unit}</b>
              </p>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setModal(null)}
                  className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 active:bg-gray-50"
                >
                  다시 입력
                </button>
                <button
                  onClick={() => { commit(item, modal.actual, true); setModal(null) }}
                  className="flex-1 py-3 bg-amber-500 text-gray-950 rounded-xl text-sm font-bold active:bg-amber-600"
                >
                  확인하고 진행
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ════════════════════════════════════════════════════════════════════
  // 메인 리스트
  // ════════════════════════════════════════════════════════════════════
  const inactiveItems = items.filter(i => !isActive(i))
  // 완료(실사)한 품목은 리스트 하단으로 내림 (미실사 우선, 그룹 내 기존 순서 유지)
  const activeFiltered = filtered
    .filter(isActive)
    .sort((a, b) => Number(isDone(a.code)) - Number(isDone(b.code)))
  const monthlyConfirm = mode === 'monthly' && step === 'confirm'

  return (
    <div className="relative flex flex-col h-full bg-gray-50">
      <TopBar title="재고실사" showBack backTo="/menu" />

      {/* 모드 토글 + 작업자 (상단 최소화) */}
      <div className="bg-white border-b border-gray-100 px-3 py-2 shrink-0 flex items-center gap-2">
        <div className="flex bg-gray-100 rounded-xl p-0.5 gap-0.5">
          {([['daily', '일·주간'], ['monthly', '월말']] as const).map(([m, label]) => (
            <button
              key={m}
              onClick={() => { setMode(m); setStep(1); setView('list') }}
              className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${
                mode === m ? 'bg-green-900 text-white' : 'text-gray-500'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 월말 단계 표시 */}
      {mode === 'monthly' && (
        <div className="bg-white border-b border-gray-100 px-3 py-2 shrink-0 flex items-center gap-1">
          {([[1, '1차'], [2, '2차'], ['confirm', '재고확정']] as const).map(([s, label], idx) => (
            <button
              key={String(s)}
              onClick={() => { setStep(s); setOrder([]); setView('list') }}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${
                step === s ? 'bg-green-100 text-green-800' : 'text-gray-400 bg-gray-50'
              }`}
            >
              {idx + 1}. {label}
            </button>
          ))}
        </div>
      )}

      {/* 창고 칩 바 (기존 자산 보존) */}
      <div className="bg-white border-b border-gray-100 shrink-0">
        <div className="flex gap-2 overflow-x-auto px-3 py-2 no-scrollbar">
          {WAREHOUSES.map(w => {
            const active = w.id === warehouseId
            const total = w.items.length
            const done = w.items.filter(i => roundMap[auditKey(w.id, i.code)] !== undefined).length
            const allDone = total > 0 && done === total
            return (
              <button
                key={w.id}
                onClick={() => { setWarehouseId(w.id); setOrder([]); setView('list') }}
                className={`shrink-0 px-3.5 py-2 rounded-2xl text-sm font-bold border transition-colors whitespace-nowrap ${
                  active ? 'bg-green-900 text-white border-green-900' : 'bg-white text-gray-600 border-gray-200'
                }`}
              >
                {w.name}
                <span className={`ml-1.5 text-[16px] font-bold ${active ? 'text-green-200' : allDone ? 'text-green-600' : 'text-gray-400'}`}>
                  {total === 0 ? '0' : `${done}/${total}`}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 창고 헤더 + 요약 (1줄로 압축) */}
      <div className="bg-white border-b border-gray-100 px-4 py-2 shrink-0 flex items-center gap-2">
        <span className="text-base font-bold text-gray-900">{warehouse.name}</span>
        {warehouse.temperatureName && (
          <span className={`px-2 py-0.5 rounded-full text-[16px] font-bold ${TEMP_BADGE[warehouse.temperatureName] ?? 'bg-gray-100 text-gray-600'}`}>
            {warehouse.temperatureName}
          </span>
        )}
        <span className="ml-auto text-xs text-gray-400">
          {mode === 'monthly'
            ? `1차 ${doneCount1} · 2차 ${doneCount2} · 확정 ${confirmedCount}`
            : `실사 ${doneCount1} · 확정 ${confirmedCount} / ${items.length}`}
        </span>
      </div>

      {/* 스캔(기본) + 검색 */}
      {!monthlyConfirm && (
        <div className="bg-white border-b border-gray-100 px-4 py-2.5 shrink-0 space-y-2">
          <button
            onClick={runScan}
            className="w-full flex items-center gap-3 bg-green-900 text-white rounded-2xl px-4 py-3 active:bg-green-800"
          >
            <ScanLine size={20} className="shrink-0" />
            <span className="text-sm font-bold flex-1 text-left">바코드·QR 스캔으로 실사</span>
            <QrCode size={18} className="opacity-50 shrink-0" />
          </button>
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="품목명·코드 검색"
              className="input-ds-search"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* 본문 */}
      <div className="flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <p className="text-center text-gray-400 text-sm mt-12">연결된 품목이 없습니다</p>
        ) : monthlyConfirm ? (
          // ── 월말 재고 확정 단계 ──
          <ConfirmStep
            items={items}
            keyOf={key}
            round1={round1}
            round2={round2}
            confirmed={confirmed}
            recheck={recheck}
            diffItems={diffItems}
            onPick={pickConfirm}
          />
        ) : (
          <div className="divide-y divide-gray-100 bg-white">
            {/* 활성 품목 */}
            {activeFiltered.map((item, idx) => {
              const r1 = round1[key(item.code)]
              const r2 = round2[key(item.code)]
              const conf = confirmed[key(item.code)]
              const done = isDone(item.code)
              const expected = expectedQty(item)
              const w = activeRound === 1 ? worker1[key(item.code)] : worker2[key(item.code)]
              const needRecheck = recheck[key(item.code)]
              const diffQty = conf !== undefined ? conf - expected : 0
              return (
                <div
                  key={item.code}
                  onClick={() => { setOrder(buildOrder()); openForm(item) }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left active:bg-gray-50 cursor-pointer"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${done ? (activeRound === 1 ? 'bg-blue-50' : 'bg-green-50') : 'bg-gray-100'}`}>
                    {done
                      ? <CheckCircle2 size={18} className={activeRound === 1 ? 'text-blue-500' : 'text-green-600'} />
                      : <span className="text-xs text-gray-400 font-bold">{idx + 1}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[19px] font-bold text-gray-900 flex items-center gap-1.5">
                      {item.name}
                      {item.seasonEnded && (
                        <span className="px-1.5 py-0.5 rounded-md text-[14px] font-bold bg-amber-100 text-amber-700">시즌종료</span>
                      )}
                      {needRecheck && (
                        <span className="px-1.5 py-0.5 rounded-md text-[14px] font-bold bg-red-100 text-red-600">재확인</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                      예상 {expected}{item.unit}
                      {item.boxQty && !item.isVariable ? ` · 박스당 ${item.boxQty}${itemUnitOf(item)}` : ''}
                      {r1 !== undefined && <span className="text-blue-500"> · 1차 {r1}</span>}
                      {r2 !== undefined && <span className="text-green-600"> · 2차 {r2}</span>}
                      {conf !== undefined && (
                        <span className="text-gray-700"> · 확정 {conf}{diffQty !== 0 && <span className={diffQty > 0 ? 'text-green-600' : 'text-red-500'}>({diffQty > 0 ? '+' : ''}{diffQty})</span>}</span>
                      )}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {w && (
                      <span className="flex items-center gap-1 text-[14px] text-gray-400">
                        <span className="w-4 h-4 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-[13px] font-bold">
                          {workerInitial(w)}
                        </span>
                        {w}
                      </span>
                    )}
                    <span className={`text-[16px] font-bold px-2 py-0.5 rounded-full ${done ? (activeRound === 1 ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-700') : 'bg-gray-100 text-gray-400'}`}>
                      {done ? '완료' : '미실사'}
                    </span>
                  </div>
                </div>
              )
            })}

            {/* 비활성 품목 (월말 2차: 1차 미완료) */}
            {mode === 'monthly' && step === 2 && inactiveItems.length > 0 && (
              <>
                <div className="px-4 py-2 bg-gray-50 text-[16px] font-bold text-gray-400 flex items-center gap-1">
                  <Lock size={12} /> 1차 미완료 — 2차 불가 ({inactiveItems.length})
                </div>
                {inactiveItems.map(item => (
                  <div key={item.code} className="flex items-center gap-3 px-4 py-3 bg-gray-50/70 opacity-60">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                      <Lock size={14} className="text-gray-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[19px] font-bold text-gray-400">{item.name}</p>
                      <p className="text-xs text-gray-300">1차 실사 대기</p>
                    </div>
                    <span className="text-[16px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">비활성</span>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* 하단 고정 액션 */}
      <div className="shrink-0 px-4 pt-2.5 pb-5 bg-white border-t border-gray-100">
        {mode === 'daily' || (mode === 'monthly' && step !== 'confirm') ? (
          <div className="flex gap-2">
            <button
              onClick={() => {
                const ord = buildOrder()
                setOrder(ord)
                const first = items.find(i => i.code === ord[0])
                if (first) openForm(first)
              }}
              disabled={items.filter(isActive).length === 0}
              className="flex-1 py-3.5 rounded-2xl bg-green-900 text-white text-[19px] font-bold active:bg-green-800 disabled:bg-gray-200 disabled:text-gray-400"
            >
              재고 실사 진행
            </button>
            {mode === 'daily' && (
              <button
                onClick={() => setModal({ kind: 'finalize' })}
                className="flex-1 py-3.5 rounded-2xl bg-amber-500 text-gray-950 text-[19px] font-bold active:bg-amber-600"
              >
                재고 확정
              </button>
            )}
          </div>
        ) : (
          // 월말 재고 확정 단계
          <button
            onClick={() => setModal({ kind: 'finalize' })}
            className="w-full py-3.5 rounded-2xl bg-amber-500 text-gray-950 text-[19px] font-bold active:bg-amber-600"
          >
            최종 재고 확정 (차이 {diffItems.length}건 검토)
          </button>
        )}
      </div>

      {/* 토스트 배너 */}
      {banner && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-24 z-[90] bg-gray-900 text-white text-sm font-bold px-4 py-2.5 rounded-full shadow-lg">
          {banner}
        </div>
      )}

      {/* 스캔 오버레이 */}
      {scanning && (
        <div className="absolute inset-0 z-[100] bg-black/80 flex flex-col items-center justify-center">
          <div className="relative w-56 h-40 border-2 border-green-400 rounded-2xl overflow-hidden">
            <div className="absolute left-0 right-0 h-0.5 bg-green-400 animate-pulse" style={{ top: '50%' }} />
            <ScanLine size={48} className="text-green-400 absolute inset-0 m-auto opacity-40" />
          </div>
          <p className="text-white text-sm font-bold mt-4">바코드 인식 중…</p>
        </div>
      )}

      {/* 재고 확정 얼럿 */}
      {modal?.kind === 'finalize' && (
        <div className="absolute inset-0 z-[100] bg-black/40 flex items-center justify-center px-6">
          <div className="bg-white rounded-2xl w-full max-w-xs p-5 text-center">
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 size={26} className="text-amber-600" />
            </div>
            <p className="text-base font-bold text-gray-900">재고를 확정할까요?</p>
            <p className="text-sm text-gray-500 mt-1.5">
              {mode === 'daily'
                ? '실사한 품목은 실사값, 안 한 품목은 예상재고로 확정됩니다.'
                : `차이 ${diffItems.length}건을 포함해 ${warehouse.name} 재고를 최종 확정합니다.`}
            </p>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setModal(null)} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 active:bg-gray-50">
                취소
              </button>
              <button
                onClick={mode === 'daily' ? finalizeDaily : finalizeMonthly}
                className="flex-1 py-3 bg-amber-500 text-gray-950 rounded-xl text-sm font-bold active:bg-amber-600"
              >
                확정
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── 월말 재고 확정 단계 (차이 품목 리스트업 + 확정값 vs 예상 금액) ──
function ConfirmStep({
  items,
  keyOf,
  round1,
  round2,
  confirmed,
  recheck,
  diffItems,
  onPick,
}: {
  items: InspectionItem[]
  keyOf: (code: string) => string
  round1: Record<string, number>
  round2: Record<string, number>
  confirmed: Record<string, number>
  recheck: Record<string, boolean>
  diffItems: InspectionItem[]
  onPick: (item: InspectionItem, value: number) => void
}) {
  const autoConfirmed = items.filter(i => {
    const r1 = round1[keyOf(i.code)]
    const r2 = round2[keyOf(i.code)]
    return r1 !== undefined && r1 === r2
  })

  // 확정값 vs 예상재고 총 금액 차이
  const totalAmtDiff = items.reduce((acc, i) => {
    const conf = confirmed[keyOf(i.code)]
    if (conf === undefined) return acc
    return acc + (conf - expectedQty(i)) * unitPrice(i)
  }, 0)

  return (
    <div className="bg-white">
      {/* 요약 */}
      <div className="px-4 py-3 grid grid-cols-3 gap-2 border-b border-gray-100">
        <div className="text-center">
          <p className="text-xl font-bold text-green-700">{autoConfirmed.length}</p>
          <p className="text-[16px] text-gray-400">자동확정(1차=2차)</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-red-500">{diffItems.length}</p>
          <p className="text-[16px] text-gray-400">차이 품목</p>
        </div>
        <div className="text-center">
          <p className={`text-lg font-bold tabular-nums ${totalAmtDiff >= 0 ? 'text-green-700' : 'text-red-500'}`}>
            {totalAmtDiff >= 0 ? '+' : ''}{won(totalAmtDiff)}
          </p>
          <p className="text-[16px] text-gray-400">예상대비 금액</p>
        </div>
      </div>

      {/* 차이 품목 리스트 (회계 담당자 검토) */}
      {diffItems.length === 0 ? (
        <p className="text-center text-gray-400 text-sm py-10">차이 품목이 없습니다 — 전체 자동확정 가능</p>
      ) : (
        <div className="divide-y divide-gray-100">
          <div className="px-4 py-2 bg-amber-50 text-[16px] font-bold text-amber-700">
            1차 ≠ 2차 — 검토 후 확정값 선택
          </div>
          {diffItems.map(item => {
            const k = keyOf(item.code)
            const r1 = round1[k]
            const r2 = round2[k]
            const expected = expectedQty(item)
            const conf = confirmed[k]
            const price = unitPrice(item)
            return (
              <div key={item.code} className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <p className="text-[19px] font-bold text-gray-900 flex items-center gap-1.5">
                    {item.name}
                    {recheck[k] && <span className="px-1.5 py-0.5 rounded-md text-[14px] font-bold bg-red-100 text-red-600">재확인</span>}
                  </p>
                  <span className="text-[16px] text-gray-400">예상 {expected}{item.unit}</span>
                </div>
                <div className="flex gap-2 mt-2">
                  {([['1차', r1], ['2차', r2]] as const).map(([label, val]) => {
                    const picked = conf === val
                    const amtDiff = (val - expected) * price
                    return (
                      <button
                        key={label}
                        onClick={() => onPick(item, val)}
                        className={`flex-1 rounded-xl border px-3 py-2 text-left transition-colors ${
                          picked ? 'border-green-600 bg-green-50' : 'border-gray-200 bg-white'
                        }`}
                      >
                        <p className="text-[16px] text-gray-400">{label}값</p>
                        <p className="text-lg font-bold text-gray-900 tabular-nums">{val}{item.unit}</p>
                        <p className={`text-[14px] font-bold ${amtDiff >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {amtDiff >= 0 ? '+' : ''}{won(amtDiff)}원
                        </p>
                      </button>
                    )
                  })}
                </div>
                {conf !== undefined && (
                  <p className="text-[16px] text-green-700 font-bold mt-1.5">확정값 {conf}{item.unit}</p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
