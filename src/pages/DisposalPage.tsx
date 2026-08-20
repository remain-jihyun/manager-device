import { useMemo, useState } from 'react'
import TopBar from '@/components/TopBar'
import { Trash2, Search, X, Scan, QrCode, ChevronRight, ChevronLeft, Layers, type LucideIcon } from 'lucide-react'
import { ACTIVE_RAW_MATERIALS, ACTIVE_SEMI_FINISHED } from '@/data/mesItems'
import { useAuthStore, visibleWasteTeams, type WasteTeam } from '@/store/authStore'

/**
 * 폐기 — **반 기준**으로 재구성했다 (2026-08-20 결정).
 *
 * 미출·과생산·폐기 중 미출만 OMS 로 빠지고 나머지는 폐기로 통합됐다. 축도 품목 유형
 * (원부재료/반제품/완제품)이 아니라 **반**이다 — 관리 웹(mes-v2 `/quality/waste`)과 같은 축.
 *   자재반(원부재료) · 전처리반(전처리품) · 조리반(반제품) · 내포장반(완제품, 과생산 포함)
 *
 * 권한: **반장·반원은 자기 반만** 보이고 사무직은 전체를 본다.
 *
 * 스캔: 코드 종류로 자동 구분한다.
 *   · 바코드/개별 QR → 그 품목 하나가 바로 잡힌다
 *   · **간반 QR → 그 간반의 구성 품목 리스트를 펼쳐 그중 폐기 대상을 고른다**
 */

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

/** 전처리반 품목 — 손질·데침을 거친 중간물 */
const PREPPED = [
  { code: 'PP-001', name: '손질 닭고기' },
  { code: 'PP-002', name: '데친 시금치' },
  { code: 'PP-003', name: '깐 양배추' },
  { code: 'PP-004', name: '채썬 감자' },
]

/** 반별 폐기 사유 — 내포장반에 "과생산" 이 들어간다 (구 과생산 화면을 흡수) */
const TEAM_REASONS: Record<WasteTeam, string[]> = {
  자재반: ['불량', '소비기한 경과', '입고 파손', '이물질'],
  전처리반: ['규격 미달 절단', '변색', '이물질', '손질 손실'],
  조리반: ['조리 불량', '과열/탄화', '이물질 혼입', '배합 오류'],
  내포장반: ['과생산', '포장 불량', '중량 미달', '라벨 오류', '이물질'],
}

type SubView = 'scan' | 'list' | 'kanban' | 'form'

interface TeamConfig {
  /** 이 반이 다루는 물건 */
  kindLabel: string
  unit: '개' | 'kg'
  scanIcon: LucideIcon
  subIcon: LucideIcon
  scanText: string
  listTitle: string
  searchPlaceholder: string
  amountLabel: string
  items: { code: string; name: string }[]
}

const TEAM_CONFIG: Record<WasteTeam, TeamConfig> = {
  자재반: {
    kindLabel: '원부재료', unit: '개', scanIcon: Scan, subIcon: QrCode,
    scanText: '바코드를 대거나 탭하여 입력', listTitle: '원부재료 검색',
    searchPlaceholder: '자재명 또는 코드 검색', amountLabel: '폐기 수량 (개)',
    items: RAW_MATERIALS,
  },
  전처리반: {
    kindLabel: '전처리품', unit: 'kg', scanIcon: QrCode, subIcon: Scan,
    scanText: '간반 QR 또는 품목 QR 을 태그하세요', listTitle: '전처리품 검색',
    searchPlaceholder: '전처리품명 또는 코드 검색', amountLabel: '폐기 중량 (kg)',
    items: PREPPED,
  },
  조리반: {
    kindLabel: '반제품', unit: 'kg', scanIcon: QrCode, subIcon: Scan,
    scanText: '간반 QR 또는 품목 QR 을 태그하세요', listTitle: '반제품 검색',
    searchPlaceholder: '반제품명 또는 코드 검색', amountLabel: '폐기 중량 (kg)',
    items: SEMI_FINISHED,
  },
  내포장반: {
    kindLabel: '완제품', unit: '개', scanIcon: Scan, subIcon: QrCode,
    scanText: '바코드 또는 간반 QR 을 태그하세요', listTitle: '제품 검색',
    searchPlaceholder: '제품명 또는 코드 검색', amountLabel: '폐기 수량 (개)',
    items: FINISHED_PRODUCTS,
  },
}

