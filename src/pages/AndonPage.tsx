import { useEffect, useMemo, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  ScanLine,
  ShieldCheck,
  Upload,
  X,
} from 'lucide-react'
import TopBar from '@/components/TopBar'
import { isOffice, useAuthStore } from '@/store/authStore'
import {
  useAndonStore,
  reportedEventsOfType,
  confirmedEventsOfType,
} from '@/store/andonStore'
import {
  ANDON_SLUG_TO_TYPE,
  fetchAndonEventDetail,
  type AndonEvent,
  type AndonJudgement,
} from '@/api/andon'
import { openCamera, openGallery } from '@/utils/photoUtils'

const MAX_PHOTOS = 5

const hhmm = (iso: string) =>
  new Date(iso).toLocaleString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

/**
 * 안돈 화면.
 *
 * 반장(카카오 로그인)
 *   화면에 발생 내역을 늘어놓지 않는다. 안돈은 현장에서 눈으로 본다.
 *   단말에서는 **[이슈 올리기]** 하나로 끝난다 — 바코드 스캔 → 사진 → 내용 → 저장.
 *
 * 사무관리자(이메일 로그인)
 *   올라온 이슈를 **확인 / 이슈 있음(메모)** 으로 종결한다.
 */
export default function AndonPage() {
  const { slug } = useParams()
  const typeId = ANDON_SLUG_TO_TYPE[slug ?? '']

  const { types, events, offline, loaded, refresh } = useAndonStore()
  const user = useAuthStore((s) => s.user)
  const office = isOffice(user?.role)

  const [issueOpen, setIssueOpen] = useState(false)
  const [confirmTarget, setConfirmTarget] = useState<AndonEvent | null>(null)

  useEffect(() => {
    refresh()
  }, [refresh])

  const type = useMemo(() => types.find((t) => t.id === typeId), [types, typeId])
  const waiting = useMemo(
    () => (typeId ? reportedEventsOfType(events, typeId) : []),
    [events, typeId]
  )
  const done = useMemo(
    () => (typeId ? confirmedEventsOfType(events, typeId) : []),
    [events, typeId]
  )

  if (!typeId) return <Navigate to="/menu" replace />

  return (
    <div className="flex flex-col bg-gray-50 min-h-full">
      <TopBar title={type?.label ?? '안돈'} showBack backTo="/menu" />

      {offline && (
        <div className="mx-4 mt-3 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2.5">
          <p className="text-[16px] font-bold text-amber-700">
            MES 서버(:4000)에 연결되지 않았습니다
          </p>
        </div>
      )}

      {office ? (
        // ── 사무관리자: 확인 대기 → 확인 / 이슈 있음 ─────────────────────
        <>
          <div className="screen-x pt-4">
            <div className="flex items-center justify-between mb-2 px-1">
              <p className="text-xs font-bold text-gray-400">확인 대기</p>
              <span
                className={`text-xs font-bold ${waiting.length ? 'text-red-500' : 'text-gray-400'}`}
              >
                {waiting.length}건
              </span>
            </div>

            {waiting.length === 0 ? (
              <div className="rounded-2xl border border-gray-200 bg-white py-10 flex flex-col items-center gap-2">
                <CheckCircle2 size={26} className="text-green-700" />
                <p className="text-sm font-bold text-gray-700">확인할 이슈가 없습니다</p>
                <p className="text-[16px] text-gray-400">
                  {loaded ? '반장이 올리면 여기에 표시됩니다' : '불러오는 중…'}
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {waiting.map((e) => (
                  <div
                    key={e.id}
                    className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3.5"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <AlertTriangle size={15} className="text-amber-600 shrink-0" />
                        <p className="text-sm font-bold text-gray-800 truncate">
                          {e.reportedBy ?? '반장'} 보고
                        </p>
                      </div>
                      <p className="text-[16px] font-bold text-gray-500 shrink-0 tabular-nums">
                        {e.reportedAt ? hhmm(e.reportedAt) : '-'}
                      </p>
                    </div>

                    <p className="text-sm text-gray-800 bg-white rounded-xl px-3 py-2.5 mb-2">
                      {e.reportNote || '내용 없음'}
                    </p>
                    <p className="text-[16px] text-gray-500 mb-2.5 tabular-nums">
                      바코드 {e.barcode || '-'} · 사진 {e.reportPhotoCount ?? 0}장
                    </p>

                    <button
                      onClick={() => setConfirmTarget(e)}
                      className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl bg-green-900 text-white text-sm font-bold active:bg-green-800"
                    >
                      <ShieldCheck size={15} /> 확인 처리
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <HistoryList items={done} />
        </>
      ) : (
        // ── 반장: 이슈 올리기 버튼 하나 ───────────────────────────────────
        <>
          <div className="screen-x pt-5">
            <button
              onClick={() => setIssueOpen(true)}
              className="w-full flex flex-col items-center justify-center gap-2 py-8 rounded-2xl bg-red-500 text-white active:bg-red-600"
            >
              <Upload size={28} />
              <span className="text-[22px] font-bold">이슈 올리기</span>
              <span className="text-[16px] opacity-90">바코드 · 사진 · 내용</span>
            </button>
            <p className="text-[16px] text-gray-400 text-center mt-3 leading-relaxed">
              현장에서 확인한 이슈를 올리면 사무관리자가 확인합니다.
              <br />
              확인 완료 처리는 사무관리자만 합니다.
            </p>
          </div>

          <div className="screen-x pt-6">
            <div className="flex items-center justify-between mb-2 px-1">
              <p className="text-xs font-bold text-gray-400">올린 이슈 · 확인 대기</p>
              <span className="text-xs font-bold text-gray-400">{waiting.length}건</span>
            </div>
            {waiting.length === 0 ? (
              <p className="text-[16px] text-gray-400 px-1 py-2">확인 대기 중인 이슈가 없습니다</p>
            ) : (
              <div className="space-y-2">
                {waiting.map((e) => (
                  <IssueRow key={e.id} event={e} />
                ))}
              </div>
            )}
          </div>

          <HistoryList items={done} />
        </>
      )}

      {issueOpen && (
        <IssueSheet
          typeId={typeId}
          typeLabel={type?.label ?? '안돈'}
          reportedBy={user?.name ?? '반장'}
          onClose={() => setIssueOpen(false)}
        />
      )}
      {confirmTarget && (
        <ConfirmSheet
          event={confirmTarget}
          confirmedBy={user?.name ?? '사무관리자'}
          onClose={() => setConfirmTarget(null)}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// 목록 조각 — 한 줄로만 보여준다 (카드에 발생 데이터를 늘어놓지 않는다)
// ---------------------------------------------------------------------------

function IssueRow({ event }: { event: AndonEvent }) {
  const confirmed = event.status === 'CONFIRMED'
  const issue = event.judgement === 'ISSUE'
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-3.5 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[17px] font-bold text-gray-800 truncate">
          {event.reportNote || '내용 없음'}
        </p>
        <span
          className={`text-[14px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
            !confirmed
              ? 'bg-amber-100 text-amber-800'
              : issue
                ? 'bg-red-100 text-red-700'
                : 'bg-green-100 text-green-800'
          }`}
        >
          {!confirmed ? '확인 대기' : issue ? '이슈 있음' : '확인'}
        </span>
      </div>
      <p className="text-[16px] text-gray-400 mt-0.5 tabular-nums">
        {event.reportedAt ? hhmm(event.reportedAt) : '-'} · {event.reportedBy ?? '-'} ·{' '}
        {event.barcode || '바코드 없음'} · 사진 {event.reportPhotoCount ?? 0}장
      </p>
      {confirmed && event.issueNote && (
        <p className="text-[16px] text-red-600 mt-1">메모 · {event.issueNote}</p>
      )}
    </div>
  )
}

function HistoryList({ items }: { items: AndonEvent[] }) {
  return (
    <div className="screen-x py-6">
      <p className="text-xs font-bold text-gray-400 mb-2 px-1">처리 완료</p>
      {items.length === 0 ? (
        <p className="text-[16px] text-gray-400 px-1 py-2">처리 완료 이력이 없습니다</p>
      ) : (
        <div className="space-y-2">
          {items.map((e) => (
            <IssueRow key={e.id} event={e} />
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// 공통 시트 껍데기
// ---------------------------------------------------------------------------

function SheetShell({
  title,
  onClose,
  children,
  footer,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
  footer: React.ReactNode
}) {
  return (
    // 디바이스 프레임(#root) 안에만 덮이도록 absolute — fixed면 브라우저 전체를 채운다
    <div className="absolute inset-0 z-[100] flex flex-col bg-white">
      <header
        className="shrink-0 border-b border-gray-100 flex items-center px-3 gap-2"
        style={{ height: '52px' }}
      >
        <button onClick={onClose} className="p-1 -ml-1 text-gray-800">
          <X size={22} />
        </button>
        <h1 className="flex-1 text-center text-[21px] font-bold text-gray-900">{title}</h1>
        <div className="w-8" />
      </header>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">{children}</div>
      <div className="shrink-0 border-t border-gray-100 px-4 py-3 pb-5">{footer}</div>
    </div>
  )
}

function PhotoPicker({
  photos,
  setPhotos,
}: {
  photos: string[]
  setPhotos: React.Dispatch<React.SetStateAction<string[]>>
}) {
  const add = (url: string) =>
    setPhotos((p) => (p.length >= MAX_PHOTOS ? p : [...p, url]))

  return (
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
              <img src={src} alt={`사진 ${i + 1}`} className="w-full h-full object-cover" />
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
        <p className="text-[16px] text-gray-400 mt-2.5">
          이슈 상태를 촬영해 주세요 (최대 {MAX_PHOTOS}장)
        </p>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// 반장 — 이슈 올리기: 바코드 스캔 → 사진 → 내용 → 저장
// ---------------------------------------------------------------------------
function IssueSheet({
  typeId,
  typeLabel,
  reportedBy,
  onClose,
}: {
  typeId: AndonEvent['typeId']
  typeLabel: string
  reportedBy: string
  onClose: () => void
}) {
  const raiseIssue = useAndonStore((s) => s.raiseIssue)
  const [barcode, setBarcode] = useState('')
  const [photos, setPhotos] = useState<string[]>([])
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const ready = barcode.trim() !== '' && photos.length > 0 && note.trim() !== ''

  // 실기기에서는 스캐너 입력을 받는다. 여기서는 모의로 채운다.
  const scan = () =>
    setBarcode(`880${String(Date.now()).slice(-10)}`)

  const submit = async () => {
    if (!ready || submitting) return
    setSubmitting(true)
    setError('')
    try {
      await raiseIssue({ typeId, reportedBy, barcode: barcode.trim(), note: note.trim(), photos })
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : '이슈를 올리지 못했습니다.')
      setSubmitting(false)
    }
  }

  return (
    <SheetShell
      title={`${typeLabel} 이슈 올리기`}
      onClose={onClose}
      footer={
        <>
          <p className="text-[16px] text-gray-400 text-center mb-2">
            작성자 <span className="font-bold text-gray-600">{reportedBy}</span> · 확인은
            사무관리자가 합니다
          </p>
          <button
            onClick={submit}
            disabled={!ready || submitting}
            className={`w-full py-4 rounded-2xl text-sm font-bold transition-colors ${
              !ready || submitting
                ? 'bg-gray-100 text-gray-300'
                : 'bg-green-900 text-white active:bg-green-800'
            }`}
          >
            {submitting
              ? '올리는 중…'
              : !barcode.trim()
                ? '바코드를 스캔해 주세요'
                : photos.length === 0
                  ? '사진을 촬영해 주세요'
                  : !note.trim()
                    ? '내용을 입력해 주세요'
                    : '저장'}
          </button>
        </>
      }
    >
      <section>
        <div className="flex items-center gap-1.5 mb-2 px-1">
          <p className="text-xs font-bold text-gray-400">1. 바코드</p>
          <span className="text-[14px] font-bold text-red-500">필수</span>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3.5">
          <button
            onClick={scan}
            className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl bg-green-900 text-white text-sm font-bold active:bg-green-800"
          >
            <ScanLine size={15} /> 바코드 스캔
          </button>
          <input
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            inputMode="numeric"
            placeholder="스캔하거나 직접 입력"
            className="input-ds mt-2.5 tabular-nums"
          />
        </div>
      </section>

      <section>
        <div className="flex items-center gap-1.5 mb-2 px-1">
          <p className="text-xs font-bold text-gray-400">2. 사진</p>
          <span className="text-[14px] font-bold text-red-500">필수</span>
        </div>
        <PhotoPicker photos={photos} setPhotos={setPhotos} />
      </section>

      <section>
        <div className="flex items-center gap-1.5 mb-2 px-1">
          <p className="text-xs font-bold text-gray-400">3. 내용</p>
          <span className="text-[14px] font-bold text-red-500">필수</span>
        </div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={4}
          placeholder="예) 3라인 충전부에서 포장재 조각 확인, 해당 로트 라인 정지"
          className="textarea-ds"
        />
      </section>

      {error && <p className="text-xs font-bold text-red-500 text-center">{error}</p>}
    </SheetShell>
  )
}

// ---------------------------------------------------------------------------
// 사무관리자 — 확인 / 이슈 있음(메모)
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
  const [judgement, setJudgement] = useState<AndonJudgement | null>(null)
  const [issueNote, setIssueNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // 사진 본문(dataURL)은 목록에 없다. 확인 화면을 열 때 상세로 받아온다.
  const [photos, setPhotos] = useState<string[] | null>(null)
  const [zoom, setZoom] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    fetchAndonEventDetail(event.id)
      .then((res) => {
        if (alive) setPhotos(res.event.reportPhotos ?? [])
      })
      .catch(() => {
        if (alive) setPhotos([])
      })
    return () => {
      alive = false
    }
  }, [event.id])

  const issue = judgement === 'ISSUE'
  const ready = judgement === 'NO_ISSUE' || (issue && issueNote.trim().length > 0)

  const submit = async () => {
    if (!ready || submitting || !judgement) return
    setSubmitting(true)
    setError('')
    try {
      await confirm(event.id, {
        confirmedBy,
        judgement,
        issueNote: issue ? issueNote.trim() : '',
      })
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : '확인 처리에 실패했습니다.')
      setSubmitting(false)
    }
  }

  return (
    <SheetShell
      title="이슈 확인"
      onClose={onClose}
      footer={
        <>
          <p className="text-[16px] text-gray-400 text-center mb-2">
            확인자 <span className="font-bold text-gray-600">{confirmedBy}</span>
          </p>
          <button
            onClick={submit}
            disabled={!ready || submitting}
            className={`w-full py-4 rounded-2xl text-sm font-bold transition-colors ${
              !ready || submitting
                ? 'bg-gray-100 text-gray-300'
                : 'bg-green-900 text-white active:bg-green-800'
            }`}
          >
            {submitting
              ? '처리 중…'
              : !judgement
                ? '확인 / 이슈 있음을 선택해 주세요'
                : issue && !issueNote.trim()
                  ? '메모를 입력해 주세요'
                  : '처리 완료'}
          </button>
        </>
      }
    >
      <section>
        <p className="text-xs font-bold text-gray-400 mb-2 px-1">반장이 올린 이슈</p>
        <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 space-y-2">
          <SheetRow label="작성자" value={event.reportedBy ?? '-'} />
          <SheetRow label="올린 시각" value={event.reportedAt ? hhmm(event.reportedAt) : '-'} />
          <SheetRow label="바코드" value={event.barcode || '-'} />
          <SheetRow label="사진" value={`${event.reportPhotoCount ?? 0}장`} />
        </div>
        <p className="mt-2 text-sm text-gray-800 bg-white border border-gray-200 rounded-2xl px-4 py-3">
          {event.reportNote || '내용 없음'}
        </p>
      </section>

      {/* 반장이 올린 현장 사진 — 눌러서 크게 본다 */}
      <section>
        <p className="text-xs font-bold text-gray-400 mb-2 px-1">현장 사진</p>
        {photos === null ? (
          <p className="text-[16px] text-gray-400 px-1 py-3">사진 불러오는 중…</p>
        ) : photos.length === 0 ? (
          <p className="text-[16px] text-gray-400 px-1 py-3">첨부된 사진이 없습니다</p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {photos.map((src, i) => (
              <button
                key={i}
                onClick={() => setZoom(src)}
                className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-50"
              >
                <img
                  src={src}
                  alt={`현장 사진 ${i + 1}`}
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-0 right-0 bg-black/55 text-white text-[14px] font-bold px-1.5 py-0.5 rounded-tl-md">
                  {i + 1}
                </span>
              </button>
            ))}
          </div>
        )}
      </section>

      {zoom && (
        <div
          onClick={() => setZoom(null)}
          className="absolute inset-0 z-[110] bg-black/90 flex items-center justify-center p-4"
        >
          <img src={zoom} alt="현장 사진 크게 보기" className="max-w-full max-h-full object-contain" />
          <button
            onClick={(e) => {
              e.stopPropagation()
              setZoom(null)
            }}
            className="absolute top-3 right-3 text-white p-1"
          >
            <X size={24} />
          </button>
        </div>
      )}

      <section>
        <div className="flex items-center gap-1.5 mb-2 px-1">
          <p className="text-xs font-bold text-gray-400">확인 결과</p>
          <span className="text-[14px] font-bold text-red-500">필수</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setJudgement('NO_ISSUE')}
            className={`py-4 rounded-2xl text-sm font-bold border transition-colors ${
              judgement === 'NO_ISSUE'
                ? 'bg-green-900 text-white border-green-900'
                : 'bg-white text-gray-600 border-gray-200'
            }`}
          >
            확인
          </button>
          <button
            onClick={() => setJudgement('ISSUE')}
            className={`py-4 rounded-2xl text-sm font-bold border transition-colors ${
              issue ? 'bg-red-500 text-white border-red-500' : 'bg-white text-gray-600 border-gray-200'
            }`}
          >
            이슈 있음
          </button>
        </div>
      </section>

      {issue && (
        <section>
          <div className="flex items-center gap-1.5 mb-2 px-1">
            <p className="text-xs font-bold text-gray-400">메모</p>
            <span className="text-[14px] font-bold text-red-500">필수</span>
          </div>
          <textarea
            value={issueNote}
            onChange={(e) => setIssueNote(e.target.value)}
            rows={4}
            placeholder="예) 동일 라인 금주 3회째 — 설비 점검 요청"
            className="textarea-ds"
          />
        </section>
      )}

      {error && <p className="text-xs font-bold text-red-500 text-center">{error}</p>}
    </SheetShell>
  )
}

function SheetRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-xs text-gray-400 shrink-0">{label}</dt>
      <dd className="text-xs font-semibold text-gray-700 text-right">{value}</dd>
    </div>
  )
}
