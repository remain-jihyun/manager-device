import { useState } from 'react'
import { HACCP_SHEETS, HACCP_ITEMS, type HaccpSheetKey, type HaccpCheckItem } from '@/constants/haccpChecklists'
import OXToggle from './OXToggle'

const nl = (s: string) => s.replace(/\n/g, ' ')

// HACCP 점검표 3종(청소/도구/부대시설)을 현장 점검 페이지에서 O/X 로 점검.
// 항목 정의는 mes-v2 "현장 점검 항목 관리"와 1:1 동일(HACCP_ITEMS).
export default function HaccpChecklists() {
  const [sheet, setSheet] = useState<HaccpSheetKey>('cleaning')
  const [values, setValues] = useState<Record<string, 'O' | 'X' | null>>({})

  const meta = HACCP_SHEETS.find((s) => s.key === sheet)!
  const items = HACCP_ITEMS.filter((i) => i.sheet === sheet)
  const set = (id: string, v: 'O' | 'X') => setValues((p) => ({ ...p, [id]: v }))

  // 구역/대상(또는 도구)별 그룹핑 — 원본 순서 유지
  const groupKeys: string[] = []
  const grouped: Record<string, HaccpCheckItem[]> = {}
  for (const it of items) {
    const k = sheet === 'tools' ? (it.tool ?? '') : it.zone
    if (!grouped[k]) { grouped[k] = []; groupKeys.push(k) }
    grouped[k].push(it)
  }
  const done = items.filter((i) => values[i.id]).length

  return (
    <div className="screen-x py-3 space-y-3">
      {/* 점검표 탭 */}
      <div className="flex gap-1.5">
        {HACCP_SHEETS.map((s) => {
          const on = s.key === sheet
          const label = s.title.replace('작업장 ', '').replace(' 점검표', '')
          return (
            // 스타일 원본: Figma "[AI] 집반찬연구소 리뉴얼" day 칩 (node 1:5301)
            //   선택   = green-100 배경 · green-800 테두리/글자
            //   미선택 = white 배경 · gray-250 테두리 · gray-700 글자
            //   공통   = radius 8px · 14px Bold · drop-shadow 0 4px 17px rgba(0,0,0,.05)
            <button
              key={s.key}
              onClick={() => setSheet(s.key)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold border transition-colors shadow-[0_4px_17px_rgba(0,0,0,0.05)] ${
                on ? 'bg-green-100 text-green-800 border-green-800' : 'bg-white text-gray-700 border-gray-250'
              }`}
            >
              {label}
              <span className={`ml-1 ${on ? 'text-green-800/50' : 'text-gray-450'}`}>{HACCP_ITEMS.filter((i) => i.sheet === s.key).length}</span>
            </button>
          )
        })}
      </div>

      {/* 메타 — 현장에서 멀리서도 읽히도록 제목 16px, 보조문구 13px */}
      <div className="bg-white rounded-2xl border border-gray-200 p-3.5 space-y-1">
        <div className="flex items-center gap-2">
          <p className="text-base font-bold text-gray-900">{meta.title}</p>
          <span className="text-[17px] text-gray-400">{meta.code}</span>
        </div>
        <p className="text-[17px] text-gray-500">모니터링: {meta.method} · 주기: {meta.cycle}</p>
        <p className="text-[17px] text-gray-400 leading-snug">{meta.note}</p>
      </div>

      <div className="flex items-center justify-between px-1">
        <p className="text-xs font-bold text-gray-400">{meta.axisLabels.join(' › ')}</p>
        <p className="text-xs font-bold text-gray-500">{done}/{items.length} 완료</p>
      </div>

      {/* 구역/도구별 항목 */}
      <div className="space-y-3">
        {groupKeys.map((k) => (
          <div key={k} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
              <p className="text-[17px] font-bold text-gray-800">{nl(k) || '(미지정)'}</p>
              <span className="text-[16px] text-gray-400">{grouped[k].length}</span>
            </div>
            <div className="divide-y divide-gray-100">
              {grouped[k].map((it) => (
                <div key={it.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    {sheet === 'facility' && it.group && (
                      <p className="text-[16px] font-medium text-green-800">{nl(it.group)}</p>
                    )}
                    <p className="text-sm text-gray-800 leading-snug">
                      {sheet === 'tools' ? `${nl(it.tool ?? '')} — ${nl(it.zone)}` : it.label}
                    </p>
                  </div>
                  <OXToggle value={values[it.id] ?? null} onChange={(v) => set(it.id, v)} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
