import { useState, useRef, useEffect } from 'react'
import TopBar from '@/components/TopBar'
import {
  QrCode,
  CheckCircle2,
  Clock,
  Scan,
  RotateCcw,
  ChevronLeft,
  ThumbsUp,
  ThumbsDown,
  Camera,
  ImagePlus,
  X,
} from 'lucide-react'
import { useBadgeStore } from '@/store/badgeStore'
import { REJECT_DISPOSITIONS, type Disposition } from '@/constants/inspectionData'
import { openCamera, openGallery, removePhoto as removePhotoUtil, MAX_PHOTOS } from '@/utils/photoUtils'

type InspectResult = 'pass' | 'reject'

interface KanbanItem {
  id: string
  code: string
  product: string
  qty: number
  team: string
  completedAt: string | null
  // 검수 결과 기록
  result?: InspectResult
  disposition?: Disposition // 불합격 처리 구분 (재조리/폐기)
  reasonType?: string // 불합격 사유 유형
  reason?: string // 합격 의견 / 불합격 상세 사유
}

const INITIAL_KANBANS: KanbanItem[] = [
  { id: '1', code: 'KB-1001', product: '된장찌개', qty: 30, team: '자재반', completedAt: null },
  { id: '2', code: 'KB-1002', product: '김치찌개', qty: 25, team: '자재반', completedAt: null },
  { id: '3', code: 'KB-1003', product: '불고기', qty: 20, team: '자재반', completedAt: null },
  { id: '4', code: 'KB-1004', product: '제육볶음', qty: 35, team: '전처리반', completedAt: null },
  { id: '5', code: 'KB-1005', product: '갈비탕', qty: 15, team: '전처리반', completedAt: null },
  { id: '6', code: 'KB-1006', product: '순두부찌개', qty: 28, team: '전처리반', completedAt: null },
  { id: '7', code: 'KB-1007', product: '닭볶음탕', qty: 22, team: '조리반', completedAt: null },
  { id: '8', code: 'KB-1008', product: '잡채', qty: 18, team: '조리반', completedAt: null },
  { id: '9', code: 'KB-1009', product: '비빔밥', qty: 40, team: '내포장반', completedAt: null },
  { id: '10', code: 'KB-1010', product: '오징어볶음', qty: 12, team: '외포장반', completedAt: null },
]

