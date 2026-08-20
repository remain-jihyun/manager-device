// 프로필 사진 원형 아바타
//
// `src` 가 있으면 사진을 그리고, 없거나 로드에 실패하면 이름 첫 글자로 폴백한다.
// 사진이 깨졌을 때 빈 원이 남으면 "로그인이 안 됐나" 로 오해할 수 있어서,
// 폴백은 반드시 사람을 식별할 수 있는 글자를 보여준다.

import { useState } from 'react'

interface Props {
  name: string
  src?: string | undefined
  /** 지름(px) */
  size?: number
  /** 헤더(짙은 배경) 위인지. 폴백 원의 명암을 뒤집는다. */
  onDark?: boolean
  className?: string
}

export default function Avatar({ name, src, size = 56, onDark = false, className = '' }: Props) {
  const [broken, setBroken] = useState(false)
  const initial = name?.trim().charAt(0) || '?'
  const box = { width: size, height: size }

  if (src && !broken) {
    return (
      <img
        src={src}
        alt={`${name} 프로필 사진`}
        style={box}
        onError={() => setBroken(true)}
        className={`rounded-full object-cover shrink-0 ${onDark ? 'ring-2 ring-white/25' : 'ring-1 ring-gray-200'} ${className}`}
      />
    )
  }

  return (
    <div
      style={box}
      aria-hidden
      className={`rounded-full shrink-0 flex items-center justify-center font-bold ${
        onDark ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
      } ${className}`}
    >
      <span style={{ fontSize: Math.round(size * 0.4) }}>{initial}</span>
    </div>
  )
}