/**
 * 스캔한 간반 — QR 하나에 여러 품목이 묶여 있다.
 * 간반 QR 을 찍으면 이 구성 품목을 펼쳐 그중 폐기 대상을 고른다.
 */
interface ScannedKanban {
  id: string
  label: string
  items: { code: string; name: string }[]
}

/** 데모 스캔 결과 — 반마다 그 반이 받는 간반 하나를 흉내낸다 */
const KANBAN_BY_TEAM: Record<WasteTeam, ScannedKanban> = {
  자재반: {
    id: 'Z-001', label: '자재 불출 간반 · 된장찌개',
    items: RAW_MATERIALS.slice(0, 4),
  },
  전처리반: {
    id: 'PT-001', label: '전처리 간반 · 시금치나물',
    items: PREPPED,
  },
  조리반: {
    id: 'C-001', label: '조리 간반 · 된장찌개 250팩',
    items: SEMI_FINISHED.slice(0, 4),
  },
  내포장반: {
    id: 'IP-001', label: '내포장 간반 · 오늘 생산분',
    items: FINISHED_PRODUCTS.slice(0, 4),
  },
}

interface DisposalRecord {
  id: string
  team: WasteTeam
  code: string
  name: string
  reason: string
  amount: number
  unit: '개' | 'kg'
  time: string
  /** 간반 QR 에서 고른 건이면 그 간반 번호 */
  fromKanban?: string
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
  const user = useAuthStore((st) => st.user)
  // 반장·반원은 자기 반만, 사무직은 전체 (2026-08-20 권한 결정)
  const teams = useMemo(() => visibleWasteTeams(user), [user])
  const restricted = teams.length === 1

  const [team, setTeam] = useState<WasteTeam>(teams[0] ?? '자재반')
  const [records, setRecords] = useState<DisposalRecord[]>([])
  const [pendingCancel, setPendingCancel] = useState<(() => void) | null>(null)

  const requestCancel = (action: () => void) => setPendingCancel(() => action)
  const confirmCancel = () => { pendingCancel?.(); setPendingCancel(null) }

  // 공용 폼 상태 (반 전환 시 초기화되므로 단일 상태로 공유)
  const [view, setView] = useState<SubView>('scan')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Selected | null>(null)
  const [formFrom, setFormFrom] = useState<'scan' | 'list' | 'kanban'>('scan')
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  /** 간반 QR 을 찍었을 때 펼쳐 보여줄 구성 품목 */
  const [kanban, setKanban] = useState<ScannedKanban | null>(null)

  const cfg = TEAM_CONFIG[team]
  const reasons = TEAM_REASONS[team]

  const resetTeam = (t: WasteTeam) => {
    setTeam(t)
    setView('scan'); setSelected(null); setAmount(''); setReason(''); setSearch(''); setKanban(null)
  }

  const resetForm = () => {
    setSelected(null); setAmount(''); setReason(''); setSearch(''); setKanban(null); setView('scan')
  }

