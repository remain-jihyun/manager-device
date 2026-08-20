import { useEffect } from 'react'
import { useAndonStore } from '@/store/andonStore'
import { useBadgeStore } from '@/store/badgeStore'
import { ANDON_TYPE_TO_SLUG, type AndonTypeId } from '@/api/andon'
import { isOffice, useAuthStore } from '@/store/authStore'

const POLL_MS = 3000

/**
 * 안돈 이벤트를 주기적으로 폴링해 스토어와 메뉴 배지를 갱신한다.
 * AppLayout에서 한 번만 호출한다 (로그인 상태의 모든 화면에서 동작).
 *
 * 배지는 **지금 로그인한 사람이 처리해야 할 건수**다.
 *   반장     → 처리 대기가 없다. 이슈는 스스로 올리는 것이므로 배지를 띄우지 않는다
 *   사무관리자 → 확인을 기다리는 반장 이슈(REPORTED)
 */
export function useAndonPoller() {
  const refresh = useAndonStore((s) => s.refresh)
  const reportedCountByType = useAndonStore((s) => s.reportedCountByType)
  const setCount = useBadgeStore((s) => s.setCount)
  const office = useAuthStore((s) => isOffice(s.user?.role))

  useEffect(() => {
    refresh()
    const id = setInterval(refresh, POLL_MS)
    return () => clearInterval(id)
  }, [refresh])

  useEffect(() => {
    ;(Object.keys(ANDON_TYPE_TO_SLUG) as AndonTypeId[]).forEach((typeId) => {
      setCount(
        `/andon/${ANDON_TYPE_TO_SLUG[typeId]}`,
        office ? (reportedCountByType[typeId] ?? 0) : 0,
      )
    })
  }, [office, reportedCountByType, setCount])
}
