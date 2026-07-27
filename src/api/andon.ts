// 안돈 API 클라이언트 — mes-v2(:4000)가 소유한 데이터를 소비만 한다.
// 유형/기준정보는 GET /api/andon/types 로 받아온다 (단말에서 정의하지 않음).

export const MES_API_BASE =
  (import.meta.env['VITE_MES_API_BASE'] as string | undefined) ?? 'http://localhost:4000'

export type AndonTypeId = 'FOREIGN_MATTER' | 'METAL_DETECTOR' | 'WEIGHT_SORTER'
export type AndonStatus = 'OPEN' | 'CONFIRMED'

export interface AndonType {
  id: AndonTypeId
  label: string
  line: string
  equipment: string
  detail: string
  metricLabel: string
  metricUnit: string
  spec: string
  requirePhoto: boolean
}

export interface AndonEvent {
  id: string
  typeId: AndonTypeId
  typeLabel: string
  line: string
  lineNo: string
  equipment: string
  detail: string
  product: string
  lotNo: string
  metricLabel: string
  metricValue: string
  metricUnit: string
  spec: string
  occurredAt: string
  source: string
  status: AndonStatus
  confirmedAt?: string
  confirmedBy?: string
  action?: string
  photoCount: number
}

export interface AndonEventsResponse {
  events: AndonEvent[]
  openCount: number
  openCountByType: Record<AndonTypeId, number>
}

/** URL 슬러그 ↔ 유형 ID (라우팅용 매핑. 기준정보가 아니라 화면 경로일 뿐이다) */
export const ANDON_SLUG_TO_TYPE: Record<string, AndonTypeId> = {
  foreign: 'FOREIGN_MATTER',
  metal: 'METAL_DETECTOR',
  weight: 'WEIGHT_SORTER',
}

export const ANDON_TYPE_TO_SLUG: Record<AndonTypeId, string> = {
  FOREIGN_MATTER: 'foreign',
  METAL_DETECTOR: 'metal',
  WEIGHT_SORTER: 'weight',
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${MES_API_BASE}/api/andon${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(body.error || `요청 실패 (${res.status})`)
  }
  return (await res.json()) as T
}

export const fetchAndonTypes = () => request<{ types: AndonType[] }>('/types')

export const fetchAndonEvents = (typeId?: AndonTypeId) =>
  request<AndonEventsResponse>(`/events${typeId ? `?typeId=${typeId}` : ''}`)

export const confirmAndonEvent = (
  id: string,
  body: { confirmedBy: string; action?: string; photos: string[] }
) =>
  request<{ event: AndonEvent }>(`/events/${id}/confirm`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
