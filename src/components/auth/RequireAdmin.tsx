import type { ReactNode } from 'react'
import { useAuth } from '../../hooks/useAuth'
import AdminLoginPage from '../../pages/AdminLoginPage'

export default function RequireAdmin({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading, error, refreshSession } = useAuth()
  if (loading) return <main className="page"><p role="status" className="hint">กำลังตรวจสอบการเข้าสู่ระบบ…</p></main>
  if (error) return <main className="page"><p role="alert" className="login-error">{error}</p><button className="secondary" onClick={() => void refreshSession()}>ลองอีกครั้ง</button></main>
  return isAuthenticated ? children : <AdminLoginPage />
}