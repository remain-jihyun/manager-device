import { useState } from 'react'
import TopBar from '@/components/TopBar'
import { UserPlus, User, Trash2, Nfc, Pencil, CheckCircle2, RotateCcw, Search, AlertTriangle, X } from 'lucide-react'

interface Person {
  id: string
  name: string
  team: string
  phone: string
  nfcId: string | null
  registeredAt: string | null
}

// 모의 인원 명부 (동명이인 포함). 일부는 이미 NFC 키값 보유(분실 재태깅 케이스 검증용).
const ROSTER: Person[] = [
  { id: 'M01', name: '김영수', team: '자재반', phone: '010-1234-5678', nfcId: 'NFC-7F3A21', registeredAt: '2026-05-12' },
  { id: 'M02', name: '이철호', team: '자재반', phone: '010-2345-6789', nfcId: null, registeredAt: null },
  { id: 'M03', name: '박민준', team: '자재반', phone: '010-3456-7890', nfcId: null, registeredAt: null },
  { id: 'M04', name: '정수진', team: '전처리반', phone: '010-5678-9012', nfcId: 'NFC-90B4C2', registeredAt: '2026-05-20' },
  { id: 'M05', name: '한동훈', team: '전처리반', phone: '010-6789-0123', nfcId: null, registeredAt: null },
  { id: 'M06', name: '박민준', team: '전처리반', phone: '010-7890-1234', nfcId: null, registeredAt: null }, // 동명이인
  { id: 'M07', name: '윤성민', team: '전처리반', phone: '010-8901-2345', nfcId: null, registeredAt: null },
  { id: 'M08', name: '강태준', team: '조리반', phone: '010-9012-3456', nfcId: 'NFC-12D8E0', registeredAt: '2026-06-01' },
  { id: 'M09', name: '임현우', team: '조리반', phone: '010-0123-4567', nfcId: null, registeredAt: null },
  { id: 'M10', name: '김영수', team: '조리반', phone: '010-1122-3344', nfcId: null, registeredAt: null }, // 동명이인
  { id: 'M11', name: '신지원', team: '조리반', phone: '010-2233-4455', nfcId: null, registeredAt: null },
  { id: 'M12', name: '유재원', team: '소스반', phone: '010-3344-5566', nfcId: null, registeredAt: null },
  { id: 'M13', name: '문상훈', team: '소스반', phone: '010-4455-6677', nfcId: 'NFC-44C9A8', registeredAt: '2026-06-10' },
  { id: 'M14', name: '노민지', team: '소스반', phone: '010-5566-7788', nfcId: null, registeredAt: null },
  { id: 'M15', name: '배성호', team: '외포장반', phone: '010-6677-8899', nfcId: null, registeredAt: null },
  { id: 'M16', name: '권미나', team: '외포장반', phone: '010-7788-9900', nfcId: null, registeredAt: null },
  { id: 'M17', name: '오현진', team: '외포장반', phone: '010-8899-0011', nfcId: null, registeredAt: null },
  { id: 'M18', name: '서동욱', team: '외포장반', phone: '010-9900-1122', nfcId: null, registeredAt: null },
  { id: 'M19', name: '고나은', team: '내포장반', phone: '010-1111-2222', nfcId: null, registeredAt: null },
  { id: 'M20', name: '백승호', team: '내포장반', phone: '010-2222-3333', nfcId: 'NFC-6B1F09', registeredAt: '2026-06-15' },
  { id: 'M21', name: '장혜린', team: '내포장반', phone: '010-3333-4444', nfcId: null, registeredAt: null },
]

// 개인정보(GDPR) 보호 — 가운데 자리 마스킹: 010-1234-5678 -> 010-****-5678
const maskPhone = (phone: string) => {
  const parts = phone.split('-')
  if (parts.length === 3) return `${parts[0]}-****-${parts[2]}`
  return phone
}

const randomNfcId = () => `NFC-${Math.random().toString(16).slice(2, 8).toUpperCase()}`

