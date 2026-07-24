// MES 재고실사 누적 저장소
// ─────────────────────────────────────────────────────────────────────────────
// 현장 디바이스(매니저 단말)에서 확정한 1차/2차 실사값을 누적 저장한다.
// 이 데이터가 곧 mes-v2 재고실사 화면(round1Input / round2Input)으로 전송·누적되는
// "데이터 계약"이다. 키 규칙은 mes-v2 와 동일하게 `${warehouseId}__${itemCode}`.
//
// (현재는 백엔드 연동 대신 localStorage 에 동일 스키마로 적재한다. 동일 origin 의
//  MES 클라이언트는 이 저장소를 그대로 ingest 하여 회차별 실사값을 채울 수 있다.)
//
// [미팅 반영 확장]
//  · confirmed : 재고 "확정값" 보관 (일·주간 1회 확정 / 월말 1·2차 검토 후 확정)
//  · worker1/worker2 : 1차·2차 실사 작업자 태깅 (이름)
//  · recheck   : 예상 대비 큰 차이로 "재확인 필요" 태깅된 키
//  기존 필드(round1/round2)와 키 규칙은 그대로 유지한다.
// ─────────────────────────────────────────────────────────────────────────────

export const MES_AUDIT_KEY = 'mes-v2:inventory-audit'

export interface AuditStore {
  round1: Record<string, number> // key: `${warehouseId}__${code}`
  round2: Record<string, number>
  confirmed: Record<string, number> // 재고 확정값
  worker1: Record<string, string> // 1차 실사 작업자 이름
  worker2: Record<string, string> // 2차 실사 작업자 이름
  recheck: Record<string, boolean> // 재확인 필요 태깅
  updatedAt: string
}

const empty = (): AuditStore => ({
  round1: {},
  round2: {},
  confirmed: {},
  worker1: {},
  worker2: {},
  recheck: {},
  updatedAt: '',
})

export function loadAudit(): AuditStore {
  try {
    const raw = localStorage.getItem(MES_AUDIT_KEY)
    if (!raw) return empty()
    const parsed = JSON.parse(raw)
    return {
      round1: parsed.round1 ?? {},
      round2: parsed.round2 ?? {},
      confirmed: parsed.confirmed ?? {},
      worker1: parsed.worker1 ?? {},
      worker2: parsed.worker2 ?? {},
      recheck: parsed.recheck ?? {},
      updatedAt: parsed.updatedAt ?? '',
    }
  } catch {
    return empty()
  }
}

export function saveAudit(store: AuditStore) {
  try {
    localStorage.setItem(MES_AUDIT_KEY, JSON.stringify(store))
  } catch {
    /* 저장 실패는 무시 (시크릿 모드 등) */
  }
}
