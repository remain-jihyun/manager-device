import BottomNav from '@/components/BottomNav'
import { useAndonPoller } from '@/hooks/useAndonPoller'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  // 안돈 발생 폴링 — 어느 화면에 있든 메뉴 배지가 갱신된다
  useAndonPoller()

  return (
    <div className="relative flex flex-col h-full bg-gray-50 overflow-hidden">
      <div className="flex-1 overflow-y-auto flex flex-col min-h-0">
        {children}
      </div>
      <BottomNav />
    </div>
  )
}
