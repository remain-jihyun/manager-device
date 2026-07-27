import { useEffect, useMemo, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { AlertTriangle, Camera, Check, CheckCircle2, Clock, X } from 'lucide-react'
import TopBar from '@/components/TopBar'
import { useAuthStore } from '@/store/authStore'
import {
  useAndonStore,
  openEventsOfType,
  confirmedEventsOfType,
} from '@/store/andonStore'
import { ANDON_SLUG_TO_TYPE, type AndonEvent } from '@/api/andon'
import { openCamera, openGallery } from '@/utils/photoUtils'

const MAX_CONFIRM_PHOTOS = 5

const hhmmss = (iso: string) =>
  new Date(iso).toLocaleTimeString('ko-KR', { hour12: false })

const elapsed = (iso: string) => {
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (min < 1) return '방금'
  if (min < 60) return `${min}분 경과`
  return `${Math.floor(min / 60)}시간 ${min % 60}분 경과`
}

export default function AndonPage() {
  const { slug } = useParams()
  const typeId = ANDON_SLUG_TO_TYPE[slug ?? '']

  const { types, events, offline, loaded, refresh } = useAndonStore()
  const user = useAuthStore((s) => s.user)

  const [target, setTarget] = useState<AndonEvent | null>(null)

  useEffect(() => {
    refresh()
  }, [refresh])

  const type = useMemo(() => types.find((t) => t.id === typeId), [types, typeId])
  const open = useMemo(
    () => (typeId ? openEventsOfType(events, typeId) : []),
    [events, typeId]
  )
  const done = useMemo(
    () => (typeId ? confirmedEventsOfType(events, typeId) : []),
    [events, typeId]
  )

  if (!typeId) return <Navigate to="/menu" replace />

  return (
    <div className="flex flex-col bg-gray-50 min-h-full">
      <TopBar title={type?.label ?? '안돈'} showBack />

      {offline && (
        <div className="mx-4 mt-3 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2.5">
          <p className="text-[11px] font-bold text-amber-700">
            MES 서버(:4000)에 연결되지 않았습니다
          </p>
          <p className="text-[11px] text-amber-600 mt-0.5">
            안돈 발생 내역을 받아올 수 없습니다. 서버 상태를 확인해 주세요.
          </p>
        </div>
      )}

      {/* 미확인 안돈 */}
      <div className="px-4 pt-4">
        <div className="flex items-center justify-between mb-2 px-1">
          <p className="text-xs font-bold text-gray-400">미확인 안돈</p>
          <span
            className={`text-xs font-bold ${open.length ? 'text-red-500' : 'text-gray-400'}`}
          >
            {open.length}건
          </span>
        </div>

        {open.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white py-10 flex flex-col items-center gap-2">
            <CheckCircle2 size={26} className="text-green-700" />
            <p className="text-sm font-bold text-gray-700">미확인 안돈이 없습니다</p>
            <p className="text-[11px] text-gray-400">
              {loaded ? '발생 시 자동으로 표시됩니다' : '불러오는 중…'}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {open.map((e) => (
              <div
                key={e.id}
                className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <AlertTriangle size={15} className="text-red-500 shrink-0" />
                    <p className="text-sm font-bold text-red-600 truncate">{e.detail}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold text-gray-700">{hhmmss(e.occurredAt)}</p>
                    <p className="text-[10px] text-red-400 font-semibold">
                      {elapsed(e.occurredAt)}
                    </p>
                  </div>
                </div>

                <dl className="rounded-xl bg-white/80 px-3 py-2.5 space-y-1.5 mb-2.5">
                  <Row label="발생 위치" value={`${e.line} · ${e.lineNo}`} />
                  <Row label="설비" value={e.equipment} />
                  <Row label="품목" value={e.product} />
                  <Row label="로트번호" value={e.lotNo} mono />
                  <Row
                    label={e.metricLabel}
                    value={`${e.metricValue}${e.metricUnit ? ` ${e.metricUnit}` : ''}`}
                    danger
                  />
                  <Row label="관리 기준" value={e.spec} />
                  <Row label="발생 경로" value={e.source} />
                </dl>

                <button
                  onClick={() => setTarget(e)}
                  className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl bg-red-500 text-white text-sm font-bold active:bg-red-600"
                >
                  <Camera size={15} /> 사진 찍고 확인 완료
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 확인 완료 이력 */}
      <div className="px-4 py-4">
        <p className="text-xs font-bold text-gray-400 mb-2 px-1">확인 완료</p>
        {done.length === 0 ? (
          <p className="text-[11px] text-gray-400 px-1 py-3">확인 완료 이력이 없습니다</p>
        ) : (
          <div className="space-y-2">
            {done.map((e) => (
              <div
                key={e.id}
                className="rounded-2xl border border-gray-200 bg-white px-4 py-3"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Check size={14} className="text-green-700" />
                    <p className="text-sm font-bold text-gray-800">{e.detail}</p>
                  </div>
                  <span className="text-[10px] font-bold bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                    확인 완료
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 mb-1">
                  {e.line} · {e.lineNo} · {e.product} · {e.lotNo}
                  {' · '}
                  {e.metricLabel} {e.metricValue}
                  {e.metricUnit ? ` ${e.metricUnit}` : ''}
                </p>
                <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mb-1">
                  <Clock size={11} />
                  발생 {hhmmss(e.occurredAt)} · 확인 {e.confirmedAt ? hhmmss(e.confirmedAt) : '-'}
                </div>
                <p className="text-[11px] text-gray-500">
                  확인자 <span className="font-bold text-gray-700">{e.confirmedBy}</span> · 사진{' '}
                  {e.photoCount}장
                </p>
                {e.action && (
                  <p className="mt-1.5 text-[11px] text-gray-600 bg-gray-50 rounded-lg px-2.5 py-1.5">
                    {e.action}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {target && (
        <ConfirmSheet
          event={target}
          confirmedBy={user?.name ?? '반장'}
          onClose={() => setTarget(null)}
        />
      )}
    </div>
  )
}

function Row({
  label,
  value,
  danger,
  mono,
}: {
  label: string
  value: string
  danger?: boolean
  mono?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-[11px] text-gray-400 shrink-0">{label}</dt>
      <dd
        className={`text-[11px] font-bold text-right truncate ${
          danger ? 'text-red-600' : 'text-gray-700'
        } ${mono ? 'tabular-nums tracking-tight' : ''}`}
      >
        {value}
      </dd>
    </div>
  )
}

// ---------------------------------------------------------------------------
// 확인 완료 처리 — 데이터 확인 → 사진 촬영(필수) → 조치 내용 → 전송
// ---------------------------------------------------------------------------
function ConfirmSheet({
  event,
  confirmedBy,
  onClose,
}: {
  event: AndonEvent
  confirmedBy: string
  onClose: () => void
}) {
  const confirm = useAndonStore((s) => s.confirm)
  const [photos, setPhotos] = useState<string[]>([])
  const [action, setAction] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const add = (url: string) =>
    setPhotos((p) => (p.length >= MAX_CONFIRM_PHOTOS ? p : [...p, url]))

  const submit = async () => {
    if (photos.length === 0 || submitting) return
    setSubmitting(true)
    setError('')
    try {
      await confirm(event.id, { confirmedBy, action: action.trim(), photos })
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : '확인 완료 처리에 실패했습니다.')
      setSubmitting(false)
    }
  }

  return (
    // 디바이스 프레임(#root) 안에만 덮이도록 absolute — fixed면 브라우저 전체를 채운다
    <div className="absolute inset-0 z-[100] flex flex-col bg-white">
      <header className="shrink-0 border-b border-gray-100 flex items-center h-13 px-3 gap-2" style={{ height: '52px' }}>
        <button onClick={onClose} className="p-1 -ml-1 text-gray-800">
          <X size={22} />
        </button>
        <h1 className="flex-1 text-center text-[16px] font-bold text-gray-900">
          확인 완료 처리
        </h1>
        <div className="w-8" />
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* 1. 발생 데이터 확인 */}
        <section>
          <p className="text-xs font-bold text-gray-400 mb-2 px-1">1. 발생 데이터 확인</p>
          <dl className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 space-y-2">
            <SheetRow label="안돈 유형" value={event.typeLabel} />
            <SheetRow label="감지 내용" value={event.detail} strong />
            <SheetRow label="발생 반" value={`${event.line} · ${event.lineNo}`} />
            <SheetRow label="설비" value={event.equipment} />
            <SheetRow label="품목" value={event.product} />
            <SheetRow label="로트번호" value={event.lotNo} />
            <SheetRow
              label={event.metricLabel}
              value={`${event.metricValue}${event.metricUnit ? ` ${event.metricUnit}` : ''}`}
              strong
            />
            <SheetRow label="관리 기준" value={event.spec} />
            <SheetRow label="발생 시각" value={hhmmss(event.occurredAt)} />
            <SheetRow label="발생 경로" value={event.source} />
          </dl>
        </section>

        {/* 2. 사진 (필수) */}
        <section>
          <div className="flex items-center gap-1.5 mb-2 px-1">
            <p className="text-xs font-bold text-gray-400">2. 확인 사진</p>
            <span className="text-[10px] font-bold text-red-500">필수</span>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3.5">
            <div className="flex gap-2">
              <button
                onClick={() => openCamera(add)}
                className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-green-900 text-white text-sm font-bold active:bg-green-800"
              >
                <Camera size={15} /> 촬영
              </button>
              <button
                onClick={() => openGallery(add)}
                className="px-4 py-3 rounded-xl border border-gray-200 text-gray-500 text-sm font-bold active:bg-gray-50"
              >
                갤러리
              </button>
            </div>

            {photos.length > 0 ? (
              <div className="flex gap-2 flex-wrap mt-3">
                {photos.map((src, i) => (
                  <div
                    key={i}
                    className="relative w-16 h-16 rounded-xl overflow-hidden border border-gray-200"
                  >
                    <img src={src} alt={`확인 사진 ${i + 1}`} className="w-full h-full object-cover" />
                    <button
                      onClick={() => setPhotos((p) => p.filter((_, idx) => idx !== i))}
                      className="absolute top-0 right-0 bg-black/60 text-white rounded-bl-md p-0.5"
                    >
                      <X size={11} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-gray-400 mt-2.5">
                조치한 상태를 촬영해야 확인 완료 처리가 됩니다 (최대 {MAX_CONFIRM_PHOTOS}장)
              </p>
            )}
          </div>
        </section>

        {/* 3. 조치 내용 */}
        <section>
          <p className="text-xs font-bold text-gray-400 mb-2 px-1">3. 조치 내용</p>
          <textarea
            value={action}
            onChange={(e) => setAction(e.target.value)}
            rows={3}
            placeholder="예) 라인 정지 후 해당 제품 폐기, 설비 청소 완료"
            className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none focus:border-green-800 resize-none"
          />
        </section>

        {error && (
          <p className="text-xs font-bold text-red-500 text-center">{error}</p>
        )}
      </div>

      <div className="shrink-0 border-t border-gray-100 px-4 py-3 pb-5">
        <p className="text-[11px] text-gray-400 text-center mb-2">
          확인자 <span className="font-bold text-gray-600">{confirmedBy}</span>
        </p>
        <button
          onClick={submit}
          disabled={photos.length === 0 || submitting}
          className={`w-full py-4 rounded-2xl text-sm font-bold transition-colors ${
            photos.length === 0 || submitting
              ? 'bg-gray-100 text-gray-300'
              : 'bg-green-900 text-white active:bg-green-800'
          }`}
        >
          {submitting
            ? '처리 중…'
            : photos.length === 0
              ? '사진을 먼저 촬영해 주세요'
              : '확인 완료 처리'}
        </button>
      </div>
    </div>
  )
}

function SheetRow({
  label,
  value,
  strong,
}: {
  label: string
  value: string
  strong?: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-xs text-gray-400 shrink-0">{label}</dt>
      <dd
        className={`text-xs text-right ${
          strong ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'
        }`}
      >
        {value}
      </dd>
    </div>
  )
}
