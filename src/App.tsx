import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import AppLayout from '@/layouts/AppLayout'
import LoginPage from '@/pages/LoginPage'
import HomePage from '@/pages/HomePage'
import TeamDetailPage from '@/pages/TeamDetailPage'
import InspectionPage from '@/pages/InspectionPage'
import CCPPage from '@/pages/CCPPage'
import CCPSettingsPage from '@/pages/CCPSettingsPage'
import ClosingPage from '@/pages/ClosingPage'
import RegisterPage from '@/pages/RegisterPage'
import ChatPage from '@/pages/ChatPage'
import DisposalPage from '@/pages/DisposalPage'
import MenuPage from '@/pages/MenuPage'
import InventoryPage from '@/pages/InventoryPage'
import ReceivingPage from '@/pages/ReceivingPage'

function AuthRoute({ children }: { children: React.ReactNode }) {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  if (!isLoggedIn) return <Navigate to="/login" replace />
  return <AppLayout>{children}</AppLayout>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<AuthRoute><HomePage /></AuthRoute>} />
        <Route path="/team/:teamId" element={<AuthRoute><TeamDetailPage /></AuthRoute>} />
        <Route path="/inspection" element={<AuthRoute><InspectionPage /></AuthRoute>} />
        <Route path="/ccp" element={<AuthRoute><CCPPage /></AuthRoute>} />
        <Route path="/ccp/settings" element={<AuthRoute><CCPSettingsPage /></AuthRoute>} />
        <Route path="/closing" element={<AuthRoute><ClosingPage /></AuthRoute>} />
        <Route path="/register" element={<AuthRoute><RegisterPage /></AuthRoute>} />
        <Route path="/chat" element={<AuthRoute><ChatPage /></AuthRoute>} />
        <Route path="/disposal" element={<AuthRoute><DisposalPage /></AuthRoute>} />
        <Route path="/inventory" element={<AuthRoute><InventoryPage /></AuthRoute>} />
        <Route path="/receiving" element={<AuthRoute><ReceivingPage /></AuthRoute>} />
        <Route path="/menu" element={<AuthRoute><MenuPage /></AuthRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
