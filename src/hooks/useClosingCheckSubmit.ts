import { useState } from 'react'
import type { ClosingCheckRecord } from '@/types/closingCheck'
import { clearDraft } from './useClosingCheckDraft'

const QUEUE_KEY = 'closing_check_queue'

function enqueueOffline(record: ClosingCheckRecord): void {
  try {
    const raw = localStorage.getItem(QUEUE_KEY)
    const queue: ClosingCheckRecord[] = raw ? JSON.parse(raw) : []
    queue.push(record)
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
  } catch {
    // ignore
  }
}

export function useClosingCheckSubmit() {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (
    record: ClosingCheckRecord,
    onSuccess: () => void,
  ): Promise<void> => {
    setSubmitting(true)
    setError(null)

    const payload = {
      sectionId: record.sectionId,
      date: record.date,
      qrData: record.qrData ?? null,
      photosByPhase: record.photosByPhase,
      answers: record.answers,
      notesByPhase: record.notesByPhase,
      submittedAt: new Date().toISOString(),
    }

    if (!navigator.onLine) {
      enqueueOffline({ ...record, submittedAt: payload.submittedAt })
      clearDraft(record.sectionId)
      setSubmitting(false)
      onSuccess()
      return
    }

    try {
      // API endpoint — replace with actual URL
      const res = await fetch('/api/closing-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(`서버 오류: ${res.status}`)
      clearDraft(record.sectionId)
      onSuccess()
    } catch (err) {
      // 실패 시 오프라인 큐에 저장
      enqueueOffline({ ...record, submittedAt: payload.submittedAt })
      clearDraft(record.sectionId)
      setError(err instanceof Error ? err.message : '제출 실패')
      onSuccess() // 큐에 저장했으므로 완료 화면으로 이동
    } finally {
      setSubmitting(false)
    }
  }

  return { submit, submitting, error }
}
