import { create } from 'zustand'
import {
  fetchAndonEvents,
  fetchAndonTypes,
  createAndonIssue,
  confirmAndonEvent,
  type AndonEvent,
  type AndonJudgement,
  type AndonType,
  type AndonTypeId,
} from '@/api/andon'

interface AndonStore {
  types: AndonType[]
  events: AndonEvent[]
  /** 반장 현장 확인 대기 건수 */
  openCountByType: Record<string, number>
  /** 사무관리자 확인 대기 건수 */
  reportedCountByType: Record<string, number>
  loaded: boolean
  offline: boolean // mes-v2 API 연결 실패 여부
  refresh: () => Promise<void>
  /** 1단계 — 반장이 이슈를 올린다 (바코드 · 사진 · 내용) */
  raiseIssue: (payload: {
    typeId: AndonTypeId
    reportedBy: string
    barcode: string
    note: string
    photos: string[]
  }) => Promise<void>
  /** 2단계 — 사무관리자 확인 / 이슈 있음(메모) */
  confirm: (
    id: string,
    payload: {
      confirmedBy: string
      judgement: AndonJudgement
      issueNote?: string
    }
  ) => Promise<void>
}

export const useAndonStore = create<AndonStore>((set, get) => ({
  types: [],
  events: [],
  openCountByType: {},
  reportedCountByType: {},
  loaded: false,
  offline: false,

  refresh: async () => {
    try {
      const [typesRes, eventsRes] = await Promise.all([
        get().types.length ? Promise.resolve({ types: get().types }) : fetchAndonTypes(),
        fetchAndonEvents(),
      ])
      set({
        types: typesRes.types,
        events: eventsRes.events,
        openCountByType: eventsRes.openCountByType,
        reportedCountByType: eventsRes.reportedCountByType ?? {},
        loaded: true,
        offline: false,
      })
    } catch {
      set({ loaded: true, offline: true })
    }
  },

  raiseIssue: async (payload) => {
    await createAndonIssue(payload)
    await get().refresh()
  },

  confirm: async (id, payload) => {
    await confirmAndonEvent(id, payload)
    await get().refresh()
  },
}))

/** 반장이 현장에서 확인해야 할 건 */
export const openEventsOfType = (events: AndonEvent[], typeId: AndonTypeId) =>
  events.filter((e) => e.typeId === typeId && e.status === 'OPEN')

/** 반장 보고가 올라와 사무관리자 확인을 기다리는 건 */
export const reportedEventsOfType = (events: AndonEvent[], typeId: AndonTypeId) =>
  events.filter((e) => e.typeId === typeId && e.status === 'REPORTED')

/** 사무관리자 확인까지 끝난 건 */
export const confirmedEventsOfType = (events: AndonEvent[], typeId: AndonTypeId) =>
  events.filter((e) => e.typeId === typeId && e.status === 'CONFIRMED')
