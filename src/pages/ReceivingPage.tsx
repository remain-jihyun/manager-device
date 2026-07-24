import { useState, useMemo, useRef } from 'react'
import TopBar from '@/components/TopBar'
import { ChevronLeft, ChevronRight, CheckCircle2, AlertCircle, Clock, ScanLine, Search, Plus, X } from 'lucide-react'

// mes-v2 발주 데이터 (오늘 납기 기준)
const TODAY = new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })

interface PurchaseItem {
  id: string
  supplier: string
  code: string
  barcode: string
  name: string
  orderQty: number
  unit: string         // 품목 단위 (EA, kg 등)
  capacity: number     // 용량
  capacityUnit: string // 용량 단위 (L, kg, g 등)
  boxQty: number       // 박스당 수량
  unitPrice: number
  extra?: boolean      // 발주에 없던 추가 품목(검색으로 추가)
}

interface InspectionResult {
  id: string
  receivedQty: number
  status: '대기' | '검수완료' | '수량변경' | '반품'
  diffType?: '미입고' | '반품' | '기타' | '추가입고'
  reason?: string
}

const PURCHASE_ITEMS: PurchaseItem[] = [
  { id: 'PI-001', supplier: '(주)거산농산',     code: 'ZIP_M_1023', barcode: '8801234500013', name: '청양고추_국내산',        orderQty: 100, unit: 'kg', capacity: 5,   capacityUnit: 'kg', boxQty: 4,  unitPrice: 4800 },
  { id: 'PI-002', supplier: '(주)거산농산',     code: 'ZIP_M_1044', barcode: '8801234500044', name: '부추_국내산',            orderQty: 50,  unit: 'kg', capacity: 2,   capacityUnit: 'kg', boxQty: 10, unitPrice: 3000 },
  { id: 'PI-003', supplier: '(주)코리아푸드',   code: 'ZIP_M_3007', barcode: '8801234530007', name: '한우소고기_국내산_목심', orderQty: 30,  unit: 'kg', capacity: 1,   capacityUnit: 'kg', boxQty: 10, unitPrice: 23500 },
  { id: 'PI-004', supplier: '(주)코리아푸드',   code: 'ZIP_M_3014', barcode: '8801234530014', name: '돼지고기_국내산_후지',   orderQty: 50,  unit: 'kg', capacity: 2,   capacityUnit: 'kg', boxQty: 10, unitPrice: 7500 },
  { id: 'PI-005', supplier: '(주)보보에프엔지', code: 'ZIP_M_5162', barcode: '8801234551062', name: '마카로니',               orderQty: 20,  unit: 'EA', capacity: 1,   capacityUnit: 'kg', boxQty: 20, unitPrice: 2800 },
  { id: 'PI-006', supplier: '(주)보보에프엔지', code: 'ZIP_M_5228', barcode: '8801234552028', name: '당면',                  orderQty: 30,  unit: 'EA', capacity: 1,   capacityUnit: 'kg', boxQty: 15, unitPrice: 2400 },
]

// 발주 외 추가 가능 품목 마스터 (검색 후 선택해 추가)
const MASTER_ITEMS: Omit<PurchaseItem, 'supplier'>[] = [
  { id: 'M-201', code: 'ZIP_M_1101', barcode: '8801234511010', name: '대파_국내산',     orderQty: 0, unit: 'kg', capacity: 1,   capacityUnit: 'kg', boxQty: 10, unitPrice: 2600 },
  { id: 'M-202', code: 'ZIP_M_1102', barcode: '8801234511027', name: '양파_국내산',     orderQty: 0, unit: 'kg', capacity: 20,  capacityUnit: 'kg', boxQty: 1,  unitPrice: 1500 },
  { id: 'M-203', code: 'ZIP_M_1103', barcode: '8801234511034', name: '깐마늘_국내산',   orderQty: 0, unit: 'kg', capacity: 1,   capacityUnit: 'kg', boxQty: 10, unitPrice: 9000 },
  { id: 'M-204', code: 'ZIP_M_3101', barcode: '8801234531010', name: '닭고기_국내산',   orderQty: 0, unit: 'kg', capacity: 2,   capacityUnit: 'kg', boxQty: 10, unitPrice: 5200 },
  { id: 'M-205', code: 'ZIP_M_5101', barcode: '8801234551010', name: '식용유',         orderQty: 0, unit: 'EA', capacity: 1.8, capacityUnit: 'L',  boxQty: 6,  unitPrice: 4200 },
  { id: 'M-206', code: 'ZIP_M_5102', barcode: '8801234551027', name: '진간장',         orderQty: 0, unit: 'EA', capacity: 1.8, capacityUnit: 'L',  boxQty: 6,  unitPrice: 3800 },
  { id: 'M-207', code: 'ZIP_M_5103', barcode: '8801234551034', name: '고춧가루',       orderQty: 0, unit: 'EA', capacity: 1,   capacityUnit: 'kg', boxQty: 10, unitPrice: 12000 },
]

