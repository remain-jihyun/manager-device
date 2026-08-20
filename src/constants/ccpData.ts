// CCP/CP 유형별 점검 항목
//
// ⚠ 이 파일은 **mes-v2 "CCP 설정"(/system/ccp)의 미러**다. 항목을 여기서 새로 정의하지 않는다.
//   원본: mes-v2 `frontend-next/src/lib/ccp-settings-store.ts` 의 SEED_TYPES
//   관리 화면: mes-v2 `/system/ccp` → 유형을 추가/수정하면 그 유형의 점검 항목까지 함께 설정
//   항목을 바꿔야 하면 mes-v2 를 먼저 고치고 이 파일을 맞춘다. (반대 방향 금지)
//   API 연동 전까지의 임시 미러이며, 연동되면 이 상수는 사라진다.
//
// 이것은 "온도 점검"이 아니라 현장 일지 성격의 "CCP 점검"(가열/소독/세척 등)이다.

export interface CCPCheckItem {
  id: string
  label: string // 점검 항목명
  required: boolean // 필수값 여부 (true면 미입력 시 점검 완료 불가)
  unit?: string // 숫자 입력 단위 (℃, 분, ppm 등)
  options?: string[] // 선택형 보기 (예: 양호/불량)
  placeholder?: string // 입력 가이드
}

const num = (
  id: string,
  label: string,
  required: boolean,
  unit?: string,
  placeholder?: string,
): CCPCheckItem => ({
  id,
  label,
  required,
  ...(unit ? { unit } : {}),
  ...(placeholder ? { placeholder } : {}),
})
const sel = (id: string, label: string, required: boolean, options: string[]): CCPCheckItem => ({
  id,
  label,
  required,
  options,
})

/** 유형명(ccpStore 의 schedule.label) → 그 유형의 점검 항목 */
export const CCP_ITEMS_BY_TYPE: Record<string, CCPCheckItem[]> = {
  소독헹굼: [
    num('sanitizer-conc', '소독액 농도', true, 'ppm', '예: 100'),
    sel('rinse-state', '헹굼 상태', true, ['양호', '불량']),
  ],
  가열: [
    num('heat-temp', '가열 온도 도달', true, '℃', '예: 78'),
    num('heat-time', '가열 시간 도달', true, '분', '예: 2'),
    num('core-temp', '중심 온도', false, '℃', '예: 75'),
  ],
  금속검출: [
    sel('detector-run', '검출기 작동', true, ['정상', '불량']),
    sel('sensitivity', '감도 확인', true, ['양호', '불량']),
  ],
  산가: [
    num('av-value', '산가 측정값', true, 'AV', '예: 2.0'),
    sel('av-judge', '판정', true, ['적합', '부적합']),
  ],
  '소스 당도염도': [
    num('brix', '당도', true, 'Brix', '예: 12'),
    num('salinity', '염도', true, '%', '예: 1.2'),
  ],
  해동공정관리: [
    sel('thaw-method', '해동 방법', true, ['냉장', '유수']),
    num('thaw-temp', '품온', true, '℃', '예: 4'),
  ],
  김치숙성: [
    num('ferment-temp', '숙성 온도', true, '℃', '예: 8'),
    num('ferment-ph', 'pH', false, undefined, '예: 4.5'),
  ],
  냉각관리: [
    num('cool-start', '냉각 시작온도', true, '℃', '예: 80'),
    num('cool-end', '냉각 종료온도', true, '℃', '예: 10'),
    num('cool-time', '냉각 시간', false, '분', '예: 90'),
  ],
  입고검수: [
    num('in-temp', '원료 품온', true, '℃', '예: 4'),
    sel('in-appearance', '외관 상태', true, ['양호', '불량']),
    sel('in-expiry', '유통기한 확인', true, ['적합', '부적합']),
  ],
  식용유산가: [
    num('oil-av', '산가 측정값', true, 'AV', '예: 2.0'),
    sel('oil-judge', '판정', true, ['적합', '부적합']),
  ],
  유통온도및상태관리: [
    num('dist-temp', '유통 온도', true, '℃', '예: 4'),
    sel('pack-state', '포장 상태', true, ['양호', '불량']),
  ],
}

/** mes-v2 에 아직 항목이 등록되지 않은 유형에 쓰는 기본 항목 */
export const CCP_FALLBACK_ITEMS: CCPCheckItem[] = [
  sel('result', '점검 결과', true, ['양호', '불량']),
]

/** 유형명으로 점검 항목을 가져온다. 미등록 유형은 기본 항목으로 대체한다. */
export function getCCPCheckItems(typeName: string): CCPCheckItem[] {
  return CCP_ITEMS_BY_TYPE[typeName] ?? CCP_FALLBACK_ITEMS
}
