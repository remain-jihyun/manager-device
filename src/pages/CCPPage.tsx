import { useState, useEffect, useMemo, useRef } from 'react'
import TopBar from '@/components/TopBar'
import { CheckCircle2, Clock, AlertCircle, ChevronLeft, Bell, Camera, X } from 'lucide-react'
import { useCCPStore } from '@/store/ccpStore'
import type { CCPKind } from '@/store/ccpStore'
import { CCP_CHECK_ITEMS } from '@/constants/ccpData'

type CCPStatus = 'upcoming' | 'active' | 'done' | 'missed'

interface CCPTask {
  id: string
  type: string
  kind: CCPKind
  location: string
  scheduledAt: Date
  completedAt: Date | null
}

// 반별 CCP 지정 + 주기(30분/1시간) 설정에 따라 점검 점표를 자동 생성한다.
// (반/주기는 store에서, 실제 설정은 MES "CCP 관리"에서 → 추후 연동)
function buildTodaySchedules(
  schedules: { id: string; line: string; label: string; kind: CCPKind; intervalMin: number; startTime: string; enabled: boolean }[]
): CCPTask[] {
  const now = new Date()
  const windowStart = now.getTime() - 90 * 60 * 1000
  const windowEnd = now.getTime() + 150 * 60 * 1000
  const tasks: CCPTask[] = []

  schedules
    .filter((s) => s.enabled)
    .forEach((s) => {
      const [h, m] = s.startTime.split(':').map(Number)
      const anchor = new Date(now)
      anchor.setHours(h, m, 0, 0)
      const stepMs = s.intervalMin * 60 * 1000
      let t = anchor.getTime()
      // 표시 윈도우 시작 이전 슬롯은 건너뛴다
      if (t < windowStart) t += Math.ceil((windowStart - t) / stepMs) * stepMs
      for (; t <= windowEnd; t += stepMs) {
        tasks.push({
          id: `${s.id}-${t}`,
          type: s.label,
          kind: s.kind,
          location: s.line,
          scheduledAt: new Date(t),
          completedAt: null,
        })
      }
    })

  return tasks.sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime())
}

// ── 데모용 더미 데이터 ────────────────────────────────────────────────
// 실제 점검 기록은 MES v2 API에서 내려온다(추후 연동). 지금은 메뉴를 만져볼 수
// 있도록, 예정 시각이 이미 지난 슬롯 대부분을 그럴듯한 점검값과 함께 완료 처리하고
// 일부는 '미진행'으로 남겨 완료/미진행/진행가능/예정이 고루 보이게 한다.
function sampleValues(seed: number): Record<string, string> {
  return {
    'heat-temp': String(76 + (seed % 8)), // 76~83℃
    'heat-time': String(2 + (seed % 3)), // 2~4분
    'sanitizer-conc': String(90 + (seed % 21)), // 90~110ppm
    'wash-state': '양호',
    'sanitize-state': seed % 6 === 0 ? '불량' : '양호',
    'tool-clean': '양호',
  }
}

function seedDemoRecords(
  schedules: { id: string; line: string; label: string; kind: CCPKind; intervalMin: number; startTime: string; enabled: boolean }[],
  now: Date
): { tasks: CCPTask[]; taskValues: Record<string, Record<string, string>> } {
  const taskValues: Record<string, Record<string, string>> = {}
  const seeded = buildTodaySchedules(schedules).map((t, i) => {
    // 아직 예정 시각이 안 된 슬롯은 그대로(예정/진행가능) 둔다
    if (t.scheduledAt.getTime() >= now.getTime()) return t
    // 지난 슬롯의 약 20%(i % 5 === 2)는 미진행으로 남긴다
    if (i % 5 === 2) return t
    // 완료 처리 — 대부분은 정시(예정 후 3~12분), 일부(i % 4 === 1)는 40~72분 지연 완료
    const late = i % 4 === 1
    const offsetMin = late ? 40 + (i % 5) * 8 : 3 + (i % 10)
    const completedAt = new Date(t.scheduledAt.getTime() + offsetMin * 60 * 1000)
    taskValues[t.id] = sampleValues(i)
    return { ...t, completedAt }
  })

  // 데모에서 항상 '진행 가능(active)'인 점검이 몇 건 보이도록 보장한다.
  // (실제 시계·주기 정렬과 무관하게 점검하기 → 점검 항목 리스트를 열 수 있게)
  const activeEnough = seeded.filter(
    (t) => !t.completedAt && now.getTime() - t.scheduledAt.getTime() >= 0 && now.getTime() - t.scheduledAt.getTime() <= 30 * 60 * 1000
  ).length
  if (activeEnough < 3) {
    const enabled = schedules.filter((s) => s.enabled)
    enabled.slice(0, 3).forEach((s, k) => {
      const scheduledAt = new Date(now.getTime() - (3 + k * 4) * 60 * 1000) // 3·7·11분 전 → 진행 가능
      const id = `demo-active-${s.id}`
      if (seeded.some((t) => t.id === id)) return
      seeded.push({
        id,
        type: s.label,
        kind: s.kind,
        location: s.line,
        scheduledAt,
        completedAt: null,
      })
    })
  }

  return { tasks: seeded.sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime()), taskValues }
}

