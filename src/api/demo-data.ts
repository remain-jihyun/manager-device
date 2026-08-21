// ============================================================================
// 로컬 폴백 데이터 (백엔드 없이도 화면이 완전히 동작하게 한다)
//
// 이 단말은 `VITE_MES_API_BASE` 가 없으면 `http://localhost:4000`,
// 즉 "보는 사람 PC의 로컬"을 부른다. mes-v2 백엔드가 떠 있지 않으면
// 모든 화면이 "MES 서버에 연결할 수 없습니다"로 덮인다.
//
// 그래서 **네트워크 자체가 실패한 경우**에는 아래 로컬 저장소로 화면을 채운다.
// 조회뿐 아니라 승인·반려·안돈 확인 같은 저장까지 이 저장소에 반영하므로,
// 백엔드 없이도 화면의 모든 흐름을 그대로 눌러볼 수 있다.
//   - 저장소는 이 탭의 메모리에만 있다. 새로고침하면 초기값으로 돌아간다.
//   - 서버가 응답은 했는데 4xx/5xx 인 경우는 폴백하지 않는다(진짜 오류를 숨기면 안 됨).
//
// 여기 있는 값은 mes-v2 가 소유한 계약의 **형태만** 흉내 낸 표시용이다.
// 업무 유형·기준정보를 이 파일에서 새로 정의하지 않는다. (CLAUDE.md 연동규칙 1)
// ============================================================================

import type {
  ApprovalStatus,
  DashboardSummary,
  Defect,
  HistoryEvent,
  Kanban,
  ProductionResult,
  WorkOrder,
} from './mes'
import type { AndonEvent, AndonType, AndonTypeId } from './andon'

const today = () => new Date().toISOString().slice(0, 10)
const now = () => new Date().toISOString()
const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString()

// ── 시드 ─────────────────────────────────────────────────────────────────────

type KanbanSeed = [string, string, string, string, string, Kanban['status'], number, number, number]

// [간반번호, 제품코드, 제품명, 공정, 반, 상태, 계획, 양품, 불량]
const KANBAN_SEED: KanbanSeed[] = [
  ['K-20260806-001', 'ZIP_P_0012', '잡채', '전처리', '전처리반', '완료', 250, 248, 2],
  ['K-20260806-002', 'ZIP_P_6001', '감자채볶음', '전처리', '전처리반', '완료', 180, 176, 4],
  ['K-20260806-003', 'ZIP_P_1041', '된장찌개', '조리', '조리반', '작업', 200, 124, 4],
  ['K-20260806-004', 'ZIP_P_2061', '한우사골미역국', '조리', '조리반', '작업', 150, 60, 2],
  ['K-20260806-005', 'ZIP_P_3011', '시금치나물', '조리', '조리반', '대기', 300, 0, 0],
  ['K-20260806-006', 'ZIP_P_1041', '된장찌개', '내포장', '내포장반', '작업', 220, 90, 6],
  ['K-20260806-007', 'ZIP_P_0012', '잡채', '내포장', '내포장반', '대기', 260, 0, 0],
  ['K-20260806-008', 'ZIP_P_4021', '멸치볶음', '내포장', '내포장반', '준비', 140, 0, 0],
  ['K-20260806-009', 'ZIP_P_5001', '오징어채무침', '전처리', '전처리반', '준비', 160, 0, 0],
  ['K-20260806-010', 'ZIP_P_2061', '한우사골미역국', '내포장', '내포장반', '준비', 190, 0, 0],
]

const seedKanbans = (): Kanban[] =>
  KANBAN_SEED.map(([number, code, name, process, team, status, planned, good, defect], i) => {
    const produced = good + defect
    return {
      id: `DEMO-K-${String(i + 1).padStart(3, '0')}`,
      kanbanNumber: number,
      date: today(),
      workOrderId: 'DEMO-WO-001',
      productCode: code,
      sanCode: `SAN_${code.slice(-4)}`,
      productName: name,
      processSection: process,
      team,
      deviceId: `DEVICE-00${(i % 4) + 1}`,
      plannedQty: planned,
      unit: '팩',
      status,
      assignee: `${process}반`,
      startTime: status === '준비' || status === '대기' ? null : minutesAgo(180 - i * 12),
      endTime: status === '완료' ? minutesAgo(30 - (i % 5) * 4) : null,
      progress: planned ? Math.min(100, Math.round((produced / planned) * 100)) : 0,
      inputQty: produced ? produced + Math.round(defect / 2) : 0,
      goodQty: good,
      defectQty: defect,
      weightKg: produced ? Math.round(produced * 0.32 * 10) / 10 : null,
      approvalStatus: (status === '완료' ? '승인대기' : '미제출') as ApprovalStatus,
      rejectReason: null,
      holdReason: null,
      canceled: false,
      version: 1,
    }
  })

