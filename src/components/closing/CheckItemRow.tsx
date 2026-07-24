import { useState } from 'react'
import { MessageSquare } from 'lucide-react'
import type { CheckItem, CheckAnswer } from '@/types/closingCheck'
import OXToggle from './OXToggle'
import NumberInput from './NumberInput'
import TimeInput from './TimeInput'
import MultiNumberInput from './MultiNumberInput'
import PhotoInput from './PhotoInput'

interface CheckItemRowProps {
  item: CheckItem
  answer: CheckAnswer | undefined
  onAnswerChange: (a: CheckAnswer) => void
}

export default function CheckItemRow({ item, answer, onAnswerChange }: CheckItemRowProps) {
  const [showNote, setShowNote] = useState(false)

  const update = (value: CheckAnswer['value']) => {
    onAnswerChange({ itemId: item.id, value, note: answer?.note ?? '' })
  }

  const updateNote = (note: string) => {
    onAnswerChange({ itemId: item.id, value: answer?.value ?? null, note })
  }

  const renderInput = () => {
    switch (item.inputType) {
      case 'ox':
        return (
          <OXToggle
            value={(answer?.value as 'O' | 'X' | null) ?? null}
            onChange={update}
          />
        )
      case 'number':
        return (
          <NumberInput
            value={(answer?.value as number | null) ?? null}
            onChange={update}
            unit={item.unit}
          />
        )
      case 'time':
        return (
          <TimeInput
            value={(answer?.value as string | null) ?? null}
            onChange={update}
          />
        )
      case 'text':
        return (
          <input
            type="text"
            value={(answer?.value as string) ?? ''}
            onChange={(e) => update(e.target.value)}
            className="shrink-0 w-36 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-800 bg-white"
            placeholder="입력"
          />
        )
      case 'multi_number':
        return (
          <MultiNumberInput
            fields={item.fields ?? []}
            value={(answer?.value as Record<string, number | null>) ?? {}}
            onChange={update}
          />
        )
      case 'photo':
        return (
          <PhotoInput
            value={(answer?.value as string[]) ?? []}
            onChange={update}
          />
        )
    }
  }

  const isMulti = item.inputType === 'multi_number' || item.inputType === 'photo'

  return (
    <div className="border-b border-gray-100 last:border-0">
      <div className={`flex gap-3 px-4 py-3 ${isMulti ? 'flex-col' : 'items-center justify-between'}`}>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-800 leading-snug">{item.label}</p>
          {item.desc && <p className="text-xs text-gray-400 leading-snug mt-0.5">{item.desc}</p>}
        </div>
        {isMulti ? (
          <div className="flex items-start gap-2">
            {renderInput()}
            <button
              onClick={() => setShowNote((v) => !v)}
              className={`mt-1.5 p-1 rounded-lg transition-colors ${showNote || answer?.note ? 'text-green-800' : 'text-gray-300'}`}
            >
              <MessageSquare size={15} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 shrink-0">
            {renderInput()}
            <button
              onClick={() => setShowNote((v) => !v)}
              className={`p-1 rounded-lg transition-colors ${showNote || answer?.note ? 'text-green-800' : 'text-gray-300'}`}
            >
              <MessageSquare size={15} />
            </button>
          </div>
        )}
      </div>
      {showNote && (
        <div className="px-4 pb-3">
          <input
            type="text"
            value={answer?.note ?? ''}
            onChange={(e) => updateNote(e.target.value)}
            placeholder="특이사항 메모"
            autoFocus
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-800 bg-gray-50"
          />
        </div>
      )}
    </div>
  )
}
