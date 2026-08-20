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
      className="input-ds-sm shrink-0 px-3 py-2"
    />
  )
}
