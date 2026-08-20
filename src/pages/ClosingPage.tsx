import { useState, useRef } from 'react'
import { QrCode, Camera, ImagePlus, X, ChevronLeft, ChevronRight, MessageSquare, Lock, CheckCircle2, ScanLine } from 'lucide-react'
import TopBar from '@/components/TopBar'
import CategorySection from '@/components/closing/CategorySection'
import HaccpChecklists from '@/components/closing/HaccpChecklists'
import type { CheckAnswer, ClosingCheckRecord, Checkpoint, WorkPhase } from '@/types/closingCheck'
import { WORK_PHASES, emptyPhaseMap } from '@/types/closingCheck'
import { CHECKPOINTS, resolvePhase } from '@/constants/checklistData'
import { useAutoSaveDraft, loadDraft, clearDraft } from '@/hooks/useClosingCheckDraft'
import { useClosingCheckSubmit } from '@/hooks/useClosingCheckSubmit'
import { openCamera, openGallery, removePhoto, MAX_PHOTOS } from '@/utils/photoUtils'

type Step = 'list' | 'form'

function nowTimestamp(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function makeRecord(cp: Checkpoint): ClosingCheckRecord {
  return {
    id: Date.now().toString(),
    date: nowTimestamp(),
    sectionId: cp.id,
    qrData: cp.qrCode,
    photosByPhase: emptyPhaseMap<string[]>(() => []),
    answers: [],
    notesByPhase: emptyPhaseMap<string>(() => ''),
  }
}

function isAnswered(answer: CheckAnswer | undefined): boolean {
  if (!answer) return false
  const v = answer.value
  if (v === null || v === undefined) return false
  if (typeof v === 'string') return v !== ''
  if (typeof v === 'number') return true
  if (typeof v === 'object') return Object.values(v).some((x) => x !== null && x !== undefined)
  return false
}

// ── 점표 목록 (스캔 전용) ─────────────────────────────────────────────
// 모든 점표가 처음부터 깔려 있고, QR 스캔으로 매칭되는 점표만 활성화된다.
// 스캔 전 점표는 잠김 상태로, 직접 탭으로 열 수 없다. (선택 불가, 스캔 전용)
function ListStep({
  completedIds,
  onScan,
  onReopen,
}: {
  completedIds: Set<string>
  onScan: (qrCode: string) => void
  onReopen: (cp: Checkpoint) => void
}) {
  const qrInputRef = useRef<HTMLInputElement>(null)
  const [qrInput, setQrInput] = useState('')
  const [scanning, setScanning] = useState(false)
  const [scanError, setScanError] = useState('')
  const [tab, setTab] = useState<'closing' | 'haccp'>('closing')

  const submitScan = (raw: string) => {
    const code = raw.trim()
    if (!code) return
    const matched = CHECKPOINTS.find((c) => c.qrCode === code)
    if (!matched) {
      setScanError('일치하는 점표가 없습니다. QR을 다시 확인하세요.')
      setTimeout(() => setScanError(''), 2500)
      return
    }
    setScanError('')
    setScanning(false)
    setQrInput('')
    onScan(code)
  }

  const startScan = () => {
    setScanning(true)
    setTimeout(() => qrInputRef.current?.focus(), 50)
  }

  const doneCount = CHECKPOINTS.filter((c) => completedIds.has(c.id)).length

  return (
    <div className="flex flex-col bg-gray-50 min-h-full">
      <TopBar title="현장 점검" showBack backTo="/menu" />

      {/* 현장점검표 / HACCP 점검표 탭 */}
      <div className="flex px-4 pt-3 gap-2">
        {([['closing', '현장점검표'], ['haccp', 'HACCP 점검표']] as const).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`flex-1 py-2.5 rounded-xl text-[17px] font-bold border transition-colors ${
              tab === k ? 'bg-green-900 text-white border-green-900' : 'bg-white text-gray-500 border-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'haccp' && <HaccpChecklists />}

      {tab === 'closing' && (
      <div className="screen-x py-4 space-y-3">
        {/* QR 스캔 진입 */}
        <button
          onClick={startScan}
          className="w-full flex items-center justify-center gap-2 py-4 bg-green-900 text-white rounded-2xl text-[19px] font-bold active:bg-green-800"
        >
          <ScanLine size={18} />
          QR 스캔하기
        </button>
        {scanning && (
          <input
            ref={qrInputRef}
            value={qrInput}
            onChange={(e) => setQrInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submitScan(qrInput)
            }}
            onBlur={() => setScanning(false)}
            className="opacity-0 h-0 w-0 absolute"
            autoComplete="off"
          />
        )}

        <div className="flex items-center justify-between px-1">
          <p className="text-xs font-bold text-gray-400">점표 목록</p>
          <p className="text-xs font-bold text-gray-500">{doneCount}/{CHECKPOINTS.length} 완료</p>
        </div>

        <div className="space-y-2">
          {CHECKPOINTS.map((cp) => {
            const done = completedIds.has(cp.id)
            return (
              <div
                key={cp.id}
                className={`bg-white rounded-2xl border p-4 ${done ? 'border-green-200' : 'border-gray-200'}`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${
                      done ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {done ? <CheckCircle2 size={20} /> : <Lock size={18} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{cp.name}</p>
                    <p className="text-[16px] text-gray-400 truncate">{cp.location} · {cp.qrCode}</p>
                  </div>
                  {done ? (
                    <button
                      onClick={() => onReopen(cp)}
                      className="shrink-0 px-3 py-2 rounded-xl text-xs font-bold text-green-800 bg-green-50 active:bg-green-100"
                    >
                      완료 · 보기
                    </button>
                  ) : (
                    // 실제 운영: QR 스캔으로만 활성화. 모의 스캔 버튼은 개발/테스트용.
                    <button
                      onClick={() => onScan(cp.qrCode)}
                      className="shrink-0 flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-gray-500 border border-gray-200 active:bg-gray-50"
                    >
                      <QrCode size={13} />
                      스캔
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
      )}

      {scanError && (
        <div className="absolute bottom-24 left-4 right-4 bg-gray-800 text-white text-sm text-center py-3 rounded-2xl z-50">
          {scanError}
        </div>
      )}
    </div>
  )
}

// ── 점표 입력 화면 (점표별 스키마에 따라 렌더) ────────────────────────
function FormStep({
  checkpoint,
  answers,
  photosByPhase,
  notesByPhase,
  onAnswerChange,
  onAddPhoto,
  onRemovePhoto,
  onNoteChange,
  onBack,
  onCancel,
  onSubmit,
  submitting,
}: {
  checkpoint: Checkpoint
  answers: CheckAnswer[]
  photosByPhase: Record<WorkPhase, string[]>
  notesByPhase: Record<WorkPhase, string>
  onAnswerChange: (a: CheckAnswer) => void
  onAddPhoto: (phase: WorkPhase, url: string) => void
  onRemovePhoto: (phase: WorkPhase, i: number) => void
  onNoteChange: (phase: WorkPhase, v: string) => void
  onBack: () => void
  onCancel: () => void
  onSubmit: () => void
  submitting: boolean
}) {
  const [photoToast, setPhotoToast] = useState('')
  // null이면 단계 선택 화면, 값이 있으면 해당 단계 항목 입력 화면
  const [selectedPhase, setSelectedPhase] = useState<WorkPhase | null>(null)

  const totalItems = checkpoint.items.length
  const answeredItems = checkpoint.items.filter((item) =>
    isAnswered(answers.find((a) => a.itemId === item.id))
  ).length

  // 단계별 항목/진행도
  const itemsOfPhase = (p: WorkPhase) => checkpoint.items.filter((i) => resolvePhase(i) === p)
  const answeredOfPhase = (p: WorkPhase) =>
    itemsOfPhase(p).filter((i) => isAnswered(answers.find((a) => a.itemId === i.id))).length

  const PHASE_ACCENT: Record<WorkPhase, string> = {
    작업전: 'bg-amber-50 text-amber-700 border-amber-200',
    작업중: 'bg-green-50 text-green-800 border-green-200',
    작업후: 'bg-blue-50 text-blue-700 border-blue-200',
  }

  const handleAddPhoto = (phase: WorkPhase, url: string) => {
    if (photosByPhase[phase].length >= MAX_PHOTOS) {
      setPhotoToast(`사진은 최대 ${MAX_PHOTOS}장까지 추가할 수 있습니다`)
      setTimeout(() => setPhotoToast(''), 2500)
      return
    }
    onAddPhoto(phase, url)
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* 헤더 — 단계 항목 화면에선 단계 선택으로, 아니면 점표 목록으로 복귀 */}
      <div className="bg-white border-b border-gray-100 shrink-0">
        <div className="flex items-center px-3" style={{ height: '52px' }}>
          <button
            onClick={() => (selectedPhase ? setSelectedPhase(null) : onBack())}
            className="p-1 -ml-1 text-gray-800"
          >
            <ChevronLeft size={24} strokeWidth={2} />
          </button>
          <div className="flex-1 text-center">
            <p className="text-[21px] font-bold text-gray-900">
              {checkpoint.name}
              {selectedPhase && <span className="text-gray-400 font-medium"> · {selectedPhase}</span>}
            </p>
            <p className="text-[16px] text-gray-400">{answeredItems}/{totalItems} 완료 · {checkpoint.qrCode}</p>
          </div>
          <div className="w-8" />
        </div>
      </div>

      {/* 스크롤 콘텐츠 */}
      <div className="flex-1 overflow-y-auto pb-4">
        {selectedPhase === null ? (
          /* ── 단계 선택 박스 (작업전 / 작업중 / 작업후) ── */
          <div className="screen-x pt-4 pb-1 space-y-2.5">
            <p className="text-xs font-bold text-gray-400 mb-1">점검할 단계를 선택하세요</p>
            {WORK_PHASES.map((p) => {
              const its = itemsOfPhase(p)
              const done = answeredOfPhase(p)
              const complete = its.length > 0 && done === its.length
              return (
                <button
                  key={p}
                  onClick={() => setSelectedPhase(p)}
                  disabled={its.length === 0}
                  className={`w-full flex items-center gap-3 p-4 rounded-2xl border bg-white text-left active:bg-gray-50 disabled:opacity-40 ${
                    complete ? 'border-green-300' : 'border-gray-200'
                  }`}
                >
                  <span className={`shrink-0 px-3 py-1.5 rounded-xl text-sm font-bold border ${PHASE_ACCENT[p]}`}>{p}</span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-bold text-gray-900">{p} 점검</span>
                    <span className="block text-xs text-gray-400 mt-0.5">
                      {its.length}개 항목{its.length > 0 && ` · ${done}/${its.length} 완료`}
                    </span>
                  </span>
                  {complete && <CheckCircle2 size={18} className="text-green-600 shrink-0" />}
                  <ChevronRight size={20} className="text-gray-300 shrink-0" />
                </button>
              )
            })}
          </div>
        ) : (
          /* ── 선택한 단계: 점검 항목 + 사진 등록 + 특이사항 (단계별) ── */
          <>
            {itemsOfPhase(selectedPhase).length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-10">{selectedPhase} 단계 항목이 없습니다.</p>
            ) : (
              <CategorySection
                category={selectedPhase}
                items={itemsOfPhase(selectedPhase)}
                answers={answers}
                onAnswerChange={onAnswerChange}
              />
            )}

            {/* 사진 등록 (이 단계) */}
            <div className="mx-4 mt-3 mb-3 bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Camera size={16} className="text-green-900" />
                  <span className="text-sm font-bold text-gray-900">사진 등록</span>
                </div>
                <span className="text-xs text-gray-400">{photosByPhase[selectedPhase].length}/{MAX_PHOTOS}</span>
              </div>
              <div className="p-3 space-y-3">
                <div className="flex gap-2">
                  <button
                    onClick={() => openCamera((url) => handleAddPhoto(selectedPhase, url))}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-600 text-sm font-bold active:bg-gray-100"
                  >
                    <Camera size={16} className="text-green-900" />
                    카메라
                  </button>
                  <button
                    onClick={() => openGallery((url) => handleAddPhoto(selectedPhase, url))}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-600 text-sm font-bold active:bg-gray-100"
                  >
                    <ImagePlus size={16} className="text-green-900" />
                    갤러리
                  </button>
                </div>
                {photosByPhase[selectedPhase].length > 0 && (
                  <div className="grid grid-cols-4 gap-1.5">
                    {photosByPhase[selectedPhase].map((src, i) => (
                      <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                        <img src={src} alt={`사진 ${i + 1}`} className="w-full h-full object-cover" />
                        <button
                          onClick={() => onRemovePhoto(selectedPhase, i)}
                          className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 특이사항 (이 단계) */}
            <div className="mx-4 mb-2 bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
                <MessageSquare size={16} className="text-green-900" />
                <span className="text-sm font-bold text-gray-900">특이사항</span>
                <span className="text-xs text-gray-400">(선택)</span>
              </div>
              <div className="p-3">
                <textarea
                  value={notesByPhase[selectedPhase]}
                  onChange={(e) => onNoteChange(selectedPhase, e.target.value)}
                  placeholder="특이사항을 입력하세요"
                  rows={3}
                  className="w-full text-sm resize-none focus:outline-none text-gray-800 placeholder-gray-400 bg-transparent"
                />
              </div>
            </div>
          </>
        )}
      </div>

      {photoToast && (
        <div className="absolute bottom-24 left-4 right-4 bg-gray-800 text-white text-sm text-center py-3 rounded-2xl z-50">
          {photoToast}
        </div>
      )}

      {/* 하단 버튼 — 단계 항목 화면에서만 표시. 단계 선택 화면에는 없음 */}
      {selectedPhase !== null && (
        <div className="shrink-0 px-4 pt-3 pb-6 bg-white border-t border-gray-100 flex gap-2">
          <button
            onClick={onCancel}
            className="flex-none px-5 py-4 border border-gray-300 text-gray-600 rounded-2xl text-[19px] font-bold active:bg-gray-50"
          >
            취소
          </button>
          <button
            onClick={onSubmit}
            disabled={submitting}
            className="flex-1 py-4 bg-green-900 disabled:bg-gray-300 text-white rounded-2xl text-[19px] font-bold active:bg-green-800"
          >
            {submitting ? '제출 중...' : '점검 완료'}
          </button>
        </div>
      )}
    </div>
  )
}

// ── 취소 확인 모달 ────────────────────────────────────────────────────
function CancelConfirmModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center px-6">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative bg-white rounded-3xl px-6 py-6 w-full max-w-sm shadow-2xl">
        <p className="text-base font-bold text-gray-900 text-center mb-1">점표 입력 취소</p>
        <p className="text-sm text-gray-500 text-center mb-6">정말 취소하시겠습니까?<br/>입력한 내용은 저장되지 않습니다.</p>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-3.5 rounded-2xl border border-gray-200 text-sm font-bold text-gray-600 active:bg-gray-50"
          >
            계속 작성
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3.5 rounded-2xl bg-red-500 text-sm font-bold text-white active:bg-red-600"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  )
}

// ── 메인 ─────────────────────────────────────────────────────────────
export default function ClosingPage() {
  const [step, setStep] = useState<Step>('list')
  const [activeCheckpoint, setActiveCheckpoint] = useState<Checkpoint | null>(null)
  const [record, setRecord] = useState<ClosingCheckRecord | null>(null)
  const [completedRecords, setCompletedRecords] = useState<ClosingCheckRecord[]>([])
  const [toast, setToast] = useState(false)
  const [cancelConfirm, setCancelConfirm] = useState(false)
  const { submit, submitting } = useClosingCheckSubmit()

  const completedIds = new Set(completedRecords.map((r) => r.sectionId))

  // 자동 임시저장 (점표 활성화 중에만)
  useAutoSaveDraft(activeCheckpoint?.id ?? '', record?.answers ?? [])

  // 점표 활성화: 스캔(또는 모의 스캔)으로 매칭된 점표만 입력 화면 진입
  const activateCheckpoint = (cp: Checkpoint) => {
    const existing = completedRecords.find((r) => r.sectionId === cp.id)
    if (existing) {
      setRecord(existing)
    } else {
      const draft = loadDraft(cp.id)
      const base = makeRecord(cp)
      setRecord(draft && draft.length > 0 ? { ...base, answers: draft } : base)
    }
    setActiveCheckpoint(cp)
    setStep('form')
  }

  const handleScan = (qrCode: string) => {
    const matched = CHECKPOINTS.find((c) => c.qrCode === qrCode)
    if (matched) activateCheckpoint(matched)
  }

  const updateAnswer = (answer: CheckAnswer) => {
    setRecord((prev) =>
      prev
        ? {
            ...prev,
            answers: prev.answers.some((a) => a.itemId === answer.itemId)
              ? prev.answers.map((a) => (a.itemId === answer.itemId ? answer : a))
              : [...prev.answers, answer],
          }
        : prev
    )
  }

  const goToList = () => {
    setStep('list')
    setActiveCheckpoint(null)
    setRecord(null)
  }

  const handleSubmit = async () => {
    if (!record) return
    const final = { ...record, submittedAt: new Date().toISOString() }
    await submit(final, () => {
      setCompletedRecords((prev) => [final, ...prev.filter((r) => r.sectionId !== final.sectionId)])
      clearDraft(final.sectionId)
      setToast(true)
      setTimeout(() => setToast(false), 2500)
      goToList()
    })
  }

  const handleCancelConfirm = () => {
    if (activeCheckpoint) clearDraft(activeCheckpoint.id)
    setCancelConfirm(false)
    goToList()
  }

  return (
    <>
      {step === 'list' && (
        <ListStep completedIds={completedIds} onScan={handleScan} onReopen={activateCheckpoint} />
      )}

      {step === 'form' && activeCheckpoint && record && (
        <FormStep
          checkpoint={activeCheckpoint}
          answers={record.answers}
          photosByPhase={record.photosByPhase}
          notesByPhase={record.notesByPhase}
          onAnswerChange={updateAnswer}
          onAddPhoto={(phase, url) =>
            setRecord((prev) =>
              prev ? { ...prev, photosByPhase: { ...prev.photosByPhase, [phase]: [...prev.photosByPhase[phase], url] } } : prev
            )
          }
          onRemovePhoto={(phase, i) =>
            setRecord((prev) =>
              prev ? { ...prev, photosByPhase: { ...prev.photosByPhase, [phase]: removePhoto(prev.photosByPhase[phase], i) } } : prev
            )
          }
          onNoteChange={(phase, v) =>
            setRecord((prev) => (prev ? { ...prev, notesByPhase: { ...prev.notesByPhase, [phase]: v } } : prev))
          }
          onBack={goToList}
          onCancel={() => setCancelConfirm(true)}
          onSubmit={handleSubmit}
          submitting={submitting}
        />
      )}

      {/* 취소 확인 모달 */}
      {cancelConfirm && (
        <CancelConfirmModal onConfirm={handleCancelConfirm} onCancel={() => setCancelConfirm(false)} />
      )}

      {/* 완료 토스트 */}
      {toast && (
        <div className="absolute bottom-24 left-4 right-4 z-50 flex items-center justify-center">
          <div className="bg-gray-900 text-white text-sm font-bold px-6 py-3.5 rounded-2xl shadow-lg">
            현장 점검이 완료되었습니다.
          </div>
        </div>
      )}
    </>
  )
}
