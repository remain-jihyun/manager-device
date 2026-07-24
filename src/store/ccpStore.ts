import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// 반별로 CCP가 지정되고, 주기(30분/1시간 등) 설정에 따라
// 점검 점표(점검표)가 자동 생성되는 컨셉.
// 실제 CCP 지정·주기 설정은 MES "CCP 관리"에서 관리 → 추후 연동.
export type CCPKind = 'CCP' | 'CP'

interface CCPSchedule {
  id: string
  line: string // 지정 반/구역 (반별 CCP)
  label: string // CCP 점검명
  kind: CCPKind // CCP(중요관리점) / CP(관리점) 구분
  intervalMin: number // 점검 주기(분) — 30분/60분 등
  startTime: string // 점표 생성 시작 시각 (HH:mm)
  enabled: boolean
}

interface CCPStore {
  schedules: CCPSchedule[]
  addSchedule: (schedule: Omit<CCPSchedule, 'id'>) => void
  updateSchedule: (id: string, data: Partial<CCPSchedule>) => void
  removeSchedule: (id: string) => void
}

export const useCCPStore = create<CCPStore>()(
  persist(
    (set) => ({
      schedules: [
        { id: '1', line: '전처리반', label: '소독헹굼', kind: 'CCP', intervalMin: 60, startTime: '09:00', enabled: true },
        { id: '2', line: '가열반', label: '가열', kind: 'CCP', intervalMin: 30, startTime: '09:00', enabled: true },
        { id: '3', line: '포장반', label: '금속검출', kind: 'CCP', intervalMin: 60, startTime: '09:30', enabled: true },
        { id: '4', line: '튀김반', label: '산가', kind: 'CCP', intervalMin: 120, startTime: '10:00', enabled: true },
        { id: '5', line: '소스반', label: '소스 당도염도', kind: 'CP', intervalMin: 120, startTime: '10:00', enabled: true },
        { id: '6', line: '해동반', label: '해동공정관리', kind: 'CP', intervalMin: 120, startTime: '08:30', enabled: true },
        { id: '7', line: '김치반', label: '김치숙성', kind: 'CP', intervalMin: 240, startTime: '08:30', enabled: true },
        { id: '8', line: '냉각반', label: '냉각관리', kind: 'CP', intervalMin: 60, startTime: '09:30', enabled: true },
        { id: '9', line: '입고반', label: '입고검수', kind: 'CP', intervalMin: 240, startTime: '08:00', enabled: true },
        { id: '10', line: '튀김반', label: '식용유산가', kind: 'CP', intervalMin: 240, startTime: '10:30', enabled: true },
        { id: '11', line: '출하반', label: '유통온도및상태관리', kind: 'CP', intervalMin: 120, startTime: '11:00', enabled: true },
      ],
      addSchedule: (schedule) =>
        set((s) => ({
          schedules: [...s.schedules, { ...schedule, id: Date.now().toString() }],
        })),
      updateSchedule: (id, data) =>
        set((s) => ({
          schedules: s.schedules.map((sc) => (sc.id === id ? { ...sc, ...data } : sc)),
        })),
      removeSchedule: (id) =>
        set((s) => ({ schedules: s.schedules.filter((sc) => sc.id !== id) })),
    }),
    { name: 'banjiang-ccp-v4' }
  )
)
