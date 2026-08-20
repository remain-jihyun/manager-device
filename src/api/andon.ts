// 안돈 API 클라이언트 — mes-v2(:4000)가 소유한 데이터를 소비만 한다.
// 유형/기준정보는 GET /api/andon/types 로 받아온다 (단말에서 정의하지 않음).

import { demoMutationFor, demoResponseFor } from './demo-data'
import { serverRoleOf, useAuthStore } from '@/store/authStore'

export const MES_API_BASE =
  (import.meta.env['VITE_MES_API_BASE'] as string | undefined) ?? 'http://localhost:4000'

export type AndonTypeId = 'FOREIGN_MATTER' | 'METAL_DETECTOR' | 'WEIGHT_SORTER'

/**
 * 안돈 처리 흐름 (2026-08-10 정책)
 *   OPEN      발생 — 반장 현장 확인 대기
 *   REPORTED  반장이 현장 확인 결과를 올림 — 사무관리자 확인 대기
 *   CONFIRMED 사무관리자가 최종 확인 (judgement 로 이상없음/이슈 구분)
 */
export type AndonStatus = 'OPEN' | 'REPORTED' | 'CONFIRMED'

/** 반장의 현장 확인 결과 */
export type AndonFinding = 'ABNORMAL' | 'NORMAL'

/** 사무관리자의 최종 판정 */
export type AndonJudgement = 'NO_ISSUE' | 'ISSUE'

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

  // 1단계 — 반장 현장 확인 보고
  reportedAt?: string
  reportedBy?: string
  finding?: AndonFinding
  barcode?: string
  reportNote?: string
  reportPhotoCount?: number

  // 2단계 — 사무관리자 최종 확인
  confirmedAt?: string
  confirmedBy?: string
  judgement?: AndonJudgement
  issueNote?: string
  action?: string
  photoCount: number
}

/**
 * 상세 응답 — 목록에는 사진 개수만 오고, 사진 본문(dataURL)은 상세에서만 온다.
 * 사무관리자가 확인할 때 반장이 올린 사진을 실제로 봐야 하므로 이 경로를 쓴다.
 */
export interface AndonEventDetail extends AndonEvent {
  /** 반장이 올린 현장 사진 */
  reportPhotos?: string[]
  /** 사무관리자가 덧붙인 사진 */
  photos?: string[]
}

export interface AndonEventsResponse {
  events: AndonEvent[]
  /** 반장 현장 확인 대기 */
  openCount: number
  openCountByType: Record<AndonTypeId, number>
  /** 사무관리자 확인 대기 */
  reportedCount?: number
  reportedCountByType?: Record<AndonTypeId, number>
  issueCount?: number
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

/** 로그인 수단으로 정해진 역할을 그대로 서버 권한 헤더로 보낸다. */
function headers(): HeadersInit {
  const user = useAuthStore.getState().user
  return {
    'Content-Type': 'application/json',
    'X-Role': serverRoleOf(user?.role),
    // 헤더는 latin-1 이라 한글 이름은 인코딩해서 보낸다.
    'X-Actor': encodeURIComponent(user?.name ?? '반장'),
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${MES_API_BASE}/api/andon${path}`, {
      ...init,
      headers: { ...headers(), ...(init?.headers ?? {}) },
    })
  } catch (err) {
    // 백엔드(:4000)가 없어도 안돈 화면이 비지 않도록 로컬 저장소로 처리한다.
    // 확인 완료도 로컬에 반영되므로 흐름 전체를 눌러볼 수 있다.
    const method = (init?.method ?? 'GET').toUpperCase()
    const full = `/api/andon${path}`
    const local =
      method === 'GET'
        ? demoResponseFor(full)
        : demoMutationFor(full, init?.body ? JSON.parse(String(init.body)) : {})
    if (local !== undefined) return local as T
    throw err
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(body.error || `요청 실패 (${res.status})`)
  }
  return (await res.json()) as T
}

export const fetchAndonTypes = () => request<{ types: AndonType[] }>('/types')

export const fetchAndonEvents = (typeId?: AndonTypeId) =>
  request<AndonEventsResponse>(`/events${typeId ? `?typeId=${typeId}` : ''}`)

/** 상세 — 사진 본문(dataURL)이 포함된다 */
export const fetchAndonEventDetail = (id: string) =>
  request<{ event: AndonEventDetail }>(`/events/${id}`)

/**
 * 1단계 — 반장이 올리는 이슈.
 * 반장 화면에는 발생 내역이 없다. 바코드 · 사진 · 내용만 올린다.
 * 같은 유형의 미확인 발생 건이 있으면 서버가 그 건에 붙인다.
 */
export const createAndonIssue = (body: {
  typeId: AndonTypeId
  reportedBy: string
  barcode: string
  note: string
  photos: string[]
}) =>
  request<{ event: AndonEvent }>('/issues', {
    method: 'POST',
    body: JSON.stringify(body),
  })

/** 2단계 — 사무관리자 최종 확인. 반장 권한으로 호출하면 서버가 403 을 낸다. */
export const confirmAndonEvent = (
  id: string,
  body: {
    confirmedBy: string
    judgement: AndonJudgement
    issueNote?: string
  }
) =>
  request<{ event: AndonEvent }>(`/events/${id}/confirm`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
