interface OXToggleProps {
  value: 'O' | 'X' | null
  onChange: (v: 'O' | 'X') => void
}

export default function OXToggle({ value, onChange }: OXToggleProps) {
  return (
    <div className="flex gap-1.5 shrink-0">
      <button
        onClick={() => onChange('O')}
        className={`min-w-[44px] h-[44px] px-3 rounded-xl text-sm font-bold border transition-colors ${
          value === 'O'
            ? 'bg-green-900 text-white border-green-900'
            : 'bg-white text-gray-400 border-gray-200'
        }`}
      >
        O
      </button>
      <button
        onClick={() => onChange('X')}
        className={`min-w-[44px] h-[44px] px-3 rounded-xl text-sm font-bold border transition-colors ${
          value === 'X'
            ? 'bg-red-500 text-white border-red-500'
            : 'bg-white text-gray-400 border-gray-200'
        }`}
      >
        X
      </button>
    </div>
  )
}
