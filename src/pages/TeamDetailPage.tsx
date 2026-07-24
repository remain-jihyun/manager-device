import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { TEAMS } from './HomePage'

type KanbanStatus = 'done' | 'in-progress' | 'pending' | 'ready'

interface KanbanItem {
  id: string
  name: string
  status: KanbanStatus
}

const TEAM_KANBANS: Record<string, KanbanItem[]> = {
  '1': [
    { id: 'K001', name: '된장찌개 A', status: 'done' },
    { id: 'K002', name: '김치찌개 B', status: 'done' },
    { id: 'K003', name: '불고기 C', status: 'done' },
    { id: 'K004', name: '제육볶음 D', status: 'done' },
    { id: 'K005', name: '순두부찌개 E', status: 'done' },
    { id: 'K006', name: '갈비탕 F', status: 'done' },
    { id: 'K007', name: '닭볶음탕 G', status: 'done' },
    { id: 'K008', name: '비빔밥 H', status: 'done' },
    { id: 'K009', name: '잡채 I', status: 'done' },
    { id: 'K010', name: '떡볶이 J', status: 'done' },
    { id: 'K011', name: '삼겹살 K', status: 'done' },
    { id: 'K012', name: '오징어볶음 L', status: 'done' },
    { id: 'K013', name: '두부조림 M', status: 'done' },
    { id: 'K014', name: '콩나물무침 N', status: 'done' },
    { id: 'K015', name: '시금치나물 O', status: 'done' },
    { id: 'K016', name: '멸치볶음 P', status: 'done' },
    { id: 'K017', name: '계란말이 Q', status: 'done' },
    { id: 'K018', name: '어묵볶음 R', status: 'done' },
    { id: 'K019', name: '생선구이 S', status: 'in-progress' },
    { id: 'K020', name: '돼지갈비 T', status: 'in-progress' },
    { id: 'K021', name: '수육 U', status: 'pending' },
    { id: 'K022', name: '보쌈 V', status: 'pending' },
    { id: 'K023', name: '족발 W', status: 'ready' },
    { id: 'K024', name: '파전 X', status: 'ready' },
  ],
  '2': [
    { id: 'K101', name: '된장찌개 A', status: 'done' },
    { id: 'K102', name: '김치찌개 B', status: 'done' },
    { id: 'K103', name: '불고기 C', status: 'done' },
    { id: 'K104', name: '제육볶음 D', status: 'done' },
    { id: 'K105', name: '순두부찌개 E', status: 'done' },
    { id: 'K106', name: '갈비탕 F', status: 'done' },
    { id: 'K107', name: '닭볶음탕 G', status: 'done' },
    { id: 'K108', name: '비빔밥 H', status: 'done' },
    { id: 'K109', name: '잡채 I', status: 'done' },
    { id: 'K110', name: '떡볶이 J', status: 'done' },
    { id: 'K111', name: '삼겹살 K', status: 'done' },
    { id: 'K112', name: '오징어볶음 L', status: 'done' },
    { id: 'K113', name: '두부조림 M', status: 'in-progress' },
    { id: 'K114', name: '콩나물무침 N', status: 'in-progress' },
    { id: 'K115', name: '시금치나물 O', status: 'pending' },
    { id: 'K116', name: '멸치볶음 P', status: 'pending' },
    { id: 'K117', name: '계란말이 Q', status: 'ready' },
    { id: 'K118', name: '어묵볶음 R', status: 'ready' },
    { id: 'K119', name: '생선구이 S', status: 'ready' },
    { id: 'K120', name: '돼지갈비 T', status: 'ready' },
  ],
  '3': Array.from({ length: 22 }, (_, i) => ({
    id: `K20${i + 1}`,
    name: `간반 ${String.fromCharCode(65 + i)}`,
    status: 'done' as KanbanStatus,
  })),
  '4': [
    ...Array.from({ length: 6 }, (_, i) => ({ id: `K30${i + 1}`, name: `간반 ${String.fromCharCode(65 + i)}`, status: 'done' as KanbanStatus })),
    ...Array.from({ length: 2 }, (_, i) => ({ id: `K31${i + 1}`, name: `간반 ${String.fromCharCode(71 + i)}`, status: 'in-progress' as KanbanStatus })),
    ...Array.from({ length: 4 }, (_, i) => ({ id: `K32${i + 1}`, name: `간반 ${String.fromCharCode(73 + i)}`, status: 'pending' as KanbanStatus })),
    ...Array.from({ length: 6 }, (_, i) => ({ id: `K33${i + 1}`, name: `간반 ${String.fromCharCode(77 + i)}`, status: 'ready' as KanbanStatus })),
  ],
  '5': [
    ...Array.from({ length: 14 }, (_, i) => ({ id: `K40${i + 1}`, name: `간반 ${String.fromCharCode(65 + i)}`, status: 'done' as KanbanStatus })),
    ...Array.from({ length: 2 }, (_, i) => ({ id: `K41${i + 1}`, name: `간반 ${String.fromCharCode(79 + i)}`, status: 'in-progress' as KanbanStatus })),
  ],
}

