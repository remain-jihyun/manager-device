interface NumberInputProps {
  value: number | null
  onChange: (v: number) => void
  unit?: string
}

export default function NumberInput({ value, onChange, unit }: NumberInputProps) {
  return (
    <div className="flex items-center gap-2 shrink-0">
      <input
        type="number"
        inputMode="numeric"
        value={value ?? ''}
        onChange={(e) => onChange(Number(e.target.value))}
        className="input-ds-sm w-20 px-3 py-2 text-center"
        placeholder="0"
      />
      {unit && <span className="text-sm text-gray-500 shrink-0">{unit}</span>}
    </div>
  )
}
