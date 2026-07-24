import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

interface TopBarProps {
  title: string
  showBack?: boolean
}

export default function TopBar({ title, showBack }: TopBarProps) {
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 bg-white z-40 border-b border-gray-100">
      <div className="flex items-center h-13 px-3 gap-2" style={{ height: '52px' }}>
        {showBack ? (
          <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-gray-800">
            <ChevronLeft size={24} strokeWidth={2} />
          </button>
        ) : (
          <div className="w-8" />
        )}
        <h1 className="flex-1 text-center text-[16px] font-bold text-gray-900">{title}</h1>
        <div className="w-8" />
      </div>
    </header>
  )
}
