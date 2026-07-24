import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { LogOut, ChevronRight } from 'lucide-react'

export const TEAMS = [
  { id: '1', name: '1반', total: 24, done: 18 },
  { id: '2', name: '2반', total: 20, done: 12 },
  { id: '3', name: '3반', total: 22, done: 22 },
  { id: '4', name: '4반', total: 18, done: 6 },
  { id: '5', name: '5반', total: 16, done: 14 },
]

export default function HomePage() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  const now = new Date()
  const timeStr = now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
  const dateStr = now.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })

  const totalDone = TEAMS.reduce((s, t) => s + t.done, 0)
  const totalAll = TEAMS.reduce((s, t) => s + t.total, 0)
  const totalPct = Math.round((totalDone / totalAll) * 100)

  return (
    <div className="flex flex-col bg-white">
      {/* 헤더 */}
      <div className="bg-green-900 text-white px-5 pt-5 pb-7">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-white/60 text-xs">{dateStr}</p>
            <p className="text-3xl font-bold mt-1 tracking-tight">{timeStr}</p>
          </div>
          <button
            onClick={() => { logout(); navigate('/login', { replace: true }) }}
            className="p-2 bg-white/15 rounded-xl active:bg-white/25"
          >
            <LogOut size={18} />
          </button>
        </div>
        <div className="bg-white/15 rounded-2xl px-4 py-3">
          <p className="font-semibold text-sm">
            {user?.name} <span className="text-white/60 font-normal">({user?.team})</span>
          </p>
        </div>
      </div>

      {/* 대시보드 */}
      <div className="px-4 py-4 space-y-3 bg-gray-50 min-h-full">
          <div className="bg-white rounded-2xl px-4 py-4 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-bold text-gray-900">전체 간반 진행률</p>
              <span className="text-sm font-bold text-green-900">{totalPct}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-green-800 transition-all" style={{ width: `${totalPct}%` }} />
            </div>
            <p className="text-xs text-gray-400 mt-1.5">{totalDone} / {totalAll} 완료</p>
          </div>

          <p className="text-xs font-bold text-gray-400 px-1">반별 현황</p>
          <div className="space-y-2">
            {TEAMS.map((team) => {
              const pct = Math.round((team.done / team.total) * 100)
              return (
                <button
                  key={team.id}
                  onClick={() => navigate(`/team/${team.id}`)}
                  className="w-full bg-white rounded-2xl px-4 py-4 border border-gray-200 active:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-900">{team.name}</span>
                      {pct === 100 && (
                        <span className="text-[10px] font-bold bg-green-100 text-green-800 px-2 py-0.5 rounded-full">완료</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-bold text-gray-700">{pct}%</span>
                      <ChevronRight size={14} className="text-gray-300" />
                    </div>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-green-800 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5">{team.done} / {team.total} 완료</p>
                </button>
              )
            })}
          </div>
        </div>
    </div>
  )
}
