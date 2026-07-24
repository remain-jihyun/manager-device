import { create } from 'zustand'

interface BadgeStore {
  counts: Record<string, number>
  setCount: (path: string, count: number) => void
}

export const useBadgeStore = create<BadgeStore>((set) => ({
  counts: {},
  setCount: (path, count) =>
    set((s) => ({ counts: { ...s.counts, [path]: count } })),
}))
