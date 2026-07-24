// 불합격 처리 구분 및 사유 유형
// 출처: MES 유형 관리 (추후 연동)
//
// 불합격 → "재조리" 또는 "폐기"로 처리 구분하고, 각 구분별 사유 유형을 선택한다.
// - 재조리/폐기 공통 사유: 맛 / 조리불량 / 품질불량 / 기타
// - 조리불량 세부 예시는 처리 구분에 따라 다름 (재조리: 불충분조리 / 폐기: 과조리)
// - "기타"는 상세 서술 필수

export type Disposition = '재조리' | '폐기'

export interface RejectReasonType {
  type: string // 사유 유형명 (맛/조리불량/품질불량/기타)
  desc: string // 세부 예시 설명
  requireText?: boolean // 상세 서술 필수 여부 (기타)
}

export interface DispositionGroup {
  key: Disposition
  label: string
  reasons: RejectReasonType[]
}

export const REJECT_DISPOSITIONS: DispositionGroup[] = [
  {
    key: '재조리',
    label: '재조리',
    reasons: [
      { type: '맛', desc: '염도, 당도, 산도 등' },
      { type: '조리불량', desc: '불충분조리, 탄화물 등' },
      { type: '품질불량', desc: '원재료 이슈, HACCP 기준 미달 등' },
      { type: '기타', desc: '서술', requireText: true },
    ],
  },
  {
    key: '폐기',
    label: '폐기',
    reasons: [
      { type: '맛', desc: '염도, 당도, 산도 등' },
      { type: '조리불량', desc: '과조리, 탄화물 등' },
      { type: '품질불량', desc: '원재료 이슈, HACCP 기준 미달 등' },
      { type: '기타', desc: '서술', requireText: true },
    ],
  },
]
