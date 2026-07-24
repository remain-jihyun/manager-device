// HACCP 점검표 3종 — 원본 엑셀을 그대로 반영 (누락 금지).
//   A. 작업장 청소 점검표   HACCP-01-167 Rev.02  — 구역별 점검사항 22개
//   B. 작업장 도구 점검표   HACCP-01-149 Rev.05  — 도구 15 × 구역 6 = 90개
//   C. 부대시설 점검표      HACCP-01-137 Rev.03  — 대상·구분(13) / 세부점검항목 19개
// manager-device(현장점검) 와 mes-v2(항목 관리) 의 데이터가 1:1로 동일하다.

export type HaccpSheetKey = "cleaning" | "tools" | "facility";

export interface HaccpSheetMeta {
  key: HaccpSheetKey;
  title: string;
  code: string;
  method: string; // 모니터링 방법
  cycle: string;  // 점검 주기
  note: string;   // 방법/기준/시점 원문 요약
  axisLabels: string[]; // 관리 축 (구역 / 도구·구역 / 대상·구분·세부)
}

export interface HaccpCheckItem {
  id: string;
  sheet: HaccpSheetKey;
  no: number;       // 표 내 순서
  zone: string;     // 구역 / 대상
  tool?: string;    // 도구 (도구점검표)
  group?: string;   // 점검사항 구분 (부대시설)
  label: string;    // 점검사항 / 세부점검항목 (원본 문구·번호·괄호 그대로)
  method: string;   // 육안
  inputType: "ox";
}

export const HACCP_SHEETS: HaccpSheetMeta[] = [
  { key: "cleaning", title: "작업장 청소 점검표", code: "HACCP-01-167 Rev.02", method: "육안", cycle: "1회/일", note: "점검 시점: 청소 종료 시 모니터링 (내포장반: 실링 종료 시 / 외포장반: 익일 작업자 출근 시)", axisLabels: ["구역", "점검사항"] },
  { key: "tools", title: "작업장 도구 점검표", code: "HACCP-01-149 Rev.05", method: "육안", cycle: "1회/일 (오후 5시)", note: "청결 유지 / 플라스틱·실리콘 부서진 곳 없는지 / 볼펜·유성매직 뚜껑 분실 여부 확인", axisLabels: ["도구", "구역"] },
  { key: "facility", title: "부대시설 점검표", code: "HACCP-01-137 Rev.03", method: "육안", cycle: "1회/일", note: "대상별 점검사항(구분) 아래 세부점검항목", axisLabels: ["대상", "점검사항(구분)", "세부점검항목"] },
];