const seedWorkOrders = (kanbans: Kanban[]): WorkOrder[] => [
  {
    id: 'DEMO-WO-001',
    date: today(),
    line: '1라인',
    team: '전체',
    title: `${today()} 생산 작업지시`,
    status: '발행',
    kanbanIds: kanbans.map((k) => k.id),
    issuedAt: minutesAgo(300),
    issuedBy: '생산관리',
    canceledAt: null,
    cancelReason: null,
  },
]

const seedResults = (kanbans: Kanban[]): ProductionResult[] =>
  kanbans
    .filter((k) => k.goodQty > 0)
    .map((k, i) => ({
      id: `DEMO-R-${String(i + 1).padStart(3, '0')}`,
      kanbanId: k.id,
      kanbanNumber: k.kanbanNumber,
      deviceId: k.deviceId ?? 'DEVICE-001',
      reportedBy: k.assignee,
      inputQty: k.inputQty,
      goodQty: k.goodQty,
      defectQty: k.defectQty,
      weightKg: k.weightKg,
      unit: k.unit,
      reportedAt: minutesAgo(120 - i * 15),
      approvalStatus: (i < 2 ? '승인' : '승인대기') as ApprovalStatus,
      approvedBy: i < 2 ? '반장' : null,
      approvedAt: i < 2 ? minutesAgo(90 - i * 10) : null,
      rejectReason: null,
    }))

const DEFECT_SEED: [string, string, number][] = [
  ['FOREIGN_MATTER', '이물', 4],
  ['WEIGHT_OUT', '중량 이탈', 6],
  ['PACKAGING', '포장 불량', 3],
  ['BURN', '탄화', 2],
  ['ETC', '기타', 3],
]

const seedDefects = (kanbans: Kanban[]): Defect[] =>
  DEFECT_SEED.map(([code, label, qty], i) => {
    const k = kanbans[i % kanbans.length]!
    return {
      id: `DEMO-D-${String(i + 1).padStart(3, '0')}`,
      kanbanId: k.id,
      kanbanNumber: k.kanbanNumber,
      reasonCode: code,
      reasonLabel: label,
      qty,
      note: '',
      reportedBy: k.assignee,
      reportedAt: minutesAgo(100 - i * 12),
      confirmedBy: i < 2 ? '반장' : null,
      confirmedAt: i < 2 ? minutesAgo(80 - i * 10) : null,
    }
  })

const seedHistory = (kanbans: Kanban[]): HistoryEvent[] =>
  kanbans.slice(0, 8).map((k, i) => ({
    id: `DEMO-H-${String(i + 1).padStart(3, '0')}`,
    at: minutesAgo(200 - i * 18),
    actor: k.assignee,
    role: 'WORKER',
    entity: 'KANBAN',
    entityId: k.id,
    action: '상태변경',
    from: '대기',
    to: k.status,
    detail: `${k.productName} · ${k.plannedQty}${k.unit}`,
  }))

const ANDON_TYPES: AndonType[] = [
  {
    id: 'FOREIGN_MATTER',
    label: '이물 발생',
    line: '내포장 1라인',
    equipment: '육안 검사대',
    detail: '내포장 공정 이물 발견 시 라인 정지',
    metricLabel: '검출 위치',
    metricUnit: '',
    spec: '이물 무관용',
    requirePhoto: true,
  },
  {
    id: 'METAL_DETECTOR',
    label: '금속검출기',
    line: '내포장 2라인',
    equipment: '금속검출기 #2',
    detail: '금속 검출 시 자동 배출 및 라인 정지',
    metricLabel: '검출 감도',
    metricUnit: 'Fe mm',
    spec: 'Fe 2.0 / SUS 2.5 이하',
    requirePhoto: true,
  },
  {
    id: 'WEIGHT_SORTER',
    label: '중량선별기',
    line: '내포장 2라인',
    equipment: '중량선별기 #1',
    detail: '설정 중량 범위를 벗어난 제품 배출',
    metricLabel: '측정 중량',
    metricUnit: 'g',
    spec: '300g ± 9g',
    requirePhoto: true,
  },
  {
    // 상단 출고 수량과 하단 입고 수량 차이가 10분 이상 이어지면 열린다
    id: 'SPIRAL',
    label: '스파이럴',
    line: '외포장반',
    equipment: '스파이럴 컨베이어',
    detail: '상·하단 수량 차이 지속',
    metricLabel: '상단 출고 − 하단 입고',
    metricUnit: '개',
    spec: '차이 0개 · 10분 이상 지속 시 발생',
    requirePhoto: true,
  },
]

