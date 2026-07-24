// CCP 점검 항목 (가열·소독 중심 예시)
// 출처: MES CCP 관리 (추후 연동)
// - 실제 점검 리스트(무엇을 점검할지)는 생산 품질에서 확정 예정
// - CCP 등록·수정은 MES "CCP 관리"에서 관리 → 추후 연동, 현재는 placeholder 상수
//
// 이것은 "온도 점검"이 아니라 현장 일지 성격의 "CCP 점검"(가열/소독/세척 등)입니다.

export interface CCPCheckItem {
  id: string
  label: string // 점검 항목명
  required: boolean // 필수값 여부 (true면 미입력 시 점검 완료 불가)
  unit?: string // 입력 단위 (℃, 분, ppm 등)
  options?: string[] // 선택형 보기 (예: 양호/불량)
  placeholder?: string // 입력 가이드
}

export const CCP_CHECK_ITEMS: CCPCheckItem[] = [
  { id: 'heat-temp', label: '가열 온도 도달', required: true, unit: '℃', placeholder: '예: 78' },
  { id: 'heat-time', label: '가열 시간 도달', required: true, unit: '분', placeholder: '예: 2' },
  { id: 'sanitizer-conc', label: '소독액 농도', required: true, unit: 'ppm', placeholder: '예: 100' },
  { id: 'wash-state', label: '세척 상태', required: true, options: ['양호', '불량'] },
  { id: 'sanitize-state', label: '소독 상태', required: false, options: ['양호', '불량'] },
  { id: 'tool-clean', label: '기구·용기 청결 상태', required: false, options: ['양호', '불량'] },
]
