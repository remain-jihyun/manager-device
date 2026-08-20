import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import Avatar from '@/components/Avatar'
import { LogOut, ChevronRight } from 'lucide-react'
import { MesApiError, fetchDashboardSummary } from '@/api/mes'

// 반별 현황은 mes-v2 집계(GET /api/dashboard/summary)에서 온다.
// 이전에는 이 화면과 TeamDetailPage 가 각각 하드코딩 mock 을 들고 있어
// 실제 생산 데이터와 무관한 숫자를 보여줬다(QA D-01).

export interface TeamProgress {
  id: string
  name: string
  total: number
  done: number
}

const POLL_MS = 15_000

export default function HomePage() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  const [teams, setTeams] = useState<TeamProgress[]>([])
  const [overall, setOverall] = useState<{ total: number; completed: number; rate: number } | null>(
    null,
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true

    const load = async () => {
      try {
        const summary = await fetchDashboardSummary()
        if (!alive) return
        setTeams(
          summary.byTeam.map((t) => ({
            id: t.team,
            name: t.team,
            total: t.total,
            done: t.completed,
          })),
        )
        setOverall({
          total: summary.overall.total,
          completed: summary.overall.completed,
          rate: summary.overall.rate,
        })
        setError(null)
      } catch (err) {
        if (!alive) return
        setError(
          err instanceof MesApiError
            ? err.message
            : 'MES 서버에 연결할 수 없습니다. 네트워크를 확인해 주세요.',
        )
      } finally {
        if (alive) setLoading(false)
      }
    }

    void load()
    const timer = setInterval(() => void load(), POLL_MS)
    return () => {
      alive = false
      clearInterval(timer)
    }
  }, [])

  const now = new Date()
  const timeStr = now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
  const dateStr = now.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })

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
        {/* 사진 · 부서 | 직책 · 이름 · 등급 배지 */}
        <div className="bg-white/15 rounded-2xl px-4 py-3 flex items-center gap-3">
          <Avatar name={user?.name ?? ''} src={user?.avatarUrl} size={52} onDark />
          <div className="min-w-0">
            <p className="text-white/60 text-xs font-medium truncate">
              {user?.department ?? user?.team}
              {user?.position && <span className="mx-1.5 text-white/30">|</span>}
              {user?.position}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-xl font-bold truncate">{user?.name}</p>
              {user?.grade && (
                <span className="shrink-0 text-xs font-bold bg-white/25 text-white px-2.5 py-1 rounded-full">
                  {user.grade}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 대시보드 */}
      <div className="screen-x py-4 space-y-3 bg-gray-50 min-h-full">
          {error && (
            <div role="status" className="bg-red-50 border border-red-200 text-red-700 rounded-2xl px-4 py-3 text-sm font-semibold">
              {error}
            </div>
          )}

          <div className="bg-white rounded-2xl px-4 py-4 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              {/* text-lg = 18px (DS subtitle400-b). 짝이 되는 % 값도 같은 크기로 맞춘다. */}
              <p className="text-lg font-bold text-gray-900">전체 간반 진행률</p>
              <span className="text-lg font-bold text-green-900">
                {loading ? '—' : `${overall?.rate ?? 0}%`}
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-green-800 transition-all"
                style={{ width: `${overall?.rate ?? 0}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1.5">
              {loading ? '불러오는 중…' : `${overall?.completed ?? 0} / ${overall?.total ?? 0} 완료`}
            </p>
          </div>

          {/* text-lg = 18px (DS subtitle400-b) */}
          <p className="text-lg font-bold text-gray-400 px-1">반별 현황</p>
          <div className="space-y-2">
            {!loading && teams.length === 0 && (
              <p className="text-sm text-gray-400 py-6 text-center">
                오늘 발행된 간반이 없습니다.
              </p>
            )}
            {teams.map((team) => {
              const pct = team.total > 0 ? Math.round((team.done / team.total) * 100) : 0
              return (
                <button
                  key={team.id}
                  onClick={() => navigate(`/team/${encodeURIComponent(team.id)}`)}
                  className="w-full bg-white rounded-2xl px-4 py-4 border border-gray-200 active:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-gray-900">{team.name}</span>
                      {pct === 100 && (
                        <span className="text-[14px] font-bold bg-green-100 text-green-800 px-2 py-0.5 rounded-full">완료</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-lg font-bold text-gray-700">{pct}%</span>
                      <ChevronRight size={18} className="text-gray-300" />
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