type TabStatus = 'ready' | 'pending' | 'in-progress' | 'done'

const TABS: { key: TabStatus; label: string }[] = [
  { key: 'ready', label: '준비' },
  { key: 'pending', label: '대기' },
  { key: 'in-progress', label: '작업' },
  { key: 'done', label: '완료' },
]

const STATUS_META: Record<KanbanStatus, { label: string; cls: string }> = {
  done: { label: '완료', cls: 'bg-green-100 text-green-800' },
  'in-progress': { label: '작업', cls: 'bg-blue-100 text-blue-700' },
  pending: { label: '대기', cls: 'bg-orange-100 text-orange-600' },
  ready: { label: '준비', cls: 'bg-gray-100 text-gray-500' },
}

export default function TeamDetailPage() {
  const navigate = useNavigate()
  const { teamId } = useParams<{ teamId: string }>()
  const [activeTab, setActiveTab] = useState<TabStatus>('in-progress')

  const team = TEAMS.find((t) => t.id === teamId)
  const kanbans = TEAM_KANBANS[teamId ?? ''] ?? []

  if (!team) return null

  const pct = Math.round((team.done / team.total) * 100)
  const counts = {
    ready: kanbans.filter((k) => k.status === 'ready').length,
    pending: kanbans.filter((k) => k.status === 'pending').length,
    'in-progress': kanbans.filter((k) => k.status === 'in-progress').length,
    done: kanbans.filter((k) => k.status === 'done').length,
  }

  const displayed = kanbans.filter((k) => k.status === activeTab)

  return (
    <div className="flex flex-col bg-gray-50 min-h-full">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="flex items-center px-3 gap-2" style={{ height: '52px' }}>
          <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-gray-800">
            <ChevronLeft size={24} strokeWidth={2} />
          </button>
          <h1 className="flex-1 text-center text-[16px] font-bold text-gray-900">{team.name} 간반 현황</h1>
          <div className="w-8" />
        </div>
      </div>

      <div className="px-4 py-4 space-y-3">
        {/* 요약 카드 */}
        <div className="bg-white rounded-2xl px-4 py-4 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-bold text-gray-900">{team.name} 전체 진행률</p>
            <span className="text-sm font-bold text-green-900">{pct}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
            <div className="h-full rounded-full bg-green-800 transition-all" style={{ width: `${pct}%` }} />
          </div>
          <div className="flex gap-4 flex-wrap">
            {[
              { label: '준비', count: counts.ready, dot: 'bg-gray-300' },
              { label: '대기', count: counts.pending, dot: 'bg-orange-400' },
              { label: '작업', count: counts['in-progress'], dot: 'bg-blue-400' },
              { label: '완료', count: counts.done, dot: 'bg-green-700' },
            ].map(({ label, count, dot }) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${dot}`} />
                <span className="text-xs text-gray-500">{label} {count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 상태 탭 */}
        <div className="flex bg-gray-100 rounded-2xl p-1 gap-1">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors ${
                activeTab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'
              }`}
            >
              {label}
              {counts[key] > 0 && (
                <span className={`ml-1 ${activeTab === key ? 'text-green-800' : 'text-gray-400'}`}>
                  {counts[key]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* 간반 목록 */}
        {displayed.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-10">해당 상태의 간반이 없습니다</p>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-50 overflow-hidden">
            {displayed.map((item) => {
              const meta = STATUS_META[item.status]
              return (
                <div key={item.id} className="flex items-center justify-between px-4 py-3.5">
                  <div>
                    <p className="text-sm font-bold text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{item.id}</p>
                  </div>
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${meta.cls}`}>
                    {meta.label}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
