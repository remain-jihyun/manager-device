// ============================================================================
// MES v2 API 클라이언트 (생산관리)
//
// manager-device 는 mes-v2(:4000)가 소유한 데이터를 소비·조작만 한다.
// 업무 유형·기준정보를 여기서 정의하지 않는다. (CLAUDE.md 연동규칙 1)
// ============================================================================

import { MES_API_BASE } from './andon'
import { demoMutationFor, demoResponseFor } from './demo-data'
import { serverRoleOf, useAuthStore } from '@/store/authStore'

export { MES_API_BASE }

// ─── 계약 타입 (mes-v2 원본과 1:1) ───────────────────────────────────────────

export const KANBAN_STATUSES = ['준비', '대기', '작업', '완료'] as const
export type KanbanStatus = (typeof KANBAN_STATUSES)[number]

export type ApprovalStatus = '미제출' | '승인대기' | '승인' | '반려'
export type WorkOrderStatus = '작성' | '발행' | '취소' | '완료'

export interface Kanban {
  id: string
  kanbanNumber: string
  date: string
  workOrderId: string | null
  productCode: string
  sanCode: string
  productName: string
  processSection: string
  team: string
  deviceId: string | null
  plannedQty: number
  unit: string
  status: KanbanStatus
  assignee: string
  startTime: string | null
  endTime: string | null
  progress: number
  inputQty: number
  goodQty: number
  defectQty: number
  weightKg: number | null
  approvalStatus: ApprovalStatus
  rejectReason: string | null
  holdReason: string | null
  canceled: boolean
  version: number
}

export interface WorkOrder {
  id: string
  date: string
  line: string
  team: string
  title: string
  status: WorkOrderStatus
  kanbanIds: string[]
  issuedAt: string | null
  issuedBy: string | null
  canceledAt: string | null
  cancelReason: string | null
}

export interface ProductionResult {
  id: string
  kanbanId: string
  kanbanNumber: string
  deviceId: string
  reportedBy: string
  inputQty: number
  goodQty: number
  defectQty: number
  weightKg: number | null
  unit: string
  reportedAt: string
  approvalStatus: ApprovalStatus
  approvedBy: string | null
  approvedAt: string | null
  rejectReason: string | null
}

export interface Defect {
  id: string
  kanbanId: string
  kanbanNumber: string
  reasonCode: string
  reasonLabel: string
  qty: number
  note: string
  reportedBy: string
  reportedAt: string
  confirmedBy: string | null
  confirmedAt: string | null
}

export interface HistoryEvent {
  id: string
  at: string
  actor: string
  role: string
  entity: string
  entityId: string
  action: string
  from: string | null
  to: string | null
  detail: string | null
}

export interface DashboardSummary {
  overall: {
    total: number
    completed: number
    inProgress: number
    waiting: number
    ready: number
    rate: number
    plannedQty: number
    inputQty: number
    goodQty: number
    defectQty: number
    producedQty: number
    yieldRate: number
    defectRate: number
    achievementRate: number
    lossQty: number
  }
  byTeam: Array<{ team: string } & DashboardSummary['overall']>
  byProcess: Array<{ processSection: string } & DashboardSummary['overall']>
  defectByReason: Array<{ code: string; label: string; count: number; qty: number }>
  isEmpty: boolean
}

// ─── 요청 ────────────────────────────────────────────────────────────────────

export class MesApiError extends Error {
  readonly status: number
  readonly body: Record<string, unknown>

  constructor(status: number, message: string, body: Record<string, unknown> = {}) {
    super(message)
    this.status = status
    this.body = body
  }
}

/**
 * 이 단말은 공용이라 **로그인 수단이 곧 역할**이다.
 * 카카오 = 반장(MANAGER), 이메일(Google) = 사무관리자(OFFICE). 서버가 이 역할로 권한을 검사한다.
 */
function headers(): HeadersInit {
  const user = useAuthStore.getState().user
  return {
    'Content-Type': 'application/json',
    'X-Role': serverRoleOf(user?.role),
    // 헤더는 latin-1 이라 한글 이름은 인코딩해서 보낸다.
    'X-Actor': encodeURIComponent(user?.name ?? '반장'),
  }
}

