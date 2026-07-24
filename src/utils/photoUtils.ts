export const MAX_PHOTOS = 10

export function openCamera(onPhoto: (dataUrl: string) => void): void {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.capture = 'environment'
  input.onchange = () => {
    const file = input.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') onPhoto(reader.result)
    }
    reader.readAsDataURL(file)
  }
  input.click()
}

export function openGallery(onPhoto: (dataUrl: string) => void): void {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = () => {
    const file = input.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') onPhoto(reader.result)
    }
    reader.readAsDataURL(file)
  }
  input.click()
}

export function removePhoto(photos: string[], index: number): string[] {
  return photos.filter((_, i) => i !== index)
}
