import { Camera, X } from 'lucide-react'
import { openCamera, openGallery, MAX_PHOTOS } from '@/utils/photoUtils'

// 점검 항목별 사진 첨부 입력 (inputType: 'photo')
// 값은 dataURL 문자열 배열. 카메라/갤러리로 추가하고 개별 삭제한다.
interface PhotoInputProps {
  value: string[]
  onChange: (photos: string[]) => void
}

export default function PhotoInput({ value, onChange }: PhotoInputProps) {
  const photos = value ?? []
  const add = (url: string) => {
    if (photos.length >= MAX_PHOTOS) return
    onChange([...photos, url])
  }
  const remove = (i: number) => onChange(photos.filter((_, idx) => idx !== i))

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex gap-1.5">
        <button
          onClick={() => openCamera(add)}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-green-900 text-white text-xs font-bold active:bg-green-800"
        >
          <Camera size={13} /> 촬영
        </button>
        <button
          onClick={() => openGallery(add)}
          className="px-2.5 py-1.5 rounded-xl border border-gray-200 text-gray-500 text-xs font-bold active:bg-gray-50"
        >
          갤러리
        </button>
      </div>
      {photos.length > 0 && (
        <div className="flex gap-1 flex-wrap justify-end max-w-[180px]">
          {photos.map((src, i) => (
            <div key={i} className="relative w-11 h-11 rounded-lg overflow-hidden border border-gray-200">
              <img src={src} alt={`사진 ${i + 1}`} className="w-full h-full object-cover" />
              <button
                onClick={() => remove(i)}
                className="absolute top-0 right-0 bg-black/60 text-white rounded-bl-md p-0.5"
              >
                <X size={11} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