/** 백엔드 없이 화면 흐름만 볼 때 쓰는 자리표시 이미지 (실제 사진이 아님을 그림에 적어둔다) */
const demoPhoto = (n: number) =>
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240">` +
      `<rect width="240" height="240" fill="#E8EDE8"/>` +
      `<text x="120" y="112" font-size="16" fill="#5B6B5B" text-anchor="middle" font-family="sans-serif">데모 사진 ${n}</text>` +
      `<text x="120" y="140" font-size="12" fill="#8A968A" text-anchor="middle" font-family="sans-serif">서버 연결 시 실제 사진</text>` +
      `</svg>`,
  )

const seedAndonEvents = (): AndonEvent[] => [
  {
    id: 'DEMO-A-001',
    typeId: 'METAL_DETECTOR',
    typeLabel: '금속검출기',
    line: '내포장 2라인',
    lineNo: '2',
    equipment: '금속검출기 #2',
    detail: '금속 검출로 자동 배출됨',
    product: '된장찌개',
    lotNo: 'LOT-20260806-006',
    metricLabel: '검출 감도',
    metricValue: '2.4',
    metricUnit: 'Fe mm',
    spec: 'Fe 2.0 / SUS 2.5 이하',
    occurredAt: minutesAgo(12),
    source: 'DEVICE-004',
    status: 'OPEN',
    photoCount: 0,
  },
  {
    id: 'DEMO-A-002',
    typeId: 'WEIGHT_SORTER',
    typeLabel: '중량선별기',
    line: '내포장 2라인',
    lineNo: '2',
    equipment: '중량선별기 #1',
    detail: '하한 이탈 3연속 발생',
    product: '잡채',
    lotNo: 'LOT-20260806-007',
    metricLabel: '측정 중량',
    metricValue: '288',
    metricUnit: 'g',
    spec: '300g ± 9g',
    occurredAt: minutesAgo(34),
    source: 'DEVICE-003',
    status: 'REPORTED',
    reportedAt: minutesAgo(20),
    reportedBy: '홍길동',
    finding: 'ABNORMAL',
    barcode: '8801234500448',
    reportNote: '충전 노즐 마모로 하한 이탈 반복 — 해당 로트 격리함',
    reportPhotoCount: 2,
    photoCount: 0,
  },
  {
    id: 'DEMO-A-003',
    typeId: 'FOREIGN_MATTER',
    typeLabel: '이물 발생',
    line: '내포장 1라인',
    lineNo: '1',
    equipment: '육안 검사대',
    detail: '포장재 조각 발견',
    product: '감자채볶음',
    lotNo: 'LOT-20260806-002',
    metricLabel: '검출 위치',
    metricValue: '충전부',
    metricUnit: '',
    spec: '이물 무관용',
    occurredAt: minutesAgo(96),
    source: 'DEVICE-001',
    status: 'CONFIRMED',
    reportedAt: minutesAgo(88),
    reportedBy: '홍길동',
    finding: 'ABNORMAL',
    barcode: '8801234500024',
    reportNote: '충전부 포장재 조각 확인, 라인 정지',
    reportPhotoCount: 2,
    confirmedAt: minutesAgo(78),
    confirmedBy: '김사무',
    judgement: 'ISSUE',
    issueNote: '동일 라인 금주 2회째 — 포장재 절단부 설비 점검 필요',
    action: '해당 로트 전량 재검사 후 라인 재가동',
    photoCount: 0,
  },
]