const DIFF_TYPES_MINUS = ['미입고', '반품'] as const
const DIFF_TYPES_PLUS  = ['추가입고', '기타'] as const

type ViewType = 'list' | 'form'

const STATUS_STYLE: Record<string, string> = {
  '대기':     'bg-gray-100 text-gray-500',
  '검수완료': 'bg-green-100 text-green-700',
  '수량변경': 'bg-orange-100 text-orange-700',
  '반품':     'bg-red-100 text-red-700',
}

// 품목 규격 요약 (재고실사와 동일 기준: 품목단위 · 용량 · 용량단위 · 박스당 수량)
const specText = (i: PurchaseItem) => `품목 ${i.unit} · 용량 ${i.capacity}${i.capacityUnit} · 박스당 ${i.boxQty}`

export default function ReceivingPage() {
  const [view, setView] = useState<ViewType>('list')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [results, setResults] = useState<Record<string, InspectionResult>>({})
  const [extraItems, setExtraItems] = useState<PurchaseItem[]>([])

  // 바코드 스캔 하이라이트
  const [scannedId, setScannedId] = useState<string | null>(null)
  // 품목 검색 추가
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // form state
  const [receivedQty, setReceivedQty] = useState('')
  const [diffType, setDiffType] = useState<'미입고' | '반품' | '기타' | '추가입고' | ''>('')
  const [reason, setReason] = useState('')

  const allItems = useMemo(() => [...PURCHASE_ITEMS, ...extraItems], [extraItems])

  // 탭 순서는 발주 거래처 기준으로 고정
  const suppliers = useMemo(() => {
    const seen: string[] = []
    for (const i of PURCHASE_ITEMS) if (!seen.includes(i.supplier)) seen.push(i.supplier)
    return seen
  }, [])

  const supplierGroups = useMemo(() => {
    const map = new Map<string, PurchaseItem[]>()
    for (const s of suppliers) map.set(s, [])
    for (const item of allItems) {
      if (!map.has(item.supplier)) map.set(item.supplier, [])
      map.get(item.supplier)!.push(item)
    }
    return map
  }, [allItems, suppliers])

  const selectedItem = allItems.find(i => i.id === selectedId)

  const [activeSupplier, setActiveSupplier] = useState(suppliers[0])
  const touchStartX = useRef(0)

  const openForm = (item: PurchaseItem) => {
    const prev = results[item.id]
    setSelectedId(item.id)
    setReceivedQty(prev ? String(prev.receivedQty) : (item.extra ? '' : String(item.orderQty)))
    setDiffType(prev?.diffType ?? '')
    setReason(prev?.reason ?? '')
    setView('form')
  }

  const handleSave = () => {
    if (!selectedItem) return
    const qty = receivedQty === '' ? selectedItem.orderQty : Number(receivedQty)
    const diff = qty - selectedItem.orderQty

    let status: InspectionResult['status'] = '검수완료'
    if (diffType === '반품' || qty === 0) status = '반품'
    else if (diff !== 0) status = '수량변경'

    setResults(prev => ({
      ...prev,
      [selectedItem.id]: {
        id: selectedItem.id,
        receivedQty: qty,
        status,
        diffType: diff !== 0 ? (diffType || undefined) : undefined,
        reason: diff !== 0 && reason.trim() ? reason.trim() : undefined,
      },
    }))
    setScannedId(null)
    setView('list')
  }

  // 바코드 스캔(모의): 활성 거래처에서 미검수 품목 우선 선택 → 하이라이트 후 입력 진입
  const handleScan = () => {
    const items = supplierGroups.get(activeSupplier) ?? []
    if (items.length === 0) return
    const target = items.find(i => !results[i.id] || results[i.id].status === '대기') ?? items[0]
    setScannedId(target.id)
    openForm(target)
  }

  // 검색 결과 (발주/추가 목록에 이미 없는 마스터 품목)
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return []
    const existing = new Set((supplierGroups.get(activeSupplier) ?? []).map(i => i.code))
    return MASTER_ITEMS.filter(
      m => !existing.has(m.code) && (m.name.toLowerCase().includes(q) || m.code.toLowerCase().includes(q) || m.barcode.includes(q))
    )
  }, [searchQuery, supplierGroups, activeSupplier])

  const addSearchItem = (m: Omit<PurchaseItem, 'supplier'>) => {
    const newItem: PurchaseItem = { ...m, id: `${m.id}-${activeSupplier}-${Date.now()}`, supplier: activeSupplier, extra: true }
    setExtraItems(prev => [...prev, newItem])
    setShowSearch(false)
    setSearchQuery('')
    openForm(newItem)
  }

  const totalDone = Object.values(results).filter(r => r.status !== '대기').length

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }
  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(dx) < 50) return
    const idx = suppliers.indexOf(activeSupplier)
    if (dx < 0 && idx < suppliers.length - 1) setActiveSupplier(suppliers[idx + 1])
    if (dx > 0 && idx > 0) setActiveSupplier(suppliers[idx - 1])
  }

  // ── 검수 폼 뷰 ────────────────────────────────────────────────────
  if (view === 'form' && selectedItem) {
    const qty = receivedQty === '' ? selectedItem.orderQty : Number(receivedQty)
    const diff = qty - selectedItem.orderQty
    const hasDiff = diff !== 0
    const isMinus = diff < 0
    // 차이 발생 시 유형 선택 필수. 반품(또는 증가분)은 사유 입력 필수.
    const needsReason = (isMinus && diffType === '반품') || (!isMinus && hasDiff)
    const canSave = !hasDiff || (diffType !== '' && (!needsReason || reason.trim() !== ''))

    return (
      <div className="flex flex-col h-full bg-gray-50">
        <div className="bg-white border-b border-gray-100 flex items-center px-3 shrink-0" style={{ height: '52px' }}>
          <button onClick={() => setView('list')} className="p-1 -ml-1 text-gray-800">
            <ChevronLeft size={24} strokeWidth={2} />
          </button>
          <div className="flex-1 text-center">
            <p className="text-[16px] font-bold text-gray-900">{selectedItem.name}</p>
            <p className="text-[11px] text-gray-400">{selectedItem.code} · {selectedItem.supplier}</p>
          </div>
          <div className="w-8" />
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {/* 품목 규격 (재고실사와 동일 기준) */}
          <div className="bg-white rounded-2xl border border-gray-200 px-4 py-3">
            <p className="text-[11px] text-gray-400 mb-1">품목 규격</p>
            <p className="text-sm font-bold text-gray-700">{specText(selectedItem)}</p>
            <p className="text-[11px] text-gray-400 mt-1">바코드 {selectedItem.barcode}</p>
          </div>

          {/* 발주 정보 (수정 불가) */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
              <p className="text-xs font-bold text-gray-500">
                {selectedItem.extra ? '발주 외 추가 품목' : '발주 정보 (수정 불가)'}
              </p>
            </div>
            <div className="grid grid-cols-2 divide-x divide-gray-100">
              <div className="px-4 py-4 text-center">
                <p className="text-[10px] text-gray-400 mb-1">발주 수량</p>
                <p className="text-2xl font-bold text-gray-700 tabular-nums">{selectedItem.orderQty}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{selectedItem.unit}</p>
              </div>
              <div className="px-4 py-4 text-center">
                <p className="text-[10px] text-gray-400 mb-1">단가</p>
                <p className="text-lg font-bold text-gray-700 tabular-nums">{selectedItem.unitPrice.toLocaleString()}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">원/{selectedItem.unit}</p>
              </div>
            </div>
          </div>

          {/* 입고 수량 입력 */}
          <div className="bg-white rounded-2xl border border-gray-200 px-5 py-5">
            <p className="text-xs text-gray-500 text-center mb-3">입고 수량 입력</p>
            <div className="flex items-baseline justify-center gap-2">
              <input
                type="number"
                value={receivedQty}
                onChange={e => { setReceivedQty(e.target.value); setDiffType(''); setReason('') }}
                placeholder={String(selectedItem.orderQty)}
                autoFocus
                className="w-32 border-b-2 border-green-500 bg-transparent text-center text-4xl font-bold text-gray-900 focus:outline-none tabular-nums"
              />
              <span className="text-sm text-gray-400">{selectedItem.unit}</span>
            </div>

            {/* 차이 표시 */}
            {receivedQty !== '' && receivedQty !== String(selectedItem.orderQty) && (
              <div className={`mt-4 flex items-center justify-center gap-2 py-2 rounded-xl ${diff < 0 ? 'bg-red-50' : 'bg-orange-50'}`}>
                <AlertCircle size={14} className={diff < 0 ? 'text-red-500' : 'text-orange-500'} />
                <span className={`text-sm font-bold tabular-nums ${diff < 0 ? 'text-red-600' : 'text-orange-600'}`}>
                  발주 대비 {diff > 0 ? `+${diff}` : diff} {selectedItem.unit}
                </span>
              </div>
            )}
            {receivedQty !== '' && diff === 0 && (
              <div className="mt-4 flex items-center justify-center gap-2 py-2 rounded-xl bg-green-50">
                <CheckCircle2 size={14} className="text-green-600" />
                <span className="text-sm font-bold text-green-700">발주 수량과 동일</span>
              </div>
            )}
          </div>

          {/* 차이 처리 (수량이 다를 때만) */}
          {hasDiff && (
            <div className="bg-white rounded-2xl border border-amber-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-amber-100 bg-amber-50">
                <p className="text-xs font-bold text-amber-700">
                  {isMinus ? '수량 부족 처리 (미입고 / 반품 선택)' : '수량 증가 처리'}
                </p>
              </div>
              <div className="px-4 py-4 space-y-3">
                <div>
                  <p className="text-xs text-gray-500 mb-2">유형 <span className="text-red-500">*</span></p>
                  <div className="flex gap-2">
                    {(isMinus ? DIFF_TYPES_MINUS : DIFF_TYPES_PLUS).map(t => (
                      <button
                        key={t}
                        onClick={() => setDiffType(t)}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-colors ${diffType === t ? 'bg-green-900 text-white border-green-900' : 'bg-white text-gray-600 border-gray-200'}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                {needsReason && (
                  <div>
                    <p className="text-xs text-gray-500 mb-2">
                      {diffType === '반품' ? '반품 사유' : '사유'} <span className="text-red-500">*</span>
                    </p>
                    <textarea
                      value={reason}
                      onChange={e => setReason(e.target.value)}
                      placeholder={diffType === '반품' ? '반품 사유를 입력하세요 (필수)' : '사유를 입력하세요'}
                      rows={3}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-green-800"
                    />
                  </div>
                )}
                {isMinus && diffType === '미입고' && (
                  <p className="text-[11px] text-gray-400">미입고 수량은 사무실(MES)에서 집계됩니다.</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 하단 저장 버튼 */}
        <div className="shrink-0 px-4 pt-3 pb-6 bg-white border-t border-gray-100">
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="w-full py-4 bg-green-900 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-2xl text-[15px] font-bold active:bg-green-800 flex items-center justify-center gap-2"
          >
            <CheckCircle2 size={18} />
            검수 완료
          </button>
        </div>
      </div>
    )
  }

  // ── 리스트 뷰 ─────────────────────────────────────────────────────
  const allDone = allItems.every(i => results[i.id] && results[i.id].status !== '대기')
  const activeItems = supplierGroups.get(activeSupplier) ?? []
  const activeDoneCount = activeItems.filter(i => results[i.id] && results[i.id].status !== '대기').length
  const activeTotalAmt = activeItems
    .filter(i => results[i.id])
    .reduce((s, i) => s + (results[i.id].receivedQty * i.unitPrice), 0)

  return (
    <div className="relative flex flex-col h-full bg-gray-50">
      <TopBar title="입고 검수" />

      {/* 요약 */}
      <div className="flex bg-white border-b border-gray-100 shrink-0">
        <div className="flex-1 text-center py-3 border-r border-gray-100">
          <p className="text-xl font-bold text-green-700">{totalDone}</p>
          <p className="text-[11px] text-gray-400">검수 완료</p>
        </div>
        <div className="flex-1 text-center py-3 border-r border-gray-100">
          <p className="text-xl font-bold text-gray-400">{allItems.length - totalDone}</p>
          <p className="text-[11px] text-gray-400">대기</p>
        </div>
        <div className="flex-1 text-center py-3">
          <p className="text-xl font-bold text-gray-700">{allItems.length}</p>
          <p className="text-[11px] text-gray-400">전체</p>
        </div>
      </div>

      {/* 날짜 */}
      <div className="bg-white px-4 py-2 shrink-0">
        <p className="text-xs text-gray-400">오늘 납기 기준 · {TODAY}</p>
      </div>

      {/* 거래처 탭 */}
      <div className="bg-white border-b border-gray-200 shrink-0">
        <div className="flex overflow-x-auto scrollbar-hide">
          {suppliers.map(supplier => {
            const items = supplierGroups.get(supplier) ?? []
            const done = items.length > 0 && items.every(i => results[i.id] && results[i.id].status !== '대기')
            const isActive = supplier === activeSupplier
            return (
              <button
                key={supplier}
                onClick={() => setActiveSupplier(supplier)}
                className={`shrink-0 px-4 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                  isActive ? 'border-green-900 text-green-900' : 'border-transparent text-gray-400'
                }`}
              >
                {supplier}
                {done && <span className="text-[9px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">완료</span>}
              </button>
            )
          })}
        </div>
      </div>

      {/* 스캔 / 검색 추가 */}
      <div className="flex gap-2 px-4 py-2.5 bg-white border-b border-gray-100 shrink-0">
        <button
          onClick={handleScan}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-green-900 text-white text-sm font-bold active:bg-green-800"
        >
          <ScanLine size={16} />
          바코드 스캔
        </button>
        <button
          onClick={() => { setShowSearch(true); setSearchQuery('') }}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-bold active:bg-gray-50"
        >
          <Search size={16} />
          품목 검색 추가
        </button>
      </div>

      {/* 완료 배너 */}
      {allDone && (
        <div className="mx-4 mt-3 px-4 py-3 bg-green-50 border border-green-200 rounded-2xl flex items-center gap-2 shrink-0">
          <CheckCircle2 size={16} className="text-green-700 shrink-0" />
          <p className="text-sm font-bold text-green-800">오늘 입고 검수가 모두 완료되었습니다</p>
        </div>
      )}

      {/* 거래처 정보 + 항목 (스와이프 영역) */}
      <div
        className="flex-1 overflow-y-auto bg-white"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* 거래처 소계 */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
          <span className="text-xs text-gray-500">{activeDoneCount}/{activeItems.length}건 완료</span>
          {activeTotalAmt > 0 && (
            <span className="text-xs text-gray-400">공급가 {activeTotalAmt.toLocaleString()}원</span>
          )}
        </div>

        {/* 발주 항목 */}
        <div className="divide-y divide-gray-100">
          {activeItems.map(item => {
            const result = results[item.id]
            const status = result?.status ?? '대기'
            const diff = result ? result.receivedQty - item.orderQty : null
            const isScanned = item.id === scannedId

            return (
              <button
                key={item.id}
                onClick={() => openForm(item)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-gray-50 ${isScanned ? 'bg-green-50 ring-2 ring-green-500 ring-inset' : ''}`}
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-gray-50">
                  {status === '대기'
                    ? <Clock size={16} className="text-gray-400" />
                    : <CheckCircle2 size={16} className="text-green-600" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                    {item.name}
                    {item.extra && <span className="text-[9px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full shrink-0">추가</span>}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{specText(item)}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {item.code} · 발주 {item.orderQty}{item.unit}
                    {result && diff !== null && diff !== 0 && (
                      <span className={diff < 0 ? 'text-red-500' : 'text-orange-500'}>
                        {' '}· 입고 {result.receivedQty}{item.unit} ({diff > 0 ? '+' : ''}{diff})
                      </span>
                    )}
                    {result && diff === 0 && (
                      <span className="text-green-600"> · 입고 {result.receivedQty}{item.unit}</span>
                    )}
                  </p>
                  {result?.reason && (
                    <p className="text-[10px] text-amber-600 mt-0.5 truncate">사유: {result.reason}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLE[status]}`}>
                    {status}
                  </span>
                  <ChevronRight size={14} className="text-gray-300" />
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* 품목 검색 추가 오버레이 */}
      {showSearch && (
        <div className="absolute inset-0 z-[100] flex flex-col bg-white">
          <div className="flex items-center gap-2 px-3 border-b border-gray-100 shrink-0" style={{ height: '52px' }}>
            <button onClick={() => setShowSearch(false)} className="p-1 text-gray-800">
              <X size={22} strokeWidth={2} />
            </button>
            <div className="flex-1 flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2">
              <Search size={16} className="text-gray-400 shrink-0" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="품목명 · 코드 · 바코드 검색"
                autoFocus
                className="flex-1 bg-transparent text-sm focus:outline-none"
              />
            </div>
          </div>
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 shrink-0">
            <p className="text-xs text-gray-400">{activeSupplier} 에 추가할 품목을 검색하세요</p>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {searchQuery.trim() === '' ? (
              <p className="text-center text-sm text-gray-400 py-12">품목명, 코드 또는 바코드를 입력하세요</p>
            ) : searchResults.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-12">검색 결과가 없습니다</p>
            ) : (
              searchResults.map(m => (
                <button
                  key={m.id}
                  onClick={() => addSearchItem(m)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-gray-50"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900">{m.name}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">품목 {m.unit} · 용량 {m.capacity}{m.capacityUnit} · 박스당 {m.boxQty}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{m.code} · {m.barcode}</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-green-900 text-white flex items-center justify-center shrink-0">
                    <Plus size={18} />
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
