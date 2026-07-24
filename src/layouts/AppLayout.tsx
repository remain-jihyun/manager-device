import BottomNav from '@/components/BottomNav'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex flex-col h-full bg-gray-50 overflow-hidden">
      <div className="flex-1 overflow-y-auto flex flex-col min-h-0">
        {children}
      </div>
      <BottomNav />
    </div>
  )
}