// ── 로컬 저장소 (이 탭 메모리에만 존재) ──────────────────────────────────────

const kanbans = seedKanbans()
const store = {
  kanbans,
  workOrders: seedWorkOrders(kanbans),
  results: seedResults(kanbans),
  defects: seedDefects(kanbans),
  history: seedHistory(kanbans),
  andonEvents: seedAndonEvents(),
}

// ── 집계 ─────────────────────────────────────────────────────────────────────

function totalsOf(items: Kanban[]): DashboardSummary['overall'] {
  const sum = (pick: (k: Kanban) => number) => items.reduce((a, k) => a + pick(k), 0)
  const total = items.length
  const completed = items.filter((k) => k.status === '완료').length
  const inputQty = sum((k) => k.inputQty)
  const goodQty = sum((k) => k.goodQty)
  const defectQty = sum((k) => k.defectQty)
  const plannedQty = sum((k) => k.plannedQty)
  const producedQty = goodQty + defectQty
  const pct = (n: number, d: number) => (d ? Math.round((n / d) * 1000) / 10 : 0)
  return {
    total,
    completed,
    inProgress: items.filter((k) => k.status === '작업').length,
    waiting: items.filter((k) => k.status === '대기').length,
    ready: items.filter((k) => k.status === '준비').length,
    rate: pct(completed, total),
    plannedQty,
    inputQty,
    goodQty,
    defectQty,
    producedQty,
    yieldRate: pct(goodQty, inputQty),
    defectRate: pct(defectQty, producedQty),
    achievementRate: pct(goodQty, plannedQty),
    lossQty: Math.max(0, inputQty - producedQty),
  }
}

function groupBy<K extends string>(items: Kanban[], key: (k: Kanban) => K) {
  const map = new Map<K, Kanban[]>()
  items.forEach((k) => {
    const g = key(k)
    map.set(g, [...(map.get(g) ?? []), k])
  })
  return map
}

function summary(team?: string): DashboardSummary {
  const items = team ? store.kanbans.filter((k) => k.team === team) : store.kanbans
  return {
    overall: totalsOf(items),
    byTeam: [...groupBy(items, (k) => k.team)].map(([t, ks]) => ({ team: t, ...totalsOf(ks) })),
    byProcess: [...groupBy(items, (k) => k.processSection)].map(([p, ks]) => ({
      processSection: p,
      ...totalsOf(ks),
    })),
    defectByReason: DEFECT_SEED.map(([code, label, qty]) => ({ code, label, count: 1, qty })),
    isEmpty: items.length === 0,
  }
}

// ── 라우팅 ───────────────────────────────────────────────────────────────────

function paramsOf(path: string): URLSearchParams {
  const q = path.indexOf('?')
  return new URLSearchParams(q >= 0 ? path.slice(q + 1) : '')
}

