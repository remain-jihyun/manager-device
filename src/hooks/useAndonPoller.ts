import { useEffect } from 'react'
import { useAndonStore } from '@/store/andonStore'
import { useBadgeStore } from '@/store/badgeStore'
import { ANDON_TYPE_TO_SLUG, type AndonTypeId } from '@/api/andon'

const POLL_MS = 3000

/**
 * 안돈 이벤트를 주기적으로 폴링해 스토어와 메뉴 배지를 갱신한다.
 * AppLayout에서 한 번만 호출한다 (로그인 상태의 모든 화면에서 동작).
 */
export function useAndonPoller() {
  const refresh = useAndonStore((s) => s.refresh)
  const openCountByType = useAndonStore((s) => s.openCountByType)
  const setCount = useBadgeStore((s) => s.setCount)

  useEffect(() => {
    refresh()
    const id = setInterval(refresh, POLL_MS)
    return () => clearInterval(id)
  }, [refresh])

  useEffect(() => {
    ;(Object.keys(ANDON_TYPE_TO_SLUG) as AndonTypeId[]).forEach((typeId) => {
      setCount(`/andon/${ANDON_TYPE_TO_SLUG[typeId]}`, openCountByType[typeId] ?? 0)
    })
  }, [openCountByType, setCount])
}
