// 창고 · 재고실사 데이터
// ─────────────────────────────────────────────────────────────────────────────
// 출처: mes-v2 (frontend-next)
//   - 창고 목록 : src/mocks/type-management.ts 의 mockSpaces 중 spaceType === "WAREHOUSE" (13개)
//   - 품목 연결 : src/lib/mock-data.ts 의 mockWarehouseInspection (총 16개 품목)
//
// 현장 디바이스(매니저 단말)의 실사 결과가 MES 재고실사 화면에 "누적"되는 구조이므로,
// 두 시스템이 동일한 데이터 계약을 사용한다.
//   · 실사 입력 키       : `${warehouseId}__${itemCode}`   (mes-v2 page.tsx 와 동일)
//   · 1차/2차 회차 구분   : round1 / round2
//   · 누적 저장소(localStorage) : MES_AUDIT_KEY 참조
// ─────────────────────────────────────────────────────────────────────────────

export interface InspectionItem {
  code: string
  name: string
  unit: string // 기존 base 단위 (호환 유지)
  bookQty: number // 어제(장부) 재고
  // ── 미팅 반영 보강 필드 (모두 선택값, 기존 데이터와 호환) ──
  itemUnit?: string // 품목(계수) 단위 (예: 'EA'). 없으면 unit 사용
  volume?: number // 용량 (예: 1.8) — 품목 단위와 구분
  volumeUnit?: string // 용량 단위 (예: 'L')
  boxQty?: number // 박스당 낱개 수 (고정값/MIS). 변동 품목은 미설정
  isVariable?: boolean // 변동 품목 (박스당 수량 없음 → 박스칸 숨김)
  seasonEnded?: boolean // 시즌 종료 원재료 (이카운트/eMIS 기준)
  price?: number // 단가(원) — 확정값 vs 예상 금액 차이 계산용
}

// 작업자 목록 (1차/2차 태깅용 — 얼굴 아바타는 이니셜 placeholder)
export const WORKERS = ['김영자', '박순희', '이정호', '최민수'] as const
export const workerInitial = (name: string) => name.slice(0, 1)

// 품목(계수) 단위: itemUnit 우선, 없으면 base unit
export const itemUnitOf = (i: InspectionItem) => i.itemUnit ?? i.unit

// 단가(원): price 우선, 없으면 코드 해시로 결정적 산출 (금액 차이 데모용)
export function unitPrice(i: InspectionItem): number {
  if (i.price !== undefined) return i.price
  let h = 0
  for (let k = 0; k < i.code.length; k++) h = (Math.imul(31, h) + i.code.charCodeAt(k)) | 0
  return 1000 + (Math.abs(h) % 90) * 100 // 1,000 ~ 9,900원
}

export interface Warehouse {
  id: string
  name: string
  temperatureName: string | null
  floor: string
  items: InspectionItem[]
}

