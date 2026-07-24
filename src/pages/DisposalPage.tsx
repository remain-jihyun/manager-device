import { useState } from 'react'
import TopBar from '@/components/TopBar'
import { Trash2, Search, X, Scan, QrCode, ChevronRight, ChevronLeft, type LucideIcon } from 'lucide-react'
import { ACTIVE_RAW_MATERIALS, ACTIVE_SEMI_FINISHED } from '@/data/mesItems'

const FINISHED_PRODUCTS = [
  { code: 'ZIP_F_0001', name: '된장찌개', barcode: '8801234000001' },
  { code: 'ZIP_F_0002', name: '김치찌개', barcode: '8801234000002' },
  { code: 'ZIP_F_0003', name: '불고기', barcode: '8801234000003' },
  { code: 'ZIP_F_0004', name: '제육볶음', barcode: '8801234000004' },
  { code: 'ZIP_F_0005', name: '갈비탕', barcode: '8801234000005' },
  { code: 'ZIP_F_0006', name: '순두부찌개', barcode: '8801234000006' },
  { code: 'ZIP_F_0007', name: '닭볶음탕', barcode: '8801234000007' },
  { code: 'ZIP_F_0008', name: '잡채', barcode: '8801234000008' },
  { code: 'ZIP_F_0009', name: '비빔밥', barcode: '8801234000009' },
  { code: 'ZIP_F_0010', name: '오징어볶음', barcode: '8801234000010' },
]

// 원부재료 / 반제품 — MES 품목 DB(mes-v2) 중 "사용중" 상태만 노출 (@/data/mesItems)
const RAW_MATERIALS = ACTIVE_RAW_MATERIALS
const SEMI_FINISHED = ACTIVE_SEMI_FINISHED

const TEAMS = ['1반', '2반', '3반', '4반', '5반']
const DISPOSAL_TYPES = ['변질', '유통기한', '파손', '기타']

type DisposalTab = '원부재료' | '반제품' | '완제품' | '전처리'
type SubView = 'scan' | 'list' | 'form'

interface TabConfig {
  unit: '개' | 'kg'
  hasType: boolean
  listMode: 'search' | 'team' | 'none'
  scanIcon: LucideIcon
  subIcon: LucideIcon
  scanText: string
  listTitle: string
  searchPlaceholder: string
  amountLabel: string
}

const TAB_CONFIG: Record<DisposalTab, TabConfig> = {
  원부재료: {
    unit: '개', hasType: true, listMode: 'search', scanIcon: Scan, subIcon: QrCode,
    scanText: '바코드 스캐너를 대거나 탭하여 입력', listTitle: '원부재료 검색',
    searchPlaceholder: '자재명 또는 코드 검색', amountLabel: '폐기 수량 (개)',
  },
  반제품: {
    unit: 'kg', hasType: true, listMode: 'search', scanIcon: QrCode, subIcon: Scan,
    scanText: 'QR 코드를 태그하거나 탭하여 입력', listTitle: '반제품 검색',
    searchPlaceholder: '반제품명 또는 코드 검색', amountLabel: '폐기 중량 (kg)',
  },
  완제품: {
    unit: '개', hasType: true, listMode: 'search', scanIcon: Scan, subIcon: QrCode,
    scanText: '바코드 스캐너를 대거나 탭하여 입력', listTitle: '제품 검색',
    searchPlaceholder: '제품명 또는 코드 검색', amountLabel: '폐기 수량 (개)',
  },
  전처리: {
    unit: 'kg', hasType: false, listMode: 'none', scanIcon: Trash2, subIcon: Trash2,
    scanText: '', listTitle: '', searchPlaceholder: '', amountLabel: '폐기 중량 (kg)',
  },
}

const TABS: DisposalTab[] = ['원부재료', '반제품', '완제품', '전처리']

interface DisposalRecord {
  id: string
  category: DisposalTab
  code: string
  name: string
  disposalType: string
  amount: number
  unit: '개' | 'kg'
  time: string
}