export default function RegisterPage() {
  const [roster, setRoster] = useState<Person[]>(ROSTER)
  const [showForm, setShowForm] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [nfcId, setNfcId] = useState('')
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [sortOrder, setSortOrder] = useState<'최신순' | '가나다순'>('최신순')
  const [confirm, setConfirm] = useState<{ person: Person; oldNfc: string } | null>(null)
  const [toast, setToast] = useState('')

  const handleScan = () => {
    setScanning(true)
    setTimeout(() => {
      setNfcId(randomNfcId())
      setScanning(false)
    }, 1200)
  }

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  const selectedPerson = roster.find((p) => p.id === selectedId) ?? null

  // 검색 결과 (이름 부분 일치). 검색어 없으면 결과 미표시.
  const results = query.trim()
    ? roster
        .filter((p) => p.name.includes(query.trim()))
        .sort((a, b) => a.name.localeCompare(b.name, 'ko'))
    : []

  // 등록 완료된(=NFC 키 보유) 인원만 하단 목록에 노출
  const registered = roster.filter((p) => p.nfcId)
  const sortedRegistered = sortOrder === '가나다순'
    ? [...registered].sort((a, b) => a.name.localeCompare(b.name, 'ko'))
    : [...registered].sort((a, b) => (b.registeredAt ?? '').localeCompare(a.registeredAt ?? ''))

  const applyNfc = (personId: string, name: string, isChange: boolean) => {
    setRoster((prev) => prev.map((p) =>
      p.id === personId
        ? { ...p, nfcId, registeredAt: new Date().toLocaleDateString('ko-KR') }
        : p
    ))
    showToast(isChange ? `${name}님의 NFC를 변경했습니다` : `${name}님을 등록했습니다`)
    resetForm()
  }

  const handleRegister = () => {
    if (!nfcId || !selectedPerson) return
    // 수정 케이스: 이미 다른 NFC 키값 보유 → 재확인 1회
    if (selectedPerson.nfcId && selectedPerson.nfcId !== nfcId) {
      setConfirm({ person: selectedPerson, oldNfc: selectedPerson.nfcId })
      return
    }
    // 신규 케이스: 바로 등록
    applyNfc(selectedPerson.id, selectedPerson.name, false)
  }

  // 사람 선택 → 기존 NFC가 있으면 프리필(수정/불량 재태깅 가능), 없으면 신규 태깅
  const selectPerson = (p: Person) => {
    setSelectedId(p.id)
    setNfcId(p.nfcId ?? '')
    setQuery('')
  }

  const handleEdit = (p: Person) => {
    setSelectedId(p.id)
    setQuery('')
    setNfcId(p.nfcId ?? '')
    setShowForm(true)
  }

  const handleUnregister = (id: string) => {
    setRoster((prev) => prev.map((p) =>
      p.id === id ? { ...p, nfcId: null, registeredAt: null } : p
    ))
  }

  const resetForm = () => {
    setNfcId('')
    setQuery('')
    setSelectedId(null)
    setShowForm(false)
  }

  return (
    <div className="relative flex flex-col bg-gray-50 min-h-full">
      <TopBar title="인원 등록" showBack backTo="/menu" />

      {toast && (
        <div className="absolute top-16 left-4 right-4 z-50 bg-green-900 text-white text-sm font-bold px-4 py-3 rounded-2xl shadow-lg flex items-center gap-2">
          <CheckCircle2 size={18} /> {toast}
        </div>
      )}

      <div className="px-4 py-4 space-y-3">
        {!showForm ? (
          <>
            <button
              onClick={() => setShowForm(true)}
              className="w-full flex items-center justify-center gap-2 bg-green-900 text-white font-bold py-4 rounded-2xl text-[19px] active:bg-green-800"
            >
              <UserPlus size={20} />
              인원 등록
            </button>

            {registered.length === 0 && (
              <p className="text-center text-gray-400 text-sm mt-10">등록된 인원이 없습니다</p>
            )}

            {registered.length > 0 && (
              <div className="flex justify-end gap-1">
                {(['최신순', '가나다순'] as const).map((o) => (
                  <button
                    key={o}
                    onClick={() => setSortOrder(o)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                      sortOrder === o ? 'bg-green-900 text-white border-green-900' : 'bg-white text-gray-400 border-gray-200'
                    }`}
                  >
                    {o}
                  </button>
                ))}
              </div>
            )}

            {sortedRegistered.map((p) => (
              <div key={p.id} className="bg-white rounded-2xl p-4 border border-gray-200 flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center shrink-0">
                  <User size={20} className="text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900">{p.name} <span className="text-xs font-normal text-gray-400">{p.team}</span></p>
                  <p className="text-xs text-gray-400 mt-0.5">{p.nfcId} · {maskPhone(p.phone)}</p>
                </div>
                <button onClick={() => handleEdit(p)} className="text-gray-300 p-1 active:text-green-700">
                  <Pencil size={16} />
                </button>
                <button onClick={() => handleUnregister(p.id)} className="text-gray-300 p-1 active:text-red-400">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </>
        ) : (
          <div className="space-y-5">
            {/* ① 사람 검색·선택 */}
            <div>
              <p className="text-sm font-bold text-gray-900 mb-2">
                사람 선택 <span className="text-red-500">*</span>
              </p>

              {selectedPerson ? (
                // 선택된 사람 카드 (이름 + 부서 + 마스킹 전화번호)
                <div className={`rounded-2xl p-4 border-2 ${selectedPerson.nfcId ? 'border-amber-400 bg-amber-50' : 'border-green-800 bg-green-50'}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shrink-0">
                      <User size={20} className="text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900">{selectedPerson.name} <span className="text-xs font-normal text-gray-500">{selectedPerson.team}</span></p>
                      <p className="text-xs text-gray-500 mt-0.5">{maskPhone(selectedPerson.phone)}</p>
                      {selectedPerson.nfcId && (
                        <p className="text-xs font-bold text-amber-600 mt-1">기존 NFC: {selectedPerson.nfcId}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedId(null)}
                      className="text-gray-400 p-1 active:text-gray-600 shrink-0"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="이름으로 검색"
                      className="input-ds-search"
                    />
                  </div>

                  <div className="mt-2 space-y-2">
                    {query.trim() && results.length === 0 && (
                      <p className="text-center text-gray-400 text-sm py-4">검색 결과가 없습니다</p>
                    )}
                    {results.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => selectPerson(p)}
                        className="w-full text-left bg-white rounded-2xl p-3 border border-gray-200 flex items-center gap-3 active:bg-gray-50"
                      >
                        <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center shrink-0">
                          <User size={18} className="text-gray-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-900 text-sm">
                            {p.name} <span className="text-xs font-normal text-gray-400">{p.team}</span>
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">{maskPhone(p.phone)}</p>
                        </div>
                        {p.nfcId && (
                          <span className="text-[16px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg shrink-0">등록됨</span>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* ② NFC 태그 — 사람 선택 후 진행 */}
            <div>
              <p className="text-sm font-bold text-gray-900 mb-2">
                NFC 태그 <span className="text-red-500">*</span>
                {selectedPerson?.nfcId && (
                  <span className="ml-2 text-xs font-normal text-amber-600">기존 NFC 있음 · 불량 시 다시 태그</span>
                )}
              </p>

              {!selectedPerson ? (
                <div className="w-full flex flex-col items-center justify-center gap-2 py-8 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50">
                  <Nfc size={32} className="text-gray-300" />
                  <span className="text-sm font-bold text-gray-400">사람을 먼저 선택하세요</span>
                </div>
              ) : !nfcId ? (
                <button
                  type="button"
                  onClick={handleScan}
                  disabled={scanning}
                  className={`w-full flex flex-col items-center justify-center gap-3 py-8 rounded-2xl border-2 border-dashed transition-colors ${
                    scanning ? 'border-green-800 bg-green-50' : 'border-gray-300 bg-white active:bg-gray-50'
                  }`}
                >
                  <Nfc size={36} className={scanning ? 'text-green-800 animate-pulse' : 'text-gray-400'} />
                  <span className={`text-sm font-bold ${scanning ? 'text-green-800' : 'text-gray-500'}`}>
                    {scanning ? '태그를 읽는 중...' : 'NFC 태그를 갖다 대세요'}
                  </span>
                </button>
              ) : (
                <div className={`border-2 rounded-2xl p-4 ${
                  selectedPerson.nfcId && selectedPerson.nfcId !== nfcId
                    ? 'border-amber-400 bg-amber-50'
                    : 'border-green-800 bg-green-50'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-800 flex items-center justify-center shrink-0">
                      <CheckCircle2 size={22} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900">{nfcId}</p>
                      <p className="text-xs text-green-800 mt-0.5">
                        {selectedPerson.nfcId === nfcId
                          ? '기존 등록된 NFC'
                          : selectedPerson.nfcId
                            ? '새 태그 인식 완료 · 변경됩니다'
                            : '태그 인식 완료'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleScan}
                      className="flex items-center gap-1 text-xs font-bold text-green-800 px-2 py-1.5 rounded-lg active:bg-green-100 shrink-0"
                    >
                      <RotateCcw size={14} /> 다시 태그
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={resetForm} className="flex-1 py-4 border border-gray-200 rounded-2xl text-sm font-bold text-gray-600 bg-white">
                취소
              </button>
              <button
                onClick={handleRegister}
                disabled={!nfcId || !selectedPerson}
                className="flex-1 py-4 bg-green-900 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-2xl text-sm font-bold active:bg-green-800"
              >
                {selectedPerson?.nfcId ? '변경' : '등록'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 수정(재태깅) 재확인 팝업 — 1회 */}
      {confirm && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/50" onClick={() => setConfirm(null)} />
          <div className="relative bg-white rounded-3xl px-6 py-6 w-full max-w-sm shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle size={24} className="text-amber-500" />
            </div>
            <p className="text-base font-bold text-gray-900 text-center mb-1">NFC 변경 확인</p>
            <p className="text-sm text-gray-500 text-center mb-6">
              <span className="font-bold text-gray-700">{confirm.person.name}</span>님은 원래{' '}
              <span className="font-bold text-amber-600">{confirm.oldNfc}</span>로 등록되어 있습니다.<br />
              <span className="font-bold text-green-800">{nfcId}</span>로 변경하는 것이 맞나요?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirm(null)}
                className="flex-1 py-3.5 rounded-2xl border border-gray-200 text-sm font-bold text-gray-600 active:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={() => { applyNfc(confirm.person.id, confirm.person.name, true); setConfirm(null) }}
                className="flex-1 py-3.5 rounded-2xl bg-green-900 text-sm font-bold text-white active:bg-green-800"
              >
                변경
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
