import { create } from 'zustand'
import {
  fetchAndonEvents,
  fetchAndonTypes,
  confirmAndonEvent,
  type AndonEvent,
  type AndonType,
  type AndonTypeId,
} from '@/api/andon'

interface AndonStore {
  types: AndonType[]
  events: AndonEvent[]
  openCountByType: Record<string, number>
  loaded: boolean
  offline: boolean // mes-v2 API 연결 실패 여부
  refresh: () => Promise<void>
  confirm: (
    id: string,
    payload: { confirmedBy: string; action?: string; photos: string[] }
  ) => Promise<void>
}

export const useAndonStore = create<AndonStore>((set, get) => ({
  types: [],
  events: [],
  openCountByType: {},
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
        loaded: true,
        offline: false,
      })
    } catch {
      set({ loaded: true, offline: true })
    }
  },

  confirm: async (id, payload) => {
    await confirmAndonEvent(id, payload)
    await get().refresh()
  },
}))

export const openEventsOfType = (events: AndonEvent[], typeId: AndonTypeId) =>
  events.filter((e) => e.typeId === typeId && e.status === 'OPEN')

export const confirmedEventsOfType = (events: AndonEvent[], typeId: AndonTypeId) =>
  events.filter((e) => e.typeId === typeId && e.status === 'CONFIRMED')
