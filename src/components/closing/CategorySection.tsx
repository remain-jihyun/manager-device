import type { CheckItem, CheckAnswer } from '@/types/closingCheck'
import CheckItemRow from './CheckItemRow'

interface CategorySectionProps {
  category: string
  items: CheckItem[]
  answers: CheckAnswer[]
  onAnswerChange: (a: CheckAnswer) => void
}

const CATEGORY_STYLES: Record<string, string> = {
  '작업전': 'bg-amber-50 text-amber-700',
  '작업중': 'bg-green-50 text-green-800',
  '작업후': 'bg-blue-50 text-blue-700',
  '공통': 'bg-gray-100 text-gray-600',
  '생산': 'bg-green-50 text-green-800',
  '설비 점검': 'bg-blue-50 text-blue-700',
}

function getCategoryStyle(category: string): string {
  return CATEGORY_STYLES[category] ?? 'bg-gray-50 text-gray-700'
}

function isAnswered(answer: CheckAnswer | undefined): boolean {
  if (!answer) return false
  if (answer.value === null || answer.value === undefined) return false
  if (typeof answer.value === 'string') return answer.value !== ''
  if (typeof answer.value === 'number') return true
  if (typeof answer.value === 'object') return Object.values(answer.value).some((v) => v !== null)
  return false
}

export default function CategorySection({ category, items, answers, onAnswerChange }: CategorySectionProps) {
  const answeredCount = items.filter((item) => isAnswered(answers.find((a) => a.itemId === item.id))).length

  return (
    <div className="mb-3">
      <div className={`flex items-center justify-between px-4 py-2 ${getCategoryStyle(category)}`} style={{ minHeight: '36px' }}>
        <span className="text-[14px] font-bold">{category}</span>
        <span className="text-xs font-medium opacity-70">{answeredCount}/{items.length}</span>
      </div>
      <div className="bg-white">
        {items.map((item) => (
          <CheckItemRow
            key={item.id}
            item={item}
            answer={answers.find((a) => a.itemId === item.id)}
            onAnswerChange={onAnswerChange}
          />
        ))}
      </div>
    </div>
  )
}