  const nowTime = () => new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })

  const handleRegister = () => {
    if (!selected || !amount || !reason) return
    setRecords((prev) => [{
      id: Date.now().toString(),
      team,
      code: selected.code, name: selected.name,
      reason,
      amount: cfg.unit === 'kg' ? parseFloat(amount) : parseInt(amount), unit: cfg.unit,
      time: nowTime(),
      fromKanban: formFrom === 'kanban' ? (kanban?.id ?? undefined) : undefined,
    }, ...prev])
    resetForm()
  }

  /**
   * 스캔 — 코드 종류로 갈린다.
   *   간반 QR  → 구성 품목 리스트를 펼친다 (그중에서 폐기 대상을 고른다)
   *   품목 코드 → 그 품목 하나가 바로 잡힌다
   * 데모라 두 경우를 버튼으로 나눠 흉내낸다.
   */
  const scanKanban = () => {
    setKanban(KANBAN_BY_TEAM[team])
    setSearch('')
    setView('kanban')
  }

  const scanItem = () => {
    const mock = cfg.items[0]
    setSelected({ code: mock.code, name: mock.name })
    setReason(''); setAmount(''); setFormFrom('scan'); setView('form')
  }

  const filtered = search
    ? cfg.items.filter((p) => p.name.includes(search) || p.code.includes(search))
    : cfg.items

  const todayRecords = records.filter((r) => r.team === team)

  // ─── 수기 목록 페이지 (검색형: 원부재료 / 완제품) ───────────────────
  if (view === 'list') {
    return (
      <>
      <div className="flex flex-col h-full bg-gray-50">
        {/* 헤더 */}
        <div className="bg-white border-b border-gray-100 flex items-center px-3 shrink-0" style={{ height: '52px' }}>
          <button onClick={() => requestCancel(() => { setView('scan'); setSearch('') })} className="p-1 -ml-1 text-gray-800">
            <ChevronLeft size={24} strokeWidth={2} />
          </button>
          <p className="flex-1 text-center text-[21px] font-bold text-gray-900">{cfg.listTitle}</p>
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
              className="input-ds-search"
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
                  setReason(''); setAmount('')
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

  // ─── 간반 QR 구성 품목 페이지 ────────────────────────────────────────
  // 간반 하나에 여러 품목이 묶여 있다. 그중 실제로 버린 것만 골라 폐기로 넘긴다.
  if (view === 'kanban' && kanban) {
    const items = search
      ? kanban.items.filter((p) => p.name.includes(search) || p.code.includes(search))
      : kanban.items
    return (
      <>
      <div className="flex flex-col h-full bg-gray-50">
        <div className="bg-white border-b border-gray-100 flex items-center px-3 shrink-0" style={{ height: '52px' }}>
          <button
            onClick={() => requestCancel(() => { setView('scan'); setKanban(null); setSearch('') })}
            className="p-1 -ml-1 text-gray-800"
          >
            <ChevronLeft size={24} strokeWidth={2} />
          </button>
          <div className="flex-1 text-center">
            <p className="text-[21px] font-bold text-gray-900">간반 구성 품목</p>
            <p className="text-[16px] text-gray-400">{kanban.id} · {kanban.label}</p>
          </div>
          <div className="w-8" />
        </div>

        <div className="px-4 py-3 bg-green-50 border-b border-green-100 shrink-0">
          <p className="text-sm font-bold text-green-900">
            폐기할 품목을 고르세요
            <span className="ml-1.5 text-xs font-medium text-green-700">
              {kanban.items.length}개 구성
            </span>
          </p>
        </div>

        {/* 구성 품목이 많으면 검색으로 좁힌다 */}
        <div className="px-4 py-3 bg-white border-b border-gray-100 shrink-0">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="구성 품목 검색"
              className="input-ds-search"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="bg-white divide-y divide-gray-50">
            {items.map((p) => (
              <button
                key={p.code}
                onClick={() => {
                  setSelected({ code: p.code, name: p.name })
                  setReason(''); setAmount('')
                  setFormFrom('kanban')
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
            {items.length === 0 && (
              <p className="py-10 text-center text-sm text-gray-400">검색 결과가 없습니다</p>
            )}
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
            onClick={() => setView(formFrom === 'list' ? 'list' : formFrom === 'kanban' ? 'kanban' : 'scan')}
            className="p-1 -ml-1 text-gray-800"
          >
            <ChevronLeft size={24} strokeWidth={2} />
          </button>
          <div className="flex-1 text-center">
            <p className="text-[21px] font-bold text-gray-900">{selected.name}</p>
            <p className="text-[16px] text-gray-400">
              {selected.code}
              {formFrom === 'kanban' && kanban && <> · 간반 {kanban.id}</>}
            </p>
          </div>
          <div className="w-8" />
        </div>

        {/* 폼 콘텐츠 */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
          <div>
            <p className="text-sm font-bold text-gray-900 mb-3">
              폐기 사유 <span className="text-red-500">*</span>
              <span className="ml-1.5 text-xs font-medium text-gray-400">{team}</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {reasons.map((t) => (
                <button key={t} onClick={() => setReason(t)}
                  className={`px-4 py-2 rounded-full border text-sm font-bold transition-colors ${
                    reason === t ? 'bg-green-900 text-white border-green-900' : 'bg-white text-gray-500 border-gray-200'
                  }`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 mb-2">{cfg.amountLabel} <span className="text-red-500">*</span></p>
            <input
              type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
              placeholder={cfg.unit === 'kg' ? '0.00' : '0'}
              {...(cfg.unit === 'kg' ? { step: '0.01' } : {})} min="0"
              className="input-ds"
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
            disabled={!amount || !reason}
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
      <TopBar title="폐기" showBack backTo="/menu" />

      {/* 반 탭 — 반장·반원은 자기 반 하나만 뜬다 */}
      <div className="px-4 pt-4 pb-3 bg-white border-b border-gray-100">
        {restricted ? (
          <div className="flex items-center gap-2 rounded-2xl bg-green-50 px-4 py-3">
            <span className="text-base font-bold text-green-900">{team}</span>
            <span className="text-sm text-green-700">{cfg.kindLabel} 폐기</span>
            <span className="ml-auto text-xs text-green-600">내 반만 보입니다</span>
          </div>
        ) : (
          <div className="flex bg-gray-100 rounded-2xl p-1 gap-1">
            {teams.map((t) => (
              <button key={t} onClick={() => resetTeam(t)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                  team === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'
                }`}>
                {t}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="px-4 py-4 space-y-3">
        {/* 스캔 — 간반 QR 이면 구성 품목을 펼치고, 품목 코드면 바로 폼으로 */}
        <button
          onClick={scanKanban}
          className="w-full flex items-center gap-3 px-4 py-5 rounded-2xl bg-gray-100 text-gray-500"
        >
          <Layers size={22} className="shrink-0" />
          <span className="text-sm flex-1 text-left font-bold">간반 QR 태그</span>
          <QrCode size={18} className="opacity-40 shrink-0" />
        </button>

        <button
          onClick={scanItem}
          className="w-full flex items-center gap-3 px-4 py-5 rounded-2xl bg-gray-100 text-gray-500"
        >
          <cfg.scanIcon size={22} className="shrink-0" />
          <span className="text-sm flex-1 text-left font-medium">{cfg.scanText}</span>
          <cfg.subIcon size={18} className="opacity-40 shrink-0" />
        </button>

        {/* 수기 등록 */}
        <button
          onClick={() => { setSearch(''); setView('list') }}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border border-gray-300 bg-white text-gray-700 text-sm font-bold active:bg-gray-50"
        >
          <Search size={16} />
          수기 등록
        </button>

        {/* 오늘 폐기 내역 */}
        {todayRecords.length > 0 ? (
          <div className="space-y-2 pt-1">
            <p className="text-sm font-bold text-gray-400">오늘 {team} 폐기 내역</p>
            {todayRecords.map((r) => (
              <div key={r.id} className="bg-white rounded-2xl p-3.5 border border-gray-200 flex items-center gap-3">
                <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
                  <Trash2 size={16} className="text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{r.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {[r.code, r.reason, `${r.amount}${r.unit}`, r.fromKanban].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <span className="text-xs text-gray-400 shrink-0">{r.time}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-400 text-sm pt-4">오늘 {team} 폐기 내역이 없습니다</p>
        )}
      </div>
    </div>
  )
}