/** 조회 경로에 해당하는 로컬 응답. 없으면 undefined (→ 폴백하지 않는다) */
export function demoResponseFor(path: string): unknown | undefined {
  const [base] = path.split('?')
  const p = paramsOf(path)

  if (base === '/api/production/kanbans') {
    let items = store.kanbans.filter((k) => p.get('includeCanceled') === 'true' || !k.canceled)
    const team = p.get('team')
    const status = p.get('status')
    const q = p.get('q')
    if (team) items = items.filter((k) => k.team === team)
    if (status) items = items.filter((k) => k.status === status)
    if (q) items = items.filter((k) => (k.productName + k.kanbanNumber).includes(q))
    const size = Number(p.get('size') ?? 100) || 100
    const page = Number(p.get('page') ?? 1) || 1
    return {
      items: items.slice((page - 1) * size, page * size),
      total: items.length,
      page,
      size,
      pageCount: Math.max(1, Math.ceil(items.length / size)),
    }
  }

  if (base === '/api/production/work-orders') return { workOrders: store.workOrders }

  if (base === '/api/production/results/pending') {
    const pending = store.results.filter((r) => r.approvalStatus === '승인대기')
    return { results: pending, count: pending.length }
  }

  if (base === '/api/field/production/defects') {
    const kanbanId = p.get('kanbanId')
    const defects = kanbanId ? store.defects.filter((d) => d.kanbanId === kanbanId) : store.defects
    return { defects, totalQty: defects.reduce((a, d) => a + d.qty, 0) }
  }

  if (base === '/api/production/history') {
    const limit = Number(p.get('limit') ?? 0)
    const events = limit ? store.history.slice(0, limit) : store.history
    return { events, total: store.history.length }
  }

  if (base === '/api/dashboard/summary') return summary(p.get('team') ?? undefined)

  // 안돈 (andon.ts 는 /api/andon 을 접두어로 붙여 호출한다)
  if (base === '/api/andon/types') return { types: ANDON_TYPES }

  // 상세 — 백엔드에서는 사진 본문(dataURL)이 함께 온다.
  // 로컬 폴백에는 실제 사진이 없으므로 "데모 사진" 자리표시를 만들어 흐름만 보여준다.
  const andonDetail = /^\/api\/andon\/events\/([^/]+)$/.exec(base!)
  if (andonDetail) {
    const target = store.andonEvents.find((e) => e.id === decodeURIComponent(andonDetail[1]!))
    if (!target) return undefined
    return {
      event: {
        ...target,
        reportPhotos: Array.from({ length: target.reportPhotoCount ?? 0 }, (_, i) =>
          demoPhoto(i + 1),
        ),
        photos: [],
      },
    }
  }
  if (base === '/api/andon/events') {
    const typeId = p.get('typeId') as AndonTypeId | null
    const events = typeId ? store.andonEvents.filter((e) => e.typeId === typeId) : store.andonEvents
    const open = store.andonEvents.filter((e) => e.status === 'OPEN')
    const reported = store.andonEvents.filter((e) => e.status === 'REPORTED')
    const byType = (list: AndonEvent[]) =>
      ANDON_TYPES.reduce(
        (acc, t) => ({ ...acc, [t.id]: list.filter((e) => e.typeId === t.id).length }),
        {} as Record<AndonTypeId, number>,
      )
    return {
      events,
      openCount: open.length,
      openCountByType: byType(open),
      reportedCount: reported.length,
      reportedCountByType: byType(reported),
      issueCount: store.andonEvents.filter((e) => e.judgement === 'ISSUE').length,
    }
  }

  return undefined
}

