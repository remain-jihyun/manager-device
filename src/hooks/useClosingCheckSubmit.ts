import { useCallback, useEffect, useState } from 'react'
import type { ClosingCheckRecord } from '@/types/closingCheck'
import { MesApiError, submitClosingCheck } from '@/api/mes'
import { clearDraft } from './useClosingCheckDraft'

// 현장 점검 마감 제출
//
// 이전에는 백엔드에 없는 상대경로 `/api/closing-check` 로 보내 항상 실패했고,
// 실패분이 오프라인 큐에만 쌓여 기록이 MES 에 도달하지 않았다(QA C-03).
// 지금은 mes-v2 의 POST /api/closing-check 로 보내고, 네트워크가 끊겼을 때만
// 큐에 쌓았다가 연결이 돌아오면 자동으로 재전송한다.

const QUEUE_KEY = 'closing_check_queue'

type QueuedRecord = ClosingCheckRecord & { clientRequestId: string }

function readQueue(): QueuedRecord[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY)
    return raw ? (JSON.parse(raw) as QueuedRecord[]) : []
  } catch {
    return []
  }
}

function writeQueue(queue: QueuedRecord[]): void {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
}

function toPayload(record: QueuedRecord) {
  return {
    sectionId: record.sectionId,
    date: record.date,
    qrData: record.qrData ?? null,
    photosByPhase: record.photosByPhase,
    answers: record.answers,
    notesByPhase: record.notesByPhase,
    submittedAt: record.submittedAt ?? new Date().toISOString(),
    clientRequestId: record.clientRequestId,
  }
}

/** 큐에 남은 제출을 재전송한다. 서버가 거절한 건은 큐에서 빼 무한 재시도를 막는다. */
export async function flushClosingCheckQueue(): Promise<{ sent: number; dropped: number }> {
  let queue = readQueue()
  let sent = 0
  let dropped = 0

  while (queue.length > 0) {
    const record = queue[0]
    try {
      await submitClosingCheck(toPayload(record))
      sent += 1
      queue = queue.slice(1)
      writeQueue(queue)
    } catch (err) {
      if (err instanceof MesApiError) {
        dropped += 1
        queue = queue.slice(1)
        writeQueue(queue)
        continue
      }
      break // 네트워크 문제 — 다음 기회에 다시 시도
    }
  }
  return { sent, dropped }
}

export function useClosingCheckSubmit() {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingCount, setPendingCount] = useState(() => readQueue().length)

  // 연결이 돌아오면 밀린 제출을 자동으로 올린다.
  useEffect(() => {
    const sync = () => {
      void flushClosingCheckQueue().then(({ sent, dropped }) => {
        setPendingCount(readQueue().length)
        if (dropped > 0) setError(`서버가 거절한 점검 기록이 ${dropped}건 있습니다.`)
        else if (sent > 0) setError(null)
      })
    }
    window.addEventListener('online', sync)
    if (navigator.onLine) sync()
    return () => window.removeEventListener('online', sync)
  }, [])

  const submit = useCallback(
    async (record: ClosingCheckRecord, onSuccess: () => void): Promise<void> => {
      setSubmitting(true)
      setError(null)

      const queued: QueuedRecord = {
        ...record,
        submittedAt: new Date().toISOString(),
        clientRequestId: `CC-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      }

      if (!navigator.onLine) {
        writeQueue([...readQueue(), queued])
        setPendingCount(readQueue().length)
        clearDraft(record.sectionId)
        setError('오프라인 상태입니다. 연결되면 자동으로 전송됩니다.')
        setSubmitting(false)
        onSuccess()
        return
      }

      try {
        await submitClosingCheck(toPayload(queued))
        clearDraft(record.sectionId)
        onSuccess()
      } catch (err) {
        if (err instanceof MesApiError) {
          // 서버가 내용을 거절한 것 — 큐에 넣어도 통과하지 못하므로 화면에 남긴다.
          setError(err.message)
          return
        }
        // 네트워크 오류만 큐에 보관한다.
        writeQueue([...readQueue(), queued])
        setPendingCount(readQueue().length)
        clearDraft(record.sectionId)
        setError('전송하지 못해 임시 저장했습니다. 연결되면 자동으로 전송됩니다.')
        onSuccess()
      } finally {
        setSubmitting(false)
      }
    },
    [],
  )

  return { submit, submitting, error, pendingCount }
}
