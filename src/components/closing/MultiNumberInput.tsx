interface MultiNumberInputProps {
  fields: string[]
  value: Record<string, number | null>
  onChange: (v: Record<string, number | null>) => void
}

export default function MultiNumberInput({ fields, value, onChange }: MultiNumberInputProps) {
  if (!fields || fields.length === 0) return null

  const handleChange = (field: string, num: number) => {
    onChange({ ...value, [field]: num })
  }

  return (
    <div className="flex flex-wrap gap-2 mt-1">
      {fields.map((field) => (
        <div key={field} className="flex items-center gap-1.5">
          <span className="text-xs text-gray-500 shrink-0">{field}</span>
          <input
            type="number"
            inputMode="numeric"
            value={value[field] ?? ''}
            onChange={(e) => handleChange(field, Number(e.target.value))}
            className="w-14 border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:border-green-800 bg-white"
            placeholder="0"
          />
        </div>
      ))}
    </div>
  )
}