interface Selected { code: string; name: string }


function DisposalCancelModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center px-6">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative bg-white rounded-3xl px-6 py-6 w-full max-w-sm shadow-2xl">
        <p className="text-base font-bold text-gray-900 text-center mb-1">폐기 등록 취소</p>
        <p className="text-sm text-gray-500 text-center mb-6">정말 취소하시겠습니까?<br/>입력한 내용은 저장되지 않습니다.</p>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 py-3.5 rounded-2xl border border-gray-200 text-sm font-bold text-gray-600 active:bg-gray-50">
            계속 작성
          </button>
          <button onClick={onConfirm} className="flex-1 py-3.5 rounded-2xl bg-red-500 text-sm font-bold text-white active:bg-red-600">
            취소
          </button>
        </div>
      </div>
    </div>
  )
}

export default function DisposalPage() {
  const [tab, setTab] = useState<DisposalTab>('원부재료')
  const [records, setRecords] = useState<DisposalRecord[]>([])
  const [pendingCancel, setPendingCancel] = useState<(() => void) | null>(null)

  const requestCancel = (action: () => void) => setPendingCancel(() => action)
  const confirmCancel = () => { pendingCancel?.(); setPendingCancel(null) }

  // 공용 폼 상태 (탭 전환 시 초기화되므로 단일 상태로 공유)
  const [view, setView] = useState<SubView>('scan')
  const [search, setSearch] = useState('')
  const [team, setTeam] = useState('')
  const [selected, setSelected] = useState<Selected | null>(null)
  const [formFrom, setFormFrom] = useState<'scan' | 'list'>('scan')
  const [amount, setAmount] = useState('')
  const [type, setType] = useState('')

  const cfg = TAB_CONFIG[tab]

  const resetTab = (t: DisposalTab) => {
    setTab(t)
    setView('scan'); setSelected(null); setAmount(''); setType(''); setSearch(''); setTeam('')
  }

  const resetForm = () => {
    setSelected(null); setAmount(''); setType(''); setSearch(''); setTeam(''); setView('scan')
  }

  const nowTime = () => new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })

  // ── 등록 (원부재료 / 반제품 / 완제품) ──
  const handleRegister = () => {
    if (!selected || !amount || (cfg.hasType && !type)) return
    setRecords((prev) => [{
      id: Date.now().toString(), category: tab,
      code: selected.code, name: selected.name,
      disposalType: type,
      amount: cfg.unit === 'kg' ? parseFloat(amount) : parseInt(amount), unit: cfg.unit,
      time: nowTime(),
    }, ...prev])
    resetForm()
  }

  // ── 전처리 등록 (유형 없이 kg만) ──
  const handlePreRegister = () => {
    if (!team || !amount) return
    setRecords((prev) => [{
      id: Date.now().toString(), category: '전처리',
      code: team, name: `${team} 전처리`,
      disposalType: '', amount: parseFloat(amount), unit: 'kg',
      time: nowTime(),
    }, ...prev])
    setTeam(''); setAmount('')
  }

  const startScan = () => {
    const mock = tab === '완제품' ? FINISHED_PRODUCTS[1]
      : tab === '원부재료' ? RAW_MATERIALS[0]
      : SEMI_FINISHED[0]
    setSelected({ code: mock.code, name: mock.name })
    setType(''); setAmount(''); setFormFrom('scan'); setView('form')
  }

  const searchData = tab === '완제품' ? FINISHED_PRODUCTS
    : tab === '원부재료' ? RAW_MATERIALS
    : tab === '반제품' ? SEMI_FINISHED
    : []
  const filtered = search
    ? searchData.filter((p) => p.name.includes(search) || p.code.includes(search))
    : searchData

  const todayRecords = records.filter((r) => r.category === tab)

  // ─── 수기 목록 페이지 (검색형: 원부재료 / 완제품) ───────────────────
  if (view === 'list' && cfg.listMode === 'search') {
    return (
      <>
      <div className="flex flex-col h-full bg-gray-50">
        {/* 헤더 */}
        <div className="bg-white border-b border-gray-100 flex items-center px-3 shrink-0" style={{ height: '52px' }}>
          <button onClick={() => requestCancel(() => { setView('scan'); setSearch('') })} className="p-1 -ml-1 text-gray-800">
            <ChevronLeft size={24} strokeWidth={2} />
          </button>
          <p className="flex-1 text-center text-[16px] font-bold text-gray-900">{cfg.listTitle}</p>
          <div className="w-8" />
        </div>
        {/* 검색 */}
        <div className="px-4 py-3 bg-white border-b border-gray-100 shrink-0">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={cfg.searchPlaceholder}
              autoFocus
              className="w-full pl-10 pr-10 py-3 bg-gray-100 rounded-2xl text-sm focus:outline-none"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                <X size={16} />
              </button>
            )}
          </div>
        </div>
        {/* 항목 리스트 */}
        <div className="flex-1 overflow-y-auto">
          <div className="bg-white divide-y divide-gray-50">
            {filtered.map((p) => (
              <button
                key={p.code}
                onClick={() => {
                  setSelected({ code: p.code, name: p.name })
                  setType(''); setAmount('')
                  setFormFrom('list')
                  setView('form')
                }}
                className="w-full flex items-center gap-3 px-5 py-4 text-left active:bg-gray-50"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900">{p.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{p.code}</p>
                </div>
                <ChevronRight size={16} className="text-gray-300 shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </div>
      {pendingCancel && <DisposalCancelModal onConfirm={confirmCancel} onCancel={() => setPendingCancel(null)} />}
      </>
    )
  }

  // ─── 폼 페이지 (원부재료 / 반제품 / 완제품) ──────────────────────────
  if (view === 'form' && selected) {
    return (
      <>
      <div className="flex flex-col h-full bg-gray-50">
        {/* 헤더 */}
        <div className="bg-white border-b border-gray-100 flex items-center px-3 shrink-0" style={{ height: '52px' }}>
          <button
            onClick={() => setView(formFrom === 'list' ? 'list' : 'scan')}
            className="p-1 -ml-1 text-gray-800"
          >
            <ChevronLeft size={24} strokeWidth={2} />
          </button>
          <div className="flex-1 text-center">
            <p className="text-[16px] font-bold text-gray-900">{selected.name}</p>
            <p className="text-[11px] text-gray-400">{selected.code}</p>
          </div>
          <div className="w-8" />
        </div>

        {/* 폼 콘텐츠 */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
          {cfg.hasType && (
            <div>
              <p className="text-sm font-bold text-gray-900 mb-3">폐기 유형 <span className="text-red-500">*</span></p>
              <div className="flex flex-wrap gap-2">
                {DISPOSAL_TYPES.map((t) => (
                  <button key={t} onClick={() => setType(t)}
                    className={`px-4 py-2 rounded-full border text-sm font-bold transition-colors ${
                      type === t ? 'bg-green-900 text-white border-green-900' : 'bg-white text-gray-500 border-gray-200'
                    }`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div>
            <p className="text-sm font-bold text-gray-900 mb-2">{cfg.amountLabel} <span className="text-red-500">*</span></p>
            <input
              type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
              placeholder={cfg.unit === 'kg' ? '0.00' : '0'}
              {...(cfg.unit === 'kg' ? { step: '0.01' } : {})} min="0"
              className="w-full border border-gray-200 rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:border-green-800 bg-white"
            />
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="shrink-0 px-4 pt-3 pb-6 bg-white border-t border-gray-100 flex gap-2">
          <button
            onClick={() => requestCancel(() => { setSelected(null); setView('scan') })}
            className="flex-1 py-4 border border-gray-200 rounded-2xl text-sm font-bold text-gray-600 bg-white active:bg-gray-50"
          >
            취소
          </button>
          <button
            onClick={handleRegister}
            disabled={!amount || (cfg.hasType && !type)}
            className="flex-1 py-4 bg-green-900 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-2xl text-sm font-bold active:bg-green-800"
          >
            폐기 등록
          </button>
        </div>
      </div>
      {pendingCancel && <DisposalCancelModal onConfirm={confirmCancel} onCancel={() => setPendingCancel(null)} />}
      </>
    )
  }

  // ─── 메인 스캔 페이지 ────────────────────────────────────────────────
  return (
    <div className="flex flex-col bg-gray-50 min-h-full">
      <TopBar title="폐기" />

      {/* 원부재료 / 반제품 / 완제품 / 전처리 탭 */}
      <div className="px-4 pt-4 pb-3 bg-white border-b border-gray-100">
        <div className="flex bg-gray-100 rounded-2xl p-1 gap-1">
          {TABS.map((t) => (
            <button key={t} onClick={() => resetTab(t)}
              className={`flex-1 py-2.5 rounded-xl text-[13px] font-bold transition-colors ${
                tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'
              }`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 space-y-3">
        {/* 원부재료 / 반제품 / 완제품 — 스캔 + 수기 등록 */}
        {tab !== '전처리' && (
          <>
            {/* 스캔 안내 — 탭하면 바로 폼 페이지 */}
            <button
              onClick={startScan}
              className="w-full flex items-center gap-3 px-4 py-5 rounded-2xl bg-gray-100 border-transparent text-gray-400"
            >
              <cfg.scanIcon size={22} className="shrink-0" />
              <span className="text-sm flex-1 text-left font-medium">{cfg.scanText}</span>
              <cfg.subIcon size={18} className="opacity-40 shrink-0" />
            </button>

            {/* 수기 등록 버튼 */}
            <button
              onClick={() => { setSearch(''); setTeam(''); setView('list') }}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border border-gray-300 bg-white text-gray-700 text-sm font-bold active:bg-gray-50"
            >
              <Search size={16} />
              수기 등록
            </button>
          </>
        )}

        {/* 전처리 — 유형 없이 반 선택 + kg(중량)만 입력 */}
        {tab === '전처리' && (
          <div className="space-y-4 bg-white rounded-2xl border border-gray-200 p-4">
            <div>
              <p className="text-xs font-bold text-gray-400 mb-2">반 선택 <span className="text-red-500">*</span></p>
              <div className="flex gap-2">
                {TEAMS.map((t) => (
                  <button key={t} onClick={() => setTeam(t)}
                    className={`flex-1 py-2.5 rounded-2xl text-xs font-bold border transition-colors ${
                      team === t ? 'bg-green-900 text-white border-green-900' : 'bg-white text-gray-500 border-gray-200'
                    }`}>{t}</button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 mb-2">폐기 중량 (kg) <span className="text-red-500">*</span></p>
              <input
                type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00" step="0.01" min="0"
                className="w-full border border-gray-200 rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:border-green-800 bg-gray-50"
              />
            </div>
            <button
              onClick={handlePreRegister}
              disabled={!team || !amount}
              className="w-full py-4 bg-green-900 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-2xl text-sm font-bold active:bg-green-800"
            >
              폐기 등록
            </button>
          </div>
        )}

        {/* 오늘 폐기 내역 */}
        {todayRecords.length > 0 ? (
          <div className="space-y-2 pt-1">
            <p className="text-xs font-bold text-gray-400">오늘 {tab} 폐기 내역</p>
            {todayRecords.map((r) => (
              <div key={r.id} className="bg-white rounded-2xl p-3.5 border border-gray-200 flex items-center gap-3">
                <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
                  <Trash2 size={16} className="text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{r.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {[r.code, r.disposalType, `${r.amount}${r.unit}`].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <span className="text-xs text-gray-400 shrink-0">{r.time}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-400 text-sm pt-4">오늘 {tab} 폐기 내역이 없습니다</p>
        )}
      </div>
    </div>
  )
}