/** 백엔드에 아예 닿지 못해 로컬 데이터로 화면을 채운 상태인지. */
let demoMode = false
export const isDemoMode = (): boolean => demoMode

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${MES_API_BASE}${path}`, {
      ...init,
      headers: { ...headers(), ...(init?.headers ?? {}) },
    })
  } catch (err) {
    // 네트워크 자체가 실패 — mes-v2 백엔드(:4000)가 떠 있지 않은 경우가 여기다.
    // 백엔드 없이도 화면이 완전히 동작하도록 조회·저장 모두 로컬 저장소로 처리한다.
    // (서버가 응답한 4xx/5xx 는 여기로 오지 않는다 — 진짜 오류는 그대로 드러낸다)
    const method = (init?.method ?? 'GET').toUpperCase()
    const local =
      method === 'GET'
        ? demoResponseFor(path)
        : demoMutationFor(path, init?.body ? JSON.parse(String(init.body)) : {})
    if (local !== undefined) {
      demoMode = true
      return local as T
    }
    throw err
  }
  const text = await res.text()
  let body: Record<string, unknown> = {}
  try {
    body = text ? (JSON.parse(text) as Record<string, unknown>) : {}
  } catch {
    body = { raw: text }
  }
  if (!res.ok) {
    throw new MesApiError(
      res.status,
      (body['error'] as string | undefined) ?? `요청이 실패했습니다 (${res.status})`,
      body,
    )
  }
  demoMode = false
  return body as T
}

// ─── 간반 ────────────────────────────────────────────────────────────────────

export function fetchKanbans(params: {
  date?: string
  team?: string
  status?: KanbanStatus
  q?: string
  page?: number
  size?: number
  includeCanceled?: boolean
} = {}) {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') qs.set(k, String(v))
  })
  return request<{ items: Kanban[]; total: number; page: number; size: number; pageCount: number }>(
    `/api/production/kanbans?${qs.toString()}`,
  )
}

// ─── 작업지시 ────────────────────────────────────────────────────────────────

export function fetchWorkOrders(date?: string) {
  return request<{ workOrders: WorkOrder[] }>(
    `/api/production/work-orders${date ? `?date=${date}` : ''}`,
  )
}

export function issueWorkOrder(body: {
  line?: string
  team?: string
  date?: string
  kanbanIds?: string[]
  title?: string
}) {
  return request<{ workOrder: WorkOrder; issuedCount: number }>(
    '/api/production/work-orders/issue',
    { method: 'POST', body: JSON.stringify(body) },
  )
}

export function cancelWorkOrder(id: string, reason: string, force = false) {
  return request<{ workOrder: WorkOrder; recalledKanbans: number; rejectedResults: number }>(
    `/api/production/work-orders/${encodeURIComponent(id)}/cancel`,
    { method: 'POST', body: JSON.stringify({ reason, force }) },
  )
}

// ─── 실적 승인 ───────────────────────────────────────────────────────────────

export function fetchPendingResults() {
  return request<{ results: ProductionResult[]; count: number }>('/api/production/results/pending')
}

export function approveResult(id: string) {
  return request<{ result: ProductionResult }>(
    `/api/production/results/${encodeURIComponent(id)}/approve`,
    { method: 'POST' },
  )
}

export function rejectResult(id: string, reason: string) {
  return request<{ result: ProductionResult }>(
    `/api/production/results/${encodeURIComponent(id)}/reject`,
    { method: 'POST', body: JSON.stringify({ reason }) },
  )
}

export function bulkApproveResults(ids: string[]) {
  return request<{ approved: string[]; failed: { id: string; reason: string }[] }>(
    '/api/production/results/bulk-approve',
    { method: 'POST', body: JSON.stringify({ ids }) },
  )
}

// ─── 불량 ────────────────────────────────────────────────────────────────────

export function fetchDefects(kanbanId?: string) {
  return request<{ defects: Defect[]; totalQty: number }>(
    `/api/field/production/defects${kanbanId ? `?kanbanId=${encodeURIComponent(kanbanId)}` : ''}`,
  )
}

export function confirmDefect(id: string) {
  return request<{ defect: Defect }>(
    `/api/production/defects/${encodeURIComponent(id)}/confirm`,
    { method: 'POST' },
  )
}

// ─── 이력 · 대시보드 ─────────────────────────────────────────────────────────

export function fetchHistory(params: { entity?: string; entityId?: string; limit?: number } = {}) {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined) qs.set(k, String(v))
  })
  return request<{ events: HistoryEvent[]; total: number }>(
    `/api/production/history?${qs.toString()}`,
  )
}

export function fetchDashboardSummary(params: { date?: string; team?: string } = {}) {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined) qs.set(k, String(v))
  })
  return request<DashboardSummary>(`/api/dashboard/summary?${qs.toString()}`)
}

// ─── 현장 점검 마감 ──────────────────────────────────────────────────────────

export function submitClosingCheck(payload: Record<string, unknown>) {
  return request<{ record: { id: string } }>('/api/closing-check', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