/** 저장 경로에 해당하는 로컬 처리. 없으면 undefined (→ 폴백하지 않고 오류를 그대로 낸다) */
export function demoMutationFor(path: string, body: unknown): unknown | undefined {
  const [base] = path.split('?')
  const payload = (body ?? {}) as Record<string, unknown>

  // 실적 승인 / 반려
  const approve = /^\/api\/production\/results\/([^/]+)\/approve$/.exec(base!)
  const reject = /^\/api\/production\/results\/([^/]+)\/reject$/.exec(base!)
  if (approve || reject) {
    const id = decodeURIComponent((approve ?? reject)![1]!)
    const target = store.results.find((r) => r.id === id)
    if (!target) return undefined
    const updated: ProductionResult = approve
      ? { ...target, approvalStatus: '승인', approvedBy: '반장', approvedAt: now(), rejectReason: null }
      : {
          ...target,
          approvalStatus: '반려',
          approvedBy: null,
          approvedAt: null,
          rejectReason: String(payload['reason'] ?? ''),
        }
    store.results = store.results.map((r) => (r.id === id ? updated : r))
    return { result: updated }
  }

  if (base === '/api/production/results/bulk-approve') {
    const ids = (payload['ids'] as string[] | undefined) ?? []
    store.results = store.results.map((r) =>
      ids.includes(r.id)
        ? { ...r, approvalStatus: '승인' as ApprovalStatus, approvedBy: '반장', approvedAt: now() }
        : r,
    )
    return { approved: ids, failed: [] }
  }

  // 불량 확인
  const confirmDefect = /^\/api\/production\/defects\/([^/]+)\/confirm$/.exec(base!)
  if (confirmDefect) {
    const id = decodeURIComponent(confirmDefect[1]!)
    const target = store.defects.find((d) => d.id === id)
    if (!target) return undefined
    const updated: Defect = { ...target, confirmedBy: '반장', confirmedAt: now() }
    store.defects = store.defects.map((d) => (d.id === id ? updated : d))
    return { defect: updated }
  }

  // 작업지시 발행 / 취소
  if (base === '/api/production/work-orders/issue') {
    const kanbanIds = (payload['kanbanIds'] as string[] | undefined) ?? []
    const workOrder: WorkOrder = {
      id: `DEMO-WO-${store.workOrders.length + 1}`,
      date: (payload['date'] as string | undefined) ?? today(),
      line: (payload['line'] as string | undefined) ?? '1라인',
      team: (payload['team'] as string | undefined) ?? '전체',
      title: (payload['title'] as string | undefined) ?? `${today()} 생산 작업지시`,
      status: '발행',
      kanbanIds,
      issuedAt: now(),
      issuedBy: '반장',
      canceledAt: null,
      cancelReason: null,
    }
    store.workOrders = [workOrder, ...store.workOrders]
    return { workOrder, issuedCount: kanbanIds.length }
  }

  const cancelWo = /^\/api\/production\/work-orders\/([^/]+)\/cancel$/.exec(base!)
  if (cancelWo) {
    const id = decodeURIComponent(cancelWo[1]!)
    const target = store.workOrders.find((w) => w.id === id)
    if (!target) return undefined
    const updated: WorkOrder = {
      ...target,
      status: '취소',
      canceledAt: now(),
      cancelReason: String(payload['reason'] ?? ''),
    }
    store.workOrders = store.workOrders.map((w) => (w.id === id ? updated : w))
    return { workOrder: updated, recalledKanbans: target.kanbanIds.length, rejectedResults: 0 }
  }

  // 마감 점검 제출
  if (base === '/api/closing-check') {
    return { record: { id: `DEMO-CC-${store.history.length + 1}` } }
  }

  // 안돈 1단계 — 반장이 올리는 이슈.
  // 같은 유형의 미확인 발생 건이 있으면 거기에 붙이고, 없으면 새로 만든다.
  if (base === '/api/andon/issues') {
    const typeId = payload['typeId'] as AndonTypeId
    const type = ANDON_TYPES.find((t) => t.id === typeId)
    if (!type) return undefined
    const photos = (payload['photos'] as string[] | undefined) ?? []
    const open = store.andonEvents
      .filter((e) => e.typeId === typeId && e.status === 'OPEN')
      .sort((a, b) => a.occurredAt.localeCompare(b.occurredAt))
    const base0: AndonEvent = open[0] ?? {
      id: `DEMO-A-${Date.now()}`,
      typeId,
      typeLabel: type.label,
      line: type.line,
      lineNo: '-',
      equipment: type.equipment,
      detail: type.detail,
      product: '-',
      lotNo: '-',
      metricLabel: type.metricLabel,
      metricValue: '-',
      metricUnit: type.metricUnit,
      spec: type.spec,
      occurredAt: now(),
      source: 'FOREMAN',
      status: 'OPEN',
      photoCount: 0,
    }
    const updated: AndonEvent = {
      ...base0,
      status: 'REPORTED',
      reportedAt: now(),
      reportedBy: String(payload['reportedBy'] ?? '반장'),
      finding: 'ABNORMAL',
      barcode: (payload['barcode'] as string | undefined) ?? '',
      reportNote: (payload['note'] as string | undefined) ?? '',
      reportPhotoCount: photos.length,
    }
    store.andonEvents = open[0]
      ? store.andonEvents.map((e) => (e.id === updated.id ? updated : e))
      : [updated, ...store.andonEvents]
    return { event: updated }
  }

  // 안돈 2단계 — 사무관리자 확인 완료
  const confirmAndon = /^\/api\/andon\/events\/([^/]+)\/confirm$/.exec(base!)
  if (confirmAndon) {
    const id = decodeURIComponent(confirmAndon[1]!)
    const target = store.andonEvents.find((e) => e.id === id)
    if (!target) return undefined
    const photos = (payload['photos'] as string[] | undefined) ?? []
    const updated: AndonEvent = {
      ...target,
      status: 'CONFIRMED',
      confirmedAt: now(),
      confirmedBy: String(payload['confirmedBy'] ?? '사무관리자'),
      judgement: (payload['judgement'] as AndonEvent['judgement']) ?? 'NO_ISSUE',
      issueNote: (payload['issueNote'] as string | undefined) ?? '',
      action: (payload['action'] as string | undefined) ?? '',
      photoCount: photos.length,
    }
    store.andonEvents = store.andonEvents.map((e) => (e.id === id ? updated : e))
    return { event: updated }
  }

  return undefined
}