// 진행 가능(active) 창 = 예정 후 30분. 이 창을 넘겨 완료하면 '시간 넘겨 점검'으로 본다.
const ACTIVE_WINDOW_MS = 30 * 60 * 1000

function getStatus(task: CCPTask, now: Date): CCPStatus {
  if (task.completedAt) return 'done'
  const elapsed = now.getTime() - task.scheduledAt.getTime()
  if (elapsed < 0) return 'upcoming'
  if (elapsed <= ACTIVE_WINDOW_MS) return 'active'
  return 'missed'
}

// 시간 넘겨 점검(지연 완료): 예정 후 30분(진행 가능 창)을 지나 완료된 기록
function isLateDone(task: CCPTask): boolean {
  return !!task.completedAt && task.completedAt.getTime() - task.scheduledAt.getTime() > ACTIVE_WINDOW_MS
}

function remainingSec(task: CCPTask, now: Date): number {
  return Math.max(0, 30 * 60 - Math.floor((now.getTime() - task.scheduledAt.getTime()) / 1000))
}

function fmtCountdown(sec: number): string {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':')
}

function fmtTime(d: Date) {
  return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
}

const STATUS_UI: Record<CCPStatus, { label: string; labelCls: string; cardBorder: string }> = {
  upcoming: { label: '예정', labelCls: 'bg-gray-100 text-gray-500', cardBorder: 'border-gray-200' },
  active: { label: '진행 가능', labelCls: 'bg-green-100 text-green-800', cardBorder: 'border-green-200' },
  done: { label: '완료', labelCls: 'bg-green-900 text-white', cardBorder: 'border-gray-200' },
  missed: { label: '미진행', labelCls: 'bg-red-100 text-red-600', cardBorder: 'border-red-100' },
}

const KIND_UI: Record<CCPKind, { cls: string }> = {
  CCP: { cls: 'bg-red-50 text-red-600 border-red-200' },
  CP: { cls: 'bg-blue-50 text-blue-600 border-blue-200' },
}

// 예정 시간 도래 알람용 짧은 비프음 (사용자 제스처 필요 시 무음 폴백)
function playBeep() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new AudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.001, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
    osc.start()
    osc.stop(ctx.currentTime + 0.5)
    osc.onended = () => ctx.close()
  } catch {
    /* 소리 재생 불가 시 무시 */
  }
}

