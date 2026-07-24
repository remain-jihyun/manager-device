export type InputType = 'ox' | 'number' | 'time' | 'text' | 'multi_number' | 'photo'

// 작업 단계 분류 — mes-v2 "현장 점검 항목 관리"에서 항목 추가 시 설정한다.
export type WorkPhase = '작업전' | '작업중' | '작업후'
export const WORK_PHASES: WorkPhase[] = ['작업전', '작업중', '작업후']

export interface CheckItem {
  id: string
  no?: number // 엑셀 순서(No)
  category: string
  label: string
  desc?: string // 서브 타이틀(항목 설명) — 선택사항. mes-v2 "현장 점검 항목 관리"에서 입력.
  inputType: InputType
  phase?: WorkPhase // 작업전/작업중/작업후 (미지정 시 라벨 기반 자동 분류)
  unit?: string
  fields?: string[]
}

export interface SectionData {
  sectionId: string
  sectionName: string
  items: CheckItem[]
}

// 점표(체크포인트): QR 코드와 1:1 매칭되는 현장 검수 지점.
// 스캔으로만 활성화되며, 점표마다 입력 스키마(items)가 다르다.
export interface Checkpoint {
  id: string
  name: string // 점표 이름
  location: string // 위치/반
  qrCode: string // 매칭되는 QR 코드 값 (스캔 시 이 값으로 점표를 찾음)
  items: CheckItem[] // 점표별 입력 스키마
}

export interface CheckAnswer {
  itemId: string
  value: string | number | string[] | Record<string, number | null> | null // string[]: 사진(dataURL) 첨부
  note?: string
}

export interface ClosingCheckRecord {
  id: string
  date: string
  sectionId: string
  utilityType?: string
  qrData?: string
  photosByPhase: Record<WorkPhase, string[]> // 단계별 사진(dataURL)
  answers: CheckAnswer[]
  notesByPhase: Record<WorkPhase, string> // 단계별 특이사항
  submittedAt?: string
}

export function emptyPhaseMap<T>(make: () => T): Record<WorkPhase, T> {
  return { 작업전: make(), 작업중: make(), 작업후: make() }
}
