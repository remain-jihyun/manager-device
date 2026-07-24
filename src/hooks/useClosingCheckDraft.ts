import { useEffect, useRef } from 'react'
import type { CheckAnswer } from '@/types/closingCheck'

const DRAFT_PREFIX = 'closing_check_draft_'

export function saveDraft(sectionId: string, answers: CheckAnswer[]): void {
  try {
    localStorage.setItem(`${DRAFT_PREFIX}${sectionId}`, JSON.stringify(answers))
  } catch {
    // ignore
  }
}

export function loadDraft(sectionId: string): CheckAnswer[] | null {
  try {
    const raw = localStorage.getItem(`${DRAFT_PREFIX}${sectionId}`)
    return raw ? (JSON.parse(raw) as CheckAnswer[]) : null
  } catch {
    return null
  }
}

export function clearDraft(sectionId: string): void {
  try {
    localStorage.removeItem(`${DRAFT_PREFIX}${sectionId}`)
  } catch {
    // ignore
  }
}

export function useAutoSaveDraft(sectionId: string, answers: CheckAnswer[]): void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!sectionId) return
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      saveDraft(sectionId, answers)
    }, 500)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [sectionId, answers])
}
