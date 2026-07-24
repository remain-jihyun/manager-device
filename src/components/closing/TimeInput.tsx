interface TimeInputProps {
  value: string | null
  onChange: (v: string) => void
}

export default function TimeInput({ value, onChange }: TimeInputProps) {
  return (
    <input
      type="time"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      className="shrink-0 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-800 bg-white"
    />
  )
}
