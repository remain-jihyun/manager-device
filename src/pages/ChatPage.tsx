import { useState } from 'react'
import { ExternalLink, MessageCircle } from 'lucide-react'

export default function ChatPage() {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-5 px-6 text-center">
        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center">
          <MessageCircle size={32} className="text-blue-500" />
        </div>
        <div>
          <p className="font-semibold text-gray-800 mb-1">Google Chat</p>
          <p className="text-sm text-gray-400">보안 정책으로 인해 앱 내 표시가 제한됩니다</p>
        </div>
        <a
          href="https://chat.google.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-semibold text-sm active:bg-blue-700"
        >
          <ExternalLink size={18} />
          Google Chat 열기
        </a>
      </div>
    )
  }

  return (
    <iframe
      src="https://chat.google.com"
      className="w-full h-full border-none"
      title="Google Chat"
      allow="camera; microphone; notifications"
      onError={() => setFailed(true)}
    />
  )
}