export default function InspectionPage() {
  const [items, setItems] = useState<KanbanItem[]>(INITIAL_KANBANS)
  const [scanInput, setScanInput] = useState('')
  const [scanFeedback, setScanFeedback] = useState<{ code: string; ok: boolean } | null>(null)
  const [tab, setTab] = useState<'pending' | 'done'>('pending')
  const inputRef = useRef<HTMLInputElement>(null)
  const setCount = useBadgeStore((s) => s.setCount)

  // 검수 분기 상태
  const [inspecting, setInspecting] = useState<KanbanItem | null>(null)
  const [result, setResult] = useState<InspectResult>('pass')
  const [passNote, setPassNote] = useState('')
  const [disposition, setDisposition] = useState<Disposition | null>(null)
  const [rejectType, setRejectType] = useState<string | null>(null)
  const [rejectText, setRejectText] = useState('')
  const [rejectPhotos, setRejectPhotos] = useState<string[]>([])
  const [previewSrc, setPreviewSrc] = useState<string | null>(null)
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  const openInspect = (item: KanbanItem) => {
    setInspecting(item)
    setResult('pass')
    setPassNote('')
    setDisposition(null)
    setRejectType(null)
    setRejectText('')
    setRejectPhotos([])
  }

  const closeInspect = () => setInspecting(null)

  const markDone = (id: string, patch: Partial<KanbanItem>) => {
    const now = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, completedAt: now, ...patch } : item)))
  }

  const cancelDone = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, completedAt: null, result: undefined, disposition: undefined, reasonType: undefined, reason: undefined }
          : item,
      ),
    )
  }

  // 합격 확정 → 의견 기록 후 다음 반으로 간반 전달 (완료 처리)
  const confirmPass = () => {
    if (!inspecting) return
    markDone(inspecting.id, { result: 'pass', reason: passNote.trim() || undefined })
    closeInspect()
    showToast('다음 반으로 전달되었습니다')
  }

  // 불합격 확정 → 처리 구분·사유 기록 후 검수 완료 처리
  const confirmReject = () => {
    if (!inspecting || !rejectValid || !disposition) return
    markDone(inspecting.id, {
      result: 'reject',
      disposition,
      reasonType: rejectType!,
      reason: rejectText.trim() || undefined,
    })
    closeInspect()
    showToast(`불합격 · ${disposition} 처리되었습니다`)
  }

  // 한 페이지에서 결과에 따라 확정
  const submitInspect = () => {
    if (result === 'pass') confirmPass()
    else confirmReject()
  }

  const addRejectPhoto = (url: string) => {
    setRejectPhotos((prev) => (prev.length >= MAX_PHOTOS ? prev : [...prev, url]))
  }

  const handleScan = (code: string) => {
    const trimmed = code.trim()
    if (!trimmed) return
    const target = items.find((i) => i.code === trimmed && !i.completedAt)
    if (target) {
      openInspect(target)
    } else {
      setScanFeedback({ code: trimmed, ok: false })
      setTimeout(() => setScanFeedback(null), 2000)
    }
    setScanInput('')
  }

  const pending = items.filter((i) => !i.completedAt)
  const done = items.filter((i) => i.completedAt)
  const displayed = tab === 'pending' ? pending : done

  useEffect(() => {
    setCount('/inspection', pending.length)
  }, [pending.length, setCount])

  // 선택된 처리 구분의 사유 유형 목록 / 현재 선택된 사유
  const dispositionGroup = REJECT_DISPOSITIONS.find((d) => d.key === disposition) ?? null
  const selectedReason = dispositionGroup?.reasons.find((r) => r.type === rejectType) ?? null
  // 유효성: 처리 구분 + 사유 유형 필수, "기타"는 상세 서술까지 필수
  const rejectValid =
    !!disposition && !!rejectType && (!selectedReason?.requireText || rejectText.trim().length > 0)

  return (
    <div className="relative flex flex-col bg-gray-50 min-h-full">
      <TopBar title="검수" showBack backTo="/menu" />

      {/* 통계 */}
      <div className="flex gap-3 px-4 py-3 bg-white border-b border-gray-100">
        <div className="flex-1 text-center py-2">
          <p className="text-2xl font-bold text-orange-500">{pending.length}</p>
          <p className="text-[16px] text-gray-400 mt-0.5">대기</p>
        </div>
        <div className="w-px bg-gray-100" />
        <div className="flex-1 text-center py-2">
          <p className="text-2xl font-bold text-green-800">{done.length}</p>
          <p className="text-[16px] text-gray-400 mt-0.5">완료</p>
        </div>
        <div className="w-px bg-gray-100" />
        <div className="flex-1 text-center py-2">
          <p className="text-2xl font-bold text-gray-700">{items.length}</p>
          <p className="text-[16px] text-gray-400 mt-0.5">전체</p>
        </div>
      </div>

      {/* 스캔 영역 */}
      <div className="screen-x pt-4 pb-2">
        <button
          type="button"
          onClick={() => inputRef.current?.focus()}
          className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border transition-colors ${
            scanInput
              ? 'bg-green-900 border-green-900 text-white'
              : 'bg-gray-100 border-gray-200 text-gray-400'
          }`}
        >
          <Scan size={20} className="shrink-0" />
          <span className="text-sm flex-1 text-left font-medium">
            {scanInput ? scanInput : '스캐너를 대거나 탭하여 입력'}
          </span>
          <QrCode size={18} className="opacity-50 shrink-0" />
        </button>
        <input
          ref={inputRef}
          value={scanInput}
          onChange={(e) => setScanInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleScan(scanInput)}
          className="opacity-0 h-0 w-0 absolute"
          autoComplete="off"
        />

        {scanFeedback && (
          <div className="mt-2 px-4 py-2.5 rounded-2xl text-sm font-bold text-center bg-red-100 text-red-600">
            ✗ {scanFeedback.code} — 없는 코드
          </div>
        )}
      </div>

      {/* 탭 */}
      <div className="flex px-4 gap-2 pb-3">
        {(['pending', 'done'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 rounded-2xl text-sm font-bold transition-colors ${
              tab === t ? 'bg-green-900 text-white' : 'bg-gray-100 text-gray-400'
            }`}
          >
            {t === 'pending' ? `대기 ${pending.length}` : `완료 ${done.length}`}
          </button>
        ))}
      </div>

      {/* 목록 */}
      <div className="screen-x pb-4 space-y-2">
        {displayed.length === 0 && (
          <p className="text-center text-gray-400 text-sm mt-10">
            {tab === 'pending' ? '대기 중인 간반이 없습니다' : '완료된 간반이 없습니다'}
          </p>
        )}

        {displayed.map((item) => (
          <div
            key={item.id}
            className={`bg-white rounded-2xl px-4 py-3.5 border flex items-center gap-3 ${
              item.completedAt ? 'border-green-100' : 'border-gray-200'
            }`}
          >
            <div className="shrink-0">
              {!item.completedAt ? (
                <Clock size={18} className="text-orange-400" />
              ) : item.result === 'reject' ? (
                <ThumbsDown size={18} className="text-red-500" />
              ) : (
                <CheckCircle2 size={18} className="text-green-700" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="font-bold text-gray-900 text-sm truncate">{item.product}</p>
                {item.completedAt && item.result && (
                  <span
                    className={`shrink-0 px-1.5 py-0.5 rounded-md text-[14px] font-bold ${
                      item.result === 'reject'
                        ? 'bg-red-100 text-red-600'
                        : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {item.result === 'reject' ? `불합격 · ${item.disposition}` : '합격'}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                {item.code} · {item.qty}개 · {item.team}
                {item.completedAt && <span className="text-green-700"> · {item.completedAt}</span>}
              </p>
              {item.completedAt && item.result === 'reject' && item.reasonType && (
                <p className="text-xs text-red-500 mt-1 truncate">
                  [{item.reasonType}] {item.reason}
                </p>
              )}
              {item.completedAt && item.result === 'pass' && item.reason && (
                <p className="text-xs text-gray-500 mt-1 truncate">💬 {item.reason}</p>
              )}
            </div>

            {!item.completedAt ? (
              <button
                onClick={() => openInspect(item)}
                className="shrink-0 px-4 py-2.5 border border-green-900 text-green-900 text-xs font-bold rounded-xl bg-white active:bg-green-50"
              >
                검수
              </button>
            ) : (
              <button
                onClick={() => cancelDone(item.id)}
                className="shrink-0 flex items-center gap-1 px-4 py-2.5 border border-gray-200 text-gray-500 text-xs font-bold rounded-xl active:bg-gray-50"
              >
                <RotateCcw size={12} />
                취소
              </button>
            )}
          </div>
        ))}
      </div>

      {/* 토스트 */}
      {toast && (
        <div className="absolute bottom-24 left-4 right-4 bg-gray-800 text-white text-sm font-medium text-center py-3 rounded-2xl z-[110]">
          {toast}
        </div>
      )}

      {/* 검수 분기 오버레이 */}
      {inspecting && (
        <div className="absolute inset-0 z-[100] bg-gray-50 flex flex-col">
          {/* 헤더 */}
          <div className="bg-white border-b border-gray-100 flex items-center px-3 shrink-0" style={{ height: '52px' }}>
            <button
              onClick={closeInspect}
              className="p-1 -ml-1 text-gray-800"
            >
              <ChevronLeft size={24} strokeWidth={2} />
            </button>
            <div className="flex-1 text-center">
              <p className="text-[21px] font-bold text-gray-900">{inspecting.product}</p>
              <p className="text-[16px] text-gray-400">
                {inspecting.code} · {inspecting.qty}개 · {inspecting.team}
              </p>
            </div>
            <div className="w-8" />
          </div>

          {/* 한 페이지: 검수 결과 + 사유를 함께 입력 */}
          <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5">
            {/* 검수 결과 선택 */}
            <div>
              <p className="text-sm font-bold text-gray-900 mb-2">
                검수 결과 <span className="text-red-500 text-xs">*필수</span>
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setResult('pass')}
                  className={`flex flex-col items-center justify-center gap-2 py-6 rounded-2xl border-2 transition-colors ${
                    result === 'pass'
                      ? 'bg-green-50 border-green-800 text-green-900'
                      : 'bg-white border-gray-200 text-gray-400'
                  }`}
                >
                  <ThumbsUp size={30} />
                  <span className="text-base font-bold">합격</span>
                </button>
                <button
                  onClick={() => setResult('reject')}
                  className={`flex flex-col items-center justify-center gap-2 py-6 rounded-2xl border-2 transition-colors ${
                    result === 'reject'
                      ? 'bg-red-50 border-red-400 text-red-600'
                      : 'bg-white border-gray-200 text-gray-400'
                  }`}
                >
                  <ThumbsDown size={30} />
                  <span className="text-base font-bold">불합격</span>
                </button>
              </div>
            </div>

            {/* 합격 사유(의견) */}
            {result === 'pass' && (
              <div>
                <p className="text-sm font-bold text-gray-900 mb-2">
                  의견 <span className="text-gray-400 font-normal text-xs">(선택)</span>
                </p>
                <textarea
                  value={passNote}
                  onChange={(e) => setPassNote(e.target.value)}
                  placeholder="의견을 자유롭게 기록하세요"
                  rows={4}
                  className="textarea-ds"
                />
              </div>
            )}

            {/* 불합격 사유 */}
            {result === 'reject' && (
              <>
                {/* 처리 구분 (필수) — 재조리 / 폐기 */}
                <div>
                  <p className="text-sm font-bold text-gray-900 mb-2">
                    처리 구분 <span className="text-red-500 text-xs">*필수</span>
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {REJECT_DISPOSITIONS.map((d) => (
                      <button
                        key={d.key}
                        onClick={() => {
                          setDisposition(d.key)
                          setRejectType(null)
                          setRejectText('')
                        }}
                        className={`py-4 rounded-2xl border-2 text-base font-bold transition-colors ${
                          disposition === d.key
                            ? d.key === '폐기'
                              ? 'bg-red-50 border-red-400 text-red-600'
                              : 'bg-orange-50 border-orange-400 text-orange-600'
                            : 'bg-white border-gray-200 text-gray-400'
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 사유 유형 (필수) — 처리 구분 선택 후 노출 */}
                {dispositionGroup && (
                  <div>
                    <p className="text-sm font-bold text-gray-900 mb-2">
                      사유 유형 <span className="text-red-500 text-xs">*필수</span>
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {dispositionGroup.reasons.map((r) => (
                        <button
                          key={r.type}
                          onClick={() => setRejectType(r.type)}
                          className={`flex flex-col items-start gap-0.5 px-3.5 py-3 rounded-xl border text-left transition-colors ${
                            rejectType === r.type
                              ? 'bg-green-900 border-green-900 text-white'
                              : 'bg-white border-gray-200 text-gray-600 active:bg-gray-50'
                          }`}
                        >
                          <span className="text-sm font-bold">{r.type}</span>
                          <span className={`text-[16px] leading-tight ${rejectType === r.type ? 'text-green-100' : 'text-gray-400'}`}>
                            {r.desc}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 상세 사유 — "기타"는 필수, 그 외 선택 */}
                {rejectType && (
                  <div>
                    <p className="text-sm font-bold text-gray-900 mb-2">
                      상세 사유{' '}
                      {selectedReason?.requireText ? (
                        <span className="text-red-500 text-xs">*필수</span>
                      ) : (
                        <span className="text-gray-400 font-normal text-xs">(선택)</span>
                      )}
                    </p>
                    <textarea
                      value={rejectText}
                      onChange={(e) => setRejectText(e.target.value)}
                      placeholder={selectedReason?.requireText ? '기타 사유를 서술하세요' : '불합격 사유를 입력하세요'}
                      rows={3}
                      className="textarea-ds"
                    />
                  </div>
                )}

                {/* 사진 등록 (선택) */}
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <Camera size={16} className="text-green-900" />
                      <span className="text-sm font-bold text-gray-900">
                        사진 등록 <span className="text-gray-400 font-normal text-xs">(선택)</span>
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">{rejectPhotos.length}/{MAX_PHOTOS}</span>
                  </div>
                  <div className="p-3 space-y-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openCamera(addRejectPhoto)}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-600 text-sm font-bold active:bg-gray-100"
                      >
                        <Camera size={16} className="text-green-900" />카메라
                      </button>
                      <button
                        onClick={() => openGallery(addRejectPhoto)}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-600 text-sm font-bold active:bg-gray-100"
                      >
                        <ImagePlus size={16} className="text-green-900" />갤러리
                      </button>
                    </div>
                    {rejectPhotos.length > 0 && (
                      <div className="grid grid-cols-4 gap-1.5">
                        {rejectPhotos.map((src, i) => (
                          <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                            <button onClick={() => setPreviewSrc(src)} className="w-full h-full">
                              <img src={src} alt={`사진 ${i + 1}`} className="w-full h-full object-cover" />
                            </button>
                            <button
                              onClick={() => setRejectPhotos((prev) => removePhotoUtil(prev, i))}
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

              </>
            )}
          </div>

          {/* 하단 검수완료 (크게) */}
          <div className="shrink-0 px-4 pt-3 pb-6 bg-white border-t border-gray-100">
            <button
              onClick={submitInspect}
              disabled={result === 'reject' && !rejectValid}
              className={`w-full py-5 font-bold rounded-2xl text-lg transition-colors ${
                result === 'reject'
                  ? rejectValid
                    ? 'bg-red-600 text-white active:bg-red-700'
                    : 'bg-gray-100 text-gray-400'
                  : 'bg-green-900 text-white active:bg-green-800'
              }`}
            >
              검수완료
            </button>
          </div>

          {/* 이미지 프리뷰 */}
          {previewSrc && (
            <div className="absolute inset-0 z-[120] bg-black flex items-center justify-center">
              <button
                onClick={() => setPreviewSrc(null)}
                className="absolute top-4 right-4 bg-black/60 text-white rounded-full p-2 z-10"
              >
                <X size={22} />
              </button>
              <img src={previewSrc} alt="미리보기" className="w-full h-full object-contain" />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