export const HACCP_ITEMS: HaccpCheckItem[] = [
  { id: "cleaning_1", sheet: "cleaning", no: 1, zone: "공통", label: "작업에 사용한 작업도구 세척 및 소독 보관 여부", method: "육안", inputType: "ox" },
  { id: "cleaning_2", sheet: "cleaning", no: 2, zone: "공통", label: "앞치마, 토시, 장화 등 세척 및 소독 후 건조∙보관 여부", method: "육안", inputType: "ox" },
  { id: "cleaning_3", sheet: "cleaning", no: 3, zone: "자재실", label: "작업장 청소 및 정리정돈", method: "육안", inputType: "ox" },
  { id: "cleaning_4", sheet: "cleaning", no: 4, zone: "자재실", label: "상온창고, 냉장,냉동고 내 소분스티커 올바른 부착 유무", method: "육안", inputType: "ox" },
  { id: "cleaning_5", sheet: "cleaning", no: 5, zone: "전처리실", label: "작업장 청소 및 정리정돈", method: "육안", inputType: "ox" },
  { id: "cleaning_6", sheet: "cleaning", no: 6, zone: "전처리실", label: "기계 및 시설설비의 청결상태\n- 국솥, 채고야, 파채기계, 감자탈피기, 야채다지기, 옹심이기계, 탈수기", method: "육안", inputType: "ox" },
  { id: "cleaning_7", sheet: "cleaning", no: 7, zone: "전처리실", label: "트랜치 청결상태", method: "육안", inputType: "ox" },
  { id: "cleaning_8", sheet: "cleaning", no: 8, zone: "전처리실", label: "MSDS 올바른 보관", method: "육안", inputType: "ox" },
  { id: "cleaning_9", sheet: "cleaning", no: 9, zone: "조리실", label: "작업장 청소 및 정리정돈", method: "육안", inputType: "ox" },
  { id: "cleaning_10", sheet: "cleaning", no: 10, zone: "조리실", label: "기계 및 시설설비의 청결상태\n- 반죽기, 화구, 전판, 오븐기, 튀김기, 국솥, 교반기, 후드", method: "육안", inputType: "ox" },
  { id: "cleaning_11", sheet: "cleaning", no: 11, zone: "조리실", label: "트랜치 청결상태", method: "육안", inputType: "ox" },
  { id: "cleaning_12", sheet: "cleaning", no: 12, zone: "조리실", label: "MSDS 올바른 보관", method: "육안", inputType: "ox" },
  { id: "cleaning_13", sheet: "cleaning", no: 13, zone: "내포장실", label: "작업장 청소 및 정리정돈", method: "육안", inputType: "ox" },
  { id: "cleaning_14", sheet: "cleaning", no: 14, zone: "내포장실", label: "기계 및 시설설비의 청결상태\n- 진공기, 실링기, 라벨기, 컨베이어", method: "육안", inputType: "ox" },
  { id: "cleaning_15", sheet: "cleaning", no: 15, zone: "내포장실", label: "트랜치 청결상태", method: "육안", inputType: "ox" },
  { id: "cleaning_16", sheet: "cleaning", no: 16, zone: "내포장실", label: "MSDS 올바른 보관", method: "육안", inputType: "ox" },
  { id: "cleaning_17", sheet: "cleaning", no: 17, zone: "소스·국탕류실", label: "작업장 청소 및 정리정돈", method: "육안", inputType: "ox" },
  { id: "cleaning_18", sheet: "cleaning", no: 18, zone: "소스·국탕류실", label: "기계 및 시설설비의 청결상태", method: "육안", inputType: "ox" },
  { id: "cleaning_19", sheet: "cleaning", no: 19, zone: "소스·국탕류실", label: "트랜치 청결상태", method: "육안", inputType: "ox" },
  { id: "cleaning_20", sheet: "cleaning", no: 20, zone: "소스·국탕류실", label: "MSDS 올바른 보관", method: "육안", inputType: "ox" },
  { id: "cleaning_21", sheet: "cleaning", no: 21, zone: "외포장실", label: "작업장 청소 및 정리정돈", method: "육안", inputType: "ox" },
  { id: "cleaning_22", sheet: "cleaning", no: 22, zone: "외포장실", label: "기계 및 시설설비의 청결상태", method: "육안", inputType: "ox" },
  { id: "tools_1", sheet: "tools", no: 1, zone: "전처리실", tool: "가위", label: "가위", method: "육안", inputType: "ox" },
  { id: "tools_2", sheet: "tools", no: 2, zone: "전처리실\n(수산/육류)", tool: "가위", label: "가위", method: "육안", inputType: "ox" },
  { id: "tools_3", sheet: "tools", no: 3, zone: "조리실", tool: "가위", label: "가위", method: "육안", inputType: "ox" },
  { id: "tools_4", sheet: "tools", no: 4, zone: "내포장실", tool: "가위", label: "가위", method: "육안", inputType: "ox" },
  { id: "tools_5", sheet: "tools", no: 5, zone: "소스실", tool: "가위", label: "가위", method: "육안", inputType: "ox" },
  { id: "tools_6", sheet: "tools", no: 6, zone: "국탕류실", tool: "가위", label: "가위", method: "육안", inputType: "ox" },
  { id: "tools_7", sheet: "tools", no: 7, zone: "전처리실", tool: "칼", label: "칼", method: "육안", inputType: "ox" },
  { id: "tools_8", sheet: "tools", no: 8, zone: "전처리실\n(수산/육류)", tool: "칼", label: "칼", method: "육안", inputType: "ox" },
  { id: "tools_9", sheet: "tools", no: 9, zone: "조리실", tool: "칼", label: "칼", method: "육안", inputType: "ox" },
  { id: "tools_10", sheet: "tools", no: 10, zone: "내포장실", tool: "칼", label: "칼", method: "육안", inputType: "ox" },
  { id: "tools_11", sheet: "tools", no: 11, zone: "소스실", tool: "칼", label: "칼", method: "육안", inputType: "ox" },
  { id: "tools_12", sheet: "tools", no: 12, zone: "국탕류실", tool: "칼", label: "칼", method: "육안", inputType: "ox" },
  { id: "tools_13", sheet: "tools", no: 13, zone: "전처리실", tool: "채칼", label: "채칼", method: "육안", inputType: "ox" },
  { id: "tools_14", sheet: "tools", no: 14, zone: "전처리실\n(수산/육류)", tool: "채칼", label: "채칼", method: "육안", inputType: "ox" },
  { id: "tools_15", sheet: "tools", no: 15, zone: "조리실", tool: "채칼", label: "채칼", method: "육안", inputType: "ox" },
  { id: "tools_16", sheet: "tools", no: 16, zone: "내포장실", tool: "채칼", label: "채칼", method: "육안", inputType: "ox" },
  { id: "tools_17", sheet: "tools", no: 17, zone: "소스실", tool: "채칼", label: "채칼", method: "육안", inputType: "ox" },
  { id: "tools_18", sheet: "tools", no: 18, zone: "국탕류실", tool: "채칼", label: "채칼", method: "육안", inputType: "ox" },
  { id: "tools_19", sheet: "tools", no: 19, zone: "전처리실", tool: "도마", label: "도마", method: "육안", inputType: "ox" },
  { id: "tools_20", sheet: "tools", no: 20, zone: "전처리실\n(수산/육류)", tool: "도마", label: "도마", method: "육안", inputType: "ox" },
  { id: "tools_21", sheet: "tools", no: 21, zone: "조리실", tool: "도마", label: "도마", method: "육안", inputType: "ox" },
  { id: "tools_22", sheet: "tools", no: 22, zone: "내포장실", tool: "도마", label: "도마", method: "육안", inputType: "ox" },
  { id: "tools_23", sheet: "tools", no: 23, zone: "소스실", tool: "도마", label: "도마", method: "육안", inputType: "ox" },
  { id: "tools_24", sheet: "tools", no: 24, zone: "국탕류실", tool: "도마", label: "도마", method: "육안", inputType: "ox" },
  { id: "tools_25", sheet: "tools", no: 25, zone: "전처리실", tool: "행주", label: "행주", method: "육안", inputType: "ox" },
  { id: "tools_26", sheet: "tools", no: 26, zone: "전처리실\n(수산/육류)", tool: "행주", label: "행주", method: "육안", inputType: "ox" },
  { id: "tools_27", sheet: "tools", no: 27, zone: "조리실", tool: "행주", label: "행주", method: "육안", inputType: "ox" },
  { id: "tools_28", sheet: "tools", no: 28, zone: "내포장실", tool: "행주", label: "행주", method: "육안", inputType: "ox" },
  { id: "tools_29", sheet: "tools", no: 29, zone: "소스실", tool: "행주", label: "행주", method: "육안", inputType: "ox" },
  { id: "tools_30", sheet: "tools", no: 30, zone: "국탕류실", tool: "행주", label: "행주", method: "육안", inputType: "ox" },
  { id: "tools_31", sheet: "tools", no: 31, zone: "전처리실", tool: "바트/쟁반", label: "바트/쟁반", method: "육안", inputType: "ox" },
  { id: "tools_32", sheet: "tools", no: 32, zone: "전처리실\n(수산/육류)", tool: "바트/쟁반", label: "바트/쟁반", method: "육안", inputType: "ox" },
  { id: "tools_33", sheet: "tools", no: 33, zone: "조리실", tool: "바트/쟁반", label: "바트/쟁반", method: "육안", inputType: "ox" },
  { id: "tools_34", sheet: "tools", no: 34, zone: "내포장실", tool: "바트/쟁반", label: "바트/쟁반", method: "육안", inputType: "ox" },
  { id: "tools_35", sheet: "tools", no: 35, zone: "소스실", tool: "바트/쟁반", label: "바트/쟁반", method: "육안", inputType: "ox" },
  { id: "tools_36", sheet: "tools", no: 36, zone: "국탕류실", tool: "바트/쟁반", label: "바트/쟁반", method: "육안", inputType: "ox" },
  { id: "tools_37", sheet: "tools", no: 37, zone: "전처리실", tool: "카트", label: "카트", method: "육안", inputType: "ox" },
  { id: "tools_38", sheet: "tools", no: 38, zone: "전처리실\n(수산/육류)", tool: "카트", label: "카트", method: "육안", inputType: "ox" },
  { id: "tools_39", sheet: "tools", no: 39, zone: "조리실", tool: "카트", label: "카트", method: "육안", inputType: "ox" },
  { id: "tools_40", sheet: "tools", no: 40, zone: "내포장실", tool: "카트", label: "카트", method: "육안", inputType: "ox" },
  { id: "tools_41", sheet: "tools", no: 41, zone: "소스실", tool: "카트", label: "카트", method: "육안", inputType: "ox" },
  { id: "tools_42", sheet: "tools", no: 42, zone: "국탕류실", tool: "카트", label: "카트", method: "육안", inputType: "ox" },
  { id: "tools_43", sheet: "tools", no: 43, zone: "전처리실", tool: "저울", label: "저울", method: "육안", inputType: "ox" },
  { id: "tools_44", sheet: "tools", no: 44, zone: "전처리실\n(수산/육류)", tool: "저울", label: "저울", method: "육안", inputType: "ox" },
  { id: "tools_45", sheet: "tools", no: 45, zone: "조리실", tool: "저울", label: "저울", method: "육안", inputType: "ox" },
  { id: "tools_46", sheet: "tools", no: 46, zone: "내포장실", tool: "저울", label: "저울", method: "육안", inputType: "ox" },
  { id: "tools_47", sheet: "tools", no: 47, zone: "소스실", tool: "저울", label: "저울", method: "육안", inputType: "ox" },
  { id: "tools_48", sheet: "tools", no: 48, zone: "국탕류실", tool: "저울", label: "저울", method: "육안", inputType: "ox" },
  { id: "tools_49", sheet: "tools", no: 49, zone: "전처리실", tool: "조리도구", label: "조리도구", method: "육안", inputType: "ox" },
  { id: "tools_50", sheet: "tools", no: 50, zone: "전처리실\n(수산/육류)", tool: "조리도구", label: "조리도구", method: "육안", inputType: "ox" },
  { id: "tools_51", sheet: "tools", no: 51, zone: "조리실", tool: "조리도구", label: "조리도구", method: "육안", inputType: "ox" },
  { id: "tools_52", sheet: "tools", no: 52, zone: "내포장실", tool: "조리도구", label: "조리도구", method: "육안", inputType: "ox" },
  { id: "tools_53", sheet: "tools", no: 53, zone: "소스실", tool: "조리도구", label: "조리도구", method: "육안", inputType: "ox" },
  { id: "tools_54", sheet: "tools", no: 54, zone: "국탕류실", tool: "조리도구", label: "조리도구", method: "육안", inputType: "ox" },
  { id: "tools_55", sheet: "tools", no: 55, zone: "전처리실", tool: "참치캔따개", label: "참치캔따개", method: "육안", inputType: "ox" },
  { id: "tools_56", sheet: "tools", no: 56, zone: "전처리실\n(수산/육류)", tool: "참치캔따개", label: "참치캔따개", method: "육안", inputType: "ox" },
  { id: "tools_57", sheet: "tools", no: 57, zone: "조리실", tool: "참치캔따개", label: "참치캔따개", method: "육안", inputType: "ox" },
  { id: "tools_58", sheet: "tools", no: 58, zone: "내포장실", tool: "참치캔따개", label: "참치캔따개", method: "육안", inputType: "ox" },
  { id: "tools_59", sheet: "tools", no: 59, zone: "소스실", tool: "참치캔따개", label: "참치캔따개", method: "육안", inputType: "ox" },
  { id: "tools_60", sheet: "tools", no: 60, zone: "국탕류실", tool: "참치캔따개", label: "참치캔따개", method: "육안", inputType: "ox" },
  { id: "tools_61", sheet: "tools", no: 61, zone: "전처리실", tool: "탈수포", label: "탈수포", method: "육안", inputType: "ox" },
  { id: "tools_62", sheet: "tools", no: 62, zone: "전처리실\n(수산/육류)", tool: "탈수포", label: "탈수포", method: "육안", inputType: "ox" },
  { id: "tools_63", sheet: "tools", no: 63, zone: "조리실", tool: "탈수포", label: "탈수포", method: "육안", inputType: "ox" },
  { id: "tools_64", sheet: "tools", no: 64, zone: "내포장실", tool: "탈수포", label: "탈수포", method: "육안", inputType: "ox" },
  { id: "tools_65", sheet: "tools", no: 65, zone: "소스실", tool: "탈수포", label: "탈수포", method: "육안", inputType: "ox" },
  { id: "tools_66", sheet: "tools", no: 66, zone: "국탕류실", tool: "탈수포", label: "탈수포", method: "육안", inputType: "ox" },
  { id: "tools_67", sheet: "tools", no: 67, zone: "전처리실", tool: "핸드타올디스펜서", label: "핸드타올디스펜서", method: "육안", inputType: "ox" },
  { id: "tools_68", sheet: "tools", no: 68, zone: "전처리실\n(수산/육류)", tool: "핸드타올디스펜서", label: "핸드타올디스펜서", method: "육안", inputType: "ox" },
  { id: "tools_69", sheet: "tools", no: 69, zone: "조리실", tool: "핸드타올디스펜서", label: "핸드타올디스펜서", method: "육안", inputType: "ox" },
  { id: "tools_70", sheet: "tools", no: 70, zone: "내포장실", tool: "핸드타올디스펜서", label: "핸드타올디스펜서", method: "육안", inputType: "ox" },
  { id: "tools_71", sheet: "tools", no: 71, zone: "소스실", tool: "핸드타올디스펜서", label: "핸드타올디스펜서", method: "육안", inputType: "ox" },
  { id: "tools_72", sheet: "tools", no: 72, zone: "국탕류실", tool: "핸드타올디스펜서", label: "핸드타올디스펜서", method: "육안", inputType: "ox" },
  { id: "tools_73", sheet: "tools", no: 73, zone: "전처리실", tool: "양념통", label: "양념통", method: "육안", inputType: "ox" },
  { id: "tools_74", sheet: "tools", no: 74, zone: "전처리실\n(수산/육류)", tool: "양념통", label: "양념통", method: "육안", inputType: "ox" },
  { id: "tools_75", sheet: "tools", no: 75, zone: "조리실", tool: "양념통", label: "양념통", method: "육안", inputType: "ox" },
  { id: "tools_76", sheet: "tools", no: 76, zone: "내포장실", tool: "양념통", label: "양념통", method: "육안", inputType: "ox" },
  { id: "tools_77", sheet: "tools", no: 77, zone: "소스실", tool: "양념통", label: "양념통", method: "육안", inputType: "ox" },
  { id: "tools_78", sheet: "tools", no: 78, zone: "국탕류실", tool: "양념통", label: "양념통", method: "육안", inputType: "ox" },
  { id: "tools_79", sheet: "tools", no: 79, zone: "전처리실", tool: "모니터링장비", label: "모니터링장비", method: "육안", inputType: "ox" },
  { id: "tools_80", sheet: "tools", no: 80, zone: "전처리실\n(수산/육류)", tool: "모니터링장비", label: "모니터링장비", method: "육안", inputType: "ox" },
  { id: "tools_81", sheet: "tools", no: 81, zone: "조리실", tool: "모니터링장비", label: "모니터링장비", method: "육안", inputType: "ox" },
  { id: "tools_82", sheet: "tools", no: 82, zone: "내포장실", tool: "모니터링장비", label: "모니터링장비", method: "육안", inputType: "ox" },
  { id: "tools_83", sheet: "tools", no: 83, zone: "소스실", tool: "모니터링장비", label: "모니터링장비", method: "육안", inputType: "ox" },
  { id: "tools_84", sheet: "tools", no: 84, zone: "국탕류실", tool: "모니터링장비", label: "모니터링장비", method: "육안", inputType: "ox" },
  { id: "tools_85", sheet: "tools", no: 85, zone: "전처리실", tool: "청소도구", label: "청소도구", method: "육안", inputType: "ox" },
  { id: "tools_86", sheet: "tools", no: 86, zone: "전처리실\n(수산/육류)", tool: "청소도구", label: "청소도구", method: "육안", inputType: "ox" },
  { id: "tools_87", sheet: "tools", no: 87, zone: "조리실", tool: "청소도구", label: "청소도구", method: "육안", inputType: "ox" },
  { id: "tools_88", sheet: "tools", no: 88, zone: "내포장실", tool: "청소도구", label: "청소도구", method: "육안", inputType: "ox" },
  { id: "tools_89", sheet: "tools", no: 89, zone: "소스실", tool: "청소도구", label: "청소도구", method: "육안", inputType: "ox" },
  { id: "tools_90", sheet: "tools", no: 90, zone: "국탕류실", tool: "청소도구", label: "청소도구", method: "육안", inputType: "ox" },
  { id: "facility_1", sheet: "facility", no: 1, zone: "위생전실", group: "청소 정리정돈", label: "1. 내부는 정리 정돈 되어 있으며, 바닥에 물기가 없이 청결하게 관리되고 있는가?", method: "육안", inputType: "ox" },
  { id: "facility_2", sheet: "facility", no: 2, zone: "위생전실", group: "손세정대", label: "1. 손세정대(세척+건조+소독)는 정상 작동되고 있으며, 청결하게 관리되고 있는가?", method: "육안", inputType: "ox" },
  { id: "facility_3", sheet: "facility", no: 3, zone: "위생전실", group: "손세정대", label: "2. 소모품(물비누, 알코올)은 항상 채워져 있는가?", method: "육안", inputType: "ox" },
  { id: "facility_4", sheet: "facility", no: 4, zone: "위생전실", group: "이물질 흡입기", label: "1. 이물질 흡입기는 정상 작동되고 있으며, 청결하게 관리되고 있는가?", method: "육안", inputType: "ox" },
  { id: "facility_5", sheet: "facility", no: 5, zone: "위생전실", group: "이물질 흡입기", label: "2. 먼지봉투는 주기적으로 교체되고 있는가?", method: "육안", inputType: "ox" },
  { id: "facility_6", sheet: "facility", no: 6, zone: "위생전실", group: "에어 샤워기", label: "1. 에어샤워기는 정상 작동되고 있으며, 내부 및 필터는 청결하게 관리되고 있는가?", method: "육안", inputType: "ox" },
  { id: "facility_7", sheet: "facility", no: 7, zone: "위생전실", group: "장화 세척대", label: "1. 장화세척대는 정상 작동되고 있으며, 청결하게 관리되고 있는가?", method: "육안", inputType: "ox" },
  { id: "facility_8", sheet: "facility", no: 8, zone: "위생전실", group: "장화 세척대", label: "2. 브러시에는 잔여 이물질이 없는가?", method: "육안", inputType: "ox" },
  { id: "facility_9", sheet: "facility", no: 9, zone: "위생전실", group: "장화 세척대", label: "3. 거름망은 깨끗한가?", method: "육안", inputType: "ox" },
  { id: "facility_10", sheet: "facility", no: 10, zone: "위생전실", group: "장화 소독기", label: "1. 위생화 및 장화소독기는 정상 작동되고 있으며, 청결하게 관리되고 있는가?", method: "육안", inputType: "ox" },
  { id: "facility_11", sheet: "facility", no: 11, zone: "탈의실", group: "청소 정리정돈", label: "1. 내부는 정리정돈 되어 있으며, 청소 상태는 양호한가?", method: "육안", inputType: "ox" },
  { id: "facility_12", sheet: "facility", no: 12, zone: "탈의실", group: "위생복", label: "1. 옷장은 위/아래 지정하여 위생복과 외출복이 구분관리 되고 있는가?", method: "육안", inputType: "ox" },
  { id: "facility_13", sheet: "facility", no: 13, zone: "탈의실", group: "취식", label: "1. 탈의실 내부에서 취식행위를 하지 않으며(간식 포함), 옷장 내부에 음식물 없이 관리되고 있는가?", method: "육안", inputType: "ox" },
  { id: "facility_14", sheet: "facility", no: 14, zone: "화장실", group: "청소 정리정돈", label: "1. 내부는 주기적으로 청소가 되고 있는가?", method: "육안", inputType: "ox" },
  { id: "facility_15", sheet: "facility", no: 15, zone: "화장실", group: "청소 정리정돈", label: "2. 소모품(물비누, 알코올)은 항상 채워져 있는가?", method: "육안", inputType: "ox" },
  { id: "facility_16", sheet: "facility", no: 16, zone: "화장실", group: "환기", label: "1. 환기시설은 정상 작동되고 있으며, 주기적으로 청소되고 있는가?", method: "육안", inputType: "ox" },
  { id: "facility_17", sheet: "facility", no: 17, zone: "복도", group: "청소 정리정돈", label: "1. 이동 시 방해가 되지 않도록 물품 등이 적치 되어 있지 않는가?", method: "육안", inputType: "ox" },
  { id: "facility_18", sheet: "facility", no: 18, zone: "복도", group: "청소 정리정돈", label: "2.바닥에 물기가 없이 청결하게 관리되고 있는가?", method: "육안", inputType: "ox" },
  { id: "facility_19", sheet: "facility", no: 19, zone: "복도", group: "조도", label: "1. 전등 점검 시  꺼진 등, 깜빡이는 등, 어두운 등이 없는가?", method: "육안", inputType: "ox" },
];
