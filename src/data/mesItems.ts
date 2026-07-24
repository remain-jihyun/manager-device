// ─────────────────────────────────────────────────────────────────────────────
// MES(mes-v2) 품목 DB 중 "사용중"(isActive === 'Y') 상태만 반영한 폐기용 품목 목록
//
// 출처 (mes-v2/frontend-next):
//   - 원부재료(원재료 RAW_MATERIAL + 부재료 SUB_MATERIAL) : src/lib/mock-materials.ts
//   - 반제품(SEMI_FINISHED)                              : src/lib/mock-items.ts
//
// 규칙: isActive === 'N'(사용중단) 품목은 제외한다.
//   · 제외된 원부재료 : ZIP_M_9901 사골육수(구형), SUB_M_0099 구형 조미료(폐기)
//   · 반제품은 현재 전량 사용중
// ─────────────────────────────────────────────────────────────────────────────

export interface MesItem {
  code: string
  name: string
  barcode?: string
}

// 원부재료 = 원재료 + 부재료 (사용중)
export const ACTIVE_RAW_MATERIALS: MesItem[] = [
  // 원재료
  { code: 'ZIP_M_5228', name: '당면' },
  { code: 'ZIP_M_3014', name: '돼지고기' },
  { code: 'ZIP_M_3007', name: '한우소고기' },
  { code: 'ZIP_M_3027', name: '육전용소고기' },
  { code: 'ZIP_M_3060', name: '살균전란' },
  { code: 'ZIP_M_1063', name: '알감자' },
  { code: 'ZIP_M_1132', name: '부침두부' },
  { code: 'ZIP_M_1053', name: '깐양배추' },
  { code: 'ZIP_M_4021', name: '오이' },
  { code: 'ZIP_M_4022', name: '파채' },
  { code: 'ZIP_M_2011', name: '시금치' },
  { code: 'ZIP_M_2031', name: '감자' },
  { code: 'ZIP_M_2032', name: '두부' },
  { code: 'ZIP_M_2033', name: '양파' },
  { code: 'ZIP_M_2034', name: '계란' },
  // 부재료
  { code: 'SUB_M_0011', name: '간장' },
  { code: 'SUB_M_0012', name: '고추장' },
  { code: 'SUB_M_0013', name: '쌈장' },
  { code: 'SUB_M_0014', name: '참기름' },
  { code: 'SUB_M_0015', name: '올리고당' },
  { code: 'SUB_M_0016', name: '설탕' },
  { code: 'SUB_M_0017', name: '소금' },
  { code: 'SUB_M_0018', name: '다진마늘' },
  { code: 'SUB_M_0019', name: '생강' },
]

// 반제품 (사용중)
export const ACTIVE_SEMI_FINISHED: MesItem[] = [
  { code: 'SAN_3811', name: '깻잎,두부조림소스_집반찬연구소' },
  { code: 'SAN_8024', name: '품' },
  { code: 'SAN_8053', name: '시금치_데침' },
  { code: 'SAN_8055', name: '느타리버섯_데침' },
  { code: 'SAN_8062', name: '오이_절임/탈수' },
  { code: 'ZIP_H_0003', name: '맛간장_집반찬연구소' },
  { code: 'ZIP_H_1142', name: '당근_탈피/세척' },
  { code: 'ZIP_H_1143', name: '감자_탈피/세척' },
  { code: 'ZIP_H_1144', name: '양파_탈피/세척' },
  { code: 'ZIP_H_1145', name: '대파_탈피/세척' },
  { code: 'ZIP_H_1148', name: '브로콜리_손질' },
  { code: 'ZIP_H_1150', name: '애호박_탈피/세척' },
  { code: 'ZIP_H_1169', name: '닭가슴살_찢음' },
]