// mes-v2 의 13개 창고 + 연결 품목 (누락 없이 전부 반영)
// 기존 품목(RM-001~RM-020)은 mes-v2 와 동일하게 유지하고, 창고별 10개가 되도록
// 창고 성격·온도대에 맞는 품목(RM-021~RM-134)을 보강했다.
export const WAREHOUSES: Warehouse[] = [
  {
    id: 'SPC-B01', name: '포장재 창고', temperatureName: '상온', floor: '지하1층',
    items: [
      { code: 'RM-019', name: '포장재(소)', unit: '개', bookQty: 500 },
      { code: 'RM-021', name: '포장재(대)', unit: '개', bookQty: 300 },
      { code: 'RM-022', name: '진공팩', unit: '롤', bookQty: 120 },
      { code: 'RM-023', name: '라벨지', unit: '롤', bookQty: 200 },
      { code: 'RM-024', name: '박스(소)', unit: '개', bookQty: 150, itemUnit: 'EA', boxQty: 50, price: 800 },
      { code: 'RM-025', name: '박스(대)', unit: '개', bookQty: 90, itemUnit: 'EA', boxQty: 25, price: 1500 },
      { code: 'RM-026', name: '포장테이프', unit: '개', bookQty: 80 },
      { code: 'RM-027', name: '아이스팩', unit: '개', bookQty: 600 },
      { code: 'RM-028', name: '실링필름', unit: '롤', bookQty: 60 },
      { code: 'RM-029', name: '완충재', unit: '개', bookQty: 400 },
    ],
  },
  {
    id: 'SPC-101', name: '상온 창고 1', temperatureName: '상온', floor: '1층',
    items: [
      { code: 'RM-010', name: '간장', unit: 'L', bookQty: 80, itemUnit: 'EA', volume: 1.8, volumeUnit: 'L', boxQty: 6, price: 3500 },
      { code: 'RM-011', name: '설탕', unit: 'kg', bookQty: 50, boxQty: 20, price: 1200 },
      { code: 'RM-012', name: '식용유', unit: 'L', bookQty: 60, itemUnit: 'EA', volume: 18, volumeUnit: 'L', boxQty: 1, price: 42000 },
      { code: 'RM-030', name: '소금', unit: 'kg', bookQty: 70 },
      { code: 'RM-031', name: '식초', unit: 'L', bookQty: 40 },
      { code: 'RM-032', name: '미림', unit: 'L', bookQty: 35 },
      { code: 'RM-033', name: '물엿', unit: 'kg', bookQty: 45 },
      { code: 'RM-034', name: '고춧가루', unit: 'kg', bookQty: 30 },
      { code: 'RM-035', name: '후추', unit: 'kg', bookQty: 12 },
      { code: 'RM-036', name: '참기름', unit: 'L', bookQty: 25 },
    ],
  },
  {
    id: 'SPC-102', name: '상온 창고 2', temperatureName: '상온', floor: '1층',
    items: [
      { code: 'RM-004', name: '콩', unit: 'kg', bookQty: 200 },
      { code: 'RM-005', name: '양파', unit: 'kg', bookQty: 120 },
      { code: 'RM-037', name: '감자', unit: 'kg', bookQty: 150 },
      { code: 'RM-038', name: '당근', unit: 'kg', bookQty: 90 },
      { code: 'RM-039', name: '마늘', unit: 'kg', bookQty: 60 },
      { code: 'RM-040', name: '대파', unit: 'kg', bookQty: 70 },
      { code: 'RM-041', name: '무', unit: 'kg', bookQty: 110 },
      { code: 'RM-042', name: '고구마', unit: 'kg', bookQty: 80 },
      { code: 'RM-043', name: '양배추', unit: 'kg', bookQty: 65 },
      { code: 'RM-044', name: '생강', unit: 'kg', bookQty: 20 },
    ],
  },
  {
    id: 'SPC-103', name: '냉장고 1', temperatureName: '냉장', floor: '1층',
    items: [
      { code: 'RM-001', name: '닭고기', unit: 'kg', bookQty: 150, isVariable: true, price: 6000 },
      { code: 'RM-002', name: '돼지고기', unit: 'kg', bookQty: 80, isVariable: true, price: 9000 },
      { code: 'RM-013', name: '소고기', unit: 'kg', bookQty: 30, isVariable: true, price: 38000 },
      { code: 'RM-045', name: '계란', unit: '판', bookQty: 100 },
      { code: 'RM-046', name: '우유', unit: 'L', bookQty: 60 },
      { code: 'RM-047', name: '베이컨', unit: 'kg', bookQty: 25 },
      { code: 'RM-048', name: '햄', unit: 'kg', bookQty: 35 },
      { code: 'RM-049', name: '소시지', unit: 'kg', bookQty: 40 },
      { code: 'RM-050', name: '닭가슴살', unit: 'kg', bookQty: 55 },
      { code: 'RM-051', name: '오리고기', unit: 'kg', bookQty: 28 },
    ],
  },
  {
    id: 'SPC-104', name: '냉장고 2 (해동)', temperatureName: '냉장(해동)', floor: '1층',
    items: [
      { code: 'RM-003', name: '시금치', unit: 'kg', bookQty: 30, isVariable: true, seasonEnded: true, price: 5000 },
      { code: 'RM-017', name: '두부', unit: 'kg', bookQty: 15 },
      { code: 'RM-052', name: '콩나물', unit: 'kg', bookQty: 40 },
      { code: 'RM-053', name: '숙주', unit: 'kg', bookQty: 35 },
      { code: 'RM-054', name: '부추', unit: 'kg', bookQty: 20 },
      { code: 'RM-055', name: '깻잎', unit: 'kg', bookQty: 12, isVariable: true, seasonEnded: true, price: 8000 },
      { code: 'RM-056', name: '청경채', unit: 'kg', bookQty: 18 },
      { code: 'RM-057', name: '미나리', unit: 'kg', bookQty: 15 },
      { code: 'RM-058', name: '얼갈이', unit: 'kg', bookQty: 22 },
      { code: 'RM-059', name: '상추', unit: 'kg', bookQty: 16 },
    ],
  },
  {
    id: 'SPC-105', name: '냉동고', temperatureName: '냉동', floor: '1층',
    items: [
      { code: 'RM-014', name: '냉동오징어', unit: 'kg', bookQty: 40 },
      { code: 'RM-015', name: '냉동새우', unit: 'kg', bookQty: 25 },
      { code: 'RM-060', name: '냉동고등어', unit: 'kg', bookQty: 50 },
      { code: 'RM-061', name: '냉동갈치', unit: 'kg', bookQty: 30 },
      { code: 'RM-062', name: '냉동조개', unit: 'kg', bookQty: 35 },
      { code: 'RM-063', name: '냉동문어', unit: 'kg', bookQty: 20 },
      { code: 'RM-064', name: '냉동꽃게', unit: 'kg', bookQty: 28 },
      { code: 'RM-065', name: '냉동홍합', unit: 'kg', bookQty: 45 },
      { code: 'RM-066', name: '냉동주꾸미', unit: 'kg', bookQty: 22 },
      { code: 'RM-067', name: '냉동명태', unit: 'kg', bookQty: 60 },
    ],
  },
  {
    id: 'SPC-106', name: '냉동창고', temperatureName: null, floor: '1층',
    items: [
      { code: 'RM-016', name: '냉동만두피', unit: 'kg', bookQty: 20 },
      { code: 'RM-068', name: '냉동만두', unit: 'kg', bookQty: 50 },
      { code: 'RM-069', name: '냉동돈까스', unit: 'kg', bookQty: 40 },
      { code: 'RM-070', name: '냉동치킨', unit: 'kg', bookQty: 35 },
      { code: 'RM-071', name: '냉동피자', unit: '개', bookQty: 80 },
      { code: 'RM-072', name: '냉동떡', unit: 'kg', bookQty: 60 },
      { code: 'RM-073', name: '냉동핫도그', unit: '개', bookQty: 120 },
      { code: 'RM-074', name: '냉동너겟', unit: 'kg', bookQty: 30 },
      { code: 'RM-075', name: '냉동춘권', unit: 'kg', bookQty: 25 },
      { code: 'RM-076', name: '냉동군만두', unit: 'kg', bookQty: 45 },
    ],
  },
  {
    id: 'SPC-107', name: '부재료', temperatureName: '냉동', floor: '1층',
    items: [
      { code: 'RM-077', name: '분말스프', unit: 'kg', bookQty: 20 },
      { code: 'RM-078', name: '조미료', unit: 'kg', bookQty: 15 },
      { code: 'RM-079', name: '다시다', unit: 'kg', bookQty: 25 },
      { code: 'RM-080', name: '미원', unit: 'kg', bookQty: 18 },
      { code: 'RM-081', name: '치킨스톡', unit: 'kg', bookQty: 12 },
      { code: 'RM-082', name: '카레분말', unit: 'kg', bookQty: 22 },
      { code: 'RM-083', name: '전분', unit: 'kg', bookQty: 40 },
      { code: 'RM-084', name: '빵가루', unit: 'kg', bookQty: 35 },
      { code: 'RM-085', name: '튀김가루', unit: 'kg', bookQty: 30 },
      { code: 'RM-086', name: '부침가루', unit: 'kg', bookQty: 28 },
    ],
  },
  {
    id: 'SPC-108', name: '제품/냉동', temperatureName: '냉장', floor: '1층',
    items: [
      { code: 'RM-018', name: '냉동채소믹스', unit: 'kg', bookQty: 35 },
      { code: 'RM-087', name: '완제품-닭갈비', unit: '팩', bookQty: 200 },
      { code: 'RM-088', name: '완제품-제육볶음', unit: '팩', bookQty: 180 },
      { code: 'RM-089', name: '완제품-불고기', unit: '팩', bookQty: 150 },
      { code: 'RM-090', name: '완제품-갈비탕', unit: '팩', bookQty: 120 },
      { code: 'RM-091', name: '완제품-된장찌개', unit: '팩', bookQty: 220 },
      { code: 'RM-092', name: '완제품-김치찌개', unit: '팩', bookQty: 210 },
      { code: 'RM-093', name: '완제품-순두부', unit: '팩', bookQty: 160 },
      { code: 'RM-094', name: '완제품-미역국', unit: '팩', bookQty: 140 },
      { code: 'RM-095', name: '완제품-잡채', unit: '팩', bookQty: 130 },
    ],
  },
  {
    id: 'SPC-206', name: '조리실-상온창고', temperatureName: null, floor: '2층',
    items: [
      { code: 'RM-020', name: '냉동감자', unit: 'kg', bookQty: 45 },
      { code: 'RM-096', name: '밀가루', unit: 'kg', bookQty: 80 },
      { code: 'RM-097', name: '쌀', unit: 'kg', bookQty: 200 },
      { code: 'RM-098', name: '찹쌀', unit: 'kg', bookQty: 60 },
      { code: 'RM-099', name: '라면사리', unit: '개', bookQty: 300 },
      { code: 'RM-100', name: '당면', unit: 'kg', bookQty: 40 },
      { code: 'RM-101', name: '국수', unit: 'kg', bookQty: 50 },
      { code: 'RM-102', name: '누룽지', unit: 'kg', bookQty: 25 },
      { code: 'RM-103', name: '카레', unit: 'kg', bookQty: 20 },
      { code: 'RM-104', name: '미숫가루', unit: 'kg', bookQty: 18 },
    ],
  },
  {
    id: 'SPC-210', name: '내포장-냉장창고', temperatureName: '냉장', floor: '2층',
    items: [
      { code: 'RM-105', name: '포장두부', unit: '팩', bookQty: 120 },
      { code: 'RM-106', name: '포장나물', unit: '팩', bookQty: 90 },
      { code: 'RM-107', name: '포장김치', unit: '팩', bookQty: 150 },
      { code: 'RM-108', name: '포장묵', unit: '팩', bookQty: 70 },
      { code: 'RM-109', name: '포장어묵', unit: '팩', bookQty: 110 },
      { code: 'RM-110', name: '포장햄', unit: '팩', bookQty: 80 },
      { code: 'RM-111', name: '포장소시지', unit: '팩', bookQty: 85 },
      { code: 'RM-112', name: '포장단무지', unit: '팩', bookQty: 60 },
      { code: 'RM-113', name: '포장맛살', unit: '팩', bookQty: 95 },
      { code: 'RM-114', name: '포장유부', unit: '팩', bookQty: 50 },
    ],
  },
  {
    id: 'SPC-304', name: '국탕류 냉동실', temperatureName: '냉동', floor: '3층',
    items: [
      { code: 'RM-115', name: '냉동사골육수', unit: 'L', bookQty: 100 },
      { code: 'RM-116', name: '냉동멸치육수', unit: 'L', bookQty: 80 },
      { code: 'RM-117', name: '냉동디포리육수', unit: 'L', bookQty: 60 },
      { code: 'RM-118', name: '냉동곰탕', unit: 'L', bookQty: 90 },
      { code: 'RM-119', name: '냉동설렁탕', unit: 'L', bookQty: 85 },
      { code: 'RM-120', name: '냉동갈비탕', unit: 'L', bookQty: 70 },
      { code: 'RM-121', name: '냉동육개장', unit: 'L', bookQty: 75 },
      { code: 'RM-122', name: '냉동순대국', unit: 'L', bookQty: 55 },
      { code: 'RM-123', name: '냉동해장국', unit: 'L', bookQty: 65 },
      { code: 'RM-124', name: '냉동떡국육수', unit: 'L', bookQty: 95 },
    ],
  },
  {
    id: 'SPC-305', name: '상온창고', temperatureName: '상온', floor: '3층',
    items: [
      { code: 'RM-125', name: '캔참치', unit: '캔', bookQty: 200, itemUnit: 'EA', boxQty: 24, price: 1500 },
      { code: 'RM-126', name: '캔옥수수', unit: '캔', bookQty: 150, itemUnit: 'EA', boxQty: 24, price: 1300 },
      { code: 'RM-127', name: '캔골뱅이', unit: '캔', bookQty: 80 },
      { code: 'RM-128', name: '김', unit: '봉', bookQty: 300 },
      { code: 'RM-129', name: '미역', unit: 'kg', bookQty: 40 },
      { code: 'RM-130', name: '다시마', unit: 'kg', bookQty: 35 },
      { code: 'RM-131', name: '건표고', unit: 'kg', bookQty: 20, seasonEnded: true, price: 22000 },
      { code: 'RM-132', name: '건고추', unit: 'kg', bookQty: 25 },
      { code: 'RM-133', name: '깨', unit: 'kg', bookQty: 30 },
      { code: 'RM-134', name: '멸치', unit: 'kg', bookQty: 45 },
    ],
  },
]

