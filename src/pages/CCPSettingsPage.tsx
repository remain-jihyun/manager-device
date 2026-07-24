import TopBar from '@/components/TopBar'
import { ExternalLink, Settings } from 'lucide-react'

export default function CCPSettingsPage() {
  return (
    <div className="flex flex-col">
      <TopBar title="CCP 설정" showBack />
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6 text-center">
        <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center">
          <Settings size={32} className="text-green-500" />
        </div>
        <div>
          <p className="font-semibold text-gray-800 mb-1">CCP 설정은 MES v2에서 관리합니다</p>
          <p className="text-sm text-gray-400">시스템 관리 → CCP 설정에서<br />유형 및 점검 스케줄을 설정하세요</p>
        </div>
        <a
          href="http://localhost:3000/system/ccp"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-2xl font-semibold text-sm active:bg-green-700"
        >
          <ExternalLink size={18} />
          MES v2 CCP 설정 열기
        </a>
      </div>
    </div>
  )
}