export default function CCPPage() {
  const schedules = useCCPStore((s) => s.schedules)
  // 데모용 더미 기록을 한 번만 시딩해 tasks/taskValues 초기값으로 사용한다.
  const seedRef = useRef<ReturnType<typeof seedDemoRecords> | null>(null)
  if (!seedRef.current) {
    seedRef.current = seedDemoRecords(schedules, new Date())
  }
  const [tasks, setTasks] = useState<CCPTask[]>(() => seedRef.current!.tasks)
  const [now, setNow] = useState(new Date())
  const [view, setView] = useState<'list' | 'form'>('list')
  const [completing, setCompleting] = useState<string | null>(null)
  const [values, setValues] = useState<Record<string, string>>({})
  const [note, setNote] = useState('')
  const [formToast, setFormToast] = useState('')
  const [taskValues, setTaskValues] = useState<Record<string, Record<string, string>>>(
    () => seedRef.current!.taskValues
  )
  // 사진 촬영 — 현재 입력 중 사진(dataURL) 및 완료된 점검별 사진 보관
  const [photos, setPhotos] = useState<string[]>([])
  const [taskPhotos, setTaskPhotos] = useState<Record<string, string[]>>({})
  const photoInputRef = useRef<HTMLInputElement>(null)

  const addPhotos = (files: FileList | null) => {
    if (!files || files.length === 0) return
    Array.from(files).forEach((file) => {
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === 'string') setPhotos((prev) => [...prev, reader.result as string])
      }
      reader.readAsDataURL(file)
    })
  }
  // 예정 시간 도래 알람 — 확인(닫기)한 점검 id
  const [alarmAckIds, setAlarmAckIds] = useState<Set<string>>(new Set())
  const prevAlarmKeyRef = useRef('')

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  const statuses = useMemo(
    () => Object.fromEntries(tasks.map((t) => [t.id, getStatus(t, now)])) as Record<string, CCPStatus>,
    [tasks, now]
  )

  // 예정 시간이 된(=진행 가능) & 아직 완료/확인 안 한 점검들
  const dueAlarms = useMemo(
    () => tasks.filter((t) => statuses[t.id] === 'active' && !t.completedAt && !alarmAckIds.has(t.id)),
    [tasks, statuses, alarmAckIds]
  )

  // 알람 대상이 새로 생기면 비프음
  useEffect(() => {
    const key = dueAlarms.map((t) => t.id).join(',')
    if (key && key !== prevAlarmKeyRef.current) playBeep()
    prevAlarmKeyRef.current = key
  }, [dueAlarms])

  const missingRequired = useMemo(
    () => CCP_CHECK_ITEMS.filter((it) => it.required && !values[it.id]?.trim()),
    [values]
  )

  const resetForm = () => {
    setView('list')
    setCompleting(null)
    setValues({})
    setNote('')
    setPhotos([])
    setFormToast('')
  }

  const handleComplete = (id: string) => {
    if (missingRequired.length > 0) {
      setFormToast('필수 점검 항목을 모두 입력하세요')
      setTimeout(() => setFormToast(''), 2500)
      return
    }
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completedAt: new Date() } : t)))
    setTaskValues((prev) => ({ ...prev, [id]: values }))
    setTaskPhotos((prev) => ({ ...prev, [id]: photos }))
    resetForm()
  }

  const openForm = (id: string) => {
    setCompleting(id)
    setValues({})
    setNote('')
    setPhotos([])
    setFormToast('')
    setView('form')
    // 알람에서 진입한 경우 해당 알람은 확인 처리
    setAlarmAckIds((prev) => new Set(prev).add(id))
  }

  const ackAllAlarms = () => {
    setAlarmAckIds((prev) => {
      const next = new Set(prev)
      dueAlarms.forEach((t) => next.add(t.id))
      return next
    })
  }

  const completingTask = tasks.find((t) => t.id === completing)
  const doneCount = tasks.filter((t) => statuses[t.id] === 'done').length
  const missedCount = tasks.filter((t) => statuses[t.id] === 'missed').length
  const activeCount = tasks.filter((t) => statuses[t.id] === 'active').length

  // ── 점검 완료 입력 전체 페이지 ──────────────────────────────────────
  if (view === 'form' && completing && completingTask) {
    return (
      <div className="flex flex-col h-full bg-gray-50">
        <div className="bg-white border-b border-gray-100 flex items-center px-3 shrink-0" style={{ height: '52px' }}>
          <button onClick={resetForm} className="p-1 -ml-1 text-gray-800">
            <ChevronLeft size={24} strokeWidth={2} />
          </button>
          <div className="flex-1 text-center">
            <p className="text-[16px] font-bold text-gray-900">{completingTask.type}</p>
            <p className="text-[11px] text-gray-400">{completingTask.location}</p>
          </div>
          <div className="w-8" />
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
          {/* 점검 항목 — 필수/선택 리스트 */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <span className="text-sm font-bold text-gray-900">점검 항목</span>
              <span className="text-xs text-gray-400">
                <span className="text-red-500">*</span> 필수
              </span>
            </div>
            <div className="p-4 space-y-4">
              {CCP_CHECK_ITEMS.map((item) => {
                const val = values[item.id] ?? ''
                return (
                  <div key={item.id}>
                    <p className="text-sm font-bold text-gray-800 mb-1.5">
                      {item.label}
                      {item.required ? (
                        <span className="text-red-500 ml-0.5">*</span>
                      ) : (
                        <span className="text-gray-400 font-normal text-xs ml-1">(선택)</span>
                      )}
                    </p>
                    {item.options ? (
                      <div className="flex gap-2">
                        {item.options.map((opt) => (
                          <button
                            key={opt}
                            onClick={() => setValues((p) => ({ ...p, [item.id]: opt }))}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-bold border active:opacity-80 ${
                              val === opt
                                ? 'bg-green-900 text-white border-green-900'
                                : 'bg-gray-50 text-gray-600 border-gray-200'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center border border-gray-200 rounded-xl px-3 focus-within:border-green-800">
                        <input
                          value={val}
                          onChange={(e) => setValues((p) => ({ ...p, [item.id]: e.target.value }))}
                          inputMode={item.unit ? 'decimal' : 'text'}
                          placeholder={item.placeholder ?? '입력'}
                          className="flex-1 py-2.5 text-sm bg-transparent focus:outline-none"
                        />
                        {item.unit && <span className="text-sm text-gray-400 ml-2">{item.unit}</span>}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* 사진 촬영 */}
          <div>
            <p className="text-sm font-bold text-gray-900 mb-2">
              사진 촬영 <span className="text-gray-400 font-normal text-xs">(선택)</span>
              {photos.length > 0 && <span className="text-green-800 font-bold text-xs ml-1">{photos.length}장</span>}
            </p>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              className="hidden"
              onChange={(e) => {
                addPhotos(e.target.files)
                e.target.value = ''
              }}
            />
            <div className="grid grid-cols-3 gap-2">
              {photos.map((src, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200">
                  <img src={src} alt={`촬영 ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    onClick={() => setPhotos((prev) => prev.filter((_, idx) => idx !== i))}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center active:bg-black/80"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              <button
                onClick={() => photoInputRef.current?.click()}
                className="aspect-square rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 active:bg-gray-50"
              >
                <Camera size={22} />
                <span className="text-[11px] mt-1 font-bold">촬영</span>
              </button>
            </div>
          </div>

          {/* 특이사항 */}
          <div>
            <p className="text-sm font-bold text-gray-900 mb-2">특이사항 <span className="text-gray-400 font-normal text-xs">(선택)</span></p>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="특이사항을 입력하세요"
              rows={4}
              className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-green-800"
            />
          </div>
        </div>

        {formToast && (
          <div className="absolute bottom-24 left-4 right-4 bg-gray-800 text-white text-sm text-center py-3 rounded-2xl z-50">
            {formToast}
          </div>
        )}

        <div className="shrink-0 px-4 pt-3 pb-6 bg-white border-t border-gray-100">
          {missingRequired.length > 0 && (
            <p className="text-[11px] text-gray-400 text-center mb-2">필수 항목 {missingRequired.length}개를 입력해야 완료할 수 있습니다</p>
          )}
          <button
            onClick={() => handleComplete(completing)}
            disabled={missingRequired.length > 0}
            className={`w-full py-4 font-bold rounded-2xl text-[15px] ${
              missingRequired.length > 0
                ? 'bg-gray-200 text-gray-400'
                : 'bg-green-900 text-white active:bg-green-800'
            }`}
          >
            점검 완료
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-full flex flex-col bg-gray-50 overflow-hidden">
      <TopBar title="CCP 점검" />

      {/* 요약 — 스크롤 안 되는 상단 고정 영역 */}
      <div className="flex bg-white border-b border-gray-100 shrink-0">
        {[
          { label: '진행 가능', count: activeCount, cls: 'text-green-800' },
          { label: '완료', count: doneCount, cls: 'text-gray-700' },
          { label: '미진행', count: missedCount, cls: missedCount > 0 ? 'text-red-500' : 'text-gray-400' },
        ].map(({ label, count, cls }, i) => (
          <div key={label} className={`flex-1 text-center py-4 ${i < 2 ? 'border-r border-gray-100' : ''}`}>
            <p className={`text-2xl font-bold ${cls}`}>{count}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* 스크롤 가능한 목록 영역 */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        <p className="text-xs font-bold text-gray-400">오늘 CCP 점검 일정 (반별 · 주기 자동 생성)</p>

        {tasks.map((task) => {
          const status = statuses[task.id]
          const ui = STATUS_UI[status]
          const late = status === 'done' && isLateDone(task)
          const remaining = status === 'active' ? remainingSec(task, now) : null

          return (
            <div key={task.id} className={`bg-white rounded-2xl border overflow-hidden ${ui.cardBorder}`}>
              <div className="px-4 py-4 flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {status === 'done' && <CheckCircle2 size={14} className={`shrink-0 ${late ? 'text-amber-600' : 'text-green-700'}`} />}
                    {status === 'active' && <CheckCircle2 size={14} className="text-green-600 shrink-0" />}
                    {status === 'upcoming' && <Clock size={14} className="text-gray-400 shrink-0" />}
                    {status === 'missed' && <AlertCircle size={14} className="text-red-400 shrink-0" />}
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${KIND_UI[task.kind].cls}`}>
                      {task.kind}
                    </span>
                    <p className="text-sm font-bold text-gray-900 truncate">{task.type}</p>
                  </div>
                  <p className="text-xs text-gray-500">{task.location}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    예정 {fmtTime(task.scheduledAt)}
                    {task.completedAt && ` · 완료 ${fmtTime(task.completedAt)}`}
                  </p>
                  {/* 이 디바이스는 완료/미완료만 표시. 작성한 점검 내용·사진은 mes-v2 CCP 이력에서만 확인. */}
                </div>
                <div className="flex flex-col items-end gap-1.5 ml-3 shrink-0">
                  <span
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                      late ? 'bg-amber-100 text-amber-700' : ui.labelCls
                    }`}
                  >
                    {late ? '시간 넘겨 점검' : ui.label}
                  </span>
                  {remaining !== null && (
                    <span className="text-xs font-bold text-green-700 tabular-nums">{fmtCountdown(remaining)}</span>
                  )}
                </div>
              </div>

              {(status === 'active' || status === 'missed') && (
                <div className="px-4 pb-4">
                  <button
                    onClick={() => openForm(task.id)}
                    className={`w-full py-3 text-white text-sm font-bold rounded-2xl ${
                      status === 'missed'
                        ? 'bg-amber-600 active:bg-amber-700'
                        : 'bg-green-900 active:bg-green-800'
                    }`}
                  >
                    {status === 'missed' ? '지연 점검하기' : '점검하기'}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* 예정 시간 도래 알람 — 프레임 내 오버레이 */}
      {dueAlarms.length > 0 && (
        <div className="absolute inset-0 z-[100] bg-black/40 flex items-end sm:items-center justify-center px-4 pb-6">
          <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-xl">
            <div className="flex flex-col items-center gap-2 px-5 pt-6 pb-4">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center animate-pulse">
                <Bell size={28} className="text-green-800" />
              </div>
              <p className="text-lg font-bold text-gray-900">CCP 점검 시간입니다</p>
              <p className="text-xs text-gray-400">예정 시간이 된 점검 {dueAlarms.length}건</p>
            </div>
            <div className="px-5 pb-2 max-h-52 overflow-y-auto space-y-2">
              {dueAlarms.map((t) => (
                <button
                  key={t.id}
                  onClick={() => openForm(t.id)}
                  className="w-full flex items-center gap-2 px-4 py-3 rounded-2xl border border-gray-200 text-left active:bg-gray-50"
                >
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${KIND_UI[t.kind].cls}`}>
                    {t.kind}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-bold text-gray-900 truncate">{t.type}</span>
                    <span className="block text-[11px] text-gray-400">{t.location} · 예정 {fmtTime(t.scheduledAt)}</span>
                  </span>
                  <span className="text-xs font-bold text-green-800 shrink-0">점검 →</span>
                </button>
              ))}
            </div>
            <div className="px-5 pt-2 pb-5">
              <button
                onClick={ackAllAlarms}
                className="w-full py-3.5 rounded-2xl bg-gray-100 text-gray-600 text-sm font-bold active:bg-gray-200"
              >
                확인 (나중에)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