// 온도대 배지 색상 (mes-v2 TEMP_COLOR 와 동일 의미)
export const TEMP_BADGE: Record<string, string> = {
  냉동: 'bg-blue-100 text-blue-700',
  냉장: 'bg-cyan-100 text-cyan-700',
  '냉장(해동)': 'bg-cyan-100 text-cyan-700',
  상온: 'bg-orange-100 text-orange-700',
}

// 실사 입력 키 (mes-v2 page.tsx 와 동일 규칙)
export const auditKey = (warehouseId: string, code: string) => `${warehouseId}__${code}`

// ── 현장 디바이스: 입고/불출 합성 (mes-v2 inspection/page.tsx 의 devFlow 와 동일) ──
// 동일 알고리즘을 사용하여 양 시스템의 "예상 재고"가 일치하도록 한다.
export function devFlow(code: string): { inbound: number; outflow: number } {
  let h = 0
  for (let i = 0; i < code.length; i++) h = (Math.imul(31, h) + code.charCodeAt(i)) | 0
  h = Math.abs(h)
  return { inbound: h % 3 === 0 ? h % 18 : 0, outflow: h % 4 === 0 ? h % 12 : 0 }
}

export const expectedQty = (item: InspectionItem) => {
  const { inbound, outflow } = devFlow(item.code)
  return item.bookQty + inbound - outflow
}
